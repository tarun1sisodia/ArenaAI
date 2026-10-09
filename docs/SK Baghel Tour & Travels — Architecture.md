# SK Baghel Tour & Travels — Architecture

**Status:** Canonical architecture  
**Repository:** `tarun1sisodia/ArenaAI`  
**Last reviewed:** 2026-10-09

## 1. Architecture at a glance

```text
Admin React app
  -> typed HTTP client + auth token
  -> Backend Fastify API
  -> application use case
  -> domain validation/rules
  -> repository/SQL transaction
  -> Supabase PostgreSQL
  -> audit + publication event
  -> verified public release
  -> Customer build/SSG projection
  -> Customer page/search
  -> Booking/Quote API for live authority
```

The platform is a **modular monolith backend plus two frontend applications**. It does not require microservices for the current product.

## 2. Applications and technology

| Application | Directory | Runtime/deployment | Responsibility |
|---|---|---|---|
| Customer | `react/` | React + Vite + TypeScript; Cloudflare Pages | Public SEO pages, published projection, booking entry |
| Admin | `admin/` | React + Vite + TypeScript; Cloudflare Pages | Authenticated operations and content management |
| Backend | `backend/` | Fastify + TypeScript; Render/container | API, domain rules, database, pricing, booking, payment, publishing |
| Shared contracts | `contracts/` | TypeScript source and sync script | Canonical cross-app enums and wire rules |

The repository scripts are the execution contract:

```text
npm run install:all
npm run verify
npm run customer:typecheck
npm run admin:typecheck
npm run backend:typecheck
npm run customer:build
npm run admin:build
npm run backend:build
npm test
```

## 3. Layer responsibilities

### Admin

```text
page/form -> payload builder -> typed API client -> Backend
```

Admin may validate for user experience, but Backend validation is authoritative. Admin must not import database clients or write SQL.

### Backend

```text
route/controller -> application service -> domain/schema -> repository -> database
```

HTTP handlers do not contain SQL or duplicate pricing formulas. Services coordinate use cases. Domain schemas/rules decide validity. Repositories own persistence details.

### Customer

```text
public release data -> resolver -> page template -> HTML/interactive UI
```

Customer may format and present values. It does not decide whether an entity is published, invent missing prices, or authorize a booking.

## 4. Backend module map

The current module directories are the implementation starting point:

- `admin`
- `booking-intents`
- `bookings`
- `cancellation-policies`
- `catalog`
- `company-profile`
- `content`
- `dossier-signoffs`
- `fares`
- `inquiries`
- `local-packages`
- `locations`
- `monuments`
- `notifications`
- `payments`
- `pet-policy`
- `promos`
- `rental-enquiries`
- `reviews`
- `route-catalog`
- `tour-packages`
- `transfer-routes`

Each module should expose a clear combination of:

```text
schema.ts       request/query validation and public DTO validation
routes.ts       URL registration and auth boundary
controller.ts   HTTP translation only
service.ts      use-case orchestration
repository      persistence access where separated
```

The project may retain existing file names during feature work, but new behavior must preserve these boundaries.

## 5. Data ownership

| Concern | Authority | Customer copy | Admin copy |
|---|---|---|---|
| Business row/status | PostgreSQL/Backend | Never authoritative | Reads/commands through API |
| Pricing formula | Backend fares/pricing domain | Display only | Preview through API |
| Published public content | Versioned public release | Build input | Publication status |
| Final booking amount | Backend quote/booking | Display response | Operational view |
| Payment status | Backend + provider webhook | Read-only result | Finance workflow |
| Authorization | Backend auth/RBAC | N/A | UI hints only; backend enforces |
| Media ownership | Storage + Backend metadata | Public URL | Upload/update through API |

## 6. Canonical contracts

### 6.1 Source of truth

Cross-application contracts live in `contracts/`. The current registry is `contracts/REGISTRY.md`; wire rules are `contracts/WIRE.md`; canonical fleet tiers are `contracts/enums/vehicle-tiers.ts`.

Generated or mirrored copies must be produced by the contract sync process, not hand-edited independently:

```text
contracts/enums/vehicle-tiers.ts
  -> backend/src/contracts/vehicle-tiers.ts
  -> admin/src/contracts/vehicle-tiers.ts
  -> react/src/contracts/vehicle-tiers.ts
```

### 6.2 Naming and units

Target wire contract:

- Database: `snake_case`.
- API wire: `camelCase`.
- Customer/Admin TypeScript: `camelCase`.
- Deliberate compressed manifests are versioned separately.
- Database money: integer paise/minor units.
- API/customer display and pricing engine: rupees as numbers.
- Conversion occurs once at the payment boundary.

The current catalog Admin handlers contain snake_case payload construction while the frozen wire document requires camelCase. This is a documented migration boundary, not permission to invent a third format. Each feature must either use the canonical wire adapter or explicitly document a temporary compatibility adapter with tests.

