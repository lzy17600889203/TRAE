@echo off
echo ========================================
echo  Knuth-Plass 排版演示系统 - 前端启动
echo ========================================
echo.
echo 正在启动前端服务 (端口 4200)...
echo.
cd /d "%~dp0"
npm install
npm start
pause
