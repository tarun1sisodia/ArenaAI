-- 0025: Tour package pricing is fixed by the five fleet price columns.
-- Per-km and flat surcharge controls are not valid for tour packages.
ALTER TABLE tour_packages
  DROP COLUMN IF EXISTS use_per_km,
  DROP COLUMN IF EXISTS flat_charge_inr;
