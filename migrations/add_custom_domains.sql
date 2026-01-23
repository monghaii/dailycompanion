-- Migration: Add Custom Domains Support
-- Created: 2026-01-23
-- Description: Allows coaches to connect custom domains to their landing pages

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  
  -- Domain information
  domain TEXT NOT NULL, -- e.g., 'mycoach.com'
  subdomain TEXT, -- e.g., 'coaching' if using 'coaching.mycompany.com'
  full_domain TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN subdomain IS NOT NULL THEN subdomain || '.' || domain
      ELSE domain
    END
  ) STORED,
  
  -- Verification status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verifying', 'verified', 'failed', 'disabled'
  verification_method TEXT DEFAULT 'dns', -- 'dns', 'txt', 'cname'
  
  -- Vercel integration
  vercel_domain_id TEXT, -- Vercel's domain ID
  vercel_configured BOOLEAN DEFAULT false,
  
  -- DNS records for verification
  expected_a_record TEXT, -- IP address to point to
  expected_cname_record TEXT, -- CNAME target if using subdomain
  txt_verification_code TEXT, -- Optional TXT record for verification
  
  -- Verification attempts
  last_verification_attempt TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  -- SSL status
  ssl_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'failed'
  ssl_issued_at TIMESTAMPTZ,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verifying', 'verified', 'failed', 'disabled')),
  CONSTRAINT valid_ssl_status CHECK (ssl_status IN ('pending', 'active', 'failed'))
);

-- Indexes
CREATE INDEX idx_custom_domains_coach_id ON custom_domains(coach_id);
CREATE INDEX idx_custom_domains_full_domain ON custom_domains(full_domain);
CREATE INDEX idx_custom_domains_status ON custom_domains(status);
CREATE UNIQUE INDEX idx_custom_domains_active_domain ON custom_domains(full_domain) WHERE is_active = true;

-- Add columns to coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS custom_domain_enabled BOOLEAN DEFAULT false;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS primary_domain TEXT; -- Points to custom_domains.full_domain

-- Create updated_at trigger for custom_domains
CREATE OR REPLACE FUNCTION update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domains_updated_at();

-- Comments
COMMENT ON TABLE custom_domains IS 'Stores custom domain configurations for coaches';
COMMENT ON COLUMN custom_domains.full_domain IS 'Auto-generated full domain (subdomain + domain or just domain)';
COMMENT ON COLUMN custom_domains.status IS 'Current verification status of the domain';
COMMENT ON COLUMN custom_domains.ssl_status IS 'SSL certificate status from Vercel';
