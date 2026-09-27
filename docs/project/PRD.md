# Product Requirements Document (PRD) — Master / Final v4.0

**Product:** Agra SK Baghel Tour & Travels — customer platform, operations desk, API
**Repository:** one monorepo (`react/`, `admin/`, `backend/`)
**Canonical domain:** `https://agraskbagheltourandtravels.com`
**Status:** current target scope. v1–v3 described the retired static site; this version
describes the deployed platform and what must still be true at launch.

---

## 0. How to read this document

| Reader | Start at |
|---|---|
| Business / decision maker | §1, §3, §4, §25 |
| SEO / content | §7, §9, §22, §23, §24, §26 |
| Engineer / agent | §7, §11, §12, §17, §18, §21 |
| Launch owner | §4.3, §21, §22, §25 |

Section numbering is stable so existing references (`§9.3`, `§21`, `§25`) still resolve.
Companion documents: `02_PROJECT_CONTEXT.md` (architecture decisions),
`03_PHASE_PLAN.md` (build plan), `04_PROGRESS_TRACKER.md` (state),
`docs/DEPLOYMENT.md` (hosts and release order), `DESIGN.md` (visual system),
`ANIMATION_RULES.md` (motion gate), `docs/PAYMENT_SYSTEM.md` (payments).

## 1. Executive summary

The platform sells Agra-based taxi, fleet hire and tour packages to two audiences:
Indian travellers searching in English or Hindi, and international visitors booking
private cars and guided circuits. It is three applications: a bilingual,
search-optimised customer site that can be read and indexed without JavaScript; an
operations desk for dispatch, finance, catalog, reviews and audit; and an API that
owns fares, bookings, payments and permissions.

The commercial strategy is unchanged: **call and WhatsApp first**, transparent
all-inclusive fares, and dedicated landing pages for every route, vehicle and package
so a traveller searching "Agra to Delhi taxi" or "आगरा से दिल्ली टैक्सी" lands on a page
that answers the question and offers a one-tap call. Booking online is the secondary,
deliberate path.

## 2. Problem & opportunity

### 2.1 Problem
- Aggregators own the top of the funnel with opaque pricing and phone-only support.
- Local operator sites are slow, thin, English-only, and hide the price behind a form.
- Travellers cannot tell what a fare includes: tolls, parking, night allowance, state
  permits and the 300 km/day rule are usually buried or omitted.

### 2.2 Opportunity
- Route-intent search is high-intent and local: fares, distance, travel time and
  inclusions decide the booking.
- Bilingual depth (EN + HI) doubles reach in a market where most competitors publish
  one language.
- Transparent fares plus an always-visible Call/WhatsApp action convert mobile traffic
  that a form-first funnel loses.
- Answer-shaped structure — tables, FAQs, itineraries, schema — is what both search
  engines and AI assistants quote.

## 3. Business goals

### 3.1 North star
Make travel feel easy before the journey even begins.

### 3.2 Primary business goals
1. Own the "Agra ↔ <city> taxi" and "Agra tour package" intents in EN and HI.
2. Maximise call/WhatsApp conversion from money pages.
3. Publish fares that are provably all-inclusive (no post-booking surprises).
4. Give the office an operations desk that can dispatch, refund, moderate and audit
   without developer help.
5. Keep the API the single source of truth for money so scale does not create
   accounting risk.

### 3.3 Quality / engineering goals
- Pre-rendered content for every indexable URL; zero content hidden behind JavaScript.
- One repository, one command contract (`npm run verify`), three independent deploys.
- Accessibility, performance and SEO budgets enforced by CI, not by review habits.
- No client-side path that can mark a booking paid.

## 4. Success metrics & KPI framework

### 4.1 Traditional SEO / site KPIs
| KPI | Target |
|---|---|
| Organic sessions (EN+HI) | Grow MoM; route pages > hub pages > home |
| Call / WhatsApp clicks | Primary conversion; GA4 events |
| Booking starts / completions | Secondary; GA4 `begin_checkout` / `purchase` style events |
| Bounce on money pages | ≤ 45% |
| Average position for money terms | Rising MoM (Agra taxi; <city> taxi; Agra to <city>) |
| Indexation | All intended URL classes indexed; 0 unwanted indexed URLs |
| Broken links / assets / console errors | 0 |
| Pages with one H1, unique title/meta, canonical, schema | 100% |
| hreflang EN/HI parity | 100% |
| Core Web Vitals (field) | All "Good" at 75th percentile |
| Lighthouse | 100/100 target (≥90 gate) |
| GSC 404 / crawl errors | ≤ 0 new per month |

