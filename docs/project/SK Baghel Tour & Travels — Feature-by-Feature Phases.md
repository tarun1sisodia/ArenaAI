# SK Baghel Tour & Travels — Feature-by-Feature Phases

**Status:** Canonical delivery plan  
**Method:** One feature to end-to-end staging acceptance before the next feature  
**Last reviewed:** 2026-10-09

## 1. How to use this plan

A phase is not a calendar promise. It is a bounded feature slice with a hard gate. The agent may implement only the current phase. The next phase begins only after the user confirms the current feature works on staging.

For every phase:

1. Read `PRD.md`, `Architecture.md`, `Rules.md`, and `Design.md`.
2. Inspect the current code and identify the exact contract boundary.
3. Write/confirm the model, API, Admin payload, Customer DTO, and test matrix.
4. Implement the smallest vertical slice.
5. Run automated tests and builds.
6. Deploy to staging.
7. User manually tests the full lifecycle.
8. Record evidence and sign off.
9. Only then continue.

## 2. Phase gate template

A phase passes only when all are true:

- contract reviewed;
- database migration reviewed/rehearsed if required;
- Backend API works with direct requests;
- Admin form works with valid and invalid values;
- Customer release contains the exact record once;
- correct pre-rendered page is generated;
- search/detail URL matches the same slug/code;
- booking handoff uses authoritative ID/version;
- archive/unavailable behavior works;
- duplicate, overwrite, bypass, retry, and fallback tests pass;
- `npm run verify` remains green;
- user has manually verified staging and explicitly approved the phase.

## 3. Phase 0 — Documentation and environment lock

**Goal:** establish one shared understanding before feature coding.

Deliverables:

- canonical docs in this directory;
- environment matrix for local/staging/production;
- API source URLs and Cloudflare variables documented;
- staging database/project identified;
- release and rollback owner identified;
- `Memory.md` remains absent until coding starts.

Exit evidence:

- user confirms documentation is the source of truth;
- agent can identify the current application entry points and test commands;
- no production secrets are placed in docs or frontend env files.

## 4. Phase 1 — Shared contracts and observability

**Goal:** make cross-app drift visible before building catalog features.

Scope:

- contract registry and sync process;
- canonical fleet tiers;
- API envelope and error fields;
- money units;
- request/correlation IDs;
- release ID/source version fields;
- Admin/API/build logs.

Exit tests:

- shared vehicle contract syncs to Backend/Admin/Customer;
- an invalid key fails in every API boundary;
- an API error has the same envelope everywhere;
- one request can be traced from Admin/API to release/build logs.

## 5. Phase 2 — Fleet Master

**Goal:** define what vehicles exist before pricing/catalog features depend on them.

Scope:

- fleet model and canonical keys;
- Admin list/edit/active state;
- public fleet projection/page;
- references from pricing and catalog DTOs.

Exit tests:

- create/edit/deactivate fleet item;
- duplicate code rejected;
- legacy key readable but not writable;
- inactive fleet cannot be selected for a new booking;
- Customer and Admin show the same canonical fleet metadata.

## 6. Phase 3 — Fare rules and quote authority

**Goal:** establish one Backend pricing authority without changing the booking flow blindly.

Scope:

- fare rules;
- route charge rules;
- driver/night/toll/permit handling;
- 300 km/day rule;
- quote response and version;
- Admin fare preview.

Exit tests:

- fixed route/fleet matrix matches expected business values;
- invalid/unpriced tier fails;
- client-submitted price is ignored;
- quote version is included in booking handoff;
- existing booking tests remain green.

## 7. Phase 4 — Routes vertical

**Goal:** complete the first catalogue vertical end to end.

Lifecycle:

1. Admin creates a draft route.
2. Backend validates all route fields and cross-field rules.
3. Database stores one row and version.
4. Admin edits draft without overwriting unrelated fields.
5. Admin publishes explicitly.
6. Public release includes the route exactly once.
7. Customer build generates the expected route path and HTML.
8. Search opens the same slug.
9. Booking sends entity ID/code/version; Backend revalidates.
10. Admin updates price/content and a new release appears.
11. Archive removes it from public discovery and rejects stale booking.

Required route cases:

- one-way with destination;
- round-trip with destination;
- local-tour route rules;
- missing fare;
- extra fare;
- unknown tier;
- duplicate slug;
- double publish;
- failed build;
- stale price booking.

Gate: user completes the route workflow on staging and confirms it.

## 8. Phase 5 — Tour Packages vertical

**Goal:** add fixed itinerary packages using the proven route lifecycle.

Scope:

- package code/name/duration/days/nights;
- base and fleet prices;
- inclusions/exclusions;
- itinerary;
- image/gallery media;
- package template and URL;
- booking handoff.

