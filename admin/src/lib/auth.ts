import { env } from "./env";
import type { AdminUser } from "./types";

export const SESSION_KEY = "skb-admin-session";
export const AUTH_EXPIRED_EVENT = "skb-admin-auth-expired";

export interface LoginResult {
  user: AdminUser;
}

export const OAUTH_ATTEMPT_KEY = "skb-admin-pkce";

interface OAuthAttempt {
  verifier: string;
}

interface SupabaseAuthUser {
  id?: unknown;
  email?: unknown;
  app_metadata?: { role?: unknown };
  user_metadata?: { full_name?: unknown; name?: unknown };
}

function authConfig(): { url: string; anonKey: string } {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Backend is not connected.");
  }
  return { url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY };
}

function buildAdminUser(
  user: SupabaseAuthUser | null | undefined,
  accessToken: unknown,
  emailFallback?: string,
): AdminUser {
  if (!user || user.app_metadata?.role !== "super_admin") {
    throw new Error("Access denied: insufficient privileges for the operations desk.");
  }
  if (typeof user.id !== "string" || !user.id.trim()) {
    throw new Error("Supabase returned an incomplete staff account.");
  }
  const email = typeof user.email === "string" && user.email.trim()
    ? user.email.trim()
    : emailFallback?.trim();
  if (!email) throw new Error("Supabase returned an incomplete staff account.");
  if (typeof accessToken !== "string" || accessToken.length < 20) {
    throw new Error("Supabase returned an invalid sign-in token.");
  }
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const name = typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : email;
  return { id: user.id, role: "super_admin", name, email, token: accessToken };
}

async function verifyBackendConnectivity(): Promise<void> {
  if (!env.API_BASE_URL) throw new Error("Backend is not connected.");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${env.API_BASE_URL}/api/v1/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Backend is not connected.");
  } catch {
    throw new Error("Backend is not connected.");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Authenticates staff credentials against Supabase Auth.
 */
export async function loginWithCredentials(email: string, password: string): Promise<AdminUser> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error("Please enter your administrator email address.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters long.");
  const { url, anonKey } = authConfig();
  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, password }),
    });
  } catch {
    throw new Error("Supabase sign-in is temporarily unavailable. Please try again.");
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = String(errData.error_description || errData.message || errData.msg || errData.error || "");
    const lower = message.toLowerCase();
    if (lower.includes("mfa_required") || lower.includes("mfa challenge") || errData.code === "mfa_required") {
      throw new Error("This account requires a second-factor code, which this admin login does not yet support. Contact the super admin for help.");
    }
    if (lower.includes("invalid login credentials") || lower.includes("invalid_grant") || lower.includes("invalid email or password")) {
      throw new Error("Invalid email or password. Please check your credentials.");
    }
    if (lower.includes("rate limit") || lower.includes("too many")) {
      throw new Error("Too many failed attempts. Please try again later.");
    }
    throw new Error("Supabase sign-in failed. Check the account and authentication settings, then try again.");
  }
  const data = await response.json();
  const adminUser = buildAdminUser(data.user, data.access_token, trimmedEmail);
  await verifyBackendConnectivity();
  return adminUser;
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  let binary = "";
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Start Google OAuth with PKCE; Supabase GoTrue owns provider-state/CSRF validation. */
export async function beginGoogleSignIn(): Promise<void> {
  const { url } = authConfig();
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error("This browser cannot securely start Google sign-in.");
  }
  const attempt: OAuthAttempt = { verifier: randomBase64Url(32) };
  const challenge = await createCodeChallenge(attempt.verifier);
  localStorage.setItem(OAUTH_ATTEMPT_KEY, JSON.stringify(attempt));
  const redirectTo = `${window.location.origin}/auth/callback`;
  const authorizeUrl = new URL(`${url}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  window.location.assign(authorizeUrl.toString());
}

/** Take-and-delete the single-use PKCE verifier from local storage. */
export function takeOAuthAttempt(): OAuthAttempt | null {
  try {
    const raw = localStorage.getItem(OAUTH_ATTEMPT_KEY);
    localStorage.removeItem(OAUTH_ATTEMPT_KEY);
    if (!raw) return null;
    const attempt = JSON.parse(raw) as Partial<OAuthAttempt>;
    if (typeof attempt.verifier !== "string" || !attempt.verifier) return null;
    return { verifier: attempt.verifier };
  } catch {
    clearOAuthAttempt();
    return null;
  }
}

export function clearOAuthAttempt(): void {
  try {
    localStorage.removeItem(OAUTH_ATTEMPT_KEY);
  } catch {
    // Storage may be unavailable; there is nothing more to clear.
  }
}

/** Exchange the PKCE code using the single-use verifier. */
export async function exchangeGoogleCode(code: string, verifier: string): Promise<AdminUser> {
  const { url, anonKey } = authConfig();
  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
  } catch {
    throw new Error("oauth_failed");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const description = String(data.error_description || data.message || "").toLowerCase();
    if (description.includes("expired") || description.includes("invalid grant")) throw new Error("oauth_expired");
    throw new Error("oauth_failed");
  }
  const data = await response.json();
  return buildAdminUser(data.user, data.access_token);
}

/** Resolve legacy implicit-flow tokens using GoTrue; never trust user details in the URL. */
export async function resolveGoogleAccessToken(accessToken: string): Promise<AdminUser> {
  const { url, anonKey } = authConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) throw new Error("oauth_failed");
  return buildAdminUser(await response.json(), accessToken);
}

export function getStoredSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminUser>;
    if (
      typeof parsed.id !== "string" ||
      parsed.role !== "super_admin" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.token !== "string" ||
      parsed.token.length < 20
    ) {
      clearSession();
      return null;
    }
    return parsed as AdminUser;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * A localStorage entry is only a hint. The backend must accept the bearer
 * token before the admin shell is rendered. This prevents a forged session
 * object from briefly exposing the dashboard or its controls.
 */
export async function validateStoredSession(user: AdminUser): Promise<boolean> {
  if (!env.API_BASE_URL) return false;
  try {
    const response = await fetch(`${env.API_BASE_URL}/api/v1/ops/admin/audit-logs?limit=1`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function saveSession(user: AdminUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function expireSession(): void {
  clearSession();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export function getAuthHeaders(user?: AdminUser | null): Record<string, string> {
  const token = user?.token || getStoredSession()?.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
