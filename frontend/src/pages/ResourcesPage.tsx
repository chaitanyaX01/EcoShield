import React, { useEffect, useState } from "react";
import {
  Truck,
  RotateCcw,
  Send,
  CheckCircle,
  AlertTriangle,
  Camera,
  UploadCloud,
  Check,
  X,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { api } from "../services/api";
import { Resource, Zone } from "../types";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { CameraCaptureModal } from "../components/common/CameraCaptureModal";

export const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || "admin";
  const isDutyCommander = userRole === "admin" || userRole === "sysadmin";

  const [resources, setResources] = useState<Resource[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Deploy Modal (Duty Commander only)
  const [deployModalOpen, setDeployModalOpen] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string>("sinhagad_rd");
  const [deployNotes, setDeployNotes] = useState<string>("");
  const [deploying, setDeploying] = useState<boolean>(false);
  const [registeredResourcers, setRegisteredResourcers] = useState<any[]>([]);
  const [selectedResourcerId, setSelectedResourcerId] = useState<string>("");

  // Work Done Modal (Field Response / Resourcer)
  const [workDoneModalOpen, setWorkDoneModalOpen] = useState<boolean>(false);
  const [workDoneResource, setWorkDoneResource] = useState<Resource | null>(null);
  const [workDonePhoto, setWorkDonePhoto] = useState<string | null>(null);
  const [workDoneNotes, setWorkDoneNotes] = useState<string>("");
  const [submittingWorkDone, setSubmittingWorkDone] = useState<boolean>(false);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);

  // View Photo Modal
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const loadResources = async () => {
    setLoading(true);
    try {
      const [rList, zList, resUsers] = await Promise.all([
        api.getResources(),
        api.getZones(),
        api.getUsers("resourcer").catch(() => []),
      ]);
      setResources(rList);
      setZones(zList);
      if (resUsers && resUsers.length > 0) {
        setRegisteredResourcers(resUsers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const openDeployModal = (res: Resource) => {
    setSelectedResource(res);
    setTargetZoneId(res.zone_id || "sinhagad_rd");
    setDeployNotes("");
    if (res.operator_user_id) {
      setSelectedResourcerId(res.operator_user_id);
    } else if (registeredResourcers.length > 0) {
      setSelectedResourcerId(registeredResourcers[0].id);
    }
    setDeployModalOpen(true);
  };

  const handleConfirmDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    setDeploying(true);
    try {
      const resourcer = registeredResourcers.find((r) => r.id === selectedResourcerId);
      await api.deployResource(
        selectedResource.id,
        targetZoneId,
        deployNotes || undefined,
        resourcer
          ? {
              operator: resourcer.name,
              operator_mobile: resourcer.mobile,
              operator_user_id: resourcer.id,
            }
          : undefined
      );
      setDeployModalOpen(false);
      loadResources();
    } catch (err: any) {
      alert("Failed to deploy resource: " + err.message);
    } finally {
      setDeploying(false);
    }
  };

  const handleRecall = async (res: Resource) => {
    if (!confirm(`Reassign ${res.name} back to Central Depot Standby?`)) return;
    try {
      await api.recallResource(res.id);
      loadResources();
    } catch (err: any) {
      alert("Failed to recall resource: " + err.message);
    }
  };

  const openWorkDoneModal = (res: Resource) => {
    setWorkDoneResource(res);
    setWorkDonePhoto(null);
    setWorkDoneNotes("");
    setWorkDoneModalOpen(true);
  };

  const handleWorkDonePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkDonePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmWorkDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDoneResource) return;

    setSubmittingWorkDone(true);
    try {
      const finalPhoto = workDonePhoto || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f0fdf4"/><text x="50%" y="45%" text-anchor="middle" fill="%23166534" font-weight="bold" font-family="sans-serif" font-size="14">MISSION COMPLETED</text><text x="50%" y="60%" text-anchor="middle" fill="%2315803d" font-family="sans-serif" font-size="11">Equipment returned to Standby</text></svg>`;

      await api.workDoneResource(workDoneResource.id, finalPhoto, workDoneNotes || "Dewatering / rescue mission successfully accomplished.");
      setWorkDoneModalOpen(false);
      loadResources();
    } catch (err: any) {
      alert("Failed to complete work: " + err.message);
    } finally {
      setSubmittingWorkDone(false);
    }
  };

  const deployedCount = resources.filter((r) => r.status === "Deployed").length;
  const standbyCount = resources.filter((r) => r.status === "Standby").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Logistics & Tactical Deployment
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            Emergency Disaster Response Resources
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Real-time tracking of dewatering pumps, NDRF rescue boats, ambulances, and mobile gensets.
          </p>
        </div>

        {/* Readiness Pill */}
        <div style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-medium)",
          padding: "8px 14px",
          borderRadius: 8,
          fontSize: 12,
          display: "flex",
          gap: 16
        }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Deployed in Field: </span>
            <strong style={{ color: "var(--teal-800)" }}>{deployedCount}</strong>
          </div>
          <div style={{ borderLeft: "1px solid var(--border-medium)", paddingLeft: 16 }}>
            <span style={{ color: "var(--text-muted)" }}>Standby Depot: </span>
            <strong style={{ color: "#10b981" }}>{standbyCount}</strong>
          </div>
        </div>
      </div>

      {/* Role Authority Protocol Notice */}
      <div style={{
        background: isDutyCommander ? "var(--teal-50)" : "var(--bg-subtle)",
        border: `1px solid ${isDutyCommander ? "var(--teal-200)" : "var(--border-subtle)"}`,
        padding: "10px 14px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isDutyCommander ? <ShieldCheck size={18} color="var(--teal-700)" /> : <UserCheck size={18} color="var(--teal-700)" />}
          <span>
            {isDutyCommander ? (
              <strong>Duty Commander Authority:</strong>
            ) : (
              <strong>Field Response & Resourcer Interface:</strong>
            )}
            {" "}
            {isDutyCommander
              ? "You have exclusive authority to Deploy and Dispatch emergency equipment across Pune zones."
              : "Field teams update mission status by marking 'Work Done' and uploading photo verification upon task completion."}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-800)", textTransform: "uppercase" }}>
          {isDutyCommander ? "Deploy Authority Active" : "Work Done / Completion Mode"}
        </span>
      </div>

      {/* Resource Inventory Table */}
      <div className="eco-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="eco-card-title">
            <Truck size={16} color="var(--teal-700)" />
            Active Fleet & Equipment Inventory ({resources.length} Assets)
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Authorized PMC & NDRF Assets
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-medium)" }}>
                <th style={{ padding: "10px 14px" }}>Asset Identifier (Real Type)</th>
                <th style={{ padding: "10px 14px" }}>Equipment Class</th>
                <th style={{ padding: "10px 14px" }}>Operating Agency</th>
                <th style={{ padding: "10px 14px" }}>Rated Capacity</th>
                <th style={{ padding: "10px 14px" }}>Assigned Zone</th>
                <th style={{ padding: "10px 14px" }}>Status</th>
                <th style={{ padding: "10px 14px" }}>Completion Photo</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Authorized Action</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => (
                <tr key={res.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--teal-800)" }}>
                      {res.id}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginTop: 2 }}>
                      {res.name}
                    </div>
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-subtle)",
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                      color: "var(--teal-800)"
                    }}>
                      {res.type}
                    </span>
                  </td>

                  <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                    {res.operator}
                  </td>

                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {res.capacity}
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {res.zone_name || res.zone_id}
                    </span>
                  </td>

                  <td style={{ padding: "12px 14px" }}>
                    <StatusBadge type="resource" value={res.status} size="sm" />
                  </td>

                  {/* Completion Photo */}
                  <td style={{ padding: "12px 14px" }}>
                    {res.photo_after ? (
                      <button
                        type="button"
                        onClick={() => setViewingPhoto(res.photo_after!)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 8px", fontSize: 11, gap: 4 }}
                        title="View photo proof submitted by field team"
                      >
                        <Camera size={12} color="var(--teal-700)" />
                        <span>View Photo</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Authorized Action */}
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    {isDutyCommander ? (
                      /* DUTY COMMANDER ONLY HAS DEPLOY & RECALL */
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        {res.status === "Standby" ? (
                          <button
                            onClick={() => openDeployModal(res)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "4px 10px", fontSize: 11, gap: 4 }}
                          >
                            <Send size={11} />
                            <span>Deploy</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openDeployModal(res)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              title="Re-deploy to another zone"
                            >
                              Reassign
                            </button>
                            <button
                              onClick={() => handleRecall(res)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "4px 8px", fontSize: 11, color: "var(--text-muted)" }}
                              title="Recall to depot standby"
                            >
                              <RotateCcw size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      /* FIELD RESPONSE UNIT & RESOURCERS HAVE WORK DONE OPTION */
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        {res.status === "Deployed" ? (
                          <button
                            onClick={() => openWorkDoneModal(res)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "4px 10px", fontSize: 11, background: "#059669", borderColor: "#059669", gap: 4 }}
                            title="Field Response: Mark mission accomplished & upload photo"
                          >
                            <Check size={12} />
                            <span>Work Done</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            On Standby
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment Modal (Duty Commander Only) */}
      {deployModalOpen && selectedResource && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: 20
        }}>
          <div className="eco-card" style={{ maxWidth: 440, width: "100%", padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Duty Commander: Dispatch Emergency Asset
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Mobilize <strong>{selectedResource.id}</strong> ({selectedResource.name}) to a targeted flood catchment.
            </p>

            <form onSubmit={handleConfirmDeploy} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Destination Catchment Zone *
                </label>
                <select
                  value={targetZoneId}
                  onChange={(e) => setTargetZoneId(e.target.value)}
                  className="select-control"
                  required
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {z.display_name} ({z.risk_level} Risk)
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Registered Resourcer / Operator */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Assign Equipment Resourcer ({registeredResourcers.length} registered on duty)
                </label>
                <select
                  value={selectedResourcerId}
                  onChange={(e) => setSelectedResourcerId(e.target.value)}
                  className="select-control"
                  style={{ width: "100%" }}
                >
                  <option value="">Default Unit / Dedicated Crew ({selectedResource.operator})</option>
                  {registeredResourcers.map((resourcer) => (
                    <option key={resourcer.id} value={resourcer.id}>
                      {resourcer.name} (+91 {resourcer.mobile}) — Equipment Resourcer
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "var(--green-400)", marginTop: 6, background: "rgba(16, 185, 129, 0.1)", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  ✨ Shows personnel who created accounts as Equipment Resourcers (jis-jisne register kiya hai).
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Dispatch Directives / Tactical Notes
                </label>
                <textarea
                  rows={3}
                  className="input-control"
                  placeholder="e.g. Position dewatering pump at Katraj Lake culvert spillway to prevent arterial backflow."
                  value={deployNotes}
                  onChange={(e) => setDeployNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setDeployModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deploying}
                  className="btn btn-primary btn-sm"
                >
                  {deploying ? "Issuing Dispatch Order..." : "Confirm & Mobilize Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Done Modal (Field Response & Resourcer) */}
      {workDoneModalOpen && workDoneResource && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: 20
        }}>
          <div className="eco-card" style={{ maxWidth: 460, width: "100%", padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Field Response: Mark Work Done
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Report completion of task for asset <strong>{workDoneResource.id}</strong> ({workDoneResource.name}).
            </p>

            <form onSubmit={handleConfirmWorkDone} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Photo Upload / Live Camera */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Photo After Work Done (Proof of Completion)
                </label>

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
                      onChange={handleWorkDonePhotoUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {workDonePhoto ? (
                  <div style={{ marginTop: 8, padding: 10, background: "var(--teal-50)", borderRadius: 8, border: "1px solid var(--teal-200)" }}>
                    <img
                      src={workDonePhoto}
                      alt="Work done proof"
                      style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 6, border: "2px solid var(--teal-600)" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-800)" }}>
                        ✓ Work completion proof attached
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
                          onClick={() => setWorkDonePhoto(null)}
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
                    Live photo captures proof of unblocked storm drain, deployed pump, or completed rescue.
                  </div>
                )}

                <CameraCaptureModal
                  isOpen={cameraModalOpen}
                  onClose={() => setCameraModalOpen(false)}
                  onCapture={(photo) => setWorkDonePhoto(photo)}
                  title={`Field Response: Snap Work Done Proof (${workDoneResource.id})`}
                />
              </div>

              {/* Completion Notes */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Work Summary / Completion Notes
                </label>
                <textarea
                  rows={2}
                  className="input-control"
                  placeholder="e.g. Pumped out 50cm water from underpass. Flow normalized. Asset returned to Standby."
                  value={workDoneNotes}
                  onChange={(e) => setWorkDoneNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setWorkDoneModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWorkDone}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#059669", borderColor: "#059669" }}
                >
                  {submittingWorkDone ? "Saving Completion Proof..." : "Confirm Work Done & Return to Standby"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Photo Modal */}
      {viewingPhoto && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          padding: 20
        }}>
          <div className="eco-card" style={{ maxWidth: 500, width: "100%", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Field Work Completion Proof</div>
              <button onClick={() => setViewingPhoto(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <img src={viewingPhoto} alt="Work done proof" style={{ width: "100%", maxHeight: 350, objectFit: "contain", borderRadius: 6 }} />
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button onClick={() => setViewingPhoto(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
