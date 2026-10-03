# Project Context — SK Baghel Tour & Travels

This file is the single source of truth for architecture decisions. It should stay
almost static; if anyone deviates from it, that deviation must be logged in
`04_PROGRESS_TRACKER.md`'s Decision Log, not made silently.

Canonical domain: `https://agraskbagheltourandtravels.com`
Deployment topology and provider settings: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 1. What this is

A premium customer platform for **Agra SK Baghel Tour & Travels**. North star:
*make travel feel easy before the journey even begins.* Taxi and cab, Tempo
Traveller, Innova Crysta and tour packages out of Agra, plus the internal
operations desk that runs the business and the API that owns fares, bookings and
payments.

Three independently deployable applications live in one repository:

| Application | Directory | Role | Production host |
|---|---|---|---|
| Customer site | `react/` | Bilingual marketing site + booking funnel | Cloudflare Pages (`skbagheltravels-customer`) |
| Operations desk | `admin/` | Dispatch, finance, catalog, reviews, audit | Cloudflare Pages (`skbagheltravels-admin`) |
| API | `backend/` | Server-authoritative fares, bookings, payments, catalog, reviews | Render Docker service (`skb-baghel-api`) or VPS + Cloudflare Tunnel |

The browser is never trusted for amounts or payment success: PostgreSQL (Supabase)
is the ledger; the API is the authority for fares, booking state, payments and
admin permissions. Customer marketing pages retain curated in-repo catalogue
content as a resilience fallback; booking requests and payment confirmation use
the backend API and configured checkout. A customer-side simulation must never
create a successful booking or payment result.

## 2. Stack — decided, do not re-litigate mid-build

| Concern | Choice | Why |
|---|---|---|
| Customer site | React 19 + Vite 7 + TypeScript (strict) | Component system shared with the design language; typed catalogue |
| Customer rendering | Static pre-render (`react/scripts/prerender.ts`) | Fully-formed HTML for every marketing URL: crawlable, JS-optional first paint |
| Customer languages | English + Hindi, localized URLs (`/en/…`, `/hi/…`) | Bilingual SEO with hreflang `en-IN` / `hi-IN` / `x-default`; fares identical in both |
| Booking | `/book.html` route inside the same React app | App page, not SEO; `noindex`; server-backed booking and checkout; payment availability depends on deployment configuration |
| Admin | React 19 + Vite 7 + Tailwind 4 + motion + react-router-dom | Vercel-light design system, Saffron Gold accents, custom SVG charts |
| API | Fastify 5 + TypeScript strict, Node ≥ 22 | Small surface, first-class JSON schema and hooks; Docker/Render friendly |
| API data | PostgreSQL via `pg` + Supabase; in-memory store for dev/test | One repository interface, two implementations (`src/db`) |
| Optional store | MongoDB, cache/raw-webhook payloads only | Never the ledger |
| Payments | Razorpay adapter + HMAC adapters (PayPal, card) | Provider-neutral registry; webhooks are the only source of payment truth |
| Env validation | Zod at boot (`backend/src/config/env.ts`) | Refuses to start production with missing/insecure configuration |
| Design system | Dark Navy + Golden, `DESIGN.md` + `design-guide/` | Locked brand; Option A palette |
| Node | 22 everywhere (CI, Docker, Render, `engines`) | One supported runtime across all apps |

Do not introduce Next.js, a CMS, a second repository, or live charges without
logging why in the Decision Log and getting the user to add a phase.

## 3. Repository map

```
react/                customer site
  src/app/            App shell, routes, SEO metadata
  src/pages/          hubs, detail pages, 404
  src/features/       booking funnel, catalogue, contact
  src/data/           typed catalogue + parity guards
  src/fares.ts        client fare engine (mirrors backend rules for preview)
  public/assets/      WebP photography + responsive derivatives + brand
  scripts/prerender.ts    SSG: writes every URL + sitemap.xml + robots.txt + 404.html
  dist/               deployable Cloudflare Pages artifact
admin/                operations desk (src/pages, src/components, src/lib)
  public/_redirects   SPA fallback (mandatory: BrowserRouter)
  public/_headers     noindex + cache policy for an internal panel
backend/              API
  src/modules/        fares, bookings, payments, admin, catalog, reviews, inquiries, locations, notifications
  src/middlewares/    auth, roles, raw body, request id, error handler
  src/providers/      Razorpay, HMAC checkout, LocationIQ, WhatsApp, Resend
  migrations/         append-only SQL
  tests/              unit, integration, contract (Vitest)
scripts/              repository-level operational tooling (healthcheck.mjs)
docs/                 DEPLOYMENT.md, PAYMENT_SYSTEM.md, admin/ and backend/ specs
assets/               brand + photography masters (mirrored into react/public/assets)
design-guide/         approved design system source
scratch/              throwaway QA scripts
```

Commands, environment variables and build hygiene are documented in
[`README.md`](README.md); the verification contract is `npm run verify`.

