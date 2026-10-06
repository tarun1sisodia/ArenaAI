# Table Audit 15 — Policies, Company, Monuments, Pet Policy, and Dossier Sign-offs

**Audit date:** 2026-10-06  
**Repository:** `/home/ubuntu/ArenaAI`  
**Scope:** Exactly `public.cancellation_policies`, `public.company_profile`, `public.pet_taxi_policy`, `public.monuments`, and `public.dossier_signoffs`.  
**Method:** Read-only repository/migration/admin/public-reader inspection plus one aggregate read-only Supabase SQL query against project `trcmufqbpcymipqpemoq`. No production writes, migrations, deletes, webhook replays, or external submissions were performed.

## 1. Executive conclusion

The five tables have complete backend record types, PostgreSQL mappers, repositories, Zod update contracts, admin endpoints, and public readers. The seeded data is populated and the existing in-memory dossier integration test passes (8/8). The most important issue is not a dropped column: it is a **live lifecycle invariant violation**. Supabase currently reports `company_profile.dossier_status = signed_off` while `dossier_signoffs` is `9 approved + 1 pending`. The code allows this because `company_profile.dossier_status` is directly writable through the generic company-profile PATCH endpoint/UI; the database has no constraint tying it to all signoffs.

A second confirmed customer-facing contract defect is that `react/src/pages/TermsPage.tsx` hard-codes a cab policy of **50% token refund for 6–24 hours** and token retention only below six hours, while the database policy rows and cancellation engine implement **0% refund for every notice period below 24 hours**. The public monument FAQ independently states only the 24-hour threshold and therefore does not repair the Terms mismatch.

A security/configuration blocker remains: RLS is disabled on all five live tables. The backend routes are role-protected for writes, but a Supabase client role can potentially reach these tables directly unless reviewed read/service policies are added. Do not enable RLS without policies.

## 2. Live evidence and population

### Current aggregate Supabase check

The live query returned:

| Table | Rows | Current status/null evidence |
|---|---:|---|
| `cancellation_policies` | 9 | 3 `cab`, 6 `tour_package`; every non-null text field checked was non-null and non-empty. |
| `company_profile` | 1 | `dossier_status = signed_off`; no checked field was NULL; email/GSTIN no longer contain `[TBD]`. |
| `pet_taxi_policy` | 1 | `is_offered = false`; all required policy notes non-NULL. |
| `monuments` | 10 | No required field NULL; `historical_context` NULL count 0; no duplicate `sort_order`. |
| `dossier_signoffs` | 10 | 9 `approved`, 1 `pending`; `approved_by`/`approved_at` NULL count 1 each; `client_notes` NULL count 1 and empty-string count 9. |

The earlier `reports/live-schema-inventory.md` independently records the same row counts and RLS-disabled status (lines 32–36, target column sections lines 562–639). The aggregate query is stronger for current null/status counts and is the source for the status contradiction above.

### Seed/migration provenance

- `backend/migrations/0024_dossier_content.sql` creates all five tables and seeds 9 policies, 10 monuments, 1 pet-policy row, 1 company row, and 10 signoff rows (columns/constraints lines 87–155; seeds lines 241–309).
- `backend/migrations/0029_remove_pet_taxi_offering.sql` deliberately changes the pet row to `is_offered=false` and updates the specialized signoff title to Monument Protocols (lines 5–19).
- `backend/migrations/0027_fix_dossier_signoffs_approved_by_fkey.sql` changes `dossier_signoffs.approved_by` to reference `auth.users(id)` with `ON DELETE SET NULL` (lines 4–16).
- Memory repositories initialize the same records from `dossier-seeds.ts`; this is test-only/reference data, not evidence of live values.

## 3. Column-level fill/null matrix

The following describes the live schema contract, the owning code, the condition that fills each value, and whether emptiness is intentional. All timestamps are generated at seed time or replaced by the service clock on an admin update.

### 3.1 `cancellation_policies`

Migration and live inventory show: `id uuid NOT NULL DEFAULT gen_random_uuid()`, `policy_type text NOT NULL CHECK (cab|tour_package)`, `notice_period_text text NOT NULL`, `sort_order int NOT NULL DEFAULT 0`, `fee_retained_percent numeric NOT NULL CHECK 0..100`, `refund_percent numeric NOT NULL CHECK 0..100`, `rule_text text NOT NULL`, `refund_timeline_note text NOT NULL DEFAULT '5–7 business days to original bank/UPI'`, `created_at timestamptz NOT NULL DEFAULT now()`, and `updated_at timestamptz NOT NULL DEFAULT now()`.

