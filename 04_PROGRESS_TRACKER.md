# Progress Tracker — SK Baghel Tour & Travels

This file is a **living document**. Whoever implements a step updates it after that
step, per `react/docs/01_AI_OPERATING_INSTRUCTIONS.md` §3. Never rewrite history:
check boxes, append log rows, and update the Current State block.

The verbatim per-step log for the original static site and the React migration
(phases 1–32 and R3.5–R7) is preserved in git history — see the previous version of
this file at commit `2c02ee3`. The table below is the condensed record.

---

## Current State

- **Current Phase:** Phase M — HTML UI to React Migration — **COMPLETED** ✅
- **Current Step:** Step M10 complete (Homepage Refinements, Once-Per-Session Hero, 21st.dev Motion Cards, Admin Logo Animation). Next up: Phase I1 — Backend Integration & PostgreSQL.
- **Last updated:** 2026-09-25
- **Summary:** All HTML designs from `react/new_design/` are completely converted into the React application with ultra-luxury aesthetic styling, design tokens (`theme.css`), and the strict English-only mandate:
  * Master Design & Tokens: `@tailwindcss/vite`, `EB Garamond` + `Plus Jakarta Sans`, Material Symbols Outlined.
  * Global Chrome: Luxury `Header.tsx` (with mobile navigation drawer, delayed scroll reveal on first visit) and `Footer.tsx` (4-column layout with 28% advance guarantee), featuring the animated SVG compass rose & route from `BrandLogo.tsx`.
  * Universal Dynamic Package Detail: Single dynamic template `PackageDetailPage.tsx` driven by `TourPackage` props (`taj_mahal_sunrise_guided_tour.html`), supporting 1,000+ packages without static code explosion.
  * Curated Package Hub: `PackagesPage.tsx` (`packages.html`) with category tabs and decision matrix.
  * Universal 2-Step Booking Funnel: `BookingPage.tsx` (`step_1_taj_mahal_sunrise_guided_tour.html`, `step_2_booking_form_for_all.html`, `book_confirmed.html`) with 28% advance token and GST calculation.
  * Core Marketing & Corridor Hubs: `HomePage.tsx` with once-per-session `SmoothScrollHero`, point-to-point factual copy, 21st.dev motion bento cards, edge gradient fade masks on text roller, and Taj Mahal sunrise imagery.
  * Dynamic Templates: `RouteDetailPage.tsx` and `VehicleDetailPage.tsx` matching the new luxury design system and 2-step booking handoff.
  * Support & Compliance: `ContactPage.tsx` (`contact-us.html`), `FaqPage.tsx` (`faq.html`), `TermsPage.tsx` (`terms_condit.html`), `PrivacyPage.tsx` (`privacy_policy.html`), and `NotFoundPage.tsx` (`404.html`).
- **Verified:** `npm --prefix react run typecheck` passed (0 errors), `npm --prefix react run build` pre-rendered 37 static pages + 10 legacy redirects + sitemap (32 URLs), and monorepo `npm run verify` passed cleanly (3 typechecks, 55 backend unit tests, 3 builds).
- **Deployment monitoring (delivered with the integration branch):**
  `scripts/healthcheck.mjs` performs dependency-free checks of the API `/health`,
  the customer site and the admin site, wired to `.github/workflows/uptime.yml`
  (every 5 minutes, manual dispatch supported) and to `npm run healthcheck`, with
  `HEALTHCHECK_URLS` / `HEALTHCHECK_TIMEOUT_MS` / `HEALTHCHECK_ATTEMPTS` /
  `HEALTHCHECK_EXPECTED_STATUS` overrides. Delivered: uptime detection and the
  documented Render free-tier wake-up limitation. Still open in Phase I5: alert
  routing to a human (the workflow only fails), and request-ID correlation between
  the API and the frontends.
- **Open items:** API integration not started (both frontends still render the
  in-repo catalogue; `VITE_API_BASE_URL` is documented but unread). Payments remain
  mock until Phase I2. Placeholder NAP phone `+91 98765 43210` and stock photography
  must be replaced before launch. Dev-only Vitest advisory (2 moderate) needs the
  Vitest 5 major to clear.

