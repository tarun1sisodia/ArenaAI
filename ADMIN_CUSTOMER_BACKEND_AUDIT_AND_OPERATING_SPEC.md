# SK Baghel Tour & Travels
## Admin, Customer, Backend Audit & Operating Specification

**Audit date:** 27 September 2026  
**Repository:** `tarun1sisodia/ArenaAI`  
**Scope:** admin operations desk, customer site, Fastify API, PostgreSQL/Supabase persistence, catalog/media, booking/payment, LocationIQ, Cloudflare/Render deployment.  
**Out of scope:** detailed vertical/trip content and editorial copy. This document defines the platform behavior that applies to every vertical.

---

## 1. Executive decision

The platform already has a useful public-read/admin-write split and most admin mutations are real backend calls rather than mocked fixtures. However, the system currently has **multiple competing sources of truth**:

- PostgreSQL catalog and fare rules
- static React catalogue/data files
- a process-local backend manifest cache
- browser `localStorage` manifest snapshots
- static marketing cards and prices

This means an admin update may appear in one customer page and remain stale on another. The required target architecture is:

> **Backend database is authoritative. Admin is the only operational writer. Customer is public-read plus booking creation/payment actions. Static data is only a clearly labelled editorial/build-time fallback, never an authoritative price, availability, route, or payment state.**

### Highest-risk findings

| Priority | Finding | Impact |
|---|---|---|
| P0 | Payment checkout failure was allowed to continue into a success/voucher state; a simulation button fabricated bookings | Customers could see a successful booking without a real payment/confirmed state |
| P0 | Fare-rule writes are persisted, but public fare calculation still uses static fare catalogue/route data | Admin price changes may not affect booking totals |
| P0 | Admin login promoted a user with a missing role claim to `super_admin` in the UI | Fail-open authorization model and identity mismatch |
| P1 | Customer route/package/fleet marketing pages are static-first with silent stale fallbacks | Admin changes are not consistently reflected |
| P1 | Manifest caching is process-local and browser cache is effectively unbounded | Multi-instance inconsistency and stale customer content |
| P1 | Device registration accepts caller-supplied IDs without verified ownership | Notification association/IDOR risk |
| P1 | Public media endpoint can expose draft/archived media if its ID is known | Visibility leak |
| P1 | Render/Docker startup does not run migrations; `/ready` previously returned HTTP success when DB was degraded | Deployments may be marked healthy while unusable |
| P1 | Missing Razorpay credentials can select an HMAC test adapter in a production process | Unsafe payment behavior |
| P2 | Direct browser LocationIQ integration can expose quota and bypass server rate controls | Provider abuse/cost and inconsistent geocoding |

---

## 2. Current system map

```text
Admin Cloudflare Pages
  └─ Supabase Auth login
      └─ Bearer JWT
          └─ Fastify /api/v1/ops/admin/*
              ├─ PostgreSQL repositories
              ├─ Catalog + media storage
              ├─ Fare rules + booking service
              ├─ Reviews, inquiries, payments, audit
              └─ Render deployment

Customer Cloudflare Pages / custom domain
  ├─ Public catalog, fleet, locations, fares, booking and payment APIs
  ├─ Static/SSG editorial baseline (must never override live operational data)
  └─ Browser currently contains some direct LocationIQ and local manifest fallback paths
```

### Required source-of-truth rule

| Domain | Authoritative source | Customer may write? | Admin may write? |
|---|---|---:|---:|
| Catalog item metadata | PostgreSQL `catalog_items` | No | Yes |
| Catalog media | Object storage + `catalog_item_media` | No | Yes |
| Published visibility | Catalog status + media status | No | Yes |
| Fleet specification/availability | Active PostgreSQL fare rule/config | No | Yes |
| Route distance/duration | PostgreSQL catalog route record or server-side routing provider | No | Yes/configure |
| Fare calculation | Backend fare engine using active version | No | Yes/configure |
| Booking | PostgreSQL booking record | Create only | Read/transition/refund |
| Payment | Provider webhook + backend payment ledger | Initiate only | Reconcile/refund |
| Reviews | PostgreSQL review moderation state | Submit only | Moderate/publish/archive |
| Inquiries | PostgreSQL inquiry record | Create only | Read/update |
| Audit log | Append-only backend record | No | Read |
| Location search | Backend LocationIQ proxy + cache | No | No |

