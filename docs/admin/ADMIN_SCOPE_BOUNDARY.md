# Admin Panel Scope & Boundary Specification

**Product:** SK Baghel Tour & Travels — Operations & Administration Panel  
**Document Status:** Approved Scope Standard  
**Version:** 1.0  
**Authority:** Single Source of Truth for Feature Inclusions & Exclusions  
**Related Documents:** [ADMIN_PRD.md](ADMIN_PRD.md), [ADMIN_TRD.md](ADMIN_TRD.md), [ADMIN_API_CONTRACT.md](ADMIN_API_CONTRACT.md), [ADMIN_MODELS.md](ADMIN_MODELS.md)

---

## 1. Context & Business Philosophy

SK Baghel Tour & Travels operates as a boutique, customer-centric tour and travel agency based in Agra, specializing in Taj Mahal sightseeing tours, outstation transfers (Agra–Delhi, Agra–Jaipur, Rajasthan tours), and Tempo Traveller charters.

### The Client Directive
The client explicitly instructed that the backend and operations system must **focus strictly on the booking process, fare calculations, payment collections/refunds, catalog management, and customer relations**, while completely removing physical fleet inventory management and driver dispatching logics.

### Why This Simplification Matters
1. **Asset-Light Operational Reality**: SK Baghel Tour & Travels works with a vetted network of trusted drivers and partner vehicles. Managing individual vehicle license plates, PUC certificates, driver police verification files, or complex real-time algorithmic dispatching inside custom software introduces massive operational overhead without business value.
2. **Desk-Assisted High Touch Experience**: Private tours in North India require personal phone coordination between travel desk managers and customers (confirming train timings, pickup hotel gates, luggage volumes). Drivers are coordinated directly via phone and local networks.
3. **Zero Legal & Telematics Liability**: Eliminating vehicle maintenance records and live GPS tracking avoids telematics hardware failure liabilities, battery drain issues, and regulatory transport compliance headaches.

---

## 2. Inclusions vs. Exclusions Matrix

The table below defines what the Admin Panel **WILL** contain versus what it **WILL NOT** contain across all operational domains:

| Domain / Capability | What it WILL Contain (In-Scope) | What it WILL NOT Contain (Out-of-Scope) |
|---|---|---|
| **Bookings** | • Search by ticket ID (`AGR-YYYYMMDD-XXXX`)<br>• Filter by status, date, vehicle tier, trip type<br>• View unmasked customer phone & email for staff<br>• Advance status: `paid_confirmed` ➔ `in_transit` ➔ `completed` / `cancelled`<br>• Inspect immutable fare snapshot & advance paid | • NO driver assignment to bookings<br>• NO vehicle plate allocation to bookings<br>• NO automated driver dispatching<br>• NO manual fare tampering or price editing on active bookings |
| **Pricing & Fares** | • View-only active commercial rules version<br>• Inspection of vehicle tier rates (`sedan`, `ertiga`, `innova-crysta`, `tempo-traveller-12`, etc.)<br>• Inspection of night allowances & driver daily allowances<br>• Verification of formula transparency | • NO dynamic in-memory price overrides by operators<br>• NO arbitrary offline discount injections without promo code validation<br>• NO database tables for physical vehicle fleet inventories |
| **Payments & Refunds** | • View captured payments from Razorpay/PayPal<br>• Audit provider order IDs & payment IDs<br>• Super admin refund execution with idempotency key<br>• Automatic status reconciliation to `refunded` | • NO direct credit card charging by admin staff<br>• NO customer card/CVV entry screens<br>• NO driver payout or commission settlement calculations<br>• NO cash ledger accounting |
| **Fleet & Vehicles** | • Customer-facing pricing categories (`CAB_TIERS`)<br>• Luggage & seating capacity guidelines for customers | • NO `vehicles` database table<br>• NO vehicle registration plates (e.g. UP 80...)<br>• NO RC book, insurance, or PUC document records<br>• NO vehicle service, maintenance, or repair logs<br>• NO fuel expense tracking or odometer audits |
| **Drivers & Personnel** | • Zero driver records in software | • NO `drivers` database table<br>• NO driver profiles, license numbers, or KYC<br>• NO police verification status tracking<br>• NO driver attendance, shift rosters, or leave<br>• NO driver performance ratings or disciplinary logs<br>• NO driver mobile app or driver login web portals |
| **Dispatch & Telematics** | • Staff phone coordination outside software | • NO driver WhatsApp notification queue<br>• NO live GPS vehicle tracking on maps<br>• NO real-time driver ETA updates<br>• NO geofencing or route telemetry |
| **Catalog & Itineraries** | • CMS for Rides, Tours, and Packages<br>• Draft, edit, publish, and archive workflows<br>• Title, slug, duration, route summary, descriptions<br>• Starting prices and featured image asset IDs | • NO dynamic inventory slotting (trips are private charters, not scheduled bus seats)<br>• NO multi-vendor marketplace listings |
| **Customer Reviews** | • Moderation queue for submitted reviews<br>• Cross-reference reviews with booking ticket IDs<br>• Approve, reject, publish, archive actions<br>• Verified customer badges | • NO automated unmoderated publishing<br>• NO driver reviews or driver rating scorecards |
| **Inquiries & Leads** | • Centralized inbox for website inquiry forms<br>• Lead progression (`new` ➔ `contacted` ➔ `quoted` ➔ `converted` ➔ `closed`)<br>• Internal operational call notes | • NO automated outbound dialer integration<br>• NO complex multi-tier enterprise CRM pipelines |
| **Security & Auditing** | • Supabase JWT authentication<br>• Role-based guards (`dispatcher`, `content_editor`, `review_moderator`, `finance_operator`, `super_admin`)<br>• Unmasking audit logs & mutation audit history | • NO public signup for administrative roles<br>• NO permanent deletion of financial records (soft cancel/refund only) |

