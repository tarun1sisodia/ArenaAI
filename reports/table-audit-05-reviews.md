# Table audit 05 — `public.reviews`

**Audit date:** 2026-10-06  
**Scope:** exactly the ArenaAI `reviews` database domain: migration/schema, domain type, Zod contract, PostgreSQL and memory repositories, service/controller/routes, admin API/page, customer/public readers, foreign-key and moderation lifecycle.  
**Safety:** repository inspection plus read-only Supabase SQL only. No production writes, migrations, replays, deletes, or external submissions were performed.

## Executive summary

`public.reviews` is a moderation queue with a sound basic API lifecycle: an anonymous or authenticated caller submits a review, the backend defaults it to `pending_review`, moderators approve/reject, only an approved review can be published, and the public API returns only published reviews for a published `catalog_items` row. The existing in-memory integration test covers submission → hidden while pending → approve → publish → public visibility and passed (4/4 tests).

The live table is empty, so no live row can validate population behavior. A fresh read-only Supabase query against project `trcmufqbpcymipqpemoq` returned **0 rows**, no status values, and zero null/empty counts (the latter are vacuous because there are no rows). This agrees with `reports/live-schema-inventory.md` (0 rows) and `reports/phase1-table-scan-findings.md` (empty until a customer submits).

Important findings:

1. **High — raw guest booking token is duplicated into `reviews` and the public RLS policy exposes all columns of published rows to direct Supabase table reads.** The Fastify public mapper does not return the token, but a direct Supabase client can select a published row under `reviews_public_read` unless table exposure is separately blocked. Remove the raw token from review persistence or replace it with a non-secret linkage/hash and expose public reviews through a safe projection/view.
2. **Medium — a nonexistent `catalogSlug` is accepted and silently persisted as `catalog_item_id = NULL`.** The Zod schema requires one of `catalogItemId`/`catalogSlug`, but the service does not fail when slug lookup misses. This creates a review that cannot appear on any catalog page. An invalid direct `catalogItemId` instead reaches the FK and fails at the database boundary.
3. **Medium — admin review cards label `bookingId` (a UUID) as the human ticket ID.** The backend returns `ReviewRecord.bookingId`; `admin/src/lib/api.ts` maps it directly to `ticketId`, while the booking table's customer-facing identifier is `ticket_id` (`AGR-YYYYMMDD-NNNN`).
4. **Medium — admin response mapping drops social verification evidence and moderation metadata.** `socialProfileUrl`, `socialPlatform`, `verificationNotes`, `reviewedBy`, `reviewedAt`, and `publishedAt` are returned by the backend record but discarded by `fetchAdminReviews`; moderators cannot inspect a submitted social link or rejection reason in the page.
5. **Medium — the DB role enum includes `review_moderator`, but the backend `UserRole` type and review route allow-list only support `customer` and `super_admin`.** A database profile with the declared `review_moderator` role cannot use the moderation API under the current backend role contract.
6. **Medium product gap — the customer React app has no review submission/read API functions.** The public home review marquee is static data from `react/src/data/catalogue.ts`; the backend review API is exercised by tests/admin but has no customer form/client call. The database-backed public review pipeline is therefore not connected to the current public UI.
7. **Architecture/configuration blocker — reviews FK only to legacy/live `catalog_items`, while the current repository has populated dossier content tables and the live `catalog_items` count is 0.** The public review endpoint requires a published `catalog_items` record. The source-of-truth decision noted in the existing phase-1 report must be made before reviews can reliably attach to the currently populated public products.

## Current live evidence

