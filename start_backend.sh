#!/usr/bin/env bash
set -e

echo "Starting EcoShield AI Backend (FastAPI) on port 8000..."
cd "$(dirname "$0")/backend"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
