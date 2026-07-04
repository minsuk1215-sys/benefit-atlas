import 'dotenv/config';
import oracledb from 'oracledb';
import path from 'path';

const WALLET_PATH = path.resolve(__dirname, '..', 'wallet_cloud');

async function test() {
  console.log('=== 클라우드 INSERT 테스트 ===\n');

  process.env.TNS_ADMIN = WALLET_PATH;

  const conn = await oracledb.getConnection({
    user: 'BENEFIT',
    password: process.env.BENEFIT_DB_PASSWORD,
    connectString: 'benefitatlas_high',
    walletLocation: WALLET_PATH,
    walletPassword: process.env.WALLET_PASSWORD,
  });

  console.log('✅ 연결\n');

  // 1. 아주 단순한 INSERT 시도
  console.log('시도 1: 최소 필드 (필수 컬럼만)');
  try {
    await conn.execute(
      `INSERT INTO POLICY_MASTER
        (ID, TENANT_ID, SOURCE, SOURCE_ID, TITLE, STATUS)
       VALUES
        (:v_id, :v_tenant, :v_source, :v_sourceid, :v_title, :v_status)`,
      {
        v_id: 'TEST_001',
        v_tenant: 'DEFAULT',
        v_source: 'test',
        v_sourceid: 'test_001',
        v_title: '테스트 정책',
        v_status: 'ACTIVE',
      }
    );
    await conn.commit();
    console.log('   ✅ 시도 1 성공\n');

    // 삭제 (테스트 데이터)
    await conn.execute(`DELETE FROM POLICY_MASTER WHERE ID = 'TEST_001'`);
    await conn.commit();
    console.log('   (테스트 데이터 삭제 완료)\n');
  } catch (err: any) {
    console.error('   ❌ 시도 1 실패:', err.message);
    console.log('   → 최소 필드조차 안 됨. 스키마 문제일 수 있음.\n');
  }

  // 2. 모든 필드 (긴 이름 접두사 사용)
  console.log('시도 2: 모든 필드 (긴 접두사)');
  try {
    await conn.execute(
      `INSERT INTO POLICY_MASTER
        (ID, TENANT_ID, SOURCE, SOURCE_ID, CATEGORY, LIFECYCLE, TITLE, ORG,
         AMOUNT_TEXT, TARGET_AGE_MIN, TARGET_AGE_MAX, REGION,
         APPLY_START, APPLY_END, APPLY_URL, TAGS, STATUS,
         LAST_SYNC, CREATED_AT, UPDATED_AT)
       VALUES
        (:bind_id, :bind_tenant_id, :bind_source, :bind_source_id,
         :bind_category, :bind_lifecycle, :bind_title, :bind_org,
         :bind_amount_text, :bind_age_min, :bind_age_max, :bind_region,
         :bind_apply_start, :bind_apply_end, :bind_apply_url, :bind_tags, :bind_status,
         :bind_last_sync, :bind_created_at, :bind_updated_at)`,
      {
        bind_id: 'TEST_002',
        bind_tenant_id: 'DEFAULT',
        bind_source: 'test',
        bind_source_id: 'test_002',
        bind_category: '테스트',
        bind_lifecycle: 'all',
        bind_title: '테스트 정책 2',
        bind_org: '테스트 기관',
        bind_amount_text: '월 10만원',
        bind_age_min: 20,
        bind_age_max: 40,
        bind_region: '전국',
        bind_apply_start: new Date(),
        bind_apply_end: new Date(),
        bind_apply_url: 'https://test.com',
        bind_tags: '테스트,정책',
        bind_status: 'ACTIVE',
        bind_last_sync: new Date(),
        bind_created_at: new Date(),
        bind_updated_at: new Date(),
      }
    );
    await conn.commit();
    console.log('   ✅ 시도 2 성공! (모든 필드)\n');

    await conn.execute(`DELETE FROM POLICY_MASTER WHERE ID = 'TEST_002'`);
    await conn.commit();
  } catch (err: any) {
    console.error('   ❌ 시도 2 실패:', err.message);
  }

  await conn.close();
}

test().catch(console.error);