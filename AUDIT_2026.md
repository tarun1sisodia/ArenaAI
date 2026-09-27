# AUDIT_2026 — Full-Stack Pricing, Data & SEO Audit

**Date:** 2026-09-27
**Branch:** `arena/01a0e0fa-arenaai`
**Baseline commit:** `70c34d6`
**Scope:** Phase 1 of the agreed plan — *report before changing anything*.
**Status of build at time of audit:** `npm --prefix backend run test:ci` → **61/61 passing**;
`npm run customer:build` → **green**, 37 pages prerendered, 982-route manifest generated.

> Every claim below was verified by reading the code and by executing the live backend engine.
> Numeric examples in §3 are **actual engine output**, not estimates.

---

## 1. Where pricing is calculated

There are **three independent fare implementations** in this repository. This is the root cause of
almost every defect in this report.

| # | Location | Lines | Used by | Has Force/Urbania exception? |
|---|----------|-------|---------|------------------------------|
| **E1** | `backend/src/modules/fares/fare.engine.ts` + `fare.strategy.ts` + `fare.catalogue.ts` | 379 + 180 + 262 | `POST /api/v1/fares/calculate`, `booking.service.ts:45` | ✅ Yes — `GroupCommercialVehicleStrategy` |
| **E2** | `react/src/fares.ts` → `calcFare()` | `fares.ts:293–408` | `BookingPage.tsx:4`, `HeroFareWidget.tsx:51` (via `features/booking/fareEngine.ts` re-export) | ❌ **No — none at all** |
| **E3** | `react/src/components/routes/InstantRouteCalculator.tsx` → `activeFare` useMemo | `:124–151` | `RoutesPage.tsx` instant calculator | ⚠️ Partially — inline, hardcoded, different rates |

Supporting data sources, all of which carry prices and can disagree:

- `backend/src/modules/fares/fare.catalogue.ts` — `VEHICLES` (per-km), `ROUTES` (10 fixed routes),
  `LOCAL_PACKAGES`, `AIRPORT_TRANSFERS`, `PACKAGES`, `PACKAGE_UPGRADES`, `OUTSTATION_RULES`.
- `react/src/data.ts:209+` — a **hand-duplicated copy** of the same 10 routes and the same fare numbers.
- `react/new_design/all_routes_and_prices.csv` → compiled by `react/scripts/build-manifest.ts` into
  `react/public/routes-manifest.json` (982 routes, per-km group rates `ft`/`fu`).
- `backend/src/db/seedData.ts` and `backend/scripts/seed-routes.ts` — DB seed.
- Admin overrides: `admin/src/pages/FaresPage.tsx` (versioned fare-rule editing).

**Verdict:** no single source of truth. E1 and E2 hold byte-identical *route tables* that were
copy-pasted, but implement **different formulas** over them. E3 reads a third dataset with a third
set of per-km rates.

---

## 2. Is there a single source of truth?

**No.** Concrete divergences found:

### 2.1 Standard round-trip formula differs between backend and frontend

- **Backend** (`fare.strategy.ts:52–55`): `max(catalogFare × 1.85, minKmPerDay × perKm)`.
- **Frontend** (`fares.ts:373–378`):
  ```ts
  const minDayKmTotal = Math.round(outstationRules.minKmPerDay * vehicle.perKm);
  const standardRound  = Math.round(total * 1.85);
  total = Math.max(standardRound, Math.min(minDayKmTotal, standardRound));
  ```
  🐞 **This is a no-op bug.** `Math.min(b, a) ≤ a`, therefore `Math.max(a, Math.min(b, a)) === a`
  always. The 300 km/day floor **never applies on the frontend**. The expression reduces to
  `standardRound` unconditionally. The `minDayKmTotal` variable is computed and thrown away.

### 2.2 Per-km rates differ between the three sources

| Vehicle | Backend `VEHICLES.perKm` | Manifest `ft`/`fu` (sampled) |
|---------|--------------------------|------------------------------|
| Tempo Traveller | **₹25/km** | `ft` = **17–22/km** |
| Force Urbania | **₹34/km** | `fu` = **25–30/km** |

E3 multiplies the *manifest* rate by billable km; E1 multiplies the *catalogue* rate. For the same
journey these cannot agree.

### 2.3 Night allowance window differs

