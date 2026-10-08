-- 0036: Fix device_registrations unique constraints for anonymous / guest devices
-- Drop the default UNIQUE(user_id, device_id) constraint which treats NULLs as distinct
ALTER TABLE device_registrations DROP CONSTRAINT IF EXISTS device_registrations_user_id_device_id_key;

-- Deduplicate existing anonymous registrations (keep latest created_at)
DELETE FROM device_registrations a
WHERE a.user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM device_registrations b
    WHERE b.user_id IS NULL
      AND b.device_id = a.device_id
      AND (b.created_at > a.created_at OR (b.created_at = a.created_at AND b.id > a.id))
  );

-- Deduplicate existing user registrations (keep latest created_at)
DELETE FROM device_registrations a
WHERE a.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM device_registrations b
    WHERE b.user_id = a.user_id
      AND b.device_id = a.device_id
      AND (b.created_at > a.created_at OR (b.created_at = a.created_at AND b.id > a.id))
  );

-- Create partial unique index for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_registrations_user_device
ON device_registrations(user_id, device_id)
WHERE user_id IS NOT NULL;

-- Create partial unique index for anonymous devices
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_registrations_anon_device
ON device_registrations(device_id)
WHERE user_id IS NULL;
