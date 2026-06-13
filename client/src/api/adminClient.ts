import axios from 'axios';
import { getAdminToken, clearAdminAuth } from '../utils/adminAuth';

const apiBaseUrl = `http://${window.location.hostname}:3301`;

export const adminApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

// 모든 요청에 토큰 자동 첨부
adminApi.interceptors.request.use(config => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// 401 받으면 로그아웃 처리
adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearAdminAuth();
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export interface AdminPolicy {
  ID: string;
  TITLE: string;
  CATEGORY: string;
  LIFECYCLE: string;
  ORG: string;
  REGION: string;
  DESCRIPTION?: string;
  TARGET_TEXT?: string;
  TARGET_AGE_MIN: number | null;
  TARGET_AGE_MAX: number | null;
  APPLY_END: string | null;
  APPLY_URL?: string;
  TAGS?: string;
  STATUS: string;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

export interface AdminPolicyInput {
  title: string;
  category: string;
  lifecycle?: string;
  org?: string;
  region?: string;
  description?: string;
  targetText?: string;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
  applyEnd?: string | null;
  applyUrl?: string;
  tags?: string;
}

export async function adminLogin(username: string, password: string) {
  const { data } = await adminApi.post('/admin/login', { username, password });
  return data;
}

export async function fetchAdminPolicies() {
  const { data } = await adminApi.get('/admin/policies');
  return data;
}

export async function fetchAdminPolicy(id: string) {
  const { data } = await adminApi.get('/admin/policies/' + id);
  return data;
}

export async function createAdminPolicy(input: AdminPolicyInput) {
  const { data } = await adminApi.post('/admin/policies', input);
  return data;
}

export async function updateAdminPolicy(id: string, input: AdminPolicyInput) {
  const { data } = await adminApi.put('/admin/policies/' + id, input);
  return data;
}

export async function deleteAdminPolicy(id: string) {
  const { data } = await adminApi.delete('/admin/policies/' + id);
  return data;
}