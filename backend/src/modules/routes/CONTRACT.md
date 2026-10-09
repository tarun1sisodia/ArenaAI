# Routes Module Contract Specification

## 1. Canonical Endpoints

### Public Endpoints
| Method | Path | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/routes` | Published routes manifest | 120 / min |
| `GET` | `/api/v1/routes/manifest` | Published routes manifest alias | 120 / min |
| `GET` | `/api/v1/routes/by-slug/:slug` | Get published route by slug | 120 / min |
| `GET` | `/api/v1/routes/fleets` | Vehicle fleet reference specifications | 120 / min |

### Admin Operations Endpoints
| Method | Path | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ops/admin/routes` | List all routes with filters | `admin` / `content` |
| `GET` | `/api/v1/ops/admin/routes/:id` | Get route details by UUID | `admin` / `content` |
| `POST` | `/api/v1/ops/admin/routes` | Create route (draft) | `admin` / `content` |
| `PATCH` | `/api/v1/ops/admin/routes/:id` | Update route | `admin` / `content` |
| `POST` | `/api/v1/ops/admin/routes/:id/publish` | Publish route | `super_admin` |
| `POST` | `/api/v1/ops/admin/routes/:id/archive` | Archive route | `super_admin` |
| `DELETE` | `/api/v1/ops/admin/routes/:id` | Delete draft/archived route | `admin` / `content` |
| `GET` | `/api/v1/ops/admin/routes/slug-check` | Check slug availability | `admin` / `content` |
| `POST` | `/api/v1/ops/admin/routes/suggest-fares` | Calculate suggested fares | `admin` / `content` |

## 2. Request / Response Contracts

### CreateRouteInput
```typescript
interface CreateRouteInput {
  trip_type: "one-way" | "round-trip";
  source_city: string;
  source_detail?: string;
  destination_city: string;
  slug: string;
  distance_km?: number;
  duration_text?: string;
  available_fleets: VehicleTier[];
  fares_inr: Record<VehicleTier, number>;
  driver_charge_inr?: number;
  night_halt_inr?: number;
  toll_included?: boolean;
  toll_amount_inr?: number;
  interstate_charges?: Array<{ state: string; amount_inr: number; note?: string }>;
  min_km_per_day?: number;
  stops?: Array<{ name: string; halt_mins?: number }>;
  use_per_km?: boolean;
  per_km_rate_override?: number | null;
  highway?: string;
  all_inclusive_note?: string;
  status?: "draft" | "published" | "archived";
  needs_review?: boolean;
}
```

## 3. Lifecycle State Machine
```
[draft] ──(publish)──► [published] ──(archive)──► [archived]
   ▲                       │
   └──────(unpublish)──────┘
```
