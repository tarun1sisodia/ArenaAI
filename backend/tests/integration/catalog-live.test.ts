import { describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";

const AUTH = { authorization: "Bearer test-super_admin" } as const;

/** 1×1 transparent PNG, base64-encoded — a valid inline upload payload. */
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function createItem(
  app: Awaited<ReturnType<typeof createTestApp>>["app"],
  overrides: Record<string, unknown> = {},
) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/ops/admin/catalog",
    headers: AUTH,
    payload: {
      type: "tour",
      slug: `live-tour-${Date.now().toString(36)}`,
      title: "Live Sunset Tour",
      shortDescription: "A sunset tour published from the desk.",
      durationText: "4 hrs",
      routeSummary: "Agra · Mehtab Bagh · Agra",
      startingPriceInr: 2500,
      ...overrides,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().data as Record<string, unknown>;
}

describe("live catalog — single source of trips", () => {
  it("lists only published items on the public endpoint with trip fields and filters", async () => {
    const { app } = await createTestApp();

    const unauth = await app.inject({ method: "GET", url: "/api/v1/catalog" });
    expect(unauth.statusCode).toBe(200);
    const initial = unauth.json().data as Array<Record<string, unknown>>;
    expect(initial.length).toBeGreaterThan(0);
    for (const item of initial) {
      expect(item.status).toBeUndefined(); // status is never leaked publicly
      expect(item.availability).toBeDefined();
      expect(Array.isArray(item.stops)).toBe(true);
    }

    // Seeded famous place carries a multi-image gallery.
    const place = initial.find((i) => i.slug === "taj-mahal");
    expect(place).toBeDefined();
    expect(place?.type).toBe("place");
    expect((place?.gallery as unknown[]).length).toBeGreaterThanOrEqual(3);
    expect(place?.coverImage).toMatchObject({ url: "/assets/places/agra-taj-mahal.webp" });

    // Draft items must never appear.
    expect(initial.find((i) => i.slug === "golden-triangle-luxury-4d3n")).toBeUndefined();

    // Type + tripType filters.
    const placesOnly = await app.inject({ method: "GET", url: "/api/v1/catalog?type=place" });
    const places = placesOnly.json().data as Array<Record<string, unknown>>;
    expect(places.length).toBeGreaterThan(0);
    expect(places.every((p) => p.type === "place")).toBe(true);

    const oneWay = await app.inject({ method: "GET", url: "/api/v1/catalog?tripType=one-way" });
    const rides = oneWay.json().data as Array<Record<string, unknown>>;
    expect(rides.every((r) => r.tripType === "one-way")).toBe(true);
    expect(rides.find((r) => r.slug === "delhi-to-agra-one-way")).toBeDefined();
    await app.close();
  });

  it("round-trips the full commercial CRUD fields and reflects edits publicly", async () => {
    const { app } = await createTestApp();
    const created = await createItem(app, {
      distanceKm: 85,
      availability: "limited",
      seatsLeft: 2,
      stops: ["Taj Mahal", "Mehtab Bagh", "Agra Fort"],
      tripType: "local-tour",
    });
    expect(created.distanceKm).toBe(85);
    expect(created.availability).toBe("limited");
    expect(created.seatsLeft).toBe(2);
    expect(created.stops).toEqual(["Taj Mahal", "Mehtab Bagh", "Agra Fort"]);
    expect(created.tripType).toBe("local-tour");

    // Not public while draft.
    const draftList = await app.inject({ method: "GET", url: "/api/v1/catalog" });
    expect(
      (draftList.json().data as Array<Record<string, unknown>>).find((i) => i.slug === created.slug),
    ).toBeUndefined();

    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${created.id}/publish`,
      headers: AUTH,
    });

    // Appears automatically once published.
    const publishedList = await app.inject({ method: "GET", url: "/api/v1/catalog" });
    const listed = (publishedList.json().data as Array<Record<string, unknown>>).find(
      (i) => i.slug === created.slug,
    );
    expect(listed).toBeDefined();

    // Update price / distance / availability / stops / type.
    const updated = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/catalog/${created.id}`,
      headers: AUTH,
      payload: {
        title: "Live Sunset Tour Deluxe",
        startingPriceInr: 3100,
        distanceKm: 95,
        availability: "unavailable",
        seatsLeft: null,
        stops: ["Taj Mahal", "Mehtab Bagh"],
        type: "package",
      },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.startingPriceInr).toBe(3100);
    expect(updated.json().data.availability).toBe("unavailable");

    const detail = await app.inject({ method: "GET", url: `/api/v1/catalog/${created.slug}` });
    expect(detail.statusCode).toBe(404);

    // Admin editor detail includes the media list.
    const adminDetail = await app.inject({
      method: "GET",
      url: `/api/v1/ops/admin/catalog/${created.id}`,
      headers: AUTH,
    });
    expect(adminDetail.statusCode).toBe(200);
    expect(Array.isArray(adminDetail.json().data.media)).toBe(true);
    expect(adminDetail.json().data.status).toBe("published");

    // Archiving removes it from the public listing.
    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${created.id}/archive`,
      headers: AUTH,
    });
    const afterArchive = await app.inject({ method: "GET", url: "/api/v1/catalog" });
    expect(
      (afterArchive.json().data as Array<Record<string, unknown>>).find((i) => i.slug === created.slug),
    ).toBeUndefined();
    await app.close();
  });

  it("enforces the image policy: one cover image except for Famous Places & Monuments", async () => {
    const { app } = await createTestApp();
    const tour = await createItem(app);

    const first = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${tour.id}/media`,
      headers: AUTH,
      payload: {
        dataBase64: TINY_PNG_BASE64,
        mimeType: "image/png",
        altText: "Sunset over Mehtab Bagh",
      },
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().data.status).toBe("published");
    expect(first.json().data.storagePath).toBe(`/api/v1/media/${first.json().data.id}`);

    // Second image on a non-place category → rejected.
    const second = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${tour.id}/media`,
      headers: AUTH,
      payload: {
        dataBase64: TINY_PNG_BASE64,
        mimeType: "image/png",
        altText: "Another cover attempt",
      },
    });
    expect(second.statusCode).toBe(422);
    expect(second.json().error.code).toBe("MEDIA_LIMIT_REACHED");

    // A place (Famous Places & Monuments) accepts a multi-image gallery.
    const place = await createItem(app, { type: "place", slug: `famous-place-${Date.now().toString(36)}` });
    for (let i = 0; i < 3; i += 1) {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ops/admin/catalog/${place.id}/media`,
        headers: AUTH,
        payload: { dataBase64: TINY_PNG_BASE64, mimeType: "image/png", altText: `Gallery photo ${i + 1}` },
      });
      expect(res.statusCode).toBe(201);
    }
    const gallery = await app.inject({
      method: "GET",
      url: `/api/v1/ops/admin/catalog/${place.id}`,
      headers: AUTH,
    });
    expect(gallery.json().data.media).toHaveLength(3);
    await app.close();
  });

  it("stores and serves inline media uploads with immutable caching", async () => {
    const { app } = await createTestApp();
    const item = await createItem(app);

    const upload = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { dataBase64: TINY_PNG_BASE64, mimeType: "image/png", altText: "Cover upload test" },
    });
    expect(upload.statusCode).toBe(201);
    const media = upload.json().data as Record<string, unknown>;
    // Anonymous access to draft item's media is rejected (SEC-004)
    const draftAnon = await app.inject({ method: "GET", url: `/api/v1/media/${media.id}` });
    expect(draftAnon.statusCode).toBe(404);

    // Authenticated staff can preview draft media
    const draftAuth = await app.inject({ method: "GET", url: `/api/v1/media/${media.id}`, headers: AUTH });
    expect(draftAuth.statusCode).toBe(200);
    expect(draftAuth.headers["cache-control"]).toContain("no-cache");

    // Once catalog item is published, media is publicly served with immutable cache
    await app.inject({ method: "POST", url: `/api/v1/ops/admin/catalog/${item.id}/publish`, headers: AUTH });

    const served = await app.inject({ method: "GET", url: `/api/v1/media/${media.id}` });
    expect(served.statusCode).toBe(200);
    expect(served.headers["content-type"]).toBe("image/png");
    expect(served.headers["cache-control"]).toContain("immutable");
    expect(Buffer.from(served.rawPayload).toString("base64")).toBe(TINY_PNG_BASE64);

    // Unknown media → 404, no auth required to read bytes.
    const missing = await app.inject({ method: "GET", url: "/api/v1/media/00000000-0000-4000-a000-000000000099" });
    expect(missing.statusCode).toBe(404);

    // Deleting the media removes it and frees the cover slot.
    const del = await app.inject({
      method: "DELETE",
      url: `/api/v1/ops/admin/media/${media.id}`,
      headers: AUTH,
    });
    expect(del.statusCode).toBe(200);
    const gone = await app.inject({ method: "GET", url: `/api/v1/media/${media.id}` });
    expect(gone.statusCode).toBe(404);

    const reupload = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { dataBase64: TINY_PNG_BASE64, mimeType: "image/png", altText: "Replacement cover" },
    });
    expect(reupload.statusCode).toBe(201);
    await app.close();
  });

  it("guards the admin catalog/media endpoints and validates uploads", async () => {
    const { app } = await createTestApp();
    const unauth = await app.inject({ method: "GET", url: "/api/v1/ops/admin/catalog/some-id" });
    expect(unauth.statusCode).toBe(401);

    const unauthDelete = await app.inject({
      method: "DELETE",
      url: "/api/v1/ops/admin/media/00000000-0000-4000-a000-000000000099",
    });
    expect(unauthDelete.statusCode).toBe(401);

    const item = await createItem(app);

    // Neither storagePath nor dataBase64 → validation error.
    const neither = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { altText: "Missing source" },
    });
    expect(neither.statusCode).toBe(400);

    // Uploads without a whitelisted mime type are rejected.
    const badMime = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { dataBase64: TINY_PNG_BASE64, mimeType: "image/svg+xml", altText: "SVG attempt" },
    });
    expect(badMime.statusCode).toBe(400);

    // Alt text is mandatory (a11y / GEO image alt rule).
    const noAlt = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { dataBase64: TINY_PNG_BASE64, mimeType: "image/png" },
    });
    expect(noAlt.statusCode).toBe(400);
    await app.close();
  });

  it("accepts image uploads larger than the global 1MB body guard on the media route", async () => {
    const { app } = await createTestApp();
    const item = await createItem(app);
    // ~1.4M base64 chars → ~1.05MB decoded. Valid base64, under the 2.5MB cap,
    // but above the global 1MB bodyLimit — only the route-level override lets it through.
    const bigImage = "A".repeat(1_400_000);
    const upload = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { dataBase64: bigImage, mimeType: "image/png", altText: "Large gallery photo upload" },
    });
    expect(upload.statusCode).toBe(201);
    expect(upload.json().data.sizeBytes).toBe(Buffer.from(bigImage, "base64").length);

    // Oversized (>2.5MB decoded) uploads are rejected (schema refinement or
    // body limit, whichever trips first).
    const tooBig = "A".repeat(3_400_000);
    const rejected = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: AUTH,
      payload: { dataBase64: tooBig, mimeType: "image/png", altText: "Oversized upload attempt" },
    });
    expect([400, 413]).toContain(rejected.statusCode);
    await app.close();
  });

  it("exposes the live fleet from the active fare rules", async () => {
    const { app } = await createTestApp();
    const fleet = await app.inject({ method: "GET", url: "/api/v1/fleet" });
    expect(fleet.statusCode).toBe(200);
    const data = fleet.json().data as { version: string; vehicles: Array<Record<string, unknown>> };
    expect(data.vehicles.length).toBeGreaterThanOrEqual(5);
    const firstVehicle = data.vehicles[0] as Record<string, unknown> | undefined;
    expect(firstVehicle).toMatchObject({ tier: "sedan", active: true });
    expect(typeof firstVehicle?.perKm).toBe("number");

    // Desk-side deactivation hides the vehicle from the public fleet.
    const update = await app.inject({
      method: "PUT",
      url: "/api/v1/ops/admin/fare-rules",
      headers: AUTH,
      payload: {
        vehicles: [
          { tier: "sedan", name: "Sedan", seats: 4, perKm: 11, active: false },
          { tier: "ertiga", name: "Ertiga", seats: 6, perKm: 14, active: true },
          { tier: "innova-crysta", name: "Innova Crysta", seats: 6, perKm: 18, active: true },
          { tier: "tempo-traveller", name: "Tempo Traveller", seats: 12, perKm: 25, active: true },
          { tier: "urbania", name: "Force Urbania", seats: 16, perKm: 34, active: true },
        ],
      },
    });
    expect(update.statusCode).toBe(200);

    const updatedFleet = await app.inject({ method: "GET", url: "/api/v1/fleet" });
    const vehicles = (updatedFleet.json().data as { vehicles: Array<Record<string, unknown>> }).vehicles;
    const sedan = vehicles.find((v) => v.tier === "sedan");
    expect(sedan).toMatchObject({ active: false, perKm: 11, name: "Sedan" });
    await app.close();
  });
});
