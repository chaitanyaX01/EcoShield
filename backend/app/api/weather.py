"""Weather endpoints for Pune Metropolitan Area.
OpenWeather API calls are handled strictly in FastAPI backend with 10-minute caching.
"""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Query

from ..services.weather import get_weather_summary, get_zone_weather

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("/summary")
def weather_summary(refresh: bool = Query(False, description="Force refresh cache")) -> Dict[str, Any]:
    return get_weather_summary(force_refresh=refresh)

@router.get("/zone/{zone_id}")
def zone_weather(zone_id: str, refresh: bool = Query(False, description="Force refresh cache")) -> Dict[str, Any]:
    return get_zone_weather(zone_id=zone_id, force_refresh=refresh)
