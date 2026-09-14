# Production deployment

ArenaAI is maintained as one repository with three independently deployable applications. The applications are intentionally kept in separate directories so each hosting provider can use a different root directory and build command without coupling release cycles.

| Application | Repository root | Production host | Domain | Build command | Output |
|---|---|---|---|---|---|
| Customer site | `react/` | Cloudflare Pages | `skbagheltravels.in` | `npm ci && npm run build` | `react/dist` / `dist` when root is `react` |
| Admin panel | `admin/` | Cloudflare Pages | `admin.skbagheltravels.in` | `npm ci && npm run build` | `admin/dist` / `dist` when root is `admin` |
| Backend API | `backend/` | Render Docker service or VPS Docker + Cloudflare Tunnel | `api.skbagheltravels.in` | Dockerfile | Node service on port `4000` |

## Branches and promotion

`design/homepage` is the integration branch for the current combined implementation. `main` is the production branch. Changes should be developed in focused branches, merged into `design/homepage`, verified using the root commands, and then promoted to `main` through the normal pull-request review process. No application should be copied into a second repository or deployed from a generated artifact committed to Git.

The repository currently contains the merged backend architecture implementation on `design/homepage`, including the React customer site, admin panel, and Node.js API. The root scripts are the stable interface for CI and local verification:

```bash
npm run customer:typecheck
npm run admin:typecheck
npm run backend:typecheck
npm test
npm run build:all
```

`npm test` runs the deterministic backend suite. The two external database
connectivity checks are intentionally excluded from CI because they require
live `DATABASE_URL` and `MONGODB_URI` credentials; run `npm run backend:test`
when those credentials are available in `backend/.env`.

## Cloudflare Pages

Create two Pages projects connected to the same repository and branch. Set the **Root directory** independently:

- Customer project: `/react`, project name `skbagheltravels-customer`, custom domain `skbagheltravels.in`.
- Admin project: `/admin`, project name `skbagheltravels-admin`, custom domain `admin.skbagheltravels.in`.

When a Pages project root is set to the application directory, use `npm ci && npm run build` and `dist` as the output directory. The checked-in `react/cloudflare-pages.toml` and `admin/cloudflare-pages.toml` files document those settings. Set `VITE_API_BASE_URL=https://api.skbagheltravels.in` as a Pages environment variable for each project. Do not put private API, payment, database, or provider credentials in Pages variables.

For manual deployment from the repository root:

```bash
npm run deploy:customer
npm run deploy:admin
```

The customer and admin SPAs need a fallback rewrite to `index.html` in their Pages project settings so deep links remain routable. The application-owned `wrangler.jsonc` files can also be used for Wrangler asset deployments.

## Backend on Render

`render.yaml` is the Render Blueprint for the API. It uses `backend/Dockerfile`, exposes port `4000`, and checks `GET /health`. Connect the repository to Render and create the service from the blueprint. Add every `sync: false` secret in the Render dashboard. Keep `ALLOW_TEST_AUTH=false` in production and use PostgreSQL/Supabase as the system of record.

The API service must allow CORS from both the apex and `www` customer domains and the admin domain. After deployment, verify:

```bash
curl -fsS https://api.skbagheltravels.in/health
curl -fsS https://api.skbagheltravels.in/ready
```

If the final hosting decision is a VPS instead of Render, use the same `backend/Dockerfile` and `backend/docker-compose.yml` as the container contract. Put Cloudflare Tunnel in front of the container and route `api.skbagheltravels.in` to the local API port. Render and VPS are alternatives; do not run two production API instances against the same write path without an explicit migration and traffic plan.

## Vercel configuration

`vercel.json` is a frontend fallback configuration for preview deployments from the monorepo. It builds the customer app by default and publishes `react/dist`. Cloudflare Pages remains the production frontend host. To preview the admin app on Vercel, change the Vercel project Root Directory to `admin` and set the build command to `npm ci && npm run build` with output directory `dist`; do not use the root `vercel.json` for that project.

Vercel is not the backend production target in this setup because the API is a long-running Fastify service with Docker and a health endpoint. Use Render or the VPS deployment path for the API.

## Domain and release order

Deploy the API first, then set the frontend environment variables to its stable hostname, then deploy customer and admin Pages projects. Configure DNS only after the target deployment is healthy:

1. `api.skbagheltravels.in` → Render service or Cloudflare Tunnel.
2. `skbagheltravels.in` and `www.skbagheltravels.in` → customer Pages project.
3. `admin.skbagheltravels.in` → admin Pages project.

The API must remain the authority for fare calculations, booking state, payments, and admin permissions. Frontend builds are static clients and must never contain database, payment, webhook, or service-role secrets.
