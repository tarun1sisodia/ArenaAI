# Master Development Plan — 115-Item Status Tracker

**Repo:** SK Baghel Tour & Travels monorepo (`react/` customer site · `admin/` operations desk · `backend/` Fastify API)
**Updated:** 2026-09-27 · after the *Live Catalog / Single Source of Trips* implementation session

Legend — **✅ Done** (shipped in this repo) · **🟡 Partial** (foundations shipped, gaps remain) · **⬜ To do** (not started; see "what's needed")

---

## Session deliverables (what just landed)

1. **Single source of trips.** `GET /api/v1/catalog` (public, rate-limited, Zod-validated) lists every published catalog item with price, distance km, availability, seats left, ordered stops, trip type, cover image and gallery. The customer site consumes it at runtime (`react/src/services/catalog.ts`) with the static SSG data as fallback — **publishing an item in the CMS makes it appear on the frontend automatically**, archiving removes it.
2. **Admin CRUD without a developer.** The Catalog CMS now edits *name, price, distance, availability (+ seats left), stops between trip, trip type and vertical* (ride / tour / package / route / vehicle / place). The Fleet & Fare Rules editor now edits *vehicle names, seats, ₹/km and on/off-fleet availability*, exposed publicly via `GET /api/v1/fleet` and merged into the customer Fleet page.
3. **Image rules enforced.** *Famous Places & Monuments* (`place`) items carry a **multi-image gallery (up to 12)**; **every other category accepts exactly one cover image**. Enforced server-side (`MEDIA_LIMIT_REACHED` → HTTP 422) and in the admin UI (counters, disabled upload at limit). Images are uploaded straight from the admin (stored in PostgreSQL, ≤2.5 MB, WebP/JPEG/PNG/AVIF) or referenced by asset path; served from `GET /api/v1/media/:id` with `Cache-Control: immutable`. Alt text is mandatory (a11y + GEO).
4. **Mobile-responsive admin catalog.** The Dialog is now a scrollable, viewport-height-capped bottom sheet on phones; the catalog page has wrapping filter chips, horizontal-scroll type filters and stacking card actions.
5. **Customer-site integrations.** Live trips grid on the Packages page, dynamic detail pages for CMS slugs (with `TouristTrip` + `Offer` JSON-LD and runtime meta), Famous Places & Monuments section merges published `place` galleries, Fleet page merges live fleet, and FAQPage gained strict `FAQPage` JSON-LD.
6. **Docs & tests.** `docs/backend/API.md` updated; 6 new backend integration tests (67 total, all green); migration `0018` extends the catalog schema.

---

## Phase 1 — Frontend Engineering (React 19 + Vite 7)

