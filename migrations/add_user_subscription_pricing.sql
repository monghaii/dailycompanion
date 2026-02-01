-- Add user subscription pricing fields to coaches table

-- Note: user_monthly_price_cents and user_yearly_price_cents already exist
-- We just need to ensure they're set properly

-- Add default values if not set
UPDATE coaches 
SET user_monthly_price_cents = 2999 
WHERE user_monthly_price_cents IS NULL;

-- Add platform fee percentage to platform_settings if not exists
INSERT INTO platform_settings (key, value) VALUES 
  ('platform_fee_percentage', '20'::jsonb),
  ('platform_min_fee_cents', '200'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Update platform_fee_percentage to ensure it's correct
UPDATE platform_settings 
SET value = '20'::jsonb 
WHERE key = 'platform_fee_percentage';

-- Add minimum fee (whichever is greater: $2 or 20%)
UPDATE platform_settings 
SET value = '200'::jsonb 
WHERE key = 'platform_min_fee_cents';

COMMENT ON COLUMN coaches.user_monthly_price_cents IS 'Price in cents that end users pay per month for this coach subscription';
COMMENT ON COLUMN coaches.user_yearly_price_cents IS 'Price in cents that end users pay per year for this coach subscription';

-- Verify settings
SELECT key, value FROM platform_settings 
WHERE key IN ('platform_fee_percentage', 'platform_min_fee_cents');
