# SK Baghel Tour & Travels (ArenaAI) — REACT Customer Site Test Plan: 100 Tests

**Target:** `react/` — React 19 + Vite 7 customer site, bilingual SSG pre-render (`/en/…`, `/hi/…` with hreflang), real `404.html`, `sitemap.xml`, `robots.txt`, client-side booking flow at `/book.html` (`noindex`), Cloudflare Pages (`agraskbagheltourandtravels.com`). It calls the Fastify API for fleet, catalog manifest, fares, locations, bookings, payments (Razorpay), inquiries and reviews.
**Derived from:** repo README, `docs/DEPLOYMENT.md`, `BACKEND_RULES.md` (Laws 2, 3, 7: server-authoritative fares, provider-verified payment, privacy masking) and `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md` (audit dated 27 Sep 2026: customer page spec, SEO/AEO lifecycle rules, customer gaps).
**Important:** I did not read the React source. Tests drive the **browser and then verify API and DB**, so a screen that claims "booked/paid" without the backend agreeing is caught. If a route, label or behaviour differs from the docs, record it in the **Drift list** at the end of the ranking prompt.

---

## 0. How this plan was designed (technique sources)

- **Razorpay docs and payment-chaos tooling:** a browser success callback is not proof of payment; webhooks can be late, duplicated or out of order; test decline spikes and minimum amounts. This drives the payment UI tests (RC-045 to RC-058).
- **Concurrency write-ups:** barrier-based parallel requests and "fire N identical requests, assert exactly one winner". Used for double-click and multi-tab payment tests (RC-030, RC-051).
- **Playwright/QA practice:** `route.abort()` network failure, slow-network throttling, rage-click double submit, random 20% failure injection, trace/video on failure, keyboard-only flows. Used throughout RC-018 to RC-044 and RC-077 to RC-090.
- **OWASP API/web checklists:** XSS sinks, open redirect, prototype pollution, CORS probing, secret scanning of bundles. Used in RC-065 to RC-076.
- **The repo's own audit:** several tests target customer gaps it admits (static-first data with silent stale fallbacks, unbounded `localStorage` manifest cache, no `If-None-Match`, direct browser LocationIQ calls, phone-only booking recovery). These are tagged `KNOWN-GAP(audit)`.
- **Source honesty note:** Reddit/X/Instagram threads were not retrievable through my search tool. The patterns come from engineering blogs, OSS repos, vendor docs and OWASP material.

## 1. Environment (staging only)

- Customer site served from a production build (`npm run customer:build`, serve `react/dist`) **and** dev server (`localhost:5173`) pointed at staging backend + disposable Postgres; Razorpay **test mode**; mock server for fault injection.
- Browsers/devices: Chrome, Firefox, Safari iOS (real or BrowserStack), Android Chrome, Samsung Internet; in-app browsers (WhatsApp, Instagram); 360/390/768/1440 px; 4× CPU throttle.
- Tools: Playwright (trace on), Lighthouse, axe, `curl`, `psql`, a link crawler, `fast-check`, DevTools Network/Application tabs.

## 2. Legend

- **Severity:** `P0` money / security / customer-trust release blocker · `P1` major · `P2` moderate · `P3` minor.
- **KNOWN-GAP(audit):** flagged as unfixed in the repo's audit. Expect FAIL today. If already fixed, it becomes a regression guard. It still counts.
- **UI→API→DB rule:** for every flow that creates or changes data, compare (1) what the user sees, (2) the Network request/response, (3) the DB row. Any disagreement is a FAIL.
- **INV-n (run after booking/payment tests):** **INV-1** no confirmed booking without a captured payment of the right amount · **INV-2** one captured payment per booking · **INV-3** `total = base + night + driver − discount`, `balance = total − advance ≥ 0` · **INV-5** unique ticket ids matching `AGR-YYYYMMDD-XXXX` · **INV-6** cancelled bookings have no un-refunded capture.

### Hostile value sets (reused everywhere)

- **HV-NUM:** `0, -1, 0.001, 1e308, NaN, "10", "1,000", "₹1500", "１０", [10], null, 9007199254740993, 100.005`
- **HV-STR:** `"", " ", "\u200b\u200b", 1 char, 2 chars, 10,000 chars, "'; DROP TABLE x;--", "<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "</script><script>alert(1)</script>", "javascript:alert(1)", "${7*7}", "{{7*7}}", "\u0000", "😀"×50, "आगरा", "مرحبا", NFC vs NFD "é", "a\r\nBcc: x@y", "../../etc/passwd"`
- **HV-DATE:** `past, today, tomorrow, 2028-02-29, 2027-02-29, 2100-01-01, typed text "abc", paste "31/02/2026", locale dd/mm vs mm/dd`
- **HV-URL:** `?next=//evil.com, ?lang=../../, ?__proto__[x]=1, ?from=<script>, ?vehicle=unknown, ?to=<10 KB string>, #"><img src=x onerror=alert(1)>`