Required cases:

- gallery upload persistence;
- draft not public;
- partial update does not erase itinerary/gallery;
- all fleet prices survive release;
- content-only edit triggers release;
- price update changes displayed and booking-authoritative value;
- duplicate code and repeated publish;
- archive removes page and sitemap entry.

Gate: user completes create → edit → publish → customer render → booking → archive on staging.

## 9. Phase 6 — Local Tours vertical

**Goal:** add local sightseeing products with their distinct pricing context.

Scope:

- duration hours;
- included kilometres;
- covers/parking note;
- five fleet prices;
- extra per-kilometre/per-hour rates;
- night charge;
- local-tour template and URL.

Required cases:

- nested extra-rate update preserves other tiers;
- every public field change triggers a release;
- local tour cannot accidentally render as normal route/package;
- draft/archive boundaries;
- booking revalidates current local-tour availability and price.

Gate: user completes the full local-tour lifecycle on staging.

## 10. Phase 7 — Transfer Routes/Tours vertical

**Goal:** add station/airport/corridor transfer products with stable route codes.

Scope:

- route code/name;
- distance and direction note;
- fleet prices;
- per-kilometre and night-charge options;
- transfer template, resolver, search, sitemap, and booking handoff.

Required cases:

- `route_code` maps consistently to `routeCode` and public slug;
- transfer and normal route identifiers do not collide;
- descriptive edits trigger release;
- draft/archive/duplicate/retry behavior;
- correct transfer template opens from search.

Gate: user completes the full transfer lifecycle on staging.

## 11. Phase 8 — Monuments and public content

**Goal:** add monuments, company profile, policies, and related public content using the same release discipline.

Scope:

- monument model and status;
- content manifest/public DTO;
- media and SEO fields;
- monument detail page;
- transport link to existing route/pricing context.

Rules:

- monument does not create a second transport pricing engine;
- missing content endpoint fails clearly;
- draft/archived monument is not public;
- duplicate slug fails release.

Gate: user validates monument lifecycle on staging.

## 12. Phase 9 — Publication hardening

**Goal:** make the complete catalogue release atomic, observable, and retryable.

Scope:

- durable publication/outbox event;
- one release ID/version across all families;
- build fail-closed behavior;
- deploy status and verification;
- last-known-good rollback.

Exit tests:

- endpoint 404/500 fails build;
- partial release cannot deploy;
- retry does not duplicate release;
- failed build does not replace good release;
- sitemap and generated paths match exactly;
- Admin shows stale/failed status truthfully.

## 13. Phase 10 — Customer rendering and SEO parity

**Goal:** remove remaining duplicate data paths after catalog release is stable.

Scope:

- one customer release resolver;
- dynamic detail templates;
- search/index consistency;
- HTML metadata, canonical URLs, schema, hreflang, sitemap;
- localStorage/runtime API boundaries.

Exit tests:

- every published item has one page;
- every page contains correct release values in HTML;
- no draft/archived page is indexable;
- wrong entity family returns correct unavailable response;
- Customer does not calculate an authoritative price.

## 14. Phase 11 — Admin operations beyond catalogue

**Goal:** wire and verify bookings, inquiries, reviews, audit, finance, refunds, and policies one feature at a time.

Order:

1. authenticated Admin session and RBAC;
2. live bookings list and status transitions;
3. inquiries;
4. reviews moderation;
5. audit viewer;
6. finance/reconciliation;
7. refunds;
8. cancellation policies/promotions.

Each feature uses the same phase gate and must not weaken the existing booking/payment flow.

## 15. Phase 12 — Payment production readiness

**Goal:** enable real payment only after booking and webhook drills pass.

Required:

- provider sandbox/staging drills;
- signature verification;
- duplicate/out-of-order webhook tests;
- amount mismatch rejection;
- confirmation only from provider-confirmed state;
- refund reconciliation;
- production secrets and strict CORS.

Gate: explicit staging payment acceptance before production enablement.

## 16. Phase 13 — Production release discipline

**Goal:** ship only verified, reversible releases.

Checklist:

- staging sign-off for the feature;
- `npm run verify` green;
- release ID recorded;
- migration rehearsed;
- backup/rollback path known;
- environment URLs checked;
- no secrets in bundles;
- Customer/Admin/Backend deployment order followed;
- smoke test after deployment;
- user confirms production behavior.

## 17. Progress record

When implementation begins, create `docs/project/Memory.md` with:

- current phase and feature;
- last accepted staging release ID;
- completed changes;
- test commands/results;
- manual staging evidence;
- known issues and explicit decisions;
- next permitted step.

Do not create it now. It is an implementation memory, not an initial requirements document.