## 4. URL map (SEO)

| Kind | English | Hindi |
|---|---|---|
| Home | `/` | `/hi/` |
| Hubs (9) | `/en/{services,routes,packages,fleet,about,contact,faq,privacy,terms}/` | `/hi/{same}/` |
| Route landings (8) | `/en/agra-to-delhi-taxi/`, `/en/delhi-to-agra-taxi/`, `/en/agra-to-jaipur-taxi/`, `/en/delhi-to-jaipur-taxi/`, `/en/agra-to-gwalior-taxi/`, `/en/agra-to-lucknow-taxi/`, `/en/agra-to-mathura-taxi/`, `/en/agra-sightseeing-taxi/` | English slugs plus transliterated slugs (`/hi/agra-se-delhi-taxi/`, `/hi/agra-darshan-taxi/`, …) |
| Vehicle landings | `/en/vehicles/{sedan,ertiga,innova-crysta,tempo-traveller,urbania}/` (+ aliases `innova`, `tempo`) | `/hi/vehicles/…` |
| Package landings | `/en/packages/{taj-mahal-sunrise-tour,agra-sightseeing,agra-unhurried,mathura-vrindavan,gatimaan-express-agra-tour,golden-triangle}/` | `/hi/packages/…` |
| Booking | `/book.html` (app, `noindex`) | same |
| Recovery | `/404.html`, `/en/404/`, `/hi/404/` | same |

The pre-renderer also writes legacy redirect stubs (`services.html` → `/en/services/`,
`routes.html`, `packages.html`, `fleet.html`, `about.html`, `contact.html`,
`faq.html`, `privacy.html`, `terms.html`) so old links keep working. The build
currently emits 75 pages + 10 redirects and a 71-URL sitemap.

Primary conversion: **Call + WhatsApp**. Book is secondary. Sticky lead bar on
route pages (all marketing pages on mobile). Translate copy, never fares.

## 5. NAP and booking conventions

- Phone `+91 98765 43210` · WhatsApp `919876543210` — **placeholder until the
  client supplies the real number** (see `LAUNCH_CHECKLIST` notes in
  `react/docs/`).
- Email `bookings@agraskbagheltourandtravels.com`
- Address: Near Taj East Gate Road, Taj Ganj, Agra 282001 · Geo 27.1632, 78.0322
- Session key `skb-booking` · ticket prefix `AGR-` (`AGR-YYYYMMDD-XXXX`)
- Package add-ons sit on top of the package price; local sightseeing is not
  round-trip priced. Fare rules of record:
  `CLIENT_CONFIRMATION_FARES_AND_RULES.md` (business) and
  `backend/src/modules/fares/fare.engine.ts` (authoritative implementation).

## 6. Conventions

- **Money and fares** are computed server-side in production. The client engine
  (`react/src/fares.ts`, `react/src/features/booking/fareEngine.ts`) exists so the
  pre-rendered site can quote before the API integration phase; it must not
  diverge from the backend engine, and it must never be treated as authoritative.
- **Generated output is never hand-edited.** Marketing HTML, `sitemap.xml`,
  `robots.txt`, `404.html` and redirect stubs come from `react/scripts/prerender.ts`
  and `react/scripts/generate-sitemap.ts`; change the generator and rebuild.
- **Builds write only inside `react/dist`, `admin/dist`, `backend/dist`.** The one
  tracked file a build rewrites is `react/public/sitemap.xml` (the versioned
  mirror). Nothing is written to the repository root.
- **Frontend bundles are public.** No database, payment, webhook or service-role
  secret may reach `react/` or `admin/` output; CI fails if a secret name appears.
- **Routing semantics are per app.** The customer site keeps real 404s
  (`404.html`, `not_found_handling: "404-page"`); the admin SPA keeps its
  `_redirects` catch-all to `index.html`.
- **Images**: WebP with measured `width`/`height`, responsive `-480`/`-768`
  derivatives plus `srcset`/`sizes`, lazy below the fold, hero preloaded.
- **Motion**: 180 ms ease, `prefers-reduced-motion` disables transforms;
  `ANIMATION_RULES.md` is the gate.
- **Accessibility**: ARIA 1.2 patterns on interactive widgets (see the combobox
  implementation), keyboard-complete flows, single `<h1>` per page, `lang` per tree.
- **Verification**: `npm run verify` (typecheck ×3, backend tests, build ×3) must be
  green before any hand-off. Deployment changes additionally follow
  `docs/DEPLOYMENT.md`.
- Do not commit build output, `node_modules`, `.env*` (except the examples), or
  anything `.gitignore` already excludes.

## 7. Explicit non-goals (unless the user adds a phase)

- Live payments before the payment spec's webhook drills pass
- A CMS, multi-tenant reseller portal, or native mobile apps
- A second repository or per-app release branches
- Editing `design-guide/` sources
