-- QUICK VERSION: Promote user to premium by email
-- Just replace the email and run this entire block

-- Set the user email here:
DO $$
DECLARE
  target_email TEXT := 'user@example.com';  -- ⬅️ CHANGE THIS
  target_user_id UUID;
  target_coach_id UUID;
BEGIN
  -- Get user ID and coach ID
  SELECT id, coach_id INTO target_user_id, target_coach_id
  FROM profiles
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', target_email;
    RETURN;
  END IF;

  -- Set test premium flag on user profile
  UPDATE profiles
  SET is_test_premium = TRUE
  WHERE id = target_user_id;

  -- Upsert subscription
  INSERT INTO user_subscriptions (
    user_id,
    coach_id,
    status,
    stripe_subscription_id,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    target_coach_id,
    'active',
    NULL,  -- No Stripe subscription for test accounts
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, coach_id) 
  DO UPDATE SET
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 year',
    updated_at = NOW();

  RAISE NOTICE '✅ User % promoted to TEST PREMIUM (is_test_premium flag set) until %', target_email, (NOW() + INTERVAL '1 year')::DATE;
END $$;

-- Verify the change
SELECT 
  p.email,
  p.first_name || ' ' || p.last_name as name,
  us.status,
  us.current_period_end::DATE as expires,
  c.business_name as coach
FROM profiles p
LEFT JOIN user_subscriptions us ON us.user_id = p.id
LEFT JOIN coaches c ON c.id = us.coach_id
WHERE p.email = 'user@example.com'  -- ⬅️ CHANGE THIS TOO
LIMIT 1;
