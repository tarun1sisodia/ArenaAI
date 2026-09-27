# Rewritten Prompt — Full-Stack Audit & Fix (SK Baghel Tour & Travels)

> Copy this back to me when you're ready and I'll start executing it.
> Scope note: the AI recommendation agent is **explicitly out of scope for now** — it is Phase 6, to be
> started only after Phases 0–5 are signed off.

---

## DECIDED ARCHITECTURE — Server-Authoritative Fares, Client-Cached Display

This is settled; implement it, don't re-litigate it.

**Two different jobs, two different mechanisms:**

| Job | Mechanism | Why |
|-----|-----------|-----|
| **Browsing / display** — route pages, package cards, instant calculator, SEO-indexed prices | `react/public/routes-manifest.json` (982 routes, ~12 KB gzipped) loaded in-memory on the client | 0 ms, no API round trip, prerenderable into static HTML so Google indexes real prices. Labelled **indicative**. |
| **Booking / payment** — the number the customer actually pays | Backend fare engine only, via `POST /api/v1/fares/quote` | Money must never be computed by, or trusted from, the client. |

**Rules that make this safe:**

1. **The client never sends a price.** It sends origin, destination, date/time, trip type, vehicle,
   passenger count. The server computes the fare, returns a `quoteId` with a short TTL, and the booking
   request references that `quoteId`. The server re-validates on booking creation. Any price field
   arriving from the client is ignored, and logged as a tamper signal.
2. **One rate card, two build outputs.** The CSV / rate card is the single source of truth. One build
   step generates *both* the frontend manifest *and* the backend catalogue/seed. Neither is hand-edited.
   This is the fix for the current situation where `react/src/fares.ts` and
   `backend/src/modules/fares/` are two independent engines that can silently disagree.
3. **A CI parity test.** For a sample of routes × vehicles × trip types, assert
   `manifest-derived display price === server quote`. If they drift, the build fails. This is what lets
   us safely show a price before the API responds.
4. **Delete the client-side pricing engine.** `react/src/fares.ts` stops being a calculator. It becomes
   a thin display formatter over manifest data plus the server quote. The tracker currently says
   *"Fares and booking run on the local engine (mock, no server calls)"* — that must become false.
5. **Graceful UX.** Show the indicative manifest price instantly; fetch the authoritative quote in the
   background; if it differs, show the server number with a clear "final fare" label before payment.
   For Force Tempo / Force Urbania the indicative price must **already** be the round-trip 300 km
   number, so the customer never sees a cheap one-way figure that later doubles.

So: **yes, the backend needs its own fare engine and it is the only one that counts** — but no, the
frontend does not wait on the API to render prices, because it ships with the same data baked in.

---

## 0. Context

Monorepo `tarun1sisodia/ArenaAI`:

- `react/` — customer-facing site (Vite + React 19 + TypeScript)
- `admin/` — operations desk
- `backend/` — API (modules: `fares`, `bookings`, `catalog`, `locations`, `payments`, `inquiries`, `reviews`, `notifications`, `admin`)

Business: outstation + local taxi service (Agra hub). Three booking modes must work end to end:
**one-way**, **round-trip**, **local taxi (hourly/km packages)** — plus **tour packages**.

---

## Phase 1 — Report Before You Change Anything (deliverable: `AUDIT_2026.md`)

Produce a written audit **before** writing any production code. It must answer, with file paths and
line numbers:

1. **Where is pricing calculated?** Enumerate every location that computes a fare — backend engine,
   frontend engine, any duplicated constants, any hardcoded prices in components, admin overrides,
   and DB seed/migration data.
2. **Is there a single source of truth?** Explicitly state whether `react/` recomputes fares locally
   instead of calling the backend, and where the two implementations diverge (rates, rounding,
   allowances, minimums, promo handling).
