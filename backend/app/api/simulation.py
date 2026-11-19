"""Flash Flood Contingency Simulation endpoints.
"""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.simulation import run_flash_flood_simulation

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

class SimulationRequest(BaseModel):
    zone_id: str = Field(..., description="Target Pune zone e.g. katraj, sinhagad_rd, yerawada")
    severity: str = Field("severe", description="moderate, severe, extreme")

@router.post("/rehearse")
def rehearse_flash_flood(payload: SimulationRequest) -> Dict[str, Any]:
    return run_flash_flood_simulation(
        zone_id=payload.zone_id,
        severity_level=payload.severity
    )
