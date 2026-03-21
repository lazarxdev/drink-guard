/*
  # Fix Tampering Events RLS Policies

  Updates the tampering_events table RLS policies to use proper auth.uid()
  instead of the complex subquery that references app_settings.

  ## Changes

  1. **Drop Old Policies**
     - Remove policies with app_settings subquery
     - These were inefficient and potentially insecure

  2. **Implement Auth-Based Policies**
     - Use auth.uid() to verify user identity directly
     - Match user_id column with authenticated user's ID
     - Support both authenticated and anonymous users

  ## Security Improvements
  - Direct authentication check without subqueries
  - Better performance
  - Consistent with app_settings policies
*/

-- Drop existing policies on tampering_events
DROP POLICY IF EXISTS "Users can view own tampering events" ON tampering_events;
DROP POLICY IF EXISTS "Users can insert own tampering events" ON tampering_events;
DROP POLICY IF EXISTS "Users can update own tampering events" ON tampering_events;

-- Create secure policies that verify user_id matches auth.uid()

-- SELECT Policy: Users can only read their own tampering events
CREATE POLICY "Users can view own tampering events"
  ON tampering_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view own tampering events"
  ON tampering_events
  FOR SELECT
  TO anon
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only insert tampering events for themselves
CREATE POLICY "Users can insert own tampering events"
  ON tampering_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert own tampering events"
  ON tampering_events
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own tampering events
CREATE POLICY "Users can update own tampering events"
  ON tampering_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can update own tampering events"
  ON tampering_events
  FOR UPDATE
  TO anon
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own tampering events
CREATE POLICY "Users can delete own tampering events"
  ON tampering_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can delete own tampering events"
  ON tampering_events
  FOR DELETE
  TO anon
  USING (auth.uid() = user_id);
