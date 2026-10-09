# Table audit 08 — `admin_audit_logs` and `notification_jobs`

**Audit date:** 2026-10-06  
**Scope:** exactly `public.admin_audit_logs` and `public.notification_jobs`, including their booking/FK lifecycle and all first-party writers/readers.  
**Safety:** repository inspection, existing artifacts, static typecheck, and read-only Supabase SQL only. No production writes, migrations, deletes, webhook replay, provider submissions, or external submissions were performed.

## Executive summary

Both tables exist in the live Supabase database and their PostgreSQL-to-backend persistence mappings are present. The current live query returned **8 audit rows and 8 notification rows**. The supplied `reports/live-schema-inventory.md` was generated on 2026-10-05 and reports 8 audit rows/4 notification rows; the direct current Supabase query is newer and is treated as authoritative for the row-count snapshot.

The notification lifecycle is functioning for WhatsApp but is provider-blocked for email: four WhatsApp jobs are `sent` with provider IDs and four email jobs are `failed` after three attempts. The email failures contain provider errors (invalid Resend API key or unverified `gmail.com` sender/domain), so they are configuration blockers rather than database persistence defects.

The most important confirmed defects are at the admin audit API/UI boundary:

1. The backend returns canonical fields (`actorId`, `before`, `after`, `reason`, `requestId`, `createdAt`), while the admin client expects (`actor`, `ip`, `detail`, `at`). The UI therefore displays fallback `Staff`, `—`, and blank detail for live rows and loses the before/after/reason/request context.
2. Backend audit actions are lower-case/domain-specific (`republish`, `update_fare_rules`, `publish`, `archive`, `delete`, etc.), while the admin `AuditAction`/tone map is an unrelated uppercase vocabulary. Live actions `republish` and `update_fare_rules` are already outside the frontend union/tone map.
3. The catalog update service hardcodes `requestId: ""`; the media-delete path falls back to `""` when not supplied. The database only enforces non-NULL, so an audit row can be present but not traceable to a request. The controller does not pass its generated request ID to catalog update.
4. A successful notification retry does not clear a prior `last_error`; a job that fails once and then succeeds can remain `sent` with stale error text.

The audit UI also claims “hash-chained” immutability, but the table has no hash column, trigger, or hash-chain implementation. The application exposes append/list only, and RLS restricts direct access, but “append-only/hash-chained” is not proven by the current schema/code.

## Live row-count and null/empty evidence

Direct read-only Supabase `execute_sql` was run against project `trcmufqbpcymipqpemoq` (`trcmufqbpcymipqpemoq`). Results:

| Table | Current rows | Important null/empty result |
|---|---:|---|
| `admin_audit_logs` | **8** | All NOT NULL columns populated; `before_state` NULL: 0; `after_state` NULL: 0; `reason` NULL/empty: 0. |
| `notification_jobs` | **8** | All NOT NULL columns populated; `provider_message_id` NULL/empty: 4; `last_error` NULL/empty: 4. |

Current audit distribution: `update_fare_rules`/`fare_rules`: 6; `republish`/`catalog_manifest`: 2. Current notification distribution: 4 `whatsapp` + `skb_payment_confirmed`, `sent`, attempts 1, provider ID populated; 4 `email` + `payment_confirmed`, `failed`, attempts 3, provider ID NULL and error populated.

Current notification rows all have valid booking FK matches (`orphan_booking_fks = 0`). The four email errors were:

- `401`: `API key is invalid` (two rows).
- `403`: `The gmail.com domain is not verified. Please, add and verify your domain on https://resend.com/domains` (two rows).

The direct query is newer than the saved inventory: `reports/live-schema-inventory.md` line 21 says 4 notification rows, while the current query found 8. This is evidence drift in a dated artifact, not evidence of duplicate rows or an FK problem.

## Database contract and migration evidence

Migration `backend/migrations/0008_create_audit_notifications_inquiries.sql` defines both tables.

### `admin_audit_logs`

