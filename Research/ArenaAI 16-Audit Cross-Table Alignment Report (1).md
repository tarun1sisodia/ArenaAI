# ArenaAI 16-Audit Cross-Table Alignment Report

**Audit date:** 2026-10-06  
**Scope:** 16 successful structured audits covering 27 physical tables plus their migrations, backend domain contracts, repositories, APIs, admin/customer readers, public manifests, RLS, and bounded tests.  
**Evidence rule:** This report uses only the supplied audit results. Current read-only Supabase evidence is treated as stronger than older inventory snapshots when counts differ. No production write, migration, deletion, status change, refund, webhook replay, upload, external submission, or RLS change was performed.

## 1. Executive summary

ArenaAI is **substantially aligned on ordinary persistence and happy-path data flow**, but it is not release-ready for unrestricted operation. The strongest current evidence shows that core booking/payment, profile, fare snapshot, catalog, dossier, and notification records are present and generally map correctly across migrations, backend code, and clients. The dominant risks are not widespread observed corruption; they are **security configuration gaps, cross-source publication mismatches, financial lifecycle defects, and contract drift that is latent or becomes visible on less common paths**.

### Overall conclusions

- **16/16 supplied audits succeeded; 0 failed agents.**
- **27 physical tables** were covered. Current live populations include 2 profiles, 8 bookings, 12 booking intents, 11 payments, 14 fare rules, 2 promo codes, 8 audit logs, 8 notification jobs, 40 location-cache rows, 10 route-catalog rows, 3 local-package rows, 6 transfer routes, 11 tour packages, 4 package upgrades, 9 cancellation policies, 1 company profile, 1 pet policy, 10 monuments, 10 signoffs, and 32 migration-ledger rows. Several audited tables are intentionally empty.
- **No current orphan evidence was found** for the audited profile/device, booking/intent, payment/booking, notification/booking, or package-upgrade relationships where checks were reported. Empty tables are not being treated as defects without a writer/reader explanation.
- **The most urgent security issue is RLS exposure.** Live RLS is disabled on `fare_rules`, `route_catalog`, `local_sightseeing_packages`, `transfer_routes`, all five policy/company dossier tables, both tour-package tables, and `schema_migrations`; `schema_migrations` additionally has broad anon/authenticated DML grants. Reviews and other enabled tables still require policy/projection review before direct access is assumed safe.
- **The most urgent business-integrity issues are financial and booking lifecycle defects:** zero-amount refund rows violate the positive-amount database check; cancellation creates pending refund intents without provider execution/worker completion; refund webhooks do not update refund rows or booking state; and invalid promo codes can be persisted and later consume redemption counts.
- **The most important product architecture issue is multiple content sources without a single canonical route/package source.** `catalog_items`, dossier tables, `route_catalog`, static React data, generated snapshots, and optional deploy hooks can disagree. Admin-published route/transfer content is not consistently guaranteed to reach customer catalog, booking selection, or fare resolution.
- **Several live row-count discrepancies are stale-report discrepancies, not data corruption:** current read-only queries supersede older inventory values for `payments` (11 vs 9) and `notification_jobs` (8 vs 4). The application-owned migration ledger is 32 rows; Supabase `list_migrations` returning an empty separate view is not evidence that the application ledger is empty.

### Release posture

- **Do not enable broad direct client access or apply bare RLS enablement.** First define and test public-read, backend/service-role-write, and admin policies.
- **Do not run payment/refund, migration, cleanup, content publish, or production lifecycle tests** as part of this alignment effort.
- **Do not make nullable fields NOT NULL merely to remove empty counts.** Most reported nulls and empty arrays are intentional lifecycle or optional-content states.
- **Prioritize security and money movement before content polish or UI parity.**

## 2. Table-by-table status matrix

Status meanings: **Aligned** = evidence supports the normal path; **Defect** = confirmed implementation/data-contract issue; **Blocker** = deployment or configuration decision required; **Unverified** = not established by the supplied evidence and must not be presented as fact.

