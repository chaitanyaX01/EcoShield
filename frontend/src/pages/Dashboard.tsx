import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CloudRain,
  Shield,
  Layers,
  Truck,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/common/StatusBadge";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getDashboardSummary();
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard telemetry.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="pulse-dot animated" style={{
            width: 14,
            height: 14,
            margin: "0 auto 10px",
            background: "var(--green-500)",
            boxShadow: "0 0 16px rgba(34,197,94,0.25)",
          }}></div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Synchronizing Pune Watershed Telemetry...
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="eco-card" style={{
        borderColor: "var(--risk-crit-border)",
        color: "var(--risk-crit-text)",
      }}>
        <div style={{ fontWeight: 600 }}>Error loading telemetry</div>
        <p style={{ fontSize: 12 }}>{error || "No data available"}</p>
      </div>
    );
  }

  const {
    district,
    highest_risk_zone,
    district_risk_level,
    active_alerts_count,
    open_incidents_count,
    resource_readiness,
    shelter_occupancy,
    weather_summary,
    recent_alerts,
    recent_incidents,
    activity_timeline,
    zones,
  } = data;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Page Title & Status Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--green-500)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            Operational Command
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            District Risk Overview
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Real-time flood intelligence across 8 Pune micro-catchments and river corridors.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link to="/admin/map" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
            <Compass size={14} color="var(--green-400)" />
            <span>Interactive Map</span>
          </Link>
          <Link to="/admin/prediction" className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <span>Flood Prediction</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Responsive Dashboard Container with mobile priority stacking */}
      <div className="dashboard-container" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* 4 Key Metric Cards */}
        <div className="grid-4">
          {/* Highest Risk Zone */}
          <div className="eco-card dashboard-order-risk" style={{ borderLeft: "3px solid var(--risk-crit-dot)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                Highest Risk Catchment
              </span>
              <AlertTriangle size={15} color="var(--risk-crit-dot)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {highest_risk_zone?.name || "Sinhagad Road"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <StatusBadge type="risk" value={highest_risk_zone?.risk_level || "Critical"} size="sm" />
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Elev: {highest_risk_zone?.elevation_m || 560}m
              </span>
            </div>
          </div>

          {/* Active Emergency Alerts */}
          <div className="eco-card dashboard-order-alerts-stat" style={{ borderLeft: "3px solid var(--risk-high-dot)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                Active Alerts
              </span>
              <Shield size={15} color="var(--risk-high-dot)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              {active_alerts_count}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Critical notifications requiring escalation
            </div>
          </div>

          {/* Peak Rain */}
          <div className="eco-card dashboard-order-weather-stat" style={{ borderLeft: "3px solid var(--green-500)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                Peak Precipitation
              </span>
              <CloudRain size={15} color="var(--green-500)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              {weather_summary?.peak_rainfall_last_hour_mm || 0}{" "}
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>mm/h</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--green-400)", fontWeight: 500 }}>
              {weather_summary?.source || "Google Weather live data"}
            </div>
          </div>

          {/* Resource Readiness */}
          <div className="eco-card dashboard-order-resources" style={{ borderLeft: "3px solid var(--green-400)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                Resource Standby
              </span>
              <Truck size={15} color="var(--green-400)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              {resource_readiness?.standby} / {resource_readiness?.total}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {resource_readiness?.readiness_percentage}% rapid deployment readiness
            </div>
          </div>
        </div>

        {/* Middle: Zone Overview Grid & Weather */}
        <div className="dashboard-middle-grid">
          {/* Monitored Catchments Table */}
          <div className="eco-card dashboard-order-catchments">
          <div className="eco-card-header">
            <div>
              <div className="eco-card-title">
                <Layers size={16} color="var(--green-500)" />
                8 Monitored Pune Catchment Basins
              </div>
              <div className="eco-card-subtitle">
                Hydrological vulnerability ratings and municipal drainage factors
              </div>
            </div>
            <Link to="/admin/weather" style={{ fontSize: 12, color: "var(--green-400)", fontWeight: 600 }}>
              Live Weather →
            </Link>
          </div>

          <div className="table-responsive-wrapper" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left", minWidth: 520 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-medium)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px 10px" }}>Catchment Zone</th>
                  <th style={{ padding: "10px 10px" }}>Risk State</th>
                  <th style={{ padding: "10px 10px" }}>Elevation</th>
                  <th style={{ padding: "10px 10px" }}>Drainage</th>
                  <th style={{ padding: "10px 10px" }}>History</th>
                </tr>
              </thead>
              <tbody>
                {zones?.map((z: any) => (
                  <tr key={z.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 10px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {z.name}
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{z.display_name}</div>
                    </td>
                    <td style={{ padding: "10px 10px" }}>
                      <StatusBadge type="risk" value={z.risk_level} size="sm" />
                    </td>
                    <td style={{ padding: "10px 10px", color: "var(--text-secondary)" }}>
                      {z.elevation_m}m
                    </td>
                    <td style={{ padding: "10px 10px", color: "var(--text-secondary)" }}>
                      {z.drainage_score}/100
                    </td>
                    <td style={{ padding: "10px 10px", color: "var(--text-muted)" }}>
                      {z.previous_floods} events
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weather & Citizen Reports */}
        <div className="dashboard-subcol" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Weather Card */}
          <div className="eco-card dashboard-order-weather-card">
            <div className="eco-card-header">
              <div className="eco-card-title">
                <CloudRain size={16} color="var(--green-500)" />
                District Meteorology
              </div>
              <span style={{ fontSize: 11, color: "var(--green-400)", fontWeight: 600 }}>
                {weather_summary?.source}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>
                  {weather_summary?.average_temperature_c}°C
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Avg Ambient Temperature
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--green-400)" }}>
                  {weather_summary?.average_humidity_percent}%
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Relative Humidity
                </div>
              </div>
            </div>

            <div style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
              <strong style={{ color: "var(--text-primary)" }}>Dam & Confluence Notice:</strong> High soil saturation along Mutha basin. Monitored Khadakwasla discharge is being observed closely.
            </div>
          </div>

          {/* Citizen Reports Preview */}
          <div className="eco-card dashboard-order-reports" style={{ flex: 1 }}>
            <div className="eco-card-header">
              <div className="eco-card-title">
                <AlertTriangle size={16} color="var(--risk-high-dot)" />
                Citizen Hazard Feed
              </div>
              <Link to="/admin/incidents" style={{ fontSize: 12, color: "var(--green-400)", fontWeight: 600 }}>
                View All ({open_incidents_count}) →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recent_incidents?.slice(0, 3).map((inc: any) => (
                <div
                  key={inc.id}
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12,
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {inc.title}
                    </span>
                    <StatusBadge type="severity" value={inc.severity} size="sm" />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {inc.zone_name || inc.zone_id} • Depth: {inc.water_depth_cm}cm • {inc.corroborations} confirmations
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Active Alerts & Activity Timeline */}
      <div className="dashboard-bottom-grid">
        {/* Active Alerts */}
        <div className="eco-card dashboard-order-alerts-list">
          <div className="eco-card-header">
            <div className="eco-card-title">
              <Shield size={16} color="var(--risk-crit-dot)" />
              Active Priority Alerts
            </div>
            <Link to="/admin/recommendations" style={{ fontSize: 12, color: "var(--green-400)", fontWeight: 600 }}>
              Directives →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent_alerts?.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                No active critical emergency alerts.
              </div>
            ) : (
              recent_alerts?.map((alt: any) => (
                <div
                  key={alt.id}
                  style={{
                    padding: "12px 14px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {alt.title}
                    </span>
                    <StatusBadge type="severity" value={alt.severity} size="sm" />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                    {alt.action}
                  </p>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    Source: {alt.source} • Zone: {alt.zone_name || alt.zone_id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="eco-card dashboard-order-timeline">
          <div className="eco-card-header">
            <div className="eco-card-title">
              <Clock size={16} color="var(--green-500)" />
              Command Center Activity Log
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Live Event Audit</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 280, overflowY: "auto" }}>
            {activity_timeline?.map((act: any) => (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  fontSize: 12,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div className="pulse-dot" style={{ marginTop: 6, background: "var(--green-500)" }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {act.action}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {act.actor}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                    {act.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