---

## 3. Audited implementation status

### Admin

**Verified real backend operations:** catalog create/update/list/detail, publish/archive, media upload/attach/update/delete, catalog manifest republish, booking list/transition, refunds, inquiry list/update, payment list, fare-rule read/update, review moderation, audit reads.

**Admin gaps:**

1. Role groups currently collapse to `super_admin`; least privilege is not implemented.
2. Fare update audit actor handling can fall back to a literal `super_admin` because `requireRole` does not return the authenticated actor.
3. Image upload checks declared MIME and base64 size, but not magic bytes, actual decode, dimensions, or decompression limits.
4. Storage upload can succeed while the media database insert fails; there is no compensating delete/transaction.
5. Manifest version and ETag are process-local and reset on restart.
6. Audit `limit` query is sent by the frontend but ignored by the backend controller.
7. There are no admin routes for promo CRUD, user/profile management, device revoke, notification retry, or operational fleet records beyond fare-rule config.

### Customer

**Verified backend-authoritative path:** booking fare quote, booking draft creation, payment initiation request shape (client does not submit price/distance), live catalog listing/detail APIs, live fleet API, payment status endpoint.

**Customer gaps:**

1. Packages, route cards, fleet marketing cards, many images and prices still use bundled/static files.
2. Static route matches can bypass the live manifest.
3. Manifest uses an unbounded `localStorage` fallback and does not send `If-None-Match` despite backend ETag support.
4. Some fetch failures become an empty section or silently restore stale static data.
5. LocationIQ is still called directly from the browser when a token exists.
6. Payment failure previously continued to the voucher state; test simulation could fabricate a ticket. This is now blocked by the partial implementation in this change.
7. Live catalog package cards use a generic hard-coded cover image in the backend manifest instead of the published media cover.

### Backend/deployment

1. Public fare calculation still calls the static fare engine and static route lookup; active DB fare-rule edits are not fully applied to all fare dimensions.
2. Catalog route identity and fare route identity are duplicated.
3. Device registration is not sufficiently ownership-bound.
4. Ticket + phone recovery is weaker than a high-entropy guest token and should use OTP/challenge if retained.
5. Public media should verify published media and published parent item.
6. Razorpay must be mandatory in production; HMAC fallback must be test/development-only.
7. Render must run idempotent migrations before the application starts.
8. Readiness must be non-2xx when PostgreSQL is unavailable. The implementation now returns HTTP 503 for DB-not-ready responses.
9. Lint is not green and live DB tests are not provisioned in CI.

---

## 4. Admin CRUD and operational command inventory

The following is the required operation inventory. **CRUD is used broadly:** create, read, update, delete/archive, publish, transition, reconcile, or execute a controlled command. The customer must not receive any of these administrative write capabilities.

### A. Identity, access and audit (1–10)

| # | Operation | Method/path | Actor | Expected behavior |
|---:|---|---|---|---|
| 1 | Staff sign-in | Supabase Auth password grant | Staff | Require explicit approved role claim |
| 2 | Validate stored session | `GET /ops/admin/audit-logs?limit=1` | Admin | Reject invalid/expired JWT before shell render |
| 3 | Staff sign-out | Client session clear | Admin | Clear token and cached identity |
| 4 | List audit logs | `GET /ops/admin/audit-logs` | Audit role | Bounded pagination/filtering |
| 5 | Export audit logs | New admin endpoint | Audit role | Server-side filtered export, no secrets/PII leakage |
| 6 | Filter audit by actor | Query filter | Audit role | Exact actor/role filter |
| 7 | Filter audit by resource | Query filter | Audit role | Resource type/id and date range |
| 8 | View request trace | Existing request ID in audit | Audit role | Correlate action to API request |
| 9 | Rotate/revoke staff session | Supabase/Auth admin workflow | Security role | Revoke tokens on security event |
| 10 | Verify role permissions | Route contract tests | Security role | 401/403 tests for every protected route |

### B. Catalog and media CMS (11–30)