| Column | DB type/nullability/default | Population and meaning |
|---|---|---|
| `id` | `uuid NOT NULL`, no DB default | Generated in the backend with `newId()` for every append. Primary key. Empty is impossible under DB/type contract. |
| `actor_id` | `uuid NOT NULL` | Authenticated staff actor ID supplied by the service. It is required in the domain record. The migration does **not** add an FK to `profiles` or `auth.users`; referential validity is application-trusted. |
| `actor_role` | `user_role_enum NOT NULL` | Actor role at event time. Current admin paths use `super_admin`; migration enum also permits customer/content/editor/etc. Domain `UserRole` currently narrows to `customer | super_admin`, while live inventory lists the broader enum. |
| `resource_type` | `text NOT NULL` | Domain label such as `fare_rules`, `catalog_manifest`, `catalog_item`, `catalog_media`, or `review`. Every writer supplies it. Empty should be a defect; no current empty values. |
| `resource_id` | `text NOT NULL` | Version, entity ID, or logical resource ID. Every writer supplies it. Empty should be a defect; no current empty values. |
| `action` | `text NOT NULL` | Domain action supplied by writer (`update_fare_rules`, `activate_fare_rules`, `republish`, `update`, `publish`, `archive`, `delete`, `approve`, `reject`). No DB enum/check constrains vocabulary. Empty should be a defect; no current empty values. |
| `before_state` | `jsonb NULL` | Snapshot before the operation when meaningful. NULL is intentional for events without a prior snapshot (fare updates/activation currently write NULL; media deletion writes a before snapshot). |
| `after_state` | `jsonb NULL` | Snapshot after the operation when meaningful. NULL is intentional for destructive operations such as media deletion; current live rows happen to have no NULL after-state. |
| `reason` | `text NULL` | Optional operator explanation. NULL is intentional for normal catalog/review transitions; fare-rule writers generate a reason. Current live rows all happen to have a reason because the current rows are fare/manifest operations. |
| `request_id` | `text NOT NULL` | HTTP/request correlation ID, or generated request-like ID for fare-rule service methods. It must be nonempty for useful auditability. DB only prevents NULL, not `''`; catalog update currently writes `''`. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Event time supplied by service (`clock`) on normal writes; DB default is a fallback only. No current NULLs. |

Migration `0009_add_indexes_and_rls.sql` adds `idx_audit_created` and enables RLS. Migration `0016_comprehensive_rls_policies.sql` adds a `service_role_all` policy for this table. There is no update/delete repository method, DB trigger, immutable rule, hash column, or hash-chain trigger.

### `notification_jobs`

| Column | DB type/nullability/default | Population and meaning |
|---|---|---|
| `id` | `uuid NOT NULL`, no DB default | `newId()` from the notification service. Primary key. |
| `booking_id` | `uuid NOT NULL`, no default, FK to `bookings(id) ON DELETE CASCADE` | Always the booking that caused the notification. Filled by `queuePaymentConfirmed`. NULL/empty is a defect; current FK check has zero orphans and the column has no NULLs. |
| `channel` | `varchar(20) NOT NULL` | Internal service currently writes `whatsapp` or `email`. DB has no CHECK; a direct/service-role writer could persist an unsupported channel. NULL/empty is a defect. |
| `template_key` | `text NOT NULL` | WhatsApp uses configured `paymentTemplate` (live `skb_payment_confirmed`); email uses `payment_confirmed`. NULL/empty is a defect. |
| `dedupe_key` | `text NOT NULL UNIQUE` | `whatsapp:payment:<booking UUID>` or `email:payment:<booking UUID>`. The repository checks this key before insert and DB uniqueness is the final idempotency guard. NULL/empty is a defect. |
| `payload` | `jsonb NOT NULL DEFAULT '{}'` | WhatsApp payload contains ticket and advance; email payload contains `to`, `subject`, and `text`. Empty `{}` is DB-valid but would be a service contract defect for these templates; current rows have populated payloads. |
| `status` | `varchar(20) NOT NULL DEFAULT 'queued'` | `queued` at insert, `sent` after provider success, `failed` after the third failed attempt. DB has no CHECK; domain union is the only vocabulary enforcement. NULL/empty is a defect. |
| `attempt_count` | `int NOT NULL DEFAULT 0` | Starts at 0; increments on every provider attempt; successful live WhatsApp rows are 1 and failed email rows are 3. NULL is a defect. |
| `provider_message_id` | `text NULL` | Provider response ID after successful send. NULL is intentional while queued and after a terminal failed send; live failed email rows are NULL. |
| `last_error` | `text NULL` | Set to a bounded provider/validation error on failed attempts. NULL is intentional for never-attempted or successfully completed jobs; live sent WhatsApp rows are NULL. **Current code does not clear this field on a later successful retry.** |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Set by service clock at enqueue. |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Set by service clock on each state transition. |

Migration `0015_add_foreign_key_indexes.sql` adds `idx_notification_jobs_booking_id`. Migration `0009` enables RLS; migration `0016` gives service-role all access. There is no public/admin read route for jobs and no customer-facing job reader.

## Backend model, schemas, mapper, and SQL alignment

### Audit model and persistence

