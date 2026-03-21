/*
  # Make pin_hash nullable for initial setup
  
  1. Changes
    - Make `pin_hash` column nullable in `app_settings` table
    - This allows users to set up their account without immediately requiring a PIN
    - The app will prompt users to create a PIN on first launch
  
  2. Security
    - RLS policies remain unchanged and continue to protect user data
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' 
    AND column_name = 'pin_hash'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE app_settings ALTER COLUMN pin_hash DROP NOT NULL;
  END IF;
END $$;
