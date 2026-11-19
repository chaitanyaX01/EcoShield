import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  ThumbsUp,
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  PhoneCall,
  UserCheck,
  Shield,
  Upload,
  Waves,
  Trash2,
  TreePine,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Navigation,
  Home,
  Check,
  Activity,
} from "lucide-react";
import { api } from "../services/api";
import { Zone, Incident, Shelter } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { CameraCaptureModal } from "../components/common/CameraCaptureModal";

export const CitizenPortal: React.FC = () => {
  const { user } = useAuth();

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("katraj");
  const [zoneWeather, setZoneWeather] = useState<any>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Modals & UI States
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [communityScope, setCommunityScope] = useState<"neighborhood" | "all">("neighborhood");

  // Citizen Form state (clean, empty defaults)
  const [citizenName, setCitizenName] = useState<string>(user?.name || "");
  const [citizenMobile, setCitizenMobile] = useState<string>(user?.mobile || "");
  const [citizenCertified, setCitizenCertified] = useState<boolean>(true);

  // Local user confirmed incidents tracker
  const [myConfirmedIds, setMyConfirmedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("ecoshield_my_confirmed_incidents");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Incident problem details
  const [incidentType, setIncidentType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("moderate");
  const [waterDepth, setWaterDepth] = useState<number>(30);
  const [wasteScale, setWasteScale] = useState<string>("moderate");
  const [hasWaterPoolingWithWaste, setHasWaterPoolingWithWaste] = useState<boolean>(false);
  const [treeObstructionType, setTreeObstructionType] = useState<string>("lane_blocked");
  const [title, setTitle] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);

  // Sync with auth user if changed
  useEffect(() => {
    if (user) {
      if (user.name) setCitizenName(user.name);
      if (user.mobile) setCitizenMobile(user.mobile);
    }
  }, [user]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [zList, incList, sList] = await Promise.all([
          api.getZones(),
          api.getIncidents(),
          api.getShelters().catch(() => []),
        ]);
        setZones(zList);
        setIncidents(incList.filter((i) => i.status !== "resolved"));
        setShelters(sList);
        if (zList.length > 0) {
          const defaultZ = zList.find((z) => z.id === "katraj") || zList[0];
          setSelectedZoneId(defaultZ.id);
          const w = await api.getZoneWeather(defaultZ.id);
          setZoneWeather(w);
        }
      } catch (err) {
        console.error("Failed to load citizen data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleZoneChange = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    try {
      const w = await api.getZoneWeather(zoneId);
      setZoneWeather(w);
    } catch {
      // ignore
    }
  };

  // Enforce 1 user = 1 confirm rule
  const handleConfirmReport = async (incidentId: string) => {
    const userIdentifier = (user?.mobile || user?.email || citizenMobile || "citizen_user").trim();

    try {
      const res = await api.confirmIncident(incidentId, {
        user_id: userIdentifier,
        user_name: citizenName.trim() || user?.name || "Citizen",
        simulated_batch: 1,
      });

      if (res.already_confirmed) {
        alert("You have already confirmed this hazard report. 1 user can only make 1 confirmation.");
        setMyConfirmedIds((prev) => {
          const updated = new Set(prev).add(incidentId);
          localStorage.setItem("ecoshield_my_confirmed_incidents", JSON.stringify(Array.from(updated)));
          return updated;
        });
        return;
      }

      setMyConfirmedIds((prev) => {
        const updated = new Set(prev).add(incidentId);
        localStorage.setItem("ecoshield_my_confirmed_incidents", JSON.stringify(Array.from(updated)));
        return updated;
      });

      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId
            ? {
                ...inc,
                corroborations: res.corroborations,
                status: res.status,
                confidence_score: res.confidence_score,
                confirmed_by: res.confirmed_by || inc.confirmed_by,
              }
            : inc
        )
      );
    } catch (err: any) {
      alert("Could not confirm report: " + (err.message || "Network error"));
    }
  };

  // Image compressor creating Base64 Data URL visible to Admin & Field Units
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsPhotoLoading(true);
      try {
        const dataUrl = await compressImageFile(file);
        setSimulatedPhoto(dataUrl);
      } catch (err) {
        console.error("Failed to read image file", err);
        alert("Could not process selected image. Please try another image.");
      } finally {
        setIsPhotoLoading(false);
      }
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType) {
      alert("Please select a problem category from the dropdown.");
      return;
    }

    if (!title.trim()) {
      alert("Please provide a short description or location landmark.");
      return;
    }

    if (!citizenName.trim()) {
      alert("Citizen name is required to submit an official municipal report.");
      return;
    }

    if (!citizenCertified) {
      alert("Please agree to the citizen declaration certifying that this report is genuine.");
      return;
    }

    const currentZone = zones.find((z) => z.id === selectedZoneId);
    setSubmitting(true);
    setSubmitSuccess(null);

    const reporterLabel = citizenMobile.trim()
      ? `${citizenName.trim()} (${citizenMobile.trim()})`
      : citizenName.trim();

    const isFloodingType = [
      "street_flooding",
      "residential_flooding",
      "impassable_road",
      "blocked_drain",
    ].includes(incidentType);
    const finalWaterDepth = isFloodingType ? waterDepth : undefined;

    let extraContext = "";
    if (["waste_blockage", "waste_dumping"].includes(incidentType)) {
      extraContext = `[Waste Accumulation: ${wasteScale.toUpperCase()}${hasWaterPoolingWithWaste ? " | Stagnant Water Present" : ""}]`;
    } else if (incidentType === "fallen_tree") {
      extraContext = `[Obstruction: ${treeObstructionType.toUpperCase()}]`;
    }
    const finalNote = [extraContext, note.trim()].filter(Boolean).join(" ");

    try {
      const res = await api.createIncident({
        zone_id: selectedZoneId,
        title: title.trim(),
        incident_type: incidentType,
        severity,
        water_depth_cm: finalWaterDepth,
        address: address.trim() || `${currentZone?.name || "Pune"} sector`,
        note: finalNote || undefined,
        reporter: reporterLabel,
        photo_url: simulatedPhoto || undefined,
        lat: currentZone ? currentZone.lat + (Math.random() - 0.5) * 0.006 : 18.5204,
        lon: currentZone ? currentZone.lon + (Math.random() - 0.5) * 0.006 : 73.8567,
      });

      setMyConfirmedIds((prev) => {
        const updated = new Set(prev).add(res.id);
        localStorage.setItem("ecoshield_my_confirmed_incidents", JSON.stringify(Array.from(updated)));
        return updated;
      });

      setSubmitSuccess(`Report filed successfully (Ref ID: ${res.id}). Forwarded immediately to Pune Municipal Emergency Operations.`);
      setTitle("");
      setIncidentType("");
      setAddress("");
      setNote("");
      setSimulatedPhoto(null);
      setHasWaterPoolingWithWaste(false);

      const updated = await api.getIncidents();
      setIncidents(updated.filter((i) => i.status !== "resolved"));
    } catch (err: any) {
      alert(err.message || "Failed to submit hazard report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && zones.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "55vh",
        gap: 16,
      }}>
        <div
          className="pulse-dot animated"
          style={{
            width: 22,
            height: 22,
            background: "var(--lime-500)",
            boxShadow: "0 0 20px rgba(187, 244, 81, 0.4)",
          }}
        />
        <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>
          Connecting to Pune Municipal Watershed Telemetry...
        </div>
      </div>
    );
  }

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const localIncidents = incidents.filter((i) => i.zone_id === selectedZoneId && i.status !== "resolved");
  const displayedIncidents = communityScope === "neighborhood" ? localIncidents : incidents;

  // Nearby shelters for selected zone
  const localShelters = shelters.filter((s) => s.zone_id === selectedZoneId || !s.zone_id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 48 }}>
      {/* =========================================================================
          HERO BANNER: FOREST GREEN CONTAINER WITH EDITORIAL LAYOUT (From Reference UI)
          ========================================================================= */}
      <section className="forest-hero-container" style={{ padding: "40px 36px 36px" }}>
        {/* Editorial Eyebrow Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(187, 244, 81, 0.16)",
            color: "var(--lime-400)",
            border: "1px solid rgba(187, 244, 81, 0.35)",
            padding: "4px 12px",
            borderRadius: 9999,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>
            <Sparkles size={13} />
            Pune Metropolitan Flood Resilience • Live Citizen Advisory
          </span>
          <span style={{
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.65)",
            background: "rgba(0, 0, 0, 0.25)",
            padding: "4px 10px",
            borderRadius: 9999,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span className="pulse-dot animated" style={{ background: "var(--lime-400)", width: 7, height: 7 }} />
            Active Real-Time Monitoring
          </span>
        </div>

        {/* Large Editorial Headline & Subtitle */}
        <div style={{ maxWidth: 860, marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4.5vw, 48px)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: "0 0 14px",
          }}>
            Protecting Pune’s Communities From Monsoon Inundation
          </h1>
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(244, 251, 246, 0.85)",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 720,
          }}>
            Empowering residents across 8 major drainage basins with AI-powered rainfall telemetry,
            automated flood risk forecasting, and direct incident dispatch to Pune Municipal Emergency Operations.
          </p>
        </div>

        {/* Action Controls Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
          <a
            href="#report-section"
            className="btn btn-lime"
            style={{ padding: "12px 24px", fontSize: 14 }}
          >
            <AlertTriangle size={17} />
            <span>Report an Incident</span>
          </a>

          <Link
            to="/citizen/map"
            className="btn btn-outline-white"
            style={{ padding: "12px 22px", fontSize: 14 }}
          >
            <Compass size={17} />
            <span>Explore Live Risk Map</span>
          </Link>

          <Link
            to="/citizen/shelters"
            className="btn btn-outline-white"
            style={{ padding: "12px 20px", fontSize: 14 }}
          >
            <Home size={16} />
            <span>Nearby Shelters</span>
          </Link>

          <a
            href="tel:112"
            className="btn btn-outline-white"
            style={{
              padding: "12px 18px",
              fontSize: 14,
              borderColor: "rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              background: "rgba(239, 68, 68, 0.12)",
            }}
          >
            <PhoneCall size={16} />
            <span>112 Emergency Helpline</span>
          </a>
        </div>

        {/* Cinematic Nature / Pune Monsoon Hero Image Panel */}
        <div style={{
          position: "relative",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
          minHeight: 380,
          background: "#0d2f1f",
        }}>
          <img
            src="/images/pune_monsoon_river.jpg"
            alt="Pune Mutha river monsoon flood resilience"
            style={{
              width: "100%",
              height: 420,
              objectFit: "cover",
              display: "block",
              filter: "brightness(0.92) contrast(1.04)",
            }}
          />

          {/* Top Floating Badge on Image */}
          <div style={{
            position: "absolute",
            top: 18,
            left: 18,
            right: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}>
            <div style={{
              background: "rgba(9, 35, 23, 0.88)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              color: "#ffffff",
              fontSize: 12.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span className="pulse-dot animated" style={{ background: "var(--lime-500)", width: 8, height: 8 }} />
              <span>Pune Mutha Basin Telemetry • Hydro-Sensors Online</span>
            </div>

            <div className="hide-on-mobile" style={{
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: 11.5,
            }}>
              Live Telemetry Feed: OpenWeather &amp; PMC EOC
            </div>
          </div>

          {/* Bottom Floating Area Selector & Current Risk Overlay on Image */}
          <div style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: "rgba(9, 35, 23, 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}>
            {/* Area Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
              <div>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--lime-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                  Select Your Pune Area
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  style={{
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.22)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    padding: "8px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                    minWidth: 220,
                  }}
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} style={{ background: "#092317", color: "#fff" }}>
                      {z.name} ({String(z.risk_level).toUpperCase()} Risk)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Local Flood Risk Pill & Safety Guidance */}
            {selectedZone && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 280 }}>
                {(() => {
                  const currentRisk = (selectedZone.risk_level || "").toLowerCase();
                  const isHigh = currentRisk === "high" || currentRisk === "critical";
                  const isMod = currentRisk === "moderate";
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{
                        background: isHigh
                          ? "rgba(239, 68, 68, 0.22)"
                          : isMod
                            ? "rgba(245, 158, 11, 0.22)"
                            : "rgba(187, 244, 81, 0.22)",
                        border: `1.5px solid ${isHigh ? "#ef4444" : isMod ? "#f59e0b" : "var(--lime-500)"}`,
                        borderRadius: "12px",
                        padding: "8px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                      }}>
                        <span className="pulse-dot animated" style={{
                          background: isHigh ? "#ef4444" : isMod ? "#f59e0b" : "var(--lime-500)"
                        }} />
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#ffffff", letterSpacing: "0.02em" }}>
                          {selectedZone.display_name}: {String(selectedZone.risk_level).toUpperCase()} RISK
                        </span>
                      </div>

                      <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.85)", maxWidth: 360, lineHeight: 1.4 }}>
                        {currentRisk === "low"
                          ? "Roads and storm drains are clear. Normal surface runoff."
                          : isMod
                            ? "Water pooling detected in low-lying sectors. Avoid underpasses."
                            : "Heavy waterlogging active. Flood alert issued for canal banks."}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Quick Report Link */}
            <div>
              <a
                href="#report-section"
                className="btn btn-sm btn-lime"
                style={{ padding: "8px 16px", fontSize: 12.5 }}
              >
                <span>Report in {selectedZone?.name || "Local Area"} ↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* 4 Stat Counter Boxes (Inspired by Reference UI 1200+, 98%, 4.9 blocks) */}
        <div style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          <div className="stat-counter-box">
            <div className="stat-counter-number">8 Basins</div>
            <div className="stat-counter-label">Monitored Watersheds in Pune</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 4 }}>
              Katraj, Mutha, Sinhagad, Kothrud &amp; more
            </div>
          </div>

          <div className="stat-counter-box">
            <div className="stat-counter-number">93.6%</div>
            <div className="stat-counter-label">Flood AI Prediction Precision</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 4 }}>
              Random Forest model calibrated on monsoon telemetry
            </div>
          </div>

          <div className="stat-counter-box">
            <div className="stat-counter-number">12 Centers</div>
            <div className="stat-counter-label">Active Municipal Shelters</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 4 }}>
              Prepared with emergency power, water &amp; medical beds
            </div>
          </div>

          <div className="stat-counter-box">
            <div className="stat-counter-number">&lt; 15 min</div>
            <div className="stat-counter-label">Emergency Squad Triage</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 4 }}>
              PMC Disaster Management Cell field response
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: LOCAL WEATHER & WATERSHED RISK SUMMARY (Editorial White Section)
          ========================================================================= */}
      <section className="editorial-white-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--forest-700)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Live Telemetry &amp; Environmental Intelligence
            </div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "var(--text-charcoal)", margin: 0 }}>
              Weather &amp; Watershed Runoff for {selectedZone?.name || "Pune"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Real-time atmospheric measurements combined with watershed slope and drainage infrastructure scores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, padding: "8px 14px", gap: 6 }}
          >
            <Info size={14} />
            <span>{showTechnicalDetails ? "Hide Advanced Hydrology" : "Show Advanced Hydrology"}</span>
            {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* 2-Column Grid: Left Telemetry Parameters / Right High Quality Image */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "stretch",
        }}>
          {/* Left Column: Metric Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {zoneWeather && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
              }}>
                <div style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Rainfall (Last Hour)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--forest-900)" }}>
                    {zoneWeather.rainfall_last_hour_mm} <span style={{ fontSize: 14, fontWeight: 500 }}>mm/h</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    {zoneWeather.rainfall_last_hour_mm > 30 ? "Heavy Downpour" : zoneWeather.rainfall_last_hour_mm > 10 ? "Moderate Shower" : "Light / Trace Rain"}
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Temperature &amp; Sky
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--forest-900)" }}>
                    {zoneWeather.temperature_c}°C
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    {zoneWeather.weather_condition}
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Relative Humidity
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--forest-900)" }}>
                    {zoneWeather.humidity_percent}%
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    Atmospheric Moisture
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Wind Speed
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--forest-900)" }}>
                    {zoneWeather.wind_speed_kmh} <span style={{ fontSize: 14, fontWeight: 500 }}>km/h</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    Monsoon Gust Velocity
                  </div>
                </div>
              </div>
            )}

            {/* Technical Hydrology Expansion */}
            {showTechnicalDetails && selectedZone && (
              <div style={{
                background: "#f8faf8",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
                fontSize: 12.5,
              }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Elevation: </span>
                  <strong>{selectedZone.elevation_m} meters</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Drainage Score: </span>
                  <strong>{selectedZone.drainage_score} / 100</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Documented Floods: </span>
                  <strong>{selectedZone.previous_floods} monsoon events</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Active Reports in Area: </span>
                  <strong>{localIncidents.length} verified</strong>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Editorial Urban Drainage Image Panel */}
          <div style={{
            position: "relative",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            border: "1px solid var(--border-light)",
            minHeight: 220,
            background: "#eef2ee",
          }}>
            <img
              src="/images/urban_drainage_pune.jpg"
              alt="Urban stormwater drainage canal in Pune with water gauge"
              style={{
                width: "100%",
                height: "100%",
                minHeight: 240,
                maxHeight: 280,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(180deg, transparent 0%, rgba(9, 35, 23, 0.92) 100%)",
              padding: "24px 18px 14px",
              color: "#ffffff",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Pune Stormwater Drainage &amp; Canal Telemetry
              </div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)", marginTop: 2 }}>
                Real-time culvert water gauges and de-silting sensors monitored by PMC disaster teams.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: COMMUNITY HAZARD REPORTS (Editorial White Section)
          ========================================================================= */}
      <section className="editorial-white-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--forest-700)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Neighborhood Citizen Watch
            </div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "var(--text-charcoal)", margin: 0 }}>
              Live Community Hazard Reports ({displayedIncidents.length})
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Crowdsourced flood, drainage, and waste reports verified by neighborhood residents.
            </p>
          </div>

          {/* Scope Switcher */}
          <div style={{ display: "flex", gap: 6, background: "var(--bg-subtle)", padding: 4, borderRadius: "var(--radius-full)", border: "1px solid var(--border-light)" }}>
            <button
              type="button"
              onClick={() => setCommunityScope("neighborhood")}
              style={{
                fontSize: 12,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "none",
                cursor: "pointer",
                background: communityScope === "neighborhood" ? "var(--forest-900)" : "transparent",
                color: communityScope === "neighborhood" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: communityScope === "neighborhood" ? 700 : 500,
                transition: "all 0.2s",
              }}
            >
              {selectedZone?.name || "Local Area"} ({localIncidents.length})
            </button>
            <button
              type="button"
              onClick={() => setCommunityScope("all")}
              style={{
                fontSize: 12,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "none",
                cursor: "pointer",
                background: communityScope === "all" ? "var(--forest-900)" : "transparent",
                color: communityScope === "all" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: communityScope === "all" ? 700 : 500,
                transition: "all 0.2s",
              }}
            >
              All Pune ({incidents.length})
            </button>
          </div>
        </div>

        {/* Incidents Feed */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {displayedIncidents.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "48px 24px",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border-medium)",
            }}>
              <CheckCircle size={36} color="var(--forest-600)" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-charcoal)" }}>
                No Active Hazards in {communityScope === "neighborhood" ? (selectedZone?.name || "this area") : "Pune"}!
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                All reported drainage blockages and waterlogging have been addressed by the response squad.
              </div>
            </div>
          ) : (
            displayedIncidents.map((inc) => {
              const isConfirmedByMe = myConfirmedIds.has(inc.id);

              return (
                <div
                  key={inc.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-lg)",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-charcoal)", lineHeight: 1.3 }}>
                        {inc.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                        <MapPin size={12} color="var(--forest-600)" />
                        <span>{inc.address}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 600 }}>{inc.zone_id.toUpperCase()}</span>
                      </div>
                    </div>
                    <StatusBadge type="severity" value={inc.severity} size="sm" />
                  </div>

                  {/* Photo & Details row */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {inc.photo_before && (
                      <div
                        onClick={() => setViewingPhotoUrl(inc.photo_before || null)}
                        style={{
                          cursor: "pointer",
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#000",
                          flexShrink: 0,
                          position: "relative",
                          border: "1px solid var(--border-medium)",
                        }}
                        title="Click to view full photo"
                      >
                        <img
                          src={inc.photo_before}
                          alt="Report proof"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div style={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          background: "rgba(0,0,0,0.75)",
                          color: "#fff",
                          fontSize: 9,
                          padding: "1px 4px",
                          borderRadius: 3,
                        }}>
                          Zoom
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 12.5, color: "var(--text-secondary)", flex: 1 }}>
                      {inc.water_depth_cm && inc.water_depth_cm > 0 ? (
                        <div>Water Depth: <strong style={{ color: "var(--forest-900)" }}>{inc.water_depth_cm} cm</strong></div>
                      ) : (
                        <div>Category: <strong>{inc.incident_type?.replace(/_/g, " ").toUpperCase() || "Hazard"}</strong></div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        Reported by: {inc.reporter}
                      </div>
                      {inc.note && (
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                          "{inc.note}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirmation Bar */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 10,
                    borderTop: "1px solid var(--border-light)",
                    marginTop: "auto",
                  }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, color: "var(--forest-900)" }}>
                        {inc.corroborations || 0}
                      </span>
                      <span>Citizen Confirmations</span>
                      {isConfirmedByMe && (
                        <span style={{
                          fontSize: 10,
                          background: "rgba(21, 128, 61, 0.12)",
                          color: "var(--forest-700)",
                          padding: "2px 6px",
                          borderRadius: 9999,
                          fontWeight: 700,
                        }}>
                          ✓ Confirmed by You
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isConfirmedByMe}
                      onClick={() => handleConfirmReport(inc.id)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: 11.5,
                        padding: "5px 12px",
                        gap: 5,
                        borderRadius: "var(--radius-full)",
                        borderColor: isConfirmedByMe ? "var(--border-medium)" : "var(--forest-700)",
                        color: isConfirmedByMe ? "var(--text-muted)" : "var(--forest-900)",
                        cursor: isConfirmedByMe ? "default" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      <ThumbsUp size={13} />
                      <span>{isConfirmedByMe ? "Confirmed" : "+1 Confirm"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CITIZEN REPORT FORM (Editorial White Section, ID: report-section)
          ========================================================================= */}
      <section id="report-section" className="editorial-white-section" style={{ scrollMarginTop: 90 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(21, 128, 61, 0.10)",
              color: "var(--forest-700)",
              padding: "4px 12px",
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
            }}>
              <AlertTriangle size={13} />
              Pune Municipal Emergency Operations Dispatch Line
            </span>
            <h2 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800, color: "var(--text-charcoal)", margin: "4px 0 8px" }}>
              Report a Flood, Drainage or Waste Problem
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>
              Direct reporting channel to Pune Municipal Corporation. Field response units are prioritized by severity and corroborated citizen reports.
            </p>
          </div>

          {submitSuccess && (
            <div style={{
              background: "rgba(21, 128, 61, 0.10)",
              border: "1px solid rgba(21, 128, 61, 0.35)",
              color: "var(--forest-800)",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              marginBottom: 24,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 600,
            }}>
              <CheckCircle size={18} color="var(--forest-700)" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitReport} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Step 1: Problem Selection */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-charcoal)", marginBottom: 6 }}>
                1. What is the hazard or issue? *
              </label>
              <select
                className="select-control"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                required
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  borderColor: !incidentType ? "var(--border-medium)" : "var(--forest-600)",
                  background: "#ffffff",
                  padding: "11px 14px",
                }}
              >
                <option value="" disabled>-- Select Problem Category --</option>
                <option value="waste_blockage">🗑️ Garbage / Solid Waste Clogging Storm Drain</option>
                <option value="waste_dumping">🚫 Illegal Waste / Construction Debris Dumping in Canal</option>
                <option value="blocked_drain">🌊 Choked Sump / Blocked Culvert</option>
                <option value="street_flooding">🚗 Street Waterlogging / Flooded Road</option>
                <option value="residential_flooding">🏠 Residential Area / Basement Inundation</option>
                <option value="impassable_road">⛔ Submerged Road / Impassable Underpass</option>
                <option value="fallen_tree">🌳 Fallen Tree / Drainage Obstruction</option>
              </select>
            </div>

            {/* Dynamic Contextual Metric: Water Depth */}
            {["street_flooding", "residential_flooding", "impassable_road", "blocked_drain"].includes(incidentType) && (
              <div style={{
                background: "rgba(15, 118, 110, 0.06)",
                border: "1px solid rgba(15, 118, 110, 0.25)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--forest-800)" }}>
                    Estimated Floodwater Depth
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--forest-900)" }}>
                    {waterDepth} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={waterDepth}
                  onChange={(e) => setWaterDepth(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--forest-700)" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {[
                    { label: "Ankle (15cm)", val: 15 },
                    { label: "Knee (45cm)", val: 45 },
                    { label: "Waist (90cm)", val: 90 },
                    { label: "Submerged (150cm)", val: 150 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setWaterDepth(preset.val)}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        padding: "6px 4px",
                        borderRadius: "var(--radius-xs)",
                        border: waterDepth === preset.val ? "1px solid var(--forest-800)" : "1px solid var(--border-medium)",
                        background: waterDepth === preset.val ? "var(--forest-900)" : "#ffffff",
                        color: waterDepth === preset.val ? "#ffffff" : "var(--text-muted)",
                        cursor: "pointer",
                        fontWeight: waterDepth === preset.val ? 700 : 500,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Contextual Metric: Waste Scale */}
            {["waste_blockage", "waste_dumping"].includes(incidentType) && (
              <div style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.28)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#b45309", marginBottom: 8 }}>
                  Garbage Volume / Canal Choke Scale
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {[
                    { key: "small", label: "Small Pile / Litter" },
                    { key: "moderate", label: "Moderate Heap" },
                    { key: "massive", label: "Massive Choke" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setWasteScale(s.key)}
                      style={{
                        flex: 1,
                        fontSize: 12,
                        padding: "8px 6px",
                        borderRadius: "var(--radius-xs)",
                        border: wasteScale === s.key ? "1px solid #b45309" : "1px solid var(--border-medium)",
                        background: wasteScale === s.key ? "#b45309" : "#ffffff",
                        color: wasteScale === s.key ? "#ffffff" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontWeight: wasteScale === s.key ? 700 : 500,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={hasWaterPoolingWithWaste}
                    onChange={(e) => setHasWaterPoolingWithWaste(e.target.checked)}
                    style={{ accentColor: "#b45309" }}
                  />
                  <span>Is waste accumulation causing stagnant water backflow?</span>
                </label>
              </div>
            )}

            {/* Dynamic Contextual Metric: Tree Obstruction */}
            {incidentType === "fallen_tree" && (
              <div style={{
                background: "rgba(21, 128, 61, 0.08)",
                border: "1px solid rgba(21, 128, 61, 0.28)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--forest-800)", marginBottom: 8 }}>
                  Road Obstruction Level
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { key: "partial_branch", label: "Partial Branch" },
                    { key: "lane_blocked", label: "Full Road Blocked" },
                    { key: "power_line", label: "Wires Entangled" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTreeObstructionType(t.key)}
                      style={{
                        flex: 1,
                        fontSize: 12,
                        padding: "8px 6px",
                        borderRadius: "var(--radius-xs)",
                        border: treeObstructionType === t.key ? "1px solid var(--forest-800)" : "1px solid var(--border-medium)",
                        background: treeObstructionType === t.key ? "var(--forest-900)" : "#ffffff",
                        color: treeObstructionType === t.key ? "#ffffff" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontWeight: treeObstructionType === t.key ? 700 : 500,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Location Landmark */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-charcoal)", marginBottom: 6 }}>
                2. Where is it located? *
              </label>
              <input
                type="text"
                placeholder="Brief summary (e.g. Clogged stormwater culvert near Katraj Bus Depot)"
                className="input-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ marginBottom: 10, padding: "10px 14px", fontSize: 13.5 }}
              />
              <input
                type="text"
                placeholder="Specific Street / Landmark (e.g. Opposite Datta Mandir, Lane 3)"
                className="input-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ padding: "10px 14px", fontSize: 13.5 }}
              />
            </div>

            {/* Step 3: Photo Attachment */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-charcoal)", marginBottom: 6 }}>
                3. Attach Photo of Problem (Camera or File)
              </label>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setCameraModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 8, padding: "10px 16px", fontWeight: 600, fontSize: 13 }}
                >
                  <Camera size={16} color="var(--forest-700)" />
                  <span>Snap Photo (Camera)</span>
                </button>

                <label
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 8, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  <Upload size={15} color="var(--forest-700)" />
                  <span>Upload from Phone</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>

                {isPhotoLoading && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Compressing photo for field units...</span>
                )}
              </div>

              {/* Photo Preview Thumbnail */}
              {simulatedPhoto && (
                <div style={{
                  marginTop: 12,
                  position: "relative",
                  display: "inline-block",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "1px solid var(--border-medium)",
                  boxShadow: "var(--shadow-sm)",
                }}>
                  <img
                    src={simulatedPhoto}
                    alt="Problem preview"
                    style={{ width: 160, height: 110, objectFit: "cover", display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => setSimulatedPhoto(null)}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(0,0,0,0.75)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="Remove Photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 4: Citizen Details (Pre-filled from account) */}
            <div style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                Citizen Contact Information (Pre-filled)
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <input
                    type="text"
                    className="input-control"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    style={{ padding: "10px 14px", fontSize: 13 }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="input-control"
                    value={citizenMobile}
                    onChange={(e) => setCitizenMobile(e.target.value)}
                    placeholder="Contact Number / Email"
                    inputMode="tel"
                    required
                    style={{ padding: "10px 14px", fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={citizenCertified}
                onChange={(e) => setCitizenCertified(e.target.checked)}
                style={{ accentColor: "var(--forest-700)", marginTop: 2 }}
              />
              <span>
                I certify that this report reflects genuine on-ground flood or drainage conditions in Pune for immediate municipal action.
              </span>
            </label>

            {/* Submit Button (Fresh Lime) */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-lime"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                gap: 10,
              }}
            >
              <AlertTriangle size={18} />
              <span>{submitting ? "Submitting to PMC..." : "📢 Submit Report to Pune Emergency Dispatch"}</span>
            </button>
          </form>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: SAFETY GUIDANCE & NEARBY SHELTERS (Editorial White Section)
          ========================================================================= */}
      <section className="editorial-white-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--forest-700)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Civil Protection &amp; Emergency Shelters
            </div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "var(--text-charcoal)", margin: 0 }}>
              Pune Monsoon Safety Guidance &amp; Shelters
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Essential flood survival protocols and verified municipal relief centers.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/citizen/routes" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
              <Navigation size={14} />
              <span>Safe Evacuation Routes</span>
            </Link>
            <Link to="/citizen/shelters" className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
              <Home size={14} />
              <span>All Shelters</span>
            </Link>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {/* Left Column: Safety Guidelines & Emergency Contacts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--forest-900)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="var(--forest-700)" />
                <span>Monsoon Flood Precautions in Pune</span>
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Check size={15} color="var(--forest-700)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><strong>Never cross flooded culverts:</strong> Just 15 cm of moving floodwater can sweep away pedestrians and 30 cm can float vehicles.</span>
                </li>
                <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Check size={15} color="var(--forest-700)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><strong>Switch off main electricity switch:</strong> If water begins entering your ground floor or basement, cut power at the main fuse immediately.</span>
                </li>
                <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Check size={15} color="var(--forest-700)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><strong>Keep emergency documents in sealed waterproof pouches:</strong> Keep phone charged and emergency battery backup accessible.</span>
                </li>
              </ul>
            </div>

            {/* Emergency Hotline Badges */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}>
              <a
                href="tel:02025501269"
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: "var(--text-charcoal)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ background: "rgba(21, 128, 61, 0.12)", color: "var(--forest-700)", padding: 8, borderRadius: 8 }}>
                  <PhoneCall size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>PMC Disaster Cell</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>020-25501269</div>
                </div>
              </a>

              <a
                href="tel:112"
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: "var(--text-charcoal)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", padding: 8, borderRadius: 8 }}>
                  <PhoneCall size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Police / EOC</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>112 Helpline</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Shelter Photo & Local Shelter Directory */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Shelter Image Panel */}
            <div style={{
              position: "relative",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              border: "1px solid var(--border-light)",
              minHeight: 180,
              background: "#0d2f1f",
            }}>
              <img
                src="/images/community_evacuation_shelter.jpg"
                alt="Pune community evacuation relief shelter"
                style={{
                  width: "100%",
                  height: 190,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(180deg, transparent 0%, rgba(9, 35, 23, 0.90) 100%)",
                padding: "20px 16px 12px",
                color: "#ffffff",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Municipal Relief &amp; Community Evacuation Shelters
                </div>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)", marginTop: 2 }}>
                  Equipped with dry rations, medical first-aid, power generators &amp; sanitation.
                </div>
              </div>
            </div>

            {/* List of 2-3 Local Shelters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {localShelters.slice(0, 3).map((sh) => (
                <div
                  key={sh.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-charcoal)" }}>
                      {sh.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                      Capacity: {sh.occupancy} / {sh.capacity} people occupied
                    </div>
                  </div>

                  <Link
                    to={`/citizen/shelters`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIVE CAMERA CAPTURE MODAL */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setSimulatedPhoto(dataUrl);
          setCameraModalOpen(false);
        }}
        title="Snap Problem Photo with Camera"
      />

      {/* FULL PHOTO LIGHTBOX MODAL */}
      {viewingPhotoUrl && (
        <div
          onClick={() => setViewingPhotoUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(9, 35, 23, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
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
              src={viewingPhotoUrl}
              alt="Hazard inspection full view"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.7)", objectFit: "contain" }}
            />
            <button
              onClick={() => setViewingPhotoUrl(null)}
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: "var(--forest-950)",
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
