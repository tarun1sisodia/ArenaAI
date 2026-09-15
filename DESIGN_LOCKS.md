# Design Lock Registry — SK Baghel Tour & Travels

> **Single Source of Truth for Approved & Immutable UI, Logic & Design Patterns.**
> 
> This registry protects approved components, layouts, typography, color palettes, micro-interactions, and business logic from accidental edits, style drift, or regression during subsequent development phases.

---

## Operating Protocol for AI Agents

1. **Mandatory Pre-Edit Gate:**
   - **Before modifying, refactoring, restyling, or deleting ANY existing file, component, CSS class, or pattern, the AI MUST consult this document.**
2. **Strict Rule for `LOCKED` Items:**
   - **If a component, pattern, or file is marked `LOCKED`:**
     - **DO NOT TOUCH, EDIT, REFACTOR, OR RE-THEME IT AUTOMATICALLY.**
     - **YOU MUST STOP AND ASK THE USER FIRST.**
     - Explicit prompt format:
       > *"The component `<ComponentName />` (or style/pattern) is currently marked as **LOCKED** in `DESIGN_LOCKS.md`. Would you like to unlock it or approve this specific modification?"*
   - Only proceed with modifying a locked component if the user explicitly confirms or requests changes to it.
3. **Behavior for `UNLOCKED` / New Features:**
   - If an item is `UNLOCKED` or not listed, proceed according to `03_PHASE_PLAN.md` and `REACT-MIGRATION-PLAN.md` as normal.
4. **Registering New Locks:**
   - Whenever the user says *"Lock this design"*, *"Make this permanent"*, *"Keep this pattern"*, or approves a component/feature as final, immediately add it to the **Active Locks Registry** below with its exact file paths, critical classes, visual tokens, and date.

---

## Active Locks Registry

