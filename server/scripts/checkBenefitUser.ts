import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

async function check() {
  process.env.TNS_ADMIN = WALLET_PATH;

  const conn = await oracledb.getConnection({
    user: 'ADMIN',
    password: process.env.CLOUD_DB_PASSWORD,
    connectString: 'benefitatlas_high',
    walletLocation: WALLET_PATH,
    walletPassword: process.env.WALLET_PASSWORD,
  });

  console.log('=== BENEFIT 사용자 존재 확인 ===\n');

  const result = await conn.execute(
    `SELECT USERNAME, ACCOUNT_STATUS, CREATED
     FROM DBA_USERS
     WHERE USERNAME = 'BENEFIT'`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  if (result.rows!.length === 0) {
    console.log('❌ BENEFIT 사용자 없음. createBenefitSchema.ts 실패했을 가능성.');
  } else {
    console.log('✅ BENEFIT 사용자 존재:');
    console.log(result.rows);
  }

  await conn.close();
}

check().catch(console.error);