| Evidence | Result | Interpretation |
|---|---:|---|
| `reports/live-schema-inventory.md` generated 2026-10-05 | `reviews` = **0 rows**, RLS enabled, PK `id` | No live review population exists to sample. |
| Fresh Supabase read-only SQL (2026-10-06) | `row_count=0`; `status_counts={}` | Confirms the inventory; no production lifecycle row was created by this audit. |
| Fresh SQL null/empty counters | all counters `0` | Vacuous on an empty table; not evidence that non-null fields are populated in a future row. |
| Existing in-memory integration test | `admin-catalog.test.ts`, 4/4 passed | Confirms the intended API lifecycle without production mutation. |
| Live related tables | `catalog_items` = 0; `bookings` = 8; `profiles` = 2 | There is no live catalog parent to exercise the public review join, even though bookings exist. |

## Database contract and migration evidence

The table is created by `backend/migrations/0007_create_catalog_reviews_promos.sql:37-55`. Review status and verification enums are created in `0002_create_enums.sql:38-46`. `0009_add_indexes_and_rls.sql:2` adds `idx_reviews_status`; lines 11 and 30-33 enable RLS and create `reviews_public_read` with `status = 'published' OR current_setting('role', true) = 'service_role'`.

The table contract is:

| Column | PostgreSQL null/default | What fills it, condition, and writer | NULL/empty intent and audit result |
|---|---|---|---|
| `id` | `uuid NOT NULL`, default `gen_random_uuid()` | `review.service.submit` creates a new ID with `newId()`; PostgreSQL default is a fallback for direct DB inserts. | Required identity. Not nullable by design. |
| `booking_id` | `uuid NULL`, no default; FK to `bookings(id) ON DELETE SET NULL` | `review.service.submit` sets it only when both ticket and guest token are supplied, the booking exists, token matches, and booking status is exactly `completed`. | NULL is intentional for general/social reviews, anonymous reviews, invalid/incomplete booking proof, and after a booking is deleted. It is a defect only when the UI claims a booking-linked review but the caller supplied a bad/missing proof; currently that input is allowed and merely becomes unverified. |
| `catalog_item_id` | `text NULL`, no default; FK to `catalog_items(id) ON DELETE SET NULL` | Input `catalogItemId` is used directly; otherwise `catalogSlug` is resolved by `db.catalog.getBySlug`. | A valid review should have a catalog parent for public display. NULL is structurally allowed for general reviews and after catalog deletion, but the service also creates it on a nonexistent slug (confirmed defect D-REV-02). |
| `customer_id` | `uuid NULL`, no default; FK to `profiles(id) ON DELETE SET NULL` | `request.user?.id` from optional authentication; public anonymous submissions write NULL. | Intentional for guest submissions and after profile deletion. Authenticated identity is preserved when available. |
| `display_name` | `text NOT NULL`, no default | Submit schema trims, strips tags, allows 2–80 letters/spaces/punctuation; service writes it. | Required public attribution; empty is rejected by Zod. No live row to verify. |
| `rating` | `int NOT NULL`, no default; check 1–5 | Submit Zod schema and database check both enforce integer 1–5. | Required; empty/NULL impossible through the API and DB constraint. |
| `review_text` | `text NOT NULL`, no default | Submit schema trims, length 10–2000, rejects script/javascript and repeated-character spam, strips tags; service writes it. | Required content; empty is rejected. No live row to verify. |
| `status` | `review_status_enum NOT NULL`, default `pending_review` | Submit writes `pending_review`; admin service transitions it to `approved`, `rejected`, `published`, or `archived`. Enum also permits `draft`; no route creates draft. | `pending_review` is intentional quarantine. `published_at` is only meaningful for published history. The enum includes draft but no application writer uses it; this is an unused state, not a current data defect. |
| `verification_status` | `verification_status_enum NOT NULL`, default `unverified` | Submit writes `social_link_submitted` when a social URL is supplied, `booking_verified` only on a completed booking/token match, otherwise `unverified`. Moderation update can preserve or change it via the full `ReviewRecord`. | Non-null by design. `unverified` is intentional for ordinary guest review submission. `manually_verified` is available to the domain but no dedicated API action sets it; an admin would need an alternate update path that does not currently exist. |
| `social_profile_url` | `text NULL`, no default | Submit writes optional validated URL. No moderation route changes it. | NULL is intentional when the customer does not provide social proof. Empty string is not accepted by the URL validator when supplied. The value is currently dropped by the admin client (D-REV-04). |
| `social_platform` | `varchar(40) NULL`, no default | Submit writes optional trimmed alphanumeric/underscore/hyphen platform name. | NULL is intentional when no social link/platform is submitted. There is no DB relation/check tying it to the URL; the API allows platform without URL, which is a weak validation gap. Admin drops it. |
| `verification_notes` | `text NULL`, no default | Submit initializes NULL. Reject transition writes the supplied rejection reason; later transitions preserve the existing note. | NULL is intentional before moderation and for non-rejected rows. A rejection reason is expected after `/reject`; it is not exposed in the admin mapping. |
| `reviewed_by` | `uuid NULL`, no default; **no FK declared** | Approve/reject/publish/archive transition writes `actor.id`; before moderation it is NULL. | NULL is intentional for pending reviews. Absence of FK is an integrity gap: the database cannot guarantee the reviewer still exists or is a profile. |
| `reviewed_at` | `timestamptz NULL`, no default | Every moderation transition writes the service clock time; submit initializes NULL. | NULL is intentional before moderation. It should be non-null for approved/rejected/published/archived rows, subject to direct DB writes. |
| `published_at` | `timestamptz NULL`, no default | Publish transition sets it to the service clock time. Other transitions preserve the prior value. | NULL is intentional until first publish. Retaining it after archive/rejection preserves publication history, while public visibility is controlled by `status`; this is intentional but should be documented. |
| `guest_access_token` | `varchar(64) NULL`, no default | Submit copies the input token whenever supplied, even if the token did not validate a completed booking. No later writer changes it. | NULL is intentional for ordinary non-booking reviews. Persisting the raw token is a security defect under a broad public row policy (D-REV-01). Invalid tokens should not be retained. |
| `created_at` | `timestamptz NOT NULL`, default `now()` | Service writes its clock timestamp; DB default covers direct inserts. | Required creation audit time; not nullable. |

