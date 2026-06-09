import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import oracledb from 'oracledb';
import { initPool, getConnection } from './db';

const app = express();

app.use(cors({
  origin: 'http://localhost:3300',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BenefitAtlas API'
  });
});

// DB 연결 테스트
app.get('/db-test', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT 'Hello BenefitAtlas from Oracle' AS GREETING, SYSDATE AS NOW FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({
      ok: true,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  } finally {
    if (conn) await conn.close();
  }
});

const PORT = Number(process.env.PORT) || 3301;

// 서버 시작 시 Oracle 풀 초기화
async function start() {
  try {
    await initPool();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();