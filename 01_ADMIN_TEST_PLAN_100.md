# SK Baghel Tour & Travels (ArenaAI) — ADMIN Operations Desk Test Plan: 100 Tests

**Target:** `admin/` — React 19 + Vite 7 + Tailwind 4 SPA on Cloudflare Pages (`admin.agraskbagheltourandtravels.com`), Supabase Auth (email/password + Google OAuth PKCE), talking to the Fastify API under `/api/v1/ops/admin/*`, backed by PostgreSQL.
**Derived from:** repo README, `docs/DEPLOYMENT.md` (admin auth setup, `_redirects`, `_headers`, roles), `BACKEND_RULES.md` and `ADMIN_CUSTOMER_BACKEND_AUDIT_AND_OPERATING_SPEC.md` (audit dated 27 Sep 2026, including the 70-operation admin inventory).
**Important:** I did not read the admin source code. Every test here drives the **UI and then verifies the API and DB underneath**, so a UI that lies about success is caught. Where the real screen, label or route differs from the docs, record it in the **Drift list** at the end of the ranking prompt.

---

## 0. How this plan was designed (technique sources)

- **OWASP API Top 10 playbooks:** BOLA/IDOR, mass assignment, JWT claim tampering, vertical privilege escalation. This drives the AUTH and permission tests (AD-001 to AD-012, AD-070, AD-076).
- **Concurrency write-ups:** two-session barrier tests; sequential runs hide races. This drives the two-browser tests (AD-022, AD-041, AD-054, AD-069, AD-077).
- **Playwright/QA practice:** network abort, slow network, rage-click double submit, 20% failure injection, trace/video on failure. This drives AD-024, AD-025, AD-085 to AD-091.
- **Payment chaos tooling:** duplicate webhooks, minimum-amount edge cases, provider failures. This drives the finance tests (AD-065 to AD-074).
- **The repo's own audit:** many tests target gaps it admits (role collapse, fare engine static data, media validation, compensating deletes, missing promo/notification admin, ignored audit `limit`). These are tagged `KNOWN-GAP(audit)`.
- **Source honesty note:** Reddit/X/Instagram threads were not retrievable through my search tool. The patterns come from engineering blogs, OSS repos, vendor docs and OWASP material.

## 1. Environment (staging only; never test destructively on production)

- Admin at `http://localhost:5174` (the README port) against backend `http://localhost:4000` and a disposable Postgres. A second Supabase project is useful for the environment-mismatch test.
- Browsers: Chrome + Firefox, two profiles (to simulate two staff users), mobile emulation, `Playwright` with trace on.
- Staff users: one per role (`content_editor`, `moderator`, `dispatcher`, `finance`, `super_admin`) via `app_metadata.role`, plus a user with **no** role and a user whose role is only in `user_metadata`.
- Tools: DevTools Network/Application tabs, `curl`, `psql`, `k6` (light), `jwt_tool`, a mock Razorpay/WhatsApp server for failure injection.

## 2. Legend

- **Severity:** `P0` money / security / data-loss release blocker · `P1` major · `P2` moderate · `P3` minor.
- **KNOWN-GAP(audit):** flagged as unfixed in the repo's audit. Expect FAIL today. If already fixed, it becomes a regression guard. It still counts in the score.
- **UI→API→DB rule:** every test has an implicit three-layer check. (1) what the UI shows, (2) the Network request/response, (3) the DB row and the audit-log row. If the layers disagree, it is a FAIL.
- **INV-n:** run after any booking/payment test: **INV-1** no confirmed booking without a captured payment of the right amount · **INV-2** one captured payment per booking · **INV-3** `total = base + night + driver − discount` and `balance = total − advance ≥ 0` · **INV-4** Σ refunds ≤ payment amount · **INV-5** unique ticket ids, monotonic `version` · **INV-6** cancelled bookings have no un-refunded capture.

### Hostile value sets (reused everywhere)

- **HV-NUM:** `0, -0, -1, 0.001, 1e308, 1e-9, NaN, Infinity, "10", "1,000", "₹1500", "１０", [10], null, true, 9007199254740993, 2147483648, 100.005, 1500.999, 0001500`
- **HV-STR:** `"", " ", "\u200b\u200b", 1 char, 2 chars, 10,000 chars, "'; DROP TABLE x;--", "<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)", "${7*7}", "{{7*7}}", "\u0000", "😀"×50, "आगरा", "مرحبا", NFC vs NFD "é", "a\r\nBcc: x@y", "=cmd|' /C calc'!A0", "../../etc/passwd"`
- **HV-FILE:** `.jpg that is HTML, PHP polyglot, SVG with <script>, 0 bytes, truncated JPEG, PNG labelled jpeg, 25 MB image, 40000×40000 PNG bomb, animated GIF, EXIF-GPS JPEG, filename "../../x.jpg"`
- **HV-ID:** `another record's id, non-existent id, UUID v1, nil UUID, UPPERCASE UUID, SQL meta, 1 MB string`

### CRUD coverage map

| Entity | Create | Read | Update | Delete / Archive |
|---|---|---|---|---|
| Catalog item | AD-017–021 | AD-031 | AD-022–025, AD-032 | AD-028–030 |
| Media | AD-034–036 | AD-037 | AD-037–038 | AD-038 |
| Fare rules / Fleet | AD-040 | AD-039 | AD-041–048 | AD-044 (inactive) |
| Booking | AD-052 | AD-049–051 | AD-053–057 | AD-058 |
| Payment / Refund | AD-072 | AD-065–066 | AD-067–071 | refund = reversal |
| Review / Inquiry / Promo | AD-081 | AD-075, AD-079 | AD-075–080 | AD-075 (archive) |
| Audit / Staff session | AD-084 | AD-084 | blocked | blocked |

