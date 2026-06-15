import oracledb from 'oracledb';
import {
  fetchDualTrainingCourses,
  fetchEmployerTrainingCourses
} from '../src/services/work24';
import {
  normalizeDualTraining,
  normalizeEmployerTraining,
  NormalizedPolicy
} from '../src/utils/normalize';
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

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + m + day;
};

async function fetchWithRetry(
  fetchFn: (p: any) => Promise<any>,
  pageNum: number, pageSize: number, startDt: string, endDt: string,
  maxRetries: number = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn({
        pageNum, pageSize,
        srchTraStDt: startDt,
        srchTraEndDt: endDt,
      });
    } catch (err: any) {
      const status = err.response?.status;
      console.log(`  ⚠️ 페이지 ${pageNum} 실패 (시도 ${attempt}/${maxRetries}) - status: ${status}`);
      if (attempt === maxRetries) throw err;
      const waitMs = attempt === 1 ? 2000 : 5000;
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

interface SyncConfig {
  name: string;
  fetchFn: (p: any) => Promise<any>;
  normalizeFn: (item: any) => NormalizedPolicy;
}

async function syncOne(
  conn: oracledb.Connection,
  config: SyncConfig,
  startDt: string, endDt: string
): Promise<{ inserted: number; errors: number; failedPages: number[] }> {
  console.log(`\n========================================`);
  console.log(`📚 ${config.name} 동기화 시작`);
  console.log(`========================================`);

  const PAGE_SIZE = 50;
  const MAX_PAGES = 60;
  let pageNum = 1;
  let totalInserted = 0;
  let totalErrors = 0;
  const failedPages: number[] = [];

  while (pageNum <= MAX_PAGES) {
    try {
      const result = await fetchWithRetry(
        config.fetchFn,
        pageNum, PAGE_SIZE, startDt, endDt
      );

      let items: any[] = [];
      if (Array.isArray(result?.srchList)) {
        items = result.srchList;
      } else if (result?.HRDNet?.srchList?.scn_list) {
        items = Array.isArray(result.HRDNet.srchList.scn_list)
          ? result.HRDNet.srchList.scn_list
          : [result.HRDNet.srchList.scn_list];
      }

      if (items.length === 0) {
        console.log(`페이지 ${pageNum}: 데이터 없음, 종료`);
        break;
      }

      for (const item of items) {
        try {
          const normalized = config.normalizeFn(item);
          await upsertPolicy(conn, normalized);
          totalInserted++;
        } catch (err: any) {
          totalErrors++;
          if (totalErrors < 5) {
            console.error(`  ⚠️ 적재 실패: ${item.title?.substring(0, 30)} - ${err.message}`);
          }
        }
      }

      await conn.commit();
      console.log(`페이지 ${pageNum}: ${items.length}건 처리 (누적: ${totalInserted})`);

      if (items.length < PAGE_SIZE) {
        console.log('마지막 페이지');
        break;
      }
    } catch (err: any) {
      console.log(`  ❌ 페이지 ${pageNum} 최종 실패, 스킵`);
      failedPages.push(pageNum);
    }

    pageNum++;
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n✅ ${config.name} 완료: ${totalInserted}건, 실패 ${totalErrors}건`);
  return { inserted: totalInserted, errors: totalErrors, failedPages };
}

async function syncAll() {
  console.log('🚀 work24 추가 동기화 시작 (일학습병행 + 사업주훈련)\n');
  await initPool();
  const conn = await getConnection();

  // 향후 1개월 범위
  const today = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + 1);
  const startDt = ymd(today);
  const endDt = ymd(future);

  console.log(`훈련시작일 범위: ${startDt} ~ ${endDt}\n`);

  const configs: SyncConfig[] = [
    {
      name: '일학습병행 훈련과정',
      fetchFn: fetchDualTrainingCourses,
      normalizeFn: normalizeDualTraining,
    },
    {
      name: '사업주훈련 훈련과정',
      fetchFn: fetchEmployerTrainingCourses,
      normalizeFn: normalizeEmployerTraining,
    },
  ];

  try {
    let grandTotal = 0;
    for (const config of configs) {
      const result = await syncOne(conn, config, startDt, endDt);
      grandTotal += result.inserted;
    }

    console.log(`\n🎉 전체 완료: 총 ${grandTotal}건 추가 적재`);
  } finally {
    await conn.close();
    await closePool();
  }
}

syncAll().catch(err => {
  console.error('동기화 실패:', err.message);
  process.exit(1);
});