| Audit domain / physical tables | Current row-count status | Alignment status | Empty/null explanation and key evidence |
|---|---:|---|---|
| 1. `profiles`, `device_registrations` | Profiles **2** (1 customer, 1 super_admin); devices **0** | Profiles aligned; device path has F-01–F-04 defects/gap | `profiles.email` is nullable by design, though current rows are populated. Device `user_id` and `booking_id` are intentionally nullable for anonymous/unscoped devices; zero rows is consistent with no discovered client writer. Confirmed: stale booking/platform fields on PostgreSQL conflict, nullable-user uniqueness permits duplicate anonymous devices, no end-to-end device consumer, whitespace-only tokens accepted. |
| 2. `bookings`, `customer_booking_intents` | Bookings **8** (4 `pending_payment`, 4 `paid_confirmed`); intents **12** (8 consumed/linked, 4 unconsumed); all 12 intents expired at query time | Substantially aligned; booking enum and role drift defects | Guest `bookings.user_id`, legacy projections, optional request fields, `package_id`, and curated/outstation `selected_catalog_item_id` nulls are intentional. Unconsumed intent linkage fields remain null until finalization; 15-minute expiry is intentional retention. Confirmed: live `driver_assigned` enum is omitted from backend/state machine; documented dispatcher/finance roles are not enabled by current guards. |
| 3. `payments`, `refunds`, `raw_webhooks` | Payments **11** (7 pending, 4 captured); refunds **0**; raw webhooks **0** | Core checkout mapping aligned; refund lifecycle defective; webhook config blocker | Razorpay modal intentionally leaves `checkout_url` null; pending provider fields and browser-capture `webhook_event_id` nulls are expected. Empty refunds/raw webhooks reflect no approved refund or valid signed webhook. Current 11-row query supersedes stale 9-row inventory. Confirmed: zero-refund DB check conflict, no provider/worker execution for cancellation refunds, admin amount dropped/full refund forced, refund webhook does not update refund/booking. Webhook secret mismatch is a configuration blocker. |
| 4. `catalog_items`, `catalog_item_media` | **0 / 0** | Normal path aligned; CAT-01–CAT-06 and source-of-truth blockers | Empty tables are consistent with no admin catalog population; dossier content is a separate populated source. Optional distance, capacity, trip type, publication provenance, captions, and storage metadata nulls are intentional. Confirmed: slug-width drift, update availability refinement gap, media-limit/type-change gap, video accepted but not publicly renderable, catalog-vs-dossier/static collision risk, unconstrained media source type. |
| 5. `reviews` | **0** | Lifecycle test aligned in memory; security and integration defects | Empty until customer submission. `booking_id`, `customer_id`, social proof, moderation, and publication fields are intentionally null before proof/moderation or for anonymous/general reviews. Confirmed high risk: raw guest token can be retained/exposed through direct published-row reads; unknown slug may create orphan review; admin ticket/metadata mapping is wrong; DB `review_moderator` role is not supported; public React UI uses static testimonials and has no review API client. Catalog parent is empty, so public joins cannot currently be proven. |
| 6. `fare_rules` | **14**; 1 active (`rmuu3sir9`), 2 null `effective_to` values, no empty configs | Core quote/snapshot path aligned; security/temporal/atomicity defects | `effective_to=NULL` is open-ended for active or never-activated rules; all other fields populated. Bookings intentionally retain fare version/snapshot. Confirmed: RLS disabled, save/activate not atomic with audit, effective windows ignored, loose unsupported config accepted, static customer prices can disagree with live fleet, free-form tiers/config. |
| 7. `promo_codes` | **2**; `TEST500` expired-but-active, `TEST99` current broadcast | Field mapping aligned; redemption and display defects | `max_redemptions=NULL` means unlimited; null validity bounds mean open-ended; zero redemption count and false flags are explicit. `TEST500` remaining active despite expiry is intentional separation of manual flag and eligibility. Confirmed: invalid promo can persist into booking and later increment redemption count; redemption update is non-atomic; static UI advertises stale `ASTTCAR500OFF` rather than live `TEST99`; CRUD auditability is unverified/requirement-dependent. |
| 8. `admin_audit_logs`, `notification_jobs` | Both **8**; 4 WhatsApp sent, 4 email failed at attempt 3 | Persistence present; admin DTO and email configuration defects | Audit `before_state`, `after_state`, `reason` nulls are intentional by event type. Notification provider ID is null before success/for failures; jobs are not customer-facing. Current 8-row query supersedes stale 4-row inventory. Confirmed: admin client expects wrong field names/action vocabulary; catalog request IDs can be empty; success does not clear `last_error`; hash-chain claim is unsupported; email failures are Resend 401/403 configuration blockers. |
| 9. `inquiries`, `rental_enquiries` | Inquiries **0**; rental enquiries **1** (`done`) | Backend/admin path broadly aligned; ContactPage and reference-generation defects | Optional inquiry email/trip interest and rental note are nullable; notes arrays default empty. Zero inquiries is consistent with no persisted ContactPage writer. Confirmed: ContactPage opens WhatsApp only and bypasses inbox, sequence is unused while Date.now refs can collide, inquiry status lacks DB check, blank trip interest can persist. |
| 10. `location_cache` | **40**; all fresh within 30 days; 286 suggestion elements | Aligned normal cache path; retention defect | All columns are NOT NULL. JSON `lat/lon` may be null for curated fallback suggestions; misses/errors are intentionally not cached. Confirmed: stale rows are bypassed but never purged; no expiry-boundary/future-timestamp test; JSONB is cast without runtime validation. |
| 11. `route_catalog` | **10**: 9 draft, 1 published, 0 archived | Contract fields aligned; source/RLS/fare defects | Optional editorial fields and empty arrays are intentional for current non-local/draft rows; `needs_review` is advisory. Confirmed: RLS disabled; published route does not feed main customer catalog/build; fare fallback derives a slug without seeded `-taxi`; live `anb-to-dfd-taxi` is anomalous but its test/import origin is **unverified**. |
| 12. `local_sightseeing_packages` | **3**: 2 published, 1 archived; all active | Normal path aligned; RLS/eligibility/snapshot blockers | Nullable parking and extra-rate metadata are optional; draft/archived states are intentional. Confirmed: RLS disabled; public/fare readers ignore `is_active`; DB does not enforce several Zod/JSON bounds; public freshness depends on optional `PAGES_DEPLOY_HOOK_URL`. |
| 13. `transfer_routes` | **6**: 3 published, 2 draft, 1 archived; all active | Mapper/admin/manifest aligned; booking identity and RLS defects | Editorial distance/direction nulls are intentional; fixed fares use `use_per_km=false`, zero night charge is valid, draft/archive are lifecycle states. Confirmed: public booking URL loses route identity and fare may not use persisted transfer prices; `is_active` ignored by public/fare readers; check-code schema differs from create/update; blank strings can normalize only on read. |
| 14. `tour_packages`, `package_vehicle_upgrades` | Packages **11** (1 published, 2 draft, 8 archived); upgrades **4**, all global | Package normal path aligned; upgrade persistence/admin/UI defects | Optional image/gallery, inclusions, itinerary, destination, and notes have intentional legacy/fallback empties. `package_id=NULL` on upgrades intentionally means global defaults. Confirmed: PostgreSQL upsert conflict target cannot infer partial unique indexes; admin GET path/query mismatch; no admin upgrade editor; itinerary cannot be authored; blank destination conflicts with Zod; React drops upgrade display. |
| 15. `cancellation_policies`, `company_profile`, `pet_taxi_policy`, `monuments`, `dossier_signoffs` | **9, 1, 1, 10, 10** respectively; company `signed_off`, signoffs 9 approved/1 pending | Dossier persistence aligned; cross-table status/policy/RLS defects | Pending signoff actor/time nulls and optional notes are intentional; monuments have optional narrative; pet taxi false is an intentional discontinued policy. Confirmed: company signed-off status can bypass signoff aggregate; TermsPage contradicts engine/DB (<24h cab cancellation is 0%, not promised 50%/credit); singleton tables lack constraints; approver name input is dropped; RLS disabled on all five. |
| 16. `schema_migrations` | **32** unique application SQL filenames, no null/empty IDs | Population aligned; high security and migration-runner defects | Two-column ledger has no business nulls. Empty ledger is normal only before migrations run. Supabase `list_migrations=[]` is a separate view; public table and repository filenames are stronger evidence. Confirmed: RLS disabled and broad anon/authenticated DML grants; no advisory lock; no checksum/drift detection; duplicate numeric prefix `0020` creates ordering ambiguity. |

