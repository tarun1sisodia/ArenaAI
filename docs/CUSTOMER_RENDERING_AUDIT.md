# Customer Rendering Audit — SK Baghel Tour & Travels

**Date:** October 8, 2026  
**Status:** Complete  
**Scope:** Frontend pricing logic audit, identification of forbidden client math, and definition of the normalized `FleetPriceOption` rendering contract.

---

## 1. Forbidden Client Calculations Identified

According to the Master Brief (Section 13):
> *"Frontend components ONLY render prices. Frontend MUST NOT calculate distance × rate, minimum distance, round-trip conversion, night charge, driver charge, toll, package commercial price, or final booking amount."*

### 1.1 Current Violations in `react/` Codebase

1. **`react/src/fares.ts:getIndicativeBrowseFare` (Lines 295–354):**
   ```ts
   // VIOLATION: Client computes distance x rate, driver allowance, and round-trip multiplier
   const billedKm = isForce ? (tripType === "round" ? distanceKm : distanceKm * 2) : distanceKm;
   base = billedKm * vehicle.perKm;
   if (isForce) {
     total = base + 500; // Driver allowance hardcoded on client
   } else if (tripType === "round") {
     total = Math.round(base * 1.85); // Arbitrary client multiplier
   }
   const advance = advanceOf(total);
   ```
2. **`react/src/fares.ts:advanceOf` (Lines 71–74):**
   ```ts
   // VIOLATION: Client computes token advance amount
   const raw = Math.max(500, Math.round((total * 0.28) / 100) * 100);
   ```
3. **`react/src/components/home/FleetSection.tsx` (Lines 8–12):**
   ```ts
   // VIOLATION: Hardcoded multiplication on client
   startingFare: prices.fleet_per_km.ertiga * 250,
   startingFare: prices.fleet_per_km.urbania * 250,
   ```
4. **`react/src/pages/RouteDetailPage.tsx` (Lines 160 & 330):**
   ```ts
   // VIOLATION: Hardcoded 28% advance calculation
   const advanceToken = Math.round(primaryFare * 0.28);
   const token = Math.round(fare * 0.28);
   ```
5. **`react/src/pages/PackageDetailPage.tsx` (Lines 107–108):**
   ```ts
   // VIOLATION: Client calculates deposit and balance
   const advanceAmount = Math.round(grossPrice * 0.28);
   const balanceAmount = grossPrice - advanceAmount;
   ```
6. **`react/src/pages/DossierTourPackagePage.tsx` (Line 62):**
   ```ts
   const tokenAdvance = Math.round(startingFare * 0.28);
   ```
7. **`react/src/pages/MonumentDetailPage.tsx` (Line 49):**
   ```ts
   const tokenAdvance = Math.round(startingFare * 0.28);
   ```

---

## 2. Target Normalized Customer Price Contract

All customer components must receive pre-calculated, display-ready pricing objects conforming to the unified schema:

```typescript
export interface FleetPriceOption {
  fleetCode: "sedan" | "ertiga" | "innova-crysta" | "tempo-traveller" | "urbania";
  fleetName: string;
  price: number;
  advanceAmount: number;
  currency: "INR";
  pricingType: "per-km-route" | "fixed-package" | "local-package" | "special-commercial";
  displayLabel: string; // e.g. "Starting from", "All-Inclusive", "Fixed Package Rate"
  priceSource: "fare_rules" | "tour_packages" | "local_packages";
  breakdown?: {
    billedKm?: number;
    driverAllowance?: number;
    nightAllowance?: number;
    tollNote?: string;
  };
}
```

### 2.1 Permitted vs Forbidden Frontend Responsibilities

| Responsibility | Status | Implementation Standard |
|---|---|---|
| Display Currency Symbol (`₹`) | **PERMITTED** | Format via standard `formatINR(price)` |
| Format Numeric Thousands Separator | **PERMITTED** | `toLocaleString('en-IN')` |
| Render Fleet Icon & Imagery | **PERMITTED** | Standard design system tokens |
| Render Pricing Pill & Labels | **PERMITTED** | Use `displayLabel` from contract |
| Transmit Booking Selections | **PERMITTED** | Pass route/tier IDs to booking flow |
| Compute `distance * rate` | **FORBIDDEN** | MUST be resolved by server resolver |
| Compute `total * 0.28` (Advance Token) | **FORBIDDEN** | MUST be supplied in server payload |
| Apply `* 1.85` or `* 2` Round-Trip Math | **FORBIDDEN** | Strategy engine handles in backend |
| Calculate Driver or Night Allowance | **FORBIDDEN** | Server strategy engine calculates |
