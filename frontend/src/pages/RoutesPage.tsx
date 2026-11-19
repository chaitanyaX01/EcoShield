import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Navigation,
  Compass,
  Home,
  Shield,
  Clock,
  ExternalLink,
  LocateFixed,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { api } from "../services/api";
import { Shelter, EvacuationRoute } from "../types";

export const RoutesPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState<string>("");
  const [route, setRoute] = useState<EvacuationRoute | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [computing, setComputing] = useState<boolean>(false);

  // Current GPS Location (defaults to Pune Central Disaster Control coords)
  const [currentLat, setCurrentLat] = useState<number>(18.5204);
  const [currentLon, setCurrentLon] = useState<number>(73.8567);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>("Pune Central Hub (Detected Location)");

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLon],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load Shelters
  useEffect(() => {
    async function loadShelters() {
      try {
        const sList = await api.getShelters();
        setShelters(sList);
        if (sList.length > 0) {
          setSelectedShelterId(sList[0].id);
          computeSafeRoute(currentLat, currentLon, sList[0].id);
        }
      } catch (err) {
        console.error("Failed to load shelters", err);
      } finally {
        setLoading(false);
      }
    }
    loadShelters();
  }, []);

  // Compute Route
  const computeSafeRoute = async (lat: number, lon: number, shelterId: string) => {
    setComputing(true);
    try {
      const res = await api.getEvacuationRoute(lat, lon, shelterId);
      setRoute(res);
      drawRouteOnMap(res, lat, lon);
    } catch (err: any) {
      console.error("Failed to compute route", err);
    } finally {
      setComputing(false);
    }
  };

  // Draw polyline and markers on small map
  const drawRouteOnMap = (routeData: EvacuationRoute, originLat: number, originLon: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Origin Marker (Current Location)
    const originIcon = L.divIcon({
      className: "custom-map-marker origin-pin",
      html: `<div style="background:#0284c7; width:26px; height:26px; border-radius:50%; border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">A</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const originMarker = L.marker([originLat, originLon], { icon: originIcon })
      .bindPopup(`<strong>Your Current Location</strong><br/>Lat: ${originLat.toFixed(4)}, Lon: ${originLon.toFixed(4)}`);
    markersGroupRef.current?.addLayer(originMarker);

    // Destination Shelter Marker
    if (routeData.shelter) {
      const shelterIcon = L.divIcon({
        className: "custom-map-marker shelter-pin",
        html: `<div style="background:#059669; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">B</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const destMarker = L.marker([routeData.shelter.lat, routeData.shelter.lon], { icon: shelterIcon })
        .bindPopup(`<strong>${routeData.shelter.name}</strong><br/>Available: ${routeData.shelter.available_capacity} beds`);
      markersGroupRef.current?.addLayer(destMarker);
    }

    // Road-wise Polyline
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      const latlngs: [number, number][] = routeData.waypoints.map((pt) => [pt[0], pt[1]]);
      const poly = L.polyline(latlngs, {
        color: "#0d9488",
        weight: 5,
        opacity: 0.9,
        lineJoin: "round",
        dashArray: "1, 2",
      }).addTo(map);

      routePolylineRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }
  };

  // Browser Geolocation Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        setCurrentLat(lat);
        setCurrentLon(lon);
        setLocationName(`Current GPS (${lat}° N, ${lon}° E)`);
        setLocating(false);
        if (selectedShelterId) {
          computeSafeRoute(lat, lon, selectedShelterId);
        }
      },
      (err) => {
        setLocating(false);
        alert("GPS Location detection permission denied. Using central Pune coordinates.");
      },
      { timeout: 8000 }
    );
  };

  const handleShelterChange = (shelterId: string) => {
    setSelectedShelterId(shelterId);
    computeSafeRoute(currentLat, currentLon, shelterId);
  };

  // Google Maps Redirect Link
  const openInGoogleMaps = () => {
    if (!route || !route.shelter) return;
    const destLat = route.shelter.lat;
    const destLon = route.shelter.lon;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLon}&destination=${destLat},${destLon}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const activeShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Civil Defense Navigation
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          Safe Road-Wise Evacuation Routes
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Real-time routing from your current location to designated relief centers, avoiding submerged riverbanks.
        </p>
      </div>

      <div className="routes-grid">
        {/* Left Column: Origin GPS, Target Shelter Selector & Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="eco-card">
            <div className="eco-card-header">
              <div>
                <div className="eco-card-title">
                  <Navigation size={16} color="var(--teal-700)" />
                  Evacuation Route Navigator
                </div>
                <div className="eco-card-subtitle">
                  Uses your current location directly to reach safe relief centers
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Current Location Badge + Detect Button */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Origin: Your Current Location
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-medium)",
                  padding: "10px 12px",
                  borderRadius: 6
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0284c7" }}></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {locationName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Lat: {currentLat.toFixed(4)}° N • Lon: {currentLon.toFixed(4)}° E
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, gap: 4 }}
                    title="Refresh GPS Location"
                  >
                    <LocateFixed size={13} />
                    <span>{locating ? "Locating..." : "Use My GPS"}</span>
                  </button>
                </div>
              </div>

              {/* Target Relief Center Option */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Target Relief Center / Shelter
                </label>
                <select
                  value={selectedShelterId}
                  onChange={(e) => handleShelterChange(e.target.value)}
                  className="select-control"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.capacity - s.occupancy} available beds)
                    </option>
                  ))}
                </select>
              </div>

              {/* Open in Google Maps Button */}
              {route && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={openInGoogleMaps}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 9999,
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    <ExternalLink size={18} />
                    <span>Open in Google Maps (Turn-by-Turn Navigation)</span>
                  </button>

                  <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                    Redirects to Google Maps with your current GPS location as origin and {activeShelter?.name} as destination.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Summary Card */}
          {route && (
            <div className="eco-card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ background: "var(--bg-subtle)", padding: "10px 14px", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Distance</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    {route.distance_km} km
                  </div>
                </div>

                <div style={{ background: "var(--bg-subtle)", padding: "10px 14px", borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Estimated Travel Time</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--teal-800)" }}>
                    {route.estimated_travel_time_min} mins
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Turn-by-Turn Waypoints:
                </div>
                {route.turn_by_turn?.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: "var(--teal-700)", fontWeight: 700 }}>•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Small Interactive Leaflet Map */}
        <div className="eco-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Compass size={16} color="var(--teal-700)" />
              Safe Road-Wise Corridor Preview
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {computing ? "Recalculating corridor..." : "Road-wise polyline active"}
            </span>
          </div>

          {/* Small Map Container */}
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: 380,
              borderRadius: 8,
              border: "1px solid var(--border-medium)",
              overflow: "hidden"
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0284c7", display: "inline-block" }}></span>
                Origin (Current Location)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#059669", display: "inline-block" }}></span>
                Destination Shelter
              </span>
            </div>
            <span style={{ color: "var(--teal-800)", fontWeight: 600 }}>
              Avoids low-elevation Mutha riverbank basins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
