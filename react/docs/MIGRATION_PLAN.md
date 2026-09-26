# SK Baghel Tour & Travels — Master HTML UI to React Migration Plan

**Document Version:** 2.0 (Approved Master Plan)  
**Target Platform:** Single Unified Responsive Web & Mobile Application (`react/`)  
**Stack:** React 19 + TypeScript (Strict) + Vite 7 + Tailwind CSS + Google Fonts & Material Symbols  
**Design Source:** `react/new_design/` (Ultra-Luxury Terracotta & Mughal Dawn Design System)  
**Business Logic:** Preserved from existing codebase (`fareEngine.ts`, `data.ts`, `catalogue.ts`, `LocationIQ`, 28% Advance Token Lock)

---

## 1. Executive Summary & Core Mandate

The client has designed an ultra-luxury, high-converting visual identity and interactive UI located in `react/new_design/`. The objective is to replace the older React pages with pixel-perfect, fully responsive React components matching the new HTML files while retaining 100% of the underlying business logic, fare calculation engines, route directories, and catalogue data.

### 1.1 Key Architecture Mandate: Universal Dynamic Tour Package Template
> **"We have to create a template for every tour package because we cannot create 1,000 or 2,000 packages of tours for our customers. We just dynamically update the values, the price, and a few details."**

To solve this at enterprise scale:
- We will construct **one universal, data-driven template: `PackageDetailPage.tsx`**, engineered from `taj_mahal_sunrise_guided_tour.html`.
- Instead of static text, `PackageDetailPage.tsx` accepts a typed `pkg: TourPackage` prop.
- The template dynamically binds:
  - **Metadata & Hero:** Title, badge kicker, duration, rating, review count, hero vehicle image, and monument photography.
  - **Story & Chapter 1:** Experience overview, morning timing highlights, and architectural acoustic notes.
  - **Chapter 2 (Accounting):** Inclusions checklist and transparent exclusions matrix.
  - **Chapter 3 (Guidelines):** Monument-specific rules (e.g. Friday closure, camera regulations, baggage restrictions, zero tourist commission guarantee).
  - **Chapter 4 (Itinerary):** Hourly timeline milestones dynamically populated from `pkg.timeline`.
  - **Sticky Reservation Dock:** Starting base price, vehicle class rates (Sedan, Ertiga, Innova Crysta, Tempo Traveller, Urbania), 28% advance deposit calculation, instant confirmation guarantee, and direct booking trigger.
- With this architecture, adding or editing 1,000+ tour packages only requires editing data records in `src/data.ts` or fetching them from the Fastify API.

---

## 2. Design System & Token Foundation

The new design features a warm, heritage-inspired terracotta and sandstone palette with high-contrast typography and polished micro-interactions.

### 2.1 Color Palette
| Token Name | Hex Code | Role / Usage |
|---|---|---|
| `primary` | `#9F3C16` | Deep Terracotta / Primary brand actions & active states |
| `primary-container` | `#BF542C` | Rich Amber-Terracotta / Hover states & card headers |
| `primary-fixed` | `#FFDBCF` | Soft Peach / Highlight badges & alert tints |
| `terracotta-sandstone` | `#C85A32` | Signature Sandstone / Section numbers, step badges & accents |
| `terracotta-sunlit` | `#D97746` | Warm Saffron / Secondary CTAs & vibrant highlights |
| `ink-midnight` | `#0F131A` | Deepest Obsidian / Hero backgrounds & night accents |
| `ink-charcoal` | `#181D27` | Soft Black / Main text, dark buttons & footer canvas |
| `ink-slate` | `#252B37` | Charcoal Slate / Button hover states & dark card borders |
| `surface` / `ivory-surface`| `#FDF8F5` | Ivory Warm Canvas / Page background & main container |
| `sandstone-wash` | `#F5EBE1` | Sandstone Wash / Subtle card backgrounds & breadcrumb bars |
| `surface-container-low` | `#F8F3F0` | Light Sandstone / Nested card backgrounds & list items |
| `surface-container-lowest`| `#FFFFFF` | Crisp White / Sticky reservation docks, modals & inputs |
| `border-warm` | `#E9DFD5` | Warm Sandstone Border / Hairline dividers & card borders |
| `gold-accent` | `#D99A3E` | Imperial Mughal Gold / Star ratings, trust seals & sparkle badges |
| `success-jade` | `#2D6A4F` | Forest Green / Inclusions checkmarks & verified badges |

