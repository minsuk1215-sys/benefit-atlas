import oracledb from 'oracledb';
import { initPool, getConnection, closePool } from '../src/db';

async function check() {
  await initPool();
  const conn = await getConnection();
  try {
    // REGION별 상위 분포
    const byRegion = await conn.execute(
      `SELECT
         NVL(REGION, '(NULL)') AS REGION,
         COUNT(*) AS CNT
       FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE'
       GROUP BY REGION
       ORDER BY CNT DESC
       FETCH FIRST 30 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log('REGION 분포 (상위 30):');
    byRegion.rows!.forEach((r: any) => {
      console.log(`  ${r.REGION}: ${r.CNT}건`);
    });

    // 소스별 REGION 형식
    console.log('\n=== SOURCE별 REGION 샘플 ===');
    const sources = ['gov24', 'youth', 'work24', 'local'];
    for (const src of sources) {
      const sample = await conn.execute(
        `SELECT DISTINCT REGION FROM POLICY_MASTER
         WHERE SOURCE = :src AND REGION IS NOT NULL
         FETCH FIRST 10 ROWS ONLY`,
        [src],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (sample.rows!.length > 0) {
        console.log(`\n[${src}] REGION 샘플:`);
        sample.rows!.forEach((r: any) => console.log(`  - "${r.REGION}"`));
      }
    }

    // "서울" 정책 검색 패턴
    console.log('\n=== "서울" 매칭 테스트 ===');
    const seoul = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE' AND REGION LIKE '%서울%'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const nullRegion = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE' AND (REGION IS NULL OR REGION = '전국')`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const gwangju = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE' AND REGION LIKE '%광주%'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`서울 포함: ${(seoul.rows![0] as any).CNT}건`);
    console.log(`NULL 또는 전국: ${(nullRegion.rows![0] as any).CNT}건`);
    console.log(`광주 포함: ${(gwangju.rows![0] as any).CNT}건`);
  } finally {
    await conn.close();
    await closePool();
  }
}

check().catch(console.error);