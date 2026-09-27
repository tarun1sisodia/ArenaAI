# Audit Plan — 4 Stages

**Goal:** verify, one by one, whether the simple product you actually want is implemented.
**Output:** a PASS / FAIL / PARTIAL verdict per check. Those FAILs become the Mega Plan.
**Nothing is built in this audit.** It is a verification pass only.

---

## The product, in one paragraph

A customer lands on the site. They either **search a trip** (from → to, or a local taxi) or **browse
routes and packages**. They click the trip they want. They **pick a vehicle**. A price appears. They
**pay**. Done.

Prices come from what we already set in the backend. Admin can add new catalog items whenever they
want. All vehicles are offered on all trip types. **One special rule only:** Force Tempo Traveller and
Force Urbania are always charged as a **round trip**.

---

## ⚠️ One rule change to confirm

Your instruction on the 300 km minimum has moved across messages:

| Message | What it said |
|---|---|
| Original prompt | "it is not mandatory that 300KM are required but round trip is required" |
| Follow-up | "300Km are required for both vehicles" |
| Latest | "they must charge for round trip and it is **not mandatory** for 300 KM" |

**This plan assumes: round trip = mandatory. 300 km minimum = REMOVED.** Two of three messages say so,
and the latest wins. This matters — the 300 km floor is live in the backend today and removing it
changes real prices (Agra→Mathura Force Urbania drops from ₹10,700 to the round-trip rate). Say the
word if it should stay.

---

# Stage 1 — Catalog & Data Foundation

*"The backend holds our trips and prices. Admin can add more. All vehicles work on all trip types."*

| ID | Check | How verified | Known status |
|----|-------|--------------|--------------|
| 1.1 | Every trip type we sell exists in backend data: one-way, round trip, local taxi, tour package | Read catalogue + DB seed | ✅ All four exist (`TRIP_TYPES`) |
| 1.2 | Every trip has a price already set — no trip returns "price unavailable" | Run the engine over the full route/package list, count failures | ⚠️ Unknown — must sweep all 982 |
| 1.3 | All 5 vehicles are selectable on **all** trip types (no vehicle hidden on packages/local) | Call engine for every vehicle × every trip type | ⚠️ Backend prices all 5 everywhere; UI needs checking |
| 1.4 | Admin can create a new catalog item and it appears to customers | `POST /api/v1/ops/admin/catalog` → publish → fetch as customer | ✅ Endpoints exist (`catalog.routes.ts:16–30`); end-to-end flow untested |
| 1.5 | Admin-created items get a price that the booking flow honours | Create item with price, book it, compare | ❌ Not verified |
| 1.6 | One source of truth for prices — not three | Compare backend catalogue vs `react/src/data.ts` vs `routes-manifest.json` | 🐞 **FAIL — three copies, three different per-km rates** |
| 1.7 | Route data is clean (no blog posts or `km: 0` rows in the route table) | Scan manifest | 🐞 **FAIL — marketing pages and zero-km rows present** |
| 1.8 | `data/parity.ts` does not block adding new routes/packages | Read file | 🐞 **FAIL — hard-throws if routes ≠ 8, packages ≠ 6** |

**Stage 1 passes when:** one price source, clean data, admin can add an item that a customer can
actually buy.

---

# Stage 2 — Customer Discovery

*"Customer can browse the routes we offer with pagination, and see all our packages."*

| ID | Check | How verified | Known status |
|----|-------|--------------|--------------|
| 2.1 | Routes page lists our routes with working pagination | Load page, click through pages | ✅ Pagination implemented (`RoutesPage.tsx:445–471`) |
| 2.2 | Pagination covers the **full** route inventory, not 8 routes | Count items across all pages | 🐞 **FAIL — paginates 8; we hold 982** |
| 2.3 | Packages page shows **all** packages we offer | Count rendered vs dataset | 🐞 **FAIL — renders 6, labelled "All Packages (6)"** |
| 2.4 | Customer can find a package by the cities it covers (e.g. Agra + Delhi + Mathura) | Search those cities | 🐞 **FAIL — no search/filter on Packages at all** |
| 2.5 | Trip search (from → to) returns a result for any route we sell | Try 20 random manifest routes | ⚠️ Unknown |
| 2.6 | Local taxi option is discoverable and lists its packages (8h/80km etc.) | Load page | ⚠️ Exists in backend; UI placement to confirm |
| 2.7 | Every route and package has a real page at a real URL | Crawl sitemap + spot-check | 🐞 **FAIL — 8 route pages, 6 package pages** |
| 2.8 | Clicking any route/package goes straight into booking with that trip preselected | Click through | ⚠️ Unknown |

**Stage 2 passes when:** a customer can page through everything we sell, search it by city, and click
any item straight into booking.

---

# Stage 3 — Booking & Pricing (the core flow)

*"Click trip → pick vehicle → see price → pay. Price = what we set, based on vehicle and distance."*