### Row-count reconciliation notes

1. **Current read-only query wins over stale inventory.** Use payments=11 and notification_jobs=8 for current state; older inventory values of 9 and 4 are explicitly stale.  
2. **Zero rows are not automatically defects.** Devices, catalog, media, reviews, refunds, raw webhooks, and inquiries have documented reasons for being empty and no observed customer/admin writer in the current deployment.  
3. **Unverified does not mean false.** The anomalous route row's provenance, actual multi-instance topology, object-storage mode, and whether universal promo CRUD auditability is a requirement remain unverified.

## 3. Cross-table relationship graph in prose

The system's identity root is `auth.users` → `profiles`. Device registrations optionally attach to profiles and bookings; anonymous device rows are allowed. Bookings optionally point to profiles (`ON DELETE SET NULL`) so guest or historical bookings survive profile deletion. Booking intents claim a profile and atomically produce/link one booking; the intent stores a resulting booking ID and uses a secret hash rather than a raw resume secret.

A booking is the central commercial node. It may point to a selected `catalog_items` row (nullable, set null on catalog deletion), while its immutable `booking_selection`, fare snapshot, and fare-rule version preserve customer context even when catalog or fare content changes. Bookings connect to payments, refunds, notification jobs, device registrations, reviews, and customer history. Payments are linked to bookings; refunds duplicate both booking and payment IDs but lack a database constraint proving those two parents belong to the same booking. Raw webhook events are intentionally independent because unknown or out-of-order provider events must be retained without an FK.

