# Hyper-Scale Implementation Plan — 10 Techniques, One by One

**Status:** IN PROGRESS (Phase H1 complete; Phase H2 implemented & auto-tested, ready for manual gate)
**Sources:** `hyper_scale_engineering_guide.md` (10 disciplines, §1–§10) + `backend_and_database_engineering_guide.md` (8 backend patterns, §1–§8)
**Working branch:** `arena/01a0a4c4-arenaai` — all work stays here
**Rule of the road:** implement exactly **one phase at a time**, gate-test it, and only then move to the next.

---

## 1. How we will work (read this first)

### 1.1 The one-by-one gate rule

```
┌──────────────┐   ┌──────────────┐   ┌───────────────────┐   ┌──────────────┐
│  I implement │──▶│  AUTO checks │──▶│  YOU test manually│──▶│ "H# tested   │
│  one phase   │   │  (I run)     │   │  (checklist in    │   │  OK" → next  │
│  (H1…H10)    │   │              │   │  each phase)      │   │  phase       │
└──────────────┘   └──────────────┘   └───────────────────┘   └──────────────┘
```

- I never start phase H(n+1) until you reply **`Hn tested OK`** (e.g. `H1 tested OK`).
- If your manual test finds anything wrong, we fix inside the same phase — no forward drift.
- After every gated phase, I update `04_PROGRESS_TRACKER.md` (Current State + log row), per repo convention.

### 1.2 The multi-file rule (codebase stays clean)

Every technique is implemented as a **small module, not a single file**:

- Each phase creates **3–8 new files**, each with one job, each ideally **≤ ~200 lines**.
- Shared backend infrastructure lives in `backend/src/infra/<area>/` (new folder, one subfolder per concern).
- Frontend modules are colocated per app: `react/src/offline/`, `react/src/telemetry/`, `admin/src/live/`, etc.
- Every phase ships its **own tests** next to the code it covers (`backend/tests/unit/<area>/…`).
- No phase edits files owned by another phase's module — cross-phase wiring goes through a documented seam (listed in each phase).

### 1.3 Manual steps (done by you, guided by me)

Steps only you can do (dashboards, secrets, real-device checks) are marked **🔧 MANUAL** inside each phase,
with click-by-click guidance. §7 collects all of them in one table so you can see the total ask upfront.

### 1.4 Relationship to Phase I1 (API integration)

The hyper-scale track is **independent** of Phase I1 (`03_PHASE_PLAN.md`):

- Backend phases (H2/H3/H4/H5/H9-server/H10-server) are testable via `vitest` + `curl` regardless of I1.
- Frontend phases (H6/H7/H8/H9-client/H10-client) call the API directly and keep working when I1's typed
  client lands — the integration seam is noted in each phase (`Seam:` line).
- If I1 lands mid-track, we do a 15-minute re-check of the affected seams, nothing more.

---

## 2. Execution order H1 → H10 (and why it differs from the guide's §1 → §10)

The guides are written in *reading* order, not *dependency* order. We execute in dependency-safe order so no
phase has to be revisited:

| Phase | Technique (guide §) | Why this position |
|---|---|---|
| **H1** | T1 — Network & Transport (hyper-scale §1) | Zero code risk; pure Cloudflare toggles + headers. Instant win, proves our gate process. |
| **H2** | T8 — Database foundations (hyper-scale §8 + backend-guide §1, §2, §3) | Everything else stands on a stable DB: pool tuning, PgBouncer, partial/covering/trigram indexes, optimistic locking. |
| **H3** | T7 — In-memory fare & geocoding cache (hyper-scale §7 + backend-guide §6) | Needs stable DB (H2) for the L2 layer. Biggest latency win (350ms → <1ms). |
| **H4** | T6 — Fastify throughput: JIT schemas + streaming exports (hyper-scale §6 + backend-guide §7, §8) | Needs stable DB + cache semantics settled. Pure backend perf. |
| **H5** | T9 — Resilience: idempotency, circuit breakers, transactional outbox (hyper-scale §9 + backend-guide §4) | Needs H4's request pipeline; **must land before H8** (offline replays are only safe with server idempotency). |
| **H6** | T2 — Frontend rendering: content-visibility, virtualization, workers (hyper-scale §2) | First customer/admin UI phase; independent of backend once H2–H5 are green. |
| **H7** | T4 — Media: AVIF pipeline + font subsetting (hyper-scale §4) | Asset pipeline; independent, but after H6 so render measurements aren't polluted mid-phase. |
| **H8** | T3 — Offline-first mutation journal (hyper-scale §3) | **Requires H5** (server `Idempotency-Key`). Customer booking goes offline-safe. |
| **H9** | T5 — Real-time SSE delta sync for admin (hyper-scale §5) | Needs H4/H5 backend maturity (stable serialization, non-blocking handlers). |
| **H10** | T10 — Observability: RUM vitals + trace context (hyper-scale §10) | **Last on purpose** — so it measures the fully optimized system, not a moving target. |

> If you prefer strict guide order (§1→§10), say so and I will re-plan — but H8-before-H5 would ship
> offline replays without duplicate protection, which is why I recommend against it.

**Reserved migration numbers** (next free is `0012`; do not use these elsewhere):
`0012` → H2 indexes · `0013` → H5 idempotency keys · `0014` → H5 outbox · `0015` → H10 vitals table.

