-- Coach Sponsorships: Allow coaches to cover user subscriptions
-- The coach pays only the platform fee per sponsored user

-- Table to track per-coach, per-tier sponsorship Stripe subscriptions
CREATE TABLE IF NOT EXISTS coach_sponsorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  subscription_tier INTEGER NOT NULL CHECK (subscription_tier IN (2, 3)),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  quantity INTEGER DEFAULT 0,
  fee_per_user_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, subscription_tier)
);

-- Add sponsored_by_coach_id to user_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='user_subscriptions' AND column_name='sponsored_by_coach_id') THEN
    ALTER TABLE user_subscriptions ADD COLUMN sponsored_by_coach_id UUID REFERENCES coaches(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coach_sponsorships_coach ON coach_sponsorships(coach_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_sponsored ON user_subscriptions(sponsored_by_coach_id) WHERE sponsored_by_coach_id IS NOT NULL;
