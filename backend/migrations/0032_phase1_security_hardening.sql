-- Phase 1 security hardening
--
-- This migration is intentionally additive and fail-closed for direct
-- PostgREST access. The application connects through the backend and keeps
-- service-role writes; public reads are limited to published content.

-- The migration ledger is application-owned metadata, not a public API.
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON schema_migrations FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON schema_migrations FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON schema_migrations FROM authenticated';
  END IF;
END $$;
DROP POLICY IF EXISTS schema_migrations_service_role_all ON schema_migrations;
CREATE POLICY schema_migrations_service_role_all ON schema_migrations
  FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

-- Enable RLS on tables that were created after the original RLS migration.
ALTER TABLE fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_sightseeing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_vehicle_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_taxi_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE monuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_signoffs ENABLE ROW LEVEL SECURITY;

-- Backend/service-role access. Direct backend connections are owned by the
-- database role and continue to work; PostgREST service_role is explicit.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'fare_rules',
    'route_catalog',
    'local_sightseeing_packages',
    'transfer_routes',
    'tour_packages',
    'package_vehicle_upgrades',
    'cancellation_policies',
    'company_profile',
    'pet_taxi_policy',
    'monuments',
    'dossier_signoffs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_service_role_all ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_service_role_all ON %I FOR ALL USING (current_setting(''role'', true) = ''service_role'') WITH CHECK (current_setting(''role'', true) = ''service_role'')',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Public customer-facing reads. No public table is writable through these
-- policies; admin/backend writes remain service-role/application operations.
DROP POLICY IF EXISTS fare_rules_public_read ON fare_rules;
CREATE POLICY fare_rules_public_read ON fare_rules
  FOR SELECT
  USING (
    is_active = true
    AND effective_from <= now()
    AND (effective_to IS NULL OR effective_to > now())
  );

DROP POLICY IF EXISTS route_catalog_public_read ON route_catalog;
CREATE POLICY route_catalog_public_read ON route_catalog
  FOR SELECT
  USING (status = 'published' AND needs_review = false);

DROP POLICY IF EXISTS local_packages_public_read ON local_sightseeing_packages;
CREATE POLICY local_packages_public_read ON local_sightseeing_packages
  FOR SELECT
  USING (status = 'published' AND is_active = true);

DROP POLICY IF EXISTS transfer_routes_public_read ON transfer_routes;
CREATE POLICY transfer_routes_public_read ON transfer_routes
  FOR SELECT
  USING (status = 'published' AND is_active = true);

DROP POLICY IF EXISTS tour_packages_public_read ON tour_packages;
CREATE POLICY tour_packages_public_read ON tour_packages
  FOR SELECT
  USING (status = 'published' AND is_active = true);

DROP POLICY IF EXISTS package_upgrades_public_read ON package_vehicle_upgrades;
CREATE POLICY package_upgrades_public_read ON package_vehicle_upgrades
  FOR SELECT
  USING (
    package_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM tour_packages p
      WHERE p.id = package_vehicle_upgrades.package_id
        AND p.status = 'published'
        AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS cancellation_policies_public_read ON cancellation_policies;
CREATE POLICY cancellation_policies_public_read ON cancellation_policies
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS company_profile_public_read ON company_profile;
CREATE POLICY company_profile_public_read ON company_profile
  FOR SELECT
  USING (dossier_status = 'signed_off');

DROP POLICY IF EXISTS pet_taxi_policy_public_read ON pet_taxi_policy;
CREATE POLICY pet_taxi_policy_public_read ON pet_taxi_policy
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS monuments_public_read ON monuments;
CREATE POLICY monuments_public_read ON monuments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS dossier_signoffs_service_role_only ON dossier_signoffs;
CREATE POLICY dossier_signoffs_service_role_only ON dossier_signoffs
  FOR SELECT
  USING (current_setting('role', true) = 'service_role');
