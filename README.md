# SK Baghel Town & Travels — Website

Frontend for **Agra SK Baghel Town & Travels**, built from the approved **Dark Navy + Golden** design system (`design-guide/`). Static HTML/CSS/JS. Buttons, filters, fare calculator and the 5-step booking flow all run on **mock data** — nothing is sent to a server.

Marketing pages are **bilingual SSG** (English + Hindi) with hreflang. Booking is a client-side app at `/book.html` (noindex). The original 24-slide proposal deck lives in `proposal/`.

## Run locally

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Open `http://localhost:4173`.

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

## Speed notes

- No framework. Booking JS loads only on `book.html`.
- Hero WebP is ~50KB (budget ≤ 220KB), preloaded.
- Below-fold images are lazy-loaded WebP.
- Fonts: one Google Fonts request, `display=swap`. Hindi pages add Noto Devanagari.
