import { useEffect, useState } from "react";
import { clearOAuthErrorFromUrl, friendlyOAuthSignInError } from "../auth/customerAuth";

/**
 * Global OAuth error handler, mounted once at the app root.
 *
 * Supabase redirects OAuth failures (e.g. `bad_oauth_state`) to the Site URL
 * (usually `/`) instead of `/auth/callback`, so without this component the
 * failure is silent — the error only sits in the URL params and the user sees
 * nothing. This banner surfaces a human-friendly message and cleans the URL.
 */
export function OAuthErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // The callback page has its own richer error handling; don't double up.
    if (window.location.pathname.replace(/\/$/, "") === "/auth/callback") return;
    const friendly = friendlyOAuthSignInError(window.location.search);
    if (friendly) {
      setMessage(friendly);
      clearOAuthErrorFromUrl();
    }
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-start justify-center px-4 pt-3 pointer-events-none"
    >
      <div className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
        <span className="material-symbols-outlined text-icon-20 text-red-700 mt-0.5" aria-hidden="true">
          error
        </span>
        <p className="flex-1 text-sm font-medium text-red-800">{message}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          aria-label="Dismiss sign-in error"
          className="rounded-lg px-2 py-1 text-sm font-bold text-red-700 hover:bg-red-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default OAuthErrorBanner;
