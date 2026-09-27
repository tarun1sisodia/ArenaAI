-- 0018: Extend the catalog into the live "single source of trips".
--
-- 1. Widen catalog_items.type from the postgres enum to TEXT + CHECK so the
--    operations desk can manage every vertical (ride / tour / package / route /
--    vehicle / place) without a developer running enum migrations.
-- 2. Add the commercial fields the admin CRUD owns: distance, availability,
--    seats left, ordered stops and the customer-facing trip type.
-- 3. Let catalog media carry inline (DB-backed) uploads so the admin can attach
--    images without a developer or an external bucket.

-- ── 1. Widen the catalog type column (expand-and-contract safe) ─────────────
ALTER TABLE catalog_items ALTER COLUMN type TYPE text USING type::text;
ALTER TABLE catalog_items DROP CONSTRAINT IF EXISTS catalog_items_type_check;
ALTER TABLE catalog_items
  ADD CONSTRAINT catalog_items_type_check
  CHECK (type IN ('ride', 'tour', 'package', 'route', 'vehicle', 'place'));

-- ── 2. Trip commercial fields ───────────────────────────────────────────────
ALTER TABLE catalog_items ADD COLUMN distance_km NUMERIC(8, 2);
ALTER TABLE catalog_items
  ADD CONSTRAINT catalog_items_distance_km_check
  CHECK (distance_km IS NULL OR distance_km >= 0);

ALTER TABLE catalog_items ADD COLUMN availability VARCHAR(20) NOT NULL DEFAULT 'available';
ALTER TABLE catalog_items DROP CONSTRAINT IF EXISTS catalog_items_availability_check;
ALTER TABLE catalog_items
  ADD CONSTRAINT catalog_items_availability_check
  CHECK (availability IN ('available', 'limited', 'unavailable'));

ALTER TABLE catalog_items ADD COLUMN seats_left INT;
ALTER TABLE catalog_items
  ADD CONSTRAINT catalog_items_seats_left_check
  CHECK (seats_left IS NULL OR seats_left >= 0);

ALTER TABLE catalog_items ADD COLUMN stops TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE catalog_items ADD COLUMN trip_type VARCHAR(30);
ALTER TABLE catalog_items DROP CONSTRAINT IF EXISTS catalog_items_trip_type_check;
ALTER TABLE catalog_items
  ADD CONSTRAINT catalog_items_trip_type_check
  CHECK (trip_type IS NULL OR trip_type IN ('one-way', 'round-trip', 'local-tour', 'airport-transfer'));

CREATE INDEX IF NOT EXISTS idx_catalog_items_status_type ON catalog_items (status, type);

-- ── 3. Inline media uploads ─────────────────────────────────────────────────
ALTER TABLE catalog_item_media ADD COLUMN mime_type VARCHAR(60);
ALTER TABLE catalog_item_media ADD COLUMN content_base64 TEXT;
ALTER TABLE catalog_item_media ADD COLUMN size_bytes INT;
ALTER TABLE catalog_item_media
  ADD CONSTRAINT catalog_item_media_size_bytes_check
  CHECK (size_bytes IS NULL OR size_bytes >= 0);
