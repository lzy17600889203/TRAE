@echo off
echo ========================================
echo  Knuth-Plass 排版演示系统 - 后端启动
echo ========================================
echo.
echo 正在启动后端服务 (端口 3001)...
echo.
cd /d "%~dp0"
npm install
node src/server.js
pause
