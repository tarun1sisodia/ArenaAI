import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";

describe("Network & Transport Protocol Headers (Technique 1)", () => {
  it("emits Alt-Svc header advertising HTTP/3 over QUIC", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["alt-svc"]).toBe('h3=":443"; ma=86400');
  });

  it("does not emit Timing-Allow-Origin header to prevent timing oracles (SEC-002)", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["timing-allow-origin"]).toBeUndefined();
  });

  it("maintains security and content-type headers alongside network headers", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["alt-svc"]).toBe('h3=":443"; ma=86400');
    expect(response.headers["timing-allow-origin"]).toBeUndefined();
  });

  it("allows the deployed admin Worker origin during CORS preflight", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/health",
      headers: {
        origin: "https://skbagheltravels-admin.coccoder999.workers.dev",
        "access-control-request-method": "GET",
        "access-control-request-headers": "accept,authorization",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://skbagheltravels-admin.coccoder999.workers.dev",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("denies an unknown origin without returning an internal server error", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/health",
      headers: {
        origin: "https://attacker.example",
        "access-control-request-method": "GET",
      },
    });

    expect(response.statusCode).not.toBe(500);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
