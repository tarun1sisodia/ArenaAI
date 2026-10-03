import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

const AUTH_RETURN_TO_KEY = "arenaai:auth-return-to";
let customerClient: SupabaseClient | null = null;

export function getCustomerSupabaseConfig(): { url: string; key: string } {
  const url = (import.meta.env.VITE_SUPABASE_URL || "")?.trim();
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "")?.trim();
  return { url, key };
}

export function hasCustomerSupabaseConfig(): boolean {
  const { url, key } = getCustomerSupabaseConfig();
  return Boolean(url && key);
}

export function getCustomerSupabaseClient(): SupabaseClient {
  if (customerClient) return customerClient;
  const { url, key } = getCustomerSupabaseConfig();
  if (!url || !key) {
    throw new Error("Google sign-in is not configured on this site yet.");
  }
  customerClient = createClient(url, key, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return customerClient;
}

export function safeInternalReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export interface CustomerAuthValue {
  session: Session | null;
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle(returnTo?: string): Promise<void>;
  signOut(): Promise<void>;
}

const defaultContext: CustomerAuthValue = {
  session: null,
  user: null,
  accessToken: null,
  loading: true,
  configured: hasCustomerSupabaseConfig(),
  error: null,
  async signInWithGoogle() { throw new Error("Google sign-in is not available in this render context."); },
  async signOut() { throw new Error("Sign-out is not available in this render context."); },
};

const CustomerAuthContext = createContext<CustomerAuthValue>(defaultContext);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configured = hasCustomerSupabaseConfig();

  useEffect(() => {
    let active = true;
    if (!configured) {
      setLoading(false);
      setError("Google sign-in is not configured on this build.");
      return () => { active = false; };
    }
    let client: SupabaseClient;
    try {
      client = getCustomerSupabaseClient();
    } catch {
      setLoading(false);
      setError("Google sign-in is temporarily unavailable.");
      return () => { active = false; };
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
      setError(null);
    });
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      if (sessionError) setError("Could not restore your sign-in session. Please sign in again.");
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setLoading(false);
      setError("Could not restore your sign-in session. Please sign in again.");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithGoogle = useCallback(async (returnTo = typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`) => {
    if (typeof window === "undefined") throw new Error("Sign-in can only start in a browser.");
    const client = getCustomerSupabaseClient();
    const safeReturn = safeInternalReturnTo(returnTo);
    try { window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, safeReturn); } catch { /* callback falls back to home */ }
    const redirectTo = new URL("/auth/callback/", window.location.origin).toString();
    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "openid email profile",
        queryParams: { prompt: "select_account" },
      },
    });
    if (signInError) throw signInError;
  }, []);

  const signOut = useCallback(async () => {
    const client = getCustomerSupabaseClient();
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
    setSession(null);
  }, []);

  const value = useMemo<CustomerAuthValue>(() => ({
    session,
    user: session?.user ?? null,
    accessToken: session?.access_token ?? null,
    loading,
    configured,
    error,
    signInWithGoogle,
    signOut,
  }), [session, loading, configured, error, signInWithGoogle, signOut]);

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthValue {
  return useContext(CustomerAuthContext);
}

export function getStoredAuthReturnTo(): string {
  if (typeof window === "undefined") return "/";
  try {
    const value = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return safeInternalReturnTo(value);
  } catch {
    return "/";
  }
}

export function getCustomerDisplayName(user: User | null): string {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.full_name ?? metadata?.name ?? user?.email?.split("@")[0];
  return typeof value === "string" && value.trim() ? value.trim() : "Your account";
}

export function getCustomerAvatarUrl(user: User | null): string | null {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const url = metadata?.avatar_url ?? metadata?.picture;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function getCustomerInitials(user: User | null): string {
  const name = getCustomerDisplayName(user);
  if (!name || name === "Your account") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

