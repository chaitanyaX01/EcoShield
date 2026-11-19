@echo off
echo ========================================================
echo Starting EcoShield AI Frontend (Vite) on port 5173...
echo ========================================================
cd /d "%~dp0frontend"
call npm run dev
pause