### 4.2 AI Search (LLM/AISO) KPIs
| KPI | Target |
|---|---|
| Brand mentions in ChatGPT / Perplexity / Gemini / Bing AI | Rising monthly via AI visibility tracker |
| Prompts where the brand appears vs. competitors | Growing share of voice |
| Sources feeding mentions | Mix of own site, directories, UGC, media |
| AI referral sessions (GA4 "AI Assistants" channel) | Growing; tracked via referrer + UTM regex |
| Strategy page content scores | Green in Surfer (or equivalent) |
| Topical coverage | Priority gaps from the topical map closed |

### 4.3 Definition of "done" (release gate)
Every page meets §21; launch gates (§25) are green — real NAP/GST, real photos and
reviews, GBP synced, analytics + GSC/Bing verified, CI green on `main`, and
`docs/DEPLOYMENT.md` release order followed.

## 5. Scope

### 5.1 In scope — customer site (`react/`)
- Bilingual pre-rendered site (EN + HI), localized URLs, hreflang.
- Home, Services, Routes, Packages, Fleet, About, Contact, FAQ, Privacy, Terms.
- Dedicated route, vehicle and package landings (SEO depth + AI-recognizable content).
- Transparent fare presentation and the 5-step booking funnel at `/book.html`
  (`noindex`).
- Lead systems: sticky Call/WhatsApp/Book bar, widgets, inquiry form.
- Dark Navy + Golden design system, responsive, accessible, within performance budgets.

### 5.2 In scope — operations desk (`admin/`)
- Dashboard, bookings, finance, catalog, reviews, inquiries, fares and audit screens.
- Role-based access: dispatcher, content editor, review moderator, finance operator,
  super admin, with a published permission matrix.

### 5.3 In scope — API (`backend/`)
- Server-authoritative fare calculation, draft bookings with immutable fare snapshots,
  provider payments with webhook confirmation, refunds, catalog, reviews, inquiries,
  notifications, audit log, admin dispatch.

### 5.4 In scope — SEO / AI-SEO deliverable (1 year)
- Basic + local SEO: research, on-page, technical, off-page/link building, citations,
  GSC/GA4, weekly/monthly reporting.
- AI Search Optimization: entity signals, topical authority, AI-friendly structure,
  schema, UGC/digital PR support, AI visibility tracking.
- White-hat authority building and digital PR as an owned deliverable.

### 5.5 Out of scope (deferred, unless the client adds a phase)
- Live payments until the webhook drills in `docs/PAYMENT_SYSTEM.md` pass.
- CMS, real-time tracking, in-app chat, reseller/multi-tenant portal, native apps.
- Editing `design-guide/` sources.

## 6. Users & journeys

### 6.1 Personas
| Persona | Need | Language | Primary action |
|---|---|---|---|
| Domestic leisure traveller | Fast, fixed price, WhatsApp confirmation | HI / EN | WhatsApp / call |
| Business / airport transfer | Punctuality, clean fleet, invoice | EN | Call, then booking |
| Family / group tour group | Space and itinerary certainty (Tempo/Urbania) | HI | Call / inquiry form |
| Foreign tourist | Trust, clear inclusions, English detail | EN | Booking form |
| Office operator (internal) | Dispatch, refunds, moderation, audit | EN | Admin panel |

### 6.2 Core journeys
1. Search → route landing → fare table → Call/WhatsApp (primary).
2. Search → route landing → fare table → Book → 5-step funnel → advance payment
   (secondary, live once Phase I2 lands).
3. Home → fleet hub → vehicle landing → Book with that vehicle pre-selected.
4. Home → packages hub → package landing → itinerary + inclusions → inquiry.
5. Tourist → home → FAQ → contact → WhatsApp.
6. Operator → admin sign-in → bookings queue → assign/transition → audit log entry.

## 7. Information architecture & URL map

