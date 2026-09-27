# Phase Plan — SK Baghel Tour & Travels

The plan for the monorepo. Phases 1–32 built the original static site; that site
was retired when the React platform moved into `react/`. History is preserved in
git (see `04_PROGRESS_TRACKER.md`). What follows is the current plan of record.

Work one step at a time. Update `04_PROGRESS_TRACKER.md` after every step.

---

## Delivered — platform baseline

| # | Phase | What shipped | Acceptance evidence |
|---|---|---|---|
| A | Static marketing site | Bilingual EN/HI marketing tree, fare calculator, mock booking, SEO/schema, animation rules | Superseded by phase C; content and URLs carried forward |
| B | Backend architecture | Fastify + TypeScript API: fares, booking drafts, payments, dispatch, catalog, reviews, inquiries, notifications, audit | 38 deterministic tests green (`npm test`); DB connectivity tests run with live credentials |
| C | React migration | `react/` customer app: design system port, shared chrome, marketing hubs, detail templates, LocationIQ search, ARIA-correct combobox, theme switcher, prerendered SSG output | `npm run customer:build` emits 75 pages + 10 redirects + 71-URL sitemap; 0 TypeScript errors |
| D | Operations desk | `admin/` Vite + React panel: dashboard, bookings, finance, catalog, reviews, inquiries, fares, audit, RBAC matrix, demo sign-in | `npm run admin:build` green; permission matrix in `admin/src/lib/types.ts` |
| E | Assessment & audit | `react/docs/05_FRONTEND_FIX_PLAN.md`, `06_AUDIT_REPORT.md`, per-page QA scripts in `scratch/` | Reports committed |

---

## Phase D1 — Deployment standardization ✅ complete (2026-09-14)

**Goal:** make the documented three-app topology actually true, so every future
deployment is boring.

1. Replace the CI workflow's steps that called deleted Python SSG scripts with the
   documented root contract (`install:all` → 3× typecheck → `npm test` → `build:all`)
   on Node 22.
2. Add deploy guards to CI: expected artifacts exist, no server-side secret names in
   frontend bundles, <25 MiB per Cloudflare asset, admin SPA fallback shipped, and
   builds leave tracked sources untouched.
3. Fix admin routing: ship `admin/public/_redirects` + `_headers` + `robots.txt` and
   set `not_found_handling: "single-page-application"`.
4. Stop builds writing outside their apps: `react/scripts/generate-sitemap.ts` now
   targets `react/dist` and the versioned `react/public` mirror only; the stale root
   `sitemap.xml` / `robots.txt` copies are gone.
5. Harden the backend image: pruned `prod-deps` stage (no devDependencies at
   runtime) and a `.dockerignore` that keeps `.env` files out of the build context.
6. Repair the two broken asset references that were shipping to production (fleet
   `og:image`, contact `LocalBusiness` schema image).
7. Align docs to reality: `README.md`, `AGENTS.md`, `docs/DEPLOYMENT.md`, this pack.
8. Standardize Pages project names on `skbagheltravels-customer` and
   `skbagheltravels-admin` across root scripts and both `wrangler.jsonc` files.

**Acceptance criteria (met):** `npm run install:all` + `npm run verify` green; a full
build leaves `git status` clean; all CI guard commands pass locally; admin deep links
resolve through the SPA fallback; `docs/DEPLOYMENT.md` describes exactly what the
configs do.

## Phase M — HTML UI to React Migration ⏭ CURRENT ACTIVE PHASE

**Goal:** Replicate the ultra-luxury HTML designs from `react/new_design/` into `react/` while preserving existing business logic (`fareEngine.ts`, `LocationIQ`, `src/data.ts`). Detailed plan in `react/docs/MIGRATION_PLAN.md`.

