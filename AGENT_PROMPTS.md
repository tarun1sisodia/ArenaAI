# Agent Prompts — One Feature at a Time

Each block below is a **self-contained prompt**. Copy one, give it to an agent, let it finish, test it,
then move to the next. Do not run two at once — F1 changes data that F3–F6 depend on.

**Order:** F1 → F2 → F3 → (test bookings) → F4 → F5 → F6 → F7 → F8

**Rules that apply to every prompt** (paste with each one):

> - Repo: `tarun1sisodia/ArenaAI`. Work on branch `arena/01a0e0fa-arenaai` only.
> - Monorepo: `react/` (customer site), `admin/` (ops), `backend/` (Fastify API).
> - Business rule, the only special case: **Force Tempo Traveller and Force Urbania are always charged
>   as a round trip. There is NO minimum-kilometre rule.** Every other vehicle prices normally.
> - Never invent a fare. If a price is missing or ambiguous, stop and ask.
> - Backend is the only authority on price. The client never computes or sends money.
> - Finish with `npm run typecheck` and `npm test` green. Commit in small, reviewable chunks.
> - Do not add new animation libraries or loading overlays.
> - Keep it simple. Prefer deleting code over adding abstraction.

---

## F1 — One price source

**Problem.** Prices live in three places that disagree: `backend/src/modules/fares/fare.catalogue.ts`,
a hand-copied duplicate in `react/src/data.ts:209+`, and `react/public/routes-manifest.json` built from
`react/new_design/all_routes_and_prices.csv`. Backend charges ₹25/km for Tempo and ₹34/km for Urbania;
the manifest says ₹17–22 and ₹25–30. `react/src/data/parity.ts` hard-throws if the catalogue is not
exactly 8 routes and 6 packages, which blocks all growth.

**Do this.**
1. Make the **backend catalog the single source of truth** for routes, packages and vehicle rates.
2. Write one build script that reads the backend catalog and emits both:
   - `react/public/routes-manifest.json` (the compressed browse/display file), and
   - whatever typed data `react/src` needs — replacing the hand-maintained tables in `react/src/data.ts`.
3. Keep `all_routes_and_prices.csv` as the **seed input into the backend**, not as a parallel source.
   Import it into the catalog once, then stop reading it at frontend build time.
4. Clean the data during import: drop rows that are not routes (e.g.
   `5-layers-of-safety-measures-taken-during-ride`, `10-iconic-attractions-...`), and either fill or
   flag rows with `km: 0`.
5. Rewrite `react/src/data/parity.ts` to assert **invariants, not counts**: every route has a positive
   fare for all 5 vehicles, unique slugs, non-empty origin/destination, valid pricing model.

**Done when.**
- Grepping for a per-km rate finds it in exactly one file.
- The manifest and the backend produce the same price for the same route + vehicle.
- Adding a route to the catalog changes the site after a rebuild, with no hand edits.
- `parity.ts` passes with the full dataset, and fails if a route has a zero fare.

**Do not.** Do not delete the CSV. Do not change any actual price during this refactor — this is a
plumbing change; prices must be byte-identical before and after for the 8 existing routes.

---

## F2 — Fix the Force rule

**Problem.** `backend/src/modules/fares/fare.strategy.ts` → `GroupCommercialVehicleStrategy` forces
round trip correctly, but it also applies a **300 km/day minimum that must not exist**
(`billableDistance = max(roundTripKm, 300 * days)`, lines ~118–120). Separately, the rule is skipped
entirely on three code paths in `fare.engine.ts`: tour packages (~line 200), local tour (~219) and
airport transfer (~241) all `return` before the strategy runs.

**Do this.**
1. **Remove the 300 km minimum** for Force Tempo and Force Urbania. Billable distance is simply the
   round-trip distance (`one-way × 2`). Delete `minKmFloor` from this strategy and the
   `min-km-floor:` rule string.
2. Keep: forced round trip, both legs billed, ₹500/day driver allowance, no promo codes.
3. Make the round-trip rule apply on the **tour package** path too — a Force vehicle on a package must
   still be round trip.
4. For **local tour** and **airport transfer**, apply the rule as well unless the price is a fixed
   package rate; if you believe forcing round trip on a 20 km airport pickup is wrong, **stop and ask**
   rather than deciding.
5. Replace substring matching (`clean.includes("force")` in `fare.catalogue.ts:204–235`) with an
   explicit flag on the vehicle record, e.g. `alwaysRoundTrip: true`. A bare `"force"` currently
   resolves to Urbania, which is a bug.
6. Add typed fields to the fare response (`fare.schema.ts` → `FareResponseSchema`):
   `alwaysRoundTrip: boolean` and `billedKm: number`. The UI needs these in F3.

