import { env } from "./env";
import type { AdminUser } from "./types";

export const SESSION_KEY = "skb-admin-session";

export interface LoginResult {
  user: AdminUser;
}

/**
 * Authenticates staff credentials against Supabase Auth (production)
 * or deterministic test auth context (local development / testing).
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

  // Production path: Supabase Auth via GoTrue REST API
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
          "Authentication failed. Please check your credentials.";
        throw new Error(message);
      }

      const data = await response.json();
      const user = data.user;
      const role = user?.app_metadata?.role;

      // Restrict access: Only super_admin role can access the operations desk
      if (role && role !== "super_admin") {
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
      if (err instanceof Error) throw err;
      throw new Error("An error occurred during authentication.");
    }
  }

  // Development / Demo environment fallback (TRD §2.1)
  // Enforces valid email pattern and non-empty password
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const adminUser: AdminUser = {
    id: "00000000-0000-4000-a000-000000000001",
    role: "super_admin",
    name: "A. Baghel",
    email: trimmedEmail,
    token: "test-super_admin",
  };

  return adminUser;
}

export function getStoredSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AdminUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthHeaders(user?: AdminUser | null): Record<string, string> {
  const token = user?.token || getStoredSession()?.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
