# 07 — Frontend UI Repair Report (routes / services / fleet / and more)

Date: 2026-09-15 · Scope: customer React app (`react/`), all public routes (EN + HI + book + 404)
Symptom reported: *“pages have very big font and CSS is not applied”* on routes, services, fleet and other pages.

---

## 1. Root causes (all reproduced from the source tree)

| # | Root cause | Evidence | Impact |
|---|---|---|---|
| 1 | **17 CSS custom properties were referenced but never declared.** `color: var(--text-dim)` (43 uses), `border-radius: var(--radius-lg)` (33 uses), `var(--primary)` (26), `var(--radius-md)` (24), `var(--text-muted)` (13), `var(--font-sans)`/`var(--font-heading)` (12 each), `var(--radius-xl)`, `var(--gold-dark)`, `var(--surface-muted)`, `var(--bg-card)`, `var(--error)`, … | `grep` of `react/src/styles/global.css` vs `tokens.css` | CSS drops the whole declaration (**invalid at computed-value time**) → colours, radii and fonts silently vanish. This is the single biggest reason pages looked “unstyled”. |
| 2 | **`.container` had no definition at all**, yet every hub page, the header and the footer wrap their content in it. | `grep -c '\.container[ ,{:]' global.css` → `0` | No max-width / centring contract; hero and section content sat flush to the shell edge. |
| 3 | **7 page roots rendered a bare `<div>` instead of `<main>`** (Contact, FAQ, Privacy, Terms, Route-Detail, 404, Vehicle-Detail shell). The layout shell only constrains `main` (`width: min(100% - 48px, 1140px)`), so those pages **escaped the layout grid completely** and spanned the full viewport. They also had no `id="main-content"`, so the skip-link had no target. | `main` selector in `global.css:90`; page-level `return` statements | Full-bleed, un-gutterised pages → the “CSS is not applied” look. |
| 4 | **The global `h1` was `clamp(44px, 6vw, 76px)`** — the home-hero campaign scale — and leaked onto every content page that lacked a hero-specific override. `.page-hero__title` was undefined. | `global.css:3557` | 76px body headlines on contact / FAQ / privacy / terms / route detail. |
| 5 | **87 class names used by JSX had no CSS rule** (`.page-hero*`, `.cta-banner-*`, `.button-gold`, `.button-secondary`, `.button-block`, `.section-lead`, `.faq-accordion-*`, `.live-dot`, `.form-row`, `.footer-col`, `.footer-brand`, `.icon-call`, `.icon-wa`, `.sun`, `.moon`, `.stat-icon`, …). | scripted class-coverage audit (`1126` used vs `1087` defined) | Hero, CTA band, FAQ accordion, footer columns and icon slots rendered as unstyled text. |
| 6 | **Inline `<svg>` children had no size contract.** Icons live in `<span class="icon …">` wrappers that had no CSS, so bare SVGs fell back to the replaced-element default (**300 × 150 px**). | `Header.tsx`, `RadialDock.tsx`, `ThemeToggle.tsx`, `ContactPage.tsx` toast | Oversized glyphs on chrome + contact surfaces. |
| 7 | **No font stylesheet was linked anywhere.** `index.html` preconnected to `fonts.googleapis.com` but never requested a font. | `grep -r fonts.googleapis react/src react/index.html` | The whole locked type system (Fraunces / DM Sans / DM Mono / Noto Devanagari) silently fell back to system fonts. |
| 8 | Detail/home section titles (`h2.section-title`, `.marketing-hero h1`, `.booking-heading h1`) had no rule → inherited the 52–76px marketing clamp. | `grep -c '\.section-title[ ,{:]'` → `0` | More “very big font”. |

---

## 2. What was changed

### 2.1 `react/src/styles/ui-kit.css` (new — imported last in `main.tsx`)
A single, reviewable repair layer with 15 sections:

1. **Token bridge** — declares every missing custom property, mapping each one onto the locked brand tokens (`--text-dim → --text-soft`, `--radius-lg → 12px`, `--primary → --gold`, `--font-heading → --font-display`, …). Nothing re-themes LOCK-010; the aliases simply point at the locked values.
2. **Layout primitives** — `.container`, `.page-shell`, `.text-center`, `.section-header` / `.section-blurb` / `.section-lead` / `.section-subtitle`, `.form-row`, section modifiers (`.section--paper`, `.section--paper-alt`, `.section--navy`).
3. **Typography repair** — `.page-hero__title` gets an editorial scale (`clamp(1.875rem, 3.4vw, 2.875rem)`), the 44–76px campaign scale is now scoped to `.home-hero h1` (LOCK-008 kept intact), `.cta-banner-title` and `.section-title` get content scales.
4. **Page hero** — `.page-hero`, `.page-hero__badge`, `.page-hero__title`, `.page-hero__lead`, `.live-dot` (+ dark mode).
5. **Buttons** — one `.button` base (44px min-height, gold primary) plus `primary/gold/outline/light/secondary/ghost` and `sm/xs/block` modifiers, hover/active/focus/disabled states, dark mode.
6. **Icon contract** — `.icon`, `.icon-call`, `.icon-wa`, `.icon-car`, `.icon-compass`, `.icon-action`, `.cinematic-puck-icon`, `.brand-compass-icon` and every icon-bearing wrapper are pinned to an explicit box; bare SVG children are capped at `1em`.
7. **CTA banner** — `.cta-banner-box/content/tag/title/desc/buttons` (gradient gold-wash band, radial accent, responsive collapse).
8. **FAQ accordion** — `.faq-accordion-wrap/item/trigger/q/chevron/body` using a `grid-template-rows: 0fr → 1fr` height animation (no JS measuring), plus the `contact-toast__*` / `channel-card__content` aliases where JSX and CSS disagreed on `__` vs `-` naming.
9. **Card / detail repairs** — `.route-card-top/bottom`, `.service-deep-card-top`, `.rate-pill-wrap`, `.stat-icon`, `.spec-row`, `.separator`, `.inc-box-included/excluded`, `.inclusions-col`, `.exclusions-col`, `.veh-hero-media/info`, `.veh-card-action`, `.office-content`, `.pet-banner-content`, `.contact-card-header`, `.hero-location-text`, `.gold-dot`.
10. **Chrome repairs** — additive only: `.btn-outline--light`, `.has-dropdown` caret, `.sun`/`.moon` sizes, `.roll-label`, `.footer-col`, `.footer-brand`, `.footer-bottom-actions`, `.cinematic-puck-icon` (LOCK-011 markup untouched).
11. **Migration / error shells** — `.migration-*`, `.primary-action`, `.secondary-action`, `.error-details`, `.actions`, `.call-link`.
12. **Analytics board** — `.board` + `.board__head/title/grid/cell/label/value/delta/spark/bars/bar-row/bar-label/bar-track/bar-fill/bar-value/foot/legend` with dark mode and mobile re-flow.
13. **Motion utilities** — `.reveal`, `.hover-lift`, icon tiles, scroll-progress bar.
14. **Reduced-motion gate** — global zero-motion fallback (ANIMATION_RULES §3).
15. **Responsive + overflow guards** — container/hero/CTA mobile rules, `img, video { max-width: 100% }`, long-word guards for EN/HI strings.

### 2.2 Page repairs
- 6 bare `<div>` roots converted to `<main id="main-content" className="…-page">` (skip-link targets restored, pages re-enter the layout shell). VehicleDetailPage keeps its inner `<main>` and only received a shell wrapper.
- `ContactPage`, `FaqPage`, `PrivacyPage`, `TermsPage`, `RouteDetailPage`, `NotFoundPage`, `FleetPage`, `VehicleDetailPage`: emoji glyphs replaced with the inline SVG icon set.

### 2.3 Brand type system
`react/index.html` now requests Fraunces, DM Sans, DM Mono and the Noto Devanagari families (`display=swap`) — the preconnect block was already there but no stylesheet ever followed it. The prerenderer reuses `dist/index.html` as its template, so all 75 pre-rendered pages inherit the link.

