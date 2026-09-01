# Phase Plan — SK Baghel Town & Travels

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
2. Commit on `arena/01a05b23-arenaai` with a clear message
3. Push only that branch
4. Open a PR into `main` describing frontend + bilingual SEO

**Acceptance criteria:** PR exists from `arena/01a05b23-arenaai`; preview still serves.

---

## Phase 11 — Out of scope until the user adds it

Admin, live Razorpay, WhatsApp Cloud API, CMS, Next.js rewrite, auth.
