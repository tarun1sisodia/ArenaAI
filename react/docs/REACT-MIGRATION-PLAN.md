# SK Baghel Tour & Travels — Responsive React Migration Plan

**Status:** Proposed plan only  
**Scope:** Responsive customer web app for desktop, tablet, and mobile  
**Architecture target:** React + TypeScript + Vite static build  
**Authentication:** None; every visitor can browse, calculate fares, enquire, and use mock booking  
**Payments:** Mock only; no live Razorpay or real charges  
**Primary domain:** `https://agraskbagheltourandtravels.com`

## 1. Product direction

Build one responsive web application, not separate desktop and mobile websites. The
same React components, routes, fare engine, forms, and booking flow will adapt
through CSS breakpoints and touch-first interaction patterns.

The current website is the visual and content source of truth. The migration must
preserve the approved design tokens, bilingual English/Hindi SEO pages, published
services, LocationIQ search, fares, Call/WhatsApp conversion paths, and mock
booking behavior. No unrelated MakeMyTrip marketplace features will be added.

## 2. Recommended architecture

Use a static React + TypeScript application rather than a server-rendered React
framework in the first migration:

- **React + TypeScript:** shared components and type-safe state.
- **Vite:** fast local development and deterministic static production output.
- **React Router:** localized route handling for `/en/`, `/hi/`, hubs, routes,
  vehicles, packages, and `/book`.
- **Static generation/build data:** preserve crawlable English and Hindi HTML for
  marketing pages. Client-only rendering is not acceptable for primary SEO copy.
- **CSS tokens and responsive CSS:** migrate `css/tokens.css`, `site.css`, and
  `components.css` into organized React-compatible styles without changing the
  visual system.
- **No authentication layer:** no accounts, login, user profiles, or protected
  routes.
- **Browser-only persistence:** retain `sessionStorage` for the mock booking draft.
- **LocationIQ:** runtime-configured public token; never commit the supplied token
  to source control. Production should use a deployment-injected configuration or
  a user-provided browser token.

If full static generation cannot preserve the current SEO output cleanly, pause
before implementation and evaluate Astro or another static React-compatible
renderer. Do not sacrifice crawlable HTML merely to use React.

## 3. Migration principles

1. Migrate behavior before redesigning behavior.
2. Preserve all current fares numerically in English and Hindi.
3. Preserve the current design tokens; do not invent colors, sizes, spacing, or
   radii outside `DESIGN.md`.
4. Keep critical copy, fares, route names, vehicle details, and contact data in
   initial HTML where SEO pages require them.
5. Use progressive enhancement for search, filters, accordions, theme switching,
   and booking interactions.
6. Keep all touch targets at least 44px.
7. Respect `prefers-reduced-motion`; no animation may block content or navigation.
8. Keep Call and WhatsApp usable even if JavaScript fails.
9. Do not migrate payments, authentication, CMS, admin, or backend functionality.
10. Implement exactly one roadmap step at a time and update
    `04_PROGRESS_TRACKER.md` after each completed step.

## 4. Phases and steps

### Phase R0 — Approval and baseline

**Goal:** Freeze the current behavior and define the migration boundary.

1. Approve React migration over incremental vanilla responsive fixes.
2. Record the architecture deviation from the locked vanilla MPA decision.
3. Inventory all current routes, generated pages, scripts, data objects, schemas,
   forms, and assets.
4. Capture baseline behavior for fares, query-parameter booking hydration,
   LocationIQ search, theme switching, language links, Call/WhatsApp links, and
   `sessionStorage`.
5. Define the React URL contract and redirect behavior for legacy `.html` hubs.

**Acceptance:** route inventory and behavior baseline are documented; migration
scope is approved; no implementation has started prematurely.

### Phase R1 — React foundation and build

**Goal:** Create the new application without changing customer behavior.

1. Add the React/TypeScript/Vite project foundation and scripts.
2. Configure static output, path handling, custom-domain deployment, and local
   preview.
3. Add strict TypeScript settings and import aliases.
4. Establish the React app shell and error boundary.
5. Add the existing tokens and global styles as the first CSS layer.
6. Add a typed configuration module for site URL, NAP, and runtime LocationIQ
   configuration.
7. Add a migration-only development flag so the legacy static site remains
   available until cutover.

**Acceptance:** React app starts, builds static output, serves at the custom
domain root, and does not expose secrets.

### Phase R2 — Data, fares, and shared utilities

**Goal:** Create one typed source for all current business behavior.

1. Convert catalogue data into typed cities, routes, vehicles, packages, reviews,
   NAP, and service definitions.
2. Port `js/fares.js` into a pure typed fare engine.
3. Add unit coverage for one-way, round-trip, local, package, night allowance,
   300km/day, promo, advance, remaining, and invalid-pair behavior.
4. Add typed URL/query-param parsers and safe URL builders.
5. Add bilingual copy types and language dictionaries.
6. Add typed `sessionStorage` serialization for the booking draft.

**Acceptance:** React fare output matches the current published fare output for
all supported routes and packages in both languages.

### Phase R3 — Design system and responsive primitives

**Goal:** Make desktop and mobile use the same component system.

1. Convert design tokens into the React CSS architecture.
2. Build responsive container, stack, grid, button, card, form-field, table,
   modal/sheet, toast, and typography primitives.
3. Implement mobile-first breakpoints from `DESIGN.md`.
4. Build accessible focus, keyboard, reduced-motion, and touch-target rules.
5. Add responsive image and aspect-ratio helpers to prevent layout shift.
6. Port theme switching and anti-FOUC behavior.
7. Port only approved motion patterns after checking `ANIMATION_RULES.md`.

