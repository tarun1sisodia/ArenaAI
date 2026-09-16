-- Migration 0015: Add supporting indexes on child foreign key columns (FIND-010)
-- Prevents sequential scans and row locks during parent table updates / cascading deletes.

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);

CREATE INDEX IF NOT EXISTS idx_notification_jobs_booking_id ON notification_jobs(booking_id);

CREATE INDEX IF NOT EXISTS idx_catalog_item_media_catalog_item_id ON catalog_item_media(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_catalog_item_id ON reviews(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);

CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_booking_id ON device_registrations(booking_id);
