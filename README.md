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

```bash
# GitHub Pages project site (default — uses /ArenaAI)
python3 scripts/render_pages.py

# Custom domain / repo root (e.g. skbagheltravels.in)
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

The React build defaults to the custom-domain root. To test a project-site
subpath, set the base explicitly:

```bash
VITE_BASE_PATH=/ArenaAI npm run react:build
npm run react:preview
```

Production output is written to `dist/react/`; the legacy static pages remain
outside that output until the migration is approved for cutover.

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
