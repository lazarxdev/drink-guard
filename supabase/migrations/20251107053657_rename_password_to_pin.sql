/*
  # Rename password_hash to pin_hash

  1. Changes
    - Rename the `password_hash` column in `app_settings` table to `pin_hash`
    - This better reflects that the app now uses a 4-digit PIN instead of a password
  
  2. Notes
    - Existing password hashes will remain valid as PINs (they're both hashed the same way)
    - No data loss occurs during this rename operation
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE app_settings RENAME COLUMN password_hash TO pin_hash;
  END IF;
END $$;
