/*
  # Enable Anonymous Authentication

  This migration enables anonymous authentication for the application,
  allowing users to authenticate without providing credentials.

  ## Changes

  1. **Enable Anonymous Sign-ins**
     - Updates auth configuration to allow anonymous authentication
     - Required for the app's security model

  ## Security Notes
  - Anonymous users are still authenticated with unique UUIDs
  - RLS policies enforce data isolation using auth.uid()
  - Each anonymous session is separate and secure
*/

-- Enable anonymous sign-ins
-- Note: This is typically done via Supabase Dashboard under Authentication > Providers
-- But we can also set it via SQL if the auth schema allows it

-- Check if we can update the auth config
DO $$
BEGIN
  -- Try to enable anonymous sign-ins via the internal auth config
  -- This may require additional permissions
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    UPDATE auth.config 
    SET value = 'true' 
    WHERE key = 'ENABLE_ANONYMOUS_SIGN_INS';
    
    IF NOT FOUND THEN
      INSERT INTO auth.config (key, value)
      VALUES ('ENABLE_ANONYMOUS_SIGN_INS', 'true')
      ON CONFLICT (key) DO UPDATE SET value = 'true';
    END IF;
  END IF;
END $$;
