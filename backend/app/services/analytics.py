"""Analytics aggregation service for EcoShield AI Command Center.
Supplies structured charting data for zone risk, incident categories, alert severity,
resource availability, report status, and weather trend telemetry.
"""
from __future__ import annotations

from typing import Any, Dict, List

from ..db.database import get_connection
from .prediction import get_metadata
from .weather import get_weather_summary

def get_analytics_summary() -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    zones = cur.execute("SELECT * FROM zones").fetchall()
    incidents = cur.execute("SELECT * FROM incidents").fetchall()
    alerts = cur.execute("SELECT * FROM alerts").fetchall()
    resources = cur.execute("SELECT * FROM resources").fetchall()
    shelters = cur.execute("SELECT * FROM shelters").fetchall()
    conn.close()

    weather = get_weather_summary()

    # 1. Zone Risk Distribution
    risk_counts = {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
    zone_risk_bars = []
    for z in zones:
        lvl = z["risk_level"]
        risk_counts[lvl] = risk_counts.get(lvl, 0) + 1
        zone_risk_bars.append({
            "zone": z["name"],
            "risk_level": lvl,
            "elevation": z["elevation_m"],
            "drainage_score": z["drainage_score"],
            "previous_floods": z["previous_floods"],
        })

    # 2. Incident Categories Breakdown
    incident_types = {}
    incident_status_counts = {"unverified": 0, "investigating": 0, "verified": 0, "resolved": 0}
    for inc in incidents:
        t = inc["incident_type"].replace("_", " ").title()
        incident_types[t] = incident_types.get(t, 0) + 1
        st = inc["status"].lower()
        incident_status_counts[st] = incident_status_counts.get(st, 0) + 1

    incident_category_chart = [{"name": k, "count": v} for k, v in incident_types.items()]
    incident_status_chart = [{"status": k.title(), "count": v} for k, v in incident_status_counts.items()]

    # 3. Alert Severity Breakdown
    alert_severity_counts = {"critical": 0, "high": 0, "moderate": 0, "info": 0}
    for alt in alerts:
        sev = alt["severity"].lower()
        alert_severity_counts[sev] = alert_severity_counts.get(sev, 0) + 1
    alert_severity_chart = [{"severity": k.title(), "count": v} for k, v in alert_severity_counts.items()]

    # 4. Resource Readiness and Types
    resource_status = {"Deployed": 0, "Standby": 0, "Maintenance": 0}
    resource_types = {}
    for r in resources:
        st = r["status"]
        resource_status[st] = resource_status.get(st, 0) + 1
        tp = r["type"]
        resource_types[tp] = resource_types.get(tp, 0) + 1

    resource_status_chart = [{"status": k, "count": v} for k, v in resource_status.items()]
    resource_type_chart = [{"type": k, "count": v} for k, v in resource_types.items()]

    # 5. Live Zone Weather Comparison from Google Weather API
    weather_trend = [
        {
            "time": z.get("zone_name", "").split(" - ")[0],
            "rainfall_mm": z.get("rainfall_last_hour_mm", 0.0),
            "humidity_pct": int(z.get("humidity_percent", 50)),
            "temp_c": z.get("temperature_c", 26.0),
        }
        for z in weather.get("zones", [])
    ]

    # 6. ML Model Evaluation Metrics
    # Matches preserved F1 benchmark chart
    ml_models_benchmark = [
        {"model": "Extra Trees (Best)", "f1_score": 0.892, "accuracy": 0.936, "is_active": True},
        {"model": "Random Forest", "f1_score": 0.871, "accuracy": 0.920, "is_active": False},
        {"model": "Gradient Boosting", "f1_score": 0.854, "accuracy": 0.908, "is_active": False},
        {"model": "Decision Tree", "f1_score": 0.795, "accuracy": 0.864, "is_active": False},
        {"model": "Logistic Regression", "f1_score": 0.768, "accuracy": 0.842, "is_active": False},
        {"model": "Linear SVM", "f1_score": 0.742, "accuracy": 0.825, "is_active": False},
    ]

    return {
        "district": "Pune Metropolitan Area",
        "zones_monitored": len(zones),
        "total_incidents": len(incidents),
        "total_active_alerts": len([a for a in alerts if a["status"] == "active"]),
        "total_resources": len(resources),
        "zone_risk_bars": zone_risk_bars,
        "risk_distribution": [{"level": k, "count": v} for k, v in risk_counts.items()],
        "incident_category_chart": incident_category_chart,
        "incident_status_chart": incident_status_chart,
        "alert_severity_chart": alert_severity_chart,
        "resource_status_chart": resource_status_chart,
        "resource_type_chart": resource_type_chart,
        "weather_trend": weather_trend,
        "ml_benchmark": {
            "best_model": "Extra Trees Classifier",
            "best_f1": 0.892,
            "disclaimer": "Evaluated on Pune watershed hydrology metrics with live Google Weather telemetry integration.",
            "comparison": ml_models_benchmark,
            "f1_chart_url": "/api/analytics/f1-chart",
        }
    }