---

## 3. New shared UI kit (`react/src/components/ui/`)

| Module | Exports | Notes |
|---|---|---|
| `motion.tsx` | `useHydrated`, `Reveal`, `Stagger`, `StaggerItem`, `CountUp`, `Parallax`, `Tilt`, `Press` | motion.dev primitives. **SSR-safe:** they render a plain element until hydration, so the pre-rendered DOM is never opacity-hidden (ANIMATION_RULES §1). Reduced-motion short-circuits to zero motion. |
| `Button.tsx` | `Button` | `<a>`/`<button>` with the `.button` class contract + motion.dev spring hover/press. |
| `Icon.tsx` | `Icon`, `IconTile`, `IconName` (~44 names) | Dependency-free stroke icon set, 24×24, `currentColor`, decorative by default. |
| `AnalyticsBoard.tsx` | `AnalyticsBoard`, `BoardMetric`, `BoardBar` | The “analytics board”: hairline metric grid with animated sparklines and count-up values, or ranked comparison bars with animated fills. Numbers are always present in the DOM for crawlers. |
| `ScrollProgress.tsx` | `ScrollProgress` | rAF + `transform: scaleX` reading-progress bar — intentionally dependency-free so the motion runtime never enters the main bundle. |

### Where they are wired in
| Page | Integration |
|---|---|
| **Routes** | Fare Intelligence Board (corridor count, average km, average ₹/km, fastest corridor + 6 ranked fare bars), staggered route-card grid, SVG stat icons in the live calculator, motion hero CTAs. |
| **Services** | Staggered 6-card service grid, Service Coverage Board (verticals, fleet classes, max seat capacity, cities served + allocation guide bars), paw icon on the pet banner. |
| **Fleet** | Staggered vehicle grid and standards pillars, Fleet Benchmark Board (per-km rate per vehicle with seats/luggage trend chips + sparklines), SVG spec badges / model chips / spec tiles. |
| **Contact / FAQ / Privacy / Terms / Route-Detail / 404** | Page hero, CTA band, FAQ accordion and icon slots restored by the CSS layer + SVG CTA icons. |

---

## 4. Verification performed

| Gate | Result |
|---|---|
| `npm --prefix react run typecheck` (`tsc --noEmit`) | ✅ 0 errors |
| `npm --prefix react run build` (+ SSG prerender) | ✅ 75 pages + 10 redirects, 0 errors |
| `npm --prefix admin run build` | ✅ 0 errors |
| Class-coverage audit (JSX classes vs stylesheets) | ✅ 87 missing → 1 (a template-literal prefix false positive) |
| Undefined CSS variable audit | ✅ 17 → 0 |
| Prerendered HTML audit | ✅ every page: exactly 1 `<h1>`, exactly 1 `<main id="main-content">` |
| Font stylesheet present in prerendered HTML | ✅ |
| Backend tests | ✅ 41 passed / 2 failed — both pre-existing env-dependent MongoDB Atlas tests (no credentials in this sandbox), unrelated to the frontend change |

**Not verified (sandbox limitation):** the Chromium download is blocked here, so no screenshot/pixel diff was produced. Visual verification should be done on the live preview (`npm run customer:dev`, port 5173) or by running `scripts/visual_audit.mjs` on a machine with a browser.

---

## 5. Follow-ups worth doing next

1. Run the responsive screenshot sweep at 360 / 390 / 768 / 1024 / 1440 px in EN + HI and file any residual overflow.
2. Replace the remaining typographic emoji in the deep detail pages (route/package/vehicle guides still use a few inline emoji as bullets).
3. Consider self-hosting the Fraunces/DM Sans woff2 subsets to remove the render-blocking third-party font CSS (already flagged in `06_AUDIT_REPORT.md`).
4. Wire the admin analytics board onto the same `.board` token language so the two surfaces stay visually aligned.
