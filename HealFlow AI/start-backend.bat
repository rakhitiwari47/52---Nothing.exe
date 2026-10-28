@echo off
echo ===================================================
echo Starting HealFlow AI Backend (FastAPI + Uvicorn)
echo ===================================================

cd /d "%~dp0"

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/Verifying dependencies...
pip install -r backend\requirements.txt

echo Starting backend on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
