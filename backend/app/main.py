"""EcoShield AI - Pune Flood-Risk & Disaster-Management Command Center Backend.
FastAPI Application Entry Point.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.alerts import router as alerts_router
from .api.analytics import router as analytics_router
from .api.assistant import router as assistant_router
from .api.auth import router as auth_router, users_router
from .api.dashboard import router as dashboard_router
from .api.incidents import router as incidents_router
from .api.prediction import router as prediction_router
from .api.recommendations import router as recommendations_router
from .api.resources import router as resources_router
from .api.routes import router as routes_router
from .api.shelters import router as shelters_router
from .api.simulation import router as simulation_router
from .api.weather import router as weather_router
from .api.zones import router as zones_router
from .core.config import DISTRICT_NAME, SYSTEM_STATE
from .db.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed 8 Pune zones if not already present
    init_db()
    yield

app = FastAPI(
    title="EcoShield AI - Pune Command Center API",
    description="Emergency flood risk monitoring, prediction, citizen reporting, evacuation routing, and resource management for Pune, India.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite dev server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain routers under /api
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(zones_router)
app.include_router(weather_router)
app.include_router(prediction_router)
app.include_router(incidents_router)
app.include_router(shelters_router)
app.include_router(routes_router)
app.include_router(resources_router)
app.include_router(alerts_router)
app.include_router(recommendations_router)
app.include_router(simulation_router)
app.include_router(analytics_router)
app.include_router(assistant_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EcoShield AI Pune Command Center",
        "district": DISTRICT_NAME,
        "system_state": SYSTEM_STATE,
        "version": "2.0.0",
    }

# Serve production frontend build (React + Vite) if built
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if DIST_DIR.is_dir() and (DIST_DIR / "index.html").is_file():
    if (DIST_DIR / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target = DIST_DIR / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST_DIR / "index.html")
