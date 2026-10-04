-- 0026_promo_broadcast_and_group_vehicles.sql
-- Add allow_group_vehicles and is_broadcast columns to promo_codes table
-- Enforce at most one live broadcast promo via partial unique index

ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS allow_group_vehicles BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_single_broadcast
  ON promo_codes (is_broadcast)
  WHERE is_broadcast = true;
