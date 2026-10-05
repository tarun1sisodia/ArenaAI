# ArenaAI end-to-end data alignment plan

## Objective

Prove, table by table, that the live Supabase schema, backend domain models and repositories, admin forms, customer flows, and public frontend reads are connected correctly. For every column, we will identify its owner, write condition, read consumers, nullable/empty meaning, and the reason it may remain empty.

The audit is read-only until a concrete mismatch is demonstrated and the required migration or code change is reviewed.

## Current baseline

The live database contains 28 public tables. Current row counts from the latest live inventory are:

| State | Tables |
|---|---:|
| Populated | 20 |
| Empty | 8 |
| RLS disabled | 12 |
|

The empty tables are not automatically defects. Some are event or transactional tables that fill only after a specific user action. They must be tested against their trigger conditions rather than seeded blindly.

## Phase 1 — Establish one canonical inventory

For all 28 tables, collect:

- exact PostgreSQL columns, types, nullability, defaults, checks, enums, indexes, primary keys, foreign keys, triggers, and RLS state;
- row counts and null counts for every nullable column;
- representative non-sensitive sample rows, with secrets and personal data masked;
- migration that created or changed each column;
- backend domain type, mapper, repository create/update SQL, and module schema;
- admin API/form fields and customer API/form fields that can write or read it.

Deliverable: a column-level matrix with `table`, `column`, `type`, `nullable`, `current_population`, `writer`, `write_condition`, `reader`, `empty_reason`, `risk`, and `recommended_action`.

## Phase 2 — Classify every table by lifecycle

Each table will be assigned one lifecycle class:

1. **Reference/content tables** — maintained by admin and read by public/customer pages. Examples: route catalog, tour packages, local packages, transfer routes, policies, monuments, company profile.
2. **Transactional tables** — created or updated by customer/admin actions. Examples: bookings, payments, refunds, booking intents.
3. **Event/audit tables** — populated only by events or security/audit actions. Examples: raw webhooks, admin audit logs, notifications.
4. **Cache/index tables** — populated by backend integrations and safe to expire. Example: location cache.
5. **Identity/support tables** — populated by authentication, device registration, and profile synchronization.
6. **Migration/control tables** — not application business data. Example: schema migrations.

For empty tables, the audit will explicitly record: the triggering endpoint/action, expected first write, whether the table is intentionally empty in the current environment, and a safe test path.

## Phase 3 — Trace writes from all application surfaces

For each table, trace the complete write chain:

`admin/customer UI field → frontend API payload → backend route → Zod/schema validation → service transformation → repository SQL → database column → returned mapper → UI display`.

The review will look for:

- UI fields that are never included in the payload;
- payload keys rejected or silently ignored by backend schemas;
- camelCase/snake_case conversion gaps;
- repository `INSERT` columns missing from the domain object;
- repository `UPDATE` statements that omit editable columns;
- nullable fields that are incorrectly forced to empty strings;
- default values that hide missing writes;
- fields written to JSONB but expected as scalar columns;
- IDs that are accepted in forms but have no foreign-key/reference path;
- stale generated customer manifests or caches after admin updates;
- optimistic-lock/version fields not incremented on update.

## Phase 4 — Trace reads and relationships

For each table and foreign key, document:

- parent and child relationship;
- join key and deletion behavior;
- backend repository lookup method;
- admin screen that consumes it;
- customer/public endpoint that consumes it;
- whether the frontend reads the live endpoint or a generated/static fallback;
- whether publication/status filtering can make a populated row invisible.

This phase will distinguish **empty in the database** from **populated but intentionally hidden** due to status, RLS, publication, or query filters.

## Phase 5 — Run controlled lifecycle tests

Use isolated test records or existing test-mode data only. Do not alter customer production records. Test one representative lifecycle per domain:

| Domain | Controlled test |
|---|---|
| Booking | quote → booking intent → booking → customer history/admin booking list |
| Payment | checkout creation → Razorpay signed callback → captured payment → booking confirmation → admin finance |
| Webhook | valid webhook signature → raw webhook row → payment update → idempotent replay |
| Catalog | admin create/update → publish/archive → manifest → customer catalog |
| Route catalog | create/update/publish → route calculator/public route read |
| Local/transfer | create/update/publish → public manifest and booking selection |
| Tour packages | create/update gallery/inclusions/upgrades → publish → public package read |
| Policies/company | admin PATCH → policy/company public content read |
| Reviews/inquiries/rental enquiries | customer submission → admin list/update → returned notes/status |
| Promos/fares | admin update → customer quote/validation → redemption or active fare read |
| Notifications/cache/devices | trigger condition → row/job/cache/device state and retry behavior |

Every test will record before/after rows and the exact endpoint response. No test will mark a payment paid by client input.

## Phase 6 — Fix in dependency order

Fixes will be applied in this order:

1. **Backend contract and repository mismatches** — prevents bad data regardless of UI.
2. **Database migrations and constraints** — only where the intended contract is proven.
3. **Admin forms and API client mappings** — ensures operators can write every supported field.
4. **Customer/public reads and generated manifests** — ensures published content appears correctly.
5. **Operational configuration** — Razorpay webhook secret, deployment variables, cache invalidation, and deployment verification.
6. **Security hardening** — reviewed RLS policies, never RLS enablement without policies.

Each change will include a regression test and migration when needed. Existing live data will be backfilled only with deterministic, reversible SQL and a before/after count.

## Phase 7 — Security and RLS review

The live advisory reports RLS disabled on 12 tables. We will not run the advisory's bare `ENABLE ROW LEVEL SECURITY` statements. First we will define access classes:

- public read-only published content;
- backend service-role read/write;
- admin-only content and mutations;
- private customer/transaction data;
- migration/control data never exposed to clients.

Then we will write explicit policies, test anonymous/authenticated/admin/service-role access, and apply them in a reviewed migration. The migration will be staged and verified before production application.

## Deliverables

1. Complete 28-table/column population matrix.
2. Relationship and lifecycle diagram.
3. Empty-table explanation and trigger matrix.
4. Backend/admin/customer mismatch list with severity and evidence.
5. Controlled lifecycle test results.
6. Code fixes and database migrations, each with regression tests.
7. RLS policy migration and access test report.
8. Deployment verification report covering Render, customer Worker, admin Worker, and Razorpay webhook delivery.

## Exit criteria

The setup is complete only when:

- every supported admin/customer field has a validated persistence path;
- every live table has an owner, lifecycle, and documented empty/null semantics;
- every foreign key is used or intentionally reserved;
- all published content appears in the correct customer frontend surface;
- payment browser callback and webhook paths are both secure and idempotent;
- admin finance, bookings, catalog, local/transfers, tours, policies, and company screens round-trip data correctly;
- database, backend, admin, and customer builds/tests pass;
- RLS policies are explicit and tested rather than merely enabled;
- deployment logs show no schema, validation, or webhook signature errors.

## Proposed execution order for the next working pass

Start with the column-level live null-count and relationship query, then audit the eight currently empty tables and all payment/content tables. After that, trace each admin form against its backend schema and repository SQL, followed by customer/public read paths. This produces evidence for fixes without changing the database prematurely.
