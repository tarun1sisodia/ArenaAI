# Tour Packages Contract Specification

## 1. Endpoints

### Public Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tour-packages` | List all published tour packages |
| `GET` | `/api/v1/tour-packages/:id` | Get published tour package by UUID or slug |

### Admin Operations Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ops/admin/tour-packages` | List all packages with filters |
| `POST` | `/api/v1/ops/admin/tour-packages` | Create new tour package (draft) |
| `PATCH` | `/api/v1/ops/admin/tour-packages/:id` | Update tour package |
| `POST` | `/api/v1/ops/admin/tour-packages/:id/publish` | Publish package |
| `POST` | `/api/v1/ops/admin/tour-packages/:id/archive` | Archive package |
| `DELETE` | `/api/v1/ops/admin/tour-packages/:id` | Delete draft/archived package |

## 2. Pricing Contract
Fixed pricing per vehicle tier:
```typescript
interface TourPackageFleetPrices {
  sedan: number;
  ertiga: number;
  "innova-crysta": number;
  "tempo-traveller": number;
  urbania: number;
}
```
Advance deposit required: Exactly 28% of total package fare.
