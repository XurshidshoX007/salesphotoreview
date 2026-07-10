@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Sales login oynasini ochish...
echo.

set "SALES_URL=https://lalaku.lalakusales.com/dashboard/supervisor"
set "PROFILE=%CD%\work\.sales-browser-profile"
if not exist "%PROFILE%" (
  if exist "%CD%\work\.sales-chrome-profile" set "PROFILE=%CD%\work\.sales-chrome-profile"
)

set "BROWSER="
if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if defined BROWSER (
  echo Brauzer: %BROWSER%
  echo Profil: %PROFILE%
  start "" "%BROWSER%" --user-data-dir="%PROFILE%" --no-first-run --new-window "%SALES_URL%"
) else (
  echo Edge/Chrome topilmadi. Default brauzer ochilmoqda.
  start "" "%SALES_URL%"
)

echo.
echo Salesga login qiling. Dashboard ochilgach bu oynani yopishingiz mumkin.
echo.
pause
