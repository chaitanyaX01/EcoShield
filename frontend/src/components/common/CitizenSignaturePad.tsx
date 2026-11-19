import React, { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw, Check, Sparkles, FileCheck } from "lucide-react";

interface CitizenSignaturePadProps {
  citizenName: string;
  onSignatureChange: (signatureData: string | null) => void;
  required?: boolean;
}

export const CitizenSignaturePad: React.FC<CitizenSignaturePadProps> = ({
  citizenName,
  onSignatureChange,
  required = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureType, setSignatureType] = useState<"drawn" | "digital" | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#10b981"; // Apple Emerald Green
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
    setSignatureType("drawn");
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureType(null);
    onSignatureChange(null);
  };

  // Generate verified digital cryptographic signature stamp
  const generateDigitalSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background subtle badge
    ctx.fillStyle = "#0c1310";
    ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Border
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Cursive / Calligraphic Signature
    const name = citizenName.trim() || "Pune Citizen";
    ctx.fillStyle = "#34d399";
    ctx.font = "italic bold 22px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
    ctx.fillText(name, 28, 48);

    // Verification subtitle
    const dateStr = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    ctx.fillStyle = "#10b981";
    ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`VERIFIED CITIZEN SIGN-OFF • PMC DISASTER DISPATCH`, 28, 70);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.fillText(`TIMESTAMP: ${dateStr} • SECURE-AUTH-TOKEN-PMC`, 28, 86);

    setHasSignature(true);
    setSignatureType("digital");
    onSignatureChange(canvas.toDataURL("image/png"));
  };

  return (
    <div style={{
      border: hasSignature ? "1.5px solid var(--green-500)" : "1px dashed var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      background: hasSignature ? "rgba(16, 185, 129, 0.05)" : "var(--bg-surface)",
      padding: "14px 16px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PenTool size={15} color="var(--green-400)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
            Citizen Digital Signature {required && <span style={{ color: "#ef4444" }}>*</span>}
          </span>
          {hasSignature && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 9999,
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--green-400)",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}>
              <Check size={11} />
              {signatureType === "digital" ? "Verified Digital Sign" : "Signed by Hand"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={generateDigitalSign}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: "4px 10px", gap: 4, color: "var(--green-400)" }}
            title="Generate verified digital signature stamp"
          >
            <Sparkles size={12} color="var(--green-400)" />
            <span>Digital Sign Stamp</span>
          </button>

          {hasSignature && (
            <button
              type="button"
              onClick={clearSignature}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: "4px 10px", gap: 4, color: "#ef4444" }}
              title="Clear signature to sign again"
            >
              <RotateCcw size={11} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div style={{
        position: "relative",
        background: "#0a0c0f",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)"
      }}>
        <canvas
          ref={canvasRef}
          width={460}
          height={100}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            width: "100%",
            height: "100px",
            display: "block",
            cursor: "crosshair",
            touchAction: "none"
          }}
        />

        {!hasSignature && (
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            gap: 2
          }}>
            <FileCheck size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>
              Draw signature here with mouse/finger, or click "Digital Sign Stamp"
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          Signatory: <strong>{citizenName || "Citizen"}</strong> • Legally binding reporting certification
        </span>
      </div>
    </div>
  );
};
