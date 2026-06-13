// 정부24 공공서비스 API 응답을 POLICY_MASTER 스키마로 정규화

interface Gov24Item {
  서비스ID: string;
  서비스명: string;
  서비스목적요약?: string;
  서비스분야?: string;
  선정기준?: string;
  소관기관명?: string;
  소관기관유형?: string;
  신청기한?: string;
  신청방법?: string;
  지원내용?: string;
  지원대상?: string;
  지원유형?: string;
  사용자구분?: string;
  상세조회URL?: string;
  등록일시?: string;
  수정일시?: string;
}

export interface NormalizedPolicy {
  id: string;
  tenantId: string;
  source: string;
  sourceId: string;
  category: string | null;
  lifecycle: string;
  title: string;
  org: string | null;
  description: string;
  amountText: string | null;
  targetText: string | null;
  targetAgeMin: number | null;
  targetAgeMax: number | null;
  region: string;
  applyStart: Date | null;
  applyEnd: Date | null;
  applyUrl: string | null;
  tags: string;
  status: string;
}

// 생애주기 자동 분류
function inferLifecycle(item: Gov24Item): string[] {
  const title = item.서비스명 || '';
  const field = item.서비스분야 || '';
  const target = item.지원대상 || '';
  const allText = title + ' ' + field + ' ' + target;

  const lifecycles: string[] = [];

  // 출산 단계
  if (/임신|출산|산모|태아|영아|영유아/.test(allText)) {
    lifecycles.push('birth');
  }

  // 육아 단계 (3~7세, 보육·유아교육)
  if (
    /유아|영유아|보육|어린이집|유치원|아동수당|아이돌봄/.test(allText) ||
    /(?<![0-9])([3-7])\s*세/.test(target)
  ) {
    if (!lifecycles.includes('care')) lifecycles.push('care');
  }

  // 청소년 (학령기, 8~18세)
  if (/청소년|중학생|고등학생|초등학생|학교|장학금/.test(allText)) {
    if (!lifecycles.includes('youth')) lifecycles.push('youth');
  }

  // 청년 (19~34세)
  if (
    /청년/.test(allText) ||
    /\b만\s*1[89]\s*세/.test(target) ||
    /\b만\s*2[0-9]\s*세/.test(target) ||
    /\b만\s*3[0-4]\s*세/.test(target) ||
    /\b1[89]\s*[~∼-]\s*3[0-9]/.test(target)
  ) {
    if (!lifecycles.includes('youth')) lifecycles.push('youth');
  }

  // 신혼·결혼
  if (/신혼|결혼|혼인|예비부부|신혼부부/.test(allText)) {
    lifecycles.push('marry');
  }

  // 중장년·노년
  if (/중장년|장년|은퇴|퇴직/.test(allText)) {
    lifecycles.push('senior');
  }
  if (/노년|노인|어르신|기초연금|독거노인/.test(allText)) {
    if (!lifecycles.includes('senior')) lifecycles.push('senior');
  }

  return lifecycles.length > 0 ? lifecycles : ['all'];
}

// 카테고리 매핑 (정부24의 실제 9개 분야 기준)
function mapCategory(serviceField: string | undefined): string {
  if (!serviceField) return '기타';

  if (serviceField.includes('임신') || serviceField.includes('출산')) return '출산지원';
  if (serviceField.includes('보육') || serviceField.includes('교육')) return '보육·교육';
  if (serviceField.includes('주거')) return '주거·자립';
  if (serviceField.includes('고용') || serviceField.includes('창업')) return '고용·창업';
  if (serviceField.includes('건강')) return '건강·의료';
  if (serviceField.includes('문화') || serviceField.includes('여가')) return '문화·여가';
  if (serviceField.includes('생활') || serviceField.includes('안전')) return '생활안정';
  if (serviceField.includes('보호') || serviceField.includes('돌봄')) return '보호·돌봄';
  if (serviceField.includes('농림') || serviceField.includes('수산') || serviceField.includes('해양')) return '농수산';
  if (serviceField.includes('행정') || serviceField.includes('환경')) return '행정·환경';

  return serviceField;
}

// 연령 범위 추출
function extractAgeRange(text: string | undefined): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };

  const m1 = text.match(/만?\s*(\d{1,2})\s*[~∼-]\s*(\d{1,2})\s*세/);
  if (m1) {
    return { min: parseInt(m1[1]), max: parseInt(m1[2]) };
  }

  const m2 = text.match(/만?\s*(\d{1,2})\s*세\s*이상/);
  if (m2) {
    return { min: parseInt(m2[1]), max: null };
  }

  const m3 = text.match(/만?\s*(\d{1,2})\s*세\s*미만/);
  if (m3) {
    return { min: null, max: parseInt(m3[1]) - 1 };
  }

  return { min: null, max: null };
}

// 신청기한 파싱
function parseApplyEnd(text: string | undefined): Date | null {
  if (!text) return null;

  if (/상시|수시|연중/.test(text)) return null;

  const m1 = text.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if (m1) {
    return new Date(parseInt(m1[1]), parseInt(m1[2]) - 1, parseInt(m1[3]));
  }

  const m2 = text.match(/(\d{4})(\d{2})(\d{2})/);
  if (m2) {
    return new Date(parseInt(m2[1]), parseInt(m2[2]) - 1, parseInt(m2[3]));
  }

  return null;
}