| Lock ID | Component / Pattern | Status | Primary Files & Selectors | Key Locked Characteristics | Locked Date |
|---|---|---|---|---|---|
| `LOCK-001` | **Benefits Section** | `LOCKED` | `react/src/components/home/BenefitsSection.tsx`<br>`.benefits-section`, `.benefits-card`, `.benefits-icon-wrap` | 6 core benefit cards (Easy Booking, Multiple Fleets, Lowest Fares, Exciting Offers with coupon `ASTTCAR500OFF`, On-Time Service, 24×7 Support). Micro-interaction: -4px card lift, 1.12x/4° scale-rotate, solid Saffron Gold background fill on icon wrapper with crisp white SVG icon transition. Responsive 3→2→1 column collapse. | 2026-09-11 |
| `LOCK-002` | **Architectural Bento Contact Card** | `LOCKED` | `react/src/components/home/ContactCard.tsx`<br>`.contact-card`, `.corner-plus`, `.contact-tile`, `.contact-toast` | 2-column bento architectural card (1.3fr left / 1fr right). 4 corner plus crosses rotating 90° on card hover (`matrix(0, 1, -1, 0, 0, 0)`). 5 verified NAP tiles (Call `+91 98765 43210`, WhatsApp desk, Email, Google Maps live location `Taj Ganj Agra`, 24×7 dispatch). Working inquiry form with `.input-error` shake animation, 600ms simulated processing, auto-dismiss feedback toast, and in-card success state with direct WhatsApp link. | 2026-09-11 |
| `LOCK-003` | **2-Row Liquid Glass Reviews Marquee** | `LOCKED` | `react/src/components/home/ReviewsMarquee.tsx`<br>`.reviews-marquee-section`, `.liquid-review-card`, `.liquid-marquee-track` | Dual opposing continuous marquee tracks (Row 1 left 52s, Row 2 right 56s) with pause-on-hover. 10 verified customer testimonials, 5 gold Lucide stars, verified traveler checkmark badges, layered avatar wrapper with monogram fallback and smooth image fade-in, edge-fade gradient masks, and prefers-reduced-motion horizontal scroll fallback. | 2026-09-11 |
| `LOCK-004` | **3D Coverflow Sightseeing Carousel** | `LOCKED` | `react/src/components/home/CoverflowCarousel.tsx`<br>`.section--coverflow`, `.coverflow-card`, `.coverflow-stage-column` | 3D perspective carousel cycling 6 tour packages with cover reflection gradient, package kicker, places pills, live fare tag, arrow navigation, 6 pagination dots, keyboard navigation, and synchronized left details column with direct WhatsApp inquiry. | 2026-09-10 |
| `LOCK-005` | **Six Operational Services Grid** | `LOCKED` | `react/src/components/home/ServicesGrid.tsx`<br>`.services-grid-section`, `.services-card`, `.services-card-index` | 6 vertical service cards with index numerals (01–06), category icons, brand sparkle mark, Fraunces display headings, feature descriptions, live feature/pricing pill tags, dedicated CTAs with arrow hover interactions, and variant color top-borders (navy, light, gold). | 2026-09-10 |
| `LOCK-006` | **Popular Outstation Routes Grid** | `LOCKED` | `react/src/components/home/PopularRoutes.tsx`<br>`.pop-routes-section`, `.pop-route-card`, `.pop-route-badges` | 4-card responsive grid (Agra→Delhi, Agra→Jaipur, Agra→Mathura, Agra→Gwalior). Emoji icon, gold tag badge, display-font route name with gold arrow, 3 stat pills (km/duration/highway), highlight text, sedan starting price + Book ↗ CTA with query pre-fill into `/book.html`. | 2026-09-10 |
| `LOCK-007` | **Trust Roller Marquee** | `LOCKED` | `react/src/components/home/TrustRoller.tsx`<br>`.trust-roller`, `.trust-chip`, `.trust-roller-track` | 42s infinite GPU-only `translateX` marquee with 8 E-E-A-T trust chips (Govt Fleet, Verified Drivers, GST Invoice, 4.9/5 Rating, 15+ Yrs, 24x7 Support, Transparent Pricing, Chauffeur ID). Edge-fade via CSS mask, pause-on-hover, prefers-reduced-motion collapse to wrapping flex. | 2026-09-10 |
| `LOCK-008` | **Home Hero Bento Grid & Fare Widget** | `LOCKED` | `react/src/components/home/HeroBentoGrid.tsx`<br>`react/src/components/home/HeroFareWidget.tsx`<br>`.home-hero`, `.hero-fare-widget` | 3-cell living bento mosaic (Main Stage, Top Perspective, Bottom Perspective) cycling 12 destinations with independent staggered 8.0s crossfade cycles, Ken Burns micro-drift, location badge, and tabbed quick fare widget (One-Way, Round-Trip, Local Tour) with live fare engine quotes and vehicle selectors. | 2026-09-10 |
| `LOCK-009` | **Luxury Fleet Showcase Section** | `LOCKED` | `react/src/components/home/FleetSection.tsx`<br>`.fleet-section`, `.vehicle-card`, `.vehicle-photo` | 3 flagship vehicles (Sedan 01/05, Innova Crysta 03/05, Tempo Traveller 04/05) with responsive WebP image `srcset`, photo overlay tags, spec pills, starting rates, and direct vehicle booking links. | 2026-09-11 |
| `LOCK-010` | **Brand Design System & Color Tokens** | `LOCKED` | `react/src/styles/tokens.css`<br>`DESIGN.md` | **Clean White Palette:** Pure White `#FFFFFF` canvas, Warm Surface `#F8F9FA`, Crisp White `#FFFFFF` cards, Saffron Gold `#E5A044` (primary accent), Warm Gold `#D9943B` (deep accent), Soft Gold `#F5E6CC`. **Solar Dusk Dark Mode:** Deep Charcoal `#181615` canvas, `#201E1D` alternate, `#242220` card surface, `#3D3936` borders, `#FDFCFB` text. **Typography:** Fraunces display serif (`--font-display`), DM Sans clean sans (`--font-sans`), DM Mono code numerals (`--font-mono`). | 2026-09-10 |
| `LOCK-011` | **Global Chrome Suite** | `LOCKED` | `react/src/components/chrome/` | `BrandLogo.tsx` (SVG compass emblem with 30ms character scramble), `RollLink.tsx` (dual-layer golden curtain text roll), `Header.tsx` (sticky scroll detection & dropdowns), `ThemeToggle.tsx` (3D tactile toggle), `MobileNavSheet.tsx` (drawer), `StickyLeadBar.tsx` (mobile thumb bar), `RadialDock.tsx` (radial speed dial), `PageLoader.tsx` (shining text curtain 600ms buffer), `Footer.tsx` (4-column luxury footer), `SkipLink.tsx` (accessible skip to content). | 2026-09-10 |

---

## Detailed Specifications of Locked Components

### 1. `BenefitsSection.tsx` (`LOCK-001`)
- **Visual Appearance:** Pure clean canvas, 6-card bento grid with 1px border (`var(--border)`).
- **Icon Hover Animation:**
  - Card translateY(-4px)
  - Icon wrapper transforms with `scale(1.12) rotate(4deg)`
  - Background transitions to solid brand Saffron Gold (`#E5A044`)
  - Icon stroke transitions from dark charcoal (`#1A1D20`) to pure white (`#FFFFFF`)
