-- 0021: Taxi rental enquiries. Availability and payment remain a phone-led workflow.
CREATE SEQUENCE IF NOT EXISTS rental_enquiry_ref_seq;
CREATE TABLE IF NOT EXISTS rental_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  car_tier TEXT NOT NULL CHECK (car_tier IN ('sedan','ertiga','innova','tempo','urbania')),
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL CHECK (return_date >= pickup_date),
  pickup_location TEXT NOT NULL,
  with_driver BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','done','closed','spam')),
  notes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rental_enquiries_status ON rental_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_rental_enquiries_created_at ON rental_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rental_enquiries_car_tier ON rental_enquiries(car_tier);
DROP TRIGGER IF EXISTS rental_enquiries_set_updated_at ON rental_enquiries;
CREATE TRIGGER rental_enquiries_set_updated_at BEFORE UPDATE ON rental_enquiries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE rental_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rental_enquiries_service_role_all ON rental_enquiries;
CREATE POLICY rental_enquiries_service_role_all ON rental_enquiries FOR ALL USING (current_setting('role', true) = 'service_role') WITH CHECK (current_setting('role', true) = 'service_role');
