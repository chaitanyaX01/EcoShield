import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminLayout } from "./components/common/AdminLayout";
import { CitizenLayout } from "./components/common/CitizenLayout";

import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Pages
import { CitizenPortal } from "./pages/CitizenPortal";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { WeatherPage } from "./pages/WeatherPage";
import { PredictionPage } from "./pages/PredictionPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { MapPage } from "./pages/MapPage";
import { RoutesPage } from "./pages/RoutesPage";
import { SheltersPage } from "./pages/SheltersPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AssistantPage } from "./pages/AssistantPage";

/**
 * RootRedirect handles default entry when opening the website:
 * - If not logged in, opens the sign-in / registration page directly (/login)
 * - If logged in, redirects users to their respective portal based on role
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

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
            Loading EcoShield AI...
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: directly open sign page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated: route to respective portal
  if (user.role === "responder") {
    return <Navigate to="/admin/incidents" replace />;
  }
  if (user.role === "resourcer") {
    return <Navigate to="/admin/resources" replace />;
  }
  if (user.role === "citizen") {
    return <Navigate to="/citizen" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="EcoShield System Error">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Sign In / Create Account Page */}
            <Route path="/login" element={<Login />} />

            {/* Citizen Portal & Permitted Citizen Modules (Menu bar with only 4 features) */}
            <Route path="/citizen" element={<CitizenLayout />}>
              <Route index element={<CitizenPortal />} />
              <Route path="map" element={<MapPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="shelters" element={<SheltersPage />} />
              <Route path="assistant" element={<AssistantPage />} />
            </Route>

            {/* Protected Admin Command Center Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="prediction" element={<PredictionPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="shelters" element={<SheltersPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="assistant" element={<AssistantPage />} />
            </Route>

            {/* Default entry: directly opens sign page, or redirects to respective portal */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
