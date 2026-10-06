-- Keep the PostgreSQL booking status enum aligned with the live operational state.
-- PostgreSQL ADD VALUE is idempotent through the catalog guard.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'booking_status_enum'
      AND e.enumlabel = 'driver_assigned'
  ) THEN
    ALTER TYPE booking_status_enum ADD VALUE 'driver_assigned' AFTER 'paid_confirmed';
  END IF;
END
$$;
