# Admin Panel — Design & Frontend Spec (Phase 0: Design)

**Status:** Design build (demo data, no backend wiring) · Branch work: session branch `arena/01a09f48-arenaai`
**Related:** [ADMIN_PRD.md](ADMIN_PRD.md) · [ADMIN_TRD.md](ADMIN_TRD.md) · [ADMIN_API_CONTRACT.md](ADMIN_API_CONTRACT.md) · [DESIGN.md](DESIGN.md) · [DESIGN_LOCKS.md](DESIGN_LOCKS.md)

---

## 1. What was built

A standalone Vite + React 19 + TypeScript admin frontend in [`admin/`](admin/), separate from the
public marketing site in [`react/`](react/). The marketing site's locked components and its
`<3KB vanilla motion` rule are untouched; the admin app is a separate bundle with its own
design implementation of the **same brand system**.

| Concern | Choice | Notes |
|---|---|---|
| Framework | Vite 7 + React 19 + TypeScript (strict) | Mirrors `react/` conventions |
| Design system | **21st.dev** Vercel light-mode aesthetic | shadcn/ui-style components hand-rolled in `src/components/ui/` |
| Motion | **motion.dev** (`motion` package, `motion/react`) | Page transitions, layout animations, SVG path draws, counters |
| Icons | **lucide-react** (SVG) | Consistent 24-grid stroke icons, gold-tinted in brand contexts |
| Charts | **Custom SVG** + motion (no chart lib) | Area, donut, ranked bars, vertical bars, sparklines — full motion control, zero payload bloat |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Brand tokens map to CSS variables so light/dark switch at runtime |
| Routing | react-router-dom v7 | `AnimatePresence` page transitions in `AdminLayout` |

### Run it

```bash
npm run admin:dev        # from repo root → http://localhost:5174
npm run admin:build      # typecheck + production build
npm run admin:preview    # serve dist/ on :4175
```

Demo auth mirrors **TRD §2.1**: the login screen issues a `test-<role>` principal per the
selected role (dispatcher, content_editor, review_moderator, finance_operator, super_admin).
Role-gated modules render a locked state when the permission matrix
(`ADMIN_PRD.md §4`, implemented in `src/lib/types.ts → can()`) denies access.

## 2. Design tokens (locked to DESIGN.md / LOCK-010)

- **Light (default):** `#FFFFFF` canvas · `#FAFAFA` alternate · `#0A0A0A` ink · `#737373` soft ·
  hairline `rgba(0,0,0,.08)` · 6px radius.
- **Brand accent:** Saffron Gold `#E5A044` (deep `#B27123`, light `#F3C36C`, wash `#FDF7ED`) —
  CTAs, focus rings, active nav, chart strokes. **No second accent; no blue.**
- **Dark (Solar Dusk):** `#181615` canvas · `#242220` surface · `#3D3936` borders — via
  `[data-theme="dark"]` override, toggled from the topbar.
- **Type:** Fraunces (display/headings), Geist→Inter→DM Sans (UI), DM Mono (eyebrows, ticket IDs,
  numerals, table headers). One Google Fonts request, `display=swap`.
- **Motion tokens:** 180 ms fast / 400 ms medium / 1200 ms slow, `ease-out-expo
  cubic-bezier(0.16,1,0.3,1)`. Every `motion` primitive honors `prefers-reduced-motion`
  (checked via `useReducedMotion()` and the global CSS kill-switch in `globals.css`).

> **Scope note on ANIMATION_RULES.md:** that gate protects the *public* site (real HTML,
> <3 KB vanilla engine, zero heavy libs). The admin panel is an internal SPA — per explicit
> product direction it uses motion.dev — but keeps the same contract: only transform/opacity
> animation, staggered (not per-pixel) reveals, zero content hidden behind effects, and full
> reduced-motion fallbacks.

## 3. Screen map

