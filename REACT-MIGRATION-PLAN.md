# SK Baghel Tour & Travels — Master React Migration Blueprint

**Status:** Approved Architecture Plan  
**Target Platform:** Single Unified Responsive Web & Mobile App (Desktop, Tablet, Mobile Web, and PWA / Hybrid Shell)  
**Stack:** React 19 + TypeScript (Strict) + Vite + Vanilla CSS Tokens  
**Runtime Base:** Custom Domain Root (`https://skbagheltravels.in`) and Pages Subpath (`/ArenaAI`)  
**SEO & Language:** Bilingual English (`/en/` & `/`) and Hindi (`/hi/`) with full Schema.org JSON-LD  
**Authentication & Payments:** Zero Auth (Public Browsing); Mock Frontend Payment (~900ms simulation with ticket `AGR-XXXXXX`)  

---

## 1. Migration Vision & Cross-Device Strategy

The customer-facing frontend is being migrated from the legacy multi-page static site (Python SSG + HTML/CSS/JS) into a single, cohesive React + TypeScript application.

### Unified Web & App Architecture ("Run on App and Web Both on All Devices")
Rather than maintaining separate codebases for mobile apps and desktop websites:
1. **Single Responsive Codebase:** Adapts dynamically across all viewport sizes (320px mobile to 1440px+ 4K desktop).
2. **PWA (Progressive Web App):** Installable on Android, iOS, and desktop with `manifest.json`, service worker offline caching, and native-like app shell ergonomics.
3. **Thumb-Zone Mobile UI:** Touch targets >= 44px, sticky bottom lead-bar (Call, WhatsApp, Instant Book), and full iOS/Android notch support (`env(safe-area-inset-*)`).
4. **Hybrid Mobile Shell Readiness:** Decoupled architecture with page-relative/clean routing compatible with Capacitor or Cordova wrappers for native App Store / Google Play packaging.

---

## 2. Complete Inventory: Models, Services, Routes & Fares

### 2.1 Fleet Categories & Sub-Tiers (`react/src/data.ts`)
| Vehicle Tier | Class / Capacity | Per-KM Rate | Range | Sub-Models & Variants | Suitable For |
|---|---|---|---|---|---|
| **Sedan** | Dzire class · 4+1 seats · 2 bags | ₹10/km | ₹10–₹12/km | Maruti Dzire, Toyota Etios, Hyundai Aura, Wagon R / Tiago Hatchback (₹10/km) | Couples, airport drops, 1–4 passengers |
| **Ertiga** | 6+1 MPV · 6 seats · 3 bags | ₹14/km | ₹14–₹16/km | Maruti Ertiga, Toyota Rumion, Renault Triber | Families, small groups, 5–6 passengers |
| **Innova Crysta** | 6+1 SUV · 6 seats · 4 bags | ₹18/km | ₹18–₹23/km | Toyota Innova Crysta, Innova Hycross, Fortuner VIP (₹35/km) | Outstation tours, elders, premium comfort |
| **Tempo Traveller** | 12–17 seater · 12 seats · 8 bags | ₹25/km | ₹22–₹34/km | 9-Seater Maharaja, 12-Seater Standard, 16-Seater Executive, 20-Seater Deluxe, 26-Seater Tourer | Pilgrimage groups, family weddings, 7–12 passengers |
| **Urbania** | Luxury van · 16 seats · 10 bags | ₹34/km | ₹34–₹38/km | Force Urbania 9-Seater VIP, 12-Seater Luxury Cabin, 17-Seater Royal Van | Corporate delegations, luxury wedding parties |

### 2.2 Six Operational Service Verticals
1. **One-Way Intercity Cab:** Point-to-point drop on verified highway corridors.
2. **Outstation Round-Trip:** Multi-day or same-day return with standard 300 km/day minimum billing or 1.85× base multiplier.
3. **Local Sightseeing Tours:** Dedicated 8 Hours / 80 KM and 12 Hours / 120 KM fixed packages.
4. **Airport & Station Transfers:** Fixed flat-rate pickup and drop matrix.
5. **Tempo & Urbania Group Charters:** Large-group travel with pushback seats, individual AC vents, and luggage bays.
6. **Curated Tour Packages:** Same-day and multi-day heritage circuits with detailed hourly itineraries.

