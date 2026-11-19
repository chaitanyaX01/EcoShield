import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, LogOut, Menu, Radio, Truck, UserCheck, LucideIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

interface PortalMeta {
  portalClass: string;
  portalTitle: string;
  portalShort: string;
  roleLabel: string;
  color: string;
  dotColor: string;
  icon: LucideIcon;
  headerTag: string;
}

const getPortalMeta = (role?: string): PortalMeta => {
  switch (role) {
    case "responder":
      return {
        portalClass: "portal-responder",
        portalTitle: "Field Response Unit Portal",
        portalShort: "Field Unit",
        roleLabel: "Field Response Officer",
        color: "#fbbf24",
        dotColor: "#f59e0b",
        icon: Radio,
        headerTag: "Field Unit",
      };
    case "resourcer":
      return {
        portalClass: "portal-resourcer",
        portalTitle: "Resourcer Operations Portal",
        portalShort: "Resourcer",
        roleLabel: "Logistics & Resource Officer",
        color: "#38bdf8",
        dotColor: "#06b6d4",
        icon: Truck,
        headerTag: "Resourcer",
      };
    case "citizen":
      return {
        portalClass: "portal-citizen",
        portalTitle: "Citizen Safety Portal",
        portalShort: "Citizen",
        roleLabel: "Verified Resident",
        color: "#34d399",
        dotColor: "#10b981",
        icon: UserCheck,
        headerTag: "Citizen",
      };
    case "admin":
    case "sysadmin":
    default:
      return {
        portalClass: "portal-admin",
        portalTitle: "Admin Command Portal",
        portalShort: "Admin Portal",
        roleLabel: "Disaster Duty Officer",
        color: "#34d399",
        dotColor: "#10b981",
        icon: Shield,
        headerTag: "Command",
      };
  }
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const portalMeta = getPortalMeta(user?.role);
  const PortalIcon = portalMeta.icon;

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const homePath = !isAdmin
    ? "/citizen"
    : user?.role === "responder"
      ? "/admin/incidents"
      : user?.role === "resourcer"
        ? "/admin/resources"
        : "/admin/dashboard";

  return (
    <header className="top-header">
      {/* LEFT SECTION: Hamburger Toggle + EcoShield Brand Mark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flexShrink: 1 }}>
        {isAdmin && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 44,
              minHeight: 44,
              padding: 10,
              color: "var(--text-primary)",
              borderRadius: "var(--radius-sm)",
              transition: "all 0.2s",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <Link to={homePath} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, textDecoration: "none" }}>
          {/* Logo Mark */}
          <div style={{
            background: "var(--lime-500)",
            padding: 7,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--forest-950)",
            boxShadow: "0 2px 8px rgba(187, 244, 81, 0.35)",
            flexShrink: 0,
          }}>
            <Shield size={18} strokeWidth={2.4} />
          </div>

          {/* Brand Name */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
              <span
                className="hide-on-mobile"
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "#ffffff",
                  fontFamily: "var(--font-display)",
                  whiteSpace: "nowrap",
                }}
              >
                EcoShield <span style={{ color: "var(--lime-400)" }}>AI</span>
              </span>
              <span
                className="hide-on-desktop hide-on-tablet"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                  fontFamily: "var(--font-display)",
                  whiteSpace: "nowrap",
                }}
              >
                Eco<span style={{ color: "var(--lime-400)" }}>Shield</span>
              </span>
              <span
                className="hide-on-mobile"
                style={{
                  background: "rgba(187, 244, 81, 0.16)",
                  border: "1px solid rgba(187, 244, 81, 0.35)",
                  color: "var(--lime-400)",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "var(--radius-full)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  whiteSpace: "nowrap",
                }}
              >
                {portalMeta.headerTag}
              </span>
            </div>
            <div
              className="hide-on-mobile"
              style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.65)", letterSpacing: "0.01em", whiteSpace: "nowrap" }}
            >
              Pune Metropolitan
            </div>
          </div>
        </Link>
      </div>

      {/* RIGHT TOP CORNER: Live Status, Portal Preview & Prominent Active Portal Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Live Monitoring Pill (Desktop/Tablet) */}
        <div
          className="hide-on-mobile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--risk-low-bg)",
            border: "1px solid var(--risk-low-border)",
            padding: "5px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--risk-low-text)",
          }}
        >
          <span className="pulse-dot animated" style={{ background: "var(--green-400)" }}></span>
          <span>Live</span>
        </div>

        {/* Public Citizen Portal Switch Link (if authority/admin) */}
        {isAdmin ? (
          <Link
            to="/citizen"
            className="btn btn-secondary btn-sm hide-on-mobile"
            style={{ fontSize: 11, padding: "5px 10px", minHeight: 34, borderRadius: 8 }}
            title="Preview Public Citizen Portal"
          >
            Citizen View
          </Link>
        ) : user?.role && user.role !== "citizen" ? (
          <Link
            to={user?.role === "resourcer" ? "/admin/resources" : user?.role === "responder" ? "/admin/incidents" : "/admin/dashboard"}
            className="btn btn-primary btn-sm hide-on-mobile"
            style={{ fontSize: 11, padding: "5px 10px", minHeight: 34, borderRadius: 8 }}
            title={`Return to ${portalMeta.portalTitle}`}
          >
            {portalMeta.portalShort}
          </Link>
        ) : null}

        {/* PROMINENT TOP-RIGHT ACTIVE PORTAL IDENTITY */}
        {isAuthenticated && user ? (
          <div
            className={`top-portal-identity ${portalMeta.portalClass}`}
            title={`You are currently signed into ${portalMeta.portalTitle} as ${user.name}`}
          >
            {/* Themed Portal Icon Box */}
            <div className="top-portal-icon-box">
              <PortalIcon size={15} />
            </div>

            {/* Portal & User Information */}
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.25 }}>
              {/* Top line: Active Portal Title & Pulsing Status Dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="hide-on-mobile"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    color: portalMeta.color,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {portalMeta.portalTitle}
                </span>
                <span
                  className="hide-on-desktop hide-on-tablet"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    color: portalMeta.color,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {portalMeta.portalShort}
                </span>
                <span
                  className="pulse-badge-dot"
                  style={{ background: portalMeta.dotColor }}
                  title="Active Session"
                />
              </div>

              {/* Bottom line: User Name & Duty Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>
                  Signed in:
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name}
                </span>
                <span
                  className="hide-on-mobile"
                  style={{ fontSize: 9.5, color: "var(--text-muted)", marginLeft: 2 }}
                >
                  • {user.title || portalMeta.roleLabel}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                marginLeft: 2,
                padding: 0,
                color: "var(--text-muted)",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                transition: "all 0.2s",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title={`Sign out from ${portalMeta.portalTitle}`}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
