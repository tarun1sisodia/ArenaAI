# ArenaAI 16-table alignment execution plan

## Objective

Audit every table shown in the previous agent run and prove the complete chain:

`database table/column → backend model/schema/repository → admin operation → customer/public operation → persisted row → returned/displayed value`

The audit is read-only except for isolated automated tests using in-memory repositories or explicitly disposable records. No production payment, customer, or content row will be mutated by the audit.

## Table work units

1. `profiles` and `device_registrations`
2. `bookings` and `customer_booking_intents`
3. `payments`, `refunds`, and `raw_webhooks`
4. `catalog_items`, `catalog_item_media`, and catalog manifest
5. `reviews`
6. `fare_rules`
7. `promo_codes`
8. `admin_audit_logs` and `notification_jobs`
9. `inquiries` and `rental_enquiries`
10. `location_cache`
11. `route_catalog`
12. `local_sightseeing_packages`
13. `transfer_routes`
14. `tour_packages` and `package_vehicle_upgrades`
15. `cancellation_policies`, `company_profile`, `pet_taxi_policy`, `monuments`, and `dossier_signoffs`
16. `schema_migrations`

## Required output for every unit

Each table unit must report:

- live row count and whether the table is empty;
- every column’s type, nullability, default, and current null/empty meaning;
- the owning backend domain model, Zod/schema contract, mapper, repository SQL, and migration;
- every known writer and reader: admin, customer, webhook, job, cache, or migration runner;
- foreign-key relationships and delete/update behavior;
- for every nullable or empty field: the condition that fills it, the endpoint/action that writes it, and whether emptiness is intentional or a defect;
- mismatches, severity, evidence, and exact recommended fix;
- a controlled lifecycle test or a clear reason the table should not be mutated in the audit.

## Execution stages

### Stage 1 — Independent table audits

Run one dedicated agent per work unit. Agents use the repository reports, migrations, backend source, admin source, and available live schema evidence. They must not invent live values that are not present in the provided evidence.

### Stage 2 — Cross-table relationship review

The reducer reconciles foreign keys, join keys, publication/status filters, generated manifests, and lifecycle transitions across all successful unit reports. It explicitly records missing links and apparent-but-intentional empty tables.

### Stage 3 — Gap classification

Classify each finding as:

- `confirmed defect` — code or database contract demonstrably drops or miswrites data;
- `configuration blocker` — code is correct but deployment/provider configuration prevents the lifecycle;
- `intentional nullable/empty` — populated only after a specific event or workflow;
- `unverified` — requires a protected external action, missing connector, or user-provided research source.

### Stage 4 — Remediation backlog

For each confirmed defect, define a dependency-ordered patch:

1. backend schema/model/repository;
2. database migration or constraint, only if required;
3. admin/client payload and response mapping;
4. customer/public read path and cache/manifest;
5. regression test;
6. deployment verification.

### Stage 5 — Validation

Run backend typecheck/tests, admin typecheck/build, schema contract checks, and read-only live endpoint checks. Any production write, migration, webhook replay, or RLS policy change remains a separate explicitly reviewed action.

## External research source

The supplied Google Drive folder is not connected in the current session configuration. The audit will use the repository’s existing research artifacts and the live Supabase/Render evidence available to this task. Drive documents can be incorporated in a later pass after the Google Drive connector is enabled or the files are supplied directly.
