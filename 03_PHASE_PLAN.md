# Phase Plan — SK Baghel Tour & Travels

Sequential — each phase depends on the previous ones being genuinely complete
(acceptance criteria met), not just started. Read `02_PROJECT_CONTEXT.md` before
starting any phase.

---

## Phase 1 — Plan & archives
**Depends on:** nothing

1. Write `FRONTEND-PLAN.md` (vanilla MPA, mock data, design-guide tokens)
2. Move the original 24-slide deck into `proposal/`
3. Confirm `design-guide/` stays untouched

**Acceptance criteria:** plan exists; proposal is archived; design-guide is unmodified.

---

## Phase 2 — Design tokens & base CSS
**Depends on:** Phase 1

1. Transcribe Option A tokens into `css/tokens.css` from `DESIGN.md` / design-guide
2. Build `css/site.css`: chrome, type, buttons, cards, forms, booking, motion 180ms
3. Favicon + `robots.txt` stub

**Acceptance criteria:** tokens match `DESIGN.md`; no invented hex in new CSS; 44px touch.

---

## Phase 3 — Mock data & fare engine
**Depends on:** Phase 2

1. `js/data.js` — cities, 5 vehicles, 8 routes, 4 packages, NAP, reviews
2. `js/fares.js` — package add-ons, round-trip 1.85×, advance rule
3. Confirm fares stay numeric (language-agnostic)

**Acceptance criteria:** `SKB.calcFare` returns total / advance / remaining for published pairs.

---

## Phase 4 — Shared chrome
**Depends on:** Phase 3

1. Header, mobile sheet, footer, toast in `js/app.js`
2. Skip link, sticky header, demo chip
3. Contact form validation + mock submit toast

**Acceptance criteria:** chrome works with mock data; Call/WhatsApp work with JS disabled.

---

## Phase 5 — Marketing hubs
**Depends on:** Phase 4

1. Home (hero, trust, routes, services, fleet, package, CTA)
2. Services, routes (+ fare calc), packages, fleet (filters)
3. About, contact, FAQ, privacy, terms
4. `scripts/render_pages.py` first generator pass

**Acceptance criteria:** every hub is reachable; calculator and filters work.

---

## Phase 6 — Booking app
**Depends on:** Phase 5

1. `book.html` 5-step flow: Route → Vehicle → Details → Advance → Ticket
2. `js/booking.js` + `sessionStorage` key `skb-booking`
3. Simulated pay ~900ms; ticket `AGR-`; noindex

**Acceptance criteria:** query params from home/routes/packages hydrate the flow; back never loses state; nothing is charged.

---

## Phase 7 — Assets & performance
**Depends on:** Phase 6

1. Hero WebP (≤ 220KB, preload, fetchpriority high)
2. Fleet / packages / driver WebP; OG banner
3. Width/height or aspect-ratio on every image; lazy below the fold

**Acceptance criteria:** hero preloads; no layout jump on images; fonts `display=swap`.

---

## Phase 8 — Bilingual SEO SSG
**Depends on:** Phase 7

1. `scripts/catalog.py` + `scripts/i18n.py`
2. Rewrite renderer: `/` EN home, `/hi/` HI home, dedicated route/vehicle/package pages
3. hreflang en-IN / hi-IN / x-default; canonical; OG; BreadcrumbList + LocalBusiness/TaxiService
4. Sticky Call/WhatsApp lead-bar (route pages; all marketing on mobile)
5. Root-relative `/book.html` and `/assets/…`; expand sitemap; old hub redirects

**Acceptance criteria:** 8 EN + 8 HI route landings; fares identical; `book.html` noindex; `python3 scripts/render_pages.py` rebuilds the tree.

---

## Phase 9 — Agent documentation pack
**Depends on:** Phase 8

1. Adapt the operating-pack templates to this project (`00`–`04` + `DESIGN.md`)
2. Add always-on rules (`AGENTS.md`, `.agents/rules/`)
3. Seed `04_PROGRESS_TRACKER.md` to match work already done

**Acceptance criteria:** every new session can recover phase/step from the tracker alone.

---

## Phase 10 — Pull request
**Depends on:** Phase 9

1. Review git status; do not commit `design-guide/` edits or secrets
2. Commit on `arena/01a05b8c-arenaai` with a clear message
3. Push only that branch
4. Open a PR into `main` describing frontend + bilingual SEO

**Acceptance criteria:** PR exists from `arena/01a05b8c-arenaai`; preview still serves.

---

## Phase 11 — Responsive QA & fixes
**Depends on:** Phase 10 (any new page work should also pass this QA)

1. Audit all generated pages at 320 / 375 / 768 / 1280 / 1440px (EN + HI, home, hubs, routes, vehicles, packages, booking)
2. Fix grid collapsing (3 → 2 → 1), header overflow, mobile lead-bar overlap, horizontal page scroll
3. Keep tables scrollable within their cards and keep 44px touch targets on mobile

