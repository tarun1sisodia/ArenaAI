# Product Requirements Document (PRD) — Master / Final v3.0

**Product:** Premium bilingual customer website + AI-ready SEO growth engine for **Agra SK Baghel Town & Travels**
**Version:** 3.0 — Master (engineering-led, SEO/AI-SEO-first, design-locked, scalable, client-ready)
**Status:** Final target specification · Approved scope · Build tracked in `04_PROGRESS_TRACKER.md`
**Date:** 2026-09-03
**Project:** `tarun1sisodia/ArenaAI`
**Implementation branch:** `arena/01a06804-arenaai`
**Canonical domain:** `https://skbagheltravels.in`

> **Single source of truth.** This document defines **everything the project wants**:
> product/business goals, full SEO + AI-Search (LLM/AISO) strategy, off-page & Digital PR
> plan, content/cluster architecture, design/UX system, engineering, scalability,
> security, analytics/reporting, QA, client deliverables & decision points, and launch
> gates. It consolidates `00_START_HERE.md`, `01_AI_OPERATING_INSTRUCTIONS.md`,
> `02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`, `04_PROGRESS_TRACKER.md`,
> `05_FRONTEND_FIX_PLAN.md`, `06_AUDIT_REPORT.md`, `DESIGN.md`, `FRONTEND-PLAN.md`,
> `LAUNCH_CHECKLIST.md`, the **SEO Final BOSS** knowledge pack (ROCKET process,
> keyword-intent framework, Matt Kenyon 3-step playbook, Surfer/AI-SEO course: AISO,
> entity signals, topical authority, content-for-AI structure, Digital PR, AI visibility
> tracking, workflow/scaling), and the client proposal requirements (n8n/WhatsApp,
> Razorpay, SMS, 1-year SEO scope, decision points).
>
> **Authority rule:** this PRD is the source of truth for **what** and **why**;
> `02_PROJECT_CONTEXT.md` remains source of truth for the locked **architecture**.
> Where this doc and older files disagree on target, this document wins.

---

## 0. How to read this document

| Section | Audience | Purpose |
|---|---|---|
| 1–5 | Owner, PM, client | What/why we build, goals, KPIs, scope, client deliverables & decisions |
| 6–8 | PM/Design | Users, journeys, sitemap, page-by-page functional requirements |
| 9 | SEO/AI-SEO | Full SEO strategy: ROCKET, keyword intent, on-page, technical, off-page, local, multilingual, AI/LLM (AISO), topical authority, structure, E-E-A-T, schema, measurement |
| 10 | Design | Brand, UI, UX, responsive, accessibility, conversion |
| 11–13 | Engineering | Architecture, build, scalability, security |
| 14 | Analytics/PM | Tracking, GA4, AI Assistants channel, reporting cadence |
| 15–18 | All | Content/data, a11y, QA, CI/CD |
| 19–27 | PM | Roadmap, risks, DoD, checklists (SEO, off-page, AI), client decision points |

---

## 1. Executive summary

**Agra SK Baghel Town & Travels** is an Agra taxi, cab, Tempo Traveller, Innova and
tour-package operator. We are building a **premium, bilingual (English + Hindi),
static, SEO-first customer website + a repeatable SEO/AI-SEO growth system** that:

1. Looks like a **well-run local travel desk** (not a marketplace), using a high-end
   UI/UX built on the approved Dark Navy + Golden design system.
2. **Generates leads** by making Call + WhatsApp the primary conversion path, with a
   complete **5-step mock booking flow** (ready to connect to Razorpay + n8n later).
3. **Wins Google in English and Hindi** for high-intent route/taxi/package queries via a
   deliberate **Research → Optimize → Content → Keywords → Earned Media → Testing**
   (ROCKET) process.
4. **Is visible and quotable inside AI search** (ChatGPT, Gemini, Perplexity, AI
   Overviews) — not just ranked — by building entity signals, topical authority, E-E-A-T,
   structural clarity, and off-site consensus (Digital PR + UGC).
5. **Is fast, responsive, accessible, and technically clean** (100/100-target Lighthouse,
   crawlable HTML, schema-rich, Core Web Vitals green).
6. **Is maintainable and scalable**: content is data-driven, pages are generated, new
   routes/vehicles/packages/languages/domains are data-only additions; a future
   backend/admin/automation phase connects without redesigning UX.

---

## 2. Problem & opportunity

