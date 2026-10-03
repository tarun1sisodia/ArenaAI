/**
 * Environment configuration for Admin Operations Desk.
 * Centralizes public frontend configuration; production service URLs must be explicit.
 */
export const env = {
  API_BASE_URL:
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "0.0.0.0")
      ? "http://localhost:4000"
      : ""),
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "") || "",
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "",
  IS_DEV: Boolean(import.meta.env.DEV),
} as const;