| # | Page | EN URL | HI URL | Indexable | Intent |
|---|---|---|---|---|---|
| 1 | Home | `/` | `/hi/` | Yes | Brand + capture intent |
| 2 | Services | `/en/services/` | `/hi/services/` | Yes | Breadth |
| 3 | Routes hub | `/en/routes/` | `/hi/routes/` | Yes | Price transparency |
| 4 | Packages hub | `/en/packages/` | `/hi/packages/` | Yes | Inspire multi-day |
| 5 | Fleet hub | `/en/fleet/` | `/hi/fleet/` | Yes | Prove hardware |
| 6 | About | `/en/about/` | `/hi/about/` | Yes | Trust |
| 7 | Contact | `/en/contact/` | `/hi/contact/` | Yes | Human reassurance |
| 8 | FAQ | `/en/faq/` | `/hi/faq/` | Yes | Kill doubts |
| 9 | Privacy | `/en/privacy/` | `/hi/privacy/` | Yes | Legal |
| 10 | Terms | `/en/terms/` | `/hi/terms/` | Yes | Legal |
| 11 | Route landings (8) | `/en/agra-to-delhi-taxi/`, `/en/delhi-to-agra-taxi/`, `/en/agra-to-jaipur-taxi/`, `/en/delhi-to-jaipur-taxi/`, `/en/agra-to-gwalior-taxi/`, `/en/agra-to-lucknow-taxi/`, `/en/agra-to-mathura-taxi/`, `/en/agra-sightseeing-taxi/` | `/hi/agra-se-delhi-taxi/`, `/hi/delhi-se-agra-taxi/`, `/hi/agra-se-jaipur-taxi/`, `/hi/delhi-se-jaipur-taxi/`, `/hi/agra-se-gwalior-taxi/`, `/hi/agra-se-lucknow-taxi/`, `/hi/agra-se-mathura-taxi/`, `/hi/agra-darshan-taxi/` (English slugs also served under `/hi/`) | Yes | Transactional / local |
| 12 | Vehicle landings (5 + 2 aliases) | `/en/vehicles/{sedan,ertiga,innova-crysta,tempo-traveller,urbania}/` (+ `innova`, `tempo`) | `/hi/vehicles/…` | Yes | Commercial |
| 13 | Package landings (6) | `/en/packages/{taj-mahal-sunrise-tour,agra-sightseeing,agra-unhurried,mathura-vrindavan,gatimaan-express-agra-tour,golden-triangle}/` | `/hi/packages/…` | Yes | Commercial |
| 14 | Booking funnel | `/book.html` | same | **Noindex** | Conversion |
| 15 | Recovery | `/404.html`, `/en/404/`, `/hi/404/` | same | Noindex | Recovery |

URL rules: lower-case, hyphenated, keyword-bearing; one canonical URL per intent; no
indexable query-parameter variants (params only prefill the booking funnel); legacy
`*.html` hubs redirect to `/en/…/` stubs; canonical origin is always
`https://agraskbagheltourandtravels.com`.

Build currently emits **75 pre-rendered pages + 10 redirect stubs** and a **71-URL
sitemap** with 213 `xhtml:link` alternates.

## 8. Functional requirements by page

### 8.1 Global (customer site)
- Header nav, footer NAP + legal, language switch, skip link, correct `lang`.
- Lead bar: route pages on desktop; all marketing pages ≤700px; hidden on the booking
  funnel.
- All critical content present in the pre-rendered HTML — never only after hydration.
- Theme support (Clean White / Solar Dusk) with no flash of wrong theme.

### 8.2 Home — hero destination slideshow, bento discovery grid, trust bar, popular
routes, fleet teasers, package highlights, review/trust signals, fare widget.

### 8.3 Services — what the operator does, service tiers, coverage, proof.

### 8.4 Routes hub — filterable route directory, dynamic one-way vs round-trip fare
calculator across vehicle tiers, distance/transit matrix, highway operating guidance
(tolls, permits, 300 km/day rule, night allowance), route FAQ.

### 8.5 Packages hub / Fleet hub — comparable cards with inclusions, duration,
indicative price and deep links into the funnel.

### 8.6 Route landing (money page) — breadcrumbs with distance/duration/highway tags,
5-vehicle fare matrix with best-value/most-popular markers, all-inclusive breakdown,
highway advisory grid, en-route stops, FAQ, dispatch CTA, schema graph.

### 8.7 Vehicle landing — hero with spec badges, rate card, booking CTA with vehicle
hydrated, technical specs, models, full service pricing (outstation, local 8h/80km,
transfers, night allowance), scenario guidance, FAQ, schema graph.

### 8.8 Package landing — currency switcher (INR/USD/EUR/GBP), vehicle upgrade matrix,
hourly itinerary, inclusions/exclusions, cancellation tiers, FAQ, planning CTA, schema.

### 8.9 About / Contact / FAQ / Legal — E-E-A-T story, NAP with map and hours,
question-shaped FAQ, published privacy and terms with the refund schedule.

### 8.10 Booking funnel (5 steps) — route → vehicle → details → advance → ticket, with
query hydration (`route`, `date`, `vehicle`, `pax`, `coupon`), 24-hour draft expiry,
validation, and a `noindex` ticket confirmation. Until Phase I2 it runs on the local
engine against mock payment and must label itself as such.

### 8.11 404 — recovery actions, popular routes, click-to-call.

### 8.12 Admin panel — dashboard KPIs, bookings queue with filters and status
transitions, finance/refunds, catalog draft→publish, review moderation, inquiries,
fares reference, audit log. Every mutation is role-gated by the permission matrix and
must be recorded in the audit trail when wired to the API.

## 9. SEO Strategy (full stack)

### 9.1 Process & deliverables
Research → intent mapping → template design → build → technical validation → publish →
promote → measure. Deliverables: keyword workbook, URL/keyword map, on-page templates,
schema per template, internal-link map, sitemap/robots, GSC + Bing verification,
GA4 events, monthly reporting, off-page programme.