---

## 3. Detailed Boundary Analysis

### 3.1. Why Vehicle Pricing Tiers are Kept While Physical Vehicles are Dropped
A common point of confusion in travel systems is the distinction between:
- **Vehicle Pricing Tier (Customer-Facing)**: A conceptual vehicle classification used for fare calculation (e.g., "Sedan — Dzire or equivalent", "Innova Crysta", "Tempo Traveller 12-seater"). This is an immutable commercial constant located in `fare.catalogue.ts` (`CAB_TIERS`). **This remains 100% active.**
- **Physical Vehicle Fleet (Internal Asset)**: A database entity tracking an actual physical car owned or leased by the company (e.g., License plate `UP-80-ET-4521`, Chassis number, Mileage, Fitness certificate). **This is 100% removed.**

### 3.2. Why Driver Allowance is Kept in Fares While Drivers are Dropped
In Indian commercial tourism:
- **Driver Daily Allowance (Bhatta)** is a standard commercial charge component (e.g. ₹300 per calendar day for outstation trips) added to the customer's total fare to cover driver boarding and lodging on outstation trips. This is an algorithmic element of the customer price calculation.
- **Driver Personnel Management** (hiring, police checks, roster assignment) is completely decoupled and handled manually by the travel desk.

### 3.3. Customer Journey without In-App Dispatch
1. Customer selects route and vehicle category (`sedan`) on the website.
2. Server calculates exact fare breakdown and advance amount (e.g. 20% or ₹500).
3. Customer completes advance payment via Razorpay.
4. Booking enters `paid_confirmed` status.
5. Customer receives booking voucher with ticket ID and remaining balance due.
6. The booking immediately appears on the Admin Panel in the `paid_confirmed` queue.
7. Operations desk calls the customer to confirm hotel/railway pickup nuances.
8. Desk operator coordinates an appropriate vehicle from their local network via phone.
9. On trip day, operator clicks "Mark In-Transit" in Admin Panel.
10. Upon safe completion, operator clicks "Mark Completed".

---

## 4. Architectural Rules for Admin Developers

1. **Never Reintroduce Driver/Vehicle Schemas**:
   - Any pull request or migration introducing `drivers` or `vehicles` tables, foreign keys, or API parameters (`driverId`, `vehicleId`) must be rejected.
2. **Enforce Optimistic Locking**:
   - All booking status updates must pass `expectedVersion: number`. If another operator updated the booking simultaneously, return `409 Conflict` (`OPTIMISTIC_LOCK_CONFLICT`).
3. **Audit Every Unmasking**:
   - Whenever an admin views full customer phone/email, an audit log entry must be generated.
4. **Idempotent Financial Operations**:
   - Every refund must mandate an `idempotencyKey` UUID generated by the client to prevent double refunding.
