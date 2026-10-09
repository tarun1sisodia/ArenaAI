# Catalog Publishing Recovery Plan — Detailed Execution Specification

**Repository:** `tarun1sisodia/ArenaAI`  
**Priority scope:** Routes, Tour Packages, Local Tours, and Transfer Tours/Routes  
**Secondary scope:** Monuments after the four priority verticals are stable  
**Audit date:** 2026-10-08  
**Purpose:** A practical document to give to the implementation agent.

---

## 1. Executive decision

**Do not rebuild the whole backend.** Rebuilding would remove code without proving which behavior is wrong and would risk the working booking flow. The current repository already has domain modules, Admin forms, API schemas, publication statuses, manifests, SSG, and booking endpoints.

The immediate problem is that the system does not have one observable, fail-closed path from:

```text
Admin form
  -> request payload
  -> Backend Zod schema
  -> database row
  -> publication status
  -> public manifest
  -> build snapshot
  -> generated HTML
  -> customer discovery/detail page
  -> booking-time validation
```

There are also multiple silent fallbacks. A successful test can therefore prove only that one function returned successfully; it does not prove that the correct record survived the full pipeline.

The recovery must therefore do two things at the same time:

1. **Make the four priority verticals traceable from the form field to the final HTML.**
2. **Make every fallback, duplicate, overwrite, bypass, stale-data, and partial-release path visible and testable.**

---

## 2. Baseline and why the current green tests are not enough

The current repository baseline is green:

- 30 backend test files passed.
- 209 backend tests passed.
- SEO lifecycle checks passed.
- Customer, Admin, and Backend typechecks/builds passed.
- Customer SSG completed with 57 pages.

This means the individual existing test suites and build commands can complete. It does **not** prove that the following chain works:

```text
Admin enters route -> Admin sends correct JSON -> Backend accepts it
-> database stores the intended values -> publish changes public data
-> deploy is triggered -> build reads the intended backend
-> generated manifest contains the row once -> prerenderer creates the URL
-> ServerApp resolves the same slug -> page displays the same price
```

The previous build showed:

- 2,062 route entries in `public/routes-manifest.json`.
- 967 typed routes in `generated-catalog.json`.
- 7 generic catalog items.
- 3 tour packages.
- 4 transfer routes.
- 1 local package.
- **HTTP 404 for `/api/v1/content/manifest`**, followed by a successful build using fallback content.

That final result is exactly why the old tests are insufficient: the build was “green” while a required content source was missing.

### What a trustworthy test must prove

Every lifecycle test must record and compare these values:

- `entityType`: route/package/local-tour/transfer-route.
- `entityId`: database UUID.
- `code` or `slug`: public identifier.
- `requestPayload`: JSON sent by Admin.
- `validatedPayload`: data accepted by Backend schema.
- `databaseRowAfterSave`: actual stored values.
- `statusAfterSave`: draft/published/archived.
- `sourceVersion`: content version used by the release.
- `releaseId` and `manifestVersion`.
- `manifestOccurrences`: how many times the slug appears.
- `prerenderedPaths`: actual generated URL list.
- `htmlValues`: title, text, price, and canonical URL found in the generated HTML.
- `bookingReference`: entity ID/version sent to booking.

A test that checks only HTTP 200 or only `expect(result.status).toBe("published")` is not sufficient.

---

## 3. Cloudflare Pages variables shown in the screenshot

These variables are useful, but they do different jobs. The variable names shown below are already corrected and should be treated as the established contract. The remaining concern is whether their configured values point to the correct environment and whether the build fails clearly when a required source is unavailable.

| Variable | Used by | Useful for customer site? | Current meaning | Validation / operational requirement |
|---|---|---:|---|---|
| `CONTENT_MANIFEST_URL` | Customer build | Yes, if the endpoint exists | Full URL intended for `/api/v1/content/manifest` | The screenshot appears to point to `/api/v1/content/`; verify the final path. Current build received HTTP 404. Use the exact implemented endpoint or remove this separate endpoint in favor of one release endpoint. |
| `LOCAL_PACKAGES_MANIFEST_URL` | Customer build | Yes | Published local-tour snapshot source | Must return `{ data: [...] }` and must contain the same release/version as the other sections. Current code allows an unavailable endpoint to become an empty snapshot. |
| `NODE_VERSION` | Cloudflare build runtime | Yes, indirectly | Node 22 is required by the prerender command using `--experimental-strip-types` | Keep `22`; verify Preview and Production both use it. |
| `ROUTE_CATALOG_MANIFEST_URL` | Customer build | Yes | Published route catalog source | The name is already correct. Validate that its configured URL returns the expected published route data and release metadata. |
| `TOUR_PACKAGES_MANIFEST_URL` | Customer build | Yes | Published tour-package snapshot source | The name is already correct. Validate that its configured URL returns the expected published package data and release metadata. |
| `TRANSFER_ROUTES_MANIFEST_URL` | Customer build | Yes | Published transfer-route snapshot source | The name is already correct. Validate that its configured URL returns the expected published transfer-route data and release metadata. |
| `VITE_API_BASE_URL` | Customer build and browser runtime | Yes | Backend base URL used to build API and manifest URLs | Production must point to the production API, not `skb-baghel-api-staging.onrender.com`. Preview may point to staging. Do not let the script silently default to staging. |
| `VITE_BASE_PATH` | Vite/SSG asset paths | Yes | Site base path, currently `/` | Keep `/` unless the site is served under a subdirectory. A mismatch can make generated links/assets look missing even when data is correct. |
| `VITE_REACT_MIGRATION_ENABLED` | Customer runtime | Yes, as a feature switch | Enables the React migration unless set to `false` | It does not fetch catalog data or trigger deploys. Keep only while migration fallback is needed; test both true and false behavior separately. |
| `VITE_SUPABASE_URL` | Customer browser auth | Yes for customer login/auth | Supabase project URL | Must match the same environment as the publish API/auth. It is not the SSG catalog source. |
| `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Customer browser auth | Yes for customer login/auth | Public browser key used by Supabase client | This is not a secret service-role key, but it does not control catalog publication. Do not use it as evidence that the frontend is connected to the correct database. |
| `PAGES_DEPLOY_HOOK_URL` | Backend publisher, not customer build | Indirectly yes | Cloudflare Pages hook that starts a rebuild | It should be configured on the Backend, not exposed as `VITE_*`. The current code warns when it is missing but can still report a successful content operation. |
| `CATALOG_API_URL` | Customer build | Yes, legacy/current fallback | Generic catalog API base/source | It competes with `VITE_API_BASE_URL`. Replace both with one explicit release URL or define precedence and fail on ambiguity. |

### Important conclusions about the screenshot

1. These variables are **not the complete synchronization mechanism**. They only tell the build where to read data.
2. A variable being present does not prove the URL returns the correct schema, current release, or published record.
3. The screenshot shows staging API URLs. If this is the Production Cloudflare Pages environment, the customer production build is being assembled from staging content. That is a serious environment mismatch.
4. `CONTENT_MANIFEST_URL` is especially suspicious because the observed build returned 404. Test the exact configured URL with `curl -i` and compare it with the backend registered route.
5. The build script currently has a hard-coded fallback to `https://skb-baghel-api-staging.onrender.com`. This must be removed for production. A missing production variable must fail the build.
6. The build currently fetches five independent sources. Even if every variable is correct, the sources may represent different database moments and produce a mixed release.

