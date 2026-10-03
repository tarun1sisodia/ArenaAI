import { useEffect, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { BrandMark } from "@/components/admin/BrandMark";
import { beginGoogleSignIn, loginWithCredentials } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

const easeExpo = [0.16, 1, 0.3, 1] as const;
const rotatingWords = ["bookings", "dispatch", "payments", "fleet", "reviews"];

function RollingWord({ index }: { index: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex h-[1.18em] w-[8ch] overflow-hidden align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={rotatingWords[index]}
          className="absolute inset-x-0 top-0 text-gold-light"
          initial={reduce ? { opacity: 1 } : { y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-110%", opacity: 0 }}
          transition={{ duration: reduce ? 0.001 : 0.42, ease: easeExpo }}
          aria-hidden="true"
        >
          {rotatingWords[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
      <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3c1.6-4.9 6.1-8.5 11.4-8.5Z" />
    </svg>
  );
}

function authErrorMessage(code: string | null): string | null {
  switch (code) {
    case "access_denied": return "This Google account is not authorized for the operations desk. Ask the super admin to assign staff access in Supabase.";
    case "backend_unavailable": return "Your staff account was verified, but the operations API is unavailable. Please try again later.";
    case "oauth_expired": return "The Google sign-in link expired. Please start again.";
    case "oauth_cancelled": return "Google sign-in was cancelled.";
    case "oauth_failed": return "Google sign-in could not be completed. Check the provider and callback configuration, then try again.";
    default: return null;
  }
}

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
  const reduce = useReducedMotion() ?? false;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const pointerX = useSpring(useMotionValue(0), { stiffness: 110, damping: 24, mass: 0.8 });
  const pointerY = useSpring(useMotionValue(0), { stiffness: 110, damping: 24, mass: 0.8 });
  const routeX = useTransform(pointerX, [-1, 1], [-7, 7]);
  const routeY = useTransform(pointerY, [-1, 1], [-5, 5]);
  const buttonX = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.5 });
  const buttonY = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.5 });

  useEffect(() => {
    const url = new URL(window.location.href);
    const message = authErrorMessage(url.searchParams.get("auth_error"));
    if (message) setError(message);
    if (url.searchParams.has("auth_error")) {
      url.searchParams.delete("auth_error");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setWordIndex((index) => (index + 1) % rotatingWords.length), 2600);
    return () => window.clearInterval(timer);
  }, [reduce]);

  function moveRoute(event: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
  }

  function moveSubmitButton(event: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    buttonX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 8);
    buttonY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 5);
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 6 && !busy && !googleBusy && !leaving;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);

    try {
      const authedUser = await loginWithCredentials(email, password);
      if (!reduce) {
        setLeaving(true);
        await new Promise((resolve) => window.setTimeout(resolve, 520));
      }
      onLogin(authedUser);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setGoogleBusy(true);
    try {
      await beginGoogleSignIn();
    } catch (err) {
      setGoogleBusy(false);
      setError(err instanceof Error ? err.message : "Google sign-in could not be started.");
    }
  }

  return (
    <motion.div
      className="relative isolate grid min-h-screen overflow-hidden bg-bg lg:min-h-full lg:grid-cols-[1.05fr_1fr]"
      initial={reduce ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.001 : 0.4 }}
    >
      {/* Brand panel */}
      <motion.div
        onMouseMove={moveRoute}
        onMouseLeave={() => { pointerX.set(0); pointerY.set(0); }}
        animate={leaving ? { opacity: 0, x: reduce ? 0 : -32 } : { opacity: 1, x: 0 }}
        transition={{ duration: reduce ? 0.001 : 0.45, delay: reduce ? 0 : 0.08, ease: easeExpo }}
        className="relative hidden flex-col justify-between overflow-hidden bg-night p-10 lg:flex"
      >
        <div className="absolute inset-0 opacity-90">
          <motion.div className="absolute inset-0" style={reduce ? undefined : { x: routeX, y: routeY }}>
            <RouteScene />
          </motion.div>
        </div>
        {!reduce && <>
          <motion.div
            className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
            animate={{ x: [0, 10, -5, 0], y: [0, -8, 5, 0] }}
            transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
            aria-hidden="true"
          />
          <motion.div
            className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[#4b5b77]/20 blur-3xl"
            animate={{ x: [0, -8, 6, 0], y: [0, 7, -6, 0] }}
            transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
            aria-hidden="true"
          />
          <motion.div
            className="pointer-events-none absolute inset-0 z-[1] opacity-[0.055] mix-blend-soft-light"
            animate={{ x: [0, -1, 0], y: [0, 1, 0] }}
            transition={{ duration: 19, ease: "linear", repeat: Infinity }}
            aria-hidden="true"
          >
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 160 160">
              <filter id="loginFilmGrain"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" /></filter>
              <rect width="100%" height="100%" filter="url(#loginFilmGrain)" />
            </svg>
          </motion.div>
        </>}

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
          className="relative z-[2] max-w-md"
        >
          <p className="sr-only">Run the day&rsquo;s bookings, dispatch, payments, fleet and reviews from one desk.</p>
          <p className="font-display text-2xl leading-snug tracking-tight text-white" aria-hidden="true">
            Run the day&rsquo;s <RollingWord index={wordIndex} /> from one desk.
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
      </motion.div>

      {/* Form panel */}
      <motion.div
        className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10"
        animate={leaving ? { opacity: 0, y: reduce ? 0 : 14 } : { opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.001 : 0.38, ease: easeExpo }}
      >
        {/* Mobile brand */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <BrandMark size={36} />
          <div>
            <p className="font-display text-lg font-semibold text-ink">SK Baghel</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Operations Desk</p>
          </div>
        </div>

        <div className="mb-7 w-full max-w-[400px] lg:hidden">
          <p className="sr-only">Run the day&rsquo;s bookings, dispatch, payments, fleet and reviews from one desk.</p>
          <p className="font-display text-[19px] leading-snug text-ink" aria-hidden="true">
            Run the day&rsquo;s <span className="text-gold-text"><RollingWord index={wordIndex} /></span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">From one operations desk.</p>
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

          <motion.button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleBusy || busy || leaving}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.001 : 0.38, ease: easeExpo, delay: reduce ? 0 : 0.35 }}
            whileHover={reduce ? undefined : { y: -1, transition: { duration: 0.18, delay: 0 } }}
            whileTap={reduce ? undefined : { scale: 0.99, transition: { duration: 0.1, delay: 0 } }}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-hairline-strong bg-surface px-4 text-sm font-medium text-ink shadow-card transition-colors hover:border-gold-border hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60"
          >
            {googleBusy ? <Loader2 className="h-[18px] w-[18px] animate-spin text-gold" aria-hidden="true" /> : <GoogleMark />}
            {googleBusy ? "Connecting to Google…" : "Continue with Google"}
          </motion.button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-faint">
            Staff Google accounts only. Access is role-checked after sign-in.
          </p>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-hairline" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">or sign in with email</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <form onSubmit={submit} className="space-y-5" noValidate>
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
                autoComplete="username"
                inputMode="email"
                placeholder="you@agraskbagheltourandtravels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error && !emailValid)}
                disabled={busy || googleBusy || leaving}
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
                  disabled={busy || googleBusy || leaving}
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

            <motion.div
              className="w-full"
              style={reduce ? undefined : { x: buttonX, y: buttonY }}
              onMouseMove={moveSubmitButton}
              onMouseLeave={() => { buttonX.set(0); buttonY.set(0); }}
            >
              <Button type="submit" variant="gold" size="lg" disabled={!canSubmit} className="w-full" shine>
                {busy ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />{leaving ? "Signing you in…" : "Signing in…"}</>
                ) : (
                  <><LogIn className="h-4.5 w-4.5" aria-hidden="true" />Sign in with email</>
                )}
              </Button>
            </motion.div>
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
      </motion.div>
      {!reduce && leaving && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 origin-bottom bg-gold-wash"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.48, ease: easeExpo }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}
