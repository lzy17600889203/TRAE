@echo off
echo ============================================
echo   正则表达式可视化调试器 - 启动脚本
echo ============================================
echo.

echo [1/2] 正在启动后端服务 (端口: 3001)...
start "Regex Debugger Server" npx tsx watch server/index.ts

timeout /t 3 /nobreak > nul

echo [2/2] 正在启动前端开发服务 (端口: 5173)...
start "Regex Debugger Client" npx vite --host

echo.
echo ============================================
echo   服务启动完成！
echo   前端地址: http://localhost:5173
echo   后端API:  http://localhost:3001/api/health
echo ============================================
echo.
echo 按任意键关闭此窗口 (服务将继续运行)...
pause > nul