---

## Blockers

| Blocker | Impact | Owner / next action |
|---|---|---|
| Client has not confirmed the real phone/WhatsApp number and final fare card | All CTAs and schema point at placeholder NAP | Client decision — `CLIENT_CONFIRMATION_FARES_AND_RULES.md` |
| Cloudflare Pages projects must be created/renamed to `skbagheltravels-customer` and `skbagheltravels-admin` and the domains repointed | Root deploy scripts and both `wrangler.jsonc` files now reference those names | Account owner (dashboard) |
| Render environment secrets are still `sync: false` placeholders | Production API cannot boot | Add values in the Render dashboard before the first API deploy |
| No live payment credentials / webhook drills | Booking remains advance-mock | Phase I2 |

---

## Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-09-14 | One repository, three independently deployable apps (`react/`, `admin/`, `backend/`), each with its own root directory, lockfile and build command | Hosts can deploy without coupling release cycles; no app is copied into a second repository |
| 2026-09-14 | Cloudflare Pages project names are `skbagheltravels-customer` and `skbagheltravels-admin`, used consistently by root scripts and every `wrangler.jsonc` | Provider-owned identifiers must be named once; a mismatch silently creates a second project |
| 2026-09-14 | Customer site keeps real 404 semantics (`404.html`, `not_found_handling: "404-page"`); admin uses an SPA fallback (`_redirects` + `single-page-application`) | Pre-rendered marketing URLs must return real 404s to crawlers; the admin is a client-routed panel that must survive refresh |
| 2026-09-14 | Builds write only inside `react/dist`, `admin/dist`, `backend/dist`; `generate-sitemap.ts` writes `react/dist` + the versioned `react/public` mirror and nothing else | A build must not dirty tracked files or write to the repository root; CI enforces it |
| 2026-09-14 | CI is the root command contract plus deploy guards, on Node 22 | One interface for CI, hosts and humans; Node 22 matches `engines`, Docker and Render |
| 2026-09-14 | Backend runtime image contains production dependencies only, with `.dockerignore` excluding `.env*` | Dev tooling never ships to production and secrets never enter the build context |
| 2026-09-14 | `VITE_API_BASE_URL` is documented and set in Pages as reserved configuration; no frontend code reads it until Phase I1 | Prevents a half-wired API integration from shipping silently |
| 2026-09-14 | Root docs are the monorepo of record (`README.md`, `02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md`, `PRD.md`); `react/docs/` keeps the frontend-specific pack and points at the root for shared docs | Removes two divergent copies of the same document |
| 2026-09-11 | Design Lock Registry (`DESIGN_LOCKS.md`): locked components/patterns cannot change without explicit user permission | Prevents silent drift of approved design work |
| 2026-09-10 | Legacy static HTML/CSS/JS/Python SSG codebase removed from the repository root; references preserved under `react/reference/` | One active frontend instead of a maintained and an unmaintained copy |
| 2026-09-10 | React workspace consolidated under `react/` with catalogue-driven route generation | The React app became the only customer frontend |
| 2026-09-09 | React migration ran beside the vanilla site, not as an in-place rewrite | Kept a working production baseline during the migration |
| 2026-09-07 | Payments spec (`docs/PAYMENT_SYSTEM.md`) with webhook + server-computed fare as the only source of payment truth; Razorpay primary, provider-neutral adapters | Real money requires webhook-confirmed state, never client confirmation |
| 2026-09-06 | Animation governance (`ANIMATION_RULES.md`) as a mandatory pre-implementation gate | Content first, motion second, accessibility always |
| 2026-09-03 | `PRD.md` is the master product-requirements document (goals, SEO/AISO strategy, design, engineering, QA gates) | One source of truth for "what we want" |
| 2026-09-01 | Bilingual URLs `/en/…` + `/hi/…`, English home at `/`, fares identical in both languages | Bilingual SEO without duplicating commercial data |
| 2026-09-01 | Call + WhatsApp are the primary conversions; `/book.html` is `noindex` | Phone/WhatsApp close this market; booking is secondary |
| 2026-09-01 | Dark Navy + Golden design system (`DESIGN.md`, `design-guide/`) is locked | Approved brand direction |

