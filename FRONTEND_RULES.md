# Master Frontend Operating Rules & Architectural Standard — SK Baghel Tour & Travels

**Document Version:** 1.0.0 (Master Canonical Frontend Rule)  
**Authority:** Single Source of Truth for all Frontend Engineering, Design System Tokens, Typography Scaling, Component Architecture, State Management, and Static Pre-Rendering (SSG).  
**Target Applications:** `react/` (Customer Experience Site) and `admin/` (Operations Control Desk).  
**Applies To:** All AI Agents, Frontend Developers, and UI/UX Engineers across all sessions.

---

## 1. Executive Summary & Purpose

This document serves as the **single authoritative operational standard** for the SK Baghel Tour & Travels frontend monorepo. It establishes the architectural boundaries, design tokens, typography scale, component blueprints, accessibility mandates, performance standards, and backend integration protocols required to build, scale, and maintain the frontend applications without aesthetic drift or code degradation.

### Core Philosophy
1. **Restrained Luxury Aesthetic:** Design for an ultra-high-end private tour and travel portal inspired by Aman, Belmond, and Apple. Use warm sandstone surfaces, authentic terracotta pigments, deep ink neutrals, and subtle gold accents. Never use loud or generic colors.
2. **Harmonious, Balanced Typography:** Big font sizes (hero headlines and section titles) must remain refined and elegant (20px–26px), perfectly balanced against compact, high-density metadata (9.5px–11px). Never create ballooned or shouting headlines.
3. **Design Token Supremacy:** Every color, font size, line-height, border radius, and spacing unit is strictly derived from `@theme` design tokens in `react/src/styles/theme.css`. Never introduce arbitrary ad-hoc Tailwind classes.
4. **Server-Authoritative Fare Integrity:** The frontend displays fares, distance benchmarks, and the 28% advance token calculation, but financial authority belongs entirely to the backend `fareEngine.ts`.
5. **Universal SSG & High Performance:** Fast page loads with zero layout shift (CLS < 0.05). All 37+ customer routes are pre-rendered into static HTML (`scripts/prerender.ts`) with dynamic client-side hydration.
6. **No Scroll Hijacking or Wheel Interference:** Preserve native browser scrolling physics. Never clamp or intercept user mouse wheel or touch velocity.

---

## 2. Master Document Registry & Precedence Hierarchy

When reading or modifying frontend code, resolve any conflicting instructions using this exact hierarchy:

| Priority | Document | Location | Scope |
|:---:|---|---|---|
| **1** | `FRONTEND_RULES.md` | Root / `.agents/rules/FRONTEND_RULES.md` | **Supreme frontend law & architectural standard** |
| **2** | `DESIGN_LOCKS.md` | Repository Root | Component lock registry (NEVER modify locked components without explicit user permission) |
| **3** | `DESIGN.md` | `react/docs/DESIGN.md` | Visual tokens, palette definitions, and typography specifications |
| **4** | `ANIMATION_RULES.md` | Repository Root | Animation constraints, timing, and accessibility requirements |
| **5** | `docs/PAYMENT_SYSTEM.md` | `docs/PAYMENT_SYSTEM.md` | Financial checkout flow and Razorpay 28% advance protocol |
| **6** | `BACKEND_RULES.md` | Repository Root | Backend API contracts and request/response schemas |

---

## 3. The 10 Golden Laws of the Frontend

Every line of TypeScript, TSX, CSS, and HTML written for the frontend must comply with these ten non-negotiable laws:

### Law 1: Design Token Invariance
- All styles must map to tokens defined in `react/src/styles/theme.css`.
- Colors must use named brand variables: `text-primary`, `bg-surface`, `bg-sandstone-wash`, `text-ink-charcoal`, `border-border-warm`, `text-success-jade`.
- Spacing must use scale tokens: `p-space-xs`, `p-space-sm`, `p-space-md`, `gap-space-lg`, or compact numerical equivalents (`p-3.5`, `p-4`).

### Law 2: Refined Editorial Typography Hierarchy
- Headings use **EB Garamond** serif:
  - Hero H1: `--text-headline-hero: 26px` (desktop), `20px` (mobile), line-height `34px` / `26px`.
  - Section H2: `--text-headline-lg: 20px` (desktop), `17px` (mobile), line-height `26px` / `22px`.
  - Card Title H3: `--text-headline-md: 15px`, line-height `20px`.
  - Subsection H4: `--text-headline-sm: 13.5px`, line-height `18px`.
