import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Navigation,
  Menu,
  Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AdminBottomNavProps {
  onOpenMenu: () => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ onOpenMenu }) => {
  const { user } = useAuth();
  const userRole = user?.role || "admin";

  const homePath =
    userRole === "responder"
      ? "/admin/incidents"
      : userRole === "resourcer"
      ? "/admin/resources"
      : "/admin/dashboard";

  const thirdTabPath = userRole === "resourcer" ? "/admin/resources" : "/admin/incidents";
  const thirdTabLabel = userRole === "resourcer" ? "Resources" : "Incidents";
  const ThirdTabIcon = userRole === "resourcer" ? Truck : AlertTriangle;

  return (
    <nav className="admin-bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to={homePath}
        className={({ isActive }) => `admin-bottom-tab ${isActive ? "active" : ""}`}
      >
        <LayoutDashboard size={18} />
        <span>Overview</span>
      </NavLink>

      <NavLink
        to="/admin/map"
        className={({ isActive }) => `admin-bottom-tab ${isActive ? "active" : ""}`}
      >
        <Map size={18} />
        <span>Risk Map</span>
      </NavLink>

      <NavLink
        to={thirdTabPath}
        className={({ isActive }) => `admin-bottom-tab ${isActive ? "active" : ""}`}
      >
        <ThirdTabIcon size={18} />
        <span>{thirdTabLabel}</span>
      </NavLink>

      <NavLink
        to="/admin/routes"
        className={({ isActive }) => `admin-bottom-tab ${isActive ? "active" : ""}`}
      >
        <Navigation size={18} />
        <span>Routes</span>
      </NavLink>

      <button
        type="button"
        onClick={onOpenMenu}
        className="admin-bottom-tab"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        title="Open Full Command Menu"
      >
        <Menu size={18} />
        <span>All Pages</span>
      </button>
    </nav>
  );
};