- Domain type: `backend/src/types/domain.ts:329-341`, `AuditLogRecord`.
- Repository interface: `backend/src/db/types.ts:226-229`, `audit.append/list`.
- PostgreSQL writer/reader: `backend/src/db/postgres.ts:1243-1271`.
  - Insert explicitly names all 11 columns and serializes `before`/`after` to JSONB.
  - List maps snake_case DB fields to canonical camelCase domain fields.
- Memory repository: `backend/src/db/memory.ts:806-813`; append/list semantics mirror the interface.
- There is no Zod schema for audit records. Audit records are internally constructed typed objects; request body Zod schemas validate the surrounding admin operations, not the persisted audit event.

### Notification model and persistence

- Domain type: `backend/src/types/domain.ts:371-384`, `NotificationJobRecord`; status/channel are TypeScript unions.
- Repository interface: `backend/src/db/types.ts:244-249`.
- PostgreSQL writer/reader: `backend/src/db/postgres.ts:1339-1368`.
  - Insert explicitly persists all fields.
  - Update intentionally changes only lifecycle fields: `status`, `attempt_count`, `provider_message_id`, `last_error`, and `updated_at`; booking/template/payload/dedupe are immutable through this repository.
  - `mapNotification` at `backend/src/db/postgres.ts:1653-1667` maps all columns and converts nullable provider/error values to `null`.
- Memory repository: `backend/src/db/memory.ts:864-882`; it mirrors dedupe lookup and queued listing, but does not enforce the DB unique constraint or the `attempt_count < 3` query predicate.
- There is no Zod schema for notification jobs. The service constructs them from trusted `BookingRecord` data; database varchar columns have no status/channel CHECK constraints.

## Writers and lifecycle conditions

### Audit log writers

1. **Fare rules:** `backend/src/modules/admin/admin.service.ts:160-194` writes `update_fare_rules` after saving a new fare rule; `before` is NULL, `after` is the submitted updates, `reason` includes admin identity, and a generated `req_*` ID is used. `activateFareRules` at lines 197-220 writes `activate_fare_rules` with `before` NULL and an after state.
2. **Catalog manifest republish:** `backend/src/modules/catalog/catalog.service.ts:201-216` writes `republish` after rebuilding the manifest. `before`/`after` contain manifest version, reason is fixed text, and controller passes `request.requestId`.
3. **Catalog update:** `catalog.service.ts:281-313` writes `update` after persistence. It captures a small before/after projection and intentionally uses `reason: null`, but hardcodes `requestId: ""`. `catalog.controller.ts:79-85` does not pass `request.requestId` into `service.update`, so this is a real traceability defect on every API catalog update audit row.
4. **Catalog publish/archive:** `catalog.service.ts:315-369` writes after changing status; controller passes `request.requestId`. `reason` is NULL by design.
5. **Catalog media delete:** `catalog.service.ts:476-505` writes after deleting the media row/object, with a before snapshot and `after: null` by design. It uses `requestId: requestId ?? ""`; the current HTTP controller passes the request ID, but non-HTTP/direct callers can create an empty correlation value.
6. **Review moderation:** `backend/src/modules/reviews/review.service.ts:106-139` writes `approve`, `reject`, `publish`, or `archive` after the status update. Reason is only populated for rejection when supplied; before/after contain status.

The audit table has no generic trigger, so any new sensitive writer must explicitly call `audit.append`; there is no automatic coverage for booking transitions, refunds, PII views, or login despite the admin UI copy claiming those actions are logged. Existing repository search found no audit append in booking transition, refund, auth login, or notification processing paths.

### Notification job writers and worker

- `backend/src/modules/payments/payment.service.ts:350-413` confirms a payment/booking lifecycle and invokes `queuePaymentConfirmed` when a booking becomes `paid_confirmed`; it also repairs a missing WhatsApp job if the booking is already confirmed.
- `backend/src/modules/notifications/notification.service.ts:18-45` enqueues WhatsApp for every confirmed booking, and email only when `customerEmail` is present and contains `@`. It then immediately calls `processQueued`.
- `enqueue` at lines 52-81 performs dedupe lookup, creates a queued row with attempt 0, provider/error NULL, and channel-specific payload.
- `processQueued` at lines 84-147 lists queued jobs. It sends WhatsApp via `MessagingProvider` using the booking phone and sends email using payload recipient. Success sets `sent`, increments attempts, and writes provider ID. Failure increments attempts, stores an error truncated to 500 characters, retains `queued` until attempt 3, then marks `failed`.
- `backend/src/server.ts:7-21` runs the same worker every 15 seconds; the interval is `unref()`ed. This is a process-local worker, not a durable queue scheduler.
- No admin/customer/public route reads or manually retries these rows. The admin top-bar “notifications” are projections of **audit logs**, not `notification_jobs` (`admin/src/components/admin/AdminLayout.tsx:52-76`).

