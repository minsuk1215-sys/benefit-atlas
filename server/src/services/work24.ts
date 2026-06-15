import axios from 'axios';
import 'dotenv/config';

// 국민내일배움카드 훈련과정 목록
const URL_TOMORROW_CARD = 'https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do';

export async function fetchTomorrowCardCourses(params: {
  pageNum: number;
  pageSize?: number;
  srchTraStDt: string;  // 훈련시작일 From (YYYYMMDD) — 필수
  srchTraEndDt: string; // 훈련시작일 To (YYYYMMDD) — 필수
  srchTraArea1?: string; // 지역 대분류 (서울=11, 경기=41 등)
  srchNcs1?: string;     // NCS 직종 대분류
  crseTracseSe?: string; // 훈련유형 (C0061=내일배움카드 일반)
}) {
const queryParams: any = {
  authKey: process.env.WORK24_DUAL_KEY || process.env.WORK24_KEY,
    returnType: 'JSON',
    outType: '1',  // 1=리스트, 2=상세
    pageNum: params.pageNum,
    pageSize: params.pageSize || 50,
    srchTraStDt: params.srchTraStDt,
    srchTraEndDt: params.srchTraEndDt,
    sort: 'DESC',
    sortCol: '2',  // 훈련시작일 기준
  };

  if (params.srchTraArea1) queryParams.srchTraArea1 = params.srchTraArea1;
  if (params.srchNcs1) queryParams.srchNcs1 = params.srchNcs1;
  if (params.crseTracseSe) queryParams.crseTracseSe = params.crseTracseSe;

  try {
    const { data } = await axios.get(URL_TOMORROW_CARD, {
      params: queryParams,
      timeout: 15000,
    });
    return data;
  } catch (err: any) {
    console.error('work24 훈련과정 호출 실패:', err.response?.status || err.message);
    throw err;
  }
}

// 채용정보 목록 조회
const URL_RECRUIT = 'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';

export async function fetchRecruitList(params: {
  startPage: number;
  display?: number;
  region?: string;
  occupation?: string;
  returnType?: 'JSON' | 'XML';
}) {
const queryParams: any = {
  authKey: process.env.WORK24_EMP_KEY || process.env.WORK24_KEY,
    callTp: 'L',
    returnType: params.returnType || 'JSON',  // JSON 먼저 시도
    startPage: params.startPage,
    display: params.display || 50,
  };

  if (params.region) queryParams.region = params.region;
  if (params.occupation) queryParams.occupation = params.occupation;

  try {
    const { data } = await axios.get(URL_RECRUIT, {
      params: queryParams,
      timeout: 15000,
    });
    return data;
  } catch (err: any) {
    console.error('work24 채용정보 호출 실패:', err.response?.status || err.message);
    throw err;
  }
}

// 일학습병행 훈련과정 목록
const URL_DUAL_TRAINING = 'https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo313L01.do';

export async function fetchDualTrainingCourses(params: {
  pageNum: number;
  pageSize?: number;
  srchTraStDt: string;
  srchTraEndDt: string;
  srchTraArea1?: string;
  srchNcs1?: string;
  crseTracseSe?: string;
}) {
  const queryParams: any = {
    authKey: process.env.WORK24_KEY,
    returnType: 'JSON',
    outType: '1',
    pageNum: params.pageNum,
    pageSize: params.pageSize || 50,
    srchTraStDt: params.srchTraStDt,
    srchTraEndDt: params.srchTraEndDt,
    sort: 'DESC',
    sortCol: '2',
  };

  if (params.srchTraArea1) queryParams.srchTraArea1 = params.srchTraArea1;
  if (params.srchNcs1) queryParams.srchNcs1 = params.srchNcs1;
  if (params.crseTracseSe) queryParams.crseTracseSe = params.crseTracseSe;

  try {
    const { data } = await axios.get(URL_DUAL_TRAINING, {
      params: queryParams,
      timeout: 15000,
    });
    return data;
  } catch (err: any) {
    console.error('work24 일학습병행 호출 실패:', err.response?.status || err.message);
    throw err;
  }
}

// 사업주훈련 훈련과정 목록
const URL_EMPLOYER_TRAINING = 'https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo311L01.do';

export async function fetchEmployerTrainingCourses(params: {
  pageNum: number;
  pageSize?: number;
  srchTraStDt: string;
  srchTraEndDt: string;
  srchTraArea1?: string;
  srchNcs1?: string;
  crseTracseSe?: string;
}) {
const queryParams: any = {
  authKey: process.env.WORK24_DUAL_KEY || process.env.WORK24_KEY,
    returnType: 'JSON',
    outType: '1',
    pageNum: params.pageNum,
    pageSize: params.pageSize || 50,
    srchTraStDt: params.srchTraStDt,
    srchTraEndDt: params.srchTraEndDt,
    sort: 'DESC',
    sortCol: '2',
  };

  if (params.srchTraArea1) queryParams.srchTraArea1 = params.srchTraArea1;
  if (params.srchNcs1) queryParams.srchNcs1 = params.srchNcs1;
  if (params.crseTracseSe) queryParams.crseTracseSe = params.crseTracseSe;

  try {
    const { data } = await axios.get(URL_EMPLOYER_TRAINING, {
      params: queryParams,
      timeout: 15000,
    });
    return data;
  } catch (err: any) {
    console.error('work24 사업주훈련 호출 실패:', err.response?.status || err.message);
    throw err;
  }
}

