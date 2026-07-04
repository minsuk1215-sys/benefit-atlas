import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

const CREATE_TABLE_SQL = `
CREATE TABLE POLICY_MASTER (
  ID VARCHAR2(40) NOT NULL,
  TENANT_ID VARCHAR2(20) NOT NULL,
  SOURCE VARCHAR2(20) NOT NULL,
  SOURCE_ID VARCHAR2(60) NOT NULL,
  CATEGORY VARCHAR2(40),
  LIFECYCLE VARCHAR2(200),
  TITLE VARCHAR2(500) NOT NULL,
  ORG VARCHAR2(200),
  DESCRIPTION CLOB,
  AMOUNT_TEXT VARCHAR2(500),
  TARGET_AGE_MIN NUMBER,
  TARGET_AGE_MAX NUMBER,
  REGION VARCHAR2(100),
  APPLY_START DATE,
  APPLY_END DATE,
  APPLY_URL VARCHAR2(1000),
  TAGS VARCHAR2(1000),
  STATUS VARCHAR2(20),
  LAST_SYNC DATE,
  CREATED_AT DATE,
  UPDATED_AT DATE,
  TARGET_TEXT CLOB,
  CONSTRAINT PK_POLICY_MASTER PRIMARY KEY (ID)
)`;

const INDEXES = [
  { name: 'IDX_POLICY_AGE', sql: 'CREATE INDEX IDX_POLICY_AGE ON POLICY_MASTER(TARGET_AGE_MIN, TARGET_AGE_MAX)' },
  { name: 'IDX_POLICY_DEADLINE', sql: 'CREATE INDEX IDX_POLICY_DEADLINE ON POLICY_MASTER(APPLY_END)' },
  { name: 'IDX_POLICY_LIFECYCLE', sql: 'CREATE INDEX IDX_POLICY_LIFECYCLE ON POLICY_MASTER(LIFECYCLE)' },
  { name: 'IDX_POLICY_STATUS', sql: 'CREATE INDEX IDX_POLICY_STATUS ON POLICY_MASTER(STATUS)' },
  { name: 'IDX_POLICY_TENANT_CAT', sql: 'CREATE INDEX IDX_POLICY_TENANT_CAT ON POLICY_MASTER(TENANT_ID, CATEGORY)' },
  { name: 'UQ_POLICY_SOURCE', sql: 'CREATE UNIQUE INDEX UQ_POLICY_SOURCE ON POLICY_MASTER(SOURCE, SOURCE_ID, TENANT_ID)' },
];

async function main() {
  console.log('=== BENEFIT 스키마에 테이블 생성 ===\n');

  process.env.TNS_ADMIN = WALLET_PATH;

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'BENEFIT',
      password: process.env.BENEFIT_DB_PASSWORD,
      connectString: 'benefitatlas_high',
      walletLocation: WALLET_PATH,
      walletPassword: process.env.WALLET_PASSWORD,
    });

    console.log('✅ BENEFIT 접속 성공\n');

    // 1. 기존 테이블 존재 확인
    const check = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM USER_TABLES WHERE TABLE_NAME = 'POLICY_MASTER'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if ((check.rows![0] as any).CNT > 0) {
      console.log('⚠️ POLICY_MASTER 이미 존재. 스킵.');
      console.log('   재생성하려면 먼저 DROP TABLE POLICY_MASTER 실행 필요');
      return;
    }

    // 2. 테이블 생성
    console.log('1. POLICY_MASTER 테이블 생성...');
    await conn.execute(CREATE_TABLE_SQL);
    console.log('   ✅ 테이블 생성 완료 (22개 컬럼)');

    // 3. 인덱스 생성
    console.log('\n2. 인덱스 생성...');
    for (const idx of INDEXES) {
      try {
        await conn.execute(idx.sql);
        console.log(`   ✅ ${idx.name}`);
      } catch (e: any) {
        console.log(`   ⚠️ ${idx.name}: ${e.message.substring(0, 60)}`);
      }
    }

    // 4. 검증
    console.log('\n3. 최종 검증...');
    const cols = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'POLICY_MASTER'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`   컬럼 수: ${(cols.rows![0] as any).CNT} (예상: 22)`);

    const idxs = await conn.execute(
      `SELECT INDEX_NAME FROM USER_INDEXES WHERE TABLE_NAME = 'POLICY_MASTER' ORDER BY INDEX_NAME`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`   인덱스 수: ${idxs.rows!.length}`);
    idxs.rows!.forEach((r: any) => console.log(`     - ${r.INDEX_NAME}`));

    console.log('\n✅ 완료! 테이블 준비 끝.');
    console.log('\n다음 단계: 로컬 데이터를 클라우드로 이전 (6,940건)');
  } catch (err: any) {
    console.error('\n❌ 오류:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

main();