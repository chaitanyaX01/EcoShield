#!/usr/bin/env bash
set -e

echo "Starting EcoShield AI Frontend (Vite) on port 5173..."
cd "$(dirname "$0")/frontend"
npm run dev
