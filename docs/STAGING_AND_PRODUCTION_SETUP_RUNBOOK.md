# SK Baghel Tour & Travels — Master Staging & Production Deployment Runbook

> **Scope:** Full infrastructure guide covering local setup, staging deployment, and production rollout across **Supabase**, **Google Cloud Platform (GCP)**, **Render**, **Razorpay**, and **Cloudflare Pages / Workers**.

---

## 1. System Topology & Secret Isolation

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            CUSTOMER CLIENT / ADMIN DESK                          │
│                                 (Cloudflare Pages)                               │
│                                                                                  │
│   Public Env:                                                                    │
│   • VITE_API_BASE_URL (Points to Render backend)                                 │
│   • VITE_SUPABASE_URL (Supabase project URL)                                     │
│   • VITE_SUPABASE_ANON_KEY (Public publishable key)                              │
│   • Google Client ID (Inherited via Supabase PKCE OAuth)                         │
└──────────────────────────┬─────────────────────────────┬─────────────────────────┘
                           │                             │
       API Requests        │                             │  PKCE Google OAuth
   (Bearer JWT / Public)   │                             │  (Zero secrets in client)
                           ▼                             ▼
┌──────────────────────────────────────────┐    ┌──────────────────────────────────┐
│             FASTIFY BACKEND API          │    │             SUPABASE             │
│              (Render Docker)             │    │    (Auth + Database + Storage)   │
│                                          │    │                                  │
│ Private Secrets:                         │    │ Auth & Security:                 │
│ • DATABASE_URL (Session pooler + TLS)    │◄───┤ • auth.users (Google Identity)   │
│ • SUPABASE_SERVICE_ROLE_KEY              │    │ • PostgreSQL 17 (Schema & Data)  │
│ • SUPABASE_JWT_SECRET                    │    │ • Storage ('documents' bucket)   │
│ • RAZORPAY_KEY_ID & KEY_SECRET           │    │ • Google Client ID & Secret      │
│ • RAZORPAY_WEBHOOK_SECRET                │    └──────────────────────────────────┘
└────────────────────┬─────────────────────┘
                     │
                     │ Order Creation &
                     │ HMAC-Signed Webhooks
                     ▼
┌──────────────────────────────────────────┐
│                 RAZORPAY                 │
│   • Test Mode (Staging): rzp_test_...    │
│   • Live Mode (Production): rzp_live_... │
│   • Webhook: /api/v1/payments/webhooks/  │
│     razorpay                             │
└──────────────────────────────────────────┘
```

### Critical Security Invariants:
1. **Never commit secrets to Git:** `.env`, `.env.*` (except `.env.example`) are git-ignored.
2. **Never expose secrets to frontends:** Frontend bundles (`react/dist`, `admin/dist`) are public static assets. They must **never** contain `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, or `RAZORPAY_WEBHOOK_SECRET`.
3. **Google Secret isolation:** Google Client Secret lives **only** inside Supabase Auth settings. Neither the React app nor the Fastify backend needs the Google Client Secret.
4. **Server-authoritative calculations:** Prices, discounts, distances, and payment statuses are calculated and verified exclusively by the backend API.

---

## 2. Supabase Setup (Staging vs. Production)

Supabase serves as both the **PostgreSQL database** and the **authentication provider**.

### Step 2.1: Create Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) &rarr; **New project**.
2. **Project Name:**
   - Staging: `skb-staging` (Ref: `trcmufqbpcymipqpemoq`)
   - Production: `skb-production`
3. **Region:**
   - Recommended: `South Asia (Mumbai) - ap-south-1` for minimum latency to Indian travelers and administrators.
4. **Password:** Generate and securely save a strong database password.

### Step 2.2: Retrieve Connection String & Keys
Go to **Project Settings**:

1. **Database Connection String (`DATABASE_URL`)**:
   - Navigate to **Database &rarr; Connection string &rarr; URI**.
   - Select **Session Pooler** (Port `5432`).
   - Append `?sslmode=require&uselibpqcompat=true` to the URI:
     ```text
     postgresql://postgres.<project-ref>:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true
     ```
   > **Note on `uselibpqcompat=true`:** Modern `pg` drivers require this parameter to accept Supabase pooler TLS certificates without self-signed certificate chain errors.

