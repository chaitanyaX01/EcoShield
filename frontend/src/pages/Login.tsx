import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Users,
  Truck,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const Login: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, register } = useAuth();
  const navigate = useNavigate();

  // If already signed in, directly redirect to respective portal
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "responder") {
        navigate("/admin/incidents", { replace: true });
      } else if (user.role === "resourcer") {
        navigate("/admin/resources", { replace: true });
      } else if (user.role === "citizen") {
        navigate("/citizen", { replace: true });
      } else {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Mode: "signin" or "register"
  const [tab, setTab] = useState<"signin" | "register">("signin");

  // Sign In credentials
  const [signInEmail, setSignInEmail] = useState<string>("");
  const [signInPassword, setSignInPassword] = useState<string>("");
  const [showSignInPassword, setShowSignInPassword] = useState<boolean>(false);

  // Register credentials (using Gmail / Email + Password instead of OTP)
  const [regFullName, setRegFullName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>("");
  const [regRole, setRegRole] = useState<"responder" | "resourcer" | "citizen">("citizen");
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sign In handler (Email + Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await login(signInEmail.trim(), signInPassword);
      // Route based on role
      const me = await api.getMe();
      const role = me.user?.role || "admin";
      if (role === "responder") {
        navigate("/admin/incidents");
      } else if (role === "resourcer") {
        navigate("/admin/resources");
      } else if (role === "citizen") {
        navigate("/citizen");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Account handler (Gmail / Email + Password - NO OTP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanName = regFullName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPassword = regPassword.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid Gmail or Email address (e.g. yourname@gmail.com).");
      return;
    }

    if (cleanPassword.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    if (cleanPassword !== regConfirmPassword.trim()) {
      setError("Passwords do not match. Please ensure both passwords match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(cleanName, cleanEmail, cleanPassword, regRole);
      setSuccessMessage("Account created successfully! Loading your portal...");
      const targetPath = regRole === "citizen"
        ? "/citizen"
        : regRole === "responder"
        ? "/admin/incidents"
        : regRole === "resourcer"
        ? "/admin/resources"
        : "/admin/dashboard";
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please check your details.");
      setIsSubmitting(false);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--forest-950)",
        padding: "36px 16px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 470, width: "100%" }} className="animate-fade-in">
        {/* Editorial Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--lime-500)",
              width: 58,
              height: 58,
              borderRadius: "18px",
              color: "var(--forest-950)",
              marginBottom: 16,
              boxShadow: "0 8px 30px rgba(187, 244, 81, 0.35)",
              border: "1px solid rgba(187, 244, 81, 0.4)",
            }}
          >
            <Shield size={30} strokeWidth={2.4} />
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              fontFamily: "var(--font-display)",
              lineHeight: 1.15,
            }}
          >
            EcoShield <span style={{ color: "var(--lime-400)" }}>AI</span>
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.65)",
              marginTop: 6,
              letterSpacing: "-0.01em",
              fontWeight: 450,
            }}
          >
            Pune Metropolitan Area • Command &amp; Citizen Portal
          </p>
        </div>

        {/* Forest Green Editorial Card */}
        <div
          style={{
            background: "var(--forest-900)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "0 24px 60px rgba(6, 26, 16, 0.8)",
            padding: "32px 28px",
            position: "relative",
          }}
        >
          {/* Segmented Capsule Tab Control */}
          <div
            className="apple-segmented-container"
            style={{ marginBottom: 24 }}
          >
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`apple-segmented-item ${tab === "signin" ? "active" : ""}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`apple-segmented-item ${tab === "register" ? "active" : ""}`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.28)",
                color: "#fca5a5",
                padding: "11px 15px",
                borderRadius: "12px",
                fontSize: 12.5,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#86efac",
                padding: "11px 15px",
                borderRadius: "12px",
                fontSize: 12.5,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} color="#10b981" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === "signin" ? (
            /* ==================== SIGN IN (GMAIL / EMAIL + PASSWORD) ==================== */
            <div>
              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      marginBottom: 7,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Email / Gmail Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      className="input-control"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="e.g. officer@pune.gov.in or you@gmail.com"
                      style={{ paddingLeft: 42 }}
                      required
                    />
                    <Mail
                      size={17}
                      color="#71717a"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 7,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#a1a1aa",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Password
                    </label>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      className="input-control"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your account password"
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                      required
                    />
                    <Lock
                      size={17}
                      color="#71717a"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#71717a",
                        display: "flex",
                        alignItems: "center",
                        padding: 4,
                      }}
                    >
                      {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "13px",
                    marginTop: 6,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Authenticating..." : "Sign In"}
                </button>
              </form>

            </div>
          ) : (
            /* ==================== CREATE ACCOUNT (GMAIL / EMAIL + PASSWORD) ==================== */
            <div>
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {/* 3 Operational Roles */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      marginBottom: 8,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Choose Your Role
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setRegRole("citizen")}
                      style={{
                        padding: "12px 6px",
                        borderRadius: "14px",
                        border: `1.5px solid ${
                          regRole === "citizen" ? "#10b981" : "rgba(255, 255, 255, 0.08)"
                        }`,
                        background:
                          regRole === "citizen" ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        color: regRole === "citizen" ? "#34d399" : "#a1a1aa",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <Users size={20} color={regRole === "citizen" ? "#10b981" : "#71717a"} />
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>Citizen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("responder")}
                      style={{
                        padding: "12px 6px",
                        borderRadius: "14px",
                        border: `1.5px solid ${
                          regRole === "responder" ? "#10b981" : "rgba(255, 255, 255, 0.08)"
                        }`,
                        background:
                          regRole === "responder" ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        color: regRole === "responder" ? "#34d399" : "#a1a1aa",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <UserCheck size={20} color={regRole === "responder" ? "#10b981" : "#71717a"} />
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>Field Officer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("resourcer")}
                      style={{
                        padding: "12px 6px",
                        borderRadius: "14px",
                        border: `1.5px solid ${
                          regRole === "resourcer" ? "#10b981" : "rgba(255, 255, 255, 0.08)"
                        }`,
                        background:
                          regRole === "resourcer" ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                        color: regRole === "resourcer" ? "#34d399" : "#a1a1aa",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <Truck size={20} color={regRole === "resourcer" ? "#10b981" : "#71717a"} />
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>Resourcer</span>
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#10b981", marginTop: 7, lineHeight: 1.45 }}>
                    {regRole === "citizen" && "• Submit geolocated hazard reports and track verified evacuation routes."}
                    {regRole === "responder" && "• Register for emergency field tasks and live dispatch assignments."}
                    {regRole === "resourcer" && "• Manage dewatering pumps, rescue crafts, and heavy equipment."}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      marginBottom: 7,
                    }}
                  >
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="input-control"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Chaitanya Joshi"
                      style={{ paddingLeft: 42 }}
                      required
                    />
                    <User
                      size={17}
                      color="#71717a"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                </div>

                {/* Gmail / Email Address */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      marginBottom: 7,
                    }}
                  >
                    Gmail / Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      className="input-control"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      style={{ paddingLeft: 42 }}
                      required
                    />
                    <Mail
                      size={17}
                      color="#71717a"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      marginBottom: 7,
                    }}
                  >
                    Create Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      className="input-control"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                      required
                    />
                    <Lock
                      size={17}
                      color="#71717a"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#71717a",
                        display: "flex",
                        alignItems: "center",
                        padding: 4,
                      }}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      marginBottom: 7,
                    }}
                  >
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      className="input-control"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      style={{ paddingLeft: 42 }}
                      required
                    />
                    <Lock
                      size={17}
                      color="#71717a"
                      style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "13px",
                    marginTop: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Minimalist Apple Bottom Navigation Bar */}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <Link
            to="/citizen"
            style={{
              fontSize: 12.5,
              color: "#a1a1aa",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "all 0.2s",
            }}
          >
            <span>Public Safety & Hazard Reporting?</span>
            <strong style={{ color: "#34d399", fontWeight: 600 }}>Citizen Portal</strong>
            <ArrowRight size={13} color="#34d399" />
          </Link>
        </div>
      </div>
    </div>
  );
};
