-- Update user subscription pricing to $19.99/month standard
-- Platform takes $7, coach gets $12.99

-- Set default user monthly price to $19.99 for all coaches
UPDATE coaches 
SET user_monthly_price_cents = 1999 
WHERE user_monthly_price_cents IS NULL OR user_monthly_price_cents != 1999;

-- Update platform fee settings
-- Platform takes $7 flat fee (not percentage)
UPDATE platform_settings 
SET value = '700'::jsonb 
WHERE key = 'platform_flat_fee_cents';

-- Add flat fee setting if it doesn't exist
INSERT INTO platform_settings (key, value) VALUES 
  ('platform_flat_fee_cents', '700'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = '700'::jsonb;

-- Verify settings
SELECT * FROM coaches LIMIT 5;
SELECT key, value FROM platform_settings WHERE key = 'platform_flat_fee_cents';
