import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";

describe("F4: Catalog Manifest & Admin CRUD Dynamic Invalidation", () => {
  it("GET /api/v1/catalog/manifest serves authoritative routes, packages, and vehicles with ETag", async () => {
    const { app } = await createTestApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/manifest",
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["cache-control"]).toContain("public");
    expect(res.headers.etag).toBeDefined();

    const body = res.json();
    expect(body.status).toBe("success");
    expect(body.data.version).toBeGreaterThanOrEqual(1);
    expect(body.data.updatedAt).toBeDefined();
    expect(body.data.routeCount).toBeGreaterThan(900);
    expect(body.data.packageCount).toBeGreaterThan(0);
    expect(body.data.routes).toBeDefined();
    expect(body.data.packages).toBeInstanceOf(Array);
    expect(body.data.vehicles).toBeInstanceOf(Array);

    // Verify Force vehicles in manifest have alwaysRoundTrip
    const tempo = body.data.vehicles.find((v: any) => v.id === "tempo");
    const urbania = body.data.vehicles.find((v: any) => v.id === "urbania");
    expect(tempo?.alwaysRoundTrip).toBe(true);
    expect(urbania?.alwaysRoundTrip).toBe(true);

    // Verify ETag 304 Not Modified response
    const etag = res.headers.etag as string;
    const cachedRes = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/manifest",
      headers: { "if-none-match": etag },
    });
    expect(cachedRes.statusCode).toBe(304);
  });

  it("strictly excludes unpublished ('draft') and 'archived' items from manifest", async () => {
    const { app } = await createTestApp();

    const manifestRes = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/manifest",
    });
    const initialPackages = manifestRes.json().data.packages as any[];

    // Ensure no draft or archived item exists in the manifest
    const draftFound = initialPackages.find((p) => p.status === "draft" || p.slug === "golden-triangle-luxury-4d3n");
    const archivedFound = initialPackages.find((p) => p.status === "archived" || p.slug === "national-chambal-sanctuary-safari");
    expect(draftFound).toBeUndefined();
    expect(archivedFound).toBeUndefined();
  });

  it("admin publish adds package to manifest, archive removes it, and version increments", async () => {
    const { app } = await createTestApp();

    const initialRes = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/manifest",
    });
    const initialVersion = initialRes.json().data.version as number;
    const initialEtag = initialRes.headers.etag as string;

    // 1. Create a new draft package
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        type: "package",
        slug: "agra-wildlife-and-heritage-tour",
        title: "Agra Wildlife & Heritage Expedition",
        shortDescription: "Exclusive 2-day tour covering Taj Mahal, Agra Fort, and Chambal River.",
        description: "Full itinerary with dedicated luxury vehicle and expert naturalist guidance.",
        durationText: "2 Days / 1 Night",
        routeSummary: "Agra · Taj Mahal · Chambal Sanctuary · Agra",
        startingPriceInr: 9500,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const createdId = createRes.json().data.id;

    // Draft MUST NOT appear in the manifest
    const manifestAfterDraft = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    const packagesAfterDraft = manifestAfterDraft.json().data.packages as any[];
    expect(packagesAfterDraft.some((p) => p.slug === "agra-wildlife-and-heritage-tour")).toBe(false);

    // 2. Publish the package
    const publishRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${createdId}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });
    expect(publishRes.statusCode).toBe(200);

    // Manifest MUST now include the newly published package with correct price & updated version
    const manifestAfterPublish = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    expect(manifestAfterPublish.statusCode).toBe(200);
    const bodyAfterPublish = manifestAfterPublish.json().data;
    expect(bodyAfterPublish.version).toBeGreaterThan(initialVersion);
    expect(manifestAfterPublish.headers.etag).not.toBe(initialEtag);

    const publishedItem = bodyAfterPublish.packages.find((p: any) => p.slug === "agra-wildlife-and-heritage-tour");
    expect(publishedItem).toBeDefined();
    expect(publishedItem.from).toBe(9500);
    expect(publishedItem.title).toBe("Agra Wildlife & Heritage Expedition");
    expect(publishedItem.status).toBe("published");

    // 3. Archive the package
    const archiveRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${createdId}/archive`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });
    expect(archiveRes.statusCode).toBe(200);

    // Manifest MUST no longer include the archived package
    const manifestAfterArchive = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    const packagesAfterArchive = manifestAfterArchive.json().data.packages as any[];
    expect(packagesAfterArchive.some((p) => p.slug === "agra-wildlife-and-heritage-tour")).toBe(false);
  });

  it("admin republish endpoint forces manifest regeneration, bumps version, and records audit trail", async () => {
    const { app } = await createTestApp();

    // Check status endpoint
    const statusRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/catalog/manifest/status",
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(statusRes.statusCode).toBe(200);
    const prevVersion = statusRes.json().data.version as number;

    // Trigger republish
    const republishRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog/republish",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });

    expect(republishRes.statusCode).toBe(200);
    const body = republishRes.json().data;
    expect(body.version).toBeGreaterThan(prevVersion);
    expect(body.updatedAt).toBeDefined();
    expect(body.routeCount).toBeGreaterThan(900);
    expect(body.packageCount).toBeGreaterThan(0);

    // Check audit logs for republish
    const auditRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/audit-logs",
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(auditRes.statusCode).toBe(200);
    const auditLogs = auditRes.json().data as any[];
    const republishLog = auditLogs.find((log) => log.action === "republish");
    expect(republishLog).toBeDefined();
    expect(republishLog.resourceType).toBe("catalog_manifest");
  });
});
