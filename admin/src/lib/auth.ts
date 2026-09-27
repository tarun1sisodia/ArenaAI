import { env } from "./env";
import type { AdminUser } from "./types";

export const SESSION_KEY = "skb-admin-session";
export const AUTH_EXPIRED_EVENT = "skb-admin-auth-expired";

export interface LoginResult {
  user: AdminUser;
}

/**
 * Authenticates staff credentials against Supabase Auth.
 */
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AdminUser> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error("Please enter your administrator email address.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  // 1. Verify backend server connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const healthRes = await fetch(`${env.API_BASE_URL}/api/v1/health`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (!healthRes || !healthRes.ok) {
      throw new Error("Backend is not connected.");
    }
  } catch {
    throw new Error("Backend is not connected.");
  }

  // 2. Production path: Supabase Auth via GoTrue REST API
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message =
          errData.error_description ||
          errData.message ||
          errData.msg ||
          "Invalid email or password. Please check your credentials.";

        const lower = message.toLowerCase();
        if (
          lower.includes("invalid login credentials") ||
          lower.includes("invalid_grant") ||
          lower.includes("invalid email or password")
        ) {
          throw new Error("Invalid email or password. Please check your credentials.");
        }
        if (lower.includes("rate limit") || lower.includes("too many")) {
          throw new Error("Too many failed attempts. Please try again later.");
        }
        throw new Error("Backend is not connected.");
      }

      const data = await response.json();
      const user = data.user;
      const role = user?.app_metadata?.role;

      // Restrict access: only an explicit server-assigned super_admin claim may enter.
      // Missing metadata must never be promoted by the client to an admin role.
      if (role !== "super_admin") {
        throw new Error("Access denied: insufficient privileges for the operations desk.");
      }

      const adminUser: AdminUser = {
        id: user?.id || "usr_super_admin",
        role: "super_admin",
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || "A. Baghel",
        email: user?.email || trimmedEmail,
        token: data.access_token,
      };

      return adminUser;
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("Invalid email or password") ||
          err.message.includes("Access denied") ||
          err.message.includes("Too many failed attempts")
        ) {
          throw err;
        }
      }
      throw new Error("Backend is not connected.");
    }
  }

  // Authentication service not configured or reachable:
  // Show only that backend is not connected — never expose technical details about Supabase or env vars.
  throw new Error("Backend is not connected.");
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
