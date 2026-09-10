# React Migration Rules

## Required

- Read `PRD.md`, `02_PROJECT_CONTEXT.md`, `DESIGN.md`, and the current tracker
  before each migration step.
- Implement one migration step at a time and update `04_PROGRESS_TRACKER.md`.
- Keep the root vanilla site buildable and do not hand-edit generated pages.
- Use strict TypeScript and explicit error states.
- Keep business rules pure and testable; preserve fare parity with `js/fares.js`.
- Use semantic HTML, one H1 per page, keyboard-accessible controls, visible
  focus states, and 44px minimum touch targets.
- Preserve localized URLs, canonical/hreflang metadata, schema, and crawlable
  content.
- Respect `prefers-reduced-motion`; animate only approved transform and opacity
  properties.

## Allowed

- React, TypeScript, Vite, and the minimum tooling required by the migration.
- Small reusable primitives and feature-local state.
- Static generation or prerendering needed to retain SEO.
- Mock data and `sessionStorage` for the existing booking experience.

## Prohibited

- Do not add live Razorpay, server APIs, authentication, CMS, or WhatsApp Cloud
  API.
- Do not add GSAP, Framer Motion, Three.js, or another heavy animation library.
- Do not hide essential SEO text behind client-only rendering.
- Do not silently change fares, NAP data, URL slugs, or the design system.
- Do not delete the vanilla implementation, generated output, or source archives.
- Do not use broad catches, silent fallbacks, unsafe casts, or `any` to bypass
  type errors.

## Error handling

Validate user input at the boundary, show an accessible inline error, and keep
the invalid field associated with its message. Unexpected errors must be
surfaced through the project error boundary or an explicit error state; never
pretend a failed operation succeeded.