- [x] **M0: Master Architecture & Planning** — Create `react/docs/MIGRATION_PLAN.md`, update phase plan, progress tracker, and design lock registry.
- [x] **M1: Tailwind CSS & Design Token System Setup** — Install `@tailwindcss/vite` & `tailwindcss`, configure design tokens in `theme.css`, load `EB Garamond` & `Plus Jakarta Sans` Google Fonts and `Material Symbols Outlined` in `index.html`.
- [x] **M2: Global Chrome & Responsive Layout** — Rebuild luxury `Header.tsx` (with mobile drawer) and `Footer.tsx` (4-column layout with 28% advance guarantee).
- [x] **M3: Universal Dynamic Tour Package Template & Catalogue** — Build universal dynamic `PackageDetailPage.tsx` based on `taj_mahal_sunrise_guided_tour.html` accepting `TourPackage` props, and `PackagesPage.tsx`.
- [x] **M4: Streamlined 2-Step Universal Booking & Billing Engine** — Build Step 1 (choose car tier) and universal Step 2 (booking/billing form for all packages & routes) with confirmation voucher screen and 28% advance calculation.
- [x] **M5: Core Marketing Pages & Route Hubs** — Rebuild `HomePage.tsx` (`home.html`), `FleetPage.tsx` (`fleet.html`), `RoutesPage.tsx` (`routes.html`), `ServicesPage.tsx` (`services.html`), and support/legal pages.
- [x] **M6: Verification, Pre-rendering & Build Quality** — Update `prerender.ts`, verify `npm --prefix react run typecheck`, `npm --prefix react run build`, and monorepo `npm run verify`.

---

## Phase I1 — Frontend ↔ API integration (queued after Phase M)

**Goal:** the deployed frontends talk to `https://api.agraskbagheltourandtravels.com` instead of
the in-repo catalogue.

1. Add a shared typed API client in `react/src/` reading `VITE_API_BASE_URL`
   (currently documented but unread), with request-id propagation and error mapping
   to the UI's existing states.
2. Serve fares from `POST /api/v1/fares/calculate`; delete the client-side rule
   duplication once parity is proven against `backend/src/modules/fares/fare.engine.ts`.
3. Move booking drafts to `POST /api/v1/bookings/draft` with the guest access token
   flow, keeping the 5-step UX and `/book.html` noindex behaviour.
4. Wire `POST /api/v1/locations/autocomplete` as the preferred geocoding path,
   falling back to the current LocationIQ client hook.
5. Replace the admin demo sign-in (`test-<role>` JWT) with Supabase-issued JWTs and
   enforce the permission matrix against `backend/src/modules/admin/admin.routes.ts`.
6. Add contract tests that fail if a frontend type and the API response shape drift.

**Acceptance criteria:** production builds contain no `localhost` API URLs; fares in
the UI come from the API with an integration test proving parity on a fixed route
matrix; booking drafts persist in PostgreSQL; admin actions are denied for roles
without the permission; frontend bundle has no secrets.

## Phase I2 — Payments go live

**Goal:** real money, safely.

1. Razorpay live keys, webhook secret and webhook endpoint verification
   (`POST /api/v1/payments/webhooks/:provider`) against a staging URL.
2. Complete the reconciliation drills in `docs/PAYMENT_SYSTEM.md`, including
   duplicate/out-of-order webhooks and amount-mismatch rejection.
3. Wire the booking funnel's advance payment to `POST /api/v1/payments/create-checkout`
   and drive confirmation only from webhook-confirmed state.
4. Refunds through the admin finance queue with an audit-log entry per action.

**Acceptance criteria:** sandbox drill matrix recorded; no client-side code path can
mark a booking paid; refunds reconcile to the ledger; `ALLOW_TEST_AUTH=false` and
strict CORS in production.

## Phase I3 — Operations hardening

1. Admin RBAC verified end-to-end against the API (not the local matrix only).
2. Rate-limit, audit-log and error-handler coverage reviewed under load.
3. Backup/restore and migration rollback rehearsed per
   `docs/backend/DATABASE_MIGRATION_ROLLBACK.md`.

## Phase I4 — Launch content readiness

1. Real NAP (phone/WhatsApp), real photography at the same asset paths, client
   confirmation on fares and cancellation rules
   (`CLIENT_CONFIRMATION_FARES_AND_RULES.md`).
2. Rebuild, re-verify schema and hreflang, then Submit sitemap and validate the
   Google Business Profile.

**Acceptance criteria:** no placeholder number or stock imagery remains; sitemap and
schema validate; call/WhatsApp CTAs dial the real number.

## Phase I5 — Observability & release discipline

1. Alert routing: the uptime workflow currently only fails a run — wire it to a
   notification or incident integration, and document the thresholds.
2. Structured logging and request-id correlation shipped from API to frontends.
3. Release checklist: CI green, `docs/DEPLOYMENT.md` order followed, rollback plan
   named before the deploy starts.

Delivered already: `scripts/healthcheck.mjs` (+ `npm run healthcheck`) and
`.github/workflows/uptime.yml` checking the API `/health`, the customer site and the
admin site every five minutes, with `HEALTHCHECK_*` overrides documented in
`docs/DEPLOYMENT.md` §6.
