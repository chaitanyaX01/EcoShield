"""Emergency resource inventory and deployment endpoints.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..core.auth import get_current_admin
from ..db.database import get_connection

router = APIRouter(prefix="/api/resources", tags=["Resources"])

class DeployRequest(BaseModel):
    zone_id: str
    notes: Optional[str] = None
    operator: Optional[str] = None
    operator_mobile: Optional[str] = None
    operator_user_id: Optional[str] = None

@router.get("")
def list_resources(
    zone_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT r.*, z.name as zone_name
        FROM resources r
        JOIN zones z ON r.zone_id = z.id
        WHERE 1=1
    """
    params: List[Any] = []
    if zone_id and zone_id != "all":
        query += " AND r.zone_id = ?"
        params.append(zone_id)
    if status and status != "all":
        query += " AND LOWER(r.status) = LOWER(?)"
        params.append(status)
    if resource_type and resource_type != "all":
        query += " AND LOWER(r.type) = LOWER(?)"
        params.append(resource_type)

    query += " ORDER BY r.status ASC, r.id ASC"
    rows = cur.execute(query, params).fetchall()
    conn.close()

    return [dict(r) for r in rows]

@router.post("/{resource_id}/deploy")
def deploy_resource(
    resource_id: str,
    payload: DeployRequest,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    res = cur.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    if not res:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found.")

    zone = cur.execute("SELECT * FROM zones WHERE id = ?", (payload.zone_id,)).fetchone()
    if not zone:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Target zone '{payload.zone_id}' not recognized.")

    now = datetime.now(timezone.utc).isoformat()
    
    if payload.operator:
        cur.execute(
            """UPDATE resources 
               SET zone_id = ?, status = 'Deployed', operator = ?, operator_mobile = ?, operator_user_id = ?, assigned_at = ?
               WHERE id = ?""",
            (payload.zone_id, payload.operator, payload.operator_mobile or "", payload.operator_user_id or "", now, resource_id)
        )
    else:
        cur.execute(
            "UPDATE resources SET zone_id = ?, status = 'Deployed' WHERE id = ?",
            (payload.zone_id, resource_id)
        )

    actor_name = admin.get("name", "Duty Officer")
    assign_msg = f" [Assigned Resourcer: {payload.operator}]" if payload.operator else ""
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Resource Deployed", actor_name, f"Dispatched {res['name']} to {zone['name']} sector{assign_msg} ({payload.notes or 'Routine tactical response'})", now))

    conn.commit()
    conn.close()

    return {
        "id": resource_id,
        "name": res["name"],
        "zone_id": payload.zone_id,
        "zone_name": zone["name"],
        "status": "Deployed",
        "operator": payload.operator or res["operator"],
        "deployed_by": actor_name,
        "timestamp": now,
        "message": f"Successfully dispatched {res['name']} to {zone['name']}."
    }

@router.post("/{resource_id}/recall")
def recall_resource(
    resource_id: str,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    res = cur.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    if not res:
        conn.close()
        raise HTTPException(status_code=404, detail="Resource not found.")

    now = datetime.now(timezone.utc).isoformat()
    cur.execute("UPDATE resources SET status = 'Standby' WHERE id = ?", (resource_id,))

    actor_name = admin.get("name", "Duty Officer")
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Resource Recalled", actor_name, f"Reassigned {res['name']} to Central Depot Standby", now))

    conn.commit()
    conn.close()

    return {
        "id": resource_id,
        "name": res["name"],
        "status": "Standby",
        "recalled_by": actor_name,
        "timestamp": now
    }

class WorkDoneRequest(BaseModel):
    photo_after: Optional[str] = None
    notes: Optional[str] = None

@router.post("/{resource_id}/work-done")
def complete_resource_work(
    resource_id: str,
    payload: WorkDoneRequest,
    admin: Dict[str, Any] = Depends(get_current_admin)
) -> Dict[str, Any]:
    conn = get_connection()
    cur = conn.cursor()

    res = cur.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    if not res:
        conn.close()
        raise HTTPException(status_code=404, detail="Resource not found.")

    now = datetime.now(timezone.utc).isoformat()
    if payload.photo_after:
        cur.execute("UPDATE resources SET status = 'Standby', photo_after = ? WHERE id = ?", (payload.photo_after, resource_id))
    else:
        cur.execute("UPDATE resources SET status = 'Standby' WHERE id = ?", (resource_id,))

    actor_name = admin.get("name", "Field Responder")
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("Resource Mission Completed", actor_name, f"Field mission complete for {res['name']}. Unit returned to Standby. ({payload.notes or 'Work verified with completion photo'})", now))

    conn.commit()
    conn.close()

    return {
        "id": resource_id,
        "name": res["name"],
        "status": "Standby",
        "photo_after": payload.photo_after,
        "completed_by": actor_name,
        "timestamp": now,
        "message": f"Work completed for {res['name']}. Asset returned to operational Standby."
    }

