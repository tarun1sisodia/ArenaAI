# Backend Progress — SK Baghel Tour & Travels

**Document status:** Working tracker  
**Last reviewed:** 2026-09-14  
**Related plan:** [PLAN.md](PLAN.md)

> This file intentionally uses the requested filename `PROGESS.md`. If the project later standardizes spelling, create a compatibility link or rename it with repository approval.

## Overall Status

| Area | Status | Notes |
|---|---|---|
| Architecture | Complete | Dual-database strategy and phased rollout are documented |
| Project scaffold | Complete | `backend/` Fastify + TypeScript strict service with health, CI, Docker |
| Supabase schema | Implemented | Migrations 0001-0011 applied on live Supabase; drivers & vehicles dropped |
| Fare engine | Complete | Pure engine ported with unit tests; customer vehicle tiers preserved |
| Booking flow | Complete | Draft booking, `AGR-YYYYMMDD-XXXX`, immutable fare snapshot, masked retrieval |
| Razorpay integration | Implemented (sandbox) | Provider-neutral checkout, HMAC webhooks, idempotency, amount/currency checks |
| Admin operations | Implemented | Booking listing, filters, refunds, audit log (purged driver/vehicle fleet models) |
| Catalog / reviews | Implemented | Draft/publish/archive, moderated reviews, unpublished content hidden |
| MongoDB optional workloads | Deferred | Location cache and raw webhooks live in PostgreSQL/memory for Phase 1 |
| Notifications | Implemented | Queued WhatsApp/email with dedupe; no-op adapters when credentials absent |
| Production deployment | Not started | Hosting, live webhooks, monitoring, and rollback still required |

## Current Milestone

**Milestone:** Clean booking & fare calculation backend without drivers/vehicles management.  
**Completion target:** Verified on live Supabase & MongoDB; all 6 test suites (31 tests) passing; 0 lint/build errors.

## Completed

- [x] Defined Supabase PostgreSQL as the financial and operational system of record.
- [x] Defined MongoDB Atlas as the high-throughput telemetry and document store for the scale phase.
- [x] Specified the Razorpay advance, webhook, signature, and idempotency rules.
- [x] Documented public, operations, and driver API routes.
- [x] Created phase, plan, bug register, API, model, and system-flow documents.
- [x] Initialize the `backend/` repository structure.
- [x] Add environment validation and health endpoints.
- [x] Create and apply Supabase migrations (SQL committed; apply with `npm run migrate`).
- [x] Port and test the fare engine.
- [x] Implement booking draft and ticket generation.
- [x] Implement Razorpay test-mode order and webhook flows (HMAC adapters + contract tests).
- [x] Add contract tests for routes and state transitions.
- [x] Provision live Supabase instance, applied all 10 SQL migrations, and seeded catalog.
- [x] Applied migration `0011_drop_vehicles_and_drivers.sql` to live Supabase DB; dropped tables `drivers` & `vehicles`.
- [x] Purged all driver and physical vehicle models, repositories, and state transitions from backend codebase.
- [x] Dissolved `dispatch/` module into `admin/` module (`GET /api/v1/ops/admin/bookings` and `POST /api/v1/ops/admin/refunds`).
- [x] Verified full build, typecheck, lint, and test suite pass (31/31 tests passing).

## Next Actions

- [ ] Run Razorpay/PayPal sandbox drills against a public HTTPS webhook.
- [ ] Review remaining critical items in [BUGS.md](BUGS.md) with staging evidence.
- [ ] Deploy Mumbai-region API host and production webhook endpoints after sandbox sign-off.

## Change Log

| Date | Change | Owner |
|---|---|---|
| 2026-09-13 | Created the documentation baseline from the master architecture plan | Manus AI |
| 2026-09-14 | Implemented `backend/` service: fare engine, bookings, payments, dispatch, catalog, reviews, tests | Arena Agent |
| 2026-09-14 | Connected live Supabase PostgreSQL & MongoDB Atlas, applied all 10 migrations, and seeded base data | Antigravity AI |
| 2026-09-14 | Purged drivers & vehicles from database and backend codebase per client instructions; 100% test pass | Antigravity AI |
| 2026-09-15 | Phase H1: Added HTTP/3 Alt-Svc, Timing-Allow-Origin, Link preload headers, verification suite | Antigravity AI |
| 2026-09-15 | Phase H2: Applied migration 0012 (partial/covering/trigram indexes), added poolConfig for PgBouncer port 6543, ConcurrencyError optimistic locking & row locks | Antigravity AI |


## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

Progress is measured against [1] and the work breakdown in [PLAN.md](PLAN.md).
