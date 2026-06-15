import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import oracledb from 'oracledb';
import { initPool, getConnection } from './db';
import adminRouter from './routes/admin';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3300',
    'http://192.168.11.25:3300',
  ],
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

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const lifecycle = req.query.lifecycle as string | undefined;

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

    const countResult = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE ${whereClause}`,
      binds,
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const total = (countResult.rows![0] as any).CNT;

    binds.limit = limit;
    binds.offset = offset;
    const result = await conn.execute(
      `SELECT ID, TITLE, ORG, CATEGORY, LIFECYCLE,
              TARGET_AGE_MIN, TARGET_AGE_MAX, APPLY_END, APPLY_URL, TAGS, REGION
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

// 정책 검색 API
// 정책 검색 API
app.get('/api/search', async (req, res) => {
  let conn;
  try {
    const q = (req.query.q as string || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);

    if (!q) {
      return res.json({ ok: true, query: '', count: 0, data: [] });
    }

    conn = await getConnection();

    // TITLE, TAGS, ORG에서 검색 (CLOB DESCRIPTION 제외 - 한글 인코딩 문제)
    const result = await conn.execute(
      `SELECT ID, TITLE, ORG, CATEGORY, LIFECYCLE,
              TARGET_AGE_MIN, TARGET_AGE_MAX, APPLY_END, APPLY_URL, TAGS, REGION
       FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE'
         AND (
           UPPER(TITLE) LIKE UPPER(:q1)
           OR UPPER(TAGS) LIKE UPPER(:q2)
           OR UPPER(ORG) LIKE UPPER(:q3)
         )
       ORDER BY
         CASE WHEN UPPER(TITLE) LIKE UPPER(:q4) THEN 1
              WHEN UPPER(TAGS) LIKE UPPER(:q5) THEN 2
              WHEN UPPER(ORG) LIKE UPPER(:q6) THEN 3
              ELSE 4 END,
         CREATED_AT DESC
       FETCH FIRST :limit ROWS ONLY`,
      {
        q1: `%${q}%`, q2: `%${q}%`, q3: `%${q}%`,
        q4: `%${q}%`, q5: `%${q}%`, q6: `%${q}%`,
        limit,
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      ok: true,
      query: q,
      count: result.rows!.length,
      data: result.rows,
    });
  } catch (err: any) {
    console.error('search error:', err);
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

// 추천 API
app.post('/api/recommend', async (req, res) => {
  let conn;
  try {
    const profile = req.body;
    const { scorePolicy } = await import('./services/recommender');

    conn = await getConnection();

    const result = await conn.execute(
      `SELECT ID, TITLE, ORG, CATEGORY, LIFECYCLE,
              TARGET_AGE_MIN, TARGET_AGE_MAX, APPLY_END, APPLY_URL, TAGS, REGION
       FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const scored = result.rows!
      .map((p: any) => ({ ...p, _score: scorePolicy(profile, p) }))
      .filter(p => p._score > 0)
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, 30);

    res.json({
      ok: true,
      profile,
      count: scored.length,
      data: scored,
    });
  } catch (err: any) {
    console.error('Recommend error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.use('/admin', adminRouter);

const PORT = Number(process.env.PORT) || 3301;

async function start() {
  try {
    await initPool();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();