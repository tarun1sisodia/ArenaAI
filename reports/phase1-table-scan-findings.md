# Phase 1 — 16-stage ArenaAI table scan

## Execution status

The original parallel audit was configured for 16 independent domain checks. The workflow completed 11 domain agents and stopped before five domains because the session agent-credit allowance was exhausted. The five unfinished domains were completed through direct repository and live-schema inspection instead of restarting the workflow.

| Stage | Domain | Status | Evidence |
|---:|---|---|---|
| 1 | `profiles`, `device_registrations` | Scanned | Backend identity and registration repositories inspected; device table is event-driven and currently empty. |
| 2 | `bookings`, `customer_booking_intents` | Scanned | Live rows and FK chain inspected; booking intents connect claims and resulting bookings. |
| 3 | `payments`, `refunds`, `raw_webhooks` | Scanned | Live payment lifecycle rows inspected; 4 captured and 7 pending. Refunds/raw webhooks are empty by trigger condition. |
| 4 | `catalog_items`, `catalog_item_media` | Scanned | Catalog schema, media visibility, admin API, and public manifest paths inspected. |
| 5 | `reviews` | Scanned | Customer submission and admin moderation paths inspected; table currently empty because no review has been submitted. |
| 6 | `fare_rules` | Scanned | Admin fare service and fare engine read/write paths inspected. |
| 7 | `promo_codes` | Scanned | Promo repository and customer validation/redemption paths inspected. |
| 8 | `admin_audit_logs`, `notification_jobs` | Scanned | Audit writes and notification job creation paths inspected. |
| 9 | `inquiries`, `rental_enquiries` | Scanned | Customer submission and admin status/note updates inspected. |
| 10 | `location_cache` | Scanned | Location lookup cache write/read/expiry behavior inspected. |
| 11 | `route_catalog` | **Defect confirmed** | See Route Catalog contract mismatch below. |
| 12 | `local_sightseeing_packages` | Scanned directly | Schema, admin payload, service, and PostgreSQL repository fields align; 2 published and 1 archived row. |
| 13 | `transfer_routes` | Scanned directly | Schema, admin payload, service, and PostgreSQL repository fields align; 3 published, 2 draft, 1 archived row. |
| 14 | `tour_packages`, `package_vehicle_upgrades` | Scanned directly | Admin sends snake_case fields matching strict schema; 1 published, 2 draft, 8 archived packages. Upgrade table is populated and FK-linked. |
| 15 | `cancellation_policies`, `company_profile`, `dossier_signoffs`, `monuments`, `pet_taxi_policy` | Scanned directly | Admin APIs and dossier services inspected; 9 policies, 1 company profile, 10 signoffs, 10 monuments, and 1 pet policy row. |
| 16 | `schema_migrations` and RLS/security | Scanned directly | 32 migrations applied; RLS is disabled on 12 content/control tables and requires explicit policies before enablement. |

## Live population snapshot

Current live status counts:

- `bookings`: 4 `paid_confirmed`, 4 `pending_payment`.
- `payments`: 4 `captured`, 7 `pending`.
- `route_catalog`: 1 `published`, 9 `draft`.
- `local_sightseeing_packages`: 2 `published`, 1 `archived`.
- `transfer_routes`: 3 `published`, 2 `draft`, 1 `archived`.
- `tour_packages`: 1 `published`, 2 `draft`, 8 `archived`.
- `dossier_signoffs`: 9 `approved`, 1 `pending`.
- `cancellation_policies`: 9 rows.

## Confirmed defect: Route Catalog extension fields were not aligned — fixed

The database has these columns added by migration `0024_dossier_content.sql`:

- `use_per_km`
- `per_km_rate_override`
- `highway`
- `all_inclusive_note`

The admin form sends all four fields. However:

1. `backend/src/modules/route-catalog/route-catalog.schema.ts` uses `.strict()` but does not define these fields, so create/update requests containing them are rejected as unrecognized keys.
2. `RouteCatalogRecord` does not contain these four fields.
3. `toRecord()` in `route-catalog.service.ts` drops these fields.
4. The update merge in `route-catalog.service.ts` does not map them.
5. `mapRouteCatalog()` does not read them from PostgreSQL.
6. PostgreSQL `routeCatalog.create()` and `routeCatalog.update()` do not write them.

This was a **high-severity admin/database contract defect**. It has now been fixed across the schema, domain record, service transformations, PostgreSQL mapper, PostgreSQL create/update SQL, and regression tests. No database migration was needed because the columns already existed.

Validation after the fix:

- Backend type-check passed.
- Route Catalog contract, catalog manifest, and fare-engine tests passed: 55 tests.
- Admin TypeScript check and production build passed.

## Confirmed payment interpretation

The current pending payment rows have no `provider_payment_id`, `payment_method`, `verified_at`, or `webhook_event_id`, and their expiration times have passed. They represent abandoned or incomplete checkout attempts, not successful payments whose columns failed to update.

The four captured netbanking rows have provider order IDs, payment IDs, `payment_method=netbanking`, `reconciliation_status=matched`, and verification timestamps. Their `webhook_event_id` values are NULL because the successful browser callback path performs server-side verification; the Razorpay webhook requests were separately observed returning HTTP 401 due to webhook-secret configuration mismatch.

## Other confirmed lifecycle explanations

- `refunds` remains empty until an admin executes a refund against a captured payment.
- `raw_webhooks` remains empty until Razorpay accepts a signed webhook; a browser callback must not create a fake webhook event.
- `reviews` remains empty until a customer submits a review.
- `catalog_items` and `catalog_item_media` are separate legacy/live-catalog tables; dossier content tables are the populated source for local packages, transfers, and tours. This dual-source arrangement needs an explicit source-of-truth decision in Phase 2.
- `package_vehicle_upgrades` is only populated when tour-package vehicle upgrades are saved; it is not embedded into the main tour package row.
- `customer_booking_intents` fields such as `consumed_at`, `claimed_user_id`, and `resulting_booking_id` are NULL until the intent is claimed and converted into a booking.
- `dossier_signoffs.approved_by` and `approved_at` are NULL for pending signoffs and populated only after approval.
- `catalog_items.seats_left`, `distance_km`, and `trip_type` are nullable by design for content types that do not use seat inventory or route-specific distance/trip metadata.

## Security finding

RLS is disabled on:

`fare_rules`, `route_catalog`, `local_sightseeing_packages`, `transfer_routes`, `tour_packages`, `package_vehicle_upgrades`, `cancellation_policies`, `company_profile`, `dossier_signoffs`, `monuments`, and `pet_taxi_policy`.

Do not apply bare `ENABLE ROW LEVEL SECURITY` statements. The next security phase must add explicit public-read/service-role/admin policies and test anonymous, authenticated, admin, and backend access.

## Next implementation order

1. Finish the column-level null population matrix for all 28 tables.
2. Decide and document the canonical source for `catalog_items` versus dossier content tables.
3. Run controlled admin create/update/publish/read tests for routes, local packages, transfers, and tour packages.
4. Apply the Razorpay webhook secret correction and verify a real signed webhook creates `raw_webhooks` and fills `webhook_event_id`.
5. Draft RLS policies only after the application read/write paths are proven.
