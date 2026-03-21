-- Update grace period constraint from 2-4 to 2-7 seconds and default to 4
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS grace_period_range;
ALTER TABLE app_settings ADD CONSTRAINT grace_period_range
  CHECK (grace_period_seconds >= 2 AND grace_period_seconds <= 7);
ALTER TABLE app_settings ALTER COLUMN grace_period_seconds SET DEFAULT 4;
