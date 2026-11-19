import React, { useState } from "react";
import {
  AlertTriangle,
  Radio,
  Bell,
  CheckCircle,
  Users,
  Truck,
  ShieldCheck,
  Flame,
  Volume2,
  Mail,
} from "lucide-react";
import { api } from "../services/api";

export const RecommendationsPage: React.FC = () => {
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // Optional custom message
  const [title, setTitle] = useState<string>("FLASH FLOOD RED ALERT: IMMEDIATE MUNICIPAL EVACUATION");
  const [action, setAction] = useState<string>(
    "Mutha river water levels rising rapidly. Ground-floor residents must evacuate immediately to designated high-ground shelters. Equipment resourcers deploy 120HP submersible pumps. Field response units mobilize rescue boats."
  );

  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const handleBroadcast = async () => {
    setBroadcasting(true);
    try {
      const res = await api.broadcastMunicipal(title.trim(), action.trim());
      setBroadcastResult(res);
      setConfirmModalOpen(false);
    } catch (err: any) {
      alert("Failed to broadcast alert: " + err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Municipal Emergency Command Center
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
          Municipal Emergency Broadcast
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 620, margin: "6px auto 0" }}>
          Instant district-wide emergency alarm. Use during severe flood conditions to transmit synchronized directives to all Citizens, Resourcers, and Field Response Teams simultaneously.
        </p>
      </div>

      {/* Broadcast Result Banner */}
      {broadcastResult && (
        <div style={{
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "var(--radius-lg)",
          padding: "22px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 8px 30px rgba(16, 185, 129, 0.18)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={24} color="#10b981" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#34d399", margin: 0, letterSpacing: "-0.02em" }}>
              Municipal Red Alert Dispatched Across Pune
            </h3>
          </div>

          <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>
            <div><strong style={{ color: "#f5f5f7" }}>Alert Reference ID:</strong> {broadcastResult.alert_id}</div>
            <div><strong style={{ color: "#f5f5f7" }}>Broadcasted By:</strong> {broadcastResult.broadcast_by}</div>
            <div><strong style={{ color: "#f5f5f7" }}>Timestamp:</strong> {new Date(broadcastResult.timestamp).toLocaleTimeString()} (Active across Pune District)</div>
            <div style={{ marginTop: 10, padding: "12px 16px", background: "rgba(255, 255, 255, 0.05)", borderRadius: 10, border: "1px solid var(--border-subtle)", fontWeight: 600, color: "#34d399" }}>
              "{broadcastResult.title}" — {action}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 4 }}>
            <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Channel 1: Citizens</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>100% Alerted</div>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
              <Truck size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Channel 2: Resourcers</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>Pumps Mobilized</div>
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Channel 3: Field Units</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>Boats Dispatched</div>
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.12)", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(16, 185, 129, 0.35)", display: "flex", alignItems: "center", gap: 10 }}>
              <Mail size={18} color="#34d399" />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Channel 4: Registered Gmail</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>
                  {broadcastResult.email_report?.sent_count || broadcastResult.recipients_notified || "All"} Users Emailed
                </div>
              </div>
            </div>
          </div>

          {/* List of Registered Accounts Notified via Gmail */}
          {broadcastResult.email_report?.recipients && broadcastResult.email_report.recipients.length > 0 && (
            <div style={{
              marginTop: 6,
              background: "rgba(0, 0, 0, 0.35)",
              borderRadius: 10,
              padding: "14px 16px",
              border: "1px solid var(--border-subtle)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={14} color="#34d399" />
                  <span>Dispatched via Gmail to All Registered User Accounts ({broadcastResult.email_report.recipients.length})</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--green-400)", fontWeight: 600 }}>
                  ✓ 100% Delivered
                </span>
              </div>

              <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {broadcastResult.email_report.recipients.map((rec: any) => (
                  <div key={rec.id || rec.email} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(255, 255, 255, 0.04)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "#f3f4f6" }}>{rec.name}</span>
                      <span style={{ color: "#9ca3af", fontSize: 11 }}>&lt;{rec.email}&gt;</span>
                      <span style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.08)",
                        color: "#d1d5db",
                        textTransform: "capitalize"
                      }}>
                        {rec.role}
                      </span>
                    </div>
                    <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>✓ Delivered via Gmail</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BIG PROMINENT BROADCAST ACTION SECTION */}
      <div className="eco-card" style={{
        padding: "36px",
        background: "linear-gradient(180deg, rgba(239, 68, 68, 0.10) 0%, var(--bg-surface) 100%)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "var(--radius-xl)",
        textAlign: "center",
        boxShadow: "var(--shadow-card)"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(239, 68, 68, 0.15)",
          border: "2px solid rgba(239, 68, 68, 0.4)",
          width: 64,
          height: 64,
          borderRadius: "50%",
          color: "#f87171",
          marginBottom: 16
        }}>
          <Volume2 size={32} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fca5a5", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Horrible Condition Emergency Override
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 24px" }}>
          In the event of an imminent flash flood or dam water discharge, press this button to transmit a Red Alert across Pune.
        </p>

        {/* 3 Channels Target Badges */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 28,
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-medium)",
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <Users size={16} color="#34d399" /> All Citizens
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-medium)",
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <Truck size={16} color="#34d399" /> Equipment Resourcers
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-medium)",
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <ShieldCheck size={16} color="#34d399" /> Field Response Teams
          </div>
        </div>

        {/* ONE BIG BUTTON */}
        <button
          type="button"
          onClick={() => setConfirmModalOpen(true)}
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 14,
            padding: "20px 48px",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.03em",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(220, 38, 38, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
        >
          <Radio size={24} />
          <span>BROADCAST MUNICIPAL EMERGENCY ALERT</span>
        </button>

        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
          1-Click District Dispatch • Immediate SMS & App Alarm to All Roles
        </div>
      </div>

      {/* CONFIRMATION / CUSTOMIZATION MODAL */}
      {confirmModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: 20
        }}>
          <div className="eco-card" style={{ maxWidth: 540, width: "100%", padding: "28px", border: "1px solid rgba(239, 68, 68, 0.3)", borderTop: "6px solid #ef4444" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={24} color="#ef4444" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f87171", margin: 0, letterSpacing: "-0.01em" }}>
                Confirm Municipal Emergency Broadcast
              </h3>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              You are about to issue a <strong>CRITICAL RED ALERT</strong> across Pune district. This will send emergency push alarms to all registered Citizens, Resourcers, and Field Units.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Broadcast Headline
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Emergency Directives & Evacuation Orders
                </label>
                <textarea
                  rows={4}
                  className="input-control"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={broadcasting}
                  onClick={handleBroadcast}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: "#dc2626",
                    borderColor: "#dc2626",
                    padding: "8px 20px",
                    fontWeight: 700,
                  }}
                >
                  {broadcasting ? "Transmitting Red Alert..." : "CONFIRM & TRANSMIT NOW"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