**New dependencies per phase** (installed by me, listed here for approval):
H1 none · H2 none · H3 `lru-cache` (backend) · H4 `pg-query-stream` (backend) ·
H5 none (hand-rolled breaker/outbox — no Redis/BullMQ infra needed) · H6 `@tanstack/react-virtual` (admin) + `vitest` (react dev, new test setup) ·
H7 `sharp` (dev, image pipeline) · H8 `fake-indexeddb` (react dev) · H9 none · H10 `web-vitals` (react + admin).

---

## 3. Global conventions (apply to all phases)

- **Naming:** `backend/src/infra/<area>/<thing>.ts` · `backend/tests/unit/<area>/<thing>.test.ts` ·
  `react/src/<area>/…` · `admin/src/<area>/…` · scripts in `scripts/<area>/…`.
- **No magic numbers:** TTLs, thresholds, pool sizes live in a `config`/`constants` file per module, overridable by env.
- **Every new module** exports through an `index.ts` barrel and documents its seam in a header comment.
- **AUTO gate (I run, every phase):** `npm run typecheck` (all 3 apps) + `npm test` (backend) + new phase tests +
  `npm run build:all` + the phase's verify script if it has one.
- **MANUAL gate (you run, every phase):** the checklist in that phase. Reply `Hn tested OK` to advance.
- **Rollback:** each phase lists a rollback (config revert / migration down / feature flag). Migrations are
  additive-only until H-phase is gated; destructive SQL is never shipped mid-track.

---

## 4. Phase H1 — Network & Transport (T1 · hyper-scale §1)

**Goal:** returning mobile visitors skip the handshake penalty; browsers preload critical CSS/fonts while the
origin thinks; third-party TLS tunnels are pre-warmed.
**Success metrics:** repeat-visit handshake −100–250ms · LCP −200–400ms · Razorpay modal opens ~250ms faster.

### File map

| Action | File | Purpose |
|---|---|---|
| EDIT | `react/index.html` | Add `dns-prefetch` + `preconnect` for Razorpay, LocationIQ, Google Fonts |
| EDIT | `admin/index.html` | Same preconnect set (fonts already present — verify, add API hosts) |
| EDIT | `react/public/_headers` | Add `Link:` preload headers (Early Hints fuel) for CSS/JS/fonts |
| EDIT | `admin/public/_headers` | Same for admin shell |
| NEW | `scripts/network/verify-t1-headers.mjs` | Dependency-free checker: `Alt-Svc`, 103/Early-Hints, preconnect tags (curl-based, like `healthcheck.mjs`) |
| NEW | `scripts/network/README.md` | What the script checks and how to read failures |

### Steps

1. 🔧 MANUAL — Cloudflare toggles (§4.1 below), on both zones (customer + admin domains).
2. Add preconnect/dns-prefetch links to both `index.html` files.
3. Add `Link:` preload headers to both `_headers` files (paths must match Vite output names).
4. Add + run `verify-t1-headers.mjs` against staging/production URLs.
5. AUTO gate, then your MANUAL gate.

### 🔧 MANUAL — H1 (you, ~10 min, both domains)

1. Log in to **Cloudflare Dashboard → select domain** (repeat for the admin domain).
2. **Network** (left sidebar) → turn **ON**: `HTTP/3 (with QUIC)` and `0-RTT Connection Resumption`. Leave
   `TLS 1.3` enabled (required for 0-RTT).
3. **Speed → Optimization** → turn **ON** `Early Hints`. (If your plan shows it as unavailable, tell me — we
   keep the `Link:` headers anyway; they still help as regular preloads.)
4. Purge cache once: **Caching → Purge Everything** (so headers take effect immediately).
5. Tell me the two domain names you toggled so I can point the verify script at them.

### Test gate — H1

- **AUTO (me):** typecheck + tests + builds + `node scripts/network/verify-t1-headers.mjs` green.
- **MANUAL (you):**
  - [ ] Open the site in Chrome → DevTools → Network → right-click columns → enable **Protocol** → reload:
    resources show `h3`.
  - [ ] DevTools → Network → click `/` document → Response Headers contain `alt-svc: h3=":443"`.
  - [ ] View page source: preconnect + dns-prefetch lines for `api.locationiq.com` present.
  - [ ] Site loads normally (no mixed-content or font warnings in Console).
- **Rollback:** Cloudflare toggles OFF (30 seconds); `_headers`/`index.html` edits revert cleanly.
- **Done =** verify script green + your 4 checkboxes + `H1 tested OK`.

---

## 5. Phase H2 — Database foundations (T8 · hyper-scale §8 + backend-guide §1, §2, §3)

**Goal:** the DB survives traffic spikes (pooling), live-dispatch queries drop to sub-millisecond (partial
indexes), search stops full-scanning (trigram), and concurrent writes can't corrupt bookings (optimistic locking).
**Success metrics:** dispatch query 45ms → <1ms · index RAM −95% · pool exhaustion impossible under 10× load ·
zero double-captures under concurrent webhooks.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `backend/migrations/0012_hyper_scale_indexes.sql` | Partial dispatch index, covering ticket index, `pg_trgm` + GIN indexes |
| NEW | `backend/src/db/poolConfig.ts` | Pool options (max/min/timeouts/`statement_timeout`) + env overrides |
| EDIT | `backend/src/db/postgres.ts` | Build pool via `poolConfig.ts`; add `pool.on('error')` logging (no other logic changes) |
| NEW | `backend/src/db/concurrency.ts` | `ConcurrencyError`, `updateWithOptimisticLock()`, `withRowLock()` (`FOR UPDATE NOWAIT`) |
| EDIT | `backend/src/modules/bookings/booking.service.ts` | Status transitions use optimistic locking on `version` |
| EDIT | `backend/src/modules/payments/payment.service.ts` | Capture/refund paths use row locking + version check |
| NEW | `backend/tests/unit/db/concurrency.test.ts` | Lock helper SQL + version-conflict behavior (mocked client, no live DB) |
| NEW | `backend/tests/integration/db-indexes.test.ts` | Live-DB test: `EXPLAIN` proves index-only/partial-index plans (runs with credentials, like `db-connection.test.ts`) |

