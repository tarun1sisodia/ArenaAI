import { useState } from "react";
import { AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { BrandMark } from "@/components/admin/BrandMark";
import { loginWithCredentials } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

const easeExpo = [0.16, 1, 0.3, 1] as const;

function HeroScene() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 480 560" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="560" fill="url(#heroGlow)" />

      {/* Constellation route: Agra → Delhi → Jaipur */}
      {[
        { x: 90, y: 420, r: 5 },
        { x: 190, y: 320, r: 4 },
        { x: 300, y: 360, r: 4 },
        { x: 390, y: 180, r: 6 },
      ].map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="var(--gold)"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.18, type: "spring", stiffness: 300, damping: 18 }}
        />
      ))}
      <motion.path
        d="M90 420 C 130 390, 150 330, 190 320 C 240 308, 260 370, 300 360 C 350 348, 350 220, 390 180"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: easeExpo, delay: 0.4 }}
      />
      {/* Taj dome silhouette */}
      <g stroke="var(--text)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85">
        <motion.path
          d="M360 140 C 360 110, 400 110, 400 140 L 404 152 L 356 152 Z"
          initial={reduce ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 2.1, duration: 0.8 }}
        />
        <motion.line
          x1="380" y1="110" x2="380" y2="98"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 2.3, duration: 0.5 }}
        />
      </g>
      {/* Pulse on final pin */}
      <circle cx="390" cy="180" r="6" fill="none" stroke="var(--gold)" strokeWidth="1.5">
        {!reduce && (
          <animate attributeName="r" values="6;22" dur="2.4s" repeatCount="indefinite" begin="2.6s" />
        )}
        {!reduce && (
          <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" begin="2.6s" />
        )}
      </circle>
    </svg>
  );
}

export function LoginPage({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("admin@skbagheltravels.in");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const authedUser = await loginWithCredentials(email, password);
      onLogin(authedUser);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        !msg ||
        msg.toLowerCase().includes("supabase") ||
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("vite_") ||
        msg.toLowerCase().includes("configured") ||
        msg.toLowerCase().includes("not connected") ||
        msg.toLowerCase().includes("an error occurred")
      ) {
        setError("Backend is not connected.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-night lg:block">
        <div className="absolute inset-0 p-10">
          <HeroScene />
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeExpo, delay: 0.15 }}
            className="absolute inset-x-0 bottom-0 p-10"
          >
            <div className="flex items-center gap-3">
              <BrandMark size={40} className="[&_circle]:!stroke-[#E5A044]" />
              <div>
                <p className="font-display text-2xl font-medium tracking-tight text-white">
                  SK Baghel Tour &amp; Travels
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#737373]">
                  Agra · Operations Desk
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#b5afa9]">
              The internal hub for booking lifecycle, payment reconciliation, catalog
              publishing, review moderation and audit — built on the{" "}
              <em className="text-gold-light">21st.dev</em> Vercel light system with the
              Saffron Gold brand accent.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-10">
        <motion.form
          onSubmit={submit}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeExpo, delay: 0.1 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark size={36} />
            <div>
              <p className="font-display text-lg font-semibold text-ink">SK Baghel</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Admin Desk</p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-text">Staff access</p>
            <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink">
              Sign in to the desk
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Protected operations desk for verified Super Administrators.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-sm border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="leading-snug">{error}</div>
            </motion.div>
          )}

          <div className="space-y-3">
            <Label htmlFor="email">Administrator email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@skbagheltravels.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Desk Role</Label>
            <div className="flex items-center justify-between gap-3 rounded-sm border border-gold/40 bg-gold-soft/50 px-3.5 py-2.5">
              <span>
                <span className="block text-sm font-medium text-gold-text">
                  Super Admin
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">
                  Full control — bookings, refunds, catalog, reviews &amp; audit
                </span>
              </span>
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 border-gold">
                <span className="h-2 w-2 rounded-full bg-gold" />
              </span>
            </div>
          </div>

          <Button type="submit" variant="gold" size="lg" shine disabled={busy} className="w-full">
            <ShieldCheck className="h-4.5 w-4.5" />
            {busy ? "Authenticating credentials…" : "Enter Operations Desk"}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-ink-faint">
            Secured via Supabase Auth JWKS verification &amp; Fastify RBAC gateway.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
