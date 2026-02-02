-- Update platform settings with NEW Stripe Account Price IDs
-- Run this in Supabase SQL Editor

-- Update Setup Fee Price ID ($500 one-time)
UPDATE platform_settings 
SET value = '"price_1SwSC9IJGviQfs9b4vIe3RV0"'::jsonb 
WHERE key = 'coach_setup_fee_price_id';

-- Update Monthly Subscription Price ID ($50/month)
UPDATE platform_settings 
SET value = '"price_1SwSDFIJGviQfs9bPLYYcFLq"'::jsonb 
WHERE key = 'coach_monthly_subscription_price_id';

-- Verify the settings were updated correctly
SELECT key, value FROM platform_settings 
WHERE key IN ('coach_setup_fee_price_id', 'coach_monthly_subscription_price_id');
