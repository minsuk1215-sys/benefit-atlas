import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

async function test() {
  console.log('=== BENEFIT 계정 접속 테스트 ===\n');

  process.env.TNS_ADMIN = WALLET_PATH;

  try {
    const conn = await oracledb.getConnection({
      user: 'BENEFIT',
      password: process.env.BENEFIT_DB_PASSWORD,
      connectString: 'benefitatlas_high',
      walletLocation: WALLET_PATH,
      walletPassword: process.env.WALLET_PASSWORD,
    });

    console.log('✅ BENEFIT 접속 성공\n');

    // 현재 사용자 확인
    const user = await conn.execute(
      `SELECT USER, SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS SCHEMA FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('사용자/스키마:', user.rows);

    // 내 테이블 목록 (빈 상태여야 함)
    const tables = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM USER_TABLES`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`\n내 테이블 수: ${(tables.rows![0] as any).CNT}건 (0이 정상 - 아직 안 만듦)`);

    await conn.close();
    console.log('\n✅ BENEFIT 접속 OK. 테이블 생성 준비 완료!');
  } catch (err: any) {
    console.error('❌ 접속 실패:', err.message);
    console.log('\n디버깅:');
    console.log('- .env의 BENEFIT_DB_PASSWORD 정확한가?');
    console.log('- createBenefitSchema.ts 실행 완료됐나?');
  }
}

test();