| # | Operation | Method/path | Actor | Expected behavior |
|---:|---|---|---|---|
| 11 | List catalog | `GET /ops/admin/catalog` | Content | Filter by type/status/search |
| 12 | Read catalog detail | `GET /ops/admin/catalog/:id` | Content | Include all media/status fields |
| 13 | Create catalog item | `POST /ops/admin/catalog` | Content | Validate slug, type, price, status rules |
| 14 | Update title/summary | `PATCH /ops/admin/catalog/:id` | Content | Audit before/after |
| 15 | Update description | Same PATCH | Content | Sanitize and audit |
| 16 | Update duration/stops | Same PATCH | Content | Validate bounded arrays/strings |
| 17 | Update starting price | Same PATCH | Pricing/content | Never used as final booking price without fare engine |
| 18 | Update availability | Same PATCH | Dispatch/content | Customer sees live state |
| 19 | Update seats remaining | Same PATCH | Dispatch | Do not expose internal data beyond policy |
| 20 | Publish item | `POST /catalog/:id/publish` | Publisher | Only complete, valid content publishes |
| 21 | Archive item | `POST /catalog/:id/archive` | Publisher | Soft-delete; existing bookings retain snapshot |
| 22 | Restore archived item | New endpoint or update status | Publisher | Explicit audited restore |
| 23 | Attach storage-path media | `POST /catalog/:id/media` | Content | Path is reference only, not upload |
| 24 | Upload inline media | Same endpoint | Content | Verify bytes, dimensions, MIME and size |
| 25 | Read media metadata | Catalog detail | Content | Include status, alt, caption, order |
| 26 | Update alt text | `PATCH /ops/admin/media/:id` | Content | Required for published images |
| 27 | Update caption | Same PATCH | Content | Preserve editorial metadata |
| 28 | Reorder gallery | Same PATCH | Content | Enforce unique/normalized sort order |
| 29 | Publish/archive media | Same PATCH | Publisher | Parent and child visibility must agree |
| 30 | Delete media | `DELETE /ops/admin/media/:id` | Content | Soft-delete or audited hard delete with storage cleanup |

### C. Fleet, fares, routes and pricing (31–44)

| # | Operation | Method/path | Actor | Expected behavior |
|---:|---|---|---|---|
| 31 | Read active fare rules | `GET /ops/admin/fare-rules` | Pricing | Return active version and effective date |
| 32 | Create fare-rule version | `PUT /ops/admin/fare-rules` | Pricing | Create inactive draft version first |
| 33 | Activate fare-rule version | New endpoint | Pricing | Transactionally deactivate previous version |
| 34 | Roll back fare version | New endpoint | Pricing | Select prior immutable version |
| 35 | Update vehicle name | Fare config | Pricing | Customer live fleet reflects it |
| 36 | Update vehicle seats | Fare config | Pricing | Validate positive integer |
| 37 | Update vehicle luggage | Fare config | Pricing | Validate non-negative integer |
| 38 | Update vehicle per-km rate | Fare config | Pricing | Positive bounded amount |
| 39 | Toggle vehicle active | Fare config | Pricing/dispatch | Inactive vehicle cannot be booked |
| 40 | Update local package rates | Fare config | Pricing | Fare engine reads active config |
| 41 | Update route fare | Catalog/fare rule | Pricing | Booking engine reads DB route identity |
| 42 | Update route distance | Catalog route | Pricing/ops | Server-derived distance, never client amount |
| 43 | Update toll policy | Fare config | Pricing | Snapshot policy in booking |
| 44 | Validate fare preview | New admin endpoint | Pricing | Compare old/new with sample fixtures |

### D. Bookings and dispatch (45–56)

| # | Operation | Method/path | Actor | Expected behavior |
|---:|---|---|---|---|
| 45 | List bookings | `GET /ops/admin/bookings` | Dispatch | Pagination, filters, masked PII |
| 46 | Read booking detail | Existing list/detail contract | Dispatch | Show immutable fare snapshot |
| 47 | Create manual booking | Existing admin page/draft path | Dispatch | Same server fare engine as customer |
| 48 | Transition booking | `POST /bookings/:id/transition` | Dispatch | State machine + expected version |
| 49 | Confirm booking | Transition | Dispatch | Only after valid business conditions |
| 50 | Assign vehicle | New operation | Dispatch | Availability/overlap transaction |
| 51 | Assign chauffeur | New operation | Dispatch | Audit and conflict check |
| 52 | Reschedule booking | New operation | Dispatch | Requote policy and audit |
| 53 | Cancel booking | Transition | Dispatch | Policy-based refund decision |
| 54 | View masked PII | Default list | Dispatch | Mask by default |
| 55 | Unmask PII | Existing audited capability | Super/audit | Explicit action and audit record |
| 56 | Add internal note | New operation | Dispatch | Never shown to customer |

