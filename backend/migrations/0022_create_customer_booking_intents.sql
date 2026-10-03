-- 0022: short-lived, secret-protected customer booking intents.
CREATE TABLE IF NOT EXISTS customer_booking_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID NOT NULL UNIQUE,
  resume_secret_hash CHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  quote JSONB NOT NULL,
  quote_total_fare NUMERIC(10,2) NOT NULL,
  quote_advance_amount NUMERIC(10,2) NOT NULL,
  quote_balance_amount NUMERIC(10,2) NOT NULL,
  fare_reconfirmation_pending BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ,
  claimed_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resulting_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_booking_intents_expires_at ON customer_booking_intents(expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_created_at ON bookings(user_id, created_at DESC);
DROP TRIGGER IF EXISTS customer_booking_intents_set_updated_at ON customer_booking_intents;
CREATE TRIGGER customer_booking_intents_set_updated_at BEFORE UPDATE ON customer_booking_intents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE customer_booking_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_booking_intents_service_role_all ON customer_booking_intents;
CREATE POLICY customer_booking_intents_service_role_all ON customer_booking_intents FOR ALL USING (current_setting('role', true) = 'service_role') WITH CHECK (current_setting('role', true) = 'service_role');
