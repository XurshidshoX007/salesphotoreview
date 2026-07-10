@echo off
chcp 65001 >nul
cd /d "%~dp0"
title LMJ foto nazorati

echo Foto nazorati serveri ishga tushmoqda...
call npm run review
