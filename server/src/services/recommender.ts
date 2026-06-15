// 사용자 프로필 기반 추천 엔진

export interface UserProfile {
  age?: number;
  gender?: string;
  job?: string;
  region?: string;
  marriage?: string;
  children?: string;
  childAge?: number;
  income?: string;
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
  REGION?: string;
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

// 광역 시·도 키워드 매핑
const REGION_KEYWORDS: Record<string, string[]> = {
  '서울': ['서울'],
  '경기': ['경기'],
  '인천': ['인천'],
  '부산': ['부산'],
  '대구': ['대구'],
  '광주': ['광주'],
  '대전': ['대전'],
  '울산': ['울산'],
  '세종': ['세종'],
  '강원': ['강원'],
  '충북': ['충북', '충청북도'],
  '충남': ['충남', '충청남도'],
  '전북': ['전북', '전라북도'],
  '전남': ['전남', '전라남도'],
  '경북': ['경북', '경상북도'],
  '경남': ['경남', '경상남도'],
  '제주': ['제주'],
};


// 정책별 점수 계산
export function scorePolicy(profile: UserProfile, policy: Policy): number {
  let score = 0;
  const age = profile.age || 0;

  // 0. 지역 매칭
  if (profile.region && policy.REGION) {
    const pRegion = policy.REGION.trim();

    // 정책이 명백히 "전국"이면 통과
    const isNationwide = pRegion === '전국' || pRegion.includes('전국');

    if (!isNationwide) {
      // 사용자 지역 키워드들
      const userKeywords = REGION_KEYWORDS[profile.region] || [profile.region];

      // 사용자 지역 일치 여부
      const isMatch = userKeywords.some(kw => pRegion.includes(kw));

      if (isMatch) {
        score += 20;  // 지역 일치 보너스
      } else {
        // 다른 광역 키워드가 정책 REGION에 있으면 탈락
        let isOtherRegion = false;
        for (const [otherRegion, otherKeywords] of Object.entries(REGION_KEYWORDS)) {
          if (otherRegion === profile.region) continue;
          for (const kw of otherKeywords) {
            if (pRegion.includes(kw)) {
              isOtherRegion = true;
              break;
            }
          }
          if (isOtherRegion) break;
        }

        if (isOtherRegion) return 0;  // 다른 지역 정책 탈락
      }
    }
  }

  // 1. 나이 조건 매칭 (가장 강력)
  if (policy.TARGET_AGE_MIN != null && policy.TARGET_AGE_MAX != null) {
    if (age >= policy.TARGET_AGE_MIN && age <= policy.TARGET_AGE_MAX) {
      score += 50;
    } else {
      return 0;
    }
  }
  // ...이하 기존 코드 그대로

  // 2. 생애주기 매칭
  const userStages = inferUserLifecycle(profile);
  const policyStages = (policy.LIFECYCLE || '').split(',');
  const matchedStages = userStages.filter(s => policyStages.includes(s));
  if (matchedStages.length > 0) {
    score += 30 * matchedStages.length;
  } else if (policyStages.includes('all')) {
    score += 5;
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