### CRUD coverage map (customer-visible)

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Booking draft | RC-021–034, RC-092 | RC-054–055, RC-091 | denied RC-093 | denied RC-093 |
| Payment | RC-045 | RC-049, RC-053 | denied RC-093 | n/a |
| Inquiry | RC-059–060 | n/a | denied | denied |
| Review | RC-061 | RC-062 | denied RC-093 | denied RC-093 |
| Catalog / fleet / fares | denied RC-070, RC-093 | RC-010, RC-091, RC-094 | denied | denied |

---

# TESTS

## A. SSG, SEO, i18n (RC-001 to RC-014)

### RC-001 · Pre-render completeness `P1` `SEO`
1. Build the site; list every URL in `sitemap.xml`.
2. For each, `curl` the **English and Hindi** versions with JavaScript disabled.
3. Check for `<title>`, one `<h1>`, main content and the primary internal links.
- **Pass:** every sitemap URL has real HTML in both languages; important content exists before any JS runs; no `undefined`, `null` or `[object Object]` text.

### RC-002 · hreflang and canonical reciprocity `P1` `SEO`
1. For 30 sampled pages, read `<link rel="alternate" hreflang>` and `<link rel="canonical">`.
2. Follow each alternate back.
- **Pass:** en↔hi reciprocal with `x-default`; canonical is self-referencing on the correct host and scheme; no mixed-language canonicals.

### RC-003 · 404 behaviour (no soft-404s) `P0` `SEO`
1. Request `/en/does-not-exist/`, `/hi/does-not-exist/`, uppercase paths, trailing-slash variants, `//`, `/en/%00`.
2. Check status codes and bodies.
- **Pass:** real HTTP **404** with the styled `404.html`; no catch-all rewrite turning 404s into 200; crawler semantics preserved.

### RC-004 · Sitemap and robots truthfulness `P1` `SEO`
1. Validate `sitemap.xml` and `robots.txt`; build twice without content changes and diff `lastmod`.
2. Search the sitemap for drafts, `/book.html`, admin URLs, retired pages.
- **Pass:** only published (and useful paused/archived) pages; `lastmod` unchanged between identical builds; absolute canonical https URLs; `/book.html` is `noindex` and absent from the sitemap.

### RC-005 · Structured data validity `P1` `SEO`
1. Extract every JSON-LD block from 30 pages; parse and validate against schema.org types.
2. Compare each price in JSON-LD with the live API price.
3. Check archived/paused pages.
- **Pass:** valid JSON; archived/paused pages are never `InStock` and omit `Offer` when no valid current price; prices equal the live price; Hindi pages match English pricing.

### RC-006 · Fares identical in both languages `P0` `PRICING`
1. For 10 routes × 5 vehicle tiers read the displayed fare on `/en` and `/hi`.
2. Query `/fares/calculate` for the same inputs.
- **Pass:** identical numeric fare in both languages and equal to the API (digit script may differ; value must not).

### RC-007 · Hindi rendering and language switching `P2` `I18N`
1. Load Hindi pages on Windows/Android/iOS; check Devanagari glyphs, line-breaking, long words, mixed numerals.
2. Switch language on 10 pages with query strings and hash fragments.
- **Pass:** no tofu boxes; no overflow; the switcher preserves the equivalent path and query; `<html lang>` correct; Accept-Language never redirect-traps crawlers.

### RC-008 · Language switch mid-booking `P1` `I18N`
1. At booking step 3 switch en→hi, then hi→en.
- **Pass:** selections preserved; no price change; no re-created draft; no state loss.

### RC-009 · Title/meta uniqueness and leaks `P2` `SEO`
1. Crawl all pages; collect `<title>`, meta description, OG tags.
- **Pass:** unique titles within length bounds; OG image present; no placeholder or template text; HV-STR in CMS fields cannot break the head markup.

### RC-010 · Static vs live reconciliation `P0` `DATA` `KNOWN-GAP(audit)`
1. Change a price in admin (or mock the API) so it differs from the SSG HTML.
2. Load the page; watch first paint and after hydration.
3. Block the live API and reload.
- **Pass:** the live value replaces the static one with `updatedAt`; a stale static price is never shown as current. When live data fails, the page shows "Live data unavailable" or "Last updated at…", not a silent old price.

### RC-011 · Images, srcset and layout shift `P2` `PERF`
1. Check `srcset/sizes` against the `-480`/`-768` derivatives; delete one derivative on staging and reload.
2. Check `width/height` attributes, `alt`, lazy-loading of the LCP image, WebP fallback.
- **Pass:** all referenced files exist (no 404); CLS≈0; non-empty `alt`; the LCP image is not lazy-loaded; a broken image degrades gracefully.

### RC-012 · Core Web Vitals (lab) `P1` `PERF`
1. Run Lighthouse mobile (4× CPU, Slow 4G) on 5 key pages in each language.
- **Pass:** LCP <2.5 s, CLS <0.1, INP <200 ms; no layout shift when live prices hydrate; JS within the agreed budget.

### RC-013 · Lifecycle pages: archived, paused, retired `P0` `SEO`
1. In admin set items to paused, archived and retired (301 target, 410).
2. Visit each URL anonymously.
- **Pass:** paused/archived keep the URL, show an "unavailable" notice with alternatives, no active **Book** CTA, no stale price; retired → relevant 301 or intentional 410; never a redirect to the homepage.

