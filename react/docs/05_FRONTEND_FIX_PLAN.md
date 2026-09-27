# 05 — Frontend Fix Plan: Responsiveness, Hero Images, Forms

Date: 2026-09-01 · Status: **executed (A–D source fixes + gates)** · Scope: all customer-facing pages (EN + HI + book.html)

> **Execution log (same day):** decision = "both hosts must work" → implemented as
> **page-relative URLs** (one build, any base — better than maintaining two build
> flavours). Phase A tasks A1–A4 ✅, Phase B fixes B2–B5 ✅ in source, Phase C
> C1–C2 ✅ (C3/C4 verified by audit), Phase D D1–D4 ✅ in source (D5 needs the
> browser sweep), Phase E E1–E3 ✅ (`check_links.py` green at both bases:
> 79/79 URLs 200). The Playwright visual matrix (B1/B6/D5) ships as
> `scripts/visual_audit.mjs` — the sandbox blocked the chromium download, so it
> runs on the first machine with network; until then, spot-check via the live
> preview (port 4173). This is the only open item.

---

## 1. What is actually broken (diagnosis with evidence)

Your symptoms — "every page has issues, not responsive on mobile or laptop,
hero image missing behind text, forms issuing" — have **one dominant root
cause plus a set of smaller genuine issues**.

### 1.1 ROOT CAUSE — every asset 404s outside GitHub Pages 🔴

The site was rebuilt (Phase 11) with every CSS / JS / image / link URL
prefixed by the subpath **`/ArenaAI`** for GitHub Pages project hosting
(`SITE_BASE=/ArenaAI` in `scripts/render_pages.py`).

But the documented preview command serves the **repo root**:

```
python3 -m http.server 4173          ← per 02_PROJECT_CONTEXT.md
```

Measured with exactly that command:

| Request | Repo-root serve (docs + Arena preview) | GitHub Pages subpath |
|---|---|---|
| `GET /` | 200 ✅ | — |
| `GET /ArenaAI/css/site.css` | **404 ❌** | 200 ✅ |
| `GET /ArenaAI/js/app.js` · `booking.js` · `data.js` | **404 ❌** | 200 ✅ |
| `GET /ArenaAI/assets/hero/hero-highway.webp` | **404 ❌** | 200 ✅ |

Consequences when previewing anywhere except `*.github.io/ArenaAI/`
(local, Arena live preview, or the future custom domain
`agraskbagheltourandtravels.com`, which also serves the repo at `/`):

