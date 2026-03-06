@echo off
echo [BACKEND] Starting FastAPI server...
cd /d "%~dp0backend"

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [BACKEND] No venv found — using system Python
)

uvicorn main:app --reload --host 0.0.0.0 --port 8000