| Column | What fills it / writer | NULL or empty meaning |
|---|---|---|
| `id` | PostgreSQL default for migration inserts; memory seed has stable UUIDs. No API create route. | Not nullable. A missing ID is a database defect. |
| `policy_type` | Migration seed chooses `cab` or `tour_package`; retained unchanged by the update service/repository. | Not nullable and constrained. The admin cannot change it. |
| `notice_period_text` | Migration/seed supplies the customer-facing slab window; admin PATCH can replace it after strict trimmed text validation. | Not nullable; empty is rejected by Zod (`min(1)`) and should be treated as a defect. |
| `sort_order` | Seed establishes 1–3 for cabs and 10–15 for tours. It is read by the cancellation engine but not editable through the policy API. | Not nullable. No DB uniqueness/order-contiguity constraint; duplicate or altered ordering is a latent configuration risk, though current seed rows are correct. |
| `fee_retained_percent` | Seed and admin PATCH; UI keeps it mathematically paired with `refund_percent` (`100 - other value`). | Not nullable and range-checked. Zero is intentional for full-refund slabs; 100 is intentional for forfeiture slabs. |
| `refund_percent` | Seed and admin PATCH; same paired UI behavior. | Not nullable and range-checked. Zero is intentional for no-refund slabs; 100 is intentional for full refund. |
| `rule_text` | Seed and admin PATCH after HTML stripping/trim. Used in refund reason text. | Not nullable; empty rejected. |
| `refund_timeline_note` | DB default on initial insert, explicit seed values, and admin PATCH. Public/admin readers receive it. | Not nullable; empty rejected. |
| `created_at` | DB default/seed; never changed by policy PATCH. | Not nullable; intentional audit timestamp. |
| `updated_at` | DB default initially; cancellation-policy service sets current clock time on every update. | Not nullable; stale timestamp would be a writer defect. |

**Writer/read path:** `cancellation-policies.controller.ts` exposes public list and role-protected admin list/get/PATCH. `cancellation-policies.service.ts` performs partial merge and triggers a frontend rebuild. `postgres.ts:924–936` reads all rows ordered by `policy_type, sort_order` and updates only the five editable content/percentage fields plus `updated_at`. `admin/src/pages/PoliciesPage.tsx:80–100` edits all five editable fields; `admin/src/lib/api.ts:741–753` maps camelCase to snake_case.

**Lifecycle consumer:** `booking.service.ts:392–430` loads captured payments, derives cab versus tour policy type, loads DB policies, calls `calculateCancellationRefund`, then creates a `refunds` row and transitions the booking to `cancelled`. The policy table has no FK because it is a rule/configuration table; the resulting refund links to both `payments` and `bookings`.

### 3.2 `company_profile`

Live schema: `id uuid NOT NULL DEFAULT gen_random_uuid()`; all other fields are `text NOT NULL` with defaults: `brand_name`, `office_address`, `primary_phone`, `whatsapp_number`, `email`, `gstin`, `operating_hours`, `maps_location`, `dossier_version`; `dossier_status text NOT NULL DEFAULT 'pending_review' CHECK (pending_review|signed_off|modifications_needed)`; `created_at` and `updated_at` are non-null timestamps with `now()` defaults.

| Column | What fills it / writer | NULL or empty meaning |
|---|---|---|
| `id` | DB default on initial singleton seed; no API ID input. | Not nullable. |
| `brand_name` | Seed default; admin company PATCH can replace after 2–100 trimmed characters. | Not nullable; empty rejected. |
| `office_address` | Seed/default; admin PATCH after 5–300 characters. | Not nullable; empty rejected. |
| `primary_phone` | Seed/default; admin PATCH after 5–30 characters. | Not nullable; empty rejected. |
| `whatsapp_number` | Seed/default; admin PATCH after 5–30 characters. | Not nullable; empty rejected. |
| `email` | Historical seed default is `[TBD — confirm with client]`; admin PATCH replaces it with non-empty text. Current live query found no TBD marker and no NULL. | Not nullable. The placeholder is intentional staging content until confirmed, but should not be treated as a verified legal/contact value. |
| `gstin` | Same historical TBD/default and admin PATCH behavior; current live query found no TBD marker and no NULL. | Not nullable. The historical placeholder is intentional pending client confirmation, not a NULL. |
| `operating_hours` | Seed/default and admin PATCH. | Not nullable; empty rejected. |
| `maps_location` | Seed/default and admin PATCH; public readers use it as a location link. | Not nullable; empty rejected. |
| `dossier_version` | Seed/default and admin PATCH. | Not nullable; empty rejected. |
| `dossier_status` | Default is `pending_review`; generic admin company PATCH can set any enum. Signoff service also derives it from all signoff rows. | Not nullable. `signed_off` is only semantically valid when all signoffs are approved, but no DB constraint enforces that. This is the source of the confirmed live invariant defect. |
| `created_at` | DB default/seed; immutable through repository update. | Not nullable. |
| `updated_at` | DB default/seed; service sets the clock on company edits and signoff-driven status synchronization. | Not nullable. |

