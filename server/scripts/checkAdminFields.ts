import { initPool, getConnection, closePool } from '../src/db';

async function check() {
  await initPool();
  const conn = await getConnection();
  try {
    // 컬럼 NULL 허용 여부 확인
    const cols = await conn.execute(
      `SELECT COLUMN_NAME, NULLABLE FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'POLICY_MASTER'
       ORDER BY COLUMN_ID`,
      [],
      { outFormat: 4002 }
    );
    cols.rows!.forEach((r: any) => {
      console.log(`${r.COLUMN_NAME.padEnd(20)} NULLABLE: ${r.NULLABLE}`);
    });
  } finally {
    await conn.close();
    await closePool();
  }
}

check().catch(console.error);