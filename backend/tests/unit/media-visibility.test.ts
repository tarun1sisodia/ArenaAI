import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";

const AUTH = { authorization: "Bearer test-super_admin" } as const;
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("SEC-004: Public Media Visibility Enforcement", () => {
  it("rejects anonymous requests for draft catalog item media", async () => {
    const { app } = await createTestApp();

    // 1. Create a draft tour item
    const itemRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: AUTH,
      payload: {
        type: "tour",
        slug: "secret-unpublished-tour",
        title: "Secret Unpublished Tour",
        shortDescription: "Internal tour not ready for launch",
        durationText: "2 hrs",
        routeSummary: "Agra · Sikandra",
        startingPriceInr: 1500,
      },
    });
    expect(itemRes.statusCode).toBe(201);
    const item = itemRes.json().data;

    // 2. Attach an image to the draft item
    const mediaRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: {
        dataBase64: TINY_PNG_BASE64,
        mimeType: "image/png",
        altText: "Secret tour preview image",
      },
    });
    expect(mediaRes.statusCode).toBe(201);
    const mediaId = mediaRes.json().data.id;

    // 3. Anonymous request MUST return 404 (no leak of draft media)
    const anonRes = await app.inject({
      method: "GET",
      url: `/api/v1/media/${mediaId}`,
    });
    expect(anonRes.statusCode).toBe(404);
    expect(anonRes.json().error.code).toBe("MEDIA_NOT_FOUND");

    // 4. Authenticated admin request MUST succeed with private cache
    const authRes = await app.inject({
      method: "GET",
      url: `/api/v1/media/${mediaId}`,
      headers: AUTH,
    });
    expect(authRes.statusCode).toBe(200);
    expect(authRes.headers["content-type"]).toBe("image/png");
    expect(authRes.headers["cache-control"]).toContain("no-cache");

    // 5. Publish the catalog item → anonymous request now succeeds with immutable cache
    const pubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: AUTH,
    });
    expect(pubRes.statusCode).toBe(200);

    const anonAfterPub = await app.inject({
      method: "GET",
      url: `/api/v1/media/${mediaId}`,
    });
    expect(anonAfterPub.statusCode).toBe(200);
    expect(anonAfterPub.headers["cache-control"]).toContain("immutable");

    // 6. Archive the catalog item → anonymous request returns 404 again
    const archRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/archive`,
      headers: AUTH,
    });
    expect(archRes.statusCode).toBe(200);

    const anonAfterArch = await app.inject({
      method: "GET",
      url: `/api/v1/media/${mediaId}`,
    });
    expect(anonAfterArch.statusCode).toBe(404);

    await app.close();
  });

  it("rejects anonymous requests when media itself is archived even if parent is published", async () => {
    const { app, db } = await createTestApp();

    // 1. Create and publish a tour item
    const itemRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: AUTH,
      payload: {
        type: "tour",
        slug: "published-tour-archived-media",
        title: "Published Tour",
        shortDescription: "Published tour description",
        durationText: "3 hrs",
        routeSummary: "Agra · Fatehpur Sikri",
        startingPriceInr: 2000,
      },
    });
    const item = itemRes.json().data;

    const mediaRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: {
        dataBase64: TINY_PNG_BASE64,
        mimeType: "image/png",
        altText: "Tour photo",
      },
    });
    const mediaId = mediaRes.json().data.id;

    // Publish the tour
    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: AUTH,
    });

    // Verify it is publicly accessible
    const public1 = await app.inject({ method: "GET", url: `/api/v1/media/${mediaId}` });
    expect(public1.statusCode).toBe(200);

    // Set media status to 'archived' in repository
    const mediaRecord = await db.media.getById(mediaId);
    expect(mediaRecord).not.toBeNull();
    if (mediaRecord) {
      await db.media.update({ ...mediaRecord, status: "archived" });
    }

    // Anonymous request MUST now return 404
    const public2 = await app.inject({ method: "GET", url: `/api/v1/media/${mediaId}` });
    expect(public2.statusCode).toBe(404);

    await app.close();
  });

  it("returns 404 for unknown media IDs regardless of auth", async () => {
    const { app } = await createTestApp();
    const unknownId = "00000000-0000-4000-a000-000000000099";

    const anon = await app.inject({ method: "GET", url: `/api/v1/media/${unknownId}` });
    expect(anon.statusCode).toBe(404);

    const authed = await app.inject({ method: "GET", url: `/api/v1/media/${unknownId}`, headers: AUTH });
    expect(authed.statusCode).toBe(404);

    await app.close();
  });
});
