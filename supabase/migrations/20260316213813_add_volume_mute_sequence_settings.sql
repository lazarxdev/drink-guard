/*
  # Add Volume Mute Sequence and Grace Period Settings

  ## Overview
  This migration adds volume button mute sequence functionality and grace period settings to the app_settings table.

  ## Changes Made
  
  ### New Columns Added to app_settings Table
  1. **volume_mute_enabled** (boolean)
     - Controls whether the volume mute feature is active
     - Default: true (feature enabled by default)
     - Allows users to bypass grace period by entering volume sequence
  
  2. **volume_mute_sequence** (text, nullable)
     - Stores the user's custom volume button pattern
     - Format: JSON string array like ["up", "up", "down", "up"]
     - Null if not configured yet
     - Used to validate volume button presses during grace period
  
  3. **grace_period_seconds** (integer)
     - Duration in seconds before alarm triggers after motion detection
     - Default: 3 seconds
     - Range: 2-4 seconds (validated via check constraint)
     - Gives user time to enter volume sequence when picking up phone
  
  ## Security Considerations
  - Volume sequence is stored as text (pattern only, no sensitive data)
  - RLS policies already protect user settings
  - Grace period range is constrained to prevent abuse
  
  ## Important Notes
  - This enables users to distinguish between authorized and unauthorized phone movement
  - When motion is detected, user has grace_period_seconds to enter volume_mute_sequence
  - If correct sequence entered, alarm is silenced and PIN entry required
  - If sequence not entered or incorrect, full alarm triggers immediately
*/

-- Add volume mute sequence and grace period columns to app_settings table
DO $$
BEGIN
  -- Add volume_mute_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'volume_mute_enabled'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN volume_mute_enabled boolean DEFAULT true;
  END IF;

  -- Add volume_mute_sequence column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'volume_mute_sequence'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN volume_mute_sequence text;
  END IF;

  -- Add grace_period_seconds column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'grace_period_seconds'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN grace_period_seconds integer DEFAULT 3;
  END IF;
END $$;

-- Add check constraint for grace period range (2-4 seconds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'grace_period_range'
  ) THEN
    ALTER TABLE app_settings
    ADD CONSTRAINT grace_period_range
    CHECK (grace_period_seconds >= 2 AND grace_period_seconds <= 4);
  END IF;
END $$;
