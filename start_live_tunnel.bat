@echo off
echo ========================================================
echo  EcoShield AI - Global Live Tunnel (Windows)
echo ========================================================

:: Check if frontend is built
if not exist "frontend\dist\index.html" (
    echo Building production frontend bundle...
    cd /d "%~dp0frontend"
    call npm run build
    cd /d "%~dp0"
)

:: Start backend in a background window if not running
echo Launching backend on port 8000...
start "EcoShield Backend" cmd /k "cd /d "%~dp0backend" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo ========================================================
echo Creating public HTTPS tunnel to share with anyone...
echo ========================================================

where cloudflared >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    cloudflared tunnel --url http://localhost:8000
) else (
    echo Cloudflared not found. Using npx localtunnel...
    call npx localtunnel --port 8000
)

pause
