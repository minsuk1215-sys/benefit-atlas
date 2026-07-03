# BenefitAtlas 기동 가이드

> 매일 작업 시작할 때 참고하는 문서
> 마지막 업데이트: 2026-06-15

---

## 🚀 로컬 개발 환경 기동 (일상 작업용)

두 개의 PowerShell 창을 열어서 각각 실행합니다.

### 창 1: 백엔드 (Express + Oracle, 포트 3301)

```powershell
cd C:\benefit-atlas\server
npm run dev
```

**정상 기동 시 콘솔 출력**:
```
Oracle pool created
Server running on http://0.0.0.0:3301
```

### 창 2: 프론트엔드 (React + Vite, 포트 3300)

```powershell
cd C:\benefit-atlas\client
npm run dev
```

**정상 기동 시 콘솔 출력**:
```
VITE v5.x  ready in xxx ms
➜  Local:   http://localhost:3300/
➜  Network: http://192.168.11.25:3300/
```

---

## 🌐 접속 URL

| 용도 | URL | 인증 |
|------|-----|------|
| 주민 화면 (본인 PC) | http://localhost:3300 | 없음 |
| 주민 화면 (같은 네트워크) | http://192.168.11.25:3300 | 없음 |
| 관리자 콘솔 | http://localhost:3300/admin/login | admin / admin |
| API 헬스체크 | http://localhost:3301/health | - |
| API 검색 테스트 | http://localhost:3301/api/search?q=청년 | - |
| API 정책 목록 | http://localhost:3301/api/policies | - |

---

## 🔧 문제 해결

### 서버가 안 뜨는 경우

```powershell
# 포트 사용 중인지 확인
netstat -ano | findstr :3301
netstat -ano | findstr :3300

# 3301 포트 사용 중인 프로세스 찾기
Get-Process -Id (Get-NetTCPConnection -LocalPort 3301).OwningProcess

# 필요하면 프로세스 종료 (PID는 위에서 확인한 것)
Stop-Process -Id [PID] -Force
```

### DB 연결 확인

```powershell
cd C:\benefit-atlas\server
npx ts-node scripts/checkDb.ts
```

정상 시 총 정책 수, 카테고리 분포 등이 출력됨.

### .env 변경 후 반영 안 될 때

`.env` 파일 수정 후에도 자동 재시작이 안 되면 수동으로:

```powershell
# 백엔드 창에서 Ctrl+C로 중단 후
npm run dev
```

### 방화벽 설정 확인 (외부 접속 안 될 때)

관리자 PowerShell에서:

```powershell
# 이미 설정된 규칙 확인
Get-NetFirewallRule -DisplayName "*3300*", "*3301*"

# 없으면 다시 추가
New-NetFirewallRule -DisplayName "BenefitAtlas 3300" -Direction Inbound -LocalPort 3300 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "BenefitAtlas 3301" -Direction Inbound -LocalPort 3301 -Protocol TCP -Action Allow
```

---

## 📦 데이터 재적재 명령 (필요 시)

```powershell
cd C:\benefit-atlas\server

# 정부24 (약 2,000건)
npx ts-node scripts/syncGov24.ts

# 온통청년 (약 2,621건)
npx ts-node scripts/syncYouth.ts

# work24 K-디지털 훈련 (약 537건)
npx ts-node scripts/syncWork24Training.ts

# work24 일학습병행 + 사업주훈련 (활성화 후 시도)
npx ts-node scripts/syncWork24Others.ts

# DB 상태 확인
npx ts-node scripts/checkDb.ts
```

---

## 📁 주요 폴더 구조