### RC-014 · Cloudflare limits and security headers `P1` `OPS`
1. Check every `dist` file is <25 MiB; inspect cache headers; run `curl -I` on HTML and assets.
- **Pass:** assets within limit; hashed assets long-lived and HTML revalidated; CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protection present.

## B. Routing, links, search (RC-015 to RC-020)

### RC-015 · Link crawl `P1` `ROUTING`
1. Crawl both languages from the home page.
2. Check `tel:`, `mailto:`, WhatsApp links and external links.
- **Pass:** 0 broken internal links; correct phone/WhatsApp numbers and encoding; external links use `rel="noopener"`.

### RC-016 · Deep links and prefill `P1` `SECURITY`
1. Open `/book.html?from=Agra&to=Delhi&vehicle=sedan`.
2. Repeat with each HV-URL value, an unknown vehicle, and a 10 KB `to`.
- **Pass:** valid prefill works; hostile or unknown values are ignored or escaped; no script execution; no 5xx; no state corruption.

### RC-017 · Content routes and slugs `P1` `ROUTING`
1. Visit routes/packages/fleet pages: unpublished slug, wrong-case slug, encoded characters, 500-char slug.
- **Pass:** proper 404 page; published-only content; consistent case handling; no crash.

### RC-018 · Back/forward/refresh in the booking flow `P1` `STATE`
1. At each funnel step press Back, Forward, Refresh; refresh on the payment step.
- **Pass:** state preserved or safely reset with an explanation; refreshing never creates a second draft or second payment.

### RC-019 · Autocomplete behaviour `P1` `UX`
1. Type fast; type Hindi; enter special characters and a 200-char query; use keyboard navigation; trigger a 429; go offline.
- **Pass:** debounced; a stale response never overwrites a newer one; empty state shown; keyboard and screen-reader accessible; 429 shows a friendly message; offline falls back to curated places.

### RC-020 · Third-party script failure `P1` `RESILIENCE`
1. Block the Razorpay checkout script and analytics (ad-blocker/CSP).
- **Pass:** a clear "payment cannot load" message with alternatives (WhatsApp/call); rest of the site works; no console loops.

## C. Booking funnel: fare, forms, data types (RC-021 to RC-044)

### RC-021 · Route-first happy path `P0` `E2E`
1. Choose route → vehicle → date/time → details → create draft.
2. Inspect the request payload; read the DB row.
- **Pass:** the request contains **no** price, total, distance or advance; the DB row matches the server's quote; INV-3 and INV-5 hold; ticket shown equals DB.

### RC-022 · Package-first happy path `P0` `E2E`
1. Choose package/tour → vehicle → details → draft.
- **Pass:** same server-authoritative behaviour as RC-021; booking references the package snapshot.

### RC-023 · Tampered client totals `P0` `SEC`
1. Intercept the draft/checkout requests (DevTools/Playwright) and add `totalFare:1, advanceAmount:500, distanceKm:1, discountAmount:99999`; also edit React state in DevTools.
- **Pass:** the server ignores them; UI shows the server's values; DB totals equal the server calculation.

### RC-024 · Quote vs draft price drift `P1` `PRICING`
1. Reach the review step; change the rate in admin; submit.
- **Pass:** the UI shows the updated total with a notice **before** payment; the advance charged equals the server's final advance.

### RC-025 · Date and time picker edges `P0` `DATA`
1. Use HV-DATE; pick 21:59, 22:00, 04:59, 05:00; run the browser in `TZ=America/Los_Angeles` and `Pacific/Kiritimati`.
- **Pass:** past dates blocked; night-allowance line appears exactly per rule; the pickup instant is the intended IST time regardless of browser timezone; invalid typed text shows an error; no off-by-one day.

### RC-026 · Return date logic and trip-type switching `P1` `DATA`
1. Return before pickup, same instant, +30 days; one-way hides the return field; switch trip type with data entered; change the vehicle.
- **Pass:** invalid ranges blocked; incompatible fields cleared or ignored; the fare recalculates after each change; inactive vehicles are not selectable.

### RC-027 · Phone input `P0` `DATA`
1. Enter `9876543210`, `+919876543210`, `98765 43210`, `+91-98765-43210`, 9 and 15 digits, Arabic-Indic and full-width digits, a paste with zero-width characters.
- **Pass:** client normalisation matches the server's rule (`^\+?[0-9]{10,14}$`); invalid values show inline messages (also in Hindi); the mobile keyboard is numeric; the stored phone is canonical.

### RC-028 · Name, address and notes `P0` `DATA`
1. Apply HV-STR to name, addresses and notes; check the 500-char counter with emoji.
- **Pass:** zero-width-only/whitespace-only rejected; the counter matches server limits; XSS payloads render inert on the confirmation page and voucher; no 5xx.

### RC-029 · Optional email `P2` `DATA`
1. Leave email blank, then enter invalid, unicode and 300-char addresses.
- **Pass:** blank is submitted as omitted (not `""`); inline errors; no server 4xx for a blank optional field.

### RC-030 · Rage-click Pay/Book `P0` `CONC`
1. Click the primary button 10× in 1 s; press Enter repeatedly; double-tap on mobile.
2. Count network requests and DB rows.
- **Pass:** 1 draft and at most 1 checkout; the button disables while pending; no duplicate tickets (INV-5).

