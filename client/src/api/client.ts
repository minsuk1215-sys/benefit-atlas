import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3301',
  timeout: 10000,
});

// Health check
export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}

// Policy interface
export interface Policy {
  ID: string;
  TITLE: string;
  ORG: string;
  CATEGORY: string;
  LIFECYCLE: string;
  TARGET_AGE_MIN: number | null;
  TARGET_AGE_MAX: number | null;
  APPLY_END: string | null;
  APPLY_URL: string | null;
  TAGS: string;
}

export interface PolicyListResponse {
  ok: boolean;
  total: number;
  count: number;
  data: Policy[];
}

// Fetch policy list
export async function fetchPolicies(params: {
  limit?: number;
  offset?: number;
  category?: string;
  lifecycle?: string;
} = {}): Promise<PolicyListResponse> {
  const { data } = await api.get('/api/policies', { params });
  return data;
}

// Fetch policy detail
export async function fetchPolicyDetail(id: string) {
  const { data } = await api.get(`/api/policies/${id}`);
  return data;
}