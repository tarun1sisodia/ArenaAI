-- 0028_relax_advance_amount_check.sql
-- Relax bookings.advance_amount check constraint to allow promotional/discounted fares below ₹500
-- while ensuring advance is positive and never exceeds the total fare.

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_advance_amount_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_advance_amount_check
  CHECK (advance_amount >= 1 AND advance_amount <= total_fare);