### Validation asymmetries

- `SubmitReviewSchema` is `.strict()` and correctly rejects unknown request keys.
- `catalogItemId` and `catalogSlug` are both optional individually; the refinement only requires one to be present. The service does not assert that the resolved item exists or is published. It also does not reject a request that supplies both values but they refer to different catalog items; `catalogItemId` wins.
- `bookingTicketId` and `guestAccessToken` are optional independently. A token without a ticket, or a ticket without a token, is stored as an unverified review (and the token is still copied if supplied).
- `socialPlatform` can be supplied without `socialProfileUrl`; this is not prohibited by the schema or DB.

## Backend model, mapper, SQL, and lifecycle

### Domain and repository contract

- `backend/src/types/domain.ts:92-108` defines `REVIEW_STATUSES` and `VERIFICATION_STATUSES`.
- `backend/src/types/domain.ts:294-312` defines `ReviewRecord`; nullable DB columns are represented as `string | null`.
- `backend/src/db/types.ts:73-76,208-214` defines review filters and `create/update/get/list/listPublishedByCatalog` repository methods.

### PostgreSQL repository

`backend/src/db/postgres.ts:1085-1141`:

- `create` inserts all 17 columns, including `guest_access_token`.
- `update` intentionally updates only moderation-controlled fields: `status`, `verification_status`, `verification_notes`, `reviewed_by`, `reviewed_at`, `published_at`. It does not mutate author/content/association/token fields.
- `list` supports status and catalog filters and orders by `created_at desc`.
- `listPublishedByCatalog` selects all columns for a catalog ID with `status='published'`, ordered by `published_at desc`.
- `mapReview` (`postgres.ts:1614-1633`) converts nullable DB values to `null`, dates to ISO strings, and maps the raw token into the backend `ReviewRecord`.