### Steps

1. Write migration `0012` (additive `CREATE INDEX IF NOT EXISTS` only — safe to apply/rollback).
2. Add `poolConfig.ts`, rewire `postgres.ts` pool construction, add idle-client error logging.
3. Add `concurrency.ts`; convert booking + payment write paths (one service at a time, tests after each).
4. 🔧 MANUAL — Supabase pooler URL + Render env + staging migration (§5.1).
5. AUTO gate (incl. live-DB `EXPLAIN` test on staging), then your MANUAL gate.

### 🔧 MANUAL — H2 (you, ~15 min)

1. **Supabase Dashboard → Project → Connect → Connection string → Transaction pooler** (port `6543`, *not*
   `5432`). Copy the pooler URL.
2. **Render Dashboard → API service → Environment** → set `DATABASE_URL` to the pooler URL. Keep the direct
   (`5432`) URL aside as `DATABASE_URL_DIRECT` (used only by migration scripts, never the app).
3. In **Supabase → SQL Editor**, after I give you the go-ahead, run the contents of
   `backend/migrations/0012_hyper_scale_indexes.sql` on **staging first**, then production. (Each statement is
   `IF NOT EXISTS` — re-runnable.)
4. Paste back the `EXPLAIN (ANALYZE, BUFFERS)` outputs I will ask for (2 queries) so I can confirm index usage.

### Test gate — H2

- **AUTO (me):** typecheck + full backend suite + `db-indexes` live test green on staging.
- **MANUAL (you):**
  - [ ] Staging API boots with the pooler URL (`/health` + `/ready` OK after Render redeploy).
  - [ ] Admin bookings list + a test booking + a test payment all behave exactly as before (no behavior change —
    this phase is pure foundation).
  - [ ] Supabase → Database → Query performance shows the dispatch query using `idx_bookings_active_dispatch`.
- **Rollback:** Render env back to direct URL (revert) · `DROP INDEX IF EXISTS …` for `0012` ·
  services revert to pre-lock code (single commit).
- **Done =** live `EXPLAIN` proof + your 3 checkboxes + `H2 tested OK`.

---

## 6. Phase H3 — In-memory fare & geocoding cache (T7 · hyper-scale §7 + backend-guide §6)

**Goal:** 9 of 10 fare/geocode requests answered from RAM in <1ms; third-party API bills cut ~85–90%.
**Success metrics:** cached fare quote 350ms → <1ms · LocationIQ calls −85% · +4,500 req/s per core headroom.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `backend/src/infra/cache/lru.ts` | Typed LRU wrapper (backed by `lru-cache`) with stats hooks |
| NEW | `backend/src/infra/cache/cacheConfig.ts` | TTLs, max entries, key prefixes (env-overridable) |
| NEW | `backend/src/infra/cache/fareCache.ts` | Fare key builder (`from:to:vehicle:trip`), get/set/invalidate |
| NEW | `backend/src/infra/cache/geoCache.ts` | L1 wrapper over the existing `location_cache` table (L2) |
| NEW | `backend/src/infra/cache/cacheMetrics.ts` | Hit/miss counters (consumed by H10 telemetry) |
| NEW | `backend/src/infra/cache/index.ts` | Barrel export + module seam doc |
| EDIT | `backend/src/modules/fares/fare.service.ts` | Read-through cache on calculate; invalidate on fare-rule/catalog updates |
| EDIT | `backend/src/modules/locations/location.service.ts` | L1 → L2 → LocationIQ read-through chain |
| NEW | `backend/tests/unit/cache/fare-cache.test.ts` | Key building, TTL expiry, invalidation |
| NEW | `backend/tests/unit/cache/geo-cache.test.ts` | Read-through chain with mocked L2/provider |

### Steps

1. Install `lru-cache`; scaffold `infra/cache/` (config → lru → metrics → fare/geo → barrel).
2. Wire read-through into fare service; prove parity (cached quote ≡ computed quote) by test.
3. Wire L1→L2→provider chain into location service.
4. Add invalidation calls on every fare-rule/catalog write path (list them in the barrel doc).
5. AUTO gate + cache-hit drill, then your MANUAL gate.

### 🔧 MANUAL — H3

- None. (If you want, glance at Render → Metrics → Memory during my cache drill to see the ~1–2 MB footprint.)

### Test gate — H3

- **AUTO (me):** typecheck + suite + new cache tests + `curl` drill: cold quote (~350ms) → warm quote (<5ms) →
  fare-rule edit → quote reflects new rule (invalidation proof).
- **MANUAL (you):**
  - [ ] Hit the same fare quote twice in the browser/booking widget — second load is instant.
  - [ ] Ask me to change a test fare rule → quote updates immediately (no stale price).
  - [ ] Location autocomplete still returns correct results (no behavior change).
- **Seam for I1:** cache lives server-side; I1's typed client needs no changes.
- **Rollback:** env flag `FARE_CACHE_ENABLED=false` bypasses cache (ships in `cacheConfig.ts` from day one).
- **Done =** invalidation proof + your 3 checkboxes + `H3 tested OK`.

