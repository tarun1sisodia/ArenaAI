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
| Supabase schema | Implemented | Versioned SQL migrations, RLS, local auth stub, in-memory test store |
| Fare engine | Complete | Pure engine ported from commercial/frontend rules with unit tests |
| Booking flow | Complete | Draft booking, `AGR-YYYYMMDD-XXXX`, immutable fare snapshot, masked retrieval |
| Razorpay integration | Implemented (sandbox) | Provider-neutral checkout, HMAC webhooks, idempotency, amount/currency checks |
| Dispatch operations | Implemented | Admin-only assignment after payment, WhatsApp notify, refunds, audit log |
| Catalog / reviews | Implemented | Draft/publish/archive, moderated reviews, unpublished content hidden |
| MongoDB optional workloads | Deferred | Location cache and raw webhooks live in PostgreSQL/memory for Phase 1 |
| Notifications | Implemented | Queued WhatsApp/email with dedupe; no-op adapters when credentials absent |
| Production deployment | Not started | Hosting, live webhooks, monitoring, and rollback still required |

## Current Milestone

**Milestone:** Backend vertical slices for fare → draft → checkout → webhook → assignment.  
**Completion target:** Local tests pass without live Supabase/Razorpay credentials.

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

## Next Actions

- [ ] Provision staging Supabase and apply migrations.
- [ ] Run Razorpay/PayPal sandbox drills against a public HTTPS webhook.
- [ ] Review remaining critical items in [BUGS.md](BUGS.md) with staging evidence.
- [ ] Deploy Mumbai-region API host and production webhook endpoints after sandbox sign-off.

## Change Log

| Date | Change | Owner |
|---|---|---|
| 2026-09-13 | Created the documentation baseline from the master architecture plan | Manus AI |
| 2026-09-14 | Implemented `backend/` service: fare engine, bookings, payments, dispatch, catalog, reviews, tests | Arena Agent |

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"

Progress is measured against [1] and the work breakdown in [PLAN.md](PLAN.md).
