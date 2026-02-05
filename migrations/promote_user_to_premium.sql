-- Script to promote a user to premium status for testing
-- Replace 'user@example.com' with the actual user email

-- Step 1: Find the user
SELECT 
  id,
  email,
  first_name,
  last_name,
  coach_id
FROM profiles
WHERE email = 'user@example.com';  -- Replace with actual email

-- Step 2: Check current subscription status
SELECT 
  us.id,
  us.user_id,
  us.coach_id,
  us.status,
  us.stripe_subscription_id,
  us.current_period_start,
  us.current_period_end,
  us.created_at
FROM user_subscriptions us
JOIN profiles p ON p.id = us.user_id
WHERE p.email = 'user@example.com';  -- Replace with actual email

-- Step 3: Promote user to premium (creates or updates subscription)
-- If user already has a subscription, this updates it
-- If not, you'll need to insert a new record
WITH user_info AS (
  SELECT id, coach_id 
  FROM profiles 
  WHERE email = 'user@example.com'  -- Replace with actual email
)
INSERT INTO user_subscriptions (
  user_id,
  coach_id,
  status,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  id,
  coach_id,
  'active',
  'test_sub_' || id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT,  -- Fake subscription ID
  NOW(),
  NOW() + INTERVAL '1 year',  -- Active for 1 year
  NOW(),
  NOW()
FROM user_info
ON CONFLICT (user_id, coach_id) 
DO UPDATE SET
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- Step 4: Verify the change
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  us.status,
  us.current_period_start,
  us.current_period_end,
  c.business_name as coach_name
FROM profiles p
LEFT JOIN user_subscriptions us ON us.user_id = p.id
LEFT JOIN coaches c ON c.id = us.coach_id
WHERE p.email = 'user@example.com';  -- Replace with actual email

-- Optional: If you need to remove premium status later
-- UPDATE user_subscriptions
-- SET status = 'canceled', updated_at = NOW()
-- FROM profiles p
-- WHERE user_subscriptions.user_id = p.id 
-- AND p.email = 'user@example.com';