- Body copy and metadata use **Plus Jakarta Sans**:
  - Lead body: `text-body-lg` (12px).
  - Standard body: `text-body-md` (10.5px).
  - Compact body / specs: `text-body-sm` (9.5px).
  - Micro tags / pills / badges: `text-label-caps` (8.5px, uppercase, tracking-wider).

### Law 3: Financial & Fare Display Precision
- Always display the **28% advance deposit guarantee**:
  $$\text{advanceAmount} = \max\left(500, \text{round}\left(\frac{\text{totalFare} \times 0.28}{100}\right) \times 100\right)$$
- Show transparent breakdown tags: *Yamuna Toll Included*, *GST Invoice Provided*, *Zero Return Surcharge*.
- Currency figures must be formatted in Indian Rupee notation (`₹3,499`, `₹12,500`) using `.toLocaleString("en-IN")`.

### Law 4: SSG Pre-Rendering & Hydration Hygiene
- All public customer pages must successfully pre-render to static HTML during `npm --prefix react run build`.
- Never access `window`, `document`, or `localStorage` during initial component render; wrap client-only APIs in `useEffect` or state guards.
- Static metadata (title, meta description, OpenGraph, Canonical URLs, and Schema.org JSON-LD) must be injected into each pre-rendered page.

### Law 5: Component Modularity & Composition
- Shared components live in `react/src/components/`:
  - `Header.tsx`: Global navigation header with compact height (`h-12`) and mobile drawer.
  - `Footer.tsx`: 4-column luxury footer with trust badges and legal links.
  - `FareEngineDock.tsx`: Compact quick-booking fare calculator.
  - `ReviewsMarquee.tsx`: Verified customer reviews carousel.
- Page views live in `react/src/pages/` and remain thin orchestrators of feature components.

### Law 6: Mobile-First Ergonomics
- Minimum touch target for interactive elements is 44×44px (or wrapped with accessible hit-slop padding).
- Sticky bottom booking bar appears on mobile for routes and package detail pages to allow instant conversion.
- Horizontal scrolling filters must have subtle scrollbars hidden (`overflow-x-auto no-scrollbar`) with swipe support.

### Law 7: Accessible High-Contrast (WCAG AA)
- Text contrast must exceed 4.5:1 against its background:
  - On Ivory/Surface (`#FDF8F5`): Use `text-ink-charcoal` (`#181D27`) or `text-primary` (`#9F3C16`).
  - On Dark Midnight (`#0F131A`): Use `text-ivory-surface` (`#FDF8F5`) or `text-terracotta-sunlit` (`#D97746`).
- Every page has exactly one `<h1>` element. Interactive elements carry descriptive `aria-label` tags.

### Law 8: Subtle Motion & Native Scroll Preservation
- Transitions are constrained to `opacity` and `transform` with durations between 150ms and 300ms (`ease-out`).
- Never hijack wheel scrolling speed or alter native inertia.
- Respect `prefers-reduced-motion` media queries for all animations.

### Law 9: Strict Monorepo Separation & Secret Safety
- Customer site (`react/`) and Operations desk (`admin/`) have independent Vite configurations, entry points, and deployment artifacts (`react/dist`, `admin/dist`).
- Public builds must NEVER contain backend secrets, service-role keys, or payment private keys. Only public publishable keys (`VITE_RAZORPAY_KEY_ID`) are permitted.

### Law 10: Continuous Verification Gate
- No code change is complete without passing the repository-wide verification script:
  ```bash
  npm run verify
  ```
- This ensures 3 typechecks (React, Admin, Backend), 55 backend unit tests, and 3 production builds pass with zero errors.

---

## 4. Typography Scale & Design Tokens Reference

### 4.1 Typography Tokens (`react/src/styles/theme.css`)

| Token Class | Font Family | Size | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| `font-headline-hero text-headline-hero` | EB Garamond (serif) | 26px (mobile 20px) | 34px / 26px | -0.02em | Page H1 Hero Titles |
| `font-headline-lg text-headline-lg` | EB Garamond (serif) | 20px (mobile 17px) | 26px / 22px | -0.015em | Major Section H2 Titles |
| `font-headline-md text-headline-md` | EB Garamond (serif) | 15px | 20px | -0.01em | Card H3 / Feature Titles |
| `font-headline-sm text-headline-sm` | EB Garamond (serif) | 13.5px | 18px | Normal | Sub-headings & Accordion Questions |
| `font-price-display text-price-display` | EB Garamond (serif) | 18px | 22px | -0.01em | Currency Figures (`₹3,499`) |
| `font-body-lg text-body-lg` | Plus Jakarta Sans | 12px | 18px | Normal | Hero Lead Paragraphs |
| `font-body-md text-body-md` | Plus Jakarta Sans | 10.5px | 16px | Normal | Standard Paragraphs & Descriptions |
| `font-body-sm text-body-sm` | Plus Jakarta Sans | 9.5px | 14px | Normal | Specs, Itinerary Stops & Captions |
| `font-label-lg text-label-lg` | Plus Jakarta Sans | 10px | 14px | 0.02em | Buttons & Primary Action Links |
| `font-label-caps text-label-caps` | Plus Jakarta Sans | 8.5px | 11px | 0.08em | Category Pills, Status Badges (Uppercase) |