| Symptom you reported | Mechanism |
|---|---|
| "Not responsive on mobile and laptop" | `site.css` 404 → zero CSS → no breakpoints, no layout, browser-default rendering |
| "Images behind text not showing" | hero `<img class="hero-media" src="/ArenaAI/assets/…">` 404 → alt/broken image or empty navy block |
| "Forms issuing" | `app.js` / `booking.js` / `fares.js` 404 → booking stepper dead, fare calculator dead, date fields never pre-filled (and `date` is `required`, so the hero widget can't even submit), mobile nav sheet dead |

⚠️ **This also means production is at risk**: the canonical domain in the
code is `https://agraskbagheltourandtravels.com` (custom domain). On GitHub Pages with a
custom domain the repo is served at `/`, so `/ArenaAI/…` URLs 404 there too.
The current build only works at exactly one URL: `*.github.io/ArenaAI/`.

### 1.2 Genuine issues that remain even after assets load 🟡

Found by static audit of `css/site.css` + generated HTML; to be verified
visually in Phase B:

1. **Hero photo nearly invisible on mobile.** Below 700 px the overlay becomes
   `rgba(11,23,30,.75→.98)` — the photo is 75–98 % hidden. Even with CSS
   loading it *looks like* "the image behind the text is not showing".
   Plus `object-position: 62%` can crop the subject out of frame on narrow
   screens.
2. **Vehicle picker overflow (booking step 2, mobile).** At ≤700 px the grid
   track is `72px` but `.vehicle-pick img` is fixed `96px` wide → overflow /
   squished layout.
3. **Header crowding 768–1280 px.** Nav (5 links) + Book now + lang switch +
   brand share one row; Call/WhatsApp hide at ≤1280 px but the middle band
   (≈768–1120 px) is untested with Hindi labels (Hindi strings are longer).
4. **Hero widget date field without JS.** `required` but empty until `app.js`
   pre-fills it → no-JS submit is blocked. FRONTEND-PLAN promises
   "Call / WhatsApp / form work with zero JS" — the contact form also has no
   `action` fallback.
5. **Dead CSS / polish.** `.book-pill` styles exist but the element is never
   rendered (and is `display:none` at every breakpoint); stray dead rules add
   confusion when auditing.
6. **Docs lie.** `02_PROJECT_CONTEXT.md` §6 still mandates root-relative
   `/css/…` URLs and documents the root serve command — both are stale after
   the `/ArenaAI` rebase, which is how this breakage kept being missed.

---

## 2. Fix strategy — one decision needed first

**Deployment target determines Phase A.** Default recommendation below;
confirm and the plan executes as written.

| Option | Production URL | Build |
|---|---|---|
| **A (recommended)** | `agraskbagheltourandtravels.com` custom domain (matches canonical URLs already in the HTML) | `SITE_BASE=` (empty). GitHub Pages preview at `/ArenaAI/` becomes a secondary build artifact |
| B | Keep `tarun1sisodia.github.io/ArenaAI/` as the only public site | `SITE_BASE=/ArenaAI`, fix local preview with a path-rewrite dev server |

Everything else in this plan is independent of that choice.

---

## 3. Execution plan

### Phase A — Unbreak asset loading everywhere (½ day · critical)

| # | Task | Files |
|---|---|---|
| A1 | Set `SITE_BASE` per the decision above; regenerate the tree (`python3 scripts/render_pages.py`) so HTML, redirects, `robots.txt`, `sitemap.xml`, 404 agree | `scripts/render_pages.py` (env only), generated tree |
| A2 | Add `scripts/serve.py`: local preview server that (a) serves the repo root, and (b) transparently rewrites the *other* base (maps `/ArenaAI/x` → `/x`) so **both** build flavours preview correctly with one command; bind `0.0.0.0:4173` | new `scripts/serve.py` |
| A3 | Smoke-test matrix (automated `curl` pass): home (`/`), one hub, one route page, `/hi/`, `/book.html`, all CSS/JS, every image URL referenced in HTML → **all 200** | `scripts/check_links.py` (new, runnable in CI later) |
| A4 | Update stale docs: serve command, root-relative-URL rule → "build-controlled base path", and log the decision (Decision Log per repo rules) | `02_PROJECT_CONTEXT.md`, `AGENTS.md`, `04_PROGRESS_TRACKER.md` |

**Acceptance:** from a repo-root serve, DevTools Network shows **0 failed
requests** on every page; Arena live preview renders styled.

### Phase B — Responsive verification & fixes (1 day · mobile first)

Tooling: Playwright (`npx playwright` + chromium) screenshot + horizontal-overflow
scan at **360 / 390 / 768 / 1024 / 1440 px**, EN **and** HI, all 9 page types
(home, services, routes, packages, fleet, book, about, contact, faq).

| # | Task | Failure signature |
|---|---|---|
| B1 | Automated sweep: `document.documentElement.scrollWidth > innerWidth` → flag offending element, per page × width | any `true` |
| B2 | Fix hero on mobile: keep text legible but let the photo breathe — raise overlay stops (~.55→.85), set `object-position: center` ≤700 px, verify against the actual `hero-highway.webp` crop | photo invisible at 360–768 px |
| B3 | Fix `.vehicle-pick` mobile grid: `grid-template-columns: 72px 1fr` with `img { width: 100% }` inside the track (drop fixed 96 px) or 64 px thumb column | booking step-2 cards overflow |
| B4 | Header 768–1280 px: truncate nav gap, shrink Book-now to icon+text, move lang switch into sheet earlier if Hindi labels overflow | row wrap / clipped buttons |
| B5 | Hindi-specific pass: longer words at 360 px (`हिन्दी` nav, headings, lead-bar 3-up buttons) — reduce `lead-bar` font to 13 px, allow wrap | overflow-x, clipped CTAs |
| B6 | Screenshot review (human/AI) of every page × width → fix list, regenerate, re-shoot | visual |

**Acceptance:** zero horizontal overflow at any test width; nav/hero/cards/
tables/stepper verified at 360 px and 1440 px in both languages.

### Phase C — Hero & image pipeline (½ day)

| # | Task |
|---|---|
| C1 | Every `<img>` audit: `width`/`height` or `aspect-ratio`, `loading="lazy"` below fold, hero `fetchpriority="high"` + preload — confirm post-rebase (generator already emits these; verify none were dropped) |
| C2 | `srcset`/`sizes` sanity on hero (`sm 960w, full 1920w`, `sizes="100vw"`) and add `onerror` fallback to keep the navy hero background if a WebP ever 404s (graceful, never a broken-image icon over text) |
| C3 | Compress/verify all 14 WebP assets ≤ budget (hero ≤ 220 KB — currently ~50 KB ✅) |
| C4 | Card overlays (`--card-overlay`) checked on fleet/package photos at mobile sizes so captions stay readable |

### Phase D — Forms & flows end-to-end (½ day)

| # | Task |
|---|---|
| D1 | Booking 5-step happy path in a real browser: route → vehicle → details → advance → ticket; back-button state from `sessionStorage`; query-param entry `?from=&to=&vehicle=&package=` |
| D2 | Hero widget: keep `required` date **but** pre-fill server-side in the generator (tomorrow's date as `value`) so it works with zero JS, per FRONTEND-PLAN's no-JS guarantee |
| D3 | Contact form: add graceful no-JS fallback (`action="https://formspree.io/…"` placeholder or `mailto:` + note) — right now a no-JS submit silently reloads |
| D4 | Validation UX: inline `.field-error` messages (styles exist, elements don't), `inputmode="numeric"` + `autocomplete="tel"` on phone fields, `aria-invalid` wiring |
| D5 | Fare calculator (`en/routes/`) + fleet filters + FAQ accordion + nav sheet — click-through with JS, confirm zero console errors |
| D6 | Touch targets ≥ 44 px re-check on any element changed in B4–B5 |

### Phase E — Regression gate & docs (¼ day)

- E1: `scripts/check_links.py` in a pre-push checklist (0 failed requests rule).
- E2: Playwright sweep becomes `scripts/visual_audit.mjs`; run before every regenerated-tree commit.
- E3: Update `04_PROGRESS_TRACKER.md` (new Phase 13 entry) + Decision Log for the base-path decision.

---

## 4. Rollout order & effort

```
Phase A (critical, unblocks everything)  → ~½ day
Phase B (responsive truth pass)          → ~1 day     ┐ run B–D
Phase C (images)                          → ~½ day     ├ in sequence,
Phase D (forms)                           → ~½ day     ┘ one PR
Phase E (gate + docs)                     → ~¼ day
Total                                     ≈ 2½ days
```

Risk notes: Phase A touches every generated file — always regenerate with the
build script, never hand-edit `en/` / `hi/`. One PR at the end; screenshots
attached as review evidence.

## 5. Exit criteria (definition of done)

1. Every page loads with **0 failed requests** from a repo-root preview **and**
   from the chosen production base.
2. No page shows horizontal overflow at 360–1440 px; mobile nav, hero photo,
   cards, tables, stepper verified in EN + HI screenshots.
3. Hero photo is visibly present behind text on a 360 px phone (overlay
   lightened), text still passes contrast.
4. Booking flow completable end-to-end on a phone viewport with zero console
   errors; hero widget and contact form degrade gracefully without JS.
5. Docs + Decision Log updated; link/visual checks scripted for regression.
