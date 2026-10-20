@echo off
title Monitoring Penggunaan CPU dan RAM
color 0b

echo ========================================================
echo    MONITORING PENGGUNAAN CPU DAN RAM PADA KOMPUTER
echo ========================================================
echo.
echo Sedang menyiapkan server lokal...
echo Membuka browser pada http://localhost:8080 ...
echo.

start "" "http://localhost:8080"
echo Tekan [CTRL+C] pada jendela ini untuk menghentikan server.
echo.

php -S localhost:8080
pause
