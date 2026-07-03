import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { initPool, getConnection, closePool } from '../src/db';

// ============== 로그 파일 관리 ==============

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const today = new Date();
const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
const LOG_FILE = path.join(LOG_DIR, `sync_${ymd}.log`);

function log(msg: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

// ============== 개별 sync 스크립트 실행 ==============

function runScript(scriptName: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    log(`▶ ${scriptName} 실행 시작`);

    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('npx', ['ts-node', scriptPath], {
      cwd: path.join(__dirname, '..'),
      shell: true,
    });

    let output = '';
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // 실시간 콘솔 출력 (로그 파일에는 요약만)
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      const success = code === 0;
      log(`${success ? '✅' : '❌'} ${scriptName} ${success ? '완료' : '실패 (코드: ' + code + ')'}`);
      resolve({ success, output });
    });

    child.on('error', (err) => {
      log(`❌ ${scriptName} 실행 오류: ${err.message}`);
      resolve({ success: false, output: err.message });
    });
  });
}

// ============== 만료 정책 상태 업데이트 ==============

async function updateExpiredPolicies(): Promise<{ count: number }> {
  log('▶ 만료 정책 상태 업데이트 시작');

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE POLICY_MASTER
       SET STATUS = 'EXPIRED', UPDATED_AT = SYSDATE
       WHERE STATUS = 'ACTIVE'
         AND APPLY_END IS NOT NULL
         AND APPLY_END < SYSDATE`,
      [],
      { autoCommit: true }
    );

    const count = result.rowsAffected || 0;
    log(`✅ 만료 처리: ${count}건`);
    return { count };
  } catch (err: any) {
    log(`❌ 만료 처리 실패: ${err.message}`);
    return { count: 0 };
  } finally {
    if (conn) await conn.close();
  }
}

// ============== DB 통계 요약 ==============

async function getDbStats(): Promise<string> {
  let conn;
  try {
    conn = await getConnection();

    const total = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM POLICY_MASTER WHERE STATUS = 'ACTIVE'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const bySource = await conn.execute(
      `SELECT SOURCE, COUNT(*) AS CNT FROM POLICY_MASTER
       WHERE STATUS = 'ACTIVE' GROUP BY SOURCE ORDER BY CNT DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const totalCount = (total.rows![0] as any).CNT;
    const sourceStats = bySource.rows!
      .map((r: any) => `  ${r.SOURCE}: ${r.CNT}건`)
      .join('\n');

    return `총 활성 정책: ${totalCount}건\n${sourceStats}`;
  } catch (err: any) {
    return `통계 조회 실패: ${err.message}`;
  } finally {
    if (conn) await conn.close();
  }
}

// ============== 오래된 로그 파일 정리 (30일 이상) ==============

function cleanOldLogs() {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    let deleted = 0;
    files.forEach(file => {
      if (!file.startsWith('sync_') || !file.endsWith('.log')) return;
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > THIRTY_DAYS) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    });

    if (deleted > 0) log(`🧹 오래된 로그 ${deleted}개 삭제`);
  } catch (err: any) {
    log(`⚠️ 로그 정리 실패: ${err.message}`);
  }
}

// ============== 메인 ==============

async function syncAll() {
  const startTime = Date.now();

  log('========================================');
  log('🚀 BenefitAtlas 통합 동기화 시작');
  log('========================================');

  const results: Record<string, boolean> = {};

  // 1. 정부24
  results['gov24'] = (await runScript('syncPolicies.ts')).success;

  // 2. 온통청년
  results['youth'] = (await runScript('syncYouth.ts')).success;

  // 3. work24 K-디지털 훈련
  results['work24_training'] = (await runScript('syncWork24Training.ts')).success;

  // 4. work24 추가 (일학습병행 + 사업주훈련) — 활성화 시 자동 적재
  //    실패해도 전체 중단 안 함 (활성화 대기 중)
  const otherScript = path.join(__dirname, 'syncWork24Others.ts');
  if (fs.existsSync(otherScript)) {
    results['work24_others'] = (await runScript('syncWork24Others.ts')).success;
  }

  // 5. 만료 정책 상태 업데이트
  await initPool();
  const expired = await updateExpiredPolicies();

  // 6. 통계 요약
  log('\n📊 DB 통계 (동기화 후)');
  const stats = await getDbStats();
  log(stats);

  await closePool();

  // 7. 오래된 로그 정리
  cleanOldLogs();

  // 최종 요약
  const durationMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  log('\n========================================');
  log('📋 최종 결과');
  log('========================================');
  Object.entries(results).forEach(([name, success]) => {
    log(`  ${success ? '✅' : '❌'} ${name}`);
  });
  log(`  만료 처리: ${expired.count}건`);
  log(`  총 소요 시간: ${durationMin}분`);
  log('========================================\n');

  const allSuccess = Object.values(results).every(v => v);
  process.exit(allSuccess ? 0 : 1);
}

syncAll().catch(err => {
  log(`❌ 치명적 오류: ${err.message}`);
  console.error(err);
  process.exit(1);
});