### 4.2 Color Palette Reference

```text
Primary Terracotta:        #9F3C16  (Buttons, active states, key accents)
Terracotta Sandstone:      #C85A32  (Subtle brand badges, highlighted serif text)
Sunlit Terracotta:         #D97746  (Warm accents on dark surfaces)
Gold Accent:               #D99A3E  (Ratings, stars, premium markers)
Success Jade:              #2D6A4F  (Verified status, 28% advance pill, WhatsApp)
Ink Midnight:              #0F131A  (Hero underlays, dark contrast sections)
Ink Charcoal:              #181D27  (Primary high-contrast text)
Ivory Surface:             #FDF8F5  (Main page background)
Sandstone Wash:            #F5EBE1  (Card backgrounds, tag containers)
Border Warm:               #E9DFD5  (Card outlines, table borders, dividers)
```

---

## 5. Page Architecture & Design Patterns

### 5.1 Universal Page Layout Pattern
```tsx
export function StandardPage() {
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO SECTION: Compact height with breadcrumbs & refined headline */}
      <section className="relative w-full bg-surface-container-low border-b border-border-warm/60 py-6 sm:py-8">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-on-surface-variant font-label-caps text-[8.5px] uppercase mb-2">
            <a href="/" className="hover:text-primary transition-colors">Home</a>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-bold">Section Name</span>
          </nav>
          {/* Refined Headline */}
          <h1 className="font-headline-hero text-headline-hero text-ink-charcoal leading-tight tracking-tight">
            Refined Luxury Headline
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
            Concise, elegant subheader description matching the high-density aesthetic.
          </p>
        </div>
      </section>

      {/* 2. CARD / CONTENT SECTION: 20% reduced dimensions & compact padding */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Feature Card */}
          <div className="bg-surface-container-lowest rounded-xl p-3.5 sm:p-4 border border-border-warm/70 shadow-xs hover:shadow-md transition-all">
            {/* Content with 10px-11px typography */}
          </div>
        </div>
      </section>
    </div>
  );
}
```

### 5.2 Card Section Standard Dimensions
- **Padding:** `p-3.5 sm:p-4` (never `p-6` or `p-8` which cause oversized cards).
- **Grid Gaps:** `gap-3 sm:gap-4` or `gap-4 sm:gap-5`.
- **Card Images:**
  - Vehicle showroom: `min-h-[190px] sm:min-h-[220px] lg:min-h-[260px]`.
  - Package catalog cards: `h-44 sm:h-48`.
  - Service module banners: `min-h-[190px] lg:min-h-[260px]`.
- **CTA Buttons:** `px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs`.

---

## 6. Frontend-to-Backend Integration Standards

1. **API Client Protocol:** All communication with `backend/` uses the standardized fetch adapter pointing to `VITE_API_BASE_URL` (`/api/v1` in production).
2. **Draft Booking Request:** Submit customer and trip data to `POST /api/v1/bookings/draft` to receive a `ticketId`, `guestAccessToken`, and server-calculated `advanceAmount`.
3. **Checkout Initialization:** Pass the token and idempotency key to `POST /api/v1/payments/create-checkout`.
4. **Polling for Confirmation:** After the Razorpay or card flow returns, poll `GET /api/v1/bookings/:ticketId` until `status === 'paid_confirmed'`.
5. **No Local Fare Overrides:** Never compute a final total in client state and submit it as authoritative. The backend recalculates all totals.

---

## 7. Developer Hygiene & Verification Checklist

Before opening a pull request or completing any frontend task:
1. Verify that **no locked component** from `DESIGN_LOCKS.md` was altered without permission.
2. Verify that **no headline font exceeds 26px** on desktop or **20px** on mobile.
3. Verify that **native scrolling** is unaffected (no wheel event listeners, no overflow locking).
4. Run static validation:
   ```bash
   npm --prefix react run typecheck
   npm --prefix react run build
   ```
5. Run repository-wide verification:
   ```bash
   npm run verify
   ```
Ensure all 3 applications build and pass all tests cleanly.
