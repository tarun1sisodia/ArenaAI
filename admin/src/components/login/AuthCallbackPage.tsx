import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearOAuthAttempt,
  exchangeGoogleCode,
  resolveGoogleAccessToken,
  takeOAuthAttempt,
  validateStoredSession,
} from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

let callbackTask: Promise<AdminUser> | null = null;

function authErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "oauth_failed";
  if (error.message.includes("Access denied")) return "access_denied";
  if (error.message === "oauth_cancelled") return "oauth_cancelled";
  if (error.message === "backend_unavailable" || error.message === "Backend is not connected.") {
    return "backend_unavailable";
  }
  if (error.message === "oauth_expired") return "oauth_expired";
  return "oauth_failed";
}

async function completeOAuthCallback(): Promise<AdminUser> {
  const callbackUrl = new URL(window.location.href);
  const params = callbackUrl.searchParams;
  const fragment = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
  const code = params.get("code");
  const accessToken = fragment.get("access_token");
  const callbackError = params.get("error");
  const attempt = takeOAuthAttempt();

  // Remove provider codes and implicit tokens from the address bar before network work.
  window.history.replaceState(null, "", `${callbackUrl.pathname}`);

  if (callbackError) {
    if (callbackError === "access_denied") throw new Error("oauth_cancelled");
    throw new Error("oauth_failed");
  }
  if (!attempt) {
    throw new Error("oauth_failed");
  }

  let user: AdminUser;
  if (code) {
    user = await exchangeGoogleCode(code, attempt.verifier);
  } else if (accessToken) {
    user = await resolveGoogleAccessToken(accessToken);
  } else {
    throw new Error("oauth_failed");
  }

  if (!(await validateStoredSession(user))) throw new Error("backend_unavailable");
  return user;
}

export function AuthCallbackPage({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    callbackTask ??= completeOAuthCallback();
    callbackTask
      .then((user) => {
        if (!active) return;
        onLogin(user);
        navigate("/", { replace: true });
      })
      .catch((error: unknown) => {
        clearOAuthAttempt();
        if (!active) return;
        navigate(`/?auth_error=${encodeURIComponent(authErrorCode(error))}`, { replace: true });
      });
    return () => {
      active = false;
    };
  }, [navigate, onLogin]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-center">
      <div role="status" aria-live="polite">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-gold/25 border-t-gold" aria-hidden="true" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-ink-soft">Verifying staff access</p>
      </div>
    </main>
  );
}
