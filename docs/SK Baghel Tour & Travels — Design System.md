# SK Baghel Tour & Travels — Design System

**Status:** Canonical visual and interaction design  
**Applies to:** Customer site and Admin panel  
**Last reviewed:** 2026-10-09

## 1. Design intent

The Customer site should feel like a trustworthy, premium local travel operator: clear fares, strong photography, calm editorial hierarchy, and immediate human contact. The Admin panel should feel like a focused operations desk: dense enough for work, readable, predictable, and explicit about status/errors.

Visual design must never hide business state. A draft, failed release, stale price, unavailable route, and successful deployment must look different.

## 2. Customer visual direction

The current approved direction is **Vercel Light Mode with Saffron Gold brand accent**, with the existing Solar Dusk dark mode preserved where implemented.

### Core colors

| Token | Value | Use |
|---|---|---|
| Background | `#FFFFFF` | Primary canvas |
| Background alternate | `#FAFAFA` | Section separation |
| Primary text | `#0A0A0A` | Headings/body |
| Muted text | `#737373` | Supporting text |
| Saffron Gold | `#E5A044` | Primary CTA/focus/active state |
| Gold deep | `#B27123` | Hover and accessible text |
| Gold wash | `#FDF7ED` | Highlight surfaces |
| Border | `rgba(0,0,0,0.08)` | Hairlines/dividers |
| Success | `#2E7D32` | Confirmed/published states |
| Error | `#C62828` | Errors and destructive states |
| Teal | `#3F7A74` | Limited supporting accent only |

Do not introduce a second primary accent. WhatsApp may be labeled and linked normally but the global lead bar remains brand-controlled.

### Typography

- Display/headings/fares: Fraunces, weight 500–600.
- UI/body: Geist, Inter, or DM Sans according to the existing loaded token stack.
- Code/eyebrow/chips: DM Mono, uppercase with controlled tracking.
- Hindi display: Noto Serif Devanagari.
- Hindi body: Noto Sans Devanagari.
- Essential content must remain readable if a web font fails.

Recommended hierarchy:

| Element | Size guidance |
|---|---|
| Page H1 | `clamp(1.75rem, 2.8vw, 2.25rem)` for compact subpages; larger hero only where composition requires it |
| Section H2 | `clamp(1.35rem, 2vw, 1.65rem)` |
| Card H3 | `1.05rem–1.15rem` |
| Body | `16px`, line-height about `1.6` |
| Lead | `15px–17px`, line-height about `1.6` |
| Eyebrow | `12px–13px`, uppercase/mono |
| Touch target | minimum `44px` |

The existing `docs/project/DESIGN.md` token values and `react/src/styles/tokens.css` must stay synchronized. If a token changes, update the canonical document first.

## 3. Layout and components

- Maximum content container: approximately `1140px`.
- Desktop header: approximately `78px`; mobile header: approximately `64px`.
- Grid collapses at the existing responsive breakpoints; do not design only for desktop.
- Default radius is restrained; pills are reserved for filters/chips.
- Avoid heavy shadows; use hairlines, whitespace, and restrained hover elevation.
- Use one consistent button family: primary gold, outline, text/underlined.
- Lead actions: Call, WhatsApp, Book; sticky on route pages and small screens where appropriate; hidden on the noindex booking funnel.
- Route cards emphasize origin/destination, distance, fare, and action.
- Package cards emphasize image, duration, starting price, and inclusions.
- Local/transfer cards emphasize product type, route/code, fleet prices, and availability.
- Detail pages show trust, transparent commercial breakdown, FAQs, and a clear booking/contact action.

## 4. Customer state design

Every dynamic component needs deliberate states:

| State | Required presentation |
|---|---|
| Loading | reserved layout/skeleton without shifting primary content |
| Published | normal content and CTA |
| Draft/unavailable | never shown as public content; use 404/unavailable page |
| Stale | explain that the offer changed and ask customer to refresh |
| API error | readable message and Call/WhatsApp recovery action |
| Empty search | explain no match and offer broader search/contact |
| Booking success | clear reference, next step, and support contact |
| Booking/payment pending | explicit pending status, never “paid” by assumption |

## 5. Admin visual direction

Admin is an operations application, not a marketing page.

- Use high information density without tiny inaccessible text.
- Put status, code, version, updated time, and last release state near the entity title.
- Make destructive actions visually distinct and confirm them where irreversible.
- Display field-level validation beside the field and a request-level summary at the top.
- Disable duplicate submit while a command is in progress.
- Show draft/published/archived with consistent badges.
- Show publication as a timeline, not one optimistic toast.
- Prefer tables, filters, tabs, dialogs, and predictable keyboard navigation.
- Maintain minimum 44px targets for primary actions.

## 6. Forms and field behavior

- Labels describe business meaning, not database names.
- Slug/code is visible and stable after publication; editing name must not silently change it.
- Number fields show currency/unit (`₹`, km, hours) explicitly.
- Fleet price fields use the canonical five tiers in the same order everywhere.
- Nested fields such as extra rates show which fleet they belong to.
- Publish action explains that it changes the public site and may trigger a release.
- Errors show the exact field and accepted range/value.
- A successful save returns the persisted values from Backend; the form must not assume its own local state is authoritative.

## 7. Accessibility

- Semantic headings have one logical H1 per page.
- All form fields have labels and useful error text.
- Focus is visible with the gold focus token and sufficient contrast.
- Keyboard navigation works through dialogs, menus, filters, and booking steps.
- Images have meaningful alt text; decorative images are marked decorative.
- Respect `prefers-reduced-motion`.
- Hindi text must use appropriate language attributes and not be clipped by fixed heights.
- Status changes are announced where appropriate.

## 8. SEO and content presentation

- Essential route/package/tour/monument facts are in server/prerendered HTML.
- Every intended page has unique title, description, canonical, structured data, and language alternates.
- Booking funnel is noindex.
- Do not render a generic MarketingPage for a missing typed entity.
- Sitemap, internal links, and page resolver use the same public identifier source.
- Fares must be identical between EN and HI; translate supporting copy only.

## 9. Media

- Images have stable URLs before publication.
- Upload status is visible in Admin.
- Gallery order, cover image, caption, and alt text are persisted and included in the public DTO.
- Missing media uses an explicit documented placeholder; it must not hide an otherwise failed publication.
- Build/deploy must verify that public media URLs are reachable or mark the release failed.

## 10. Design change rule

Before changing a locked component or token:

1. inspect `docs/project/DESIGN_LOCKS.md` and existing design locks;
2. state the reason and affected pages;
3. update this document and token source;
4. test desktop, mobile, keyboard, reduced motion, EN, and HI;
5. obtain user review for a material visual change.