---

# TESTS

## A. Authentication and session (AD-001 to AD-012)

### AD-001 · Email/password login happy path `P0` `AUTH`
1. Open `/login`; sign in with a staff user whose `app_metadata.role=super_admin`.
2. Watch Network and Application → Storage.
3. Note where the session is stored and whether the dashboard flashes before validation.
- **Pass:** `GET /ops/admin/audit-logs?limit=1` (or equivalent) succeeds **before** the shell renders; the user lands on the intended route; no refresh token or JWT printed to the console; storage location is documented.

### AD-002 · Missing role claim is denied `P0` `AUTH` (regression of the fixed fail-open bug)
1. Create a confirmed Supabase user with no `app_metadata.role`.
2. Log in with correct credentials.
3. Call an admin API directly with that token.
- **Pass:** "Access denied" screen; no dashboard; stored session cleared; the API returns 403.
- **DB:** `auth.users` unchanged by the login attempt.

### AD-003 · User-editable metadata cannot grant admin `P0` `AUTH`
1. In a browser console using the Supabase client, sign up a user and run `auth.updateUser({data:{role:'super_admin'}})`.
2. Log in to admin with that user.
- **Pass:** denied; `raw_user_meta_data` is ignored; the token has no `app_metadata.role`.

### AD-004 · Non-staff Google account, single-email lock, local-port drift `P0` `AUTH`
1. Google login with: (a) a non-staff account; (b) a staff account while `VITE_ADMIN_EMAIL` is set to someone else; (c) the right address in different case; (d) an unverified email.
2. Run admin locally on `5174` (README port) and attempt Google login.
- **Pass:** denied unless the email matches exactly under the documented rule; clear message. DEPLOYMENT.md lists `localhost:5173` as the local OAuth origin while the README runs admin on `5174`; if 5174 fails, log it as DRIFT with the root cause.

### AD-005 · OAuth PKCE callback abuse `P0` `AUTH`
1. Visit `/auth/callback` with: no code; a random code; a code reused after a successful login; a code from another browser; tampered `state`; `?redirect=https://evil.example`; `?next=//evil`; verifier removed from storage.
- **Pass:** every case ends at login with an error; no token stored; no navigation to another origin; the PKCE verifier is single-use.

### AD-006 · Forged or expired stored session `P0` `AUTH`
1. In DevTools replace the stored Supabase session with: a random string, an attacker-signed JWT with `role=super_admin`, an expired real token, a token from another project, a real token with the role field edited.
2. Reload.
- **Pass:** login screen only; dashboard never renders; API returns 401; storage cleared.

### AD-007 · Token expiry mid-edit `P1` `AUTH`
1. Open a catalog edit form and change several fields without saving.
2. Expire the token (shorten TTL server-side or wait).
3. Click Save.
- **Pass:** silent refresh succeeds or a re-auth prompt keeps the form values; no silent data loss; no duplicate submission after re-auth.

### AD-008 · Sign-out and multi-tab consistency `P1` `AUTH`
1. Log in in two tabs.
2. Sign out in tab A; in tab B click any action.
3. In tab A press browser Back.
- **Pass:** tab B becomes logged-out on its next action or via a storage event; Back shows login, not cached pages; tokens and cached identity cleared; sensitive pages are not served from bfcache.

### AD-009 · Live role downgrade `P1` `AUTH`
1. While logged in as super_admin, remove the role in Supabase.
2. Keep using the app (refund, publish, unmask).
- **Pass:** the next privileged call gets 403; the UI shows "access revoked" and logs out; no stuck spinner; the stale-token window is documented.

### AD-010 · Brute force and user enumeration `P1` `AUTH`
1. Submit 25 wrong passwords.
2. Compare messages and timings for unknown email vs known email.
3. Try email variants (case, surrounding whitespace).
- **Pass:** generic error text and indistinguishable timing; throttling message appears; variants don't bypass lockout.

### AD-011 · MFA-enforced account `P2` `AUTH`
1. Log in with a user who has an enforced TOTP factor.
- **Pass:** a clear "MFA not supported in this admin build" message (documented gap), no infinite spinner, no partial session. Do not disable the factor to work around it.

### AD-012 · Security headers, robots, secrets in bundle `P0` `SEC`
1. `curl -I` the admin domain; fetch `/robots.txt`.
2. Grep `admin/dist` for `SERVICE_ROLE`, `RAZORPAY`, `DATABASE_URL`, `RESEND`, `LOCATIONIQ`, `sk_`, `.env`, and any public `.map` files.
3. Plant a fake secret name in the build env and confirm the CI guard fails.
- **Pass:** `X-Robots-Tag: noindex, nofollow`; `Disallow: /`; clickjacking protection (`X-Frame-Options` or `frame-ancestors`); HSTS; no secrets; no public sourcemaps; the CI guard catches the canary.

## B. Routing, deploy, environment (AD-013 to AD-016)

### AD-013 · Deep links and return-to `P1` `ROUTING`
1. Logged out, open `/bookings/123`; log in.
2. Logged in, refresh `/catalog/new`.
3. Try `/bookings/../..` and encoded characters.
- **Pass:** return-to works and cannot be abused as an open redirect; SPA fallback (`200.html`) works; no Cloudflare 404.

