# React migration workspace

This directory contains the parallel React implementation described in
[`../REACT-MIGRATION-PLAN.MD`](../REACT-MIGRATION-PLAN.MD).

## Local development

```bash
npm install
npm run dev
```

Run `npm run typecheck` for the foundation type check and `npm run build` for a
production build. The root vanilla static MPA remains the working reference
until the migration passes all parity and quality gates.

## Source ownership

```text
src/app/         application composition, routes, prefetching
src/components/  shared presentational components
src/data/        typed catalogue and contact data
src/features/    stateful booking, contact, and catalogue behavior
src/layouts/     page-wide shells
src/pages/       route-level page composition
src/styles/      tokens and global styles
src/utils/       pure formatting and URL helpers
```
