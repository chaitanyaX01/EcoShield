import React, { useEffect, useState } from "react";
import {
  Cpu,
  Sliders,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import { Zone, WeatherData } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";

export const PredictionPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("sinhagad_rd");
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);

  // Model input state - always automatically uses live weather as default
  const [rainfall, setRainfall] = useState<number>(0.0);
  const [humidity, setHumidity] = useState<number>(50.0);
  const [temperature, setTemperature] = useState<number>(26.5);
  const [drainageScore, setDrainageScore] = useState<number>(38.0);
  const [previousFloods, setPreviousFloods] = useState<number>(6);
  const [elevation, setElevation] = useState<number>(560.0);
  const [populationDensity, setPopulationDensity] = useState<number>(18500.0);
  const [soilSaturation, setSoilSaturation] = useState<number>(65.0);

  // Output prediction
  const [prediction, setPrediction] = useState<any>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  useEffect(() => {
    async function init() {
      try {
        const zList = await api.getZones();
        setZones(zList);

        const initZone = zList.find((z) => z.id === "sinhagad_rd") || zList[0];
        if (initZone) {
          syncZoneDefaults(initZone);
          const w = await api.getZoneWeather(initZone.id);
          setLiveWeather(w);
          if (w) {
            setRainfall(w.rainfall_last_hour_mm);
            setHumidity(w.humidity_percent);
            setTemperature(w.temperature_c);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  const syncZoneDefaults = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setElevation(zone.elevation_m);
    setDrainageScore(zone.drainage_score);
    setPopulationDensity(zone.population_density);
    setPreviousFloods(zone.previous_floods);
  };

  const handleZoneChange = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const z = zones.find((item) => item.id === zoneId);
    if (z) {
      syncZoneDefaults(z);
      try {
        // Automatically default to live weather for each selected city/zone
        const w = await api.getZoneWeather(zoneId);
        setLiveWeather(w);
        if (w) {
          setRainfall(w.rainfall_last_hour_mm);
          setHumidity(w.humidity_percent);
          setTemperature(w.temperature_c);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleRunInference = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCalculating(true);
    try {
      const res = await api.predictFloodRisk({
        zone_id: selectedZoneId,
        rainfall_mm_h: Number(rainfall),
        humidity_pct: Number(humidity),
        temperature_c: Number(temperature),
        drainage_score: Number(drainageScore),
        previous_flood: Number(previousFloods),
        elevation_m: Number(elevation),
        population_density: Number(populationDensity),
        soil_saturation: Number(soilSaturation),
      });
      setPrediction(res);
    } catch (err: any) {
      alert("Inference failed: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  // Run once initially on load
  useEffect(() => {
    if (zones.length > 0) {
      handleRunInference();
    }
  }, [zones]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Machine Learning Diagnostics
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            Flood-Risk Prediction Engine
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Real-time live weather feeds into predictive hydrology models for Pune micro-catchments.
          </p>
        </div>

        <div style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-subtle)",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <Cpu size={16} color="var(--teal-700)" />
          <span>Active Model: <strong>Extra Trees Classifier</strong></span>
        </div>
      </div>

      <div className="prediction-grid">
        {/* Left Column: Feature Controls Form */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <div className="eco-card-title">
                <Sliders size={16} color="var(--teal-700)" />
                Catchment Telemetry & Risk Parameters
              </div>
              <div className="eco-card-subtitle">
                Automatically synchronized with live weather telemetry
              </div>
            </div>
          </div>

          <form onSubmit={handleRunInference} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Zone Selector */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                Target Catchment Zone
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="select-control"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Rainfall rate */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                  Precipitation Rate: <strong>{rainfall} mm/h</strong>
                </span>
                <span style={{ color: "var(--text-muted)" }}>0 - 200 mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="0.5"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--teal-700)" }}
              />
            </div>

            {/* Slider 2: Soil Saturation */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                  Soil Saturation Index: <strong>{soilSaturation}%</strong>
                </span>
                <span style={{ color: "var(--text-muted)" }}>Antecedent moisture</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={soilSaturation}
                onChange={(e) => setSoilSaturation(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--teal-700)" }}
              />
            </div>

            <div className="grid-2">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Relative Humidity (%)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="5"
                  max="100"
                  step="0.1"
                  className="input-control"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Temperature (°C) [Decimals Allowed]
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="60"
                  step="0.1"
                  className="input-control"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Drainage Score (0-100)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  step="1"
                  className="input-control"
                  value={drainageScore}
                  onChange={(e) => setDrainageScore(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Topography Elevation (m)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="300"
                  max="1400"
                  step="1"
                  className="input-control"
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Population Density (per km²)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1000"
                  max="60000"
                  step="100"
                  className="input-control"
                  value={populationDensity}
                  onChange={(e) => setPopulationDensity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Historical Floods Count
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="20"
                  step="1"
                  className="input-control"
                  value={previousFloods}
                  onChange={(e) => setPreviousFloods(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={calculating}
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: 6 }}
            >
              {calculating ? "Calculating..." : "Run Flood Risk Prediction"}
            </button>
          </form>
        </div>

        {/* Right Column: Prediction Results & Tactical Action */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {prediction ? (
            <div className="eco-card" style={{ borderTop: `4px solid ${
              prediction.risk_level === "Critical" ? "var(--risk-crit-dot)" :
              prediction.risk_level === "High" ? "var(--risk-high-dot)" :
              prediction.risk_level === "Moderate" ? "var(--risk-mod-dot)" : "#10b981"
            }` }}>
              <div className="eco-card-header">
                <div className="eco-card-title">
                  <Cpu size={18} color="var(--teal-700)" />
                  Inference Outcome
                </div>
                <StatusBadge type="risk" value={prediction.risk_level} />
              </div>

              {/* Flood Probability Gauge */}
              <div style={{
                background: "var(--bg-subtle)",
                padding: "16px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 16,
                textAlign: "center"
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Estimated Inundation Probability
                </div>
                <div style={{ fontSize: 38, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0" }}>
                  {Math.round(prediction.probability * 100)}%
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: prediction.flood_predicted ? "var(--risk-crit-text)" : "var(--risk-low-text)"
                }}>
                  {prediction.flood_predicted ? "FLASH FLOOD LIKELY" : "NO IMMEDIATE FLOOD WARNING"}
                </div>

                {/* Visual Bar */}
                <div style={{ height: 8, background: "var(--border-medium)", borderRadius: 4, overflow: "hidden", marginTop: 10 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(prediction.probability * 100)}%`,
                      backgroundColor:
                        prediction.probability > 0.75 ? "var(--risk-crit-dot)" :
                        prediction.probability > 0.50 ? "var(--risk-high-dot)" :
                        prediction.probability > 0.25 ? "var(--risk-mod-dot)" : "#10b981",
                      transition: "width 0.3s ease"
                    }}
                  ></div>
                </div>
              </div>

              {/* Action Directive */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase" }}>
                  Recommended Tactical Action
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  background: "var(--bg-subtle)",
                  padding: "12px",
                  borderRadius: 6,
                  borderLeft: "3px solid var(--teal-700)"
                }}>
                  {prediction.recommended_action || prediction.recommendation}
                </div>
              </div>

              {/* Feature Vector Summary */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, fontSize: 11 }}>
                <div style={{ fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                  Evaluated Feature Snapshot
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: "var(--text-secondary)" }}>
                  <div>Rainfall: <strong>{rainfall} mm/h</strong></div>
                  <div>Temperature: <strong>{temperature} °C</strong></div>
                  <div>Soil Saturation: <strong>{soilSaturation}%</strong></div>
                  <div>Elevation: <strong>{elevation}m</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="eco-card" style={{ textAlign: "center", padding: "40px" }}>
              <Cpu size={32} style={{ margin: "0 auto 10px", color: "var(--teal-700)", opacity: 0.5 }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Running initial inference...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
