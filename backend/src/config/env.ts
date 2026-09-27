import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  FARE_RULES_VERSION: z.string().min(1).default("2026-09-13"),
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:5173,http://localhost:5174,http://localhost:4174,http://localhost:4175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:4174,http://127.0.0.1:4175,http://localhost:3000,https://agraskbagheltourandtravels.com,https://www.agraskbagheltourandtravels.com,https://admin.agraskbagheltourandtravels.com",
    ),
  ALLOW_TEST_AUTH: z
    .string()
    .optional()
    .transform((value) => {
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || !process.env.NODE_ENV;
    }),

  DATABASE_URL: z.string().optional().default(""),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_JWT_SECRET: z.string().optional().default(""),

  MONGODB_URI: z.string().optional().default(""),

  RAZORPAY_KEY_ID: z.string().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().optional().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(""),

  PAYPAL_CLIENT_ID: z.string().optional().default(""),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(""),
  PAYPAL_WEBHOOK_SECRET: z.string().optional().default(""),
  PAYPAL_API_BASE: z.string().default("https://api-m.sandbox.paypal.com"),

  CARD_PROVIDER_SECRET: z.string().optional().default(""),
  CARD_WEBHOOK_SECRET: z.string().optional().default(""),
  CARD_CHECKOUT_BASE_URL: z.string().default("https://checkout.example-cards.test"),

  LOCATIONIQ_TOKEN: z.string().optional().default(""),

  WHATSAPP_TOKEN: z.string().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_TEMPLATE_PAYMENT: z.string().default("skb_payment_confirmed"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("bookings@agraskbagheltourandtravels.com"),

  FX_USD_PER_INR: z.coerce.number().positive().default(0.012),
  FX_EUR_PER_INR: z.coerce.number().positive().default(0.011),
  FX_GBP_PER_INR: z.coerce.number().positive().default(0.0095),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached && source === process.env) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    const missing: string[] = [];
    if (!env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!env.SUPABASE_JWT_SECRET && !env.SUPABASE_URL) {
      // Need at least one way to verify JWTs
      missing.push("SUPABASE_JWT_SECRET or SUPABASE_URL for JWT verification");
    }
    // Payment secrets should be present in production if payments are enabled
    // We warn but don't hard fail for Razorpay if not using it, but require at least webhook secret to be set if key is set
    if (env.RAZORPAY_KEY_ID && !env.RAZORPAY_KEY_SECRET) {
      missing.push("RAZORPAY_KEY_SECRET required when RAZORPAY_KEY_ID is set");
    }
    if (env.RAZORPAY_KEY_ID && !env.RAZORPAY_WEBHOOK_SECRET) {
      missing.push("RAZORPAY_WEBHOOK_SECRET required when RAZORPAY_KEY_ID is set");
    }
    // SEC-004: PayPal and Card webhook secrets are required only when the
    // provider is actually configured. Unused providers receive an ephemeral
    // per-boot secret in app.ts, so webhook forgery is still impossible.
    if (env.PAYPAL_CLIENT_ID && !env.PAYPAL_WEBHOOK_SECRET) {
      missing.push("PAYPAL_WEBHOOK_SECRET required when PAYPAL_CLIENT_ID is set");
    }
    if (env.CARD_PROVIDER_SECRET && !env.CARD_WEBHOOK_SECRET) {
      missing.push("CARD_WEBHOOK_SECRET required when CARD_PROVIDER_SECRET is set");
    }
    if (env.ALLOW_TEST_AUTH) missing.push("ALLOW_TEST_AUTH must be false in production");
    // Validate CORS origins are HTTPS in production
    const origins = env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
    const insecure = origins.filter((o) => !o.startsWith("https://") && !o.includes("localhost"));
    if (insecure.length > 0) {
      missing.push(`CORS_ORIGINS contains insecure origins in production: ${insecure.join(", ")}`);
    }
    if (missing.length > 0) {
      throw new Error(`Production environment is incomplete: ${missing.join(", ")}`);
    }
  }
  // SEC-003 defence-in-depth: catch ALLOW_TEST_AUTH=true on a server that has a real DB URL
  // (staging/docker accident detection — not restricted to NODE_ENV=production)
  if (env.ALLOW_TEST_AUTH && env.DATABASE_URL && env.NODE_ENV !== "test") {
    // Warn loudly — do not throw so tests that set DATABASE_URL for integration can still run
    // eslint-disable-next-line no-console
    console.warn(
      "[SECURITY WARNING] ALLOW_TEST_AUTH=true with a real DATABASE_URL detected. " +
      "This grants unauthenticated super_admin access. Remove ALLOW_TEST_AUTH from any non-test environment.",
    );
  }
  // Validate FX rates are sane
  if (env.FX_USD_PER_INR <= 0 || env.FX_USD_PER_INR > 1) {
    throw new Error("FX_USD_PER_INR must be between 0 and 1");
  }
  if (env.FX_EUR_PER_INR <= 0 || env.FX_EUR_PER_INR > 1) {
    throw new Error("FX_EUR_PER_INR must be between 0 and 1");
  }
  if (env.FX_GBP_PER_INR <= 0 || env.FX_GBP_PER_INR > 1) {
    throw new Error("FX_GBP_PER_INR must be between 0 and 1");
  }

  if (source === process.env) cached = env;
  return env;
}

export function resetEnvCache(): void {
  cached = null;
}

export function corsOriginList(env: Env): string[] {
  return env.CORS_ORIGINS.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((origin) => {
      // Basic validation: must be valid URL format
      try {
        const url = new URL(origin);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    });
}

export function isProduction(env: Env): boolean {
  return env.NODE_ENV === "production";
}
