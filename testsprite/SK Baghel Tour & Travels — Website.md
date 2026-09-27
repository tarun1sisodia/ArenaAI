# SK Baghel Tour & Travels — Website

Frontend for **Agra SK Baghel Tour & Travels**, built from the approved **Dark Navy + Golden** design system (`design-guide/`). Static HTML/CSS/JS. Buttons, filters, fare calculator and the 5-step booking flow all run on **mock data** — nothing is sent to a server.

Marketing pages are **bilingual SSG** (English + Hindi) with hreflang. Booking is a client-side app at `/book.html` (noindex). The original 24-slide proposal deck lives in `proposal/`.

## Product requirements

The final product requirements master document lives in
[`PRD.md`](./PRD.md) — it contains the full business goals, SEO strategy
(intent → keyword → page → content → schema → technical), design/UX system,
engineering and scalability plan, QA/launch gates, and the SEO checklist. Read it
first for "what we want." Implementation detail and architecture remain in
`02_PROJECT_CONTEXT.md`, `03_PHASE_PLAN.md`, and `04_PROGRESS_TRACKER.md`.

## Run locally

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Open `http://localhost:4173`.

## Hosting

The site is pure static HTML/CSS/JS — redady for any static host. All internal
URLs are root-relative, so when it is hosted under a subpath (e.g. GitHub
Pages project site `https://<user>.github.io/ArenaAI/`) they must be prefixed
with that subpath. The build script handles this automatically:

The production monorepo deployment topology for the React customer site, admin
panel, and Node.js API is documented in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

The TestSprite QA context, synthetic fixtures, and separate customer/admin/API
test plans are documented in [`testsprite/README.md`](./testsprite/README.md).

```bash
# GitHub Pages project site (default — uses /ArenaAI)
python3 scripts/render_pages.py

# Custom domain / repo root (e.g. agraskbagheltourandtravels.com)
SITE_BASE= python3 scripts/render_pages.py
```

The generated HTML gets the base prefix baked into every link, image and
script tag, and `js/` reads the same prefix from `<body data-base="...">` for
anything it builds at runtime.

## URLs

| Path | What it is |
|------|------------|
| `/` | English home |
| `/hi/` | Hindi home |
| `/en/agra-to-delhi-taxi/` ↔ `/hi/agra-se-delhi-taxi/` | Dedicated route pages |
| `/en/vehicles/ertiga/` | Vehicle landing |
| `/en/packages/agra-sightseeing/` | Package landing |
| `/en/services/` `/en/routes/` `/en/fleet/` … | Hub pages |
| `/book.html` | 5-step booking app (not indexed) |

Call and WhatsApp are the primary CTAs. A sticky lead bar sits on route pages (and on every marketing page on mobile). Fares are identical in both languages.

Rebuild after editing `scripts/catalog.py`, `scripts/i18n.py` or `scripts/render_pages.py`:

```bash
python3 scripts/render_pages.py
```

## Backend API

The production Node.js service lives in [`backend/`](./backend/). It owns server-authoritative fares, draft bookings, provider payments, admin dispatch, catalog, and reviews. PostgreSQL is the ledger; the browser is never trusted for amounts or payment success.

```bash
cd backend
cp .env.example .env
npm install
npm test
npm run dev
```

The API listens on `http://localhost:4000` (`GET /health`, `POST /api/v1/fares/calculate`, `POST /api/v1/bookings/draft`). See `backend/README.md` and [`docs/backend/BACKEND_ARCHITECTURE_PLAN.md`](./docs/backend/BACKEND_ARCHITECTURE_PLAN.md).

## React migration preview

The responsive React platform is being migrated beside the current static site.
It is not production cutover yet. Start its development server with:

```bash
npm install
VITE_REACT_MIGRATION_ENABLED=true npm run react:dev
```

The migration gate defaults to enabled for local development and can be
explicitly disabled in a production build until cutover is approved:

```bash
VITE_REACT_MIGRATION_ENABLED=false npm run react:build
```

To test the production build locally against GitHub Pages repository
subpath, set the base explicitly:

```bash
VITE_BASE_PATH=/ArenaAI npm run react:build
npm run react:preview
```

Production output is written to `dist/react/`; the legacy static pages remain
outside that output until the migration is approved for cutover.

## Admin panel (operations desk)

The internal admin frontend lives in [`admin/`](./admin/) — a standalone
Vite + React app on the **21st.dev** Vercel light design system with Saffron
Gold brand accents, motion.dev animations and custom SVG analytics charts.
Full spec in [`ADMIN_DESIGN.md`](./docs/admin/ADMIN_DESIGN.md) (requirements:
[`ADMIN_PRD.md`](./docs/admin/ADMIN_PRD.md), [`ADMIN_TRD.md`](./docs/admin/ADMIN_TRD.md)).

```bash
npm install --prefix admin
npm run admin:dev     # http://localhost:5174
```

Demo sign-in issues a `test-<role>` JWT principal (TRD §2.1) — pick a role to
experience the RBAC permission matrix.

## Speed notes

- No framework. Booking JS loads only on `book.html`.
- Hero WebP is ~50KB (budget ≤ 220KB), preloaded with responsive
  `imagesrcset` so phones fetch the 960px crop, not the 1920px file.
- Below-fold images are lazy-loaded responsive WebP (`-480`/`-768`
  derivatives + `srcset`/`sizes`, `decoding="async"`); every `<img>` emits
  `width`/`height` **measured from the real file at build time** (CLS = 0).
- Off-screen sections skip layout/paint (`content-visibility: auto`).
- Fonts: one Google Fonts request, `display=swap`. Hindi pages add Noto Devanagari.

## Replacing the photography

Overwrite the file at the same path (e.g. `assets/fleet/sedan.webp`,
`assets/hero/hero-highway.webp`) with your real WebP photo — any size is
fine — then run `python3 scripts/render_pages.py`. The build measures the
new image, fixes every `width`/`height`, and regenerates the responsive
derivatives automatically (needs ImageMagick;
`./scripts/make_image_derivatives.sh --force` forces a redo).
