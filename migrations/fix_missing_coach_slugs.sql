-- Fix missing slugs for manually promoted coaches
-- This generates URL-friendly slugs from business_name for any coach without a slug

-- Function to generate a slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update coaches with missing or null slugs
-- Generate slug from business_name and add a unique number if needed
WITH coaches_needing_slugs AS (
  SELECT 
    id,
    business_name,
    generate_slug(business_name) as base_slug
  FROM coaches
  WHERE slug IS NULL OR slug = ''
),
slug_conflicts AS (
  SELECT 
    cns.id,
    cns.business_name,
    cns.base_slug,
    ROW_NUMBER() OVER (PARTITION BY cns.base_slug ORDER BY cns.id) as conflict_num
  FROM coaches_needing_slugs cns
)
UPDATE coaches
SET 
  slug = CASE 
    WHEN sc.conflict_num = 1 THEN sc.base_slug
    ELSE sc.base_slug || '-' || sc.conflict_num
  END,
  updated_at = NOW()
FROM slug_conflicts sc
WHERE coaches.id = sc.id
  AND (coaches.slug IS NULL OR coaches.slug = '');

-- Show the updated coaches
SELECT 
  id,
  business_name,
  slug,
  CONCAT('https://dailycompanion.app/coach/', slug) as landing_page_url
FROM coaches
WHERE updated_at >= NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- Drop the helper function (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS generate_slug(TEXT);
