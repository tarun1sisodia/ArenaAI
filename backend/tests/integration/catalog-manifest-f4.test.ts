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

  it("published media replaces generic placeholder in manifest package image and invalidates ETag (Step 2.4 & 2.5)", async () => {
    const { app } = await createTestApp();

    // 1. Create and publish a tour package
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        type: "tour",
        title: "Fatehpur Sikri Royal Sunset Tour",
        slug: "fatehpur-sikri-royal-sunset-tour",
        startingPriceInr: 3400,
        shortDescription: "Exclusive evening excursion to Fatehpur Sikri",
        description: "Explore the Mughal architectural marvel at golden hour.",
        durationText: "5 hours",
        routeSummary: "Agra · Fatehpur Sikri · Agra",
      },
    });
    expect(createRes.statusCode).toBe(201);
    const item = createRes.json().data;

    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });

    // Initial manifest should have the package with default placeholder image
    const manifest1 = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    const etag1 = manifest1.headers.etag;
    const pkg1 = (manifest1.json().data.packages as any[]).find((p) => p.slug === "fatehpur-sikri-royal-sunset-tour");
    expect(pkg1).toBeDefined();
    expect(pkg1.image).toBe("/assets/packages/taj-dawn.webp");

    // 2. Attach a published cover image to the tour
    const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const mediaRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        dataBase64: tinyPng,
        mimeType: "image/png",
        altText: "Sunset view of Buland Darwaza",
      },
    });
    expect(mediaRes.statusCode).toBe(201);
    const media = mediaRes.json().data;

    // Manifest should now have the newly attached media URL as its image and a bumped ETag
    const manifest2 = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    const etag2 = manifest2.headers.etag;
    expect(etag2).not.toBe(etag1);

    const pkg2 = (manifest2.json().data.packages as any[]).find((p) => p.slug === "fatehpur-sikri-royal-sunset-tour");
    expect(pkg2.image).toBe(`/api/v1/media/${media.id}`);

    await app.close();
  });

  it("archived route in database is excluded from manifest routes and published route overrides fares (Step 2.1, 2.2, 2.3)", async () => {
    const { app } = await createTestApp();

    // Verify baseline route exists
    const manifest1 = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    const sampleSlug = Object.keys(manifest1.json().data.routes)[0]!;
    expect(manifest1.json().data.routes[sampleSlug]).toBeDefined();

    // 1. Create and archive sampleSlug in database
    const createArchived = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        type: "ride",
        slug: sampleSlug,
        title: "Archived Service",
        shortDescription: "Highway service",
        description: "Direct highway service",
        durationText: "3.5 hrs",
        routeSummary: "Agra · Delhi",
        startingPriceInr: 2500,
      },
    });
    expect(createArchived.statusCode).toBe(201);
    const archivedId = createArchived.json().data.id;
    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${archivedId}/archive`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });

    // 2. Create and publish a custom route with custom starting price
    const createPublished = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        type: "ride",
        slug: "agra-to-ranthambore",
        title: "Agra to Ranthambore Tiger Safari Corridor",
        shortDescription: "Direct wildlife route",
        description: "Direct wildlife route",
        durationText: "5.5 hrs",
        routeSummary: "Agra · Bharatpur · Ranthambore",
        startingPriceInr: 5800,
      },
    });
    expect(createPublished.statusCode).toBe(201);
    const publishedId = createPublished.json().data.id;
    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${publishedId}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });

    // Rebuild/check manifest
    await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog/republish",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {},
    });

    const manifest2 = await app.inject({ method: "GET", url: "/api/v1/catalog/manifest" });
    const routes = manifest2.json().data.routes;

    // Archived route MUST be excluded
    expect(routes[sampleSlug]).toBeUndefined();

    // Published custom route MUST be present with calculated fares based on DB starting price
    expect(routes["agra-to-ranthambore"]).toBeDefined();
    expect(routes["agra-to-ranthambore"].fs).toBe(5800);
    expect(routes["agra-to-ranthambore"].o).toBe("Agra");
    expect(routes["agra-to-ranthambore"].d).toBe("Ranthambore");

    await app.close();
  });
});
