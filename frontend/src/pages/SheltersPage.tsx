import React, { useEffect, useState } from "react";
import {
  Home,
  Phone,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { api } from "../services/api";
import { Shelter, Zone } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";

export const SheltersPage: React.FC = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filterZone, setFilterZone] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [sList, zList] = await Promise.all([
          api.getShelters(filterZone !== "all" ? filterZone : undefined),
          api.getZones(),
        ]);
        setShelters(sList);
        setZones(zList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterZone]);

  const totalCap = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalOcc = shelters.reduce((acc, s) => acc + s.occupancy, 0);
  const totalAvail = totalCap - totalOcc;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Civil Protection
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>
            Emergency Relief Shelters
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 4 }}>
            Verified safe municipal shelters and relief halls across Pune.
          </p>
        </div>

        {/* Global Capacity Summary */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          padding: "16px 24px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          gap: 24,
          boxShadow: "var(--shadow-card)",
          backdropFilter: "blur(20px)",
        }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Total Capacity</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {totalCap} beds
            </div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Available Beds</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--green-400)", letterSpacing: "-0.02em" }}>
              {totalAvail} beds
            </div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Current Occupancy</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--green-300)", letterSpacing: "-0.02em" }}>
              {totalOcc} ({Math.round((totalOcc * 100) / Math.max(totalCap, 1))}%)
            </div>
          </div>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="eco-card" style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
            Select Catchment Zone:
          </span>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="select-control"
            style={{ width: 260, fontSize: 14 }}
          >
            <option value="all">All 8 Pune Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simplified Shelters Grid with larger text */}
      <div className="grid-2">
        {shelters.map((s) => {
          const occPct = Math.round((s.occupancy / Math.max(s.capacity, 1)) * 100);
          const availableBeds = s.capacity - s.occupancy;

          return (
            <div
              key={s.id}
              className="eco-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Title & Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
                    {s.name}
                  </h3>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    Location: <strong>{s.zone_name || s.zone_id}</strong>
                  </div>
                </div>
                <StatusBadge type="resource" value={s.status} size="md" />
              </div>

              {/* Beds Available Highlight */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)"
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Available Spaces</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--green-400)" }}>
                    {availableBeds} <span style={{ fontSize: 14, fontWeight: 600 }}>beds free</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Occupancy Rate</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: occPct > 80 ? "var(--risk-crit-dot)" : "var(--green-300)" }}>
                    {s.occupancy} / {s.capacity} ({occPct}%)
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ height: 8, background: "rgba(255, 255, 255, 0.08)", borderRadius: 9999, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${occPct}%`,
                      background: occPct > 80 ? "var(--risk-crit-dot)" : "var(--green-500)",
                      borderRadius: 9999,
                      transition: "width 0.4s ease",
                    }}
                  ></div>
                </div>
              </div>

              {/* Key Features */}
              <div style={{ display: "flex", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
                <span style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: "4px 10px", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)" }}>
                  Flood Exposure: <strong>{s.flood_exposure}</strong>
                </span>
                {s.medical_support === 1 && (
                  <span style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--green-400)", padding: "4px 10px", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                    ✓ 24/7 Medical Care
                  </span>
                )}
                {s.accessible === 1 && (
                  <span style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>
                    ✓ Wheelchair Accessible
                  </span>
                )}
              </div>

              {/* Contact Helpline */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: 14,
                fontSize: 14,
              }}>
                <a
                  href={`tel:${s.contact}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green-400)", fontWeight: 700, textDecoration: "none" }}
                >
                  <Phone size={16} />
                  <span>{s.contact}</span>
                </a>

                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  24/7 Emergency Line
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