### 2.1 Problem
- High-intent Google searches ("Agra taxi", "Agra to Delhi taxi", "Taj Mahal
  sightseeing", "Tempo Traveller Agra", "Agra tour packages") are served by impersonal
  marketplaces and low-quality local sites.
- Travelers are increasingly asking **AI assistants** ("best taxi from Agra to Delhi",
  "Agra sightseeing package") — many of these answers have **no clickable link**, so a
  brand is only visible if it is **mentioned inside the model**, which requires
  authoritative, structured, entity-rich content and external consensus.
- The operator needs a premium, credible, conversion-optimized, **bilingual** presence
  that also ranks **and** is AI-recognizable — without needing a CMS or a developer for
  every content change.

### 2.2 Opportunity
- **High-intent commercial/local queries**, not casual browsing.
- **AI Search Optimization (AISO)** is a new layer on top of SEO: AI tools pull from
  high-ranking, trusted content, so good SEO + entity/authority signals = brand mentions
  inside AI answers. This compounds brand visibility even when clicks don't.
- **Price transparency** ("Know the fare before you pack") is a differentiator and a
  strong entity/trust signal.
- **English + Hindi** doubles the audience and reaches local/domestic travelers where
  English-only competitors do not.

---

## 3. Business goals

### 3.1 North star
> **Make travel feel easy before the journey begins — and make the brand findable,
> trusted, and quotable wherever customers search, including AI assistants.**

### 3.2 Primary business goals
1. **Generate leads.** Convert visitors to phone calls + WhatsApp messages first.
2. **Build a premium brand** and outshine marketplace look-alikes.
3. **Own the search.** Rank for route/taxi/vehicle/package intent in EN and HI, and grow
   topically into adjacent "how/which/best/price" queries.
4. **Be visible to AI.** Be cited/mentioned by ChatGPT, Gemini, Perplexity, Bing AI, and
   Google AI Overviews for the category.
5. **Close with trust.** Show exact fare, advance, remaining balance, night allowance,
   and add-ons **before** the customer commits.
6. **Support direct booking.** 5-step flow, ready to connect to **Razorpay** and
   **n8n-WhatsApp/email/SMS** automation later.
7. **Be operationally updatable.** Owner swaps fares/contact/photos/reviews from one
   data source and rebuilds.
8. **Be client-ready + launch-ready.** Client materials are enumerated, decision points
   are explicit, and all NAP/GST/assets/reviews/QA gates are green before go-live.

### 3.3 Quality/engineering goals
- Zero failed requests/page (merge gate); no `4xx` in sitemap; no console errors.
- Lighthouse mobile **100/100 target** (≥90 gate) on Home, `/en/routes/`, `/book.html`.
- Core Web Vitals: **LCP ≤ 2.5s**, **INP ≤ 200ms**, **CLS < 0.1**.
- No horizontal overflow 320–1440px, EN + HI.
- WCAG 2.2 AA; 44px touch targets; one H1/page; proper H1→H6; meaningful alt text.
- Complete crawlable HTML (no JS-gated content, no "load more" traps, no text-in-image).
- Fares identical in EN and HI; no duplicated sources of truth; no hardcoded secrets.
- Build is reproducible + deterministic; regenerable with one command.

---

## 4. Success metrics & KPI framework

### 4.1 Traditional SEO / site KPIs
| KPI | Target |
|---|---|
| Organic sessions (EN+HI) | Grow MoM; route pages > hub pages > home |
| Call/WhatsApp clicks | Primary conversion; track via GA4 events |
| Booking starts/completions (demo) | Secondary; GA4 `begin_checkout` / `purchase` style |
| Bounce on money pages | ≤ 45% |
| Avg position for money terms | Rising MoM (Agra taxi; <city> taxi; Agra to <city>) |
| Indexation | All intended URL classes indexed; 0 unwanted indexed URLs |
| Broken links/assets/console errors | 0 |
| Internal pages with one H1, unique title/meta, canonical, schema | 100% |
| hreflang EN/HI parity | 100% |
| Core Web Vitals (field) | All "Good" at 75th pct |
| Lighthouse | 100/100 target (≥90 gate) |
| 404/crawl errors in GSC | ≤ 0 new per month |

### 4.2 AI Search (LLM/AISO) KPIs
| KPI | Target |
|---|---|
| Brand mentions in ChatGPT/Perplexity/Gemini/Bing AI | Rising monthly via Surfer AI Tracker |
| Prompts where brand appears vs. competitors | Growing share of voice; closing baseline gaps |
| Sources feeding mentions | Mix of own site, directories, UGC, media |
| AI referral sessions (GA4 "AI Assistants") | Growing; tracked via domain + UTM regex |
| Content Score | Strategy pages green in Surfer |
| Topical coverage | Fill priority gaps from Topical Map |
| Zero-click visibility | Tracked in reports even without clicks |

### 4.3 Definition of "done" (release gate)
Every page meets §21 DoD; launch gates in `LAUNCH_CHECKLIST.md` (real NAP/GST, real
photos/reviews, fonts, QA, GBP, GSC/Bing, analytics) are green; client decision points
(§25) resolved before go-live.

---

## 5. Scope

### 5.1 In scope (site)
- Static **bilingual MPA** (EN + HI), localized URLs, hreflang.
- Home, Services, Routes, Packages, Fleet, About, Contact, FAQ, Privacy, Terms.
- Dedicated route/vehicle/package landings (SEO depth + AI-recognizable content).
- Transparent fare engine + 5-step mock booking (`book.html`, noindex).
- Lead systems (sticky Call/WhatsApp/Book bar, widgets, contact form).
- Dark Navy + Golden design system; fully responsive + accessible + performant.
- Data-driven Python SSG, image pipeline, QA scripts, analytics hooks, sitemap/robots.

### 5.2 In scope (SEO / AI-SEO deliverable, 1-year)
- Complete **basic + local SEO** coverage: research, on-page, technical, off-page/link
  building, local citations, GSC/GA4 setup, weekly/monthly reporting.
- **AI Search Optimization**: entity signals, topical authority, AI-friendly structure,
  schema, UGC/Digital PR support, AI visibility tracking.
- White-hat authority building and Digital PR (roundups, guest, HARO/Featured,
  media/data pitches) — defined as an owned deliverable.

### 5.3 In scope (client integrations — configured or documented)
- **n8n WhatsApp + email confirmation workflow** (optional, client chooses).
- **Razorpay credentials/KYC** ready for a real payments phase.
- **SMS gateway** (optional, client chooses).
- Admin/reporting inspiration: **Evilcharts** for an admin dashboard (future phase).

### 5.4 Out of scope (deferred future phase, unless added)
- Live payments, admin/auth/CMS, real dispatch/tracking, in-app chat.
- Edited `design-guide/` / `proposal/` (source archives).
- Framework rewrite (Next/React) — SSG is mandatory for SEO on this pass.

---

## 6. Users & journeys

### 6.1 Personas
| Persona | Need | Lang | Primary action |
|---|---|---|---|
| Domestic tourist (Taj) | Airport/hotel pickup, sightseeing, Agra→Delhi/Jaipur | Hi/En | Call/WA/Book |
| Family/group (5–16) | Tempo/Urbania tours, weddings, corporate | Hi/En | Call, enq |
| International/business | Reliable intercity transfer, premium Innova | En | Book then call |
| Pilgrim/day-tripper | Mathura–Vrindavan darshan, local taxi w/ waiting | Hi | Call |
| Researcher | Fares, routes, fleet, reviews, trust | Either | Browse → Call |

### 6.2 Core journeys
- **J1 Find a ride:** Google/AI → route/vehicle landing → fare/options → Call/WA/Book.
- **J2 Compare:** Routes hub → calculator → book → 5-step → ticket.
- **J3 Plan a tour:** Packages hub → package landing → Enquire/Book.
- **J4 Verify:** About/Reviews/FAQ/NAP → Call/WhatsApp.
- **J5 Local intent:** Map/GBP → site → Call/WhatsApp.
- **J6 AI-assistant path:** ChatGPT/Perplexity → sees brand mention/quote → visits or
  calls via citation/NAP.

---

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
| 11 | Route landings | `/en/{slug}/` | `/hi/{slug}/` | Yes | Transactional/local |
| 12 | Vehicle landings | `/en/vehicles/{slug}/` | `/hi/vehicles/{slug}/` | Yes | Commercial |
| 13 | Package landings | `/en/packages/{slug}/` | `/hi/packages/{slug}/` | Yes | Commercial |
| 14 | Booking app | `/book.html` | same | **Noindex** | Conversion |

URL rules: lower-case, hyphenated, keyword-bearing; one canonical URL per intent; no
`?from=&to=` indexable variants (query params only for booking prefill); 301 old stubs;
base-agnostic build.

---

## 8. Functional requirements by page

### 8.1 Global
- Header nav, footer NAP + legal, language switch, skip link, correct `lang`.
- Lead-bar: route pages desktop; all marketing ≤700px; hidden on `book.html`.
- Demo chip + toasts ("demo — nothing charged").
- All content present in default HTML (crawlable/LLM-readable), not hidden behind JS.

### 8.2 Home
Hero + booking widget, trust bar (real at launch), route/pricing preview, services,
fleet, packages, honest reviews, CTA sections. **Entity-rich**: clear brand name,
tagline, services, location, key people, categories.

### 8.3 Services
Grid of service cards (taxi, airport, outstation, local sightseeing, group, packages);
each links to route/package/fleet; CTA to contact.

### 8.4 Routes hub
Route cards + fare calculator (pickup/drop/date/time/vehicle/trip → total/advance/
balance/night-allowance) + 9-route per-vehicle fare table.

### 8.5 Packages hub / 8.6 Fleet hub
Package cards (duration/price/places/image/add-ons) with Enquire/Book; fleet cards with
seat/class filters and "Choose this car"; both with tables for AI extraction where useful.

### 8.7 Route landing (money page)
- H1 = "Agra to Delhi Taxi" (or Hindi).
- Intro answer-first: km, duration, from price, advance, Call/WhatsApp CTA.
- Vehicle + fare table; what's included/excluded; night-allowance; highlights/itinerary;
  why-us; **author/review/credibility block (E-E-A-T)**; FAQ (FAQPage schema); related
  internal links; Service/Offer/LocalBusiness/Breadcrumb schema; comparison table if
  relevant (taxi vs train etc.).

### 8.8 Vehicle landing / 8.9 Package landing
Vehicle: name/class, seats/bags/per-km, suitability, route fares, choose car. Package:
duration, itinerary, price, inclusions/exclusions, add-ons, gallery, FAQs, book/enquire.
Both with Service/Offer schema; **question-based H2s**; content visible in raw HTML.

### 8.10 About / Contact / FAQ / Legal
- About: story, team, **credentials, real-experience/case-study**, NAP, map, reviews.
- Contact: form with JS + no-JS fallback, NAP, map, Call/WhatsApp.
- FAQ: accordion + FAQPage schema; **answer-first** each Q; claims match engine.
- Privacy/Terms: bilingual; GST/booking/cancellation/refund clarity.

### 8.11 Booking app (5 steps)
Route → Vehicle → Details → Advance → Ticket; live fare breakdown; session state
`skb-booking` with 24h TTL; back never loses state; query-param hydrate; post-payment
read-only; "New booking" reset; mock UPI/card ~900ms; ticket `AGR-xxxx`; noindex.
- **Configurable:** advance % (client decision), fare logic (client decision),
  confirmation method (client decision: call/WA/email ticket).

---

## 9. SEO Strategy (full stack)

> **Framework: ROCKET.** Research → Optimize → Content → Keywords → Earned Media →
> Testing. Strategy principle: **one page = one search intent = one primary keyword;
> depth + topical authority + entity recognition over keyword stuffing.**

### 9.1 SEO process & deliverables (1-year basic + local)
1. **Keyword research** — user intent + difficulty; brand/product/service/buying
   keywords; competitor + SERP + AI-answer analysis.
2. **Analysis** — site audit (technical/on-page/performance/schema) + competitor audit.
3. **On-page** — titles, meta, headings H1–H6, URL, images/alt, content, internal links,
   schema, robots, canonical, sitemap.
4. **Off-page / link building** — local citations, directories, social bookmarking,
   article/guest, Web 2.0, forums, blog comments, image/PDF/video submission, profile
   links, Quora, local listing — **all white-hat.
5. **Reporting** — weekly Saturday ranking/visibility update; monthly GSC + GA4 report;
   monthly AI-visible report; Search Console + GA4 month-end insights.
6. **AI-SEO layer** — entity/authority/topical/AI-structure/measurement below.

### 9.2 Keyword research & intent framework
- **Source of truth for targeting:** start from the business (brand name, explicit
  products/services) → the query people type → the search intent → what the searcher
  needs → what Google assumes → whether we cover it completely.
- **Matt Kenyon 3-step playbook:**
  1. Identify core keywords + search intent (read SERP to learn assumed intent; "backdoor"
     roundups where intent is mixed).
  2. Build **the best page** — match the format of top results but differentiate the
     substance with E-E-A-T (original photos, real experience, clear ownership, honest
     data, review frameworks, author accountability).
  3. **Power up with topical authority** — cluster interrelated content and use internal
     links to pass authority from support pages to money pages; trust "web".
- **Filters from Semrush/Surfer-style tools:**
  - Money keywords (high-intent conversion) → service/money landing page.
  - Informational (build topical authority) → support/guide content.
  - Adjacent funnel (early awareness) → engagement content.
  - KD < 30 + volume > 100/mo (where real) + high intent = priority.
  - Questions tab ("How much does Agra to Delhi taxi cost?") near point of purchase.
- **Entity-first:** define and consistently name the brand, services, cities, monuments,
  vehicles, people, category across the site and web.

### 9.3 Keyword → URL mapping (EN/HI) — seeded, expandable
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

**Zipper Method (apply carefully):** build service+location pages (e.g., "Agra taxi",
"Agra to Delhi taxi", "Tempo Traveller hire Agra", "Taj Mahal sightseeing package")
from a winning template and replicate across the grid. **No over-zipping** — only pages
with genuine demand; avoid thousands of near-identical pages (quality/SPAM risk).

### 9.4 On-page SEO requirements (every indexable page)
| Element | Requirement |
|---|---|
| Title | ≤60 chars, primary keyword front-loaded, unique, compelling + brand hint |
| Meta description | 140–160 chars, keyword + benefit + CTA, unique |
| H1 | exactly one, primary keyword, not duplicate of title |
| H2–H6 | **question-based / section-based**; H1>H2>H3 no jumps |
| URL | short, lower-case, hyphenated, keyword-bearing |
| Content | depth matches intent; **answer-first**; primary keyword in first 100 words |
| Internal links | 3–5/page, descriptive anchors, hub↔landing, related landing↔landing, support→money |
| External links | 2–3 reputable citations where claims need support; `rel="noopener"` |
| Images/alt | descriptive alt, keyword where natural, descriptive file names, attrs, lazy |
| Speed | §11 performance budgets |
| UX | mobile-first, clear CTAs, no intrusive popups |
| E-E-A-T | author bios w/ real credentials, first-hand experience/data, cite sources, honest reviews |
| Freshness | build date, `priceValidUntil`, monthly review |
| Schema | §9.13 — validated |
| Unique value | not AI slop: add local knowledge, real photos, data, opinions, stories |

### 9.5 Content structure for AI discovery (Surfer-style)
- **Question-based subheadings**: "What does an Agra to Delhi taxi cost?" not "Pricing".
- **Lead with the answer** in the first 1–2 sentences after each question heading (AI
  quotes that paragraph).
- **Clear sections:** one idea per section; numbered lists for processes; bullets for
  comparisons/features; H3 to break long H2s; avoid giant text blocks.
- **Tables:** fare/comparison/inclusion tables (AI extracts structured facts).
- **FAQs:** capture niche questions often lifted verbatim.
- **Visible in raw HTML:** critical info in default HTML; no JS-gated/tab-loaded content;
  no text in images; alt text; transcripts for video.
- **Validate with Surfer/Content Editor:** score green; use Boost Coverage / Surfy /
  Topical Map gaps; keep brand voice.
- **Real substance:** original photos, on-the-ground local insight, operator data,
  case/story (the "anti-slop" personality layer).

### 9.6 Technical SEO requirements
- **Crawl/index:** clean `robots.txt`; **must allow GPTBot, Googlebot, Bingbot** (these
  power AI tools/AI Overviews); `noindex,nofollow` `book.html`; no thin/filter/param
  indexable pages.
- **Canonical:** self-referencing absolute on each indexable page.
- **hreflang:** en-IN / hi-IN / x-default, reciprocal.
- **Sitemap:** one XML, all indexable URLs, `lastmod`; submit GSC + Bing.
- **Redirects:** 301 for old stubs; no chains; branded 404.
- **HTTPS + canonical = production domain.**
- **Crawlable HTML + clean DOM** (no render-blocking issues), no JS-only nav for SEO.
- **Metadata depth:** one H1, titles/meta, proper heading hierarchy, schema, sitemap,
  robots — the **"80-signal"** on-page/technical checklist is automated via build/QA.
- **Core Web Vitals** (§11) considered part of technical SEO.
- **Indexing shortcut:** after deploy, request indexing in GSC for new money URLs.
- **No orphan pages:** every page reachable within a few clicks; internal-link mesh.

### 9.7 Off-Page SEO / link building (white-hat, phased)
Scope/deliverable set (client proposal "Phase 2" + ROCKET Earned Media):
1. **Search engine submission** (GSC + Bing Webmaster).
2. **Local citations & directory listings** — Google Business Profile, Justdial,
   Sulekha, Bing Places, Yelp, Apple Maps, TripAdvisor, local travel/taxi directories.
3. **Google Business Profile optimization** — categories, photos, services, Q&A,
   opening hours, area served, posts, reviews.
4. **Social bookmarking** on trusted platforms (Reddit, Quora, LinkedIn, X, relevant
   community sites).
5. **Profile/property creation** on high-authority websites.
6. **Country-based classifieds** (relevant local classified listings).
7. **Article submission / guest posting** — pitch travel/taxi/family-cab roundups and
   reputable regional blogs; use `[industry] + "write for us"` search.
8. **Web 2.0 properties** with optimized original content (not spam).
9. **Forum posting** (be genuinely helpful, don't aggressively pitch).
10. **Blog commenting** (only where substantive/valuable).
11. **Image sharing** (Google Business Profile photos, Pinterest, Flickr, Unsplash
    alternatives) with descriptive alt/links.
12. **PDF submission** (travel guides, fare guide, itinerary PDFs on document-sharing
    platforms) — with NAP + link.
13. **Video submission** (YouTube reels/shorts; describe tours/routes; transcript).
14. **Quora backlinks/mentions** — answer real questions about Agra taxis/Taj trips.
15. **Digital PR (earned media)** — HARO/Featured.com, data/news pitches, expert-quote
    requests, "best of" roundups, podcast/webinar transcripts, original research.
16. **Broken backlink swapping** — offer replacement content for dead competitor links.
17. **Reviews/UGC** — verifiable Google/TripAdvisor/Justdial reviews; ask satisfied
    customers; amplify in community threads; track with Google Alerts/Brand24.
18. **Entity/database listings** — Wikidata, LinkedIn, Crunchbase-adjacent, industry
    aggregators, so LLMs connect the brand.

**Rules:** no PBNs/link farms; no paid links on low-quality sites; no automated spam.
Every earned mention should be linked from the site's About/Resources where appropriate
so Google/LLMs connect the entity.

### 9.8 Local SEO
- Consistent **NAP** across site, schema, Google Business Profile, citations, directories.
- Geo coordinates, map, area served, service area, customer-care `contactPoint`.
- No fabricated ratings/reviews; aggregateRating only from verified data.
- Local keywords naturally (Agra, Taj Ganj, Agra Airport, Mathura, Delhi NCR etc.).
- Post-launch: claim/optimize GBP, add photos/services/FAQ, site↔GBP linkage.

### 9.9 Multilingual SEO
- Localized slugs, real translated content, correct `lang`, hreflang parity.
- Fares numeric single-source; translate copy, never fares.
- Hindi fonts (Noto Devanagari) `display=swap`; no hidden performance cost.
- Hindi entity naming consistent (आगरा, ताज महल, मथुरा, वृंदावन, etc.).

### 9.10 Topical authority & content clusters
- **Own the category**: Agra travel & taxis = core cluster; support money pages with
  how-to, comparison, cost, and itinerary content answered with E-E-A-T.
- **Cluster (seeded, expandable via data):**
  - Money: Agra taxi, Agra→Delhi/Jaipur/Mathura/Gwalior/Lucknow taxi, Tempo/group,
    Taj sightseeing, Golden Triangle, Mathura–Vrindavan, fleet pages.
  - Support: "Agra to Delhi taxi cost", "best time to visit Taj", "taxi vs train",
    "how to book Tempo Traveller in Agra", "Agra airport transfer", "Golden Triangle
    itinerary", "Taj sunrise tips", FAQs.
  - Wrap-around: reviews, about/local knowledge, case studies, first-party data.
- **Avoid**: thin/disjointed content, rapid topic switching, ignoring support content.
- **Internal link equity:** support → money; hub → landing; landing ↔ related landing;
  link to PR/guest posts from About/Resources.

### 9.11 AI Search Optimization (AISO / LLM visibility)
> Traditional SEO gets you **ranked**. AISO gets you **mentioned** inside ChatGPT,
> Gemini, Perplexity, Bing AI and Google AI Overviews. It **builds on** SEO; it does not
> replace it.

Requirements:
1. **Technical accessibility for LLMs:** allow GPTBot/Googlebot/Bingbot; submit sitemap
   to GSC + Bing; crawlable HTML; clean URLs; no orphan pages; no JS-gated content.
2. **Entity recognition:** consistent brand name, tagline, services, people, locations
   across site + About/schema/author bios; listings in directories/Wikidata/Social;
   clear `Organization`/`LocalBusiness`/`Person` schema; sameAs links.
3. **Trust signals:** real experience, original photos/screenshots, author bios with
   credentials, verifiable reviews, local expertise, cite credible sources, first-party
   data (e.g., "last 500 trips", avg fares, popular routes).
4. **Structured, quotable content:** question H2s, answer-first, tables/lists/FAQs,
   visible in HTML; content score green.
5. **Consistent external consensus:** reviews, Google Business, citations, forums,
   roundups, media/quotes, podcast transcripts — AI summarizes multiple perspectives, so
   cross-source consistency matters.
6. **Entity-based SEO over pure keywords:** define the company, product, founders,
   competitors, category; be in "Top X Agra taxi" roundups; keep schema + Wikidata +
   directories aligned.
7. **Own the whole answer where possible:** rich topical coverage lets LLMs cite multiple
   pages from the same domain.
8. **Do not chase hype:** keep strong topical coverage, real answers, structure,
   technical accessibility, and measurement.

### 9.12 E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- **Experience:** real operator; original photos (not stock only), local knowledge,
  first-hand route/driver/vehicle specifics, case study/story block.
- **Expertise:** author/operator bio with credentials ("10+ years Agra tours"), guide
  content grounded in real details.
- **Authoritativeness:** publish verifiable data/reviews, citations, be referenced by
  third parties (Digital PR, forums, roundups).
- **Trustworthiness:** transparent NAP/GST, policies, honest ratings, clear payment/
  cancellation/refund, visible demo label, no unverifiable claims (night allowance must
  match engine; ratings only if real).

### 9.13 Schema & entity signals
| Page | Schema |
|---|---|
| Global | `Organization` / `LocalBusiness` / `TaxiService`: NAP, geo, image, sameAs, `contactPoint` |
| Home | `WebSite`, `WebPage`, breadcrumb |
| Route | `Service`, `Offer` (INR, availability, priceValidUntil), `BreadcrumbList`, optional `FAQPage`, honest `AggregateRating`/`Review` |
| Package | `Service`/`TouristTrip`, `Offer`, `BreadcrumbList`, FAQ |
| Vehicle | `Service`, `Offer` per route, `BreadcrumbList` |
| FAQ | `FAQPage` |
| Author/Expert | `Person` (author bio, credentials, social) |
| Reviews | `Review`/`AggregateRating` only real |
| Contact/About | `LocalBusiness`, `ContactPage` |
| Article (future guides) | `Article` (title, publish/updated date, author, main image) |

All schema must be **accurate and complete** (richer, correct fields → better human AND
AI interpretation). Validate with Rich Results Test after every change.

### 9.14 AI visibility measurement & reporting
- **Surfer AI Tracker:** baseline brand + top 2–3 competitors; monitor prompts, mentions,
  sources, missed opportunities daily; report monthly.
- **GA4 AI Assistants channel:** create channel group regex
  `(chat\.openai\.com|perplexity\.ai|copilot\.microsoft\.com|you\.com|pi\.ai|meta\.ai|gemini\.google\.com|claude\.ai|anthropic\.com|…)`; also UTM-based regex
  `(chatgpt|openai|perplexity|claude|gemini|copilot|… )`. Add UTMs to shared links in AI
  prompts/docs. Build a simple table (source × sessions) and trend over time.
- **Competitive context:** compare mentions/prompt-share with competitors; diagnose which
  sources feed them (blogs/roundups/forums/media), reverse-engineer.
- **Monthly report** = context → results (mentions, pages/prompts won) → actions →
  lessons → next sprint → next topic focus.

---

## 10. Design & UX requirements

### 10.1 Brand system (locked)
- **Dark Navy + Golden** (Option A), 60/25/15; gold = seasoning; no second accent; no
  WhatsApp green on lead-bar.
- Type: Fraunces (display), DM Sans (UI), DM Mono (labels); Noto Devanagari for Hindi.
- Tokens from `DESIGN.md`; container 1140px, header 78px (64px mobile), radius 3px, pills
  only chips/filters, touch 44px, motion 180ms ease, reduced-motion honored.

### 10.2 UI quality bar (modern, high-end)
Target a **premium, professional, "award-worthy" feel** using a small, curated reference
set (derive patterns, never copy):
- `21st.dev` — polished marketing/landing UI patterns and animated components.
- `Godly Design` — modern web aesthetics, hero patterns, section rhythm.
- `Motion sites` / `Motionsites` — tasteful micro-interaction and page-motion references.
- `Shadcn` / `Shadscan` — accessible component tokens/conventions for future UI
  (admin/booking), kept consistent with the 3px-radius system.
- `Awwwards` — inspiration only; prioritize speed/originality over decoration.
- `Pdfcn` — clean document/print/PDF-style layouts for fare/itinerary/summary artifacts.
- `Evilcharts` — reference for the **future admin/dashboard** reporting page (analytics,
  bookings, fares, SEO/AI mentions).

**Rules:** never copy proprietary assets; adapt to Dark Navy + Golden tokens; keep
motion ≤180ms and `prefers-reduced-motion`; no heavy shadows on marketing cards; add
"wow" only where it doesn't hurt CWV (prefer CSS content-visibility + small assets).

### 10.3 Design inventory
Buttons (3 types), lead bar, header/nav (mobile sheet w/ focus mgmt + no-JS fallback),
route/vehicle/package/service/review cards (16:10 photos + film-grain overlay), forms
(44px, gold focus, inline validation), fare calculator, booking stepper, FAQ accordion,
fleet filters, toast, language switch, tables (scroll inside cards), map, CTA blocks.

### 10.4 UX principles
- Mobile-first; intent-first layout (fare/answer + CTA above fold).
- Call/WhatsApp always reachable; Book secondary but intact.
- Honest demo; clear demo chip; no live-payment claim.
- No intrusive popups; short forms; 44px targets; accessible color contrast.
- Every claim/highlight/data point has a real code path or is removed.

### 10.5 Responsive & accessibility
- Breakpoints 320/360/375/390/700/768–1120/1280–1440; no horizontal page scroll; grids
  3→2→1; tables scroll inside cards.
- WCAG 2.2 AA: landmarks, one H1, correct heading hierarchy H1→H6, keyboard/focus
  management, aria wiring, contrast, labels/autocomplete/inputmode, reduced-motion,
  no-JS fallbacks.

---

## 11. Engineering & architecture

### 11.1 Architecture (locked)
- **Vanilla static MPA** + **Python SSG** (`scripts/render_pages.py`), data in
  `scripts/catalog.py` / `scripts/i18n.py`. **SSG is mandatory** (SEO + AI crawlability:
  content present in the DOM snapshot, no CSR empty pages).
- Booking is a client app on `book.html` (noindex).
- No React/Next on this pass; future admin may use a separate lightweight app.

### 11.2 Build & data pipeline
```
css/tokens.css · css/site.css
js/data.js (generate from catalog.py) · js/contact.js (generated NAP)
js/fares.js · js/app.js · js/booking.js (book.html only)
scripts/catalog.py (single source: cities/routes/vehicles/packages/NAP/FAQs/reviews)
scripts/i18n.py · scripts/render_pages.py · scripts/images.py
scripts/serve.py · scripts/check_links.py · scripts/visual_audit.mjs
assets/* · en/ hi/ (generated) · book.html (generated)
design-guide/ proposal/ (untouched)
```

Build steps:
1. Edit data/i18n/templates.
2. Run `python3 scripts/render_pages.py` → generate EN/HI tree, book.html, redirects,
   `404.html`, `sitemap.xml` (`lastmod`), `robots.txt` (allow GPTBot/Googlebot/Bingbot;
   noindex book), `js/contact.js`; measure real WebP dims; generate `-480/-768/-sm`
   derivatives; inject truthful `width/height`, `srcset/sizes`, `loading/decoding`;
   rebase URLs page-relative; write schema/hreflang/canonical/OG; write fare + FAQ content.
3. Serve (`scripts/serve.py`), `check_links.py` (0 failures), `visual_audit.mjs`.

### 11.3 Conventions (must-follow)
- Never hand-edit generated files; edit data and regenerate.
- Single source for NAP/FAQ/catalogue; generate client data; no drift.
- No hardcoded `/ArenaAI`/base prefix; base-agnostic build.
- No inline style one-offs where a token/utility exists.
- **Full content visible in HTML; heading hierarchy H1→H6; one H1; descriptive alt;**
  schema everywhere appropriate; robots allows major bots.
- Images WebP, real dims, lazy below fold, hero preloaded (`fetchpriority=high`,
  ≤220KB).
- Fonts one request + self-host at launch with fallback metrics.
- Motion 180ms; reduced-motion.
- Clean DOM; no render-blocking excess; no legacy JS.

### 11.4 Performance budgets
| Metric | Budget |
|---|---|
| Hero WebP | ≤ 220KB |
| LCP | ≤ 2.5s mobile 3G |
| CLS | < 0.1 |
| INP | ≤ 200ms |
| JS | ≤ 180KB gzip; booking.js only on book.html |
| Fonts | one request (or self-hosted), display=swap |
| Images | responsive derivatives below fold |
| Lighthouse | 100/100 target (≥90 gate) |

### 11.5 QA / build gates
- `check_links.py` 0 failed URLs both bases; `visual_audit.mjs` 0 overflow/console error.
- Schema JSON-LD valid; sitemap XML valid; robots correct; canonical/hreflang/noindex
  correct.
- Fare/date/timezone unit checks; booking e2e; a11y pass.
- Lighthouse + CWV budget gate.

---

## 12. Scalability requirements

- **Content scale:** add route/vehicle/package/city/FAQ = data-only.
- **Page scale:** renderer generates N pages; no per-page hardcoding.
- **Keyword/topic scale:** new money + support pages from a data "content/SEO map"
  (keyword, intent, URL, cluster, template, schema) not ad-hoc.
- **Asset scale:** auto derivatives; builds stay fast; pure-Python WebP dims.
- **Language scale:** add locale config + fonts + data; no template changes.
- **Domain/entity scale:** base-agnostic build; future multi-location/multi-brand via
  data; consistent entity naming; sameAs.
- **Feature scale (future):** Razorpay payment seam; n8n WhatsApp/email/SMS flow;
  admin/reporting app (Evilcharts-style) fed by a simple backend/data layer; CMS as a
  future upload path — but no scope creep now.
- **Team scale:** doc pack, QA gates, CI, templates/sprints make handoff and repeatable
  SEO/AI-SEO sprints trivial.

---

## 13. Security & content governance

- No secrets, API keys, credentials, or real customer PII in repo/generated output.
- API keys (e.g., Pexels/GA) live in `.env` / secrets, not files.
- No live payment until a documented backend phase; mock only and labeled.
- All copy/pricing/reviews/schema data goes through `catalog.py`; no one-off copies.
- All claims match engine (night allowance, advance, GST, coverage) or are removed.
- External links `rel="noopener"`; no untrusted embed code; escaped data in HTML.
- Off-page tactics are strictly white-hat; no PBNs/link farms/automated spam.
- Client data (NAP/GST/Razorpay/WhatsApp/SMS) handled per approval; policies published
  before launch.

---

## 14. Analytics, tracking & reporting

- **GA4 events:** `tel_click`, `wa_click`, `begin_checkout`, `add_payment_info_demo`,
  `purchase_demo`, `enquiry_submit`, `lang_switch`, `filter_click`, `fare_quote`.
- **GA4 AI Assistants channel** via domain regex + UTM regex (§9.14); monitor AI referral
  sessions + landing pages.
- **Search Console:** verify + sitemap; monitor coverage, clicks, position, CTR, 4xx/5xx,
  mobile usability, CWV, "Request Indexing" for new money URLs.
- **Bing Webmaster:** verify + sitemap (also feeds AI/browsing).
- **Schema/rich results:** Rich Results Test after every SEO-affecting change.
- **Brand/AI mention tracking:** Surfer AI Tracker (brand + top competitors), Google
  Alerts, Brand24; monthly review.
- **Reporting cadence**
  - **Weekly (Saturday):** ranking/visibility + AI-mention + anomalies.
  - **Monthly:** GSC + GA4 summary, index/crawl errors, CWV, AI visibility (mentions,
    prompts, sources), roundups/link progress, next month priorities, client report.
  - **Quarterly:** quarterly focus, sprint results, lesson, next focus (repeatable LLM
    reporting template: context → results → actions → lessons → next).

---

## 15. Content & data requirements

### 15.1 Catalogue (current)
Cities: Agra/Delhi/Jaipur/Mathura/Gwalior/Lucknow. Vehicles: Sedan/Ertiga/Innova Crysta/
Tempo Traveller/Urbania. Routes: Agra↔Delhi, Agra→Jaipur, Delhi→Jaipur, Agra→Mathura,
Agra→Gwalior, Agra→Lucknow, Agra local, Delhi→Agra. Packages: Agra sightseeing, Golden
Triangle, Mathura–Vrindavan, 3-day Agra. NAP: `+91 98765 43210`, `919876543210`,
`bookings@skbagheltravels.in`, near Taj East Gate Road, Taj Ganj, Agra 282001.

### 15.2 Content standards
- Answer-first; short paragraphs; question H2s; tables/lists; no giant blocks.
- Personality/anti-slop layer: local voice, stories, opinions, real data, original photos;
  never generic AI filler.
- Natural, meaningful translations; fares identical EN/HI.
- Entity naming consistent; every page has clear brand product/location/category.
- Every claim backed by data/code path; source citations where claims are factual.
- Include author/operator bio (E-E-A-T), real reviews (at launch), case/highlight block.

### 15.3 Launch data (must be real)
Real phone/WhatsApp/email/address/GST in `catalog.py`; provision mailbox or real form
endpoint (Formspree/Web3Forms); real licensed photos; real reviews or remove rating chip;
GBP synced.

---

## 16. Accessibility requirements (WCAG 2.2 AA)

Structure (landmarks, one H1, H1→H6, `lang`); keyboard/focus (nav-sheet focus trap +
restore, Escape, no traps); screen reader (labels, aria-expanded/controls, dialog
semantics, no fake tablist, buttons vs links); contrast AA; touch 44px; forms
(labels, `autocomplete`, `inputmode`, `aria-invalid`, non-color errors); motion
(`prefers-reduced-motion`); media (meaningful alt, captions/transcripts, no autoplay);
no-JS (nav/contact/Call-WA fallbacks). Test keyboard + screen reader + Lighthouse ≥90.

---

## 17. Testing & QA requirements

- Unit: fare engine (one-way/round-trip/advance/night/add-on), date/timezone helper,
  schema builder JSON validity, robots/sitemap.
- Build: reproduce clean, deterministic, fresh derivatives, 0 root-relative leaks.
- Link crawl: 0 failed requests both bases; custom 404.
- Visual: Playwright 360–1440 EN+HI, 0 overflow/console; screenshots reviewed.
- Functional: booking happy + edge (TTL, back, post-payment lock, reset, query hydration),
  calculator, filters, FAQ, contact, nav, lang switch.
- SEO: titles/meta/H1/canonical/hreflang/schema/sitemap/robots/noindex, Rich Results.
- A11y: keyboard/screen reader + axe/Lighthouse.
- Performance: Lighthouse + CWV budget; page-weight audit.
- AI/LLM: robots allows bots; all critical info in static HTML; tables/FAQs present;
  schema complete; content score green; AI Tracker baseline at launch.
- Launch/off-page: `LAUNCH_CHECKLIST.md` + off-page deliverables checklist (§23).

---

## 18. CI/CD & workflow

- Local: `serve.py` → `check_links.py` → `visual_audit.mjs`.
- Repo: work on session branch only (`arena/01a06804-arenaai`), push only that branch,
  open PR to `main`.
- Pre-merge gates: link check 0 failures; no generated-file hand edits; no `/ArenaAI`
  hardcode; schema/robots/sitemap/canonical validators green.
- Deployment: static host (GitHub Pages now; custom domain at launch); HTTPS; canonical
  = production; verify `/` and `/ArenaAI`.
- Post-launch: monitor 404s, GSC index/crawl, CWV, GA4 events, AI mentions, referrals.
- **Repeatable SEO/AI-SEO sprint workflow** (2–4 week cadence): set business goal →
  audit current visibility (Surfer AI Tracker + Topical Map) → pick 3–6 high-impact
  tasks → build/optimize with Surfer structure → publish with technical best practices →
  promote/earn signals → measure → iterate. Keep a sprint board + publishing checklist +
  report template; maintain a "low-lift library" for slow weeks.

---

## 19. Release & roadmap

| Milestone | Status |
|---|---|
| Frontend plan + archives | ✅ |
| Tokens + base CSS | ✅ |
| Mock data + fare engine | ✅ |
| Shared chrome | ✅ |
| Marketing hubs | ✅ |
| Booking app | ✅ |
| Assets + performance | ✅ |
| Bilingual SEO SSG | ✅ |
| Docs pack | ✅ |
| PR + responsive/hosting fixes | ✅ |
| Audit remediation + hardening | ✅ |
| **Master PRD v3.0 (SEO/AI-SEO/engineering/client-ready)** | ✅ this doc |
| Launch gates (real data, fonts, GBPs, GSC/Bing, analytics, QA) | ⏳ next |
| Off-page/Digital PR 1-year phase | ⏳ after launch |
| Backend/payments/admin (Razorpay, n8n/SMS, Evilcharts admin) | 🧊 future |

---

## 20. Risks, dependencies, assumptions

- **Real NAP/GST/reviews/photos** not provided → launch blocker.
- **Client decision points unresolved** (§25) → cannot finalize payments/automation/fares.
- **Razorpay KYC** / WhatsApp Business / SMS credentials required only if selected.
- **Fonts self-hosting** blocked in sandbox → run on networked machine.
- **Playwright** blocked in sandbox → run on networked machine before launch.
- **Off-page risk** → stay white-hat; no PBN/link farm; quality over volume.
- **AI search volatility** → keep SEO fundamentals; monitor AI Tracker; refresh content.
- **Over-zipping** family of pages → SPAM risk; only pages with demand.
- **Two data sources drift** → single-source; generate client data.
- **GBP/NAP mismatch** → local ranking loss; keep consistent.
- **Scope of admin/CMS** → explicit future phase.

**Assumptions:** frontend-only this pass; owner supplies real data/photos before go-live;
owner approves fares; Dark Navy + Golden stays; marketing copy owner-reviewed; client will
opt in/out of n8n/SMS via §25.

---

## 21. Definition of Done (DoD)

- `check_links.py` 0 failed URLs both bases; `visual_audit.mjs` clean on network machine.
- Booking e2e (mobile/desktop) functional; fares/time rules correct; no real charge.
- Every indexable page: unique title/meta, one H1, H1→H6, canonical, hreflang, schema,
  OG, sitemap, robots/noindex as required; Rich Results green.
- All text/data in raw HTML (crawlable + AI-readable); no JS-gated content.
- Images WebP/alt/dimensions/responsive; hero ≤220KB + preload; lazy below fold.
- Lighthouse 100/100 target (≥90), LCP ≤2.5s, CLS <0.1, INP ≤200ms.
- No secrets/placeholders (reviewed at launch); no generated-file hand edits.
- Design tokens/DESIGN.md respected; no invented hex; reduced-motion; 44px.
- Accessibility pass (keyboard/screen-reader/contrast/labels).
- AI readiness: robots allows GPTBot/Googlebot/Bingbot; schema complete; tables/FAQs;
  entity/NAP consistent; AI Tracker baseline set.
- Tracker updated; docs/decision log current; PR from session branch; off-page/report
  cadence documented.

---

## 22. SEO Checklist (review gate)

**Strategy**
- [ ] Business goal first; quarterly focus defined.
- [ ] Keyword list mapped to intent → URL → page; no cannibalization.
- [ ] Topic clusters: hub → money landing → support content → UGC/PR.
- [ ] Internal-link mesh: support→money, hub↔landing, landing↔related.
- [ ] Entity consistency: brand/services/cities/monuments/vehicles/people/NAP/sameAs.
- [ ] AI Tracker baseline: brand + top 2–3 competitors set.

**On-page**
- [ ] One H1 with primary keyword; question-based H2/H3; H1→H6 no jumps.
- [ ] Unique title ≤60 + meta 140–160 with CTA.
- [ ] Short lowercase keyword URLs; self-canonical.
- [ ] Answer-first; primary keyword in first 100 words.
- [ ] Tables/lists/FAQs for AI extraction; content visible in raw HTML.
- [ ] Alt text descriptive; filenames descriptive; lazy below fold.
- [ ] 3–5 internal + 2–3 reputable external citations.
- [ ] E-E-A-T block (author/operator bio, real experience, data, honest reviews).
- [ ] Surfer Content Score green on priority pages.
- [ ] No thin/duplicate/spam content; no keyword stuffing.

**Technical**
- [ ] robots.txt allows GPTBot/Googlebot/Bingbot; noindex book/thin pages.
- [ ] Sitemap valid + `lastmod`; submitted GSC + Bing.
- [ ] HTTPS; canonical = production; 301 redirects; branded 404.
- [ ] CWV + Lighthouse 100/100 target; clean DOM; no render-blocking excess.
- [ ] Schema (LocalBusiness/Service/Offer/FAQ/Breadcrumb/Org/Person/Article) valid.
- [ ] GSC setup + verify + request indexing for new money URLs.
- [ ] GA4 + AI Assistants channel + event tracking.

**Local**
- [ ] NAP consistent site/schema/GBP/directories.
- [ ] GBP claimed/optimized; accurate geo/area/opening hours.
- [ ] Reviews real or removed.

**Off-page**
- [ ] White-hat plan; no PBN/link farm.
- [ ] Local citations/directories done.
- [ ] Roundups/guest/HARO/data PR done.
- [ ] UGC/forums/Quora/Reddit tracked.

**AI/LLM**
- [ ] Entity signals (schema + directories + consistent mentions).
- [ ] Question headings + answer-first + tables/FAQs.
- [ ] GPTBot/Googlebot/Bingbot allowed; sitemap submitted.
- [ ] AI Tracker + GA4 AI channel monitoring.
- [ ] Original, non-AI-slop content; real images/data.

---

## 23. Off-Page / link-building checklist (client "Phase 2" scope)

- [ ] Search Engine Submission (GSC + Bing).
- [ ] Local listings/citations (GBP, Justdial, Sulekha, Bing Places, Yelp, Apple Maps,
  TripAdvisor, local dirs).
- [ ] GBPs optimization (categories, photos, services, Q&A, hours, areas, posts).
- [ ] Social bookmarking (Reddit, Quora, LinkedIn, X, relevant communities).
- [ ] Country-based classifieds.
- [ ] Profile/property creation on high-authority sites.
- [ ] Article submission / guest posts.
- [ ] Web 2.0 properties (original, not spam).
- [ ] Forum posting (helpful).
- [ ] Blog commenting (substantive).
- [ ] Image sharing (GBP, Pinterest, Flickr, etc.).
- [ ] PDF submission (fare/itinerary guides w/ NAP + link).
- [ ] Video submission (YouTube shorts/reels w/ transcripts).
- [ ] Quora backlinks/mentions.
- [ ] Digital PR (HARO/Featured, media/data pitches, best-of roundups, expert quotes,
  podcast/webinar).
- [ ] Broken backlink swapping.
- [ ] Entity/database listings (Wikidata, LinkedIn, aggregators).
- [ ] Reviews/UGC program + monitoring (Alerts/Brand24/AI Tracker).

---

## 24. AI/LLM Visibility checklist (Surfer/AISO workflow)

- [ ] Audit current AI presence (AI Tracker + competitors).
- [ ] Choose 1–2 focus topics per quarter tied to business goal.
- [ ] Map topical coverage; identify gaps; prioritize 3–6 tasks.
- [ ] Build/rebuild with: question H2s, answer-first, tables/lists, FAQs, brand voice,
  original data/photos, real experience.
- [ ] Publish with technical best practices (crawlable HTML, schema, internal links,
  speed, robots).
- [ ] Promote: newsletters, LinkedIn, Reddit/Quora, roundup outreach, PR/HARO, UGC.
- [ ] Track: AI Tracker, GA4 AI Assistants, GSC, CWV.
- [ ] Report monthly/quarterly: context → results → actions → lessons → next.
- [ ] Iterate: replicate what worked; diagnose misses (competitive, shallow, no external).
- [ ] Keep cadence sustainable (no publishing spikes; 1/day max if scaling).

---

## 25. Client deliverables & decision points (must be resolved before launch)

### 25.1 Client materials required (client supplies)
- **Razorpay account credentials + completed KYC** (for real payments phase).
- **WhatsApp Business account details** (if automated messaging/n8n selected).
- **SMS gateway credentials** (if SMS alerts required).
- **Formalized terms** for bookings, cancellations, and customer refunds.
- Real NAP/GST/contact, real photos, real reviews.

### 25.2 Client decision points (client approves)
- **Required advance payment percentage/amount.**
- **Enable/disable WhatsApp automation** (n8n).
- **Enable/disable SMS notifications.**
- **Preferred booking confirmation process** (call confirmation vs automated
  WhatsApp/email).
- **Finalized fare calculation logic/rules.**
- Realm pricing/vehicle/route/package data validation.

### 25.3 Client-facing SEO deliverable (slide 20 equivalent)
- Complete 1-Year Basic & Local SEO coverage.
- Technical SEO audits & enhancements.
- Comprehensive on-page SEO.
- Optimized meta titles & descriptions.
- Logical heading hierarchy (H1–H6).
- Clean & user-friendly URL structures.
- Creation & submission of sitemap + robots.txt.
- Asset & image optimization.
- Internal linking strategy.
- Google Search Console setup & verification.
- Google Business Profile optimization.
- Keyword targeting & rank monitoring.
- *(Plus AI-SEO layer, §9.11.)*

### 25.4 Client integrations / notes (slide 13 equivalent)
- **n8n workflow:** automated WhatsApp + email alerts can be configured; optional SMS
  integration on request.
- **Provider charges:** any third-party WhatsApp/SMS service charges are to be covered
  directly by the client.
- Confirm the site labels these as optional/configured, not guaranteed, until enabled.

---

## 26. Template / landing page content checklist (route example)

- [ ] H1 = "Agra to Delhi Taxi" / Hindi equivalent.
- [ ] Answer-first intro: km, duration, from ₹X, "advance shown before you pay", CTA.
- [ ] Vehicle + fare table.
- [ ] What's included / not included.
- [ ] Night allowance / payment note.
- [ ] Route highlights / itinerary (for sightseeing/pilgrim).
- [ ] Comparison table if useful (taxi vs train, price/vehicle tiers).
- [ ] Why book with SK Baghel (E-E-A-T block + case story).
- [ ] Real reviews / aggregateRating (at launch).
- [ ] FAQ accordion (FAQPage schema), answer-first.
- [ ] Internal links: related routes, packages, fleet, services, contact, support article.
- [ ] Schema: Service/Offer + Breadcrumb + LocalBusiness contactPoint.
- [ ] hreflang pair; canonical; OG; sitemap entry; keyword placement first 100 words.
- [ ] Content visible in raw HTML; no JS gating.

---

## 27. Change management

- Target-scope changes go here + `04_PROGRESS_TRACKER.md` Decision Log **before** build.
- Architecture changes go to `02_PROJECT_CONTEXT.md` + decision log, never silently.
- Content/business-rule/client decisions go through `scripts/catalog.py` + tracker.
- New page types add their checklist here; new SEO/off-page/AI tactics add to §22–24.
- Every release updates tracker; every quarterly SEO sprint documented.

---

*End of PRD v3.0 — Master / Final.*
