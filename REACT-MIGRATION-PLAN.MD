# React Migration Plan

## Purpose

Migrate the customer-facing SK Baghel Tour & Travels frontend from the existing
vanilla static MPA into a React application under `react/`, while preserving the
current site as a working reference and fallback until the React replacement
passes all acceptance gates.

The existing root site remains the production baseline during migration. Do not
delete generated HTML, the Python SSG, or the existing CSS/JS until a later
cutover step is explicitly approved.

## Locked constraints

- React is introduced only inside `react/`; the root vanilla site is not
  rewritten in place.
- Frontend-only and mock-data behavior remain in scope. No live payments,
  backend, CMS, auth, or WhatsApp API is introduced by this migration.
- Preserve the bilingual English/Hindi URL map, SEO metadata, structured data,
  accessible HTML, Call and WhatsApp conversion paths, and fare parity.
- Reuse the existing design tokens and content catalogue; do not invent a new
  visual system.
- Keep `design-guide/` and `proposal/` untouched.
- Every migration phase must leave the existing root site buildable.

## Migration sequence

1. **Planning and workspace** - establish requirements, architecture, rules,
   phases, design references, and the `react/` workspace.
2. **React foundation** - add the package manifest, Vite entry points, TypeScript
   configuration, and a minimal accessible shell.
3. **Design system** - map `DESIGN.md` and `css/tokens.css` into React styles and
   shared primitives.
4. **Data and utilities** - port the catalogue and fare engine with tests for
   numeric parity against the vanilla implementation.
5. **Shared chrome** - port header, navigation, footer, toast, lead bar, and
   responsive behavior.
6. **Marketing pages** - port the home page and hubs, then route, vehicle, and
   package pages from data.
7. **Booking flow** - port the five-step mock booking flow and session storage
   behavior without enabling real charges.
8. **SEO and deployment** - produce crawlable bilingual output, metadata,
   structured data, redirects, and a deployment preview without changing the
   production baseline.
9. **Parity and cutover review** - run link, accessibility, visual, responsive,
   performance, and booking checks; cut over only after explicit approval.

## Definition of done for the migration

- React output covers every required page and language in the URL map.
- Fare values, booking state, contact details, and primary CTAs match the
  reference site.
- Core text is server-rendered or statically generated and remains crawlable.
- No horizontal overflow exists at the required mobile widths.
- Reduced-motion, keyboard, focus, and no-JavaScript fallback requirements pass.
- Existing build and link checks remain green until cutover.

