# ArenaAI — Current System Debugging Map

**Investigation date:** 2026-09-28
**Repository:** `tarun1sisodia/ArenaAI`
**Commit inspected:** `cb097e0b72b177358e490e4afa8994ccb9286d91` (`main`)
**Investigation mode:** Initial mapping only; no application source code changed.

## Investigation boundary

This document fulfills the protocol's first task: inspect the repository, applications, routes, middleware, persistence, tests, deployment configuration, and audit/security documentation before making broad changes.

It records **source-grounded observations and local verification**. It does not claim production behavior where production credentials, deployed logs, browser sessions, or database access were unavailable.

## System health report

| Area | Status | Evidence | Boundary still requiring runtime validation |
| --- | --- | --- | --- |
| Customer | **Working in build/typecheck; partially integrated at runtime by design** | `react/` typechecks and builds; customer API service calls fare, booking, checkout, payment-status, inquiry, catalog, and fleet endpoints. | Production API base URL, browser network behavior, static fallback precedence, and live catalog freshness. |
| Admin | **Working in build/typecheck; API-connected in source** | `admin/` typechecks and builds; `admin/src/lib/api.ts` uses bearer-authenticated HTTP calls; stored sessions are revalidated against the backend. | Supabase credentials/role claims, deployed CORS, real admin permissions, and live CRUD mutations. |
| Backend | **Working locally for deterministic tests/build** | Fastify app compiles; route registration, auth hook, readiness handler, providers, and notification worker are wired. | Production configuration, PostgreSQL-backed startup, provider credentials, and deployed logs. |
| Database | **Unknown in this environment** | 20 SQL migrations exist; PostgreSQL and memory repository implementations are present; deterministic tests use the in-memory repository. | Actual `DATABASE_URL`, applied migration history, RLS behavior, indexes, constraints, and production data state. |
| Payments | **Partially verified locally; production unknown** | Deterministic payment lifecycle/provider tests pass; production env validation requires live Razorpay credentials and webhook secret. | Razorpay order/webhook round trip, signature verification against provider traffic, reconciliation, and refund behavior. |
| Deployment | **Configuration present; production unknown** | Render blueprint uses `preDeployCommand: node dist/db/migrate.js` and `/ready`; Cloudflare configs and CI workflows exist. | Render/Cloudflare deployment state, DNS, environment variables, `/ready` over the public hostname, and release commit. |

## Local verification evidence

Executed from the repository root:

```
npm run install:all && npm run verify
```

Result: **PASS**

- Customer typecheck: passed.

- Admin typecheck: passed.

- Backend typecheck: passed.

- Backend deterministic suite: **21 test files, 133 tests passed**.

- Customer SEO lifecycle checks: passed.

- Customer production build + prerender: passed; 963-route manifest and 37 prerendered pages generated.

- Admin production build: passed.

- Backend production TypeScript build: passed.

- Working tree after verification: clean.

Dependency audit output during installation also reported **3 high-severity vulnerabilities in the root package** and **2 moderate-severity vulnerabilities in the backend package**. These are dependency findings, not investigated or changed during this mapping phase.

## Current execution paths

### Customer → API → backend → database/provider

```
Customer React/Vite SSG (`react/`)
  ├─ Public catalog/fleet/detail reads
  │    └─ `react/src/services/catalog.ts`
  │         └─ GET /api/v1/catalog, /api/v1/catalog/:slug, /api/v1/fleet
  │              └─ catalog/fare services → repositories → PostgreSQL or memory store
  ├─ Route manifest
  │    └─ `react/src/services/catalogManifest.ts`
  │         ├─ GET /api/v1/catalog/manifest with If-None-Match
  │         ├─ localStorage cache fallback (10-minute stale marker)
  │         └─ static /routes-manifest.json fallback
  ├─ Fare quote
  │    └─ POST /api/v1/fares/calculate
  ├─ Booking draft
  │    └─ POST /api/v1/bookings/draft
  ├─ Payment checkout/status
  │    ├─ POST /api/v1/payments/create-checkout
  │    └─ GET /api/v1/payments/:paymentId/status
  └─ Inquiry
       └─ POST /api/v1/inquiries

Fastify (`backend/src/app.ts`)
  ├─ request ID, raw body, error handler, network headers
  ├─ Helmet, CORS, rate limit
  ├─ authentication hook (`authGuard.ts`)
  ├─ fare, location, booking, payment, catalog, review, inquiry, admin routes
  └─ repositories/providers
       ├─ PostgreSQL (`backend/src/db/postgres.ts`) when configured
       ├─ memory store (`backend/src/db/memory.ts`) otherwise
       ├─ Razorpay adapter
       ├─ LocationIQ or curated static geocoder
       └─ WhatsApp/email providers or no-op providers
```

