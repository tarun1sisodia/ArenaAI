# Production deployment and uptime monitoring

ArenaAI is a single repository with three independently deployable applications. Each provider watches the same GitHub repository but builds from a different application directory.

| Application | Root directory | Production platform | Domain | Build command | Output |
|---|---|---|---|---|---|
| Customer site | `react/` | Cloudflare Pages | `skbagheltravels.in` | `npm ci && npm run build` | `dist` |
| Admin panel | `admin/` | Cloudflare Pages | `admin.skbagheltravels.in` | `npm ci && npm run build` | `dist` |
| Backend API | `backend/` | Render Docker service (or VPS Docker + Cloudflare Tunnel) | `api.skbagheltravels.in` | Dockerfile | Port `4000` |

`main` is the production branch. `design/homepage` is the integration branch. The normal release path is: feature branch → pull request into `design/homepage` → validation → pull request into `main` → provider auto-deploy from `main`. No application may be copied into a second repository, and nothing may be deployed from a generated artifact committed to Git.

## The local verification contract

Every host runs the same command contract as CI, so a green workflow and a green local run mean the same thing. Bootstrap once, then verify:

```bash
npm run install:all    # npm ci for the root, react/, admin/ and backend/
npm run verify         # typecheck (x3) + backend tests + production build (x3)
```

The individual gates, including the uptime check, can be run in isolation:

```bash
npm run customer:typecheck
npm run admin:typecheck
npm run backend:typecheck
npm test
npm run build:all
npm run healthcheck
```

`npm test` runs 38 deterministic backend tests. The external PostgreSQL and MongoDB connectivity checks are intentionally excluded because they require live `DATABASE_URL` and `MONGODB_URI`; run `npm run backend:test` when those credentials are available in `backend/.env`.

Build output is confined to `react/dist`, `admin/dist` and `backend/dist`. The only tracked file a build rewrites is `react/public/sitemap.xml` (the versioned mirror of the generated sitemap); nothing is written to the repository root, and `react/scripts/generate-sitemap.ts` must never be pointed back at the monorepo root.

## Continuous integration

CI uses **three path-scoped workflows** so only the affected app rebuilds on each push:

| Workflow | File | Triggers when… |
|---|---|---|
| Customer Site | `.github/workflows/ci-customer.yml` | `react/**`, root `package.json` |
| Admin Panel | `.github/workflows/ci-admin.yml` | `admin/**`, root `package.json` |
| Backend API | `.github/workflows/ci-backend.yml` | `backend/**`, `render.yaml` |
| Monorepo Root | `.github/workflows/quality.yml` | `scripts/**`, root `package.json`, workflow files |

All four run on pushes to `main`, `design/**`, `arena/**`, `feat/**`, `fix/**` and on PRs into `main`, filtered to their respective paths.

Each app workflow runs:
1. `npm ci` — lockfile-enforced install.
2. TypeScript typecheck.
3. Production build.
4. Deploy guards:
   - expected artifacts exist (`react/dist/index.html`, `admin/dist/index.html`, `backend/dist/server.js`);
   - no server-side secret names (`DATABASE_URL`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, …) appear in `react/dist` or `admin/dist`;
   - no file exceeds Cloudflare's 25 MiB per-asset limit;
   - `admin/dist/_redirects` and `admin/dist/200.html` shipped, with `not_found_handling: "single-page-application"` active in `admin/wrangler.jsonc`, so admin deep links cannot regress into 404s.

## Cloudflare Pages project names

The authoritative project names are:

- customer → `skbagheltravels-customer`
- admin → `skbagheltravels-admin`

They appear in four places and must agree everywhere: `--project-name` in `npm run deploy:customer` / `npm run deploy:admin` (root `package.json`), and the `name` field in the root `wrangler.jsonc`, `react/wrangler.jsonc` and `admin/wrangler.jsonc`. A mismatch silently creates a second project instead of updating the live one, so change all of them together or not at all.

If an earlier project already exists under a legacy name (`arenaai`, `skb-admin`, or a Cloudflare *Workers* service wired to this repository), create the project under the standardized name in the dashboard, attach the custom domain to it, verify the deployment, then delete or keep the old one as a rollback target. Do not point DNS at a project whose name disagrees with these files.

## 1. Prepare the GitHub repository

1. Confirm the deployment commit is pushed to `design/homepage`.
2. In GitHub, open **Settings → Branches** and protect `main`. Require pull-request review and passing checks before merging.
3. Create a pull request from `design/homepage` to `main` after the first deployment configuration review.
4. The provider configurations below can initially deploy from `design/homepage` for staging. Change each provider to `main` for production.

## 2. Deploy the backend API on Render

The checked-in [`render.yaml`](../render.yaml) is the source of truth for the Render service. It uses [`backend/Dockerfile`](../backend/Dockerfile), listens on port `4000`, and checks `/health`.

