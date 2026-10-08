# Booking Price Audit — SK Baghel Tour & Travels

**Date:** October 8, 2026  
**Status:** Complete  
**Scope:** Quote APIs, booking draft creation, fare snapshots, payment gateway binding, and historical booking immutability.

---

## 1. Authoritative Server Quote Architecture

### 1.1 Existing Endpoint: `POST /api/v1/fares/calculate`
- **Controller:** `backend/src/modules/fares/fare.controller.ts:calculate`
- **Schema:** `CalculateFareSchema` in `fare.schema.ts`.
- **Validation:** Enforces positive distance, valid ISO datetime, valid vehicle tier, and resolves booking selection into route / package parameters.
- **Service:** `fare.service.ts:calculate()` merges database rules (`fare_rules`, `tour_packages`, `local_packages`, `route_catalog`), evaluates promotional discounts against `promos` table, and computes authoritative `totalFare`, `advanceAmount`, and `balanceAmount`.
- **Finding:** Client totals or client distances sent in the body are stripped or overridden by server estimates (SEC-005).

### 1.2 Target Dedicated Quote Endpoints
To establish clear domain boundaries, the brief specifies explicit endpoints:
- `POST /api/v1/quotes/route`: Accepts `{ origin, destination, tripType, fleetCode, pickupDatetime, returnDatetime, promoCode }`. Resolves fleet fare rule + route distance + special vehicle rules (<300km tempo/urbania) + driver allowance.
- `POST /api/v1/quotes/package`: Accepts `{ packageCode, fleetCode, pickupDatetime, promoCode }`. Resolves fixed package fleet price without invoking route distance logic.

---

## 2. Booking Draft Creation & Fare Snapshotting

### 2.1 Trace of `POST /api/v1/bookings/draft`
1. Request arrives with customer details, pickup/drop location, vehicle tier, and booking selection.
2. In `booking.service.ts`:
   - Re-evaluates fare via `fareService.calculate()`.
   - Never trusts any money amount passed by the client.
   - Computes unique `ticketId` (e.g. `SKB-202610-XXXX`).
   - Generates high-entropy `guestAccessToken`.
   - Stores full `fareSnapshot` JSON object in PostgreSQL `bookings.fare_snapshot`.
   - Stores `fare_rules_version` referencing the active version string.
   - Stores `total_fare`, `advance_amount`, and `balance_amount`.
   - Status defaults to `"pending_payment"`.

### 2.2 Immutability of Historical Bookings
- Because the entire calculation is stored verbatim in `bookings.fare_snapshot` alongside `total_fare` and `advance_amount`, subsequent updates to `fare_rules` in Admin NEVER alter existing records.
- In `booking.service.ts` and `admin/src/pages/BookingsPage.tsx`, booking views read strictly from `booking.fareSnapshot` and `booking.totalFare`.
- **Audit Verification:** Confirmed immutable. Admin rate changes do not trigger back-updates on `bookings`.

---

## 3. Payment Gateway Binding

### 3.1 Trace of `POST /api/v1/payments/create-checkout`
1. Receives `{ ticketId, guestAccessToken, idempotencyKey }`.
2. Validates ownership via `timingSafeEqualString(booking.guestAccessToken, input.guestAccessToken)`.
3. Verifies booking status via `assertBookingPayable(booking)` (must be `"pending_payment"`).
4. Derives payment amount exclusively from server record:
   ```ts
   const amountMinor = rupeesToPaise(booking.advanceAmount);
   ```
5. Passes `amountMinor` directly to Razorpay order creation API (`orders.create({ amount: amountMinor, currency: "INR", ... })`).
6. Browser is completely locked out of specifying or altering the payable amount.
7. Webhook verifies signature (`X-Razorpay-Signature`) and transitions booking to `"confirmed"`.
