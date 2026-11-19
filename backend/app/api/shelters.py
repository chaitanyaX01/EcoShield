"""Relief shelter directory endpoints for Pune Metropolitan Area.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from ..db.database import get_connection

router = APIRouter(prefix="/api/shelters", tags=["Shelters"])

@router.get("")
def list_shelters(zone_id: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()

    if zone_id and zone_id != "all":
        rows = cur.execute("""
            SELECT s.*, z.name as zone_name
            FROM shelters s
            JOIN zones z ON s.zone_id = z.id
            WHERE s.zone_id = ?
            ORDER BY s.capacity DESC
        """, (zone_id,)).fetchall()
    else:
        rows = cur.execute("""
            SELECT s.*, z.name as zone_name
            FROM shelters s
            JOIN zones z ON s.zone_id = z.id
            ORDER BY s.capacity DESC
        """).fetchall()

    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["available_capacity"] = max(0, d["capacity"] - d["occupancy"])
        d["occupancy_pct"] = round((d["occupancy"] / max(d["capacity"], 1)) * 100, 1)
        result.append(d)
    return result