- **Forbidden Alterations:**
  - Do NOT change the 6 card value propositions.
  - Do NOT remove the coupon pill (`ASTTCAR500OFF`) on the Exciting Offers card.
  - Do NOT change the icon transition effect or colors without user authorization.

### 2. `ContactCard.tsx` (`LOCK-002`)
- **Visual Appearance:** 2-column architectural bento card (1.3fr contact details, 1fr form).
- **Corner Markers:** 4 corner plus crosses (`.corner-plus`) rotating 90° on hover via CSS matrix transform.
- **Inquiry Form:**
  - Interactive Name, Phone, and Trip Message fields.
  - Validation error shake animation (`.input-error`).
  - Simulated 600ms dispatch submission delay.
  - Floating auto-dismiss feedback toast with checkmark and close button.
  - In-card success state with direct WhatsApp pre-filled message deep link.
- **Forbidden Alterations:**
  - Do NOT remove or modify the corner plus crosses.
  - Do NOT remove verified NAP details (`+91 98765 43210`, `bookings@skbagheltravels.in`, Taj Ganj live map link).
  - Do NOT strip the feedback toast or success card state.

### 3. `ReviewsMarquee.tsx` (`LOCK-003`)
- **Visual Appearance:** Dual opposing liquid glass marquee tracks (Row 1 scrolls left at 52s, Row 2 scrolls right at 56s).
- **Cards:** Glassmorphism surface, 5 gold Lucide star SVGs, verified traveler checkmark badge, and monogram avatar with smooth image fade-in.
- **Forbidden Alterations:**
  - Do NOT alter track scroll directions or remove pause-on-hover.
  - Do NOT remove avatar monogram fallback logic or edge-fade masks.

### 4. `Theme Tokens & Typography` (`LOCK-010`)
- **Clean White Light Mode:** Primary background `#FFFFFF`, alternate `#F8F9FA`, text `#1A1D20`, soft text `#5A626A`, border `#E8ECEF`, brand gold `#E5A044`.
- **Solar Dusk Dark Mode:** Primary background `#181615`, alternate `#201E1D`, surface `#242220`, border `#3D3936`, text `#FDFCFB`, soft text `#A8A29E`.
- **Forbidden Alterations:**
  - Do NOT introduce blue colors (navy, slate blue, indigo) or generic unbranded palettes.
  - Do NOT alter `--font-display: 'Fraunces', serif`, `--font-sans: 'DM Sans', sans-serif`, `--font-mono: 'DM Mono', monospace`.

---

## How to Request an Unlock or Modification

If a future phase task (e.g. backend wiring, marketing detail template, internationalization) appears to require changes to a locked item:
1. **Stop immediately before editing the code.**
2. **Present the proposed change to the user:**
   - Explain *what* needs to change.
   - Explain *why* the change is requested.
   - Show the exact proposed diff or preview.
3. **Wait for explicit user approval:**
   - If the user approves: update `DESIGN_LOCKS.md` with the new revision and proceed.
   - If the user declines: preserve the locked design intact and find an alternative non-destructive implementation.

---

## Amendment Log

### 2026-09-15 — Additive CSS completion (no locked design altered)

A frontend repair pass added `react/src/styles/ui-kit.css` and converted six
bare `<div>` page roots into `<main id="main-content">`. This was **purely
additive**: 17 undefined CSS custom properties were declared as aliases of the
locked LOCK-010 tokens, 87 undefined class names received their missing rules
(`.container`, `.page-hero*`, `.cta-banner-*`, `.faq-accordion-*`,
`.button-gold/secondary/block`, icon size contracts, …), and the 44–76px
campaign `h1` scale was **scoped to `.home-hero h1`** instead of applying to
every page.

Nothing in this pass re-themes, re-lays-out or restructures any locked
component. Specifically:

- `LOCK-001 … LOCK-009` — markup and class names untouched; only previously
  undefined helper classes used by their markup (`.container`, `.icon-call`,
  `.icon-wa`, `.sun`, `.moon`, `.section--paper*`, `.brand-compass-icon`,
  `.cinematic-puck-icon`, `.roll-label`, `.footer-col`) received definitions.
- `LOCK-010` — `tokens.css` and `DESIGN.md` were **not modified**. The new
  alias layer points at the locked values (`--primary: var(--gold)`,
  `--font-heading: var(--font-display)`, `--text-dim: var(--text-soft)`, …).
- `LOCK-011` — chrome components were not restructured; the new rules only
  size the icon spans and footer columns their existing markup already used.

Future edits to locked components still require the unlock protocol above.
See `react/docs/07_UI_REPAIR_REPORT.md` for the full root-cause analysis.
