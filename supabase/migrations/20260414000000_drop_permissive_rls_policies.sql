/*
  # Drop Permissive RLS Policies

  The migration 20251107022750 created "Allow all ..." policies with USING(true).
  Later migrations (20260309055923, 20260309055952) added proper auth.uid()
  policies but failed to drop the old ones because they referenced different
  policy names. Since PostgreSQL ORs policies, the permissive policies
  override the secure ones.

  This migration drops the leftover permissive policies so only the
  auth.uid()-based policies remain.

  ## Tables Affected
  - app_settings
  - tampering_events
*/

-- Drop the permissive "Allow all" policies from 20251107022750
DROP POLICY IF EXISTS "Allow all select on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow all insert on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow all update on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow all delete on app_settings" ON app_settings;

DROP POLICY IF EXISTS "Allow all select on tampering_events" ON tampering_events;
DROP POLICY IF EXISTS "Allow all insert on tampering_events" ON tampering_events;
DROP POLICY IF EXISTS "Allow all update on tampering_events" ON tampering_events;
DROP POLICY IF EXISTS "Allow all delete on tampering_events" ON tampering_events;

-- Also drop any other old policy names that might still exist
DROP POLICY IF EXISTS "Allow anonymous access to app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow anonymous insert on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow anonymous update on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow anonymous delete on app_settings" ON app_settings;

-- Verify the proper policies are in place (these should already exist from
-- migrations 20260309055923 and 20260309055952, this is a safety net)

-- app_settings: authenticated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Users can read own settings'
  ) THEN
    CREATE POLICY "Users can read own settings"
      ON app_settings FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Users can insert own settings'
  ) THEN
    CREATE POLICY "Users can insert own settings"
      ON app_settings FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings"
      ON app_settings FOR UPDATE TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Users can delete own settings'
  ) THEN
    CREATE POLICY "Users can delete own settings"
      ON app_settings FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- app_settings: anon
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Anonymous users can read own settings'
  ) THEN
    CREATE POLICY "Anonymous users can read own settings"
      ON app_settings FOR SELECT TO anon
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Anonymous users can insert own settings'
  ) THEN
    CREATE POLICY "Anonymous users can insert own settings"
      ON app_settings FOR INSERT TO anon
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Anonymous users can update own settings'
  ) THEN
    CREATE POLICY "Anonymous users can update own settings"
      ON app_settings FOR UPDATE TO anon
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_settings' AND policyname = 'Anonymous users can delete own settings'
  ) THEN
    CREATE POLICY "Anonymous users can delete own settings"
      ON app_settings FOR DELETE TO anon
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- tampering_events: authenticated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Users can view own tampering events'
  ) THEN
    CREATE POLICY "Users can view own tampering events"
      ON tampering_events FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Users can insert own tampering events'
  ) THEN
    CREATE POLICY "Users can insert own tampering events"
      ON tampering_events FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Users can update own tampering events'
  ) THEN
    CREATE POLICY "Users can update own tampering events"
      ON tampering_events FOR UPDATE TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Users can delete own tampering events'
  ) THEN
    CREATE POLICY "Users can delete own tampering events"
      ON tampering_events FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- tampering_events: anon
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Anonymous users can view own tampering events'
  ) THEN
    CREATE POLICY "Anonymous users can view own tampering events"
      ON tampering_events FOR SELECT TO anon
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Anonymous users can insert own tampering events'
  ) THEN
    CREATE POLICY "Anonymous users can insert own tampering events"
      ON tampering_events FOR INSERT TO anon
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Anonymous users can update own tampering events'
  ) THEN
    CREATE POLICY "Anonymous users can update own tampering events"
      ON tampering_events FOR UPDATE TO anon
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tampering_events' AND policyname = 'Anonymous users can delete own tampering events'
  ) THEN
    CREATE POLICY "Anonymous users can delete own tampering events"
      ON tampering_events FOR DELETE TO anon
      USING (auth.uid() = user_id);
  END IF;
END $$;
