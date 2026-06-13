import axios from 'axios';
import 'dotenv/config';

const BASE = 'https://www.youthcenter.go.kr/go/ythip/getPlcy';

export async function fetchYouthList(pageNum: number = 1, pageSize: number = 100) {
  try {
    const { data } = await axios.get(BASE, {
      params: {
        apiKeyNm: process.env.YOUTH_POLICY_KEY,
        rtnType: 'json',
        pageNum,
        pageSize,
      },
      timeout: 15000,
    });
    return data;
  } catch (err: any) {
    console.error('youth API 호출 실패:', err.response?.data || err.message);
    throw err;
  }
}