---

## Session Log (condensed)

| Date | Era / phase | What was delivered |
|---|---|---|
| 2026-09-01 | Phases 1–11 | Static bilingual marketing site: design tokens, mock catalogue, fare engine, shared chrome, 5-step booking, WebP asset pipeline, EN/HI SSG with hreflang and lead bars, responsive QA |
| 2026-09-03 | Docs | Consolidated `PRD.md` (v3.0 master): business goals, SEO/AI-search strategy, engineering, design, QA gates |
| 2026-09-05 – 2026-09-06 | Phases 16–25 | Light Premium token split, modular animation engine, theme switcher, contact card, hero destination slideshow, interactive grids, animation governance rules |
| 2026-09-07 | Phase 29 | Real market catalogue integration (fleet specs, per-km rates, packages, cancellation rules) |
| 2026-09-09 – 2026-09-10 | Phase 31/32 | Quality-audit CI, React migration contract and workspace, legacy static tree removed from the root, assets consolidated into `react/public/assets` |
| 2026-09-11 | Phase R5 | Design lock registry; marketing hubs and dynamic route/package/vehicle detail templates with schema graphs |
| 2026-09-12 | Phase R5.26–R6.5 | SSG pre-renderer (75 routes + redirects), sitemap/robots generator, SEO head + JSON-LD factories, LocationIQ hook, ARIA 1.2 combobox, backend architecture merged on `design/homepage` |
| 2026-09-13 | Backend | Fare engine, draft bookings, Razorpay/HMAC payment adapters, admin dispatch, catalog, reviews, inquiries, notifications, migrations, 38-test deterministic suite |
| 2026-09-14 | Deployment monitoring | `scripts/healthcheck.mjs`, `.github/workflows/uptime.yml` (5-minute schedule), `npm run healthcheck`, step-by-step Render + Cloudflare Pages deploy guide in `docs/DEPLOYMENT.md` |
| 2026-09-14 | Phase D1 | Deployment standardization: CI contract + guards, admin SPA routing, build-hygiene fix, Docker hardening, Pages project naming, doc pack rewritten (this file included) |
| 2026-09-25 | Phase M (M0–M2) | Master migration plan (`react/docs/MIGRATION_PLAN.md`), Tailwind CSS v4 setup, design tokens (`theme.css`), brand logo, luxury header with mobile nav sheet, footer with 28% advance guarantee, English-only mandate refactor |
| 2026-09-25 | Phase M (M3) | Universal dynamic tour package template (`PackageDetailPage.tsx`) powered by `TourPackage` props (`taj_mahal_sunrise_guided_tour.html`), curated package catalogue (`PackagesPage.tsx` from `packages.html`) with interactive category tabs and decision matrix |
| 2026-09-25 | Phase M (M4) | Streamlined 2-step universal booking funnel & transit voucher in `BookingPage.tsx` (`step_1_taj_mahal_sunrise_guided_tour.html`, `step_2_booking_form_for_all.html`, `book_confirmed.html`) wired to 28% advance token and GST calculation |
| 2026-09-25 | Phase M (M5) | Rebuilt all core marketing & support pages from `react/new_design/` (`HomePage.tsx`, `FleetPage.tsx`, `RoutesPage.tsx`, `ServicesPage.tsx`, `ContactPage.tsx`, `FaqPage.tsx`, `TermsPage.tsx`, `PrivacyPage.tsx`, `NotFoundPage.tsx`) under the English-only mandate |
| 2026-09-25 | Phase M (M6) | Full migration completion: converted dynamic templates (`AboutPage.tsx` from `services_why_choose_us.html`, `RouteDetailPage.tsx`, `VehicleDetailPage.tsx`) into the luxury design system; typecheck clean (0 errors), SSG pre-rendered 37 pages + 10 redirects + sitemap (32 URLs), and monorepo `npm run verify` passed 100% |
| 2026-09-25 | Phase M (M7–M8) | Master frontend standard: canonical `FRONTEND_RULES.md` created; oversized headlines globally scaled down to luxury editorial (Hero H1 26px, Section H2 20px); replaced legacy static reviews grid in `HomePage.tsx` with dual infinite `ReviewsMarquee` marquee (LOCK-N06); normalized oversized price displays in `FleetPage.tsx` and `ServicesPage.tsx`; removed stale unused `reviews` import; all DESIGN_LOCKS.md entries updated; `npm run verify` passed cleanly (3 typechecks, 55 backend tests, 3 builds) |
| 2026-09-25 | Phase M (M9) | Prestige Homepage Enhancements: added `InitialLoader.tsx` with 0-100% counter on pure white background with black capital `LOADING` typography; integrated `SmoothScrollHero` with Unsplash mobile photo `dCjcGh38WAc` by Shifan Hassan (*"A plane flying over Taj Mahal"*); implemented delayed navigation bar reveal in `Header.tsx` appearing only after scrolling past the hero image; lightened heavy button themes with brand terracotta and crisp `text-white` contrast; scroll-triggered reveals across sections preserving 100% SEO/AEO/GEO pre-rendering; monorepo `npm run verify` passed (3 typechecks, 55 backend tests, 3 production builds) |

