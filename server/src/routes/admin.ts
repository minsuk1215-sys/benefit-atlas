import { Router, Request, Response, NextFunction } from 'express';
import oracledb from 'oracledb';
import { getConnection } from '../db';
import 'dotenv/config';

const router = Router();

// === 인증 미들웨어 ===
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: '인증이 필요합니다' });
  }
  const token = auth.substring(7);
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ ok: false, error: '잘못된 인증 정보' });
  }
  next();
}

// === 로그인 ===
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' });
  }

  res.json({
    ok: true,
    token: process.env.ADMIN_SECRET,
    user: {
      username,
      tenantId: 'DEMO_GOV',
      tenantName: '데모 지자체',
    },
  });
});

// === 정책 목록 (자체 정책만) ===
router.get('/policies', adminAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID, TITLE, CATEGORY, LIFECYCLE, ORG, REGION,
              TARGET_AGE_MIN, TARGET_AGE_MAX, APPLY_END, STATUS,
              CREATED_AT, UPDATED_AT
       FROM POLICY_MASTER
       WHERE TENANT_ID = 'DEMO_GOV' AND SOURCE = 'local'
       ORDER BY UPDATED_AT DESC, CREATED_AT DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      ok: true,
      count: result.rows!.length,
      data: result.rows,
    });
  } catch (err: any) {
    console.error('admin/policies error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// === 정책 상세 ===
router.get('/policies/:id', adminAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM POLICY_MASTER
       WHERE ID = :id AND TENANT_ID = 'DEMO_GOV' AND SOURCE = 'local'`,
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

// === 정책 생성 ===
router.post('/policies', adminAuth, async (req, res) => {
  let conn;
  try {
    const p = req.body;

    if (!p.title || !p.category) {
      return res.status(400).json({ ok: false, error: '제목과 카테고리는 필수입니다' });
    }

    conn = await getConnection();

    // ID는 timestamp 기반 자체 생성
    const id = 'local_' + Date.now();

    await conn.execute(
      `INSERT INTO POLICY_MASTER
        (ID, TENANT_ID, SOURCE, SOURCE_ID, CATEGORY, LIFECYCLE, TITLE, ORG,
         DESCRIPTION, TARGET_TEXT, TARGET_AGE_MIN, TARGET_AGE_MAX,
         REGION, APPLY_END, APPLY_URL, TAGS, STATUS,
         CREATED_AT, UPDATED_AT)
       VALUES
        (:id, 'DEMO_GOV', 'local', :id, :category, :lifecycle, :title, :org,
         :description, :targetText, :targetAgeMin, :targetAgeMax,
         :region, :applyEnd, :applyUrl, :tags, 'ACTIVE',
         SYSDATE, SYSDATE)`,
      {
        id,
        category: p.category,
        lifecycle: p.lifecycle || 'all',
        title: p.title,
        org: p.org || '데모 지자체',
        description: p.description || '',
        targetText: p.targetText || '',
        targetAgeMin: p.targetAgeMin || null,
        targetAgeMax: p.targetAgeMax || null,
        region: p.region || '',
        applyEnd: p.applyEnd ? new Date(p.applyEnd) : null,
        applyUrl: p.applyUrl || '',
        tags: p.tags || '',
      }
    );

    await conn.commit();
    res.json({ ok: true, id, message: '정책이 등록되었습니다' });
  } catch (err: any) {
    console.error('admin POST error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// === 정책 수정 ===
router.put('/policies/:id', adminAuth, async (req, res) => {
  let conn;
  try {
    const p = req.body;
    const id = req.params.id;

    if (!p.title || !p.category) {
      return res.status(400).json({ ok: false, error: '제목과 카테고리는 필수입니다' });
    }

    conn = await getConnection();

    const result = await conn.execute(
      `UPDATE POLICY_MASTER SET
         CATEGORY = :category,
         LIFECYCLE = :lifecycle,
         TITLE = :title,
         ORG = :org,
         DESCRIPTION = :description,
         TARGET_TEXT = :targetText,
         TARGET_AGE_MIN = :targetAgeMin,
         TARGET_AGE_MAX = :targetAgeMax,
         REGION = :region,
         APPLY_END = :applyEnd,
         APPLY_URL = :applyUrl,
         TAGS = :tags,
         UPDATED_AT = SYSDATE
       WHERE ID = :id AND TENANT_ID = 'DEMO_GOV' AND SOURCE = 'local'`,
      {
        id,
        category: p.category,
        lifecycle: p.lifecycle || 'all',
        title: p.title,
        org: p.org || '데모 지자체',
        description: p.description || '',
        targetText: p.targetText || '',
        targetAgeMin: p.targetAgeMin || null,
        targetAgeMax: p.targetAgeMax || null,
        region: p.region || '',
        applyEnd: p.applyEnd ? new Date(p.applyEnd) : null,
        applyUrl: p.applyUrl || '',
        tags: p.tags || '',
      }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ ok: false, error: '정책을 찾을 수 없거나 권한이 없습니다' });
    }

    await conn.commit();
    res.json({ ok: true, message: '정책이 수정되었습니다' });
  } catch (err: any) {
    console.error('admin PUT error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// === 정책 삭제 (soft delete) ===
router.delete('/policies/:id', adminAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `UPDATE POLICY_MASTER SET STATUS = 'DELETED', UPDATED_AT = SYSDATE
       WHERE ID = :id AND TENANT_ID = 'DEMO_GOV' AND SOURCE = 'local'`,
      [req.params.id]
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ ok: false, error: '정책을 찾을 수 없습니다' });
    }

    await conn.commit();
    res.json({ ok: true, message: '정책이 삭제되었습니다' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

export default router;