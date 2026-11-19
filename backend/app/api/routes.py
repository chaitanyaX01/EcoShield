"""Safe evacuation routing endpoints for EcoShield AI.
Calculates high-ground navigation corridors avoiding flooded riverbanks and submerged culverts.
"""
from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.routing import generate_safe_route

router = APIRouter(prefix="/api/routes", tags=["Routes"])

class RouteRequest(BaseModel):
    start_lat: float = Field(..., ge=18.3, le=18.7)
    start_lon: float = Field(..., ge=73.6, le=74.1)
    shelter_id: Optional[str] = None
    zone_id: Optional[str] = None

@router.post("/evacuation")
def get_evacuation_route(payload: RouteRequest) -> Dict[str, Any]:
    return generate_safe_route(
        start_lat=payload.start_lat,
        start_lon=payload.start_lon,
        shelter_id=payload.shelter_id,
        zone_id=payload.zone_id,
    )
