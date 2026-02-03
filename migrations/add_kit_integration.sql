-- Add Kit (ConvertKit) integration fields to coaches table
-- This allows each coach to connect their own Kit account

DO $$ 
BEGIN
  -- Add kit_api_key (encrypted field)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_api_key') THEN
    ALTER TABLE coaches ADD COLUMN kit_api_key TEXT;
  END IF;
  
  -- Add kit_enabled flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_enabled') THEN
    ALTER TABLE coaches ADD COLUMN kit_enabled BOOLEAN DEFAULT false;
  END IF;
  
  -- Add kit_form_id (optional - specific form to add subscribers to)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_form_id') THEN
    ALTER TABLE coaches ADD COLUMN kit_form_id TEXT;
  END IF;
  
  -- Add kit_tags (JSON array of tags to apply)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_tags') THEN
    ALTER TABLE coaches ADD COLUMN kit_tags JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Add kit_last_sync timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_last_sync') THEN
    ALTER TABLE coaches ADD COLUMN kit_last_sync TIMESTAMPTZ;
  END IF;
  
  -- Add kit_sync_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_sync_status') THEN
    ALTER TABLE coaches ADD COLUMN kit_sync_status TEXT CHECK (kit_sync_status IN ('pending', 'success', 'error'));
  END IF;
  
  -- Add kit_error_message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='coaches' AND column_name='kit_error_message') THEN
    ALTER TABLE coaches ADD COLUMN kit_error_message TEXT;
  END IF;
END $$;

-- Add comment to explain encryption
COMMENT ON COLUMN coaches.kit_api_key IS 'Encrypted Kit API key - should be encrypted at application level before storage';