2. **API Keys**:
   - Navigate to **API**:
     - **Project URL:** `https://<project-ref>.supabase.co` &rarr; `SUPABASE_URL`
     - **anon / public key:** &rarr; `SUPABASE_ANON_KEY`
     - **service_role key:** &rarr; `SUPABASE_SERVICE_ROLE_KEY` *(Confidential: Server-only)*
     - **JWT Secret:** &rarr; `SUPABASE_JWT_SECRET` *(Under JWT Settings)*

3. **Storage Bucket**:
   - Go to **Storage &rarr; New Bucket**.
   - Bucket Name: `documents` (Matches `CATALOG_MEDIA_BUCKET=documents`).
   - Set public visibility or configure RLS per your media policy.

### Step 2.3: Run Database Migrations
Execute the 22 database migrations against the new database:
```powershell
# Set your DATABASE_URL in backend/.env, then run:
npm --prefix backend run migrate
```
Verify connectivity:
```powershell
npm --prefix backend run test:db
```

---

## 3. Google Cloud Platform (GCP) OAuth Setup

Google OAuth enables one-click customer signup and sign-in at the "Authorize & Pay" step.

### Step 3.1: OAuth Consent Screen
1. Open [Google Cloud Console](https://console.cloud.google.com/) &rarr; **APIs & Services &rarr; OAuth consent screen**.
2. **User Type:** `External` &rarr; Click **Create**.
3. **App Information:**
   - **App name:** `SK Baghel Tour & Travels`
   - **User support email:** Client contact email (e.g. `bookings@agraskbagheltourandtravels.com`)
   - **Developer contact information:** Your engineering email
4. **App Domains:**
   - **Application home page:** `https://agraskbagheltourandtravels.com`
   - **Privacy Policy:** `https://agraskbagheltourandtravels.com/privacy-policy`
   - **Terms of Service:** `https://agraskbagheltourandtravels.com/terms-and-conditions`
   - **Authorized domains:**
     - `agraskbagheltourandtravels.com`
     - `supabase.co` *(Mandatory for Supabase OAuth)*
5. **Scopes:**
   - Add: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
6. **Publishing Status (Staging vs. Production):**
   - **Staging:** Keep in **Testing** mode and add developer/client Google accounts to **Test Users**.
   - **Production:** Click **Publish App** to move to **In Production** (removes the 100-user testing restriction so any Google account can sign in).

### Step 3.2: Create OAuth 2.0 Web Client ID
1. Navigate to **APIs & Services &rarr; Credentials &rarr; + Create Credentials &rarr; OAuth client ID**.
2. **Application type:** `Web application`.
3. **Name:** `SK Baghel Customer Client`.
4. **Authorized JavaScript Origins:**
   - Local: `http://localhost:5173`
   - Staging: `https://skbagheltravels-customer.coccoder999.workers.dev`
   - Production: `https://agraskbagheltourandtravels.com`, `https://www.agraskbagheltourandtravels.com`
   - Admin: `https://skbagheltravels-admin.coccoder999.workers.dev`, `https://admin.agraskbagheltourandtravels.com`
5. **Authorized Redirect URIs:**
   > [!IMPORTANT]
   > Google redirects exclusively to Supabase Auth handler, **not** to the customer React app.
   ```text
   https://<supabase-project-ref>.supabase.co/auth/v1/callback
   ```
6. Click **Create** &rarr; Copy the **Client ID** and **Client Secret**.

---

## 4. Supabase Authentication Configuration

### Step 4.1: Enable Google Provider
1. In [Supabase Dashboard](https://supabase.com/dashboard) &rarr; **Authentication &rarr; Providers &rarr; Google**.
2. Toggle **Enable Sign in with Google** to **ON**.
3. **Client ID:** Paste GCP Client ID.
4. **Client Secret:** Paste GCP Client Secret.
5. Click **Save**.

### Step 4.2: URL Configuration (Allow-list)
1. Go to **Authentication &rarr; URL Configuration**.
2. **Site URL:** `https://agraskbagheltourandtravels.com`
3. **Redirect URLs (Allow-list):**
   - Staging:
     ```text
     http://localhost:5173/auth/callback
     https://skbagheltravels-customer.coccoder999.workers.dev/auth/callback
     ```
   - Production:
     ```text
     https://agraskbagheltourandtravels.com/auth/callback
     https://www.agraskbagheltourandtravels.com/auth/callback
     ```
4. Click **Save changes**.

---

## 5. Render Docker API Deployment

The backend runs as a containerized Fastify service via `backend/Dockerfile`.

### Step 5.1: Create Render Web Service
1. In [Render Dashboard](https://dashboard.render.com/) &rarr; **New + &rarr; Web Service**.
2. Connect repo `tarun1sisodia/ArenaAI`.
3. **Settings:**
   - **Name:**
     - Staging: `skb-baghel-api-staging`
     - Production: `skb-baghel-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Port:** `4000`
   - **Health Check Path:** `/ready`
   - **Auto-Deploy:** Yes

### Step 5.2: Environment Variables Reference Matrix

| Variable | Staging Setting | Production Setting | Notes |
|---|---|---|---|
| `NODE_ENV` | `staging` | `production` | **Production strictly rejects `rzp_test_` keys!** |
| `PORT` | `4000` | `4000` | Container port |
| `ALLOW_TEST_AUTH` | `false` | `false` | Disables unauthenticated staff login |
| `API_BASE_URL` | `https://skb-baghel-api-staging.onrender.com` | `https://api.agraskbagheltourandtravels.com` | Base URL |
| `DATABASE_URL` | Staging Supabase pooler URI | Production Supabase pooler URI | Must have `?sslmode=require&uselibpqcompat=true` |
| `DATABASE_POOL_CONN_TIMEOUT_MS` | `15000` | `15000` | Prevents pooler TLS handshake timeouts |
| `DATABASE_QUERY_TIMEOUT_MS` | `15000` | `15000` | Query timeout threshold |
| `SUPABASE_URL` | `https://<staging-ref>.supabase.co` | `https://<prod-ref>.supabase.co` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role key | Production service role key | Server-only secret |
| `SUPABASE_JWT_SECRET` | Staging JWT secret | Production JWT secret | Used to verify customer & staff tokens |
| `CATALOG_MEDIA_BUCKET` | `documents` | `documents` | Supabase storage bucket |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | `rzp_live_...` | Mandatory format per environment |
| `RAZORPAY_KEY_SECRET` | Test secret | Live secret | Razorpay API Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Test webhook secret | Live webhook secret | Secret set in Razorpay webhook form |
| `FARE_RULES_VERSION` | `2026-09-13` | `2026-09-13` | Active rules version |
| `CORS_ORIGINS` | Comma-separated staging/preview URLs | `https://agraskbagheltourandtravels.com,https://www.agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com` | Whitelisted frontend origins |
| `LOCATIONIQ_TOKEN` | *(Optional)* | *(Optional)* | Server-held only; defaults to curated places |

### Step 5.3: Production API Custom Domain
1. In Render &rarr; **Settings &rarr; Custom Domains &rarr; Add Custom Domain**.
2. Enter `api.agraskbagheltourandtravels.com`.
3. In Cloudflare DNS, add the CNAME record target provided by Render.
4. Verify when live:
   ```bash
   curl -fsS https://api.agraskbagheltourandtravels.com/health
   curl -fsS https://api.agraskbagheltourandtravels.com/ready
   ```

---

## 6. Razorpay Payment Gateway & Webhook Setup

### Step 6.1: API Keys
- **Staging:** Toggle to **Test Mode** &rarr; **Account & Settings &rarr; API Keys &rarr; Generate Key**. Key begins with `rzp_test_`.
- **Production:** Toggle to **Live Mode** &rarr; Generate Live Key. Key begins with `rzp_live_`.

### Step 6.2: Webhook Registration
1. In Razorpay Dashboard &rarr; **Account & Settings &rarr; Webhooks &rarr; Add New Webhook**.
2. **Webhook URL:**
   - Staging:
     ```text
     https://skb-baghel-api-staging.onrender.com/api/v1/payments/webhooks/razorpay
     ```
   - Production:
     ```text
     https://api.agraskbagheltourandtravels.com/api/v1/payments/webhooks/razorpay
     ```
3. **Secret:** Create a unique secret passphrase (e.g. `skb_wh_sec_2026_xyz`). Set this exact same string in Render as `RAZORPAY_WEBHOOK_SECRET`.
4. **Active Events:**
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
5. Click **Save Webhook**.

---

## 7. Cloudflare Pages / Workers Frontend Deployment

### Step 7.1: Customer Site (`skbagheltravels-customer`)
1. In Cloudflare Dashboard &rarr; **Workers & Pages &rarr; skbagheltravels-customer**.
2. **Settings &rarr; Build & deployments**:
   - **Root directory:** `react`
   - **Build command:** `npm ci && npm run build`
   - **Output directory:** `dist`
3. **Settings &rarr; Variables and secrets**:
   - `NODE_VERSION` = `22`
   - `VITE_BASE_PATH` = `/`
   - `VITE_API_BASE_URL` = `https://skb-baghel-api-staging.onrender.com` (staging) or `https://api.agraskbagheltourandtravels.com` (production)
   - `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<supabase-anon-key>`
4. **Custom Domains (Production):**
   - Attach `agraskbagheltourandtravels.com` and `www.agraskbagheltourandtravels.com`.
5. **Redeploy:** Go to **Deployments &rarr; Retry deployment** whenever variables are updated.

### Step 7.2: Operations Desk (`skbagheltravels-admin`)
1. In Cloudflare Dashboard &rarr; **Workers & Pages &rarr; skbagheltravels-admin**.
2. **Build settings:**
   - **Root directory:** `admin`
   - **Build command:** `npm ci && npm run build`
   - **Output directory:** `dist`
3. **Variables and secrets:**
   - `NODE_VERSION` = `22`
   - `VITE_API_BASE_URL` = Same as customer
   - `VITE_SUPABASE_URL` = Same as customer
   - `VITE_SUPABASE_ANON_KEY` = Same as customer
4. **Custom Domains (Production):**
   - Attach `admin.agraskbagheltourandtravels.com`.

---

## 8. Staging vs. Production Tuning & Key Differences

| Dimension | Staging Environment | Production Environment |
|---|---|---|
| **Render `NODE_ENV`** | `staging` | `production` |
| **Razorpay Mode** | Test Mode (`rzp_test_...`) | Live Mode (`rzp_live_...`) |
| **CORS Origins** | Includes localhost & worker preview URLs | Exact production HTTPS custom domains only |
| **GCP OAuth Status** | **Testing** (restricted to test user emails) | **Published / In Production** (any Google user) |
| **Supabase Project** | Separate staging project (`trcmufqbpcymipqpemoq`) | Dedicated production project in Mumbai |
| **Database Connection** | Connection pooler with 15s timeout | Connection pooler with 15s timeout + Point-in-time recovery |
| **Render Instance** | Free / Starter | Starter (Non-sleeping) or Docker container on VPS |
| **Routing / 404s** | Customer: `404-page`, Admin: `single-page-application` | Customer: `404-page`, Admin: `single-page-application` |

---

## 9. Verification & Smoke Testing Commands

Run this sequence on any local terminal or CI/CD runner to verify the monorepo contract:

```bash
# 1. Full typecheck, tests, SEO audit, and production builds across all 3 apps:
npm run verify

# 2. Automated uptime health check across deployed services:
npm run healthcheck

# 3. Test remote database connectivity:
npm --prefix backend run test:db

# 4. Simulate a captured payment webhook without touching Razorpay:
node scripts/simulate-webhook.mjs <order_id> <amount_paise>
```
