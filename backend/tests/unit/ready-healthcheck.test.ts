import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";
import { createMemoryRepositories } from "../../src/db/memory.js";

describe("Deployment Readiness Health Check (/ready) (Step 1.8)", () => {
  it("returns HTTP 200 with status 'ready' when database is healthy", async () => {
    const { app } = await createTestApp();

    const res = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    expect(res.json().data.status).toBe("ready");

    const apiRes = await app.inject({
      method: "GET",
      url: "/api/v1/ready",
    });
    expect(apiRes.statusCode).toBe(200);
    expect(apiRes.json().success).toBe(true);

    await app.close();
  });

  it("returns HTTP 503 when db.healthCheck() returns false (database degraded)", async () => {
    const repos = createMemoryRepositories();
    // Simulate degraded / unhealthy DB pool
    repos.healthCheck = async () => false;

    const { app } = await createTestApp(repos);

    const res = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(res.statusCode).toBe(503);
    expect(res.json().success).toBe(false);
    expect(res.json().error.code).toBe("DB_NOT_READY");

    const apiRes = await app.inject({
      method: "GET",
      url: "/api/v1/ready",
    });
    expect(apiRes.statusCode).toBe(503);
    expect(apiRes.json().error.code).toBe("DB_NOT_READY");

    await app.close();
  });

  it("returns HTTP 503 when db.healthCheck() throws an unhandled connection error", async () => {
    const repos = createMemoryRepositories();
    // Simulate database connection crash / timeout
    repos.healthCheck = async () => {
      throw new Error("Connection pool terminated unexpectedly");
    };

    const { app } = await createTestApp(repos);

    const res = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(res.statusCode).toBe(503);
    expect(res.json().success).toBe(false);
    expect(res.json().error.code).toBe("DB_NOT_READY");

    await app.close();
  });
});