### Required environment verification command

The implementation agent should add a non-secret diagnostic command that prints only URL names and HTTP results, not keys:

```text
check-catalog-sources

For each required source:
  print variable name
  print resolved URL without credentials
  print HTTP status
  print response releaseId/manifestVersion
  print item count
  validate schema
```

The command must fail if:

- a required variable is absent;
- a URL returns 404/500;
- the response has no expected `data` or release structure;
- release versions differ between sections;
- duplicate slugs exist.

---

## 4. Exact Admin-to-Backend contracts for the four priority verticals

The Admin forms currently use camelCase state and translate it into snake_case API payloads. The Backend schemas validate the snake_case payload. The test must inspect both sides; TypeScript compiling does not prove that the runtime JSON is correct.

### 4.1 Routes

**Admin form state → Backend request fields**

| Admin field | JSON field | Type/constraint | Meaning |
|---|---|---|---|
| `tripType` | `trip_type` | `one-way \| round-trip \| local-tour` | Determines route rules. |
| `sourceCity` | `source_city` | string, 2–80 chars | Origin. |
| `sourceDetail` | `source_detail` | optional string, max 80 | Additional origin detail. |
| `destinationCity` | `destination_city` | optional string, max 80 | Required except for local tour. |
| `slug` | `slug` | lowercase `[a-z0-9-]`, 2–80 chars | Public URL identifier. |
| `distanceKm` | `distance_km` | positive finite number, max 10,000 | Route distance. |
| `durationText` | `duration_text` | optional string, max 80 | Display duration. |
| `availableFleets` | `available_fleets` | array of canonical vehicle keys, minimum 1 | Vehicles offered. |
| `faresInr` | `fares_inr` | record of positive finite numbers | Fare per vehicle tier. |
| `driverChargeInr` | `driver_charge_inr` | non-negative number | Driver charge. |
| `nightHaltInr` | `night_halt_inr` | non-negative number | Night halt. |
| `tollIncluded` | `toll_included` | boolean | Whether toll is in the displayed fare. |
| `tollAmountInr` | `toll_amount_inr` | optional non-negative number | Toll amount. |
| `interstateCharges` | `interstate_charges` | array of `{state, amount_inr, note}` | State-border charges. |
| `minKmPerDay` | `min_km_per_day` | integer 50–1000 | Minimum daily distance. |
| `stops` | `stops` | array of `{name, halt_mins}` | Local-tour stops only. |
| `usePerKm` | `use_per_km` | boolean | Whether per-km pricing applies. |
| `perKmRateOverride` | `per_km_rate_override` | nullable positive number | Optional override. |
| `highway` | `highway` | optional string max 160 | Highway note. |
| `allInclusiveNote` | `all_inclusive_note` | optional string max 500 | Commercial note. |
| `needsReview` | `needs_review` | boolean | Review flag. |

**Backend route rules that must be tested:**

- `local-tour` must not include `destination_city`.
- `one-way` and `round-trip` must include `destination_city`.
- `stops` are invalid for non-local routes.
- Local tours require at least two stops.
- Every `available_fleets` key must have a fare.
- No fare may be supplied for a fleet not in `available_fleets`.
- Unknown fleet keys must be rejected, not silently ignored.
- The API must return the normalized canonical key after legacy input mapping.

### 4.2 Tour Packages

**Admin form state → Backend request fields**

| Admin field | JSON field | Type/constraint |
|---|---|---|
| `packageCode` | `package_code` | lowercase slug, 2–80 chars |
| `name` | `name` | string, 2–100 chars |
| `durationText` | `duration_text` | string, 2–60 chars |
| `days` | `days` | integer 1–30 |
| `nights` | `nights` | integer 0–30 |
| `baseTierCode` | `base_tier_code` | string, default `sedan` |
| `startingPriceInr` | `starting_price_inr` | positive finite number |
| `fleetPrices` | `fleet_prices` | positive finite number record |
| `nightChargeInr` | `night_charge_inr` | non-negative number |
| `source` | `source` | string, default `Agra` |
| `destination` | `destination` | string, may be empty |
| `inclusions` | `inclusions` | maximum 50 strings |
| `exclusions` | `exclusions` | maximum 50 strings |
| `itinerary` | `itinerary` | maximum 50 `{time,title,desc}` objects |
| `imageUrl` | `image_url` | nullable string max 1000 |
| `gallery` | `gallery` | maximum 30 `{url,caption,alt}` objects |
| `isActive` | `is_active` | boolean |

The Admin uses a preflight code check for new packages, then sends the create/update request, then separately calls publish if “Save & Publish” was selected. This is two operations, not one transaction. The test must prove what happens if the first succeeds and the second fails.

### 4.3 Local Tours

**Admin form state → Backend request fields**