| ID | Check | How verified | Known status |
|----|-------|--------------|--------------|
| 3.1 | The flow is genuinely: pick trip → pick vehicle → price → pay (no extra steps) | Walk the UI | ⚠️ Currently a 2-step form; count the clicks |
| 3.2 | Price shown to the customer **equals** the price they are charged | Compare UI number vs API response, 20 combos | 🐞 **FAIL — ₹14,000 shown vs ₹16,140 charged on Force Urbania Agra→Delhi** |
| 3.3 | Price is computed by the **backend only**; frontend displays it | Confirm frontend calls `/api/v1/fares/calculate` | 🐞 **FAIL — frontend never calls it; it calculates its own** |
| 3.4 | Client cannot tamper with price | Send a price field in the booking request | ✅ PASS — server strips it and recalculates |
| 3.5 | **One-way** works end to end and is charged as one-way | Book one, check record | ⚠️ To test live |
| 3.6 | **Round trip** works end to end | Book one | ⚠️ To test live |
| 3.7 | **Local taxi** works end to end | Book one | ⚠️ To test live |
| 3.8 | **Tour package** works end to end | Book one | ⚠️ To test live |
| 3.9 | **Force Tempo Traveller**: selecting one-way is charged and recorded as round trip | Book one-way, inspect record | ✅ PASS on backend (verified: returns `round-trip`) |
| 3.10 | **Force Urbania**: same rule | Same | ✅ PASS on backend |
| 3.11 | Force Tempo and Force Urbania have **different** prices for the same trip | Compare | ✅ PASS (₹12,000 vs ₹16,140) |
| 3.12 | The round-trip rule also applies on packages, local and airport trips for these two vehicles | Run all four paths | 🐞 **FAIL — packages/local/airport bypass the rule entirely** |
| 3.13 | **No 300 km minimum is applied** (per the latest instruction) | Short route, Force vehicle | 🐞 **FAIL — 300 km floor is currently live and inflating short trips** |
| 3.14 | All other vehicles keep normal pricing — no regression | Snapshot sedan/ertiga/innova before & after | ✅ Baseline to capture |
| 3.15 | Customer is told, before paying, that these two vehicles are round-trip only | Load booking page | 🐞 **FAIL — no notice anywhere in the UI** |
| 3.16 | Payment completes and produces a confirmed booking | Live payment test with real tokens | ⚠️ To test — you said tokens are available |

**Stage 3 passes when:** all four trip types book and pay successfully, the displayed price always
matches the charged price, and the only special-casing left is "these two vehicles are round trip".

---

# Stage 4 — SEO, Speed & Standards

*"Frontend and backend must be standard quality so we rank."*

| ID | Check | How verified | Known status |
|----|-------|--------------|--------------|
| 4.1 | No artificial loading animation delaying first paint | Load home | 🐞 **FAIL — `InitialLoader` blocks 2,200 ms and locks scroll** |
| 4.2 | No scroll-hijacking animation on the homepage | Load home | 🐞 **FAIL — `SmoothScrollHero` active** |
| 4.3 | Hero/LCP image is self-hosted, right-sized, preloaded | Inspect network | 🐞 **FAIL — external 2400px Unsplash hotlink** |
| 4.4 | Sitemap contains every route and package page | Count | 🐞 **FAIL — 32 URLs vs 982 routes** |
| 4.5 | One production domain across canonical, JSON-LD and API config | Grep | 🐞 **FAIL — three different domains in use** |
| 4.6 | Unique title, description, canonical per page | Crawl | ⚠️ Partial |
| 4.7 | Structured data: LocalBusiness, Product/Offer per package, Breadcrumbs, FAQ | Rich Results test | ⚠️ Partial — no Product/Offer, no FAQPage |
| 4.8 | One `h1` per page, sane heading order, alt text everywhere | Crawl | ⚠️ Unknown |
| 4.9 | No duplicate/unused dependencies | Read `package.json` | 🐞 **FAIL — `framer-motion` and `motion` both installed, same version** |
| 4.10 | Bundle within budget; report before/after | Build | Baseline: JS 74.9 kB gz main + 60.3 kB gz vendor, CSS 49.7 kB gz |
| 4.11 | Core Web Vitals measured and healthy | Lighthouse | ⚠️ To measure |
| 4.12 | Every page reachable by a crawler without JS (SSG) | Fetch with JS off | ✅ 37 pages prerendered — must grow with the route expansion |

**Stage 4 passes when:** no animation blocks paint, the sitemap covers everything we sell, one domain,
and measured Lighthouse scores are reported before and after.

---

## Running order

Stages run **in sequence**, because each depends on the one before:

1. **Stage 1** fixes the data foundation → without one price source, Stage 3 can never pass.
2. **Stage 2** exposes that data to customers → without pages, Stage 4's sitemap has nothing to list.
3. **Stage 3** makes booking and payment correct → the revenue path.
4. **Stage 4** makes it rank.

## What I need from you to start

1. **Confirm the 300 km removal** (the ⚠️ box above). This is the only blocking question.
2. **Backend access tokens / env** for the live payment and admin-catalog tests (3.16, 1.4, 1.5) —
   tell me where they are or add them to `.env`, and never paste them in chat.
3. **Which domain is final** — `agraskbagheltourandtravels.com` or `skbagheltravels.in` (4.5).

## What happens next

I run all four stages and fill in every ⚠️ with a real PASS/FAIL. That produces the **Mega Plan**: one
ordered list of fixes, grouped by stage, which we then execute and test.
