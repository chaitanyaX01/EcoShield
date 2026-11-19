import React from "react";
import { RiskLevel } from "../../types";

interface StatusBadgeProps {
  type?: "risk" | "severity" | "status" | "resource";
  value: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type = "risk", value, size = "md" }) => {
  const valLower = (value || "").toLowerCase();

  let className = "risk-pill";
  let dotColor = "currentColor";

  if (valLower === "low" || valLower === "resolved" || valLower === "standby" || valLower === "available") {
    className += " low";
    dotColor = "var(--risk-low-dot)";
  } else if (valLower === "moderate" || valLower === "investigating" || valLower === "field_resolved" || valLower === "limited" || valLower === "acknowledged") {
    className += " moderate";
    dotColor = "var(--risk-mod-dot)";
  } else if (valLower === "high" || valLower === "deployed" || valLower === "unverified" || valLower === "escalated") {
    className += " high";
    dotColor = "var(--risk-high-dot)";
  } else if (valLower === "critical" || valLower === "near saturation") {
    className += " critical";
    dotColor = "var(--risk-crit-dot)";
  } else {
    className += " low";
  }

  const fontSize = size === "sm" ? 11 : 12;
  const padding = size === "sm" ? "2px 8px" : "3px 10px";

  const displayLabel = valLower === "field_resolved" ? "Field Work Done" : valLower === "resolved" ? "Solved" : (value || "Unknown");

  return (
    <span className={className} style={{ fontSize, padding }}>
      <span className="pulse-dot" style={{ backgroundColor: dotColor }}></span>
      {displayLabel}
    </span>
  );
};