---

## Checklist

### Customer site (`react/`)

- [x] Design system ported and locked (Dark Navy + Golden, Light Premium variants)
- [x] Marketing hubs, route/vehicle/package detail templates, bilingual copy
- [x] LocationIQ search with ARIA 1.2 combobox and offline fallback
- [x] SEO head manager: canonicals, hreflang, OG/Twitter, geo tags, JSON-LD graph
- [x] SSG pre-renderer + sitemap/robots generator wired into the build
- [x] Real 404 page and legacy redirect stubs
- [x] Fares and booking run on the local engine (mock, no server calls)
- [x] Multi-service customer booking funnel (outstation, local packages, transfers, tour packages)
- [x] Pre-rendering static HTML for `/book/`, `/en/book/`, `/hi/book/`, and `/book.html` preventing 404s
- [ ] Real photography and real NAP (Phase I4)

### Phase M — HTML UI to React Migration (`react/`)

- [x] **M0: Master Architecture & Planning** — `react/docs/MIGRATION_PLAN.md` created with dynamic package detail template architecture and token definitions.
- [x] **M1: Tailwind CSS & Design Token System Setup** — `@tailwindcss/vite` configuration, `@/styles/theme.css` tokens, Google Fonts (`EB Garamond`, `Plus Jakarta Sans`) & Material Symbols Outlined.
- [x] **M2: Global Chrome & Responsive Layout** — New luxury `Header.tsx` (with mobile nav drawer) and `Footer.tsx` (4-column layout with 28% advance guarantee).
- [x] **M3: Universal Dynamic Tour Package Template & Catalogue** — Rebuild `PackageDetailPage.tsx` dynamically driven by `TourPackage` props (`taj_mahal_sunrise_guided_tour.html`), and `PackagesPage.tsx`.
- [x] **M4: Streamlined 2-Step Universal Booking & Billing Engine** — Step 1 (choose car tier: `step_1_taj_mahal_sunrise_guided_tour.html`), Step 2 (universal booking/billing form for all packages & routes: `step_2_booking_form_for_all.html`), and confirmation voucher (`book_confirmed.html`) wired to `fareEngine.ts`.
- [x] **M5: Core Marketing Pages & Route Hubs** — `HomePage.tsx` (`home.html`), `FleetPage.tsx` (`fleet.html`), `RoutesPage.tsx` (`routes.html`), `ServicesPage.tsx` (`services.html`), and support/legal pages.
- [x] **M6: Verification, SSR Pre-Rendering & Build Quality** — Update `prerender.ts`, typecheck, build validation.
- [x] **M7: Master Frontend Standard & Typography Refinement** — Created canonical `FRONTEND_RULES.md` matching `BACKEND_RULES.md`, scaled down oversized headlines to luxury editorial scale (Hero 26px/20px, Section 20px/17px) while preserving compact 20% reduced body/card dimensions, zero mouse scroll hijacking, and passing monorepo `npm run verify`.
- [x] **M8: ReviewsMarquee Integration & Price Scale Normalisation** — Replaced legacy static traveller review grid in `HomePage.tsx` with the dual-row infinite `ReviewsMarquee` (LOCK-N06); normalised oversized price/tariff displays (`text-xl` → `text-base sm:text-lg`) in `FleetPage.tsx` and `ServicesPage.tsx`; removed unused `reviews` import from `HomePage.tsx`; registered LOCK-N06 in `DESIGN_LOCKS.md`; `npm run verify` green (3 typechecks, 55 backend tests, 3 builds).
- [x] **M9: Prestige Initial Loader, Scroll Hero Enhancements & Button Color Tuning** — Added `InitialLoader.tsx` (capital `LOADING`, 0–100% counter on pure white with black typography); configured Unsplash mobile photo `dCjcGh38WAc` (*"A plane flying over Taj Mahal"*); implemented delayed navigation bar reveal in `Header.tsx` after scrolling past the hero image; replaced heavy button styles with terracotta palette and high-contrast `text-white`; scroll-triggered section reveal animations with 100% crawlable SSG pre-rendering; monorepo `npm run verify` green (3 typechecks, 55 backend tests, 3 builds).
- [x] **M10: Homepage Refinements — Point-to-Point Copy, Hero Once-Per-Session, 21st.dev Motion Cards, Text Roller Fade Masks, Lightened Route Buttons & Ported Admin Compass Animation** — Converted marketing buzzwords across all homepage sections into direct, point-to-point factual copy; gated `SmoothScrollHero` to display once per user session (`sessionStorage`), instantly revealing top-level content on returning visits; updated static hero background image to Taj Mahal sunrise photo matching animation; softened Popular Routes buttons to light sandstone with primary hover border; added left/right fade-in/out gradient masks to Trust Ticker text roller; redesigned "Why book with us" into a 21st.dev motion bento grid with interactive hover elevation, staggered reveals, and animated copy feedback; ported admin panel's animated SVG compass rose & route into `BrandLogo.tsx` for global chrome branding; monorepo `npm run verify` green (3 typechecks, 55 backend tests, 3 builds).

