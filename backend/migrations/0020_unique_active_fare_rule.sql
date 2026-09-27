-- Migration 0020: Unique Active Fare Rule Invariant
-- Ensures at most one fare_rules row can have is_active = true at any time.

-- Clean data if multiple rows are currently active: retain the newest active row
WITH ranked_active AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM fare_rules
    WHERE is_active = true
)
UPDATE fare_rules
SET is_active = false
WHERE id IN (SELECT id FROM ranked_active WHERE rn > 1);

-- Enforce partial unique index: exactly one or zero active fare rules
CREATE UNIQUE INDEX IF NOT EXISTS idx_fare_rules_unique_active
ON fare_rules (is_active)
WHERE is_active = true;
