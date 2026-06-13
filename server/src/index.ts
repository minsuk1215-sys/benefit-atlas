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

// 정책 목록 조회 (기본)
app.get('/api/policies', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // 쿼리 파라미터
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const lifecycle = req.query.lifecycle as string | undefined;
    
    // WHERE 절 조립
    const wheres: string[] = ["STATUS = 'ACTIVE'"];
    const binds: any = {};
    
    if (category) {
      wheres.push('CATEGORY = :category');
      binds.category = category;
    }
    if (lifecycle) {
      wheres.push('LIFECYCLE LIKE :lifecycle');
      binds.lifecycle = `%${lifecycle}%`;
    }
    
    const whereClause = wheres.join(' AND ');
    
    // 총 개수
    const countResult = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE ${whereClause}`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const total = (countResult.rows![0] as any).CNT;
    
    // 목록
    binds.limit = limit;
    binds.offset = offset;
    const result = await conn.execute(
      `SELECT ID, TITLE, ORG, CATEGORY, LIFECYCLE,
              TARGET_AGE_MIN, TARGET_AGE_MAX, APPLY_END, APPLY_URL, TAGS
       FROM POLICY_MASTER
       WHERE ${whereClause}
       ORDER BY CREATED_AT DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      ok: true,
      total,
      count: result.rows!.length,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 정책 상세
app.get('/api/policies/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM POLICY_MASTER WHERE ID = :id`,
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows!.length === 0) {
      return res.status(404).json({ ok: false, error: '정책을 찾을 수 없습니다' });
    }
    
    // CLOB 필드 읽기 (description, targetText)
    const row: any = result.rows![0];
    if (row.DESCRIPTION && typeof row.DESCRIPTION === 'object') {
      row.DESCRIPTION = await row.DESCRIPTION.getData();
    }
    if (row.TARGET_TEXT && typeof row.TARGET_TEXT === 'object') {
      row.TARGET_TEXT = await row.TARGET_TEXT.getData();
    }
    
    res.json({ ok: true, data: row });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
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