The payment flow is booking draft → pending payment/order → trusted capture or signed webhook → captured payment and `paid_confirmed` booking → notification jobs and possible promo redemption. Cancellation policy reads can create refund records, but current cancellation code does not complete provider refund execution. Refund and webhook defects therefore sit directly on the booking/payment relationship and must be remediated before financial lifecycle confidence can be claimed.

Catalog content is a separate graph: `catalog_items` → `catalog_item_media`, with bookings and reviews optionally referencing catalog items. Reviews also optionally reference bookings and profiles, but the review public reader requires a published catalog parent. In parallel, dossier tables (`local_sightseeing_packages`, `transfer_routes`, `tour_packages`, package upgrades, monuments, company/policy tables) and `route_catalog` feed manifests and/or fare logic without foreign keys to catalog items. Static React data and generated snapshots form additional read paths. This is the principal cross-table source-of-truth risk: publication in one graph does not guarantee visibility or fare use in another.

Fare rules and promo codes are application-level inputs to quote calculation, not FK-linked commercial masters. Fare rules connect to bookings through `fare_rules_version` and `fare_snapshot`; promo codes connect through nullable `bookings.promo_code`. Those links preserve history but permit stale or invalid textual references. Location cache is intentionally isolated: it supplies autocomplete suggestions, while bookings persist their own origin/destination/pickup/drop text with no cache join.

Admin audit logs are polymorphic (`resource_type`/`resource_id`) and append after selected admin mutations; they have no FK to the resource and no DB-enforced append-only/hash chain. Notification jobs are booking children with a proper booking FK and are queued after payment confirmation. Migration ledger rows have no domain FK; their relationship is operational, certifying that schema changes were applied.

## 4. Admin / customer / backend / database mismatch matrix

