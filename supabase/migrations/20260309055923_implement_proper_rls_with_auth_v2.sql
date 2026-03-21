/*
  # Implement Proper RLS with Authentication

  This migration fixes the RLS security vulnerabilities by implementing proper
  authentication-based policies.

  ## Changes

  1. **Drop Permissive Policies**
     - Remove policies with USING (true) and WITH CHECK (true)
     - These allowed unrestricted access to all data

  2. **Implement Auth-Based Policies**
     - Use auth.uid() to verify user identity server-side
     - Ensure users can only access their own data
     - Policies check that user_id matches auth.uid()

  3. **Security Improvements**
     - App now uses Supabase anonymous auth instead of client-generated UUIDs
     - Server validates user identity before allowing data access
     - Complete data isolation between users

  ## Tables Affected
  - `app_settings`: User settings with PIN hash and preferences
*/

-- Drop existing permissive policies on app_settings
DROP POLICY IF EXISTS "Users can read own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON app_settings;
DROP POLICY IF EXISTS "Anonymous users can read own settings" ON app_settings;
DROP POLICY IF EXISTS "Anonymous users can insert own settings" ON app_settings;
DROP POLICY IF EXISTS "Anonymous users can update own settings" ON app_settings;
DROP POLICY IF EXISTS "Anonymous users can delete own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON app_settings;

-- Create secure policies that verify user_id matches auth.uid()

-- SELECT Policy: Users can only read their own settings
CREATE POLICY "Users can read own settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to read their own settings too
CREATE POLICY "Anonymous users can read own settings"
  ON app_settings
  FOR SELECT
  TO anon
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only insert settings for their own user_id
CREATE POLICY "Users can insert own settings"
  ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert their own settings
CREATE POLICY "Anonymous users can insert own settings"
  ON app_settings
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own settings
CREATE POLICY "Users can update own settings"
  ON app_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to update their own settings
CREATE POLICY "Anonymous users can update own settings"
  ON app_settings
  FOR UPDATE
  TO anon
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own settings
CREATE POLICY "Users can delete own settings"
  ON app_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can delete own settings"
  ON app_settings
  FOR DELETE
  TO anon
  USING (auth.uid() = user_id);
