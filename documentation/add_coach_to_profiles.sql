-- Add coach_id to profiles table
-- This links users to their coach so the app can load the coach's custom config

-- Add coach_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='coach_id') THEN
    ALTER TABLE profiles ADD COLUMN coach_id UUID NULL;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_coach_id_fkey'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_coach_id_fkey 
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster coach lookups
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON profiles(coach_id);

-- Add comment
COMMENT ON COLUMN profiles.coach_id IS 'Links user to their coach - used to load coach''s custom config for the user''s app experience';

-- Optional: Set coach_id for existing users based on subscriptions
-- This will link users to coaches they're subscribed to
-- Uncomment if needed:
/*
UPDATE profiles p
SET coach_id = us.coach_id
FROM user_subscriptions us
WHERE p.id = us.user_id 
  AND p.role = 'user'
  AND us.status = 'active'
  AND p.coach_id IS NULL;
*/
