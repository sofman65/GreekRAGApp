@echo off
REM Ερμής Backend Startup Script for Windows

echo Starting pithia Backend Server...

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM Check if .env exists, if not copy from example
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update .env with your configuration!
)

REM Set PYTHONPATH
set PYTHONPATH=%PYTHONPATH%;%CD%

REM Run the server
echo Starting FastAPI server on http://localhost:8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause

