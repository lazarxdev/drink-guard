/*
  # Rename password_hash to pin_hash

  1. Changes
    - Rename `password_hash` column to `pin_hash` in `app_settings` table
    - This reflects the change from password-based auth to 4-digit PIN-based auth
  
  2. Notes
    - Existing password hashes will be preserved and continue to work
    - Users will need to re-authenticate with their existing password, which will verify against the renamed column
    - Data integrity is maintained throughout the migration
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
