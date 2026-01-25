-- Update platform settings with actual Stripe Price IDs
-- Run this in Supabase SQL Editor

UPDATE platform_settings 
SET value = '"price_1StHMtIKp421Myt9JASq47Me"'::jsonb 
WHERE key = 'coach_setup_fee_price_id';

UPDATE platform_settings 
SET value = '"price_1StHNlIKp421Myt9xYd6zymA"'::jsonb 
WHERE key = 'coach_monthly_subscription_price_id';

-- Verify the settings were updated correctly
SELECT key, value FROM platform_settings 
WHERE key IN ('coach_setup_fee_price_id', 'coach_monthly_subscription_price_id');
