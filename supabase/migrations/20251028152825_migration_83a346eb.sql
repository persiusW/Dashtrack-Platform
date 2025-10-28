-- Migration 1: Core schema setup
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Organizations table (no organization_id FK, this is the root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'starter', 'professional', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_name ON organizations(name);

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('admin','client_manager','zone_supervisor','external_agent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_org_role ON users(organization_id, role);

-- Activations table
CREATE TABLE activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'single' CHECK(type IN ('single','multi')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK(status IN('draft','live','paused','ended')),
  default_landing_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activations_org_status_start ON activations(organization_id, status, start_at);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT TRUE,
  public_stats_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_token ON agents(public_stats_token);

-- Tracked links table (must be created before zones for FK reference)
CREATE TABLE tracked_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
  zone_id UUID NULL,
  agent_id UUID NULL REFERENCES agents(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  destination_strategy TEXT DEFAULT 'smart' CHECK(destination_strategy IN('single','smart')),
  single_url TEXT NULL,
  ios_url TEXT NULL,
  android_url TEXT NULL,
  fallback_url TEXT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tracked_links_org ON tracked_links(organization_id);
CREATE INDEX idx_tracked_links_activation ON tracked_links(activation_id);
CREATE INDEX idx_tracked_links_zone ON tracked_links(zone_id);
CREATE INDEX idx_tracked_links_agent ON tracked_links(agent_id);
CREATE INDEX idx_tracked_links_slug ON tracked_links(slug);

-- Zones table (references tracked_links for stand link)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  zone_stand_link_id UUID NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK constraint after tracked_links exists
ALTER TABLE zones
  ADD CONSTRAINT zones_stand_link_fk FOREIGN KEY (zone_stand_link_id) 
  REFERENCES tracked_links(id) ON DELETE SET NULL;

-- Add FK to tracked_links for zone_id now that zones exists
ALTER TABLE tracked_links
  ADD CONSTRAINT tracked_links_zone_fk FOREIGN KEY (zone_id) 
  REFERENCES zones(id) ON DELETE SET NULL;

CREATE INDEX idx_zones_activation ON zones(activation_id);
CREATE INDEX idx_zones_name ON zones(name);

-- Zone agents junction table
CREATE TABLE zone_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, agent_id)
);

CREATE INDEX idx_zone_agents_zone ON zone_agents(zone_id);
CREATE INDEX idx_zone_agents_agent ON zone_agents(agent_id);

-- Clicks table (high volume, uses BIGSERIAL)
CREATE TABLE clicks (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL,
  activation_id UUID NOT NULL,
  zone_id UUID NULL,
  agent_id UUID NULL,
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  ip INET,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clicks_org ON clicks(organization_id);
CREATE INDEX idx_clicks_activation ON clicks(activation_id);
CREATE INDEX idx_clicks_zone ON clicks(zone_id);
CREATE INDEX idx_clicks_agent ON clicks(agent_id);
CREATE INDEX idx_clicks_link ON clicks(tracked_link_id);
CREATE INDEX idx_clicks_created_desc ON clicks(created_at DESC);

-- Daily metrics table
CREATE TABLE daily_metrics (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL,
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INT DEFAULT 0,
  uniques INT DEFAULT 0,
  valid_clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tracked_link_id, date)
);

CREATE INDEX idx_daily_metrics_org ON daily_metrics(organization_id);
CREATE INDEX idx_daily_metrics_link_date ON daily_metrics(tracked_link_id, date);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables that have updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activations_updated_at BEFORE UPDATE ON activations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zone_agents_updated_at BEFORE UPDATE ON zone_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracked_links_updated_at BEFORE UPDATE ON tracked_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();