@echo off
chcp 65001 >nul
title 智配通后端服务 (端口 8000)
cd /d "%~dp0"

REM 检查 8000 端口是否已有服务在监听
netstat -ano | findstr "LISTENING" | findstr ":8000" >nul
if %errorlevel%==0 (
    echo.
    echo [提示] 后端已在运行中，无需重复启动。
    echo 接口文档地址: http://localhost:8000/docs
    echo.
    echo 按任意键关闭本窗口（不会停止后端服务）...
    pause >nul
    exit /b
)

echo.
echo 正在启动智配通后端服务...
echo 启动后请保持本窗口开启，关闭窗口 = 停止后端。
echo 接口文档地址: http://localhost:8000/docs
echo.
python -m uvicorn main:app --host 127.0.0.1 --port 8000
echo.
echo [提示] 服务已退出。如需重新启动，请再次双击本脚本。
pause