---

## 7. Phase H4 — Fastify throughput: JIT schemas + streaming exports (T6 · hyper-scale §6 + backend-guide §7, §8)

**Goal:** JSON serialization at JIT speed; admin CSV exports stream with flat ~2 MB memory at any row count.
**Success metrics:** serialization throughput ~3× · event-loop lag <0.5ms under load · 10k-row export never OOMs.

### File map

| Action | File | Purpose |
|---|---|---|
| EDIT | `backend/src/modules/bookings/booking.schema.ts` | Full response schemas (201 + 200 + error shapes) for JIT compile |
| EDIT | `backend/src/modules/fares/fare.schema.ts` | Same for fare responses |
| EDIT | `backend/src/modules/payments/payment.schema.ts` | Same for payment responses |
| EDIT | `backend/src/modules/admin/admin.schema.ts` | Same for admin responses |
| NEW | `backend/src/infra/http/streaming.ts` | CSV row transform + `pipeline()` helper with backpressure |
| NEW | `backend/src/modules/admin/admin.export.ts` | Streaming ledger export handler (`pg-query-stream` → CSV → socket) |
| EDIT | `backend/src/modules/admin/admin.routes.ts` | Register `GET /api/v1/admin/exports/bookings.csv` (RBAC-guarded) |
| NEW | `backend/tests/unit/http/streaming.test.ts` | CSV escaping/transform correctness |
| NEW | `backend/tests/integration/admin-export.test.ts` | Export endpoint: auth, headers, first-bytes-immediately behavior |

### Steps

1. Add response schemas module-by-module (bookings → fares → payments → admin), typecheck after each.
2. Install `pg-query-stream`; build `streaming.ts` + `admin.export.ts`; register route.
3. Load-drill: 10k-row export while measuring RSS (must stay flat).
4. AUTO gate, then your MANUAL gate.

### 🔧 MANUAL — H4

- None (all code). Your test is downloading a real export from the admin panel.

### Test gate — H4

- **AUTO (me):** typecheck + suite + export integration test + memory drill log (RSS before/during/after export).
- **MANUAL (you):**
  - [ ] Admin → download bookings CSV → file opens correctly in Excel/Sheets, all rows present.
  - [ ] During the download, the customer fare quote endpoint still responds instantly (no blocking).
  - [ ] Booking + payment flows behave exactly as before (schemas changed serialization, not behavior).
- **Rollback:** route removal (single commit) reverts exports; schemas are additive (safe to keep or revert).
- **Done =** flat-memory drill log + your 3 checkboxes + `H4 tested OK`.

---

## 8. Phase H5 — Resilience: idempotency, circuit breakers, outbox (T9 · hyper-scale §9 + backend-guide §4)

**Goal:** double-taps and webhook retries can never double-charge or duplicate-book; third-party outages degrade
gracefully instead of crashing us; WhatsApp/email never block the API response and are never lost.
**Success metrics:** duplicate POST ≡ single booking · provider outage → instant fallback, site stays up ·
booking-confirm API 4.5s → ~20ms.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `backend/migrations/0013_idempotency_keys.sql` | `idempotency_keys(key, status, response, created_at)` + TTL index |
| NEW | `backend/migrations/0014_notification_outbox.sql` | `notification_jobs(channel, recipient, template, payload, status, attempts, …)` |
| NEW | `backend/src/infra/resilience/idempotency.ts` | `withIdempotency(key, handler)` — replay-or-execute + 24h retention |
| NEW | `backend/src/infra/resilience/circuitBreaker.ts` | Generic breaker (CLOSED/OPEN/HALF-OPEN) with counts + cooldown |
| NEW | `backend/src/infra/resilience/breakers.ts` | Configured instances: Razorpay, LocationIQ, WhatsApp, Email |
| NEW | `backend/src/infra/resilience/index.ts` | Barrel + seam doc |
| NEW | `backend/src/infra/outbox/outbox.ts` | `enqueue(tx, job)` — atomic insert inside the booking transaction |
| NEW | `backend/src/infra/outbox/worker.ts` | In-process poller (interval + backoff + max attempts + poison-queue logging) |
| NEW | `backend/src/infra/outbox/channels.ts` | Channel dispatch map → existing notification providers |
| EDIT | `backend/src/modules/bookings/booking.routes.ts` | Read `Idempotency-Key` header → wrap handler |
| EDIT | `backend/src/modules/payments/payment.service.ts` | Wrap provider calls in breakers; webhook handler idempotent by key |
| EDIT | `backend/src/modules/notifications/notification.service.ts` | Enqueue to outbox instead of inline send |
| EDIT | `backend/src/server.ts` | Start/stop outbox worker with the Fastify lifecycle |
| NEW | `backend/tests/unit/resilience/idempotency.test.ts` | Replay-identical-response, concurrent-same-key, TTL |
| NEW | `backend/tests/unit/resilience/breaker.test.ts` | Trip → fallback → half-open → reset transitions |
| NEW | `backend/tests/unit/outbox/outbox.test.ts` | Enqueue-in-tx + worker retry/backoff with mocked channels |

### Steps

