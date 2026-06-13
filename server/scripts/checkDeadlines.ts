import oracledb from 'oracledb';
import { initPool, getConnection, closePool } from '../src/db';

async function check() {
  await initPool();
  const conn = await getConnection();

  try {
    // 1. APPLY_END 컬럼이 NOT NULL인 정책 수
    const notNull = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE APPLY_END IS NOT NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('마감일 있는 정책:', (notNull.rows![0] as any).CNT);

    // 2. NULL인 정책 수
    const nullCnt = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE APPLY_END IS NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('마감일 없는 정책 (상시 등):', (nullCnt.rows![0] as any).CNT);

    // 3. 미래 마감일 정책 (오늘 이후)
    const future = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE APPLY_END > SYSDATE`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('미래 마감 정책:', (future.rows![0] as any).CNT);

    // 4. 30일 이내 마감
    const within30 = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER 
       WHERE APPLY_END BETWEEN SYSDATE AND SYSDATE + 30`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('30일 이내 마감:', (within30.rows![0] as any).CNT);

    // 5. 가까운 마감 정책 10건 샘플
    console.log('\n가까운 마감 정책 10건:');
    const samples = await conn.execute(
      `SELECT TITLE, ORG, APPLY_END FROM POLICY_MASTER
       WHERE APPLY_END > SYSDATE
       ORDER BY APPLY_END
       FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    samples.rows!.forEach((r: any) => {
      const date = new Date(r.APPLY_END).toLocaleDateString('ko-KR');
      console.log(`  ${date} - [${r.ORG}] ${r.TITLE}`);
    });
  } finally {
    await conn.close();
    await closePool();
  }
}

check().catch(console.error);