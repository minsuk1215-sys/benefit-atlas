import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

async function main() {
  console.log('=== BENEFIT 비밀번호 재설정 ===\n');

  const newPassword = process.env.BENEFIT_DB_PASSWORD;

  if (!newPassword) {
    console.log('❌ .env에 BENEFIT_DB_PASSWORD 설정 필요');
    return;
  }

  // 비밀번호 검증
  console.log('비밀번호 길이:', newPassword.length);

  if (newPassword.length < 12) {
    console.log('⚠️ Autonomous DB는 12자 이상 권장');
    console.log('   현재:', newPassword.length, '자');
    console.log('   .env의 BENEFIT_DB_PASSWORD를 12자 이상으로 변경 후 재실행');
    return;
  }

  if (!/[A-Z]/.test(newPassword)) {
    console.log('⚠️ 대문자 최소 1개 필요');
    return;
  }
  if (!/[a-z]/.test(newPassword)) {
    console.log('⚠️ 소문자 최소 1개 필요');
    return;
  }
  if (!/[0-9]/.test(newPassword)) {
    console.log('⚠️ 숫자 최소 1개 필요');
    return;
  }
  if (newPassword.includes('"')) {
    console.log('⚠️ 이중 인용부호(") 사용 불가');
    return;
  }

  console.log('✅ 비밀번호 규칙 통과\n');

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

    console.log('✅ ADMIN 접속 성공\n');

    // BENEFIT 사용자 존재 확인
    const check = await conn.execute(
      `SELECT USERNAME FROM DBA_USERS WHERE USERNAME = 'BENEFIT'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (check.rows!.length === 0) {
      // 사용자 없으면 생성
      console.log('BENEFIT 사용자 없음. 새로 생성...');
      await conn.execute(
        `CREATE USER BENEFIT IDENTIFIED BY "${newPassword}"`
      );
      console.log('✅ 사용자 생성');

      // 권한 부여
      const grants = [
        'GRANT CREATE SESSION TO BENEFIT',
        'GRANT CREATE TABLE TO BENEFIT',
        'GRANT CREATE SEQUENCE TO BENEFIT',
        'GRANT CREATE VIEW TO BENEFIT',
        'GRANT CREATE PROCEDURE TO BENEFIT',
        'ALTER USER BENEFIT QUOTA UNLIMITED ON DATA',
        'GRANT DWROLE TO BENEFIT',
      ];

      for (const grant of grants) {
        try {
          await conn.execute(grant);
          console.log('   ✅', grant.substring(0, 45));
        } catch (e: any) {
          console.log('   ⚠️', grant.substring(0, 45), '→', e.message.substring(0, 50));
        }
      }
    } else {
      // 사용자 있으면 비밀번호만 재설정
      console.log('BENEFIT 사용자 존재. 비밀번호 재설정...');
      await conn.execute(
        `ALTER USER BENEFIT IDENTIFIED BY "${newPassword}"`
      );
      console.log('✅ 비밀번호 재설정 완료');

      // 계정 잠김 해제 (혹시 몰라)
      try {
        await conn.execute(`ALTER USER BENEFIT ACCOUNT UNLOCK`);
        console.log('✅ 계정 잠금 해제');
      } catch (e) { /* 이미 해제되어 있을 수 있음 */ }
    }

    console.log('\n✅ 완료. testBenefitConnection.ts로 접속 확인하세요.');
  } catch (err: any) {
    console.error('\n❌ 오류:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

main();