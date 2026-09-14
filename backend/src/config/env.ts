import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  FARE_RULES_VERSION: z.string().min(1).default("2026-09-13"),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000,https://skbagheltravels.in"),
  ALLOW_TEST_AUTH: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),

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
  WHATSAPP_TEMPLATE_DRIVER: z.string().default("skb_driver_assigned"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("bookings@skbagheltravels.in"),

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
    if (env.ALLOW_TEST_AUTH) missing.push("ALLOW_TEST_AUTH must be false in production");
    if (missing.length > 0) {
      throw new Error(`Production environment is incomplete: ${missing.join(", ")}`);
    }
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
    .filter(Boolean);
}
