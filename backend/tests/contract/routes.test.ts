import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft } from "../helpers.js";

describe("API contract", () => {
  it("exposes health and ready endpoints", async () => {
    const { app } = await createTestApp();
    const health = await app.inject({ method: "GET", url: "/health" });
    const ready = await app.inject({ method: "GET", url: "/ready" });
    expect(health.statusCode).toBe(200);
    expect(health.json().success).toBe(true);
    expect(ready.json().data.status).toBe("ready");
    await app.close();
  });

  it("validates fare requests and returns the envelope", async () => {
    const { app } = await createTestApp();
    const bad = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: { tripType: "one-way" },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.code).toBe("VALIDATION_ERROR");
    expect(bad.json().error.requestId).toBeTruthy();

    const ok = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: {
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        distanceKm: 230,
      },
    });
    expect(ok.json().success).toBe(true);
    expect(ok.json().data).toMatchObject({
      currency: "INR",
      fareVersion: "2026-09-13",
    });
    const okWithoutDistance = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: {
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    expect(okWithoutDistance.statusCode).toBe(200);
    expect(okWithoutDistance.json().success).toBe(true);
    expect(okWithoutDistance.json().data.distanceKm).toBe(230);
    expect(okWithoutDistance.json().data.totalFare).toBeGreaterThan(0);

    await app.close();
  });

  it("requires booking verification on voucher reads and rejects last4 bypass", async () => {
    const { app } = await createTestApp();
    const draft = await app.inject({ method: "POST", url: "/api/v1/bookings/draft", payload: sampleDraft });
    expect(draft.statusCode).toBe(201);
    const ticketId = draft.json().data.ticketId as string;
    const denied = await app.inject({ method: "GET", url: `/api/v1/bookings/${ticketId}` });
    expect(denied.statusCode).toBe(401);
    // Last4 should now be rejected for security
    const last4Attempt = await app.inject({ method: "GET", url: `/api/v1/bookings/${ticketId}?phone=3221` });
    expect(last4Attempt.statusCode).toBe(400);
    // Full phone should succeed but with masked data
    const phone = await app.inject({ method: "GET", url: `/api/v1/bookings/${ticketId}?phone=9876543221` });
    expect(phone.statusCode).toBe(200);
    expect(phone.json().data.customerPhone).toContain("*");
    await app.close();
  });

  it("rate-limits inquiries conceptually via 201 on first post", async () => {
    const { app } = await createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/inquiries",
      payload: {
        name: "Rahul",
        phone: "9876543210",
        message: "Need a custom Golden Triangle itinerary for 8 people.",
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().success).toBe(true);
    await app.close();
  });

  it("lists locations from the static catalog when LocationIQ is unset", async () => {
    const { app } = await createTestApp();
    const res = await app.inject({ method: "GET", url: "/api/v1/locations/autocomplete?q=agra" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.suggestions.length).toBeGreaterThan(0);
    await app.close();
  });

  it("rejects past pickup datetimes", async () => {
    const { app } = await createTestApp();
    const past = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: { ...sampleDraft, pickupDatetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    });
    expect(past.statusCode).toBe(400);
    await app.close();
  });

  it("rejects XSS in special notes", async () => {
    const { app } = await createTestApp();
    const xss = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: { ...sampleDraft, specialNotes: "<script>alert(1)</script>" },
    });
    expect(xss.statusCode).toBe(400);
    await app.close();
  });

  it("enforces role guards and transitions booking status via admin transition endpoint", async () => {
    const { app } = await createTestApp();
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: sampleDraft,
    });
    expect(draftRes.statusCode).toBe(201);
    const bookingId = draftRes.json().data.bookingId as string;

    // 1. Unauthenticated -> 401
    const unauth = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      payload: { to: "paid_confirmed" },
    });
    expect(unauth.statusCode).toBe(401);

    // 2. Customer role -> 403 Forbidden
    const forbidden = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-customer" },
      payload: { to: "paid_confirmed" },
    });
    expect(forbidden.statusCode).toBe(403);

    // 3. Super admin -> 200 OK (pending_payment -> paid_confirmed)
    const step1 = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: { to: "paid_confirmed", expectedVersion: 1 },
    });
    expect(step1.statusCode).toBe(200);
    expect(step1.json().data.status).toBe("paid_confirmed");
    expect(step1.json().data.version).toBe(2);

    // 4. Version mismatch -> 409 Conflict
    const conflict = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: { to: "in_transit", expectedVersion: 1 },
    });
    expect(conflict.statusCode).toBe(409);

    // 5. Super admin -> in_transit (paid_confirmed -> in_transit)
    const step2 = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: { to: "in_transit", expectedVersion: 2 },
    });
    expect(step2.statusCode).toBe(200);
    expect(step2.json().data.status).toBe("in_transit");
    expect(step2.json().data.version).toBe(3);

    // 6. Invalid transition (in_transit -> pending_payment) -> 400 Bad Request
    const invalidTransition = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: { to: "pending_payment" },
    });
    expect(invalidTransition.statusCode).toBe(400);

    // 7. Non-existent booking -> 404 Not Found
    const notFound = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/bookings/00000000-0000-0000-0000-000000000000/transition",
      headers: { authorization: "Bearer test-super_admin" },
      payload: { to: "completed" },
    });
    expect(notFound.statusCode).toBe(404);

    await app.close();
  });
});
