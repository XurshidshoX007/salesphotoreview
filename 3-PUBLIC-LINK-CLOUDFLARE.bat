@echo off
chcp 65001 >nul
cd /d "%~dp0"
title LMJ public Cloudflare link

echo.
echo Cloudflare public link ishga tushmoqda...
echo Bu oynani yopmang. Hamkasblar linkdan foydalanayotganda tunnel ishlab turishi kerak.
echo.

node work/start_cloudflare_tunnel.mjs

echo.
echo Tunnel yopildi. Davom etish uchun tugma bosing.
pause >nul
