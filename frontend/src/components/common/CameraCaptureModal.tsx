import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Check, AlertCircle, UploadCloud, SwitchCamera } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = "Take Live Photo with Camera",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isStarting, setIsStarting] = useState<boolean>(true);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream with requested facing mode
  const startCamera = async (mode: "environment" | "user") => {
    stopStream();
    setIsStarting(true);
    setErrorMessage(null);
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setErrorMessage("Camera access is not supported by your browser environment. You can upload an image file instead.");
      setIsStarting(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // First try with preferred facing mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback to any available video input
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setHasPermission(true);
    } catch (err: any) {
      console.warn("Camera permission or initialization error:", err);
      setHasPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. Please allow camera permissions in your browser address bar to snap a live photo.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No physical camera device was detected on your system. You can upload an image file from disk.");
      } else {
        setErrorMessage(`Unable to access camera: ${err.message || "Unknown error"}. You can upload an image file instead.`);
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedImage(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedImage(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopStream();
      onClose();
    }
  };

  const handleFileUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setCapturedImage(reader.result as string);
          stopStream();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
    >
      <div
        className="eco-card"
        style={{
          maxWidth: 580,
          width: "100%",
          padding: 0,
          overflow: "hidden",
          background: "rgba(12, 14, 18, 0.96)",
          backdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          color: "var(--text-primary)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Camera size={20} color="var(--green-400)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 360,
            background: "#020617",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Live Video Viewfinder */}
          {!capturedImage && (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: hasPermission && !isStarting ? "block" : "none",
              }}
            />
          )}

          {/* Captured Image Review */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: "#000000",
              }}
            />
          )}

          {/* Hidden Canvas for raster snapshot */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Starting / Loading spinner */}
          {isStarting && !capturedImage && (
            <div style={{ textAlign: "center", color: "#94a3b8" }}>
              <div
                className="pulse-dot animated"
                style={{ width: 16, height: 16, margin: "0 auto 10px", background: "#14b8a6" }}
              ></div>
              <div style={{ fontSize: 13 }}>Initializing Live Camera Stream...</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Please allow camera access if prompted by your browser
              </div>
            </div>
          )}

          {/* Error / Permission Denied Overlay */}
          {!hasPermission && !isStarting && !capturedImage && (
            <div style={{ textAlign: "center", padding: 24, maxWidth: 440 }}>
              <AlertCircle size={36} color="#f87171" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 6 }}>
                Camera Permission Needed
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, marginBottom: 16 }}>
                {errorMessage}
              </div>

              {/* Retry & File Upload Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6, background: "var(--bg-subtle)", color: "var(--text-primary)", borderColor: "var(--border-subtle)", borderRadius: 9999 }}
                >
                  <RefreshCw size={14} />
                  <span>Retry Camera</span>
                </button>

                <label
                  className="btn btn-primary btn-sm"
                  style={{ gap: 6, cursor: "pointer", background: "var(--green-500)", borderColor: "var(--green-500)", color: "#000000", fontWeight: 700, borderRadius: 9999 }}
                >
                  <UploadCloud size={14} />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUploadFallback}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Flip Camera Switch Button (Top Right over video) */}
          {!capturedImage && hasPermission && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                padding: "6px 10px",
                borderRadius: 20,
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                backdropFilter: "blur(4px)",
              }}
              title="Switch front/rear camera"
            >
              <SwitchCamera size={14} />
              <span>Flip</span>
            </button>
          )}

          {/* Viewfinder Target Guidelines */}
          {!capturedImage && hasPermission && (
            <div
              style={{
                position: "absolute",
                width: 220,
                height: 160,
                border: "2px dashed rgba(20, 184, 166, 0.6)",
                borderRadius: 8,
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Footer Controls */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(10, 12, 16, 0.95)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {/* Left: Device file upload fallback */}
          <div>
            <label
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <UploadCloud size={15} color="var(--green-400)" />
              <span>Upload from device</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUploadFallback}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Center / Right: Snap Photo or Accept / Retake */}
          {!capturedImage ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="btn btn-secondary btn-sm"
                style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)", borderRadius: 9999 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!hasPermission}
                style={{
                  background: "radial-gradient(circle, #34d399 0%, #10b981 100%)",
                  border: "4px solid rgba(255, 255, 255, 0.85)",
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  cursor: hasPermission ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.55)",
                  transition: "transform 0.1s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title="Capture Photo"
              >
                <Camera size={24} color="#000000" />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleRetake}
                className="btn btn-secondary btn-sm"
                style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)", gap: 6, borderRadius: 9999 }}
              >
                <RefreshCw size={14} />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="btn btn-primary btn-sm"
                style={{ background: "var(--green-500)", borderColor: "var(--green-500)", color: "#000000", fontWeight: 700, gap: 6, borderRadius: 9999 }}
              >
                <Check size={14} />
                <span>Use This Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