| Route | Screen | Highlights |
|---|---|---|
| `/login` | Staff sign-in | Split brand panel (animated SVG route/compass scene, Taj pulse pin), role picker, `test-<role>` token note |
| `/` | **Analytics board** | 4 KPI stat cards (animated counters + sparklines + delta pills), 12-month revenue **area chart** (path draw + hover tooltip), **donut** status mix, vertical bars by vehicle tier, ranked bars top routes, live audit activity timeline |
| `/bookings` | Booking operations | Search (ticket/phone/name), status filter tabs with animated indicator, staggered table, slide-in detail drawer: fare snapshot, **PII unmask toggle (audited)**, state-machine transition buttons (`paid_confirmed → in_transit → completed`), version-lock column |
| `/finance` | Finance & refunds | Ledger table (provider/method icons), method-mix ranked bars, **refund dialog** (amount, mandatory reason, idempotency key, 8 s gateway simulation, success state) — super_admin only |
| `/catalog` | Catalog CMS | Card grid with animated SVG route art, draft/published/archived chips, publish/archive role-gating, hover lift |
| `/reviews` | Review moderation | Queue buckets (pending/approved/published/rejected), verified-badge cross-reference, spam warning for unverified ticket IDs, approve/reject/publish actions with layout animations |
| `/inquiries` | Inquiries & leads | Master–detail inbox, 5-step workflow pills (new → contacted → quoted → converted → closed), operator notes |
| `/fares` | Fare rules | Ruleset version banner, rule chips, per-km rate table (server-authoritative, read-only), numbered rule notes |
| `/audit` | Audit trail | Super-admin only; immutable log with action-type filter chips, actor/role, resource, IP, hash-chained badge |

### Motion inventory (motion.dev)

- **Pages:** `AnimatePresence mode="wait"` crossfade/slide between routes.
- **Sidebar:** staggered item entry, `layoutId="sidebar-active"` sliding active pill, icon hover scale.
- **Buttons:** spring `whileTap` press, gold hover, 21st.dev diagonal **shine sweep** on primary CTAs.
- **Text/numbers:** `AnimatedCounter` spring count-up (KPIs), staggered headline reveal (PageHeader).
- **Icons:** icon-chip scale+rotate on hover (stat cards), 3D theme-toggle rotate-in, brand compass needle spring + route draw on load/login.
- **Grids:** stat cards & catalog cards stagger 60 ms / 45 px rises with hover lift (`shadow-lift`).
- **Charts:** SVG `pathLength` draw (area, sparklines), donut stroke-offset sweep, bar growth with expo ease.
- **Feedback:** dialog spring scale, drawer slide, toast-style success check pop, notification ping.

## 4. File map

```
admin/
├─ index.html                  # Fonts (Fraunces / DM Sans / DM Mono), meta
├─ vite.config.ts              # :5174 dev · 0.0.0.0 · allowedHosts (preview proxy)
└─ src/
   ├─ styles/globals.css       # Tailwind v4 @theme + brand tokens + reduced-motion kill-switch
   ├─ lib/
   │  ├─ types.ts              # Domain types, RBAC permission matrix + can()
   │  ├─ fares.ts              # Active fare ruleset (mirrors API contract)
   │  ├─ mock-data.ts          # Demo dataset (swap for fetch layer when API lands)
   │  └─ utils.ts              # cn(), INR formatting (Indian grouping), PII masking
   ├─ components/
   │  ├─ ui/                   # 21st.dev kit: Button (shine), Card, Badge, Input/Select, Table, Tabs, Dialog
   │  ├─ charts/Charts.tsx     # AreaChart, DonutChart, RankedBars, VerticalBars, Sparkline (SVG + motion)
   │  ├─ admin/                # Shell: AdminLayout, Sidebar, Topbar, PageHeader, StatCard, StatusBadge, AnimatedCounter, BrandMark
   │  └─ login/LoginPage.tsx   # Role-based demo auth
   └─ pages/                   # Dashboard, Bookings, Finance, Catalog, Reviews, Inquiries, Fares, Audit
```

## 5. Next steps (post-design)

1. Replace `lib/mock-data.ts` with the Fastify ops API (Bearer JWT) per `ADMIN_API_CONTRACT.md`;
   keep the component layer unchanged (props already match the API shapes).
2. Wire real session (Supabase JWT) in place of `test-<role>` principals; remove demo role picker.
3. Register `admin/dist` deploy target (Cloudflare Pages) once the public site deploy is stable.
4. Any new admin screen: add route + `TITLES` entry in `AdminLayout`, follow the PageHeader →
   Card grid pattern, reuse `ui/` kit (no new palettes, no new radii — extend `globals.css` tokens first).
