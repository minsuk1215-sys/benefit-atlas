import type { UserProfile } from '../pages/SearchPage';

const PROFILE_KEY = 'benefitatlas_profile';
const SAVED_KEY = 'benefitatlas_saved';

// 프로필 저장/조회
export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

// 관심 정책 저장/조회 (다음 STEP에서 사용)
export function getSavedPolicies(): string[] {
  const raw = localStorage.getItem(SAVED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function toggleSavedPolicy(policyId: string): string[] {
  const saved = getSavedPolicies();
  const next = saved.includes(policyId)
    ? saved.filter(id => id !== policyId)
    : [...saved, policyId];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}

export function isPolicySaved(policyId: string): boolean {
  return getSavedPolicies().includes(policyId);
}