**Source-of-truth observation:** fare quote and booking draft paths are explicitly server-authoritative and the customer booking adapter omits client price, total, and distance. However, the customer manifest still has browser and static fallbacks. Those fallbacks are a source-of-truth risk if they are rendered as current operational data rather than clearly stale/editorial data.

### Admin → API → backend → database/storage

```
Admin React/Vite (`admin/`)
  ├─ Supabase Auth password grant (`admin/src/lib/auth.ts`)
  ├─ bearer session persisted as a localStorage hint
  ├─ stored session revalidated with GET /api/v1/ops/admin/audit-logs?limit=1
  └─ `admin/src/lib/api.ts` → authenticated Fastify admin endpoints
       ├─ audit logs
       ├─ bookings and state transition
       ├─ refunds and payments
       ├─ inquiries
       ├─ fare rules and activation
       ├─ catalog/media and manifest republish
       └─ reviews

Fastify admin routes
  └─ `backend/src/modules/admin/admin.routes.ts`
       └─ role guards → admin controller/service → repositories → PostgreSQL
```

**Source observation:** the current admin API client contains no silent fixture fallback; pages render API error/empty states. This is different from older audit documents that describe an entirely mocked admin. Those older statements should be treated as historical unless reproduced against the current commit.

### Payment → provider → webhook → database

```
Customer
  └─ create draft → create checkout
       └─ backend payment service → Razorpay adapter
            └─ provider checkout
                 └─ signed POST /api/v1/payments/webhooks/:provider
                      └─ raw-body capture + signature verification
                           └─ idempotent payment/booking state transition
                                └─ notification queue
                                     └─ server notification worker every 15 seconds
```

The browser callback is not treated as payment proof in the current booking flow: the customer polls backend payment status and requires `captured` plus `paid_confirmed` before rendering the confirmed state.

### Media → storage → database → public API

```
Admin upload/attach
  └─ catalog media endpoint
       ├─ object storage when configured, otherwise inline DB storage
       └─ catalog_media row
            └─ GET /api/v1/media/:id
                 └─ customer image URL
```

The public-media publication rule, including parent catalog publication, requires targeted runtime/database validation even though local media visibility tests pass.

## Backend route inventory

### Public/customer routes

- `GET /health`, `GET /api/v1/health`

- `GET /ready`, `GET /api/v1/ready`

- `POST /api/v1/fares/calculate`

- `GET /api/v1/fleet`

- `GET /api/v1/locations/autocomplete`

- `POST /api/v1/bookings/draft`

- `GET /api/v1/bookings/:ticketId`

- `POST /api/v1/payments/create-checkout`

- `GET /api/v1/payments/:paymentId/status`

- `POST /api/v1/payments/webhooks/:provider`

- `GET /api/v1/catalog`, `GET /api/v1/catalog/manifest`, `GET /api/v1/catalog/:slug`

- `GET /api/v1/media/:id`

- `POST /api/v1/inquiries`

- `POST /api/v1/reviews`

- `GET /api/v1/catalog/:id/reviews`

- `POST /api/v1/devices/register`

### Admin routes

- `GET /api/v1/ops/admin/audit-logs`

- `GET /api/v1/ops/admin/bookings`

- `POST /api/v1/ops/admin/bookings/:id/transition`

- `POST /api/v1/ops/admin/refunds`

- `GET /api/v1/ops/admin/inquiries`

- `PATCH /api/v1/ops/admin/inquiries/:id`

- `GET /api/v1/ops/admin/payments`

- `GET|PUT /api/v1/ops/admin/fare-rules`

- `POST /api/v1/ops/admin/fare-rules/activate`

- `GET /api/v1/ops/admin/fare-rules/versions`

- Catalog/media CRUD, publish/archive, and manifest republish routes

- Review moderation routes: list, approve, reject, publish, archive

## Persistence and deployment map

### Persistence

- Migrations: `backend/migrations/0001_enable_extensions.sql` through `0020_unique_active_fare_rule.sql`.

- Repository contract: `backend/src/db/types.ts`.

- PostgreSQL implementation: `backend/src/db/postgres.ts`.

