# 다음 회차

## 현재 상태 (2026-07-04 기준)
- ✅ 앱이 Oracle Cloud DB에서 동작 중 (Autonomous DB 26ai, Osaka)
- ✅ 데이터 6,940건 클라우드 이전 완료
- ✅ BENEFIT 스키마 격리
- ⚠️ 자동 갱신은 아직 로컬 (Windows 스케줄러 → 로컬 DB에 sync)

## 다음 회차 - Phase 2 & 3 (Compute VM 배포)

### Phase 2: Compute VM 생성 (약 1시간)
1. Oracle Cloud Console → Compute → Instances → Create
2. Always Free 스펙 선택
   - Shape: VM.Standard.A1.Flex (ARM, 4 OCPU / 24GB RAM)
   - 또는 VM.Standard.E2.1.Micro (x86, 1 OCPU / 1GB RAM)
3. Ubuntu 22.04 이미지
4. SSH 키 생성 및 저장
5. Public IP 부여

### Phase 3: 앱 배포 (약 1.5시간)
1. SSH 접속
2. Node.js 설치 (nvm)
3. Git clone 또는 rsync로 코드 업로드
4. .env 설정 (클라우드 DB 접속)
5. Wallet 파일 업로드
6. npm install
7. pm2 설치 및 앱 실행

### Phase 4: 프론트 + Nginx (약 30분)
1. Nginx 설치
2. Vite build → 정적 파일 서빙
3. API 리버스 프록시 (/api/* → localhost:3301)
4. VCN 방화벽 규칙 (80, 443 열기)

### Phase 5: 도메인 + SSL (약 30분)
1. 도메인 구매 (benefitatlas.co.kr 등)
2. DNS 연결 (A 레코드 → Public IP)
3. Let's Encrypt SSL (certbot)

### Phase 6: 자동 갱신 이전 (약 30분)
1. Windows 작업 스케줄러 → crontab
2. syncAll.ts 클라우드 서버에서 실행되도록 설정
3. 로컬 스케줄러 비활성화

## 다음 회차 시작 한 줄
"BenefitAtlas 계속. 클라우드 DB 이전 완료. 다음은 Compute VM + 앱 배포"

## 미해결 이슈 (참고)
- 아산/제주 시군구 매칭 (경미)
- work24 채용정보 (개인회원 불가)
- work24 일학습병행/사업주훈련 (활성화 대기)
- .env 정리 (배포 완전 성공 후 수행)