@echo off
echo ========================================
echo Starting 3D Slice Simulator (Full Stack)
echo ========================================

echo.
echo Starting Backend in new window...
start "Backend" cmd /k "%~dp0run-backend.bat"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend...
call "%~dp0run-frontend.bat"
