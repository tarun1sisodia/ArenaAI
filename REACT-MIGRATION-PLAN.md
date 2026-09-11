# SK Baghel Tour & Travels — Master React Migration Blueprint

**Status:** Approved Architecture & Phase Roadmap  
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
  - Address: Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001
  - Hours: Bookings open 24×7
  - Maps: `https://maps.google.com/?q=Taj+Ganj+Agra`
  - GST: `09ABCDE1234F1Z5`
  - Geo coordinates: `27.1632, 78.0322`

### 2.8 Authentic Agra Monuments Heritage Directory
Extracted from real Agra tourism records for package itineraries and local sightseeing pages:
1. **Taj Mahal:** Dharmapuri, Forest Colony · 6:00 AM – 6:30 PM (closed Fridays) · Built 1631–1648 by Shah Jahan.
2. **Agra Red Fort:** Rakabganj · 6:00 AM – 6:00 PM · Built 1565 by Emperor Akbar.
3. **Fatehpur Sikri:** Buland Darwaza & Salim Chishti Dargah · 6:00 AM – 6:00 PM · Built 1571 by Emperor Akbar.
4. **Itmad-Ud-Daulah (Baby Taj):** Moti Bagh · 8:00 AM – 12:00 AM · Built 1622–1628 by Noor Jahan.
5. **Mehtab Bagh:** Nagla Devjit · 6:00 AM – 9:00 PM · Built 1500s / 1631 by Babur & Shah Jahan.
6. **Sikandra (Akbar's Tomb):** Sikandra · 8:00 AM – 6:00 PM · Built 1605–1613 by Akbar & Jahangir.

### 2.9 Pet-Friendly Cabs Specialization
- Sanitized vehicles equipped with pet carrier space, seat protection, and scheduled relief stops.
- Valid for local sightseeing and outstation trips with promo code `ASTTCAR500OFF`.

### 2.10 Outstation Cultural & Hill Station Destinations
- **Gwalior Heritage Circuit (120 km):** Gwalior Fort, Jai Vilas Palace, Gujari Mahal, Teli Ka Mandir, Scindia Museum.
- **Nainital Kumaon Lake District (340 km):** Naini Lake, Naina Devi Temple, Snow View Point, Bhimtal, Sattal.

### 2.11 Verified Social Proof & Customer Reviews
- **Rating:** 4.9/5 stars based on 3,800+ Google Reviews.
- **Verified Reviewers:** Vijay Kumar (Agra), Aarav Verma (Agra), Laksh Sharma (Agra), Yash Sharma (Delhi), Nikhil Kumar (Ghaziabad), Priya S. (Delhi), James W. (London).

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

## 6. Granular Step-by-Step Phase Breakdown

Every single unit of work is broken down into a discrete, verifiable step. Implementing agents MUST execute exactly one step at a time and update `04_PROGRESS_TRACKER.md`.

```
[x] Phase R0 — Scope, Architecture & Baseline Freeze
[x] Phase R1 — Foundation & Static Build Infrastructure (R1.1 to R1.7 verified)
- [ ] **Phase R2 — Data, Pure Fare Engine & Core Utilities** (R2.1 & R2.2 complete, R2.3 next)
[ ] Phase R3 — Design System & Responsive Primitives (R3.1 to R3.10)
[x] Phase R4 — Shared Chrome & Navigation Components (R4.1 to R4.9 complete)
[ ] Phase R5 — Marketing Pages, Detail Templates & Pre-Rendering (R5.1 to R5.27)
[ ] Phase R6 — LocationIQ & Interactive Discovery (R6.1 to R6.5)
[ ] Phase R7 — Fare Calculator & 5-Step Booking Flow (R7.1 to R7.8)
[ ] Phase R8 — Responsive QA, Accessibility & Mobile App Shell (R8.1 to R8.7)
[ ] Phase R9 — Quality, Cutover & Cloudflare Deployment (R9.1 to R9.6)
```

---

### Phase R0: Scope, Architecture & Baseline Freeze ✅
- [x] **R0.1:** Product Architecture Decision: Migrate to single responsive React 19 + TypeScript codebase for both web and mobile app (PWA/Capacitor ready) beside the legacy static site.
- [x] **R0.2:** URL & Domain Contract: Canonical domain `https://skbagheltravels.in`, dual root & subpath `/ArenaAI` support, legacy `.html` redirect stubs to clean `/en/` and `/hi/` routes.
- [x] **R0.3:** Scope & Non-Goals Freeze: Zero Auth (Public Browsing); Mock Payment Simulation only (~900ms); no live Razorpay, no backend database, no live driver tracking.
- [x] **R0.4:** Full Baseline Inventory: Documented all 113 URLs, 5 vehicle tiers, 8 routes, 6 packages, 6 services, 16 animation patterns, and NAP contact data.

---

### Phase R1: Foundation & Static Build Infrastructure ✅
- [x] **R1.1:** Project Foundation: Isolated React 19 + TypeScript + Vite project under `react/` with `package.json` build scripts (`npm run react:dev`, `npm run react:build`, `npm run react:preview`).
- [x] **R1.2:** Static Output & Base Routing: Output configured to `dist/react/`, runtime base-path handling for custom domain root and GitHub Pages `/ArenaAI/` subpath.
- [x] **R1.3:** Strict TypeScript & Path Aliases: `react/tsconfig.json` with `strict: true` and `@/*` path mapping matching `react/vite.config.ts`.
- [x] **R1.4:** Application Shell Error Boundary: `AppErrorBoundary.tsx` with error recovery, direct click-to-call fallback, and dev-mode diagnostics.
- [x] **R1.5:** Authoritative Token Integration: Global CSS reset, font declarations (`Outfit`, `Inter`), focus-visible indicators, and integration of `css/tokens.css`.
- [x] **R1.6:** Typed Configuration Module: `config.ts` with typed NAP, domain, supported languages (`en`, `hi`), and runtime LocationIQ token resolution from browser storage / env.
- [x] **R1.7:** Migration Build Gate: Environment flag `VITE_REACT_MIGRATION_ENABLED` and `.env.example` ensuring legacy static site remains uninterrupted until cutover.

---

### Phase R2: Data, Pure Fare Engine & Core Utilities 🟡 (In Progress)
- [x] **R2.1:** Catalogue Domain Models (`react/src/data.ts`): Typed definitions and data for `City`, `Vehicle`, `Route`, `TourPackage`, `AirportTransfer`, `Service`, `Review`, `PromoCode`, `NAP`, and `TrustSignal`.
- [x] **R2.2:** Pure Typed Fare Engine (`react/src/fares.ts`): Port `js/fares.js` into strict TypeScript (`localTomorrow`, `cityLookup`, `findRoute`, `formatInr`, `advanceOf`, `localPackages`, `getNightAllowance`, `isNightTime`, `applyPromo`, `calcFare`).
- [ ] **R2.3 (Current Step):** Comprehensive Fare Engine Test Suite: Unit tests verifying one-way routes, round-trip 300km/day & 1.85x rule, local 8h/80km & 12h/120km packages, night fees (₹300/₹500), coupon `ASTTCAR500OFF`, and advance deposit calculations.
- [ ] **R2.4:** Typed URL Query-Param Engine (`react/src/utils/url.ts`): Safe parsers and builders for deep-linking (`?from=...&to=...&vehicle=...&package=...&time=...&coupon=...`).
- [ ] **R2.5:** Bilingual Copy Dictionaries (`react/src/i18n/`): Complete English & Hindi dictionary mappings for chrome, navigation, vehicle tags, fare labels, and error messages.
- [ ] **R2.6:** Typed Session Storage Engine (`react/src/utils/storage.ts`): Type-safe serialization, deserialization, and schema migration for `skb-booking` draft persistence.
- [ ] **R2.7:** Schema.org JSON-LD Generators (`react/src/utils/schema.ts`): Typed generators for `TaxiService`, `LocalBusiness`, `BreadcrumbList`, `FAQPage`, and `AggregateRating`.

---

### Phase R3: Design System & Responsive Primitives ⏳
- [ ] **R3.1:** Layout Primitives (`react/src/components/primitives/Layout.tsx`): Responsive `Container`, `Stack`, `Grid`, and `Section` components with design token breakpoints (320, 360, 390, 768, 1024, 1280, 1440px).
- [ ] **R3.2:** Typography Primitives (`react/src/components/primitives/Typography.tsx`): Semantic `Heading` (h1-h4), `Text`, `Lead`, and `Kicker` with Outfit/Inter font stacks and strict hierarchy guards.
- [ ] **R3.3:** Button & Action Primitives (`react/src/components/primitives/Button.tsx`): Primary, Secondary, Outline, Gold, and Ghost variants with `@keyframes btn-shimmer`, `scale(0.97)` active tactile press, and loading spinner slot.
- [ ] **R3.4:** Form Input & Floating Label Primitives (`react/src/components/primitives/Input.tsx`): Accessible text, email, tel, date, and time inputs with floating labels, gold focus ring, and error shake animation.
- [ ] **R3.5:** Form Select & Combobox Primitives (`react/src/components/primitives/Combobox.tsx`): Searchable combobox dropdown with keyboard navigation (Up/Down/Enter/Escape), ARIA 1.2 compliance, and clear button.
- [ ] **R3.6:** Card & Badge Primitives (`react/src/components/primitives/Card.tsx`, `Badge.tsx`): Responsive cards with subtle hover elevation, frosted glass variants (`.liquid-glass-card`), and pill badges.
- [ ] **R3.7:** Modal & Mobile Sheet Drawer Primitives (`react/src/components/primitives/Sheet.tsx`): Accessible bottom-sheet drawer for mobile with backdrop blur, focus trap, swipe/touch dismiss, and Escape listener.
- [ ] **R3.8:** Toast Notification Primitive (`react/src/components/primitives/Toast.tsx`): Accessible live-region toast manager with success, error, and info toasts.
- [ ] **R3.9:** Cinematic Theme Switcher Component (`react/src/components/primitives/ThemeToggle.tsx`): 3D tactile puck, ripple particle effect, anti-FOUC inline script, and persistent `localStorage` theme state (Clean White vs. Solar Dusk).
- [ ] **R3.10:** Universal Interactive Canvas Background Grid (`react/src/components/primitives/InteractiveGrid.tsx`): 44px hairline grid, cursor spotlight tracking, decaying particle trail on light sections (0% idle CPU via `IntersectionObserver` pause).

---

### Phase R4: Shared Chrome & Navigation Components ✅
- [x] **R4.1:** Brand Wordmark Scrambler (`react/src/components/chrome/BrandLogo.tsx`): Interactive logo with character scrambler effect on hover, SVG compass emblem, and gold glow pulse.
- [x] **R4.2:** Rolling Nav Links Component (`react/src/components/chrome/RollLink.tsx`): Dual-layer vertical text curtain animation with golden hover slide and active page indicator.
- [x] **R4.3:** Desktop Navigation Header (`react/src/components/chrome/Header.tsx`): Sticky header, luxury dropdown menus (Services, Routes, Packages, Fleet, Contact), language toggle (EN/HI), theme toggle, and Book CTA.
- [x] **R4.4:** Mobile Navigation Sheet Drawer (`react/src/components/chrome/MobileNavSheet.tsx`): Touch-first full drawer with accordion category groups, quick call/WhatsApp buttons, and language switcher.
- [x] **R4.5:** Sticky Mobile Bottom Lead-Bar (`react/src/components/chrome/StickyLeadBar.tsx`): Fixed thumb-zone bar with Call button, WhatsApp button, and Book Now action (safe-area-inset padded, auto-hides at bottom of form).
- [x] **R4.6:** Radial Quick Actions Dock (`react/src/components/chrome/RadialDock.tsx`): Floating action speed-dial button expanding with spring motion to reveal Call, WhatsApp, Tours, and Instant Booking.
- [x] **R4.7:** Luxury Page Loader Overlay (`react/src/components/chrome/PageLoader.tsx`): Non-blocking shining text curtain with 600ms minimum display, dismissing on real window load.
- [x] **R4.8:** Global Footer Component (`react/src/components/chrome/Footer.tsx`): Full NAP block, interactive Google Maps link, legal links, vehicle directory, route directory, and copyright.
- [x] **R4.9:** Accessible Skip Link (`react/src/components/chrome/SkipLink.tsx`): Top skip-to-content link for keyboard users.

---

### Phase R5: Marketing Pages, Detail Templates & Pre-Rendering ⏳

#### Sub-Phase R5A: Home Page Sections
- [ ] **R5.1:** Home Hero Bento Grid (`react/src/components/home/HeroBentoGrid.tsx`): 3-cell living bento mosaic with independent staggered 8.0s crossfade cycles across 11 world-famous destinations and Ken Burns drift.
- [ ] **R5.2:** Hero Quick Fare Calculator Widget (`react/src/components/home/HeroFareWidget.tsx`): Interactive tabbed widget (One-Way, Round-Trip, Local Tour) with live fare quote and 1-click book redirect.
- [ ] **R5.3:** Trust Roller Marquee Component (`react/src/components/home/TrustRoller.tsx`): 42s infinite marquee with pause-on-hover and 8 E-E-A-T trust chips (Govt Fleet, GST Invoice, Chauffeur ID, etc.).
- [ ] **R5.4:** Popular Routes Grid Section (`react/src/components/home/PopularRoutes.tsx`): Responsive cards for Agra-Delhi, Agra-Jaipur, Agra-Mathura, Agra-Gwalior with starting prices, duration badges, and book links.
- [x] **R5.5:** Six Operational Services Grid (`react/src/components/home/ServicesGrid.tsx`): 6 vertical cards with index numerals (01-06), variant color borders (navy, light, gold), tags, and CTAs.
- [x] **R5.6:** 3D Coverflow Sightseeing Carousel (`react/src/components/home/CoverflowCarousel.tsx`): 3D perspective carousel cycling 6 tour packages with cover reflection, package kicker, places pills, fare, and WhatsApp CTA.
- [x] **R5.7:** "Benefits To Book Cab With Us" Section (`react/src/components/home/BenefitsSection.tsx`): 6 core benefit cards with gold background fill-on-hover and crisp white icon transition.
- [x] **R5.8:** 2-Row Liquid Glass Marquee Reviews (`react/src/components/home/ReviewsMarquee.tsx`): Dual opposing marquee tracks with glassmorphism cards, verified customer quotes, and Lucide stars.
- [x] **R5.9:** Architectural Contact Card Section (`react/src/components/home/ContactCard.tsx`): Bento contact card with corner plus markers, verified NAP details, working inquiry form with feedback toast, and live map link.
- [x] **R5.10:** Complete Home Page Assembler (`react/src/pages/HomePage.tsx`): Bilingual Home page integrating all home sections, meta tags, and structured data.

#### Sub-Phase R5B: Bilingual Marketing Hub Pages
- [x] **R5.11:** Services Hub Page (`react/src/pages/ServicesPage.tsx`): Complete guide to all 6 service verticals, vehicle allocation advice, pricing transparency, and FAQs.
- [x] **R5.12:** Routes Hub Page (`react/src/pages/RoutesPage.tsx`): Filterable outstation route directory, distance matrix, dynamic route calculator, and highway toll advice.
- [x] **R5.13:** Tour Packages Hub Page (`react/src/pages/PackagesPage.tsx`): Filterable tour catalogue (Same-Day vs. Multi-Day), currency switcher (INR/USD/EUR/GBP), and inclusions breakdown.
- [x] **R5.14:** Fleet Hub Page (`react/src/pages/FleetPage.tsx`): Complete fleet showcase (Sedan, Ertiga, Innova, Tempo, Urbania), passenger/luggage specs, per-km rates, and Airport/Station flat transfer table.
- [x] **R5.15:** About Us Hub Page (`react/src/pages/AboutPage.tsx`): Company heritage, founder message, chauffeur background verification, safety and hygiene standards.
- [ ] **R5.16:** Contact Us Hub Page (`react/src/pages/ContactPage.tsx`): Full contact hub with architectural card, lead capture form, emergency contact numbers, and office directions.
- [ ] **R5.17:** FAQ Hub Page (`react/src/pages/FaqPage.tsx`): 5 categorized FAQ accordions (Booking, Fares, Outstation Rules, Night Allowances, Luggage & Cancellations) with `FAQPage` JSON-LD schema.
- [ ] **R5.18:** Terms & Conditions Hub Page (`react/src/pages/TermsPage.tsx`): Authentic 24-hr cab cancellation policy (100% refund in 5-7 days), 6-tier tour refund schedule, passenger code, and Agra jurisdiction.
- [ ] **R5.19:** Privacy Policy Hub Page (`react/src/pages/PrivacyPage.tsx`): Transparent data collection, DPDP compliance, zero third-party data sharing policy.
- [ ] **R5.20:** 404 Error Recovery Page (`react/src/pages/NotFoundPage.tsx`): Compass visual, recovery route links, search prompt, and emergency call button.

#### Sub-Phase R5C: Dynamic Detail Templates
- [ ] **R5.21:** Dynamic Route Landing Template (`react/src/pages/RouteDetailPage.tsx`): Dynamic page for all 8 route pairs with hero, vehicle fare comparison table, highway guidance (Yamuna Expressway, NH tips), transit times, rest stop advice, night allowance rule notes, and route-specific FAQ accordions.
- [ ] **R5.22:** Dynamic Tour Package Landing Template (`react/src/pages/PackageDetailPage.tsx`): Dynamic page for all 6 tour packages with hero, hour-by-hour itinerary timeline, vehicle upgrade pricing matrix, inclusions/exclusions pills, departure advice, and live international currency estimator.
- [ ] **R5.23:** Dynamic Vehicle Landing Template (`react/src/pages/VehicleDetailPage.tsx`): Dynamic page for all 5 fleet tiers with technical specifications (seats, luggage, AC, engine), model lineup, per-km pricing, transfers table, and suitable travel scenarios.

#### Sub-Phase R5D: SEO Engine & Static Site Pre-Rendering (SSG)
- [ ] **R5.24:** SEO Head & Metadata Manager (`react/src/components/seo/SeoHead.tsx`): Dynamic Title, Meta description, Canonical URL, Open Graph, Twitter cards, and Hreflang alternates (`en-IN`, `hi-IN`, `x-default`).
- [ ] **R5.25:** Structured Data Injector (`react/src/components/seo/JsonLd.tsx`): Injects validated Schema.org graphs for `TaxiService`, `BreadcrumbList`, `FAQPage`, and `AggregateRating`.
- [ ] **R5.26:** Static HTML Pre-Renderer / SSG Build Script (`react/scripts/prerender.ts`): Builds crawlable static HTML files for all 113 bilingual URLs so that primary copy and fares are 100% crawlable without client JS.
- [ ] **R5.27:** XML Sitemap & Robots Generator: Generates `dist/react/sitemap.xml` with all 113 URLs, lastmod timestamps, and `robots.txt` pointing to sitemap.

---

### Phase R6: LocationIQ Search & Interactive Discovery ⏳
- [ ] **R6.1:** Typed LocationIQ Client & Hook (`react/src/hooks/useLocationIQ.ts`): Debounced query hook (300ms), AbortController for race prevention, and runtime token injection.
- [ ] **R6.2:** Searchable Combobox Component (`react/src/components/search/LocationCombobox.tsx`): Touch-friendly combobox with autocomplete suggestions, airport/station icons, and keyboard navigation.
- [ ] **R6.3:** Static Destinations & Fallback Distance Matrix (`react/src/utils/distance.ts`): 30+ Indian destinations with verified highway distances from Agra/Delhi when offline or without API token.
- [ ] **R6.4:** Custom Destination Distance & Fare Estimator: Estimates distance (km), travel hours, and fares for unlisted custom addresses or cities.
- [ ] **R6.5:** Combobox ARIA & Screen Reader Accessibility: Full ARIA 1.2 combobox role, aria-expanded, aria-activedescendant, and voiceover verification.

---

### Phase R7: Fare Calculator & 5-Step Booking Application ⏳
- [ ] **R7.1:** Booking State Machine Store (`react/src/stores/bookingStore.ts`): Central state management with validation, step transitions, and `sessionStorage` sync (`skb-booking`).
- [ ] **R7.2:** Deep-Link Query Hydration Engine: Parses incoming URL search params from Home, Routes, Packages, and Vehicles to pre-fill the booking wizard.
- [ ] **R7.3:** Booking Wizard Step 1 Component (`react/src/components/booking/Step1Route.tsx`): Trip type tabs (One-Way, Round-Trip, Local Tour, Airport Transfer), origin/destination search comboboxes, and date picker.
- [ ] **R7.4:** Booking Wizard Step 2 Component (`react/src/components/booking/Step2Vehicle.tsx`): Vehicle cards (Sedan, Ertiga, Innova, Tempo, Urbania) with live total fare, passenger/luggage badges, and per-km rates.
- [ ] **R7.5:** Booking Wizard Step 3 Component (`react/src/components/booking/Step3Details.tsx`): Traveler name, phone, email, pickup address, drop address, flight/train number, and night pickup detection.
- [ ] **R7.6:** Booking Wizard Step 4 Component (`react/src/components/booking/Step4Review.tsx`): Detailed itemized fare breakdown, night allowance badge, promo code input with coupon `ASTTCAR500OFF`, 28% advance calculation, and remaining balance notice.
- [ ] **R7.7:** Booking Wizard Step 5 Component (`react/src/components/booking/Step5Confirmation.tsx`): Mock payment simulation (~900ms), verified booking confirmation, unique ticket number generation `AGR-XXXXXX`, and print voucher action.
- [ ] **R7.8:** Post-Booking WhatsApp & Driver Dispatch Actions: Pre-filled WhatsApp confirmation message generator and direct click-to-call driver coordinator.

---

### Phase R8: Responsive QA, Accessibility & Mobile App Shell (PWA) ⏳
- [ ] **R8.1:** Progressive Web App Manifest (`react/public/manifest.json`): Standalone display mode, theme colors (`#FFFFFF` / `#181615`), app icons (192x192, 512x512 maskable), and app name.
- [ ] **R8.2:** Service Worker Offline Cache (`react/src/sw.ts`): Caches static assets, fonts, and core routes for instantaneous repeat load and offline fallback.
- [ ] **R8.3:** Native Safe-Area & Viewport Hardening: CSS environment variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) for iPhone Dynamic Island/home bar and Android gesture bars.
- [ ] **R8.4:** Viewport Matrix Responsive Testing: Automated testing across 320px, 360px, 390px, 768px, 1024px, 1280px, and 1440px with zero horizontal page scroll.
- [ ] **R8.5:** Touch Ergonomics Audit: 44px+ minimum touch targets, 16px minimum font size to prevent iOS zoom-on-focus, and thumb-friendly bottom placement.
- [ ] **R8.6:** WCAG 2.2 AA Contrast & Theme Verification: Automated contrast checks in Clean White mode (4.5:1 text, 3:1 UI) and Solar Dusk dark mode (17.6:1 contrast).
- [ ] **R8.7:** Keyboard Navigation & Reduced Motion Audit: Full Tab/Shift-Tab focus order, visible focus rings, and `@media (prefers-reduced-motion: reduce)` verification.

