import { fetchServiceList } from '../src/services/gov24';

async function test() {
  console.log('공공서비스 API 호출 시작...\n');
  
  const result = await fetchServiceList(1, 5); // 첫 5건만 가져오기
  
  console.log('===== 응답 메타 =====');
  console.log('totalCount:', result.totalCount);
  console.log('currentCount:', result.currentCount);
  console.log('matchCount:', result.matchCount);
  console.log('page:', result.page);
  console.log('perPage:', result.perPage);
  
  console.log('\n===== 첫 번째 정책 (전체 필드 확인) =====');
  if (result.data && result.data.length > 0) {
    console.log(JSON.stringify(result.data[0], null, 2));
  }
  
  console.log('\n===== 5건 요약 =====');
  result.data?.forEach((p: any, i: number) => {
    console.log(`${i + 1}. [${p['소관기관명']}] ${p['서비스명']}`);
  });
}

test().catch(err => {
  console.error('테스트 실패:', err.message);
});