### AD-014 · Unknown routes and `_redirects` sanity `P2` `ROUTING`
1. Visit `/nope`, `/bookings/xyz`, `/catalog/<SQLi>`, `/%00`.
2. Inspect `admin/dist/_redirects` and `200.html`; run a Cloudflare Pages dry-run/deploy to staging.
- **Pass:** in-app 404 with navigation; invalid IDs show "Not found", not a crash; no catch-all rewrite that triggers Cloudflare's infinite-loop error (code 100324).

### AD-015 · Backend unreachable `P1` `RESILIENCE`
1. Point `VITE_API_BASE_URL` to a dead host; separately block the API in DevTools; simulate a Cloudflare 502 HTML body and a CORS failure.
- **Pass:** "Backend is not connected" with retry; no white screen or infinite spinner; the UI distinguishes offline vs 401 vs 5xx.

### AD-016 · Environment mismatch `P1` `OPS`
1. Build admin with the staging Supabase project but the production API (JWT secret mismatch).
2. Build a production admin with `VITE_API_BASE_URL=http://localhost:4000`.
- **Pass:** login yields a clear "token rejected by API" diagnostic; CI rejects localhost in production builds; no data from the wrong environment is displayed.

## C. Catalog CMS: create, read, update, lifecycle, media (AD-017 to AD-038)

### AD-017 · Create catalog item (happy path) `P0` `CRUD`
1. Catalog → New; fill type, title, slug, summary, price, duration, stops; Save.
2. Check Network, then DB.
- **Pass:** `201`; row in `catalog_items` with status `draft`; audit row with actor, requestId, before/after; item visible in the list; **not** visible on the public API.

### AD-018 · Create validation and slug rules `P1` `DATA`
1. Apply HV-STR to title, slug, summary.
2. Duplicate slug (`Taj` vs `taj`); Hindi title with an empty slug; slug `new`, `admin`, 200 chars.
- **Pass:** field-level errors; slug unique case-insensitively and URL-safe; auto-slug from Devanagari is handled sensibly (no empty slug); server rejects the same inputs sent via `curl`.

### AD-019 · Price field type probe `P0` `DATA`
1. In the price field enter HV-NUM including `1,500`, `₹1500`, `0001500`, `1500.999`, negative, `0`, `1e12`.
2. Inspect the request payload and DB.
- **Pass:** value is parsed deliberately (locale commas handled or rejected clearly); DB `NUMERIC` exact to 2 dp; negative/absurd values rejected; the UI never sends the string `"NaN"`.

### AD-020 · Duration and stops arrays `P2` `DATA`
1. Add 500 stops; reorder; add empty, duplicate and 10,000-char stops; set duration `0`, `-1`, `2.5`.
- **Pass:** bounded array/length enforced with clear errors; reorder persists exactly; UI stays responsive; no 5xx.

### AD-021 · Rich-text/HTML XSS `P0` `SEC`
1. Put `<script>`, `<img onerror>`, `<iframe>`, `javascript:` links into description and captions.
2. Save; view in admin preview and on the customer page.
- **Pass:** sanitised server-side; rendered inert in admin and on the customer site; stored value is safe.

### AD-022 · Concurrent edit by two admins `P0` `CONC`
1. Two browsers open the same item at version N.
2. Browser A saves a title change; browser B (stale) saves a price change.
- **Pass:** B receives a conflict message (version/ETag) and can merge or reload; no silent overwrite of A's change. Silent last-write-wins is a FAIL.

### AD-023 · Unsaved-changes guard `P2` `UX`
1. Edit a field; click a nav link, press Back, refresh, close the tab.
- **Pass:** a leave-page warning each time; after confirming "stay", values are intact.

### AD-024 · Double-click Save/Publish `P0` `CONC`
1. Rage-click Save 10 times in 1 s; repeat for Publish and Archive. Use Enter-key repeat too.
- **Pass:** one request or idempotent requests; one audit row; one version bump; the button disables while pending.

### AD-025 · Save under network failure `P1` `RESILIENCE`
1. With Playwright `route.abort()`, then HTTP 500, then a 30 s timeout, then 20% random failure while saving a new item.
- **Pass:** visible error; form values retained; Retry works; no duplicate item created after a request that succeeded server-side but timed out on the client (check DB count).

### AD-026 · Publish gating `P0` `STATE`
1. Try to publish an item missing media, alt text, or price.
2. Bypass the disabled button via `curl`.
- **Pass:** UI blocks with reasons; the server independently returns 409/422; DB status stays `draft`.

### AD-027 · Publish propagation to the customer site `P0` `E2E`
1. Publish an item.
2. Poll the public catalog/manifest endpoint and the customer page.
- **Pass:** appears within the documented cache window; DB `status='published'` and `published_at` set; audit row; manifest ETag changes; customer page shows the same title/price/media.

### AD-028 · Lifecycle commands: pause, archive, restore, retire `P0` `STATE`
1. Run Save Draft → Publish → Pause → Archive → Restore → Retire on one item; at Retire test each outcome (preserve / 301 / 410).
2. At each step check the public URL, `bookable`, sitemap membership, and structured data.
- **Pass:** behaviour matches the lifecycle table (archived/paused keep the URL and drop the booking CTA; retired → 301 or 410); retirement demands a reason and one outcome; an impact panel is shown; every step audited.

