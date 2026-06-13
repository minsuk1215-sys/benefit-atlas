// 사용자 프로필 기반 추천 엔진

export interface UserProfile {
  age?: number;
  gender?: string;
  job?: string;        // 재직자, 구직자, 학생, 자영업, 예비창업, 무직
  region?: string;     // 시도명
  marriage?: string;   // 미혼, 기혼, 예비, 한부모
  children?: string;   // 없음, 임신중, 1명, 2명, 3명 이상
  childAge?: number;
  income?: string;     // 50%, 80%, 100%, 150%
}

export interface Policy {
  ID: string;
  TITLE: string;
  ORG: string;
  CATEGORY: string;
  LIFECYCLE: string;
  TARGET_AGE_MIN: number | null;
  TARGET_AGE_MAX: number | null;
  TAGS: string;
  APPLY_END: Date | null;
  APPLY_URL: string;
  DESCRIPTION?: string;
  TARGET_TEXT?: string;
}

// 사용자의 생애주기 추론
export function inferUserLifecycle(profile: UserProfile): string[] {
  const stages: string[] = [];
  const age = profile.age || 0;

  if (profile.children === '임신중') stages.push('birth');
  if (profile.children && profile.children !== '없음' && profile.children !== '임신중') {
    const childAge = profile.childAge || 0;
    if (childAge < 3) stages.push('birth', 'care');
    else if (childAge < 8) stages.push('care');
    else if (childAge < 19) stages.push('youth');
  }

  if (profile.marriage === '예비' || (profile.marriage === '기혼' && age < 40)) {
    stages.push('marry');
  }

  if (age >= 19 && age <= 34) stages.push('youth');
  if (age >= 50 && age < 65) stages.push('senior');
  if (age >= 65) stages.push('senior');

  return stages.length > 0 ? stages : ['all'];
}

// 정책별 점수 계산
export function scorePolicy(profile: UserProfile, policy: Policy): number {
  let score = 0;
  const age = profile.age || 0;

  // 1. 나이 조건 매칭 (가장 강력)
  if (policy.TARGET_AGE_MIN != null && policy.TARGET_AGE_MAX != null) {
    if (age >= policy.TARGET_AGE_MIN && age <= policy.TARGET_AGE_MAX) {
      score += 50;
    } else {
      return 0; // 나이 미달/초과는 즉시 탈락
    }
  } else if (policy.TARGET_AGE_MIN != null) {
    if (age >= policy.TARGET_AGE_MIN) score += 30;
    else return 0;
  } else if (policy.TARGET_AGE_MAX != null) {
    if (age <= policy.TARGET_AGE_MAX) score += 30;
    else return 0;
  }

  // 2. 생애주기 매칭
  const userStages = inferUserLifecycle(profile);
  const policyStages = (policy.LIFECYCLE || '').split(',');
  const matchedStages = userStages.filter(s => policyStages.includes(s));
  if (matchedStages.length > 0) {
    score += 30 * matchedStages.length;
  } else if (policyStages.includes('all')) {
    score += 5; // 모두 대상 정책은 기본 점수
  }

  // 3. 직업 매칭
  if (profile.job === '구직자' && policy.CATEGORY?.includes('고용')) score += 20;
  if (profile.job === '예비창업' && policy.CATEGORY?.includes('창업')) score += 25;
  if (profile.job === '학생' && policy.CATEGORY?.includes('교육')) score += 20;
  if (profile.job === '재직자' && policy.CATEGORY?.includes('고용')) score += 10;

  // 4. 자녀 매칭
  if (profile.children && profile.children !== '없음') {
    if (policy.CATEGORY?.includes('보육') || policy.CATEGORY?.includes('교육')) score += 25;
    if (policy.LIFECYCLE?.includes('care') || policy.LIFECYCLE?.includes('birth')) score += 15;
  }

  // 5. 마감 임박 가점 (30일 이내)
  if (policy.APPLY_END) {
    const now = new Date();
    const daysLeft = (policy.APPLY_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft > 0 && daysLeft < 30) score += 5;
  }

  return score;
}