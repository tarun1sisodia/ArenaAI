# Local Tours Contract Specification

## 1. Endpoints

### Public Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/local-tours` | List published local tour packages |
| `GET` | `/api/v1/local-tours/by-code/:code` | Get package details by code |

### Admin Operations Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ops/admin/local-tours` | List all local packages |
| `POST` | `/api/v1/ops/admin/local-packages` | Create package |
| `PATCH` | `/api/v1/ops/admin/local-packages/:id` | Update package |
| `POST` | `/api/v1/ops/admin/local-packages/:id/publish` | Publish package |
| `POST` | `/api/v1/ops/admin/local-packages/:id/archive` | Archive package |

## 2. Canonical Slabs
```typescript
type LocalPackageKey = "8hr-80km" | "12hr-120km";
```
