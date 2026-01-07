-- Link existing users to their coach
-- This is useful for testing or migrating existing users

-- Option 1: Link ALL users to a specific coach (replace 'your-coach-slug' with actual slug)
-- Uncomment and run this if you want to link all users to one coach:
/*
UPDATE profiles p
SET coach_id = c.id
FROM coaches c
WHERE c.slug = 'your-coach-slug'
  AND p.role = 'user'
  AND p.coach_id IS NULL;
*/

-- Option 2: Link users based on their active subscriptions
-- This will automatically link users who have active subscriptions:
UPDATE profiles p
SET coach_id = us.coach_id
FROM user_subscriptions us
WHERE p.id = us.user_id 
  AND p.role = 'user'
  AND us.status = 'active'
  AND p.coach_id IS NULL;

-- Option 3: Link a specific user by email to a coach by slug
-- Replace 'user@example.com' and 'coach-slug' with actual values:
/*
UPDATE profiles p
SET coach_id = c.id
FROM coaches c
WHERE p.email = 'user@example.com'
  AND c.slug = 'coach-slug';
*/

-- Verify the links were created:
SELECT 
  p.email as user_email,
  p.role,
  c.business_name as coach_name,
  c.slug as coach_slug,
  p.token_usage as current_tokens
FROM profiles p
LEFT JOIN coaches c ON p.coach_id = c.id
WHERE p.role = 'user'
ORDER BY p.created_at DESC;