| Area | Admin surface | Customer/public surface | Backend/domain | Database/live evidence | Mismatch / disposition |
|---|---|---|---|---|---|
| Device push | No discovered caller | No discovered token writer/reader | Registration endpoint and ownership checks exist; readers exist but are unused | Table empty | **Configuration/product scope blocker** plus F-01/F-02/F-04. Defer explicitly or wire end to end; do not infer failed persistence. |
| Booking statuses/roles | Admin docs/UI mention dispatcher/finance and status vocabulary | Customer does not expose all operational states | Domain/state machine omit live `driver_assigned`; guards effectively super_admin | Live enum includes `driver_assigned` | **Confirmed contract drift.** Decide whether to implement or retire documented states/roles. |
| Payments/refunds | Finance amount is editable; cancellation appears to create refunds | Payment resume/status is customer-facing | Controller drops amount; cancellation does not call provider; webhook updates only payment | Refunds/raw webhooks empty; payments 11 | **Confirmed high financial defects** plus Razorpay secret blocker. |
| Catalog/content | Admin can publish catalog/dossier/route/package data | Customer readers use different manifests/static snapshots | Backend has multiple source readers and optional rebuild hook | Catalog empty; dossier/route tables populated | **Confirmed source-of-truth mismatch; deployment freshness partly unverified.** |
| Reviews | Moderation queue exists but loses ticket/social/moderation metadata | Static testimonials; no DB review API/form | Service accepts/retains raw token and unknown slug null | Reviews/catalog empty | **Confirmed security and UI integration defects.** |
| Fare rules | Admin edits config/rates | Some pages use live fleet; home/static pages use baked-in values | Server quote is authoritative but effective windows and loose config are not | 14 rules, 1 active, RLS disabled | **Confirmed security/atomicity/display parity defects.** |
| Promos | CRUD supports live rows | Featured endpoint says `TEST99`; static copy says `ASTTCAR500OFF` | Invalid code persistence and non-atomic redemption | 2 rows, TEST99 broadcast | **Confirmed promo persistence/redemption/display mismatch.** |
| Audit logs | UI expects `actor`, `ip`, `detail`, uppercase actions | Not public | Backend emits actorId, before/after, reason, requestId, lower-case actions | 8 rows populated | **Confirmed DTO/action vocabulary mismatch; hash-chain claim unsupported.** |
| Notifications | No queue UI/retry control | No notification-job reader | Worker and provider adapters exist; success leaves stale lastError | 4 WhatsApp sent, 4 email failed | **Provider config blocker plus confirmed stale-error defect.** |
| Inquiries | Inbox/admin update exists | ContactCard persists; ContactPage WhatsApp-only | Inquiry writer exists; rental sequence unused | Inquiries 0, rental 1 done | **Confirmed ContactPage bypass and rental-ref collision risk.** |
| Location cache | No admin surface | Autocomplete reads backend cache/provider | Freshness filter works, purge absent | 40 fresh rows | **Confirmed latent retention defect; no current stale-row corruption.** |
| Route/transfer/local package content | Admin publication exists | Generated/public manifests may read snapshots or other sources | `is_active` often ignored; transfer route identity lost in booking | Populated live rows, all active in current sets | **Confirmed latent eligibility/source wiring defects; anomalous route provenance unverified.** |
| Tour packages/upgrades | Package CRUD; no effective upgrade editor | Public mapping drops upgrade display | PostgreSQL upgrade upsert conflict target is invalid for partial indexes | 4 global upgrades, no package-specific | **Confirmed repository/admin/UI contract defects.** |
| Policies/dossier | Signoff and company fields editable | TermsPage hard-codes conflicting refund promise | Generic company PATCH can set signed_off without aggregate approval | signed_off with 1 pending signoff | **Confirmed cross-table status and policy-copy defects.** |
| Migration ledger | No admin UI | Not public by design | Runner lacks lock/checksum | 32 rows, RLS disabled, broad grants | **Confirmed high security/integrity defect.** |

## 5. Confirmed defects vs configuration blockers vs intentional nulls vs unverified items

### 5.1 Confirmed defects

**Security and access**

- RLS disabled on `fare_rules`, `route_catalog`, `local_sightseeing_packages`, `transfer_routes`, all five policy/company dossier tables, and `schema_migrations`; `schema_migrations` also grants anon/authenticated broad DML.
- Review raw guest token retention/exposure risk through direct published-row access.
- No reviewed policy model has been established for tables where RLS is enabled; direct-read safety must be proven by projection/policy tests.

**Financial and booking integrity**

- Cancellation can insert a zero-amount refund against `refunds.amount_minor > 0`.
- Positive cancellation refund intents are not sent to a provider and have no durable worker/update/retry path.
- Finance UI amount is dropped; backend refunds the full captured amount.
- Refund webhook branch fails to update refund status/provider ID or booking status.
- Invalid/expired/ineligible promo can persist in booking and later increment redemption counts; redemption consumption is non-atomic and errors are swallowed.
- Live `driver_assigned` enum is not represented in backend booking domain/state machine/schemas.

