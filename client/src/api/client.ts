import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3301',
  timeout: 5000,
});

// 헬스 체크 (서버 상태 확인용)
export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}