"""Alert management endpoints for EcoShield AI Command Center.
Enables duty commanders to inspect, broadcast, acknowledge, escalate, resolve, or dismiss emergency alerts.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..core.auth import get_current_admin
from ..db.database import get_connection
from ..services.email_service import dispatch_broadcast_email

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

class AlertCreate(BaseModel):
    title: str
    severity: str = Field("high", description="info, moderate, high, critical")
    zone_id: str
    action: str
    source: Optional[str] = "EcoShield Operations Center"

@router.get("")
def list_alerts(
    zone_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT a.*, z.name as zone_name
        FROM alerts a
        JOIN zones z ON a.zone_id = z.id
        WHERE 1=1
    """
    params: List[Any] = []
    if zone_id and zone_id != "all":
        query += " AND a.zone_id = ?"
        params.append(zone_id)
    if severity and severity != "all":
        query += " AND LOWER(a.severity) = LOWER(?)"
        params.append(severity)
    if status and status != "all":
        query += " AND LOWER(a.status) = LOWER(?)"
        params.append(status)

    query += " ORDER BY a.created_at DESC"
    rows = cur.execute(query, params).fetchall()
    conn.close()

    return [dict(r) for r in rows]

@router.post("")
def create_alert(
    payload: AlertCreate,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    zone = cur.execute("SELECT id, name FROM zones WHERE id = ?", (payload.zone_id,)).fetchone()
    if not zone:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid zone ID.")

    alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()

    cur.execute("""
        INSERT INTO alerts (id, title, severity, zone_id, status, action, created_at, source)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
    """, (
        alert_id,
        payload.title,
        payload.severity.lower(),
        payload.zone_id,
        payload.action,
        now,
        payload.source or "EcoShield Operations Center"
    ))

    actor = admin.get("name", "Duty Officer")
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Alert Broadcasted", actor, f"Issued {payload.severity.upper()} alert for {zone['name']}: {payload.title}", now))

    conn.commit()
    conn.close()

    return {
        "id": alert_id,
        "title": payload.title,
        "severity": payload.severity,
        "status": "active",
        "created_at": now,
        "message": f"Alert successfully broadcasted for {zone['name']}."
    }

class MunicipalBroadcastRequest(BaseModel):
    title: Optional[str] = "FLASH FLOOD EMERGENCY WARNING: RED ALERT"
    action: Optional[str] = "Immediate evacuation to designated shelters. High-capacity dewatering pumps deployed. Field response units mobilize immediately."
    zone_ids: Optional[List[str]] = None

@router.post("/broadcast-municipal")
def broadcast_municipal_emergency(
    payload: MunicipalBroadcastRequest,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    """Broadcasts a high-priority Municipal Emergency Alert across Pune to all Citizens, Resourcers, and Field Response Teams."""
    conn = get_connection()
    cur = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    actor = admin.get("name", "Duty Commander")
    alert_id = f"MUNI-RED-{uuid.uuid4().hex[:6].upper()}"

    # Get all active zones or requested zones
    zones = cur.execute("SELECT id, name FROM zones").fetchall()
    zone_names = [z["name"] for z in zones]

    # Create master municipal alert targeting all 3 groups
    primary_zone_id = zone_names[0] if zone_names else "sinhagad_rd"
    first_zone = zones[0]["id"] if zones else "sinhagad_rd"
    cur.execute("""
        INSERT INTO alerts (id, title, severity, zone_id, status, action, created_at, source, target_audiences)
        VALUES (?, ?, 'critical', ?, 'active', ?, ?, ?, 'citizen,resourcer,responder')
    """, (
        alert_id,
        payload.title or "FLASH FLOOD EMERGENCY WARNING: RED ALERT",
        first_zone,
        payload.action or "Immediate evacuation to designated shelters. Resourcers deploy water pumps. Field teams initiate rescue ops.",
        now,
        "Pune Municipal Corporation & EcoShield Operations"
    ))

    # Log broadcast activity
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        "Municipal Emergency Broadcast",
        actor,
        f"BROADCAST ISSUED TO ALL CITIZENS, RESOURCERS & FIELD TEAMS: {payload.title}",
        now
    ))

    conn.commit()
    conn.close()

    # Dispatch email broadcast to all registered users (via Gmail / SMTP relay)
    email_report = dispatch_broadcast_email(
        title=payload.title or "FLASH FLOOD EMERGENCY WARNING: RED ALERT",
        action=payload.action or "Immediate evacuation to designated shelters.",
        alert_id=alert_id,
        zone_names=zone_names
    )

    return {
        "alert_id": alert_id,
        "status": "broadcasted",
        "severity": "CRITICAL",
        "title": payload.title,
        "target_audiences": ["citizen", "resourcer", "responder"],
        "zones_affected": zone_names,
        "timestamp": now,
        "broadcast_by": actor,
        "email_report": email_report,
        "recipients_notified": email_report.get("sent_count", 0),
        "message": f"Municipal emergency alarm successfully dispatched to all Citizens, Equipment Resourcers, and Field Response Units. Emails sent to {email_report.get('sent_count', 0)} registered user accounts via Gmail."
    }


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    return _update_alert_status(alert_id, "acknowledged", "Alert Acknowledged", admin)

@router.post("/{alert_id}/escalate")
def escalate_alert(
    alert_id: str,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    alt = cur.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alt:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found.")

    new_severity = "critical" if alt["severity"] != "critical" else "critical"
    cur.execute("UPDATE alerts SET severity = ?, status = 'escalated' WHERE id = ?", (new_severity, alert_id))

    actor = admin.get("name", "Duty Officer")
    now = datetime.now(timezone.utc).isoformat()
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Alert Escalated", actor, f"Escalated alert '{alt['title']}' to CRITICAL priority", now))

    conn.commit()
    conn.close()

    return {"id": alert_id, "status": "escalated", "severity": new_severity, "timestamp": now}

@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    return _update_alert_status(alert_id, "resolved", "Alert Resolved", admin)

@router.post("/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: str,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    return _update_alert_status(alert_id, "dismissed", "Alert Dismissed", admin)

def _update_alert_status(alert_id: str, new_status: str, log_action: str, admin: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    alt = cur.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alt:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found.")

    cur.execute("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))

    actor = admin.get("name", "Duty Officer")
    now = datetime.now(timezone.utc).isoformat()
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, (log_action, actor, f"Marked alert '{alt['title']}' as {new_status.upper()}", now))

    conn.commit()
    conn.close()

    return {"id": alert_id, "status": new_status, "updated_by": actor, "timestamp": now}