1. Migrations `0013` + `0014` (additive tables only).
2. Build `infra/resilience/` (breaker → instances → idempotency), unit-test each in isolation.
3. Wire `Idempotency-Key` into booking + payment routes; drill double-POST.
4. Build `infra/outbox/`; convert notification service to enqueue; start worker in `server.ts`.
5. Wrap all third-party calls in breakers with documented fallbacks (fallback table in `breakers.ts` header).
6. 🔧 MANUAL — Render log check (§8.1). AUTO gate, then your MANUAL gate.

### 🔧 MANUAL — H5 (you, ~10 min)

1. After deploy, open **Render → API service → Logs** and confirm you see the worker boot line
   (I will give you the exact string, e.g. `outbox worker started pollMs=5000`).
2. Make one test booking; confirm the WhatsApp/email arrives within ~1 minute (proves worker → channel path).
3. No dashboard config changes needed — the worker runs **in-process** (no new Render service, no Redis).

### Test gate — H5

- **AUTO (me):** typecheck + suite + new resilience/outbox tests + drills: double-POST ≡ 1 booking ·
  simulated provider outage → fallback + site stays up · kill-provider-mid-send → job retried, not lost.
- **MANUAL (you):**
  - [ ] Double-tap a test booking submit (fast!) → exactly ONE booking, ONE charge.
  - [ ] Test booking confirms instantly (no 4–5s hang waiting on WhatsApp/email).
  - [ ] Confirmation message still arrives (within ~1 min).
- **Seam for H8:** `Idempotency-Key` header contract — H8's journal reuses it verbatim.
- **Rollback:** worker disable flag `OUTBOX_ENABLED=false` restores inline send path (kept, not deleted, until H5 gates).
- **Done =** drill logs + your 3 checkboxes + `H5 tested OK`.

---

## 9. Phase H6 — Frontend rendering (T2 · hyper-scale §2)

**Goal:** initial render skips off-screen work; admin tables stay at 60fps with thousands of rows; heavy fare-matrix
math never freezes the UI thread.
**Success metrics:** mobile layout CPU −40–60% · bookings table 12k nodes → ~15 nodes · INP in the green.

### File map

| Action | File | Purpose |
|---|---|---|
| EDIT | `react/src/styles/global.css` | `.section--offscreen-heavy` (`content-visibility` + `contain-intrinsic-size`) |
| EDIT | `react/src/components/home/ReviewsMarquee.tsx` | Apply offscreen class |
| EDIT | `react/src/pages/FaqPage.tsx` | Apply offscreen class |
| EDIT | `react/src/components/chrome/Footer.tsx` | Apply offscreen class |
| EDIT | `react/src/pages/RouteDetailPage.tsx` | Apply offscreen class to detail matrix |
| NEW | `admin/src/components/ui/VirtualList.tsx` | Virtualized row renderer (backed by `@tanstack/react-virtual`) |
| EDIT | `admin/src/pages/BookingsPage.tsx` | Render rows through `VirtualList` (same visuals, windowed DOM) |
| NEW | `react/src/workers/fareMatrix.worker.ts` | Fare-matrix crunching off main thread (Vite-native worker) |
| NEW | `react/src/workers/useWorkerFare.ts` | Hook: post params → receive quote, with main-thread fallback |
| NEW | `react/tests/setup.ts` + `react/vitest.config.ts` | First react test setup (node env; reused by H8) |
| NEW | `react/tests/workers/fare-protocol.test.ts` | Worker request/response protocol (pure logic, no DOM) |

### Steps

1. CSS pass: add class + apply to 4 heavy sections (reviews, FAQ, footer, route matrix).
2. Admin virtualization: install `@tanstack/react-virtual`, build `VirtualList`, convert bookings table.
3. Worker: extract fare-matrix calc into worker + hook with fallback (if workers unavailable, main thread path runs).
4. Set up react `vitest` (dev-only, node env) + protocol test.
5. AUTO gate (incl. `npm run build:all` size comparison — no bundle blowup), then your MANUAL gate.

### 🔧 MANUAL — H6

- None to configure. Your testing uses Chrome DevTools (steps below) — I will walk you through if anything is unclear.

### Test gate — H6

- **AUTO (me):** typecheck (3 apps) + backend suite + new react test + build-size report (before vs after).
- **MANUAL (you):**
  - [ ] Home page: fast scroll to FAQ/reviews/footer — no layout jumps, no blank flashes.
  - [ ] Admin → Bookings with many rows: buttery scroll; DevTools → Elements shows only ~15–20 row nodes.
  - [ ] Booking fare widget: typing/clicking stays responsive while quotes compute (no freeze).
  - [ ] Design check: nothing *looks* different — this phase changes performance, not visuals
    (per `DESIGN_LOCKS.md`, any visual delta fails the gate).
- **Rollback:** CSS class removal (instant) · `VirtualList` → plain map (single-file revert) ·
  worker flag `VITE_WORKER_FARE=false` restores main-thread path.
- **Done =** size report + your 4 checkboxes + `H6 tested OK`.

---

## 10. Phase H7 — Media & fonts (T4 · hyper-scale §4)

