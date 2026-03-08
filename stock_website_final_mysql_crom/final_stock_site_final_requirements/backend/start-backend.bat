@echo off
cd /d %~dp0
docker compose up -d
call npm install
call npm run db:init
call npm run db:seed
call npm run dev
