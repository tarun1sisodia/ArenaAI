-- Keep the application-owned migration ledger compatible with direct SQL
-- migration tools as well as the checked-in migration runner.
ALTER TABLE schema_migrations
  ADD COLUMN IF NOT EXISTS checksum TEXT;