### 2.3 Verified Route Fares Matrix (One-Way)
| Route ID | Route Pair | Distance | Duration | Sedan | Ertiga | Innova | Tempo | Urbania |
|---|---|---|---|---|---|---|---|---|
| `agra-delhi` | Agra ⇄ Delhi | 230 km | 3h 30m | ₹3,499 | ₹4,499 | ₹6,499 | ₹9,500 | ₹14,000 |
| `agra-jaipur` | Agra ⇄ Jaipur | 240 km | 4h 30m | ₹3,499 | ₹4,999 | ₹6,999 | ₹11,000 | ₹16,000 |
| `agra-mathura` | Agra ⇄ Mathura | 55 km | 1h 15m | ₹2,200 | ₹2,800 | ₹3,800 | ₹5,500 | ₹8,000 |
| `agra-gwalior` | Agra ⇄ Gwalior | 120 km | 2h 30m | ₹3,000 | ₹3,800 | ₹5,500 | ₹7,500 | ₹11,000 |
| `delhi-jaipur` | Delhi ⇄ Jaipur | 270 km | 5h 00m | ₹5,000 | ₹6,200 | ₹8,800 | ₹12,000 | ₹17,500 |
| `delhi-agra` | Delhi ⇄ Agra | 230 km | 3h 30m | ₹3,499 | ₹4,499 | ₹6,499 | ₹9,500 | ₹14,000 |
| `agra-lucknow` | Agra ⇄ Lucknow | 335 km | 6h 00m | ₹7,000 | ₹8,500 | ₹12,000 | ₹16,000 | ₹22,000 |
| `agra-local` | Agra Sightseeing | 80 km | 8h 00m | ₹1,900 | ₹2,600 | ₹2,850 | ₹5,500 | ₹7,500 |

### 2.4 Airport & Railway Station Flat Transfers Matrix
- **Agra Cantt / Fort Railway Station:** Sedan ₹800 · Ertiga ₹900 · Innova ₹1,100 · Tempo ₹2,200 · Urbania ₹3,500
- **Agra Kheria Airport (AGR):** Sedan ₹900 · Ertiga ₹1,000 · Innova ₹1,250 · Tempo ₹2,500 · Urbania ₹3,800
- **Delhi IGI Airport (DEL) ⇄ Agra Express:** Sedan ₹3,499 · Ertiga ₹4,499 · Innova ₹6,499 · Tempo ₹9,500 · Urbania ₹14,000

### 2.5 Local Packages Matrix
- **8hr / 80km (Agra Sightseeing):** Sedan ₹1,900 · Ertiga ₹2,600 · Innova ₹2,850 · Tempo ₹5,500 · Urbania ₹7,500
- **12hr / 120km (Agra Extended):** Sedan ₹2,200 · Ertiga ₹2,950 · Innova ₹3,100 · Tempo ₹6,500 · Urbania ₹8,500
- **Point-to-Point (Airport/Station):** Sedan ₹800 · Ertiga ₹900 · Innova ₹1,100 · Tempo ₹2,200 · Urbania ₹3,500

### 2.6 Tour Packages Catalogue (6 Signature Packages)
1. **Same Day Agra Taj Mahal Tour (`agra-sightseeing`):** From ₹3,499 · 1 Day · Taj Mahal, Agra Fort, Baby Taj, Mehtab Bagh.
2. **Taj Mahal Sunrise Tour (`taj-mahal-sunrise-tour`):** From ₹12,999 · 1 Day · 2:30 AM Delhi departure, sunrise guided entry, breakfast.
3. **Mathura & Vrindavan Darshan (`mathura-vrindavan`):** From ₹4,200 · 1 Day · Krishna Janmabhoomi, Dwarkadhish, Prem Mandir, Banke Bihari.
4. **Same Day Agra by Gatimaan Express (`gatimaan-express-agra-tour`):** From ₹14,999 · 1 Day · 100-min high-speed train tickets, private AC car in Agra, lunch buffet.
5. **Agra Overnight Experience (`agra-unhurried`):** From ₹7,800 · 2 Days / 1 Night · Taj sunrise, Mehtab Bagh sunset, Fatehpur Sikri excursion.
6. **Golden Triangle Tour (`golden-triangle`):** From ₹18,500 · 3 Days / 2 Nights · Delhi, Agra, Fatehpur Sikri, Jaipur.