### AD-029 · Contradictory lifecycle combos `P1` `STATE`
1. Using DevTools/`curl` send `archived + bookable=true`, `draft + indexPolicy=index`, `redirectTarget` to an external site, to itself, or to a missing page.
- **Pass:** all rejected by the server; redirect loops impossible.

### AD-030 · No destructive delete of items with bookings `P0` `DATA`
1. Create a booking against an item; then archive and (via API) try hard-DELETE the item.
2. Open the old booking's voucher and admin detail.
- **Pass:** hard delete blocked; the booking keeps its immutable snapshot (title, price, version); the voucher still renders.

### AD-031 · List, search, filter, pagination `P1` `DATA`
1. Seed 10,000 items. Filter by type/status; search `%`, `_`, `'`, emoji, Hindi; sort by each column; page to the end.
- **Pass:** server-side pagination; LIKE wildcards escaped; stable ordering with identical timestamps (no duplicates/skips); proper empty and loading states; list renders <2 s.

### AD-032 · Slug change after publish `P1` `SEO`
1. Change the slug of a published item.
- **Pass:** blocked, or the old URL 301s to the new one; the stable-URL policy holds; sitemap and canonical update; nothing 404s.

### AD-033 · Unicode and normalisation `P2` `DATA`
1. Create items titled `Café` in NFC and NFD, Hindi, mixed RTL, emoji.
- **Pass:** no duplicate-slug bypass via normalisation forms; display and search are consistent; UTF-8 round-trips through DB and customer pages.

### AD-034 · Media upload happy path `P0` `CRUD`
1. Upload JPEG, PNG, WebP; watch the progress UI; set alt text and caption.
- **Pass:** storage object plus `catalog_item_media` row created; correct MIME and dimensions recorded; thumbnails show; media stays unpublished until a publisher acts.

### AD-035 · Hostile uploads `P0` `SEC` `KNOWN-GAP(audit)`
1. Upload each HV-FILE item.
2. List the storage bucket afterwards.
- **Pass:** rejected by magic-byte + full-decode + pixel/size cap, not by extension; SVG rejected or sanitised; EXIF stripped; clear UI error; nothing left in storage; memory/CPU spike bounded.

### AD-036 · Upload failure compensation `P0` `DATA` `KNOWN-GAP(audit)`
1. Kill the network mid-upload; separately force a DB failure right after the storage write.
2. Compare storage listing, DB rows, and the UI.
- **Pass:** no orphan object, no ghost thumbnail; the UI offers retry and shows the true state.

### AD-037 · Media metadata and gallery order `P1` `CRUD`
1. Edit alt text and caption (HV-STR); drag-reorder 50 images (mouse and touch); two admins reorder at once.
2. Publish an image without alt text.
- **Pass:** alt text mandatory for published images; caption XSS inert; unique, gap-free `sort_order`; concurrent reorder is deterministic and surfaces a conflict.

### AD-038 · Media publish/archive/delete vs parent state `P1` `STATE`
1. Archive a media item that is the cover; delete another; publish media on a draft parent.
2. Request each public media URL anonymously.
- **Pass:** cover falls back safely; deleted media → 404 (CDN purged) and storage object removed; media of a non-published parent is never public.

## D. Fare rules, fleet, pricing (AD-039 to AD-048)

### AD-039 · Read active fare rules `P1` `CRUD`
1. Open Fare Rules.
- **Pass:** shows the active version number and effective date; every vehicle's name, seats, luggage, per-km rate, active flag; values equal DB.

### AD-040 · Draft version does not affect live quotes `P0` `PRICING`
1. Create a new fare-rule version (inactive draft).
2. Call the public `/fares/calculate` and `/fleet`.
3. Use the preview tool to compare old vs new on sample trips.
- **Pass:** public results unchanged until activation; the preview shows per-sample deltas.

### AD-041 · Activation and rollback transaction `P0` `CONC`
1. Two admins click Activate on different versions simultaneously.
2. Roll back to the previous version.
- **Pass:** exactly one active version (DB partial unique index); old versions immutable; rollback creates an audited, selectable prior version; losing admin sees a conflict message.

### AD-042 · Per-km rate input probe `P0` `DATA`
1. Enter HV-NUM plus `9999.99`, `10000`, `12.345`, `12,5`, `1e2`, `abc`.
- **Pass:** invalid rejected with a clear message; `NUMERIC(6,2)` overflow gives 422 (not 500); the DB holds the previous value after a rejection.

### AD-043 · Seats and luggage integer probe `P1` `DATA`
1. Seats: `0, -1, 2.5, 100, 1e3, "7 "`. Luggage: `-1, 0, 2.5`.
- **Pass:** positive integers only (seats), non-negative (luggage); sane upper bounds; field-level errors.

### AD-044 · Toggle a vehicle inactive `P0` `PRICING`
1. Mark one tier inactive; then mark **all** tiers inactive.
2. Check the customer fleet page, a fare quote, and a booking draft; open an existing booking for that tier.
- **Pass:** inactive tier hidden and unbookable (quote/draft → 422); existing bookings unaffected; all-inactive is guarded with a warning and a graceful customer message.

### AD-045 · Propagation consistency across three endpoints `P0` `PRICING` `KNOWN-GAP(audit)`
1. Activate a new version with +10% rates.
2. Within the cache window compare `/fleet`, `/fares/calculate` and a new booking draft.
- **Pass:** all three show the same version and numbers. (The audit says public fare calculation still uses static data; expect FAIL today.)