---

### Phase R9: Regression, Cutover & Cloudflare Deployment ⏳
- [ ] **R9.1:** Static Build Generation & Cloudflare Budget Audit: Production build compilation with zero assets exceeding the 25 MiB Cloudflare Pages ceiling.
- [ ] **R9.2:** Link Integrity & Crawl Audit: Automated crawl of all 113 bilingual URLs confirming 0 broken links and 100% HTTP 200 responses.
- [ ] **R9.3:** Senior Frontend Quality Auditor Scorecard (`quality_audit.py`): Full scorecard execution verifying 10.0/10.0 A+ score on Technical SEO, Schema.org, Accessibility, and JS health.
- [ ] **R9.4:** Legacy Redirect Stubs & URL Backward Compatibility: Verification of all `.html` redirect stubs to clean React routes.
- [ ] **R9.5:** Production Cutover & Domain Switchover: Final approval and deployment to `https://skbagheltravels.in`.
- [ ] **R9.6:** Rollback Plan & Operating Documentation: Documented rollback switch, updated `README.md`, and finalized `04_PROGRESS_TRACKER.md`.

---

## 7. Operating Rules for Any Implementing Agent

1. **Implement exactly one step at a time** from the roadmap above. Never batch multiple steps.
2. **Never invent values:** Strictly adhere to the tokens in `DESIGN.md` and `css/tokens.css`.
3. **Preserve SEO integrity:** Single H1 per page, strict heading hierarchy (H1 -> H2 -> H3), valid Schema.org JSON-LD graphs.
4. **Update `04_PROGRESS_TRACKER.md`** immediately after each step is verified.
5. **No partial code:** Every file must be complete and compile cleanly with `npm run react:build` and `tsc --noEmit`.