**Writer/read path:** Public GET `/api/v1/company-profile`, admin GET/PATCH `/api/v1/ops/admin/company-profile`; `company-profile.controller.ts` role-checks admin and requires a user on update. `company-profile.service.ts` partial-merges all fields. `postgres.ts:966–978` reads `limit 1` and updates all content/status fields. `admin/src/pages/PoliciesPage.tsx:124–149` edits the profile and exposes a dossier-status dropdown; `admin/src/pages/SignoffPage.tsx:94–109` also has a finalization action. `content.routes.ts:21–40` includes the profile in the public combined manifest.

### 3.3 `pet_taxi_policy`

Live schema: `id uuid NOT NULL DEFAULT gen_random_uuid()`, `is_offered boolean NOT NULL DEFAULT true`, `seat_protection_note text NOT NULL`, `breed_restriction_note text NOT NULL DEFAULT 'No breed or size restrictions'`, `comfort_stop_note text NOT NULL`, `booking_instruction text NOT NULL DEFAULT 'Customer must inform during booking'`, and non-null `created_at`/`updated_at` timestamps.

| Column | What fills it / writer | NULL or empty meaning |
|---|---|---|
| `id` | DB default/seed; no ID in API payload. | Not nullable. |
| `is_offered` | Initial schema default was true; migration `0029` explicitly sets false. Admin PATCH can toggle it. Current live and generated snapshot are false. | Not nullable. False is intentional discontinued-service policy, not an empty row. |
| `seat_protection_note` | Seed/migration 0029 provides the discontinued-service explanation; admin PATCH replaces it with cleaned 1–300 character text. | Not nullable; empty rejected. |
| `breed_restriction_note` | Seed/default then migration 0029 changes it to “Pets and animals are not permitted…”; admin PATCH can edit. | Not nullable; current prohibition is intentional. |
| `comfort_stop_note` | Seed/migration 0029 and admin PATCH. | Not nullable; explanatory text remains required even when service is off. |
| `booking_instruction` | Seed/default, migration 0029, and admin PATCH. | Not nullable; current instruction intentionally tells customers pets are prohibited. |
| `created_at`/`updated_at` | DB defaults; update service changes only `updated_at`. | Not nullable. |

**Writer/read path:** Public GET `/api/v1/pet-policy`, admin GET/PATCH `/api/v1/ops/admin/pet-policy`; `pet-policy.service.ts` partial-merges fields. `postgres.ts:952–964` uses `select ... limit 1` and updates the single returned record. `admin/src/pages/PoliciesPage.tsx:102–122` exposes an “offered” checkbox and all notes; `content.routes.ts` includes the record in the public manifest. There is no booking creation path that treats the policy as permission; it is display/policy content only.

### 3.4 `monuments`

Live schema: `id uuid NOT NULL DEFAULT gen_random_uuid()`, `name text NOT NULL UNIQUE`, `visiting_hours text NOT NULL`, `closed_note text NOT NULL DEFAULT 'Open all days'`, `historical_context text NULL`, `sort_order int NOT NULL DEFAULT 0`, and non-null `created_at`/`updated_at` timestamps.

