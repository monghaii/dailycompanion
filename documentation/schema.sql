-- Daily Companion Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLATFORM SETTINGS TABLE
-- ============================================
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform fee (20%)
INSERT INTO platform_settings (key, value) VALUES 
  ('platform_fee_percentage', '20'::jsonb),
  ('coach_monthly_price_cents', '5000'::jsonb),
  ('coach_yearly_price_cents', '50000'::jsonb);

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COACHES TABLE
-- ============================================
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  bio TEXT,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#6366f1',
  
  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_account_status TEXT DEFAULT 'pending' CHECK (stripe_account_status IN ('pending', 'active', 'restricted', 'disabled')),
  
  -- Coach's subscription to platform
  platform_subscription_status TEXT DEFAULT 'inactive' CHECK (platform_subscription_status IN ('inactive', 'active', 'past_due', 'canceled')),
  platform_subscription_id TEXT,
  platform_subscription_ends_at TIMESTAMPTZ,
  
  -- Pricing for end users (in cents)
  user_monthly_price_cents INTEGER DEFAULT 2999,
  user_yearly_price_cents INTEGER DEFAULT 29900,
  
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_coaches_slug ON coaches(slug);

-- ============================================
-- USER SUBSCRIPTIONS TABLE
-- (Users subscribing to coaches)
-- ============================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  
  -- Stripe subscription info
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing')),
  
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One subscription per user-coach pair
  UNIQUE(user_id, coach_id)
);

-- Index for lookups
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_coach ON user_subscriptions(coach_id);

-- ============================================
-- SESSIONS TABLE (for auth tokens)
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Enable RLS with NO policies (all access via service role)
-- ============================================
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER coaches_updated_at BEFORE UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