### RC-031 · Slow or failed quote `P1` `RESILIENCE`
1. Throttle; return 500; time out; abort; change the vehicle 10 times quickly.
- **Pass:** inline error with Retry; Submit disabled until a valid quote exists; never `₹NaN`, `₹undefined` or `₹0`; the final displayed quote matches the last selection.

### RC-032 · Money formatting `P1` `DATA`
1. View totals such as 1,234.57, 123456.78, 9,99,999.99; switch languages.
- **Pass:** INR lakh grouping; no float artefacts; advance + balance visibly equals total.

### RC-033 · Advance and balance display `P0` `PRICING`
1. Quote trips with totals around ₹400, ₹1,607, ₹1,965, ₹17,857.
- **Pass:** advance equals the server value (min ₹500 rule, 28% rounded to ₹100); a total below the floor is explained and never shows a negative balance; text is clear in both languages.

### RC-034 · Promo-code UI `P1` `PRICING`
1. Valid, invalid, expired, mixed case, spaces, emoji, applying twice, removing.
- **Pass:** server-authoritative discount; clear messages; the discount never drives the total to ≤0; removal restores the original quote.

### RC-035 · Vehicle selection `P2` `UX`
1. Select vehicles; set passengers above capacity; check inactive tiers; use the keyboard.
- **Pass:** inactive tiers hidden; capacity warnings shown; images fall back gracefully; fully keyboard operable.

### RC-036 · Browser storage tampering and failure `P1` `STATE`
1. Edit `localStorage` values for price, status and ticket; clear storage mid-flow; use private mode/storage disabled; fill the quota to trigger `QuotaExceededError`.
- **Pass:** tampered values are ignored; storage errors are caught (no crash); the flow still works or degrades with a message.

### RC-037 · Manifest cache, ETag and corruption `P1` `DATA` `KNOWN-GAP(audit)`
1. Load the site; inspect the manifest request/response headers and `localStorage`.
2. Reload and check for `If-None-Match` / 304.
3. Replace the stored manifest with: invalid JSON, a 5 MB blob, an old schema version.
- **Pass:** ETag revalidation (304); bounded size and TTL; corrupt/oversized data discarded safely; a freshness indicator is shown when serving stale data.

### RC-038 · Offline and flaky network in the funnel `P1` `RESILIENCE`
1. Switch to offline at steps 2, 3 and 4; restore the network.
2. Run the whole funnel with 20% random request aborts.
- **Pass:** typed data is retained; clear retry affordances; no duplicate drafts; final state is correct.

### RC-039 · API base and environment hygiene `P0` `OPS`
1. In a clean browser profile run the full funnel and export the HAR.
- **Pass:** no request to `localhost`, `127.0.0.1`, staging hosts or non-HTTPS URLs; all calls go to the production API base; no mixed content.

### RC-040 · LocationIQ exposure `P1` `SEC` `KNOWN-GAP(audit)`
1. Search the JS bundle and Network log for a LocationIQ token or direct `locationiq.com` calls.
- **Pass:** no token in the browser; location search goes through the backend proxy (rate-limited, cached).

### RC-041 · Mobile input behaviour `P2` `UX`
1. On iOS Safari and Android: tap each input; check zoom-on-focus, `inputmode`, autofill, safe-area insets, sticky CTA behind the keyboard.
- **Pass:** no unwanted zoom (font-size ≥16 px); correct keyboards; autofill works; the primary button is never hidden by the keyboard.

### RC-042 · Funnel accessibility `P1` `A11Y`
1. Complete the funnel with the keyboard only and a screen reader; run axe on each step; test 200%/400% zoom and reduced motion.
- **Pass:** labels, error `aria-live`, focus moves to the first error, stepper uses `aria-current`, contrast ≥4.5:1, price changes announced.

### RC-043 · Browser/device matrix `P2` `COMPAT`
1. Run the funnel on Chrome, Firefox, Safari iOS, Samsung Internet; widths 360/390/768/1440; 4× CPU throttle.
- **Pass:** no horizontal scroll; no layout breakage; the funnel completes on all targets.

### RC-044 · Randomised funnel vs DB cross-check `P0` `DATA`
1. Run 20 fuzzed funnel sessions (random trips, vehicles, dates, valid text).
2. Run INV-3, INV-5 and compare each UI-displayed total to the DB.
- **Pass:** all invariants hold; UI = API = DB for every session; phone stored canonically; no orphan payment rows.

## D. Payment and booking-status UI (RC-045 to RC-058)

### RC-045 · Checkout happy path `P0` `PAY`
1. Create a draft; open Razorpay checkout (test mode); pay with a test card/UPI.
2. Watch the UI between the provider callback and webhook processing.
- **Pass:** the checkout amount equals the advance; after the provider callback the UI shows **"verifying"** and polls; the voucher/confirmed state appears only after the backend reports `paid_confirmed`; INV-1 holds.

### RC-046 · Payment failure paths `P0` `PAY` (regression of an audit P0)
1. Card decline; insufficient funds; UPI timeout; close the modal.
- **Pass:** never a voucher; a clear message; Retry creates a new checkout; the booking stays `pending_payment`; DB payment `failed` or pending; the ticket remains valid.