### 2.2 Typography
- **Headings & Price Display:** `EB Garamond` (Weights: 400, 500, 600, 700)
  - `font-headline-hero`: 56px / 64px, -0.02em tracking
  - `font-headline-lg`: 40px / 48px, -0.01em tracking
  - `font-headline-md`: 28px / 36px, 0em tracking
  - `font-headline-sm`: 22px / 28px, 0.01em tracking
  - `font-price-display`: 32px / 36px, -0.01em tracking, font-serif
- **Body, UI & Labels:** `Plus Jakarta Sans` (Weights: 400, 500, 600, 700)
  - `font-body-lg`: 18px / 28px
  - `font-body-md`: 15px / 24px
  - `font-body-sm`: 13px / 20px
  - `font-title-lg`: 18px / 26px, font-semibold
  - `font-title-md`: 16px / 24px, font-semibold
  - `font-label-lg`: 14px / 20px, 0.02em tracking, font-semibold
  - `font-label-caps`: 11px / 16px, 0.12em tracking, uppercase font-bold
- **Icons:** Google `Material Symbols Outlined` (variable font, optical size 20..48, weight 100..700, fill 0..1).

---

## 3. Inventory of Source Designs (`react/new_design/`)

| File Name | Size | Target React Component | Core Purpose |
|---|---|---|---|
| `home.html` | 117 KB | `react/src/pages/HomePage.tsx` | Hero Expedition Dock, Elevated Fare Matrix, Fleet Showroom & Tour previews |
| `taj_mahal_sunrise_guided_tour.html` | 66 KB | `react/src/pages/PackageDetailPage.tsx` | **Universal Dynamic Tour Package Detail Template** (Step 0 origin) |
| `step_1_taj_mahal_sunrise_guided_tour.html` | 66 KB | `react/src/features/booking/VehicleSelectionStep.tsx` | **Step 1: Choose Car / Vehicle & Chauffeur Tier** |
| `step_2_booking_form_for_all.html` | 51 KB | `react/src/features/booking/UniversalBookingForm.tsx` | **Step 2: Universal Booking & Billing Form** (Universal across all packages & routes) |
| `book_confirmed.html` | 46 KB | `react/src/features/booking/BookingConfirmation.tsx` | **Completion: Voucher Dispatch, Reference & Concierge Handoff** |
| `packages.html` | 99 KB | `react/src/pages/PackagesPage.tsx` | Curated tour catalogue listing with dynamic filters & pricing cards |
| `fleet.html` | 98 KB | `react/src/pages/FleetPage.tsx` | Fleet showroom (Dzire, Ertiga, Crysta, Tempo, Urbania) with rate cards |
| `routes.html` | 108 KB | `react/src/pages/RoutesPage.tsx` | 983 routes directory, toll inclusions, distance & fare matrix |
| `services.html` & `services_why_choose_us.html` | 80 KB + 69 KB | `react/src/pages/ServicesPage.tsx` | Chauffeur standards, 6 core service verticals & customer assurances |
| `contact-us.html` | 45 KB | `react/src/pages/ContactPage.tsx` | 24x7 Taj Ganj dispatch desk, phone, WhatsApp & instant inquiry form |
| `faq.html` | 59 KB | `react/src/pages/FaqPage.tsx` | Categorized FAQs (Tolls, 300km rule, night allowance, cancellation) |
| `terms_condit.html` | 46 KB | `react/src/pages/TermsPage.tsx` | Legal booking terms, cancellation slabs, and fare policies |
| `privacy_policy.html` | 58 KB | `react/src/pages/PrivacyPage.tsx` | Privacy, data security, payment token handling policies |
| `404.html` | 22 KB | `react/src/pages/NotFoundPage.tsx` | 404 recovery with quick links and 24x7 dispatch contact |

---

## 4. Phased Implementation Roadmap

To comply with the rule of **implementing exactly one step at a time**, the migration is broken down into structured, verifiable phases:

