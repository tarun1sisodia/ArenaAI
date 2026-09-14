CREATE INDEX IF NOT EXISTS idx_catalog_items_status ON catalog_items(status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_item_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_owner_select ON bookings;
CREATE POLICY bookings_owner_select ON bookings
    FOR SELECT
    USING (user_id = auth.uid() OR current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS catalog_public_read ON catalog_items;
CREATE POLICY catalog_public_read ON catalog_items
    FOR SELECT
    USING (status = 'published' OR current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS reviews_public_read ON reviews;
CREATE POLICY reviews_public_read ON reviews
    FOR SELECT
    USING (status = 'published' OR current_setting('role', true) = 'service_role');
