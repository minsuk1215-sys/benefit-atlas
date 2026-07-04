import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';
import { initPool, getConnection, closePool } from '../src/db';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');
const BATCH_SIZE = 100;

async function readClob(clob: any): Promise<string | null> {
  if (!clob) return null;
  if (typeof clob === 'string') return clob;
  if (typeof clob === 'object' && typeof clob.getData === 'function') {
    return await clob.getData();
  }
  return null;
}

async function migrate() {
  console.log('=== 로컬 → 클라우드 데이터 이전 ===\n');

  console.log('1. 로컬 DB 연결...');
  await initPool();
  const localConn = await getConnection();
  console.log('   ✅ 로컬 연결');

  console.log('\n2. 클라우드 DB 연결...');
  process.env.TNS_ADMIN = WALLET_PATH;
  const cloudConn = await oracledb.getConnection({
    user: 'BENEFIT',
    password: process.env.BENEFIT_DB_PASSWORD,
    connectString: 'benefitatlas_high',
    walletLocation: WALLET_PATH,
    walletPassword: process.env.WALLET_PASSWORD,
  });
  console.log('   ✅ 클라우드 연결');

  try {
    const localCount = await localConn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const total = (localCount.rows![0] as any).CNT;
    console.log(`\n3. 로컬 총 정책 수: ${total}건`);

    const cloudCount = await cloudConn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const cloudExisting = (cloudCount.rows![0] as any).CNT;
    console.log(`   클라우드 기존 정책 수: ${cloudExisting}건`);

    console.log('\n4. 데이터 이전 시작 (배치 크기: ' + BATCH_SIZE + ')...\n');

    let offset = 0;
    let inserted = 0;
    let errors = 0;
    const startTime = Date.now();

    while (offset < total) {
      const batch = await localConn.execute(
        `SELECT * FROM POLICY_MASTER
         ORDER BY ID
         OFFSET :b_offset ROWS FETCH NEXT :b_size ROWS ONLY`,
        { b_offset: offset, b_size: BATCH_SIZE },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const rows = batch.rows as any[];

      for (const row of rows) {
        try {
          const description = await readClob(row.DESCRIPTION);
          const targetText = await readClob(row.TARGET_TEXT);

          const mergeSql = `
            MERGE INTO POLICY_MASTER t
            USING (SELECT :bind_id AS ID FROM DUAL) s
            ON (t.ID = s.ID)
            WHEN MATCHED THEN UPDATE SET
              TENANT_ID = :bind_tenant_id, SOURCE = :bind_source, SOURCE_ID = :bind_source_id,
              CATEGORY = :bind_category, LIFECYCLE = :bind_lifecycle,
              TITLE = :bind_title, ORG = :bind_org,
              DESCRIPTION = :bind_description, AMOUNT_TEXT = :bind_amount_text,
              TARGET_AGE_MIN = :bind_age_min, TARGET_AGE_MAX = :bind_age_max,
              REGION = :bind_region, APPLY_START = :bind_apply_start, APPLY_END = :bind_apply_end,
              APPLY_URL = :bind_apply_url, TAGS = :bind_tags, STATUS = :bind_status,
              LAST_SYNC = :bind_last_sync, UPDATED_AT = :bind_updated_at,
              TARGET_TEXT = :bind_target_text
            WHEN NOT MATCHED THEN INSERT
              (ID, TENANT_ID, SOURCE, SOURCE_ID, CATEGORY, LIFECYCLE,
               TITLE, ORG, DESCRIPTION, AMOUNT_TEXT,
               TARGET_AGE_MIN, TARGET_AGE_MAX, REGION,
               APPLY_START, APPLY_END, APPLY_URL, TAGS, STATUS,
               LAST_SYNC, CREATED_AT, UPDATED_AT, TARGET_TEXT)
            VALUES
              (:bind_id, :bind_tenant_id, :bind_source, :bind_source_id,
               :bind_category, :bind_lifecycle, :bind_title, :bind_org,
               :bind_description, :bind_amount_text,
               :bind_age_min, :bind_age_max, :bind_region,
               :bind_apply_start, :bind_apply_end, :bind_apply_url, :bind_tags, :bind_status,
               :bind_last_sync, :bind_created_at, :bind_updated_at, :bind_target_text)
          `;

          await cloudConn.execute(mergeSql, {
            bind_id: row.ID,
            bind_tenant_id: row.TENANT_ID,
            bind_source: row.SOURCE,
            bind_source_id: row.SOURCE_ID,
            bind_category: row.CATEGORY,
            bind_lifecycle: row.LIFECYCLE,
            bind_title: row.TITLE,
            bind_org: row.ORG,
            bind_description: description,
            bind_amount_text: row.AMOUNT_TEXT,
            bind_age_min: row.TARGET_AGE_MIN,
            bind_age_max: row.TARGET_AGE_MAX,
            bind_region: row.REGION,
            bind_apply_start: row.APPLY_START,
            bind_apply_end: row.APPLY_END,
            bind_apply_url: row.APPLY_URL,
            bind_tags: row.TAGS,
            bind_status: row.STATUS,
            bind_last_sync: row.LAST_SYNC,
            bind_created_at: row.CREATED_AT,
            bind_updated_at: row.UPDATED_AT,
            bind_target_text: targetText,
          });

          inserted++;
        } catch (err: any) {
          errors++;
          if (errors < 5) {
            console.error(`  ⚠️ ID=${row.ID}: ${err.message.substring(0, 80)}`);
          }
        }
      }

      await cloudConn.commit();

      offset += BATCH_SIZE;
      const progress = Math.min(offset, total);
      const percent = ((progress / total) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  진행: ${progress}/${total} (${percent}%) - ${elapsed}초, 오류 ${errors}건`);
    }

    console.log('\n5. 최종 검증...');
    const finalCount = await cloudConn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const cloudFinal = (finalCount.rows![0] as any).CNT;
    console.log(`   클라우드 최종 정책 수: ${cloudFinal}건`);
    console.log(`   로컬 정책 수: ${total}건`);

    if (cloudFinal === total) {
      console.log(`   ✅ 완벽 일치!`);
    } else {
      console.log(`   ⚠️ 차이: ${total - cloudFinal}건`);
    }

    const dist = await cloudConn.execute(
      `SELECT CATEGORY, COUNT(*) AS CNT
       FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE'
       GROUP BY CATEGORY
       ORDER BY CNT DESC
       FETCH FIRST 5 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('\n   카테고리 상위 5 (클라우드):');
    dist.rows!.forEach((r: any) => {
      console.log(`     ${r.CATEGORY}: ${r.CNT}건`);
    });

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`\n✅ 이전 완료: ${inserted}건 처리, ${errors}건 오류, ${elapsed}분 소요`);
  } finally {
    await localConn.close();
    await cloudConn.close();
    await closePool();
  }
}

migrate().catch(err => {
  console.error('❌ 마이그레이션 실패:', err.message);
  process.exit(1);
});