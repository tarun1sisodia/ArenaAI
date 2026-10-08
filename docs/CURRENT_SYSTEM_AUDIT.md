# Current System Audit — SK Baghel Tour & Travels

**Date:** October 8, 2026  
**Status:** Phase 0 — Non-Destructive Audit Complete  
**Scope:** Architecture & Pricing Rewiring Analysis across `backend/`, `admin/`, `react/`, Database, and SSG/ISR.

---

## 1. System Topology Overview

The platform operates as a three-application monorepo:
1. **Backend (`backend/`):** Node.js Fastify service with PostgreSQL (via `pg` pool) and Supabase Auth JWT validation, deployed to Render.
2. **Admin Operations Desk (`admin/`):** React 18 + Vite SPA deployed to Cloudflare Pages (`admin/dist`). Interacts with Fastify `/api/v1/ops/admin/*`.
3. **Customer Frontend (`react/`):** React 18 + Vite + SSG pre-rendered static pages deployed to Cloudflare Pages (`react/dist`). Interacts with Fastify public `/api/v1/*` routes.

---

## 2. Subsystem Map

### 2.1 Admin Application (`admin/`)
- **Key Modules:**
  - `FaresPage.tsx`: Fleet & Fare Rules editor (Super Admin / Operator role-gated).
  - `RouteCatalogPanel.tsx` (in `CatalogPage.tsx`): Route catalog CRUD, custom fleet fares per route.
  - `TourPackagesPage.tsx`: Fixed tour package commercial pricing across 5 tiers.
  - `LocalTransfersPage.tsx`: Local sightseeing packages (8hr/80km, 12hr/120km) and airport/station transfers.
  - `BookingsPage.tsx`: Admin booking desk & dispatch.
- **APIs Consumed:**
  - `GET /api/v1/ops/admin/fare-rules`
  - `PUT /api/v1/ops/admin/fare-rules`
  - `POST /api/v1/ops/admin/fare-rules/activate`
  - `GET /api/v1/ops/admin/route-catalog`
  - `POST / PUT /api/v1/ops/admin/route-catalog/*`
  - `GET / POST / PUT /api/v1/ops/admin/tour-packages/*`
  - `GET / POST / PUT /api/v1/ops/admin/local-packages/*`
  - `GET / POST / PUT /api/v1/ops/admin/transfer-routes/*`

### 2.2 Customer Application (`react/`)
- **Key Pages:**
  - `HomePage.tsx`: Hero expedition booking dock, `FleetSection.tsx`, `CoverflowCarousel.tsx`.
  - `RoutesPage.tsx`: Route listing, corridor filters, route search.
  - `RouteDetailPage.tsx`: Dedicated corridor page (`/routes/:slug`), 5-vehicle fare matrix.
  - `PackagesPage.tsx`: Tour package grid.
  - `PackageDetailPage.tsx` & `DossierTourPackagePage.tsx`: Tour package chapters, pricing, vehicle options, booking CTA.
  - `MonumentDetailPage.tsx`: Monument history, timing, hardcoded fleet cab pricing cards.
  - `BookingPage.tsx` (`src/features/booking/`): 3-step live booking flow (Step 1 Selection, Step 2 Guest & Quote, Step 3 Voucher & Payment).
- **Client Pricing Files (Static Fallbacks / Duplicate Authorities):**
  - `src/fares.ts`: Client-side `calcFare()` and `getIndicativeBrowseFare()`.
  - `src/data.ts`: Static routes, vehicles, packages, outstation rules.
  - `src/data/prices.ts`: Hardcoded `fleet_per_km` and route baseline rates.
  - `src/data/fleets.ts`: Hardcoded UI fleet list.
  - `src/services/catalogManifest.ts`: LocalStorage cached manifest (`arena_catalog_manifest_v3`).

### 2.3 Backend Fare & Pricing Engine (`backend/src/modules/fares/`)
- **Modules:**
  - `fare.service.ts`: Orchestrates DB lookups (`fare_rules`, `tour_packages`, `local_packages`, `transfer_routes`, `route_catalog`), builds overrides, and invokes fare engine.
  - `fare.engine.ts`: Pure functional fare calculation (`calculateFare()`, `evaluateDossierTierBaseFare()`).
  - `fare.strategy.ts`: `StandardVehiclePricingStrategy` and `GroupCommercialVehicleStrategy`.
  - `fare.catalogue.ts`: Static default `ROUTES`, `VEHICLES`, `PACKAGES`, `LOCAL_PACKAGES`, `AIRPORT_TRANSFERS`.
  - `catalog.data.json`: Static JSON containing 40+ legacy routes with hardcoded fleet prices.

### 2.4 Database Schema (`backend/migrations/`)
- **Tables holding pricing / fleet definitions:**
  1. `fare_rules`: Columns `id`, `version`, `config (jsonb)`, `effective_from`, `effective_to`, `is_active`, `created_at`.
  2. `route_catalog`: Columns `trip_type`, `source_city`, `destination_city`, `slug`, `distance_km`, `fares_inr (jsonb)`, `use_per_km`, `per_km_rate_override`, `driver_charge_inr`, `night_halt_inr`, `toll_included`, `toll_amount_inr`, `available_fleets (text[])`.
  3. `tour_packages`: Columns `package_code`, `name`, `days`, `nights`, `starting_price_inr`, `fleet_prices (jsonb)`, `night_charge_inr`.
  4. `local_sightseeing_packages`: Columns `package_code`, `duration_hours`, `included_km`, `fleet_prices (jsonb)`, `use_per_km`, `extra_rates (jsonb)`, `night_charge_inr`.
  5. `transfer_routes`: Columns `route_code`, `fleet_prices (jsonb)`, `use_per_km`, `night_charge_inr`.
  6. `bookings`: Columns `base_fare`, `night_allowance`, `driver_allowance`, `discount_amount`, `total_fare`, `advance_amount`, `balance_amount`, `fare_rules_version`, `fare_snapshot (jsonb)`.
  7. `customer_booking_intents`: Short-lived intent storing quote snapshot and customer draft payload.

### 2.5 SSG & Build System (`react/scripts/`)
- `build-manifest.ts`: Ingests `backend/src/modules/fares/catalog.data.json` at build time to produce static `generated-catalog.json`.
- `prerender.ts`: Headless Vite pre-renderer producing static HTML for 113+ URLs into `react/dist`.
- `backend/src/shared/deploy-hook.ts`: Fires `PAGES_DEPLOY_HOOK_URL` to rebuild Cloudflare Pages when catalog items are published. Currently NOT invoked upon Fare Rule updates.
