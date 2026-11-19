import React, { useEffect, useState } from "react";
import {
  BarChart2,
  PieChart,
  TrendingUp,
  Cpu,
  Layers,
  Shield,
  Truck,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { api } from "../services/api";

const RISK_COLORS: Record<string, string> = {
  Low: "#10b981",
  Moderate: "#eab308",
  High: "#f97316",
  Critical: "#ef4444",
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalyticsSummary();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="pulse-dot animated" style={{ width: 14, height: 14, margin: "0 auto 8px", background: "var(--teal-600)" }}></div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Compiling Command Center Analytics Telemetry...</div>
        </div>
      </div>
    );
  }

  const {
    zone_risk_bars,
    risk_distribution,
    incident_category_chart,
    incident_status_chart,
    alert_severity_chart,
    resource_status_chart,
    weather_trend,
    ml_benchmark,
  } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Intelligence & Historical Metrics
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
          Watershed Analytics & Model Evaluation
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Multi-dimensional charts tracking zone risk ratings, incident categories, resource allocations, and machine learning F1 benchmarks.
        </p>
      </div>

      {/* Grid Row 1: Zone Risk & Weather Trend */}
      <div className="analytics-grid-2">
        {/* Chart 1: Catchment Elevation & Drainage Scores */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <div className="eco-card-title">
                <BarChart2 size={16} color="var(--teal-700)" />
                Zone Drainage Capacity & Flood History
              </div>
              <div className="eco-card-subtitle">
                Drainage score vs historical recorded flood events across 8 Pune basins
              </div>
            </div>
          </div>

          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zone_risk_bars} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.07)" />
                <XAxis dataKey="zone" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={0} angle={-25} textAnchor="end" stroke="rgba(255, 255, 255, 0.15)" />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="rgba(255, 255, 255, 0.15)" />
                <Tooltip
                  contentStyle={{ background: "rgba(12, 14, 18, 0.95)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)", boxShadow: "var(--shadow-card)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="drainage_score" name="Drainage Capacity (0-100)" fill="var(--green-500)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous_floods" name="Recorded Flood Events" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Live Zone Weather Telemetry */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <div className="eco-card-title">
                <TrendingUp size={16} color="var(--green-400)" />
                Live Catchment Precipitation & Moisture (Google Weather)
              </div>
              <div className="eco-card-subtitle">
                Real-time micro-climate observations across all 8 Pune catchments
              </div>
            </div>
          </div>

          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weather_trend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.07)" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="rgba(255, 255, 255, 0.15)" />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="rgba(255, 255, 255, 0.15)" />
                <Tooltip
                  contentStyle={{ background: "rgba(12, 14, 18, 0.95)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)", boxShadow: "var(--shadow-card)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="rainfall_mm" name="Rainfall (mm/h)" stroke="var(--green-400)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="humidity_pct" name="Humidity (%)" stroke="#38bdf8" strokeWidth={1.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Incident Categories & Resource Readiness */}
      <div className="analytics-grid-3">
        {/* Incident Categories */}
        <div className="eco-card">
          <div className="eco-card-title" style={{ marginBottom: 12, fontSize: 14 }}>
            <AlertTriangle size={15} color="var(--teal-700)" />
            Incident Hazard Types
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {incident_category_chart?.map((cat: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, background: "var(--bg-subtle)", padding: "8px 10px", borderRadius: 6 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{cat.name}</span>
                <span style={{ fontWeight: 700, color: "var(--teal-800)" }}>{cat.count} Reports</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Allocation */}
        <div className="eco-card">
          <div className="eco-card-title" style={{ marginBottom: 12, fontSize: 14 }}>
            <Truck size={15} color="var(--teal-700)" />
            Resource Mobilization
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {resource_status_chart?.map((st: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, background: "var(--bg-subtle)", padding: "8px 10px", borderRadius: 6 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{st.status}</span>
                <span style={{ fontWeight: 700, color: st.status === "Deployed" ? "var(--teal-800)" : "#10b981" }}>
                  {st.count} Units
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Status Flow */}
        <div className="eco-card">
          <div className="eco-card-title" style={{ marginBottom: 12, fontSize: 14 }}>
            <Layers size={15} color="var(--teal-700)" />
            Report Verification Status
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {incident_status_chart?.map((st: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, background: "var(--bg-subtle)", padding: "8px 10px", borderRadius: 6 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{st.status}</span>
                <span style={{ fontWeight: 700, color: "var(--teal-800)" }}>{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Benchmark & Preserved F1 Score Chart Section */}
      <div className="eco-card" style={{ borderLeft: "4px solid var(--green-500)" }}>
        <div className="eco-card-header">
          <div>
            <div className="eco-card-title">
              <Cpu size={18} color="var(--green-400)" />
              Machine Learning Model Benchmark & Evaluation
            </div>
            <div className="eco-card-subtitle">
              Extra Trees Classifier achieves the highest F1 performance (~0.892) across evaluated classifiers
            </div>
          </div>
          <span style={{
            background: "rgba(16, 185, 129, 0.15)",
            color: "var(--green-400)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "4px 12px",
            borderRadius: 9999,
            fontWeight: 700,
            fontSize: 12
          }}>
            Extra Trees F1: 0.892 (Best)
          </span>
        </div>

        <div style={{
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          color: "#fbbf24",
          padding: "12px 16px",
          borderRadius: "var(--radius-sm)",
          fontSize: 12,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <Info size={16} color="#fbbf24" />
          <span>
            {ml_benchmark?.disclaimer || "Evaluated on Pune watershed hydrology metrics with live Google Weather telemetry integration."}
          </span>
        </div>

        <div className="analytics-benchmark-grid">
          {/* F1 Comparison Chart PNG Image */}
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "14px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.04em" }}>
              Preserved Model Evaluation Benchmark
            </div>
            <img
              src="/api/analytics/f1-chart"
              alt="EcoShield AI Model F1 Benchmark"
              style={{
                maxWidth: "100%",
                height: "auto",
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid var(--border-subtle)"
              }}
            />
          </div>

          {/* Model Comparison Table */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.01em" }}>
              Evaluated Algorithms Performance Matrix
            </div>
            <div className="table-responsive-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left", minWidth: 460 }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "10px 12px" }}>Algorithm</th>
                  <th style={{ padding: "10px 12px" }}>F1 Score</th>
                  <th style={{ padding: "10px 12px" }}>Accuracy</th>
                  <th style={{ padding: "10px 12px" }}>Deployment Status</th>
                </tr>
              </thead>
              <tbody>
                {ml_benchmark?.comparison?.map((m: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: m.is_active ? "rgba(16, 185, 129, 0.10)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: m.is_active ? 700 : 500, color: "var(--text-primary)" }}>
                      {m.model}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: m.is_active ? "var(--green-400)" : "var(--text-secondary)" }}>
                      {m.f1_score}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
                      {m.accuracy}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {m.is_active ? (
                        <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "var(--green-400)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "2px 8px", borderRadius: 9999, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                          Active Production
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Benchmark</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