```
C:\benefit-atlas\
├── server\                # 백엔드 (Node.js/Express)
│   ├── src\
│   │   ├── index.ts       # 메인 라우트 (API 엔드포인트)
│   │   ├── db.ts          # Oracle 연결 풀
│   │   ├── routes\
│   │   │   └── admin.ts   # 관리자 콘솔 API (CRUD)
│   │   ├── services\
│   │   │   ├── recommender.ts    # 추천 엔진 (점수 계산)
│   │   │   ├── gov24.ts          # 정부24 API 래퍼
│   │   │   ├── youth.ts          # 온통청년 API 래퍼
│   │   │   └── work24.ts         # work24 API 래퍼
│   │   └── utils\
│   │       └── normalize.ts      # 데이터 정규화 (외부 API → DB)
│   ├── scripts\           # 배치 스크립트
│   │   ├── syncGov24.ts
│   │   ├── syncYouth.ts
│   │   ├── syncWork24Training.ts
│   │   ├── syncWork24Others.ts
│   │   └── checkDb.ts
│   └── .env               # 환경변수 (Oracle, API키) — Git 제외
│
├── client\                # 프론트엔드 (React/Vite)
│   ├── src\
│   │   ├── pages\         # 라우팅 페이지
│   │   │   ├── HomePage.tsx
│   │   │   ├── SearchPage.tsx           # 프로필 입력
│   │   │   ├── SearchKeywordPage.tsx    # 키워드 검색
│   │   │   ├── ResultPage.tsx           # 추천 결과
│   │   │   ├── PolicyDetailPage.tsx     # 정책 상세
│   │   │   ├── SavedPage.tsx            # 관심 정책
│   │   │   ├── SchedulePage.tsx         # 내 일정 (캘린더)
│   │   │   ├── LifecyclePage.tsx        # 생애주기
│   │   │   ├── JobsPage.tsx             # 일자리
│   │   │   ├── EducationPage.tsx        # 자녀교육
│   │   │   ├── AdminLoginPage.tsx       # 관리자 로그인
│   │   │   ├── AdminPoliciesPage.tsx    # 관리자 정책 목록
│   │   │   └── AdminPolicyFormPage.tsx  # 관리자 정책 폼
│   │   ├── components\
│   │   │   └── AdminProtected.tsx       # 관리자 보호 라우트
│   │   ├── api\
│   │   │   ├── client.ts        # 주민용 axios 클라이언트
│   │   │   └── adminClient.ts   # 관리자용 axios 클라이언트
│   │   └── utils\
│   │       ├── storage.ts       # localStorage (프로필, ♡, 일정)
│   │       └── adminAuth.ts     # 관리자 인증 토큰 관리
│   └── vite.config.ts
│
└── docs\
    ├── STARTUP.md         # 이 문서
    └── NEXT.md            # 다음 회차 작업 메모
```

---

## 🎯 빠른 시작 체크리스트

다음 회차 시작할 때 순서대로:

1. ☐ 백엔드 창 열기 → `cd C:\benefit-atlas\server && npm run dev`
2. ☐ 프론트 창 열기 → `cd C:\benefit-atlas\client && npm run dev`
3. ☐ 두 창 모두 정상 기동 확인 (에러 없음)
4. ☐ 브라우저에서 http://localhost:3300 접속 확인
5. ☐ 관리자 로그인 확인: http://localhost:3300/admin/login (admin/admin)
6. ☐ (필요 시) `npx ts-node scripts/checkDb.ts`로 DB 상태 확인

---

## 📝 일일 작업 마감 시

Git 커밋:

```powershell
cd C:\benefit-atlas
git status
git add .
git commit -m "작업 내용 요약"
```

---

## 🔐 환경변수 (.env)

`server/.env` 파일에 다음 항목들이 있어야 함:

```
# Oracle DB
DB_HOST=192.168.0.70
DB_PORT=31521
DB_SERVICE=dxorapdb
DB_USER=(비밀)
DB_PASSWORD=(비밀)

# 관리자
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
ADMIN_SECRET=benefit-atlas-demo-secret-2026

# 서버 포트
PORT=3301

# 외부 API 키
GOV24_KEY=(정부24 키 - 재발급 권장)
YOUTH_POLICY_KEY=(온통청년 키)
WORK24_KEY=(work24 K-디지털 훈련 키)
WORK24_DUAL_KEY=(일학습병행 키 - 활성화 대기)
WORK24_EMP_KEY=(사업주훈련 키 - 활성화 대기)
WORK24_RECRUIT_KEY=(채용정보 키 - 개인회원 불가)
```