### AD-046 · Existing bookings are immutable after price changes `P0` `PRICING`
1. Note an old booking's totals; activate a new version; reopen the booking in admin and the customer voucher.
- **Pass:** totals, advance and `fare_rules_version` unchanged; INV-3 holds for old and new bookings.

### AD-047 · Audit actor on fare changes `P0` `SEC` `KNOWN-GAP(audit)`
1. As user X change a fare value.
2. Read the audit log.
- **Pass:** actor equals X's id/email, not a literal `super_admin`; before/after JSON present.

### AD-048 · Extreme change guardrail `P2` `UX`
1. Type 100× the current rate (an accidental extra zero) and Save.
- **Pass:** a confirm dialog or delta-threshold warning shows the percentage change and affected sample quotes; cancel leaves the DB unchanged.

## E. Bookings and dispatch (AD-049 to AD-064)

### AD-049 · Bookings list `P1` `CRUD`
1. Open Bookings with 100,000 rows. Filter by status, date range, phone, ticket; sort; paginate.
- **Pass:** server-side pagination; PII masked by default; first paint <2 s; counts equal `SELECT count(*)`.

### AD-050 · Booking detail shows the immutable fare snapshot `P0` `DATA`
1. Open a booking; compare each money field to the DB; check `fare_rules_version`.
- **Pass:** UI equals DB; INV-3 holds; no UI-side recomputation that disagrees with the stored snapshot.

### AD-051 · Unmask PII is explicit and audited `P0` `PRIVACY`
1. Click "Unmask" on a booking as an authorised role; navigate away and back.
2. Try as an unauthorised role; try via `curl`.
- **Pass:** each unmask writes an audit row (actor, booking, reason); data re-masks on navigation; exports/clipboard follow the same rule; unauthorised → 403.

### AD-052 · Manual booking uses the server fare engine `P0` `CRUD`
1. Create a booking from the admin page; try typing a total/advance (should be impossible); apply HV-STR/phone cases.
- **Pass:** UI has no free-text fare field; server computes the fare; the row matches a customer-created booking for identical inputs; phone normalisation identical to the customer flow.

### AD-053 · Transitions: only valid next states `P0` `STATE`
1. For bookings in each status, list the transition buttons offered.
2. Force an invalid transition via `curl`; send a stale `expectedVersion`.
- **Pass:** UI offers only legal moves; invalid → 400 `INVALID_TRIP_TRANSITION` shown clearly; stale version → conflict with refresh; `paid_confirmed` cannot be set manually.

### AD-054 · Two dispatchers assign at once `P0` `CONC`
1. Two browsers open the same paid booking; each picks a different driver; click Assign at the same moment (Playwright barrier).
- **Pass:** one wins, the other sees a conflict; DB has one `assigned_driver_id`; one notification sent; the loser's UI refreshes.

### AD-055 · Assignment preconditions and overlap `P0` `STATE` `KNOWN-GAP(audit ops 50/51)`
1. Try assigning on an unpaid booking; an unverified driver; an `off_duty` driver; a vehicle of the wrong tier; a driver already on an overlapping trip.
- **Pass:** each blocked with a specific reason; overlap prevented at the DB level, not only in the UI.

### AD-056 · Notify-driver via WhatsApp `P1` `INTEG`
1. Send the driver details; fail the provider (500/timeout); retry.
2. Use names/notes with emoji, `*bold*`, newlines, and >1024 chars.
- **Pass:** message sent at most once per confirmed success; failure shows "failed/retry" (never "sent"); retry idempotent; formatting injection neutralised; limits respected.

### AD-057 · Reschedule `P1` `STATE`
1. Reschedule to past dates, return-before-pickup, across the night-allowance boundary.
- **Pass:** requote policy applied server-side; invalid dates rejected; snapshot update audited; customer notified once.

### AD-058 · Cancel booking decision flow `P0` `STATE`
1. Cancel bookings in `pending_payment`, `paid_confirmed`, `driver_assigned`; double-click confirm.
- **Pass:** pending → cancelled (provider order voided); paid/assigned → refund decision required; double-click harmless; final DB states match INV-6.

### AD-059 · Internal notes stay internal `P0` `PRIVACY`
1. Add notes with `<script>`, 10,000 chars, emoji; edit from two sessions.
2. Fetch the customer voucher API.
- **Pass:** notes never appear in customer APIs; escaped in admin; length-bounded; concurrent edits don't silently overwrite.

### AD-060 · Search by phone/ticket `P1` `DATA`
1. Search `9876`, `+91 98765 43210`, `%`, `' OR 1=1--`, whitespace, Arabic-Indic digits, a full ticket id.
- **Pass:** deterministic matching rules; no SQL error; no table dump; wildcards escaped.

### AD-061 · CSV export safety `P0` `SEC`
1. Create bookings with names/notes starting `=`, `+`, `-`, `@`, containing commas, quotes, newlines and Hindi text; export CSV.
2. Open in Excel/LibreOffice; compare row count to DB.
- **Pass:** formula-injection neutralised (leading `'`); proper quoting; UTF-8 BOM so Hindi displays; row count equals DB; PII masked unless the role is authorised.

### AD-062 · Timezone display `P1` `DATA`
1. Run the browser in `TZ=America/Los_Angeles`, `Asia/Kolkata`, `Pacific/Kiritimati`; view the same booking.
2. Test pickups at 23:30 and 00:30 IST and the date picker's off-by-one behaviour.
- **Pass:** pickup time displays consistently in the documented zone (IST); no day shift; edits round-trip without changing the instant.