### Create the Render service

1. Sign in to [Render](https://render.com) and choose **New → Blueprint**.
2. Connect the GitHub account and select `tarun1sisodia/ArenaAI`.
3. Select the `main` branch for production.
4. Render detects `render.yaml`; review the service named `skb-baghel-api`.
5. Create the Blueprint. Render builds the Docker image from `backend/Dockerfile` and starts `node dist/server.js`.
6. In the service settings, confirm the health check path is `/health` and the exposed application port is `4000`.
7. Add every `sync: false` variable from `render.yaml` in Render's **Environment** page. At minimum, production needs `DATABASE_URL`, `API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS`, and the provider credentials used by the enabled payment/notification features.
8. Keep `NODE_ENV=production` and `ALLOW_TEST_AUTH=false`. Never upload `.env` to GitHub.
9. Deploy and wait until Render reports the service as **Live**.
10. Test the Render URL before adding the custom domain:

```bash
curl -fsS https://<render-service>.onrender.com/health
curl -fsS https://<render-service>.onrender.com/ready
```

`/health` is liveness (200 while the process runs). `/ready` reports the active store — a `"store": "memory"` response means `DATABASE_URL` is not wired, which must be treated as a failed deploy.

The image is multi-stage: full dependencies build `dist`, a separate stage installs production-only dependencies, and the runtime stage runs as the non-root `skb` user with devDependencies (TypeScript, Vitest, ESLint, tsx) absent. [`backend/.dockerignore`](../backend/.dockerignore) keeps `.env` files, `node_modules`, `dist`, tests and docs out of the build context.

### Add the API custom domain

1. In Render, open the service's **Settings → Custom Domains → Add Custom Domain**.
2. Enter `api.skbagheltravels.in` and copy the DNS target Render gives you.
3. In Cloudflare DNS, create the requested CNAME record. Start with the proxy disabled if Render's domain verification requires direct DNS; enable the orange-cloud proxy only after TLS and routing are confirmed.
4. Wait for Render TLS issuance and verify:

```bash
curl -fsS https://api.skbagheltravels.in/health
curl -fsS https://api.skbagheltravels.in/ready
```

The API must allow CORS from `https://skbagheltravels.in`, `https://www.skbagheltravels.in`, and `https://admin.skbagheltravels.in` (`CORS_ORIGINS`).

### Render free-tier wake-up limitation

The monitor below sends a request every five minutes, which reduces idle sleep when the platform honors the requests. It is **not a guarantee** that a Render free service stays awake: scheduled GitHub Actions can be delayed, Render can suspend services, and free-tier policies can change. For guaranteed always-on behavior, use a paid Render instance or deploy the same Docker image to the planned VPS behind Cloudflare Tunnel.

If the final hosting decision is a VPS instead of Render, use the same `backend/Dockerfile` and `backend/docker-compose.yml` as the container contract. Render and VPS are alternatives; do not run two production API instances against the same write path without an explicit migration and traffic plan.

## 3. Publish the customer site on Cloudflare Pages

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com) and choose **Workers & Pages → Create application → Pages → Connect to Git**.
2. Select `tarun1sisodia/ArenaAI`.
3. Create the project with the name `skbagheltravels-customer`.
4. Set **Production branch** to `main`.
5. Set **Root directory** to `/react`.
6. Set **Build command** to `npm ci && npm run build`.
7. Set **Build output directory** to `dist`.
8. Add the production variable `VITE_API_BASE_URL=https://api.skbagheltravels.in` under **Settings → Environment variables → Production**.
9. Under **Settings → Build & deployments → Ignored build command**, enter:
   ```
   git diff --quiet HEAD^ HEAD -- react/
   ```
   Cloudflare will skip the build entirely when no `react/` files changed (exit 0 = skip, exit 1 = build).
10. Deploy. Cloudflare Pages should show the generated site preview URL.
10. Add `skbagheltravels.in` and `www.skbagheltravels.in` under **Custom domains**. Cloudflare will create or request the required DNS records.
11. Confirm the site loads at `https://skbagheltravels.in/`, the Hindi routes load, and `/en/404/` returns the styled 404.

The same settings are recorded in [`react/cloudflare-pages.toml`](../react/cloudflare-pages.toml). For a manual deployment from a machine with Wrangler authentication:

```bash
npm run deploy:customer
```

### Routing rule for this app

The customer site is **pre-rendered** by `react/scripts/prerender.ts`: every marketing URL is real HTML **plus a real `404.html`**, and it deploys with `not_found_handling: "404-page"` (root `wrangler.jsonc`, `react/wrangler.jsonc`). Do **not** add a catch-all rewrite to `index.html` here — it would turn genuine 404s into 200s and break crawler semantics.