| Admin field | JSON field | Type/constraint |
|---|---|---|
| `packageCode` | `package_code` | lowercase slug, 2–80 chars |
| `name` | `name` | string, 2–100 chars |
| `durationHours` | `duration_hours` | integer 1–48 |
| `includedKm` | `included_km` | integer 10–1000 |
| `covers` | `covers` | string, 2–500 chars |
| `parkingNote` | `parking_note` | optional string max 200 |
| `fleetPrices` | `fleet_prices` | positive finite number record |
| `usePerKm` | `use_per_km` | boolean |
| `extraRates` | `extra_rates` | nullable record of positive `per_km` and `per_hr` |
| `nightChargeInr` | `night_charge_inr` | non-negative number |
| `isActive` | `is_active` | boolean |

The current local-tour service has a known publication risk: it triggers a rebuild only for selected pricing changes. The acceptance test must update every public field—name, duration, included kilometres, covers, parking note, extra rates, and night charge—and verify that each update creates a new public release.

### 4.4 Transfer Tours/Routes

**Admin form state → Backend request fields**

| Admin field | JSON field | Type/constraint |
|---|---|---|
| `routeCode` | `route_code` | lowercase slug, 2–80 chars |
| `name` | `name` | string, 2–100 chars |
| `distanceText` | `distance_text` | optional string max 60 |
| `directionNote` | `direction_note` | optional string max 200 |
| `fleetPrices` | `fleet_prices` | positive finite number record |
| `usePerKm` | `use_per_km` | boolean |
| `nightChargeInr` | `night_charge_inr` | non-negative number |
| `isActive` | `is_active` | boolean |

The customer URL is `/en/transfers/{routeCode}/`. The test must ensure that the Admin code, Backend code, public manifest slug, prerender path, ServerApp resolver, sitemap URL, and final canonical URL are all identical.

---

## 5. Canonical rules that must be fixed before lifecycle testing

### 5.1 Fleet keys

The canonical five keys must be exactly:

```text
sedan
ertiga
innova-crysta
tempo-traveller
urbania
```

The repository currently has drift:

- Backend contracts can normalize legacy `innova` and `tempo`.
- `react/scripts/build-manifest.ts` still emits `innova` and `tempo`.
- Admin displays canonical keys but contains legacy fallback reads.
- Static route data uses short legacy identifiers.

Required rule:

- Accept legacy keys only while reading old records.
- Normalize them once at the Backend boundary.
- Never emit legacy keys in new database rows, public manifests, generated JSON, or HTML.
- Reject unknown keys with a visible 400 error.

### 5.2 One identifier

For each entity, use:

- Database UUID for internal mutation and booking references.
- Stable `slug`/`package_code`/`route_code` for public URLs.
- `sourceVersion` for release and booking reconciliation.

Do not use a name-derived slug as a runtime fallback after publication. A name edit must not silently change the public URL.

### 5.3 One public release

The build must consume one atomic release response, for example:

```ts
interface PublicCatalogRelease {
  releaseId: string;
  manifestVersion: number;
  generatedAt: string;
  entities: {
    routes: PublicRoute[];
    tourPackages: PublicTourPackage[];
    localTours: PublicLocalTour[];
    transferRoutes: PublicTransferRoute[];
  };
}
```

Separate generated files may still be written for convenience, but they must all include the same `releaseId` and `manifestVersion`.

---

## 6. Error-handling rule: remove hidden fallbacks first

The code is currently difficult to trace because many operations use `try/catch` to continue with a fallback. During recovery, use this rule:

### Backend command handlers

A create, update, publish, or archive command must:

1. Validate input.
2. Run the database operation.
3. Commit or roll back.
4. Return the actual persisted record.
5. Return a clear error if any required step fails.

It must not catch an error and return the previous record as though the new command succeeded.

### Build input

The build must:

1. Resolve one explicit production/staging source URL.
2. Fetch it.
3. Check HTTP status.
4. Parse JSON.
5. Validate the full schema.
6. Check duplicate identifiers.
7. Write a temporary snapshot.
8. Run prerender checks.
9. Atomically move the verified snapshot into the build output.

If any step fails, the build exits non-zero. No empty array, static baseline, old localStorage data, or silently preserved JSON is allowed in the normal production path.

### Emergency rollback

A separate, explicit emergency mode may use the last known-good release, but it must:

- be disabled by default;
- require `ALLOW_STALE_RELEASE=1`;
- print the stale `releaseId` and timestamp;
- mark the deployment as stale;
- never pretend that the new Admin content is live.

---

# 7. Expanded recovery phases

## Phase 0 — Freeze, observe, and create a trace ID

### Objective

Make it possible to answer: “For this Admin click, exactly what happened in Admin, Backend, database, build, and customer HTML?”

### Implementation steps

1. Freeze modifications to booking, payment, and fare-calculation behavior.
2. Add a `correlationId` to every Admin save/publish request.
3. Log the correlation ID in Backend controllers, services, repository calls, outbox events, build logs, and deploy-hook requests.
4. Log the entity UUID, public slug/code, status, source version, release ID, and manifest version.
5. Add an Admin release status panel with separate states:
   - `database_saved`
   - `publish_committed`
   - `release_queued`
   - `release_building`
   - `release_deployed`
   - `release_failed`
6. Add a read-only endpoint returning the latest release metadata.
7. Add an environment diagnostic that tests every configured catalog URL.
8. Remove the hard-coded staging fallback from production builds.

### Test cases

#### P0-T01 — Correlation ID survives the entire route publish

**What it does:** Creates a route in Admin, captures the request correlation ID, and asserts that the same ID appears in the Backend response, audit event, release event, build log, and deployment status.  
**Why it matters:** Without one trace ID, an operator cannot distinguish a failed save, a stale build, or a page-rendering mismatch.

#### P0-T02 — Missing `PAGES_DEPLOY_HOOK_URL` is an explicit release failure

**What it does:** Publishes a valid record while the deploy hook variable is absent and asserts that the database operation is distinguishable from customer deployment; the Admin must show `publish_committed` but not `release_deployed`.  
**Why it matters:** The current warning says “frontend will not auto-rebuild” while the underlying content command may still look successful.

#### P0-T03 — Production build does not default to staging