### AD-063 · Freshness and optimistic UI rollback `P1` `UX`
1. Create a booking from the customer site; watch the list (refresh/poll).
2. Perform a transition while the server rejects it.
- **Pass:** new data appears within the documented refresh time; a rejected action rolls the UI back to the server state with an error; no stale status shown as final.

### AD-064 · Odd data layout `P3` `UX`
1. View bookings with 500-char notes, emoji names, null email, null drop address, very long addresses.
- **Pass:** no layout break or horizontal overflow; nulls rendered as "—"; no `undefined`/`null` text.

## F. Payments, refunds, finance (AD-065 to AD-074)

### AD-065 · Payments list and amount formatting `P0` `DATA`
1. Filter by provider/status/date. Check amounts for `1`, `99`, `123456`, `99999999` paise.
- **Pass:** paise→rupees exact (e.g. 123456 paise = ₹1,234.56); no float drift; INR grouping consistent; totals equal the DB sum.

### AD-066 · Ledger vs booking mismatch visibility `P0` `MONEY`
1. Seed (in staging DB) a captured payment on a `pending_payment` booking, and a `paid_confirmed` booking without a capture.
2. Open the finance/reconcile view.
- **Pass:** both anomalies are flagged for reconciliation; none shown as healthy.

### AD-067 · Refund happy path `P0` `MONEY`
1. Refund a captured payment in full from the UI; confirm the modal shows the exact amount.
- **Pass:** `refunds` row, payment `refunded`, booking `refunded`, audit row; INV-4 holds; provider receives the same amount.

### AD-068 · Refund amount input probe `P0` `DATA`
1. Enter HV-NUM, more than captured, rupee decimals vs paise, a pasted `₹1,200`, partial refunds that sum to more than captured.
- **Pass:** over-refund impossible (INV-4); decimals exact; clear errors; no refund created on rejection.

### AD-069 · Refund double-submit and two admins `P0` `CONC`
1. Rage-click Refund; then two admins refund the same payment simultaneously.
- **Pass:** exactly one provider refund per idempotency key; both UIs end in the same state; one audit row.

### AD-070 · Refund permissions `P0` `SEC` `KNOWN-GAP(audit: roles collapse)`
1. Log in as dispatcher, content admin, finance; look for Refund; call the refund API directly.
- **Pass:** only the designated role sees and can use refund; others 403. Record whether roles are truly separated (the audit says they collapse to `super_admin`).

### AD-071 · Refund provider failure `P0` `MONEY`
1. Make the provider return 500, a timeout after acceptance, and "already refunded".
- **Pass:** UI shows pending/failed (never "success" prematurely); the DB status is not the default `'processed'` until confirmed; retry cannot double-refund.

### AD-072 · Retry failed payment `P1` `MONEY` `KNOWN-GAP(audit: new op)`
1. For a failed payment click Retry.
- **Pass:** a new idempotency key and new order; history preserved; the old order can never mark the booking paid twice.

### AD-073 · Webhook visibility and redaction `P1` `PRIVACY`
1. Open the raw-event/webhook view for duplicate and out-of-order events.
- **Pass:** duplicates and ordering are visible; signatures and secrets are redacted; PII masked.

### AD-074 · Finance totals and day boundaries `P1` `MONEY`
1. Compare dashboard revenue (captured − refunded) with SQL for: IST day boundaries, a refund after month end, a captured payment at 23:59:59 IST.
- **Pass:** UI equals SQL exactly under one documented timezone; no rounding drift.

## G. Reviews, inquiries, promos, notifications, audit (AD-075 to AD-084)

### AD-075 · Review moderation queue `P1` `CRUD`
1. Approve, reject (with and without a reason), archive and publish reviews; run a bulk action on 100 items.
- **Pass:** reject requires a reason; state machine `pending→approved→published` enforced; every action audited; bulk is atomic or reports per-item results.

### AD-076 · Review content and verification abuse `P0` `SEC`
1. Reviews with XSS, 10,000 chars, emoji; try forcing `verified:true` via the API; a moderator tries to publish.
- **Pass:** content inert; `verified` is server-derived; publish limited to the designated role (record role-collapse as KNOWN-GAP).

### AD-077 · Concurrent moderation `P1` `CONC`
1. Two moderators approve and reject the same review at once.
- **Pass:** one final state; the other gets a conflict; one audit trail entry per accepted action.

### AD-078 · Review spam handling `P2` `OPS`
1. Seed 50 pending reviews from one IP/ticket; use bulk reject.
- **Pass:** duplicates detected or easy to bulk-handle; rate limits honoured; list stays responsive.

### AD-079 · Inquiries list and update `P1` `CRUD`
1. Filter by status/type/date; assign an owner; add notes; update status; use HV-STR in notes.
- **Pass:** statuses validated; notes escaped; changes audited; list exports follow CSV rules (AD-061).

### AD-080 · Inquiry state machine and concurrency `P2` `STATE`
1. Move `closed → new`; two sales users update the same inquiry at once.
- **Pass:** illegal moves rejected (or explicitly allowed by policy); concurrent updates produce a conflict, not silent overwrite.

