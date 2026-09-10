# React Design Reference

The existing root [`DESIGN.md`](./DESIGN.md) is the authoritative visual
specification. This file narrows its application to the React migration and
must not introduce competing tokens.

## Implementation guidance

- Import or mirror values from `css/tokens.css`; do not hard-code new colors,
  radii, typography sizes, or spacing values.
- Keep the current light clean-white canvas, neutral charcoal text, and
  Saffron Gold accent unless the source design document changes.
- Preserve Fraunces display type, the approved UI font stack, Devanagari font
  handling, and the existing responsive breakpoints.
- Preserve the three button variants, 44px controls, route lead bar, and
  accessible focus ring.
- Keep animation subtle, GPU-safe, and disabled by the reduced-motion media
  query as required by `ANIMATION_RULES.md`.

## React component mapping

| Existing surface | React target |
|---|---|
| Header and mobile sheet | `Header`, `MobileNavigation` |
| Lead bar | `LeadBar` |
| Route/vehicle/package cards | Typed catalogue card components |
| Contact and booking forms | Feature-local form components |
| Toast and validation feedback | Shared feedback primitives |
| Existing page sections | Semantic section components |

The migration must match the existing visual output before any redesign is
considered.

