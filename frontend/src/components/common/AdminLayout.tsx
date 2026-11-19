import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { AdminBottomNav } from "./AdminBottomNav";
import { useAuth } from "../../context/AuthContext";

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-app)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="pulse-dot animated" style={{
            width: 16,
            height: 16,
            margin: "0 auto 14px",
            background: "var(--green-500)",
            boxShadow: "0 0 16px rgba(34, 197, 94, 0.3)",
          }}></div>
          <div style={{
            fontSize: 13,
            color: "var(--text-muted)",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}>
            Verifying EcoShield Command Credentials...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "citizen") {
    return <Navigate to="/citizen" replace />;
  }

  return (
    <div className="app-layout">
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="main-body-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
      <AdminBottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
};
