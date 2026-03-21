/*
  # Add Onboarding Completed Field

  1. Changes
    - Add `onboarding_completed` boolean field to `app_settings` table
    - Default value is `false` for new users
    - Tracks whether user has completed the initial walkthrough

  2. Notes
    - Non-destructive migration using IF NOT EXISTS pattern
    - Existing records will have NULL which will be treated as false
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;