### RC-047 · Checkout creation failure and simulation flag `P0` `PAY` (regression of an audit P0)
1. Make `/payments/create-checkout` return 500, 502, a timeout, malformed JSON.
2. Search the production bundle for the payment-simulation control; set `VITE_ENABLE_PAYMENT_SIMULATION=true` on a **production** build.
- **Pass:** failure keeps the user on the payment step with an error and never reaches a success state; the simulation button exists only in development builds with the flag, never in production.

### RC-048 · Fake success tampering `P0` `SEC`
1. In DevTools call the success handler with fake `razorpay_payment_id` / `signature`.
2. Open `/payment/return?status=success&razorpay_payment_id=…`.
- **Pass:** the UI still polls and shows pending; the booking is not paid; INV-1 holds (Law 3).

### RC-049 · Delayed webhook `P1` `PAY`
1. Pay at the provider but delay the webhook by 2 minutes.
2. Hide the tab for a while, then return.
- **Pass:** polling backs off and is bounded; after the timeout a message says "payment received? we will confirm by WhatsApp/email", not "failed"; the state flips without a refresh when the webhook arrives; polling stops afterwards.

### RC-050 · Tab closed after paying `P1` `PAY`
1. Pay, close the tab before the webhook, reopen via the ticket link later.
- **Pass:** the correct final status is shown; voucher/WhatsApp/email delivered exactly once.

### RC-051 · Double-payment prevention `P0` `PAY`
1. Pay; press Back and try to pay again; open the same ticket in two tabs and pay in both.
- **Pass:** a second checkout is blocked once captured (or the first order is voided); at most one capture; INV-2 holds.

### RC-052 · Refresh/restore during checkout `P1` `STATE`
1. Refresh during the redirect; kill and restore the browser session; reopen the payment link.
- **Pass:** the draft is recovered via ticket + token; no new draft; no second order.

### RC-053 · Status page states `P1` `UX`
1. Render each state: `draft`, `checkout_pending`, `captured`, `failed`, `refunded`, `cancelled`; then an unknown status string, `null` fields, missing fields.
- **Pass:** each known state is visually distinct and accurate; unknown/malformed data falls back safely with no crash and no false "paid".

### RC-054 · Booking lookup security `P0` `SEC` `KNOWN-GAP(audit: phone-only)`
1. Look up with ticket + token; ticket only; ticket + phone only; wrong token ×100.
2. Inspect URLs, history and the `Referer` sent to third parties.
- **Pass:** phone alone is rejected (OTP/token required); wrong attempts return one generic message and are rate-limited; the token does not leak via `Referer`, analytics or shared history.

### RC-055 · Voucher content and masking `P0` `PRIVACY`
1. Open the voucher before and after driver assignment; print it; view source.
- **Pass:** shows ticket, fare breakdown, advance paid, balance due, pickup; phone/email masked server-side (raw values absent from the HTML/JSON); driver details appear only after assignment and only to the verified customer; print layout is usable.

### RC-056 · Voucher injection and long data `P1` `SEC`
1. Create bookings with HV-STR names and 500-char notes; open and print the voucher.
- **Pass:** inert output; wrapping works; emoji print correctly; no overflow.

### RC-057 · Provider script/CSP failure `P1` `RESILIENCE`
1. Make the Razorpay script 404 or CSP-blocked.
- **Pass:** a clear fallback message and alternatives; no endless spinner; the booking is not marked failed or paid.

### RC-058 · Cancelled/refunded display `P2` `UX`
1. Open a cancelled and a refunded booking.
- **Pass:** accurate text including refund amount; no misleading "Book again" success state; a support CTA is visible.

## E. Inquiry, review, contact, privacy (RC-059 to RC-064)

### RC-059 · Inquiry submission and rate limit `P1` `CRUD`
1. Submit one valid inquiry; then 6 within a minute (limit 5); then simulate a network failure.
- **Pass:** a success message only after a 201; the 6th shows a friendly rate-limit message; failures keep the form data; DB row count equals successes.

### RC-060 · Inquiry validation and spam `P1` `SEC`
1. Apply HV-STR to every field; double-click submit; 100 rapid submits; include a hidden honeypot value.
- **Pass:** no duplicate rows from double-click; payloads inert; honeypot/duplicate handling works; no header injection in confirmation emails.

### RC-061 · Review submission `P1` `CRUD`
1. Submit with ticket + token; edit the star value to `0`/`6` via DevTools; submit twice; try a not-yet-completed trip; send `verified:true`.
- **Pass:** lands as pending moderation with a clear message; invalid ratings rejected; one review per booking; the "verified" label cannot be self-applied.

### RC-062 · Review display and rating markup `P1` `SEO`
1. View pages with XSS, 5,000-char, emoji and Hindi reviews; paginate; check JSON-LD aggregate rating.
- **Pass:** only published reviews; content inert; pagination works; the aggregate rating equals the DB average (no invented values).

