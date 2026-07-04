import 'dotenv/config';
import oracledb from 'oracledb';
import { initPool, getConnection, closePool } from '../src/db';

async function check() {
  await initPool();
  const conn = await getConnection();
  try {
    // 컬럼 구조
    console.log('=== POLICY_SYNC_LOG 컬럼 ===');
    const cols = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH
       FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'POLICY_SYNC_LOG'
       ORDER BY COLUMN_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    cols.rows!.forEach((c: any) => {
      console.log(`  ${c.COLUMN_NAME} ${c.DATA_TYPE}(${c.DATA_LENGTH})`);
    });

    // 데이터 개수
    const count = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_SYNC_LOG`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`\n행 수: ${(count.rows![0] as any).CNT}`);

    // 샘플
    if ((count.rows![0] as any).CNT > 0) {
      const sample = await conn.execute(
        `SELECT * FROM POLICY_SYNC_LOG FETCH FIRST 3 ROWS ONLY`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      console.log('\n샘플 3건:');
      console.log(JSON.stringify(sample.rows, null, 2));
    } else {
      console.log('데이터 없음 → 코드에서 사용 안 함 (제외 가능)');
    }
  } finally {
    await conn.close();
    await closePool();
  }
}

check().catch(console.error);