"""Database schema and connection management for EcoShield AI.
Unified layer supporting PostgreSQL via psycopg (psycopg3) and local development with SQLite.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ..core.config import DATABASE_PATH

_LOCK = threading.RLock()
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

def get_connection():
    if DATABASE_URL.startswith("postgres"):
        try:
            import psycopg
            from psycopg.rows import dict_row
            conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
            return conn
        except Exception as e:
            print(f"Notice: PostgreSQL connection failed ({e}), falling back to local SQLite engine.")
    
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db() -> None:
    with _LOCK:
        conn = get_connection()
        cur = conn.cursor()

        # 1. Zones table (Defaults to Low / Calm risk when live weather is calm)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS zones (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                elevation_m REAL NOT NULL,
                drainage_score INTEGER NOT NULL,
                population_density INTEGER NOT NULL,
                previous_floods INTEGER NOT NULL,
                description TEXT,
                risk_level TEXT NOT NULL DEFAULT 'Low',
                bounds_json TEXT NOT NULL
            )
        """)

        # 2. Shelters table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS shelters (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                zone_id TEXT NOT NULL REFERENCES zones(id),
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                capacity INTEGER NOT NULL,
                occupancy INTEGER NOT NULL,
                status TEXT NOT NULL,
                accessible INTEGER NOT NULL,
                flood_exposure TEXT NOT NULL,
                contact TEXT,
                medical_support INTEGER NOT NULL
            )
        """)

        # 3. Resources table with Real Asset Identifiers and photo_after
        cur.execute("""
            CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                zone_id TEXT NOT NULL REFERENCES zones(id),
                status TEXT NOT NULL,
                operator TEXT,
                capacity TEXT,
                photo_after TEXT,
                updated_at TEXT
            )
        """)

        # 4. Incidents table (with Citizen Signature, 1-User-1-Confirm Tracking, and Photos)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                zone_id TEXT NOT NULL REFERENCES zones(id),
                title TEXT NOT NULL,
                incident_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                water_depth_cm INTEGER NOT NULL,
                note TEXT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                address TEXT,
                corroborations INTEGER DEFAULT 1,
                status TEXT DEFAULT 'unverified',
                reporter TEXT DEFAULT 'Anonymous Citizen',
                signature TEXT,
                confirmed_users_json TEXT DEFAULT '[]',
                photo_before TEXT,
                photo_after TEXT,
                created_at TEXT NOT NULL,
                resolved_at TEXT
            )
        """)

        # Ensure new incident columns exist for citizen signature, 1-user-1-confirm tracking, and duty officer assignment
        for col, col_type in [
            ("signature", "TEXT"),
            ("confirmed_users_json", "TEXT DEFAULT '[]'"),
            ("assigned_to", "TEXT"),
            ("assigned_to_name", "TEXT"),
            ("assigned_to_mobile", "TEXT"),
            ("assigned_at", "TEXT"),
        ]:
            try:
                cur.execute(f"ALTER TABLE incidents ADD COLUMN {col} {col_type}")
            except Exception:
                pass

        # Ensure resources table has operator assignment columns
        for col, col_type in [
            ("operator_user_id", "TEXT"),
            ("operator_mobile", "TEXT"),
            ("assigned_at", "TEXT"),
        ]:
            try:
                cur.execute(f"ALTER TABLE resources ADD COLUMN {col} {col_type}")
            except Exception:
                pass

        # 5. Alerts table with target_audiences
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT NOT NULL,
                zone_id TEXT NOT NULL REFERENCES zones(id),
                status TEXT DEFAULT 'active',
                action TEXT NOT NULL,
                target_audiences TEXT DEFAULT 'all',
                created_at TEXT NOT NULL,
                source TEXT DEFAULT 'EcoShield Municipal Broadcast'
            )
        """)

        # 6. Activity logs
        cur.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                actor TEXT NOT NULL,
                detail TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # 7. Users table (for Email/Password Registration and Operational Personnel)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT DEFAULT 'admin123',
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                mobile TEXT,
                otp_code TEXT,
                is_verified INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            )
        """)

        # Ensure email and password columns exist if table was previously created
        user_cols = [c[1] for c in cur.execute("PRAGMA table_info(users)").fetchall()]
        if "email" not in user_cols:
            try:
                cur.execute("ALTER TABLE users ADD COLUMN email TEXT")
            except Exception:
                pass
        if "password" not in user_cols:
            try:
                cur.execute("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'admin123'")
            except Exception:
                pass

        # Seed core operational personnel (Master Admin, Field Officers, and Equipment Resourcers)
        now_ts = datetime.now(timezone.utc).isoformat()
        initial_users = [
            ("USR-MASTER", "admin@ecoshield.pune", "admin123", "Chaitanya (EcoShield Administrator)", "admin", "8421307163", "842130", 1, now_ts),
            ("USR-RESP-01", "responder@ecoshield.pune", "admin123", "Inspector S. Joshi (Field Officer)", "responder", "9822011223", "842130", 1, now_ts),
            ("USR-RESP-02", "patrol@ecoshield.pune", "admin123", "Officer Amit Kulkarni (River Patrol)", "responder", "9822044556", "842130", 1, now_ts),
            ("USR-RESC-01", "resourcer@ecoshield.pune", "admin123", "Operator K. Shinde (Drainage Pumps)", "resourcer", "9822077889", "842130", 1, now_ts),
            ("USR-RESC-02", "dewatering@ecoshield.pune", "admin123", "Operator Ganesh More (Heavy Dewatering)", "resourcer", "9822088990", "842130", 1, now_ts),
        ]
        for u in initial_users:
            cur.execute("""
                INSERT OR IGNORE INTO users (id, email, password, name, role, mobile, otp_code, is_verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, u)

        conn.commit()
        _seed_pune_data(conn)
        conn.close()

def _seed_pune_data(conn: Any) -> None:
    cur = conn.cursor()
    # Check if already seeded
    count = cur.execute("SELECT COUNT(*) FROM zones").fetchone()[0]
    if count > 0:
        # Check if resources have updated IDs or columns
        cur.execute("SELECT id FROM resources LIMIT 1")
        first_res = cur.fetchone()
        if first_res and str(first_res[0]).startswith("RES-"):
            # Update to real asset identifiers
            _update_to_real_asset_identifiers(conn)
        return

    # Seed 8 Pune Zones with Calm/Normal baseline risk (Sinhagad Road is NOT critical when dry)
    zones = [
        ("katraj", "Katraj", "Katraj Lake & Ambegaon Basin", 18.4529, 73.8553, 580.0, 45, 14200, 4,
         "Southern Pune catchment surrounding Katraj Lake and Ambegaon hills. Normal lake levels under live weather monitoring.",
         "Low", json.dumps([[18.435, 73.835], [18.470, 73.875]])),
        ("sinhagad_rd", "Sinhagad Road", "Sinhagad Road - Ekta Nagar", 18.4850, 73.8250, 560.0, 38, 18500, 6,
         "Mutha riverbank sector. Normal dry-weather river flow; automated telemetry linked to Khadakwasla sluice sensors.",
         "Low", json.dumps([[18.468, 73.810], [18.502, 73.840]])),
        ("shivajinagar", "Shivajinagar", "Shivajinagar - Mutha Basin", 18.5314, 73.8446, 568.0, 62, 21000, 3,
         "Central urban hub near Dengle Bridge and Sangam confluence. Normal drainage capacity active.",
         "Low", json.dumps([[18.515, 73.830], [18.548, 73.860]])),
        ("kothrud", "Kothrud", "Kothrud - Karve Road", 18.5074, 73.8077, 585.0, 75, 16500, 1,
         "Western elevated residential plateau with clear stormwater drains.",
         "Low", json.dumps([[18.490, 73.790], [18.525, 73.825]])),
        ("hadapsar", "Hadapsar", "Hadapsar - Canal Corridor", 18.5089, 73.9259, 562.0, 52, 15800, 3,
         "Eastern corridor along Mutha Right Bank canal. Canal gates operational.",
         "Low", json.dumps([[18.490, 73.905], [18.528, 73.946]])),
        ("yerawada", "Yerawada", "Yerawada - Mula-Mutha Confluence", 18.5529, 73.8797, 555.0, 42, 22400, 5,
         "Downstream floodplain after Sangam confluence. River stage within safe baseline limits.",
         "Low", json.dumps([[18.535, 73.862], [18.570, 73.898]])),
        ("baner", "Baner", "Baner - Ramnadi Catchment", 18.5590, 73.7868, 574.0, 58, 13900, 2,
         "Northwestern IT corridor intersecting the seasonal Ramnadi river.",
         "Low", json.dumps([[18.540, 73.770], [18.578, 73.805]])),
        ("viman_nagar", "Viman Nagar", "Viman Nagar - Airport Corridor", 18.5679, 73.9143, 570.0, 68, 17200, 1,
         "Northeastern urban sector near Pune International Airport.",
         "Low", json.dumps([[18.550, 73.895], [18.585, 73.935]])),
    ]
    cur.executemany("""
        INSERT INTO zones (id, name, display_name, lat, lon, elevation_m, drainage_score, population_density, previous_floods, description, risk_level, bounds_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, zones)

    # Seed Shelters
    shelters = [
        ("sh_katraj_sports", "Katraj Sports Complex & Indoor Stadium", "katraj", 18.4570, 73.8580, 850, 120, "Available", 1, "Minimal (Elevated)", "020-24371190", 1),
        ("sh_sinhagad_relief", "Ekta Nagar Community Disaster Relief Hall", "sinhagad_rd", 18.4890, 73.8290, 600, 110, "Available", 1, "Safe Upper Floor", "020-24338901", 1),
        ("sh_shivaji_camp", "Shivajinagar Government Polytechnic Ground", "shivajinagar", 18.5350, 73.8470, 1200, 150, "Available", 1, "Low Risk", "020-25537112", 1),
        ("sh_kothrud_hall", "Yashwantrao Chavan Natyagruha Relief Center", "kothrud", 18.5030, 73.8120, 950, 60, "Available", 1, "High Ground", "020-25381120", 1),
        ("sh_hadapsar_school", "Sadhana High School Relief Wing", "hadapsar", 18.5060, 73.9300, 550, 80, "Available", 0, "Low Risk", "020-26870020", 1),
        ("sh_yerawada_center", "Netaji Subhash Chandra Bose Relief Shelter", "yerawada", 18.5570, 73.8820, 700, 140, "Available", 1, "Safe Plateau", "020-26681010", 1),
        ("sh_balewadi_stadium", "Balewadi Shree Shiv Chhatrapati Sports Complex", "baner", 18.5740, 73.7730, 2500, 150, "Available", 1, "Fortified Ground", "020-27389000", 1),
        ("sh_viman_relief", "Symbiosis Auditorium Emergency Shelter", "viman_nagar", 18.5630, 73.9110, 800, 65, "Available", 1, "Airport Highway", "020-26557100", 1),
    ]
    cur.executemany("""
        INSERT INTO shelters (id, name, zone_id, lat, lon, capacity, occupancy, status, accessible, flood_exposure, contact, medical_support)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, shelters)

    # Seed Resources with Real Type Names in Asset Identifiers
    now = datetime.now(timezone.utc).isoformat()
    resources = [
        ("PUMP-120HP-SINHAGAD-01", "Heavy-Duty Submersible Water Pump #1 (120 HP)", "Water Pump", "sinhagad_rd", "Standby", "PMC Drainage Div A", "12,000 L/min", None, now),
        ("PUMP-120HP-KATRAJ-02", "Heavy-Duty Submersible Water Pump #2 (120 HP)", "Water Pump", "katraj", "Standby", "PMC Drainage Div B", "12,000 L/min", None, now),
        ("DEWATER-TRAILER-03", "Mobile Dewatering Unit #3 (Trailer Mounted)", "Water Pump", "yerawada", "Standby", "PMC Rapid Response", "8,000 L/min", None, now),
        ("NDRF-BOAT-ALPHA-01", "Inflatable Rescue Boat Unit Alpha (NDRF)", "Rescue Boat", "sinhagad_rd", "Standby", "5th Bn NDRF Pune", "12 Persons / Trip", None, now),
        ("NDRF-BOAT-BRAVO-02", "Inflatable Rescue Boat Unit Bravo (NDRF)", "Rescue Boat", "yerawada", "Standby", "5th Bn NDRF Pune", "12 Persons / Trip", None, now),
        ("AMBULANCE-ICU-108A", "Ambulance Critical Care Unit #108-A", "Ambulance", "shivajinagar", "Standby", "108 Emergency Medical", "2 Critical Patients", None, now),
        ("AMBULANCE-ICU-108B", "Ambulance Critical Care Unit #108-B", "Ambulance", "katraj", "Standby", "108 Emergency Medical", "2 Critical Patients", None, now),
        ("MED-TENT-FIELD-01", "PMC Emergency Medical Field Tent", "Medical Unit", "sinhagad_rd", "Standby", "PMC Health Dept", "35 Trauma Beds", None, now),
        ("NDRF-RESCUE-CHARLIE-03", "NDRF Flood Rescue Team Charlie", "Rescue Team", "kothrud", "Standby", "5th Bn NDRF Pune", "25 Rescue Personnel", None, now),
        ("MAST-LIGHT-GENSET-01", "Mobile High-Mast Floodlights & Generator", "Support Equipment", "hadapsar", "Standby", "PMC Disaster Mgmt", "50 kVA / 4x1000W", None, now),
    ]
    cur.executemany("""
        INSERT INTO resources (id, name, type, zone_id, status, operator, capacity, photo_after, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, resources)

    # Initial Alerts
    alerts = [
        ("ALT-001", "PMC Seasonal Watershed Alert: Routine Monsoon Sluice Gate Readiness", "moderate", "sinhagad_rd", "active",
         "Standby dewatering crews on shift. Monitor Khadakwasla discharge levels.", "all", now, "PMC Disaster Cell"),
    ]
    cur.executemany("""
        INSERT INTO alerts (id, title, severity, zone_id, status, action, target_audiences, created_at, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, alerts)

    # Seed Master User for Mobile OTP
    cur.execute("""
        INSERT OR IGNORE INTO users (id, mobile, name, role, otp_code, is_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("USR-MASTER", "8421307163", "Chaitanya (EcoShield Administrator)", "admin", "842130", 1, now))

    # Activity Logs
    cur.execute("""
        INSERT INTO activity_logs (action, actor, detail, created_at)
        VALUES (?, ?, ?, ?)
    """, ("System Initialized", "System", "EcoShield AI Pune Command Center initialized with live telemetry", now))

    conn.commit()

def _update_to_real_asset_identifiers(conn: Any) -> None:
    cur = conn.cursor()
    # Remove all demo incidents
    cur.execute("DELETE FROM incidents")
    id_mapping = {
        "RES-01": "PUMP-120HP-SINHAGAD-01",
        "RES-02": "PUMP-120HP-KATRAJ-02",
        "RES-03": "DEWATER-TRAILER-03",
        "RES-04": "NDRF-BOAT-ALPHA-01",
        "RES-05": "NDRF-BOAT-BRAVO-02",
        "RES-06": "AMBULANCE-ICU-108A",
        "RES-07": "AMBULANCE-ICU-108B",
        "RES-08": "MED-TENT-FIELD-01",
        "RES-09": "NDRF-RESCUE-CHARLIE-03",
        "RES-10": "MAST-LIGHT-GENSET-01",
    }
    for old_id, new_id in id_mapping.items():
        cur.execute("UPDATE resources SET id = ? WHERE id = ?", (new_id, old_id))
    # Also reset zone risk levels to Low / Normal
    cur.execute("UPDATE zones SET risk_level = 'Low' WHERE risk_level IN ('Critical', 'High')")
    conn.commit()