**What it does:** Runs a production build with `VITE_API_BASE_URL`, `CATALOG_API_URL`, and all manifest URL variables unset and asserts that the process exits non-zero without contacting `skb-baghel-api-staging.onrender.com`.  
**Why it matters:** A missing environment variable must never cause production pages to be built from staging data.

#### P0-T04 — Every source URL has the expected route and schema

**What it does:** Calls each configured URL, records its HTTP status, validates its JSON shape, checks item count, and checks release version.  
**Why it matters:** A variable being present is not proof that it points to an implemented endpoint; this catches the current content-manifest 404.

---

## Phase 1 — Establish contracts and remove ambiguity

### Objective

Ensure the Admin request, Backend schema, database representation, public release, and Customer types agree on field names, types, enum values, and identifier rules.

### Implementation steps

1. Create a shared contract package for canonical fleet tiers and public release schemas.
2. Generate or import the same types into Backend, Admin, and Customer.
3. Make Admin payload builders explicit functions, one per entity.
4. Do not send unused fields from a form.
5. Do not silently rename or omit fields in the API client.
6. Validate the request on the Admin side for fast feedback, then validate again on Backend as the authority.
7. Add database constraints for unique public codes/slugs.
8. Add a migration/read mapper for old `innova` and `tempo` keys.
9. Make public DTOs explicit; do not expose raw database rows.
10. Add `sourceVersion` and `updatedAt` to every public DTO.

### Test cases

#### P1-T01 — Route payload is exactly the Backend route schema

**What it does:** Builds a route payload from the Admin form, serializes it to JSON, parses it with `CreateRouteCatalogSchema`, and compares every field and type with the expected normalized object.  
**Why it matters:** TypeScript interfaces can compile while the runtime payload uses the wrong snake_case name or sends a string where Zod expects a number.

#### P1-T02 — Tour package payload is exactly the Backend package schema

**What it does:** Exercises every package form field, including itinerary, gallery, inclusions, exclusions, image URL, prices, days, and nights, then validates the outgoing JSON against `CreateTourPackageSchema`.  
**Why it matters:** Packages have the largest form and the most opportunities for omitted fields, wrong defaults, or inconsistent image property names.

#### P1-T03 — Local-tour payload is exactly the Backend local schema

**What it does:** Sends duration, included kilometres, covers, parking note, five fleet prices, extra kilometre/hour rates, and night charge through the real Admin payload builder and Backend schema.  
**Why it matters:** This proves that the local-tour pricing structure is not merely displayed in Admin but is actually accepted and stored with the intended nesting.

#### P1-T04 — Transfer-route payload is exactly the Backend transfer schema

**What it does:** Sends route code, name, distance text, direction note, five fleet prices, per-kilometre flag, night charge, and active flag through the real API client.  
**Why it matters:** Transfer routes use a different identifier field (`route_code`) and a different URL namespace, so copying local-tour code can easily produce an accepted but incorrectly mapped record.

#### P1-T05 — Unknown fields are rejected

**What it does:** Adds `packageCode`, `routeCode`, `innova_crysta`, or another accidental camelCase/legacy field to a strict request and asserts a 400 response rather than silently accepting and dropping it.  
**Why it matters:** Silent dropping is a bypass: the Admin appears to save a value that the Backend never stores.

#### P1-T06 — Unknown fleet keys are rejected visibly

**What it does:** Sends a fare under `luxury-suv` and asserts that the response identifies the exact invalid key and does not save a partially sanitized record.  
**Why it matters:** A sanitizer that removes the bad key can produce a record with missing prices while still returning success.

#### P1-T07 — Legacy fleet keys normalize once and are never re-emitted

**What it does:** Reads an old row containing `innova` and `tempo`, verifies Backend normalization to `innova-crysta` and `tempo-traveller`, then checks the database update, public JSON, and generated HTML for absence of the old keys.  
**Why it matters:** This detects overwrite/bypass behavior where one layer maps the key but another layer writes the old key back.

#### P1-T08 — Duplicate public code is rejected at the database boundary

**What it does:** Sends two concurrent creates with the same route slug/package code and asserts exactly one row is created and the other request receives a unique-conflict error.  
**Why it matters:** Admin preflight availability checks are race-prone; only a database unique constraint prevents duplicates under concurrency.

---

## Phase 2 — Repair one vertical end to end: Routes

### Objective

Prove one route from Admin form to public HTML and booking reference before migrating the other three priority verticals.

### Route lifecycle: exact expected behavior

#### Step 1 — Create as draft

Admin fills the route form and clicks **Save as Draft**. The Admin sends one create request without `status: published`, unless the Backend explicitly owns default status.

Expected result:

- Backend validates the exact route payload.
- Database creates one row with a UUID, slug, `draft`, and version 1.
- No public manifest contains the route.
- No route detail HTML is generated.
- Customer search cannot find it.

#### Step 2 — Edit the draft

Admin changes a field such as `duration_text`, `fares_inr.sedan`, or `toll_amount_inr` and clicks Save.

Expected result:

- Same UUID and same slug remain.
- Version increments once.
- Only the requested fields change.
- No unrelated field is overwritten by a default from the form.
- It remains absent publicly.

#### Step 3 — Publish

Admin clicks Publish. The Backend must perform the publication command and create the release event in a known order.

Expected result:

- Row status becomes `published`.
- `publishedAt` is recorded.
- Version increments once.
- Audit event contains before/after values.
- Exactly one outbox event exists for that entity version.
- Admin reports database publication, not yet deployment completion.

#### Step 4 — Build the release

The publisher reads the public release endpoint. The release must include this route exactly once with:

- UUID.
- stable slug.
- source and destination.
- trip type.
- distance and duration.
- all available fleet keys.
- display-ready fares.
- toll/charge fields.
- `sourceVersion`.
- `releaseId` and `manifestVersion`.

#### Step 5 — Generate customer paths

The prerenderer must create the route page path expected by `ServerApp.tsx`, for example `/en/{slug}/` according to the current route convention.

The test must inspect the actual filesystem and not merely trust a counter. It must assert that the exact path exists and that it was generated from this route’s slug.

