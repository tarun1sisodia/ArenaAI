# Master Market Data Integration Plan — SK Baghel Tour & Travels

Based on comprehensive competitive research of the market-leading Agra operator ([ASTT](https://www.agrashivtourandtravels.com/)), this document outlines the exact data specifications, pricing matrices, cancellation rules, and implementation steps required to align our website with real-world industry benchmarks.

---

## 1. Executive Summary of Changes

| Domain | Current Baseline | New Market-Aligned Specification | Files to Touch |
|---|---|---|---|
| **Fleet & Vehicle Tiers** | 5 generic classes (Sedan, Ertiga, Innova, Tempo, Urbania) with arbitrary ₹/km | Comprehensive 12-tier fleet specification with exact seating, luggage, and per-km rates (₹9–₹120/km). Detailed Tempo (9–26 seats) & Urbania (9–17 seats). | `scripts/catalog.py`, `js/data.js` |
| **Local Sightseeing & Transfers** | Single `agra-local` route (8h/80km) with flat ₹3,500 fare | Exact local tiers: Airport/Station pickup-drop (₹750–₹1,500), 8h/80km (₹1,800–₹3,050), 12h/120km (₹2,100–₹3,380), extra km/hr rates. | `scripts/catalog.py`, `js/fares.js`, `scripts/render_pages.py` |
| **One-Way Routes** | Fixed arbitrary fares on 7 routes | Exact verified market rates: Agra ⇄ Delhi (₹2,999–₹8,499), Agra ⇄ Jaipur (₹3,299–₹9,499), extra km clauses, toll inclusions/exclusions. | `scripts/catalog.py`, `js/data.js`, `js/fares.js` |
| **Outstation Rules** | 1.85× flat round-trip multiplier | Standard Indian tourism rule: **Minimum 300 KM / Day** billing, per-km rates, night allowance ₹300 (cabs after 8PM) / ₹500 (tempos). | `js/fares.js`, `scripts/catalog.py` |
| **Tour Packages** | 4 basic packages | 6 high-converting packages with hourly itineraries: Same Day Taj Mahal, Sunrise Tour, Same Day Mathura–Vrindavan, Gatimaan Train, Overnight Agra, Golden Triangle. | `scripts/catalog.py`, `scripts/render_pages.py` |
| **Cancellation & Refund** | Generic placeholder terms | Authentic two-tier policy: **24-hour cab cancellation** (100% refund in 5–7 days) + **6-tier multi-day tour package cancellation slab** (0–61+ days). | `scripts/render_pages.py`, `terms.html`, `scripts/catalog.py` |
| **Benefits Section** | Generic trust bar | 6 core benefit cards: Easy Booking, Multiple Fleets, Lowest Fares, Special Offers (Coupon `ASTTCAR500OFF`), On-Time Service, 24×7 Support. | `scripts/render_pages.py`, `templates/base.html` |

---

## 2. Fleet Specifications & Per-KM Matrix

### A. Cars & SUVs
- **Hatchback (Wagon R, Tiago)**: 4+1 seats, 2 bags | Roundtrip: ₹9/km | One-way: ₹10/km
- **Compact Sedan (Aura, Ciaz)**: 4+1 seats, 2 bags | Roundtrip: ₹9/km | One-way: ₹10/km
- **Standard Sedan (Dzire, Etios, Amaze)**: 4+1 seats, 2 bags | Roundtrip: ₹10/km | One-way: ₹14/km
- **Compact SUV (Creta, Seltos, Harrier)**: 5+1 seats, 3 bags | Roundtrip: ₹13/km | One-way: ₹16/km
- **Family MPV / SUV (Ertiga, Rumion, Xylo)**: 6+1 seats, 3 bags | Roundtrip: ₹14/km | One-way: ₹17/km
- **Executive SUV (XUV700, Carens, Marazzo)**: 6+1 seats, 4 bags | Roundtrip: ₹15/km | One-way: ₹18/km
- **Standard Innova**: 6+1 seats, 4 bags | Roundtrip: ₹16/km | One-way: ₹20/km
- **Innova Crysta**: 6+1 seats, 4 bags | Roundtrip: ₹18/km | One-way: ₹23/km
- **Lifestyle SUV (Thar, Scorpio, MG Hector)**: 4–6 seats | Roundtrip: ₹30/km | One-way: ₹35/km
- **Premium SUV (Toyota Fortuner)**: 6+1 seats, 4 bags | Roundtrip: ₹35/km | One-way: ₹40/km
- **Luxury Sedan (Audi A4)**: 4+1 seats, 3 bags | Roundtrip: ₹60/km | One-way: ₹70/km
- **Ultra Luxury (Mercedes-Benz)**: 4+1 seats, 3 bags | Roundtrip: ₹100/km | One-way: ₹120/km

### B. Tempo Traveller & Force Urbania (Min. 300 KM/Day)
- **Standard Tempo Traveller**:
  - 9–11 Seater: ₹22–₹24/km
  - 12–15 Seater: ₹25/km
  - 16–18 Seater: ₹26/km
  - 19–22 Seater: ₹27–₹29/km
  - 23–26 Seater: ₹31–₹34/km
  - Driver Night Allowance: ₹500/night (after 8:00 PM)
- **Force Urbania (Luxury Van)**:
  - 9–10 Seater: ₹34/km | Local 8h/80km: ₹6,500
  - 12–13 Seater: ₹36/km | Local 8h/80km: ₹7,500
  - 16–17 Seater: ₹38/km | Local 8h/80km: ₹8,500
  - Extra KM rate: ₹34/km

---

## 3. Local Sightseeing & Transfer Packages

| Model / Category | Airport / Station Transfer | Full Day (8h / 80km) | Extended Day (12h / 120km) | Extra KM Rate | Extra Hour Rate |
|---|:---:|:---:|:---:|:---:|:---:|
| **Hatchback / Indigo** | ₹750 | ₹1,800 | ₹2,100 | ₹9 / km | ₹150 / hr |
| **Swift Dzire (Sedan)** | ₹800 | ₹1,900 | ₹2,200 | ₹11 / km | ₹150 / hr |
| **Honda Amaze / Aura** | ₹850 | ₹2,000 | ₹2,400 | ₹12 / km | ₹150 / hr |
| **Ertiga / Mobilio (6+1)** | ₹900 | ₹2,600 | ₹2,950 | ₹15 / km | ₹200 / hr |
| **Toyota Innova (6+1)** | ₹1,100 | ₹2,850 | ₹3,100 | ₹18 / km | ₹250 / hr |
| **Innova Crysta (6+1)** | ₹1,200 | ₹3,050 | ₹3,380 | ₹19 / km | ₹250 / hr |
| **Honda City (Executive)**| ₹1,500 | ₹3,000 | ₹3,800 | ₹20 / km | ₹250 / hr |

- **Driver Night Charge**: ₹300 applicable after 8:00 PM.
- **Tolls, Parking & State Tax**: Payable at actuals against receipts.

---

## 4. Popular One-Way Route Fares

### Agra ⇄ Delhi (Yamuna Expressway, ~230 km, 3.5–4.5 hrs)
- **Maruti Wagon R (Hatchback)**: ₹2,999 (Offer) | Extra KM: ₹10/km
- **Maruti Dzire / Etios (Sedan)**: ₹3,499 (Offer) | Extra KM: ₹14/km
- **Maruti Ertiga (MPV)**: ₹4,499 (Offer) | Extra KM: ₹17/km
- **Kia Carens (SUV)**: ₹4,999 (Offer) | Extra KM: ₹18/km
- **Toyota Innova (SUV)**: ₹6,499 (Offer) | Extra KM: ₹20/km
- **Innova Crysta (Luxury)**: ₹8,499 (Offer) | Extra KM: ₹24/km

### Agra ⇄ Jaipur (NH 21, ~240 km, 4.5–5.5 hrs)
- **Wagon R**: ₹3,299 | Extra KM: ₹10/km
- **Dzire (CNG)**: ₹3,299 | **Dzire (Diesel)**: ₹3,499 | Extra KM: ₹14–₹15/km
- **Ertiga (CNG)**: ₹4,499 | **Ertiga (Diesel)**: ₹4,999 | Extra KM: ₹17–₹18/km
- **Kia Carens**: ₹5,499 | Extra KM: ₹20/km
- **Toyota Innova**: ₹6,999 | Extra KM: ₹20/km
- **Innova Crysta**: ₹9,499 | Extra KM: ₹24/km

---

## 5. Tour Packages & Itineraries

1. **Same Day Agra Taj Mahal Tour by Car (from Delhi)**
   - *Price*: Sedan ₹3,499 \| Ertiga ₹4,499 \| Innova ₹6,499
   - *Duration*: 1 Day (600 KM limit)
   - *Stops*: Taj Mahal (2.5 hrs), Agra Fort, Itmad-ud-Daulah (Baby Taj), Mehtab Bagh.
   - *Includes*: AC Car, Driver, Tolls, Fuel, Parking, Water, Guide assistance.
   - *Excludes*: Monument tickets, meals.

2. **Taj Mahal Sunrise Tour by Car (from Delhi)**
   - *Price*: From ₹12,999 (Premium luxury package)
   - *Duration*: 1 Day (02:30 AM departure from Delhi)

3. **Same Day Agra Mathura Vrindavan Tour**
   - *Price*: Car from ₹6,999 \| Tempo Traveller from ₹11,900
   - *Duration*: 1 Day / 1 Night

4. **Same Day Agra Tour by Gatimaan Express Train**
   - *Price*: From ₹14,999 for 2 persons (Round-trip train tickets + private car in Agra + lunch + guide)
   - *Duration*: 1 Day (06:30 AM Nizamuddin departure, 07:30 PM return)

5. **Overnight Taj Mahal & Agra City Tour**
   - *Price*: From ₹12,599
   - *Duration*: 2 Days / 1 Night

6. **Golden Triangle (Delhi–Agra–Jaipur)**
   - *Price*: From ₹18,500 (3D/2N) / ₹37,800 (7D/6N)

---

## 6. Cancellation & Refund Policy

### A. Point-to-Point Cabs & Outstation
- **>24 Hours Before Pickup**: 100% full refund (processed in 5–7 business days via original payment method).
- **Within 24 Hours of Pickup**: Advance may be forfeited or partially refunded.
- **No-Show / Spot Cancellation**: 0% refund.

### B. Multi-Day Tour Packages
- **61+ days prior**: 0% fee (100% refund)
- **46–60 days prior**: 10% fee
- **31–45 days prior**: 20% fee
- **16–30 days prior**: 30% fee
- **6–15 days prior**: 55% fee
- **0–5 days prior**: 100% fee (No refund)

### C. Allowances & Additional Terms
- **Night Allowance**: ₹300 for cars after 8:00 PM; ₹500 for Tempo Travellers.
- **Outstation Min KM**: 300 KM per day minimum billing for round trips.
- **Passenger Conduct**: Strict no smoking, no alcohol, and no illicit substances. Passenger is liable for interior/exterior damage.
- **Jurisdiction**: Courts in Agra, UP.

---

## 7. Step-by-Step Implementation Sequence

1. **Step 1 — Catalog & Fare Engine Update**:
   - Update `scripts/catalog.py` with the realistic fleet per-km rates, fixed one-way routes, and expanded tour packages.
   - Update `js/fares.js` and `js/data.js` to match with local package tiers, night allowance rules (₹300/₹500), and coupon `ASTTCAR500OFF`.

2. **Step 2 — Legal & Policy Update**:
   - Update `legal_body()` in `scripts/render_pages.py` to publish the authentic 24-hr cab cancellation and 6-tier tour package refund policy.
   - Update FAQ accordion copy to align with these promises.

3. **Step 3 — Marketing Components ("Benefits To Book Cab With Us" & Services)**:
   - Implement `render_benefits_section()` in `scripts/render_pages.py` displaying the 6 customer benefit cards.
   - Update `services_body()` and `home_body()` to display the 6 operational verticals (One-way, Outstation, Local Sightseeing, Airport transfers, Tempos, Luxury rentals).

4. **Step 4 — Tour Package & Route Pages Upgrade**:
   - Add hourly timeline breakdowns, inclusions, exclusions, and vehicle upgrade pricing to `package_body()`.
   - Add one-way vs round-trip comparison tables to `route_body()`.

5. **Step 5 — Static Rebuild & Link Validation**:
   - Execute `python3 scripts/render_pages.py`.
   - Verify all bilingual pages, clean console, and 0 broken links.
   - Update `04_PROGRESS_TRACKER.md`.
