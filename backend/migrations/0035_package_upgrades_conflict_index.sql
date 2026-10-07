-- 0035: the saveUpgrade ON CONFLICT (package_id, tier_code) arbiter needs a plain
-- (non-partial) unique constraint for PostgreSQL conflict inference. 0024 only
-- created partial indexes, so the upsert raised 500 on every package upgrade save.
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_upgrades_pkg_tier
  ON package_vehicle_upgrades (package_id, tier_code);