### E. Payments, reviews, inquiries, promos and notifications (57–70)

| # | Operation | Method/path | Actor | Expected behavior |
|---:|---|---|---|---|
| 57 | List payments | `GET /ops/admin/payments` | Finance | Provider/status/date filters |
| 58 | Read payment status | Payment endpoint/admin view | Finance | Provider state + ledger state |
| 59 | Reconcile webhook | Provider webhook | Backend | Signature + idempotency |
| 60 | Refund payment | `POST /ops/admin/refunds` | Finance | Captured-only, idempotent, audited |
| 61 | Retry failed payment | New operation | Finance | New idempotency key, preserve history |
| 62 | List reviews | Admin review route | Review | Pending/published/archived |
| 63 | Approve review | Existing action | Review | Audit and publication timestamp |
| 64 | Reject review | Existing action | Review | Reason required |
| 65 | Archive review | Existing action | Review | Soft-delete |
| 66 | Create inquiry | `POST /inquiries` | Customer | Rate-limit and validate |
| 67 | List inquiries | `GET /ops/admin/inquiries` | Sales | Filter status/type/date |
| 68 | Update inquiry | `PATCH /ops/admin/inquiries/:id` | Sales | Status, owner, notes audited |
| 69 | Promo CRUD | New admin endpoints | Pricing | Draft/activate/expire/max-redemption |
| 70 | Notification retry/revoke | New admin endpoints | Ops | Queue status, retry count, safe token handling |

**Required customer mutation rule:** customer can create a booking draft, initiate checkout, submit an inquiry, submit a moderated review, and register an owned device token only where ownership is verified. Customer cannot edit/delete/publish catalog, media, fares, routes, fleet, bookings, payments, promos, audit logs, or staff records.

---

## 5. Customer page behavior specification

### Global customer rules

1. Every operational value must carry `source`, `updatedAt`, and where relevant `version`.
2. Static SSG content can provide SEO and first paint but must be visibly replaced/reconciled by live data.
3. If live data fails, show `Live data unavailable` or `Last updated at ...`; never silently present a stale price as current.
4. Customer does not receive admin endpoints or database credentials.
5. Customer sends booking selections, never price, total, distance, discount amount, or fare snapshot.
6. Final payment UI must distinguish `draft`, `checkout_pending`, `captured`, `failed`, `refunded`, and `cancelled`.
7. No customer page may claim confirmed/paid when checkout creation or provider confirmation failed.

### Page-by-page guide

| Page/group | Must load from backend | Static baseline allowed | Customer actions | Acceptance criteria |
|---|---|---|---|---|
| Home | Fleet availability, featured published catalog, live price labels if shown | Editorial layout, SEO copy, placeholder art | Navigate/search | Admin publish/update appears after cache revalidation |
| Fleet listing | `GET /api/v1/fleet` | Layout and image placeholders | Select vehicle | Inactive vehicle hidden; rate/version shown with timestamp |
| Fleet detail | Fleet API + catalog media if managed | Editorial FAQ | Start booking | No static rate overrides live response |
| Routes hub | Published route catalog/manifest | SEO shell | Choose route | Archive/unpublish no longer appears as live |
| Route detail | Route record, server fare quote | Editorial guidance | Choose vehicle/date | Static route match cannot bypass live state |
| Packages hub | Published catalog `type=package/tour` | SSG SEO shell | Select package | Published package title/price/media match backend |
| Package detail | `GET /catalog/:slug` | Loading shell | Start booking | Draft/archived item returns not found |
| Famous places | Published place catalog | Editorial fallback labelled as such | Browse | CMS image replaces editorial placeholder |
| Search/autocomplete | Backend LocationIQ proxy | Curated offline places | Select location | Token never exposed; bounded/rate-limited |
| Booking funnel mode 1 | Route → fleet → package/tour → guest → checkout | Form layout | Create draft, pay | Server returns fare and booking IDs |
| Booking funnel mode 2 | Package/tour → fleet → details → guest → checkout | Form layout | Create draft, pay | Same server authority as mode 1 |
| Booking status | Ticket + guest token/OTP | None | Read own booking | Phone alone is not accepted as equivalent secret |
| Payment return | Provider status endpoint | None | Retry/return | Pending/failed/captured are distinct |
| Inquiry/contact | Inquiry API | Contact details | Submit inquiry | Rate limit, confirmation only after API success |
| Review submit | Review API | Form layout | Submit review | Pending moderation; no fake verified label |
| Legal/SEO pages | None or content API | Static | Read only | No operational price/availability claims without source |

