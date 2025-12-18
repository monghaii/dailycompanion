-- Coach Configurations Functions
-- Using existing coach_configs table with 'config' JSONB column

-- Create index for JSONB queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_coach_configs_data ON coach_configs USING gin(config);

-- Default configuration structure (example)
-- This is the shape of the config JSONB field:
/*
{
  "focus_tab": {
    "progress_bar": {
      "title": "Today's Focus",
      "subtitle": "Direct your energy intentionally"
    },
    "task_1": {
      "enabled": true,
      "title": "Morning Meditation",
      "subtitle": "Start your day centered",
      "audio_url": "https://..."
    },
    "task_2": {
      "enabled": true,
      "title": "Set Daily Intention",
      "subtitle": "What matters most today?"
    },
    "task_3": {
      "enabled": true,
      "title": "Evening Reflection",
      "subtitle": "Review your day"
    },
    "day_notes": {
      "title": "Day Notes",
      "subtitle": "Capture thoughts and reflections"
    }
  },
  "awareness_tab": {
    // Future customizations
  },
  "branding": {
    "primary_color": "#7c3aed",
    "logo_url": null
  }
}
*/

-- Function to get or create default config for a coach
CREATE OR REPLACE FUNCTION get_or_create_coach_config(p_coach_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
  v_default_config JSONB := '{
    "focus_tab": {
      "progress_bar": {
        "title": "Today''s Focus",
        "subtitle": "Direct your energy intentionally"
      },
      "task_1": {
        "enabled": true,
        "title": "Morning Meditation",
        "subtitle": "Start your day centered",
        "audio_url": null
      },
      "task_2": {
        "enabled": true,
        "title": "Set Daily Intention",
        "subtitle": "What matters most today?"
      },
      "task_3": {
        "enabled": true,
        "title": "Evening Reflection",
        "subtitle": "Review your day"
      },
      "day_notes": {
        "title": "Day Notes",
        "subtitle": "Capture thoughts and reflections"
      }
    },
    "branding": {
      "primary_color": "#7c3aed",
      "logo_url": null
    }
  }'::jsonb;
BEGIN
  -- Try to get existing config
  SELECT config INTO v_config
  FROM coach_configs
  WHERE coach_id = p_coach_id;
  
  -- If not found, create with default
  IF NOT FOUND THEN
    INSERT INTO coach_configs (coach_id, config)
    VALUES (p_coach_id, v_default_config)
    RETURNING config INTO v_config;
  END IF;
  
  RETURN v_config;
END;
$$ LANGUAGE plpgsql;

-- Function to update coach config
CREATE OR REPLACE FUNCTION update_coach_config(
  p_coach_id UUID,
  p_config_path TEXT[],
  p_config_value JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_updated_config JSONB;
BEGIN
  -- Update the specific path in the JSONB
  UPDATE coach_configs
  SET config = jsonb_set(config, p_config_path, p_config_value, true)
  WHERE coach_id = p_coach_id
  RETURNING config INTO v_updated_config;
  
  -- If no row exists, create one
  IF NOT FOUND THEN
    v_updated_config := get_or_create_coach_config(p_coach_id);
    
    UPDATE coach_configs
    SET config = jsonb_set(config, p_config_path, p_config_value, true)
    WHERE coach_id = p_coach_id
    RETURNING config INTO v_updated_config;
  END IF;
  
  RETURN v_updated_config;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE coach_configs IS 'Stores JSON configuration data for each coach''s customized app instance';
COMMENT ON COLUMN coach_configs.config IS 'JSONB field containing all customization settings for the coach''s app';
