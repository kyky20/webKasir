@echo off
title Kasirku POS & Pembukuan
cd /d "%~dp0"

echo =========================================================
echo   Menjalankan Kasirku (Backend & Frontend dalam 1 Terminal)
echo =========================================================
echo.
echo Pastikan MySQL di Laragon sudah aktif (Start All di Laragon).
echo Buka di browser: http://localhost:5173
echo Tekan Ctrl+C untuk menghentikan kedua server sekaligus.
echo.

start http://localhost:5173

npm run dev
