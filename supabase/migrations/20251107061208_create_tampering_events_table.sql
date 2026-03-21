/*
  # Create tampering_events table

  1. New Tables
    - `tampering_events`
      - `id` (uuid, primary key) - Unique identifier for each event
      - `user_id` (uuid, not null) - The user who owns this event
      - `detected_at` (timestamptz, not null) - When the tampering was detected
      - `acknowledged` (boolean, default false) - Whether the user has seen this event
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `tampering_events` table
    - Add policy for users to view their own tampering events
    - Add policy for users to update their own tampering events (acknowledge)
    - Add policy for users to insert their own tampering events
*/

-- Create tampering_events table
CREATE TABLE IF NOT EXISTS tampering_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tampering_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tampering events
CREATE POLICY "Users can view own tampering events"
  ON tampering_events
  FOR SELECT
  USING (user_id = (SELECT user_id FROM app_settings LIMIT 1));

-- Policy: Users can insert their own tampering events
CREATE POLICY "Users can insert own tampering events"
  ON tampering_events
  FOR INSERT
  WITH CHECK (user_id = (SELECT user_id FROM app_settings LIMIT 1));

-- Policy: Users can update their own tampering events
CREATE POLICY "Users can update own tampering events"
  ON tampering_events
  FOR UPDATE
  USING (user_id = (SELECT user_id FROM app_settings LIMIT 1))
  WITH CHECK (user_id = (SELECT user_id FROM app_settings LIMIT 1));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tampering_events_user_id ON tampering_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tampering_events_acknowledged ON tampering_events(acknowledged);