The memory repository (`backend/src/db/memory.ts:727-751`) mirrors the repository shape and filters published reviews by catalog ID/status. It does not emulate SQL FK constraints or RLS; it is appropriate for service/API lifecycle tests but not DB-integrity/security testing.

### Service and route lifecycle

`backend/src/modules/reviews/review.service.ts`:

1. `listPublished` (lines 12-33) resolves slug or ID, requires the catalog item itself to be `published`, then calls `listPublishedByCatalog`; its public projection returns only `id`, `displayName`, `rating`, `reviewText`, `verificationBadge`, and `publishedAt`.
2. `submit` (lines 35-71) resolves catalog association, optionally validates a completed booking/token pair, assigns verification status, writes `pending_review`, and initializes moderation timestamps/notes to NULL.
3. `approve`, `reject`, `publish`, and `archive` (lines 74-96) call `transition`. Publish explicitly rejects any current state other than `approved`.
4. `transition` (lines 106-137) writes actor/time, keeps `publishedAt` unless publishing, stores reject reason in `verificationNotes`, and appends an `admin_audit_logs` record with before/after status.

Routes in `review.routes.ts:8-35`:

- `GET /api/v1/catalog/:id/reviews`: public published reader.
- `POST /api/v1/reviews`: public/optional-auth submission, rate limited to 10/minute.
- `GET /api/v1/ops/admin/reviews`: moderation list.
- `POST /api/v1/ops/admin/reviews/:id/{approve,reject,publish,archive}`: moderation actions with rate limits.

`review.controller.ts:21-68` parses Zod schemas and returns compact IDs/statuses for submit/actions. `authenticateRequest` runs globally in `app.ts:179-189`, but submission does not require a logged-in user. Admin actions call `requireRole`; in the current backend role guard every non-`super_admin` role is denied because `REVIEW_ROLES` is `['super_admin']`.

## Admin and customer/public readers/writers

### Admin

- `admin/src/App.tsx:15,100` registers `/reviews` and lazy-loads `ReviewsPage`.
- `admin/src/pages/ReviewsPage.tsx:37-55` first fetches admin catalog items, then reviews. It displays `customerName`, `ticketId`, catalog title, rating, text, status, submission time, and a boolean verified badge; lines 177-200 call approve/reject/publish/archive.
- `admin/src/lib/api.ts:519-550` calls the backend and maps the response. The exact mismatch is line 529: `ticketId: r.bookingId || '—'` (UUID, not `bookings.ticket_id`). Lines 526-537 drop social URL/platform, notes, reviewer, review time, and publication time.
- `admin/src/lib/types.ts:152-170` has a UI-only `Review` shape and includes legacy `pending` in `ReviewStatus`, although the backend enum has `pending_review`.
- The admin page description promises cross-referencing a completed ticket, but it has no ticket lookup and receives only the booking UUID plus a `verifiedBooking` boolean.

### Customer/public

- The backend accepts public submissions at `POST /api/v1/reviews`; no customer auth is required. `customer_id` is populated only when the global auth hook finds a user.
- The customer React API service (`react/src/services/api.ts`) has booking/payment/inquiry functions but no review submit/list function. There is no public review form calling the endpoint.
- `react/src/components/home/ReviewsMarquee.tsx:12-167` imports static `reviews` from `react/src/data/catalogue`, marks every card “Verified,” and never calls the database API. `HomePage.tsx:587-588` renders this marquee. Package detail pages also contain static review copy. Therefore the current public reader is not the database-backed `GET /api/v1/catalog/:id/reviews` reader.
- The backend public reader is safe at the response-shape level because `review.service.listPublished` deliberately omits token, customer ID, social URL, and moderation fields. This does **not** neutralize the direct Supabase table exposure described in D-REV-01.

## Foreign keys and cross-table lifecycle

