import oracledb from 'oracledb';
import { initPool, getConnection, closePool } from '../src/db';

async function check() {
  await initPool();
  const conn = await getConnection();

  try {
    const count = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('총 정책 수:', (count.rows![0] as any).CNT);

    console.log('\n카테고리별 분포 (상위 10):');
    const byCategory = await conn.execute(
      `SELECT CATEGORY, COUNT(*) AS CNT FROM POLICY_MASTER
       GROUP BY CATEGORY ORDER BY CNT DESC FETCH FIRST 10 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    byCategory.rows!.forEach((r: any) => {
      console.log(`  ${r.CATEGORY}: ${r.CNT}건`);
    });

    console.log('\n생애주기별 분포:');
    const stages = ['birth', 'care', 'youth', 'marry', 'senior'];
    for (const stage of stages) {
      const result = await conn.execute(
        `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE LIFECYCLE LIKE :pat`,
        [`%${stage}%`],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      console.log(`  ${stage}: ${(result.rows![0] as any).CNT}건`);
    }

    console.log('\n연령 정보 있는 정책:');
    const withAge = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE TARGET_AGE_MIN IS NOT NULL OR TARGET_AGE_MAX IS NOT NULL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`  연령 추출 성공: ${(withAge.rows![0] as any).CNT}건`);

    console.log('\n주관 기관 상위 5:');
    const byOrg = await conn.execute(
      `SELECT ORG, COUNT(*) AS CNT FROM POLICY_MASTER
       GROUP BY ORG ORDER BY CNT DESC FETCH FIRST 5 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    byOrg.rows!.forEach((r: any) => {
      console.log(`  ${r.ORG}: ${r.CNT}건`);
    });

    console.log('\n샘플 정책 5건:');
    const samples = await conn.execute(
      `SELECT TITLE, ORG, CATEGORY, LIFECYCLE, TARGET_AGE_MIN, TARGET_AGE_MAX
       FROM POLICY_MASTER WHERE ROWNUM <= 5 ORDER BY CREATED_AT DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    samples.rows!.forEach((r: any, i: number) => {
      const age = r.TARGET_AGE_MIN || r.TARGET_AGE_MAX
        ? ` [${r.TARGET_AGE_MIN || '?'}~${r.TARGET_AGE_MAX || '?'}세]`
        : '';
      console.log(`  ${i + 1}. [${r.CATEGORY}/${r.LIFECYCLE}]${age} ${r.TITLE} (${r.ORG})`);
    });
  } finally {
    await conn.close();
    await closePool();
  }
}

check().catch(console.error);