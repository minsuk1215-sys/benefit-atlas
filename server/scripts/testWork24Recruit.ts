import { fetchRecruitList } from '../src/services/work24';
import 'dotenv/config';

async function test() {
  console.log('work24 채용정보 호출 테스트...\n');

  console.log('--- JSON 시도 ---');
  try {
    const data = await fetchRecruitList({
      startPage: 1,
      display: 5,
      returnType: 'JSON',
    });

    const str = JSON.stringify(data, null, 2);
    console.log('응답 길이:', str.length);
    console.log('응답 시작 (1500자):');
    console.log(str.substring(0, 1500));

    // 데이터 추출 시도
    let items: any[] = [];
    if (data?.wantedRoot?.wanted) {
      items = Array.isArray(data.wantedRoot.wanted) ? data.wantedRoot.wanted : [data.wantedRoot.wanted];
    } else if (Array.isArray(data?.wanted)) {
      items = data.wanted;
    } else if (Array.isArray(data?.wantedRoot)) {
      items = data.wantedRoot;
    }

    if (items.length > 0) {
      console.log(`\n총 ${items.length}건 추출됨`);
      console.log('\n첫 번째 채용공고:');
      console.log(JSON.stringify(items[0], null, 2));
      return; // JSON 성공
    } else {
      console.log('\n⚠️ JSON 응답이지만 데이터 배열 못 찾음');
    }
  } catch (err: any) {
    if (typeof err.response?.data === 'string' && err.response.data.startsWith('<')) {
      console.log('\n[JSON 실패 → XML 응답으로 추측됨]');
    } else {
      console.log('JSON 호출 실패:', err.response?.status, err.message);
    }
  }

  console.log('\n--- XML 시도 ---');
  try {
    const data = await fetchRecruitList({
      startPage: 1,
      display: 5,
      returnType: 'XML',
    });

    const xmlStr = typeof data === 'string' ? data : JSON.stringify(data);
    console.log('응답 길이:', xmlStr.length);
    console.log('응답 시작 (2000자):');
    console.log(xmlStr.substring(0, 2000));
  } catch (err: any) {
    console.error('XML 호출도 실패:', err.message);
  }
}

test();