- Backend `OUTSTATION_RULES`: night = **22:00–05:00** IST (`fare.catalogue.ts:36–37`).
- Frontend `fares.ts:~119` comment and `isNightTime()`: **20:00–06:00**.

Same trip, different allowance depending on who calculates.

### 2.4 Multi-day driver allowance

Backend standard strategy charges `₹300 × days` (`fare.strategy.ts:62`); the exception strategy
charges `₹500 × days` (`:128`). The frontend charges **no driver allowance at all** — `calcFare`
has no `driverAllowance` concept in its return type (`FareQuote`, `fares.ts:271–289`).

---

## 3. Special-vehicle handling — Force Tempo Traveller & Force Urbania

### 3.1 Live engine output (executed against `calculateFare`, Agra pickup 09:00 IST)

| Case | Trip type returned | Base | Driver allw. | Billed km | Total |
|------|-------------------|------|--------------|-----------|-------|
| Sedan one-way Agra→Delhi | `one-way` | 3,499 | 0 | 230 | **₹3,499** |
| **Tempo one-way Agra→Delhi** | `round-trip` ✅ | 11,500 | 500 | 460 | **₹12,000** |
| **Urbania one-way Agra→Delhi** | `round-trip` ✅ | 15,640 | 500 | 460 | **₹16,140** |
| **Tempo one-way Agra→Mathura (55 km)** | `round-trip` ✅ | 7,500 | 500 | **300** ✅ | **₹8,000** |
| **Urbania one-way Agra→Mathura (55 km)** | `round-trip` ✅ | 10,200 | 500 | **300** ✅ | **₹10,700** |
| Urbania + promo `ASTTCAR500OFF` | `round-trip` | 15,640 | 500 | 460 | **₹16,140** (promo correctly refused ✅) |
| Urbania **local** Agra→Agra | `local-tour` ❌ | 7,500 | 0 | 80 | ₹7,500 |
| Urbania **local-tour 8hr** | `local-tour` ❌ | 7,500 | 0 | 80 | ₹7,500 |
| Urbania **airport-transfer** | `airport-transfer` ❌ | 3,800 | 0 | 20 | ₹3,800 |
| Urbania **package** golden-triangle | `one-way` ❌ | 24,000 | 0 | 230 | ₹24,000 |

### 3.2 Rule-by-rule verdict (backend E1)

| Rule | Status | Evidence |
|------|--------|----------|
| **R1 — separate fixed pricing** | ⚠️ **Partially / incorrectly implemented** | Tempo and Urbania *are* distinct internal IDs with distinct catalogue columns (`tempo: 9500`, `urbania: 14000` for Agra–Delhi) and they do return different totals — so they are **not** collapsed into one tier. **However**, `GroupCommercialVehicleStrategy.calculate()` (`fare.strategy.ts:120`) computes `baseFare = billableDistance × spec.perKm` and **completely ignores the fixed catalogue fare**. `ctx.route.fares[ctx.vehicleId]` is never read in the exception path. So the "locked fixed-rate pricing" the code's own comment claims is actually **dynamic per-km pricing**. The confirmed rate card (Agra–Delhi Urbania = ₹14,000) is dead data; the engine charges ₹15,640. |
| **R2 — forced round trip** | ✅ **Implemented** | `fare.strategy.ts:112` hardcodes `effectiveTripType = "round-trip"`; verified above — one-way input returns `round-trip`. |
| **R3 — both legs** | ✅ **Implemented** | `roundTripKm = oneWayKm * 2` (`:118`). Route reversal handled by `findRoute` (`fare.engine.ts:106–109`), so A→B and B→A are symmetric. |
| **R4 — 300 km minimum** | ✅ **Implemented for outstation** | `minDayKmFloor = OUTSTATION_RULES.minKmPerDay * days` (`:119`), `billableDistance = max(roundTripKm, minDayKmFloor)` (`:120`). Verified: 55 km route bills 300 km. |
| **R5 — transparency flags** | ⚠️ **Partial** | Machine-readable info exists only as *strings* in `rules[]` (`"forced-round-trip"`, `"min-km-floor:300"`, `"billable-km:460"`). There are no typed boolean fields (`forcedRoundTrip`, `appliedMinKm`, `pricingClass`) in `FareResponseSchema`. The frontend would have to string-parse to display a notice — and it currently does not display one at all. |
| **Promo exclusion** | ✅ **Implemented** | `allowPromo: false` (`:146`), enforced in `finalize()` (`fare.engine.ts:343–344`) and re-checked in `fare.service.ts:31` and `booking.service.ts:58`. |