```
[Phase M0: Planning & Design Lock Update] (Completed)
         ↓
[Phase M1: Tailwind CSS & Design Token Foundation]
         ↓
[Phase M2: Global Chrome & Responsive Layout (Header, Footer, Nav Drawer)]
         ↓
[Phase M3: Universal Dynamic Tour Package Template & Catalogue]
         ↓
[Phase M4: Streamlined 2-Step Universal Booking & Billing Engine]
         ↓
[Phase M5: Core Marketing Pages & Route Hubs]
         ↓
[Phase M6: Polish, Accessibility, Pre-rendering & Full Verification]
```

### Phase M1: Tailwind CSS & Design Tokens Foundation
1. **Dependencies:** Install `@tailwindcss/vite` and `tailwindcss` in `react/`.
2. **Vite Configuration:** Configure Tailwind plugin in `react/vite.config.ts`.
3. **Typography & Icons:** Add Google Fonts (`EB Garamond`, `Plus Jakarta Sans`) and Google `Material Symbols Outlined` to `react/index.html`.
4. **Theme Configuration:** Create `react/src/styles/theme.css` with the custom `@theme` / Tailwind configuration containing all colors (`primary`, `terracotta-sandstone`, `ink-midnight`, etc.), font families, font sizes, and spacing tokens matching `tailwind.config` from the HTML files.
5. **Verification:** Validate that Tailwind utilities compile cleanly via `npm --prefix react run typecheck` and `npm --prefix react run build`.

### Phase M2: Global Chrome & Responsive Layout
1. **New Luxury Header (`Header.tsx`):**
   - Translucent glassmorphism (`bg-surface/90 backdrop-blur-xl`).
   - SK Baghel logo & typography.
   - Desktop navigation links with active state styling.
   - Quick action pill: Phone (`+91 98765 43210`) & WhatsApp link.
   - Mobile navigation hamburger & slide-over drawer (`MobileNavSheet.tsx`).
2. **New Luxury Footer (`Footer.tsx`):**
   - 4-column layout: Brand narrative, quick route links, fleet categories, and 24x7 Taj Ganj dispatch contact.
   - Trust seals: 28% advance token guarantee, 100% refund policy, verified chauffeurs.
3. **Site Layout (`SiteLayout.tsx`):**
   - Standardized wrapper with consistent spacing, top padding (`pt-20`), and accessibility skip links.

### Phase M3: Universal Dynamic Tour Package Template & Catalogue
1. **Universal `PackageDetailPage.tsx`:**
   - Replace old `PackageDetailPage.tsx` with the new design from `taj_mahal_sunrise_guided_tour.html`.
   - Ensure it dynamically renders ANY package from `src/data.ts` (`taj-mahal-sunrise-tour`, `agra-sightseeing`, `mathura-vrindavan`, `gatimaan-express-agra-tour`, `golden-triangle`, etc.).
   - Support currency conversion (INR, USD, EUR, GBP).
   - Render dynamic vehicle pricing tier table in sticky reservation dock.
   - "Book This Tour Now" button initiates the streamlined Step 1 vehicle selection screen.
2. **Packages Hub Page (`PackagesPage.tsx`):**
   - Implement the `packages.html` layout.
   - Dynamic cards for each package in `src/data.ts` with vehicle prices, duration pills, and "View Itinerary" links to `/packages/:slug`.

### Phase M4: Streamlined 2-Step Universal Booking & Billing Flow
1. **Streamlined 2-Step Architecture:**
   - **Step 0 (Origin):** Any Package Detail (`PackageDetailPage.tsx`) or Route Detail (`RouteDetailPage.tsx`) page initiates booking.
   - **Step 1: Choose Car / Vehicle Tier Screen (`VehicleSelectionStep.tsx`):**
     - Sourced from `step_1_taj_mahal_sunrise_guided_tour.html`.
     - Displays available fleet tiers (Sedan, Ertiga, Innova Crysta, Tempo Traveller, Urbania) with live rates, passenger/luggage capacities, and instant selection.
   - **Step 2: Universal Booking & Billing Form (`UniversalBookingForm.tsx`):**
     - Sourced from `step_2_booking_form_for_all.html`.
     - **Universal for ALL packages and routes.**
     - Captures: Guest Full Name, Email, Phone, Billing Address, City, State, Country, Pincode.
     - Rendezvous & Destination: Pickup & Drop Instructions.
     - Pet-friendly travel options (pet toggle, breed, size class, special hammock/stops requirements).
     - Passenger counter (Adults/Guests) with dynamic subtotal recalculation.
     - Itemized Fare Breakdown: Base fare, Subtotal, GST, Total Amount.
     - Settlement Mode Selection: Full Payment (100%) or Partial Advance Deposit (Balance at Pickup).
     - "Continue & Pay" action button with live amount.
     - Supported Gateways badges (UPI, Visa, Mastercard, RuPay).
