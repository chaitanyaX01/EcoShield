"""Flash Flood Simulation service for EcoShield AI Command Center.
Allows emergency planners to rehearse flash flood scenarios for specific Pune zones.
Simulates meteorological surges, recalculates Extra Trees ML predictions,
estimates exposed populations, suggests resource mobilization, and plots safe evacuation corridors.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..db.database import get_connection
from .prediction import predict_flood_risk
from .routing import generate_safe_route

SEVERITY_PROFILES = {
    "moderate": {
        "label": "Moderate Surge (35 mm/h)",
        "added_rain": 35.0,
        "soil_sat_boost": 15.0,
        "description": "Steady heavy downpour saturating secondary stormwater drains.",
    },
    "severe": {
        "label": "Severe Monsoon Deluge (75 mm/h)",
        "added_rain": 75.0,
        "soil_sat_boost": 28.0,
        "description": "Intense torrential rainfall leading to bank overflow and arterial street submergence.",
    },
    "extreme": {
        "label": "Extreme Cloudburst (125 mm/h)",
        "added_rain": 125.0,
        "soil_sat_boost": 35.0,
        "description": "Exceptional cloudburst event overwhelming natural canals and low-lying ground units.",
    },
}

def run_flash_flood_simulation(
    zone_id: str,
    severity_level: str = "severe"
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    zone = cur.execute("SELECT * FROM zones WHERE id = ?", (zone_id,)).fetchone()
    if not zone:
        conn.close()
        return {"error": f"Zone '{zone_id}' not found in Pune district database."}

    # Baseline features
    baseline_rain = 15.0
    profile = SEVERITY_PROFILES.get(severity_level.lower(), SEVERITY_PROFILES["severe"])
    simulated_rain = baseline_rain + profile["added_rain"]
    baseline_soil_sat = 55.0
    simulated_soil_sat = min(98.0, baseline_soil_sat + profile["soil_sat_boost"])

    # Predict baseline
    baseline_pred = predict_flood_risk({
        "rainfall_mm_h": baseline_rain,
        "humidity_pct": 72.0,
        "temperature_c": 27.0,
        "drainage_score": zone["drainage_score"],
        "previous_flood": zone["previous_floods"],
        "elevation_m": zone["elevation_m"],
        "population_density": zone["population_density"],
        "soil_saturation": baseline_soil_sat,
    })

    # Predict simulated surge
    simulated_pred = predict_flood_risk({
        "rainfall_mm_h": simulated_rain,
        "humidity_pct": 92.0,
        "temperature_c": 24.5,
        "drainage_score": zone["drainage_score"],
        "previous_flood": zone["previous_floods"],
        "elevation_m": zone["elevation_m"],
        "population_density": zone["population_density"],
        "soil_saturation": simulated_soil_sat,
    })

    # Estimate affected citizens
    # Pop density per sq km in zone * vulnerable exposure factor
    vuln_factor = 0.08 if simulated_pred["risk_level"] == "Low" else (
        0.18 if simulated_pred["risk_level"] == "Moderate" else (
            0.32 if simulated_pred["risk_level"] == "High" else 0.52
        )
    )
    approx_zone_area_km2 = 2.4
    estimated_affected_citizens = int(zone["population_density"] * approx_zone_area_km2 * vuln_factor)

    # Find designated shelters in or adjacent to this zone
    local_shelters = cur.execute("SELECT * FROM shelters WHERE zone_id = ?", (zone_id,)).fetchall()
    all_shelters = cur.execute("SELECT * FROM shelters").fetchall()

    target_shelter = local_shelters[0] if local_shelters else (all_shelters[0] if all_shelters else None)

    # Evacuation Route
    safe_route = None
    if target_shelter:
        safe_route = generate_safe_route(
            start_lat=zone["lat"],
            start_lon=zone["lon"],
            shelter_id=target_shelter["id"],
            zone_id=zone_id
        )

    # Recommended resources
    suggested_resources: List[Dict[str, Any]] = [
        {
            "type": "Heavy-Duty Submersible Dewatering Pump",
            "quantity": 3 if simulated_pred["risk_level"] in ("High", "Critical") else 1,
            "purpose": "Deploy to key low-point drainage sumps and highway underpasses.",
        },
        {
            "type": "Inflatable Rescue Boat Team (NDRF / PMC Fire)",
            "quantity": 2 if simulated_pred["risk_level"] in ("High", "Critical") else 0,
            "purpose": "Evacuate trapped ground-floor citizens along riverbank corridors.",
        },
        {
            "type": "Emergency Transit Shuttle",
            "quantity": 4,
            "purpose": f"Ferry vulnerable residents to {target_shelter['name'] if target_shelter else 'Relief Center'}.",
        },
        {
            "type": "Paramedic Field Unit",
            "quantity": 1,
            "purpose": "First-aid triage station at designated assembly point.",
        }
    ]

    conn.close()

    return {
        "simulation_id": f"SIM-{zone_id.upper()}-{int(datetime.now(timezone.utc).timestamp())}",
        "is_simulation": True,
        "disclaimer": "SIMULATION ONLY — Data produced for contingency drill and operational stress-testing.",
        "zone": {
            "id": zone["id"],
            "name": zone["name"],
            "display_name": zone["display_name"],
            "lat": zone["lat"],
            "lon": zone["lon"],
            "elevation_m": zone["elevation_m"],
            "drainage_score": zone["drainage_score"],
            "population_density": zone["population_density"],
        },
        "severity_selected": severity_level,
        "severity_profile": profile,
        "meteorological_inputs": {
            "baseline_rainfall_mm_h": baseline_rain,
            "simulated_rainfall_mm_h": simulated_rain,
            "simulated_soil_saturation_pct": simulated_soil_sat,
        },
        "before_after_comparison": {
            "baseline": {
                "risk_level": baseline_pred["risk_level"],
                "probability": baseline_pred["probability"],
                "status": "Pre-Surge Ambient Condition",
            },
            "simulated": {
                "risk_level": simulated_pred["risk_level"],
                "probability": simulated_pred["probability"],
                "status": "Flash Flood Deluge State",
                "recommended_action": simulated_pred["recommended_action"],
            }
        },
        "impact_assessment": {
            "estimated_exposed_population": estimated_affected_citizens,
            "inundation_depth_forecast_cm": 45 if simulated_pred["risk_level"] == "High" else (85 if simulated_pred["risk_level"] == "Critical" else 20),
            "critical_infrastructure_threatened": [
                "Arterial storm sewer junctions",
                "Low-lying residential basements and underground parking",
                "Ground-level power substation distribution transformers",
            ],
        },
        "suggested_resources": suggested_resources,
        "destination_shelter": {
            "id": target_shelter["id"] if target_shelter else "N/A",
            "name": target_shelter["name"] if target_shelter else "District Relief Shelter",
            "capacity": target_shelter["capacity"] if target_shelter else 500,
            "occupancy": target_shelter["occupancy"] if target_shelter else 0,
        } if target_shelter else None,
        "evacuation_route": safe_route,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