## Admin, customer, and public readers

### Admin audit reader

- Backend route: `backend/src/modules/admin/admin.routes.ts:8-11`, `GET /api/v1/ops/admin/audit-logs`.
- Controller: `admin.controller.ts:42-46` requires `ADMIN_ROLES` and calls `service.listAuditLogs(100)`.
- Service: `admin.service.ts:75-77` returns the repository’s canonical domain records.
- The controller does not parse `request.query`; therefore the client’s `?limit=5`/`?limit=100` is ignored and the backend always returns 100 rows (bounded only by SQL limit).
- Admin client: `admin/src/lib/api.ts:273-290` expects `actor`, `ip`, `detail`, and `at`, but backend returns `actorId`, `actorRole`, `before`, `after`, `reason`, `requestId`, and `createdAt`. Its fallbacks make the mismatch visible: actor becomes `Staff`, IP becomes `—`, detail becomes empty. Before/after/reason/request ID are not surfaced.
- Admin types/UI: `admin/src/lib/types.ts:231-241` and `admin/src/pages/AuditPage.tsx:13-24,149-161` define an uppercase fixed action union and render detail/IP columns. The live lower-case actions are outside that union and outside `ACTION_TONES`, so their styling is undefined and the UI contract is not aligned.

### Notification readers

No admin, customer, or public reader exists for `notification_jobs`. The only readers are the notification service’s dedupe lookup/queued-worker query and the PostgreSQL/memory repositories. This is intentional for an internal operational queue, but it means operators cannot inspect or retry a failed email from the admin UI.

### Customer/public connections

Customers do not directly read either table. A payment capture/checkout verification or accepted signed webhook changes `payments`/`bookings`; only after `paid_confirmed` does the server create notification jobs. The public booking/payment response is not a notification-job response. Audit logs are security-sensitive and should remain admin-only.

## Relationships and cross-table lifecycle

- `notification_jobs.booking_id -> bookings.id` has `ON DELETE CASCADE`; deleting a booking cascades its notification rows. The supporting index is created by migration 0015. Current live read-only integrity check found zero orphan notification jobs.
- A booking can produce up to two deduped jobs: `whatsapp:payment:<booking UUID>` and, only with a syntactically valid email, `email:payment:<booking UUID>`. The unique `dedupe_key` plus pre-insert lookup make repeated capture callbacks idempotent at the enqueue layer.
- Payment service uses both `payments` and `bookings`; notification jobs are downstream of the `booking.status = paid_confirmed` transition. `raw_webhooks` may be upstream when a signed webhook is accepted, but the browser verification path can also confirm payment without creating a webhook row.
- `admin_audit_logs` has **no foreign keys**. `actor_id` is intended to point to the authenticated profile/auth user, but the migration does not enforce it. `resource_id` is polymorphic text and intentionally cannot have a single FK. Its resource lifecycle is append-after-mutation, not transactional in the visible service methods; a persistence failure after a catalog change could leave the mutation without an audit row unless the caller wraps both operations in a transaction.
- There is no FK from audit logs to notification jobs, payments, or bookings, and notification processing does not create audit rows.

## Findings by severity

### Confirmed defects

**HIGH — Admin audit response/UI contract drops evidence.** `admin.service.ts` returns canonical `AuditLogRecord`, but `admin/src/lib/api.ts:279-289` reads different keys. Live rows therefore render as fallback actor `Staff`, IP `—`, and blank detail; `before_state`, `after_state`, `reason`, and `request_id` are silently omitted. Fix the client to map canonical fields (or deliberately add a backend presentation DTO), and render before/after/reason/request ID safely.

**HIGH — Action vocabulary mismatch.** Live actions are `republish` and `update_fare_rules`; backend writers also emit `update`, `publish`, `archive`, `delete`, `approve`, `reject`, and `activate_fare_rules`. The frontend union/tone map is uppercase (`CATALOG_PUBLISHED`, `REVIEW_APPROVED`, etc.) and does not contain live values. Fix one canonical action vocabulary at the backend boundary and update the admin union/tone map; do not merely cast `any`.

**MEDIUM — Catalog update audit rows lose request correlation.** `catalog.service.ts:297-309` stores `requestId: ""`, while `catalog.controller.ts:79-85` does not pass `request.requestId`. The NOT NULL constraint does not prevent the empty string. Change the service signature/controller call to pass the request ID and reject/avoid empty IDs. Also ensure direct callers receive a generated ID.

