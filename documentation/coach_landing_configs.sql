-- Coach Landing Page Configurations
-- This table stores landing page content and settings for each coach

CREATE TABLE IF NOT EXISTS coach_landing_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID UNIQUE NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for coach lookups
CREATE INDEX IF NOT EXISTS idx_coach_landing_configs_coach ON coach_landing_configs(coach_id);

-- Enable RLS
ALTER TABLE coach_landing_configs ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS coach_landing_configs_updated_at ON coach_landing_configs;
CREATE TRIGGER coach_landing_configs_updated_at 
  BEFORE UPDATE ON coach_landing_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Default configuration structure:
/*
{
  "hero": {
    "headline": "Transform Your Life with Personalized Coaching",
    "subheadline": "Join hundreds of others on their journey to growth and fulfillment",
    "cta_button_text": "Start Your Journey"
  },
  "coach_info": {
    "name": "Coach Name",
    "title": "Life & Wellness Coach",
    "bio": "Brief bio about the coach and their approach",
    "photo_url": null
  },
  "pricing": {
    "monthly_highlight": true,
    "show_yearly": true,
    "features": [
      "Daily guided practices",
      "AI-powered coaching",
      "Progress tracking",
      "Unlimited access"
    ]
  },
  "testimonials": [
    {
      "name": "Client Name",
      "text": "This program changed my life...",
      "role": "Professional Title"
    }
  ],
  "branding": {
    "primary_color": "#7c3aed",
    "background_style": "gradient"
  }
}
*/

-- Function to get or create default landing config for a coach
CREATE OR REPLACE FUNCTION get_or_create_landing_config(p_coach_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
  v_coach_name TEXT;
  v_default_config JSONB;
BEGIN
  -- Get coach business name
  SELECT business_name INTO v_coach_name
  FROM coaches
  WHERE id = p_coach_id;
  
  -- Build default config with coach name
  v_default_config := jsonb_build_object(
    'hero', jsonb_build_object(
      'headline', 'Transform Your Life with Personalized Coaching',
      'subheadline', 'Join others on their journey to growth and fulfillment',
      'cta_button_text', 'Start Your Journey'
    ),
    'coach_info', jsonb_build_object(
      'name', COALESCE(v_coach_name, 'Your Coach'),
      'title', 'Life & Wellness Coach',
      'bio', 'Dedicated to helping you achieve your goals and live your best life.',
      'photo_url', NULL
    ),
    'pricing', jsonb_build_object(
      'monthly_highlight', true,
      'show_yearly', true,
      'features', jsonb_build_array(
        'Daily guided practices',
        'AI-powered coaching conversations',
        'Progress tracking & insights',
        'Unlimited access to all features'
      )
    ),
    'testimonials', jsonb_build_array(),
    'branding', jsonb_build_object(
      'primary_color', '#7c3aed',
      'background_style', 'gradient'
    )
  );
  
  -- Try to get existing config
  SELECT config INTO v_config
  FROM coach_landing_configs
  WHERE coach_id = p_coach_id;
  
  -- If not found, create with default
  IF NOT FOUND THEN
    INSERT INTO coach_landing_configs (coach_id, config)
    VALUES (p_coach_id, v_default_config)
    RETURNING config INTO v_config;
  END IF;
  
  RETURN v_config;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE coach_landing_configs IS 'Stores landing page configuration for each coach''s public signup page';
COMMENT ON COLUMN coach_landing_configs.config IS 'JSONB field containing all landing page content and settings';

