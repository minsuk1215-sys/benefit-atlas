import fs from 'fs';
import path from 'path';
import { initPool, getConnection, closePool } from '../src/db';

async function runMigration(filename: string) {
  await initPool();
  const conn = await getConnection();
  
  try {
    const sqlPath = path.join(__dirname, '../../db/migrations', filename);
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // 세미콜론으로 SQL 분할 (CLOB이나 복잡한 쿼리는 다른 처리 필요하지만 우리는 OK)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 60) + '...');
      await conn.execute(stmt);
    }
    
    await conn.commit();
    console.log(`\n✅ Migration applied: ${filename}`);
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    await conn.rollback();
  } finally {
    await conn.close();
    await closePool();
  }
}

runMigration('001_create_policy_master.sql');