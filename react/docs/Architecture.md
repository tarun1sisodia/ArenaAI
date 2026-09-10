# React Architecture

## Scope

The React application is a parallel implementation in `react/`. The existing
root-level vanilla MPA remains the reference implementation during migration.

## Technical stack

- React with TypeScript
- Vite for local development and production bundling
- React Router only if the chosen static deployment requires client routing
- Static generation or prerendering for marketing pages
- CSS modules or colocated CSS backed by the existing design tokens
- Existing catalogue and fare rules, ported into typed modules
- No component framework, animation library, CMS, backend, or live payment SDK
  unless a later phase explicitly approves it

## Runtime flow

1. The browser requests a localized marketing or booking URL.
2. Static output serves semantic HTML, metadata, and structured data.
3. React hydrates only where interaction is required.
4. Shared typed data supplies navigation, catalogue cards, fares, and booking
   defaults.
5. User actions call pure utilities and local mock state.
6. Call and WhatsApp links remain usable without React JavaScript.

## Target structure

```text
react/
  README.md
  package.json
  tsconfig.json
  vite.config.ts
  src/
    app/
      App.tsx
      routes.tsx
    components/
      Chrome.tsx
      ErrorBoundary.tsx
    data/
    features/
      booking/
      contact/
      catalogue/
    layouts/
      SiteLayout.tsx
    pages/
      HomePage.tsx
    styles/
    utils/
    main.tsx
```

The directory structure is created from the start. Each folder has a clear
ownership boundary; README files are used only where a feature directory is
not yet populated with runtime code.

## Boundaries

- `react/src/data` owns typed client data and must remain language-agnostic for
  prices.
- `react/src/utils` owns pure fare, URL, and formatting helpers.
- `react/src/components` contains reusable presentational components.
- `react/src/features` contains stateful user flows.
- `react/src/pages` contains route-level composition, not duplicated primitives.
- SEO metadata and structured data belong to route-level layouts or the static
  generation layer, never only to a client-side effect.