### 2.7 Business Rules & Constants
- **Night Allowance:** ₹300 for cabs (Sedan, Ertiga, Innova), ₹500 for Tempo & Urbania. Triggered for pickups between 20:00 (8:00 PM) and 06:00 (6:00 AM).
- **Advance Booking Deposit:** Calculated as `Math.min(total, Math.max(500, Math.round((total * 0.28) / 100) * 100))` (approx. 28% rounded to nearest ₹100, min ₹500).
- **Promotional Coupon:** `ASTTCAR500OFF` (Flat ₹500 off for orders >= ₹2,000).
- **Cab Cancellation Policy:** 100% refund for cancellations made >= 24 hours before pickup (processed in 5–7 business days).
- **Tour Package Cancellation Schedule:** 61+ days: 0% fee; 46–60 days: 15% fee; 31–45 days: 25% fee; 16–30 days: 50% fee; 6–15 days: 75% fee; 0–5 days: 100% fee.
- **NAP Data:**
  - Phone: `+91 98765 43210`
  - WhatsApp: `919876543210`
  - Email: `bookings@skbagheltravels.in`
  - Address: Near Taj East Gate Road, Taj Ganj, Agra 282001
  - Geo coordinates: `27.1632, 78.0322`

---

## 3. Design System, Typography & Styling Tokens

### 3.1 Typography
- **Headings & Accents:** `Outfit`, sans-serif (primary modern geometric) or `Playfair Display`, serif (heritage editorial).
- **Body & Controls:** `Inter`, -apple-system, sans-serif (crisp legibility, 400/500/600/700 weights, tabular figures for pricing).

### 3.2 Design Tokens (`css/tokens.css`)
```css
:root {
  /* Canvas & Backgrounds (Light Mode) */
  --white: #FFFFFF;
  --bg: #FFFFFF;
  --bg-alt: #F8F9FA;
  --surface: #FFFFFF;
  --surface-alt: #F1F3F5;
  --border: rgba(18, 20, 22, 0.08);

  /* Typography Colors */
  --text: #1A1D20;
  --text-muted: #5C6470;
  --text-inverse: #FFFFFF;

  /* Brand Accents */
  --navy: #1E2B37;
  --gold: #D98A28;
  --gold-glow: rgba(217, 138, 40, 0.25);
  --gold-hover: #C2781E;

  /* Radii & Shadows */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
}

/* Solar Dusk (Dark Mode) */
[data-theme="dark"] {
  --bg: #181615;
  --bg-alt: #201E1D;
  --surface: #242220;
  --surface-alt: #2C2927;
  --border: #3D3936;
  --text: #FDFCFB;
  --text-muted: #B5AFA9;
  --gold: #F76002;
  --gold-glow: rgba(247, 96, 2, 0.35);
  --gold-hover: #E05500;
}
```

---

## 4. Full Catalog of 16 Production Animations & Behaviors

