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

  it("emits Timing-Allow-Origin header for browser RUM", async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["timing-allow-origin"]).toBe("*");
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
    expect(response.headers["timing-allow-origin"]).toBe("*");
  });
});