---

## 6. Required end-to-end flows

### Flow A: admin changes catalog item

1. Admin authenticates with explicit approved role.
2. Admin edits item in Catalog CMS.
3. Backend validates and updates `catalog_items` transactionally.
4. Backend appends audit record containing actor, request ID, before/after.
5. Backend invalidates durable catalog revision.
6. Customer calls public catalog/manifest endpoint with ETag.
7. Customer receives new item only if `status=published`.
8. Customer cache updates with bounded TTL and visible freshness metadata.
9. Existing bookings retain immutable snapshots.

### Flow B: admin uploads image

1. Client sends file bytes or a controlled storage reference.
2. Backend validates actual magic bytes, dimensions, pixel/decompression limits, MIME, size and alt text.
3. Backend uploads object only after validation.
4. Database row and object write are coordinated; failed row insert compensates with object delete.
5. Media remains unpublished until publisher action unless policy explicitly allows immediate publish.
6. Public media route serves only media whose parent catalog item and media row are published.
7. Replaced media receives a new immutable versioned ID/path; old URLs remain safe or redirect by policy.

### Flow C: customer booking, two UI modes

1. Customer chooses either **route-first** or **package-first**.
2. Customer chooses fleet and date/time.
3. Customer requests server fare quote.
4. Backend resolves route/distance server-side and loads active fare-rule version.
5. Customer submits guest details; payload contains no client total/distance.
6. Backend creates draft booking with fare snapshot and idempotency protection.
7. Customer requests checkout using ticket + guest token.
8. Backend creates provider order and returns checkout instructions.
9. Customer completes provider flow.
10. Provider webhook verifies signature and idempotency.
11. Backend changes payment and booking states transactionally.
12. Customer reads status and receives voucher only after the intended payment/booking state is true.

### Flow D: admin price change

1. Admin creates a new fare-rule version, not an uncontrolled overwrite.
2. Backend validates all vehicle/rate/rule fields.
3. Admin previews representative quotes old vs new.
4. Admin activates version in a transaction; previous active version becomes inactive.
5. Fare API, booking draft API, fleet API, and customer price labels read the same active version.
6. Every booking stores `fareRulesVersion` and a complete immutable snapshot.
7. Existing bookings never change because a new price was activated.

---

## 7. Partial implementation completed in this change

The following safe, high-impact changes were implemented:

1. Customer API production fallback now targets the deployed Render backend instead of an unconfigured localhost/unverified alias.
2. Catalog manifest uses the shared deployment-safe API base resolver.
3. Admin login now **requires** an explicit `super_admin` claim; missing role metadata is denied rather than promoted.
4. Customer payment checkout failures now stop the flow and show an error instead of advancing to a success voucher.
5. Payment simulation is hidden unless the build is development and `VITE_ENABLE_PAYMENT_SIMULATION=true`.
6. If checkout returns a provider URL, the customer is redirected to it.
7. Backend `/ready` now returns HTTP 503 when the database health check fails.

These changes do not claim that the full source-of-truth migration is complete. The remaining work is listed below.

---

## 8. Implementation backlog and order

### Phase 1 — release blockers

- Make production payment provider mandatory; prohibit HMAC adapter outside test/development.
- Make fare engine load active DB fare rules and route/catalog records.
- Add active-version transaction and unique-active database invariant.
- Add end-to-end booking/payment state tests.
- Add public media visibility check.
- Lock down device registration ownership.
- Run migrations in Render release/predeploy phase.
- Make `/ready` the deployment health check and verify its non-2xx behavior.

### Phase 2 — source-of-truth convergence

