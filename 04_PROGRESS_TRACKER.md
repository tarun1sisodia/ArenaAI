# Progress Tracker — SK Baghel Town & Travels

This file is a **living document**. The AI implementing the build updates it after
every single step, per `01_AI_OPERATING_INSTRUCTIONS.md` §3. Never rewrite history —
only check boxes, append log rows, and update the Current State block.

---

## Current State

- **Current Phase:** 14 — Audit remediation quick-wins batch ✅ done
- **Current Step:** 12 of 18 audit findings fixed; 100/100 link check at both bases
- **Last updated:** 2026-09-01
- **Open items:** `visual_audit.mjs` still needs a networked machine; fonts self-hosting (sandbox blocked Google Fonts); launch gates live in `LAUNCH_CHECKLIST.md`

---

## Blockers

_(none yet — add entries here as `Phase X / Step Y: description` when something
can't be resolved without user input)_

---

## Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-09-01 | Vanilla static MPA, not Next.js | Design-guide handoff is static; JS budget; booking is the only app page |
| 2026-09-01 | Bilingual SSG `/en/` + `/hi/` with EN home at `/` | Fast + bilingual SEO approach approved for this project |
| 2026-09-01 | Call + WhatsApp primary; `/book.html` noindex | Call/WhatsApp are primary conversions; payment is secondary |
| 2026-09-01 | Fares identical in both languages | Translate copy only |
| 2026-09-01 | Sticky lead-bar on route pages (all marketing on mobile) | Call/WhatsApp conversion is the main route to booking |
| 2026-09-01 | Page-relative URLs from the build (no `SITE_BASE`, no `/ArenaAI` hardcode) | One build must serve the custom domain root AND the GitHub Pages subpath AND local previews; the `/ArenaAI` prefix had broken everything outside Pages (all assets 404) |
| 2026-09-01 | NAP contact data single-sourced in `catalog.py`; `js/contact.js` is generated | Two hand-maintained copies (SSG + client) had a drift guarantee; launch data swap must be a one-line change |
| 2026-09-01 | Night allowance implemented (₹400, outstation 22:00–05:00) instead of deleting the FAQ promise | FAQ advertised it as shown-before-pay; fare transparency is the site's differentiator, so the engine was fixed to match the copy |
| 2026-09-01 | `DESIGN.md` is Dark Navy + Golden | This project’s approved Option A |
| 2026-09-01 | Add Phase 11 — Responsive QA & fixes to the build plan | User tested mobile + laptop and reported pages are not responsive |

---

## Session Log

| Date | Phase/Step | What was done | Files touched |
|---|---|---|---|
| 2026-09-01 | 1 / 1–3 | Frontend plan; proposal archived; design-guide left untouched | `FRONTEND-PLAN.md`, `proposal/` |
| 2026-09-01 | 2 / 1–3 | Tokens, site CSS, favicon, robots stub | `css/tokens.css`, `css/site.css`, `assets/brand/favicon.svg` |
| 2026-09-01 | 3 / 1–3 | Mock catalogue + fare engine | `js/data.js`, `js/fares.js` |
| 2026-09-01 | 4 / 1–3 | Shared chrome, toast, contact mock submit | `js/app.js` |
| 2026-09-01 | 5 / 1–4 | Marketing hubs + first HTML generator | `scripts/render_pages.py`, hub HTML |
| 2026-09-01 | 6 / 1–3 | 5-step mock booking, noindex app page | `js/booking.js`, `book.html` |
| 2026-09-01 | 7 / 1–3 | Hero/fleet/packages/OG WebP, preload | `assets/` |
| 2026-09-01 | 8 / 1–5 | Bilingual SSG, hreflang, lead-bar, sitemap, redirects | `scripts/catalog.py`, `scripts/i18n.py`, `scripts/render_pages.py`, `en/`, `hi/`, `sitemap.xml` |
| 2026-09-01 | 9 / 1–3 | Adapted operating-pack templates; always-on agent rules; seeded tracker | `00_START_HERE.md` … `04_PROGRESS_TRACKER.md`, `DESIGN.md`, `AGENTS.md`, `.agents/rules/` |
| 2026-09-01 | 10 / 1 | Reviewed git status: frontend + bilingual SSG + pack are untracked/modified; `app.js`/`styles.css` deleted (replaced by `js/` + `css/`); `design-guide/` clean; no secrets | git status |
| 2026-09-01 | 10 / 2 | Commit frontend, bilingual SSG, and agent pack on `arena/01a05b23-arenaai` | git commit |
| 2026-09-01 | 10 / 3 | Pushed `arena/01a05b23-arenaai` to origin | git push |
| 2026-09-01 | 10 / 4 | Opened PR into `main` | https://github.com/tarun1sisodia/ArenaAI/pull/8 |
| 2026-09-01 | 11 / 1–3 | Responsive pass: grid 3→2→1, mobile header de-clutter, flex-wrap + overflow guards, scrollable mobile tables, 404 + redirect viewport, regenerated tree | `css/site.css`, `scripts/render_pages.py`, `404.html`, root redirect stubs, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-01 | 11 / 4 | GitHub Pages live but no CSS/images: root-relative URLs hit `github.io/` root instead of `/ArenaAI/`. Added `SITE_BASE` to the renderer, rebase of `href/src/srcset/action/data-href` + redirects + robots, `<body data-base>` + JS prefixing; regenerated tree and verified 0 broken refs | `scripts/render_pages.py`, `js/data.js`, `js/app.js`, `js/booking.js`, `README.md`, `04_PROGRESS_TRACKER.md`, generated pages |

---

## Checklist

### Phase 1 — Plan & archives
- [x] 1. Write `FRONTEND-PLAN.md`
- [x] 2. Move deck into `proposal/`
- [x] 3. Confirm `design-guide/` stays untouched

### Phase 2 — Design tokens & base CSS
- [x] 1. `css/tokens.css`
- [x] 2. `css/site.css`
- [x] 3. Favicon + robots stub

### Phase 3 — Mock data & fare engine
- [x] 1. `js/data.js`
- [x] 2. `js/fares.js`
- [x] 3. Fares stay numeric / language-agnostic

### Phase 4 — Shared chrome
- [x] 1. Header, sheet, footer, toast
- [x] 2. Skip link, sticky header, demo chip
- [x] 3. Contact form mock submit

### Phase 5 — Marketing hubs
- [x] 1. Home
- [x] 2. Services, routes, packages, fleet
- [x] 3. About, contact, FAQ, legal
- [x] 4. First renderer pass

### Phase 6 — Booking app
- [x] 1. 5-step `book.html`
- [x] 2. `js/booking.js` + sessionStorage
- [x] 3. Simulated pay; noindex

### Phase 7 — Assets & performance
- [x] 1. Hero WebP preload
- [x] 2. Fleet / packages / driver / OG
- [x] 3. Dimensions + lazy-load

### Phase 8 — Bilingual SEO SSG
- [x] 1. `catalog.py` + `i18n.py`
- [x] 2. EN `/` + HI `/hi/` + dedicated landings
- [x] 3. hreflang / canonical / OG / JSON-LD
- [x] 4. Sticky Call/WhatsApp lead-bar
- [x] 5. Root-relative assets, sitemap, old-hub redirects

### Phase 9 — Agent documentation pack
- [x] 1. Adapt templates (`00`–`04` + `DESIGN.md`) to this project
- [x] 2. Always-on rules (`AGENTS.md`, `.agents/rules/`)
- [x] 3. Seed tracker to match completed work

### Phase 10 — Pull request
- [x] 1. Review git status; do not commit `design-guide/` edits or secrets
- [x] 2. Commit on `arena/01a05b8c-arenaai`
- [x] 3. Push only that branch
- [x] 4. Open PR into `main`

### Phase 11 — Responsive QA & fixes
- [x] 1. Audit generated pages at mobile/laptop widths (EN + HI)
- [x] 2. Grid breakpoints + header/chrome + overflow fixes
- [x] 3. Mobile tables, touch targets, regenerate cleanly
- [x] 4. Fix GitHub Pages subpath hosting: rebase root-relative URLs to `/ArenaAI` (CSS, images, JS, redirects, robots), regenerate tree

### Phase 12 — Out of scope until added
- [ ] Admin / live Razorpay / WhatsApp API / CMS / Next.js / auth

### Phase 14 — Audit remediation batch (from `06_AUDIT_REPORT.md`)
- [x] 1. Timezone bug (#2): shared `SKB.localTomorrow()` in fares.js; UTC `toISOString` dupes deleted from app.js/booking.js
- [x] 2. Desktop lead-bar (#6): constrained to a right-side corner pill ≥701px (was full-viewport bar); mobile rule unchanged
- [x] 3. Touch targets (#11): filter pills, `.btn-sm`, lang-switch now 44px (DESIGN.md rule)
- [x] 4. Image pipeline (#3, #13): 480w/768w WebP derivatives generated for fleet/packages/driver; `resp_img()` build helper emits truthful intrinsic dims + srcset/sizes + `decoding="async"`; detail pages lazy-load; hero dim typo fixed (823→815); booking thumbs now use 480w files
- [x] 5. Nav sheet a11y (#5): `role="dialog"`/`aria-modal`, focus moves into sheet, Tab trapped, focus restored to toggle; no-JS `<noscript>` fallback nav
- [x] 6. Mobile blur jank (#7): backdrop-filter replaced by solid translucent navy ≤700px (header + lead-bar)
- [x] 7. Booking state (#8): 24h TTL on `skb-booking`; post-payment edits locked (toast on stepper); "New booking" reset on ticket
- [x] 8. Night allowance (#9): implemented in fares.js (`SKB.NIGHT_ALLOWANCE` ₹400, outstation 22:00–05:00); shown in booking summary + ticket + calculator notice; packages/local exempt
- [x] 9. Stepper semantics (#12): removed fake `role="tablist"`
- [x] 10. NAP single-sourcing (#1/#16): `js/contact.js` now generated from catalog.py (imported by all pages); dead `SKB.faqs` copy deleted (Python FAQS is the single source)
- [x] 11. `LAUNCH_CHECKLIST.md` — go-live gates (real NAP/GST/mailbox, schema gaps, fonts, QA)
- [ ] 12. Fonts self-hosting (#4): needs networked machine (Google Fonts blocked in sandbox) — tracked in checklist
- [ ] 13. Full catalogue single-sourcing (vehicles/routes/packages still duplicated catalog.py ↔ data.js) — recommend generating `js/catalog-data.js` next batch; systemic follow-up, not risk-free inline
- [ ] 14. Inline-style → utility-class sweep (#15) and minor perf items (#18) — next batch

### Phase 13 — Base-agnostic hosting + responsive/forms repair (user-reported)
- [x] 1. Root cause found: `/ArenaAI` build 404'd every asset outside the Pages subpath (unstyled pages ⇒ "not responsive", missing hero, dead forms)
- [x] 2. Build now emits **page-relative URLs** — one build works at custom-domain root, `/ArenaAI` Pages subpath, and any local preview (`rebase()` rewrite in `render_pages.py`; JS joins normalized in `data.js`/`app.js`/`booking.js`)
- [x] 3. `scripts/serve.py` — preview server (root + `/ArenaAI` emulation, dev no-store, custom 404)
- [x] 4. `scripts/check_links.py` — crawl gate: **79/79 URLs 200 at both bases**
- [x] 5. Mobile hero: photo visible again (lighter overlay stops, `object-position: center` ≤700px) with copy-legible bottom gradient; `onerror` fallback on hero img
- [x] 6. Booking vehicle-picker overflow fixed (96px img in 72px track → fluid thumb); dead `.book-pill` CSS removed
- [x] 7. Header 700–1120px band tightened (nav gap/font); mobile lead-bar 13px
- [x] 8. Forms: hero-widget `date` no longer `required` (zero-JS GET still lands in booking, which defaults to tomorrow); contact form gets `mailto:` action fallback + `autocomplete`/`inputmode`; booking phone gets `inputmode="tel"`
- [x] 9. `scripts/visual_audit.mjs` — Playwright overflow/console/screenshot sweep at 360/390/768/1024/1440 (needs a networked machine; sandbox blocked the browser download, so visually spot-check via the live preview until run)
- [x] 10. Docs updated: `02_PROJECT_CONTEXT.md` serve/URL/QA rows + conventions; Decision Log entry below