| Column | What fills it / writer | NULL or empty meaning |
|---|---|---|
| `id` | DB default/seed; no API create/delete path. | Not nullable. |
| `name` | Seed and admin PATCH; database UNIQUE constraint and Zod 2–100 text validation apply. | Not nullable; empty rejected. |
| `visiting_hours` | Seed and admin PATCH after 2–100 cleaned characters. | Not nullable; empty rejected. |
| `closed_note` | Seed/default and admin PATCH after 1–100 cleaned characters. | Not nullable; “Open all days” is intentional content, not blank. |
| `historical_context` | Seed and admin PATCH. Zod allows an optional value; service preserves current value when omitted and accepts an explicit string. | NULL is intentional when no narrative is available. Current live query found neither NULL nor empty. Empty-string normalization is not enforced at the DB layer; a blank should be normalized to NULL to avoid two representations. |
| `sort_order` | Seed 1–10 and admin PATCH integer 0–100; public/admin repositories order ascending. | Not nullable. Current live query found no duplicate order. No uniqueness constraint means duplicates are allowed and would create tie ordering. |
| timestamps | DB defaults; update service changes `updated_at`. | Not nullable. |

**Writer/read path:** Public GET `/api/v1/monuments`, admin GET/list/PATCH; `monuments.service.ts` partial-merges fields. `postgres.ts:938–950` lists by `sort_order` and updates the five editable columns. `admin/src/pages/PoliciesPage.tsx:151–170, 572–623, 718–772` edits and displays the records. `content.routes.ts` and `react/scripts/build-manifest.ts:349–376` include them in the combined public snapshot. `ServerApp.tsx:75–77, 190–195` consumes the generated monument list; `MonumentDetailPage.tsx` renders name, hours, closure note, historical context, and a booking link.

### 3.5 `dossier_signoffs`

Live schema: `id uuid NOT NULL DEFAULT gen_random_uuid()`, `section_key text NOT NULL UNIQUE` with a lowercase key check, `section_title text NOT NULL`, `status text NOT NULL DEFAULT 'pending' CHECK (pending|approved|modification_requested)`, nullable `client_notes`, nullable `approved_by uuid`, nullable `approved_at timestamptz`, and non-null `created_at`/`updated_at` timestamps. `approved_by` references `auth.users(id) ON DELETE SET NULL` in the live inventory.

| Column | What fills it / writer | NULL or empty meaning |
|---|---|---|
| `id` | DB default/seed; API only addresses an existing UUID. | Not nullable. |
| `section_key` | Migration seed and immutable through the update API; unique stable join/display key. | Not nullable and constrained. |
| `section_title` | Migration seed; not editable through the update schema/repository. Migration 0029 changes the specialized title to Monument Protocols. | Not nullable. |
| `status` | Seed pending; admin PATCH accepts enum. | Not nullable. `pending` is intentional review state; `approved` means the authenticated user approved; `modification_requested` means review feedback is needed. |
| `client_notes` | Initially NULL; admin signoff page sends notes. The UI sends `""` when the notes input is blank, so the current live state is one NULL + nine empty strings. | NULL means no note at initialization; empty string also means no note but is an avoidable representation inconsistency. Normalize blank to NULL if analytics/query semantics matter. |
| `approved_by` | NULL until status becomes approved; service writes authenticated `user.id`, not a client-supplied name. On any non-approved status the service clears it. | NULL is intentional for pending/modification-requested rows and is protected by FK `ON DELETE SET NULL`. Current one pending row has NULL. |
| `approved_at` | NULL until status becomes approved; service sets current clock time once (`current.approvedAt ?? now`); cleared when status is not approved. | NULL is intentional for not-approved rows. Current one pending row has NULL. |
| `created_at`/`updated_at` | DB defaults/seed; service changes `updated_at` on each PATCH. | Not nullable. |

**Writer/read path:** Public GET `/api/v1/dossier-signoffs`, admin GET/list/PATCH. `dossier-signoffs.controller.ts` requires a content role and authenticated user for update; `dossier-signoffs.service.ts:24–63` derives approval actor/time and then recalculates company status from all signoffs. `postgres.ts:980–992` maps and updates status, notes, actor, timestamp. `admin/src/pages/SignoffPage.tsx` is the actual checklist UI. `content.routes.ts` includes signoffs in the public combined manifest, and the generated public snapshot currently contains all 10 rows, including `approvedBy`, `approvedAt`, and `clientNotes`.

## 4. Relationships and cross-table lifecycle