- Add a canonical catalog route model containing route identity, coordinates/places, distance, duration, availability and fare references.
- Remove static route matches as authoritative data.
- Build manifest from published database records only, or persist editorial route records with publication state.
- Replace hard-coded generic package image with published media cover.
- Add durable manifest revision/ETag metadata.
- Add customer bounded cache TTL, ETag and stale banner.
- Hydrate home, route, package and fleet cards through shared live selectors.

### Phase 3 — secure integrations

- Implement backend LocationIQ proxy with server-held secret, debounce, cache, IP/user rate limits and bounded response size.
- Add OTP or high-entropy token recovery for booking status; remove phone-only equivalence.
- Add upload magic-byte/decode/dimension validation.
- Add compensating object-store cleanup.
- Split roles into content, pricing, dispatch, finance, review, audit, and security.

### Phase 4 — completeness

- Promo CRUD and activation/expiry.
- Fleet/vehicle operational CRUD separate from fare config if inventory is required.
- Driver/assignment records if dispatch is required.
- Notification queue inspection/retry/revoke.
- Customer booking cancellation/reschedule policy if product requires it.
- Generated OpenAPI and route authorization matrix.
- Required lint gate and disposable Postgres migration tests.

---

## 9. Verification matrix

### Automated tests required for every release

- `npm run customer:typecheck`
- `npm run admin:typecheck`
- `npm run backend:typecheck`
- `npm run customer:build`
- `npm run admin:build`
- `npm run backend:build`
- Backend unit/contract/integration suite
- Backend lint with zero errors
- Database migration test against disposable PostgreSQL
- Public/admin route authorization matrix
- Catalog publish/archive → public listing/manifest test
- Media upload malformed bytes/mismatched MIME/dimensions test
- Fare update → fleet API → fare quote → booking snapshot test
- Payment provider failure → no voucher success test
- Payment webhook duplicate → one ledger transition test
- Render `/ready` DB failure → HTTP 503 test

### Manual browser acceptance tests

1. Open customer site in a clean browser profile.
2. Verify no API calls target localhost.
3. Change a catalog title/image/price in admin and publish.
4. Reload customer package/fleet/home pages and inspect Network responses.
5. Verify customer sees the new published data and no archived data.
6. Edit fare rules and compare `/api/v1/fleet` and `/api/v1/fares/calculate`.
7. Start booking with altered client totals in DevTools; verify backend ignores tampered totals.
8. Force checkout failure; verify no confirmed voucher is shown.
9. Complete provider checkout in test environment; verify webhook changes status.
10. Open admin with an invalid/forged localStorage session; verify login only.
11. Request a draft media ID anonymously; verify it is not served.
12. Stop/degrade the database; verify deployment readiness becomes unhealthy.

---

## 10. Deployment checklist

### Render API