// 메인 정규화 함수
export function normalizeGov24(item: Gov24Item): NormalizedPolicy {
  const sourceId = item.서비스ID;
  const lifecycles = inferLifecycle(item);
  const ageRange = extractAgeRange(item.지원대상);

  const desc = [item.서비스목적요약, item.지원내용]
    .filter(Boolean)
    .join('\n\n');

  const tags = [
    item.지원유형,
    item.사용자구분,
    item.소관기관유형,
  ].filter(Boolean).join(',');

  return {
    id: 'gov24_' + sourceId,
    tenantId: 'COMMON',
    source: 'gov24',
    sourceId: sourceId,
    category: mapCategory(item.서비스분야),
    lifecycle: lifecycles.join(','),
    title: item.서비스명,
    org: item.소관기관명 || null,
    description: desc || item.서비스명,
    amountText: null,
    targetText: item.지원대상 || null,
    targetAgeMin: ageRange.min,
    targetAgeMax: ageRange.max,
    region: '전국',
    applyStart: null,
    applyEnd: parseApplyEnd(item.신청기한),
    applyUrl: item.상세조회URL || null,
    tags: tags,
    status: 'ACTIVE',
  };
}

// ============== 온통청년 정규화 ==============

interface YouthItem {
  plcyNo: string;
  plcyNm: string;
  plcyKywdNm?: string;
  plcyExplnCn?: string;
  lclsfNm?: string;
  mclsfNm?: string;
  plcySprtCn?: string;
  sprvsnInstCdNm?: string;
  operInstCdNm?: string;
  bizPrdEndYmd?: string;
  bizPrdEtcCn?: string;
  aplyUrlAddr?: string;
  refUrlAddr1?: string;
  addAplyQlfcCndCn?: string;
  ptcpPrpTrgtCn?: string;
  sprtTrgtMinAge?: string;
  sprtTrgtMaxAge?: string;
  sprtTrgtAgeLmtYn?: string;
  mrgSttsCd?: string;
  zipCd?: string;
}

// 온통청년 카테고리 매핑 (대분류 lclsfNm 기준)
function mapYouthCategory(item: YouthItem): string {
  const lcls = item.lclsfNm || '';
  const mcls = item.mclsfNm || '';
  const keyword = item.plcyKywdNm || '';
  const all = lcls + ' ' + mcls + ' ' + keyword;

  // 우선순위 높은 키워드부터 매칭 (구체적인 것 → 추상적인 것 순)
  if (/일자리|취업|채용|창업/.test(all)) return '고용·창업';
  if (/주거|주택|월세|전세/.test(all)) return '주거·자립';
  if (/교육|직업훈련|학자금|장학|교육비/.test(all)) return '보육·교육';
  if (/금융|대출|적금|예금|바우처|보조금|소득/.test(all)) return '생활안정';
  if (/건강|의료|보건/.test(all)) return '건강·의료';
  if (/문화|예술|여가/.test(all)) return '문화·여가';
  if (/참여|권리/.test(all)) return '생활안정';

  return lcls || '청년지원';
}


// YYYYMMDD (또는 공백) 파싱
function parseYouthDate(ymd?: string): Date | null {
  if (!ymd) return null;
  const trimmed = ymd.trim();
  if (trimmed.length !== 8 || !/^\d{8}$/.test(trimmed)) return null;
  const y = parseInt(trimmed.substring(0, 4));
  const m = parseInt(trimmed.substring(4, 6));
  const d = parseInt(trimmed.substring(6, 8));
  if (y < 2020 || y > 2030 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(y, m - 1, d);
}

export function normalizeYouth(item: YouthItem): NormalizedPolicy {
  const sourceId = item.plcyNo;

  // 연령 (Y/N 플래그가 'Y'일 때만 신뢰)
  const hasAgeLimit = item.sprtTrgtAgeLmtYn === 'Y';
  const ageMin = hasAgeLimit && item.sprtTrgtMinAge
    ? parseInt(item.sprtTrgtMinAge) || null : null;
  const ageMax = hasAgeLimit && item.sprtTrgtMaxAge
    ? parseInt(item.sprtTrgtMaxAge) || null : null;

  // 설명: 정책 설명 + 지원 내용
  const desc = [item.plcyExplnCn, item.plcySprtCn]
    .filter(Boolean)
    .map(s => (s || '').replace(/&apos;/g, "'").replace(/&amp;/g, '&'))
    .join('\n\n');

  // 자격 조건: 추가 자격 + 참여 대상
  const target = [item.addAplyQlfcCndCn, item.ptcpPrpTrgtCn]
    .filter(Boolean)
    .map(s => (s || '').replace(/&apos;/g, "'").replace(/&amp;/g, '&'))
    .join('\n\n');

  // 태그: 키워드 + 대분류 + 중분류
  const tags = [item.plcyKywdNm, item.lclsfNm, item.mclsfNm]
    .filter(Boolean)
    .join(',');

  // 지역 추출 (zipCd 있으면 광역명, 없으면 주관기관명에서 추론)
  const org = item.sprvsnInstCdNm || item.operInstCdNm || '';
  let region = '전국';
  if (org.includes('시청')) region = org.replace('시청', '').trim();
  else if (org.includes('도청')) region = org.replace('도청', '').trim();
  else if (org.includes('구청')) region = org;

  return {
    id: 'youth_' + sourceId,
    tenantId: 'COMMON',
    source: 'youth',
    sourceId,
    category: mapYouthCategory(item),
    lifecycle: 'youth',  // 온통청년은 모두 청년 정책
    title: item.plcyNm,
    org: org || '온통청년',
    description: desc || item.plcyNm,
    amountText: null,
    targetText: target || null,
    targetAgeMin: ageMin,
    targetAgeMax: ageMax,
    region,
    applyStart: null,
    applyEnd: parseYouthDate(item.bizPrdEndYmd),
    applyUrl: item.aplyUrlAddr || item.refUrlAddr1 || null,
    tags,
    status: 'ACTIVE',
  };
}