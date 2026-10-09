# Monuments Contract Specification

## 1. Endpoints

### Public Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/monuments` | List all monuments |

### Admin Operations Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ops/admin/monuments` | List all monuments |
| `PATCH` | `/api/v1/ops/admin/monuments/:id` | Update monument details, hours, ticket prices |