2. **Completion: Booking Confirmation Voucher (`BookingConfirmation.tsx`):**
   - Sourced from `book_confirmed.html`.
   - Displays confirmed Booking Reference (`SKB-TMT-XXXXX`), digital voucher overview, downloadable receipt trigger, and 24x7 WhatsApp handoff.
3. **Business Logic Binding:**
   - Connect all calculations to `fareEngine.ts` and standard advance token formulas (28% advance deposit, 72% balance on drop-off).

### Phase M5: Core Marketing Pages & Route Directory
1. **`HomePage.tsx`:**
   - Hero Expedition Dock with Mughal dawn ambient glow and instant booking widget.
   - Popular Outstation Routes fare grid.
   - Fleet showroom with photo cards and per-km starting rates.
   - Customer testimonials and 6 core service verticals.
2. **`FleetPage.tsx` & `VehicleDetailPage.tsx`:**
   - Replicate `fleet.html` with vehicle specifications, passenger/luggage capacities, and per-km pricing.
3. **`RoutesPage.tsx` & `RouteDetailPage.tsx`:**
   - Replicate `routes.html` with intercity distance matrix, toll inclusions, and instant quote calculators.
4. **`ServicesPage.tsx`:**
   - Replicate `services.html` & `services_why_choose_us.html`.
5. **Support & Legal Pages:**
   - `ContactPage.tsx` (`contact-us.html`)
   - `FaqPage.tsx` (`faq.html`)
   - `TermsPage.tsx` (`terms_condit.html`)
   - `PrivacyPage.tsx` (`privacy_policy.html`)
   - `NotFoundPage.tsx` (`404.html`)

### Phase M6: Verification, SSR Pre-Rendering & Quality Assurance
1. **Pre-rendering Engine Update:**
   - Update `react/scripts/prerender.ts` to ensure all routes render HTML cleanly with the new design system.
2. **Typecheck & Build Validation:**
   - Run `npm --prefix react run typecheck` (0 TypeScript errors required).
   - Run `npm --prefix react run build` (full build + SSG output generation).
3. **Monorepo Contract Verification:**
   - Run root `npm run verify` to ensure customer app, admin desk, and backend API build cleanly without regressions.

---

## 5. Design Lock Compliance & Governance

In earlier phases, legacy v1 components (`LOCK-001` through `LOCK-011`) were locked. With the user's explicit instruction to replace the old React pages with the new HTML UI designs, those legacy locks are officially retired and superseded by the **New Design System Locks**:

| New Lock ID | Component / Pattern | Status | Key Characteristics |
|---|---|---|---|
| `LOCK-N01` | **Mughal Terracotta Design Tokens** | `ACTIVE` | Hex palette: `#9F3C16` primary, `#C85A32` sandstone, `#0F131A` ink-midnight, `#FDF8F5` ivory surface. Fonts: `EB Garamond` + `Plus Jakarta Sans`. |
| `LOCK-N02` | **Universal Package Template** | `ACTIVE` | `PackageDetailPage.tsx` driven dynamically by `TourPackage` props. 4 chapters: Overview, Inclusions/Exclusions, Monument Guidelines, Hourly Timeline. |
| `LOCK-N03` | **4-Step Booking & Billing Flow** | `ACTIVE` | Steps 1–3 + Billing Form + Voucher Confirmation. 28% advance deposit calculation. |
| `LOCK-N04` | **Luxury Header & Navigation** | `ACTIVE` | Glassmorphic sticky header, phone + WhatsApp CTAs, mobile drawer. |
| `LOCK-N05` | **Fare Engine Invariants** | `ACTIVE` | 300 km/day minimum outstation billing, toll inclusions, 28% advance deposit lock. |

---

## 6. Execution Protocol

Every subsequent execution step will follow the strict rule:
1. **One Step at a Time:** Perform exactly one discrete step from the roadmap.
2. **Test & Verify:** Run typechecks and verify output before declaring the step complete.
3. **Update Trackers:** Update `04_PROGRESS_TRACKER.md` with step completion notes and timestamps.
