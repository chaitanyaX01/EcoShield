import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Layers,
  MapPin,
  Home,
  Truck,
  AlertTriangle,
  Navigation,
  Compass,
  RefreshCw,
  X,
  Shield,
  Info,
  Camera,
} from "lucide-react";
import { api } from "../services/api";
import { Zone, Shelter, Resource, Incident, Alert, EvacuationRoute } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";

const PUNE_CENTER: [number, number] = [18.5204, 73.8567];
const DEFAULT_ZOOM = 12;

export const MapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [zones, setZones] = useState<Zone[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Selection / Detail Panel
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [entityType, setEntityType] = useState<"zone" | "shelter" | "incident" | "resource" | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Filters & Controls
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showResources, setShowResources] = useState<boolean>(true);

  // Routing Station
  const [routingStartZone, setRoutingStartZone] = useState<string>("sinhagad_rd");
  const [routingShelterId, setRoutingShelterId] = useState<string>("");
  const [activeRoute, setActiveRoute] = useState<EvacuationRoute | null>(null);
  const [isRouting, setIsRouting] = useState<boolean>(false);

  // Responsive Drawer & Floating Controls
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);
  const [routeControlsOpen, setRouteControlsOpen] = useState<boolean>(window.innerWidth >= 1024);
  const [legendOpen, setLegendOpen] = useState<boolean>(window.innerWidth >= 1200);

  // Auto-scroll to details panel when entity selected on mobile
  useEffect(() => {
    if (selectedEntity && window.innerWidth < 1024 && detailsPanelRef.current) {
      setTimeout(() => {
        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [selectedEntity]);

  // Recalculate Leaflet map dimensions on window resize / orientation change
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [zList, sList, rList, iList, aList] = await Promise.all([
          api.getZones(),
          api.getShelters(),
          api.getResources(),
          api.getIncidents({ status: "active" }),
          api.getAlerts(),
        ]);
        setZones(zList);
        setShelters(sList);
        setResources(rList);
        // Only keep active/unsolved hazards on the map - resolved/solved hazards are completely removed
        const activeOnly = iList.filter((i) => i.status !== "resolved");
        setIncidents(activeOnly);
        setAlerts(aList);
        if (sList.length > 0 && !routingShelterId) {
          setRoutingShelterId(sList[0].id);
        }

        // If an incident that was inspected is now resolved, close inspection drawer
        setSelectedEntity((prev) => {
          if (prev && "water_depth_cm" in prev) {
            const stillActive = activeOnly.some((i) => i.id === (prev as any).id);
            return stillActive ? prev : null;
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to load map entities", err);
      }
    }

    loadData();
    // Auto-refresh map entities every 5 seconds and on window focus so resolved hazards disappear immediately
    const interval = setInterval(loadData, 5000);
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PUNE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Map Features
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !zonesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    zonesLayerRef.current.clearLayers();

    // 1. Draw Zone Polygons / Rectangles
    if (showZones) {
      zones.forEach((z) => {
        if (filterRisk !== "all" && z.risk_level.toLowerCase() !== filterRisk.toLowerCase()) {
          return;
        }

        let fillColor = "#10b981";
        if (z.risk_level === "Moderate") fillColor = "#eab308";
        if (z.risk_level === "High") fillColor = "#f97316";
        if (z.risk_level === "Critical") fillColor = "#ef4444";

        const bounds = z.bounds && z.bounds.length === 2
          ? L.latLngBounds(z.bounds as [number, number][])
          : L.latLng(z.lat, z.lon).toBounds(2200);

        const rect = L.rectangle(bounds, {
          color: fillColor,
          weight: 2,
          fillColor: fillColor,
          fillOpacity: 0.18,
          dashArray: z.risk_level === "Critical" ? "4, 4" : undefined,
        });

        rect.on("click", () => {
          setSelectedEntity(z);
          setEntityType("zone");
        });

        rect.bindTooltip(`<strong>${z.name}</strong><br/>Risk: ${z.risk_level} (${z.elevation_m}m)`, {
          permanent: false,
          direction: "top",
        });

        zonesLayerRef.current?.addLayer(rect);
      });
    }

    // 2. Shelters Markers
    if (showShelters) {
      shelters.forEach((sh) => {
        const icon = L.divIcon({
          className: "custom-shelter-marker",
          html: `
            <div style="background: #1e3a8a; color: #ffffff; border: 2px solid #93c5fd; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 13px;">
              🏥
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([sh.lat, sh.lon], { icon });
        marker.on("click", () => {
          setSelectedEntity(sh);
          setEntityType("shelter");
        });
        marker.bindTooltip(`Shelter: ${sh.name}<br/>Available: ${sh.capacity - sh.occupancy}/${sh.capacity}`);
        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 3. Citizen Incident Markers (Only active / unsolved hazards - resolved removed from map)
    if (showIncidents) {
      incidents.filter((inc) => inc.status !== "resolved").forEach((inc) => {
        const isCrit = inc.severity === "critical";
        const icon = L.divIcon({
          className: "custom-incident-marker",
          html: `
            <div style="background: ${isCrit ? "#dc2626" : "#ea580c"}; color: white; border: 2px solid #ffffff; border-radius: 6px; padding: 2px 6px; font-weight: 700; font-size: 10px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              <span>⚠️</span>
              <span>${inc.water_depth_cm}cm</span>
            </div>
          `,
          iconSize: [52, 22],
          iconAnchor: [26, 11],
        });

        const marker = L.marker([inc.lat, inc.lon], { icon });
        marker.on("click", () => {
          setSelectedEntity(inc);
          setEntityType("incident");
        });
        marker.bindTooltip(`<strong>${inc.title}</strong><br/>Severity: ${inc.severity.toUpperCase()} (${inc.status})`);
        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 4. Deployed Resources Markers
    if (showResources) {
      resources.filter((r) => r.status === "Deployed").forEach((res) => {
        const zone = zones.find((z) => z.id === res.zone_id);
        if (!zone) return;

        // Slight offset around zone center
        const offsetLat = zone.lat + (Math.random() - 0.5) * 0.004;
        const offsetLon = zone.lon + (Math.random() - 0.5) * 0.004;

        const icon = L.divIcon({
          className: "custom-resource-marker",
          html: `
            <div style="background: #0f766e; color: #ffffff; border: 2px solid #a7f3d0; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.25); font-size: 12px;">
              🚛
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([offsetLat, offsetLon], { icon });
        marker.on("click", () => {
          setSelectedEntity(res);
          setEntityType("resource");
        });
        marker.bindTooltip(`Resource: ${res.name}<br/>Status: Deployed to ${zone.name}`);
        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [zones, shelters, incidents, resources, showZones, showShelters, showIncidents, showResources, filterRisk]);

  // Handle Evacuation Route Drawing
  const handleCalculateRoute = async () => {
    const startZ = zones.find((z) => z.id === routingStartZone);
    if (!startZ) return;

    setIsRouting(true);
    try {
      const res = await api.getEvacuationRoute(startZ.lat, startZ.lon, routingShelterId || undefined, routingStartZone);
      setActiveRoute(res);

      const map = mapInstanceRef.current;
      if (map) {
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
        }

        const latLngs = res.waypoints.map((p) => [p[0], p[1]] as [number, number]);
        const polyline = L.polyline(latLngs, {
          color: "#0f766e",
          weight: 5,
          opacity: 0.9,
          dashArray: "8, 6",
        }).addTo(map);

        routeLayerRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    } catch (err: any) {
      alert("Failed to compute safe evacuation path: " + err.message);
    } finally {
      setIsRouting(false);
    }
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView(PUNE_CENTER, DEFAULT_ZOOM);
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      setActiveRoute(null);
    }
  };

  const handlePanToZone = (zoneId: string) => {
    const z = zones.find((item) => item.id === zoneId);
    if (z && mapInstanceRef.current) {
      mapInstanceRef.current.setView([z.lat, z.lon], 14, { animate: true });
      setSelectedEntity(z);
      setEntityType("zone");
    }
  };

  return (
    <div className="map-page-wrapper">
      {/* Top Map Control Bar */}
      <div className="eco-card" style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          {/* Left: Quick Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Zone Jump:
              </span>
              <select
                onChange={(e) => handlePanToZone(e.target.value)}
                value=""
                className="select-control"
                style={{ padding: "6px 8px", fontSize: 12, minWidth: 120 }}
              >
                <option value="" disabled>Select Zone...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Risk Filter:
              </span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="select-control"
                style={{ padding: "6px 8px", fontSize: 12, minWidth: 100 }}
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Layer Toggles */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, flexWrap: "wrap", borderLeft: "1px solid var(--border-medium)", paddingLeft: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", minHeight: 32 }}>
                <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} />
                <span>Zones</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", minHeight: 32 }}>
                <input type="checkbox" checked={showShelters} onChange={(e) => setShowShelters(e.target.checked)} />
                <span>Shelters</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", minHeight: 32 }}>
                <input type="checkbox" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} />
                <span>Hazards ({incidents.filter((i) => i.status !== "resolved").length})</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", minHeight: 32 }}>
                <input type="checkbox" checked={showResources} onChange={(e) => setShowResources(e.target.checked)} />
                <span>Resources</span>
              </label>
            </div>
          </div>

          {/* Right: Reset View & Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleResetView}
              className="btn btn-secondary btn-sm"
              style={{ padding: "6px 12px", fontSize: 11, gap: 5, minHeight: 36 }}
              title="Reset map view to Pune center"
            >
              <RefreshCw size={12} />
              <span>Reset View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map View & Details Drawer */}
      <div className="map-main-workspace">
        {/* Leaflet Canvas */}
        <div
          ref={mapContainerRef}
          className="map-canvas-container"
          style={{ width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}
        />

        {/* Floating Evacuation Routing Control (Bottom Left of Map) */}
        {!routeControlsOpen ? (
          <button
            onClick={() => setRouteControlsOpen(true)}
            className="btn btn-lime btn-sm"
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              zIndex: 800,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
              gap: 6,
              minHeight: 42,
              color: "#092317",
            }}
          >
            <Navigation size={15} />
            <span>Evacuation Route</span>
          </button>
        ) : (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              background: "rgba(9, 35, 23, 0.95)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(187, 244, 81, 0.25)",
              borderRadius: 16,
              padding: "16px",
              boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
              zIndex: 800,
              maxWidth: "calc(100% - 32px)",
              width: 320,
              fontSize: 12,
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                <Navigation size={15} color="var(--lime-500)" />
                <span>Evacuation Route Generator</span>
              </div>
              <button
                onClick={() => setRouteControlsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Minimize route generator"
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Start Hazard Zone:</span>
                <select
                  value={routingStartZone}
                  onChange={(e) => setRoutingStartZone(e.target.value)}
                  className="select-control"
                  style={{ fontSize: 12, padding: "6px 10px", marginTop: 4, width: "100%", background: "#ffffff", color: "#111827" }}
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.risk_level} Risk)</option>
                  ))}
                </select>
              </div>

              <div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Destination Shelter:</span>
                <select
                  value={routingShelterId}
                  onChange={(e) => setRoutingShelterId(e.target.value)}
                  className="select-control"
                  style={{ fontSize: 12, padding: "6px 10px", marginTop: 4, width: "100%", background: "#ffffff", color: "#111827" }}
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (Cap: {s.capacity - s.occupancy})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculateRoute}
              disabled={isRouting}
              className="btn btn-lime btn-sm"
              style={{ width: "100%", fontSize: 12, padding: "8px", minHeight: 40, color: "#092317", fontWeight: 700 }}
            >
              {isRouting ? "Plotting Elevated Corridor..." : "Draw Safest Evacuation Route"}
            </button>

            {activeRoute && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)", fontSize: 11, color: "#e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Distance: <strong>{activeRoute.distance_km} km</strong></span>
                  <span>Est. Time: <strong>{activeRoute.estimated_travel_time_min} mins</strong></span>
                </div>
                <div style={{ color: "var(--lime-500)", fontWeight: 600, marginTop: 4 }}>
                  {activeRoute.route_safety_status}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Legend Overlay (Top Right of Map) */}
        {!legendOpen ? (
          <button
            onClick={() => setLegendOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 800,
              padding: "6px 10px",
              fontSize: 11,
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              gap: 4,
              minHeight: 34,
            }}
          >
            <Info size={13} />
            <span>Legend</span>
          </button>
        ) : (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(9, 35, 23, 0.95)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(187, 244, 81, 0.25)",
              borderRadius: 14,
              padding: "12px 14px",
              zIndex: 800,
              fontSize: 11,
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              maxWidth: 240,
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, color: "#ffffff" }}>Map Legend</div>
              <button
                onClick={() => setLegendOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "#ef4444", borderRadius: 2 }}></span>
                <span>Critical</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "#f97316", borderRadius: 2 }}></span>
                <span>High Risk</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "#eab308", borderRadius: 2 }}></span>
                <span>Moderate</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, background: "#10b981", borderRadius: 2 }}></span>
                <span>Low Risk</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>🏥</span>
                <span>Shelter</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>⚠️</span>
                <span>Hazard</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span>🚛</span>
                <span>Asset</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 2, background: "var(--lime-500)" }}></span>
                <span>Route</span>
              </div>
            </div>
          </div>
        )}

        {/* Right Details Panel */}
        {selectedEntity && (
          <div
            ref={detailsPanelRef}
            className="eco-card map-details-sidebar"
            style={{
              padding: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-700)", textTransform: "uppercase" }}>
                {entityType?.toUpperCase()} INSPECTION
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                style={{ color: "var(--text-muted)", padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Entity content */}
            {entityType === "zone" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                  {selectedEntity.name}
                </h3>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  {selectedEntity.display_name}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <StatusBadge type="risk" value={selectedEntity.risk_level} />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                  {selectedEntity.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, background: "var(--bg-subtle)", padding: 10, borderRadius: 6 }}>
                  <div>Elevation: <strong>{selectedEntity.elevation_m} meters</strong></div>
                  <div>Drainage Score: <strong>{selectedEntity.drainage_score} / 100</strong></div>
                  <div>Pop. Density: <strong>{selectedEntity.population_density} / km²</strong></div>
                  <div>Historical Floods: <strong>{selectedEntity.previous_floods} documented</strong></div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Recommended Action:
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-primary)", background: "var(--bg-subtle)", padding: 8, borderRadius: 6, borderLeft: "3px solid var(--teal-600)" }}>
                    Maintain continuous drainage sump monitoring and coordinate deployment with local ward wardens.
                  </div>
                </div>
              </div>
            )}

            {entityType === "shelter" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {selectedEntity.name}
                </h3>
                <div style={{ marginBottom: 10 }}>
                  <StatusBadge type="resource" value={selectedEntity.status} />
                </div>

                <div style={{ background: "var(--bg-subtle)", padding: 12, borderRadius: 6, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>Total Capacity: <strong>{selectedEntity.capacity} persons</strong></div>
                  <div>Current Occupancy: <strong>{selectedEntity.occupancy}</strong></div>
                  <div>Available Space: <strong>{selectedEntity.capacity - selectedEntity.occupancy} beds</strong></div>
                  <div>Flood Exposure: <strong>{selectedEntity.flood_exposure}</strong></div>
                  <div>24/7 Helpline: <strong>{selectedEntity.contact}</strong></div>
                </div>
              </div>
            )}

            {entityType === "incident" && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {selectedEntity.title}
                </h3>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <StatusBadge type="severity" value={selectedEntity.severity} size="sm" />
                  <span style={{ fontSize: 11, background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                    {selectedEntity.status.toUpperCase()}
                  </span>
                </div>

                {selectedEntity.photo_before && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <Camera size={12} />
                      <span>Citizen Incident Photo</span>
                    </div>
                    <div
                      onClick={() => setPreviewPhotoUrl(selectedEntity.photo_before)}
                      style={{ cursor: "pointer", position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.5)" }}
                      title="Click to view full photo"
                    >
                      <img
                        src={selectedEntity.photo_before}
                        alt="Citizen hazard report"
                        style={{ width: "100%", height: 140, objectFit: "contain", display: "block" }}
                      />
                      <div style={{ position: "absolute", bottom: 4, right: 6, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>
                        Click to zoom
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
                  {selectedEntity.note ? `"${selectedEntity.note}"` : "Citizen-reported hazard."}
                </div>

                <div style={{ background: "var(--bg-subtle)", padding: 10, borderRadius: 6, fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  {selectedEntity.water_depth_cm && selectedEntity.water_depth_cm > 0 ? (
                    <div>Water Depth: <strong>{selectedEntity.water_depth_cm} cm</strong></div>
                  ) : (
                    <div>Hazard Type: <strong>{selectedEntity.incident_type?.replace(/_/g, " ").toUpperCase() || selectedEntity.title}</strong></div>
                  )}
                  <div>Address: <strong>{selectedEntity.address}</strong></div>
                  <div>Community Confirmations: <strong>{selectedEntity.corroborations}</strong></div>
                  <div>Confidence Rating: <strong>{selectedEntity.confidence_score || 45}%</strong></div>
                  <div>Reported By: <strong>{selectedEntity.reporter}</strong></div>
                </div>
              </div>
            )}

            {entityType === "resource" && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {selectedEntity.name}
                </h3>
                <div style={{ marginBottom: 10 }}>
                  <StatusBadge type="resource" value={selectedEntity.status} />
                </div>
                <div style={{ background: "var(--bg-subtle)", padding: 10, borderRadius: 6, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>Asset Type: <strong>{selectedEntity.type}</strong></div>
                  <div>Operating Agency: <strong>{selectedEntity.operator}</strong></div>
                  <div>Rated Capacity: <strong>{selectedEntity.capacity}</strong></div>
                  <div>Assigned Zone: <strong>{selectedEntity.zone_name || selectedEntity.zone_id}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL PHOTO LIGHTBOX MODAL */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoUrl}
              alt="Citizen report full resolution"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.6)", objectFit: "contain" }}
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: "#0f172a",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
