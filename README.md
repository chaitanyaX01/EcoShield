# EcoShield AI — Pune Flood-Risk & Disaster-Management Command Center

**EcoShield AI** is a full-stack emergency response and flood-risk management command system designed specifically for the **Pune Metropolitan Area, India**. It integrates real-time meteorological observations, a trained Extra Trees machine-learning flood-prediction model, community citizen reporting with 1-tap corroboration, dynamic high-ground evacuation routing, resource mobilization logistics, and an Apple-inspired operational interface.

---

## 1. System Architecture

- **Frontend**: React 18, Vite, React Router v6, Leaflet (interactive OpenStreetMap vector layer), Recharts, Lucide Icons, and a custom Apple-inspired Command Center design system.
- **Backend**: FastAPI, Python 3, Pydantic, Uvicorn.
- **Database**: SQLite (`backend/ecoshield.db`) with relational schemas ready for seamless PostgreSQL migration.
- **Machine Learning**: Preserved scikit-learn Extra Trees Classifier (`backend/ml/artifacts/flood_extra_trees.pkl`, F1-score: **0.892**).
- **Weather Service**: OpenWeather integration via FastAPI backend only, with automated 10-minute caching and calibrated Pune micro-basin fallback.

---

## 2. Monitored Pune Catchment Basins

The system tracks 8 authentic Pune urban micro-catchments:
1. **Katraj** (Katraj Lake & Ambegaon Basin — High Risk)
2. **Sinhagad Road** (Sinhagad Road - Ekta Nagar lowlands — Critical Risk)
3. **Shivajinagar** (Mutha River Basin & Dengle Bridge — Moderate Risk)
4. **Kothrud** (Karve Road & elevated plateau — Low Risk)
5. **Hadapsar** (Canal Corridor & industrial drainage — Moderate Risk)
6. **Yerawada** (Mula-Mutha Confluence floodplain — High Risk)
7. **Baner** (Ramnadi Catchment & Pashan runoff — Low Risk)
8. **Viman Nagar** (Airport Corridor arterial watershed — Low Risk)

---

## 3. Routes & Navigation Map

### Public Citizen Portal
- `/citizen`: Public-facing portal where citizens select their Pune neighborhood, inspect local flood risk, report street submergence or blocked sumps with water depth and photos, view community hazards, and confirm local reports.

### Admin Command Center (Protected Routes)
- `/login`: Administrative authentication and user registration for commanders, field officers, resourcers, and citizens.
- `/admin/dashboard`: Executive District Risk Overview (peak rainfall, active alerts, highest-risk zone, open citizen reports, resource readiness bar, recent event audit log).
- `/admin/weather`: Live weather telemetry across all 8 Pune zones with 10-minute cache counter and force-refresh.
- `/admin/prediction`: Interactive Extra Trees ML prediction station with feature tuning sliders and "Use live weather" toggle.
- `/admin/incidents`: Citizen reports triage queue with filters by zone, severity, status, and verification actions.
- `/admin/map`: Full-screen Leaflet + OpenStreetMap interactive GIS map with colored flood polygons, clickable markers, route drawer, and entity inspector.
- `/admin/routes`: High-ground evacuation route generator with distance, travel time, and turn-by-turn flood-safe waypoints.
- `/admin/shelters`: Emergency relief shelters directory with capacity progress bars, occupancy, accessibility, and emergency hotlines.
- `/admin/resources`: Emergency equipment inventory (120 HP submersible pumps, NDRF rescue boats, ambulances, generators) with 1-click zone dispatch and recall.
- `/admin/recommendations`: Priority operational directives and public alert broadcast modal.
- `/admin/simulation`: "Rehearse Flash Flood" drill simulator with before-and-after comparison, exposed population estimates, and resource recommendations.
- `/admin/analytics`: Multi-chart intelligence dashboard including the preserved Extra Trees F1 benchmark chart.
- `/admin/assistant`: Local context-aware AI assistant answering queries directly from active Pune database telemetry.

---

## 4. Environment Variables & Security

### Security Protections
- **No Client-Side Secrets**: All OpenWeather calls are executed strictly from the FastAPI backend. The API key is never exposed to the browser, logs, or client bundles.
- **Git Protection**: `.env` and `*.env` are excluded via `.gitignore`.
- **Example File**: `backend/.env.example` provides the template:
  ```env
  OPENWEATHER_API_KEY=your_key_here
  ```

### Active Backend Configuration
The key is stored in `backend/.env`:
```env
OPENWEATHER_API_KEY=your_key_here
```

---

## 5. Quick Start Instructions

### Linux / macOS:
```bash
# Terminal 1: Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```

### Windows (Command Prompt / PowerShell):
**Option A — 1-Click Launchers:**
* Double-click [`start_all.bat`](file:///Users/chaitanya/Desktop/ecoshield/start_all.bat) to launch both services in separate windows.
* Or run [`start_backend.bat`](file:///Users/chaitanya/Desktop/ecoshield/start_backend.bat) and [`start_frontend.bat`](file:///Users/chaitanya/Desktop/ecoshield/start_frontend.bat) individually.

**Option B — Manual Commands:**
```cmd
:: Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

:: Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

* Frontend Web App: `http://localhost:5173`
* Backend API Swagger Docs: `http://localhost:8000/docs`

---

## 6. Operational Personnel & User Roles

Personnel can sign in with their assigned municipal credentials or register via the registration tab:

| Role | Role Title | Access Capabilities |
| :--- | :--- | :--- |
| **Commander** | District Disaster Cell | Full Command, Alerts, Deployments, Simulations, Analytics |
| **Field Responder** | Field Response Squad | Triage, Incident Resolution, Evacuation Routes, Shelters |
| **Resourcer** | Equipment Logistics | Pump & Boat Deployments, Inventory Readiness, Safe Routes |
| **Citizen** | Pune Resident | Geolocation Hazard Reporting, Corroboration, Shelters |

---

## 7. Data Classification Guide

To maintain transparency and operational clarity, EcoShield AI labels every piece of data:
- **OpenWeather live data**: Live measurements fetched from the OpenWeather API for each zone's coordinates.
- **Estimated / Demo data**: Calibrated Pune monsoon averages applied when external weather APIs are unreachable or offline.
- **Citizen-reported data**: Unverified or community-corroborated hazard reports submitted via the Citizen Portal.
- **Prototype prediction**: ML model inferences produced by the Extra Trees classifier trained on watershed characteristics.
- **Simulation**: Hypothetical meteorological surges run within the rehearsal module for contingency training.

---

## 8. Sharing a Live URL Worldwide

### Option A: Instant Live URL (Cloudflare Tunnel - 10 Seconds)
To share a live working link right now from your machine:
* **macOS / Linux**: Run `./start_live_tunnel.sh`
* **Windows**: Double-click `start_live_tunnel.bat`
* **Manual Command**:
  ```bash
  cloudflared tunnel --url http://localhost:8000
  ```
Cloudflare will give you an instant worldwide HTTPS URL (e.g., `https://random-name.trycloudflare.com`) that anyone can open from anywhere in the world on mobile or desktop.

### Option B: Permanent 24/7 Cloud Deployment (Render / Railway)
The project includes a multi-stage [`Dockerfile`](file:///Users/chaitanya/Desktop/ecoshield/Dockerfile):
1. Push this repository to GitHub.
2. Link your repo to **[Render.com](https://render.com)** or **[Railway.app](https://railway.app)** as a Web Service.
3. Select "Docker" as the runtime.
4. Render/Railway will build and deploy a permanent free URL (e.g. `https://ecoshield-pune.onrender.com`).

