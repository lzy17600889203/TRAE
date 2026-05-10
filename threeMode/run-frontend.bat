@echo off
echo ========================================
echo Starting 3D Slice Simulator Frontend
echo ========================================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting development server...
call npm run dev
pause