### 9.2 Keyword research & intent framework
- **Transactional/local:** "agra to delhi taxi", "agra taxi service", "tempo traveller
  hire agra", "आगरा से दिल्ली टैक्सी".
- **Commercial investigation:** "agra to jaipur taxi fare", "innova crysta rent agra",
  "golden triangle tour from agra".
- **Informational:** "best time to visit taj mahal", "how far is mathura from agra",
  "night charges taxi agra".
- **Brand:** "SK Baghel Tour & Travels", "एस के बघेल टूर एंड ट्रेवल्स".
Volume/priority bands are refreshed quarterly; only intents with genuine demand get a
page (see §9.3 zipper rule).

### 9.3 Keyword → URL mapping (seeded, expandable)
| Keyword (EN) | Target URL | Keyword (HI) | Target URL |
|---|---|---|---|
| agra to delhi taxi | `/en/agra-to-delhi-taxi/` | आगरा से दिल्ली टैक्सी | `/hi/agra-se-delhi-taxi/` |
| delhi to agra taxi | `/en/delhi-to-agra-taxi/` | दिल्ली से आगरा टैक्सी | `/hi/delhi-se-agra-taxi/` |
| agra to jaipur taxi | `/en/agra-to-jaipur-taxi/` | आगरा से जयपुर टैक्सी | `/hi/agra-se-jaipur-taxi/` |
| delhi to jaipur taxi | `/en/delhi-to-jaipur-taxi/` | दिल्ली से जयपुर टैक्सी | `/hi/delhi-se-jaipur-taxi/` |
| agra to mathura taxi | `/en/agra-to-mathura-taxi/` | आगरा से मथुरा टैक्सी | `/hi/agra-se-mathura-taxi/` |
| agra to gwalior taxi | `/en/agra-to-gwalior-taxi/` | आगरा से ग्वालियर टैक्सी | `/hi/agra-se-gwalior-taxi/` |
| agra to lucknow taxi | `/en/agra-to-lucknow-taxi/` | आगरा से लखनऊ टैक्सी | `/hi/agra-se-lucknow-taxi/` |
| agra sightseeing taxi | `/en/agra-sightseeing-taxi/` | आगरा दर्शन टैक्सी | `/hi/agra-darshan-taxi/` |
| agra tour packages | `/en/packages/agra-sightseeing/` | आगरा टूर पैकेज | `/hi/packages/agra-sightseeing/` |

**Zipper rule:** replicate a winning template across the service × location grid only
where demand exists. No thousands of near-identical pages.

### 9.4 On-page requirements (every indexable page)
| Element | Requirement |
|---|---|
| Title | ≤60 chars, primary keyword front-loaded, unique, brand hint |
| Meta description | 140–160 chars, keyword + benefit + CTA, unique |
| H1 | exactly one, primary keyword, not a copy of the title |
| Heading hierarchy | H1 → H2 → H3, question-shaped H2s where natural |
| Canonical | self-referencing absolute URL on the canonical origin |
| hreflang | `en-IN`, `hi-IN`, `x-default` reciprocals (100% parity) |
| Open Graph / Twitter | title, description, image (real dimensions + alt), locale |
| Schema | template-appropriate JSON-LD `@graph` (§9.13) |
| Internal links | every money page reachable ≤3 clicks from home; context links both ways |
| Content | answer-first, tables/lists, fares and inclusions explicit |

### 9.5 Content structure for AI discovery
Direct answer in the first paragraph, question headings, comparison tables, bullet
inclusions, explicit numbers (km, hours, ₹), named entities, and a final summary block.
Avoid burying facts in images or interactive-only widgets.

### 9.6 Technical SEO
Pre-rendered HTML for every indexable URL; XML sitemap with `lastmod` and alternates;
robots allowing major crawlers and blocking the funnel and 404s; canonical origin
enforced; no indexable parameter URLs; clean status codes (301 stubs, real 404s for
missing pages); fast, stable layout (measured image dimensions); crawlable
`.html`-free directory URLs.

### 9.7 Off-page / link building (white-hat, phased)
Local citations and directory consistency → GBP optimisation and posts → review
velocity → local/regional media and travel roundups → digital PR (data stories, expert
commentary) → partner and hotel/vendor links. No PBNs, link farms, or automated spam.

### 9.8 Local SEO
Consistent NAP everywhere (site, schema, GBP, citations), embedded map and hours,
service-area pages, review responses, local business schema with geo and opening hours,
and location-specific landing copy where genuinely different.

### 9.9 Multilingual SEO
Independent, meaningful HI copy (not machine translation), reciprocal hreflang, Hindi
slug variants for route pages, Hindi FAQs and schema `inLanguage`, and identical fares
across languages.

