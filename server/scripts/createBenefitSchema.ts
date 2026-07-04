import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

async function main() {
  console.log('=== BENEFIT 스키마 생성 (Autonomous DB) ===\n');

  process.env.TNS_ADMIN = WALLET_PATH;

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'ADMIN',
      password: process.env.CLOUD_DB_PASSWORD,
      connectString: 'benefitatlas_high',
      walletLocation: WALLET_PATH,
      walletPassword: process.env.WALLET_PASSWORD,
    });

    console.log('✅ ADMIN으로 접속 성공\n');

    // 1. BENEFIT 스키마 존재 확인
    const check = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM DBA_USERS WHERE USERNAME = 'BENEFIT'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if ((check.rows![0] as any).CNT > 0) {
      console.log('⚠️  BENEFIT 스키마 이미 존재. 삭제 후 재생성하시겠어요?');
      console.log('   (계속 진행하려면 이 스크립트 다시 실행 시 삭제되게 함)');
      return;
    }

    // 2. BENEFIT 사용자 생성 (스키마 = 사용자)
    const BENEFIT_PASSWORD = process.env.BENEFIT_DB_PASSWORD;
    if (!BENEFIT_PASSWORD) {
      console.log('❌ .env에 BENEFIT_DB_PASSWORD 설정 필요');
      return;
    }

    console.log('1. BENEFIT 사용자 생성...');
    await conn.execute(
      `CREATE USER BENEFIT IDENTIFIED BY "${BENEFIT_PASSWORD}"`
    );
    console.log('   ✅ 사용자 생성');

    // 3. 기본 권한 부여
    console.log('\n2. 권한 부여...');

    // 접속 권한
    await conn.execute(`GRANT CREATE SESSION TO BENEFIT`);
    console.log('   ✅ CREATE SESSION');

    // 리소스 (테이블, 인덱스 등 생성)
    await conn.execute(`GRANT CREATE TABLE TO BENEFIT`);
    await conn.execute(`GRANT CREATE SEQUENCE TO BENEFIT`);
    await conn.execute(`GRANT CREATE VIEW TO BENEFIT`);
    await conn.execute(`GRANT CREATE PROCEDURE TO BENEFIT`);
    console.log('   ✅ CREATE TABLE/SEQUENCE/VIEW/PROCEDURE');

    // 테이블스페이스 사용 권한 (Autonomous DB는 DATA 테이블스페이스 사용)
    await conn.execute(`ALTER USER BENEFIT QUOTA UNLIMITED ON DATA`);
    console.log('   ✅ 테이블스페이스 무제한 할당');

    // Autonomous DB 애플리케이션 사용자 롤
    await conn.execute(`GRANT DWROLE TO BENEFIT`);
    console.log('   ✅ DWROLE (Autonomous DB 애플리케이션 롤)');

    console.log('\n✅ BENEFIT 스키마 생성 완료!');
    console.log('\n다음 단계:');
    console.log('  1. .env에 BENEFIT_DB_PASSWORD 저장 (이미 있음)');
    console.log('  2. BENEFIT 계정으로 접속 테스트');
    console.log('  3. 테이블 생성');
  } catch (err: any) {
    console.error('\n❌ 오류:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

main();