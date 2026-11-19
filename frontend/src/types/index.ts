export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export interface Zone {
  id: string;
  name: string;
  display_name: string;
  lat: float;
  lon: float;
  elevation_m: number;
  drainage_score: number;
  population_density: number;
  previous_floods: number;
  description: string;
  risk_level: RiskLevel;
  bounds: number[][];
}

type float = number;

export interface WeatherData {
  zone_id?: string;
  zone_name?: string;
  lat?: number;
  lon?: number;
  temperature_c: number;
  humidity_percent: number;
  rainfall_last_hour_mm: number;
  wind_speed_kmh: number;
  weather_condition: string;
  pressure_hpa?: number;
  is_live_data: boolean;
  source: string;
  last_updated?: string;
}

export interface WeatherSummary {
  district: string;
  average_temperature_c: number;
  average_humidity_percent: number;
  peak_rainfall_last_hour_mm: number;
  is_live_data: boolean;
  source: string;
  cached_until_seconds: number;
  zones: WeatherData[];
  timestamp: string;
}

export interface Shelter {
  id: string;
  name: string;
  zone_id: string;
  zone_name?: string;
  lat: number;
  lon: number;
  capacity: number;
  occupancy: number;
  available_capacity?: number;
  occupancy_pct?: number;
  status: string;
  accessible: number;
  flood_exposure: string;
  contact: string;
  medical_support: number;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  zone_id: string;
  zone_name?: string;
  status: "Deployed" | "Standby" | "Maintenance";
  operator: string;
  operator_mobile?: string;
  operator_user_id?: string;
  capacity: string;
  photo_after?: string;
}

export interface Incident {
  id: string;
  zone_id: string;
  zone_name?: string;
  title: string;
  incident_type: string;
  severity: "low" | "moderate" | "high" | "critical";
  water_depth_cm: number;
  note?: string;
  lat: number;
  lon: number;
  address?: string;
  corroborations: number;
  status: "unverified" | "investigating" | "field_resolved" | "verified" | "resolved";
  reporter: string;
  signature?: string;
  confirmed_by?: string[];
  photo_before?: string;
  photo_after?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_mobile?: string;
  assigned_at?: string;
  resolved_at?: string;
  confidence_score?: number;
  created_at: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: "info" | "moderate" | "high" | "critical";
  zone_id: string;
  zone_name?: string;
  status: "active" | "acknowledged" | "escalated" | "resolved" | "dismissed";
  action: string;
  created_at: string;
  source: string;
}

export interface Recommendation {
  id: string;
  zone_id: string;
  zone_name: string;
  priority: string;
  category: string;
  title: string;
  detail: string;
  action: string;
  recommended_resource: string;
  status: string;
  created_at: string;
}

export interface EvacuationRoute {
  start: { lat: number; lon: number };
  shelter: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    capacity: number;
    available_capacity: number;
    status: string;
    contact: string;
  };
  distance_km: number;
  estimated_travel_time_min: number;
  flood_exposure: string;
  route_safety_status: string;
  recommended_transport: string;
  waypoints: number[][];
  turn_by_turn: string[];
}

export interface SimulationResult {
  simulation_id: string;
  is_simulation: boolean;
  disclaimer: string;
  zone: Zone;
  severity_selected: string;
  severity_profile: {
    label: string;
    added_rain: number;
    soil_sat_boost: number;
    description: string;
  };
  meteorological_inputs: {
    baseline_rainfall_mm_h: number;
    simulated_rainfall_mm_h: number;
    simulated_soil_saturation_pct: number;
  };
  before_after_comparison: {
    baseline: {
      risk_level: RiskLevel;
      probability: number;
      status: string;
    };
    simulated: {
      risk_level: RiskLevel;
      probability: number;
      status: string;
      recommended_action: string;
    };
  };
  impact_assessment: {
    estimated_exposed_population: number;
    inundation_depth_forecast_cm: number;
    critical_infrastructure_threatened: string[];
  };
  suggested_resources: Array<{
    type: string;
    quantity: number;
    purpose: string;
  }>;
  destination_shelter: {
    id: string;
    name: string;
    capacity: number;
    occupancy: number;
  };
  evacuation_route: EvacuationRoute;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  title: string;
  capabilities: string[];
  mobile?: string;
}
