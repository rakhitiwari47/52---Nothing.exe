@echo off
echo ===================================================
echo Starting HealFlow AI Frontend (Vite + React)
echo ===================================================

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

echo Starting frontend dev server on http://127.0.0.1:5173 ...
call npm run dev -- --host 127.0.0.1 --port 5173
pause