**Done when.** These tests pass:
- Force Tempo one-way → returns `round-trip`.
- Force Urbania one-way → returns `round-trip`, different total from Force Tempo.
- Force Urbania on a **55 km** route → billed **110 km**, *not* 300. (Today it wrongly bills 300.)
- Force vehicle on a tour package → round trip.
- Sedan / Ertiga / Innova one-way → unchanged from today's values (snapshot them first).
- Promo code on a Force vehicle → rejected.

**Do not.** Do not change prices for any non-Force vehicle. Do not reintroduce a km floor anywhere.

---

## F3 — Frontend shows the backend's price

**Problem.** The customer is shown one price and charged another. `react/src/fares.ts` `calcFare()`
runs a second fare engine in the browser with **no Force rule at all**, so Force Urbania Agra→Delhi
displays **₹14,000** while the server charges **₹16,140**. A third copy of the logic is inlined in
`react/src/components/routes/InstantRouteCalculator.tsx:124–151`. Nothing in `react/src` ever calls
`POST /api/v1/fares/calculate`.

**Do this.**
1. Delete the calculation body of `react/src/fares.ts`. Keep only formatting helpers (`formatInr`,
   `advanceOf` display, etc.). `features/booking/fareEngine.ts` becomes a thin re-export.
2. In the booking flow, call `POST /api/v1/fares/calculate` and display **only** what it returns.
3. For instant browse-time display (Routes page, cards, `InstantRouteCalculator`), keep using the
   manifest — but label it clearly as indicative, and make it use the **same shared rule module** as
   the backend so the numbers agree. Remove the hand-rolled inline maths from
   `InstantRouteCalculator`.
4. When a customer picks Force Tempo or Force Urbania, show a plain sentence before payment:
   *"This vehicle is always booked as a round trip."* Drive it off the `alwaysRoundTrip` flag from F2,
   not off a hardcoded vehicle name.
5. If the displayed indicative price and the server quote differ, show the **server** price and label
   it final.

**Done when.**
- Searching the codebase finds no fare arithmetic in `react/src` — only display of API values.
- For 20 sampled route × vehicle × trip-type combinations, the price on screen equals the price in the
  booking record.
- Selecting a Force vehicle with "one-way" shows the round-trip notice and the round-trip price
  *before* the pay button.

**Do not.** Do not send any price, total or distance from the browser to the API.

**After F3, test manually:** book one-way, round trip, local taxi and a tour package end to end and
confirm each is recorded correctly.

---

## F4 — Admin CRUD regenerates the manifest

**Problem.** Admin can create, edit, publish and archive catalog items
(`POST/PATCH /api/v1/ops/admin/catalog`), but the customer site reads static files built from a CSV at
build time. **Nothing an admin does ever reaches the website.**

**Do this.**
1. Add a manifest-regeneration step that runs whenever catalog data changes: on create, update,
   publish and archive.
2. Simplest approach that satisfies "frontend changes as per admin": have the backend serve the
   manifest from a cached endpoint (e.g. `GET /api/v1/catalog/manifest`) that rebuilds when the catalog
   version changes, and have the frontend fetch it with a long cache plus a version key. Keep the
   static file as the offline/prerender fallback.
3. Give the manifest a `version` or `updatedAt` so the client can cache hard and refresh only on change.
4. Add an admin button: **"Republish site data"**, showing the last regeneration time.
5. Make sure newly published items also reach the sitemap (coordinate with F8).

**Done when.** An admin creates a package in the admin panel, clicks publish, and it appears on the
customer Packages page — with a correct price and a working booking link — without a code deploy.

**Do not.** Do not let the manifest endpoint return unpublished or archived items.

---

## F5 — Routes page: full inventory

**Problem.** `RoutesPage.tsx` has working pagination (`:445–471`) but paginates only **8** routes.
We hold **982**. Only 8 route detail pages exist.

**Do this.**
1. Point the existing pagination at the full route dataset from F1/F4.
2. Add a simple search box (origin/destination text match) and a corridor/region filter. Keep the
   existing pagination component — do not rebuild it.
3. Generate a detail page for every route, prerendered for SEO, with: distance, duration, per-vehicle
   prices, the Force round-trip note, and a booking CTA that preselects the route.
4. Standardise the booking deep link — the code currently mixes `/book?from=&to=` and
   `/book.html?package=&step=1`. Pick one.
5. Watch build time and page weight with ~1,000 pages; if prerendering all of them is too slow,
   prerender the top routes and serve the long tail dynamically, but keep them all in the sitemap.

**Done when.** A customer can page through every route we sell, search it, open its page, and book it.

---

## F6 — Packages page: all packages + city search

**Problem.** Renders 6 packages and says "All Packages (6)". There is no search or filter, so a
customer looking for a package covering **Agra + Delhi + Mathura** cannot find one.

