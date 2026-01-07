-- Add landing page text fields to coaches table
-- Run this in Supabase SQL Editor

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS landing_headline TEXT,
ADD COLUMN IF NOT EXISTS landing_subheadline TEXT,
ADD COLUMN IF NOT EXISTS landing_cta TEXT;

-- Set default values for existing coaches
UPDATE coaches 
SET 
  tagline = COALESCE(tagline, 'Life & Wellness Coach'),
  landing_headline = COALESCE(landing_headline, 'Transform Your Life with Personalized Coaching'),
  landing_subheadline = COALESCE(landing_subheadline, 'Join others on their journey to growth and fulfillment'),
  landing_cta = COALESCE(landing_cta, 'Start Your Journey')
WHERE tagline IS NULL 
   OR landing_headline IS NULL 
   OR landing_subheadline IS NULL 
   OR landing_cta IS NULL;

