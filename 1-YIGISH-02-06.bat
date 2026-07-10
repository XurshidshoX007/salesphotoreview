@echo off
chcp 65001 >nul
cd /d "%~dp0"
title LMJ ma'lumot yig'ish

for /f %%i in ('powershell -NoProfile -Command "(Get-Date).AddDays(-1).ToString('yyyy-MM-dd')"') do set DEFAULT_DATE=%%i

echo.
echo ========================================
echo   LMJ foto hisobot ma'lumotlarini yig'ish
echo ========================================
echo.
echo  Sana format: YYYY-MM-DD  (masalan: 2026-06-03)
echo  Bo'sh qoldirsangiz kechagi sana olinadi: %DEFAULT_DATE%
echo.
set /p TARGET_DATE=Yig'iladigan sanani kiriting: 
if "%TARGET_DATE%"=="" set TARGET_DATE=%DEFAULT_DATE%
echo %TARGET_DATE%| findstr /R "^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$" >nul
if errorlevel 1 goto BAD_DATE

echo.
echo  Brauzer ochiladi. Kerak bo'lsa Salesga login qiling.
echo  Dastur sana va brendni tayyorlaydi: %TARGET_DATE%
echo  Ko'rsatma chiqsa, shu oynada ENTER bosing.
echo.
echo  Ma'lumot yig'ish tugamaguncha brauzerni yopmang.
echo.

call npm run collect -- %TARGET_DATE% Lalaku mama

echo.
pause
exit /b

:BAD_DATE
echo.
echo XATO: Sana noto'g'ri yozildi: %TARGET_DATE%
echo To'g'ri format: YYYY-MM-DD  masalan: 2026-06-03
echo.
pause
exit /b 1