#### Step 6 — Render the page

The generated HTML must contain:

- the route name or origin/destination;
- the stable canonical URL;
- the expected server-provided price;
- the source version/release metadata where appropriate;
- no draft-only data;
- no legacy fleet key;
- no client-only “loading” shell as the only content.

#### Step 7 — Search and open

Customer search must read the same release manifest used for SSG. It must find the route once. Opening the result must use exactly the same slug as the generated page.

#### Step 8 — Booking

The customer submits the route UUID/slug/source version. Backend re-reads the authoritative row and checks:

- entity exists;
- status is published;
- entity is active;
- source version is still valid or is reconciled according to the chosen policy;
- requested fleet tier is available;
- final price is calculated server-side.

#### Step 9 — Update after publication

Admin changes the route fare and a descriptive field. The system must create one new release containing both changes. The old HTML must not remain live after the new deployment is verified.

#### Step 10 — Archive

Admin archives the route. The next release must remove it from discovery, sitemap, and public manifest. The detail URL must follow the deliberate 404/redirect policy.

### Route test cases

#### P2-T01 — Draft is saved but never public

**What it does:** Creates a draft route, fetches the public release, searches the customer manifest, and checks the expected detail path; all must exclude the route.  
**Why it matters:** This catches draft leakage through public endpoints, static fallback files, and route resolvers that ignore status.

#### P2-T02 — Draft edit changes only intended fields

**What it does:** Creates a draft with every field populated, updates only `duration_text`, then compares the complete database row before and after.  
**Why it matters:** This detects overwrite logic where partial update code replaces missing fields with defaults or `undefined`.

#### P2-T03 — Publish creates exactly one database version and one outbox event

**What it does:** Publishes the same route once and inspects the row version, audit log, and outbox table for one state transition and one event.  
**Why it matters:** A page can be correct while the event system creates duplicate builds or multiple inconsistent versions.

#### P2-T04 — Repeated publish is idempotent

**What it does:** Sends the publish command twice, including concurrently, and asserts that the second command does not create a second version, duplicate public row, or duplicate release event.  
**Why it matters:** Double-clicks, retries, and network replay are normal; idempotency prevents duplicate or overwritten publication.

#### P2-T05 — Public manifest contains one route, not two aliases

**What it does:** Builds the release and counts occurrences by UUID and slug across all generated route files and manifest indexes.  
**Why it matters:** The current system merges static and Admin route sources, which can create one logical route twice under different objects.

#### P2-T06 — Same slug cannot overwrite a different UUID

**What it does:** Creates route A with slug `agra-jaipur`, then attempts route B with the same slug and asserts a conflict; it also verifies route A’s page remains unchanged.  
**Why it matters:** This catches overwrite-by-slug behavior where a later Admin save silently replaces another route.

#### P2-T07 — Admin payload cannot bypass Backend validation

**What it does:** Calls the API directly with an invalid destination/trip-type combination, missing fare, unknown fleet, invalid slug, and extra property; each request must fail before persistence.  
**Why it matters:** Browser validation is not a security or correctness boundary; direct requests must not bypass it.

#### P2-T08 — Build fails on a route endpoint 404

**What it does:** Makes the route manifest source return HTTP 404 and runs the production build; the build must exit non-zero and must not publish an empty route snapshot.  
**Why it matters:** The current warning-and-continue behavior can publish a site that silently loses all new routes.

#### P2-T09 — Build rejects duplicate route slugs

**What it does:** Supplies a fixture release with two published route objects sharing one slug and asserts that schema/completeness validation fails before HTML is written.  
**Why it matters:** A duplicate slug makes the final page depend on array order, which is hidden overwrite logic.

#### P2-T10 — Build rejects a missing published route

**What it does:** The Backend release health says three routes are published, but the release payload contains two; the build must fail and report the missing UUID/slug.  
**Why it matters:** This catches filters, pagination limits, and status transformations that silently drop records.

#### P2-T11 — Generated HTML matches the database version

**What it does:** Publishes a route with a unique marker in its name and sedan fare, builds the site, and asserts that both markers and the same source version appear in the generated HTML.  
**Why it matters:** It proves the build did not use an old JSON snapshot or the wrong environment.

#### P2-T12 — Customer search and detail page use the same slug

**What it does:** Searches by the route name, extracts the result URL, opens it, and asserts the URL equals the prerendered path and the page entity UUID matches the search item.  
**Why it matters:** A route can exist in the manifest but still point to a URL that ServerApp cannot resolve.

#### P2-T13 — Booking rejects archived route

**What it does:** Archives a previously published route and submits a booking using its old UUID/slug/version; the Backend must reject the selection and must not create a payable booking.  
**Why it matters:** Removing a page is not enough; the API must prevent stale pages or replayed requests from booking unavailable content.

#### P2-T14 — Booking rejects stale price version

**What it does:** Opens a route at version 1, changes its price to version 2, then submits the version-1 booking payload and asserts a stale-price response requiring refresh/recalculation.  
**Why it matters:** This prevents the customer page and booking engine from using different commercial values.

---

## Phase 3 — Replace direct deploy calls with a durable publisher

### Objective

Make publication reliable even when the build provider, network, or Admin browser fails after the database commit.

### Implementation steps

1. Add an outbox table in the same database transaction as the status/content update.
2. Store event type, entity type, entity UUID, source version, correlation ID, retry count, and timestamps.
3. Use a deterministic idempotency key such as `catalog:{entityType}:{entityId}:{sourceVersion}`.
4. Add a publisher worker that claims pending events.
5. Debounce multiple edits into one release request while retaining all source versions in audit history.
6. Generate one atomic public release.
7. Validate the release before calling Cloudflare.
8. Call the Deploy Hook only after the release is recorded.
9. Record provider response and deployment ID.
10. Poll or receive deployment completion.
11. Verify the final deployment contains the expected release ID.
12. Keep the last known-good release if the new build fails.

### Test cases

#### P3-T01 — Database commit succeeds when Deploy Hook is unavailable

