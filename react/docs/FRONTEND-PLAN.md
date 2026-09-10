# SK Baghel — Frontend implementation plan

Build the **customer-facing website** from the approved design system (Dark Navy + Golden, Option A). The existing 24-slide proposal stays in `proposal/`. This pass is **frontend only**: every button, form and flow works against **mock data**. No backend, no live Razorpay.

## What we are building

A premium travel site for **Agra SK Baghel Tour & Travels**. North star from the deck: *make travel feel easy before the journey begins.*

Sitemap (design-guide §08):

| Page | Job | Primary CTA |
|------|-----|-------------|
| Home | Orient + capture route intent in &lt;5s | Book now |
| Services | Show the breadth | Check a route |
| Routes | Price transparency + fare calc | Book this route |
| Packages | Inspire multi-day trips | Enquire / Book |
| Fleet | Prove the hardware | Choose vehicle |
| Book | 5-step flow, under two minutes | Confirm & pay |
| About | Trust and local knowledge | Book / Contact |
| Contact | Human reassurance | Call / WhatsApp |
| FAQ / Legal | Kill doubts | — |

## Architecture (chosen for speed)

Vanilla **multi-page static HTML + CSS + JS**. No React/Next.js on this pass.

Why: the design-guide handoff is a static tree (`css/`, `js/`, `pages`). First paint stays tiny (JS budget ≤ 180KB gzip; we will be well under). SEO landmarks and clean slugs work without a build step. Booking JS is loaded **only** on `book.html`.

```
css/tokens.css          design tokens
css/site.css            base + components + pages
js/data.js              mock catalogue (routes, fleet, fares, packages, reviews)
js/fares.js             fare engine used by routes + booking
js/app.js               header, mobile sheet, toast, forms, reveal
js/booking.js           5-step booking state machine (code-split)
assets/hero|fleet|packages   WebP, lazy below the fold
```

## Performance budget (design-guide §09)

- **LCP ≤ 2.5s**: preload hero WebP (≤ 220KB), `fetchpriority="high"`, navy background so the hero never flashes white.
- **CLS &lt; 0.1**: width/height or `aspect-ratio` on every image.
- **JS**: `data.js` + `app.js` on every page; `fares.js` on routes/book; `booking.js` only on book. All `defer`.
- **Fonts**: one Google Fonts request, `display=swap`, preconnect.
- **Images**: WebP, `loading="lazy"` below the fold, film-grain overlay on photos only.
- **Motion**: 180ms ease; `prefers-reduced-motion` kills transforms.
- **Fallback**: Call / WhatsApp / form work with zero JS.

## Visual system (locked)

- 60/25/15 — navy surfaces, warm paper, gold as seasoning.
- Fraunces headlines (one gold/coral italic accent), DM Sans UI, DM Mono labels.
- Header 78px navy, blur on scroll. Container 1140px. Radius 3px. Touch 44px.
- Three buttons only: primary gold, outline, text.
- Hero overlay `linear-gradient(90deg, rgba(11,23,30,.96) 0%, .74 47%, .17 100%)`.

## Mock data & working UI

`js/data.js` is the source of truth:

- Cities, routes (AGR→DEL/JAI/MAT/GWL + local sightseeing), per-vehicle fares.
- Fleet: Sedan, Ertiga, Innova Crysta, Tempo Traveller, Urbania.
- Packages: Agra sightseeing, Golden Triangle, Mathura–Vrindavan, 3-day Agra.
- Reviews, trust chips, office/contact.

Interactive (all client-side):

1. **Home booking widget** → `book.html?...` with query params.
2. **5-step booking**: Route → Vehicle (live fare) → Details → Advance (simulated UPI/card, ~900ms) → Ticket (`AGR-00x`). State in `sessionStorage` so back never loses data.
3. **Routes fare calculator** and “Book this route”.
4. **Fleet filters** (seats / class) and “Choose this car”.
5. **Package book / enquire** (enquire = contact form prefilled).
6. **Contact form** validation + mock send.
7. **FAQ accordion**.
8. **Mobile nav sheet** + sticky **Book now** pill (≤700px).

No data leaves the browser. Toasts say so.

## Build order

1. Preserve proposal → `proposal/`. Drop in tokens + site CSS.
2. Mock data + fare engine.
3. Shared chrome (header, footer, mobile sheet, toast).
4. Home (hero, trust bar, routes, services, fleet, reviews, CTA).
5. Inner pages.
6. Booking flow (the conversion moment).
7. Compress assets, wire preload, verify every control.

## Out of scope (this pass)

Admin, real Razorpay, n8n/WhatsApp API, CMS, auth. Those wait for a backend.
