# TestSprite artifact map

| File | Purpose | TestSprite use |
|---|---|---|
| `standard_prd.json` | Normalized product overview, goals, feature map, user flows, and acceptance criteria shared by all three apps. | Upload as the PRD/spec foundation before plan generation. |
| `code_summary.json` | Human-maintained architecture map of app roots, ports, entry points, features, and source files. | Use as context alongside TestSprite's generated code summary; do not overwrite generated output unless deliberately refreshing it. |
| `README.md` | Setup commands, ports, credentials safety, and the end-to-end TestSprite MCP sequence. | Use as the runbook for engineers and QA. |
| `customer/frontend_test_plan.json` | Customer UI scenarios for navigation, bilingual behavior, fares, five-step booking, forms, routing, responsive behavior, accessibility, and frontend security. | Merge/add cases to the customer frontend plan after generation. |
| `admin_frontend_test_plan.json` | Admin UI scenarios for login/session, roles, protected operations, tables, refunds, moderation, responsive behavior, and secret scanning. | Merge/add cases to the admin frontend plan after generation. |
| `backend/api_context.md` | Human-readable API surface, schemas, response conventions, auth, security, and safe test boundaries. | Upload as API documentation/free-form context for backend planning. |
| `backend/backend_test_plan.json` | API scenarios for all major route families, validation, auth, payments, webhooks, rate limits, data integrity, and concurrency. | Merge/add cases to the backend plan after generation. |
| `backend/test_data.json` | Synthetic data and negative-value fixture catalog. Runtime dates must be generated dynamically. | Use as test data context; never replace with production secrets or customer records. |

## Important distinction

TestSprite may generate its own `code_summary.json`, `standard_prd.json`, and frontend/backend plan files at the project root or in its configured output directory. These checked-in files are curated ArenaAI inputs. If TestSprite produces generated files with the same names, preserve the generated run artifacts separately and use the curated files as uploaded context/manual cases. Never commit a report containing credentials, production tokens, customer PII, payment payloads, or screenshots with sensitive data.