**Acceptance criteria:** no horizontal page scroll at 320–375px; grids collapse at the design breakpoints; header/mobile sheet stay usable; tables scroll inside their wrapper; booking remains usable on mobile; `python3 scripts/render_pages.py` still rebuilds cleanly.

## Phase 12 — Out of scope until the user adds it

Admin, live Razorpay, WhatsApp Cloud API, CMS, Next.js rewrite, auth.

---

## Phase 16 — Session 2: Production File Split (Light Premium & Animation Engine)
**Depends on:** Phase 15

1. Update `DESIGN.md` and `css/tokens.css` with Light Premium tokens (Warm Ivory, Deep Navy, Gold) and motion variables
2. Create `css/components.css` with all 16 production animation patterns from the approved showcase
3. Create `js/motion.js` lightweight motion engine (<3KB vanilla JS, IntersectionObserver, cursor spotlight, scrambler, accordion, parallax, timeline, counters)
4. Create `templates/base.html` and wire `components.css` and `motion.js` into `scripts/render_pages.py`, regenerate all pages and verify with `check_links.py`

**Acceptance criteria:** `tokens.css` and `DESIGN.md` align on Light Premium; `components.css` and `motion.js` are in place; all generated pages include them with 0 link/console errors; `prefers-reduced-motion` honored.

---

## Phase 17 — Cinematic Theme Switcher & Architectural Contact Card (21st.dev Integration)
**Depends on:** Phase 16

1. Add Dark Navy theme token overrides to `css/tokens.css` with smooth transitions while preserving SEO contrast standards (AA 4.5:1) and existing Light Premium defaults
2. Add styles for 21st.dev Cinematic Theme Switcher and 21st.dev Architectural Contact Card to `css/components.css`
3. Add interactive logic for Cinematic Theme Switcher and Contact Card animations in `js/motion.js` with `prefers-reduced-motion` safety
4. Wire anti-FOUC theme detector, SVG texture filters, theme switchers, and Contact Card into `scripts/render_pages.py` and `templates/base.html`, ensuring 100% SEO compliance (single H1, schema integrity, crawlable HTML); regenerate and verify with `check_links.py`

**Acceptance criteria:** Cinematic Theme Switcher toggles themes with tactile 3D puck and particle ripple; Contact Card renders with corner plus markers, info tiles, and form; zero SEO degradation; 0 link check errors at both bases.

---

## Phase 18 — Interactive Motion Polish, Brand/Nav/Button/Form Animations, Icon Suite & Mock Banner Deletion
**Depends on:** Phase 17

1. Add Brand Name scramble animation on hover (`initBrandScramble` in `motion.js`), SVG logo hover spring and gold glow pulse
2. Add Rolling Nav link dual-layer text effect (`.roll`), smooth mobile sheet drawer transitions
3. Add Button shimmer wave (`@keyframes btn-shimmer`), tactile active press (`scale(0.97)`), hover elevation, and arrow nudge
4. Add Form floating labels, 3px gold focus ring glow, input error shake animation, and contact form submission feedback
5. Completely remove Demo Mock Data pill badge from `templates/base.html`, `scripts/render_pages.py`, `book.html`, and hide in `css/site.css`

---

## Phase 29 — Real-World Market Data & Catalogue Integration (ASTT Research Integration)
**Depends on:** Phase 28

1. Update `scripts/catalog.py` with verified vehicle fleet specifications, per-km rates, fixed one-way routes (Agra–Delhi, Agra–Jaipur, Agra–Mathura), multi-day & same-day tour packages, night allowances, and cancellation constants.
2. Synchronize client-side `js/fares.js` and `js/data.js` with matching rates, local 8h/80km & 12h/120km tiers, promo code `ASTTCAR500OFF`, and 300 km/day outstation rules.
3. Update `legal_body()` in `scripts/render_pages.py` to publish authentic Terms & Conditions, 24-hr cab cancellation policy, and 6-tier tour package refund schedule.
4. Implement `render_benefits_section(lang)` ("Benefits To Book Cab With Us" - 6 core cards) and expand service verticals in `services_body()` and `home_body()`.
5. Enhance `package_body()` and `route_body()` templates with hourly itineraries, inclusions/exclusions, vehicle upgrade tables, and extra-KM terms.
6. Rebuild full static tree (`python3 scripts/render_pages.py`), run link verification, verify booking flow, and update `04_PROGRESS_TRACKER.md`.

**Acceptance criteria:** Fares in SSG and client JS match 100%; authentic 24-hr and tour package cancellation policies published; Benefits section renders with design tokens; all 100+ bilingual URLs pass with 0 link errors.