### Admin panel (`admin/`)

- [x] Dashboard, bookings, finance, catalog, reviews, inquiries, fares, audit screens
- [x] RBAC permission matrix + role-aware navigation
- [x] SPA routing with `_redirects` fallback and noindex headers
- [x] Catalog management: "New item" and "Edit item" dialogs with backend API integration
- [x] Authoritative Fare Rules modification with versioned audit logging and live sync
- [x] Manual Desk / Phone Booking creation with server-authoritative fare snapshots
- [ ] Supabase-issued JWT sign-in replacing the demo `test-<role>` principal (Phase I1)
- [ ] Permission enforcement verified against the live API (Phase I3)

### Backend (`backend/`)

- [x] Fastify app with helmet, CORS allowlist, rate limiting, request IDs, error handler
- [x] Zod environment validation with production hard-fail rules
- [x] Fare engine, draft bookings with immutable fare snapshots, payments, refunds, audit log
- [x] Catalog, reviews, inquiries, notifications providers, LocationIQ geocoding
- [x] Migrations, seed, memory + PostgreSQL repositories, 38-test deterministic suite
- [x] Multi-stage production Dockerfile with pruned dependencies + `.dockerignore`
- [ ] Live payment credentials and webhook reconciliation drills (Phase I2)
- [ ] Uptime/alerting on `/health` and `/ready` (Phase I5)

### Deployment

- [x] Root command contract (`install:all`, `verify`, `typecheck`, `test`, `build:all`, `deploy:*`)
- [x] CI workflow with quality gate and deploy guards on Node 22
- [x] Cloudflare Pages naming standardized; per-app routing rules documented
- [x] `render.yaml` blueprint, `vercel.json` preview fallback, `docker-compose.yml`
- [x] `docs/DEPLOYMENT.md`: topology, release order, verification curls, rollback
- [x] Uptime monitoring: `scripts/healthcheck.mjs` + scheduled `uptime.yml` (`npm run healthcheck`)
- [ ] Pages projects created/renamed to the standardized names with domains attached
- [ ] Render secrets populated and first API deploy verified
- [ ] Uptime failures routed to a human (notifications/incident integration)