**Content/source and customer wiring**

- Route catalog publish is not wired to the main customer catalog/build path; origin/destination fare fallback misses seeded `-taxi` suffix.
- Transfer public booking loses route identity, so stored transfer pricing is not reliably used.
- Published-but-inactive rows are eligible in local-package, transfer, route, and related readers where `is_active` is ignored.
- Catalog slug limits disagree; catalog/media type and gallery constraints are incomplete; accepted video is not publicly renderable.
- Catalog/dossier/static source collision can leave archived content visible.
- Review unknown slug can create an orphan; public React review lifecycle is disconnected from DB reviews.
- Public static fare/promo/review content can disagree with live backend values.
- Tour upgrade PostgreSQL upsert cannot match partial unique indexes; admin upgrade route/query and UI are missing; itinerary and upgrade display are incomplete.
- Company can be marked `signed_off` while a signoff is pending; TermsPage refund text conflicts with DB/engine policy.

**API/DTO/operational correctness**

- Admin audit client maps wrong fields/actions; catalog/media mutations can write empty request IDs; hash-chain claim has no implementation.
- Notification success does not clear stale `last_error`; email provider jobs are terminal failed after 3 attempts.
- ContactPage bypasses inquiry persistence; rental reference generation can collide; inquiry status lacks DB check; blank trip interest can persist.
- Location cache never purges old rows and lacks expiry-boundary tests/runtime JSON validation.
- Profile/device conflict upsert semantics can return values different from persisted PostgreSQL row; anonymous device uniqueness is not enforced as likely intended.
- Migration runner lacks cross-process lock and checksum/drift detection; duplicate numeric prefix is an ordering ambiguity.

### 5.2 Configuration blockers and decisions

These are not claimed as data corruption:

1. Decide whether device push registration is in scope for the current web deployment; otherwise explicitly defer it.
2. Align Razorpay webhook secret between Dashboard and deployed environment, then run an approved staging signed-webhook drill.
3. Choose canonical content source (`catalog_items` versus dossier/static/route tables) and define publication/archive propagation.
4. Establish `PAGES_DEPLOY_HOOK_URL` or replace process-local/static snapshot invalidation with a verified deployment/runtime revalidation strategy.
5. Define and review RLS policies for every currently disabled table; never apply bare `ENABLE ROW LEVEL SECURITY`.
6. Verify object-storage credentials/mode separately; supplied evidence could not establish live media upload behavior without a write.
7. Decide whether promo CRUD must be included in universal admin auditability.
8. Confirm actual deployment topology before treating process-local manifest invalidation as a multi-instance defect.
9. Decide whether `driver_assigned`, dispatcher/finance roles, review moderator, and video media are required product capabilities or stale contracts.

### 5.3 Intentional nulls and empties

Across the audits, the following are **not defects by themselves**:

- Optional profile email, anonymous device user/booking, guest booking user ID, optional booking return/flight/promo/notes fields, legacy package fields, and pre-finalization intent linkage.
- Razorpay modal `checkout_url`, pending payment provider fields, browser-capture webhook ID, empty refunds/raw webhooks before approved execution.
- Catalog distance/capacity/trip type/provenance/media metadata; path/object-storage media omits inline bytes; empty catalog tables where no seed/population exists.
- Review booking/customer/social/moderation/publication fields before their lifecycle events; anonymous/general reviews; quarantine statuses.
- Fare open-ended `effective_to`; promo unlimited caps/open validity bounds/false flags/expired-but-enabled manual flag.
- Audit before/after/reason fields by event type; notification provider ID before success/for failure; absent email jobs when customer email is missing/invalid.
- Inquiry optional email/trip interest, rental note, notes arrays; location-cache fallback lat/lon nulls and intentional cache misses.
- Draft/archived content, optional route/package editorial fields, empty stops/interstate arrays, global upgrades with `package_id=NULL`, signoff actor/time before approval, discontinued pet-taxi policy, and historical dossier narrative omissions.
- `schema_migrations` has no legitimate business null state; only a brand-new database may have an empty ledger before migrations run.

### 5.4 Unverified items

