import oracledb from 'oracledb';
import { fetchServiceList } from '../src/services/gov24';
import { normalizeGov24, NormalizedPolicy } from '../src/utils/normalize';
import { initPool, getConnection, closePool } from '../src/db';

async function upsertPolicy(conn: oracledb.Connection, p: NormalizedPolicy) {
  const sql = `
    MERGE INTO POLICY_MASTER t
    USING (SELECT :id AS ID FROM DUAL) s
    ON (t.ID = s.ID)
    WHEN MATCHED THEN UPDATE SET
      TITLE = :title,
      ORG = :org,
      DESCRIPTION = :description,
      CATEGORY = :category,
      LIFECYCLE = :lifecycle,
      TARGET_TEXT = :targetText,
      TARGET_AGE_MIN = :targetAgeMin,
      TARGET_AGE_MAX = :targetAgeMax,
      APPLY_END = :applyEnd,
      APPLY_URL = :applyUrl,
      TAGS = :tags,
      LAST_SYNC = SYSDATE,
      UPDATED_AT = SYSDATE
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
    id: p.id,
    tenantId: p.tenantId,
    source: p.source,
    sourceId: p.sourceId,
    category: p.category,
    lifecycle: p.lifecycle,
    title: p.title,
    org: p.org,
    description: p.description,
    targetText: p.targetText,
    targetAgeMin: p.targetAgeMin,
    targetAgeMax: p.targetAgeMax,
    region: p.region,
    applyEnd: p.applyEnd,
    applyUrl: p.applyUrl,
    tags: p.tags,
    status: p.status,
  });
}

async function syncAll() {
  console.log('정책 동기화 시작...\n');
  await initPool();
  const conn = await getConnection();

  const PER_PAGE = 100;
  let page = 1;
  let totalInserted = 0;
  let totalErrors = 0;

  try {
    while (true) {
      console.log(`페이지 ${page} 가져오는 중...`);
      const result = await fetchServiceList(page, PER_PAGE);

      if (!result.data || result.data.length === 0) break;

      for (const item of result.data) {
        try {
          const normalized = normalizeGov24(item);
          await upsertPolicy(conn, normalized);
          totalInserted++;
        } catch (err: any) {
          totalErrors++;
          if (totalErrors < 5) {
            console.error(`  ⚠️  적재 실패: ${item.서비스명} - ${err.message}`);
          }
        }
      }

      await conn.commit();
      console.log(`  → ${result.data.length}건 처리 (누적: ${totalInserted})`);

      if (result.data.length < PER_PAGE) break;

      await new Promise(r => setTimeout(r, 200));

      page++;

      if (page > 20) {
        console.log('\n⚠️  20페이지 도달, 일단 중단 (총 2,000건). 전수 수집은 안전장치 제거 후 재실행.');
        break;
      }
    }

    console.log(`\n✅ 동기화 완료: 총 ${totalInserted}건 적재, ${totalErrors}건 실패`);
  } finally {
    await conn.close();
    await closePool();
  }
}

syncAll().catch(err => {
  console.error('동기화 실패:', err);
  process.exit(1);
});