**What it does:** Forces the hook request to fail after the database transaction commits and verifies that the row remains published, one outbox event remains retryable, and Admin shows deployment pending/failed rather than success.  
**Why it matters:** A provider outage must not roll back valid content accidentally, but it also must not be hidden.

#### P3-T02 — Outbox event survives Backend restart

**What it does:** Commits a publish, stops the publisher before delivery, restarts it, and verifies that the durable event is delivered once.  
**Why it matters:** An in-memory promise or direct HTTP call loses the publication trigger when the process restarts.

#### P3-T03 — Retry does not duplicate the release

**What it does:** Makes the first hook attempt time out after Cloudflare accepted it, then retries with the same idempotency key and checks that only one logical release is recorded.  
**Why it matters:** Timeouts are ambiguous; retry logic must not create overlapping builds or duplicate events.

#### P3-T04 — Five edits are debounced but none are lost

**What it does:** Updates one published route five times quickly, then verifies one final release contains the fifth value and the audit history contains all five changes.  
**Why it matters:** Debouncing must reduce builds without overwriting history or publishing an intermediate incomplete object.

#### P3-T05 — Failed release does not replace last-known-good release

**What it does:** Publishes version 2 with an invalid image/schema, forces the build to fail, and verifies that the public site remains on version 1 while Admin shows version 2 as failed.  
**Why it matters:** A bad release must not remove working pages or replace a valid catalog with an empty snapshot.

---

## Phase 4 — Make the Customer build fail closed

### Objective

Stop producing successful but incomplete sites.

### Required build failures

The build must exit non-zero when:

- a required release URL is missing;
- a configured URL returns 404/500;
- response JSON is malformed;
- schema validation fails;
- release sections disagree on version;
- a published item is duplicated;
- a published item is omitted;
- a draft/archived item appears in public data;
- a fleet key is unknown;
- required price fields are missing;
- a public slug is invalid or collides;
- a generated page is missing;
- generated HTML lacks canonical URL/title/entity marker;
- the sitemap includes a path without a generated page.

### Test cases

#### P4-T01 — Empty array is not accepted as a successful fetch

**What it does:** Returns HTTP 200 with `{data: []}` while the release health says published records exist and asserts that the build fails with a count mismatch.  
**Why it matters:** HTTP success plus an empty array can be a backend permission problem, wrong environment, pagination bug, or accidental filter.

#### P4-T02 — Existing local JSON cannot silently overwrite a failed fetch

**What it does:** Seeds an old snapshot containing version-1 data, makes the API return 500, and asserts that normal production build fails instead of preserving or rewriting the old file.  
**Why it matters:** Preserving old data hides whether the new release worked and can make operators believe a new edit is live.

#### P4-T03 — Draft cannot enter a public snapshot through missing status

**What it does:** Supplies one item with `status: draft`, one item with no status, and one published item, then asserts that only the explicitly published item is emitted.  
**Why it matters:** Current prerender filters sometimes treat missing status as acceptable; that is a publication bypass.

#### P4-T04 — Duplicate UUID and duplicate slug are separate failures

**What it does:** Tests one fixture with repeated UUIDs and another with different UUIDs sharing one slug; both must fail with different diagnostic messages.  
**Why it matters:** Deduplicating by UUID does not solve slug collisions, and deduplicating by slug can hide two database records.

#### P4-T05 — Sitemap and HTML are one-to-one

**What it does:** Compares every dynamic sitemap URL with the prerendered filesystem and every prerendered dynamic path with the release manifest.  
**Why it matters:** SEO can expose pages that the router cannot render, or the router can render pages omitted from indexing.

#### P4-T06 — Build output is atomic

**What it does:** Forces a failure halfway through generation and verifies that the deploy directory still contains the previous complete output or no new output, never a mixture of old and new entity files.  
**Why it matters:** Partial writes create the exact “some sections updated, some sections old” behavior being reported.

---

## Phase 5 — Migrate the four priority verticals

Do not migrate all modules simultaneously. Each module must pass the same lifecycle contract before the next is changed.

### 5.1 Tour Packages

#### Required lifecycle checks

- Save draft with package code and all commercial/content fields.
- Edit draft without changing unrelated gallery, itinerary, or price fields.
- Publish once and confirm one release event.
- Confirm `/en/packages/{packageCode}/` is generated.
- Confirm gallery URLs are durable and accessible from the deployed site.
- Confirm all five canonical fleet prices appear in the release.
- Update a descriptive field and prove a new build occurs.
- Update a price and prove both display and booking use the new version.
- Archive and confirm removal from manifest, sitemap, and page discovery.

#### Package-specific test cases

##### P5-P01 — Save & Publish two-step failure is visible

**What it does:** Makes the create/update request succeed and the subsequent publish request fail; it verifies the record remains draft or published according to the Backend command result and Admin displays the exact state.  
**Why it matters:** The Admin button looks like one action but currently performs separate requests, so partial completion must be explicit.

##### P5-P02 — Gallery upload is durable before publication

**What it does:** Uploads an image, reloads the Admin page, publishes the package, builds the customer site, and verifies the same media URL is present and reachable.  
**Why it matters:** An in-memory upload cache can make Admin look correct while the build cannot access the image.

##### P5-P03 — Package descriptive edits trigger a release

**What it does:** Changes name, duration, itinerary, inclusion, exclusion, and gallery metadata one at a time and checks that each public edit changes the release fingerprint.  
**Why it matters:** A release trigger restricted to price changes leaves the customer page stale for content edits.

##### P5-P04 — Package fallback price is not silently invented

**What it does:** Removes one fleet price from a fixture and asserts that the Backend/release validation fails rather than allowing the customer UI to calculate or invent a fallback amount.  
**Why it matters:** Default arithmetic can show a plausible but incorrect price.

### 5.2 Local Tours

#### Required lifecycle checks

- Save draft with duration, included kilometres, covers, parking note, five prices, extra rates, and night charge.
- Verify draft is excluded from all public endpoints and generated paths.
- Publish and verify `/en/local-packages/{packageCode}/`.
- Change every public field and prove it triggers a new release.
- Verify `use_per_km` and `extra_rates` are preserved exactly.
- Verify legacy fleet keys do not reappear in the public DTO.
- Archive and verify customer unavailability.