**Goal:** images at −80% bytes with identical fidelity; fonts at −90% bytes with zero unstyled-text flash.
**Success metrics:** hero/destination images ~180 KB AVIF · font payload 450 KB → ~45 KB · LCP improves again.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `scripts/media/convert-to-avif.mjs` | Batch converter (existing WebP/JPG → AVIF, quality ladder, skip-if-newer) |
| NEW | `scripts/media/README.md` | How to run the pipeline + quality-review checklist |
| NEW | `react/src/components/media/SmartImage.tsx` | `<picture>` wrapper: AVIF → WebP → fallback + `loading`/`decoding`/sizes |
| EDIT | `react/src/components/home/HeroBentoGrid.tsx` | Use `SmartImage` for hero visuals |
| EDIT | `react/src/components/home/FleetSection.tsx` | Use `SmartImage` for fleet cards |
| EDIT | `react/src/pages/RouteDetailPage.tsx` + destination blocks | Use `SmartImage` for destination imagery |
| EDIT | `react/index.html` | Subset font URLs (`&text=` Latin + currency) + split EN/HI loading |
| EDIT | `react/src/styles/tokens.css` | `unicode-range` split (Latin vs Devanagari) so each locale downloads only its glyphs |
| NEW | `react/tests/media/smart-image.test.ts` | Source-order + fallback + a11y (alt passthrough) assertions |

### Steps

1. Install `sharp` (dev); write converter; run it; 🔧 MANUAL quality review (§10.1).
2. Build `SmartImage`; convert hero → fleet → destinations (one surface at a time, visual check each).
3. Font subsetting: split URLs + `unicode-range`; verify EN page never fetches Devanagari bytes.
4. AUTO gate + Lighthouse-before/after, then your MANUAL gate.

### 🔧 MANUAL — H7 (you, ~15 min)

1. I will send you **before/after screenshots** (or a preview link) for 3 images: hero, one fleet card, one
   destination. Reply **approve** per image, or name the one that looks off (banding/softness) and I re-tune quality.
2. After deploy, open the site on your phone once (real device, 4G if possible) and confirm images + fonts look
   identical to before — only faster.

### Test gate — H7

- **AUTO (me):** typecheck + suites + `SmartImage` tests + bytes report (per-image KB before/after) +
  Lighthouse LCP before/after.
- **MANUAL (you):**
  - [ ] Your 3 image approvals (above).
  - [ ] Old-browser check: I will give you a fallback-test URL (forces WebP path) — images still render.
  - [ ] No flash-of-unstyled-text on hard reload (EN + HI pages).
- **Rollback:** `SmartImage` renders `<img>` fallback only via prop (instant) · font links revert (single commit) ·
  AVIF files are additive (old assets untouched until gate passes; cleanup only after `H7 tested OK`).
- **Done =** bytes report + your approvals + `H7 tested OK`.

---

## 11. Phase H8 — Offline-first mutation journal (T3 · hyper-scale §3)

**Goal:** customers can complete a booking with zero connectivity; the app confirms in 0ms and syncs when the
network returns — with zero duplicates (server idempotency from H5 does the hard part).
**Success metrics:** perceived confirm latency 1,500ms → 0ms · airplane-mode booking syncs on reconnect ·
5 frustrated taps ≡ 1 booking.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `react/src/offline/db.ts` | Tiny promise wrapper over IndexedDB (`skb_mutation_journal` store, no dependency) |
| NEW | `react/src/offline/journal.ts` | `append()` / `markSynced()` / `pending()` — the journal API |
| NEW | `react/src/offline/dispatcher.ts` | POST with `Idempotency-Key` (H5 contract) + retry/backoff + `online` listener |
| NEW | `react/src/offline/registerSync.ts` | Service-worker background-sync registration + fallback timer |
| NEW | `react/src/offline/useQueuedBooking.ts` | Hook for the booking page: queue → optimistic ticket → sync status |
| NEW | `react/public/sw.js` | Minimal service worker (sync replay only — no caching games, no stale-HTML risk) |
| EDIT | `react/src/features/booking/BookingPage.tsx` | "Booking Scheduled" optimistic state + pulsating sync indicator + queued-ticket view |
| NEW | `react/tests/offline/journal.test.ts` | Append/replay/mark-synced + duplicate-suppression (via `fake-indexeddb`) |

### Steps

1. Install `fake-indexeddb` (dev); build `db.ts` → `journal.ts` → `dispatcher.ts` (test each).
2. Add `sw.js` + `registerSync.ts` (sync-only worker; explicitly no fetch caching in v1).
3. Build `useQueuedBooking` + convert `BookingPage` to optimistic flow.
4. Drill: offline → queue → online → synced; 5-tap duplicate drill against H5 idempotency.
5. AUTO gate, then your MANUAL gate (includes a real phone test).

### 🔧 MANUAL — H8 (you, ~15 min, needs your phone)

1. Open the booking page on your **phone** (preview URL I give you).
2. Turn on **airplane mode** → fill the form → tap Reserve → you should see the "Booking Scheduled" ticket
   **instantly** with a sync icon.
3. Turn airplane mode **off** → within ~30s the ticket flips to confirmed (same ticket ID, no duplicate).
4. Repeat-step-2 test: with network ON, tap Reserve **5 times fast** → exactly one booking exists.

### Test gate — H8

- **AUTO (me):** typecheck + suites + journal tests + offline/online drill log (Playwright-less: dispatcher unit
  drill + `curl` duplicate-key proof against staging).
- **MANUAL (you):**
  - [ ] The 4 phone-test steps above all pass.
  - [ ] Desktop booking still works exactly as before when online (no regression).
  - [ ] Queued ticket shows enough info (route, fare, ticket ID) to be useful before sync.
- **Seam for I1:** dispatcher POSTs to the same draft endpoint I1's client will use; when I1 lands we swap the
  transport line only (marked `// I1-SEAM` in code).
- **Rollback:** feature flag `VITE_OFFLINE_QUEUE=false` restores direct-POST booking (old path kept until gate).
- **Done =** drill log + your phone test + `H8 tested OK`.

---

