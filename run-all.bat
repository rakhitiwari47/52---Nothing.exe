@echo off
echo ===================================================
echo Launching HealFlow AI (Backend + Frontend)
echo ===================================================

cd /d "%~dp0"

echo Launching Backend server in a separate window...
start "HealFlow AI - Backend" cmd /k "call start-backend.bat"

timeout /t 3 /nobreak >nul

echo Launching Frontend server in a separate window...
start "HealFlow AI - Frontend" cmd /k "call start-frontend.bat"

echo.
echo HealFlow AI is starting up!
echo - Backend API:  http://127.0.0.1:8000
echo - API Docs:     http://127.0.0.1:8000/docs
echo - Frontend UI:  http://127.0.0.1:5173
echo.
pause
