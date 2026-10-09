# Transfers Contract Specification

## 1. Endpoints

### Public Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/transfers` | List published transfers |
| `GET` | `/api/v1/transfers/by-code/:code` | Get transfer details by route code |

### Admin Operations Endpoints
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/ops/admin/transfers` | List all transfer routes |
| `POST` | `/api/v1/ops/admin/transfer-routes` | Create transfer route |
| `PATCH` | `/api/v1/ops/admin/transfer-routes/:id` | Update transfer route |
| `POST` | `/api/v1/ops/admin/transfer-routes/:id/publish` | Publish transfer route |
| `POST` | `/api/v1/ops/admin/transfer-routes/:id/archive` | Archive transfer route |
