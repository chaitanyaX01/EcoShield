@echo off
echo ========================================================
echo Launching EcoShield AI Command Center on Windows...
echo ========================================================
echo Starting Backend in new window...
start "EcoShield Backend (FastAPI)" cmd /k "%~dp0start_backend.bat"

echo Starting Frontend in new window...
start "EcoShield Frontend (Vite)" cmd /k "%~dp0start_frontend.bat"

echo ========================================================
echo Both services are booting!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ========================================================
