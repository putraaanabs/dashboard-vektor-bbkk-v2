@echo off
cd /d "%~dp0"
title Dashboard Vektor BBKK
if not exist ".env" (
  echo File .env tidak ditemukan di folder project.
  echo Salin .env.example menjadi .env dan isi konfigurasi MySQL.
  pause
  exit /b 1
)
npm start
pause