The supplied evidence does not establish:

- Whether the anomalous published `anb-to-dfd-taxi` route is a test/import artifact, an approved product row, or customer-visible in every deployment.
- Actual production multi-instance topology and therefore the observed impact of process-local manifest invalidation.
- Live object-storage upload behavior and credentials.
- Whether all admin mutations, especially promo CRUD, are required to be in a universal audit policy.
- Whether direct Supabase access to reviews exposes raw columns in the deployed PostgREST role configuration beyond the cited migration/policy risk; the risk is confirmed for review and must be closed by projection/policy tests, not assumed away.
- Whether `driver_assigned`, dispatcher/finance, review moderator, video support, and device push are intended features or stale/documentation contracts.
- Whether the 4 terminal email jobs should be retried after configuration; no retry was authorized.

## 6. Dependency-ordered remediation backlog

### P0 — security and money safety before further content operations

1. **Lock down direct database access by table.** Inventory grants, write reviewed RLS policies for public published reads and service-role/backend/admin writes, explicitly deny anon/authenticated writes, and test anonymous/authenticated/staff/service-role paths. Start with `schema_migrations`, then fare/content/dossier tables. Do not use a bare enablement migration.
2. **Repair refund lifecycle and contracts.** Remove zero-row insertion or reconcile the DB check after finance/legal review; remove/drop the misleading editable amount or implement server-validated partial refunds; add a refund outbox/worker/provider retry, durable refund status/provider ID updates, idempotency, and out-of-order webhook handling. Verify booking/payment/refund consistency.
3. **Fix promo application and redemption accounting.** Persist `promo_code` only when `promoValid=true` with an applied discount; consume atomically/idempotently using a conditional update or redemption ledger; stop swallowing update failures.
4. **Protect migration execution.** Revoke public ledger privileges, add advisory locking, add applied-file checksums/drift detection, and test rollback/concurrent startup before changing production history.
5. **Align Razorpay secret in staging only.** Run a signed webhook drill after approval; verify raw event and payment/refund state transitions. No production replay in this work.

### P1 — establish one coherent domain contract/source of truth

6. **Choose the canonical content graph.** Decide how `catalog_items`, dossier tables, `route_catalog`, static data, generated manifests, reviews, bookings, and fare lookup relate. Document ownership and archive behavior; add collision and publication propagation tests.
7. **Normalize active/public eligibility.** Centralize `status=published AND is_active=true` (and `needs_review=false` where intended) across all public manifests, detail pages, fare readers, generated snapshots, and booking resolution.
8. **Repair route and transfer identity.** Resolve origin/destination via normalized fields or canonical slug; propagate `transferRouteCode/ID` through URL, selection, quote, and booking snapshot; test distinctive route prices end to end.
9. **Reconcile booking enums and roles.** Either implement `driver_assigned`, dispatcher/finance, and review moderator end to end or remove stale declarations/copy through reviewed changes. Add live enum/domain CI parity tests.
10. **Secure and reconnect reviews.** Hash/remove guest tokens, restrict direct table projection, reject unknown/unpublished/mismatched catalog identifiers, preserve safe admin verification metadata, and add customer submission/public reader only after canonical source selection.
11. **Make package upgrades writable and visible.** Use predicate-matching PostgreSQL upsert branches for global/package-specific rows; fix route/query parameter contract; add an admin editor and public mapping/display tests.

### P2 — correctness, observability, and UI parity

12. Fix device conflict semantics, anonymous uniqueness, trimming, and either implement or document the push lifecycle.
13. Make fare-rule save/activate plus audit atomic; define effective-time semantics; validate typed config and route all customer price claims to live data.
14. Fix catalog slug/media/video/type-transition constraints and decide whether video is supported.
15. Repair audit DTO/action mapping, request-ID propagation, backend limit handling, and either implement or remove the hash-chain claim.
16. Fix notification success clearing, provider retry operations, and add an admin-only queue view only after authorization/idempotency review.
17. Wire ContactPage to inquiries or explicitly make the product WhatsApp-only; replace rental Date.now references with sequence/UUID plus collision retry; normalize inquiry blanks and constrain status.
18. Add location-cache stale purge with index/metrics and deterministic boundary/future-timestamp tests.
19. Make dossier singleton constraints explicit; derive company signoff state transactionally; align TermsPage with canonical cancellation policies; remove client-controlled approver name.
20. Add static snapshot/deploy-hook verification and multi-instance invalidation only after topology is confirmed.

