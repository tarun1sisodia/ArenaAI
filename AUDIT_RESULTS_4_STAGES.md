# Audit Results — 4 Stages

**Date:** 2026-09-27 · **Commit:** `97a2b21` · **Method:** code read + live engine execution + production build

**Confirmed rule:** Force Tempo Traveller and Force Urbania are **always charged as round trip**.
**There is NO 300 km minimum.** The 300 km floor currently in the code must be **removed**.

**Status legend:** 🟢 Working · 🔴 Not Working · 🟡 Partially Implemented · ⚪ Missing

---

## Scoreboard

| Stage | 🟢 Working | 🟡 Partial | 🔴 Not Working | ⚪ Missing |
|-------|-----------|-----------|---------------|-----------|
| 1 — Catalog & Data | 3 | 1 | 3 | 1 |
| 2 — Discovery | 3 | 1 | 3 | 1 |
| 3 — Booking & Pricing | 7 | 1 | 3 | 5 |
| 4 — SEO & Speed | 2 | 4 | 5 | 1 |
| **Total** | **15** | **7** | **14** | **8** |

---

## Stage 1 — Catalog & Data Foundation

| ID | Check | Status | Evidence |
|----|-------|--------|----------|
| 1.1 | All four trip types exist in backend | 🟢 Working | `TRIP_TYPES`: one-way, round-trip, local-tour, airport-transfer |
| 1.2 | Every trip has a price — none fail | 🟢 Working | **Swept 982 routes × 5 vehicles = 4,910 quotes. 4,910 ok, 0 failures.** |
| 1.3 | All vehicles work on all trip types | 🟢 Working | **20/20 combinations returned a valid price** |
| 1.4 | Admin can create a catalog item | 🟡 Partial | Endpoints live (`POST/PATCH/publish/archive /api/v1/ops/admin/catalog`) + UI dialogs exist; never tested end to end |
| 1.5 | Admin-created item is buyable by a customer | 🔴 Not Working | Customer site reads static files, not the catalog API. A new admin item cannot appear on the site |
| 1.6 | One price source | 🔴 Not Working | Three: backend catalogue, `react/src/data.ts` (copy-paste), `routes-manifest.json`. Per-km rates disagree (backend 25/34 vs manifest 17–22/25–30) |
| 1.7 | Route data is clean | 🔴 Not Working | Blog pages in the route table (`5-layers-of-safety-measures-taken-during-ride`); many `km: 0` rows |
| 1.8 | `parity.ts` doesn't block growth | ⚪ Missing | Hard-throws if routes ≠ 8 or packages ≠ 6 |

---

## Stage 2 — Customer Discovery

| ID | Check | Status | Evidence |
|----|-------|--------|----------|
| 2.1 | Routes page has working pagination | 🟢 Working | `RoutesPage.tsx:445–471` |
| 2.2 | Pagination covers full inventory | 🔴 Not Working | Paginates **8** routes; we hold **982** |
| 2.3 | Packages page shows all packages | 🔴 Not Working | Renders **6**; UI literally says "All Packages (6)" |
| 2.4 | Find a package by its cities (Agra+Delhi+Mathura) | ⚪ Missing | No search or city filter on Packages at all |
| 2.5 | Trip search works for any route | 🟢 Working | Engine resolved all 982; unknown pairs fall back to estimator |
| 2.6 | Local taxi discoverable with its packages | 🟡 Partial | 8h/80km + 12h/120km exist in backend and Services page; not a first-class choice in the main search |
| 2.7 | Every route/package has a real URL | 🔴 Not Working | 8 route pages + 6 package pages prerendered out of 982 + all packages |
| 2.8 | Clicking a trip preselects it in booking | 🟢 Working | `RoutesPage.tsx:425` → `/book?from=&to=`; `PackagesPage.tsx:468` → `/book.html?package=&step=1` (two URL styles — tidy up) |

---

## Stage 3 — Booking & Pricing

