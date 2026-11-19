"""Analytics and ML evaluation endpoints for EcoShield AI.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..services.analytics import get_analytics_summary

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CHART_PATH = BASE_DIR / "model_metrics" / "f1_score_comparison.png"

@router.get("/summary")
def analytics_summary() -> Dict[str, Any]:
    return get_analytics_summary()

@router.get("/f1-chart")
def get_f1_chart():
    if not CHART_PATH.is_file():
        raise HTTPException(status_code=404, detail="Model F1 comparison chart not found on server.")
    return FileResponse(
        path=str(CHART_PATH),
        media_type="image/png",
        filename="ecoshield_f1_comparison.png"
    )
