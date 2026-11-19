import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Filter,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MapPin,
  RefreshCw,
  Search,
  Camera,
  UploadCloud,
  Check,
  X,
  Eye,
  ShieldCheck,
  UserCheck,
  Send,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { api } from "../services/api";
import { Incident, Zone } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { CameraCaptureModal } from "../components/common/CameraCaptureModal";

export const IncidentsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || "admin";
  const isFieldResponse = userRole === "responder";

  // Resourcer role does NOT have access to Incident Dashboard - redirect to Resources
  if (userRole === "resourcer") {
    return <Navigate to="/admin/resources" replace />;
  }

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [filterZone, setFilterZone] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Assignment Modal state for Duty Officer
  const [registeredOfficers, setRegisteredOfficers] = useState<any[]>([]);
  const [assigningIncident, setAssigningIncident] = useState<Incident | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");
  const [dispatchNotes, setDispatchNotes] = useState<string>("");
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState<boolean>(false);
  const [filterMyAssignedOnly, setFilterMyAssignedOnly] = useState<boolean>(false);

  // Resolve / Put Proof Modal state for Field Response Unit
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);

  // Verify Modal state for Duty Officer (after Field Officer puts proof of work done)
  const [verifyingIncident, setVerifyingIncident] = useState<Incident | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState<boolean>(false);

  // Photo viewer modal state
  const [viewingPhotoIncident, setViewingPhotoIncident] = useState<Incident | null>(null);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const [incList, zList, officersList] = await Promise.all([
        api.getIncidents({
          zone_id: filterZone !== "all" ? filterZone : undefined,
          severity: filterSeverity !== "all" ? filterSeverity : undefined,
          status: filterStatus !== "all" ? filterStatus : undefined,
          incident_type: filterType !== "all" ? filterType : undefined,
        }),
        api.getZones(),
        api.getUsers("responder").catch(() => []),
      ]);
      setIncidents(incList);
      setZones(zList);
      if (officersList && officersList.length > 0) {
        setRegisteredOfficers(officersList);
      }
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [filterZone, filterSeverity, filterStatus, filterType]);

  // Duty Officer: Open assignment modal to pick which registered officer gets the task
  const openAssignModal = (inc: Incident) => {
    setAssigningIncident(inc);
    if (inc.assigned_to) {
      setSelectedOfficerId(inc.assigned_to);
    } else if (registeredOfficers.length > 0) {
      setSelectedOfficerId(registeredOfficers[0].id);
    }
    setDispatchNotes("");
  };

  const handleConfirmAssignment = async () => {
    if (!assigningIncident) return;
    setIsSubmittingAssignment(true);
    try {
      const officer = registeredOfficers.find((o) => o.id === selectedOfficerId) || registeredOfficers[0];
      const assignedName = officer ? officer.name : "Inspector S. Joshi";
      const assignedMobile = officer ? officer.mobile : "9822011223";
      const assignedId = officer ? officer.id : "USR-002";

      await api.updateIncidentStatus(
        assigningIncident.id,
        "investigating",
        undefined,
        dispatchNotes || `Dispatched by Duty Officer to ${assignedName} for on-ground field clearance.`,
        {
          assigned_to: assignedId,
          assigned_to_name: assignedName,
          assigned_to_mobile: assignedMobile,
        }
      );

      setIncidents((prev) =>
        prev.map((item) =>
          item.id === assigningIncident.id
            ? {
                ...item,
                status: "investigating",
                assigned_to: assignedId,
                assigned_to_name: assignedName,
                assigned_to_mobile: assignedMobile,
                assigned_at: new Date().toISOString(),
              }
            : item
        )
      );

      setAssigningIncident(null);
    } catch (err: any) {
      alert("Failed to assign incident to field officer: " + err.message);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  // Field Response Officer puts proof of work done (changes status to field_resolved)
  const handleConfirmResolution = async () => {
    if (!resolvingIncident) return;
    setIsSubmittingResolution(true);
    try {
      const finalAfterPhoto = resolutionPhoto || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23ecfdf5"/><text x="50%" y="45%" text-anchor="middle" fill="%23047857" font-weight="bold" font-family="sans-serif" font-size="14">FIELD HAZARD CLEARED</text><text x="50%" y="60%" text-anchor="middle" fill="%23065f46" font-family="sans-serif" font-size="11">Drain unblocked &amp; pumps deployed</text></svg>`;

      await api.updateIncidentStatus(
        resolvingIncident.id,
        "field_resolved",
        finalAfterPhoto,
        resolutionNotes || "Field response crew cleared water blockage and attached proof of work done."
      );

      setIncidents((prev) =>
        prev.map((item) =>
          item.id === resolvingIncident.id
            ? {
                ...item,
                status: "field_resolved",
                photo_after: finalAfterPhoto,
                note: resolutionNotes ? `${item.note || ""} [Field Work Done: ${resolutionNotes}]` : item.note,
              }
            : item
        )
      );

      setResolvingIncident(null);
      setResolutionPhoto(null);
      setResolutionNotes("");
    } catch (err: any) {
      alert("Failed to submit work done proof: " + err.message);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  // Duty Officer verifies after field officer put proof of work done -> problem solved & removed from citizen portal
  const handleConfirmVerifyAndSolve = async () => {
    if (!verifyingIncident) return;
    setIsSubmittingVerification(true);
    try {
      await api.updateIncidentStatus(
        verifyingIncident.id,
        "resolved",
        verifyingIncident.photo_after,
        "Duty Officer verified field clearance proof. Problem officially solved and removed from citizen portal."
      );

      setIncidents((prev) =>
        prev.map((item) =>
          item.id === verifyingIncident.id
            ? {
                ...item,
                status: "resolved",
                resolved_at: new Date().toISOString(),
              }
            : item
        )
      );

      setVerifyingIncident(null);
    } catch (err: any) {
      alert("Failed to verify incident: " + err.message);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleAfterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const myAssignedCount = incidents.filter((inc) => {
    return (
      (user?.id && inc.assigned_to === user.id) ||
      (user?.mobile && inc.assigned_to_mobile && user.mobile === inc.assigned_to_mobile) ||
      (user?.name && inc.assigned_to_name && user.name.toLowerCase().includes(inc.assigned_to_name.toLowerCase()))
    );
  }).length;

  const filteredIncidents = incidents.filter((inc) => {
    if (filterMyAssignedOnly && isFieldResponse) {
      const isMine =
        (user?.id && inc.assigned_to === user.id) ||
        (user?.mobile && inc.assigned_to_mobile && user.mobile === inc.assigned_to_mobile) ||
        (user?.name && inc.assigned_to_name && user.name.toLowerCase().includes(inc.assigned_to_name.toLowerCase()));
      if (!isMine) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      (inc.address && inc.address.toLowerCase().includes(q)) ||
      (inc.note && inc.note.toLowerCase().includes(q)) ||
      (inc.assigned_to_name && inc.assigned_to_name.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {isFieldResponse ? "Field Response Unit Interface" : "Duty Officer Command Interface"}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            Incident Management & Resolution
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {isFieldResponse
              ? "Inspect verified incidents, execute tactical interventions, and upload After-Resolution verification photos."
              : "Duty Officer triage: Verify citizen reports and assign field investigation crews for on-ground clearance."}
          </p>
        </div>

        <button
          onClick={loadIncidents}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <RefreshCw size={14} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Role Protocol Notice */}
      <div style={{
        background: isFieldResponse ? "var(--teal-50)" : "var(--bg-subtle)",
        border: `1px solid ${isFieldResponse ? "var(--teal-200)" : "var(--border-subtle)"}`,
        padding: "10px 14px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isFieldResponse ? <UserCheck size={18} color="var(--teal-700)" /> : <ShieldCheck size={18} color="var(--teal-700)" />}
          <span>
            {isFieldResponse ? (
              <strong>Field Response Protocol:</strong>
            ) : (
              <strong>Duty Officer Triage Protocol:</strong>
            )}
            {" "}
            {isFieldResponse
              ? "Select assigned incidents to take field action and submit proof of work done with live camera photo. Duty Officer will then verify and solve."
              : "Submit reported hazards to the Field Response Officer with 1 click. Once field proof of work done is submitted, the button changes to Verify to officially solve the hazard and remove it from the Citizen Portal."}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-800)", textTransform: "uppercase" }}>
          {isFieldResponse ? "Field Unit Clearance Mode" : "Duty Officer Mode"}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="eco-card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "center" }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Filter by Zone
            </label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="select-control"
            >
              <option value="all">All 8 Catchment Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Severity Level
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="select-control"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select-control"
            >
              <option value="all">All Statuses</option>
              <option value="unverified">Unverified</option>
              <option value="investigating">Investigating</option>
              <option value="verified">Verified</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Hazard Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-control"
            >
              <option value="all">All Incident Types</option>
              <option value="street_flooding">Street Waterlogging</option>
              <option value="residential_flooding">Residential / Basement</option>
              <option value="blocked_drain">Blocked Sump / Culvert</option>
              <option value="impassable_road">Submerged Road</option>
              <option value="fallen_tree">Fallen Tree / Wire</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
              Keyword Search
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search landmark..."
                className="input-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 28 }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 9, top: 10 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Incidents Queue */}
      <div className="eco-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Incident Queue ({filteredIncidents.length} Records)
            </div>
            {isFieldResponse && (
              <div style={{ display: "flex", gap: 6, background: "var(--bg-subtle)", padding: 3, borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => setFilterMyAssignedOnly(false)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: !filterMyAssignedOnly ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid transparent",
                    cursor: "pointer",
                    background: !filterMyAssignedOnly ? "rgba(16, 185, 129, 0.18)" : "transparent",
                    color: !filterMyAssignedOnly ? "var(--green-400)" : "var(--text-secondary)",
                    boxShadow: !filterMyAssignedOnly ? "0 0 12px rgba(16, 185, 129, 0.2)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  All Hazards ({incidents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMyAssignedOnly(true)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: filterMyAssignedOnly ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid transparent",
                    cursor: "pointer",
                    background: filterMyAssignedOnly ? "rgba(16, 185, 129, 0.18)" : "transparent",
                    color: filterMyAssignedOnly ? "var(--green-400)" : "var(--text-secondary)",
                    boxShadow: filterMyAssignedOnly ? "0 0 12px rgba(16, 185, 129, 0.2)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  🎯 Assigned to Me ({myAssignedCount})
                </button>
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {isFieldResponse ? "Field Response Action Center" : "Duty Officer Triage Center"}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="pulse-dot animated" style={{ margin: "0 auto 8px", background: "var(--teal-600)" }}></div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Filtering queue...</div>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No incident reports found matching active criteria.
          </div>
        ) : (
          <div className="table-responsive-wrapper" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-medium)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>Hazard Details</th>
                  <th style={{ padding: "10px 14px" }}>Location</th>
                  <th style={{ padding: "10px 14px" }}>Severity</th>
                  <th style={{ padding: "10px 14px" }}>Water Depth</th>
                  <th style={{ padding: "10px 14px" }}>Photos (Before / After)</th>
                  <th style={{ padding: "10px 14px" }}>Status</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Authorized Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inc.title}</div>
                      {inc.note && (
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          "{inc.note}"
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span>Reporter: <strong>{inc.reporter}</strong> • ID: {inc.id}</span>
                        {inc.signature && (
                          <span style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "var(--green-400)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            padding: "2px 8px",
                            borderRadius: 9999,
                            fontWeight: 600,
                            fontSize: 9
                          }}>
                            ✍️ Citizen Signed
                          </span>
                        )}
                        <span style={{
                          color: inc.corroborations >= 30 ? "#b45309" : inc.corroborations >= 20 ? "#1e40af" : "var(--text-muted)",
                          fontWeight: inc.corroborations >= 20 ? 700 : 400
                        }}>
                          • {inc.corroborations} {inc.corroborations === 1 ? "confirm" : "confirms"}
                        </span>
                      </div>

                      {/* Assigned Field Response Personnel Badge */}
                      {inc.assigned_to_name ? (
                        <div style={{
                          marginTop: 5,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background:
                            (user?.id && inc.assigned_to === user.id) ||
                            (user?.mobile && inc.assigned_to_mobile && user.mobile === inc.assigned_to_mobile) ||
                            (user?.name && inc.assigned_to_name && user.name.toLowerCase().includes(inc.assigned_to_name.toLowerCase()))
                              ? "rgba(16, 185, 129, 0.15)"
                              : "var(--bg-subtle)",
                          border: `1px solid ${
                            (user?.id && inc.assigned_to === user.id) ||
                            (user?.mobile && inc.assigned_to_mobile && user.mobile === inc.assigned_to_mobile) ||
                            (user?.name && inc.assigned_to_name && user.name.toLowerCase().includes(inc.assigned_to_name.toLowerCase()))
                              ? "rgba(16, 185, 129, 0.35)"
                              : "var(--border-subtle)"
                          }`,
                          padding: "2px 7px",
                          borderRadius: 4,
                          fontSize: 10,
                          color: "var(--text-primary)"
                        }}>
                          <UserCheck size={12} color="var(--teal-700)" />
                          <span>Officer: <strong>{inc.assigned_to_name}</strong></span>
                          {inc.assigned_to_mobile && <span style={{ color: "var(--text-muted)" }}>(+91 {inc.assigned_to_mobile})</span>}
                          {((user?.id && inc.assigned_to === user.id) ||
                            (user?.mobile && inc.assigned_to_mobile && user.mobile === inc.assigned_to_mobile) ||
                            (user?.name && inc.assigned_to_name && user.name.toLowerCase().includes(inc.assigned_to_name.toLowerCase()))) && (
                            <span style={{
                              background: "var(--teal-700)",
                              color: "#ffffff",
                              padding: "1px 5px",
                              borderRadius: 3,
                              fontSize: 9,
                              fontWeight: 700,
                              marginLeft: 2
                            }}>
                              🎯 ASSIGNED TO YOU
                            </span>
                          )}
                        </div>
                      ) : (
                        inc.status === "investigating" && (
                          <div style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>
                            ⚠️ Dispatched (Awaiting specific officer assignment)
                          </div>
                        )
                      )}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {inc.zone_name || inc.zone_id}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {inc.address}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge type="severity" value={inc.severity} size="sm" />
                    </td>

                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {inc.water_depth_cm > 0 ? (
                        `${inc.water_depth_cm} cm`
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}>
                          {inc.incident_type === "fallen_tree" ? "Tree Blockage" : "Solid Waste (Dry)"}
                        </span>
                      )}
                    </td>

                    {/* Photos Column */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {inc.photo_before ? (
                          <div
                            onClick={() => setViewingPhotoIncident(inc)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              cursor: "pointer",
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(16, 185, 129, 0.10)",
                              border: "1px solid rgba(16, 185, 129, 0.28)",
                              transition: "all 0.15s ease",
                            }}
                            title="Click to inspect citizen hazard photo"
                          >
                            <img
                              src={inc.photo_before}
                              alt="Citizen evidence"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 4,
                                objectFit: "cover",
                                border: "1.5px solid #10b981",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                              }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", display: "flex", alignItems: "center", gap: 3 }}>
                                <Camera size={11} /> View Photo
                              </span>
                              {inc.photo_after ? (
                                <span style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>✓ After Proof</span>
                              ) : (
                                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Citizen Proof</span>
                              )}
                            </div>
                          </div>
                        ) : inc.photo_after ? (
                          <button
                            type="button"
                            onClick={() => setViewingPhotoIncident(inc)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                            title="View Resolution Proof Photo"
                          >
                            <Camera size={13} color="#10b981" />
                            <span style={{ color: "#10b981", fontWeight: 600 }}>✓ After Proof</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Camera size={12} style={{ opacity: 0.5 }} /> None
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        background:
                          inc.status === "resolved" ? "rgba(16, 185, 129, 0.15)" :
                          inc.status === "field_resolved" || inc.photo_after ? "rgba(16, 185, 129, 0.10)" :
                          inc.status === "investigating" ? "var(--risk-mod-bg)" : "var(--risk-high-bg)",
                        color:
                          inc.status === "resolved" ? "var(--green-400)" :
                          inc.status === "field_resolved" || inc.photo_after ? "var(--green-300)" :
                          inc.status === "investigating" ? "var(--risk-mod-text)" : "var(--risk-high-text)",
                        border: `1px solid ${
                          inc.status === "resolved" ? "rgba(16, 185, 129, 0.35)" :
                          inc.status === "field_resolved" || inc.photo_after ? "rgba(16, 185, 129, 0.25)" :
                          inc.status === "investigating" ? "var(--risk-mod-border)" : "var(--risk-high-border)"
                        }`
                      }}>
                        {inc.status === "resolved" ? "Solved" :
                         inc.status === "field_resolved" || inc.photo_after ? "Work Done Proof" :
                         inc.status === "investigating" ? "Dispatched" : inc.status}
                      </span>
                    </td>

                    {/* Authorized Action Column */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      {isFieldResponse ? (
                        /* FIELD RESPONSE UNIT ACTIONS */
                        inc.status === "resolved" ? (
                          <span style={{ fontSize: 11, color: "#059669", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={14} color="#059669" /> Solved &amp; Verified
                          </span>
                        ) : inc.status === "field_resolved" || inc.photo_after ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "var(--teal-700)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Check size={14} color="#0d9488" /> Proof Submitted
                            </span>
                            <button
                              onClick={() => {
                                setResolvingIncident(inc);
                                setResolutionPhoto(inc.photo_after || null);
                                setResolutionNotes(inc.note || "");
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "3px 8px", fontSize: 10 }}
                              title="Update proof of work done"
                            >
                              Update
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setResolvingIncident(inc);
                              setResolutionPhoto(null);
                              setResolutionNotes("");
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "6px 12px", fontSize: 11, background: "var(--teal-700)", borderColor: "var(--teal-700)", gap: 6 }}
                            title="Take Field Action & Put Proof of Work Done"
                          >
                            <Camera size={14} />
                            <span>Put Proof of Work Done</span>
                          </button>
                        )
                      ) : (
                        /* DUTY OFFICER ACTIONS: ONLY 1 BUTTON "Submit to Field Response Officer" UNTIL PROOF IS PUT, THEN "Verify" */
                        inc.status === "resolved" ? (
                          <span style={{ fontSize: 11, color: "#059669", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={14} color="#059669" /> Solved &amp; Verified
                          </span>
                        ) : inc.status === "field_resolved" || inc.photo_after ? (
                          /* After field officer put the proof of work done, button changes to Verify */
                          <button
                            onClick={() => setVerifyingIncident(inc)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "6px 14px", fontSize: 11, background: "#059669", borderColor: "#059669", gap: 6, fontWeight: 700 }}
                            title="Duty Officer: Inspect Proof of Work Done and Verify (Solves Hazard)"
                          >
                            <ShieldCheck size={14} />
                            <span>Verify</span>
                          </button>
                        ) : inc.status === "investigating" ? (
                          /* Already submitted to field officer, waiting for field officer to put proof */
                          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                            <span style={{ fontSize: 11, color: "var(--teal-700)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Clock size={13} /> {inc.assigned_to_name ? `Assigned: ${inc.assigned_to_name}` : "Dispatched to Field"}
                            </span>
                            <button
                              type="button"
                              onClick={() => openAssignModal(inc)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 8px", fontSize: 10 }}
                              title="Duty Officer: Reassign to another registered field officer"
                            >
                              Reassign Officer
                            </button>
                          </div>
                        ) : (
                          /* THE ONLY 1 BUTTON for Duty Officer: Submit to Field Response Officer (opens assignment modal with registered officers) */
                          <button
                            onClick={() => openAssignModal(inc)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "6px 12px", fontSize: 11, background: "var(--teal-700)", borderColor: "var(--teal-700)", gap: 6 }}
                            title="Duty Officer: Choose which registered field officer to assign this work to"
                          >
                            <Send size={13} />
                            <span>Submit to Field Response Officer</span>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESOLUTION MODAL FOR FIELD RESPONSE TEAM */}
      {resolvingIncident && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }}>
          <div className="eco-card" style={{ maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Camera size={20} color="var(--teal-700)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Field Response: Submit Proof of Work Done
                </h3>
              </div>
              <button
                onClick={() => setResolvingIncident(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 14, background: "var(--bg-subtle)", padding: 12, borderRadius: 6, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{resolvingIncident.title}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
                {resolvingIncident.address}{resolvingIncident.water_depth_cm > 0 ? ` • Water Depth: ${resolvingIncident.water_depth_cm} cm` : ""}
              </div>
            </div>

            {/* Before Photo Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                1. Citizen Report Photo (Before Solving Issue)
              </div>
              {resolvingIncident.photo_before ? (
                <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-medium)", background: "#0a0c0f" }}>
                  <img
                    src={resolvingIncident.photo_before}
                    alt="Citizen report before"
                    style={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block" }}
                  />
                </div>
              ) : (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px dashed rgba(239, 68, 68, 0.3)",
                  padding: 16,
                  borderRadius: 8,
                  textAlign: "center",
                  fontSize: 12,
                  color: "#f87171"
                }}>
                  Citizen submitted report without initial photograph.
                </div>
              )}
            </div>

            {/* After Photo Upload / Live Camera Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                2. Proof of Work Done (After Photo with Camera or File) *
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setCameraModalOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ gap: 6, padding: "8px 14px", background: "var(--teal-700)", borderColor: "var(--teal-700)" }}
                >
                  <Camera size={16} />
                  <span>Take Live Photo (Camera)</span>
                </button>

                <label
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6, padding: "8px 14px", cursor: "pointer", background: "var(--bg-subtle)" }}
                >
                  <UploadCloud size={16} />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleAfterPhotoUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {resolutionPhoto ? (
                <div style={{ marginTop: 8, padding: 10, background: "var(--teal-50)", borderRadius: 8, border: "1px solid var(--teal-200)" }}>
                  <img
                    src={resolutionPhoto}
                    alt="After resolution proof"
                    style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 6, border: "2px solid var(--teal-600)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-800)" }}>
                      ✓ Photo proof attached
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setCameraModalOpen(true)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 8px", fontSize: 11 }}
                      >
                        Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutionPhoto(null)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 8px", fontSize: 11, color: "#ef4444" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Direct live photo provides verified proof of unblocked drains, lowered water level, or restored roads.
                </div>
              )}

              <CameraCaptureModal
                isOpen={cameraModalOpen}
                onClose={() => setCameraModalOpen(false)}
                onCapture={(photo) => setResolutionPhoto(photo)}
                title="Field Clearance: Take Photo of Work Done"
              />
            </div>

            {/* Resolution Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                3. Field Actions Taken
              </label>
              <textarea
                className="input-control"
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Cleared storm drain blockage and pumped out 45cm water with 120HP mobile pump."
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingResolution}
                onClick={handleConfirmResolution}
                className="btn btn-primary btn-sm"
                style={{ background: "#059669", borderColor: "#059669" }}
              >
                {isSubmittingResolution ? "Submitting Proof..." : "Submit Proof of Work Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUTY OFFICER VERIFICATION MODAL */}
      {verifyingIncident && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: 16
        }}>
          <div className="eco-card" style={{ maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={20} color="#059669" />
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Duty Officer: Verify Field Work &amp; Mark Problem Solved
                  </h3>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Compare Citizen Initial Report with Field Response Officer's Work-Done Proof before clearing from system.
                </div>
              </div>
              <button
                onClick={() => setVerifyingIncident(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-responsive-grid" style={{ marginBottom: 20 }}>
              {/* Left: Citizen Before Photo */}
              <div style={{ background: "var(--bg-subtle)", padding: 12, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>1. Citizen Hazard Report</span>
                  <span style={{ fontSize: 10, background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>Before</span>
                </div>
                {verifyingIncident.photo_before ? (
                  <img
                    src={verifyingIncident.photo_before}
                    alt="Citizen report before"
                    style={{ width: "100%", height: 200, objectFit: "contain", background: "rgba(0,0,0,0.5)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}
                  />
                ) : (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                    No initial photo attached by citizen.
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  <div><strong>Location:</strong> {verifyingIncident.address || "Pune"}</div>
                  {verifyingIncident.water_depth_cm && verifyingIncident.water_depth_cm > 0 ? (
                    <div><strong>Water Depth:</strong> {verifyingIncident.water_depth_cm} cm</div>
                  ) : (
                    <div><strong>Issue:</strong> {verifyingIncident.title}</div>
                  )}
                  <div><strong>Reported:</strong> {verifyingIncident.reporter}</div>
                </div>
              </div>

              {/* Right: Field Officer After Photo */}
              <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: 14, borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-400)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>2. Field Officer Work Done Proof</span>
                  <span style={{ fontSize: 10, background: "rgba(16, 185, 129, 0.2)", color: "var(--green-400)", padding: "2px 8px", borderRadius: 9999, fontWeight: 700 }}>Proof Attached</span>
                </div>
                {verifyingIncident.photo_after ? (
                  <img
                    src={verifyingIncident.photo_after}
                    alt="Field clearance proof"
                    style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 8, border: "2px solid var(--green-500)" }}
                  />
                ) : (
                  <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, fontSize: 11, color: "var(--green-400)", textAlign: "center", padding: 12 }}>
                    Field clearance reported.
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary)" }}>
                  <div><strong>Status:</strong> <span style={{ color: "var(--green-400)" }}>Field Clearance Completed</span></div>
                  {verifyingIncident.note && (
                    <div style={{ marginTop: 4, fontStyle: "italic", fontSize: 10, color: "var(--text-muted)" }}>
                      "{verifyingIncident.note}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.10)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 18, fontSize: 12, color: "var(--green-300)" }}>
              <strong style={{ color: "var(--green-400)" }}>Impact of Verification:</strong> Upon clicking Verify, this problem will be marked as officially solved in the Command Center and immediately removed from the Citizen Portal.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setVerifyingIncident(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingVerification}
                onClick={handleConfirmVerifyAndSolve}
                className="btn btn-primary btn-sm"
                style={{ background: "#059669", borderColor: "#059669", gap: 6, padding: "8px 16px", fontWeight: 700 }}
              >
                <CheckCircle2 size={16} />
                <span>{isSubmittingVerification ? "Verifying & Solving..." : "Verify & Mark Problem Solved"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO VIEWER MODAL */}
      {viewingPhotoIncident && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }}>
          <div className="eco-card" style={{ maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Inspection Photos: {viewingPhotoIncident.title}
                </h3>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Location: {viewingPhotoIncident.address}
                </div>
              </div>
              <button
                onClick={() => setViewingPhotoIncident(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-responsive-grid">
              {/* Before Photo */}
              <div style={{ background: "var(--bg-subtle)", padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Before Solving (Citizen Report)
                </div>
                {viewingPhotoIncident.photo_before ? (
                  <img
                    src={viewingPhotoIncident.photo_before}
                    alt="Citizen before report"
                    style={{ width: "100%", height: 220, objectFit: "contain", background: "rgba(0,0,0,0.5)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}
                  />
                ) : (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                    No citizen initial photo attached.
                  </div>
                )}
              </div>

              {/* After Photo */}
              <div style={{ background: "var(--bg-subtle)", padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  After Solving (Field Clearance Proof)
                </div>
                {viewingPhotoIncident.photo_after ? (
                  <img
                    src={viewingPhotoIncident.photo_after}
                    alt="After resolution proof"
                    style={{ width: "100%", height: 220, objectFit: "contain", background: "rgba(0,0,0,0.5)", borderRadius: 8, border: "2px solid var(--green-500)" }}
                  />
                ) : (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                    Resolution pending on-ground clearance by Field Response Unit.
                  </div>
                )}
              </div>
            </div>

            {viewingPhotoIncident.signature && (
              <div style={{ marginTop: 14, background: "var(--bg-subtle)", padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-400)", marginBottom: 8 }}>
                  ✍️ Citizen Verified Digital Signature ({viewingPhotoIncident.reporter})
                </div>
                <img
                  src={viewingPhotoIncident.signature}
                  alt="Citizen Digital Signature"
                  style={{ maxHeight: 90, display: "block", background: "#0a0c0f", padding: 8, borderRadius: 8, border: "1px solid var(--border-subtle)" }}
                />
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                onClick={() => setViewingPhotoIncident(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUTY OFFICER ASSIGNMENT MODAL: PICK FROM REGISTERED FIELD OFFICERS */}
      {assigningIncident && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }}>
          <div className="eco-card" style={{ maxWidth: 530, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserCheck size={20} color="var(--green-400)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  Assign Work to Field Officer
                </h3>
              </div>
              <button
                onClick={() => setAssigningIncident(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 14, background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", padding: 12, borderRadius: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{assigningIncident.title}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
                {assigningIncident.address} • Severity: <strong>{assigningIncident.severity.toUpperCase()}</strong> • Depth: {assigningIncident.water_depth_cm} cm
              </div>
              {assigningIncident.signature && (
                <div style={{ marginTop: 4, color: "var(--green-400)", fontSize: 11, fontWeight: 600 }}>
                  ✍️ Digitally confirmed by citizen
                </div>
              )}
            </div>

            {/* Dropdown of Registered Field Personnel */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                Select Field Response Officer from Registered Personnel ({registeredOfficers.length} available)
              </label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="select-control"
                style={{ width: "100%", padding: "10px", fontSize: 13 }}
              >
                {registeredOfficers.length === 0 ? (
                  <option value="USR-002">Inspector S. Joshi (+91 9822011223) - Field Response Unit</option>
                ) : (
                  registeredOfficers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} (+91 {off.mobile}) — {off.title || "Field Officer"}
                    </option>
                  ))
                )}
              </select>
              <div style={{ fontSize: 11, color: "var(--green-400)", marginTop: 8, background: "rgba(16, 185, 129, 0.12)", padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                ✨ <strong>Registered Staff Queue:</strong> Shows all personnel who registered as Field Response Team (jis-jisne register kiya hai).
              </div>
            </div>

            {/* Optional Dispatch Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                Operational Instructions / Field Action Notes
              </label>
              <textarea
                className="input-control"
                rows={3}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="e.g. Deploy 120 HP suction pump, inspect storm culvert, and clear waterlogging. Upload after-photo proof once complete."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setAssigningIncident(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAssignment}
                onClick={handleConfirmAssignment}
                className="btn btn-primary btn-sm"
                style={{ background: "var(--teal-700)", borderColor: "var(--teal-700)", gap: 6, padding: "8px 16px", fontWeight: 700 }}
              >
                <Send size={15} />
                <span>{isSubmittingAssignment ? "Dispatching..." : "Confirm & Assign Work"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