#### Local-tour-specific test cases

##### P5-L01 — Every public field triggers publication

**What it does:** Changes name, duration, kilometres, covers, parking note, each fleet price, each extra rate, `use_per_km`, and night charge while published, checking a new source version/release for each.  
**Why it matters:** The current code is known to trigger rebuilds only for selected pricing changes.

##### P5-L02 — Extra-rate object is not overwritten by partial form data

**What it does:** Saves five complete `{per_km, per_hr}` objects, edits only one tier, and compares all five objects after update.  
**Why it matters:** Nested object merge logic can accidentally replace the complete rate map with one tier or default values.

##### P5-L03 — Local tour does not become a normal route

**What it does:** Publishes a route-catalog local tour and separately publishes a local package, then asserts that each appears only in its intended namespace and uses its intended schema.  
**Why it matters:** Similar names and shared fare structures can cause the wrong resolver or template to render the record.

### 5.3 Transfer Tours/Routes

#### Required lifecycle checks

- Save draft with route code, name, distance text, direction note, five prices, per-kilometre flag, and night charge.
- Verify `/en/transfers/{routeCode}/` is absent while draft.
- Publish and verify the exact transfer detail template.
- Change direction note and distance text and prove a release is created.
- Verify no route-catalog slug collision is allowed if both share the same public namespace policy.
- Archive and verify removal from transfer search, sitemap, and page.

#### Transfer-specific test cases

##### P5-T01 — Route code maps consistently through every layer

**What it does:** Creates `agra-cantt-station-drop`, then asserts the same string in the database, Admin list, public DTO, generated JSON, prerender path, search result, canonical link, and page resolver.  
**Why it matters:** A mismatch between `route_code`, `routeCode`, and `slug` can produce a successful API response but an unreachable page.

##### P5-T02 — Transfer and normal route do not overwrite one another

**What it does:** Creates a normal route and a transfer route with similar names, then checks whether identifiers are unique within the actual URL namespace and both pages remain distinct.  
**Why it matters:** Separate modules do not automatically mean separate public URL namespaces.

##### P5-T03 — Transfer descriptive update is not price-only

**What it does:** Changes only distance text and direction note on a published transfer route, then verifies a new release and updated HTML.  
**Why it matters:** This detects the same stale-content bug seen in local-tour publication triggers.

---

## Phase 6 — Customer rendering and booking integrity

### Objective

The customer should render from one release. Volatile booking validation remains Backend-authoritative.

### Implementation steps

1. Remove the normal-path merge of static data, multiple manifests, localStorage, and independent runtime APIs.
2. Make `ServerApp` resolve each public page from the release manifest.
3. Keep static baseline data only for intentionally static marketing pages, not published admin catalog entities.
4. Remove client-side price and advance calculations for catalog values.
5. Render server-generated display prices and `sourceVersion`.
6. Send entity UUID, public code, selected fleet tier, and source version to booking.
7. Recalculate and validate final totals in Backend.
8. Return an explicit stale/unavailable error when the customer has old content.

### Test cases

#### P6-T01 — Customer does not use a stale localStorage copy

**What it does:** Stores an old route/package in localStorage, publishes a changed release, reloads the customer site, and asserts that the release version—not localStorage—determines the page.  
**Why it matters:** Browser cache is a hidden source of overwritten or stale data.

#### P6-T02 — Customer does not fall back to a different entity type

**What it does:** Requests a missing `/local-packages/{slug}` while a normal package has a similar slug and asserts a 404/unavailable response rather than rendering the wrong template.  
**Why it matters:** Broad pathname checks can bypass the intended entity resolver.

#### P6-T03 — Display price comes from release payload

**What it does:** Puts a unique fare in the public release and asserts that HTML displays it exactly, while React-side arithmetic spies show no alternative catalog fare calculation.  
**Why it matters:** The user must not see one price and submit another.

#### P6-T04 — Booking recalculates from Backend

**What it does:** Submits a manipulated browser price while keeping the entity/version valid and asserts that Backend ignores the client amount and returns the server-calculated amount.  
**Why it matters:** Client values are user-controlled and must never be the financial authority.

#### P6-T05 — Old page cannot book archived content

**What it does:** Opens a previously generated page, archives the entity, then submits the old form and asserts that Backend rejects it.  
**Why it matters:** SSG pages can remain in browser caches after the database changes.

---

## Phase 7 — Monuments after priority catalog stability

Monuments should use the same pipeline, but they are not the first vertical to repair.

Required changes:

- Add stable public slug/code.
- Add `draft | published | archived` status.
- Add `isActive` if needed, with an explicit meaning.
- Add version and publication timestamps.
- Add a public DTO rather than returning raw `service.list()` data.
- Implement `/api/v1/content/manifest` or remove that endpoint in favor of the unified release endpoint.
- Add duplicate slug and draft leakage tests.

#### M-T01 — Monument endpoint is implemented or removed

**What it does:** Runs the build against the configured content URL and requires either a valid implemented endpoint or a deliberate configuration/build failure.  
**Why it matters:** The current HTTP 404 is being converted into an empty monument snapshot.

#### M-T02 — Monument lifecycle matches catalog lifecycle

**What it does:** Creates draft, verifies absence, publishes, verifies page/sitemap, edits, verifies release, archives, and verifies unavailability.  
**Why it matters:** Monuments must not be permanently public while the other entities are protected by publication status.

---

# 8. Test design for deduplication, overwrite, bypass, and fallback logic

These are mandatory categories, not optional edge cases.

## 8.1 Deduplication tests

Test duplicates at every boundary:

1. Duplicate Admin submit caused by double-click.
2. Duplicate API request caused by network retry.
3. Duplicate database insert under concurrent requests.
4. Duplicate outbox event.
5. Duplicate item in a release payload.
6. Duplicate slug with different UUIDs.
7. Duplicate generated path from two source arrays.
8. Duplicate sitemap entry.

For every test, assert both:

- the result contains exactly one logical entity;
- audit/release records show whether a duplicate request was ignored or rejected.

## 8.2 Overwrite tests

Test that an operation cannot replace data unintentionally:

1. Partial update does not replace missing fields with defaults.
2. Editing name does not change a published slug.
3. Editing one fleet tier does not overwrite the other four.
4. One module cannot overwrite another module’s same-named record.
5. A failed build does not overwrite the last-known-good release.
6. A stale Admin form cannot overwrite a newer database version.
7. A retry cannot overwrite a newer release with an older payload.

Use a deliberate marker in every field, such as `TEST_NAME_V1`, `TEST_NOTE_V1`, and distinct prices, so the test can detect accidental replacement.

## 8.3 Bypass tests

Test that no layer can bypass a rule:

1. Direct API request bypassing Admin validation.
2. Draft included by omitting status.
3. Archived entity included by `is_active: true`.
4. Unknown fleet key removed instead of rejected.
5. Duplicate code passing the Admin availability precheck.
6. Unauthorized role directly calling publish endpoint.
7. Customer manually submitting a hidden price.
8. Old page booking after archive.
9. A route path resolving to a generic MarketingPage instead of 404.

## 8.4 Fallback tests

Every fallback must have a test that identifies when it is used:

1. API 404.
2. API 500.
3. timeout.
4. malformed JSON.
5. missing variable.
6. empty array.
7. missing status.
8. missing price tier.
9. missing image.
10. missing generated HTML.

Normal production behavior should fail closed. If an emergency fallback remains, the test must assert that it reports a stale release and never claims a fresh deployment.

---

# 9. Required release and build acceptance checklist

A release is accepted only when all are true:

- All four priority endpoints/contracts are available.
- All responses have one `releaseId` and `manifestVersion`.
- No duplicate UUIDs.
- No duplicate public slugs.
- No draft or archived records.
- All fleet keys are canonical.
- All required prices exist.
- All media URLs pass accessibility checks.
- Every published item has exactly one expected path.
- Every expected path has generated HTML.
- Every generated page has title, canonical URL, entity marker, and display price.
- Sitemap and HTML sets match.
- The release fingerprint is stored.
- Deployment status is verified, not inferred from a hook POST.
- Booking rejects stale, archived, unavailable, or manipulated selections.

---

# 10. Implementation order for the agent

## First three days

1. Add release/correlation logging.
2. Add environment diagnostic.
3. Remove production staging fallback.
4. Add route contract fixture and exact payload test.
5. Add duplicate/overwrite/bypass/fallback test helpers.
6. Make the route build fail on HTTP error, malformed payload, duplicate slug, or missing published row.

## Days 4–7: Route vertical

1. Verify Admin route fields against Backend schema.
2. Verify create draft.
3. Verify update draft.
4. Verify publish and audit/version/outbox.
5. Verify public release.
6. Verify SSG path and HTML.
7. Verify customer search/detail.
8. Verify booking reference and stale-price rejection.
9. Verify archive.

Do not move to package work until every Route Phase 2 test passes.

## Days 8–10: Tour Packages

1. Apply the same release adapter.
2. Add package field-level contract tests.
3. Add gallery durability tests.
4. Add descriptive-change publication tests.
5. Add generated package path/HTML tests.
6. Add archive and booking tests.

## Days 11–12: Local Tours

1. Apply the same release adapter.
2. Test every public-field change.
3. Test nested extra-rate updates.
4. Test local-tour URL/template separation.
5. Test stale page and archive behavior.

## Days 13–14: Transfer Tours/Routes

1. Apply the same release adapter.
2. Test `route_code` through every layer.
3. Test transfer/normal-route collision policy.
4. Test descriptive updates and page generation.
5. Run the complete four-vertical staging suite.

## After the priority four

Implement monuments using the same release contract. Do not create a fifth special-case pipeline.

---

# 11. What the agent must not do

- Do not rebuild the whole backend.
- Do not add more independent manifest endpoints as a quick fix.
- Do not keep silent `catch {}` blocks in the normal publication path.
- Do not use old local JSON as an invisible production fallback.
- Do not allow the build to continue after a required endpoint returns 404.
- Do not calculate commercial prices in React.
- Do not treat a Deploy Hook HTTP response as proof of deployment completion.
- Do not change booking/payment behavior except to pass canonical entity/version references and enforce server-side validation.
- Do not delete old data until a migration report proves every old record maps to one canonical record.

---

# 12. External references

- [Cloudflare Pages Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/) — a Deploy Hook triggers a build through an HTTP request; it is not a database transaction, release snapshot, or deployment verification mechanism.
- [Cloudflare Pages Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) — Pages build output and success depend on the build command and exit status.
- [Next.js Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — useful for evaluating ISR later; static export does not provide ISR, so correctness of the current release pipeline comes first.

---

# 13. Repository evidence used for this plan

- `backend/src/modules/route-catalog/route-catalog.schema.ts` — exact route fields and cross-field rules.
- `backend/src/modules/tour-packages/tour-packages.schema.ts` — exact package fields, itinerary, gallery, and status rules.
- `backend/src/modules/local-packages/local-packages.schema.ts` — exact local-tour fields and nested extra-rate rules.
- `backend/src/modules/transfer-routes/transfer-routes.schema.ts` — exact transfer-route fields and status rules.
- `admin/src/pages/TourPackagesPage.tsx` — package form state, payload mapping, code preflight, and two-step save/publish behavior.
- `admin/src/pages/LocalTransfersPage.tsx` — local/transfer form state, payload mapping, canonical/legacy price fallback, and two-step save/publish behavior.
- `admin/src/lib/api.ts` — Admin API endpoint and payload functions.
- `react/scripts/build-manifest.ts` — independent endpoint fetches, staging fallback, warning-only failure behavior, and legacy fleet keys.
- `react/scripts/prerender.ts` — generated snapshot readers and catch-to-empty behavior.
- `react/src/app/ServerApp.tsx` — multiple dataset resolvers and page dispatch.
- `backend/src/shared/deploy-hook.ts` — deploy-hook warning/failure handling.
- `backend/src/modules/local-packages/local-packages.service.ts` — known limited rebuild trigger behavior.
- `react/cloudflare-pages.toml` and `react/.env.example` — intended deployment variables and safe browser configuration.
