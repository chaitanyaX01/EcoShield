#!/usr/bin/env bash
set -e

echo "========================================================"
echo " EcoShield AI — Global Live Tunnel (Cloudflare)"
echo "========================================================"

# Make sure frontend is built so FastAPI can serve it directly on port 8000
if [ ! -d "frontend/dist" ]; then
    echo "Building production frontend bundle..."
    (cd frontend && npm run build)
fi

# Check if backend is running on port 8000
if ! nc -z localhost 8000 2>/dev/null; then
    echo "Starting backend server on port 8000..."
    (cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000) &
    sleep 2
fi

echo "Creating public worldwide HTTPS URL via Cloudflare..."
if command -v cloudflared &> /dev/null; then
    cloudflared tunnel --url http://localhost:8000
else
    echo "cloudflared not found. Falling back to npx localtunnel..."
    npx localtunnel --port 8000
fi
