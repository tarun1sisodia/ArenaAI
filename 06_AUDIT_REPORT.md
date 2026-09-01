# 06 — Pre-Sprint Audit Report: SK Baghel Town & Travels

**Date:** 2026-09-01 · **Auditor role:** Frontend Architecture / Performance QA / Technical SEO
**Stack detected:** Vanilla static MPA — Python SSG (`scripts/render_pages.py`) emitting EN+HI trees. **Not React/Next.** Framework-specific checks (SSR payload, hydration, `useMemo`, React Query/SWR) are mapped to their static-site equivalents: content-in-initial-HTML ✅ (full SSG — crawlable), per-page JS payload, DOM churn, and asset strategy.
**Post-recent-fixes:** page-relative URL build is in place; this audit assumes the `main` branch as of commit `d769e06` (PR #11 merged).

**Verification limits (explicit):** Core Web Vitals could not be measured in this sandbox (chromium download blocked) — CLS/LCP findings are from static evidence, not lab data. External links (`wa.me`, maps) and the mock NAP cannot be validated against a live business. `scripts/visual_audit.mjs` exists but has never been executed anywhere.

---

## 🔴 CRITICAL

### 1. Mock business contact data (NAP) is published and would be indexed sitewide
- **Category:** Partial Impl / SEO / Domain · **Severity:** 🔴
- **Location:** `scripts/catalog.py` (PHONE `+91 98765 43210`, WHATSAPP `919876543210`, EMAIL), duplicated in `js/data.js` `SKB.contact`; surfaced in every header, footer, lead-bar, contact page, tel:/wa.me CTA, and `LocalBusiness` JSON-LD on every page.
- **Description:** The entire site — including schema.org `telephone`/`email` — carries the canonical Indian dummy number `98765 43210` and an unprovisioned `bookings@skbagheltravels.in`. Two independent sources of truth must be manually swapped.
- **Impact:** If deployed/indexed as-is: every primary CTA (the #1 conversion path in a taxi business is *Call/WhatsApp*) routes to a dead/unknown number — direct revenue loss. Google cross-references NAP for local ranking; publishing dummy LocalBusiness data corrodes Local Pack trust and can put the entity into a bad data state that takes weeks to correct. The "4.9/5 · 380+ trips" trust chip is also fabricated and has no `AggregateRating` schema to back it — a spam-policy exposure if kept at launch.
- **Recommended fix:** Single constants module consumed by both SSG and `data.js` (generate `js/data.js` contact block from `catalog.py` at build time); one `LAUNCH_DATA.md` checklist gating go-live on real NAP; drop or qualify the rating chip until real reviews exist (then add `aggregateRating` to JSON-LD).

## 🟠 HIGH

### 2. Timezone bug: "tomorrow" is computed in UTC — wrong min/default travel date 00:00–05:30 IST
- **Category:** Domain Logic (Date/Time) · **Severity:** 🟠
- **Location:** `js/app.js:63-67` (`isoTomorrow`); `js/booking.js:12-16` (`tomorrow`) — **duplicated logic, same bug twice.**
- **Description:** `d.toISOString().slice(0, 10)` converts the local date to UTC before slicing. In IST (UTC+5:30), between local midnight and 05:30 the UTC date is still "yesterday", so both helpers return **a day earlier than the local tomorrow**. Result: the booking `date` input's `min` allows same-day booking that the business rule intended to block, and the pre-filled default date is wrong.
- **Impact:** Direct booking-drift in the exact market the site serves (India), during the night hours when outstation taxi demand peaks ("4 AM pickup for the Taj sunrise" is this business's core use case, per its own FAQ).
- **Recommended fix:**
```js
const localTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
```
Export once (e.g. in `fares.js` as `SKB.localTomorrow`) and consume in both files; delete the duplicates.

### 3. No responsive `srcset` on any card/detail image; assets are ~2× display size in both dimensions; declared dimensions don't match files
- **Category:** Performance · **Severity:** 🟠
- **Location:** `scripts/render_pages.py` home/fleet/packages/vehicle/package templates; `assets/fleet/*` are **1312×816** (92–152 KB each), `assets/packages/*` same; displayed at ≈348–565 CSS px.
- **Description:** Every fleet/package `<img>` hardcodes a single `src` (no `srcset`/`sizes`). A 360px phone downloads the same 1312px-wide 100–152 KB file as a desktop. Fleet hub loads 5 such images; packages hub 4 — ≈0.5–1 MB of below-fold imagery that could be ~150–250 KB total at proper sizes. Separately, declared `width/height` are stale: `700×438` vs actual `1312×816`; `900×560` vs `1312×816`; hero declares `1920×823`, file is `1920×815`; portrait `640×800` vs `928×1152`. Where an `aspect-ratio` CSS rule exists the mismatch is masked; on detail pages (plain `<img>`, `height:auto`) the intrinsic-ratio swap causes a small post-load reflow.
- **Impact:** On the assumed mobile/3G user, this is the dominant weight on the two heaviest hubs — directly inflates LCP-adjacent loading time and data cost; the dimension staleness is a small recurrent CLS contributor.
- **Recommended fix:** Generate 480/768/1312 renditions per asset (add a step in the build), emit `srcset` + truthful `sizes` (e.g. `(max-width:700px) 100vw, (max-width:1120px) 50vw, 348px`), correct all `width/height` attrs from the real files (cheap: read dims in `render_pages.py` and inject), and add `decoding="async"`.

### 4. Render-blocking font theme: up to 9 font files via one blocking stylesheet; no metric overrides → text-swap CLS
- **Category:** Performance / Core Web Vitals (SEO-adjacent) · **Severity:** 🟠
- **Location:** `scripts/render_pages.py` `FONTS_EN`/`FONTS_HI` `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">` in every `<head>`.
- **Description:** EN pages request DM Mono(2) + DM Sans(4) + Fraunces(3 instances); HI adds Noto Sans(3) + Noto Serif Devanagari(2) — up to **14 font files gated behind one render-blocking CSS request**. `display=swap` is set, but there is no `preload` of the primary woff2 and no `@font-face` `size-adjust/ascent-override` fallback metrics, so the Fraunces↔Georgia swap measurably shifts the `h1` — the likely LCP element.
- **Impact:** Slow 3G: blank-then-swap headline (LCP delayed; CLS ≈ 0.05–0.15 typically from serif metric deltas); HI pages pay double font cost.
- **Recommended fix:** Preload the Fraunces (and Noto Serif) woff2 subsets with `<link rel="preload" as="font" crossorigin>`; add fallback metric overrides (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) in a local `@font-face` for `Georgia`/`Arial`; consider self-hosting the 4–6 critical files (removes the render-blocking third-party CSS entirely and enables long-cache).

### 5. Mobile nav sheet: no focus management or scroll-behavior a11y; completely dead without JS
- **Category:** UX & Accessibility · **Severity:** 🟠
- **Location:** `js/app.js` `setSheet()` + `css/site.css` `.nav-sheet`; header template.
- **Description:** Opening the sheet toggles classes/`hidden` and locks body scroll, but: focus is never moved into the sheet or returned to the toggle on close; no `role="dialog"`/`aria-modal`; Tab cycles into the obscured background page (invisible focus targets). Separately, with JS disabled the hamburger button does nothing and the sheet stays `hidden` — mobile users lose all in-site navigation.
- **Impact:** Keyboard/screen-reader users on mobile (the primary form factor) get trapped/confused at the site's most important navigation widget; Lighthouse a11y and INP-adjacent UX both suffer.
- **Recommended fix:** On open: `closeBtn.focus()`, `aria-modal="true"`, trap Tab within sheet (first/last focusable loop), restore focus to toggle on close (Escape already handled). Provide a no-JS path: render the sheet's link list in a `<details class="nav-toggle-fallback">` or a footer-nav fallback block visible without JS.

### 6. `lead-bar` (Call/WhatsApp/Book) spans the full viewport width on **desktop** route pages
- **Category:** UX · **Severity:** 🟠 (visual bug)
- **Location:** `css/site.css:593-596` — `body[data-kind="route"] .lead-bar, body[data-page="routes"] .lead-bar { display: grid; }` is **outside any media query**; `.lead-bar` is `position:fixed; left:16px; right:16px`.
- **Description:** The intent (per project context §4) is "sticky lead-bar on route pages (all marketing pages on mobile)". The selector ignores viewport, so at 1440px the bar stretches ~1400px wide with three 460px-tall-sense buttons floating over content, with `padding-bottom:88px` added to the page.
- **Impact:** Broken, unprofessional hero region on the highest-intent SEO landing pages (route pages) for desktop users — the exact pages organic search lands on.
- **Recommended fix:** Wrap the desktop reveal in a min-width media query with a constrained pill, or scope all variants to mobile: move the two rules inside `@media (max-width:700px)` and, if a desktop bar is wanted, fix it to a right-bottom pill (`left:auto; width:min(420px, 40vw)`).

## 🟡 MEDIUM

### 7. `backdrop-filter: blur(16px)` on three fixed/sticky layers — scroll jank on low-end mobile
- **Category:** Performance · **Severity:** 🟡
- **Location:** `css/site.css` `.site-header.is-scrolled`, `.lead-bar`, (also `.toast` adjacent), all persistent during scroll on mobile.
- **Description:** Every frame of scrolling recomposites a blurred backdrop under a sticky 64px header **plus** a fixed bottom bar. On the assumed limited-CPU Android this is a known INP/jank source; `prefers-reduced-motion` doesn't help (not a transition).
- **Impact:** Stuttery scroll on the pages where the phone is most likely mid-funnel.
- **Fix:** On ≤700px swap to solid rgba backgrounds (`.site-header.is-scrolled { background: rgba(11,23,30,.96); backdrop-filter: none; }`), keep blur desktop-only.

### 8. Booking session state has no TTL and survives payment: stale tickets, post-payment mutation
- **Category:** Domain Logic (State) · **Severity:** 🟡
- **Location:** `js/booking.js` — `sessionStorage` key `skb-booking`; `renderStepper` unlock rule `step > state.step && !state.bookingId`; `renderTicket()` recomputes from live state.
- **Description:** (a) No expiry/reset: a booking begun days earlier in the same tab session silently pre-fills (name/phone/route) with no hint of staleness. (b) After the mock payment sets `bookingId`, every step becomes clickable; going back and changing route/vehicle re-renders step-5's "confirmed ticket" with new contents under the old `bookingId`. (c) `sessionStorage` also dies on tab close, so the "back never loses data" promise stops at the tab, not the browser — acceptable for a demo but undocumented.
- **Impact:** In a real flip to production this is a booking-integrity bug (mutating a paid booking); in demo it's a logic smell reviewers will hit.
- **Fix:** Freeze state after payment: once `bookingId` exists, treat route/vehicle/details panels as read-only (or confirmations-only; "Start a new booking" clears the key). Add a `createdAt` and discard state older than, say, 24h.

### 9. FAQ/copy promises a night-allowance fare breakdown that the fare engine does not implement
- **Category:** Partial Impl / Domain Logic · **Severity:** 🟡
- **Location:** Copy: `scripts/render_pages.py` FAQ tuple + `js/data.js` FAQs; engine: `js/fares.js` `SKB.calcFare` (no time-of-day logic; `time` is never even read).
- **Description:** "Pickups between 10:00 PM and 5:00 AM may include a night allowance, **shown before you pay**" — nothing computes or displays it. The booking flow collects `time` but ignores it in pricing.
- **Impact:** Price-transparency is this site's stated differentiator ("Know the fare before you pack"); a picker that quotes ₹3,500 at 23:00 while the FAQ warns of an allowance is a trust contradiction and a dispute trigger.
- **Fix:** Implement `nightAllowance(time)` in `fares.js` (flat ₹300–500 or %, surfaced as a line in `.summary-lines` and the calculator breakdown) or remove the FAQ promise until built.

### 10. `robots.txt` is ineffective on the GitHub Pages deployment
- **Category:** Technical SEO · **Severity:** 🟡
- **Location:** `robots.txt` at repo root; hosting under `/ArenaAI/`.
- **Description:** Crawlers only honor `robots.txt` at the **domain root** (`tarun1sisodia.github.io/robots.txt`), which is the user-level Pages site — this project's file is never read there. `Disallow: /book.html` therefore applies only on the custom domain. Mitigating: `book.html` carries `noindex,nofollow` meta, which *is* honored everywhere.
- **Impact:** Low today (noindex covers the only sensitive path), but any future "robots-only" rule (e.g., disallowing drafts that are still indexable) silently won't work on the Pages host.
- **Fix:** Document the invariant: **never rely on robots.txt except on the custom domain; sensitive pages must be `noindex` in-meta.** Keep as is otherwise.

### 11. Touch targets below the design system's own 44px rule
- **Category:** UX/A11y · **Severity:** 🟡
- **Location:** `css/site.css` `.filter-row button { min-height: 40px }`, `.btn-sm { min-height: 40px }`, `.lang-switch { min-height: 40px }`; `DESIGN.md` rule `touch: 44px`.
- **Description:** The three most-tapped mobile affordances (fleet filter pills, header Call/WhatsApp/Book buttons, language switch) are 40px.
- **Impact:** Missed taps on the primary CTA row; WCAG 2.5.5 (AAA) / design-system self-violation.
- **Fix:** Raise to 44px minimum (keep visual compactness via padding/font, not hit-area).

### 12. Stepper semantics: `role="tablist"` without tabs; no keyboard model
- **Category:** UX/A11y · **Severity:** 🟡
- **Location:** `scripts/render_pages.py` `book_body()` stepper markup.
- **Description:** The container claims `role="tablist"` but children are plain `<button>`s (no `role="tab"`, `aria-selected`, `aria-controls`, roving tabindex, arrow-key navigation) — screen readers announce a tablist, then find no tabs.
- **Fix:** Either emit full tab semantics or drop `role="tablist"` in favor of `aria-label="Booking progress"` on an ordered list.

### 13. Detail-page hero images load eagerly at full 1312px; no `decoding="async"` anywhere
- **Category:** Performance · **Severity:** 🟡
- **Location:** `scripts/render_pages.py:555` (`vehicle_body`), `:595` (`package_body`) — `<img>` with neither `loading` nor `decoding`; sits below the `.page-hero` fold on mobile.
- **Fix:** `loading="lazy" decoding="async"` + the srcset fix in Finding 3 (they're near-viewport on desktop, so lazy is still safe with correct `sizes`).

### 14. Contact-form no-JS fallback sends to an unprovisioned mailbox
- **Category:** Partial Impl · **Severity:** 🟡
- **Location:** `en/hi/contact/` pages — `action="mailto:bookings@skbagheltravels.in"` (added as the zero-JS escape hatch).
- **Description:** The domain isn't live; a customer's no-JS enquiry composes mail to an inbox no one monitors. `mailto:` also triggers the OS handler with no confirmation — users on shared/desktop devices may abandon silently.
- **Fix:** Before launch either provision the mailbox, or swap the fallback to a real form endpoint (Formspree/Web3Forms) with the same static page.

## 🟢 LOW (including systemic-patterns)

### 15. Systemic — inline styles throughout generated templates bypass the token system
- **Category:** Code health / Design conformity · **Severity:** 🟢 (systemic risk)
- **Location:** `scripts/render_pages.py` — `style="margin-top:28px;background:var(--paper-lt)"`, `style="min-height:340px"`, `style="grid-column:1/-1"` etc. across most body templates.
- **Description:** Spacing/color one-offs in markup can't be audited against `DESIGN.md` or responsively overridden. The contact form literally re-tints `.calc-box` inline in both languages.
- **Fix:** Introduce utility classes (`.mt-4`, `.span-2`, `.surface-paper-lt`) in `site.css` and sweep templates.

### 16. Systemic — contact/NAP and FAQ data duplicated between SSG (`catalog.py`) and client (`js/data.js`)
- **Category:** Code health · **Severity:** 🟢 (systemic risk)
- **Description:** Phone, email, WhatsApp, address and the full FAQ list exist twice in two languages' pipeline; they already drifted once (FAQ night-allowance wording differs between the two copies — compare FAQS in `render_pages.py` vs `data.js`).
- **Fix:** Generate the `SKB.contact`/FAQ block of `js/data.js` from the Python sources at build time (same render step), or accept one direction (server) as canonical and delete the other.

### 17. Schema gaps for launch readiness
- **Category:** SEO (structured data) · **Severity:** 🟢 (pre-launch is correct to *omit*; becomes High at launch)
- **Location:** `scripts/render_pages.py` `org_schema()` / Service JSON-LD.
- **Description:** No `ContactPoint`, no `aggregateRating` (despite the 4.9/5 chip), `Offer` has no `availability`/`priceValidUntil`, sitemap has no `lastmod`. All acceptable for a mock; all are gaps the day real data exists.
- **Fix:** Add at the real-data sprint: `contactPoint` (customer-care), real `aggregateRating` or remove the chip, `offers.availability` + `priceValidUntil`, and emit `lastmod` from git mtimes in `write_sitemap()`.

### 18. Minor performance items
- **Category:** Performance · **Severity:** 🟢
- `.live-dot { animation: pulse 1.6s infinite }` — always-on compositor animation for a decorative demo chip (battery); make it static or pause off-screen.
- No `<link rel="prefetch">` for `js/booking.js` on the home page — the highest-likelihood next navigation; a one-line prefetch on home makes the booking app feel instant on 3G.
- `hero-highway-sm.webp` (960×407) and full (1920×815) ratios differ slightly (2.3587 vs 2.3558) — imperceptible; normalize in the same derivative-generation step as Finding 3.
- `js/data.js` + `fares.js` ship to legal/FAQ pages that never call them — tiny, but a `nav/faq` script-split keeps zero-JS-content pages clean.
- `vehicle-pick` list fully re-renders (`innerHTML` + re-attach listeners) on every vehicle selection — fine at n=5 (listeners are GC'd with nodes), but is the pattern to avoid copying elsewhere; switch to class toggling on existing nodes.

---

## Technical-debt patterns (systemic risk register)
1. **Two sources of truth** (NAP in `catalog.py`+`data.js`; FAQs in `render_pages.py`+`data.js`) — already drifting; will produce publishable contradictions.
2. **Copy that outruns the engine** (night allowance, GST invoice, "4.9/5 · 380+ trips") — marketing promises have no corresponding code path; gap-audit every claim in `i18n.py` against `fares.js`/schema before launch.
3. **Design-token leakage** (inline styles) — small now, expensive at 3× pages.
4. **QA gate exists but is unenforced** — `check_links.py` is green and fast; `visual_audit.mjs` has never run; make both a pre-merge step (GitHub Action) so the next responsive regression is caught in minutes, not by the user.

## Suggested sprint order
1. 🔴 NAP single-sourcing + real-data checklist (found-a-penny fix, do first).
2. 🟠 #2 timezone fix (15 min, duplicated sites), #6 lead-bar desktop rule (5 min), #5 nav-sheet a11y (½ day).
3. 🟠 #3 image derivatives + srcset in build (½ day, biggest CWV win), #4 font strategy (½ day).
4. 🟡 #8 booking freeze/TTL, #9 night-allowance implement-or-delete, #7 mobile blur, #11 44px audit.
5. 🟢 systemic sweeps + CI wiring.
