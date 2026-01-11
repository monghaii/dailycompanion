-- Audio Library for Task 1 (Morning Practice)
-- Stores up to 30 audio files that rotate daily

-- The audio library is stored in the coach_configs.config JSONB field
-- under focus_tab -> audio_library and focus_tab -> current_day_index

-- Structure in coach_configs.config JSONB:
/*
{
  "focus_tab": {
    "audio_library": [
      {
        "id": 0,
        "audio_url": "https://...",
        "audio_path": "path/to/audio.mp3",
        "name": "Morning Meditation Day 1"
      },
      {
        "id": 1,
        "audio_url": "https://...",
        "audio_path": "path/to/audio2.mp3",
        "name": "Morning Meditation Day 2"
      },
      // ... up to 30 slots
    ],
    "current_day_index": 0,  // Which day is "today" (0-29)
    "library_start_date": "2024-01-01"  // Reference date for daily rotation
  }
}
*/

-- How it works:
-- 1. Coach uploads up to 30 audio files
-- 2. Coach sets which one is "today" (current_day_index)
-- 3. Each day, the system uses: (current_day_index + days_since_start) % total_audios
-- 4. This creates an automatic daily rotation through all uploaded files

-- No schema changes needed - existing JSONB structure handles this
COMMENT ON COLUMN coach_configs.config IS 'JSONB field containing all customization settings including focus_tab.audio_library (array of up to 30 audio files for daily rotation) and focus_tab.current_day_index (which audio is set as today)';
