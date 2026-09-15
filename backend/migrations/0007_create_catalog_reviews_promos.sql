CREATE TABLE IF NOT EXISTS catalog_items (
    id TEXT PRIMARY KEY,
    type catalog_type_enum NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    status content_status_enum NOT NULL DEFAULT 'draft',
    duration_text TEXT NOT NULL,
    route_summary TEXT NOT NULL,
    starting_price_inr NUMERIC(10, 2) NOT NULL CHECK (starting_price_inr > 0),
    version INT NOT NULL DEFAULT 1,
    created_by UUID,
    updated_by UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_item_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    alt_text TEXT NOT NULL,
    caption TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status content_status_enum NOT NULL DEFAULT 'draft',
    source_type VARCHAR(30) NOT NULL DEFAULT 'admin_upload',
    copyright_owner TEXT,
    created_by UUID,
    approved_by UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    catalog_item_id TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    status review_status_enum NOT NULL DEFAULT 'pending_review',
    verification_status verification_status_enum NOT NULL DEFAULT 'unverified',
    social_profile_url TEXT,
    social_platform VARCHAR(40),
    verification_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    guest_access_token VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fare_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL UNIQUE,
    config JSONB NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    discount_amount NUMERIC(8, 2) NOT NULL CHECK (discount_amount >= 0),
    min_total NUMERIC(10, 2) NOT NULL CHECK (min_total >= 0),
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_redemptions INT,
    redemption_count INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ
);