- `DATABASE_URL` configured and migration version verified.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`/JWT validation settings configured.
- `SUPABASE_SERVICE_ROLE_KEY` never sent to browsers.
- `CORS_ORIGINS` contains exact slashless production origins.
- `RAZORPAY_KEY_ID`, secret and webhook secret present in production; no test adapter.
- `LOCATIONIQ_TOKEN` only in backend environment.
- `VITE_API_BASE_URL` set in both Cloudflare Pages projects.
- Render health check points to `/ready`, not only `/health`.
- Logs redact tokens, secrets, guest tokens and unmasked PII.

### Cloudflare customer/admin

- Production build variables are set before build.
- Customer and admin have distinct origins and exact CORS allowlist entries.
- No `.env` secret is committed or bundled.
- Cache headers are version-safe for media and HTML.
- Admin pages do not render dashboard until backend JWT validation succeeds.
- Deployment smoke tests call the actual deployed API base.

---

## 11. SEO, AEO, GEO and content lifecycle governance

### 11.1 Core policy

> **Archive operationally; never erase editorially by default.**

Trips, routes, packages, verticals, fleet pages, images and other public content must have a lifecycle state. The admin must not delete a page solely because it is unavailable for booking. Stable URLs, useful content, backlinks, search history and entity relationships must be preserved unless the page is genuinely obsolete, legally incorrect, duplicative or permanently irrelevant.

The customer must never be able to archive, delete, publish, unpublish, redirect or alter operational content.

### 11.2 Required lifecycle states

```text
draft → published → paused → archived → retired
```

| State | Public URL | Indexable | Sitemap | Bookable | Required behavior |
|---|---:|---:|---:|---:|---|
| `draft` | No | No | No | No | Admin-only preview; never exposed through public APIs |
| `published` | Yes | Yes | Yes | Yes | Current title, content, media, availability and live booking CTA |
| `paused` | Yes | Usually yes | Usually yes | No | Preserve page; show unavailable/seasonal notice and alternatives |
| `archived` | Yes | Usually yes | Yes if useful | No | Preserve URL and useful content; remove booking CTA; show current alternatives |
| `retired` | Redirect or 410 | Depends | No | No | Only for obsolete, duplicate, legally incorrect or permanently irrelevant content |

The database model must retain the content record and include fields equivalent to:

```ts
{
  status: "draft" | "published" | "paused" | "archived" | "retired",
  slug: string,
  publishedAt: string | null,
  pausedAt: string | null,
  archivedAt: string | null,
  retiredAt: string | null,
  replacementItemId: string | null,
  redirectTarget: string | null,
  lastReviewedAt: string | null,
  indexPolicy: "index" | "noindex",
  bookable: boolean
}
```

`status`, `indexPolicy`, and `bookable` must be derived and validated by the backend. The frontend must not be trusted to set a contradictory combination such as `archived + bookable=true` or `draft + index=true`.

### 11.3 Stable URL policy

1. Preserve successful URLs even when price, availability or editorial content changes.
2. Treat the slug as the public identity of the content entity, not as a disposable sales record.
3. Do not redirect discontinued content to the homepage.
4. Use a 301 redirect only when the replacement satisfies substantially the same search intent.
5. Use 410 only after checking organic traffic, backlinks, Search Console data and replacement relevance.
6. If a page remains useful but is no longer sold, keep its canonical URL self-referencing and render an unavailable informational page.

Examples:

```text
/packages/taj-mahal-sunrise-tour
/routes/agra-to-delhi
/fleet/innova-crysta
```

These URLs should remain stable while the underlying operational status changes.

### 11.4 Archived and paused page requirements

An archived or paused page must not become an empty shell. It should contain:

- Original or still-accurate title
- Clear availability notice
- Accurate destination/service intent
- Current alternatives and related active pages
- Related routes, fleet choices and enquiry CTA
- Useful FAQs
- Appropriate images and alt text
- Last reviewed date
- No stale current price presented as bookable
- No active `Book Now` action that creates a booking for the unavailable item

Recommended customer presentation:

```text
This exact package is currently unavailable.
Explore current alternatives with live vehicle availability and server-calculated pricing.
[Explore current options] [Ask the travel desk]
```

For an archived package, structured data must not claim `InStock`. Use `OutOfStock` where an offer is still represented, or omit `Offer` entirely when no current price is valid.

### 11.5 Admin lifecycle commands

The admin CMS must expose explicit actions instead of a generic destructive delete:

```text
Save Draft
Publish
Pause Sales
Archive
Restore
Replace With New Version
Redirect To Replacement
Retire Permanently
```

Before archiving, show impact information where available:

- Organic visits in the last 90 days
- Search Console impressions/clicks
- Ranking keywords
- Referring domains/backlinks
- Existing replacement candidates
- Number of internal links

Before retirement, require an explicit reason and one selected outcome:

```text
Preserve as unavailable informational page
301 redirect to selected replacement
Return 410 Gone
```

Every lifecycle mutation must be role-checked, audited with before/after state, and reflected in the public catalog/manifest policy.

### 11.6 SEO requirements

Every important route, package, vertical and fleet page must have:

- Stable self-referencing canonical URL unless a documented replacement redirect applies
- Unique title and meta description
- Breadcrumbs and contextual internal links
- Accurate availability language
- Server-rendered or prerendered title, summary, destination and basic itinerary
- Valid image URLs and descriptive alt text
- `lastReviewedAt` or equivalent freshness signal
- No contradictory static price after a backend price change

Sitemap rules:

- Include published content.
- Include paused content when it remains useful.
- Include archived content when it remains a useful search landing page.
- Exclude drafts, private admin records, thin duplicates, retired 404/410 URLs and content intentionally removed for legal/accuracy reasons.
- Use truthful `lastmod`; do not touch every URL during every deployment.
- Keep separate sitemaps where useful: pages, routes, packages, fleet and images.

The generated sitemap must be derived from lifecycle state and canonical URL policy, not simply from every database record.

### 11.7 AEO requirements

Answer-oriented pages must expose concise, crawlable answers in HTML for:

- What is included?
- What is the duration?
- Is the trip currently available?
- What vehicles are available?
- What is the current pricing rule or starting-price qualification?
- Can the trip be customized?
- How does booking work?
- What happens if the package is paused or archived?

Use appropriate Schema.org types:

- `TouristTrip`
- `Product`
- `Service`
- `Offer`
- `FAQPage`
- `BreadcrumbList`
- `ImageObject`
- `LocalBusiness`

Do not mark archived, paused or unavailable content as in stock. Do not publish historical prices as current offers. If no valid current offer exists, omit the offer or clearly mark it unavailable.

Important answer content must not exist only after a client-side fetch. Runtime hydration may refresh values, but initial HTML must remain useful to crawlers and answer systems.

### 11.8 GEO and entity consistency requirements

Maintain consistent business identity across the website, Google Business Profile, social profiles and relevant citations:

- Business name
- Phone number
- Address and service area
- Official domain
- Booking/contact details
- Core services and operating geography

Build clear internal entity relationships:

```text
SK Baghel Tour & Travels
  ├── operates in Agra
  ├── offers private vehicles
  ├── serves routes from Agra
  ├── offers tours and packages
  └── provides booking and support
