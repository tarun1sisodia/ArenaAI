# Price Source Matrix — SK Baghel Tour & Travels

**Date:** October 8, 2026  
**Status:** Complete  
**Scope:** Complete inventory of every customer-facing surface displaying a price, its origin, stale risk, and target authoritative contract.

---

| Feature / Location | Page / URL | Component | API Endpoint | Database / File Source | Current Price Source | Hardcoded? | Stale / Static Risk? | Matches Booking Desk? | Required Authoritative Source |
|---|---|---|---|---|---|---|---|---|---|
| **Home: Hero Expedition Dock** | `/` (`/en/`) | `HomeBookingWidget.tsx` | None (Direct URL link to `/book`) | None | None (Only routes parameters to `/book`) | No | No | N/A (calculates on booking) | Normalizes URL contract to `/book` |
| **Home: Choose Your Vehicle** | `/` (`/en/`) | `FleetSection.tsx` | None | `react/src/data/prices.ts` | `FEATURED_VEHICLES` array | **YES** (Sedan ₹3,499, Ertiga ₹3,500, Innova ₹6,499, Tempo ₹9,500, Urbania ₹8,500) | **CRITICAL** (Never updates on Admin Fare Rule change) | **NO** | `GET /api/v1/fleet` + Corridor Baseline Contract |
| **Home: Popular Sightseeing Carousel** | `/` (`/en/`) | `CoverflowCarousel.tsx` | None | `react/src/data.ts` | Static `packages[i].from` | **YES** | Static build-time | **NO** | Tour Package Fixed Rate (`tour_packages.starting_price_inr`) |
| **Routes: Listing & Search Cards** | `/routes/` | `RoutesPage.tsx` | `GET /api/v1/catalog/manifest` (Optional fallback) | `generated-published-routes.json` & `react/src/data.ts` | Static route `fares` object (fs, fe, fi, ft, fu) | **YES** | **HIGH** (Baked into static JSON or localStorage) | **NO** (Differs if Admin updated per-km rate) | Route Distance × Active Fleet Rate (`fare_rules`) |
| **Route: Detail Starting Badge** | `/routes/[slug]` | `RouteDetailPage.tsx` | None (SSG pre-rendered) | `react/src/data.ts` (`routes`) | `route.fares.sedan` | **YES** | **HIGH** (Pre-rendered HTML) | **NO** | Route Distance × Active Fleet Rate (`fare_rules`) |
| **Route: 5-Vehicle Comparison Matrix** | `/routes/[slug]` | `RouteDetailPage.tsx` | None (SSG pre-rendered) | `react/src/data.ts` (`routes`) | `route.fares[v.id]` | **YES** | **HIGH** (Pre-rendered HTML) | **NO** | Route Distance × Active Fleet Rate (`fare_rules`) |
| **Packages: Listing Grid** | `/packages/` | `PackagesPage.tsx` | `GET /api/v1/catalog` (Optional runtime merge) | `src/data.ts` & `generated-published-tour-packages.json` | `pkg.from` or `startingPriceInr` | **YES** (Fallback) | **MEDIUM** | **NO** (If package upgraded) | `tour_packages.starting_price_inr` |
| **Package: Detail Hero & Sticky Dock** | `/packages/[slug]` | `PackageDetailPage.tsx` | None (SSG pre-rendered) | `src/data.ts` (`packages`) | `pkg.from` | **YES** | **HIGH** (Pre-rendered HTML) | **NO** | `tour_packages.starting_price_inr` |
| **Package: Vehicle Upgrades** | `/packages/[slug]` | `PackageDetailPage.tsx` | None | `src/data.ts` (`packages.upgrades`) | Static `upgrades.price` | **YES** | **HIGH** | **NO** | `tour_packages.fleet_prices` (Fixed commercial package fares) |
| **Dossier Package Detail** | `/packages/tour/[slug]` | `DossierTourPackagePage.tsx` | `GET /api/v1/tour-packages/by-code/:code` | `tour_packages` DB table | `item.startingPriceInr` / `item.fleetPrices` | No | Low | **YES** (When live) | `tour_packages.fleet_prices` |
| **Monument: Fleet Transfer Cards** | `/monuments/[slug]` | `MonumentDetailPage.tsx` | None | `MonumentDetailPage.tsx` | `FLEET_SPECIFICATIONS` (Sedan ₹800, Ertiga ₹1,050, Innova ₹1,400, Tempo ₹2,400, Urbania ₹3,800) | **YES** | **CRITICAL** (Arbitrary in-file constants) | **NO** (Booking Desk charges ₹1,900+) | Route Pricing Rule using corridor distance to monument |
| **Booking: Step 1 Vehicle Cards** | `/book` | `BookingPage.tsx` | None (Step 1 browse) | `src/features/booking/fareEngine.ts` | Static `calcFare()` or `getIndicativeBrowseFare()` | **YES** | **HIGH** (Client math) | **NO** (Step 2 quote changes) | Live Server Quote / Published Contract |
| **Booking: Step 2 Authoritative Quote** | `/book` | `BookingPage.tsx` | `POST /api/v1/fares/calculate` | PostgreSQL `fare_rules` & `route_catalog` / `tour_packages` | Backend `FareEngineResult` | No | No (Live RPC) | **YES (Authoritative)** | Single Source of Truth for Quotes |
| **Booking: Reservation Snapshot** | Server DB | `booking.service.ts` | `POST /api/v1/bookings/draft` | PostgreSQL `fare_rules` | Server `fareService.calculate()` snapshot | No | No (Live RPC) | **YES (Authoritative)** | Immutable Booking Record |
| **Payment: Razorpay Checkout** | Razorpay Gateway | `payment.service.ts` | `POST /api/v1/payments/create-checkout` | PostgreSQL `bookings.advance_amount` | `rupeesToPaise(booking.advanceAmount)` | No | No | **YES (Authoritative)** | Bound to Server Booking Snapshot |
