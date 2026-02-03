-- Diagnostic query to check specific coach
-- Replace 'iv-jaeger' with the actual slug from the URL

-- 1. Check if coach exists with this slug
SELECT 
  id,
  business_name,
  slug,
  is_active,
  profile_id,
  bio,
  tagline,
  landing_headline,
  landing_subheadline,
  landing_cta,
  logo_url,
  theme_color,
  user_monthly_price_cents,
  user_yearly_price_cents,
  created_at,
  updated_at
FROM coaches
WHERE slug = 'iv-jaeger';

-- 2. Check if similar slugs exist (in case of typo)
SELECT 
  id,
  business_name,
  slug,
  is_active
FROM coaches
WHERE slug LIKE '%jaeger%' OR business_name LIKE '%jaeger%';

-- 3. Check all coaches to see their slugs
SELECT 
  id,
  business_name,
  slug,
  is_active,
  created_at
FROM coaches
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if coach_landing_configs exists for this coach
SELECT 
  clc.id,
  clc.coach_id,
  c.business_name,
  c.slug,
  clc.config
FROM coach_landing_configs clc
JOIN coaches c ON c.id = clc.coach_id
WHERE c.slug = 'iv-jaeger';
