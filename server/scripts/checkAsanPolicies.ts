import oracledb from 'oracledb';
import { initPool, getConnection, closePool } from '../src/db';

async function check() {
  await initPool();
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT TITLE, ORG, REGION, SOURCE
       FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE'
         AND (TITLE LIKE '%아산%' OR ORG LIKE '%아산%' OR TITLE LIKE '%청년 버스 운전자%' OR TITLE LIKE '%청년 희망이음%')
       FETCH FIRST 15 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('아산/제주 관련 정책의 실제 REGION 값:');
    result.rows!.forEach((r: any) => {
      console.log(`  [${r.SOURCE}] "${r.TITLE.substring(0, 30)}"`);
      console.log(`    ORG: "${r.ORG}"`);
      console.log(`    REGION: "${r.REGION}"`);
      console.log('');
    });
  } finally {
    await conn.close();
    await closePool();
  }
}

check().catch(console.error);