## 12. Phase H9 — Real-time SSE delta sync for admin (T5 · hyper-scale §5)

**Goal:** the ops desk updates live (<100ms) with no polling: new bookings, payments, driver changes push from
server to admin over one SSE stream.
**Success metrics:** polling bytes −90% · dispatch DB reads −90% · new booking visible + chime in <1s.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `backend/src/infra/realtime/events.ts` | Typed in-process emitter (`booking_mutation`, `payment_event`, …) |
| NEW | `backend/src/infra/realtime/sse.ts` | SSE reply helper: headers, heartbeat, backpressure-safe writes |
| NEW | `backend/src/modules/admin/admin.events.ts` | `GET /api/v1/admin/events` (auth + RBAC + subscribe/unsubscribe) |
| EDIT | `backend/src/modules/admin/admin.routes.ts` | Register the events route |
| EDIT | `backend/src/modules/bookings/booking.service.ts` | Emit `booking_mutation` deltas on state changes |
| EDIT | `backend/src/modules/payments/payment.service.ts` | Emit `payment_event` deltas on webhook confirmations |
| NEW | `admin/src/live/useLiveBookings.ts` | `EventSource` hook: auto-reconnect + backoff + heartbeat watchdog |
| NEW | `admin/src/live/reconcile.ts` | Delta → local-state merge (insert/update, id-keyed, order-stable) |
| NEW | `admin/src/live/chime.ts` | Notification sound (mutable, off by default? — your call at build time) |
| EDIT | `admin/src/pages/BookingsPage.tsx` | Consume live hook (works alongside H6 `VirtualList`) |
| EDIT | `admin/src/pages/DashboardPage.tsx` | Live counters from the same stream |
| NEW | `backend/tests/integration/admin-events.test.ts` | SSE headers, auth denial, heartbeat bytes, delta payload shape |

### Steps

1. Build `infra/realtime/` + `admin.events.ts`; verify with `curl -N` (raw stream inspection).
2. Emit deltas from booking + payment services (one emitter each, tested).
3. Build admin `live/` module; wire bookings + dashboard pages.
4. Two-window drill: book on customer page → admin updates + chimes with no refresh.
5. AUTO gate, then your MANUAL gate.

### 🔧 MANUAL — H9 (you, ~10 min, needs two windows)

1. Open the **admin bookings page** in one window and the **customer booking page** in another (I give you URLs).
2. Make a test booking → admin row appears **without refresh** (+ chime if enabled). Tell me the delay you observe.
3. Kill your laptop's Wi-Fi for 10s → reconnect → stream resumes by itself (no reload needed).

### Test gate — H9

- **AUTO (me):** typecheck + suites + SSE integration test + `curl -N` stream capture attached to the phase log.
- **MANUAL (you):**
  - [ ] Two-window drill passes (booking → live row).
  - [ ] Wi-Fi-kill drill passes (auto-resume, no duplicates in the table).
  - [ ] Overnight/soak check (optional): leave admin open 30 min — no freeze, no memory growth, still live.
- **Infra note:** SSE needs no Cloudflare toggle and works on Render web services; `X-Accel-Buffering: no` and
  `Cache-Control: no-cache, no-transform` are set in `sse.ts` so proxies don't buffer the stream.
- **Rollback:** pages fall back to manual refresh (live hook behind `VITE_LIVE_SYNC` flag, default ON only after gate).
- **Done =** stream capture + your drills + `H9 tested OK`.

---

## 13. Phase H10 — Observability: RUM vitals + trace context (T10 · hyper-scale §10)

**Goal:** we measure real users (budget Androids on 4G, not lab Lighthouse) and can trace any request
end-to-end across customer site → API → admin.
**Success metrics:** LCP/CLS/INP visible per page/route within 24h of deploy · any `x-request-id` traceable
across frontend + backend logs.

### File map

| Action | File | Purpose |
|---|---|---|
| NEW | `backend/migrations/0015_web_vitals.sql` | `web_vitals(page, metric, value, …)` + 30-day retention index |
| NEW | `backend/src/infra/telemetry/vitals.routes.ts` | `POST /api/v1/telemetry/vitals` (validated, lightweight, no auth — rate-limited) |
| NEW | `backend/src/infra/telemetry/vitals.service.ts` | Insert + rollup queries (p50/p75/p95 per page) |
| NEW | `backend/src/infra/telemetry/trace.ts` | W3C `traceparent` parse/propagate helpers |
| EDIT | `backend/src/middlewares/requestId.ts` | Accept/emit `traceparent` alongside `x-request-id` |
| NEW | `react/src/telemetry/vitals.ts` | `web-vitals` → `navigator.sendBeacon` (non-blocking, batched) |
| NEW | `admin/src/telemetry/vitals.ts` | Same for admin (separate app, own copy — no shared package in this monorepo) |
| EDIT | `react/src/main.tsx` | Init telemetry once (guard: only in production builds) |
| EDIT | `admin/src/main.tsx` | Same for admin |
| NEW | `backend/tests/unit/telemetry/vitals.test.ts` | Payload validation, rollup math |
| NEW | `docs/hyper-scale/RUM_DASHBOARD.md` | The 3 SQL queries that answer "how fast are we?" (p75 LCP/CLS/INP per page) |

### Steps

1. Migration `0015`; build ingest route + service + rollups.
2. Extend `requestId.ts` with `traceparent` (backwards-compatible: old `x-request-id` clients unaffected).
3. Add `vitals.ts` to both frontends; init in `main.tsx` behind production guard.
4. Install `web-vitals` in both apps.
5. Write `RUM_DASHBOARD.md` (copy-paste SQL for Supabase).
6. AUTO gate + 24h soak, then your MANUAL gate.

