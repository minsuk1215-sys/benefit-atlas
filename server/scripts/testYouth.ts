import axios from 'axios';
import 'dotenv/config';

async function test() {
  console.log('온통청년 API 호출 시작...\n');

  try {
    const { data } = await axios.get('https://www.youthcenter.go.kr/go/ythip/getPlcy', {
      params: {
        apiKeyNm: process.env.YOUTH_POLICY_KEY,
        rtnType: 'json',
        pageNum: 1,
        pageSize: 5,
      },
      timeout: 10000,
    });

    console.log('===== 응답 구조 =====');
    console.log(JSON.stringify(data, null, 2).substring(0, 3000));

    // 데이터 추출 시도 (응답 구조가 어떻든)
    let policies = [];
    if (data?.result?.youthPolicyList) {
      policies = data.result.youthPolicyList;
    } else if (data?.youthPolicyList) {
      policies = data.youthPolicyList;
    } else if (Array.isArray(data)) {
      policies = data;
    }

    if (policies.length > 0) {
      console.log('\n===== 첫 번째 정책 (전체 필드) =====');
      console.log(JSON.stringify(policies[0], null, 2));
    } else {
      console.log('\n⚠️  정책 배열을 못 찾았어요. 응답 구조 확인 필요');
    }
  } catch (err: any) {
    console.error('호출 실패:', err.response?.data || err.message);
  }
}

test();