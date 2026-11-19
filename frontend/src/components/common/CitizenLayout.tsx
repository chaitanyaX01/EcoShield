import React, { useState } from "react";
import { Outlet, NavLink, Link, useNavigate, Navigate } from "react-router-dom";
import {
  Shield,
  ClipboardList,
  Map,
  Navigation,
  Home,
  Bot,
  LogOut,
  PhoneCall,
  UserCheck,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Radio,
  Truck,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";

const getCitizenMeta = (role?: string) => {
  switch (role) {
    case "responder":
      return {
        portalClass: "portal-responder",
        portalTitle: "Field Response Unit (Staff View)",
        portalShort: "Field Unit",
        roleLabel: "Field Response Officer",
        color: "#fbbf24",
        dotColor: "#f59e0b",
        icon: Radio,
        returnPath: "/admin/incidents",
      };
    case "resourcer":
      return {
        portalClass: "portal-resourcer",
        portalTitle: "Resourcer Operations (Staff View)",
        portalShort: "Resourcer",
        roleLabel: "Logistics & Resource Officer",
        color: "#38bdf8",
        dotColor: "#06b6d4",
        icon: Truck,
        returnPath: "/admin/resources",
      };
    case "admin":
    case "sysadmin":
      return {
        portalClass: "portal-admin",
        portalTitle: "Admin Command (Staff View)",
        portalShort: "Admin",
        roleLabel: "Disaster Duty Officer",
        color: "#34d399",
        dotColor: "#10b981",
        icon: Shield,
        returnPath: "/admin/dashboard",
      };
    case "citizen":
    default:
      return {
        portalClass: "portal-citizen",
        portalTitle: "Citizen Safety Portal",
        portalShort: "Citizen",
        roleLabel: "Verified Resident",
        color: "#34d399",
        dotColor: "#10b981",
        icon: UserCheck,
        returnPath: "/citizen",
      };
  }
};

export const CitizenLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isStaffRole = user?.role && ["admin", "sysadmin", "responder", "resourcer"].includes(user.role);
  const citizenMeta = getCitizenMeta(user?.role);
  const CitizenIcon = citizenMeta.icon;

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-app)",
        color: "#ffffff"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="pulse-dot animated" style={{
            width: 16,
            height: 16,
            margin: "0 auto 12px",
            background: "var(--green-500)",
            boxShadow: "0 0 16px rgba(34, 197, 94, 0.3)"
          }} />
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Loading EcoShield Citizen Portal...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const citizenNavItems = [
    { path: "/citizen", label: "Report & Risk", icon: ClipboardList, end: true },
    { path: "/citizen/map", label: "Risk Map", icon: Map },
    { path: "/citizen/routes", label: "Safe Routes", icon: Navigation },
    { path: "/citizen/shelters", label: "Shelters", icon: Home },
    { path: "/citizen/assistant", label: "AI Assistance", icon: Bot },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-app)" }}>
      {/* CITIZEN TOP HEADER (Forest Green & Fresh Lime) */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "var(--forest-900)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "0 20px",
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          {/* Brand Logo */}
          <Link to="/citizen" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", minWidth: 0, flexShrink: 1 }}>
            <div style={{
              background: "var(--lime-500)",
              padding: 7,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--forest-950)",
              boxShadow: "0 2px 10px rgba(187, 244, 81, 0.35)",
              flexShrink: 0,
            }}>
              <Shield size={19} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", whiteSpace: "nowrap", fontFamily: "var(--font-display)" }}>
                  EcoShield <span style={{ color: "var(--lime-400)" }}>AI</span>
                </span>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "1px 7px",
                  borderRadius: 9999,
                  background: "rgba(187, 244, 81, 0.16)",
                  color: "var(--lime-400)",
                  border: "1px solid rgba(187, 244, 81, 0.35)",
                  letterSpacing: "0.04em",
                }}>
                  Citizen
                </span>
              </div>
              <div className="hide-on-mobile" style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.65)", letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                Pune Metropolitan Disaster Services
              </div>
            </div>
          </Link>

          {/* DESKTOP MENU BAR */}
          <nav className="hide-on-mobile" style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0, 0, 0, 0.25)",
            padding: "5px 8px",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.10)",
          }}>
            {citizenNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--lime-400)" : "rgba(255, 255, 255, 0.82)",
                    backgroundColor: isActive ? "rgba(187, 244, 81, 0.16)" : "transparent",
                    border: isActive ? "1px solid rgba(187, 244, 81, 0.35)" : "1px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.18s ease",
                  })}
                >
                  <Icon size={14} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Quick 112 Help Pill */}
            <a
              href="tel:112"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: 11,
                padding: "6px 10px",
                color: "#f87171",
                background: "rgba(239, 68, 68, 0.10)",
                borderColor: "rgba(239, 68, 68, 0.3)",
                gap: 5,
                borderRadius: 9999,
                minHeight: 36,
              }}
              title="Emergency Helpline: Call 112"
            >
              <PhoneCall size={12} />
              <span className="hide-on-mobile">112 Helpline</span>
              <span className="hide-on-desktop">112</span>
            </a>

            {/* Staff Switch */}
            {isStaffRole && (
              <Link
                to={citizenMeta.returnPath}
                className="btn btn-secondary btn-sm hide-on-mobile"
                style={{ fontSize: 11, padding: "5px 12px", borderRadius: 9999, minHeight: 36 }}
                title={`Return to ${citizenMeta.portalTitle}`}
              >
                Return to {citizenMeta.portalShort}
              </Link>
            )}

            {/* Desktop Active Portal Badge & User Profile */}
            <div
              className={`top-portal-identity ${citizenMeta.portalClass} hide-on-mobile`}
              title={`You are currently signed into ${citizenMeta.portalTitle} as ${user?.name}`}
            >
              <div className="top-portal-icon-box">
                <CitizenIcon size={15} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.25 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      color: citizenMeta.color,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {citizenMeta.portalTitle}
                  </span>
                  <span
                    className="pulse-badge-dot"
                    style={{ background: citizenMeta.dotColor }}
                    title="Active Session"
                  />
                </div>

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
                    {user?.name || "Citizen User"}
                  </span>
                  <span style={{ fontSize: 9.5, color: "var(--text-muted)", marginLeft: 2 }}>
                    • {citizenMeta.roleLabel}
                  </span>
                </div>
              </div>

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
                title={`Sign out from ${citizenMeta.portalTitle}`}
              >
                <LogOut size={13} />
              </button>
            </div>

            {/* Mobile Active Portal Pill */}
            <div
              className={`top-portal-identity ${citizenMeta.portalClass} hide-on-desktop`}
              style={{ padding: "4px 8px" }}
              title={`Signed into ${citizenMeta.portalTitle} as ${user?.name}`}
            >
              <div className="top-portal-icon-box" style={{ width: 22, height: 22 }}>
                <CitizenIcon size={12} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: citizenMeta.color, textTransform: "uppercase" }}>
                {citizenMeta.portalShort}
              </span>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="hide-on-desktop"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 44,
                minHeight: 44,
                padding: 10,
                color: "var(--text-primary)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                cursor: "pointer",
              }}
              title="Toggle Citizen Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Module Switcher (Touch scrollable pill strip) */}
        <div className="hide-on-desktop" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.10)", padding: "6px 0" }}>
          <div className="citizen-nav-scroll">
            {citizenNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className="citizen-nav-pill"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--lime-400)" : "rgba(255, 255, 255, 0.8)",
                    backgroundColor: isActive ? "rgba(187, 244, 81, 0.18)" : "rgba(255, 255, 255, 0.05)",
                    border: isActive ? "1px solid rgba(187, 244, 81, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                    fontWeight: isActive ? 700 : 500,
                  })}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <>
          <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(320px, 86vw)",
              background: "var(--forest-950)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.14)",
              padding: "20px 18px",
              zIndex: 1250,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "-8px 0 32px rgba(6, 26, 16, 0.8)",
              animation: "apple-fade-up 0.25s var(--ease-spring) both",
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.12)", paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div className="top-portal-icon-box" style={{ background: "rgba(187, 244, 81, 0.16)", color: "var(--lime-400)" }}>
                  <CitizenIcon size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: citizenMeta.color, textTransform: "uppercase" }}>
                      {citizenMeta.portalShort}
                    </span>
                    <span className="pulse-badge-dot" style={{ background: citizenMeta.dotColor }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user?.name || "Citizen User"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                    {citizenMeta.roleLabel}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-subtle)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em", padding: "4px 8px" }}>
                Citizen Emergency Services
              </div>
              {citizenNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#34d399" : "var(--text-primary)",
                      backgroundColor: isActive ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.03)",
                      border: isActive ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--border-subtle)",
                      textDecoration: "none",
                      minHeight: 46,
                    })}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={18} color="var(--green-400)" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </NavLink>
                );
              })}

              {isStaffRole && (
                <Link
                  to={user?.role === "responder" ? "/admin/incidents" : user?.role === "resourcer" ? "/admin/resources" : "/admin/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    textDecoration: "none",
                    minHeight: 46,
                    marginTop: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Shield size={18} color="#60a5fa" />
                    <span>Command Center</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </Link>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
              <a
                href="tel:112"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#f87171",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  minHeight: 44,
                }}
              >
                <PhoneCall size={16} />
                <span>Call 112 Disaster Helpline</span>
              </a>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-secondary"
                style={{
                  width: "100%",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Workspace */}
      <main style={{ flex: 1, padding: "16px 14px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
          <ErrorBoundary fallbackTitle="Citizen View Error">
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
