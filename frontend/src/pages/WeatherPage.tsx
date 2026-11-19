import React, { useEffect, useState } from "react";
import {
  CloudRain,
  RefreshCw,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Clock,
} from "lucide-react";
import { api } from "../services/api";
import { WeatherSummary, WeatherData, Zone } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";

export const WeatherPage: React.FC = () => {
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  // No automatic default zone selection
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(600);

  const fetchWeather = async (force: boolean = false) => {
    try {
      if (force) setRefreshing(true);
      const [sum, zList] = await Promise.all([
        api.getWeatherSummary(force),
        api.getZones(),
      ]);
      setSummary(sum);
      setZones(zList);

      if (selectedZoneId) {
        const w = await api.getZoneWeather(selectedZoneId, force);
        setSelectedWeather(w);
      }
      setCountdown(600);
    } catch (err) {
      console.error("Failed to load weather", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather(false);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectZone = async (zoneId: string) => {
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
      setSelectedWeather(null);
      return;
    }
    setSelectedZoneId(zoneId);
    try {
      const w = await api.getZoneWeather(zoneId, false);
      setSelectedWeather(w);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !summary) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="pulse-dot animated" style={{ width: 14, height: 14, margin: "0 auto 10px", background: "var(--teal-600)" }}></div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading Weather Telemetry...</div>
        </div>
      </div>
    );
  }

  const selectedZoneMeta = zones.find((z) => z.id === selectedZoneId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Meteorological Station
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            Pune District Weather & Rainfall
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Real-time weather telemetry across Pune micro-catchment zones.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} />
            <span>Next refresh: <strong>{Math.floor(countdown / 60)}m {countdown % 60}s</strong></span>
          </div>

          <button
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Top District Summary Banner */}
      <div className="eco-card" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, var(--bg-surface) 100%)", borderLeft: "4px solid var(--green-500)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {summary.district} Overview
              </span>
              <span style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "var(--green-400)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "2px 10px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600
              }}>
                {summary.source}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Monitoring 8 key river basins and micro-catchments across Pune.
            </p>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Avg Temperature</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                {summary.average_temperature_c}°C
              </div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Avg Humidity</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                {summary.average_humidity_percent}%
              </div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Peak 1-Hour Rain</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--green-400)", letterSpacing: "-0.02em" }}>
                {summary.peak_rainfall_last_hour_mm} mm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Pune Zone Cards Grid */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
          Pune Catchment Zones (Click to inspect):
        </div>

        <div className="grid-4">
          {summary.zones?.map((z) => {
            const meta = zones.find((item) => item.id === z.zone_id);
            const isSelected = z.zone_id === selectedZoneId;
            return (
              <div
                key={z.zone_id}
                onClick={() => handleSelectZone(z.zone_id!)}
                className="eco-card"
                style={{
                  cursor: "pointer",
                  border: isSelected ? "1px solid var(--green-400)" : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected ? "rgba(16, 185, 129, 0.12)" : "var(--bg-surface)",
                  boxShadow: isSelected ? "0 0 16px rgba(16, 185, 129, 0.2)" : "none",
                  padding: "16px",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    {meta?.name || z.zone_name}
                  </div>
                  <StatusBadge type="risk" value={meta?.risk_level || "Low"} size="sm" />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                      {z.temperature_c}°C
                    </span>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {z.weather_condition}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green-400)" }}>
                      {z.rainfall_last_hour_mm} <span style={{ fontSize: 11 }}>mm/h</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      Rainfall
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed View for Selected Zone */}
      {selectedWeather && selectedZoneMeta && (
        <div className="eco-card" style={{ marginTop: 8 }}>
          <div className="eco-card-header">
            <div>
              <div className="eco-card-title">
                <Compass size={18} color="var(--green-400)" />
                {selectedZoneMeta.display_name} Details
              </div>
              <div className="eco-card-subtitle">
                Latitude: {selectedWeather.lat}° N • Longitude: {selectedWeather.lon}° E • Elevation: {selectedZoneMeta.elevation_m}m
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Data Source:</span>
              <span style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "var(--green-400)",
                padding: "2px 10px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600
              }}>
                {selectedWeather.source}
              </span>
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom: 16 }}>
            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
                <Thermometer size={16} color="var(--green-400)" />
                <span>Ambient Air Temp</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {selectedWeather.temperature_c} °C
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Condition: {selectedWeather.weather_condition}</div>
            </div>

            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
                <Droplets size={16} color="var(--green-400)" />
                <span>Relative Humidity</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {selectedWeather.humidity_percent} %
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Pressure: {selectedWeather.pressure_hpa || 1010} hPa</div>
            </div>

            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
                <CloudRain size={16} color="var(--green-400)" />
                <span>Precipitation (Last 1 Hr)</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--green-400)", letterSpacing: "-0.01em" }}>
                {selectedWeather.rainfall_last_hour_mm} mm
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Recorded rainfall rate</div>
            </div>

            <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "16px", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
                <Wind size={16} color="var(--green-400)" />
                <span>Wind Speed</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {selectedWeather.wind_speed_kmh} km/h
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Surface wind flow</div>
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            background: "var(--bg-subtle)",
            borderRadius: 6,
            fontSize: 12
          }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Zone Description: {selectedZoneMeta.description}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              Synchronized: {selectedWeather.last_updated || "Live"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
