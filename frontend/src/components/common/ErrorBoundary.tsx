import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "var(--bg-app, #0a0c10)",
          }}
        >
          <div
            style={{
              maxWidth: 500,
              width: "100%",
              background: "rgba(20, 24, 33, 0.95)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "16px",
              padding: "32px 28px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                color: "#ef4444",
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary, #ffffff)",
                margin: "0 0 8px",
              }}
            >
              {this.props.fallbackTitle || "Application Display Issue"}
            </h2>

            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #94a3b8)",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              The system encountered a minor rendering issue while loading this view. You can reload the page or return to the main portal.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#f87171",
                  textAlign: "left",
                  marginBottom: 20,
                  overflowX: "auto",
                  maxHeight: 100,
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  padding: "8px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <Home size={14} />
                <span>Go to Sign In</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
