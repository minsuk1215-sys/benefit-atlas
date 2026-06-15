import { fetchTomorrowCardCourses } from '../src/services/work24';
import 'dotenv/config';

async function test() {
  console.log('work24 국민내일배움카드 훈련과정 호출...\n');

  // 향후 3개월 범위
  const today = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + 3);

  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + m + day;
  };

  try {
    const data = await fetchTomorrowCardCourses({
      pageNum: 1,
      pageSize: 5,
      srchTraStDt: ymd(today),
      srchTraEndDt: ymd(future),
    });

    console.log('===== 응답 (처음 3000자) =====');
    const str = JSON.stringify(data, null, 2);
    console.log(str.substring(0, 3000));

       // 실제 응답: data.srchList가 배열
    let items: any[] = [];
    if (Array.isArray(data?.srchList)) {
      items = data.srchList;
    } else if (data?.HRDNet?.srchList?.scn_list) {
      items = Array.isArray(data.HRDNet.srchList.scn_list)
        ? data.HRDNet.srchList.scn_list
        : [data.HRDNet.srchList.scn_list];
    }

    // 총 건수는 응답 root 또는 다른 필드에서
    const totalCount = data?.scn_cnt || data?.HRDNet?.scn_cnt || '?';
    console.log('\n===== 추출 결과 =====');
    console.log('총 건수:', totalCount);
    console.log('현재 페이지 건수:', items.length);

    if (items.length > 0) {
      console.log('\n===== 첫 번째 훈련과정 (전체 필드) =====');
      console.log(JSON.stringify(items[0], null, 2));
    } else {
      console.log('⚠️ 데이터 없음. 응답 구조 확인 필요');
    }
  } catch (err: any) {
    console.error('호출 실패:');
    console.error('  status:', err.response?.status);
    console.error('  message:', err.message);
    if (err.response?.data) {
      const errData = typeof err.response.data === 'string'
        ? err.response.data.substring(0, 500)
        : JSON.stringify(err.response.data).substring(0, 500);
      console.error('  data:', errData);
    }
  }
}

test();