| Relationship | Delete behavior | Lifecycle meaning |
|---|---|---|
| `reviews.booking_id → bookings.id` | `ON DELETE SET NULL` | A review can be linked to a completed booking; deleting the booking preserves review text but removes the booking association. No cascade cleanup. |
| `reviews.catalog_item_id → catalog_items.id` | `ON DELETE SET NULL` | The review survives catalog deletion but loses its public parent. The public reader also requires the parent item to be published, so a deleted/archived parent makes the review unreachable publicly. |
| `reviews.customer_id → profiles.id` | `ON DELETE SET NULL` | Guest/anonymous attribution and profile deletion are supported; `display_name` remains the durable public name. |
| `reviews.reviewed_by` | No FK in migration | Actor ID is written by moderation code but DB referential integrity is absent. |

The booking verification chain is `review.booking_id → bookings.id`, with lookup by human `bookings.ticket_id` plus `bookings.guest_access_token`; it is not a direct FK on ticket text. A booking is considered review-verifiable only at status `completed`, not merely paid or in transit. There is no automatic booking-completed job/webhook that creates a review; customer action is required.

The catalog chain is `review.catalog_item_id → catalog_items.id`; it does not point to `route_catalog`, `tour_packages`, `local_sightseeing_packages`, or `transfer_routes`. Existing reports identify those dossier tables as populated while `catalog_items` is empty. This is the key source-of-truth blocker for attaching real current content to reviews.

## Exact findings and recommended fixes

### D-REV-01 — High: raw guest token can be exposed through direct published-row reads

**Evidence:** migration `0007:53` stores `guest_access_token`; service `review.service.ts:69` copies any supplied token, even when it fails booking verification; `0009:30-33` permits SELECT of all columns for published reviews; PostgreSQL `create` and `mapReview` carry the raw token. Fastify's public projection omits it, but RLS does not hide columns from Supabase's table API.

**Impact:** if a review is published and Supabase table REST is reachable by anon/authenticated clients, the booking access token may be readable and reusable against booking/payment endpoints. The token is also retained for invalid/incomplete proof attempts.

**Fix:** stop persisting the raw token in `reviews`; if correlation is required, persist a one-way hash or a non-secret booking-review linkage. Add a safe public view/projection containing only public review columns, revoke direct table SELECT for anon/authenticated, and keep service-role/admin access through the backend. Add a regression test asserting the public projection cannot return a booking token.

### D-REV-02 — Medium: unknown catalog slug creates an orphan review

**Evidence:** `review.schema.ts:34-37` only checks that either identifier is present. `review.service.ts:37-40` resolves a slug to `item?.id ?? null` and proceeds. The DB permits `catalog_item_id NULL`.

**Impact:** `POST /api/v1/reviews` with a typo/nonexistent slug returns 201 and creates a pending review that can never appear under a catalog item. It also makes admin “General” reviews indistinguishable from intentional general reviews.

**Fix:** after slug lookup, throw a typed 404 (`CATALOG_NOT_FOUND`) when no item exists; require the item to be published if reviews are only for public products, or explicitly document a separate general-review mode. If both ID and slug are supplied, resolve and require they identify the same item. Add API tests for unknown slug, unpublished item, and mismatched ID/slug.

### D-REV-03 — Medium: admin displays booking UUID as ticket ID

**Evidence:** `admin/src/lib/api.ts:529` maps `ticketId: r.bookingId`; `ReviewRecord.bookingId` is the UUID from `reviews.booking_id`; the customer-facing booking ticket is `bookings.ticket_id` (inventory `bookings:74`). `ReviewsPage.tsx:156-158` renders that value as a ticket ID.

**Fix:** enrich the admin review list in the backend by joining/resolving `booking_id` to `bookings.ticket_id`, returning `bookingTicketId` (and optionally booking status). Map that field in the admin client and retain UUID only as an internal ID. The completed-booking cross-check should show the actual `AGR-...` ticket.

### D-REV-04 — Medium: moderation UI drops social verification and moderation metadata

**Evidence:** PostgreSQL mapper and admin endpoint return the full `ReviewRecord`, but `fetchAdminReviews` maps only ID/name/booking/catalog/rating/text/status/time/boolean verification. `ReviewsPage` has no social URL/platform or notes display.

