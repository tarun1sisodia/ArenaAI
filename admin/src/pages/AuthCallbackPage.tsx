import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { handleAuthCallback } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

export function AuthCallbackPage({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    handleAuthCallback()
      .then((user) => {
        if (!mounted) return;
        onLogin(user);
        navigate("/", { replace: true });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error && err.message ? err.message : "Authentication callback failed.");
      });

    return () => {
      mounted = false;
    };
  }, [navigate, onLogin]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-night p-4">
      <div className="w-full max-w-md rounded-xl border border-hairline bg-surface p-8 text-center shadow-lg">
        {!error ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-9 w-9 animate-spin text-gold" />
            <p className="font-display text-lg font-medium text-ink">Verifying staff credentials…</p>
            <p className="text-xs leading-relaxed text-ink-soft">
              Exchanging authorization code and validating super_admin role permissions.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-soft text-error">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-medium text-ink">Access Denied</h2>
            <p className="text-sm leading-relaxed text-error">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined" && window.history && window.history.replaceState) {
                  window.history.replaceState({}, document.title, "/");
                }
                setError(null);
                navigate("/", { replace: true });
              }}
              className="mt-2"
            >
              Return to Sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
