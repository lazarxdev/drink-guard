/*
  # Recreate app_settings table with PIN support

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key) - Unique identifier for settings
      - `user_id` (uuid, unique, not null) - User identifier
      - `pin_hash` (text, nullable) - Hashed 4-digit PIN code
      - `sensitivity` (integer, default 40) - Motion detection sensitivity (10-100)
      - `theme_color` (text, default 'green') - App theme color
      - `alarm_sound` (text, default 'bell') - Alarm sound selection
      - `use_flash` (boolean, default false) - Enable camera flash on detection
      - `incognito_mode` (boolean, default false) - Silent alert mode
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for users to read their own settings
    - Add policy for users to insert their own settings
    - Add policy for users to update their own settings
    
  3. Notes
    - PIN is now nullable to support initial setup flow
    - User can have only one settings record (enforced by unique constraint on user_id)
    - All settings have sensible defaults
*/

-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  pin_hash text,
  sensitivity integer DEFAULT 40 CHECK (sensitivity >= 10 AND sensitivity <= 100),
  theme_color text DEFAULT 'green',
  alarm_sound text DEFAULT 'bell',
  use_flash boolean DEFAULT false,
  incognito_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON app_settings;

-- Create policies for authenticated users to manage their own settings
CREATE POLICY "Users can read own settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text::uuid);

CREATE POLICY "Users can insert own settings"
  ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text::uuid);

CREATE POLICY "Users can update own settings"
  ON app_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text::uuid)
  WITH CHECK (user_id = auth.uid()::text::uuid);
