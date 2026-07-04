import 'dotenv/config';
import oracledb from 'oracledb';
import { initPool, getConnection, closePool } from '../src/db';

async function getSchema() {
  await initPool();
  const conn = await getConnection();
  try {
    console.log('=== POLICY_MASTER 컬럼 구조 ===\n');
    const cols = await conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE, DATA_DEFAULT
       FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'POLICY_MASTER'
       ORDER BY COLUMN_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    cols.rows!.forEach((c: any) => {
      const nullable = c.NULLABLE === 'Y' ? 'NULL' : 'NOT NULL';
      const len = c.DATA_LENGTH ? `(${c.DATA_LENGTH})` : '';
      console.log(`  ${c.COLUMN_NAME.padEnd(20)} ${c.DATA_TYPE}${len} ${nullable}`);
    });

    console.log('\n=== 인덱스 ===');
    const idx = await conn.execute(
      `SELECT INDEX_NAME, COLUMN_NAME
       FROM USER_IND_COLUMNS
       WHERE TABLE_NAME = 'POLICY_MASTER'
       ORDER BY INDEX_NAME, COLUMN_POSITION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    idx.rows!.forEach((r: any) => {
      console.log(`  ${r.INDEX_NAME}: ${r.COLUMN_NAME}`);
    });

    console.log('\n=== 다른 테이블 목록 ===');
    const tables = await conn.execute(
      `SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    tables.rows!.forEach((r: any) => {
      console.log(`  ${r.TABLE_NAME}`);
    });
  } finally {
    await conn.close();
    await closePool();
  }
}

getSchema().catch(console.error);