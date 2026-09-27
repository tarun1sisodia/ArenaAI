import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { BrandMark } from "@/components/admin/BrandMark";
import { loginWithCredentials } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

const easeExpo = [0.16, 1, 0.3, 1] as const;

/** Route constellation: Agra → Delhi → Jaipur. Decorative, aria-hidden. */
function RouteScene() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 480 300" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="loginGlow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="300" fill="url(#loginGlow)" />
      {[
        { x: 70, y: 210, r: 5 },
        { x: 170, y: 130, r: 4 },
        { x: 290, y: 170, r: 4 },
        { x: 405, y: 70, r: 6 },
      ].map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="var(--gold)"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.16, type: "spring", stiffness: 300, damping: 18 }}
        />
      ))}
      <motion.path
        d="M70 210 C 110 185, 130 140, 170 130 C 225 118, 245 175, 290 170 C 345 165, 360 95, 405 70"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
        opacity="0.9"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: easeExpo, delay: 0.25 }}
      />
      <circle cx="405" cy="70" r="6" fill="none" stroke="var(--gold)" strokeWidth="1.5">
        {!reduce && (
          <animate attributeName="r" values="6;20" dur="2.4s" repeatCount="indefinite" begin="1.4s" />
        )}
        {!reduce && (
          <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" begin="1.4s" />
        )}
      </circle>
    </svg>
  );
}

export function LoginPage({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 6 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);

    try {
      const authedUser = await loginWithCredentials(email, password);
      onLogin(authedUser);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-night p-10 lg:flex">
        <div className="absolute inset-0 opacity-90">
          <RouteScene />
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeExpo }}
          className="relative flex items-center gap-3"
        >
          <BrandMark size={42} className="[&_circle]:!stroke-[#E5A044]" />
          <div>
            <p className="font-display text-xl font-medium tracking-tight text-white">
              SK Baghel Tour &amp; Travels
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8c857e]">
              Agra · Operations Desk
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeExpo, delay: 0.15 }}
          className="relative max-w-md"
        >
          <p className="font-display text-2xl leading-snug tracking-tight text-white">
            Run the day&rsquo;s bookings, dispatch and payments from one desk.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#b5afa9]">
            The internal panel for the SK Baghel fleet — booking lifecycle,
            payment reconciliation, tour catalog, review moderation and a complete
            audit trail of every action.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {["Bookings", "Dispatch", "Payments", "Catalog", "Audit"].map((chip) => (
              <li
                key={chip}
                className="rounded-pill border border-white/12 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#d6d0c9]"
              >
                {chip}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative font-mono text-[11px] uppercase tracking-[0.18em] text-[#8c857e]">
          © {new Date().getFullYear()} SK Baghel Tour &amp; Travels
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        {/* Mobile brand */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <BrandMark size={36} />
          <div>
            <p className="font-display text-lg font-semibold text-ink">SK Baghel</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Operations Desk</p>
          </div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeExpo, delay: 0.08 }}
          className="w-full max-w-[400px]"
        >
          <h1 className="font-display text-[28px] font-medium tracking-tight text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Staff access to the operations desk. Authorized personnel only.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            {error && (
              <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft p-3.5 text-[13px] leading-snug text-error"
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoFocus
                autoComplete="username"
                inputMode="email"
                placeholder="you@agraskbagheltourandtravels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error && !emailValid)}
                disabled={busy}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error && password.length < 6)}
                  disabled={busy}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-gold"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={!canSubmit}
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4.5 w-4.5" aria-hidden="true" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-hairline pt-5">
            <p className="text-center text-[12px] leading-relaxed text-ink-faint">
              Trouble signing in? Contact the super admin to reset your access.
            </p>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              All sign-in activity is recorded for security
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
