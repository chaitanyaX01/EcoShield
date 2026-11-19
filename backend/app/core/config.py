"""Core configuration for EcoShield AI Backend.
Loads secrets safely from backend/.env without exposing keys.
"""
from __future__ import annotations

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

def _load_env_file() -> None:
    if ENV_FILE.is_file():
        try:
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k:
                            os.environ[k] = v
        except Exception:
            pass

_load_env_file()

OPENWEATHER_API_KEY: str = os.environ.get("OPENWEATHER_API_KEY", "").strip()
GOOGLE_WEATHER_API_KEY: str = os.environ.get("GOOGLE_WEATHER_API_KEY", "").strip()
SECRET_KEY: str = os.environ.get("SECRET_KEY", "ecoshield-pune-secure-jwt-key-2026")
DATABASE_PATH: Path = BASE_DIR / "ecoshield.db"

DISTRICT_NAME: str = "Pune Metropolitan Area"
SYSTEM_STATE: str = "Live Monitoring"
TOTAL_ZONES: int = 8
