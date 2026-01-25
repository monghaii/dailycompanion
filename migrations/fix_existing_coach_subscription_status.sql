-- Check the subscription status for the coach account
-- Run this in Supabase SQL Editor

SELECT 
  c.id,
  c.business_name,
  c.platform_subscription_status,
  c.platform_subscription_id,
  c.setup_fee_paid,
  c.is_active,
  c.stripe_customer_id,
  p.email
FROM coaches c
JOIN profiles p ON c.profile_id = p.id
WHERE p.email = 'hello@twinleaf.studio';

-- Fix the subscription status to inactive
UPDATE coaches 
SET 
  platform_subscription_status = 'inactive',
  is_active = false,
  platform_subscription_id = NULL,
  stripe_customer_id = NULL,
  setup_fee_paid = false
WHERE profile_id = (
  SELECT id FROM profiles WHERE email = 'hello@twinleaf.studio'
);

-- Verify the update
SELECT 
  c.business_name,
  c.platform_subscription_status,
  c.is_active,
  p.email
FROM coaches c
JOIN profiles p ON c.profile_id = p.id
WHERE p.email = 'hello@twinleaf.studio';
