-- Add token usage tracking columns to profiles table
-- This tracks Claude API token consumption per user
-- Limit: 1,000,000 tokens per month

-- Add token_usage column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='token_usage') THEN
    ALTER TABLE profiles ADD COLUMN token_usage INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add token_usage_reset_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='token_usage_reset_date') THEN
    ALTER TABLE profiles ADD COLUMN token_usage_reset_date TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;
END $$;

-- Add token_limit column if it doesn't exist (default 1 million)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='token_limit') THEN
    ALTER TABLE profiles ADD COLUMN token_limit INTEGER DEFAULT 1000000 NOT NULL;
  END IF;
END $$;

-- Create index for faster token usage queries
CREATE INDEX IF NOT EXISTS idx_profiles_token_usage ON profiles(token_usage, token_usage_reset_date);

-- Optional: Create a function to check if user's tokens should be reset
CREATE OR REPLACE FUNCTION should_reset_token_usage(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_reset TIMESTAMPTZ;
  current_month_start TIMESTAMPTZ;
BEGIN
  SELECT token_usage_reset_date INTO last_reset
  FROM profiles
  WHERE id = user_id;
  
  -- Calculate start of current month
  current_month_start := DATE_TRUNC('month', NOW());
  
  -- If last reset was before current month, should reset
  RETURN last_reset < current_month_start;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a function to reset token usage
CREATE OR REPLACE FUNCTION reset_token_usage(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    token_usage = 0,
    token_usage_reset_date = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a function to add tokens and return remaining
CREATE OR REPLACE FUNCTION add_token_usage(user_id UUID, tokens_used INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_usage INTEGER;
  user_limit INTEGER;
  remaining INTEGER;
BEGIN
  -- Get current usage and limit
  SELECT token_usage, token_limit INTO current_usage, user_limit
  FROM profiles
  WHERE id = user_id;
  
  -- Update usage
  UPDATE profiles
  SET token_usage = token_usage + tokens_used
  WHERE id = user_id;
  
  -- Calculate remaining
  remaining := user_limit - (current_usage + tokens_used);
  
  RETURN remaining;
END;
$$ LANGUAGE plpgsql;

-- Comment the columns
COMMENT ON COLUMN profiles.token_usage IS 'Number of Claude API tokens consumed this month';
COMMENT ON COLUMN profiles.token_usage_reset_date IS 'Date when token usage was last reset (monthly)';
COMMENT ON COLUMN profiles.token_limit IS 'Maximum tokens allowed per month (default: 1,000,000)';

-- ============================================
-- AUTOMATIC RESET NOTES
-- ============================================

-- Token usage is automatically reset when users make API calls in a new month.
-- The chat API checks if token_usage_reset_date is in a previous month and resets it.
-- This approach works without requiring pg_cron or scheduled tasks.

-- Optional: If you want to manually reset all users' tokens (e.g., for testing):
-- UPDATE profiles SET token_usage = 0, token_usage_reset_date = NOW() WHERE token_usage > 0;

-- Optional: If you have pg_cron enabled (Supabase Enterprise), you can schedule automatic resets:
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'reset-monthly-token-usage',
  '1 0 1 * *',  -- 12:01 AM on the 1st of every month
  $$
  UPDATE profiles
  SET token_usage = 0, token_usage_reset_date = NOW()
  WHERE token_usage > 0;
  $$
);
*/
