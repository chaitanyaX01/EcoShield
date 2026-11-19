"""Zone registry endpoints for Pune Metropolitan Area.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

from ..db.database import get_connection

router = APIRouter(prefix="/api/zones", tags=["Zones"])

@router.get("")
def list_zones() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    rows = cur.execute("SELECT * FROM zones ORDER BY elevation_m ASC").fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["bounds"] = json.loads(d["bounds_json"]) if d.get("bounds_json") else []
        result.append(d)
    return result

@router.get("/{zone_id}")
def get_zone(zone_id: str) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM zones WHERE id = ?", (zone_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found.")
    
    shelters = cur.execute("SELECT * FROM shelters WHERE zone_id = ?", (zone_id,)).fetchall()
    resources = cur.execute("SELECT * FROM resources WHERE zone_id = ?", (zone_id,)).fetchall()
    incidents = cur.execute("SELECT * FROM incidents WHERE zone_id = ? AND LOWER(status) != 'resolved'", (zone_id,)).fetchall()
    alerts = cur.execute("SELECT * FROM alerts WHERE zone_id = ? AND status = 'active'", (zone_id,)).fetchall()
    conn.close()

    d = dict(row)
    d["bounds"] = json.loads(d["bounds_json"]) if d.get("bounds_json") else []
    d["shelters"] = [dict(s) for s in shelters]
    d["resources"] = [dict(r) for r in resources]
    d["incidents"] = [dict(i) for i in incidents]
    d["active_alerts"] = [dict(a) for a in alerts]
    return d
