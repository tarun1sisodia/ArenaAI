CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider payment_provider_enum NOT NULL,
    provider_order_id VARCHAR(120) NOT NULL UNIQUE,
    provider_payment_id VARCHAR(120) UNIQUE,
    checkout_session_id VARCHAR(120),
    checkout_url TEXT,
    public_client_token TEXT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    inr_amount_paise BIGINT NOT NULL CHECK (inr_amount_paise > 0),
    status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    fee_minor BIGINT DEFAULT 0,
    tax_minor BIGINT DEFAULT 0,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    webhook_event_id VARCHAR(120),
    reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    failure_reason TEXT,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider_refund_id VARCHAR(120) UNIQUE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'processed',
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_webhooks (
    id UUID PRIMARY KEY,
    provider TEXT NOT NULL,
    event_id VARCHAR(160) NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_webhooks_received ON raw_webhooks(received_at);
