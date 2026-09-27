import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { createLocationService } from "../../src/modules/locations/location.service.js";
import type { GeocodingProvider } from "../../src/providers/GeocodingProvider.js";

describe("Backend LocationIQ Proxy & Cache (Phase 3 — Step 3.1)", () => {
  it("rejects invalid queries with 400 (too short, too long, script injection)", async () => {
    const { app } = await createTestApp();

    // Too short (< 2 characters)
    const shortRes = await app.inject({
      method: "GET",
      url: "/api/v1/locations/autocomplete?q=a",
    });
    expect(shortRes.statusCode).toBe(400);
    expect(shortRes.json().success).toBe(false);

    // Too long (> 80 characters)
    const longRes = await app.inject({
      method: "GET",
      url: `/api/v1/locations/autocomplete?q=${"x".repeat(85)}`,
    });
    expect(longRes.statusCode).toBe(400);
    expect(longRes.json().success).toBe(false);

    // XSS injection
    const xssRes = await app.inject({
      method: "GET",
      url: "/api/v1/locations/autocomplete?q=<script>alert(1)</script>",
    });
    expect(xssRes.statusCode).toBe(400);
    expect(xssRes.json().success).toBe(false);

    await app.close();
  });

  it("serves static fallback places when LocationIQ token is not configured", async () => {
    const { app } = await createTestApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/locations/autocomplete?q=gurugram",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(["provider", "fallback"]).toContain(body.data.source);
    expect(Array.isArray(body.data.suggestions)).toBe(true);
    expect(body.data.suggestions.length).toBeGreaterThan(0);

    const first = body.data.suggestions[0];
    expect(first).toHaveProperty("placeId");
    expect(first).toHaveProperty("displayName");
    expect(first.country).toBe("India");

    await app.close();
  });

  it("caches geocoded results in locationCache and serves subsequent requests from cache", async () => {
    const db = createMemoryRepositories();
    let providerCalls = 0;

    const mockProvider: GeocodingProvider = {
      async autocomplete(query: string) {
        providerCalls += 1;
        return [
          {
            placeId: "loc-test-123",
            displayName: `Mocked Place for ${query}`,
            city: "Agra",
            state: "Uttar Pradesh",
            country: "India",
            lat: 27.1751,
            lon: 78.0421,
          },
        ];
      },
    };

    const locationService = createLocationService({
      db,
      clock: { now: () => new Date("2026-09-28T10:00:00Z") },
      geocoding: mockProvider,
    });

    // First call -> calls provider
    const res1 = await locationService.autocomplete("fatehpur sikri");
    expect(res1.source).toBe("provider");
    expect(res1.suggestions.length).toBe(1);
    expect(res1.suggestions[0]!.displayName).toBe("Mocked Place for fatehpur sikri");
    expect(providerCalls).toBe(1);

    // Verify written to database cache
    const cachedEntry = await db.locationCache.get("fatehpur sikri");
    expect(cachedEntry).not.toBeNull();
    expect(cachedEntry?.suggestions[0]!.placeId).toBe("loc-test-123");

    // Second call -> returns from cache, providerCalls remains 1
    const res2 = await locationService.autocomplete("fatehpur sikri");
    expect(res2.source).toBe("cache");
    expect(res2.suggestions.length).toBe(1);
    expect(res2.suggestions[0]!.placeId).toBe("loc-test-123");
    expect(providerCalls).toBe(1);
  });

  it("sanitizes HTML in suggestions and bounds result size to at most 8 items", async () => {
    const db = createMemoryRepositories();
    const mockProvider: GeocodingProvider = {
      async autocomplete() {
        return Array.from({ length: 15 }, (_, i) => ({
          placeId: `id-${i}`,
          displayName: `<b>Location ${i}</b> <script>alert(1)</script>`,
          city: "Agra",
          state: "UP",
          country: "India",
          lat: 27.0 + i * 0.01,
          lon: 78.0 + i * 0.01,
        }));
      },
    };

    const locationService = createLocationService({
      db,
      clock: { now: () => new Date("2026-09-28T10:00:00Z") },
      geocoding: mockProvider,
    });

    const res = await locationService.autocomplete("custom location");
    expect(res.source).toBe("provider");
    // Bounded to 8 items
    expect(res.suggestions.length).toBe(8);
    // HTML tags stripped
    expect(res.suggestions[0]!.displayName).not.toContain("<b>");
    expect(res.suggestions[0]!.displayName).not.toContain("<script>");
    expect(res.suggestions[0]!.displayName).toContain("Location 0 alert(1)");
  });

  it("falls back to static places when provider throws an error", async () => {
    const db = createMemoryRepositories();
    const failingProvider: GeocodingProvider = {
      async autocomplete() {
        throw new Error("Upstream LocationIQ timeout / network error");
      },
    };

    const locationService = createLocationService({
      db,
      clock: { now: () => new Date("2026-09-28T10:00:00Z") },
      geocoding: failingProvider,
    });

    // When query matches curated catalog (e.g. Taj Mahal)
    const res = await locationService.autocomplete("Taj Mahal");
    expect(res.source).toBe("fallback");
    expect(res.suggestions.length).toBeGreaterThan(0);
    expect(res.suggestions[0]!.displayName).toContain("Taj Mahal");

    // When query matches nothing in curated catalog, throws unavailable
    await expect(locationService.autocomplete("Unobtainium Planet Mars")).rejects.toThrow(
      "Location suggestions are temporarily unavailable",
    );
  });
});
