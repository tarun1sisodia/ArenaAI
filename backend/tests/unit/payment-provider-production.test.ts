import { describe, expect, it } from "vitest";
import { createRazorpayAdapter } from "../../src/providers/adapters/razorpay.js";
import { loadEnv } from "../../src/config/env.js";

describe("Phase 1 - Step 1.1: Production Payment Provider Enforcement", () => {
  it("prohibits HMAC adapter and throws when isProduction is true and credentials are dummy/missing", () => {
    // Missing keySecret
    expect(() =>
      createRazorpayAdapter({
        keyId: "rzp_live_abc123",
        keySecret: "",
        webhookSecret: "whsec_live_123",
        isProduction: true,
      }),
    ).toThrow(/mandatory in production/i);

    // Dummy local test key
    expect(() =>
      createRazorpayAdapter({
        keyId: "rzp_test_local_dummy",
        keySecret: "secret",
        webhookSecret: "whsec_live_123",
        isProduction: true,
      }),
    ).toThrow(/mandatory in production/i);

    // Empty keyId
    expect(() =>
      createRazorpayAdapter({
        keyId: "",
        keySecret: "secret",
        webhookSecret: "whsec_live_123",
        isProduction: true,
      }),
    ).toThrow(/mandatory in production/i);
  });

  it("permits real Razorpay credentials when isProduction is true", () => {
    const adapter = createRazorpayAdapter({
      keyId: "rzp_live_real_key_id",
      keySecret: "real_secret_value",
      webhookSecret: "whsec_real_webhook_secret",
      isProduction: true,
    });
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe("razorpay");
  });

  it("allows test HMAC adapter fallback in non-production environments", () => {
    const adapter = createRazorpayAdapter({
      keyId: "rzp_test_local_123",
      keySecret: "",
      webhookSecret: "",
      isProduction: false,
    });
    expect(adapter).toBeDefined();
    expect(adapter.name).toBe("razorpay");
  });

  it("fails loadEnv when NODE_ENV is production and Razorpay credentials are missing", () => {
    const prodEnv: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgres://user:pass@host:5432/db",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "dummy-service-role",
      SUPABASE_JWT_SECRET: "dummy-secret-123456789012345678901234567890",
      CORS_ORIGINS: "https://agraskbagheltourandtravels.com",
      ALLOW_TEST_AUTH: "false",
      // Razorpay missing
      RAZORPAY_KEY_ID: "",
      RAZORPAY_KEY_SECRET: "",
      RAZORPAY_WEBHOOK_SECRET: "",
    };

    expect(() => loadEnv(prodEnv)).toThrow(/RAZORPAY_KEY_ID is mandatory in production/i);
  });

  it("fails loadEnv when NODE_ENV is production and Razorpay keyId is rzp_test_local", () => {
    const prodEnv: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgres://user:pass@host:5432/db",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "dummy-service-role",
      SUPABASE_JWT_SECRET: "dummy-secret-123456789012345678901234567890",
      CORS_ORIGINS: "https://agraskbagheltourandtravels.com",
      ALLOW_TEST_AUTH: "false",
      RAZORPAY_KEY_ID: "rzp_test_local_key",
      RAZORPAY_KEY_SECRET: "some_secret",
      RAZORPAY_WEBHOOK_SECRET: "some_webhook_secret",
    };

    expect(() => loadEnv(prodEnv)).toThrow(/local dummy prohibited/i);
  });
});
