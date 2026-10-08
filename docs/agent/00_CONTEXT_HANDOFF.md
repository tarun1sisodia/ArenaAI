# ArenaAI Agent Context Handoff

**Purpose:** Read this file first when resuming work on SK Baghel Tour & Travels.

## Repository

- GitHub: `tarun1sisodia/ArenaAI`
- Branch: `main`
- Latest known commit before this documentation reorganization: `0d6bd95583ce70b5365e158167a41a572fd7d841`
- Customer app: `react/`
- Admin app: `admin/`
- Backend API: `backend/`
- Main operating specification: `/ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md`

## Required reading order

1. `/SKILL.md`
2. `/AGENTS.md`
3. `/BACKEND_RULES.md` for backend/API/database/payment work
4. `/FRONTEND_RULES.md` for customer/admin UI work
5. `/ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md`
6. `docs/agent/01_AGENT_RUNBOOK.md`
7. Relevant files under `docs/project/`, `docs/admin/`, `docs/backend/`, or `react/docs/`

## Product boundaries

- Admin is the operational writer.
- Customer is public-read plus booking/inquiry/review/payment actions.
- PostgreSQL/Supabase is the source of truth for bookings, payments, catalog, media, reviews, moderation, and audit records.
- MongoDB is only for explicitly approved cache/provider-event workloads.
- Customers do not select drivers, log into a driver app, use GPS telemetry, or receive live tracking.
- Drivers are admin-managed records; assignment is internal and sent to customers through approved WhatsApp flow.
- Never trust a client-supplied price, distance, payment state, role, availability, or booking status.

## Content lifecycle policy

```text
draft → published → paused → archived → retired
```

Do not delete trips, routes, packages, verticals, fleet pages, or useful media merely because they are unavailable. Preserve stable URLs and SEO/AEO/GEO value. Archived/paused content is not bookable. Draft and retired content are excluded from public APIs unless an intentional redirect policy applies.

## Active Objective & High-priority unfinished work

1. **Fleet Pricing Standardization Across Entire Platform** (Active: `docs/FLEET_PRICING_MASTER_IMPLEMENTATION_PLAN.md` & `docs/MIGRATION_PLAN.md`):
   - Admin Fare Rules → PostgreSQL `fare_rules` is single commercial truth for fleet rates.
   - Canonical 5 Fleets normalized (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`).
   - Route Pricing Engine (<300km forced round-trip + ₹500 DA for Tempo/Urbania; >=300km per-km + ₹500 DA).
   - Package Pricing isolation (fixed `tour_packages.fleet_prices`, no route math).
   - Monument transfer pricing deriving from route context.
   - Zero frontend pricing math (`FleetPriceOption` contract).
   - Dedicated Quote APIs (`POST /quotes/route`, `POST /quotes/package`).
   - Fix package booking draft resolution (`booking.service.ts` slug/code lookup bug #18).
2. Make active database fare rules drive every production fare calculation.
3. Make catalog route identity the same source used by fare and booking services.
4. Persist manifest revision/ETag state across backend instances.
5. Add server-side LocationIQ proxy with secret protection, caching and rate limits.
6. Run one deployed Razorpay Test Mode transaction and confirm Render webhook logs; code now requires `rzp_live_*` in production and prohibits fake/HMAC payment outside explicit local/test mode.
7. Validate uploaded image magic bytes, decoding, dimensions and decompression limits.
8. Restrict public media to published media with published parent items.
9. Lock down device registration ownership and strengthen booking lookup recovery.
10. Confirm the new production container migration startup in Render and keep `/ready` unhealthy when DB is unavailable.
11. Implement least-privilege admin roles and actor-correct audit records.

## Latest completed safety fixes

- Customer/admin production API fallback targets the deployed Render backend.
- Admin role check fails closed when the role claim is missing.
- Payment checkout failure no longer proceeds to a success voucher.
- Payment success now requires backend webhook-backed `captured` + `paid_confirmed` status; browser callbacks are not trusted.
- Production Razorpay key format, order currency, and payment-event handling are hardened; compiled migrations run before the API starts.
- Payment simulation is development-only and opt-in.
- Backend `/ready` returns HTTP 503 when the database is not ready.
- SEO/AEO/GEO lifecycle rules are part of the root operating specification.

## Never do

- Never commit secrets, passwords, provider keys, webhook secrets, guest tokens, or service-role keys.
- Never use browser success/redirect as proof of payment.
- Never add silent fixture fallback to admin mutations.
- Never expose admin endpoints to customer UI.
- Never delete high-value SEO URLs without checking replacement/backlink/search value.
- Never claim a booking is paid/captured before signed provider webhook or server verification.
