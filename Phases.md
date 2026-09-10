# React Migration Phases

Each phase depends on the previous phase's acceptance criteria. The root
vanilla site remains buildable throughout.

1. **Planning and documentation** - migration contract and workspace.
2. **Foundation** - package, TypeScript, Vite, entry point, and shell.
3. **Design system** - tokens, typography, buttons, cards, forms, and motion
   safety.
4. **Data parity** - typed catalogue, NAP, routes, packages, vehicles, and fare
   calculations.
5. **Shared chrome** - header, mobile navigation, footer, toast, lead bar, and
   contact behavior.
6. **Marketing pages** - home, services, routes, packages, fleet, about,
   contact, FAQ, privacy, and terms.
7. **Detail pages** - localized route, vehicle, and package landing pages.
8. **Booking app** - five-step mock flow, query hydration, persistence, and
   ticket generation.
9. **SEO and static output** - prerendered HTML, schema, canonical/hreflang,
   sitemap, redirects, and 404 behavior.
10. **Quality and cutover** - link, accessibility, responsive, performance,
    visual, and parity audits followed by an explicit cutover decision.

## Current acceptance gate

Phase 1 is complete when `REACT-MIGRATION-PLAN.MD`, `Architecture.md`,
`Rules.md`, `Phases.md`, `Design.md`, `PRD.md`, and `react/README.md` explain
the same migration boundaries and the tracker records the next foundation step.

