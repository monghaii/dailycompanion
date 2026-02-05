-- Add test account flag to override premium checks
-- This allows test accounts to bypass normal subscription validation

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_test_premium BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.is_test_premium IS 'Flag for test accounts that should bypass premium subscription checks. Use for testing/development only.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_test_premium 
ON profiles(is_test_premium) 
WHERE is_test_premium = TRUE;
