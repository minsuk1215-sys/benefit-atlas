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

// ============== 내 일정 ==============

export interface UserSchedule {
  id: string;           // 일정 고유 ID (timestamp 기반)
  policyId: string;     // 정책 ID
  policyTitle: string;  // 정책 제목 (조회 편의)
  policyOrg: string;    // 정책 기관 (조회 편의)
  applyDate: string;    // 신청 예정일 (YYYY-MM-DD)
  memo: string;         // 사용자 메모
  createdAt: string;    // 추가 시각
}

const SCHEDULES_KEY = 'benefitatlas_schedules';

export function getSchedules(): UserSchedule[] {
  const raw = localStorage.getItem(SCHEDULES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addSchedule(schedule: Omit<UserSchedule, 'id' | 'createdAt'>): UserSchedule {
  const newItem: UserSchedule = {
    ...schedule,
    id: 'sch_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  const all = getSchedules();
  all.push(newItem);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(all));
  return newItem;
}

export function removeSchedule(scheduleId: string): UserSchedule[] {
  const all = getSchedules().filter(s => s.id !== scheduleId);
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(all));
  return all;
}

export function getSchedulesForPolicy(policyId: string): UserSchedule[] {
  return getSchedules().filter(s => s.policyId === policyId);
}