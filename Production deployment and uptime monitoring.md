# Production deployment and uptime monitoring

ArenaAI is a single repository with three independently deployable applications. Each provider watches the same GitHub repository but builds from a different application directory.

| Application | Root directory | Production platform | Domain | Build command | Output |
|---|---|---|---|---|---|
| Customer site | `react/` | Cloudflare Pages | `skbagheltravels.in` | `npm ci && npm run build` | `dist` |
| Admin panel | `admin/` | Cloudflare Pages | `admin.skbagheltravels.in` | `npm ci && npm run build` | `dist` |
| Backend API | `backend/` | Render Docker service | `api.skbagheltravels.in` | Dockerfile | Port `4000` |

`main` is the production branch. `design/homepage` is the integration branch. The normal release path is: feature branch → pull request into `design/homepage` → validation → pull request into `main` → provider auto-deploy from `main`.

## 1. Prepare the GitHub repository

1. Confirm the deployment commit is pushed to `design/homepage`.
2. In GitHub, open **Settings → Branches** and protect `main`. Require pull-request review and passing checks before merging.
3. Create a pull request from `design/homepage` to `main` after the first deployment configuration review.
4. The provider configurations below can initially deploy from `design/homepage` for staging. Change each provider to `main` for production.

Run the local release gate from the repository root:

```bash
npm ci
npm run customer:typecheck
npm run admin:typecheck
npm run backend:typecheck
npm test
npm run build:all
npm run healthcheck
```

`npm test` runs 38 deterministic backend tests. The external PostgreSQL and MongoDB connectivity checks are intentionally excluded because they require live `DATABASE_URL` and `MONGODB_URI`; run `npm run backend:test` when those credentials are available in `backend/.env`.

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

### Add the API custom domain

1. In Render, open the service's **Settings → Custom Domains → Add Custom Domain**.
2. Enter `api.skbagheltravels.in` and copy the DNS target Render gives you.
3. In Cloudflare DNS, create the requested CNAME record. Start with the proxy disabled if Render's domain verification requires direct DNS; enable the orange-cloud proxy only after TLS and routing are confirmed.
4. Wait for Render TLS issuance and verify:

```bash
curl -fsS https://api.skbagheltravels.in/health
curl -fsS https://api.skbagheltravels.in/ready
```

The API must allow CORS from `https://skbagheltravels.in`, `https://www.skbagheltravels.in`, and `https://admin.skbagheltravels.in`.

### Render free-tier wake-up limitation

The monitor below sends a request every five minutes, which reduces idle sleep when the platform honors the requests. It is **not a guarantee** that a Render free service stays awake: scheduled GitHub Actions can be delayed, Render can suspend services, and free-tier policies can change. For guaranteed always-on behavior, use a paid Render instance or deploy the same Docker image to the planned VPS behind Cloudflare Tunnel.

## 3. Publish the customer site on Cloudflare Pages

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com) and choose **Workers & Pages → Create application → Pages → Connect to Git**.
2. Select `tarun1sisodia/ArenaAI`.
3. **Project name:** `skbagheltravels-customer` — ⚠️ the dashboard may pre-fill `arenaai` from the repo name; clear it and enter the correct name.
4. Set **Production branch** to `main`.
5. Set **Root directory** to `/react`.
6. Set **Build command** to `npm ci && npm run build`.
7. Set **Build output directory** to `dist`.
8. Set **Deploy command** to:
   ```
   npx wrangler pages deploy dist --project-name skbagheltravels-customer
   ```
   For a Git-connected project Cloudflare runs this automatically after the build step; you do not need to run it manually on every push.
9. Add the production variable `VITE_API_BASE_URL=https://api.skbagheltravels.in` under **Settings → Environment variables → Production**.
10. Deploy. Cloudflare Pages should show the generated site preview URL.
11. Add `skbagheltravels.in` and `www.skbagheltravels.in` under **Custom domains**. Cloudflare will create or request the required DNS records.
12. Confirm the site loads at `https://skbagheltravels.in/`, the Hindi routes load, and the booking flow can reach the API.

The same settings are recorded in [`react/cloudflare-pages.toml`](../react/cloudflare-pages.toml). For a one-off manual deployment from a machine with Wrangler authenticated:

```bash
npm run deploy:customer
```

SPA deep-link routing (`react/wrangler.jsonc` → `not_found_handling: "404-page"`) and the `_redirects` fallback are already configured — no additional dashboard setting is required.

## 4. Publish the admin panel on Cloudflare Pages

1. In Cloudflare Pages, create a second Git-connected project named `skbagheltravels-admin`.
2. Select the same repository and set **Production branch** to `main`.
3. Set **Root directory** to `/admin`.
4. Set **Build command** to `npm ci && npm run build`.
5. Set **Build output directory** to `dist`.
6. Set **Deploy command** to:
   ```
   npx wrangler pages deploy dist --project-name skbagheltravels-admin
   ```
   For a Git-connected project Cloudflare runs this automatically after the build step.
7. Add `VITE_API_BASE_URL=https://api.skbagheltravels.in` under the production environment variables.
8. Deploy and open the generated Pages URL.
9. Add the custom domain `admin.skbagheltravels.in` under **Custom domains**.
10. Confirm the admin login route, deep links such as `/bookings`, and API requests work over HTTPS.

The same settings are recorded in [`admin/cloudflare-pages.toml`](../admin/cloudflare-pages.toml). For a one-off manual deployment:

```bash
npm run deploy:admin
```

SPA deep-link routing is already handled by `admin/public/_redirects` (for Git-connected Pages) and `admin/wrangler.jsonc` → `not_found_handling: "single-page-application"` (for Wrangler direct deploys). No additional dashboard fallback setting is needed.

The current admin login is a frontend demonstration flow. Before production use, connect it to the backend's real authentication and RBAC endpoints and remove any test-auth behavior from the production environment.

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

The API is the authority for fares, booking state, payments, and admin permissions. Never put database, payment, webhook, or service-role secrets in Cloudflare or Vite variables.

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

Available options are `HEALTHCHECK_TIMEOUT_MS`, `HEALTHCHECK_ATTEMPTS`, `HEALTHCHECK_URLS`, and `HEALTHCHECK_EXPECTED_STATUS`. The check is intentionally read-only; it does not create bookings, send payments, mutate data, or restart services.

## 7. Vercel preview configuration

[`vercel.json`](../vercel.json) is only a frontend preview fallback. It builds the customer application and publishes `react/dist`. Cloudflare Pages remains the production frontend host. Vercel is not the backend target because the API is a long-running Fastify Docker service.

To preview the admin application on Vercel, set the Vercel project's root directory to `admin`, build command to `npm ci && npm run build`, and output directory to `dist`.
