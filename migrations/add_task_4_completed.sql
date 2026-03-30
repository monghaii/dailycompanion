-- Add task_4_completed column to daily_user_entries
-- This enables Day Notes to count toward focus progress (4/4 instead of 3/3)
ALTER TABLE daily_user_entries
  ADD COLUMN IF NOT EXISTS task_4_completed BOOLEAN DEFAULT false;