---

## 📊 현재 데이터 현황 (2026-06-15 기준)

- **총 정책 수**: 약 6,922건
- **소스별 분포**:
  - gov24 (정부24): ~2,000건
  - youth (온통청년): 2,621건
  - work24 (K-디지털 훈련): 537건
  - work24 (일반 훈련): 약 1,700건
  - local (자체 정책): 관리자 콘솔에서 추가
- **카테고리 상위 3**:
  - 고용·창업: 3,097건
  - 생활안정: 1,194건
  - 보육·교육: 1,039건
- **생애주기 분포**:
  - youth: 3,114건 (가장 많음)
  - care: 289건
  - birth: 203건
  - senior: 176건
  - marry: 37건

---

## ⚡ 자주 쓰는 원-라이너

```powershell
# API 정책 총 수 확인
Invoke-RestMethod -Uri "http://localhost:3301/api/policies?limit=1" | Select-Object total

# 검색 API 테스트
Invoke-RestMethod -Uri "http://localhost:3301/api/search?q=청년월세" | ConvertTo-Json -Depth 2

# 관리자 로그인 테스트
Invoke-RestMethod -Uri "http://localhost:3301/admin/login" -Method Post -Body '{"username":"admin","password":"admin"}' -ContentType "application/json"

# .env 키 존재 여부 확인 (앞 5자만)
cd C:\benefit-atlas\server
npx ts-node -e "import 'dotenv/config'; console.log('GOV24:', (process.env.GOV24_KEY||'').substring(0,5)); console.log('YOUTH:', (process.env.YOUTH_POLICY_KEY||'').substring(0,5)); console.log('WORK24:', (process.env.WORK24_KEY||'').substring(0,5));"
```

---

## 🗂️ 관리자 콘솔 사용법 (영업 데모)

### 로그인
1. http://localhost:3300/admin/login 접속
2. 아이디: `admin`, 비밀번호: `admin`

### 정책 등록 (영업 시연 시나리오)
1. 로그인 후 자동으로 `/admin/policies`로 이동
2. **"+ 새 정책 등록"** 클릭
3. 정보 입력 (예시):
   - 제목: `ㅇㅇ구 청년 월세 보너스`
   - 카테고리: `주거·자립`
   - 생애주기: `청년`
   - 대상 지역: `서울특별시 종로구`
   - 최소 연령: `19`, 최대 연령: `34`
   - 지원 내용: `월 최대 20만원, 12개월 지원`
4. **"등록"** 클릭
5. 목록에서 등록된 정책 확인

### 주민 화면에서 즉시 반영 확인
- 상단 **"주민 화면 보기"** 클릭 (새 탭)
- 홈 또는 "주거·자립" 카테고리에서 방금 등록한 정책 노출
- 상세 페이지로 이동해서 입력한 정보 그대로 표시

이 시연이 **영업 미팅의 핵심 차별점**입니다.

---

## 🔗 관련 문서

- `docs/NEXT.md` — 다음 회차 작업 메모
- `README.md` — 프로젝트 개요 (있다면)

---

## 📋 작업 흐름 예시

```
1. STARTUP.md 열어서 기동 명령 확인
2. 두 서버 기동 (창 1: 서버, 창 2: 클라이언트)
3. 브라우저에서 접속 확인 (http://localhost:3300)
4. NEXT.md에서 이번 회차 할 일 확인
5. 작업 진행
6. 마감 시 git commit
```

---

## 🎯 남은 큰 작업 (참고)

```
✅ 완료:
- 디자인 고도화 (Fraunces 폰트, 디자인 토큰)
- 지자체 관리자 콘솔 (자체 정책 CRUD)
- 데이터 강화 (6,922건: 정부24 + 온통청년 + work24)
- 키워드 검색
- 지역 매칭 (광주 등 다른 광역 차단)

🎯 남은 것:
- 길 2: AWS 배포 (마지막 봉우리, 3~5시간)
- work24 추가 API 활성화 확인 (일학습병행, 사업주훈련)
- 데이터 정밀화 (아산/제주 시군구 매칭)
```
