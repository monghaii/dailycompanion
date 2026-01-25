-- Add setup fee tracking fields to coaches table

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS setup_fee_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS platform_subscription_price_id TEXT;

-- Add platform setting for Stripe price IDs
INSERT INTO platform_settings (key, value) VALUES 
  ('coach_setup_fee_price_id', '""'::jsonb),
  ('coach_monthly_subscription_price_id', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Comments for documentation
COMMENT ON COLUMN coaches.setup_fee_paid IS 'Whether coach paid the one-time setup fee';
COMMENT ON COLUMN coaches.setup_fee_paid_at IS 'Timestamp when setup fee was paid';
COMMENT ON COLUMN coaches.setup_fee_amount_cents IS 'Amount paid for setup fee (for historical record)';
COMMENT ON COLUMN coaches.stripe_customer_id IS 'Stripe customer ID for the coach (for platform subscriptions)';
COMMENT ON COLUMN coaches.platform_subscription_price_id IS 'The Stripe price ID used for this coach subscription';
