# Progress Tracker — SK Baghel Tour & Travels

This file is a **living document**. The AI implementing the build updates it after
every single step, per `01_AI_OPERATING_INSTRUCTIONS.md` §3. Never rewrite history —
only check boxes, append log rows, and update the Current State block.

---

## Current State

- **Current Phase:** 19 — Animation Governance Rules (`ANIMATION_RULES.md`) & SEO-Safe Premium Animation Combination ✅ completed
- **Current Step:** Ready for next phase / client launch review
- **Last updated:** 2026-09-06
- **Open items:** `visual_audit.mjs` still needs a networked machine; fonts self-hosting (sandbox blocks Google Fonts download); real photos + real NAP before launch (see `LAUNCH_CHECKLIST.md`); PRD v3.0 master rewrite includes full SEO Final BOSS content. Client decision points from the deck are open (§25 of PRD.md).

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
| 2026-09-03 | Consolidated a single final `PRD.md` as the target-scope source of truth (full goals, features, success metrics, launch gates) | The build had a docs pack but no product-requirements document; user asked for a final PRD with the full goals |
| 2026-09-03 | Rewrote `PRD.md` to v2.0 Master (SEO-first, engineering-first, scalable) | User asked for a perfect, complete PRD that misses nothing on SEO, engineering, design, and scalability so the product is launch-ready; added the Surfer-style intent → keyword → page → content → technical → local → multilingual → measurement strategy, design/engineering/scalability/security/QA/CI sections, and full SEO checklist |
| 2026-09-03 | Rewrote `PRD.md` to v3.0 Master after receiving the full `SEO Final BOSS.md` content | User provided the full SEO source (ROCKET, Surfer/AI-SEO course, Matt Kenyon playbook, off-page set, client deck notes). Folded into PRD v3.0: full keyword-intent framework, off-page/Digital PR/UGC, AI Search Optimization (AISO), entity signals, topical authority, content-for-AI structure, E-E-A-T, GA4 AI-Assistants channel, client deliverables/decision points, design-tool references, sprints/workflow, and full SEO/off-page/AI checklists. |
| 2026-09-05 | Adopt Light Premium tokens & production animation split (Phase 16 / Session 2) | User approved Session 1b Light Premium theme (`#FAF7F0` Ivory, `#0A1128` Navy, `#B8941F` Gold) and 16 animation patterns; modularized into `css/tokens.css`, `css/components.css`, `js/motion.js`, and `templates/base.html` |
| 2026-09-06 | Integrate 21st.dev Cinematic Theme Switcher & Architectural Contact Card (Phase 17) | Faithful zero-dependency vanilla MPA implementation maintaining strict SEO rules: single H1 per page, strict heading hierarchy (H1 -> H2 -> H3), crawlable mailto fallback, 44px touch targets, zero link check errors. |
| 2026-09-06 | Brand/Nav/Button/Form animations, Icon Suite & Mock badge deletion (Phase 18) | Applied animations from `client` project: Brand wordmark scramble on hover, rolling nav link dual-layer text, button shimmer wave & active press feedback, form floating labels & gold focus ring glow, removed Demo Mock Data pill across all pages, and added SVG icons for Call, WhatsApp, Email, Map. 102/102 URLs OK. |
| 2026-09-06 | Theme revert to initial Warm Paper with Soft Slate Blue (#2D3E50) | User requested returning to the initial theme and replacing the dark navy blue with a lighter color; updated tokens to initial Warm Paper (`#F5F0E8` / `#FCFAF6` / `#EAE4DA`) and Saffron Gold (`#E5A044`), with dark navy replaced by refined Soft Slate Blue (`#2D3E50` / `#1E2B37` / `#3B5268`). Rebuilt and crawled 102/102 URLs OK. |
| 2026-09-06 | Clean White theme + neutral charcoal (all blue removed) & Image Scroll Parallax | User requested clean white background, removal of all blue colors, and parallax ("paradox") scroll animation on images so the site feels alive. Replaced canvas with pure white (`#FFFFFF`), alternate with `#F8F9FA`, text/chrome with neutral charcoal (`#1A1D20`, `#121416`), retained Saffron Gold (`#E5A044`), and implemented 60fps RAF-throttled image scroll depth engine. Rebuilt 102 pages; 102/102 URLs OK. |
| 2026-09-06 | Fix contact form labels overlapping placeholder text | The floating label rule was positioning labels absolutely inside input boxes, colliding with placeholders. Restored top-aligned static labels with warm gold focus-within highlight, removed conflicting `field` class on contact form groups, and regenerated all pages. |
| 2026-09-06 | Animation Governance Rules & Pre-Implementation Gate (`ANIMATION_RULES.md`) | Established mandatory verification rule file (`ANIMATION_RULES.md`) enforcing "Fast content + subtle motion + real HTML + excellent accessibility rather than lots of JS + huge animations + content hidden inside effects". Wired into `AGENTS.md` and `.agents/rules/`. |
| 2026-09-06 | SEO-Safe Premium Animation Combination | Implemented top scroll progress bar, subtle hero animated gradient mesh, floating ambient shapes, CSS GPU headline fade-up, scroll-triggered card reveals with hover elevation, icon micro-interactions, animated statistics counters, and full reduced-motion accessibility. 102/102 URLs OK. |
| 2026-09-06 | Remove `proposal/` directory | User requested deleting the legacy 24-slide proposal deck folder as the customer-facing website build is active. Removed `proposal/` and updated `robots.txt` and rule files accordingly. |
| 2026-09-06 | Hero Scenic Destinations Crossfade Slideshow | Implemented background slideshow cycling through Taj Mahal at dawn, Agra Fort, Mathura temples, Golden Triangle, and Yamuna Expressway every 5.5s with smooth 1.6s fade in/out, Ken Burns scale drift, location badge, and dot navigation. Strict compliance with `ANIMATION_RULES.md` and reduced-motion safety. |
| 2026-09-06 | 11 Famous Heritage & Hill Destinations (Highway removed) | Removed highway photo per user request and expanded background slideshow to 11 world-famous destinations: Taj Mahal, Agra Fort, Fatehpur Sikri, Mathura Yamuna Ghats, Vrindavan Prem Mandir, Delhi India Gate, Delhi Red Fort, Jaipur Hawa Mahal, Jaipur Amber Palace, Himachal Manali & Solang, and Himachal Shimla Ridge. Optimized WebP assets in `assets/destinations/`, responsive slide dot navigation, bilingual captions, 107/107 URLs OK. |
| 2026-09-06 | Hero Image Clarity (Blur Removed), 8s Relaxed Timing, Button Icons | Removed heavy dark/blur overlay and ambient orbs so landmark photos appear vivid and crystal clear; slowed slide rotation to 8.0s with 2.2s majestic crossfade; added icons (Phone, WhatsApp, Compass) and hover micro-animations to hero action buttons. 108/108 URLs OK. |

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
| 2026-09-03 | Docs / PRD | Created the final consolidated `PRD.md` (goals, scope, requirements, success metrics, release plan, non-goals, risks); linked it from `README.md` and `00_START_HERE.md` | `PRD.md`, `README.md`, `00_START_HERE.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-03 | Docs / PRD | Rewrote `PRD.md` to v2.0 Master: full-SEO strategy (intent → keyword → page → content → schema → technical → local → multilingual → measurement), engineering/architecture/scalability/security/QA/CI, design/UX, accessibility, analytics, definition-of-done and SEO checklist; wired it into `00_START_HERE.md` and `01_AI_OPERATING_INSTRUCTIONS.md`. **Note:** the user's attached `SEO Final BOSS.md` was not present as `/home/user/uploads/SEO Final BOSS.md` in the sandbox and was not read. | `PRD.md`, `00_START_HERE.md`, `01_AI_OPERATING_INSTRUCTIONS.md`, `README.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-05 | 16 / 1–4 | Session 2: Production file split — Light Premium tokens in `tokens.css` + `DESIGN.md`; 16 animation patterns in `css/components.css`; motion engine in `js/motion.js`; shell in `templates/base.html`; wired into `render_pages.py` (102/102 URLs OK). | `DESIGN.md`, `css/tokens.css`, `css/components.css`, `js/motion.js`, `templates/base.html`, `scripts/render_pages.py`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 17 / 1–4 | Phase 17: Integrated 21st.dev Cinematic Theme Switcher & Architectural Contact Card. Dark theme tokens in `tokens.css`; styling in `components.css`; interactive logic & persistence in `motion.js`; wired into `render_pages.py` and `templates/base.html` with anti-FOUC script, SVG defs, and single-H1 SEO compliance; verified 102/102 links OK at both bases. | `css/tokens.css`, `css/components.css`, `js/motion.js`, `scripts/render_pages.py`, `templates/base.html`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 18 / 1–6 | Phase 18: Applied Brand Name scramble, rolling nav links, button shimmer wave & active scale, form floating labels & gold focus rings, removed Demo Mock Data badge across 102 pages, added SVG icons (Call, WhatsApp, Email, Map). Verified 102/102 URLs OK. | `css/components.css`, `css/site.css`, `js/motion.js`, `templates/base.html`, `scripts/render_pages.py`, `book.html`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | Theme | Updated site theme to initial Warm Paper (`#F5F0E8` / `#FCFAF6` / `#EAE4DA`) and Saffron Gold (`#E5A044`), replacing dark navy blue with Soft Slate Blue (`#2D3E50` / `#1E2B37` / `#3B5268`). Verified 102/102 URLs OK. | `css/tokens.css`, `DESIGN.md`, `css/components.css`, `scripts/render_pages.py`, `04_PROGRESS_TRACKER.md` |


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
| 2026-09-03 | Docs / PRD | Created the final consolidated `PRD.md` (goals, scope, requirements, success metrics, release plan, non-goals, risks); linked it from `README.md` and `00_START_HERE.md` | `PRD.md`, `README.md`, `00_START_HERE.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-03 | Docs / PRD | Rewrote `PRD.md` to v2.0 Master: full-SEO strategy (intent → keyword → page → content → schema → technical → local → multilingual → measurement), engineering/architecture/scalability/security/QA/CI, design/UX, accessibility, analytics, definition-of-done and SEO checklist; wired it into `00_START_HERE.md` and `01_AI_OPERATING_INSTRUCTIONS.md`. **Note:** the user's attached `SEO Final BOSS.md` was not present as `/home/user/uploads/SEO Final BOSS.md` in the sandbox and was not read. | `PRD.md`, `00_START_HERE.md`, `01_AI_OPERATING_INSTRUCTIONS.md`, `README.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-05 | 16 / 1–4 | Session 2: Production file split — Light Premium tokens in `tokens.css` + `DESIGN.md`; 16 animation patterns in `css/components.css`; motion engine in `js/motion.js`; shell in `templates/base.html`; wired into `render_pages.py` (102/102 URLs OK). | `DESIGN.md`, `css/tokens.css`, `css/components.css`, `js/motion.js`, `templates/base.html`, `scripts/render_pages.py`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 17 / 1–4 | Phase 17: Integrated 21st.dev Cinematic Theme Switcher & Architectural Contact Card. Dark theme tokens in `tokens.css`; styling in `components.css`; interactive logic & persistence in `motion.js`; wired into `render_pages.py` and `templates/base.html` with anti-FOUC script, SVG defs, and single-H1 SEO compliance; verified 102/102 links OK at both bases. | `css/tokens.css`, `css/components.css`, `js/motion.js`, `scripts/render_pages.py`, `templates/base.html`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 18 / 1 | Brand hover scramble, rolling nav links, button shimmer wave & active press, form floating labels & glow, removed Demo Mock Data badge across 102 pages, added SVG icons (Call, WhatsApp, Email, Map) | `css/components.css`, `js/motion.js`, `templates/base.html`, `scripts/render_pages.py`, `book.html`, `css/site.css` |
| 2026-09-06 | 18 / 2 | Clean White palette (#FFFFFF canvas, #F8F9FA alternate), eliminated all blue hues (neutral charcoal #1A1D20, #121416), installed 60fps luxury image scroll parallax engine | `css/tokens.css`, `css/site.css`, `css/components.css`, `js/motion.js`, `DESIGN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 18 / 3 | Fixed form label collision with placeholder text: restored top-aligned labels with gold focus-within glow, removed conflicting field class, and rebuilt all 102 pages (102/102 OK) | `css/components.css`, `scripts/render_pages.py`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 18 / 4 | Positioned theme toggle at the last position on the right of the header (after CTA button) | `scripts/render_pages.py`, `templates/base.html`, `04_PROGRESS_TRACKER.md` |


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

### Phase 15 — Frontend performance/SEO hardening + drop-in image pipeline
- [x] 1. `scripts/images.py`: pure-Python WebP dimension reader (`webp_size`) — every `<img>` and the hero now emit dims **measured from the actual file at build time**, with the old constants kept only as fallbacks; verified against ImageMagick on all assets
- [x] 2. Auto-derivatives: `render_pages.py` rebuilds missing/stale `-480`/`-768`/hero `-sm` WebP renditions when a base asset changes (ImageMagick when present; graceful full-size fallback + warning when not). `scripts/make_image_derivatives.sh` is now a thin wrapper (`--force` redo)
- [x] 3. Hero LCP: preload now carries `imagesrcset`/`imagesizes` so mobile fetches the 960w crop instead of the 1920w file; fixed a `rebase()` leak that left `imagesrcset` root-relative (would 404 under the `/ArenaAI` subpath)
- [x] 4. Structured data #17 closed: `contactPoint` (customer care, en-IN/hi-IN) in `org_schema()`; `offers.availability` + build-rolled `priceValidUntil` (+365d) on route offers; package pages gain a `Service`+`Offer` block with live price
- [x] 5. `sitemap.xml` gains `<lastmod>` (build date — honest freshness signal at every deploy)
- [x] 6. First-paint latency: `content-visibility: auto` + `contain-intrinsic-size` on `.section` (browser skips layout/paint of off-screen sections; scrollbar-stable)
- [x] 7. QA: 100/100 URLs at both `/` and `/ArenaAI` bases; all JSON-LD parses; sitemap XML valid; 0 root-relative URL leaks in generated HTML

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

### Phase 16 — Session 2: Production File Split (Light Premium & Animation Engine)
- [x] 1. Update `DESIGN.md` and `css/tokens.css` with Light Premium tokens (Warm Ivory `#FAF7F0`, Deep Navy `#0A1128`, Gold `#B8941F`) and motion timing/easing variables
- [x] 2. Create `css/components.css` with all 16 production animation patterns from the approved showcase (Cascade, Blur, Roll, Shimmer, Spotlight, Marquee, Counters, FAQ, Scramble, Rotating, Curtain, Accordion, Parallax, Timeline, Gradient Border, Portal Field)
- [x] 3. Create `js/motion.js` lightweight (<3KB) vanilla JS motion engine with IntersectionObserver, cursor spotlight, scrambler, accordion, parallax, timeline, counters, and `prefers-reduced-motion` safety
- [x] 4. Create `templates/base.html` and wire `components.css` and `motion.js` into `scripts/render_pages.py`, regenerate all pages (102/102 URLs OK at both `/` and `/ArenaAI` bases)

### Phase 17 — Cinematic Theme Switcher & Architectural Contact Card (21st.dev Integration)
- [x] 1. Add Dark Navy theme token overrides to `css/tokens.css` with smooth transitions while preserving SEO contrast standards (AA 4.5:1) and existing Light Premium defaults
- [x] 2. Add styles for 21st.dev Cinematic Theme Switcher and 21st.dev Architectural Contact Card to `css/components.css`
- [x] 3. Add interactive logic for Cinematic Theme Switcher and Contact Card animations in `js/motion.js` with `prefers-reduced-motion` safety
- [x] 4. Wire anti-FOUC theme detector, SVG texture filters, theme switchers, and Contact Card into `scripts/render_pages.py` and `templates/base.html`, ensuring 100% SEO compliance (single H1, schema integrity, crawlable HTML); regenerate and verify with `check_links.py` (102/102 URLs OK at both bases)

### Phase 18 — Interactive Motion Polish, Brand/Nav/Button/Form Animations, Icon Suite & Mock Banner Deletion
- [x] 1. Brand animations: Wordmark scramble on desktop hover (`initBrandScramble` in `motion.js`), SVG logo spring scale & rotate (`scale(1.08) rotate(-3deg)`), and luminous gold glow pulse
- [x] 2. Navigation animations: Rolling nav links with dual `span` layers (`.roll`, `.roll-link`), smooth mobile sheet drawer transitions
- [x] 3. Button animations: Shimmer light sweep (`@keyframes btn-shimmer`), tactile active press (`scale(0.97)`), hover elevation with gold glow, arrow nudge (`translate(2px, -2px)`)
- [x] 4. Form animations: Floating labels with smooth scaling, 3px gold focus rings, input validation error shake animation, and contact form submission feedback
- [x] 5. Demo mock data badge: Completely removed from `templates/base.html`, `scripts/render_pages.py`, `book.html`, and hidden in `css/site.css`
- [x] 6. Icon suite: Added high-performance inline SVG icons for Call, WhatsApp, Email, Map across Header actions, Mobile Sheet drawer, floating Lead-bar, Contact Card, and Footer
- [x] 7. Build & crawl gate: 102/102 URLs verified 200 OK with `scripts/check_links.py` at both bases

### Phase 19 — Animation Governance Rules (`ANIMATION_RULES.md`) & SEO-Safe Premium Animation Combination
- [x] 1. Animation governance rule file: Created `ANIMATION_RULES.md` and `.agents/rules/ANIMATION_RULES.md` establishing the mandatory pre-implementation gate: "Fast content + subtle motion + real HTML + excellent accessibility rather than lots of JS + huge animations + content hidden inside effects". Updated `AGENTS.md` and `.agents/rules/` to mandate verification before adding animations.
- [x] 2. Reading progress indicator: Added fixed 3px gold scroll indicator (`#scroll-progress`) at the top of the viewport driven by passive, RAF-throttled scroll offset calculations.
- [x] 3. Hero animations: Implemented subtle animated gradient overlay mesh (`@keyframes hero-gradient-pulse`), floating ambient shapes (`.hero-ambient-orb`), GPU-accelerated headline fade-up, and CTA micro-interactions without hiding raw HTML text from crawlers.
- [x] 4. Services & Cards: Staggered scroll reveal (`.reveal-on-scroll` via `IntersectionObserver`), subtle 4px hover elevation, and icon micro-interaction (scale & rotate on hover).
- [x] 5. About & Trust metrics: Animated stat counter engine (`data-count`) animating numerical values with cubic ease-out upon viewport intersection.
- [x] 6. Accessibility: Complete `@media (prefers-reduced-motion: reduce)` overrides neutralizing all transforms, keyframe loops, and JS counter delays.
- [x] 7. Build & crawl gate: 102/102 URLs verified 200 OK with `scripts/check_links.py` at both bases.
- [x] 8. Hero background destinations crossfade slideshow: Added rotating high-resolution destinations cycling every 5.5s with smooth 1.6s fade in/out, Ken Burns scale drift, location badge, and dot navigation, strictly obeying `ANIMATION_RULES.md` and reduced-motion safety.
- [x] 9. Expansion to 11 Famous Heritage & Hill Destinations: Removed highway image per user request and added 11 world-famous destinations: Taj Mahal, Agra Fort, Fatehpur Sikri, Mathura Yamuna Ghats, Vrindavan Prem Mandir, Delhi India Gate, Delhi Red Fort, Jaipur Hawa Mahal, Jaipur Amber Palace, Himachal Manali & Solang Valley, and Himachal Shimla Ridge. Responsive dot navigation, bilingual captions, verified 107/107 URLs OK.
- [x] 10. Hero Widget Animations, Logo removal & Dynamic Location Badge: Added micro-animations to the booking widget (`.hero-widget` entrance rise, hover elevation, focus gold halo ring, button shimmer wave); removed logo SVG mark from header, nav-sheet, and footer leaving clean typography; removed static `.hero-side` ("Based in Agra" & "The Experience"); updated dynamic location badge to sync with image changes in real time with smooth fade/scale transition; batch-converted all 17 downloaded images in `assets/images/` to optimized WebP format. Verified 108/108 URLs OK.





