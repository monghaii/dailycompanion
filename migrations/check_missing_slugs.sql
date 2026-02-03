-- Check which coaches are missing slugs
-- Run this first to see which coaches need fixing

SELECT 
  id,
  business_name,
  slug,
  is_active,
  profile_id,
  created_at
FROM coaches
WHERE slug IS NULL OR slug = ''
ORDER BY created_at DESC;

-- Count total affected coaches
SELECT COUNT(*) as coaches_missing_slug
FROM coaches
WHERE slug IS NULL OR slug = '';