**Impact:** a moderator cannot inspect the evidence that caused `social_link_submitted`, cannot see a rejection reason after reload, and cannot see when/by whom the record was reviewed. This undermines the stated moderation workflow.

**Fix:** extend the admin DTO/type/UI with `socialProfileUrl`, `socialPlatform`, `verificationStatus`, `verificationNotes`, `reviewedBy`, `reviewedAt`, and `publishedAt`. Keep `guestAccessToken` excluded from all admin/public DTOs unless a protected operational action specifically needs it.

### D-REV-05 — Medium: database role enum and backend moderation role contract disagree

**Evidence:** `0002_create_enums.sql:21-24` defines `content_editor`, `review_moderator`, `dispatcher`, and `finance_operator`; live inventory confirms the same enum. `domain.ts:55-59` defines only `customer` and `super_admin`; `roleGuard.ts:17-19` sets `REVIEW_ROLES = ['super_admin']`.

**Impact:** a declared `review_moderator` profile cannot pass the review moderation allow-list. This is either a deliberate least-privilege policy that was not documented in the DB model or a broken role contract.

**Fix:** choose and document the policy. If `review_moderator` is intended, add all live roles to backend `USER_ROLES`, map auth claims/profile roles safely, set `REVIEW_ROLES = ['review_moderator', 'super_admin']`, and keep publish restricted if desired. Add role matrix tests. If super-admin-only is intentional, remove/rename the unused DB role or document the intentional restriction.

### D-REV-06 — Medium: customer UI does not use the database review lifecycle

**Evidence:** no review functions in `react/src/services/api.ts`; `ReviewsMarquee.tsx:13` imports static catalogue data and lines 118-160 render it; no component calls `POST /api/v1/reviews` or `GET /api/v1/catalog/:id/reviews`.

**Impact:** customers cannot submit through the current React site, and public pages cannot show moderated DB reviews. The database/API lifecycle is test- and admin-accessible but not product-connected.

**Fix:** add a customer review form/API client that sends the exact Zod payload, ideally from a completed-booking voucher with ticket/token, and replace or clearly distinguish static editorial testimonials from dynamic published reviews. Add loading/empty/error states and never display unmoderated rows.

### G-REV-07 — Medium architecture blocker: parent source-of-truth is unresolved

**Evidence:** live inventory reports `catalog_items = 0`; dossier content tables are populated; reviews only FK to `catalog_items` and public service rejects any parent not `published`. Existing phase-1 report explicitly calls the legacy/catalog-vs-dossier arrangement a source-of-truth decision for Phase 2.

**Impact:** reviews attached through the current API cannot target the populated dossier product records unless a corresponding `catalog_items` row exists. This is not safely fixable inside the reviews audit without a cross-domain source-of-truth decision.

**Fix:** choose one canonical product table, then migrate/bridge the review FK and public/admin lookup paths as a reviewed schema/application change. Until then, mark dynamic reviews as dependent on `catalog_items` and do not fabricate live review rows.

### G-REV-08 — Low/Medium integrity gap: `reviewed_by` lacks a foreign key

**Evidence:** migration declares FKs for booking, catalog, and customer only (`0007:39-41`); `reviewed_by` is a bare UUID (`0007:50`). Service writes `actor.id` on every moderation transition.

**Impact:** a stale/nonexistent reviewer ID can be stored by direct DB writes or a future auth integration. Current API actors are expected to be authenticated users, so no bad live row is confirmed.

**Fix:** after confirming `profiles` is the canonical actor table and role lifecycle, add `reviews_reviewed_by_fkey` to `profiles(id)` with an appropriate delete behavior, or document why service-role actors are intentionally not profile rows.

## Intentional NULL/empty summary