## 4. Publish the admin panel on Cloudflare Pages

1. In Cloudflare Pages, create a second Git-connected project named `skbagheltravels-admin`.
2. Select the same repository and set **Production branch** to `main`.
3. Set **Root directory** to `/admin`.
4. Set **Build command** to `npm ci && npm run build`.
5. Set **Build output directory** to `dist`.
6. Add `VITE_API_BASE_URL=https://api.skbagheltravels.in` under the production environment variables.
7. Under **Settings → Build & deployments → Ignored build command**, enter:
   ```
   git diff --quiet HEAD^ HEAD -- admin/
   ```
   Cloudflare will skip the admin build when no `admin/` files changed.
8. Deploy and open the generated Pages URL.
8. Add the custom domain `admin.skbagheltravels.in` under **Custom domains**.
9. Confirm the login route, deep links such as `/bookings`, and API requests work over HTTPS.

The same settings are recorded in [`admin/cloudflare-pages.toml`](../admin/cloudflare-pages.toml). For manual deployment:

```bash
npm run deploy:admin
```

The current admin login is a frontend demonstration flow. Before production use, connect it to the backend's real authentication and RBAC endpoints and remove any test-auth behavior from the production environment.

### Routing rules for this app

The admin panel is a React Router SPA with a single `index.html`. It handles SPA routing natively via `not_found_handling: "single-page-application"` in `admin/wrangler.jsonc` and ships `admin/dist/200.html` for Cloudflare Pages fallback. `admin/public/_redirects` is maintained without the legacy `/* /index.html 200` rewrite rule, which Cloudflare's deployment validator rejects with an infinite loop error (`[code: 100324]`) under `html_handling`. `admin/public/_headers` also marks the panel `X-Robots-Tag: noindex, nofollow` and sends long-lived cache headers for hashed assets, and `admin/public/robots.txt` disallows crawling outright.

## 5. DNS and release order

Use this order to avoid deploying frontends that point at an unavailable API:

1. Deploy Render and verify `/health` and `/ready` on the Render hostname.
2. Add and verify `api.skbagheltravels.in`.
3. Set `VITE_API_BASE_URL` in both Pages projects.
4. Deploy the customer Pages project and add `skbagheltravels.in`.
5. Deploy the admin Pages project and add `admin.skbagheltravels.in`.
6. Run the complete public check:

```bash
HEALTHCHECK_URLS="https://api.skbagheltravels.in/health,https://skbagheltravels.in/,https://admin.skbagheltravels.in/" npm run healthcheck
```

The API is the authority for fares, booking state, payments, and admin permissions. Never put database, payment, webhook, or service-role secrets in Cloudflare or Vite variables — frontend builds are public static clients.

## 6. Automated uptime monitoring

[`scripts/healthcheck.mjs`](../scripts/healthcheck.mjs) performs dependency-free HTTP checks against the API health endpoint, customer site, and admin site. It retries each endpoint once by default, accepts normal redirects for static sites, prints a result for every URL, and exits with code `1` if any service fails.

The repository includes [`.github/workflows/uptime.yml`](../.github/workflows/uptime.yml), which runs every five minutes and can also be started manually from **GitHub → Actions → Production uptime → Run workflow**. GitHub Actions scheduled runs are best-effort and may be delayed. A failed check appears as a failed workflow run and can be connected to GitHub notifications or an external incident integration.

Run it locally:

```bash
npm run healthcheck
```

Override the targets for staging or a Render preview service:

```bash
HEALTHCHECK_URLS="https://my-api.onrender.com/health,https://staging.example.com/,https://staging-admin.example.com/" npm run healthcheck
```

Available options are `HEALTHCHECK_TIMEOUT_MS`, `HEALTHCHECK_ATTEMPTS`, `HEALTHCHECK_URLS`, and `HEALTHCHECK_EXPECTED_STATUS` (see [`.env.example`](../.env.example)). The check is intentionally read-only; it does not create bookings, send payments, mutate data, or restart services.

## 7. Vercel preview configuration

[`vercel.json`](../vercel.json) is only a frontend preview fallback. It builds the customer application and publishes `react/dist`. Cloudflare Pages remains the production frontend host. Vercel is not the backend target because the API is a long-running Fastify Docker service.

To preview the admin application on Vercel, set the Vercel project's root directory to `admin`, build command to `npm ci && npm run build`, and output directory to `dist`; do not use the root `vercel.json` for that project.

## 8. Rollback

Cloudflare Pages and Render keep previous deployments. To roll back, redeploy the last known-good artifact from the provider dashboard; never hand-edit a `dist/` tree. `backend/migrations/` is append-only — see [`backend/DATABASE_MIGRATION_ROLLBACK.md`](./backend/DATABASE_MIGRATION_ROLLBACK.md) for the database side of a rollback.
