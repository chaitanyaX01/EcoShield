import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CloudRain,
  Cpu,
  AlertTriangle,
  Navigation,
  Home,
  Truck,
  Lightbulb,
  BarChart2,
  Bot,
  Layers,
  Map,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const allNavItems = [
  { path: "/admin/dashboard", label: "Risk Overview", icon: LayoutDashboard, roles: ["admin", "sysadmin"] },
  { path: "/admin/weather", label: "Weather", icon: CloudRain, roles: ["admin", "sysadmin"] },
  { path: "/admin/prediction", label: "Flood Prediction", icon: Cpu, roles: ["admin", "sysadmin"] },
  { path: "/admin/incidents", label: "Incidents", icon: AlertTriangle, roles: ["admin", "sysadmin", "responder"] },
  { path: "/admin/map", label: "Risk Map", icon: Map, roles: ["admin", "sysadmin", "responder", "resourcer"] },
  { path: "/admin/routes", label: "Safe Routes", icon: Navigation, roles: ["admin", "sysadmin", "responder", "resourcer"] },
  { path: "/admin/shelters", label: "Shelters", icon: Home, roles: ["admin", "sysadmin", "responder", "resourcer"] },
  { path: "/admin/resources", label: "Resources", icon: Truck, roles: ["admin", "sysadmin", "resourcer"] },
  { path: "/admin/recommendations", label: "Recommendations", icon: Lightbulb, roles: ["admin", "sysadmin"] },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart2, roles: ["admin", "sysadmin"] },
  { path: "/admin/assistant", label: "AI Assistant", icon: Bot, roles: ["admin", "sysadmin", "responder", "resourcer"] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userRole = user?.role || "admin";

  // Role-specific navigation:
  // - Field Response Unit (responder): Incidents, Risk Map, Safe Routes, Shelters, AI Assistant
  // - Equipment Resourcer (resourcer): Resources, Risk Map, Safe Routes, Shelters, AI Assistant (NO Incidents)
  // - Duty Officer / Admin (admin, sysadmin): All Command Modules
  const visibleNavItems = allNavItems.filter((item) => {
    if (userRole === "responder") {
      return ["/admin/incidents", "/admin/map", "/admin/routes", "/admin/shelters", "/admin/assistant"].includes(item.path);
    }
    if (userRole === "resourcer") {
      return ["/admin/resources", "/admin/map", "/admin/routes", "/admin/shelters", "/admin/assistant"].includes(item.path);
    }
    return item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`sidebar-nav ${isOpen ? "open" : ""}`}>
        {/* Section Label & Close Button */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px 14px 8px",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 10,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: userRole === "responder" ? "#fbbf24" : userRole === "resourcer" ? "#38bdf8" : "var(--green-400)",
            textTransform: "uppercase" as const,
          }}>
            <span
              className="pulse-badge-dot"
              style={{
                background: userRole === "responder" ? "#f59e0b" : userRole === "resourcer" ? "#06b6d4" : "var(--green-500)",
                width: 6,
                height: 6,
              }}
            />
            <span>
              {userRole === "responder" ? "Field Response Unit" : userRole === "resourcer" ? "Resourcer Operations" : "Admin Command"}
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="show-on-tablet show-on-mobile"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                color: "var(--text-muted)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
              }}
              title="Close Navigation Drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>

      {/* Navigation Links */}
      <nav style={{ display: "flex", flexDirection: "column" as const, gap: 2, flex: 1 }}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 14px",
                borderRadius: "10px",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--lime-400)" : "rgba(255, 255, 255, 0.82)",
                backgroundColor: isActive ? "rgba(187, 244, 81, 0.16)" : "transparent",
                border: isActive ? "1px solid rgba(187, 244, 81, 0.35)" : "1px solid transparent",
                boxShadow: isActive ? "0 2px 10px rgba(0, 0, 0, 0.2)" : "none",
                transition: "all 0.18s ease",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? "var(--lime-400)" : "currentColor"} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div
        style={{
          marginTop: "auto",
          padding: "14px",
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>
            District Status
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--lime-400)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.04em",
          }}>
            Operational
          </span>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#ffffff",
          fontWeight: 600,
        }}>
          <Layers size={14} color="var(--lime-500)" />
          <span>8 Monitored Catchments</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.55)", marginTop: 4 }}>
          Mutha, Mula & Katraj Basins
        </div>
      </div>
    </aside>
  </>
);
};