### 9.10 Topical authority & clusters
Pillars: Agra taxi services, city-to-city transfers, Taj Mahal & Agra sightseeing,
multi-day circuits (Golden Triangle, Mathura–Vrindavan), fleet guidance, travel
practicalities. Each pillar links to its cluster pages and back to the relevant money
page.

### 9.11 AI Search Optimization (AISO)
Entity-consistent naming, `sameAs` profiles, FAQ/HowTo-style answer blocks, comparison
tables, review and rating markup, author/operator credentials (E-E-A-T), and freshness
(`lastmod`). Track AI referrals in GA4 via referrer + UTM regex and monitor brand
mentions monthly.

### 9.12 E-E-A-T
Named operator with licence/GST and years of service, real photos of the actual fleet
and drivers, verifiable reviews, published policies, transparent pricing methodology,
and author attribution on informational content.

### 9.13 Schema & entity signals
| Template | JSON-LD graph |
|---|---|
| Global | `LocalBusiness` (NAP, geo, hours), `WebSite` (bilingual, SearchAction) |
| Route landing | `TaxiService`, `BreadcrumbList`, `FAQPage` |
| Vehicle landing | `Product`/`Car` with specs, `BreadcrumbList`, `FAQPage`, `TaxiService` |
| Package landing | `TouristTrip`/`Product`, `BreadcrumbList`, `FAQPage` |
| Home / About | `Organization`, `LocalBusiness`, `AggregateRating` (only with real reviews) |

All schema is emitted by typed factories so it cannot drift from page content.

### 9.14 Measurement & reporting
GSC (coverage, queries, CWV), Bing Webmaster, GA4 events (§14), rank tracking for the
money set, AI visibility tracking, and monthly/quarterly reporting per §14.

## 10. Design & UX requirements

### 10.1 Brand system (locked)
Dark Navy + Golden with Light Premium variants, as defined in `DESIGN.md`; tokens only,
no one-off colours or sizes. `DESIGN_LOCKS.md` marks approved components that may not be
edited without explicit permission.

### 10.2 UI quality bar
Modern, high-end, generous whitespace, confident typography, subtle purposeful motion
(`ANIMATION_RULES.md` gate), real photography, no stock-photo fatigue, no decorative
chrome that competes with the fare table or the call button.

### 10.3 Design inventory
Header with language switch, sticky lead bar, hero slideshow, bento discovery grid,
trust bar, fare tables and calculator, vehicle/package cards, FAQ accordion, review
blocks, contact card, footer with NAP and legal, admin light-theme dashboard with
custom SVG charts.

### 10.4 UX principles
Price and inclusions visible early; one primary action per screen (call/WhatsApp);
never trap a user in a form to get a fare; confirmations state exactly what happens
next; errors are actionable and never colour-only.

### 10.5 Responsive & accessibility
WCAG 2.2 AA (§16), tested 360–1440px, zero horizontal overflow, 44px touch targets,
keyboard-complete flows, reduced-motion respected.

## 11. Engineering & architecture

### 11.1 Architecture (locked)
Three deployable applications in one repository:

| App | Stack | Build | Host |
|---|---|---|---|
| `react/` | React 19 + Vite 7 + TS strict, pre-rendered SSG | `npm run customer:build` | Cloudflare Pages `skbagheltravels-customer` |
| `admin/` | React 19 + Vite 7 + Tailwind 4 + react-router-dom | `npm run admin:build` | Cloudflare Pages `skbagheltravels-admin` |
| `backend/` | Fastify 5 + TS strict, PostgreSQL (Supabase), optional MongoDB cache | `npm run backend:build` | Render Docker `skb-baghel-api` or VPS + Tunnel |

Pre-rendering is mandatory for the customer site: content must exist in the HTML
snapshot. The admin panel stays a client-routed SPA with a `_redirects` fallback.

### 11.2 Build & data pipeline
1. Data lives in typed modules (`react/src/data/*`, catalogue + contact) with parity
   guards; the API is the runtime authority once Phase I1 lands.
2. `react/scripts/prerender.ts` renders every manifest URL with full head metadata and
   schema, writes `404.html` and legacy redirect stubs.
3. `react/scripts/generate-sitemap.ts` writes `sitemap.xml` (71 URLs, `lastmod`,
   alternates) + `robots.txt` into `react/dist` and the versioned `react/public` mirror
   — never to the repository root.
4. Assets: WebP masters plus `-480`/`-768` derivatives, measured `width`/`height`,
   `srcset`/`sizes`, hero preloaded.
5. `npm run verify` = typecheck ×3 + backend tests + production build ×3.