**MEDIUM — Successful notification retries retain stale errors.** In `notification.service.ts:114-135`, the success updates spread `job` but do not set `lastError: null`. A transient provider error followed by success produces a `sent` row with a misleading non-NULL `last_error`. Explicitly clear `lastError` on both WhatsApp and email success; add a regression test.

**MEDIUM — “Hash-chained immutable” UI claim is unsupported.** `AuditPage.tsx:87-89` advertises an append-only/hash-chained trail, but migration 0008 has no hash columns and no immutability/hash trigger. Repository API is append/list only, which is not an enforcement mechanism against service-role SQL. Either implement and test a real chain/immutable policy, or change the copy to accurately describe a service-role-protected append convention.

**LOW — Audit list limit query is ignored.** `fetchAdminAuditLogs(limit)` sends a query parameter, but `admin.controller.ts:42-45` always calls `listAuditLogs(100)` without parsing it. This is a boundedness/contract defect, not a data-integrity defect.

### Configuration blockers

- **Email provider configuration:** all four current email jobs reached terminal `failed` after three attempts. The persisted errors show invalid API key (401) and unverified `gmail.com` domain (403). Configure a valid provider key and verified sender domain, then use a separately approved operational retry mechanism; this audit did not retry or submit externally.
- WhatsApp rows are `sent` with provider IDs. The current IDs have a `wa_noop_...` shape in the live data, so provider delivery confirmation should not be inferred beyond the recorded adapter result.

### Intentional NULL/empty values

- Audit `before_state` NULL when no prior snapshot is applicable (fare-rule writes/activation); `after_state` NULL for destructive media deletion; `reason` NULL for routine transitions.
- Notification `provider_message_id` NULL before provider success and for terminal failures; `last_error` NULL on clean success or before any attempt.
- Email jobs are intentionally not created when the booking has no email or fails the service’s simple `@` validation. This is a delivery policy, not a nullable DB defect.
- No public/customer reader is intentional because audit logs and delivery queue internals are sensitive.

## Bounded lifecycle tests and read-only limitation

No production lifecycle mutation was run because even a “test” payment confirmation would create jobs and invoke external messaging/email providers. A safe bounded test should use the in-memory repository and stub providers only:

1. Seed one `BookingRecord` with `paid_confirmed`, valid phone, and valid email.
2. Call `queuePaymentConfirmed`; assert exactly two jobs, expected dedupe keys, payloads, status `sent`, attempts 1, and provider IDs.
3. Call it again; assert row count remains two (dedupe idempotency).
4. Use a provider stub that fails twice then succeeds; call `processQueued` between attempts; assert attempts 1→2→3, final `sent`, provider ID set, and **`lastError === null`** after the successful retry (this currently exposes the confirmed defect).
5. Use a provider stub that always fails; assert terminal `failed` at attempt 3 and no fourth attempt.
6. Separately exercise audit append/list in memory and assert canonical fields survive mapping; test every action string against the admin DTO/action map.

The test must remain in-memory/stubbed: the live database has real customer/payment-linked records, and running the lifecycle against it would be a production write and could trigger external submissions. The only live validation performed here was read-only SQL and backend `npm run typecheck`, which passed.

## Recommended fixes, in dependency order

1. Define a canonical audit response DTO/action vocabulary. Map `actorId`, `actorRole`, `before`, `after`, `reason`, `requestId`, and `createdAt` into the admin contract; decide whether to join a display name or intentionally show the ID. Update the frontend action union/tone map and display real detail/context.
2. Propagate `request.requestId` through catalog update and require nonempty IDs in all audit writers. Add a DB CHECK such as `length(btrim(request_id)) > 0` only after cleaning/handling existing data.
3. Clear `last_error` on notification success and add in-memory retry/idempotency tests.
4. Add DB CHECK constraints for `notification_jobs.channel` and `status`, or route all writes through a validated server boundary with equivalent runtime validation. Add a Zod/internal constructor schema if jobs may be accepted from outside the notification service.
5. Decide whether audit actor referential integrity should be enforced with an FK to `profiles` (or document why auth-user deletion must be allowed); consider a polymorphic resource reference policy rather than pretending one FK is possible.
6. Either implement actual tamper-evidence/immutability (hash chain, append-only trigger/policy, and verification) or remove the unsupported UI claim. Keep direct reads admin/service-role only.
7. Parse and enforce the audit list limit at the backend route, with a bounded positive integer schema.
8. Fix email provider credentials and verify a sender domain in a separate approved staging/production operation. Do not replay failed jobs as part of this audit.
9. Add an admin-only, read-only notification queue view and an explicitly controlled retry action only after provider configuration, authorization, idempotency, and audit requirements are reviewed.
