# Progress Tracker — SK Baghel Tour & Travels

This file is a **living document**. The AI implementing the build updates it after
every single step, per `01_AI_OPERATING_INSTRUCTIONS.md` §3. Never rewrite history —
only check boxes, append log rows, and update the Current State block.

---

## Current State

- **Current Phase:** React migration Phase R2 / Phase 32 — React Parallel Workspace & Data Integration
- **Current Step:** React migration R2.3 — wire enriched data & pure fare engine into integrated React pages & test suite
- **Last updated:** 2026-09-10
- **Open items:** `visual_audit.mjs` still needs a networked machine; fonts self-hosting (sandbox blocks Google Fonts download); real photos + real NAP before launch (see `LAUNCH_CHECKLIST.md`); PRD v3.0 master rewrite includes full SEO Final BOSS content. Client decision points from the deck are open (§25 of PRD.md). Payments remain mock until `docs/PAYMENT_SYSTEM.md` is implemented.

---

## Blockers

_(none yet — add entries here as `Phase X / Step Y: description` when something
can't be resolved without user input)_

---

## Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-09-07 | Payments spec lives in `docs/PAYMENT_SYSTEM.md`; agents follow `.agents/rules/PAYMENT_AGENT_RULES.md`; webhook+server fare is source of truth; Razorpay + Cloudflare Worker/D1 | User asked for a zero-miss payment gateway template before buying Razorpay; live charges stay out of scope until that spec is built |
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
| 2026-09-09 | Begin Phase 32 React migration in parallel | The user requested a React migration. The existing vanilla MPA remains the production baseline while React is introduced under `react/`, avoiding an unsafe in-place rewrite and recording the architecture deviation explicitly. |
| 2026-09-06 | Hero Scenic Destinations Crossfade Slideshow | Implemented background slideshow cycling through Taj Mahal at dawn, Agra Fort, Mathura temples, Golden Triangle, and Yamuna Expressway every 5.5s with smooth 1.6s fade in/out, Ken Burns scale drift, location badge, and dot navigation. Strict compliance with `ANIMATION_RULES.md` and reduced-motion safety. |
| 2026-09-06 | 11 Famous Heritage & Hill Destinations (Highway removed) | Removed highway photo per user request and expanded background slideshow to 11 world-famous destinations: Taj Mahal, Agra Fort, Fatehpur Sikri, Mathura Yamuna Ghats, Vrindavan Prem Mandir, Delhi India Gate, Delhi Red Fort, Jaipur Hawa Mahal, Jaipur Amber Palace, Himachal Manali & Solang, and Himachal Shimla Ridge. Optimized WebP assets in `assets/destinations/`, responsive slide dot navigation, bilingual captions, 107/107 URLs OK. |
| 2026-09-06 | Hero Image Clarity (Blur Removed), 8s Relaxed Timing, Button Icons | Removed heavy dark/blur overlay and ambient orbs so landmark photos appear vivid and crystal clear; slowed slide rotation to 8.0s with 2.2s majestic crossfade; added icons (Phone, WhatsApp, Compass) and hover micro-animations to hero action buttons. 108/108 URLs OK. |
| 2026-09-06 | Radial Quick Actions Dock (.about) & Navigation Text Hover Curtain Fill | Integrated expanding radial quick dock navigation (.about) and outline-to-fill text hover animation with brand color grading (Saffron Gold #D9943B, Warm Charcoal #121416, Cream #FAF7F0). Supports Phone, WhatsApp, Tours, and Instant Booking with spring cubic-bezier expansion, touch/keyboard accessibility, and zero crawler impact. 108/108 URLs OK. |
| 2026-09-06 | Normal Navigation Font Weight & Google Maps Places Location Search | Normalized navigation link typography (font-weight 500, removed heavy 1px text stroke); integrated Google Maps Places Autocomplete API and 30+ destination catalog via `js/places.js`; replaced limited static selects with `.loc-picker` searchable comboboxes on Hero Widget and `book.html`; enhanced `fares.js` for dynamic distance & outstation fare quotes. 109/109 URLs OK. |
| 2026-09-06 | 21st.dev Interactive Background Grid on Trust Bar & Popular Routes (Phase 22) | Implemented interactive background grid pattern behind Trust Bar chips and Popular Routes section per 21st.dev / Aceternity design. Features 44px hairline grid, dynamic cursor spotlight, and interactive glowing grid cell trail via hardware-accelerated canvas. Full dark mode support (amber in light, luminous gold in dark), zero idle CPU overhead, non-blocking click safety (`pointer-events: none`), and SEO-safe progressive scroll reveal. 109/109 URLs OK. |
| 2026-09-06 | Universal Interactive Background Grid on All White Background Sections (Phase 23) | Extended the light and interactive background grid animation to every section with a white or light background (`.section--paper`, `.section--paper-lt`, `.page-hero`, `.book-layout`). Standardized subtle hairline grid lines (`rgba(18,20,22,0.048)` light / `rgba(255,255,255,0.065)` dark), cursor spotlight tracking, and hardware-accelerated glowing grid cell physics trail. Zero nesting conflicts, 0% idle CPU via per-section IntersectionObserver pausing, non-blocking click safety (`z-index: 2` on content). 109/109 URLs OK. |
| 2026-09-06 | 3D Coverflow Sightseeing & Packages Showcase in .section--navy (Phase 25) | Replaced static single-package card in `.section--navy` with an interactive 3D Coverflow Carousel displaying all same-day and heritage tour packages (Agra Sightseeing ₹3,500, Mathura Vrindavan ₹4,200, Agra Unhurried ₹7,800, Golden Triangle ₹18,500). Integrated React component in `components/ui/` with shadcn, Tailwind, and TypeScript setup, and implemented zero-dependency GPU-composite vanilla MPA version in `render_pages.py`, `components.css`, and `motion.js` meeting `ANIMATION_RULES.md`. |
| 2026-09-07 | Integrate competitive market data & research findings (Phase 29) | User requested integrating all findings from market research on ASTT (Agra Shiv Tour & Travels) into the website: fleet specifications & per-km pricing, local 8h/80km & 12h/120km packages, verified one-way fares (Agra–Delhi ₹3,499, Agra–Jaipur ₹3,499), 300 km/day outstation rule, night allowance (₹300/₹500 after 8PM), tour packages, cancellation policies, and the 6 Benefits To Book Cab With Us. Created `DATA_INTEGRATION_PLAN.md` and executed Step 29.1 in `catalog.py`. |

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
| 2026-09-09 | Post-Phase 31 | Added a non-blocking shining-text page-load overlay to generated pages, the booking page, and 404; it dismisses on the real window load event with reduced-motion support and no artificial fetch delay. | `scripts/render_pages.py`, `templates/base.html`, `css/components.css`, `js/motion.js`, `book.html`, `404.html`, generated pages |
| 2026-09-09 | Post-Phase 31 | Made the loader remain visible for at least 600ms on every page view, then fade after resources load; redesigned 404 with a compass marker, recovery actions, route discovery, and click-to-call support. | `scripts/render_pages.py`, `templates/base.html`, `css/components.css`, `js/motion.js`, `04_PROGRESS_TRACKER.md`, generated pages |
| 2026-09-09 | Post-Phase 31 | Replaced Google Maps Places with LocationIQ autocomplete for city, airport, landmark, and pickup-point search. Tokens remain runtime-configured in browser storage/global/query input and are not committed; local destination fallback and dynamic fare estimation remain available without a token. Rebuilt and verified 113/113 URLs OK. | `js/places.js`, `scripts/render_pages.py`, `book.html`, generated pages, `04_PROGRESS_TRACKER.md` |
| 2026-09-09 | 32 / 1 | Created the parallel React migration contract and documentation pack; reserved `react/` while keeping the vanilla site as the production baseline. | `REACT-MIGRATION-PLAN.MD`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `react/README.md`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-09 | 32 / 2 | Created the isolated React/Vite/TypeScript foundation with an accessible responsive shell, call and WhatsApp fallbacks, strict type checking, and a production build. | `react/package.json`, `react/package-lock.json`, `react/tsconfig.json`, `react/vite.config.ts`, `react/index.html`, `react/src/` |
| 2026-09-09 | 32 / 3 | Ported the approved design tokens, typed catalogue, contact data, fare engine, and runtime catalogue invariants into React. Built the app and verified the preview shell serves successfully. | `react/src/styles/tokens.css`, `react/src/styles/global.css`, `react/src/data/`, `react/src/features/booking/fareEngine.ts`, `react/src/main.tsx` |
| 2026-09-09 | 32 / 4a | Added the React shared shell: responsive header/mobile navigation, Call/WhatsApp/Book lead bar, safe document prefetching, loading indicator, error state, and application error boundary. | `react/src/components/Chrome.tsx`, `react/src/components/ErrorBoundary.tsx`, `react/src/app/prefetch.ts`, `react/src/app/App.tsx`, `react/src/styles/global.css` |
| 2026-09-09 | 32 / 4a-structure | Materialized the feature-based React structure with app routes, shared components, layout, page, data-feature ownership docs, utilities, and style ownership; moved the home composition into `HomePage` and the global shell into `SiteLayout`. | `react/src/app/routes.tsx`, `react/src/layouts/SiteLayout.tsx`, `react/src/pages/HomePage.tsx`, `react/src/features/contact/README.md`, `react/src/features/catalogue/README.md`, `react/src/utils/format.ts`, `react/src/components/README.md`, `react/src/styles/README.md`, `react/src/app/App.tsx`, `Architecture.md`, `react/README.md` |
| 2026-09-09 | 32 / 4b | Implemented the MakeMyTrip-style booking funnel foundation: journey search, route/date/time/passenger controls, responsive vehicle results, live fare summary, traveller details, promo code, payment method, mock processing, session draft persistence, validation, and AGR ticket confirmation. | `react/src/features/booking/BookingPage.tsx`, `react/src/app/App.tsx`, `react/src/styles/global.css` |
| 2026-09-09 | 32 / 5 | Migrated the marketing hubs into the React feature structure with localized, data-driven fleet, route, package, service, contact, about, and FAQ page rendering, responsive catalogue cards, and booking deep links. | `react/src/pages/MarketingPage.tsx`, `react/src/app/App.tsx`, `react/src/styles/global.css` |
| 2026-09-09 | 32 / 6 | Added route-aware React detail rendering for route, vehicle, and package slugs, with localized booking links, detail content, document titles, and description metadata. Verified the React dev server, fleet hub, vehicle detail page, mobile width, and production build. | `react/src/pages/MarketingPage.tsx`, `react/src/styles/global.css` |
| 2026-09-09 | 32 / 7a | Added a centralized React route registry and legacy hub normalization, expanded English/Hindi route-detail matching, added local-date-safe booking defaults, 24-hour draft expiry, and query hydration for route/from/to/date/time/trip/pax/vehicle/coupon. Verified English, Hindi, legacy root hub, and booking deep-link routes in the browser; typecheck/build passed. | `react/src/app/routes.tsx`, `react/src/app/App.tsx`, `react/src/features/booking/BookingPage.tsx`, `react/src/pages/MarketingPage.tsx` |
| 2026-09-09 | 32 / 7b | Replaced the React home placeholder with the source HTML's core responsive composition: scenic hero slideshow controls, fare search widget, trust credentials, service cards, fleet cards, package cards, and conversion CTA. Preserved typed catalogue data, responsive layout, image dimensions/lazy loading, and approved design tokens. Verified at a mobile browser viewport with no horizontal overflow; typecheck/build passed. | `react/src/pages/HomePage.tsx`, `react/src/styles/global.css`, `react/src/styles/tokens.css` |
| 2026-09-09 | 32 / 8a | Expanded route, vehicle, and package detail pages beyond placeholders to match source HTML patterns: responsive image/content split, fare and vehicle specs, model lists, package included/excluded checklists, route fare comparison table, localized vehicle links, and call/WhatsApp/booking actions. Verified package and Hindi route pages in the browser; typecheck/build passed. | `react/src/pages/MarketingPage.tsx`, `react/src/styles/global.css` |
| 2026-09-09 | 32 / 8b | Migrated remaining hub content patterns for services, contact, FAQ, privacy, and terms; added FAQ disclosure sections, legal sections, contact details, service cards, and corrected shared React navigation to link to real migrated hubs plus Hindi home. Verified FAQ rendering and production build. | `react/src/pages/MarketingPage.tsx`, `react/src/styles/global.css`, `react/src/components/Chrome.tsx` |
| 2026-09-09 | 32 / 8c | Crawled all 60 generated EN/HI, home, and booking paths through the React Vite dev server; every path returned HTTP 200. Verified services hub at mobile width with one H1, five service cards, seven navigation links, and no horizontal overflow; typecheck/build passed. | React dev server, `react/src/app/App.tsx`, `react/src/app/routes.tsx` |
| 2026-09-09 | React migration R1.1–R1.7 | Created isolated React/Vite/TS foundation, static output under dist/react, strict `@/*` path mapping, app error boundary, tokens layer, typed site configuration, and migration build gate. | `react/src/`, `react/vite.config.ts`, `04_PROGRESS_TRACKER.md` |
| 2026-09-10 | React migration R2.1 | Unified domain models & scraped dataset in `react/src/data.ts`. Integrated all 6 operational verticals, 10 Agra monuments with visiting timings/emperor data, 7 outstation destinations (Gwalior, Nainital, Corbett, Dholpur, Bharatpur, Mathura, Alwar), 6 core benefit cards, 28 Agra localities, pet-friendly & intercity FAQs, 24-hr cab cancellation & 6-tier tour refund slabs, and 4.9/5 verified reviews. Verified strict TypeScript check. | `react/src/data.ts`, `react/src/config.ts`, `04_PROGRESS_TRACKER.md` |
| 2026-09-10 | React migration R2.2 | Pure typed fare engine in `react/src/fares.ts`. Ported `js/fares.js` into strict TypeScript with `localTomorrow` timezone safety, dynamic distance matrix for 28 destinations, outstation 300km/day min and 1.85x multipliers, ₹300/₹500 night allowances (20:00–06:00), `ASTTCAR500OFF` promo logic, local sightseeing package tiers, and 28% advance deposit calculations. Verified strict TypeScript and production Vite build. | `react/src/fares.ts`, `04_PROGRESS_TRACKER.md`, `REACT-MIGRATION-PLAN.md` |


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
| 2026-09-06 | 20 / 1 | Radial floating dock (.about) with Phone, WhatsApp, Tours, and Instant Booking actions; dual curtain wipe and text stroke-fill gradient transition on desktop navigation links; mobile touch toggle in motion.js; rebuilt 102 pages (108/108 URLs OK) | `scripts/render_pages.py`, `css/components.css`, `js/motion.js`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 21 / 1 | Navigation typography normalized to font-weight 500 (removed -webkit-text-stroke); created js/places.js for live Google Places API Autocomplete and 30+ Indian destinations; implemented .loc-picker search combobox with Google Maps connection on Hero Widget and book.html; dynamic fare estimation in fares.js; rebuilt 102 pages (109/109 URLs OK) | `css/components.css`, `js/places.js`, `js/fares.js`, `js/booking.js`, `scripts/render_pages.py`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 25 / 1 | React shadcn/ui Coverflow Carousel component integration (components/ui/coverflow-carousel.tsx, components/ui/demo.tsx, lib/utils.ts, components.json, tsconfig.json, lucide-react in package.json). Replaced static .section--navy with 3D Coverflow showcase with synchronized package kicker, heading, blurb, all-inclusive fare, places pills, and WhatsApp/details CTAs in scripts/render_pages.py, css/components.css, and js/motion.js. Rebuilt 109 pages; crawled 109/109 URLs OK. | `components/ui/coverflow-carousel.tsx`, `components/ui/demo.tsx`, `lib/utils.ts`, `components.json`, `tsconfig.json`, `package.json`, `scripts/render_pages.py`, `css/components.css`, `js/motion.js`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 25 / 2 | Fixed trust roller overlap & visibility by closing unclosed interactive-grid-bg div and placing roller in dedicated flow container; restored interactive background grid across all white sections via DOM balance and ResizeObserver; created standalone pure HTML/CSS/JS coverflow-carousel.html demo. Rebuilt 109 pages; crawled 109/109 URLs OK. | `scripts/render_pages.py`, `css/components.css`, `js/motion.js`, `coverflow-carousel.html`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 26 / 1 | Fixed dark mode text visibility: corrected dark mode --white token from dark charcoal #242220 to crisp light white #FDFCFB; replaced hardcoded var(--navy) text colors in site.css with adaptive var(--text); added global dark mode WCAG 2.2 AA text contrast rules across all headings, paragraphs, forms, inputs, cards, chips, and components (17.6:1 contrast ratio). Rebuilt 109 pages; crawled 109/109 URLs OK. | `css/tokens.css`, `css/site.css`, `scripts/render_pages.py`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 27 / 1 | Restored landing page full-screen hero slideshow: single screen-covering background image with smooth unhurried crossfade transitions every 8 seconds across 11 world-famous destinations (Taj Mahal, Agra Fort, Fatehpur Sikri, Mathura, Prem Mandir, India Gate, Red Fort, Hawa Mahal, Amber Palace, Akshardham, Manali, Shimla) with synchronized location badge and slide nav dots. Rebuilt 109 pages; crawled 109/109 URLs OK. | `scripts/render_pages.py`, `index.html`, `hi/index.html`, `04_PROGRESS_TRACKER.md` |
| 2026-09-06 | 28 / 1 | Integrated 2-Row Liquid Glass Marquee Reviews Section in React shadcn structure (components/ui/marquee-card.tsx, components/ui/marquee.tsx, components/ui/liquid-glass-card.tsx, components/ui/badge.tsx, components/ui/button.tsx, components/ui/demo.tsx, tailwind.config.js, styles/globals.css) and production website tech stack (scripts/render_pages.py, css/components.css). Features 2 opposing marquee rows (Row 1 left, Row 2 right, pauseOnHover), verified Unsplash avatars, Lucide star icons, and dual light/dark liquid glass contrast. Rebuilt 109 pages; crawled 109/109 URLs OK. | `components/ui/marquee-card.tsx`, `components/ui/marquee.tsx`, `components/ui/liquid-glass-card.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/demo.tsx`, `tailwind.config.js`, `styles/globals.css`, `scripts/render_pages.py`, `css/components.css`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 29 / 1 | Step 29.1: Updated `scripts/catalog.py` with verified fleet per-km rates (Sedan ₹10, Ertiga ₹14, Innova ₹18, Tempo ₹25, Urbania ₹34), fixed one-way routes (Agra–Delhi ₹3,499, Agra–Jaipur ₹3,499, Agra–Mathura ₹2,200, Agra–Local ₹1,900), multi-day & same-day tour packages (Same Day Taj Mahal ₹3,499, Sunrise Tour ₹12,999, Mathura–Vrindavan ₹4,200, Gatimaan Express ₹14,999, Agra Overnight ₹7,800, Golden Triangle ₹18,500), night allowances (₹300 cabs / ₹500 tempos after 8PM), and cancellation constants. | `scripts/catalog.py`, `DATA_INTEGRATION_PLAN.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 29 / 2 | Step 29.2: Synchronized `js/fares.js` and `js/data.js` with verified fleet per-km rates, local 8h/80km & 12h/120km packages, 300 km/day minimum billing for outstation round trips, night allowance (₹300 cabs / ₹500 tempos from 20:00 to 06:00), and coupon `ASTTCAR500OFF` (flat ₹500 off >= ₹2,000). | `js/fares.js`, `js/data.js`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 29 / 3 | Step 29.3: Updated `legal_body()` in `scripts/render_pages.py` to publish the authentic 24-hr cab cancellation policy (100% refund in 5–7 business days), 6-tier tour package cancellation fee schedule (61+ days 0% fee down to 0–5 days 100% fee), passenger conduct, and Agra jurisdiction. | `scripts/render_pages.py`, `en/terms/index.html`, `hi/terms/index.html`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 29 / 4 | Step 29.4: Implemented `render_benefits_section(lang)` displaying the 6 verified core cards (Easy Booking, Multiple Fleets, Lowest Fares, Exciting Offers with coupon `ASTTCAR500OFF`, On-Time Service, 24×7 Support), expanded services in `services_body()` and `home_body()` to 6 operational verticals (One-Way, Outstation Round Trip, Local Sightseeing, Airport Transfers, Tempo/Urbania, Tour Packages), added benefit card styling in `css/components.css`, updated `scripts/i18n.py` and `FAQS`, regenerated tree (exit code 0), and passed `scripts/check_links.py` (113/113 URLs OK, 0 failed). | `scripts/render_pages.py`, `scripts/i18n.py`, `css/components.css`, `scripts/catalog.py`, `js/data.js`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 29 / 5 | Step 29.5: Upgraded Tour Package (`package_body`) & Route (`route_body`) templates. Enriched all 6 tour packages in `scripts/catalog.py` with detailed hourly timelines, inclusions, exclusions, and vehicle upgrade pricing matrices; added `ROUTE_GUIDANCE` to all routes with highway names, transit times, departure tips, rest stops, and night rules; added bilingual timeline and guidance styles in `css/components.css`; wired into `scripts/render_pages.py` and `scripts/i18n.py`; regenerated all pages and verified with `scripts/check_links.py` (113/113 URLs OK, 0 failed). | `scripts/catalog.py`, `scripts/render_pages.py`, `scripts/i18n.py`, `css/components.css`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 29 / 6 | Step 29.6: Full static rebuild & verification. Wired coupon input UI and coupon engine (`ASTTCAR500OFF`) into Step 4 (advance review) and confirmation ticket in `js/booking.js` and `scripts/render_pages.py`; added dual `id` and `slug` lookup resolution in `js/fares.js` and `js/data.js` for 100% deep-link compatibility (`book.html?package=...`); executed static rebuild (`python3 scripts/render_pages.py`); verified all 113 bilingual URLs with `scripts/check_links.py` (113/113 OK, 0 failed); confirmed 100% single H1 and strict heading hierarchy across all routes and packages. Phase 29 complete. | `scripts/render_pages.py`, `js/booking.js`, `js/fares.js`, `js/data.js`, `book.html`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 30 / 1 | Step 30.1: Harmonized Home page hero visual psychology across light and dark themes. In Light Mode, implemented sunlit morning overlay (`rgba(255,255,255,0.95)` to transparent), vivid daylight image filter (`contrast(1.04) brightness(1.04) saturate(1.08)`), high-contrast charcoal (`#1A1D20`) & Saffron Gold (`#D98A28`) H1 typography, and frosted white location badge; in Dark Mode (`Solar Dusk`), implemented deep twilight vignette, jewel-tone filter, starlight white and Solar Amber typography; added image skeleton shimmer (`@keyframes skeleton-shimmer`) in `components.css`. Rebuilt and verified with `check_links.py` (113/113 OK). | `css/tokens.css`, `css/site.css`, `css/components.css`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 30 / 2 | Step 30.2: Remaining Fleet Tiers & Transfers Matrix. Enriched fleet definitions with sub-tier models (Wagon R/Tiago hatchback at ₹10/km under Sedan, Fortuner VIP at ₹35/km under Innova, 9–26s Tempos, 9–17s Urbanias) and rate ranges in `catalog.py` and `data.js`; created comprehensive Airport & Station transfers matrix (Agra Cantt/Fort ₹800, Agra Airport ₹900, Delhi IGI Airport ₹3,499); rendered responsive transfers table and model lists in `fleet_hub_body` and `vehicle_body`; rebuilt static tree and verified 113/113 links OK. | `scripts/catalog.py`, `js/data.js`, `scripts/render_pages.py`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 30 / 3 | Step 30.3: 10/10 Scorecard SEO & CRO Upgrades. Injected comprehensive `BreadcrumbList` and contextual `FAQPage` JSON-LD schemas across all route and package detail pages; added `og:locale:alternate` to `<head>`; upgraded WhatsApp CTA links with contextual pre-filled enquiry strings and coupon `ASTTCAR500OFF`; built International Currency Estimator (INR / USD / EUR / GBP) on package detail pages with live price switching; added semantic FAQ accordions to route and package templates; verified 113/113 URLs OK. | `scripts/render_pages.py`, `css/components.css`, `js/motion.js`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 30 / 4 | Step 30.4: Rebuild, Crawl Gate, and Visual QA. Executed static rebuild (`python3 scripts/render_pages.py`); ran link audit crawling 113 URLs with 113 OK and 0 failed (`scripts/check_links.py`); verified syntax of all client JS modules (`node -c`); verified single H1, valid title and meta descriptions, and complete 4-schema JSON-LD graphs across all pages; confirmed HTTP 200 responses on running preview server. Phase 30 complete. | `scripts/render_pages.py`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 31 / 1 | Step 31.1: Deployment Guardrails & Cloudflare Configuration. Created `.wranglerignore`, `.pagesignore`, `.ignore`, and `wrangler.jsonc` to strictly block `node_modules/`, `workerd` (147 MiB binary), scripts, and dev files from static asset uploads; updated `.gitignore` with `.wrangler/` and build directories. | `.wranglerignore`, `.pagesignore`, `.ignore`, `wrangler.jsonc`, `.gitignore`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 31 / 2 | Step 31.2: Automated Senior Frontend Quality Auditor Engine. Built `scripts/quality_audit.py` auditing 5 core categories (Technical SEO, Schema.org JSON-LD, Cloudflare asset budget ceiling, crawl/link integrity, accessibility & JS health). Verified 10.0/10.0 A+ score across all 60 production pages and generated `quality_report.md`. | `scripts/quality_audit.py`, `scripts/i18n.py`, `quality_report.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 31 / 3 | Step 31.3: GitHub Actions CI Workflow. Created `.github/workflows/quality.yml` executing SSG page build, preview server launch, Senior Quality & SEO Auditor (`quality_audit.py`), Cloudflare 25 MiB asset budget scan, and automated GitHub Step Summary publication. | `.github/workflows/quality.yml`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | 31 / 4 | Step 31.4: Comprehensive QA & Final Verification. Executed full static regeneration (`python3 scripts/render_pages.py`), verified 113/113 URLs OK (0 broken links) via `scripts/check_links.py`, executed Senior Frontend Quality Auditor (`scripts/quality_audit.py`) achieving 10.0/10.0 A+ score, verified 0 assets > 25 MiB, and confirmed HTTP 200 responses on local preview server. Phase 31 complete. | `scripts/quality_audit.py`, `quality_report.md`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | Cloudflare | Deployment Hotfix: Created `.assetsignore` (official Cloudflare Workers Static Assets ignore file) to strictly exclude `.git/` (blocking the 51.7 MiB packfile error) and `node_modules/` from Wrangler asset scans. | `.assetsignore`, `scripts/quality_audit.py`, `04_PROGRESS_TRACKER.md` |
| 2026-09-07 | Theme / Light Mode | Applied Vercel 21st.dev light-mode palette to `:root` in `css/tokens.css`: near-black `#0A0A0A` text, `#FAFAFA` alt bg, Vercel neutral grays (`#737373` muted, `#A3A3A3` muted-lt, `#F5F5F5` tint), 6px/10px radius, Geist+Inter prepended to UI font stack, subtle shadows (`rgba(0,0,0,0.06)`). Brand Saffron Gold retained as CTA/focus accent. Dark mode (Solar Dusk) unchanged. Updated `DESIGN.md` to v3.0. Rebuilt and verified 113/113 URLs OK. | `css/tokens.css`, `DESIGN.md`, `04_PROGRESS_TRACKER.md` |





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
- [x] 11. Navigation normal font weight & Google Maps Places API location picker: Normalized navigation links to 500 normal font weight; built `js/places.js` with Google Maps Places Autocomplete integration and 30+ destination database; upgraded Hero Widget and `book.html` to custom `.loc-picker` searchable comboboxes; updated `fares.js` for dynamic outstation fare pricing. Verified 109/109 URLs OK.

### Phase 22 — 21st.dev Interactive Background Grid (Trust Bar & Popular Routes)
- [x] 1. Interactive Grid Architecture: Added `.interactive-grid-section` container encompassing Trust Bar chips and Popular Routes cards in `scripts/render_pages.py`.
- [x] 2. Hairline Grid Pattern: Implemented 44px × 44px radial hairline grid with smooth radial ellipse mask fade in `css/components.css`.
- [x] 3. Dynamic Cursor Spotlight: Integrated cursor-following radial spotlight (`--grid-mouse-x`, `--grid-mouse-y`) with smooth opacity transitions on hover.
- [x] 4. Canvas Glowing Grid Trail: Built hardware-accelerated `<canvas class="interactive-grid-canvas">` engine in `js/motion.js` rendering illuminated grid cells with glowing borders, intersection crosshairs, and smooth physics decay trail.
- [x] 5. Dark Mode & Accessibility: Full theme switching support (amber glow in light mode, luminous warm gold in dark mode); zero idle CPU overhead (RAF pauses when idle or off-screen via IntersectionObserver); click safety (`pointer-events: none`); and SEO-safe progressive scroll reveal.
- [x] 6. Build & Link Verification: Rebuilt all 54 pages; passed `scripts/check_links.py` with 109/109 OK; verified visually via Playwright in both light and dark modes.

### Phase 23 — Interactive Background Grid across All White Background Sections
- [x] 1. Universal Coverage: Expanded interactive grid to every section with a white or light background (`.section--paper`, `.section--paper-lt`, `.page-hero`, `.book-layout`).
- [x] 2. Dynamic Injection Engine: Updated `initAllInteractiveGrids()` in `js/motion.js` to automatically mount the grid lines, spotlight, and canvas to every qualifying section with zero boilerplate overhead.

### Phase 24 — Asymmetric Living Bento Grid Hero, Solar Dusk Dark Theme, Navigation Dropdowns & Trust Roller Marquee
- [x] 1. Solar Dusk Dark Theme: Implemented exact palette from shadcn/ui Solar Dusk theme (`--bg: #181615`, `--bg-alt: #201E1D`, `--surface: #242220`, `--border: #3D3936`, `--gold: #F76002`, `--radius: 0.3rem`, white headings `#FDFCFB`, muted `#B5AFA9`) preserving strict WCAG 2.2 AA contrast.
- [x] 2. Asymmetric Living Bento Grid Hero: Transformed hero image presentation from single slide into 3-cell bento mosaic (Main Stage iconic landmarks, Top Perspective heritage marvels, Bottom Perspective sacred ghats & hills) with independent staggered cycles (8.0s per landmark, 2.6s offsets) and Ken Burns micro-motion.
- [x] 3. Navigation Dropdowns with Preserved Motion: Added interactive luxury dropdowns for Services, Routes, Packages, Fleet, and Contact while preserving the signature `.roll-link text` golden liquid curtain animation, rotating micro-chevron, active parent hold state, and mobile sheet groups.
- [x] 4. Trust Roller Marquee with Icons & E-E-A-T Schema: Converted static trust chips into infinite smooth horizontal marquee (`trust-roller-scroll 42s linear infinite`) with pause-on-hover, soft edge fade masks, custom SVG icons (Shield, Chauffeur ID, GST Invoice, Golden Star, Monument, 24/7 Headset, Rupee, Location Pin), and Schema.org `AggregateRating` microdata.
- [x] 5. Build & Link Verification: Rebuilt all 54 pages with `render_pages.py` (0 errors); passed `check_links.py` 109/109 OK; verified curl outputs.

### Phase 29 — Real-World Market Data & Catalogue Integration (ASTT Research Integration)
- [x] 1. Catalog & Engine Master Update: Updated `scripts/catalog.py` with verified fleet per-km rates (Sedan ₹10, Ertiga ₹14, Innova ₹18, Tempo ₹25, Urbania ₹34), fixed one-way routes (Agra–Delhi ₹3,499, Agra–Jaipur ₹3,499, Agra–Mathura ₹2,200, Agra–Local ₹1,900), multi-day & same-day tour packages (Same Day Taj Mahal ₹3,499, Sunrise Tour ₹12,999, Mathura–Vrindavan ₹4,200, Gatimaan Express ₹14,999, Agra Overnight ₹7,800, Golden Triangle ₹18,500), night allowances (₹300 cabs / ₹500 tempos after 8PM), and cancellation constants.
- [x] 2. Client-Side Fares & Data Synchronization: Updated `js/fares.js` and `js/data.js` with matching rates, local 8h/80km & 12h/120km package tiers, coupon `ASTTCAR500OFF`, and 300 km/day outstation rules.
- [x] 3. Authentic Terms & Cancellation Policy: Updated `legal_body()` in `scripts/render_pages.py` and legal pages with the 24-hr cab cancellation policy, full 6-tier tour package refund schedule, night charge rules, and privacy assurances.
- [x] 4. "Benefits To Book Cab With Us" Component: Added `render_benefits_section(lang)` in `scripts/render_pages.py` displaying the 6 core benefit cards, expanded operational verticals in `services_body()` and `home_body()` to 6 services, added CSS styles in `css/components.css`, synchronized `i18n.py` and `FAQS`, and verified 113/113 links OK.
- [x] 5. Tour Package & Route Pages Template Upgrade: Add hourly timelines, inclusions/exclusions, vehicle upgrade tables, and extra-KM terms to `package_body()` and `route_body()`.
- [x] 6. Static Rebuild & Verification: Rebuild static tree (`python3 scripts/render_pages.py`), run link verification, test booking flow on `book.html`, and finalize tracker log.

### Phase 30 — Hero Visual-Psychological Color Tuning & 10/10 Scorecard Completion
- [x] 1. Hero Visual Psychology & Dual-Theme Color Harmony: Replaced dark overlay in light mode with sunlit morning gradient, vivid daylight image grading, crisp charcoal/gold headline typography, and theme-adaptive location badge; Solar Dusk cinematic jewel-tone grading in dark mode; image skeleton shimmer animation.
- [x] 2. Remaining Fleet Tiers & Transfers: Add Hatchback (Wagon R/Tiago at ₹10/km), luxury references, Tempo/Urbania variants, and dedicated airport/station transfer flat-fare matrix to `catalog.py`, `data.js`, and `fares.js`.
- [x] 3. 10/10 Scorecard SEO & CRO Upgrades: Inject `FAQPage` and `BreadcrumbList` JSON-LD schema, `fetchpriority="high"`, dynamic WhatsApp booking query generator, and International Currency Estimator (INR/USD/EUR) on package pages.
- [x] 4. Rebuild, Crawl Gate, and Visual QA: Static rebuild, link audit, visual verification across viewports, and tracker log finalization.

### Phase 31 — Automated Frontend Quality CI/CD & Cloudflare Deployment Guard
- [x] 1. Deployment Guardrails & Cloudflare Configuration: Create `.wranglerignore`, `.pagesignore`, `.ignore`, and `wrangler.jsonc` to strictly block `node_modules/`, `workerd` (147 MiB binary), and development files from static asset uploads.
- [x] 2. Automated Senior Frontend Quality Auditor Engine: Build `scripts/quality_audit.py` with multi-category scorecard checks (SEO & metadata, Schema.org JSON-LD graph, asset size ceiling, crawl/link health, accessibility, client JS syntax).
- [x] 3. GitHub Actions CI Workflow: Build `.github/workflows/quality.yml` running the complete build, audit, and asset size verification on every push and PR with automated step summary generation.
- [x] 4. Comprehensive QA & Final Verification: Run `quality_audit.py`, verify 10/10 Scorecard pass, confirm preview server and static tree health, and finalize tracker log.

### Phase 32 — React migration documentation and parallel workspace
- [x] 1. Created the React migration plan, architecture, rules, phases, design reference, and reserved `react/` workspace without changing the vanilla site.
- [x] 2. Created the React foundation without changing the root vanilla site.
- [x] 3. Ported the design system and typed data with parity checks.
- [x] 4. Port shared chrome, marketing pages, detail pages, and booking in separate verified steps.
- [x] 5. Add React route metadata (canonical, robots, language, Open Graph, LocalBusiness JSON-LD) and generate static entry points for the migrated route tree during the Vite production build.
- [x] 6. Complete parity, accessibility, responsive, and performance gates before cutover. Verified with React typecheck/build, 60 generated entry points, 58/58 bilingual route parity, full HTML and asset crawl, representative browser checks at desktop/mobile widths, one-H1 and labelled-control checks, reduced-motion emulation, and no horizontal overflow at desktop width.

**Phase 32 acceptance verification (2026-09-10):** Migration documents remain aligned, the vanilla tree was not replaced, and the React build now emits the complete bilingual route tree plus root and booking entry points. All generated HTML and copied assets returned HTTP 200 from the production preview. The React UI passed representative accessibility and responsive checks. React remains a parallel track until an explicit production cutover phase is approved.