### RC-063 · Contact deep links `P2` `UX`
1. Open WhatsApp/tel/mailto links with messages containing `&`, `#`, newlines, emoji, Hindi.
- **Pass:** correctly URL-encoded; works on desktop and mobile; numbers correct.

### RC-064 · Consent and privacy `P1` `PRIVACY`
1. Load the site with cookies cleared; inspect events and URLs.
- **Pass:** no non-essential tracking before consent; no phone/email in URLs, analytics events or `Referer`; privacy policy accessible (DPDP-aligned).

## F. Customer-side security (RC-065 to RC-076)

### RC-065 · XSS sweep `P0` `SEC`
1. Inject HV-STR XSS into every input, query parameter, hash, `localStorage` value and CMS-sourced field.
2. Specifically try `</script><script>…` inside JSON-LD and titles injected during pre-render.
- **Pass:** nothing executes; the JSON-LD block cannot be broken out of; titles/meta are escaped; no unsafe `dangerouslySetInnerHTML` on untrusted data.

### RC-066 · Prototype pollution and JSON handling `P1` `SEC`
1. Open `?__proto__[x]=1`, `?constructor[prototype][y]=1`; feed a manifest containing `__proto__`; return deeply nested JSON from the API.
- **Pass:** `Object.prototype` unchanged; no crash from deep nesting; invalid payloads discarded.

### RC-067 · Open redirect and unsafe URLs `P0` `SEC`
1. Try `?next=//evil.com`, payment-return URL manipulation, language-switch parameters, CMS links using `javascript:` or `data:`.
- **Pass:** no off-origin navigation; unsafe schemes blocked; external links use `noopener`.

### RC-068 · Bundle secret scan `P0` `SEC`
1. Grep `react/dist` (including sourcemaps) for `DATABASE_URL`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, LocationIQ tokens.
2. Plant a canary secret name and run CI.
- **Pass:** none present; only `VITE_*` public values; sourcemaps not public; CI guard fails on the canary.

### RC-069 · Headers and clickjacking `P1` `SEC`
1. Embed the booking page in an iframe on another origin; check CSP, HSTS, `Permissions-Policy`, `Referrer-Policy`.
- **Pass:** framing blocked; headers present; token-bearing URLs use a strict referrer policy.

### RC-070 · Admin API boundary `P0` `SEC`
1. Search the bundle for `/ops/admin`; call admin routes without a token and with a customer token.
- **Pass:** no admin endpoint constants or keys in the customer bundle; the API returns 401/403.

### RC-071 · Abuse from the browser `P1` `SEC`
1. Loop `/fares/calculate` 100 times in a minute from the UI; watch retries.
- **Pass:** a friendly 429 message; exponential backoff; no infinite retry storm.

### RC-072 · Dependency and CDN integrity `P1` `SEC`
1. Run `npm audit`; verify the lockfile; check third-party scripts for SRI; open a Dependabot PR build.
- **Pass:** no unresolved high/critical issues; lockfile enforced; third-party scripts pinned (or exceptions documented); the PR triggers `npm run verify`.

### RC-073 · CORS probing `P1` `SEC`
1. From an evil origin `fetch` the API with credentials; try `Origin: null`; check preflight caching.
- **Pass:** blocked; only allowlisted origins; no wildcard with credentials.

### RC-074 · Storage inventory `P1` `PRIVACY`
1. List all `localStorage`/`sessionStorage`/cookies after a full funnel.
- **Pass:** only necessary keys; no raw tokens longer than needed; guest token location and expiry documented; PII not stored; logout/expiry clears.

### RC-075 · Enumeration via the UI `P1` `SEC`
1. Script ticket lookups for 500 sequential ids through the UI/API.
- **Pass:** zero disclosures; identical responses for missing and unauthorised; the rate limit triggers.

### RC-076 · Privacy across every surface `P0` `PRIVACY`
1. Check masked data in the DOM, network responses, print view, share text, HTML source and browser autofill history.
- **Pass:** no unmasked phone or email anywhere unless the verified owner explicitly reveals it.

## G. Resilience, performance, devices (RC-077 to RC-090)

### RC-077 · Cold-start backend (Render free tier) `P1` `RESILIENCE`
1. Let the API idle >15 min; load the site and start a booking.
- **Pass:** skeleton plus a "waking up" message; bounded retries with backoff; no infinite spinner; static content readable; the booking CTA explains the delay instead of failing late.

### RC-078 · Partial API failure matrix `P1` `RESILIENCE`
1. Fail one endpoint at a time (fleet, fares, manifest, locations, catalog) with 429, 5xx, HTML 502, invalid JSON, empty arrays.
- **Pass:** each section degrades with a banner; the rest of the page works; no blank page.

### RC-079 · Contract fuzz `P1` `RESILIENCE`
1. Mock responses with wrong types (price as string/NaN/negative/huge), missing images, unknown enums, extra fields.
- **Pass:** error boundaries catch problems; no `₹NaN`; bad items are skipped.

### RC-080 · React lifecycle races `P0` `CONC`
1. Run in dev with StrictMode: start a booking, navigate away mid-request, change routes rapidly.
2. Count drafts and payments in the DB.
- **Pass:** StrictMode double-invoked effects never create duplicate drafts or payments; no state updates after unmount; requests are cancelled or idempotent.

