-- 0037_dejargon_and_rename_routes.sql
-- De-jargoning: Rename route_catalog to canonical 'routes'
-- Drops legacy foreign keys on catalog_items, provides canonical views for local_tours & transfers.

-- 1. Rename route_catalog to routes if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'route_catalog') THEN
    ALTER TABLE route_catalog RENAME TO routes;
  END IF;
END $$;

-- 2. Rename associated indexes
ALTER INDEX IF EXISTS route_catalog_status_idx RENAME TO routes_status_idx;
ALTER INDEX IF EXISTS route_catalog_trip_type_idx RENAME TO routes_trip_type_idx;
ALTER INDEX IF EXISTS route_catalog_slug_key RENAME TO routes_slug_key;

-- 3. Provide backward compatibility view for route_catalog during transitional deploys
CREATE OR REPLACE VIEW route_catalog AS SELECT * FROM routes;

-- 4. Provide clean canonical views for local_tours and transfers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'local_sightseeing_packages') THEN
    CREATE OR REPLACE VIEW local_tours AS SELECT * FROM local_sightseeing_packages;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transfer_routes') THEN
    CREATE OR REPLACE VIEW transfers AS SELECT * FROM transfer_routes;
  END IF;
END $$;

-- 5. Drop legacy foreign key constraints referencing polymorphic catalog_items
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_catalog_item_id_fkey;
ALTER TABLE IF EXISTS catalog_item_media DROP CONSTRAINT IF EXISTS catalog_item_media_catalog_item_id_fkey;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS bookings_selected_catalog_item_id_fkey;

-- 6. Enable Row Level Security on routes
ALTER TABLE IF EXISTS routes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'routes' AND policyname = 'routes_public_read'
  ) THEN
    CREATE POLICY routes_public_read ON routes FOR SELECT USING (status = 'published');
  END IF;
END $$;