**Do this.**
1. Render every package from the catalog, with the same pagination component as F5.
2. Add search and filters: by city/destination covered, duration/days, and price range.
3. Index each package by **every city it covers**, so searching any one of Agra, Delhi or Mathura
   surfaces a Delhi–Mathura–Agra package. This needs a `cities: string[]` field on the package record —
   add it in the catalog, do not parse it out of the description text.
4. Make local taxi a first-class option in the main trip search (alongside one-way and round trip),
   listing the 8h/80km and 12h/120km packages.
5. Every package gets a detail page with itinerary, inclusions, per-vehicle prices and a booking CTA.

**Done when.** Searching "Mathura" returns every package that touches Mathura, and each result books
successfully.

---

## F7 — Remove animations, fix LCP

**Problem.** `InitialLoader` blocks first paint for a hardcoded **2,200 ms** and sets
`document.body.style.overflow = "hidden"`. `PageLoader` runs on every page. `SmoothScrollHero`
hijacks scroll and loads a **2400px external Unsplash image** on the LCP path. `framer-motion` and
`motion` are both installed at the same version.

**Do this.**
1. Delete these files and every usage:
   - `react/src/components/ui/InitialLoader.tsx` (used in `HomePage.tsx:143`)
   - `react/src/components/chrome/PageLoader.tsx` (used in `SiteLayout.tsx:12`)
   - `react/src/components/ui/smooth-scroll-hero.tsx` (used in `HomePage.tsx:148`)
   - `react/src/components/ui/portfolio-scroll-grid.tsx`, `apple-hello-effect.tsx`, `demo.tsx` (dead)
2. Replace the animated hero with a plain static hero. Self-host the image, generate responsive WebP
   sizes into `react/public/assets/hero/`, and `<link rel="preload">` the LCP image.
3. Remove the duplicate `motion` package. Then check the two remaining `framer-motion` users
   (`BrandLogo.tsx`, `text-loop.tsx`) — if they can be CSS, drop `framer-motion` entirely.
4. Any genuinely needed loading state becomes a lightweight skeleton. No full-screen overlay, no
   scroll locking.

**Done when.** No JS blocks first paint, no scroll hijacking, the hero image is local and preloaded,
and you report bundle size before vs after.

**Do not.** Do not merely hide these components behind a flag — delete them.

---

## F8 — SEO completion

**Problem.** `sitemap.xml` has **32 URLs** for a site with 982 routes. Two domains are in use:
`agraskbagheltourandtravels.com` (sitemap, robots) and `skbagheltravels.in` (12 places in app code,
plus `api.skbagheltravels.in`). `/en/` prerenders as `<title>Redirecting…</title>` with no `h1`. No
per-package `Product`/`Offer` markup, no `FAQPage`.

**Do this.**
1. **Pick one production domain** — ask the owner first — and make canonical tags, JSON-LD, sitemap,
   robots and the API base URL all agree.
2. Regenerate `sitemap.xml` via `react/scripts/generate-sitemap.ts` to include every route and package
   page from F5/F6. Split into a sitemap index if it exceeds 50,000 URLs (it will not, but keep it tidy).
3. Fix `/en/` — it must be a real indexable page with a proper `<title>` and one `h1`, not a redirect
   stub.
4. Add structured data: `LocalBusiness`/`TravelAgency` sitewide, `Product` + `Offer` per package and
   per route (with the correct price and INR currency), `BreadcrumbList`, and `FAQPage` on the FAQ page.
5. Confirm one `h1` per page, descriptive internal links between related routes and packages, and alt
   text on every image.
6. Run Lighthouse on home, a route page, a package page and the booking page. Report before/after for
   LCP, CLS, TBT and the SEO score.

**Done when.** The sitemap covers everything we sell, one domain is used everywhere, structured data
validates in Google's Rich Results test, and Lighthouse SEO is 100 on all four page types.

---

## Testing checklist (run after F3, and again at the end)

| Trip type | One-way | Round trip | Local taxi | Package |
|-----------|---------|------------|------------|---------|
| Sedan | ☐ | ☐ | ☐ | ☐ |
| Ertiga | ☐ | ☐ | ☐ | ☐ |
| Innova Crysta | ☐ | ☐ | ☐ | ☐ |
| Force Tempo Traveller | ☐ *(must become round trip)* | ☐ | ☐ | ☐ |
| Force Urbania | ☐ *(must become round trip)* | ☐ | ☐ | ☐ |

For each: price on screen = price charged, booking record correct, payment completes, confirmation
shown.

## Still needed from the owner

1. **Payment/admin tokens** for live booking and payment tests — put them in `.env`, never in chat.
2. **Final domain** — `agraskbagheltourandtravels.com` or `skbagheltravels.in`.
3. **Ruling on F2 step 4** — should Force vehicles on a 20 km airport transfer also be forced to round
   trip? Today they are not.