- Deterministic test implementation: `backend/src/db/memory.ts`.

- Migration runner: `backend/src/db/migrate.ts`.

- Runtime repository selection: `backend/src/db/client.ts`.

- Domains represented in repositories include bookings, payments, refunds, profiles, catalog, media, reviews, promos, audit, inquiries, notifications, webhooks, location cache, devices, and fare rules.

### Deployment

```
Cloudflare Pages
  ├─ Customer root: react/ → react/dist
  └─ Admin root: admin/ → admin/dist

Render Docker service
  └─ backend/ → port 4000 → PostgreSQL/Supabase + external providers
```

- Render source of truth: `render.yaml`.

- Render health check: `/ready`.

- Render migration hook: `node dist/db/migrate.js` before deploy.

- Production env validation: `backend/src/config/env.ts` requires PostgreSQL, Supabase, and live Razorpay configuration.

- CI gates are split into customer, admin, backend, shared-root, uptime, and main-branch monitor workflows under `.github/workflows/`.

## Evidence-based risk ledger for follow-up

These are **not claimed as fixed bugs**. They are the first items to investigate because source evidence or repository documentation indicates a possible boundary risk.

| Priority | Risk/hypothesis | First boundary to test | Evidence in current tree | Status |
| --- | --- | --- | --- | --- |
| P0/P1 | Production payment configuration or webhook reconciliation differs from local tests | Provider ↔ backend webhook ↔ payment ledger | Production env validation exists; local lifecycle/provider tests pass. | **Production not proven** |
| P1 | Static/localStorage catalog data can remain visible when live catalog fails | Backend response ↔ customer fallback/state | `catalogManifest.ts` has localStorage and static fallbacks. | **Source-confirmed behavior; impact not runtime-proven** |
| P1 | Active DB fare-rule changes may not affect every public fare path | Fare route ↔ fare service ↔ fare rules repository | `fareService`, `fare.engine`, and DB fare-rule paths coexist; dedicated parity/sync tests pass. | **Needs targeted data-backed reproduction** |
| P1 | Production authorization/RBAC differs from UI role model | JWT claims ↔ backend role guard ↔ admin action | Admin requires explicit `super_admin` claim; backend route guards exist. | **Needs real-role verification** |
| P1 | Public media visibility may differ from parent/media publication state in production | Media endpoint ↔ repository query ↔ DB/RLS | Local `media-visibility.test.ts` passes; storage/DB state unavailable here. | **Needs DB-backed verification** |
| P2 | Location provider exposure or proxy behavior differs by environment | Browser ↔ location API ↔ provider | Backend proxy route exists; `useLocationIQ.ts` still contains client token/localStorage handling. | **Needs browser/network trace** |
| P2 | Notification queue retry behavior is insufficient under failure/concurrency | Queue row ↔ worker ↔ provider | `server.ts` starts a 15-second worker; no production queue observation available. | **Needs failure-injection test** |
| P2 | Dependency vulnerabilities affect deployed packages | Lockfile/package audit ↔ runtime image | Installation reported 3 root high and 2 backend moderate vulnerabilities. | **Actionable dependency review; not remediated** |

## Recommended next debugging order

1. **Production access and deployment comparison:** capture Node/runtime, API URL, env presence (not values), CORS origins, migration version, deployment commit, and `/ready` response.

1. **Payment boundary:** run a provider-sandbox checkout/webhook trace and reconcile provider amount/status against the database ledger.

1. **Fare source-of-truth:** activate a distinct fare-rule version in a controlled database and compare quote, booking snapshot, and customer display.

1. **Catalog fallback behavior:** force the manifest endpoint to fail in a browser and verify the UI labels stale/static content rather than presenting it as current.

1. **Authorization matrix:** test every admin route with no token, customer token, valid staff/admin token, and invalid/expired token.

1. **Media publication:** verify draft/archived media and unpublished parents cannot be fetched by ID in PostgreSQL-backed runtime.

1. **Dependency remediation:** inspect `npm audit` details and update only through a separately scoped dependency change.

## Initial conclusion

The repository is currently **build-healthy and deterministic-test-healthy**, but that is not equivalent to production-integrated health. The first clearly identified architectural debugging boundary is the **customer source-of-truth/fallback boundary**: live backend reads exist, yet the customer still has localStorage and static manifest fallbacks. Production database state, deployed configuration, provider behavior, and real browser traces remain unproven and should be investigated before broad code changes.