```

Link related pages logically: route → fleet → booking; package → stops → route; archived item → current replacement. Keep availability, contact, service area and business facts consistent so search engines and generative systems do not receive contradictory signals.

### 11.9 Source-of-truth and cache rules for SEO

1. Backend catalog/fare/media state is authoritative.
2. Static SSG data is an editorial/SEO baseline only.
3. Customer hydration must reconcile static pages with live published state.
4. A live API failure must show a stale/unavailable indicator rather than silently presenting an old operational price.
5. Manifest clients must use ETags, bounded local cache TTL, schema validation and freshness metadata.
6. Archived content must remain accessible through the same URL while it has SEO/AEO/GEO value.
7. Public APIs must exclude drafts and retired content and must apply the same status rules to catalog, manifest, media and structured data.

### 11.10 Lifecycle acceptance tests

- Publishing a new item makes it appear in the public catalog, canonical page, structured data and sitemap after the documented cache window.
- Pausing an item keeps its URL and useful content live but removes booking capability.
- Archiving an item preserves its URL, canonical, useful content and alternatives but removes bookability.
- An archived item is represented as unavailable or has no current offer; it is never marked `InStock`.
- Retiring an item requires an audited reason and produces either a relevant 301 or intentional 410.
- Archiving removes an item from normal live-booking listings while preserving the informational page where policy allows.
- A replacement redirect is used only when search intent is substantially equivalent.
- Static SSG content cannot override a newer backend title, media, availability or price.
- Admin lifecycle changes survive restart and are consistent across multiple backend instances.
- Sitemap output contains no drafts and no accidental private/admin URLs.

---

## 12. Final acceptance definition

The implementation is ready for production when all statements below are true:

- Admin mutations are persisted in PostgreSQL and survive restart/second instance.
- Customer operational views read the same published catalog/fleet/fare revision as the admin backend.
- A published catalog/media update appears in customer pages without a frontend redeploy, within the documented cache window.
- Draft and retired content is absent from public catalog/manifest/media responses; paused and archived content follows the SEO lifecycle policy above and is never bookable.
- All final fare totals and distances are server-calculated from active versioned rules.
- Customer can create a booking but cannot mutate operational records.
- Payment failure cannot produce a confirmed/paid customer state.
- Every sensitive admin action is role-checked server-side and audit-logged with the real actor.
- Image upload is validated by content, not only declared MIME.
- LocationIQ secrets remain server-side and provider calls are rate-limited/cached.
- Readiness fails when PostgreSQL is unavailable, migrations are applied, and CI is green.
- Stable high-value URLs are preserved, sitemap/canonical rules are truthful, and archived pages retain useful SEO/AEO/GEO content without stale booking claims.

**Current recommendation:** deploy the partial safety fixes only after the production API base and explicit admin role claim are confirmed, then implement Phase 1 before accepting real customer payments.