### 11.3 Conventions (must-follow)
- Never hand-edit generated output; change the generator and rebuild.
- Never commit build output, `node_modules`, `.env*`, or secrets.
- Frontend bundles are public: no DB/payment/webhook/service-role secrets, ever.
- Money is computed server-side; the client engine mirrors and never decides.
- No hardcoded base prefix; the build is host- and path-agnostic.
- Full content in HTML, one H1, descriptive alt text, tokens over literals.

### 11.4 Performance budgets
| Metric | Budget |
|---|---|
| Hero WebP | ≤ 220 KB |
| LCP | ≤ 2.5 s mobile |
| CLS | < 0.1 |
| INP | ≤ 200 ms |
| Fonts | one request, `display=swap` |
| Images | responsive derivatives below the fold |
| Lighthouse | 100/100 target (≥90 gate) |
| Per-asset size (Cloudflare) | < 25 MiB, enforced in CI |

### 11.5 QA / build gates
`npm run verify` green; build leaves `git status` clean; sitemap/robots/schema valid;
canonical/hreflang/noindex correct; zero missing asset references; admin `_redirects`
shipped; no secret names in frontend bundles; Lighthouse + CWV within budget.

## 12. Scalability requirements

- **Content scale:** adding a route, vehicle, package or FAQ is a data change in the
  catalogue plus a rebuild — no per-page coding.
- **Page scale:** the pre-renderer walks a manifest, so URL count grows linearly with
  build time, not with hand-maintained files.
- **SEO scale:** new pages are declared once in the keyword/content map (keyword,
  intent, URL, cluster, template, schema).
- **Language scale:** a new locale needs translations, fonts and route entries; the
  templates and hreflang machinery already generalise.
- **Commercial scale:** the API owns fares and bookings, so a second city, brand or
  operator onboarding does not require a new repository or a rewritten frontend.
- **Team scale:** one command contract, CI gates and this doc pack make hand-offs
  repeatable; agents follow `AGENTS.md` and the trackers.

## 13. Security & content governance

- No secrets, tokens, credentials or customer PII in the repository, frontend bundles,
  build output or chat. Server secrets live in `backend/.env` locally and in the Render
  dashboard in production.
- `backend/src/config/env.ts` refuses to boot production with missing or insecure
  configuration (no test auth, HTTPS CORS origins, Razorpay secret + webhook secret
  paired with any key id).
- Payments are only ever confirmed by verified provider webhooks; the browser can never
  mark a booking paid. Refunds and status transitions are role-gated and audited.
- CORS is an explicit origin allowlist; helmet headers, request IDs, rate limiting and
  a 1 MB body limit are on by default; webhook routes are excluded from rate limiting
  but verified by signature.
- Content governance: fares, inclusions, policies and NAP come from one catalogue and
  the fare engine; no claim may contradict the engine (night allowance, advance, GST,
  coverage) — fix the engine or fix the copy.
- Off-page activity stays white-hat; no PBNs, link farms, or automated spam.
- External links use `rel="noopener"`; no untrusted embeds; all injected data escaped.

## 14. Analytics, tracking & reporting

- **GA4 events:** `tel_click`, `wa_click`, `begin_checkout`, `add_payment_info_demo`,
  `purchase_demo`, `enquiry_submit`, `lang_switch`, `filter_click`, `fare_quote`.
- **GA4 "AI Assistants" channel** via referrer + UTM regex; monitor AI referral
  sessions and landing pages.
- **Search Console:** verify + submit sitemap; watch coverage, queries, CTR, 4xx/5xx,
  mobile usability, CWV; request indexing for new money URLs.
- **Bing Webmaster:** verify + sitemap (also feeds AI/browsing surfaces).
- **Rich results:** validate after every SEO-affecting change.
- **Brand/AI mention tracking:** AI visibility tracker (brand vs. top competitors) plus
  alerts; monthly review.
- **Uptime:** `npm run healthcheck` (dependency-free) checks the API `/health`, the
  customer site and the admin site; `.github/workflows/uptime.yml` runs it every five
  minutes and fails the workflow on any failure. Targets and thresholds are documented
  in `docs/DEPLOYMENT.md` §6.
- **Cadence:** weekly visibility/anomaly check → monthly GSC + GA4 + CWV + AI mention
  report → quarterly strategy reset with the repeatable sprint workflow (§18).

## 15. Content & data requirements

### 15.1 Catalogue (current)
Cities: Agra, Delhi, Jaipur, Mathura, Gwalior, Lucknow. Vehicles: Sedan, Ertiga, Innova
Crysta, Tempo Traveller, Urbania. Routes: Agra↔Delhi, Agra↔Jaipur, Delhi↔Jaipur,
Agra→Mathura, Agra→Gwalior, Agra→Lucknow, Agra local sightseeing. Packages: Taj Mahal
Sunrise, Agra Sightseeing, Agra Unhurried, Mathura–Vrindavan, Gatimaan Express,
Golden Triangle. NAP (placeholder until launch): `+91 98765 43210` / `919876543210`,
`bookings@agraskbagheltourandtravels.com`, Near Taj East Gate Road, Taj Ganj, Agra 282001.