### P3 — hygiene and historical cleanup

21. Normalize optional blank strings to NULL where semantic distinction is not needed.
22. Add database checks for JSON shapes, positive commercial fields, valid dates, and status vocabularies where direct writers require protection.
23. Add repository contract tests that exercise real PostgreSQL partial unique/FK/cascade behavior rather than only memory repositories.
24. Review and separately approve cleanup/retention jobs for expired intents, old location cache rows, payment attempts, and audit/notification history; do not delete rows during alignment.

## 7. Safe validation plan

### Guardrails

- Production validation remains **read-only SELECT/metadata inspection only** until each change has an approved runbook, rollback, owner, and staging evidence.
- No production inserts, updates, deletes, migrations, RLS changes, refund calls, webhook replays, provider sends, media uploads, or customer submissions.
- Never use real FCM tokens, guest access tokens, payment credentials, or customer PII in fixtures.

### Phase A — read-only baseline and contract inventory

1. Re-run row counts, status counts, null/empty counts, FK/orphan checks, RLS/policy/grant checks, and current-vs-inventory reconciliation.
2. Compare live enum labels to TypeScript/Zod/state-machine unions in CI.
3. Record all public readers and writers for each content source; produce a canonical-source decision record.
4. Verify no sensitive review token appears in any safe public/admin projection using static code checks and response-shape tests; do not query or expose live tokens.

### Phase B — disposable memory and ephemeral PostgreSQL tests

1. Use memory tests for normal lifecycle and an ephemeral PostgreSQL fixture for partial indexes, nullable uniqueness, FK cascades, checks, and transaction rollback.
2. Test refund zero/positive amounts, partial/full refund validation, provider pending/processed/failed/out-of-order/duplicate events, and booking/payment/refund invariants.
3. Test promo invalid/expired/minimum/group/ineligible/exhausted behavior, duplicate confirmation idempotency, and `max_redemptions=1` concurrency.
4. Test migration first run, idempotent rerun, failed migration rollback, concurrent runners, and changed-file checksum detection.
5. Test content create→draft→publish→public→archive, active filtering, manifest parity, slug limits, media limits, video decision, route identity, and package upgrade global/specific precedence.
6. Test signoff aggregate transitions, cancellation copy boundaries, review proof/token handling, device conflict semantics, location-cache exact 30-day expiry, notification retry clearing, inquiry ContactPage POST, and rental reference collisions.

### Phase C — approved staging integration

1. Apply reviewed RLS policies in a disposable/staging branch; test anonymous, authenticated customer, admin, service-role, and backend database-role access.
2. Configure a verified Razorpay webhook secret and sender/provider credentials only in staging; run signed webhook and notification-provider drills with test identities.
3. Verify public generated/static output after publish/archive/price edit, including hook success/failure and cache invalidation behavior.
4. Run rollback/fault-injection tests for refund worker, migration runner, content publication, and concurrent admin updates.

### Phase D — production observation, still non-destructive first

1. Deploy only reviewed code/config changes with metrics and alerts.
2. Re-run read-only counts and invariants; compare before/after without changing data.
3. Observe new payments/refunds/webhooks/notification jobs through normal approved traffic; do not replay historical failures automatically.
4. Separately approve any data cleanup, backfill, RLS migration, refund execution, or expired-row deletion after evidence confirms the safe path.

## 8. Explicit failed-agent list

**None.** The supplied successful-audit list contains 16 successful audits, and `FAILED AUDITS` is an empty list (`[]`).

## Evidence and caveat summary

This final report reconciles the supplied audit outputs only. It does not claim that any recommended fix, migration, provider configuration, cleanup, replay, or production lifecycle test has been executed. Where live evidence and older inventory disagree, the dated current read-only Supabase query cited by the successful audit is used. Where the supplied audits did not establish deployment topology, provider/storage behavior, intended product scope, or provenance, the item is explicitly labeled **unverified** rather than inferred.
