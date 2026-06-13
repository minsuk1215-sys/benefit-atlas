import { fetchYouthList } from '../src/services/youth';
import { normalizeYouth } from '../src/utils/normalize';

async function test() {
  console.log('온통청년 정규화 테스트...\n');
  const result = await fetchYouthList(1, 5);
  const policies = result?.result?.youthPolicyList || [];

  policies.forEach((item: any, i: number) => {
    const n = normalizeYouth(item);
    console.log(`\n===== ${i + 1}. ${n.title} =====`);
    console.log('카테고리:', n.category);
    console.log('생애주기:', n.lifecycle);
    console.log('주관:', n.org);
    console.log('지역:', n.region);
    console.log('연령:', n.targetAgeMin, '~', n.targetAgeMax);
    console.log('마감:', n.applyEnd);
    console.log('URL:', n.applyUrl?.substring(0, 60));
    console.log('태그:', n.tags);
  });
}

test().catch(console.error);