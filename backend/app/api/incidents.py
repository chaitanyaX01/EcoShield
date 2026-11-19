"""Citizen and sensor incident reporting endpoints for EcoShield AI.
Allows citizens to report flooding, sewer overflow, or impassable roads,
and enables community corroboration and administrative status management.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..core.auth import get_current_admin
from ..db.database import get_connection

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

class IncidentCreate(BaseModel):
    zone_id: str
    title: str
    incident_type: str = Field(..., description="street_flooding, residential_flooding, blocked_drain, impassable_road, fallen_tree, waste_dumping, waste_blockage")
    severity: str = Field("moderate", description="low, moderate, high, critical")
    water_depth_cm: int = Field(0, ge=0, le=400)
    note: Optional[str] = None
    lat: float
    lon: float
    address: Optional[str] = None
    reporter: Optional[str] = "Anonymous Citizen"
    photo_url: Optional[str] = None
    signature: Optional[str] = None

class ConfirmRequest(BaseModel):
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    simulated_batch: Optional[int] = 1

class StatusUpdate(BaseModel):
    status: str = Field(..., description="unverified, investigating, field_resolved, verified, resolved")
    notes: Optional[str] = None
    photo_after: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_to_mobile: Optional[str] = None

def _calculate_confidence(corroborations: int, status_str: str) -> int:
    if status_str in ("verified", "resolved"):
        return 100
    if status_str in ("investigating", "field_resolved"):
        # Scales from 90% up to 98% as community confirmations reach 20-30+
        return min(98, max(90, 88 + int(corroborations * 0.3)))
    # For unverified hazard reports, confidence scales smoothly with community corroborations (e.g. 1 to 30+)
    if corroborations <= 1:
        return 45
    elif corroborations < 10:
        return min(75, 45 + (corroborations - 1) * 3)
    elif corroborations < 20:
        return min(88, 72 + int((corroborations - 10) * 1.6))
    else:
        # Reaches 90-98% as community confirmations reach 20, 30+
        return min(98, 88 + int((corroborations - 20) * 0.9))

@router.get("")
def list_incidents(
    zone_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM incidents WHERE 1=1"
    params: List[Any] = []

    if zone_id and zone_id != "all":
        query += " AND zone_id = ?"
        params.append(zone_id)
    if severity and severity != "all":
        query += " AND LOWER(severity) = LOWER(?)"
        params.append(severity)
    if status and status != "all":
        if status.lower() == "active":
            query += " AND LOWER(status) != 'resolved'"
        else:
            query += " AND LOWER(status) = LOWER(?)"
            params.append(status)
    if incident_type and incident_type != "all":
        query += " AND LOWER(incident_type) = LOWER(?)"
        params.append(incident_type)

    query += " ORDER BY created_at DESC"
    rows = cur.execute(query, params).fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["confidence_score"] = _calculate_confidence(d.get("corroborations", 1), d.get("status", "unverified"))
        confirmed_by = []
        try:
            confirmed_by = json.loads(d.get("confirmed_users_json") or "[]")
        except Exception:
            pass
        d["confirmed_by"] = confirmed_by
        result.append(d)
    return result

@router.post("")
def create_incident(payload: IncidentCreate) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    # Validate zone
    zone = cur.execute("SELECT id, name FROM zones WHERE id = ?", (payload.zone_id,)).fetchone()
    if not zone:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid zone '{payload.zone_id}'")

    incident_id = f"INC-PUNE-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    photo_before = payload.photo_url or ""
    
    initial_confirmed = []
    if payload.reporter:
        rep = payload.reporter.strip()
        initial_confirmed.append(rep)
        if "(" in rep and ")" in rep:
            extracted = rep.split("(")[1].split(")")[0].strip()
            if extracted:
                initial_confirmed.append(extracted)
            name_part = rep.split("(")[0].strip()
            if name_part:
                initial_confirmed.append(name_part)
    if not initial_confirmed:
        initial_confirmed = ["citizen_reporter"]

    cur.execute("""
        INSERT INTO incidents (
            id, zone_id, title, incident_type, severity, water_depth_cm, note,
            lat, lon, address, corroborations, status, reporter, signature,
            confirmed_users_json, photo_before, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'unverified', ?, ?, ?, ?, ?)
    """, (
        incident_id,
        payload.zone_id,
        payload.title,
        payload.incident_type,
        payload.severity.lower(),
        payload.water_depth_cm,
        payload.note or "",
        payload.lat,
        payload.lon,
        payload.address or f"{zone['name']} sector",
        payload.reporter or "Anonymous Citizen",
        payload.signature or "",
        json.dumps(initial_confirmed),
        photo_before,
        now
    ))

    # Log action
    log_detail = f"New hazard '{payload.title}' filed in {zone['name']}"
    if payload.signature:
        log_detail += " (Digitally signed by citizen)"
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Citizen Report Filed", payload.reporter or "Anonymous Citizen", log_detail, now))

    conn.commit()
    conn.close()

    return {
        "id": incident_id,
        "status": "unverified",
        "confidence_score": 45,
        "corroborations": 1,
        "signature": payload.signature or "",
        "photo_before": photo_before,
        "message": "Hazard report successfully submitted to Pune Emergency Operations Center.",
        "created_at": now
    }

@router.post("/{incident_id}/confirm")
def confirm_incident(incident_id: str, payload: Optional[ConfirmRequest] = None) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found.")

    confirmed_users: List[str] = []
    try:
        confirmed_users = json.loads(row["confirmed_users_json"] or "[]")
    except Exception:
        confirmed_users = []

    current_corroborations = row["corroborations"] or 1
    req = payload or ConfirmRequest()
    batch_count = req.simulated_batch if req.simulated_batch and req.simulated_batch > 0 else 1

    # Single citizen confirmation: strictly enforce 1 user = 1 confirm
    if batch_count == 1:
        uid = (req.user_id or "").strip().lower()
        uname = (req.user_name or "").strip().lower()
        if not uid and not uname:
            uid = "current_citizen"

        already_confirmed = False
        for entry in confirmed_users:
            e = str(entry).strip().lower()
            if uid and (uid == e or uid in e or e in uid):
                already_confirmed = True
                break
            if uname and (uname == e or uname in e or e in uname):
                already_confirmed = True
                break

        if already_confirmed:
            conn.close()
            return {
                "id": incident_id,
                "corroborations": current_corroborations,
                "status": row["status"],
                "confidence_score": _calculate_confidence(current_corroborations, row["status"]),
                "already_confirmed": True,
                "confirmed_by": confirmed_users,
                "message": "You have already confirmed this hazard report. 1 user can only make 1 confirmation."
            }

        primary_id = req.user_id or req.user_name or "citizen_user"
        confirmed_users.append(primary_id)
        new_corroborations = current_corroborations + 1
    else:
        # Community batch simulation (e.g. +5, +10, +20, +30 community confirmations)
        for i in range(batch_count):
            tag = f"citizen_neighbor_{uuid.uuid4().hex[:5]}"
            confirmed_users.append(tag)
        new_corroborations = current_corroborations + batch_count

    # Auto-escalate to 'investigating' if 4+ citizens corroborate
    new_status = row["status"]
    if new_corroborations >= 4 and new_status == "unverified":
        new_status = "investigating"

    cur.execute(
        "UPDATE incidents SET corroborations = ?, status = ?, confirmed_users_json = ? WHERE id = ?",
        (new_corroborations, new_status, json.dumps(confirmed_users), incident_id)
    )

    now = datetime.now(timezone.utc).isoformat()
    actor_desc = f"{req.user_name or 'Citizen'}" if batch_count == 1 else f"Community Crowd (+{batch_count})"
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Report Corroborated", actor_desc, f"Incident '{row['title']}' confirmed by community member(s) (+{batch_count}, Total: {new_corroborations})", now))

    conn.commit()
    conn.close()

    return {
        "id": incident_id,
        "corroborations": new_corroborations,
        "status": new_status,
        "confidence_score": _calculate_confidence(new_corroborations, new_status),
        "already_confirmed": False,
        "confirmed_by": confirmed_users,
        "message": f"Thank you for confirming. Community corroborations updated to {new_corroborations}."
    }

@router.post("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    payload: StatusUpdate,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found.")

    now = datetime.now(timezone.utc).isoformat()
    new_status = payload.status.lower()

    # Dynamic SQL builder to handle status, photo_after, resolved_at, and assigned personnel
    update_fields = ["status = ?"]
    update_vals: List[Any] = [new_status]

    if payload.photo_after:
        update_fields.append("photo_after = ?")
        update_vals.append(payload.photo_after)

    if new_status == "resolved":
        update_fields.append("resolved_at = ?")
        update_vals.append(now)

    if payload.assigned_to:
        update_fields.append("assigned_to = ?")
        update_vals.append(payload.assigned_to)
    if payload.assigned_to_name:
        update_fields.append("assigned_to_name = ?")
        update_vals.append(payload.assigned_to_name)
    if payload.assigned_to_mobile:
        update_fields.append("assigned_to_mobile = ?")
        update_vals.append(payload.assigned_to_mobile)
    if payload.assigned_to or payload.assigned_to_name:
        update_fields.append("assigned_at = ?")
        update_vals.append(now)

    update_vals.append(incident_id)
    cur.execute(f"UPDATE incidents SET {', '.join(update_fields)} WHERE id = ?", update_vals)

    actor_name = admin.get("name", "Duty Officer")
    log_action = "Incident Status Updated"
    log_detail = f"Incident '{row['title']}' updated to '{new_status.upper()}' ({payload.notes or 'Operations update'})"

    if new_status == "investigating":
        if payload.assigned_to_name:
            log_action = "Work Assigned to Field Officer"
            log_detail = f"Duty Officer assigned incident '{row['title']}' to Field Officer {payload.assigned_to_name} (+91 {payload.assigned_to_mobile or ''})"
        else:
            log_action = "Submitted to Field Response"
    elif new_status == "field_resolved":
        log_action = "Field Work Done Proof Submitted"
        log_detail = f"Field Officer submitted proof of work done for '{row['title']}'"
    elif new_status == "resolved":
        log_action = "Hazard Verified & Solved"
        log_detail = f"Duty Officer verified field clearance proof for '{row['title']}' - officially solved."

    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, (log_action, actor_name, log_detail, now))

    conn.commit()
    conn.close()

    return {
        "id": incident_id,
        "status": new_status,
        "updated_by": actor_name,
        "assigned_to": payload.assigned_to,
        "assigned_to_name": payload.assigned_to_name,
        "assigned_to_mobile": payload.assigned_to_mobile,
        "photo_after": payload.photo_after,
        "timestamp": now,
    }
