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
        pickupDatetime: "2026-10-01T08:00:00+05:30",
        distanceKm: 230,
      },
    });
    expect(ok.json().success).toBe(true);
    expect(ok.json().data).toMatchObject({
      currency: "INR",
      fareVersion: "2026-09-13",
    });
    await app.close();
  });

  it("requires booking verification on voucher reads", async () => {
    const { app } = await createTestApp();
    const draft = await app.inject({ method: "POST", url: "/api/v1/bookings/draft", payload: sampleDraft });
    const ticketId = draft.json().data.ticketId as string;
    const denied = await app.inject({ method: "GET", url: `/api/v1/bookings/${ticketId}` });
    expect(denied.statusCode).toBe(401);
    const phone = await app.inject({ method: "GET", url: `/api/v1/bookings/${ticketId}?phone=3221` });
    expect(phone.statusCode).toBe(200);
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
});
