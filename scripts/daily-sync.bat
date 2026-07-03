@echo off
REM BenefitAtlas 매일 자동 동기화
REM Windows 작업 스케줄러에서 이 파일 실행

chcp 65001 >nul
cd /d C:\benefit-atlas\server

REM Node.js가 PATH에 있는지 확인
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js를 찾을 수 없습니다. PATH를 확인하세요. >> logs\scheduler_error.log
    exit /b 1
)

REM sync 실행
call npx ts-node scripts/syncAll.ts >> logs\scheduler_stdout.log 2>> logs\scheduler_stderr.log

exit /b %errorlevel%