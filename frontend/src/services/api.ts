import {
  Zone,
  WeatherData,
  WeatherSummary,
  Shelter,
  Resource,
  Incident,
  Alert,
  Recommendation,
  EvacuationRoute,
  SimulationResult,
} from "../types";

const BACKEND_FALLBACK = "http://127.0.0.1:8000";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("ecoshield_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  let response: Response | null = null;
  // First attempt: relative path (via Vite proxy or same-origin deployment)
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    // Network or proxy failure, fall back below
  }

  // If first attempt returned 404 or failed entirely, fall back to direct backend on port 8000
  if (!response || response.status === 404) {
    try {
      const fallbackUrl = `${BACKEND_FALLBACK}${path}`;
      const directResponse = await fetch(fallbackUrl, { ...options, headers });
      if (directResponse.status !== 404) {
        response = directResponse;
      } else if (!response) {
        response = directResponse;
      }
    } catch {
      // keep original response if any
    }
  }

  if (!response) {
    throw new Error("Unable to connect to EcoShield backend. Please verify FastAPI is running on port 8000.");
  }

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return request<{ access_token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string, role: string) {
    return request<{ access_token: string; user: any; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  async loginOtp(mobile: string, otp: string) {
    return request<{ access_token: string; user: any; message: string }>("/api/auth/login-otp", {
      method: "POST",
      body: JSON.stringify({ mobile, otp }),
    });
  },

  async sendOtp(mobile: string) {
    return request<{ success: boolean; mobile: string; otp: string; message: string; gateway_sender?: string }>("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    });
  },

  async registerOtp(mobile: string, otp: string, name: string, role: string) {
    return request<{ access_token: string; user: any; message: string }>("/api/auth/register-otp", {
      method: "POST",
      body: JSON.stringify({ mobile, otp, name, role }),
    });
  },

  async getMe() {
    return request<{ user: any }>("/api/auth/me");
  },

  async getUsers(role?: string): Promise<any[]> {
    return request<any[]>(`/api/users${role && role !== "all" ? `?role=${role}` : ""}`);
  },

  // Zones
  async getZones(): Promise<Zone[]> {
    return request<Zone[]>("/api/zones");
  },

  async getZone(zoneId: string): Promise<Zone & { shelters: Shelter[]; resources: Resource[]; incidents: Incident[]; active_alerts: Alert[] }> {
    return request(`/api/zones/${zoneId}`);
  },

  // Weather
  async getWeatherSummary(refresh: boolean = false): Promise<WeatherSummary> {
    return request<WeatherSummary>(`/api/weather/summary${refresh ? "?refresh=true" : ""}`);
  },

  async getZoneWeather(zoneId: string, refresh: boolean = false): Promise<WeatherData> {
    return request<WeatherData>(`/api/weather/zone/${zoneId}${refresh ? "?refresh=true" : ""}`);
  },

  // Prediction
  async predictFloodRisk(input: {
    zone_id?: string;
    rainfall_mm_h: number;
    humidity_pct: number;
    temperature_c: number;
    drainage_score: number;
    previous_flood: number;
    elevation_m: number;
    population_density: number;
    soil_saturation: number;
  }) {
    return request<any>("/api/prediction/predict", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getPredictionMetadata() {
    return request<any>("/api/prediction/metadata");
  },

  // Incidents
  async getIncidents(params?: { zone_id?: string; severity?: string; status?: string; incident_type?: string }): Promise<Incident[]> {
    const q = new URLSearchParams();
    if (params?.zone_id) q.set("zone_id", params.zone_id);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.status) q.set("status", params.status);
    if (params?.incident_type) q.set("incident_type", params.incident_type);
    const qs = q.toString();
    return request<Incident[]>(`/api/incidents${qs ? `?${qs}` : ""}`);
  },

  async createIncident(incident: {
    zone_id: string;
    title: string;
    incident_type: string;
    severity: string;
    water_depth_cm: number;
    note?: string;
    lat: number;
    lon: number;
    address?: string;
    reporter?: string;
    signature?: string;
    photo_url?: string;
  }) {
    return request<any>("/api/incidents", {
      method: "POST",
      body: JSON.stringify(incident),
    });
  },

  async confirmIncident(
    incidentId: string,
    options?: { user_id?: string; user_name?: string; simulated_batch?: number }
  ) {
    return request<any>(`/api/incidents/${incidentId}/confirm`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  },

  async updateIncidentStatus(
    incidentId: string,
    status: string,
    photo_after?: string,
    notes?: string,
    assignment?: { assigned_to?: string; assigned_to_name?: string; assigned_to_mobile?: string }
  ) {
    return request<any>(`/api/incidents/${incidentId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, photo_after, notes, ...(assignment || {}) }),
    });
  },

  // Shelters
  async getShelters(zoneId?: string): Promise<Shelter[]> {
    return request<Shelter[]>(`/api/shelters${zoneId ? `?zone_id=${zoneId}` : ""}`);
  },

  // Routes
  async getEvacuationRoute(startLat: number, startLon: number, shelterId?: string, zoneId?: string): Promise<EvacuationRoute> {
    return request<EvacuationRoute>("/api/routes/evacuation", {
      method: "POST",
      body: JSON.stringify({
        start_lat: startLat,
        start_lon: startLon,
        shelter_id: shelterId,
        zone_id: zoneId,
      }),
    });
  },

  // Resources
  async getResources(params?: { zone_id?: string; status?: string; resource_type?: string }): Promise<Resource[]> {
    const q = new URLSearchParams();
    if (params?.zone_id) q.set("zone_id", params.zone_id);
    if (params?.status) q.set("status", params.status);
    if (params?.resource_type) q.set("resource_type", params.resource_type);
    const qs = q.toString();
    return request<Resource[]>(`/api/resources${qs ? `?${qs}` : ""}`);
  },

  async deployResource(
    resourceId: string,
    zoneId: string,
    notes?: string,
    operatorDetails?: { operator?: string; operator_mobile?: string; operator_user_id?: string }
  ) {
    return request<any>(`/api/resources/${resourceId}/deploy`, {
      method: "POST",
      body: JSON.stringify({ zone_id: zoneId, notes, ...(operatorDetails || {}) }),
    });
  },

  async recallResource(resourceId: string) {
    return request<any>(`/api/resources/${resourceId}/recall`, {
      method: "POST",
    });
  },

  async workDoneResource(resourceId: string, photo_after?: string, notes?: string) {
    return request<any>(`/api/resources/${resourceId}/work-done`, {
      method: "POST",
      body: JSON.stringify({ photo_after, notes }),
    });
  },

  // Alerts
  async getAlerts(params?: { zone_id?: string; severity?: string; status?: string }): Promise<Alert[]> {
    const q = new URLSearchParams();
    if (params?.zone_id) q.set("zone_id", params.zone_id);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return request<Alert[]>(`/api/alerts${qs ? `?${qs}` : ""}`);
  },

  async createAlert(alert: { title: string; severity: string; zone_id: string; action: string }) {
    return request<any>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(alert),
    });
  },

  async broadcastMunicipal(title?: string, action?: string) {
    return request<any>("/api/alerts/broadcast-municipal", {
      method: "POST",
      body: JSON.stringify({ title, action }),
    });
  },

  async acknowledgeAlert(alertId: string) {
    return request<any>(`/api/alerts/${alertId}/acknowledge`, { method: "POST" });
  },

  async escalateAlert(alertId: string) {
    return request<any>(`/api/alerts/${alertId}/escalate`, { method: "POST" });
  },

  async resolveAlert(alertId: string) {
    return request<any>(`/api/alerts/${alertId}/resolve`, { method: "POST" });
  },

  async dismissAlert(alertId: string) {
    return request<any>(`/api/alerts/${alertId}/dismiss`, { method: "POST" });
  },

  // Recommendations
  async getRecommendations(zoneId?: string): Promise<Recommendation[]> {
    return request<Recommendation[]>(`/api/recommendations${zoneId ? `?zone_id=${zoneId}` : ""}`);
  },

  // Simulation
  async runSimulation(zoneId: string, severity: string): Promise<SimulationResult> {
    return request<SimulationResult>("/api/simulation/rehearse", {
      method: "POST",
      body: JSON.stringify({ zone_id: zoneId, severity }),
    });
  },

  // Analytics
  async getAnalyticsSummary(): Promise<any> {
    return request<any>("/api/analytics/summary");
  },

  // Assistant
  async askAssistant(query: string, zoneId?: string) {
    return request<any>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ query, zone_id: zoneId }),
    });
  },

  // Dashboard
  async getDashboardSummary() {
    return request<any>("/api/dashboard/summary");
  },
};