1. **Signoff actor FK:** `dossier_signoffs.approved_by → auth.users.id ON DELETE SET NULL`. This was corrected by migration 0027 because an approver may be an authenticated admin without a customer `profiles` row. There are no target-table FKs from signoffs to company profile.
2. **Company/signoff lifecycle is application-level, not relational:** after every signoff update, the service reads all signoffs and derives `company_profile.dossier_status`: all approved → `signed_off`; otherwise any modification request → `modifications_needed`; otherwise → `pending_review`. The live database nevertheless has `signed_off` plus one pending signoff because generic company-profile PATCH can bypass this derivation (confirmed defect F1).
3. **Cancellation policy to booking/payment/refund:** no FK exists from policies to bookings. `booking.service` selects `cab` versus `tour_package`, computes the slab, and writes a `refunds` record linked to `payments` and `bookings`. Refund creation occurs only for a cancellation with captured payment; no policy row is mutated.
4. **Monuments:** no FKs. They are independent public content records sorted by `sort_order`, loaded into the content manifest and static SSG snapshot. Their booking link passes the monument name as a local-tour destination; it does not persist a monument ID in `bookings`.
5. **Pet policy:** no FKs and no booking FK. It is display/policy content. `is_offered=false` is a deliberate client-policy state, not a row-deletion signal.
6. **Singleton assumptions:** both `company_profile` and `pet_taxi_policy` are treated as singleton tables by domain types, services, and `select ... limit 1`, but migration 0024 does not add a singleton key/unique constraint. Accidental duplicates would make reads nondeterministic and updates would target whichever row the database returns first.
7. **Delete/update behavior:** target admin routes expose updates but no delete/create routes. Monument `name` has a DB UNIQUE constraint. Signoff `section_key` has a DB UNIQUE constraint. Other than the signoff actor FK, no target FK delete behavior exists.

## 5. Exact mismatches and severity

### F1 — **High: live company/signoff approval invariant is broken**

**Evidence:** read-only Supabase query: `company_profile` has one row with `dossier_status_counts = {signed_off: 1}`, while `dossier_signoffs` has `{approved: 9, pending: 1}`. `dossier-signoffs.service.ts:40–58` intends to derive the profile status from all rows, but `company-profile.schema.ts:12–25`, `company-profile.controller.ts:22–27`, `company-profile.service.ts:19–39`, and `admin/src/pages/PoliciesPage.tsx:557–566` permit direct `dossier_status` writes. The admin Signoff page also sends a separate finalization PATCH.

**Impact:** a public manifest can advertise a signed-off dossier even while one section is pending. The database has no cross-table check or transaction-level constraint.

**Fix:** make `dossier_status` read-only in generic company profile PATCH; derive it only in a transaction that updates a signoff, or expose a narrowly guarded finalize operation that verifies `COUNT(*) = COUNT(status='approved')` and expected section count. Add a regression test that approving all rows yields signed-off, then reverting one row yields pending/modifications-needed, and that direct signed-off PATCH is rejected.

### F2 — **High: customer Terms cancellation text contradicts DB policy/engine**

**Evidence:** DB seeds and `DEFAULT_CANCELLATION_SLABS` define cab `24+ hours → 100%`, `<24 hours → 0%`, and no-show → 0%. `booking.service.ts:400–413` uses the database rows. But `react/src/pages/TermsPage.tsx:165–183` renders `>24h = 100%`, `6–24h = 50% token refund / 100% trip credit`, and `<6h = retained`. The database has no 50% cab slab. `MonumentDetailPage.tsx:91–93` separately says cancellation 24 hours prior gets 100%, which is consistent only with the first slab.

**Impact:** customer-facing legal/operational text can promise a 50% refund or trip credit that the cancellation service will not calculate. This is a source-of-truth mismatch, not a NULL issue.

**Fix:** render Terms cancellation slabs from `/api/v1/cancellation-policies`/the generated content snapshot, or update the hard-coded Terms text to exactly match the approved database rows. Add boundary tests at 24h, just under 24h, 6h, and 0h for both displayed text and `calculateCancellationRefund`.

### F3 — **High configuration/security blocker: RLS disabled on all five tables**

**Evidence:** live inventory and prior audit report RLS disabled for `cancellation_policies`, `company_profile`, `dossier_signoffs`, `monuments`, and `pet_taxi_policy`. `reports/schema-audit-findings.md` and `reports/schema-model-alignment.md` explicitly classify the 12-table RLS issue as requiring reviewed policies.