### AD-081 · Promo CRUD and redemption race `P1` `CRUD` `KNOWN-GAP(audit: promo CRUD missing)`
1. If promo admin exists: create, activate, expire; set percent `>100`, negative, duplicate codes with different case.
2. Fire 20 parallel bookings with a `max_redemptions=1` code.
- **Pass:** exactly one redemption; invalid values rejected. If the feature does not exist, record "missing capability" (counts as FAIL per audit).

### AD-082 · Notification retry/revoke `P1` `OPS` `KNOWN-GAP(audit)`
1. Break WhatsApp/email, then open the notification queue; retry; revoke a stale device token.
- **Pass:** failed jobs visible with retry count and cap; revoke works; no infinite retry loops. If missing, record the gap.

### AD-083 · Template/header injection `P1` `SEC`
1. Create bookings whose name/notes contain `\r\nBcc: attacker@x`, `*bold*`, emoji, and 2,000 chars; trigger email and WhatsApp.
- **Pass:** no header injection or extra recipients; formatting injection neutralised; length limits applied.

### AD-084 · Audit log viewer `P0` `SEC` `KNOWN-GAP(audit: limit ignored, export missing)`
1. Filter by actor, resource type/id, date range; set `limit=1,10,500`; click Export; correlate by request id.
2. Try editing/deleting entries through the UI and API.
- **Pass:** filters exact; `limit` honoured; export server-side and free of secrets/PII; entries immutable; before/after JSON redacted.

## H. UI robustness, accessibility, performance, end-to-end (AD-085 to AD-100)

### AD-085 · Client/server validation parity `P1` `DATA`
1. Disable client-side validation in DevTools; submit invalid data on every form.
- **Pass:** the server's field errors are shown at the right fields; no form shows "success" on a 4xx.

### AD-086 · Malformed API data `P1` `RESILIENCE`
1. Mock API responses with `null` arrays, missing fields, wrong types (price as string), unknown enum statuses, extra fields.
- **Pass:** error boundary or graceful fallback; no white screen; unknown status displays a neutral badge; no `NaN`/`undefined` text.

### AD-087 · API contract drift `P1` `RESILIENCE`
1. Return 404 for a removed endpoint; return an HTML 502 body where JSON is expected; return a renamed field.
- **Pass:** user-friendly error and a retry path; no unhandled promise rejections in the console.

### AD-088 · Slow network and stale-response races `P1` `RESILIENCE`
1. Throttle to Slow 3G; change list filters 10 times quickly.
- **Pass:** loading states shown; older responses never overwrite newer ones (request cancellation or sequence check); timeouts surface a message.

### AD-089 · Offline/online mid-mutation `P1` `RESILIENCE`
1. Go offline during Save/Refund/Assign; come back online; click Retry.
- **Pass:** no duplicate server effects (check DB and audit); UI shows the real state after reconnecting.

### AD-090 · Multi-tab consistency `P2` `UX`
1. Edit the same record in two tabs; save in both; sign out in one.
- **Pass:** conflict surfaced on the second save; logout propagates; no zombie sessions.

### AD-091 · History and navigation `P2` `UX`
1. Use Back/Forward/Refresh on modals, wizards and detail pages.
- **Pass:** no lost work without warning; modal state follows the URL sensibly; no duplicate submissions on refresh.

### AD-092 · Responsive layout `P2` `UX`
1. Test at 360, 768, 1024, 1440 px; use touch emulation.
- **Pass:** tables scroll inside their container; no horizontal page scroll; modals reachable; tap targets ≥44 px.

### AD-093 · Accessibility `P2` `A11Y`
1. Complete "create item → upload → publish" using the keyboard only; run axe; use a screen reader on error messages; check contrast on the Tailwind design system; zoom 200%/400%.
- **Pass:** all controls reachable, focus visible, modal focus trapped and restored, errors announced, no critical axe violations, contrast ≥4.5:1.

### AD-094 · Large dataset performance `P1` `PERF`
1. Seed 10k catalog items, 100k bookings and 1M audit rows.
2. Open each list; run Lighthouse; take a heap snapshot after 5 min of use.
- **Pass:** lists render <2 s with server pagination; memory stable; no main-thread freeze >200 ms.

### AD-095 · XSS/CSRF/clickjacking sweep `P0` `SEC`
1. Inject HV-STR XSS into **every** text input; then visit every screen that renders it.
2. Embed the admin in an iframe on another origin.
3. Check where the JWT is stored and whether a script could read it.
- **Pass:** nothing executes; framing blocked; CSP present; token exposure risk documented (localStorage is readable by any XSS, so the XSS result must be clean).

### AD-096 · Supply chain and build hygiene `P1` `SEC`
1. `npm audit`; verify lockfile integrity; inspect the bundle for source maps; run the CI secret-guard with a planted canary.
- **Pass:** no high/critical unresolved advisories; lockfile enforced (`npm ci`); canary fails the build; Dependabot PRs trigger `npm run verify`.

### AD-097 · CDN cache and deploy skew `P1` `OPS`
1. Check `_headers`: hashed assets immutable, `index.html` no-cache.
2. Keep an old tab open across a new deploy, then navigate (the old JS chunk is gone).
- **Pass:** a graceful "new version available, reload" prompt; no blank page; no stale admin bundle served after a deploy.

### AD-098 · Locale and number formatting `P2` `DATA`
1. Switch browser language to `hi-IN`, `en-US`, `de-DE`; view ₹1,23,456.78 and paise values; type amounts with comma/period variants.
- **Pass:** consistent INR formatting; parsing of typed values is unambiguous; no `-0`; no float artefacts.

