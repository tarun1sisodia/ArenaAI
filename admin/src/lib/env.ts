/**
 * Environment configuration for Admin Operations Desk.
 * Adheres to FIND-019: centralizes environment variables and fallback URLs.
 */
export const env = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "https://api.skbagheltravels.in",
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "") || "",
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "",
  IS_DEV: Boolean(import.meta.env.DEV),
} as const;