3. **Special-vehicle handling.** For `Force`, `Force Urbania`, and `Force Tempo Traveller`
   (aka Urbanian / Urbanian Tempo in the client's wording) state whether they are:
   - identified as a distinct pricing class (and by what matching logic — exact ID, substring, tier?),
   - forced to round-trip pricing,
   - subject to a minimum-km floor,
   - priced from a fixed/locked table rather than dynamic per-km,
   - excluded from promos/discounts/surge.
4. **Is `Force` distinct from `Force Urbania`?** The client requires **two separate vehicles with two
   separate price lists**. Report whether the code currently collapses them into one internal ID
   (e.g. everything matching `force` mapping to a single `urbania` tier) and what that breaks.
5. **Data coverage.** Do the Routes and Packages pages render the *complete* dataset we maintain
   (CSV/catalogue/DB), or a hardcoded subset? Can a user searching a multi-city package such as
   **Delhi – Mathura – Agra** actually find it today? Report the gap precisely.
6. **Booking flow wiring.** Does the frontend booking flow post the *server-calculated* quote, or does
   it send a client-computed price the backend trusts? Flag this as a pricing-integrity/security issue
   if so.
7. **Performance / SEO baseline.** Current bundle size, render-blocking work, the loader and scroll
   animations in place, missing meta/structured data, sitemap/robots state.

Summarise as four lists: **Implemented ✅ / Partially implemented ⚠️ / Missing ❌ / Incorrect 🐞**,
each item with the required fix. Wait for nothing — write the report, then proceed to Phase 2.

---

## Phase 2 — Pricing Rules (the core correctness work)

### 2.1 Standard vehicles (Sedan, Ertiga, Innova Crysta, and any future normal cab)

Behaviour must remain **unchanged**. One-way = catalogue one-way rate. Round-trip = existing
same-day multiplier / per-day km-floor logic. Local = hourly-km packages. Promos still allowed.
Any regression here is a bug.

### 2.2 Exception vehicles — exactly TWO: `Force Tempo Traveller` and `Force Urbania`

There are **only two** exception vehicles. There is no third "Urbanian Tempo" SKU — earlier wording
("Force", "Urbanian", "Urbanian Tempo") referred to these same two. They are **two distinct vehicles
with two distinct fixed price lists**: same *rules*, never the same *numbers*.

| # | Rule | Definition |
|---|------|-----------|
| R1 | **Separate fixed pricing** | Each has its own fixed/locked rate table. No dynamic surge, no promo codes, no percentage discounts. Rates come from configuration/DB, never inline in components. Force Tempo and Force Urbania must never resolve to the same price for the same route. |
| R2 | **Forced round trip** | If the customer selects **one-way**, the booking is still **priced and recorded as a round trip**. Mandatory and unconditional, for both vehicles. |
| R3 | **Both-legs pricing** | The fixed round-trip logic applies to *both* legs — outbound and return are both billable, in both directions of any route pair. |
| R4 | **300 km minimum — mandatory for both** | Minimum billable distance is **300 km per day** for Force Tempo and Force Urbania, always. Billable distance = `max(2 × one-way km, 300 × days)`. Where actual round-trip distance exceeds the floor, actual distance wins. The floor is never waived, never configurable off. |
| R5 | **Transparency** | The quote returned to the UI must carry machine-readable flags (e.g. `forcedRoundTrip: true`, `appliedMinKm: 300`, `billedKm`, `pricingClass`) so the frontend can display *"This vehicle is always charged as a round trip, minimum 300 km"* to the customer before payment. No silent price surprises. |

### 2.3 Implementation constraints

- **One engine, one source of truth.** The backend fare engine is authoritative. The frontend must
  either call it or import a shared, identical module — delete/redirect the duplicated client-side
  pricing so the two can never drift again.
- **Configuration over conditionals.** Vehicle pricing class should be a property of the vehicle
  record (`pricingClass: "standard" | "fixed-round-trip"`), not a chain of `name.includes("force")`
  string matching. Substring matching on names is fragile — a vehicle called "Force Traveller" or a
  future "Urbania Lux" must be classifiable without editing the engine.
- Rounding, driver allowance, and night allowance rules must be stated once and reused.

---

## Phase 3 — Tests (required, not optional)

Add automated tests (backend unit + integration; frontend where the quote is displayed) covering:

1. `Force Tempo` one-way request → returns round-trip pricing, `forcedRoundTrip: true`.
2. `Force Urbania` one-way request → same rule, **different amount** than Force Tempo for the identical route.
3. `Force Tempo` vs `Force Urbania` on the same route → prices must not be equal (guards against the
   collapsed-tier bug where both map to one internal `urbania` id).
4. Minimum-km floor: short route (e.g. 60 km one-way = 120 km round trip) → billed at **300 km**, both
   vehicles, both directions.
5. Long route where actual round-trip km > 300 (e.g. 230 km one-way = 460 km) → actual 460 km billed,
   floor does not cap it.
6. Both directions of a route pair (A→B and B→A) produce symmetric exception pricing.
7. Promo/discount code applied to an exception vehicle → rejected, price unchanged.
8. Multi-day round trip → per-day allowance and per-day km floor applied correctly.
9. **Regression:** Sedan / Ertiga / Innova one-way stays one-way and is unchanged vs. current output
   (golden-file / snapshot the current correct values first).
10. Booking persistence: a booking created from a one-way Force request is stored with
    `tripType = round-trip` so ops and invoicing see the truth.

---

11. **Tamper test:** a booking request carrying a client-supplied `price`/`total` field → server ignores
    it and prices from its own engine.
12. **Parity test:** manifest-derived display price === server quote, across a sample of routes ×
    vehicles × trip types (this is the CI gate from the architecture section).

---

## Phase 4 — Data Completeness: Routes, Packages, Tours

**Known state to work from (verify in Phase 1):** `react/public/routes-manifest.json` holds **982
routes** — 385 `oneway`, 462 `day120`, 92 `tempo`, 34 `custom`, **9 `tour`**. Meanwhile
`react/src/data/catalogue.ts` is asserted by `data/parity.ts` to contain exactly **8 routes and 6
packages**, and `PackagesPage.tsx` renders from that small catalogue. So the site is currently
surfacing a handful of items while we hold nearly a thousand. Closing that gap is the point of this
phase. Also note `InstantRouteCalculator.tsx` already supports tempo/urbania tiers off the manifest's
`ft`/`fu` per-km fields — confirm those produce the forced-round-trip / 300 km numbers, not raw per-km.

- The **Packages** and **Tours** pages must render **all** packages in our dataset, not a curated subset.
- Multi-city packages must be discoverable by any constituent city: searching *Agra*, *Delhi*, or
  *Mathura* must surface a Delhi–Mathura–Agra package.
- Implement **search + filters** (city/destination, trip type, duration/days, vehicle, price range)
  and a sensible default sort.
- Each package/route needs a real detail page with the actual itinerary, inclusions, per-vehicle
  pricing (including the Force/Urbania exception notice), and a working CTA into the booking flow.
- Local taxi: show the actual hourly/km packages (e.g. 4h/40km, 8h/80km) with correct per-vehicle rates.
- Routes and packages must be served from **our maintained data** (`react/new_design/all_routes_and_prices.csv`,
  catalogue, DB seed) — reconcile these sources and state which one wins.

---

## Phase 5 — Performance, SEO, and Animation Removal

**Remove (they hurt LCP/INP and SEO):**

- `react/src/components/ui/InitialLoader.tsx` (mounted in `HomePage`)
- `react/src/components/chrome/PageLoader.tsx` (mounted in `SiteLayout`)
- The homepage scroll animation: `smooth-scroll-hero.tsx`, plus `portfolio-scroll-grid.tsx`,
  `apple-hello-effect.tsx`, and `components/ui/demo.tsx` if unused

Delete the components and their dependencies (drop `framer-motion`/`lenis`-style libs from
`package.json` if nothing else uses them), don't just hide them. Replace any genuinely needed
loading state with lightweight skeletons or plain SSR/prerendered content — no full-screen blocking
overlay, no JS-driven scroll hijacking.

**SEO/performance work:**

- Unique `<title>`, meta description, canonical, and OG/Twitter tags per route — including every
  dynamically generated route and package page.
- JSON-LD structured data: `TravelAgency`/`LocalBusiness`, `Product`/`Offer` for packages,
  `BreadcrumbList`, `FAQPage` where applicable.
- Regenerate `sitemap.xml` (via the existing `react/scripts/generate-sitemap.ts`) to include **all**
  route and package URLs; verify `robots.txt`.
- Semantic headings (one `h1` per page), descriptive internal links, meaningful alt text.
- Images: correct dimensions, `loading="lazy"` below the fold, modern formats, preload the LCP image.
- Code-split routes, trim unused JS/CSS, verify the prerender pipeline covers the new pages.
- Report before/after Lighthouse-style numbers (bundle size, LCP, CLS, TBT) as evidence.

---

## Phase 6 — AI Trip Assistant (DO NOT BUILD YET)

Deliver a **written design proposal only**. A conversational agent that asks the customer for trip
type (one-way / round-trip / local taxi), origin, destination(s), date & time, passenger count,
luggage, and budget, then recommends matching packages/routes/vehicles and hands off a prefilled
booking. Cover: data grounding on our catalogue, the Force/Urbania round-trip rule being enforced by
the same engine (never by the model), fallback to manual search, cost/latency, and abuse limits.
Build only after Phases 1–5 are approved.

---

## Working Agreement

- Work on branch `arena/01a0e0fa-arenaai`; commit in logical, reviewable chunks.
- Respect the repo's existing rule docs: `AGENTS.md`, `FRONTEND_RULES.md`, `BACKEND_RULES.md`,
  `DESIGN_LOCKS.md`, `ANIMATION_RULES.md`, `CLIENT_CONFIRMATION_FARES_AND_RULES.md`.
- Never invent a fare. If the confirmed rate card is ambiguous or contradicts the code, stop and list
  the exact question rather than guessing a number.
- Every phase ends with `npm run typecheck` + `npm test` green and a short summary of what changed.
- Run the site locally and verify the three booking modes actually work against the backend before
  declaring done.