### 6.3 Response envelope

Success:

```json
{ "success": true, "data": {}, "requestId": "req_..." }
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable summary",
    "fields": { "fieldName": "Reason" },
    "requestId": "req_..."
  }
}
```

No module may introduce a third response shape.

## 7. Catalogue model and public projection

Every catalogue entity has two representations:

### Private business record

Contains database ID, editing fields, workflow status, audit metadata, and internal fields.

### Public projection

Contains only fields needed by Customer pages, search, SEO, and booking handoff:

```ts
interface PublicEntityBase {
  id: string;
  slug: string;
  entityType: "route" | "tourPackage" | "localTour" | "transferRoute" | "monument";
  status: "published";
  isActive: boolean;
  sourceVersion: number;
  updatedAt: string;
}
```

Public projection rules:

- Only explicitly published and active records.
- Exactly one item per UUID and public slug.
- Canonical fleet keys only.
- Required prices present.
- No draft/archived records.
- `releaseId` and `manifestVersion` shared by all sections.

Preferred target release shape:

```ts
interface PublicCatalogRelease {
  releaseId: string;
  manifestVersion: number;
  generatedAt: string;
  entities: {
    routes: PublicRoute[];
    tourPackages: PublicTourPackage[];
    localTours: PublicLocalTour[];
    transferRoutes: PublicTransferRoute[];
    monuments: PublicMonument[];
  };
}
```

Separate URLs/files may remain as compatibility surfaces, but they must be derived from one atomic release version and must not represent unrelated database moments.

## 8. Feature data flow

### Create/update

```text
Admin form state
  -> explicit payload builder
  -> API request with requestId/correlationId
  -> Backend schema parse
  -> domain rules
  -> transaction
  -> database row + audit event
  -> response with persisted DTO
```

### Publish

```text
Admin publish command
  -> authorization
  -> status transition transaction
  -> revision/sourceVersion
  -> durable publication event
  -> release builder
  -> full release validation
  -> build/prerender
  -> deployed release verification
  -> Admin status update
```

### Customer open

```text
search index/release
  -> stable slug
  -> entity resolver
  -> correct template
  -> pre-rendered HTML
  -> interactive booking intent
```

### Booking handoff

```text
Customer sends entity ID + slug + sourceVersion + selection
  -> Backend re-reads authoritative entity
  -> Backend validates status/availability
  -> Backend calculates quote
  -> booking snapshot stores authoritative values
  -> payment workflow begins
```

## 9. Repository map

```text
contracts/       shared contract sources, registry, sync script
backend/src/     Fastify API and domain modules
backend/tests/   unit, integration, contract, e2e tests
admin/src/       Admin pages, API client, auth, types
react/src/       Customer pages, resolvers, templates, services
react/scripts/   manifest build, prerender, sitemap, SEO checks
docs/project/    canonical product/architecture/rules/phases/design docs
docs/            operational, audit, payment, and historical references
```

Important current customer entry points:

- `react/src/app/ServerApp.tsx` — server-side page resolution.
- `react/src/services/catalog.ts` and `catalogManifest.ts` — catalog reads.
- `react/scripts/build-manifest.ts` — build input generation.
- `react/scripts/prerender.ts` — static page generation.
- `react/scripts/generate-sitemap.ts` — sitemap generation.

Important current Admin entry points:

- `admin/src/lib/api.ts` — API access.
- `admin/src/lib/auth.ts` — session/auth state.
- `admin/src/pages/TourPackagesPage.tsx` — package lifecycle UI.
- `admin/src/pages/LocalTransfersPage.tsx` — local/transfer lifecycle UI.
- `admin/src/components/admin/RouteCatalogPanel.tsx` — route management UI.

## 10. Publishing and SSG policy

SSG is a performance and SEO projection, not the database. The build must consume verified published data and produce immutable HTML/assets. It must fail when a required source is missing, malformed, inconsistent, duplicated, or stale.

A deploy hook only starts a build. It does not prove:

- the database transaction succeeded;
- the build read the intended environment;
- the release contained the record;
- the page was generated;
- the deployment became live.

Those are separate release states and must be recorded separately.

## 11. Database and migration policy

- PostgreSQL/Supabase PostgreSQL is the business-state authority.
- Migrations are append-only and expand-and-contract.
- Add constraints for unique public codes/slugs.
- Use transactions for status/content changes plus audit/publication events.
- Do not delete or rename old columns until all consumers and migration reports are complete.
- Data compatibility mapping belongs at a boundary and must not emit legacy values into new records.

## 12. Security boundaries

- Backend validates every request, including direct calls that bypass Admin.
- Missing/invalid authentication returns 401; insufficient role returns 403.
- Webhook signatures are verified on the raw body before writes.
- Customer bundles contain only public configuration.
- Service keys, payment secrets, database URLs, and deploy-hook secrets stay server-side.
- Sensitive operations produce audit records.