### 3.3 🐞 Critical: four booking paths bypass the exception entirely

`calculateFare` dispatches to the strategy **only** on the outstation branch (`fare.engine.ts:293`).
These four paths `return finalize(...)` before ever reaching it:

1. **Tour package** (`:200–217`) — any package booked with a Force vehicle stays `one-way`, gets no
   round-trip, no 300 km floor. It also applies `PACKAGE_UPGRADES` (`urbania: +5500`) as a flat
   surcharge, which is a fourth pricing model.
2. **Local tour / 8hr-80km / 12hr-120km** (`:219–239`).
3. **Airport transfer** (`:241–265`).
4. **Local route** where origin == destination (`:273–291`).

For #2–#4 this may well be *correct* business behaviour (a local taxi hire shouldn't be forced to a
300 km round trip) — **but it is undocumented and untested**, and the spec as written says R2 is
unconditional. **This is the one genuine ambiguity in the rate card and it needs a client answer —
see §7.** For #1 (tour packages) the bypass looks like a straight bug.

### 3.4 Vehicle classification is fragile substring matching

`fare.catalogue.ts:204–216` (`isGroupExceptionVehicle`) and `:221–235` (`toInternalVehicleId`)
classify by `String.includes()`:

```ts
if (clean === "tempo-traveller" || clean.includes("tempo")) return "tempo";
if (clean === "urbania" || clean.includes("urbania") || clean.includes("force")) return "urbania";
```

Consequences:
- Order-dependent: `"force-tempo"` matches `includes("tempo")` **first**, so it correctly resolves to
  `tempo`. This works **by accident of ordering**, not by design.
- A bare `"force"` silently resolves to `urbania` — wrong vehicle, wrong price.
- `isGroupExceptionVehicle` also returns `true` for any plain `"tempo"`, so a non-Force tempo (if one
  is ever added) is silently swept into the exception.
- `VEHICLE_TIERS` (`types/domain.ts:9`) has only 5 values and `"force-urbania"` is **not** one of
  them — yet `fare.engine.test.ts:194` passes `"force-urbania" as any`, bypassing the Zod enum. A
  real API request with that tier would be **rejected by `CalculateFareSchema`** (`.strict()`,
  `z.enum(VEHICLE_TIERS)`) before reaching the engine. The test proves behaviour the API cannot
  actually receive.

---

## 4. Is Force Tempo distinct from Force Urbania?

✅ **Yes, at the data layer — they are not collapsed.** Distinct internal IDs (`tempo`, `urbania`),
distinct catalogue columns, distinct per-km rates (25 vs 34), distinct night allowance path, and
verified distinct totals (₹12,000 vs ₹16,140 for the same journey).

🐞 **But the distinction is driven by per-km rate, not by two fixed price lists.** Because R1 is
implemented as `km × perKm`, the two vehicles are always in a fixed 25:34 ratio. The rate card's
independently-negotiated fixed numbers (Agra–Delhi: 9,500 / 14,000 — a 1:1.47 ratio, not 1:1.36)
cannot be expressed. **Any per-route commercial negotiation for one vehicle is currently impossible
to represent.**

---

## 5. Data coverage — Routes, Packages, Tours

| Dataset | Count | Rendered to users? |
|---------|-------|--------------------|
| `routes-manifest.json` | **982** routes (385 `oneway`, 462 `day120`, 92 `tempo`, 34 `custom`, 9 `tour`) | Only via the `InstantRouteCalculator` autocomplete on `/en/routes/`. No pages, no links. |
| `react/src/data.ts` `routes` | **8** (asserted by `data/parity.ts:5`) | ✅ Yes — Routes page cards + 8 prerendered detail pages |
| `react/src/data.ts` `packages` | **6** (asserted by `data/parity.ts:6`) | ✅ Yes — `PackagesPage.tsx:391` literally renders `All Packages ({packages.length})` → **"All Packages (6)"** |
| Backend `ROUTES` | 10 | API only |
| Backend `PACKAGES` | 6 | API only |

### 5.1 The Delhi–Mathura–Agra test

❌ **Fails today.** A user searching for a package covering Agra + Delhi + Mathura finds nothing:

- `PackagesPage.tsx` renders from the 6-item `packages` array. `mathura-vrindavan` exists but is a
  Mathura/Vrindavan day trip — there is no multi-city Delhi–Mathura–Agra package object.
- There is **no destination/city search or filter** on the Packages page at all — no matching by
  constituent city.
- The manifest contains hundreds of Delhi↔Mathura and Agra↔Mathura entries (e.g.
  `a-f-palam-delhi-to-mathura-taxi`) but these are **point-to-point taxi routes, not packages**, and
  none of them are reachable by URL.

### 5.2 `data/parity.ts` will actively block the fix

```ts
if (routes.length !== 8)   throw new Error("Catalogue parity failed: expected eight routes.");
if (packages.length !== 6) throw new Error("Catalogue parity failed: expected six packages.");
```

These are hard `throw`s asserting the *smallness* of the dataset. Expanding coverage crashes the app
until this file is rewritten to assert **invariants** (positive fares, unique slugs, required fields)
rather than **cardinality**.

### 5.3 Manifest data quality

Many entries have `km: 0` (e.g. `delhi-location-to-agra-taxi`, and all 9 `tour` entries). In E3,
`billableKm = Math.max(0 * 2, 300) = 300`, so every zero-km group-vehicle quote silently collapses to
the 300 km floor. Several entries are not routes at all —
`5-layers-of-safety-measures-taken-during-ride` and
`10-iconic-attractions-and-places-to-visit-in-delhi` are blog/marketing pages that were scraped into
the route table with `o: "General", d: "General"` and zero fares.

---

## 6. Booking flow wiring — pricing integrity

✅ **Better than expected. The backend is already server-authoritative.**

- `react/src/services/api.ts:23–38` — `CreateDraftBookingPayload` contains **no price field and no
  `distanceKm`**, with an explicit comment: *"distanceKm removed (SEC-005) — server derives from
  originName/destinationName"*.
- `booking.service.ts:42–43` — server calls `findRoute()` itself and uses `serverRoute.km`, ignoring
  any client value.
- `booking.service.ts:45` — recomputes the fare via `calculateFare` and stores an immutable
  `fareSnapshot` (`:133`).
