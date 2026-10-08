# Price Flow Audit — SK Baghel Tour & Travels

**Date:** October 8, 2026  
**Status:** Complete  
**Objective:** End-to-end trace of commercial pricing from Admin mutation to Database, Engine, Public Presentation, Booking, and Payment.

---

## 1. The Authoritative Admin Fare Rules Trace

### 1.1 Mutation Path
1. **Admin UI:** Operator navigates to `/fares` (`admin/src/pages/FaresPage.tsx`).
2. **Form Submission:** Saves updated `outstation` config (`minKmPerDay: 300`, `nightAllowanceCab: 300`, `nightAllowanceTempo: 500`) and array of 5 vehicles (`tier`, `name`, `seats`, `perKm`, `active`).
3. **API Request:** `PUT /api/v1/ops/admin/fare-rules` handled by `admin.controller.ts:updateFareRules`.
4. **Service Execution (`admin.service.ts:updateFareRules`):**
   - Generates version identifier `r<timestamp>`.
   - Inserts new record into PostgreSQL table `fare_rules`.
   - Sets `is_active = true` on new version and marks all prior versions `is_active = false`.
   - Appends audit entry into `audit_logs`.
5. **Persistence:** Saved in PostgreSQL `fare_rules` with JSON configuration.

### 1.2 Resolution & Calculation Path
- **Backend Fetch:** `fare.service.ts:calculate()` queries `db.fareRules.getActive()`.
- **Vehicle Rate Resolution:** If `vehicleOverride.perKm !== spec.perKm`, sets `spec.perKm = vehicleOverride.perKm` and marks `hasCustomRate = true`.
- **Strategy Selection:**
  - Standard vehicles (`sedan`, `ertiga`, `innova-crysta`): Handled by `StandardVehiclePricingStrategy`. If `hasCustomRate` is false, it takes `ctx.route.fares[ctx.vehicleId]` (from static `ROUTES` in `fare.catalogue.ts`). Only if `hasCustomRate` is true does it calculate `billedDistance * spec.perKm`.
  - Group vehicles (`tempo-traveller`, `urbania`): Handled by `GroupCommercialVehicleStrategy`. Under 300 km: forced round-trip (`billedKm = distance * 2`), rate = `billedKm * spec.perKm`, driver allowance = ₹500/day.

---

## 2. Where Authoritative Pricing Reaches the Customer

| Surface | Reached By Authoritative DB Fare Rules? | Current Mechanism |
|---|---|---|
| **Booking Quote (`POST /api/v1/fares/calculate`)** | **YES (partially)** | Reads active `fare_rules` and overrides per-km rates if `hasCustomRate` is triggered or route is dynamic. |
| **Booking Creation (`POST /api/v1/bookings/draft`)** | **YES** | Server recalculates fare via `fareService.calculate()`; ignores client inputs. |
| **Payment Checkout (`POST /api/v1/payments/create-checkout`)** | **YES** | Reads `booking.advanceAmount` directly from the server DB booking record. |
| **Public Fleet Endpoint (`GET /api/v1/fleet`)** | **YES** | Reads `db.fareRules.getActive()`, but is ONLY fetched by `BookingPage.tsx`. |

---

## 3. Where Authoritative Pricing Fails to Reach the Customer

| Surface | Why It Fails | What Customer Currently Sees |
|---|---|---|
| **Homepage (`HomePage.tsx` / `FleetSection.tsx`)** | Does not fetch `/api/v1/fleet` or backend rates. Uses hardcoded numbers in `FEATURED_VEHICLES` and `prices.ts`. | Hardcoded starting fares: Sedan ₹3,499, Innova ₹6,499, Tempo ₹9,500. |
| **Routes Listing (`RoutesPage.tsx`)** | Reads `generated-published-routes.json` and static `routes` in `data.ts`. | Pre-baked static fares (e.g. Sedan ₹2,500, Ertiga ₹3,200). |
| **Route Detail (`RouteDetailPage.tsx`)** | Reads `route.fares` from props pre-rendered at build time. | Fixed static amounts from build-time manifest. |
| **Monument Detail (`MonumentDetailPage.tsx`)** | Uses hardcoded array `FLEET_SPECIFICATIONS` in the page component. | Hardcoded fares: Sedan ₹800, Ertiga ₹1,050, Innova ₹1,400. Mismatches Booking Desk (₹1,900+). |
| **Package Detail (`PackageDetailPage.tsx`)** | Uses static `pkg.from` from `src/data.ts`. | Static editorial rates (e.g. ₹5,200 or ₹12,999). |
| **Static Pre-rendered HTML (`dist/*.html`)** | Pre-rendered via `scripts/prerender.ts` using `catalog.data.json`. No deploy hook is fired on fare-rule update. | Stale fares baked at git commit/build time. |
| **Browser LocalStorage Cache** | Stores `arena_catalog_manifest_v3` with static routes. | Stale routes and fares served from browser memory. |

---

## 4. The Package Booking Contract Disconnect (Bug Trace)

1. **Trigger:** User navigates to package page (`/packages/taj-mahal-sunrise-tour`) and clicks "Book Now".
2. **Handoff:** Query params sent: `?trip=package&package=taj-mahal-sunrise-tour&step=1`.
3. **Funnel Processing (`BookingPage.tsx`):**
   - Sets `bookingMode = 'package'`.
   - `selectedPackageCatalog` is `null` (since live `/api/v1/catalog` items have UUIDs, not matching slug).
   - Generates `bookingSelection`:
     ```json
     {
       "kind": "package",
       "id": "taj-mahal-sunrise-tour",
       "source": "catalog",
       "slug": "taj-mahal-sunrise-tour"
     }
     ```
4. **Draft Submission (`POST /api/v1/bookings/draft`):**
   - `booking.service.ts` inspects `selection.source === 'catalog'`.
   - Executes: `await db.catalog.getById(selection.id)`.
   - Because `selection.id` is `"taj-mahal-sunrise-tour"` (a package slug) and NOT a UUID in `catalog_items`, the lookup returns `null`.
   - Throws `Errors.notFound("CATALOG_ITEM_NOT_FOUND", "This published trip is no longer available.")`.
5. **Outcome:** User is blocked from booking the package unless they choose a different trip.
