// backend/tests/integration/dossier-manifest-modules.test.ts
import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";

describe("Dossier Content Modules & Manifest Endpoints", () => {
  it("GET /api/v1/content/manifest returns combined small entities", async () => {
    const { app } = await createTestApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/content/manifest",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("cancellationPolicies");
    expect(body.data).toHaveProperty("monuments");
    expect(body.data).toHaveProperty("petPolicy");
    expect(body.data).toHaveProperty("companyProfile");
    expect(body.data).toHaveProperty("dossierSignoffs");

    expect(body.data.cancellationPolicies.length).toBe(9);
    expect(body.data.monuments.length).toBe(10);
    expect(body.data.petPolicy.isOffered).toBe(false);
    expect(body.data.companyProfile.primaryPhone).toBe("+91 97628 17598");
    expect(body.data.dossierSignoffs.length).toBe(10);
  });

  it("manifest endpoints filter out draft packages/routes by default", async () => {
    const { app } = await createTestApp();

    const [tourRes, transferRes, localRes] = await Promise.all([
      app.inject({ method: "GET", url: "/api/v1/tour-packages/manifest" }),
      app.inject({ method: "GET", url: "/api/v1/transfer-routes/manifest" }),
      app.inject({ method: "GET", url: "/api/v1/local-packages/manifest" }),
    ]);

    expect(tourRes.statusCode).toBe(200);
    expect(tourRes.json().success).toBe(true);
    expect(tourRes.json().data).toEqual([]); // All seeded as draft

    expect(transferRes.statusCode).toBe(200);
    expect(transferRes.json().success).toBe(true);
    expect(transferRes.json().data).toEqual([]); // All seeded as draft

    expect(localRes.statusCode).toBe(200);
    expect(localRes.json().success).toBe(true);
    expect(localRes.json().data).toEqual([]); // All seeded as draft
  });

  it("admin can publish tour package and it appears in manifest with upgrades", async () => {
    const { app } = await createTestApp();
    const adminHeaders = { authorization: "Bearer test-super_admin" };

    // List draft packages
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/tour-packages",
      headers: adminHeaders,
    });
    expect(listRes.statusCode).toBe(200);
    const packages = listRes.json().data.items;
    expect(packages.length).toBeGreaterThan(0);
    const target = packages[0];

    // Publish package
    const pubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/tour-packages/${target.id}/publish`,
      headers: adminHeaders,
    });
    expect(pubRes.statusCode).toBe(200);
    expect(pubRes.json().data.status).toBe("published");

    // Manifest now contains it with upgrades
    const manifestRes = await app.inject({
      method: "GET",
      url: "/api/v1/tour-packages/manifest",
    });
    expect(manifestRes.statusCode).toBe(200);
    const manifestItems = manifestRes.json().data;
    expect(manifestItems.length).toBe(1);
    expect(manifestItems[0].packageCode).toBe(target.packageCode);
    expect(manifestItems[0].upgrades).toBeInstanceOf(Array);
    expect(manifestItems[0].upgrades.length).toBeGreaterThanOrEqual(4); // 4 global upgrades

    // Detail by code
    const detailRes = await app.inject({
      method: "GET",
      url: `/api/v1/tour-packages/by-code/${target.packageCode}`,
    });
    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.json().data.upgrades).toBeInstanceOf(Array);
  });

  it("admin can publish transfer route and it appears in manifest", async () => {
    const { app } = await createTestApp();
    const adminHeaders = { authorization: "Bearer test-super_admin" };

    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/transfer-routes",
      headers: adminHeaders,
    });
    const target = listRes.json().data.items[0];

    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/transfer-routes/${target.id}/publish`,
      headers: adminHeaders,
    });

    const manifestRes = await app.inject({
      method: "GET",
      url: "/api/v1/transfer-routes/manifest",
    });
    expect(manifestRes.statusCode).toBe(200);
    const items = manifestRes.json().data;
    expect(items.length).toBe(1);
    expect(items[0].routeCode).toBe(target.routeCode);
  });

  it("admin can publish local package and it appears in manifest", async () => {
    const { app } = await createTestApp();
    const adminHeaders = { authorization: "Bearer test-super_admin" };

    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/local-packages",
      headers: adminHeaders,
    });
    const target = listRes.json().data.items[0];

    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/local-packages/${target.id}/publish`,
      headers: adminHeaders,
    });

    const manifestRes = await app.inject({
      method: "GET",
      url: "/api/v1/local-packages/manifest",
    });
    expect(manifestRes.statusCode).toBe(200);
    const items = manifestRes.json().data;
    expect(items.length).toBe(1);
    expect(items[0].packageCode).toBe(target.packageCode);
  });

  it("enforces junk slug validation against command, double dash, and btn prefix", async () => {
    const { app } = await createTestApp();
    const adminHeaders = { authorization: "Bearer test-super_admin" };

    const badSlugs = ["12-btn-click", "test--package", "run-command-now"];

    for (const badSlug of badSlugs) {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ops/admin/tour-packages",
        headers: adminHeaders,
        payload: {
          package_code: badSlug,
          name: "Invalid Slug Tour",
          duration_text: "1 Day",
          days: 1,
          nights: 0,
          starting_price_inr: 1500,
          fleet_prices: { sedan: 1500 },
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("updating all dossier signoffs to approved synchronizes company profile dossier status", async () => {
    const { app } = await createTestApp();
    const adminHeaders = { authorization: "Bearer test-super_admin" };

    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/dossier-signoffs",
      headers: adminHeaders,
    });
    const signoffs = listRes.json().data;
    expect(signoffs.length).toBe(10);

    // Approve all 10
    for (const s of signoffs) {
      const updateRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/ops/admin/dossier-signoffs/${s.id}`,
        headers: adminHeaders,
        payload: {
          status: "approved",
          client_notes: "Approved by client during review",
        },
      });
      expect(updateRes.statusCode).toBe(200);
    }

    // Check company profile
    const profileRes = await app.inject({
      method: "GET",
      url: "/api/v1/company-profile",
    });
    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.json().data.dossierStatus).toBe("signed_off");
  });

  it("admin check-code handles arbitrary non-UUID text slugs without PostgreSQL error", async () => {
    const { app } = await createTestApp();
    const adminHeaders = { authorization: "Bearer test-super_admin" };

    const checkRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/tour-packages/check-code?code=delhi-to-bijnor-same-day-tour",
      headers: adminHeaders,
    });
    expect(checkRes.statusCode).toBe(200);
    expect(checkRes.json()).toEqual({ success: true, data: { available: true } });

    // Create the package
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/tour-packages",
      headers: adminHeaders,
      payload: {
        package_code: "delhi-to-bijnor-same-day-tour",
        name: "Delhi to Bijnor Same Day Tour",
        duration_text: "Same Day (12h)",
        days: 1,
        nights: 0,
        base_tier_code: "sedan",
        starting_price_inr: 4500,
        fleet_prices: { sedan: 4500, ertiga: 5500, innova: 7000, tempo: 10000, urbania: 14000 },
        source: "Delhi",
        destination: "Bijnor",
        inclusions: ["AC Commercial Vehicle", "Fuel & Tolls"],
        exclusions: ["Monument Entry"],
        itinerary: [{ title: "Delhi Departure", desc: "Early morning pickup from Delhi." }],
        status: "published",
        is_active: true,
      },
    });
    expect(createRes.statusCode).toBe(201);
    expect(createRes.json().success).toBe(true);

    // Check code again
    const checkAgainRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/tour-packages/check-code?code=delhi-to-bijnor-same-day-tour",
      headers: adminHeaders,
    });
    expect(checkAgainRes.statusCode).toBe(200);
    expect(checkAgainRes.json()).toEqual({ success: true, data: { available: false } });
  });
});
