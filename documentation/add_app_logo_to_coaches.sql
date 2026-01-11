-- Add app_logo_url field to coach_configs for storing the app logo
-- This logo replaces the header title text in the user-side app

-- Note: Since branding is stored in the coach_configs.config JSONB field,
-- no schema changes are needed - the existing JSONB structure handles this.

-- The config.branding JSON path should include:
-- config -> branding:
-- {
--   "primary_color": "#7c3aed",
--   "background_color": "#f9fafb",
--   "app_logo_url": "https://..."
-- }

-- Update the column comment to document the new field
COMMENT ON COLUMN coach_configs.config IS 'JSONB field containing all customization settings including branding (primary_color, background_color, app_logo_url), header, focus_tab, awareness_tab, emotional_state_tab, and coach_tab configurations';