### 15.2 Content standards
Answer-first; short paragraphs; question H2s; tables and lists; local voice and real
detail rather than generic filler; meaningful Hindi (never machine-translated); identical
fares in both languages; consistent entity naming; every factual claim traceable to data
or code; operator bio and real reviews for E-E-A-T.

### 15.3 Launch data (must be real)
Real phone/WhatsApp/email/address/GST; a monitored mailbox or form endpoint; licensed
photography of the actual fleet; real reviews (or no rating claim at all); GBP synced to
the same NAP.

## 16. Accessibility requirements (WCAG 2.2 AA)

Structure (landmarks, one H1, ordered headings, correct `lang`); keyboard and focus
(visible focus, focus trap + restore in the mobile sheet, Escape closes, no traps);
screen reader semantics (labels, `aria-expanded`/`aria-controls`, dialog semantics, ARIA
1.2 combobox per the existing implementation); contrast AA; 44px targets; forms with
labels, `autocomplete`, `inputmode`, `aria-invalid` and non-colour error text; motion
respecting `prefers-reduced-motion`; meaningful alt text; no-JS fallbacks for navigation
and Call/WhatsApp. Verify with keyboard, screen reader and Lighthouse ≥90.

## 17. Testing & QA requirements

- **Unit:** fare engine (one-way, round-trip, advance, night allowance, add-ons), date
  helpers, schema builders, robots/sitemap generation (backend: Vitest suite, 38 tests
  in the deterministic CI run).
- **Integration:** booking + payment vertical slice, admin catalog and RBAC, contract
  tests for every public API route.
- **Build:** clean deterministic rebuild; no writes outside `dist`; asset audit reports
  zero missing references; pre-rendered HTML contains titles, canonicals, hreflang and
  schema.
- **Functional:** booking happy path and edges (TTL, back navigation, post-payment
  lock, reset, query hydration); calculator; filters; FAQ; contact; language switch.
- **A11y:** keyboard + screen reader pass, axe/Lighthouse.
- **Performance:** Lighthouse + CWV budget, page-weight audit.
- **SEO:** titles/meta/H1/canonical/hreflang/schema/sitemap/robots/noindex, Rich Results.
- **AI/LLM:** critical facts present in HTML, tables and FAQs; bots allowed; schema
  complete; AI visibility baseline recorded at launch.

## 18. CI/CD & workflow

- **Local:** `npm run install:all` → `npm run verify`.
- **CI:** `.github/workflows/quality.yml` on Node 22 — typechecks, `npm test`, `build:all`,
  then the deploy guards (artifacts present, no secret names in frontend builds,
  <25 MiB assets, admin `_redirects` shipped, build hygiene).
- **Branches:** feature branch → `design/homepage` (integration) → PR review → `main`
  (production). Never deploy from an artifact committed to Git.
- **Deployment:** follow `docs/DEPLOYMENT.md` — API first, then Pages projects, then DNS;
  verify `/health` and `/ready` (a memory-store `/ready` means no database, treat as
  failed).
- **Rollback:** redeploy the previous Pages/Render artifact; database changes follow
  `docs/backend/DATABASE_MIGRATION_ROLLBACK.md`.
- **Repeatable SEO/AI-SEO sprint** (2–4 weeks): set goal → audit visibility → pick 3–6
  high-impact tasks → build with the content structure in §9.5 → publish with technical
  best practice → promote → measure → iterate.

## 19. Release & roadmap

| Milestone | Status |
|---|---|
| Static marketing site (phases 1–32) | Superseded by the React platform |
| Backend architecture (fares, bookings, payments, admin, catalog, reviews) | ✅ on `design/homepage` |
| React customer site (design system, hubs, details, search, SEO, SSG) | ✅ 75 pages pre-rendered |
| Operations desk (RBAC, all screens) | ✅ buildable; API wiring pending |
| Deployment standardization (CI contract, routing, Docker, naming, docs) | ✅ |
| Frontend ↔ API integration | ⏭ next (Phase I1) |
| Payments go live | Phase I2 |
| Operations hardening | Phase I3 |
| Launch content readiness (real NAP, photos, reviews) | Phase I4 |
| Observability & release discipline | Phase I5 |

Detailed steps and acceptance criteria live in `03_PHASE_PLAN.md`.

## 20. Risks, dependencies, assumptions

