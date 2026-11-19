"""Flood risk prediction endpoints using scikit-learn Extra Trees classifier.
"""
from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.prediction import get_metadata, predict_flood_risk

router = APIRouter(prefix="/api/prediction", tags=["Flood Prediction"])

class PredictionInput(BaseModel):
    zone_id: Optional[str] = "katraj"
    rainfall_mm_h: float = Field(..., ge=0.0, le=300.0, description="Precipitation rate in mm/hour")
    humidity_pct: float = Field(75.0, ge=10.0, le=100.0, description="Relative humidity percentage")
    temperature_c: float = Field(26.5, ge=5.0, le=50.0, description="Ambient air temperature in Celsius")
    drainage_score: float = Field(50.0, ge=0.0, le=100.0, description="Municipal stormwater drain capacity score (0-100)")
    previous_flood: int = Field(1, ge=0, le=20, description="Historical recorded flood frequency in this micro-basin")
    elevation_m: float = Field(570.0, ge=400.0, le=1200.0, description="Topographical elevation in meters")
    population_density: float = Field(16000.0, ge=500.0, le=60000.0, description="Population density per km2")
    soil_saturation: float = Field(65.0, ge=0.0, le=100.0, description="Antecedent soil moisture / saturation %")

@router.get("/metadata")
def metadata() -> Dict[str, Any]:
    return get_metadata()

@router.post("/predict")
def predict(payload: PredictionInput) -> Dict[str, Any]:
    return predict_flood_risk(payload.dict())
