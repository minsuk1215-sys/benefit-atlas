import oracledb from 'oracledb';
import 'dotenv/config';

// 연결 풀 한 번 생성하고 재사용
let pool: oracledb.Pool | null = null;

export async function initPool() {
  if (pool) return pool;
  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER!,
    password: process.env.ORACLE_PASSWORD!,
    connectString: process.env.ORACLE_CONNECT_STRING!,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  });
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