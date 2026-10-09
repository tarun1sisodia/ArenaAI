import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";
import { getLatestReleaseAttempt, resetLatestReleaseAttempt } from "../../src/shared/deploy-hook.js";

describe("correlation id (P0-T01)", () => {
  it("echoes x-correlation-id on every response", async () => {
    const { app } = await createTestApp();
    const correlationId = "corr-health-12345678";
    const health = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-correlation-id": correlationId },
    });
    expect(health.statusCode).toBe(200);
    expect(health.headers["x-correlation-id"]).toBe(correlationId);
    expect(health.headers["x-request-id"]).toBe(correlationId);
    await app.close();
  });

  it("exposes the latest release attempt without claiming deployment completion", async () => {
    resetLatestReleaseAttempt();
    const { app } = await createTestApp();
    const latest = await app.inject({ method: "GET", url: "/api/v1/content/release/latest" });
    expect(latest.statusCode).toBe(200);
    expect(latest.json()).toMatchObject({
      success: true,
      data: { available: false, release: null },
    });
    expect(getLatestReleaseAttempt()).toBeNull();
    await app.close();
  });
});
