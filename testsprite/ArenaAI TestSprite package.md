# ArenaAI TestSprite package

This directory contains TestSprite-readable context and manual test cases for the three ArenaAI applications:

- `customer/` — React customer site on port `5173`.
- `admin/` — React admin panel on port `5174`.
- `backend/` — Fastify API on port `4000`.

TestSprite's documented workflow is spec-driven. Upload `standard_prd.json` first, provide the relevant live URL or local port, upload the relevant API contract/context files, generate the code summary and test plan, then append the manual cases in this directory before generating executable tests.

## Recommended local setup

From the repository root, install dependencies and start each application in separate terminals:

```bash
npm ci
npm ci --prefix react
npm ci --prefix admin
npm ci --prefix backend

# Terminal 1
npm run customer:dev       # http://localhost:5173

# Terminal 2
npm run admin:dev          # http://localhost:5174

# Terminal 3
npm run backend:dev        # http://localhost:4000
```

For the customer app, set `VITE_REACT_MIGRATION_ENABLED=true` when the React migration experience is the intended target. The existing React app currently has a migration shell and phased content, so TestSprite should test the deployed/selected build, not assume that every legacy static route is implemented by React.

For the backend, copy `backend/.env.example` to `backend/.env`. Local development can use the in-memory repository when `DATABASE_URL` is empty. Do not upload real secrets or production credentials to TestSprite. Use isolated test credentials and a disposable database for destructive API cases.

## TestSprite MCP sequence

Run the workflow separately for each app because TestSprite's bootstrap accepts one project type, project path, and port at a time.

### Customer frontend

```text
Project path: /absolute/path/to/ArenaAI/react
Type: frontend
Port: 5173
Scope: codebase
Login required: false
PRD: /absolute/path/to/ArenaAI/testsprite/standard_prd.json
Manual plan: /absolute/path/to/ArenaAI/testsprite/customer/frontend_test_plan.json
```

Use the customer app's local URL or the production URL `https://skbagheltravels.in` depending on the environment under test.

### Admin frontend

```text
Project path: /absolute/path/to/ArenaAI/admin
Type: frontend
Port: 5174
Scope: codebase
Login required: true for protected/role tests
PRD: /absolute/path/to/ArenaAI/testsprite/standard_prd.json
Manual plan: /absolute/path/to/ArenaAI/testsprite/admin_frontend_test_plan.json
```

The current admin UI has a demo role selector and stores a session in `localStorage`. Treat this as a test-only login mechanism until real backend authentication is connected. Use one isolated browser context per role and clear `localStorage` between role cases.

### Backend API

```text
Project path: /absolute/path/to/ArenaAI/backend
Type: backend
Port: 4000
Scope: codebase
PRD: /absolute/path/to/ArenaAI/testsprite/standard_prd.json
API context: /absolute/path/to/ArenaAI/testsprite/backend/api_context.md
Manual plan: /absolute/path/to/ArenaAI/testsprite/backend/backend_test_plan.json
Data: /absolute/path/to/ArenaAI/testsprite/backend/test_data.json
```

If the TestSprite portal accepts OpenAPI, use the checked-in API context as free-form API documentation. The route schemas in `backend/src/modules/**` remain authoritative for exact validation.

## Execution order

1. Run health checks for the selected local services.
2. Generate TestSprite code summary for the selected project path.
3. Generate the standardized PRD or upload `standard_prd.json`.
4. Generate the relevant frontend or backend plan.
5. Append/merge the matching manual plan cases, preserving TestSprite's existing JSON shape and IDs.
6. Review high-priority cases and remove tests that would mutate production data.
7. Generate and execute tests.
8. Save TestSprite reports outside source code unless the team explicitly wants them committed.
9. Re-run failed cases after fixing code, using the same test IDs.

## Environment safety

- Never run refund, payment, webhook, delete, archive, or publish tests against production.
- Use mock payment providers and a disposable database for write tests.
- Use `ALLOW_TEST_AUTH=true` only in local/test environments.
- API test cases should assert the response envelope, status code, validation error code, request ID, and absence of secret leakage.
- A passing page load is not enough: TestSprite should inspect console errors, failed network requests, keyboard navigation, mobile widths, and deep-link refreshes.
- The uptime check in `scripts/healthcheck.mjs` is not a substitute for this functional suite.