- Empty live table: no current row has a NULL or empty value; all population counts are unknown for future rows.
- `booking_id`, `customer_id`, social fields, moderation fields, `published_at`, and `guest_access_token` are nullable because they are event/identity-dependent. Their conditions are listed in the column matrix above.
- `display_name`, `rating`, and `review_text` are intentionally non-null/non-empty and are protected by Zod plus DB constraints.
- `verification_status='unverified'` and `status='pending_review'` are intentional initial states, not defects.
- `published_at` remaining non-null after archive is intentional publication history; public visibility still depends on `status='published'`.
- `guest_access_token` being NULL when no token was supplied is intentional; retaining a supplied raw token is not intentional and is D-REV-01.

## Bounded lifecycle validation

**Already executed, read-only with respect to production:**

```text
npm test -- --run tests/integration/admin-catalog.test.ts
Test Files: 1 passed
Tests: 4 passed
Relevant test: “hides unpublished catalog and review content”
```

That test uses `createTestApp()` and the in-memory repositories. It creates a disposable catalog item and booking in the test process, submits a review, verifies the pending review is absent from the public reader, approves it, publishes it, and verifies it becomes visible. It does not call Supabase or production endpoints. This is the correct bounded test for the basic lifecycle.

**Recommended additional bounded tests (still in-memory/disposable):**

1. Submit with a valid completed booking ticket/token → `bookingId` populated and `verificationStatus=booking_verified`; wrong token/incomplete booking → `bookingId=NULL`, `unverified`, and (after D-REV-01 fix) no raw token retained.
2. Submit with unknown slug → 404 and no review row; unpublished parent → explicit rejection or documented policy; both ID and slug disagree → 400.
3. Admin list response → actual `bookingTicketId`, social evidence, and moderation metadata are present while token is absent.
4. State tests: pending cannot publish; approved can publish; public reader hides rejected/archived; published then archived retains history but is not returned.
5. Role matrix: super-admin, intended review moderator (if enabled), customer, and anonymous requests.

**Why production remains read-only:** the live table has zero rows, the live catalog parent is empty, and a real submission would create customer data and potentially a booking-token-bearing row. Production review submission, approval, publication, migration, and webhook actions require an explicitly reviewed operational run, not this audit.

## Recommended fix order

1. **Security:** remove/hash raw `guest_access_token`; restrict direct Supabase table projection/access; add projection regression test.
2. **Data integrity:** reject unknown/unpublished catalog references and reconcile ID/slug inputs.
3. **Admin contract:** return `bookingTicketId`, preserve verification/moderation metadata, and update the admin UI.
4. **Role contract:** reconcile DB enum and backend role policy.
5. **Product integration:** decide the canonical catalog parent, then connect customer submission and dynamic public reads.
6. **Integrity hardening:** add `reviewed_by` FK if profiles are the canonical actor table; add the bounded regression matrix above.

## Source index

- `backend/migrations/0002_create_enums.sql`
- `backend/migrations/0007_create_catalog_reviews_promos.sql`
- `backend/migrations/0009_add_indexes_and_rls.sql`
- `backend/src/types/domain.ts`
- `backend/src/db/types.ts`
- `backend/src/db/postgres.ts`
- `backend/src/db/memory.ts`
- `backend/src/modules/reviews/review.schema.ts`
- `backend/src/modules/reviews/review.service.ts`
- `backend/src/modules/reviews/review.controller.ts`
- `backend/src/modules/reviews/review.routes.ts`
- `backend/src/middlewares/roleGuard.ts`
- `admin/src/lib/api.ts`
- `admin/src/lib/types.ts`
- `admin/src/pages/ReviewsPage.tsx`
- `react/src/services/api.ts`
- `react/src/components/home/ReviewsMarquee.tsx`
- `react/src/data/catalogue.ts`
- `backend/tests/integration/admin-catalog.test.ts`
- `reports/live-schema-inventory.md`
- `reports/schema-model-alignment.md`
- `reports/schema-audit-findings.md`
- `reports/phase1-table-scan-findings.md`
- `reports/2026-10-06-16-table-alignment-execution-plan.md`
