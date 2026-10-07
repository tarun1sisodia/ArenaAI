-- Migration 0034: canonical fleet keys (C-ENUM-001)
--
-- Tarun decision D1 (2026-10-07): canonical vehicle tier keys are the LONG form
-- (sedan, ertiga, innova-crysta, tempo-traveller, urbania), matching DB
-- vehicle_tier_enum (migration 0002).
--
-- Expand-and-contract: this migration only changes the column DEFAULT and backfills
-- existing short ids to long form. It is NON-BREAKING because every reader goes
-- through resolveTierKey() (contracts/enums/vehicle-tiers.ts), which accepts both
-- forms. No column is dropped or renamed.
--
-- jsonb fleet_prices / extra_rates keys inside existing rows are NOT rewritten here:
-- reads handle both forms, and the admin write path will require canonical keys
-- (F7). A follow-up data-cleanup can normalize them once verified.

-- 1. Fix the column default (was '{sedan,ertiga,innova,tempo,urbania}')
ALTER TABLE route_catalog
  ALTER COLUMN available_fleets SET DEFAULT '{sedan,ertiga,innova-crysta,tempo-traveller,urbania}';

-- 2. Backfill existing rows: short ids -> canonical long form
UPDATE route_catalog
SET available_fleets = (
  SELECT array_agg(
    CASE unnest
      WHEN 'innova' THEN 'innova-crysta'
      WHEN 'tempo' THEN 'tempo-traveller'
      ELSE unnest
    END
  )
  FROM unnest(available_fleets)
)
WHERE available_fleets && ARRAY['innova', 'tempo']::text[];
