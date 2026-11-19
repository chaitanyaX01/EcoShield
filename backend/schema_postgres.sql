-- EcoShield AI: PostgreSQL Production Schema
-- Pune Metropolitan Disaster Management Command Center

CREATE TABLE IF NOT EXISTS zones (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lon NUMERIC(9,6) NOT NULL,
    elevation_m NUMERIC(6,2) NOT NULL,
    drainage_score INT NOT NULL,
    population_density INT NOT NULL,
    previous_floods INT NOT NULL,
    description TEXT,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
    bounds_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shelters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone_id VARCHAR(50) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    lat NUMERIC(9,6) NOT NULL,
    lon NUMERIC(9,6) NOT NULL,
    capacity INT NOT NULL,
    occupancy INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Available',
    accessible SMALLINT NOT NULL DEFAULT 1,
    flood_exposure VARCHAR(50) NOT NULL DEFAULT 'Minimal',
    contact VARCHAR(50),
    medical_support SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    zone_id VARCHAR(50) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'Standby',
    operator VARCHAR(100),
    capacity VARCHAR(50),
    photo_after TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(50) PRIMARY KEY,
    zone_id VARCHAR(50) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'moderate',
    water_depth_cm INT NOT NULL DEFAULT 0,
    note TEXT,
    lat NUMERIC(9,6) NOT NULL,
    lon NUMERIC(9,6) NOT NULL,
    address TEXT,
    corroborations INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'unverified',
    reporter VARCHAR(100) DEFAULT 'Anonymous Citizen',
    photo_before TEXT,
    photo_after TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'critical',
    zone_id VARCHAR(50) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'active',
    action TEXT NOT NULL,
    target_audiences TEXT DEFAULT 'all', -- 'all', 'citizens', 'field_teams', 'resourcers'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) DEFAULT 'EcoShield Municipal Broadcast'
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL, -- 'admin' (Duty Commander), 'responder' (Field Team), 'resourcer', 'citizen'
    otp_hash VARCHAR(100),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid disaster spatial & status queries
CREATE INDEX IF NOT EXISTS idx_zones_risk ON zones(risk_level);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_zone ON incidents(zone_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
