-- User Favorites table
-- Supports favoriting different types of content (audio, resources, etc.)
-- Uses item_identifier (stable storage path) instead of array index

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('daily_practice_audio')),
  item_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, item_type, item_identifier)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_type ON user_favorites(user_id, item_type);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