### RC-081 · Memory and timers `P2` `PERF`
1. Navigate 500 times; leave payment polling running; take heap snapshots.
- **Pass:** heap stable; listeners and timers cleaned up; polling stops when finished or on unmount.

### RC-082 · Clock skew `P2` `DATA`
1. Set the device clock ±1 day and ±1 year.
- **Pass:** minimum-pickup validation uses server rules or server time; no wrong "expired" errors; no broken token/timer logic.

### RC-083 · Features disabled `P1` `COMPAT`
1. Disable JavaScript; block cookies and localStorage; use Brave shields/ad-blocker.
- **Pass:** SSG content readable; a clear `noscript` message for booking; blocked storage degrades gracefully; analytics blockers never break the flow.

### RC-084 · Network conditions `P1` `RESILIENCE`
1. Run the funnel on Slow 3G, with 20% packet loss, and with a request aborted **after** it is sent.
- **Pass:** no duplicate drafts; retrying after an abort recovers the same ticket (idempotent) or clearly detects the duplicate.

### RC-085 · Deploy skew `P1` `OPS`
1. Keep an old tab open through a new deploy (renamed API field, missing JS chunk).
- **Pass:** a "new version, reload" prompt appears; no blank page; no stale service-worker or cache trap.

### RC-086 · Very large content `P2` `PERF`
1. Seed a package with 200 stops, 200 gallery images, 1,000 reviews.
- **Pass:** pages stay responsive; images lazy-load; long lists paginate or virtualise.

### RC-087 · Mobile browser quirks `P1` `COMPAT`
1. Test iOS Safari (100vh, bfcache after payment), Android WebView, the WhatsApp and Instagram in-app browsers, UPI intent apps.
- **Pass:** layout correct; bfcache-restored pages resume polling and show the true state; UPI flows complete or fail with a clear message.

### RC-088 · Print, share and link previews `P3` `SEO`
1. Print the voucher; share pages on WhatsApp.
- **Pass:** a clean print stylesheet; per-page OG title/image/description correct.

### RC-089 · Sitewide accessibility `P1` `A11Y`
1. Run axe on 20 pages in both languages; check skip link, heading order, `lang`, focus rings, 200%/400% zoom, high contrast.
- **Pass:** no critical/serious violations; per-page `lang` correct; keyboard reachable throughout.

### RC-090 · Analytics correctness `P2` `DATA`
1. Capture analytics events through a full funnel (including StrictMode).
- **Pass:** each event fires once; the purchase event fires only after backend-confirmed payment; no PII; blocking analytics changes nothing.

## H. Cross-system integrity and CRUD (RC-091 to RC-100)

### RC-091 · Read parity UI = API = DB `P0` `DATA`
1. For fleet, catalog list/detail, fares, locations, booking voucher and reviews, compare the value shown with the API JSON and the DB.
- **Pass:** all three layers match for 30 sampled records.

### RC-092 · Create flows write exactly one row `P0` `CRUD`
1. Create a booking draft, an inquiry, a review and a device registration (if exposed).
2. Inspect the rows.
- **Pass:** exactly one row each; correct column types and UTC timestamps; trimmed whitespace; Unicode stored intact; no extra side-effect rows.

### RC-093 · Update/Delete denial `P0` `SEC`
1. Hash the key tables first. Using crafted requests try PATCH/PUT/DELETE/POST on bookings, catalog, fares, payments, reviews, media, fleet.
2. Hash the tables again.
- **Pass:** 401/403/404/405; tables unchanged. The customer can create and read only what the spec allows.

### RC-094 · Admin→customer propagation `P0` `E2E`
1. Publish, archive, change a price, toggle a vehicle, replace an image in admin.
2. Check the customer site, ETag behaviour, a second backend instance.
- **Pass:** customer reflects every change within the cache window; consistent across instances; static data never overrides live data.

### RC-095 · Property-based funnel fuzzing `P1` `DATA`
1. With fast-check generate 500 valid-ish form payloads; submit through the UI/API.
- **Pass:** no 500s; every response is 2xx or a standard 4xx envelope; INV-3 and INV-5 hold afterwards.

### RC-096 · Abort-after-send idempotency `P0` `CONC`
1. Use Playwright to abort the network **after** the draft/checkout request is sent but before the response arrives; then retry.
- **Pass:** a retry returns the same ticket/order or detects the duplicate; DB shows one booking and one order.

### RC-097 · Cross-device continuity `P1` `UX`
1. Start on mobile; open the ticket link on desktop.
- **Pass:** the token works; the state is identical; the token is not guessable; no other booking is reachable.

### RC-098 · Multilingual data round trip `P1` `I18N`
1. Book with Hindi/emoji/NFD names; follow the data through the DB, voucher, WhatsApp message, email and PDF/print.
- **Pass:** byte-exact in the DB; no mojibake or lost characters anywhere; search finds the booking in admin.

### RC-099 · Synthetic monitoring `P1` `OPS`
1. Run a read-only Playwright check every 5 minutes against staging/production (home, one route, one package, `/health`, `/ready`).
- **Pass:** failures raise an alert; the check never creates bookings or payments; results retained with traces.