All animations must satisfy [`ANIMATION_RULES.md`](file:///home/bot/Internship/ArenaAI/ANIMATION_RULES.md) (zero cumulative layout shift, GPU composited, and strict `prefers-reduced-motion` cancellation):

1. **Brand Wordmark Scrambler (`initBrandScramble`):** Character scramble resolving to "SK BAGHEL" on cursor hover with gold pulse.
2. **Rolling Nav Links (`.roll-link`):** Dual-layer text curtain where top text slides up and bottom golden layer slides in.
3. **Button Shimmer Wave (`@keyframes btn-shimmer`):** Tactile active scale (`scale(0.97)`), radiant gradient shimmer pass on hover.
4. **Form Floating Labels & Glow Ring:** 3px warm gold focus-within ring, floating label displacement, input error shake.
5. **Universal Interactive Canvas Background Grid:** Hairline 44px grid, dynamic cursor spotlight, interactive glowing cell physics trail.
6. **Asymmetric Living Bento Grid Hero:** 3-cell bento mosaic with independent 8.0s crossfade cycles and Ken Burns micro-motion.
7. **Hero Destinations Crossfade Slideshow:** Seamless crossfades across 11 world-famous destinations with location badge.
8. **3D Coverflow Sightseeing Carousel:** 3D perspective carousel with scale and card rotation, synchronized package info, and WhatsApp button.
9. **2-Row Liquid Glass Marquee Reviews:** Dual-track opposing marquees with pause-on-hover, glassmorphism cards, and Lucide stars.
10. **Trust Roller Marquee:** Infinite 42s marquee with 8 E-E-A-T trust signals (Govt fleet, GST invoice, Chauffeur ID).
11. **Radial Floating Quick Actions Dock:** Mobile/desktop speed-dial dock (Phone, WhatsApp, Tours, Instant Book).
12. **Page-Load Shining Text Curtain:** Non-blocking luxury brand loader with 600ms minimum display, dismissing on real window load.
13. **Currency Estimator Live Price Flip:** Dynamic live price conversions between INR (₹), USD ($), EUR (€), and GBP (£).
14. **Semantic FAQ Accordion Spring:** CSS grid max-height expansion with micro-spring and rotating chevron.
15. **Benefit Card Fill-on-Hover:** Solid gold background fill with crisp white icon stroke on hover.
16. **Full Reduced Motion Accessibility:** All animations disabled under `prefers-reduced-motion: reduce`.

---

## 5. Complete Inventory of Pages & Component Templates (113 URLs)

### 5.1 Marketing Hub Templates (10 Bilingual Hubs = 20 URLs)
1. **Home Hub (`/` & `/hi/`):** Hero bento grid, fare calculator widget, trust roller marquee, popular routes grid, 6 services grid, 3D coverflow packages, fleet showcase, 6 benefits grid, liquid glass reviews marquee, contact card.
2. **Services Hub (`/:lang/services/`):** All 6 service verticals with pricing tiers, inclusions, vehicle compatibility, and booking CTAs.
3. **Routes Hub (`/:lang/routes/`):** Filterable outstation route directory, distance matrix, dynamic route calculator.
4. **Packages Hub (`/:lang/packages/`):** Tour package grid, multi-day/same-day filters, currency switcher, full itinerary previews.
5. **Fleet Hub (`/:lang/fleet/`):** Sedan, Ertiga, Innova, Tempo, Urbania specs, luggage/passenger icons, per-km rates, airport transfer matrix.
6. **About Hub (`/:lang/about/`):** Company background, founder story, driver verification process, fleet maintenance protocols.
7. **Contact Hub (`/:lang/contact/`):** Architectural contact card, interactive inquiry form, click-to-call, WhatsApp trigger, interactive map.
8. **FAQ Hub (`/:lang/faq/`):** Comprehensive FAQ categories (Booking, Fares, Outstation rules, Night allowances, Luggage).
9. **Privacy Policy (`/:lang/privacy/`):** GDPR/DPDP compliant customer data privacy guidelines.
10. **Terms & Conditions (`/:lang/terms/`):** Verified 24-hr cancellation policy, 6-tier tour refund schedule, jurisdiction terms.

### 5.2 Dynamic Detail Templates (19 Types × 2 Languages = 38 URLs)
- **Route Landing Template (8 routes × 2 languages = 16 pages):**
  Hero, dynamic fare table across 5 car tiers, highway guidance (Yamuna Expressway, NH tips), transit times, rest stop recommendations, night allowance rule notes, route-specific FAQs, schema.
- **Package Landing Template (6 packages × 2 languages = 12 pages):**
  Hero, hourly timeline itineraries, vehicle upgrade pricing matrix, inclusions/exclusions pills, international currency switcher, departure advice, package schema.
- **Vehicle Landing Template (5 vehicles × 2 languages = 10 pages):**
  Hero, technical specifications (seats, luggage, AC, engine), model lineup, per-km pricing, transfers table, suitable travel scenarios.

### 5.3 Interactive Customer Flow Pages (2 Core Applications)
- **5-Step Booking Wizard (`/book`):**
  - Step 1: Route Selection (City combobox, LocationIQ autocomplete, local tour radio, airport transfer radio)
  - Step 2: Vehicle Selection (Tier cards with seats/bags badges, per-km rate, and calculated base total)
  - Step 3: Traveler & Trip Details (Date, time picker with night allowance indicator, pickup/drop addresses, notes)
  - Step 4: Fare Review & Promo (Fare breakdown, night allowance pill, coupon code `ASTTCAR500OFF`, 28% advance deposit calculation)
  - Step 5: Instant Ticket Confirmation (Simulated payment ~900ms, generated `AGR-XXXXXX` ticket, print/WhatsApp voucher actions)
- **404 Recovery Hub (`/404`):**
  Compass visual, search suggestions, top routes links, and emergency click-to-call.

---

## 6. Phase Roadmap: Execution Status & Remaining Steps

```
[x] Phase R0 — Approval and baseline
[x] Phase R1 — React foundation and build (R1.1 to R1.7 verified)
[ ] Phase R2 — Data, fares, and shared utilities (R2.1 complete, R2.2 next)
[ ] Phase R3 — Design system and responsive primitives
[ ] Phase R4 — Shared chrome and navigation
[ ] Phase R5 — Marketing pages and SEO pre-rendering
[ ] Phase R6 — LocationIQ and interactive discovery
[ ] Phase R7 — Fare calculator and 5-step booking app
[ ] Phase R8 — Responsive QA and accessibility (320px to 1440px)
[ ] Phase R9 — Regression, cutover, and Cloudflare deployment
```

### Detailed Breakdown of Every Step:

#### Phase R1 — Foundation and Build ✅ (Complete)
- [x] **R1.1:** React + TypeScript + Vite project foundation in `react/`.
- [x] **R1.2:** Static output configuration in `dist/react` with root and subpath base support.
- [x] **R1.3:** Strict TypeScript paths (`@/*`) and Vite alias resolution.
- [x] **R1.4:** React error boundary with reload action and call fallback.
- [x] **R1.5:** Authoritative token integration from `css/tokens.css` into React global styles.
- [x] **R1.6:** Typed production config (`react/src/config.ts`) with runtime LocationIQ token handling.
- [x] **R1.7:** Migration feature gate (`VITE_REACT_MIGRATION_ENABLED`) and `.env.example`.

#### Phase R2 — Data, Fares, and Shared Utilities 🟡 (In Progress)
- [x] **R2.1:** Convert catalogue into typed cities, routes, vehicles, packages, reviews, NAP (`react/src/data.ts`).
- [ ] **R2.2 (Current Step):** Port [`js/fares.js`](file:///home/bot/Internship/ArenaAI/js/fares.js) into pure typed fare engine (`react/src/fares.ts`).
- [ ] **R2.3:** Add unit verification suite for 1-way, round-trip, local packages, night fees, and promo calculations.
- [ ] **R2.4:** Typed URL query-param parser and safe builder for deep-linking (`/book?route=...`).
- [ ] **R2.5:** Typed bilingual copy dictionaries (English & Hindi) for UI components.
- [ ] **R2.6:** Typed `sessionStorage` manager for booking draft persistence (`skb-booking`).

#### Phase R3 — Design System and Responsive Primitives ⏳
- [ ] **R3.1:** Container, Stack, Grid, and Section layout primitives with mobile-first breakpoints.
- [ ] **R3.2:** Button and Link primitives with shimmer wave, active press, and icon slots.
- [ ] **R3.3:** Form primitives (Input, Select, Combobox, Textarea) with floating labels and 44px touch targets.
- [ ] **R3.4:** Card, Badge, and Chip components with light/dark adaptive tokens.
- [ ] **R3.5:** Theme Switcher component with tactile 3D puck and anti-FOUC persistence.
- [ ] **R3.6:** Interactive Canvas Background Grid component with spotlight and decaying trail.

#### Phase R4 — Shared Chrome and Navigation ⏳
- [ ] **R4.1:** Responsive Header with brand wordmark scrambler and navigation links.
- [ ] **R4.2:** Touch-accessible mobile navigation sheet drawer.
- [ ] **R4.3:** Rolling nav link dual-layer text effect.
- [ ] **R4.4:** Sticky mobile bottom lead-bar (Call, WhatsApp, Instant Book).
- [ ] **R4.5:** Footer with NAP details, route links, vehicle links, and copyright.
- [ ] **R4.6:** Radial Quick Actions floating speed-dial dock.

#### Phase R5 — Marketing Pages and Pre-Rendering ⏳
- [ ] **R5.1:** Home page sections: Hero Bento Grid, Fare Calculator, Popular Routes, 6 Benefits, 3D Coverflow Carousel, Review Marquee.
- [ ] **R5.2:** Hub pages: Services, Routes, Packages, Fleet, About, Contact, FAQ, Privacy, Terms.
- [ ] **R5.3:** Dynamic Route Landing page template.
- [ ] **R5.4:** Dynamic Tour Package Landing page template with currency switcher.
- [ ] **R5.5:** Dynamic Vehicle Landing page template with transfers matrix.
- [ ] **R5.6:** SEO metadata generator (Title, Meta description, Canonical, Hreflang, Schema.org JSON-LD).
- [ ] **R5.7:** SSG static HTML pre-rendering build script for all 113 pages.

#### Phase R6 — LocationIQ and Interactive Discovery ⏳
- [ ] **R6.1:** `useLocationIQ` React hook with debounced fetch and abort controller.
- [ ] **R6.2:** Combobox UI with autocomplete suggestions and keyboard navigation (Arrow keys, Enter, Esc).
- [ ] **R6.3:** Fallback distance calculation engine when offline or token is absent.
- [ ] **R6.4:** Dynamic fare estimation based on custom location distance.

#### Phase R7 — Fare Calculator & 5-Step Booking Flow ⏳
- [ ] **R7.1:** Hero & Routes interactive Fare Calculator widget.
- [ ] **R7.2:** Step 1 (Route & Service Selection) component with query param hydration.
- [ ] **R7.3:** Step 2 (Vehicle Tier Selection) component with capacity indicators.
- [ ] **R7.4:** Step 3 (Traveler & Trip Details) component with night time detection.
- [ ] **R7.5:** Step 4 (Fare Review & Promo) with coupon `ASTTCAR500OFF` and 28% advance.
- [ ] **R7.6:** Step 5 (Confirmation & Ticket) with simulated payment and `AGR-` ticket generation.

#### Phase R8 — Responsive QA, Accessibility & Mobile App Shell ⏳
- [ ] **R8.1:** Viewport testing across 320px, 360px, 390px, 768px, 1024px, 1440px (Zero horizontal overflow).
- [ ] **R8.2:** Touch ergonomics audit (44px touch targets, thumb-zone accessibility).
- [ ] **R8.3:** PWA Web App Manifest (`manifest.json`) and service worker offline caching.
- [ ] **R8.4:** Keyboard navigation, ARIA combobox attributes, and screen-reader accessibility.
- [ ] **R8.5:** Reduced-motion compliance testing.

#### Phase R9 — Regression, Cutover & Cloudflare Deployment ⏳
- [ ] **R9.1:** Static build and link crawler audit (0 broken links across 113 URLs).
- [ ] **R9.2:** Quality auditor scorecard (`quality_audit.py`) achieving 10/10 A+ score.
- [ ] **R9.3:** Cloudflare Pages upload budget verification (< 25 MiB ceiling).
- [ ] **R9.4:** Production cutover and domain switchover.

---

## 7. Operating Rules for Any Implementing Agent

1. **Implement exactly one step at a time** from the roadmap above. Never batch multiple steps.
2. **Never invent values:** Strictly adhere to the tokens in `DESIGN.md` and `css/tokens.css`.
3. **Preserve SEO integrity:** Single H1 per page, strict heading hierarchy (H1 -> H2 -> H3), valid Schema.org JSON-LD graphs.
4. **Update `04_PROGRESS_TRACKER.md`** immediately after each step is verified.
5. **No partial code:** Every file must be complete and compile cleanly with `npm run react:build` and `tsc --noEmit`.
