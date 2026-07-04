import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

// Wallet 경로 (절대 경로)
const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

async function test() {
  console.log('=== Oracle Cloud 접속 테스트 ===\n');
  console.log('Wallet 경로:', WALLET_PATH);

  // 환경변수로 wallet 위치 전달 (Thin mode)
  process.env.TNS_ADMIN = WALLET_PATH;

  const CONNECT_STRING = 'benefitatlas_high';  // tnsnames.ora의 alias

  try {
    console.log('\n1. 연결 시도...');
    const conn = await oracledb.getConnection({
      user: 'ADMIN',
      password: process.env.CLOUD_DB_PASSWORD,  // .env에서
      connectString: CONNECT_STRING,
    });

    console.log('✅ 접속 성공!');

    console.log('\n2. 간단 쿼리 실행...');
    const result = await conn.execute(
      `SELECT 'Hello from Cloud!' AS msg, SYSDATE AS now FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('결과:', result.rows);

    console.log('\n3. Autonomous DB 정보 조회...');
    const version = await conn.execute(
      `SELECT * FROM v$version WHERE ROWNUM = 1`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('버전:', version.rows);

    await conn.close();
    console.log('\n✅ 모든 테스트 통과!');
  } catch (err: any) {
    console.error('\n❌ 접속 실패:');
    console.error('  message:', err.message);
    console.error('  code:', err.code);

    console.log('\n디버깅 팁:');
    console.log('- .env에 CLOUD_DB_PASSWORD 설정되어 있나?');
    console.log('- wallet_cloud 폴더에 7개 파일 있나?');
    console.log('- sqlnet.ora 경로 수정했나?');
    console.log('- tnsnames.ora에 benefitatlas_high 있나?');
  }
}

test();