### 🔧 MANUAL — H10 (you, ~15 min spread over 2 days)

1. **Day 1:** after deploy, browse 5–6 customer pages + 2 admin pages (creates real beacon traffic).
2. **Day 2:** open **Supabase → SQL Editor**, paste Query #1 from `docs/hyper-scale/RUM_DASHBOARD.md`, run it,
   and send me the numbers (p75 LCP/INP per page). That table is our before/after scoreboard for the whole track.
3. Pick one booking from the admin list, copy its `x-request-id` (I will show you where it surfaces), and confirm
   you can find the same ID in **Render → Logs**. That proves end-to-end traceability.

### Test gate — H10

- **AUTO (me):** typecheck + suites + beacon-receipt drill (`curl` a synthetic vital → row appears → rollup correct).
- **MANUAL (you):**
  - [ ] Day-2 RUM numbers exist for every major page (no silent beacon failures).
  - [ ] One `x-request-id` traced from UI to Render logs.
  - [ ] No console errors / no perf regression from telemetry itself (beacons are fire-and-forget).
- **Rollback:** `VITE_TELEMETRY=false` disables beacons; ingest route is additive (safe to keep).
- **Done =** RUM scoreboard numbers + your trace check + `H10 tested OK` → **whole track complete 🎉**.

---

## 14. Master gate checklist (copy-paste per phase)

```text
Phase Hn — <name>
AUTO (agent):
[ ] npm run typecheck green (react + admin + backend)
[ ] backend tests green (incl. new Hn tests)
[ ] react/admin tests green (if the phase adds any)
[ ] npm run build:all green, no bundle-size surprise
[ ] phase drill log attached (curl output / EXPLAIN / bytes report / stream capture)
MANUAL (you):
[ ] <checklist from the phase section>
Sign-off: reply "Hn tested OK" to open H(n+1)
Tracker: 04_PROGRESS_TRACKER.md updated (agent, after sign-off)
```

---

## 15. All 🔧 MANUAL work in one place (your total commitment)

| Phase | What you do | Where | Time |
|---|---|---|---|
| H1 | HTTP/3 + 0-RTT + Early Hints ON; purge cache; 4 browser checks | Cloudflare dashboard | ~15 min |
| H2 | Copy pooler URL; set Render `DATABASE_URL`; run `0012` SQL on staging then prod; paste 2 EXPLAINs | Supabase + Render dashboards | ~20 min |
| H3 | Normal quote/autocomplete checks | Browser | ~10 min |
| H4 | Download a CSV export; confirm site stays fast during it | Admin panel | ~10 min |
| H5 | Confirm worker boot line in logs; 1 test booking (double-tap!) | Render logs + site | ~15 min |
| H6 | Scroll checks + bookings-table scroll + design-unchanged check | Browser DevTools (guided) | ~15 min |
| H7 | Approve 3 before/after images; 1 phone check | Preview link + phone | ~15 min |
| H8 | Airplane-mode booking test + 5-tap test | Your phone | ~15 min |
| H9 | Two-window live drill + Wi-Fi-kill drill | Browser (2 windows) | ~10 min |
| H10 | Browse pages day 1; run 1 SQL query + 1 log trace day 2 | Supabase + Render | ~15 min |
| **Total** | | | **~2.5 hours across the whole track** |

Everything else — code, tests, drills, docs, tracker updates — is on me.

---

## 16. Appendix — guide cross-reference (nothing gets lost)

| Hyper-scale § | Backend-guide § | Phase | Notes |
|---|---|---|---|
| §1 Network & Transport | — | **H1** | Toggles + headers + preconnect |
| §8 DB scaling & pooling | §1 PgBouncer/pool · §2 indexes · §3 OCC/locking | **H2** | Merged: one DB foundation |
| §7 In-memory fare engine | §6 L1/L2 caching | **H3** | Merged: one cache module |
| §6 Fastify/JIT/streaming | §7 backpressure exports · §8 JIT schemas | **H4** | Merged: one throughput phase |
| §9 Resilience/idempotency | §4 transactional outbox | **H5** | Merged: outbox lives with resilience |
| §2 Rendering/hydration | — | **H6** | CSS + virtualization + workers (Vite-native, no comlink needed) |
| §4 Media/subsetting | — | **H7** | AVIF + font subsetting |
| §3 Offline journal | — | **H8** | After H5 by dependency |
| §5 SSE/delta sync | — | **H9** | Admin live stream |
| §10 Observability/RUM | — | **H10** | Last, measures everything |
| — | §5 CQRS/materialized views | **H2-stretch*** | Analytics views are folded into H2 only if dispatch analytics queries exist by then; otherwise deferred to post-track (they need real query patterns to design against) |

\* The one deliberate deferral: backend-guide §5 (CQRS views) needs production query patterns to design correctly.
If you want it forced into H2 anyway, say so and I will add `0012b` + `mv_admin_operations_summary` to the H2 file map.

---

## 17. What happens next

1. You confirm the execution order (recommended H1→H10 above, or strict guide §1→§10).
2. I implement **H1 only**: preconnect + headers + verify script — then hand you the 🔧 MANUAL Cloudflare steps.
3. You run the 4 H1 browser checks → reply `H1 tested OK` → I open H2.
4. Repeat to H10. 🎉
