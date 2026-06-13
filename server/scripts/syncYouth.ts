import oracledb from 'oracledb';
import { fetchYouthList } from '../src/services/youth';
import { normalizeYouth, NormalizedPolicy } from '../src/utils/normalize';
import { initPool, getConnection, closePool } from '../src/db';

async function upsertPolicy(conn: oracledb.Connection, p: NormalizedPolicy) {
  const sql = `
    MERGE INTO POLICY_MASTER t
    USING (SELECT :id AS ID FROM DUAL) s
    ON (t.ID = s.ID)
    WHEN MATCHED THEN UPDATE SET
      TITLE = :title, ORG = :org,
      DESCRIPTION = :description, CATEGORY = :category, LIFECYCLE = :lifecycle,
      TARGET_TEXT = :targetText, TARGET_AGE_MIN = :targetAgeMin, TARGET_AGE_MAX = :targetAgeMax,
      REGION = :region, APPLY_END = :applyEnd, APPLY_URL = :applyUrl,
      TAGS = :tags, LAST_SYNC = SYSDATE, UPDATED_AT = SYSDATE
    WHEN NOT MATCHED THEN INSERT
      (ID, TENANT_ID, SOURCE, SOURCE_ID, CATEGORY, LIFECYCLE, TITLE, ORG,
       DESCRIPTION, TARGET_TEXT, TARGET_AGE_MIN, TARGET_AGE_MAX,
       REGION, APPLY_END, APPLY_URL, TAGS, STATUS, LAST_SYNC, CREATED_AT)
    VALUES
      (:id, :tenantId, :source, :sourceId, :category, :lifecycle, :title, :org,
       :description, :targetText, :targetAgeMin, :targetAgeMax,
       :region, :applyEnd, :applyUrl, :tags, :status, SYSDATE, SYSDATE)
  `;

  await conn.execute(sql, {
    id: p.id, tenantId: p.tenantId, source: p.source, sourceId: p.sourceId,
    category: p.category, lifecycle: p.lifecycle,
    title: p.title, org: p.org,
    description: p.description, targetText: p.targetText,
    targetAgeMin: p.targetAgeMin, targetAgeMax: p.targetAgeMax,
    region: p.region, applyEnd: p.applyEnd, applyUrl: p.applyUrl,
    tags: p.tags, status: p.status,
  });
}

// 재시도 로직
async function fetchWithRetry(pageNum: number, pageSize: number, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchYouthList(pageNum, pageSize);

      // 응답이 정상 JSON인지 확인
      if (result?.result?.youthPolicyList !== undefined) {
        return result;
      }

      console.log(`  ⚠️ 페이지 ${pageNum} 응답 형식 이상 (시도 ${attempt}/${maxRetries})`);
    } catch (err: any) {
      const status = err.response?.status;
      console.log(`  ⚠️ 페이지 ${pageNum} 실패 (시도 ${attempt}/${maxRetries}) - status: ${status || err.code}`);

      if (attempt === maxRetries) {
        throw err;
      }

      // 점진적 백오프: 2초, 5초, 10초
      const waitMs = attempt === 1 ? 2000 : attempt === 2 ? 5000 : 10000;
      console.log(`  ⏸ ${waitMs / 1000}초 대기 후 재시도...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw new Error('재시도 횟수 초과');
}

async function syncAll() {
  console.log('온통청년 동기화 시작...\n');
  await initPool();
  const conn = await getConnection();

  const PAGE_SIZE = 50;  // 100 → 50 (서버 부담 감소)
  let pageNum = 1;
  let totalInserted = 0;
  let totalErrors = 0;
  let totalCount = 0;
  let failedPages: number[] = [];

  try {
    while (true) {
      try {
        const result = await fetchWithRetry(pageNum, PAGE_SIZE);

        const policies = result?.result?.youthPolicyList || [];
        totalCount = result?.result?.pagging?.totCount || 0;

        if (policies.length === 0) {
          console.log(`페이지 ${pageNum}: 더 이상 데이터 없음`);
          break;
        }

        for (const item of policies) {
          try {
            const normalized = normalizeYouth(item);
            await upsertPolicy(conn, normalized);
            totalInserted++;
          } catch (err: any) {
            totalErrors++;
            if (totalErrors < 5) {
              console.error(`  ⚠️  적재 실패: ${item.plcyNm?.substring(0, 30)} - ${err.message}`);
            }
          }
        }

        await conn.commit();
        console.log(`페이지 ${pageNum}: ${policies.length}건 처리 (누적: ${totalInserted}/${totalCount})`);

        if (policies.length < PAGE_SIZE) {
          console.log('마지막 페이지 도달');
          break;
        }
        if (totalInserted >= totalCount) break;

      } catch (err: any) {
        // 3회 재시도 실패 — 해당 페이지 스킵하고 다음으로
        console.log(`  ❌ 페이지 ${pageNum} 최종 실패, 스킵`);
        failedPages.push(pageNum);
      }

      pageNum++;
      await new Promise(r => setTimeout(r, 500));  // 페이지 간 0.5초

      // 안전장치: 최대 60페이지 (50건 × 60 = 3,000건)
      if (pageNum > 60) {
        console.log('\n⚠️  60페이지 도달, 일단 중단');
        break;
      }
    }

    console.log(`\n✅ 동기화 완료: ${totalInserted}건 적재, ${totalErrors}건 실패`);
    if (failedPages.length > 0) {
      console.log(`⚠️ 스킵된 페이지: ${failedPages.join(', ')}`);
      console.log(`   (이 페이지들은 나중에 다시 syncYouth 실행하면 적재됩니다)`);
    }
  } finally {
    await conn.close();
    await closePool();
  }
}

syncAll().catch(err => {
  console.error('동기화 실패:', err.message);
  process.exit(1);
});