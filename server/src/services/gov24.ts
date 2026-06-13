import axios from 'axios';
import 'dotenv/config';

const BASE = 'https://api.odcloud.kr/api/gov24/v3';

// 정책 목록 조회 (서비스 목록 API)
export async function fetchServiceList(page: number = 1, perPage: number = 100) {
  try {
    const { data } = await axios.get(`${BASE}/serviceList`, {
      params: {
        page,
        perPage,
        serviceKey: process.env.GOV24_KEY,
      },
      timeout: 10000,
    });
    return data;
  } catch (err: any) {
    console.error('gov24 API 호출 실패:', err.response?.data || err.message);
    throw err;
  }
}

// 정책 상세 조회
export async function fetchServiceDetail(serviceIds: string[]) {
  try {
    const { data } = await axios.get(`${BASE}/serviceDetail`, {
      params: {
        page: 1,
        perPage: serviceIds.length,
        serviceKey: process.env.GOV24_KEY,
        cond: { '서비스ID:in': serviceIds.join(',') },
      },
      timeout: 10000,
    });
    return data;
  } catch (err: any) {
    console.error('gov24 상세 호출 실패:', err.response?.data || err.message);
    throw err;
  }
}