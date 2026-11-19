"""Recommendations engine for EcoShield AI Command Center.
Generates actionable, prioritized operational directives grounded in Pune's active hydrology,
weather, resource deployment, and citizen incident data.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..db.database import get_connection
from .weather import get_weather_summary, get_zone_weather

def generate_recommendations(zone_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()

    if zone_id:
        zones = cur.execute("SELECT * FROM zones WHERE id = ?", (zone_id,)).fetchall()
    else:
        zones = cur.execute("SELECT * FROM zones").fetchall()

    incidents = cur.execute("SELECT * FROM incidents").fetchall()
    resources = cur.execute("SELECT * FROM resources").fetchall()
    shelters = cur.execute("SELECT * FROM shelters").fetchall()
    conn.close()

    weather_summary = get_weather_summary()
    recommendations: List[Dict[str, Any]] = []
    rec_counter = 1

    for z in zones:
        zid = z["id"]
        zname = z["name"]
        risk = z["risk_level"]
        z_weather = get_zone_weather(zid)
        rain = z_weather.get("rainfall_last_hour_mm", 0.0)
        z_incidents = [i for i in incidents if i["zone_id"] == zid]
        z_resources = [r for r in resources if r["zone_id"] == zid and r["status"] == "Deployed"]
        z_shelters = [s for s in shelters if s["zone_id"] == zid]

        # Critical / High Risk recommendations
        if risk in ("Critical", "High") or rain >= 40.0:
            recommendations.append({
                "id": f"REC-{rec_counter:03d}",
                "zone_id": zid,
                "zone_name": zname,
                "priority": "P1 - Immediate",
                "category": "Evacuation & Public Safety",
                "title": f"Evacuation Alert & Dewatering Deployment: {zname}",
                "detail": (
                    f"{zname} is at {risk} risk with {rain} mm/h precipitation. "
                    f"Historical flood frequency: {z['previous_floods']} events. "
                    f"Direct ground-floor residents along low-lying paths towards safe shelters."
                ),
                "action": "Broadcast evacuation advisory & deploy submersible pumps to arterial low points",
                "recommended_resource": "Inflatable Rescue Boat & 120 HP Submersible Pump",
                "status": "pending_approval",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            rec_counter += 1

        # Incident-driven recommendations
        if len(z_incidents) >= 2:
            unverified = [i for i in z_incidents if i["status"] == "unverified"]
            recommendations.append({
                "id": f"REC-{rec_counter:03d}",
                "zone_id": zid,
                "zone_name": zname,
                "priority": "P2 - Urgent",
                "category": "Field Verification",
                "title": f"Deploy Ward Squad to Verify {len(z_incidents)} Incident Reports in {zname}",
                "detail": (
                    f"Community submitted {len(z_incidents)} hazard reports ({len(unverified)} unverified) in {zname}. "
                    f"Average reported water depth: {sum(i['water_depth_cm'] for i in z_incidents) // len(z_incidents)} cm."
                ),
                "action": "Dispatch municipal field engineer for physical verification & drain clearance",
                "recommended_resource": "Field Response Squad",
                "status": "ready",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            rec_counter += 1

        # Shelter Readiness
        high_occupancy_shelters = [s for s in z_shelters if (s["occupancy"] / max(s["capacity"], 1)) > 0.70]
        if high_occupancy_shelters:
            for s in high_occupancy_shelters:
                recommendations.append({
                    "id": f"REC-{rec_counter:03d}",
                    "zone_id": zid,
                    "zone_name": zname,
                    "priority": "P2 - Urgent",
                    "category": "Shelter Logistics",
                    "title": f"Pre-position Relief Supplies at {s['name']}",
                    "detail": (
                        f"Shelter occupancy at {s['occupancy']}/{s['capacity']} ({int(s['occupancy']*100/s['capacity'])}%). "
                        f"Prepare overflow arrangements and replenish emergency rations/medical supplies."
                    ),
                    "action": "Re-route incoming evacuees to secondary high-ground centers if saturation hits 90%",
                    "recommended_resource": "Relief Transport & Medical Unit",
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
                rec_counter += 1

    # Standard general recommendations if list is small
    if len(recommendations) < 3:
        recommendations.append({
            "id": f"REC-{rec_counter:03d}",
            "zone_id": "all",
            "zone_name": "District-Wide",
            "priority": "P3 - Standard",
            "category": "Stormwater Infrastructure",
            "title": "Continuous Drainage Sump Monitoring",
            "detail": "Inspect arterial culverts and clear floating debris ahead of forecasted monsoon shower peaks.",
            "action": "Schedule pre-monsoon desilting verification on Mutha and Mula feeder channels",
            "recommended_resource": "Maintenance Squad",
            "status": "routine",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return recommendations
