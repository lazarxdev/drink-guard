/*
  # Add countdown animation style preference
  
  1. Changes
    - Add `countdown_animation_style` column to `app_settings` table
    - Default value is 'descending-guardian' for new installations
    - Supports 12 different animation styles for the countdown sequence
  
  2. Animation Styles
    - descending-guardian: Shield descends from above
    - fortress-build: Progressive shield construction
    - vault-lock: Rotating vault door mechanism
    - energy-shield: Sci-fi force field deployment
    - liquid-metal: Molten metal pouring effect
    - force-field: Expanding concentric rings
    - armor-plating: Flying plates assembly
    - crystal-formation: Growing crystal structure
    - ancient-seal: Mystical runes and symbols
    - tactical-hud: Military HUD interface
    - barrier-slam: Heavy shield drop impact
    - magnetic-assembly: Magnetic fragment attraction
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'countdown_animation_style'
  ) THEN
    ALTER TABLE app_settings 
    ADD COLUMN countdown_animation_style text DEFAULT 'descending-guardian';
  END IF;
END $$;