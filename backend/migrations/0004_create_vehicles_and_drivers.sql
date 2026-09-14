CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    tier vehicle_tier_enum NOT NULL,
    name TEXT NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    seating_capacity INT NOT NULL CHECK (seating_capacity > 0),
    luggage_capacity INT NOT NULL CHECK (luggage_capacity >= 0),
    per_km_rate NUMERIC(6, 2) NOT NULL CHECK (per_km_rate > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    police_verified BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
    current_status VARCHAR(20) NOT NULL DEFAULT 'available',
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT drivers_status_check CHECK (current_status IN ('available', 'on_trip', 'off_duty'))
);
