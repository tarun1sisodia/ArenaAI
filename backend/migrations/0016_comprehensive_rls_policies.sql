-- 0016_comprehensive_rls_policies.sql
-- Resolves FIND-008 and FIND-027:
-- Provides full service_role access policies across all 14 RLS-enabled tables,
-- grants granular public read/insert policies for client operations,
-- and ensures zero default-deny lockouts for backend and PostgREST workflows.

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'profiles', 'bookings', 'payments', 'refunds', 'catalog_items',
            'catalog_item_media', 'reviews', 'promo_codes', 'admin_audit_logs',
            'notification_jobs', 'inquiries', 'device_registrations',
            'raw_webhooks', 'location_cache'
        ])
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I_service_role_all ON %I;
             CREATE POLICY %I_service_role_all ON %I FOR ALL
             USING (current_setting(''role'', true) = ''service_role'')
             WITH CHECK (current_setting(''role'', true) = ''service_role'');',
            tbl, tbl, tbl, tbl
        );
    END LOOP;
END $$;

-- Public read access for active catalog item media
DROP POLICY IF EXISTS catalog_media_public_read ON catalog_item_media;
CREATE POLICY catalog_media_public_read ON catalog_item_media
    FOR SELECT
    USING (true);

-- Public read access for active promotional codes
DROP POLICY IF EXISTS promo_codes_public_read ON promo_codes;
CREATE POLICY promo_codes_public_read ON promo_codes
    FOR SELECT
    USING (is_active = true);

-- Public / Anonymous insert capability for inquiries (contact & lead forms)
DROP POLICY IF EXISTS inquiries_anon_insert ON inquiries;
CREATE POLICY inquiries_anon_insert ON inquiries
    FOR INSERT
    WITH CHECK (true);

-- Customer review submission (pending moderation)
DROP POLICY IF EXISTS reviews_anon_insert ON reviews;
CREATE POLICY reviews_anon_insert ON reviews
    FOR INSERT
    WITH CHECK (status = 'draft' OR status = 'pending_review');

-- Profile owner self-management
DROP POLICY IF EXISTS profiles_owner_access ON profiles;
CREATE POLICY profiles_owner_access ON profiles
    FOR ALL
    USING (id = auth.uid() OR current_setting('role', true) = 'service_role')
    WITH CHECK (id = auth.uid() OR current_setting('role', true) = 'service_role');