**Impact:** backend route guards do not protect a direct Supabase REST/PostgREST path if a client has a reachable Supabase project URL/key. This is especially sensitive for company status and signoff actor/notes.

**Fix:** separate reviewed migration: enable RLS, add public-read policies only for intended published/public content, deny direct client writes, and allow backend service-role writes. Test anonymous, authenticated, content-admin, and service-role access. Do not apply a bare `ENABLE ROW LEVEL SECURITY` change during this audit.

### F4 — **Medium: admin signoff “Approver Name” field is dropped/misrepresented**

**Evidence:** `SignoffPage.tsx:267–297` presents an editable “Approver Name” input and `handleUpdateSignoff` includes `approvedBy`/`approvedAt` in its payload (`lines 51–71`). However `admin/src/lib/api.ts:810–815` serializes only `status` and `client_notes`; it drops both fields. The backend controller then passes the authenticated `user.id` to the service (`dossier-signoffs.controller.ts:33–39`), and the service stores the UUID, not a display name.

**Impact:** a user-entered approver name appears editable but never persists; generated public data exposes an auth UUID as `approvedBy`. The backend behavior is safer than trusting a client-supplied actor, but the admin UI contract is misleading.

**Fix:** either remove/disable the approver-name field and label the value as the authenticated approver, or add a separate display-name column/reference with a reviewed privacy policy. Never allow arbitrary client input to control `approved_by`.

### F5 — **Medium latent schema defect: singleton tables are not singleton-enforced**

**Evidence:** migration 0024 creates `company_profile` and `pet_taxi_policy` with generated UUID primary keys but no singleton key/check. Repositories read each with `select * ... limit 1` (`postgres.ts:952–978`). Domain services and admin forms assume exactly one row. Live count is currently one each, so this is not current corruption.

**Fix:** add a deliberate singleton constraint/key (for example a fixed integer key constrained to 1, or a unique constant column) and deterministic read/update behavior; add a duplicate-prevention migration only after review.

### F6 — **Medium configuration blocker: public static snapshot freshness depends on deploy hook**

**Evidence:** each content service calls `triggerFrontendRebuild()` after updates. `react/scripts/build-manifest.ts:349–376` snapshots the five-table manifest into `generated-published-content.json`. The existing in-memory test run emitted `PAGES_DEPLOY_HOOK_URL not set`, so this environment does not prove automatic rebuild delivery.

**Impact:** an accepted admin update may persist in PostgreSQL/API while customer SSG pages continue showing an older snapshot until a build is triggered manually.

**Fix:** verify `PAGES_DEPLOY_HOOK_URL`/deployment wiring in the deployed environment, or make the public reader fetch the live manifest with a bounded fallback and expose snapshot age. Add a post-update read/build verification.

### F7 — Low: nullable text has inconsistent blank-string normalization

**Evidence:** `historical_context` is nullable by schema and mapped with a truthy conversion in `mapMonument`; Zod allows an optional empty string and the service can pass it through. `client_notes` is nullable, but the admin signoff page sends `localNotes` as `""` when blank; live state is one NULL plus nine empty strings.

**Impact:** no current required value is missing, but SQL `IS NULL` and `trim(...)=''` produce different results for semantically “no note/narrative.”

**Fix:** normalize trimmed empty optional strings to `null` in the service/schema boundary and add tests for omitted, null-equivalent, and non-empty values.

## 6. Writers and readers by actor

| Actor | Writes | Reads |
|---|---|---|
| Migration runner | Creates schema/defaults and initial rows; migration 0029 deactivates pet taxi and renames specialized signoff. | Migration ledger only. |
| Content-admin API user | PATCH policies, company, pet policy, monuments, and signoffs through role-guarded Fastify routes. | Admin list/get endpoints. |
| Admin Policies page | Updates policies, pet policy, company profile, monuments. It can directly set dossier status. | `admin/src/lib/api.ts` adapters. |
| Admin Signoff page | Updates signoff status/notes; backend derives actor/time; also directly requests company `signed_off` during finalization. | Checklist and company profile. |
| Booking service | Does not write policy rows; reads policies during cancellation and may write `refunds` and booking status. | Policy list through transaction repository. |
| Public Fastify reader | No writes. | Public policy/monument/pet/company/signoff endpoints and combined `/api/v1/content/manifest`. |
| React build/SSG | No DB writes. | Combined manifest at build time; stores `generated-published-content.json`. |
| Customer/public pages | No direct target-table writes. Monument detail consumes monument fields; Terms currently hard-codes cancellation text instead of reading policy rows. | Static generated content and public API fallbacks as wired. |
| Supabase direct roles | Potential direct access is not intended as an application writer, but RLS is disabled. | Security exposure remains unbounded until policies are reviewed. |

