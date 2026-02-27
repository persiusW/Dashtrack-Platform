-- Migration: 20260227184500_system_upgrade.sql
-- Description: Adds platform_settings, public campaign sharing columns, and organization paystack columns.

-- 1. Campaign Public Sharing
ALTER TABLE public.activations 
ADD COLUMN IF NOT EXISTS public_share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
ADD COLUMN IF NOT EXISTS public_share_password text,
ADD COLUMN IF NOT EXISTS is_public_shared boolean DEFAULT false;

-- 2. Organization Paystack Fields
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS paystack_customer_id text,
ADD COLUMN IF NOT EXISTS paystack_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';

-- 3. Platform Settings (Admin Control for pricing and limits)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name text NOT NULL UNIQUE,
  plan_key text NOT NULL UNIQUE, -- e.g 'starter', 'professional', 'enterprise'
  price_ghc integer NOT NULL,
  max_campaigns integer,
  max_locations_per_campaign integer,
  features jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for platform settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view platform settings to know current prices and limits
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can modify platform settings"
  ON public.platform_settings FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
  );

-- Insert Default Tiers (Matches constraints defined by user)
INSERT INTO public.platform_settings (tier_name, plan_key, price_ghc, max_campaigns, max_locations_per_campaign, features)
VALUES 
  ('Starter', 'starter', 5500, 1, 2, '["1 Active Campaign", "Up to 2 Locations (Zones)", "Unique QRs for Agents", "Real-time Dashboard"]'::jsonb),
  ('Professional', 'professional', 9600, 2, 4, '["2 Active Campaigns", "Up to 4 Locations each", "CSV Data Exports", "Auto Weekly Reports"]'::jsonb),
  ('Enterprise', 'enterprise', 15000, 4, 7, '["4 Active Campaigns", "Up to 7 Locations each", "Priority Email Support", "Public Shareable Stats"]'::jsonb)
ON CONFLICT (plan_key) DO NOTHING;
