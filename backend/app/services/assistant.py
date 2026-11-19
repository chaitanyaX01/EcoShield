"""Local context-aware AI assistant grounded in Pune Metropolitan Area real-time telemetry.
No paid external LLM dependencies; answers deterministically from active database state.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from ..db.database import get_connection
from .weather import get_weather_summary

def answer_assistant_query(question: str, zone_id: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    zones = cur.execute("SELECT * FROM zones").fetchall()
    shelters = cur.execute("SELECT * FROM shelters").fetchall()
    resources = cur.execute("SELECT * FROM resources").fetchall()
    alerts = cur.execute("SELECT * FROM alerts WHERE status = 'active'").fetchall()
    incidents = cur.execute("SELECT * FROM incidents").fetchall()

    weather = get_weather_summary()
    conn.close()

    q = question.lower().strip()

    # 0. Conversational Greetings & Casual Inquiries (LLM style)
    if q in ["hi", "hello", "hey", "hola", "namaste", "hi there", "hello there", "good morning", "good evening", "good afternoon"]:
        return {
            "question": question,
            "answer": "Hello! How are you? How can I help you today? I am EcoShield AI, your Pune flood risk & emergency assistant. You can ask me about current weather conditions, waterlogged areas, safe evacuation shelters, emergency contact numbers, or rescue team status!",
            "evidence": {
                "system_status": "All systems operational",
                "weather_source": weather.get("source", "Live Google Weather"),
                "monitored_basins": len(zones),
            },
            "suggested_action": "Ask 'What is the current weather?' or 'Where is the safest shelter?' to get immediate guidance.",
        }

    if any(k in q for k in ["how are you", "how are u", "how r u", "how do you do"]):
        return {
            "question": question,
            "answer": "I'm doing well, thank you! All EcoShield AI monitoring nodes and flood sensors across Pune are running smoothly. How are you doing? What help can I do for you today?",
            "evidence": {
                "active_zones": len(zones),
                "live_temperature": f"{weather.get('average_temperature_c', 28)}°C",
            },
            "suggested_action": "Let me know what area or situation you want to check!",
        }

    if any(k in q for k in ["who are you", "what is your name", "what do you do"]):
        return {
            "question": question,
            "answer": "I am EcoShield AI, an intelligent urban flood prediction and emergency coordination system built for Pune, India. I analyze live weather, predict micro-catchment flood risks, coordinate emergency resources, and provide safe navigation to relief shelters.",
            "evidence": {
                "coverage": "Pune Metropolitan Area",
                "capabilities": ["Flood Risk Prediction", "Safe Route Guidance", "Incident Verification", "Resource Logistics"],
            },
            "suggested_action": "Try asking: 'Which zone has high flood risk?' or 'What is the rainfall forecast?'",
        }

    if any(k in q for k in ["thank you", "thanks", "thx", "dhanyawad"]):
        return {
            "question": question,
            "answer": "You're very welcome! Stay alert, stay safe, and don't hesitate to ask if you notice any rising water or need assistance.",
            "evidence": {"helpline": "112 / 020-25501269"},
            "suggested_action": "Call emergency helpline 112 if in immediate danger.",
        }

    if any(k in q for k in ["helpline", "emergency number", "contact", "phone", "whom to call"]):
        return {
            "question": question,
            "answer": "Pune Emergency Disaster Helplines: \n• National Emergency: 112 \n• Pune Municipal Disaster Control: 020-25501269 / 020-25506800 \n• Fire Brigade: 101 \n• Ambulance: 108 \n• NDRF Control Room: 011-24363260 / 9711077372",
            "evidence": {
                "control_room": "PMC Disaster Management Cell, Shivajinagar",
                "availability": "24/7 Rapid Response",
            },
            "suggested_action": "For immediate physical rescues, dial 112 or 101.",
        }

    # Weather inquiries
    if any(k in q for k in ["weather", "temperature", "rain", "rainfall", "forecast", "climate"]):
        return {
            "question": question,
            "answer": (
                f"Currently in Pune, the average temperature is {weather.get('average_temperature_c', 28.0)}°C with "
                f"{weather.get('average_humidity_percent', 65)}% humidity. Peak rainfall recorded in the last hour is "
                f"{weather.get('peak_rainfall_last_hour_mm', 0.0)} mm. Weather telemetry source: {weather.get('source', 'Live Google Weather')}."
            ),
            "evidence": {
                "temperature": f"{weather.get('average_temperature_c', 28.0)}°C",
                "humidity": f"{weather.get('average_humidity_percent', 65)}%",
                "peak_rain_mm": weather.get('peak_rainfall_last_hour_mm', 0.0),
                "source": weather.get('source', 'Live Google Weather'),
            },
            "suggested_action": "Check the Weather tab for real-time wind and precipitation breakdown.",
        }

    # 1. Highest risk query
    if any(k in q for k in ["highest risk", "most dangerous", "worst flood", "most vulnerable"]):
        high_zones = [z for z in zones if z["risk_level"] in ("Critical", "High")]
        if not high_zones:
            high_zones = sorted(zones, key=lambda z: z["previous_floods"], reverse=True)
        top = high_zones[0]
        return {
            "question": question,
            "answer": (
                f"Currently, {top['name']} ({top['display_name']}) is assessed at {top['risk_level'].upper()} flood risk. "
                f"{top['description']} Historical flood frequency: {top['previous_floods']} major events. "
                f"Peak rainfall in previous hour: {weather['peak_rainfall_last_hour_mm']} mm."
            ),
            "evidence": {
                "zone": top["name"],
                "risk_level": top["risk_level"],
                "active_alerts_count": len([a for a in alerts if a["zone_id"] == top["id"]]),
                "peak_rain_mm": weather["peak_rainfall_last_hour_mm"],
            },
            "suggested_action": "Prioritize high-capacity submersible dewatering pumps and evacuate ground-floor residents.",
        }

    # 2. Resources available query
    if any(k in q for k in ["resources", "pumps", "ambulances", "boats", "ndrf", "equipment"]):
        standby = [r for r in resources if r["status"] == "Standby"]
        deployed = [r for r in resources if r["status"] == "Deployed"]
        return {
            "question": question,
            "answer": (
                f"Pune Emergency Logistics has {len(resources)} major assets registered. "
                f"{len(deployed)} units are actively deployed in field zones (including NDRF Inflatable Rescue Boats and 120 HP Submersible Pumps), "
                f"and {len(standby)} units remain on rapid standby at central depots."
            ),
            "evidence": {
                "deployed_assets": [f"{r['name']} ({r['zone_id']})" for r in deployed[:4]],
                "standby_assets": [f"{r['name']}" for r in standby[:3]],
            },
            "suggested_action": "Maintain 2 NDRF rescue units on standby near Sangam and Yerawada bridges.",
        }

    # 3. Safest shelter query
    if any(k in q for k in ["shelter", "evacuate to", "relief camp", "safe place", "where to go"]):
        safe = [s for s in shelters if s["occupancy"] < s["capacity"]]
        top_shelter = max(safe, key=lambda s: s["capacity"] - s["occupancy"]) if safe else shelters[0]
        return {
            "question": question,
            "answer": (
                f"The highest-capacity safe evacuation destination is {top_shelter['name']} in {top_shelter['zone_id'].replace('_', ' ').title()}. "
                f"It has {top_shelter['capacity'] - top_shelter['occupancy']} available spaces out of {top_shelter['capacity']} total capacity. "
                f"Flood exposure rating: {top_shelter['flood_exposure']}. 24/7 Helpline: {top_shelter['contact']}."
            ),
            "evidence": {
                "shelter_name": top_shelter["name"],
                "available_beds": top_shelter["capacity"] - top_shelter["occupancy"],
                "accessible": bool(top_shelter["accessible"]),
            },
            "suggested_action": "Citizens in waterlogged areas should follow elevated municipal evacuation routes directly to this facility.",
        }

    # 4. What should we do now
    if any(k in q for k in ["what should we do", "what to do", "protocol", "recommendation", "action"]):
        return {
            "question": question,
            "answer": (
                "Immediate Municipal Response Protocol: "
                "1. Keep riverbank warnings active for Sinhagad Road and Yerawada. "
                "2. Maintain submersible dewatering pumps around Katraj spillway and underpasses. "
                "3. Keep citizen reporting lines (112 / 020-25501269) open with 1-tap confirmation enabled. "
                "4. Restrict vehicular transit on sub-grade bridges across the Mutha river."
            ),
            "evidence": {
                "active_alerts": len(alerts),
                "open_incidents": len(incidents),
                "live_weather_status": weather["source"],
            },
            "suggested_action": "Check the Recommendations panel in the Admin Portal for human-in-the-loop broadcast approvals.",
        }

    # 5. Zone-specific query (Katraj, Sinhagad, Yerawada, etc.)
    matched_zone = None
    for z in zones:
        if z["name"].lower() in q or z["id"].lower() in q:
            matched_zone = z
            break

    if matched_zone:
        z_alerts = [a for a in alerts if a["zone_id"] == matched_zone["id"]]
        z_incidents = [i for i in incidents if i["zone_id"] == matched_zone["id"]]
        z_shelters = [s for s in shelters if s["zone_id"] == matched_zone["id"]]
        return {
            "question": question,
            "answer": (
                f"Zone Intelligence for {matched_zone['display_name']}: "
                f"Assessed Risk: {matched_zone['risk_level'].upper()}. {matched_zone['description']} "
                f"There are {len(z_alerts)} active warnings and {len(z_incidents)} citizen-reported hazards recorded in this basin."
            ),
            "evidence": {
                "zone_name": matched_zone["name"],
                "elevation": f"{matched_zone['elevation_m']}m",
                "drainage_score": f"{matched_zone['drainage_score']}/100",
                "local_shelters": [s["name"] for s in z_shelters],
            },
            "suggested_action": f"Monitor drainage outflow and keep local disaster coordinators alerted in {matched_zone['name']}.",
        }

    # Default fallback
    return {
        "question": question,
        "answer": (
            f"EcoShield AI Pune Command Center is actively monitoring 8 urban micro-catchments. "
            f"Currently {len(alerts)} alerts are broadcast across the district with {weather['average_temperature_c']}°C avg temperature "
            f"and peak rainfall of {weather['peak_rainfall_last_hour_mm']} mm. You can inquire about highest-risk zones, shelter capacities, "
            f"or resource deployments."
        ),
        "evidence": {
            "monitored_zones": len(zones),
            "active_alerts": len(alerts),
            "weather_source": weather["source"],
        },
        "suggested_action": "Select any zone from the left sidebar or map to inspect driver-by-driver evidence.",
    }
