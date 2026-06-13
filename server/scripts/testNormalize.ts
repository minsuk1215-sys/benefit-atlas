import { fetchServiceList } from '../src/services/gov24';
import { normalizeGov24 } from '../src/utils/normalize';

async function test() {
  console.log('정규화 테스트 시작...\n');
  
  const result = await fetchServiceList(1, 5);
  
  result.data?.forEach((item: any, i: number) => {
    const normalized = normalizeGov24(item);
    console.log(`\n===== ${i + 1}. ${normalized.title} =====`);
    console.log('원본 서비스분야:', item.서비스분야);  // ← 이 줄 추가    
    console.log('카테고리:', normalized.category);
    console.log('생애주기:', normalized.lifecycle);
    console.log('주관:', normalized.org);
    console.log('연령:', normalized.targetAgeMin, '~', normalized.targetAgeMax);
    console.log('마감:', normalized.applyEnd);
    console.log('URL:', normalized.applyUrl);
    console.log('태그:', normalized.tags);
  });
}

test().catch(console.error);