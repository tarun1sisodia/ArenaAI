CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(30) NOT NULL UNIQUE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_access_token VARCHAR(64) NOT NULL,
    trip_type trip_type_enum NOT NULL,
    vehicle_tier vehicle_tier_enum NOT NULL,
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    drop_address TEXT,
    pickup_datetime TIMESTAMPTZ NOT NULL,
    return_datetime TIMESTAMPTZ,
    flight_train_number VARCHAR(50),
    distance_km NUMERIC(8, 2) NOT NULL CHECK (distance_km > 0),
    customer_name TEXT NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    base_fare NUMERIC(10, 2) NOT NULL CHECK (base_fare >= 0),
    night_allowance NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (night_allowance >= 0),
    driver_allowance NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (driver_allowance >= 0),
    discount_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    promo_code VARCHAR(30),
    total_fare NUMERIC(10, 2) NOT NULL CHECK (total_fare > 0),
    advance_amount NUMERIC(10, 2) NOT NULL CHECK (advance_amount >= 500),
    balance_amount NUMERIC(10, 2) NOT NULL CHECK (balance_amount >= 0),
    fare_rules_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    fare_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    status booking_status_enum NOT NULL DEFAULT 'pending_payment',
    version INT NOT NULL DEFAULT 1,
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    special_notes TEXT,
    package_id VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ticket_id_format CHECK (ticket_id ~ '^AGR-[0-9]{8}-[0-9]{4}$')
);

CREATE INDEX IF NOT EXISTS idx_bookings_ticket_id ON bookings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_datetime ON bookings(pickup_datetime);
