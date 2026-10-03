# Admin authentication setup

The admin SPA accepts **Supabase Auth** sessions only. Email/password and Google OAuth use the same staff authorization rule: the authenticated user's server-controlled `app_metadata.role` must equal `super_admin`. Backend admin routes independently enforce that role in the JWT.

## 1. Confirm the correct Supabase project

Use the project referenced by the deployed admin build—not whichever project is currently open in another browser tab. The repository does not contain the deployed project's URL or secrets. Confirm the build-time values in the Cloudflare Pages project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

`VITE_SUPABASE_ANON_KEY` is a public client key. **Never** place a Supabase service-role key or Google client secret in any `VITE_*` variable or browser bundle. The backend's Supabase service-role credential stays server-side.

## 2. Configure Google's OAuth client and Supabase

1. In Google Cloud Console, create or select an OAuth 2.0 **Web application** client.
2. Set its authorized redirect URI to the Supabase callback:
   `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
3. Add the deployed admin origin (for example, `https://<admin-host>`) and the local development origin (`http://localhost:5173`) as authorized JavaScript origins.
4. In Supabase Dashboard → **Authentication → Sign In / Up → Providers → Google**, enable Google and enter the client ID and client secret. Keep the secret in Supabase only.
5. In Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs**, allow the app callback for each origin:
   - `https://<admin-host>/auth/callback`
   - `http://localhost:5173/auth/callback`
6. Rebuild and deploy the admin SPA after setting its three `VITE_*` build variables. OAuth redirect URLs are fixed to the current app origin plus `/auth/callback`; the app does not accept an arbitrary redirect supplied in a query string.

The SPA creates a single-use PKCE verifier and exchanges the returned authorization code with Supabase. Supabase GoTrue manages provider OAuth state/CSRF validation. A successful Google login is still rejected unless that Google identity has the staff role below.

## 3. Provision a staff user directly in Supabase

First create or locate the user under **Authentication → Users** in the *same project*. Then run this in that project's SQL Editor, replacing the email with the exact staff account:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'super_admin')
where lower(email) = lower('STAFF_EMAIL_HERE')
returning id, email, raw_app_meta_data ->> 'role' as role;
```

Confirm the returned row has role `super_admin`. Use `raw_app_meta_data` / `app_metadata`; do not put the authorization role in user-editable `raw_user_meta_data`. If no row is returned, the account does not exist in that project or its email differs. After changing a role, sign out and sign in again so Supabase issues a token with the updated claims.

This works for both email/password users and the matching Google identity. Google must return the same email as the provisioned Supabase user, and the role must be present before access is granted. A non-staff Google account is denied even if Google authentication itself succeeds.

## 4. Troubleshooting

- **Invalid email/password:** confirm that the user exists in the deployed project, is confirmed when email confirmation is enabled, and has the right password.
- **Access denied:** confirm `raw_app_meta_data.role` is exactly `super_admin` on the same Supabase user; then sign out and sign in again.
- **Google OAuth could not be completed:** check that Google is enabled in Supabase, the Google redirect URI is the Supabase `/auth/v1/callback`, and the app callback is allowlisted in Supabase URL Configuration.
- **Backend is not connected:** confirm the admin build's `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`, then rebuild. The client fails visibly instead of silently authenticating against a staging fallback.
- **Second-factor challenge:** this admin SPA does not implement a Supabase TOTP/MFA challenge flow. If Supabase requires MFA for the account, the password flow explains that condition; do not disable an enforced factor just to work around missing MFA UI.