- `booking.service.ts:110` — persists `tripType: fare.tripType`, i.e. the **effective** trip type. So
  a one-way Force booking **is already stored as `round-trip`**. ✅ (Spec test #10 already passes.)
- `fare.engine.ts:371–379` — `ignoreClientMoney()` helper strips money fields defensively.

🐞 **The remaining integrity problem is display, not persistence.** The customer is shown a number
from E2 and charged a number from E1, and those differ. Worked example, Force Urbania, Agra→Delhi,
one-way selected:

| | Shown to customer (E2 `calcFare`) | Actually charged (E1, on submit) | Gap |
|---|---|---|---|
| Trip type | one-way | **round-trip** | forced, unannounced |
| Total | **₹14,000** | **₹16,140** | **+₹2,140 (+15.3%)** |

E2 has no exception branch whatsoever: `calcFare` reads `route.fares[vehicle.id]` and, for
`tripType: "one-way"`, returns it unchanged. The customer sees ₹14,000 on the booking page, submits,
and the draft comes back at ₹16,140. For Agra→Mathura the gap is ₹8,000 shown vs ₹10,700 charged
(**+33.8%**). This is a bait-and-switch surface and the single highest-priority defect in this audit.

There is also **no `POST /api/v1/fares/calculate` call anywhere in `react/src`** — the endpoint exists
and is rate-limited (`fare.routes.ts:10`) but the customer site never calls it. This confirms the
tracker line *"Fares and booking run on the local engine (mock, no server calls)."*

---

## 7. ⚠️ Open questions for the client (do not guess)

Per the working agreement, these are blocking ambiguities, not invented answers:

1. **Do Force Tempo / Force Urbania hires for LOCAL sightseeing (8hr/80km, 12hr/120km) and AIRPORT
   TRANSFERS also get forced to round-trip + 300 km?** Current code says no. Literal reading of R2
   says yes. Charging ₹10,700 for an airport pickup would be commercially absurd, so I believe "no" is
   correct — **but it must be confirmed**, because it is the difference between ₹3,800 and ₹10,700.
2. **Do Force vehicles on TOUR PACKAGES get the exception?** Currently no (flat `+₹5,500` upgrade).
   Likely a bug.
3. **Which number wins for exception vehicles — the fixed rate card (₹14,000) or per-km (₹15,640)?**
   R1 says fixed table. The code does per-km. `CLIENT_CONFIRMATION_FARES_AND_RULES.md` holds fixed
   numbers. I will implement **fixed-table-first with per-km as fallback for uncatalogued routes**
   unless told otherwise, since that is what R1 literally specifies.
4. **Night allowance window: 22:00–05:00 (backend) or 20:00–06:00 (frontend)?**

---

## 8. Performance & SEO baseline

Measured from `npm run customer:build` on this commit.

| Asset | Raw | Gzip |
|-------|-----|------|
| `index-*.js` (main) | 248.70 kB | **74.91 kB** |
| `vendor-react-*.js` | 192.35 kB | 60.29 kB |
| `index-*.css` | 335.87 kB | **49.74 kB** |
| `BookingPage` | 58.03 kB | 10.34 kB |
| `PackageDetailPage` | 45.19 kB | 11.81 kB |
| Total prerendered output | 2.37 MB (37 pages) | |

### Render-blocking / CWV hazards

- 🐞 **`InitialLoader`** (`components/ui/InitialLoader.tsx`, mounted `HomePage.tsx:143`) — full-screen
  white overlay that counts 0→100 over a **hardcoded 2,200 ms** and sets
  `document.body.style.overflow = "hidden"` (`:35`). This *deliberately delays LCP by 2.2 seconds* on
  first visit and blocks scroll. Worst single offender.
- 🐞 **`PageLoader`** (`components/chrome/PageLoader.tsx`, mounted `SiteLayout.tsx:12`) — applies on
  **every** page, not just home.
- 🐞 **`SmoothScrollHero`** (`HomePage.tsx:148`) — scroll-hijacking hero, gated once-per-session via
  `sessionStorage`. Its LCP images are **external Unsplash hotlinks**
  (`images.unsplash.com/photo-1564507592333...&w=2400&q=85`) — a 2400px-wide cross-origin image on the
  critical path, with no `preload`, no local hosting, no modern-format negotiation. This contradicts
  the M11 tracker entry claiming all external image URLs were eradicated.
- `framer-motion` v13 is imported by 5 modules (`HomePage`, `smooth-scroll-hero`, `apple-hello-effect`,
  `text-loop`, `BrandLogo`) and `motion` is a **second copy of the same library** in
  `react/package.json:20,22`. Removing the three animation components leaves only `BrandLogo` and
  `text-loop` — both are candidates for CSS-only replacement, which would drop the dependency entirely.
- `components/ui/demo.tsx` is a **dead 21st.dev demo harness** importing `PortfolioScrollGrid`,
  `AppleHelloEnglishEffect` and `TextLoop`. It is not routed anywhere.

### SEO gaps

- 🐞 **`sitemap.xml` contains 32 URLs** while the manifest holds **982 routes**. ~97% of our commercial
  long-tail inventory is not in the sitemap and has no page to point at.
- Route detail pages are prerendered for only **8 slugs** (`prerender.ts:97–119`); package pages for 6.
- `robots.txt` points at `https://agraskbagheltourandtravels.com/sitemap.xml`, but
  `services/api.ts:17` defaults the API to `https://api.skbagheltravels.in` and `PackagesPage.tsx:257`
  emits JSON-LD with `https://skbagheltravels.in/en/packages/`. **Three different domains** across
  canonical/schema/API config — needs reconciliation before launch.
- JSON-LD exists on Home and Packages (`ItemList`, schema graph) — good — but there is no
  `Product`/`Offer` markup per package, and no `FAQPage` on `FaqPage.tsx`.
- CSS is a single 335 kB bundle with no critical-CSS split.

---

## 9. Summary

### ✅ Implemented (working, keep)
- Forced round-trip for Force Tempo / Force Urbania on outstation routes (R2).
- 300 km/day minimum on outstation routes for both exception vehicles (R4).
- Both-leg billing and A→B / B→A symmetry (R3).
- Promo/discount refusal for exception vehicles.
- Tempo and Urbania are genuinely distinct vehicles with distinct totals.
- Server-authoritative booking: no client price accepted, distance derived server-side, immutable
  `fareSnapshot`, effective `tripType` persisted.
- 61 backend tests green; SSG pipeline, manifest builder, and sitemap generator all functional.

### ⚠️ Partially implemented (needs completion)
- **R1 fixed pricing** — vehicles are separate but priced by per-km formula, not the fixed rate card.
- **R5 transparency** — data exists only as untyped strings in `rules[]`; no UI notice.
- **Vehicle classification** — works by substring-match ordering rather than an explicit property.
- **Manifest coverage** — 982 routes compiled and shipped, but reachable only through one autocomplete.

### ❌ Missing
- Any exception logic in the customer-facing fare engine (`react/src/fares.ts`).
- Any call from the frontend to `POST /api/v1/fares/calculate`.
- Package/tour search, city filters, and multi-city discoverability (Delhi–Mathura–Agra).
- Pages, links, and sitemap entries for 974 of 982 routes.
- Typed exception flags in the API response contract.
- Tests for: Tempo-vs-Urbania price inequality, package/local/airport exception paths, client-tamper,
  and frontend↔backend parity.

### 🐞 Incorrect (bugs)
1. **Display/charge mismatch** — customer shown ₹14,000, charged ₹16,140 on Force Urbania Agra→Delhi
   (+15.3%); ₹8,000 → ₹10,700 on Agra→Mathura (+33.8%). *Highest priority.*
2. **Dead 300 km floor on the frontend** — `Math.max(a, Math.min(b, a))` always returns `a`
   (`fares.ts:377`).
3. **Exception strategy ignores the fixed rate card** — `route.fares[vehicleId]` never read in
   `GroupCommercialVehicleStrategy`.
4. **Tour packages bypass the exception** — Force vehicle on a package stays one-way.
5. **Three different per-km rate sets** (backend 25/34 vs manifest 17–22/25–30).
6. **Two different night windows** (22–05 vs 20–06).
7. **`data/parity.ts` hard-asserts 8 routes / 6 packages**, blocking data expansion.
8. **2.2 s artificial LCP delay** from `InitialLoader` + scroll lock.
9. **External 2400px Unsplash hotlink as the hero LCP image.**
10. **Sitemap covers 3% of inventory.**
11. **Three conflicting production domains** in canonical / JSON-LD / API base URL.
12. **Duplicate animation dependency** (`framer-motion` **and** `motion`, same version).

---

## 10. Required changes (execution order for Phases 2–5)

**Phase 2 — pricing correctness**
1. Introduce `pricingClass: "standard" | "fixed-round-trip"` as an explicit property on the vehicle
   record; retire `includes("force")` substring matching. Add `force-tempo`/`force-urbania` aliases to
   a resolver, not to the engine.
2. Rewrite `GroupCommercialVehicleStrategy` to be **fixed-table-first**: use
   `route.fares[vehicleId] × 2` where a catalogued fare exists, fall back to `billableKm × perKm` for
   uncatalogued routes, then apply `max(…, 300 km-day floor)`. *(Pending answer to Q3.)*
3. Route the package path (and, pending Q1/Q2, local/airport paths) through the strategy dispatcher.
4. Add typed fields to `FareResponseSchema`: `forcedRoundTrip: boolean`, `appliedMinKm: number | null`,
   `billedKm: number`, `pricingClass: string`.
5. Reconcile the night-allowance window to one value.
6. Delete the calculator body of `react/src/fares.ts`; replace with a thin client that calls
   `/api/v1/fares/calculate` and formats the response. Collapse `InstantRouteCalculator`'s inline
   billing onto the same shared rule module.
7. Generate `react/src/data.ts` route/fare tables from the same rate-card source as the backend
   catalogue, so the copy-paste duplication cannot recur.

**Phase 3 — tests:** all 12 cases from the brief, plus a golden-file snapshot of current *correct*
standard-vehicle output taken **before** any change, plus the CI parity gate.

**Phase 4 — data:** rewrite `parity.ts` to invariant assertions; expand Packages/Tours to the full
dataset with city-level search and filters; clean non-route rows and `km: 0` entries out of the
manifest; generate route/package detail pages and sitemap entries for the full inventory.

**Phase 5 — perf/SEO:** delete `InitialLoader`, `PageLoader`, `SmoothScrollHero`,
`PortfolioScrollGrid`, `AppleHelloEffect`, `demo.tsx`; drop the duplicate `motion` package and, if
possible, `framer-motion` entirely; self-host and right-size the hero image with `preload`; unify the
production domain; add per-package `Product`/`Offer` and `FAQPage` JSON-LD; regenerate the full
sitemap; re-measure and report deltas.