### AD-099 · Admin → customer end-to-end propagation `P0` `E2E`
1. In admin change a title, price, image and availability, then archive one item.
2. Verify the customer site and public API; restart the backend; run two backend instances.
- **Pass:** customer reflects every change within the cache window with ETag revalidation; the archived item is unavailable (not bookable); state survives restart and is identical across instances; static data never overrides live data.

### AD-100 · Compromised-admin drill `P0` `SEC`
1. Replay a stolen admin token from a new IP; archive/unpublish 500 items rapidly; unmask many PII records; attempt refunds.
2. Then recover: restore archived items and a catalog backup.
- **Pass:** rate limits or anomaly alerts fire; every action is attributable in the audit log; bulk damage is reversible (restore/undo); revocation takes effect within the documented TTL.

---

# FINAL RANKING PROMPT (copy everything below this line into your AI agent or hand it to a QA engineer)

```text
ROLE
You are a principal QA/security auditor. Execute the ADMIN test plan (AD-001 … AD-100) in this file against the
ArenaAI / SK Baghel admin operations desk and produce an evidence-based ranking.

INPUTS
- This file (tests, legend, INV-1…INV-6, hostile value sets HV-*).
- A staging stack: admin SPA, backend API, disposable Postgres, Supabase project(s), mock Razorpay/WhatsApp,
  staff users for every role (plus no-role and user_metadata-only users).
- NEVER run destructive tests, load, or real refunds against production or live payment credentials.

EXECUTION RULES
1. Run every test as written. For each, verify THREE layers: UI behaviour, Network request/response, DB row + audit row.
   If the layers disagree (e.g. UI says "saved" but DB unchanged), the test FAILS.
2. Record one status per test: PASS | PARTIAL | FAIL | BLOCKED (reason) | N/A (reason).
3. Evidence is mandatory: screenshot or trace for UI, HAR/curl for API, SQL output for DB. No evidence = BLOCKED, never PASS.
4. Re-run concurrency/race tests 3 times (AD-022, 024, 041, 054, 069, 077, 081). A single failure = FAIL.
5. If the real UI/route/field differs from the docs, test the real behavior and log it in the DRIFT LIST.
6. KNOWN-GAP(audit) tests are expected to fail today; execute and score them anyway and note "fixed since audit" if they pass.
7. For each failure supply: minimal reproduction steps, expected vs actual, violated rule (spec/audit line, INV-n), and a concrete fix.

SCORING
- Weights: P0=10, P1=5, P2=3, P3=1. PASS=100%, PARTIAL=50%, FAIL=0%, BLOCKED/N-A excluded from the denominator.
- Overall score = 100 × earned / possible. Also score each category tag:
  AUTH, SEC, ROUTING/OPS, CRUD/DATA, STATE/CONC, PRICING, MONEY, PRIVACY, INTEG, UX/A11Y, RESILIENCE/PERF, E2E.
- Coverage confidence = tests executed with evidence / 100. Below 90% => rank is PROVISIONAL.

GATES (caps override the score)
- Any FAIL in a P0 test tagged AUTH or SEC (auth bypass, privilege escalation, XSS, secret in bundle) -> rank capped at D.
- Any INV-1/2/4 violation, over-refund, or double refund -> capped at D and flag "MONEY-INTEGRITY BREACH".
- Any silent data loss (UI says saved but not persisted, or last-write-wins overwrite in AD-022) -> capped at C.
- Any other P0 FAIL -> capped at C.
- 3+ P1 FAILs inside one category -> that category is RED; two RED categories cap the rank at C.
- Ranks: S >= 95 (no P0/P1 FAIL) | A 85–94 | B 70–84 | C 55–69 | D 40–54 | F < 40.
- Release verdict: GO only if rank >= B, zero P0 FAIL, no MONEY-INTEGRITY BREACH.

OUTPUT (in this order)
1. VERDICT: rank letter, score, coverage confidence, GO/NO-GO, one-paragraph rationale.
2. CATEGORY TABLE: category | tests | pass/partial/fail/blocked | score | GREEN/AMBER/RED.
3. PERMISSION MATRIX: role × sensitive action (publish, refund, unmask PII, fare change, assign driver, audit read)
   showing intended vs actual result; call out role collapse explicitly.
4. TOP 10 RISKS: severity × exploitability × blast radius, with test ids, impact, fix.
5. FAILED/PARTIAL LIST: id | UI vs API vs DB observation | repro | root-cause hypothesis | fix | effort (S/M/L).
6. UI-LIES REPORT: every place the UI showed success while the API/DB disagreed.
7. DRIFT LIST: docs vs UI vs API vs DB mismatches (including the 5173/5174 OAuth origin issue if confirmed).
8. KNOWN-GAP STATUS: each audit gap -> still open / fixed.
9. 30/60/90-DAY HARDENING PLAN ordered by risk reduction per effort.
10. MACHINE-READABLE BLOCK:
    {"rank":"","score":0,"coverage":0,"verdict":"GO|NO-GO","caps":[],
     "categories":{"AUTH":0},"results":[{"id":"AD-001","status":"PASS","evidence":"path","notes":""}]}

AFTER FIXES
Re-run FAIL/PARTIAL/BLOCKED tests plus INV-1…INV-6 and output a DELTA report (score change, regressions).
Honesty rule: if you could not run something, say so. A lower honest score beats an inflated one.
```
