-- Preserve existing booking rows exactly. New package/local selections no longer
-- masquerade as origin/destination routes; their immutable typed snapshot is stored
-- separately, with a real FK when the selection comes from the live catalogue.
ALTER TABLE bookings
  ALTER COLUMN origin_name DROP NOT NULL,
  ALTER COLUMN destination_name DROP NOT NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_selection JSONB,
  ADD COLUMN IF NOT EXISTS selected_catalog_item_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_selected_catalog_item_id_fkey'
      AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_selected_catalog_item_id_fkey
      FOREIGN KEY (selected_catalog_item_id)
      REFERENCES catalog_items(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_selected_catalog_item_id
  ON bookings(selected_catalog_item_id)
  WHERE selected_catalog_item_id IS NOT NULL;

COMMENT ON COLUMN bookings.booking_selection IS
  'Canonical immutable typed trip selection snapshot; legacy rows remain NULL and are projected compatibly.';
COMMENT ON COLUMN bookings.selected_catalog_item_id IS
  'Optional FK to the live catalogue item selected for this booking.';
