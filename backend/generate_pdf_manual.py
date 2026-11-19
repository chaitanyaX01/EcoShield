"""Generates a professional, comprehensive, multi-page PDF manual for EcoShield AI.
Covers every small detail, architectural layer, database schema, ML model,
and function-by-function reference.
"""
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = "/Users/chaitanya/Desktop/ecoshield/EcoShield_AI_Complete_System_Manual.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "EcoShield AI — Pune Flood Command Center System Manual")
            self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "Confidential • Emergency Operations")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 8.5 * inch - 54, 46)

        self.drawString(54, 32, "Pune Metropolitan Area • District Disaster Management Authority")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 32, page_str)
        self.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f766e'),
        spaceAfter=15,
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6,
    )
    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0f172a'),
    )
    func_title_style = ParagraphStyle(
        'FuncTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#134e4a'),
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#065f46'),
    )

    story = []

    # ================= COVER / TITLE =================
    story.append(Paragraph("EcoShield AI", title_style))
    story.append(Paragraph("Pune Flood-Risk & Disaster-Management Command Center — Complete System Manual", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f766e'), spaceAfter=14))

    meta_table_data = [
        [Paragraph("<b>Target Region</b>", body_style), Paragraph("Pune Metropolitan Area (Maharashtra, India)", body_style)],
        [Paragraph("<b>Core Technology</b>", body_style), Paragraph("FastAPI (Python 3) + React 18 + Vite + Leaflet + SQLite", body_style)],
        [Paragraph("<b>ML Model</b>", body_style), Paragraph("scikit-learn Extra Trees Classifier (F1: 0.892, Accuracy: 0.936)", body_style)],
        [Paragraph("<b>Weather Engine</b>", body_style), Paragraph("Google Weather API + OpenWeather REST API (Backend only, 10-minute automated cache)", body_style)],
        [Paragraph("<b>Security Standard</b>", body_style), Paragraph("Zero client-side secrets, HMAC-SHA256 stateless tokens", body_style)],
        [Paragraph("<b>Document Purpose</b>", body_style), Paragraph("Exhaustive function-by-function, schema, and operational reference", body_style)],
    ]
    t = Table(meta_table_data, colWidths=[130, 374])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    # ================= SECTION 1: SYSTEM OVERVIEW =================
    story.append(Paragraph("1. System Purpose & Core Identity", h1_style))
    story.append(Paragraph(
        "EcoShield AI is an operational municipal emergency management platform tailored specifically for the terrain, "
        "riverbanks, and low-lying urban sectors of Pune, India. It bridges real-time weather observations, citizen ground "
        "reports, machine learning flood-risk predictions, relief shelter capacities, emergency equipment readiness, and "
        "safe high-ground evacuation routing into a unified, Apple-inspired operational Command Center.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Two Disconnected Portals:</b><br/>"
        "• <b>Citizen Portal (/citizen):</b> Public safety interface enabling residents to check neighborhood flood risks, "
        "report waterlogged streets, measure depth in centimeters, upload hazard photos, and corroborate community alerts with 1 tap.<br/>"
        "• <b>Admin Command Center (/admin/*):</b> Protected operations terminal for duty commanders, field response chiefs, "
        "and GIS engineers to inspect live telemetry, deploy high-capacity pumps, broadcast sirens, and run flash flood drills.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # ================= SECTION 2: 8 PUNE CATCHMENT ZONES =================
    story.append(Paragraph("2. Monitored Pune Catchment Basins", h1_style))
    story.append(Paragraph(
        "Pune is characterized by the confluence of the Mutha and Mula rivers, urban lake spillways, and runoff channels. "
        "The system monitors 8 authentic urban catchments with distinct hydrological characteristics:",
        body_style
    ))

    zone_data = [
        [Paragraph("<b>Catchment Zone</b>", body_style), Paragraph("<b>Coordinates</b>", body_style), Paragraph("<b>Elevation / Drainage</b>", body_style), Paragraph("<b>Vulnerability Context</b>", body_style)],
        [Paragraph("<b>Katraj</b>", body_style), Paragraph("18.4529°N, 73.8553°E", body_style), Paragraph("580m / 45%", body_style), Paragraph("Katraj Lake & Ambegaon hills. Spillway overflow risk.", body_style)],
        [Paragraph("<b>Sinhagad Road</b>", body_style), Paragraph("18.4850°N, 73.8250°E", body_style), Paragraph("560m / 38%", body_style), Paragraph("Ekta Nagar lowlands. Direct Khadakwasla dam discharge surge.", body_style)],
        [Paragraph("<b>Shivajinagar</b>", body_style), Paragraph("18.5314°N, 73.8446°E", body_style), Paragraph("568m / 62%", body_style), Paragraph("Mutha basin hub near Dengle Bridge and Sangam confluence.", body_style)],
        [Paragraph("<b>Kothrud</b>", body_style), Paragraph("18.5074°N, 73.8077°E", body_style), Paragraph("585m / 75%", body_style), Paragraph("Western elevated plateau with stormwater drains to Mutha river.", body_style)],
        [Paragraph("<b>Hadapsar</b>", body_style), Paragraph("18.5089°N, 73.9259°E", body_style), Paragraph("562m / 52%", body_style), Paragraph("Canal corridor flanked by Mutha Right Bank canal culverts.", body_style)],
        [Paragraph("<b>Yerawada</b>", body_style), Paragraph("18.5529°N, 73.8797°E", body_style), Paragraph("555m / 42%", body_style), Paragraph("Mula-Mutha confluence downstream floodplain. Low elevation.", body_style)],
        [Paragraph("<b>Baner</b>", body_style), Paragraph("18.5590°N, 73.7868°E", body_style), Paragraph("574m / 58%", body_style), Paragraph("Northwestern IT corridor intersecting Ramnadi stream & Pashan lake.", body_style)],
        [Paragraph("<b>Viman Nagar</b>", body_style), Paragraph("18.5679°N, 73.9143°E", body_style), Paragraph("570m / 68%", body_style), Paragraph("Airport corridor watershed with arterial stormwater culverts.", body_style)],
    ]
    zt = Table(zone_data, colWidths=[80, 110, 110, 204])
    zt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(zt)
    story.append(Spacer(1, 10))

    # ================= SECTION 3: ML FLOOD PREDICTION MODEL =================
    story.append(Paragraph("3. Machine Learning Flood-Risk Engine", h1_style))
    story.append(Paragraph(
        "<b>Model Architecture:</b> Trained Extra Trees Classifier (scikit-learn ensemble) stored at "
        "<code>backend/ml/artifacts/flood_extra_trees.pkl</code>.<br/>"
        "<b>Cross-Validation Performance:</b> F1-Score: <b>0.892</b> | Accuracy: <b>0.936</b> | Precision: <b>0.920</b> | Recall: <b>0.906</b>.<br/>"
        "<b>Benchmark Ranking:</b> Evaluated against Random Forest (0.871), Gradient Boosting (0.854), Decision Trees (0.795), "
        "Logistic Regression (0.768), and Linear SVM (0.742). Extra Trees demonstrated superior resistance to variance in sudden cloudburst spikes.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The 8 Input Features Vector:</b><br/>"
        "1. <code>rainfall_mm_h</code>: Hourly rainfall rate (0 - 200 mm/h). Weight ~55%.<br/>"
        "2. <code>humidity_pct</code>: Atmospheric relative humidity percentage (10 - 100%).<br/>"
        "3. <code>temperature_c</code>: Ambient temperature in Celsius (5 - 50°C).<br/>"
        "4. <code>drainage_score</code>: Municipal storm sewer rating for the catchment (0 - 100).<br/>"
        "5. <code>previous_flood</code>: Documented historical flood frequency (0 - 20 events).<br/>"
        "6. <code>elevation_m</code>: Topographical elevation above mean sea level (400 - 1200m).<br/>"
        "7. <code>population_density</code>: Population density per km² (1,000 - 60,000).<br/>"
        "8. <code>soil_saturation</code>: Antecedent soil moisture saturation percentage (10 - 100%). Weight ~25%.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Risk Categorization Logic:</b><br/>"
        "• <i>Probability &lt; 0.25:</i> <b>Low Risk</b> (Normal operations, routine drainage monitoring).<br/>"
        "• <i>Probability 0.25 - 0.55:</i> <b>Moderate Risk</b> (Nuisance ponding likely, alert ward inspectors).<br/>"
        "• <i>Probability 0.55 - 0.78:</i> <b>High Risk</b> (Street flooding and underpass submergence expected, stage pumps).<br/>"
        "• <i>Probability &gt; 0.78:</i> <b>Critical Risk</b> (Flash flood warning, evacuate ground floors along riverbank).",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ================= SECTION 4: BACKEND FUNCTION-BY-FUNCTION REFERENCE =================
    story.append(PageBreak())
    story.append(Paragraph("4. Backend Architecture: Detailed Function Reference", h1_style))
    story.append(Paragraph(
        "Every backend function in EcoShield AI is modular, asynchronous, and strictly typed. "
        "The following reference breaks down each small function, its purpose, parameters, and return signatures.",
        body_style
    ))

    funcs = [
        ("app.core.config._load_env()",
         "Parses the backend/.env file safely on startup. Strips comments and quotes, loads OPENWEATHER_API_KEY into os.environ without overwriting pre-existing system variables. Enforces strict zero-leakage security."),
        ("app.core.auth.issue_token(user: dict, ttl_seconds: int = 43200) -> str",
         "Constructs a stateless JWT-style token using Python standard library HMAC-SHA256. Payload contains sub (user ID), email, role, and expiration timestamp (default 12 hours). Returns URL-safe <base64_payload>.<base64_signature>."),
        ("app.core.auth.verify_token(token: str) -> dict",
         "Splits the token into payload and signature. Recomputes expected HMAC-SHA256 signature using SECRET_KEY. Executes constant-time comparison via hmac.compare_digest to prevent timing attacks. Validates expiration. Returns payload dict or raises HTTP 401."),
        ("app.core.auth.authenticate_user(email_or_alias: str, password: str) -> Optional[dict]",
         "Resolves login identifiers and convenience aliases (e.g. 'admin' -> 'admin@ecoshield.pune', 'responder' -> 'responder@ecoshield.pune'). Validates credentials against DEMO_USERS registry. Returns sanitized user record."),
        ("app.core.auth.get_current_admin(authorization: Header) -> dict",
         "FastAPI Dependency protecting admin endpoints. Parses 'Bearer <token>' from incoming HTTP Authorization header, calls verify_token(), and returns the authenticated admin's permissions and role."),
        ("app.db.database.get_connection() -> sqlite3.Connection",
         "Instantiates a thread-safe connection to ecoshield.db. Sets row_factory = sqlite3.Row for dictionary-like named column access. Enables PRAGMA foreign_keys = ON and PRAGMA journal_mode = WAL for concurrent multi-threaded reads/writes."),
        ("app.db.database.init_db() -> None",
         "Executes DDL statements inside a re-entrant lock (_LOCK) to create all 6 database tables: zones, shelters, resources, incidents, alerts, and activity_logs. Calls _seed_pune_data() to populate baseline records on fresh installs."),
        ("app.db.database._seed_pune_data(conn: sqlite3.Connection) -> None",
         "Populates 8 Pune micro-catchments, 8 relief centers, 10 emergency response assets, initial citizen reports, and emergency alerts. Checks COUNT(*) to prevent duplicate insertion on server restart."),
        ("app.services.weather._fetch_google_weather(lat: float, lon: float) -> Optional[dict]",
         "Primary weather fetcher connecting to Google Weather API (weather.googleapis.com/v1/currentConditions:lookup) using GOOGLE_WEATHER_API_KEY. Extracts live temperature, humidity, precipitation (QPF), wind speed (km/h), condition text, and atmospheric pressure. Attributed as 'Google Weather live data'."),
        ("app.services.weather._fetch_openweather(lat: float, lon: float) -> Optional[dict]",
         "Secondary weather fetcher connecting to OpenWeather API (data/2.5/weather) if Google Weather is not configured. Extracts temperature, humidity, wind velocity, precipitation in last hour, and conditions. Tags source as 'OpenWeather live data'."),
        ("app.services.weather.get_zone_weather(zone_id: str, force_refresh: bool) -> dict",
         "Main weather lookup function strictly querying live meteorological APIs with a 10-minute cache (CACHE_TTL_SECONDS = 600). Checks cache timestamp; if expired or force_refresh is True, fetches fresh live Google Weather telemetry."),
        ("app.services.weather.get_weather_summary(force_refresh: bool) -> dict",
         "Aggregates weather conditions across all 8 Pune catchments using ThreadPoolExecutor for concurrent parallel fetching. Computes district average temperature, average relative humidity, and peak rainfall rate in the previous hour. Returns summary metadata with cache countdown."),
        ("app.services.prediction._load_model_artifacts() -> None",
         "Dynamically verifies backend directory in sys.path, unpickles backend/ml/artifacts/flood_extra_trees.pkl into memory, and loads model_metadata.json containing algorithm parameters and evaluation F1 scores."),
        ("app.services.prediction.predict_flood_risk(features: dict) -> dict",
         "Formats the 8 features into a 2D numpy array, executes model.predict_proba(), calculates flood probability, assigns qualitative risk level (Low, Moderate, High, Critical), generates tactical action recommendation, and returns structured result."),
        ("app.services.prediction._heuristic_fallback(...) -> float",
         "Secondary safety heuristic calculating flood probability from rainfall rate, soil saturation, drainage score, and historical events if pickled model file is absent."),
        ("app.services.routing.haversine_km(lat1, lon1, lat2, lon2) -> float",
         "Computes great-circle distance in kilometers between two geographic coordinates using the spherical Haversine formula (Earth radius R = 6371.0 km)."),
        ("app.services.routing.generate_safe_route(start_lat, start_lon, shelter_id, zone_id) -> dict",
         "Identifies target relief shelter with capacity, computes high-ground detour waypoints that steer around the Mutha river corridor, calculates transit travel time, evaluates flood exposure, and outputs turn-by-turn guidance."),
        ("app.services.assistant.answer_assistant_query(question: str, zone_id: Optional[str]) -> dict",
         "Local context-aware reasoning engine without external LLM dependencies. Queries active SQLite tables (zones, alerts, incidents, shelters, resources, weather) to answer questions regarding highest risk, resources, shelters, protocols, or zones."),
        ("app.services.recommendations.generate_recommendations(zone_id: Optional[str]) -> List[dict]",
         "Decision intelligence engine that synthesizes operational directives by correlating active rainfall thresholds (>= 40mm/h), high/critical risk ratings, incident clusters, and shelter occupancy saturation (> 70%)."),
        ("app.services.simulation.run_flash_flood_simulation(zone_id: str, severity_level: str) -> dict",
         "Contingency planning engine. Simulates downpour surges (+35, +75, or +125 mm/h), recalculates Extra Trees ML risk probability, estimates affected population from zone density, suggests asset deployments, and plots evacuation route."),
        ("app.services.analytics.get_analytics_summary() -> dict",
         "Aggregates charting data: zone drainage vs flood history, 12-hour hourly weather progression, incident categories, resource deployment status, and the machine learning model F1 score benchmark comparison."),
    ]

    for name, desc in funcs:
        box_data = [
            [Paragraph(f"<b>Function:</b> <code>{name}</code>", func_title_style)],
            [Paragraph(desc, body_style)],
        ]
        bt = Table(box_data, colWidths=[504])
        bt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(bt)
        story.append(Spacer(1, 5))

    # ================= SECTION 5: DATABASE SCHEMA =================
    story.append(PageBreak())
    story.append(Paragraph("5. Relational Database Schema (SQLite & Postgres Ready)", h1_style))
    story.append(Paragraph(
        "All tables in <code>backend/ecoshield.db</code> are designed with standard relational datatypes, "
        "foreign key constraints, and normalized primary keys to allow seamless drop-in replacement with PostgreSQL.",
        body_style
    ))

    schema_tables = [
        ("zones", "Monitored Catchment Basins", [
            ("id", "TEXT PRIMARY KEY", "Unique slug (e.g. 'katraj', 'sinhagad_rd')"),
            ("name", "TEXT NOT NULL", "Display name ('Katraj', 'Sinhagad Road')"),
            ("display_name", "TEXT NOT NULL", "Full watershed description"),
            ("lat, lon", "REAL NOT NULL", "Catchment centroid coordinates"),
            ("elevation_m", "REAL NOT NULL", "Topographical elevation above sea level"),
            ("drainage_score", "INTEGER NOT NULL", "Storm sewer rating (0 - 100)"),
            ("population_density", "INTEGER NOT NULL", "Inhabitants per square kilometer"),
            ("previous_floods", "INTEGER NOT NULL", "Historical recorded flood occurrences"),
            ("risk_level", "TEXT NOT NULL", "'Low', 'Moderate', 'High', 'Critical'"),
            ("bounds_json", "TEXT NOT NULL", "JSON array of bounding box coordinates"),
        ]),
        ("shelters", "Emergency Relief Centers", [
            ("id", "TEXT PRIMARY KEY", "Shelter code (e.g. 'sh_katraj_sports')"),
            ("name", "TEXT NOT NULL", "Official facility name"),
            ("zone_id", "TEXT NOT NULL REFERENCES zones(id)", "Foreign key to assigned zone"),
            ("lat, lon", "REAL NOT NULL", "Geographic coordinates of entrance"),
            ("capacity", "INTEGER NOT NULL", "Maximum bed / shelter capacity"),
            ("occupancy", "INTEGER NOT NULL", "Current sheltered persons"),
            ("status", "TEXT NOT NULL", "'Available', 'Limited', 'Near Saturation'"),
            ("accessible", "INTEGER NOT NULL", "1 = Wheelchair / Elderly accessible"),
            ("flood_exposure", "TEXT NOT NULL", "'None (High Ground)', 'Low', 'Moderate'"),
            ("contact", "TEXT", "24/7 Emergency helpline telephone"),
            ("medical_support", "INTEGER NOT NULL", "1 = On-site medical / triage wing"),
        ]),
        ("resources", "Emergency Fleet & Dewatering Equipment", [
            ("id", "TEXT PRIMARY KEY", "Asset code (e.g. 'RES-01', 'RES-04')"),
            ("name", "TEXT NOT NULL", "Equipment title (e.g. '120 HP Submersible Pump')"),
            ("type", "TEXT NOT NULL", "'Water Pump', 'Rescue Boat', 'Ambulance', etc."),
            ("zone_id", "TEXT NOT NULL REFERENCES zones(id)", "Current deployed / stationed zone"),
            ("status", "TEXT NOT NULL", "'Deployed', 'Standby', 'Maintenance'"),
            ("operator", "TEXT", "Agency (e.g. 'PMC Drainage Div A', '5th Bn NDRF')"),
            ("capacity", "TEXT", "Rated throughput (e.g. '12,000 L/min', '12 Persons')"),
        ]),
        ("incidents", "Citizen Hazard Reports", [
            ("id", "TEXT PRIMARY KEY", "Unique report code (e.g. 'INC-PUNE-01')"),
            ("zone_id", "TEXT NOT NULL REFERENCES zones(id)", "Originating catchment basin"),
            ("title", "TEXT NOT NULL", "Hazard headline or street landmark"),
            ("incident_type", "TEXT NOT NULL", "'street_flooding', 'blocked_drain', etc."),
            ("severity", "TEXT NOT NULL", "'low', 'moderate', 'high', 'critical'"),
            ("water_depth_cm", "INTEGER NOT NULL", "Submergence level in centimeters"),
            ("lat, lon", "REAL NOT NULL", "Report GPS coordinates"),
            ("corroborations", "INTEGER DEFAULT 1", "Number of community confirmations"),
            ("status", "TEXT DEFAULT 'unverified'", "'unverified', 'investigating', 'verified', 'resolved'"),
            ("reporter", "TEXT DEFAULT 'Anonymous Citizen'", "Submitting party or device identifier"),
            ("created_at", "TEXT NOT NULL", "ISO-8601 UTC timestamp"),
        ]),
        ("alerts", "Civil Protection Broadcasts", [
            ("id", "TEXT PRIMARY KEY", "Alert code (e.g. 'ALT-001')"),
            ("title", "TEXT NOT NULL", "Official siren advisory title"),
            ("severity", "TEXT NOT NULL", "'critical', 'high', 'moderate', 'info'"),
            ("zone_id", "TEXT NOT NULL REFERENCES zones(id)", "Targeted catchment basin"),
            ("status", "TEXT DEFAULT 'active'", "'active', 'acknowledged', 'escalated', 'resolved'"),
            ("action", "TEXT NOT NULL", "Mandatory citizen / squad action directive"),
            ("created_at", "TEXT NOT NULL", "ISO-8601 UTC timestamp"),
            ("source", "TEXT", "Issuing agency (e.g. 'PMC Irrigation Dept')"),
        ]),
        ("activity_logs", "Immutable Command Audit Trail", [
            ("id", "INTEGER PRIMARY KEY AUTOINCREMENT", "Sequential log ID"),
            ("action", "TEXT NOT NULL", "Operational action title"),
            ("actor", "TEXT NOT NULL", "Authorizing user or automated service"),
            ("detail", "TEXT", "Contextual detail and rationale"),
            ("created_at", "TEXT NOT NULL", "ISO-8601 UTC timestamp"),
        ]),
    ]

    for tbl_name, tbl_desc, cols in schema_tables:
        story.append(Paragraph(f"<b>Table: <code>{tbl_name}</code></b> — {tbl_desc}", h2_style))
        tbl_rows = [[Paragraph("<b>Column Name</b>", body_style), Paragraph("<b>Data Type & Constraints</b>", body_style), Paragraph("<b>Description & Examples</b>", body_style)]]
        for col_name, col_type, col_comm in cols:
            tbl_rows.append([Paragraph(f"<code>{col_name}</code>", code_style), Paragraph(col_type, code_style), Paragraph(col_comm, body_style)])

        st_t = Table(tbl_rows, colWidths=[120, 160, 224])
        st_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(st_t)
        story.append(Spacer(1, 6))

    # ================= SECTION 6: API ENDPOINTS =================
    story.append(PageBreak())
    story.append(Paragraph("6. RESTful API Endpoint Directory", h1_style))
    story.append(Paragraph(
        "All endpoints return standard JSON responses and emit proper HTTP status codes. "
        "Protected endpoints require an <code>Authorization: Bearer &lt;token&gt;</code> header.",
        body_style
    ))

    api_endpoints = [
        ("POST", "/api/auth/login", "Public", "Authenticates credentials and returns signed HMAC JWT token."),
        ("GET", "/api/auth/me", "Admin", "Validates session token and returns active admin user profile."),
        ("GET", "/api/dashboard/summary", "Public", "Executive operational snapshot: active alerts, peak rain, highest risk zone, logs."),
        ("GET", "/api/zones", "Public", "Returns registry of all 8 Pune catchments with bounds and elevation."),
        ("GET", "/api/zones/{zone_id}", "Public", "Detailed zone record including nested shelters, resources, and active incidents."),
        ("GET", "/api/weather/summary", "Public", "District average temp, humidity, peak rain, and 8 zone weather records."),
        ("GET", "/api/weather/zone/{zone_id}", "Public", "Micro-climate telemetry for specific zone with 10-minute cache validation."),
        ("POST", "/api/prediction/predict", "Public", "Executes Extra Trees ML inference on 8 hydrological feature values."),
        ("GET", "/api/prediction/metadata", "Public", "Returns ML model version, algorithm name, and evaluation metrics."),
        ("GET", "/api/incidents", "Public", "List citizen hazard reports with optional filters (zone, severity, status, type)."),
        ("POST", "/api/incidents", "Public", "Citizen portal endpoint to file new waterlogging or blockage hazard report."),
        ("POST", "/api/incidents/{id}/confirm", "Public", "Increments community corroboration count and updates confidence score."),
        ("POST", "/api/incidents/{id}/status", "Admin", "Updates triage status: 'unverified' -> 'investigating' -> 'verified' -> 'resolved'."),
        ("GET", "/api/shelters", "Public", "Relief shelter directory with capacity, occupancy, and flood exposure."),
        ("POST", "/api/routes/evacuation", "Public", "Generates safe high-ground evacuation path avoiding flooded riverbanks."),
        ("GET", "/api/resources", "Public", "Emergency inventory of pumps, rescue boats, ambulances, and mobile generators."),
        ("POST", "/api/resources/{id}/deploy", "Admin", "Dispatches resource to target zone and logs deployment in activity trail."),
        ("POST", "/api/resources/{id}/recall", "Admin", "Reassigns deployed resource back to Central Depot Standby."),
        ("GET", "/api/alerts", "Public", "Active civil protection alerts filtered by zone, severity, and status."),
        ("POST", "/api/alerts", "Admin", "Broadcasts official municipal alert directive with siren instructions."),
        ("POST", "/api/alerts/{id}/acknowledge", "Admin", "Marks emergency alert as acknowledged by duty officer."),
        ("POST", "/api/alerts/{id}/escalate", "Admin", "Escalates alert priority to CRITICAL with siren sounding."),
        ("POST", "/api/alerts/{id}/resolve", "Admin", "Marks emergency alert as resolved once water recedes."),
        ("POST", "/api/alerts/{id}/dismiss", "Admin", "Dismisses obsolete alert advisory."),
        ("GET", "/api/recommendations", "Public", "Synthesized operational action directives based on live hydrology telemetry."),
        ("POST", "/api/simulation/rehearse", "Public", "Executes flash flood drill; returns before/after risk, exposed population, resources."),
        ("GET", "/api/analytics/summary", "Public", "Multi-chart analytics telemetry: risk distribution, incident status, weather trend."),
        ("GET", "/api/analytics/f1-chart", "Public", "Serves the high-resolution F1 score comparison benchmark chart image."),
        ("POST", "/api/assistant/chat", "Public", "Queries local context-aware assistant grounded in Pune database telemetry."),
        ("GET", "/api/assistant/quick-questions", "Public", "Returns standard operational inquiries for quick 1-click execution."),
    ]

    api_rows = [[Paragraph("<b>Method</b>", body_style), Paragraph("<b>Endpoint Path</b>", body_style), Paragraph("<b>Access</b>", body_style), Paragraph("<b>Description</b>", body_style)]]
    for method, path, access, desc in api_endpoints:
        api_rows.append([
            Paragraph(f"<b>{method}</b>", body_style),
            Paragraph(f"<code>{path}</code>", code_style),
            Paragraph(access, body_style),
            Paragraph(desc, body_style)
        ])

    at = Table(api_rows, colWidths=[55, 165, 55, 230])
    at.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(at)
    story.append(Spacer(1, 10))

    # ================= SECTION 7: FRONTEND COMPONENTS =================
    story.append(PageBreak())
    story.append(Paragraph("7. Frontend Architecture & Component Directory", h1_style))
    story.append(Paragraph(
        "The frontend is built with React 18, Vite, React Router v6, and TypeScript. "
        "It follows Apple's design principles: calm, spacious, precise, minimal, and easy to understand. "
        "Below is the complete breakdown of every view and reusable component:",
        body_style
    ))

    fe_components = [
        ("src/services/api.ts",
         "Centralized typed API client. Injects JWT Authorization header, handles structured error messages, and features automated dual-mode fallback (tries relative Vite proxy first, seamlessly re-routes to direct backend on port 8000 if needed)."),
        ("src/context/AuthContext.tsx",
         "React context provider managing authentication state, token storage in localStorage, user metadata, login(), and logout() across all protected routes."),
        ("src/components/common/Header.tsx",
         "Fixed top operational header. Displays EcoShield AI branding, 'Command Center' badge, district indicator ('Pune Metropolitan Area'), live pulse status ('Live Monitoring'), emergency simulation button, citizen/admin switcher, and user logout."),
        ("src/components/common/Sidebar.tsx",
         "Collapsible operational sidebar containing all 12 command routes with active route highlighting, bottom district operational badge, and monitored zones counter."),
        ("src/components/common/AdminLayout.tsx",
         "Protected route layout wrapper. Enforces authentication gating, displays a smooth loading indicator during token verification, and synchronizes sidebar state for mobile/desktop."),
        ("src/components/common/StatusBadge.tsx",
         "Tactical status pill component with pulsing indicator dot. Maps risk levels (Low, Moderate, High, Critical), severities, and resource deployment states to calibrated visual styles."),
        ("src/pages/CitizenPortal.tsx (/citizen)",
         "Dedicated public citizen interface. Allows Pune residents to select their neighborhood, view current flood risks and rainfall, report waterlogged areas with photo preview and water depth sliders, and corroborate existing hazard reports with 1 tap."),
        ("src/pages/Login.tsx (/login)",
         "Administrative login interface. Includes quick 1-click credentials for Duty Commander, Field Responder, and Systems Engineer roles, with informative error feedback."),
        ("src/pages/Dashboard.tsx (/admin/dashboard)",
         "Executive command dashboard. Highlights highest-risk catchment (Sinhagad Road), active alerts count, peak precipitation rate, resource readiness percentage, zone table, and live activity audit trail."),
        ("src/pages/WeatherPage.tsx (/admin/weather)",
         "Meteorological telemetry station. Displays real-time cards for all 8 Pune catchments, selected zone detailed sensor view (temp, humidity, rain last hour, wind, pressure, lat/lon), 10-minute cache countdown, and force-refresh."),
        ("src/pages/PredictionPage.tsx (/admin/prediction)",
         "Interactive Extra Trees ML prediction laboratory. Features 8 parameter adjustment sliders, a 'Use Live Weather' auto-fill toggle, animated probability gauge, flood likelihood indicator, and tactical action recommendation."),
        ("src/pages/IncidentsPage.tsx (/admin/incidents)",
         "Citizen hazard reports queue. Includes multi-factor filters (zone, severity, status, hazard type, keyword search), confidence scores, corroboration counts, and 1-click triage actions (Verify, Investigate, Resolve)."),
        ("src/pages/MapPage.tsx (/admin/map)",
         "Interactive Leaflet + OpenStreetMap GIS map. Displays colored flood polygons (green/yellow/orange/red), custom markers for shelters, incidents, and deployed assets, interactive layer toggles, and safe route polyline drawing."),
        ("src/pages/RoutesPage.tsx (/admin/routes)",
         "Civil evacuation routing console. Calculates optimal high-ground corridors away from inundated riverbanks, computes travel time and distance, checks flood exposure, and outputs turn-by-turn safe waypoints."),
        ("src/pages/SheltersPage.tsx (/admin/shelters)",
         "Emergency relief shelters registry. Shows capacity progress bars, occupancy counts, available beds, flood exposure ratings, wheelchair accessibility, medical support indicators, and 24/7 hotline numbers."),
        ("src/pages/ResourcesPage.tsx (/admin/resources)",
         "Emergency equipment inventory. Tracks 120 HP submersible pumps, NDRF rescue boats, ambulances, and mobile generators. Features a 1-click modal to deploy assets to specific catchments with tactical orders."),
        ("src/pages/RecommendationsPage.tsx (/admin/recommendations)",
         "Operational decision directives console. Synthesizes action recommendations based on active weather, risk, and report clusters. Includes a modal to broadcast official municipal siren warnings with action directives."),
        ("src/pages/SimulationPage.tsx (/admin/simulation)",
         "'Rehearse Flash Flood' drill simulator. Enables emergency planners to model cloudbursts (+35, +75, +125 mm/h), evaluate exposed populations, inspect before-and-after risk probabilities, and generate contingency resource orders."),
        ("src/pages/AnalyticsPage.tsx (/admin/analytics)",
         "Multi-chart intelligence dashboard powered by Recharts. Displays zone risk distributions, 12-hour weather progressions, incident breakdowns, and the preserved Extra Trees F1 benchmark chart image."),
        ("src/pages/AssistantPage.tsx (/admin/assistant)",
         "Local context-aware AI assistant. Operates without paid APIs or external LLMs by querying active SQLite database state. Answers operational inquiries regarding highest-risk zones, available resources, safest shelters, and immediate protocols."),
    ]

    for name, desc in fe_components:
        box_data = [
            [Paragraph(f"<b>Component:</b> <code>{name}</code>", func_title_style)],
            [Paragraph(desc, body_style)],
        ]
        bt = Table(box_data, colWidths=[504])
        bt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(bt)
        story.append(Spacer(1, 5))

    # ================= SECTION 8: SECURITY & DATA ATTRIBUTION =================
    story.append(PageBreak())
    story.append(Paragraph("8. Security Architecture & Data Classification", h1_style))
    story.append(Paragraph(
        "<b>Zero Secret Exposure Principle:</b><br/>"
        "• All external API keys (Google Weather API, OpenWeather API) are stored strictly inside <code>backend/.env</code> and loaded exclusively in Python backend memory.<br/>"
        "• No external API keys exist in React client bundles, HTML assets, browser network calls, or documentation.<br/>"
        "• Git protection is enforced by <code>.gitignore</code>, and a sanitized template is maintained at <code>backend/.env.example</code>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Rigorous Data Classification & Live Telemetry:</b><br/>"
        "To provide emergency commanders with genuine real-world situational awareness, all synthetic demo weather fallbacks have been removed in favor of 100% live data:<br/>"
        "1. <b>'Google Weather live data':</b> Live atmospheric readings fetched in real-time via Google Weather API (Primary).<br/>"
        "2. <b>'OpenWeather live data':</b> Actual atmospheric readings fetched via OpenWeather API (Secondary).<br/>"
        "3. <b>'Citizen-reported data':</b> Hazard reports submitted from the field, labeled by verification status.<br/>"
        "4. <b>'Prototype prediction':</b> Probabilities computed by the scikit-learn Extra Trees classifier.<br/>"
        "5. <b>'Simulation':</b> Tactical deluge drills run inside the rehearsal module for contingency planning.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ================= SECTION 9: LAUNCH & VERIFICATION =================
    story.append(Paragraph("9. Quick-Start Execution Guide", h1_style))
    story.append(Paragraph(
        "<b>Convenience Shell Scripts:</b><br/>"
        "• <b>Terminal 1 (Backend):</b> <code>./start_backend.sh</code> (Runs FastAPI on http://127.0.0.1:8000)<br/>"
        "• <b>Terminal 2 (Frontend):</b> <code>./start_frontend.sh</code> (Runs Vite on http://localhost:5173)",
        body_style
    ))
    story.append(Paragraph(
        "<b>Pre-Configured Demo Accounts (/login):</b><br/>"
        "• <b>Duty Commander:</b> <code>admin@ecoshield.pune</code> / <code>admin123</code> (Full command)<br/>"
        "• <b>Field Responder:</b> <code>responder@ecoshield.pune</code> / <code>admin123</code> (Routes & triage)<br/>"
        "• <b>Systems Engineer:</b> <code>sysadmin@ecoshield.pune</code> / <code>admin123</code> (Telemetry & ML analytics)",
        body_style
    ))
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "<i>End of System Manual — EcoShield AI Pune Command Center Specification</i>",
        callout_style
    ))

    # Build the PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated comprehensive manual at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
