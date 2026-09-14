DO $$ BEGIN
    CREATE TYPE trip_type_enum AS ENUM ('one-way', 'round-trip', 'local-tour', 'airport-transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_tier_enum AS ENUM ('sedan', 'ertiga', 'innova-crysta', 'tempo-traveller', 'urbania');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'draft', 'pending_payment', 'paid_confirmed', 'driver_assigned',
        'in_transit', 'completed', 'cancelled', 'refunded'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'captured', 'failed', 'refunded', 'needs_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'customer', 'content_editor', 'review_moderator', 'dispatcher', 'finance_operator', 'super_admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider_enum AS ENUM ('razorpay', 'paypal', 'card');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE catalog_type_enum AS ENUM ('ride', 'tour', 'package');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE content_status_enum AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE review_status_enum AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM (
        'unverified', 'booking_verified', 'social_link_submitted', 'manually_verified'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