### RC-100 · Game-day chaos `P0` `CHAOS`
1. While running the funnel, inject in turn: (a) Postgres failover, (b) Razorpay outage, (c) Supabase Auth down, (d) Cloudflare 520/522 responses.
2. After each, run the reconciliation queries (INV-1 to INV-6).
- **Pass:** the customer never sees false success and is never double-charged; every failure shows a clear message; reconciliation finds zero orphaned or mismatched payments.

---

# FINAL RANKING PROMPT (copy everything below this line into your AI agent or hand it to a QA engineer)

```text
ROLE
You are a principal QA/SRE/SEO auditor. Execute the CUSTOMER SITE test plan (RC-001 … RC-100) in this file against
the ArenaAI / SK Baghel React customer site (bilingual SSG + booking funnel) and produce an evidence-based ranking.

INPUTS
- This file (tests, legend, INV-n, hostile value sets HV-*).
- A staging stack: production build of react/, backend API, disposable Postgres, Razorpay test mode, mock fault-injection server.
- Device/browser matrix from section 1.
- NEVER run destructive, load or chaos tests against production or live payment credentials.

EXECUTION RULES
1. Run every test as written. For every flow that creates or changes data verify THREE layers: what the user sees,
   the Network request/response, and the DB row. Disagreement = FAIL.
2. Record one status per test: PASS | PARTIAL | FAIL | BLOCKED (reason) | N/A (reason).
3. Evidence is mandatory: Playwright trace/screenshot, HAR, curl output, SQL output, Lighthouse/axe report.
   No evidence = BLOCKED, never PASS. Never infer a result from reading code.
4. Re-run race/idempotency tests 3 times (RC-030, 051, 080, 084, 096). A single failure = FAIL.
5. If a route, label or behavior differs from the docs, test the real behavior and log it in the DRIFT LIST.
6. KNOWN-GAP(audit) tests are expected to fail today; execute and score them and note "fixed since audit" if they pass.
7. For every failure give: minimal reproduction, expected vs actual, violated rule (Law #, audit line, INV-n), concrete fix.

SCORING
- Weights: P0=10, P1=5, P2=3, P3=1. PASS=100%, PARTIAL=50%, FAIL=0%, BLOCKED/N-A excluded from the denominator.
- Overall score = 100 × earned / possible. Also score each tag:
  SEO, I18N, PRICING, DATA, PAY, SEC, PRIVACY, CONC/STATE, RESILIENCE/PERF, A11Y/UX/COMPAT, E2E/OPS, CHAOS.
- Coverage confidence = tests executed with evidence / 100. Below 90% => PROVISIONAL rank.

GATES (caps override the score)
- Any case where the UI shows a confirmed/paid/voucher state without backend paid_confirmed (RC-046, 047, 048, 100)
  -> rank capped at D and flag "FALSE-SUCCESS BREACH".
- Client-controlled price/amount accepted (RC-023) or double charge possible (RC-051, 096) -> capped at D.
- Any P0 FAIL tagged SEC or PRIVACY (XSS, secret in bundle, PII leak, open redirect) -> capped at D.
- Any other P0 FAIL -> capped at C.
- 3+ P1 FAILs inside one category -> that category is RED; two RED categories cap the rank at C.
- Ranks: S >= 95 (no P0/P1 FAIL) | A 85–94 | B 70–84 | C 55–69 | D 40–54 | F < 40.
- Release verdict: GO only if rank >= B, zero P0 FAIL, no FALSE-SUCCESS BREACH.

OUTPUT (in this order)
1. VERDICT: rank letter, score, coverage confidence, GO/NO-GO, one-paragraph rationale.
2. CATEGORY TABLE: category | tests | pass/partial/fail/blocked | score | GREEN/AMBER/RED.
3. CUSTOMER-TRUST REPORT: every moment the user could see a wrong price, a false success, someone else's data, or lose typed data.
4. SEO/AEO REPORT: indexability, hreflang, soft-404s, structured-data truthfulness, lifecycle behavior (archived/paused/retired).
5. TOP 10 RISKS: severity × exploitability × customer impact (₹ and trust), with test ids and fixes.
6. FAILED/PARTIAL LIST: id | UI vs API vs DB observation | repro | root-cause hypothesis | fix | effort (S/M/L).
7. PERFORMANCE & ACCESSIBILITY SUMMARY: Lighthouse/axe numbers per key page, per language.
8. DRIFT LIST: docs vs UI vs API vs DB mismatches.
9. KNOWN-GAP STATUS: each audit gap (static-first data, localStorage manifest, ETag, direct LocationIQ, phone-only lookup) -> open / fixed.
10. 30/60/90-DAY HARDENING PLAN ordered by risk reduction per effort.
11. MACHINE-READABLE BLOCK:
    {"rank":"","score":0,"coverage":0,"verdict":"GO|NO-GO","caps":[],
     "categories":{"PAY":0},"results":[{"id":"RC-001","status":"PASS","evidence":"path","notes":""}]}

AFTER FIXES
Re-run FAIL/PARTIAL/BLOCKED tests plus INV checks and output a DELTA report (score change, regressions).
Honesty rule: if you could not run something, say so. A lower honest score beats an inflated one.
```