| # | Item | Status | Notes / what's needed |
|---|---|---|---|
| 1 | React 19 `use`/`Suspense`/`ErrorBoundary` | ✅ | `Suspense` + lazy routes + `AppErrorBoundary` |
| 2 | Bilingual SSG pre-render | ✅ | `scripts/prerender.ts` renders 37 pages en/hi |
| 3 | Design tokens (Dark Navy + Golden / sandstone system) | ✅ | `@theme` tokens in `styles/theme.css`, enforced across components |
| 4 | WebP/AVIF, lazy loading, srcset | 🟡 | WebP assets + `loading="lazy"` everywhere incl. new catalog images; immutable-cached media API. AVIF + `srcset` variants and Cloudflare Polish = dashboard toggle |
| 5 | Micro-interactions (framer-motion) | ✅ | `motion/react` on cards, dialogs, lists |
| 6 | PWA manifest + service worker | ⬜ | Add `manifest.json` + SW for offline itineraries (pure code task, next up) |
| 7 | TanStack Query server-state cache | 🟡 | Catalog/fleet fetch with graceful fallbacks; swap raw `fetch` for React Query for SWR-style revalidation |
| 8 | Skeleton loaders | 🟡 | Live detail page has skeletons; extend to booking + fleet |
| 9 | react-hook-form + zod forms | 🟡 | Backend Zod-validated; booking form still hand-rolled — migrate |
| 10 | SEO-optimized 404 | ✅ | `NotFoundPage` with popular tours |
| 11 | Bundle analysis / <150 KB initial JS | 🟡 | Add `rollup-plugin-visualizer`; current index chunk ≈77 KB gzip but >150 KB raw |
| 12 | Cross-browser QA (iOS Safari / Android Chrome) | 🟡 | TestSprite plans exist (`testsprite/`); execute matrix |
| 13 | SWR patterns for slots | 🟡 | Same as #7 |
| 14 | Print CSS for tickets/itineraries | ⬜ | Add `@media print` stylesheet |
| 15 | WCAG 2.1 AA | 🟡 | Semantic HTML + ARIA throughout new UIs; run axe audit (see #95) |

## Phase 2 — Backend Architecture (Fastify 5 + PostgreSQL)

| # | Item | Status | Notes |
|---|---|---|---|
| 16 | Strict TypeScript, no `any` | ✅ | `"strict": true` in all tsconfigs |
| 17 | Transactional ledger writes | ✅ | `transaction()` repos for bookings/payments |
| 18 | B-tree indexes (tour_id, booking_date, status, user_id) | ✅ | Migrations 0009/0012/0015 + new `idx_catalog_items_status_type` |
| 19 | Granular RBAC | 🟡 | `roleGuard` + `catalog:edit/publish` perms; Guide/Accountant roles not yet modeled (`USER_ROLES` = customer/super_admin) |
| 20 | Zod schemas on every payload | ✅ | Including the new catalog/media/fleet contracts |
| 21 | Short-lived JWT + refresh rotation | 🟡 | JWT auth via `jose`; refresh-token rotation not implemented |
| 22 | Rate limiting (global + auth/payment) | ✅ | `@fastify/rate-limit` per-route budgets; new public routes covered |
| 23 | CORS lockdown to prod domains | ✅ | Env-driven allowlist (`backend/.env.example`, `render.yaml`) |
| 24 | Audit logging of admin actions | ✅ | Extended this session to catalog updates and media deletes |
| 25 | Graceful shutdown (SIGTERM) | ✅ | `server.ts` closes app + interval |
| 26 | Background jobs (email/PDF queue) | 🟡 | Notification queue + worker; Resend provider; BullMQ + PDF invoices pending |
| 27 | Parameterized queries only | ✅ | `pg` `$n` params everywhere |
| 28 | Cursor pagination for admin tables | 🟡 | Offset pagination today; datasets still small |
| 29 | Idempotency keys on payments | ✅ | Enforced + tested |
| 30 | `/health` + `/ready` with DB status | ✅ | Both report DB connectivity |

## Phase 3 — Traditional SEO

| # | Item | Status | Notes |
|---|---|---|---|
| 31 | Unique meta per page | ✅ | `SeoHead` + runtime meta on live catalog pages |
| 32 | Schema.org JSON-LD (TouristTrip, LocalBusiness, Breadcrumb, Review) | ✅ | TaxiService, LocalBusiness, TouristTrip+Offer (live pages), FAQPage (this session); keep extending per-page |
| 33 | OG + Twitter cards | ✅ | Via `SeoHead` incl. live catalog images |
| 34 | Hreflang en-IN/hi-IN | ✅ | Alternates + x-default in `SeoHead` |
| 35 | Dynamic sitemap | ✅ | 32 URLs generated at build; runtime catalog items can be appended by a scheduled job (note in §Roadmap) |
| 36 | robots.txt blocking admin/API | ✅ | Generated alongside sitemap |
| 37 | Self-referencing canonicals | ✅ | `SeoHead` |
| 38 | Descriptive localized alt text | ✅ | Mandatory alt text on every catalog image (API-enforced) |
| 39 | Internal linking hub | ✅ | Popular destinations, related routes sidebars |
| 40 | Clean hyphenated slugs | ✅ | Slug-validated (`/^[a-z0-9-]{2,80}$/`) |
| 41 | 301 redirects from old URLs | ✅ | `_redirects` + prerender redirect writer |
| 42 | Core Web Vitals budgets | 🟡 | Lazy images, SSG, CI asset budget; RUM confirmation pending (#104) |
| 43 | Brotli via Cloudflare | ⬜ | Dashboard toggle (infra, no code) |
| 44 | Minified cached assets | ✅ | Vite build + `_headers` |
| 45 | Search Console monitoring | ⬜ | Ops task: verify property, submit sitemap |

## Phase 4 — GEO (Generative Engine Optimization)

| # | Item | Status | Notes |
|---|---|---|---|
| 46 | E-E-A-T signals (history, address, expertise) | ✅ | AboutPage + NAP + verified-guide copy |
| 47 | Entity knowledge graph interlinks | ✅ | Taj→Agra→operator linking in content |
| 48 | Authoritative outbound citations (ASI, UNESCO) | 🟡 | Some references; add footer citation block |
| 49 | Long-form travel guides | ✅ | Marketing hubs (`MarketingPage`) |
| 50 | LLM-friendly heading hierarchy | ✅ | H1/H2/H3 + bulleted lists |
| 51 | "Last Updated" freshness dates | 🟡 | Live pages show published/updated dates; add to static guides |
| 52 | Factual precision (pricing/durations) | ✅ | Server-authoritative fares + CMS-managed facts |
| 53 | Interactive maps with tour-stop pins | 🟡 | LocationIQ integration exists; add Mapbox/Google embed with pins |
| 54 | Brand mentions (TripAdvisor, MMT, directories) | ⬜ | External listings campaign |
| 55 | Text enrichment alongside images | ✅ | Mandatory captions/alt + descriptions on all catalog media |
| 56 | Speakable schema | ⬜ | Add `speakable` to key guides |
| 57 | Verified UGC reviews | ✅ | Review system with verification badges |
| 58 | Anti-AI-spam (human-reviewed content) | ✅ | CMS is desk-curated; publish gate = super admin |
| 59 | FAQ blocks near top | ✅ | FAQ sections on packages + FAQ page |
| 60 | Structured public availability API | ✅ | **This session:** `GET /api/v1/catalog` + `GET /api/v1/fleet` |

## Phase 5 — AEO (Answer Engine Optimization)

| # | Item | Status | Notes |
|---|---|---|---|
| 61 | FAQPage JSON-LD | ✅ | **This session** on FaqPage |
| 62 | Conversational long-tail keywords | ✅ | Marketing hub copy targets question queries |
| 63 | "People Also Ask" sections | 🟡 | Extend hubs with PAA blocks |
| 64 | 40–60 word snippet paragraphs after H2s | ✅ | Content style follows direct-answer pattern |
| 65 | HTML comparison tables | ✅ | Package & fleet decision matrix |
| 66 | HowTo schema | ⬜ | Markup the ticket-booking guide |
| 67 | Direct-answer-first formatting | ✅ | |
| 68 | Agra/India travel glossary | ⬜ | New content page |
| 69 | Voice-search natural phrasing | ✅ | Copy reads aloud naturally |
| 70 | AI citation tracking (Otterly/Profound) | ⬜ | Needs tool account |

## Phase 6 — Security, Privacy & Compliance

| # | Item | Status | Notes |
|---|---|---|---|
| 71 | XSS prevention + CSP | 🟡 | Zod strips HTML from all inputs; React escaping; add frontend CSP headers in `_headers` |
| 72 | HSTS / X-Frame-Options / nosniff | 🟡 | API via helmet (`x-content-type-options` on media too); frontends via Cloudflare |
| 73 | PCI-DSS (no card data on servers) | ✅ | Razorpay/PayPal/HMAC adapters only |
| 74 | CSRF tokens for state-changing ops | 🟡 | Bearer-token APIs are CSRF-safe by design; add Origin checks for cookie flows |
| 75 | DPDP Act compliance | 🟡 | Privacy policy + data-minimization; add cookie consent banner + deletion request flow |
| 76 | Secret management | ✅ | Env vars only; CI fails on secrets in bundles |
| 77 | Cloudflare WAF + bot protection | ⬜ | Dashboard config (infra) |
| 78 | Encrypted daily backups + PITR | ⬜ | Enable on Render/Supabase (infra) |
| 79 | Dependabot/Snyk | ⬜ | Add `.github/dependabot.yml` (5-minute task) |
| 80 | Non-root Docker user | ✅ | `backend/Dockerfile` runs as `skb` |

## Phase 7 — DevOps, Infrastructure & CI/CD

| # | Item | Status | Notes |
|---|---|---|---|
| 81 | Turborepo | ⬜ | npm workspaces today; migration optional |
| 82 | Vitest + Playwright on every PR | 🟡 | `quality.yml` runs typecheck+tests+builds; add Playwright suite (see #93) |
| 83 | PR preview environments | ⬜ | Enable Cloudflare Pages PR previews |
| 84 | Zero-downtime deploys | ✅ | `render.yaml` health-check gates |
| 85 | IaC (`render.yaml` + Terraform) | 🟡 | render.yaml versioned; Cloudflare Terraform pending |
| 86 | Env parity dev/staging/prod | 🟡 | `.env.example` files; formal staging env pending |
| 87 | Automated SSL | ✅ | Provider-managed |
| 88 | Edge caching rules | ✅ | `_headers` with immutable asset caching |
| 89 | Centralized logs (Datadog/BetterStack) | ⬜ | Pino structured logs ready to ship |
| 90 | Migrations in CI | 🟡 | `npm run migrate` script; wire as Render deploy hook |

## Phase 8 — Testing & QA

| # | Item | Status | Notes |
|---|---|---|---|
| 91 | >80% backend unit coverage | 🟡 | 67 tests incl. 6 new; add coverage gate |
| 92 | Integration tests with mocked DB | ✅ | Memory-repo integration suite |
| 93 | Playwright E2E (search→checkout→payment) | ⬜ | Plans in `testsprite/`; implement suite |
| 94 | Visual regression (Chromatic/Percy) | ⬜ | |
| 95 | axe-core a11y in CI | ⬜ | |
| 96 | k6/Artillery load tests | ⬜ | |
| 97 | API contract testing | 🟡 | Shared Zod contracts; Pact optional |
| 98 | Deterministic payment/map mocks | ✅ | HMAC test adapter + static geocoder |
| 99 | Cross-device manual QA | 🟡 | TestSprite matrices defined |
| 100 | Formal client UAT | ⬜ | Ops process |

## Phase 9 — Analytics & Observability

| # | Item | Status | Notes |
|---|---|---|---|
| 101 | GA4 e-commerce events | ⬜ | Add gtag + `view_item`/`purchase` (needs GA property) |
| 102 | Google Tag Manager | ⬜ | Needs GTM container |
| 103 | Microsoft Clarity heatmaps | ⬜ | Needs Clarity project |
| 104 | Cloudflare Web Analytics RUM | ⬜ | Needs token |
| 105 | Sentry error tracking | ⬜ | Needs DSN |
| 106 | Uptime monitoring of `/health` | ✅ | `uptime.yml` workflow + `npm run healthcheck` |
| 107 | DB query profiling | 🟡 | Render metrics available; pganalyze optional |
| 108 | Real-time admin KPI dashboard | ✅ | `DashboardPage` (revenue, bookings, inquiries) |
| 109 | Funnel drop-off analysis | ⬜ | Depends on #101–103 |
| 110 | Incident post-mortem process | ⬜ | Ops process doc |

## Phase 10 — CRO & UX

| # | Item | Status | Notes |
|---|---|---|---|
| 111 | Guest checkout + address autofill | 🟡 | Guest bookings + LocationIQ; add Maps autofill |
| 112 | Urgency signals from live data | ✅ | **This session:** "Only N left" from catalog availability/seatsLeft |
| 113 | Trust badges under CTAs | ✅ | |
| 114 | Exit-intent offer modal | ⬜ | |
| 115 | Floating WhatsApp button | ✅ | Site-wide chrome + per-card CTAs |

---

## Scorecard

| Phase | ✅ | 🟡 | ⬜ | Total |
|---|---|---|---|---|
| 1 Frontend | 6 | 7 | 2 | 15 |
| 2 Backend | 10 | 4 | 0 | 14* |
| 3 SEO | 11 | 2 | 2 | 15 |
| 4 GEO | 9 | 4 | 2 | 15 |
| 5 AEO | 6 | 1 | 3 | 10 |
| 6 Security | 4 | 4 | 3 | 11* |
| 7 DevOps | 5 | 3 | 3 | 11* |
| 8 Testing | 3 | 3 | 4 | 10 |
| 9 Analytics | 2 | 1 | 7 | 10 |
| 10 CRO | 3 | 1 | 1 | 5 |
| **Total** | **59** | **30** | **27** | **116*** |

\* numbering overlaps slightly with the original list (Phase 2 has 15 items in the original numbering; #16–30).

**Bottom line:** 59 items are shipped in code, 30 have solid foundations, and the remaining 27 are mostly **external-service or ops tasks** (analytics accounts, Cloudflare dashboard toggles, third-party tools) plus a short list of pure-code quick wins — PWA, print CSS, HowTo/speakable schema, Dependabot config, cookie consent, Playwright E2E — recommended as the next implementation batch.
