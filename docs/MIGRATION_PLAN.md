# Fleet Pricing Rewiring — Migration Plan

**Date:** October 8, 2026  
**Status:** Plan Ready for Review  
**Strategy:** Phased, Non-Destructive Expand-and-Contract Migration.

---

## 1. Migration Principles
1. **Zero Downtime & Zero Breaking Changes:** Existing booking flow and payment pipeline must continue working throughout every phase.
2. **Backward-Compatible Readers First:** Readers accept both legacy short forms (`innova`, `tempo`) and canonical long forms (`innova-crysta`, `tempo-traveller`) before writers are updated.
3. **Verified Deployments:** Each phase is verified independently via automated tests (`npm run verify`) before moving to the next.

---

## 2. Phased Rollout Schedule

### Phase 1: Audit & Signoff (Current Phase)
- Perform full repository audit across backend, admin, and frontend.
- Document system topology, price flow, price source matrix, rendering violations, booking invariants, and migration plan.
- **Stop Condition:** Present audit report to user and obtain approval before executing code changes.

### Phase 2: Fleet Master Definition & Normalization
- Establish `contracts/enums/vehicle-tiers.ts` as the canonical Fleet Master (Contract C-ENUM-001).
- Unify fleet nomenclature across all 5 tiers: `sedan`, `ertiga`, `innova-crysta`, `tempo-traveller`, `urbania`.
- Sync generated contracts to `backend/`, `admin/`, and `react/`.

### Phase 3: Route Fare Rule Source Normalization
- Ensure PostgreSQL `fare_rules` is the single source of truth for global fleet per-km rates.
- Deprecate hardcoded rates in `catalog.data.json` and static `ROUTES` in `fare.catalogue.ts`.
- Ensure routes in `route_catalog` only contribute corridor distance and specific route surcharges (e.g., tolls, state permits), drawing base per-km rates from active `fare_rules`.

### Phase 4: Route Fleet-Price Resolver
- Implement backend `resolveRouteFleetPrice(routeContext, fleetCode)`.
- Enforce the canonical distance rule in one place:
  - `sedan`, `ertiga`, `innova-crysta`: standard per-km rate.
  - `tempo-traveller`, `urbania`:
    - `< 300 km`: forced round-trip calculation (`distance * 2 * rate`) + ₹500/day driver allowance.
    - `>= 300 km`: standard per-km calculation (`distance * rate`) + ₹500/day driver allowance.

### Phase 5: Package Fleet-Price Resolver
- Implement backend `resolvePackageFleetPrice(packageContext, fleetCode)`.
- Connect directly to `tour_packages.fleet_prices`.
- Ensure total isolation: route fare changes do NOT modify package prices; package price changes do NOT modify route fares.

### Phase 6: Normalized Customer `FleetPriceOption` Contract
- Define unified customer presentation contract in shared contracts:
  `{ fleetCode, fleetName, price, advanceAmount, currency, pricingType, displayLabel, priceSource }`.
- Provide helper formatters on client (`formatINR`) without business calculations.

### Phase 7: Homepage Rewire
- Rewire `FleetSection.tsx` to display prices resolved from active fleet fare rules (e.g. via live fleet endpoint or unified contract).
- Eliminate hardcoded vehicle starting fares (`3499`, `6499`, `9500`).
- Ensure `HomeBookingWidget.tsx` generates normalized query params to `/book`.

### Phase 8: Routes Listing & Route Detail Page Rewire
- Rewire `RoutesPage.tsx` and `RouteDetailPage.tsx` to render prices derived from `route.distanceKm * activeFleetRate` (plus tolls).
- Ensure bidirectional corridors (e.g. Agra → Delhi and Delhi → Agra) resolve to identical commercial rates.

### Phase 9: Monument Route-Context Pricing Rewire
- Remove hardcoded `FLEET_SPECIFICATIONS` from `MonumentDetailPage.tsx`.
- Connect monument transfers to local route pricing rules based on distance.

### Phase 10: Package Detail Page Rewire
- Connect `PackageDetailPage.tsx` to fixed package fleet prices (`tour_packages.fleet_prices`).
- Fix booking CTA link to pass canonical package identifier.

### Phase 11: Fix Package Booking Flow
- Resolve the contract mismatch in `BookingPage.tsx` and `booking.service.ts`:
  - When booking a package, resolve package by slug/id against `tour_packages` without requiring a UUID in `catalog_items`.
  - Fix draft booking creation to accept package selection cleanly.

### Phase 12: Dedicated Authoritative Quote Endpoints
- Implement `POST /api/v1/quotes/route` and `POST /api/v1/quotes/package`.
- Wire `BookingPage.tsx` Step 1/Step 2 to these authoritative endpoints.

### Phase 13: SSG / ISR Revalidation Propagation
- Connect Admin Fare Rule update to trigger Cloudflare Pages deploy hook (`triggerFrontendRebuild`) or cache purge.
- Invalidate browser `localStorage` manifest cache on version bump.

### Phase 14: Comprehensive Verification & Test Suite
- Run automated tests covering:
  - 5 fleets across distance boundaries (`1`, `100`, `299`, `299.9`, `300`, `300.1`, `301` km).
  - Admin fare change propagation.
  - Package price isolation.
  - Historical booking immutability.
- Run `npm run verify` across all three packages.

### Phase 15: Safe Decommission of Legacy Fallbacks
- Deprecate and remove redundant client calculation logic in `src/fares.ts`.
