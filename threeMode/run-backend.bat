@echo off
echo ========================================
echo Starting 3D Slice Simulator Backend
echo ========================================
cd /d "%~dp0backend"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Activating venv and installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo Starting FastAPI server on http://localhost:8000
python main.py
pause
