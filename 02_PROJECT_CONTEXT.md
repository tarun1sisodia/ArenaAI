# Project Context — SK Baghel Town & Travels

This file is the single source of truth for architecture decisions. It should stay
almost static; if the AI deviates from it, that deviation must be logged in
`04_PROGRESS_TRACKER.md`'s Decision Log, not made silently.

## 1. What this site is

A premium customer-facing website for **Agra SK Baghel Town & Travels**. North
star: *make travel feel easy before the journey even begins.* Taxi / cab, Tempo
Traveller, Innova, and tour packages out of Agra. Frontend only on this pass:
every button, form and flow works against **mock data**.

Canonical domain: `https://skbagheltravels.in`

## 2. Tech stack — decided, do not re-litigate mid-build

| Concern | Choice | Why |
|---|---|---|
| Architecture | Vanilla static MPA (HTML + CSS + JS) | Design-guide handoff is a static tree; first paint stays tiny; SEO slugs without a JS framework |
| Rendering | Python SSG (`scripts/render_pages.py`) | Data-driven bilingual marketing pages; booking stays a client app |
| Languages | English + Hindi, localized URLs | Bilingual SEO: `/en/…` and `/hi/…`, hreflang `en-IN` / `hi-IN` / `x-default` |
| Booking | `book.html` + `js/booking.js` only | App page, not SEO; `noindex`; mock UPI/card (~900ms) |
| Data | `js/data.js` (client) + `scripts/catalog.py` (SSG) | Same fares in both languages; nothing hits a server |
| Fares | `js/fares.js` | Round-trip `total * 1.85` (non-local); advance `min(total, max(500, round(total*0.28 to 100s)))` |
| CSS | `css/tokens.css` + `css/site.css` | Tokens match `DESIGN.md` / design-guide Option A |
| URLs | Root-relative in templates → build rewrites to **page-relative** | One build works at the custom-domain root AND the `/ArenaAI` Pages subpath AND any local preview |
| Serve | `python3 scripts/serve.py` (port 4173, binds 0.0.0.0) | Serves repo root; also emulates the `/ArenaAI` Pages subpath locally |
| QA | `scripts/check_links.py` + `scripts/visual_audit.mjs` | 0-failed-requests rule; overflow/console-error sweep at 360–1440px |

Do not switch to Next.js, React, a CMS, or live Razorpay without logging why in
the Decision Log and getting the user to add a phase.

## 2.5 Visual design system

Visual design is defined in `DESIGN.md` (agent-facing) and archived in
`design-guide/` (PDF source). `DESIGN.md` is authoritative for anything visual.
If a needed value isn't in `DESIGN.md`, add it there first (Decision Log), don't
invent a one-off in a component.

## 3. Folder structure

```
css/tokens.css              design tokens
css/site.css                chrome + components + pages
js/data.js                  mock catalogue
js/fares.js                 fare engine
js/app.js                   header, sheet, toast, filters, calc
js/booking.js               5-step booking (book.html only)
scripts/catalog.py          SSG cities / routes / vehicles / packages
scripts/i18n.py             EN/HI chrome strings
scripts/render_pages.py     bilingual HTML generator
assets/{hero,fleet,packages,trust,brand}/
en/  hi/                    generated marketing trees
book.html                   booking app (noindex)
design-guide/               untouched source PDF kit
proposal/                   original 24-slide deck
```

Rebuild marketing HTML with `python3 scripts/render_pages.py`.

## 4. URL map (SEO)

| Kind | English | Hindi |
|---|---|---|
| Home | `/` | `/hi/` |
| Hubs | `/en/{services,routes,packages,fleet,about,contact,faq,privacy,terms}/` | `/hi/{same}/` |
| Route | `/en/agra-to-delhi-taxi/` | `/hi/agra-se-delhi-taxi/` |
| Vehicle | `/en/vehicles/ertiga/` | `/hi/vehicles/ertiga/` |
| Package | `/en/packages/agra-sightseeing/` | `/hi/packages/agra-sightseeing/` |
| Booking | `/book.html` (app, noindex) | same |

Old root `*.html` hubs (except `index.html` and `book.html`) are redirect stubs
to `/en/{hub}/`.

Primary conversion: **Call + WhatsApp**. Book is secondary. Sticky lead-bar on
route pages (all marketing pages on mobile). Pricing identical in both langs;
translate copy, not fares.

## 5. Mock NAP & booking rules

- Phone `+91 98765 43210` · WhatsApp `919876543210`
- Email `bookings@skbagheltravels.in`
- Address: Near Taj East Gate Road, Taj Ganj, Agra 282001
- Geo: 27.1632, 78.0322
- Session key `skb-booking` · tickets `AGR-`
- Package add-ons sit on top of package price; local sightseeing is not 1.85×

## 6. Coding conventions

- Templates emit root-relative URLs (`/book.html`, `/css/site.css`, `/assets/…`);
  `render_pages.py` rewrites them to page-relative per output file at build
  time. Never hard-code `/ArenaAI/` or any other base prefix anywhere.
  JS-built URLs join onto `body[data-base]` ("." / "../.." per page).
- Never hand-edit generated files (`index.html`, `book.html`, `en/`, `hi/`,
  stubs, `sitemap.xml`, `robots.txt`, `404.html`): edit `scripts/render_pages.py`
  (or `catalog.py` / `i18n.py`) and regenerate with
  `python3 scripts/render_pages.py`.
- Marketing pages: minimal JS (`data.js` + `fares.js` + `app.js`, all `defer`).
  `booking.js` only on `book.html`.
- Images: WebP, width/height or aspect-ratio, `loading="lazy"` below the fold,
  hero preloaded + `onerror` fallback to the navy background.
- Motion: 180ms ease; `prefers-reduced-motion` kills transforms.
- Hindi pages: `lang="hi-IN"`, Noto Sans/Serif Devanagari.
- After regenerating, run `python3 scripts/check_links.py` against a running
  `scripts/serve.py` — the 0-failed-requests rule is the merge gate.
- Do not commit generated junk that `.gitignore` already excludes.

## 7. Explicit non-goals (unless the user later adds a phase)

- Admin, auth, CMS
- Live Razorpay / real charges
- n8n / WhatsApp Cloud API
- Next.js / React rewrite
- Editing `design-guide/` or `proposal/`
