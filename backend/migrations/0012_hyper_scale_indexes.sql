-- Migration: 0012_hyper_scale_indexes.sql
-- Phase H2: Database foundations & scaling (T8: hyper-scale §8 + backend-guide §2)
--
-- 1. Partial index on active bookings for operational dispatch desk.
--    Indexes only live trips (pending_payment, paid_confirmed, driver_assigned).
--    Dispatch queries bypass 98%+ historical rows, reducing index RAM from ~25MB to <400KB.
CREATE INDEX IF NOT EXISTS idx_bookings_active_dispatch
ON bookings (pickup_datetime ASC, id)
WHERE status IN ('pending_payment', 'paid_confirmed', 'driver_assigned');

-- 2. Covering index for customer vouchers and guest lookups (Index-Only Scan).
--    Includes critical lookup columns directly in the leaf pages so Postgres
--    serves voucher lookups directly from RAM cache without touching the table heap.
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_lookup
ON bookings (ticket_id)
INCLUDE (guest_access_token, customer_phone, status, total_fare, advance_amount, balance_amount);

-- 3. Trigram extension and GIN indexes for fast substring search without full table scans.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone_trgm
ON bookings USING gin (customer_phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_name_trgm
ON bookings USING gin (customer_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_inquiries_phone_trgm
ON inquiries USING gin (phone gin_trgm_ops);

-- 4. Partial index on pending payments awaiting verification or reconciliation.
CREATE INDEX IF NOT EXISTS idx_payments_unverified
ON payments (created_at ASC)
WHERE status = 'pending';
