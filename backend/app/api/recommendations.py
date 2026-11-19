"""Actionable recommendation endpoints for EcoShield AI Command Center.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from ..services.recommendations import generate_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("")
def list_recommendations(zone_id: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    return generate_recommendations(zone_id=zone_id if zone_id != "all" else None)
