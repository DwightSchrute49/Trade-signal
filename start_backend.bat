@echo off
echo [BACKEND] Starting FastAPI server...
cd /d "%~dp0backend"

REM Prefer repo root .venv, then backend\venv, else fallback to system Python.
set "PYTHON_CMD=python"

if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_CMD=%~dp0.venv\Scripts\python.exe"
    echo [BACKEND] Using repo .venv
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_CMD=venv\Scripts\python.exe"
    echo [BACKEND] Using backend\venv
) else (
    echo [BACKEND] No venv found - using system Python
)

"%PYTHON_CMD%" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
