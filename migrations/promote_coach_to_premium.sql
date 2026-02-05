-- QUICK VERSION: Promote coach to premium (activate platform subscription)
-- This unlocks all coach dashboard features
-- Just replace the email and run this entire block

-- Set the coach email here:
DO $$
DECLARE
  target_email TEXT := 'coach@example.com';  -- ⬅️ CHANGE THIS
  target_coach_id UUID;
BEGIN
  -- Get coach ID from their profile
  SELECT c.id INTO target_coach_id
  FROM coaches c
  JOIN profiles p ON p.id = c.profile_id
  WHERE p.email = target_email;

  IF target_coach_id IS NULL THEN
    RAISE NOTICE 'Coach with email % not found', target_email;
    RETURN;
  END IF;

  -- Activate coach platform subscription
  UPDATE coaches
  SET 
    platform_subscription_status = 'active',
    platform_subscription_id = 'test_coach_sub_' || target_coach_id,
    is_active = true,
    setup_fee_paid = true,
    updated_at = NOW()
  WHERE id = target_coach_id;

  RAISE NOTICE '✅ Coach % promoted to premium - all features unlocked', target_email;
END $$;

-- Verify the change
SELECT 
  p.email,
  c.business_name,
  c.platform_subscription_status,
  c.setup_fee_paid,
  c.is_active,
  c.stripe_account_status
FROM coaches c
JOIN profiles p ON p.id = c.profile_id
WHERE p.email = 'coach@example.com'  -- ⬅️ CHANGE THIS TOO
LIMIT 1;