**Acceptance:** primitives work at 320px, 360px, 390px, 768px, 1024px, and
1440px with no horizontal page overflow.

### Phase R4 — Shared chrome and navigation

**Goal:** Make the app shell consistent across every page and viewport.

1. Build the responsive header and desktop navigation.
2. Build the keyboard-accessible mobile navigation sheet.
3. Build language switching and localized route links.
4. Build sticky Call/WhatsApp/Book lead bar behavior.
5. Build footer, contact tiles, skip link, toast, and 404 recovery UI.
6. Preserve no-JavaScript Call and WhatsApp fallbacks in rendered HTML.

**Acceptance:** navigation is usable by keyboard and touch; no header or lead-bar
overflow occurs in English or Hindi.

### Phase R5 — Marketing pages and SEO output

**Goal:** Recreate the current content as crawlable React-driven pages.

1. Build home page sections from existing content and assets.
2. Build Services, Routes, Packages, Fleet, About, Contact, FAQ, Privacy, and
   Terms hubs.
3. Build route, vehicle, and package detail templates from typed data.
4. Generate English and Hindi localized URLs.
5. Port title, description, canonical, hreflang, Open Graph, Twitter, and
   JSON-LD output.
6. Port BreadcrumbList, LocalBusiness/TaxiService, FAQPage, and service schemas.
7. Generate sitemap, robots, and legacy redirect stubs.

**Acceptance:** every intended page has crawlable content, one H1, valid metadata,
valid schema, working language alternates, and no unintended duplicate URLs.

### Phase R6 — LocationIQ and interactive discovery

**Goal:** Make location search reliable on touch and desktop.

1. Port the current LocationIQ autocomplete flow into typed React hooks.
2. Preserve local destination fallback when LocationIQ is unavailable.
3. Add debounce, loading, empty, error, and retry states.
4. Keep the token runtime-configured; never hardcode the supplied token.
5. Support city, airport, landmark, hotel, and pickup-point searches.
6. Preserve custom-location selection and fare estimation behavior.
7. Verify keyboard navigation and screen-reader labels for comboboxes.

**Acceptance:** LocationIQ search works on mobile and desktop when configured;
local fallback and fare calculation work when it is unavailable.

### Phase R7 — Fare calculator and booking app

**Goal:** Deliver the complete responsive customer conversion flow.

1. Build the home/routes fare calculator.
2. Build booking steps: Route, Vehicle, Details, Advance, Ticket.
3. Preserve query hydration from home, routes, packages, and vehicle pages.
4. Preserve back navigation and `skb-booking` session state.
5. Preserve mock UPI/card verification and `AGR-` ticket generation.
6. Add inline validation, accessible errors, loading states, and recovery paths.
7. Keep payment clearly marked as a frontend demo with nothing charged.
8. Optimize the stepper, vehicle cards, forms, and ticket for thumb use.

**Acceptance:** a user can complete the mock booking on a phone viewport and
desktop viewport with identical fare results and no console errors.

### Phase R8 — Responsive QA and accessibility

**Goal:** Prove the single platform works across devices.

1. Run page-by-page browser tests at 320, 360, 390, 768, 1024, 1280, and 1440px.
2. Test English and Hindi at every major page type.
3. Detect horizontal overflow and clipped/fixed content automatically.
4. Test keyboard navigation, focus order, Escape behavior, and screen readers.
5. Test reduced motion and dark/light themes.
6. Test slow network, LocationIQ failure, JavaScript-disabled fallback links,
   empty states, and invalid booking input.
7. Verify image loading, CLS, LCP, and mobile interaction responsiveness.

**Acceptance:** zero horizontal overflow, no blocked critical path, no severe
accessibility defects, and all current browser flows remain functional.

### Phase R9 — Regression, cutover, and deployment

**Goal:** Replace the old frontend safely.

1. Run the static build, link audit, quality audit, schema audit, and browser
   regression suite.
2. Compare old and new fares, page counts, URL paths, metadata, and NAP.
3. Deploy a preview build and perform manual mobile/desktop approval.
4. Switch production to the React build only after acceptance is explicitly
   confirmed.
5. Preserve rollback access to the legacy generated site until the new build is
   stable.
6. Update README, operating docs, architecture context, and tracker.
7. Remove legacy code only in a separate approved cleanup step.

**Acceptance:** production serves the React build, all required URLs work, no
secrets are committed, and rollback remains possible.

## 5. Explicitly out of scope

- User authentication, accounts, profiles, or login.
- Admin dashboard or CMS.
- Live Razorpay, payment capture, refunds, or webhooks.
- Live driver dispatch, trip tracking, or driver accounts.
- WhatsApp Cloud API or n8n automation.
- Native Android/iOS apps.
- Marketplace inventory, airline/train booking, hotel booking, or unrelated
  MakeMyTrip features.
- A separate mobile codebase.

## 6. Definition of done for the migration

The migration is complete only when the user confirms each phase, and all of the
following are true:

- One React codebase serves mobile, tablet, and desktop.
- Existing design language and published service scope are preserved.
- English/Hindi SEO pages remain crawlable and correctly linked.
- LocationIQ works with runtime configuration and safe fallback behavior.
- Fares match the current engine.
- Mock booking works end-to-end without authentication or real payment.
- Call and WhatsApp remain primary conversion actions.
- 44px touch targets, keyboard access, reduced motion, and no horizontal overflow
  pass the responsive QA matrix.
- Static build, link audit, quality audit, and browser regression checks pass.
