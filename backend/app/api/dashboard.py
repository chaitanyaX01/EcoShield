"""Command Center Executive Dashboard summary endpoints.
"""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter

from ..db.database import get_connection
from ..services.weather import get_weather_summary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary() -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    zones = [dict(z) for z in cur.execute("SELECT * FROM zones ORDER BY elevation_m ASC").fetchall()]
    alerts = [dict(a) for a in cur.execute("SELECT a.*, z.name as zone_name FROM alerts a JOIN zones z ON a.zone_id = z.id WHERE a.status = 'active' ORDER BY a.created_at DESC").fetchall()]
    incidents = [dict(i) for i in cur.execute("SELECT i.*, z.name as zone_name FROM incidents i JOIN zones z ON i.zone_id = z.id ORDER BY i.created_at DESC").fetchall()]
    resources = [dict(r) for r in cur.execute("SELECT * FROM resources").fetchall()]
    shelters = [dict(s) for s in cur.execute("SELECT * FROM shelters").fetchall()]
    activities = [dict(act) for act in cur.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 12").fetchall()]
    conn.close()

    weather = get_weather_summary()

    # Highest risk zone
    critical_zones = [z for z in zones if z["risk_level"] == "Critical"]
    high_zones = [z for z in zones if z["risk_level"] == "High"]
    highest_risk_zone = critical_zones[0] if critical_zones else (high_zones[0] if high_zones else zones[0])

    # Resource readiness
    deployed_res = len([r for r in resources if r["status"] == "Deployed"])
    standby_res = len([r for r in resources if r["status"] == "Standby"])
    total_res = len(resources)

    # Open citizen reports (exclude resolved/solved)
    open_incidents = [i for i in incidents if i["status"].lower() != "resolved"]

    # Shelter capacity stats
    total_shelter_cap = sum(s["capacity"] for s in shelters)
    total_shelter_occ = sum(s["occupancy"] for s in shelters)

    return {
        "district": "Pune Metropolitan Area",
        "system_state": "Live Monitoring",
        "highest_risk_zone": {
            "id": highest_risk_zone["id"],
            "name": highest_risk_zone["name"],
            "display_name": highest_risk_zone["display_name"],
            "risk_level": highest_risk_zone["risk_level"],
            "elevation_m": highest_risk_zone["elevation_m"],
            "previous_floods": highest_risk_zone["previous_floods"],
        },
        "district_risk_level": "Elevated - Mutha & Confluence Basin Alert",
        "monitored_zones_count": len(zones),
        "active_alerts_count": len(alerts),
        "open_incidents_count": len(open_incidents),
        "resource_readiness": {
            "total": total_res,
            "deployed": deployed_res,
            "standby": standby_res,
            "readiness_percentage": round((standby_res / max(total_res, 1)) * 100, 1),
        },
        "shelter_occupancy": {
            "total_capacity": total_shelter_cap,
            "current_occupancy": total_shelter_occ,
            "available_beds": total_shelter_cap - total_shelter_occ,
        },
        "weather_summary": weather,
        "recent_alerts": alerts[:4],
        "recent_incidents": open_incidents[:5],
        "activity_timeline": activities,
        "zones": zones,
    }
