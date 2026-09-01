# Launch checklist — gate before skbagheltravels.in goes live

Everything below must be true **before** pointing DNS / sharing the site.
Derived from audit `06_AUDIT_REPORT.md` (2026-09-01). Do not skip — several
items are search-visibility or revenue risks if shipped as-is.

## 1. Real business data (🔴 audit #1)
- [ ] Replace all NAP constants in `scripts/catalog.py` with the REAL phone,
      WhatsApp, and email (single source — it now flows to every page, every
      CTA, all JSON-LD, and generated `js/contact.js`)
- [ ] Replace `GST = "09ABCDE1234F1Z5"` placeholder in `scripts/catalog.py`
- [ ] Regenerate: `python3 scripts/render_pages.py` and re-run
      `python3 scripts/check_links.py` (0 failures rule)
- [ ] Provision the `bookings@…` mailbox OR swap the contact form's
      no-JS `mailto:` fallback to a real form endpoint (Formspree/Web3Forms)
      — currently mail goes to an unmonitored address
- [ ] Remove or qualify the "4.9/5 · 380+ trips" trust chip until real review
      data exists; if kept at launch, add matching `aggregateRating` to
      `org_schema()` in `render_pages.py` (with honest values)

## 2. Structured data gaps (audit #17) — ✅ done (Phase 15)
- [x] `contactPoint` (customer care) in `org_schema()`
- [x] `offers.availability` + `priceValidUntil` on Service offers (routes and
      packages; date auto-rolls +365d at each build)
- [x] `lastmod` in `sitemap.xml` (build date per deploy, in `write_sitemap()`)

## 3. Fonts (audit #4 — pending, sandbox-network blocked)
- [ ] Self-host the 4–6 critical woff2 (Fraunces 500/600+italic, DM Sans
      400/500/700, DM Mono 400) under `assets/fonts/`, add local `@font-face`
      with `font-display: swap`, and remove the render-blocking Google Fonts
      stylesheet; OR keep Google Fonts and add `@font-face` fallback metric
      overrides (`size-adjust`, `ascent-override`) tuned from real files
- [ ] Preload the primary display woff2 when self-hosting

## 4. Assets
- [ ] Re-shoot or license real vehicle/location photography. **Drop-in flow:**
      overwrite the file at the SAME path (e.g. `assets/fleet/sedan.webp`,
      `assets/hero/hero-highway.webp`) — any dimensions are safe — then run
      `python3 scripts/render_pages.py`. The build measures the new files and
      injects truthful `width`/`height`, regenerates the `-480`/`-768`/`-sm`
      derivatives itself when ImageMagick is installed
      (or run `./scripts/make_image_derivatives.sh --force` beforehand).
      Keep files as WebP, ideally ≤ 220KB for the hero.
- [ ] Replace mock review quotes/names in `catalog.py` with verifiable reviews

## 5. QA gates (must be green on the launch commit)
- [ ] `python3 scripts/serve.py` + `python3 scripts/check_links.py`
      → 0 failed URLs (run against BOTH `/` and `/ArenaAI` bases)
- [ ] `node scripts/visual_audit.mjs` on a networked machine
      → 0 horizontal overflow, 0 console errors; review `qa-shots/`
      screenshots at 360/390/768/1024/1440 for EN + HI
- [ ] Manual booking pass on a real phone: 5 steps → ticket → "New booking"
      reset; hero widget; contact form; language switch; night pickup time
      (23:00) shows the ₹400 night allowance line
- [ ] Lighthouse mobile ≥ 90 on Home, `/en/routes/`, `/book.html`

## 6. Hosting invariants
- [ ] `robots.txt` rules only ever trusted on the custom domain (project-site
      deployments can't serve it at the domain root); sensitive pages must
      carry `noindex` in-meta (book.html already does)
- [ ] Confirm canonical domain = production domain in `catalog.py` `SITE`
- [ ] GitHub Pages 404.html deep-path relative-CSS caveat is cosmetic —
      acceptable; revisit only if real 404 traffic appears