| Risk | Impact | Mitigation |
|---|---|---|
| Placeholder NAP/phone ships to production | Lost calls, wrong schema | Launch gate §25; CI cannot catch this — human sign-off required |
| Client delays real photography/NAP | Launch slips | Publish with clearly marked temporary assets only behind a launch block |
| Payment provider KYC delay | Online advance impossible | Call/WhatsApp funnel already works without payments |
| Fare drift between client engine and API | Wrong quoted price | Parity tests in Phase I1; API becomes the only source |
| Pages project name mismatch | Deploy updates the wrong (or a new) project | Names standardized and documented in `docs/DEPLOYMENT.md` |
| Aggregator price undercutting | Lower direct conversion | Transparent inclusions, reviews, local trust signals |
| Over-zipping thin location pages | Quality/SPAM risk | Zipper rule §9.3 — demand-gated pages only |

Assumptions: the operator can respond to calls/WhatsApp 24×7; fares, inclusions and
cancellation policy are approved by the client; Cloudflare Pages and Render remain the
hosts; Node 22 stays the supported runtime.

## 21. Definition of Done (DoD)

A page or feature is done when: content is in the pre-rendered HTML; title/meta/H1/
canonical/hreflang/schema are correct and unique; internal links resolve both ways;
images are WebP with measured dimensions and meaningful alt; keyboard and screen-reader
paths work; budgets in §11.4 hold; no console errors or broken references;
`npm run verify` passes; the tracker is updated; and no locked design item was changed
without permission.

## 22. SEO Checklist (review gate)

- [ ] Keyword → URL map updated for any new page
- [ ] Title ≤60 chars, unique, keyword front-loaded; meta 140–160 chars, unique
- [ ] Exactly one H1; logical H2/H3 order; question-shaped H2s where natural
- [ ] Self-referencing canonical on the canonical origin
- [ ] hreflang `en-IN` / `hi-IN` / `x-default` reciprocals complete
- [ ] Template-appropriate JSON-LD graph present and valid
- [ ] Internal links: reachable ≤3 clicks, contextual, descriptive anchors
- [ ] Content answer-first, tables/lists for facts, numbers explicit
- [ ] Descriptive `alt` on every image; no text baked into images
- [ ] Sitemap includes the URL with fresh `lastmod` and alternates; robots allows it
- [ ] Noindex only on the funnel and 404s
- [ ] Page renders fully without JavaScript
- [ ] CWV within budget; Lighthouse ≥90
- [ ] Rich Results test clean after the change

## 23. Off-Page / link-building checklist

- [ ] Citation consistency (NAP) across the core local directories
- [ ] GBP complete: categories, services, photos, hours, Q&A, posts
- [ ] Review velocity plan (request, respond, surface on site)
- [ ] Travel/local media outreach and roundups
- [ ] Digital PR: data story or expert commentary pitch
- [ ] Partner links (hotels, vendors, tourism boards) where genuine
- [ ] Anchor-text distribution natural; no paid/spam links
- [ ] Monthly link + mention report

## 24. AI/LLM visibility checklist

- [ ] Crawlers allowed in robots; no critical content blocked
- [ ] Facts in HTML: fares, distances, durations, inclusions, policies
- [ ] FAQ + comparison tables on money pages
- [ ] Entity consistency (`sameAs`, consistent naming, real author/operator)
- [ ] Schema complete and matching visible content
- [ ] Baseline AI visibility recorded (brand + competitor prompts)
- [ ] Monthly AI mention and AI-referral review

## 25. Client deliverables & decision points (must be resolved before launch)

1. Final phone/WhatsApp number and monitoring arrangement (replaces the placeholder).
2. Approved fare card, night allowance, advance amount and cancellation/refund policy.
3. GST/legal entity details for the footer and invoices.
4. Real fleet photography (and permission to publish vehicle photos).
5. Reviews: which real reviews may be published, and permission to use them.
6. Google Business Profile access and service areas.
7. Razorpay account/KYC and the business decision on accepting online advances.
8. Analytics and Search Console ownership (who receives reports, which accounts).

## 26. Template / landing content checklist (route example)

Breadcrumb with distance/duration/highway → answer-first paragraph → 5-vehicle fare
matrix with markers → what the fare includes (toll, tax, parking, driver allowance,
state permit) → highway advisory (speed limits, best departure, rest stops, night rule)
→ en-route stops and sightseeing → FAQ (6 questions, both languages) → dispatch CTA with
call/WhatsApp → schema graph (TaxiService + BreadcrumbList + FAQPage).

## 27. Change management

- Architecture or scope changes are logged in `04_PROGRESS_TRACKER.md` → Decision Log
  before implementation, with the reason.
- New pages/phases require a plan entry in `03_PHASE_PLAN.md` with acceptance criteria.
- Locked design items (`DESIGN_LOCKS.md`) need explicit user approval to change.
- Documentation is part of the change: if behaviour, commands or deployment settings
  move, the matching doc (`README.md`, `docs/DEPLOYMENT.md`, `02_PROJECT_CONTEXT.md`)
  moves in the same commit.