| ID | Check | Status | Evidence |
|----|-------|--------|----------|
| 3.1 | Simple flow: trip → vehicle → price → pay | 🟢 Working | 3 steps: choose vehicle → booking form → confirmation. Matches what you asked for |
| 3.2 | Price shown = price charged | 🔴 Not Working | **Force Urbania Agra→Delhi: ₹14,000 shown, ₹16,140 charged (+15.3%)**. Agra→Mathura: ₹8,000 vs ₹10,700 (+33.8%) |
| 3.3 | Backend calculates, frontend displays | 🔴 Not Working | Frontend never calls `/api/v1/fares/calculate`; it runs its own engine |
| 3.4 | Client cannot tamper with price | 🟢 Working | Server strips money fields, derives distance itself, recalculates |
| 3.5 | One-way books end to end | 🟡 Partial | Engine + draft OK; live payment untested (needs tokens) |
| 3.6 | Round trip books end to end | 🟡 Partial | Same |
| 3.7 | Local taxi books end to end | 🟡 Partial | Same |
| 3.8 | Tour package books end to end | 🟡 Partial | Same |
| 3.9 | Force Tempo one-way → charged round trip | 🟢 Working | Verified: returns `tripType: round-trip` |
| 3.10 | Force Urbania one-way → charged round trip | 🟢 Working | Verified |
| 3.11 | The two vehicles priced differently | 🟢 Working | ₹12,000 vs ₹16,140 same trip |
| 3.12 | Round-trip rule applies on packages/local/airport too | 🔴 Not Working | All three paths `return` before the rule runs |
| 3.13 | **No 300 km minimum** | 🔴 Not Working | 300 km floor is **live** and inflating short trips — must be removed |
| 3.14 | Other vehicles unchanged | 🟢 Working | Sedan one-way Agra→Delhi = ₹3,499, normal path |
| 3.15 | Customer told about the round-trip rule before paying | ⚪ Missing | No notice in the UI |
| 3.16 | Payment completes | ⚪ Missing | Not tested — needs your tokens |

---

## Stage 4 — SEO, Speed & Standards

**Build baseline:** main JS 74.9 kB gz · vendor 60.3 kB gz · CSS 49.7 kB gz · 37 pages prerendered

| ID | Check | Status | Evidence |
|----|-------|--------|----------|
| 4.1 | No artificial loading animation | 🔴 Not Working | `InitialLoader` blocks 2,200 ms and sets `body.overflow = hidden` |
| 4.2 | No scroll hijacking | 🔴 Not Working | `SmoothScrollHero` on homepage |
| 4.3 | Hero image self-hosted and sized | 🔴 Not Working | External 2400px Unsplash hotlink on the LCP path |
| 4.4 | Sitemap covers everything | 🔴 Not Working | **32 URLs** vs 982 routes |
| 4.5 | One production domain | 🔴 Not Working | Sitemap/robots use `agraskbagheltourandtravels.com`; app code uses `skbagheltravels.in` (12 places) |
| 4.6 | Unique title/description/canonical per page | 🟡 Partial | Good on real pages; **`/en/` emits `<title>Redirecting…</title>` with no `h1`** |
| 4.7 | Structured data | 🟡 Partial | Schema graph + ItemList present; no per-package `Product`/`Offer`, no `FAQPage` |
| 4.8 | One h1, alt text | 🟡 Partial | Routes and Packages have exactly 1 h1 each ✅; `/en/` has 0 |
| 4.9 | No duplicate dependencies | 🔴 Not Working | `framer-motion` **and** `motion`, same version, both installed |
| 4.10 | Bundle budget | 🟡 Partial | Acceptable, but includes animation libs we're deleting |
| 4.11 | Core Web Vitals measured | ⚪ Missing | Not measured |
| 4.12 | Crawlable without JS | 🟢 Working | 37 pages prerendered — must scale with route expansion |

---

## The 8 things that actually need building

Everything above collapses into eight features. They are ordered by dependency — each one is
independently shippable and testable.

| # | Feature | Fixes |
|---|---------|-------|
| **F1** | One price source — generate all data from the backend catalog | 1.6, 1.7, 1.8 |
| **F2** | Fix the Force rule: drop 300 km, force round trip everywhere | 3.12, 3.13 |
| **F3** | Frontend shows the backend's price | 3.2, 3.3, 3.15 |
| **F4** | Admin CRUD regenerates the manifest | 1.4, 1.5 |
| **F5** | Routes page paginates the full inventory + detail pages | 2.2, 2.7 |
| **F6** | Packages page shows all packages + city search | 2.3, 2.4, 2.6 |
| **F7** | Remove animations, fix LCP | 4.1, 4.2, 4.3, 4.9, 4.10 |
| **F8** | SEO completion: sitemap, domain, structured data | 4.4, 4.5, 4.6, 4.7, 4.8, 4.11 |

Live booking + payment tests (3.5–3.8, 3.16) run after F3, once tokens are available.

👉 **Agent-ready prompts for each feature: `AGENT_PROMPTS.md`**