## 7. Bounded lifecycle test and validation status

The audit ran `npx vitest run tests/integration/dossier-manifest-modules.test.ts` from `backend/`. Result: **1 test file passed, 8 tests passed**. This uses `createTestApp()` and in-memory repositories; it did not touch Supabase or production rows.

Existing coverage proves:

- combined manifest returns all five sections;
- seeded counts are 9 policies, 10 monuments, 1 pet row, 1 company row, 10 signoffs;
- pet policy is false in the test seed;
- approving all ten signoffs synchronizes company profile to `signed_off`.

The bounded lifecycle test that remains necessary is:

1. Start from in-memory/reference data with one pending signoff.
2. Attempt direct company PATCH `dossier_status=signed_off`; expected result after fix: reject, or derive status instead of trusting payload.
3. Approve all ten with an authenticated admin; assert every approved row has `approved_by` and `approved_at`, and profile becomes `signed_off`.
4. Revert one row to `pending`; assert that row clears actor/time and profile becomes `pending_review`.
5. Set one row to `modification_requested`; assert profile becomes `modifications_needed`.
6. Fetch public manifest and assert it contains only the intended public shape; decide whether `approved_by`, client notes, and signoff rows should be exposed.
7. Run cancellation engine boundary cases against the same seeded policy rows and compare the Terms/public text to those exact outcomes.

No production mutation is justified for these tests. A live lifecycle test would require content edits and potentially cancellation/refund writes, which are explicitly out of scope; use the in-memory harness and read-only live aggregate verification instead.

## 8. Recommended fix order

1. **Protect the dossier invariant:** remove direct `dossier_status` writes or gate them behind an all-approved transaction; add regression tests for approve/revert/modification states.
2. **Resolve cancellation source-of-truth mismatch:** make Terms consume the policy data or align its hard-coded wording to the nine DB slabs; add boundary tests.
3. **Review public exposure and RLS:** define least-privilege public-read/service-write policies and decide whether public signoff rows/actor UUIDs/client notes should be redacted.
4. **Fix signoff UI contract:** remove the arbitrary approver-name input or replace it with read-only authenticated actor display; keep backend actor derivation.
5. **Enforce singleton semantics:** add a reviewed constraint/key for company and pet policy; avoid nondeterministic `LIMIT 1` reads.
6. **Normalize optional text:** convert blank optional notes/narratives to NULL consistently.
7. **Verify rebuild delivery:** configure/verify deploy hook or live-manifest freshness after every accepted content update.

## 9. Evidence index

- Prior inventory: `reports/live-schema-inventory.md`, target sections lines 562–639; row/RLS summary lines 32–36.
- Prior alignment/security report: `reports/schema-model-alignment.md`, especially lines 45–52.
- Prior findings: `reports/schema-audit-findings.md`, lines 34–36.
- Phase-one findings: `reports/phase1-table-scan-findings.md`, lines 23–24 and 71–88.
- Execution boundary: `reports/2026-10-06-16-table-alignment-execution-plan.md`, lines 5–10 and 30–41.
- Schema/seeds: `backend/migrations/0024_dossier_content.sql`; pet deactivation `0029_remove_pet_taxi_offering.sql`; FK correction `0027_fix_dossier_signoffs_approved_by_fkey.sql`.
- Domain/mappers/repositories: `backend/src/db/dossier-types.ts`, `backend/src/db/postgres.ts`, `backend/src/db/types.ts`, `backend/src/db/memory.ts`.
- Services/routes/schemas: target modules under `backend/src/modules/{cancellation-policies,company-profile,pet-policy,monuments,dossier-signoffs}` and `backend/src/modules/content/content.routes.ts`.
- Admin: `admin/src/lib/api.ts`, `admin/src/lib/types.ts`, `admin/src/pages/PoliciesPage.tsx`, `admin/src/pages/SignoffPage.tsx`.
- Public: `react/src/pages/TermsPage.tsx`, `react/src/pages/MonumentDetailPage.tsx`, `react/scripts/build-manifest.ts`, `react/src/app/ServerApp.tsx`.
