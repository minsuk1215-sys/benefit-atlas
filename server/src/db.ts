import oracledb from 'oracledb';
import path from 'path';
import 'dotenv/config';

let pool: oracledb.Pool | null = null;

export async function initPool() {
  if (pool) return pool;

  const config: oracledb.PoolAttributes = {
    user: process.env.ORACLE_USER!,
    password: process.env.ORACLE_PASSWORD!,
    connectString: process.env.ORACLE_CONNECT_STRING!,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  };

  // 클라우드 DB(Autonomous DB)용 Wallet 설정
  // ORACLE_WALLET_PATH가 있으면 Wallet 사용, 없으면 로컬 접속
  if (process.env.ORACLE_WALLET_PATH) {
    config.walletLocation = path.resolve(process.env.ORACLE_WALLET_PATH);
    config.walletPassword = process.env.ORACLE_WALLET_PASSWORD;
    process.env.TNS_ADMIN = path.resolve(process.env.ORACLE_WALLET_PATH);
    console.log('Using cloud DB (Wallet mode)');
  } else {
    console.log('Using local DB');
  }

  pool = await oracledb.createPool(config);
  console.log('Oracle pool created');
  return pool;
}

export async function getConnection() {
  if (!pool) await initPool();
  return await pool!.getConnection();
}

export async function closePool() {
  if (pool) {
    await pool.close(10);
    pool = null;
  }
}