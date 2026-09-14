import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft, signProviderBody } from "../helpers.js";

async function paidBooking(app: Awaited<ReturnType<typeof createTestApp>>["app"]) {
  const draftRes = await app.inject({ method: "POST", url: "/api/v1/bookings/draft", payload: sampleDraft });
  const draft = draftRes.json().data as { ticketId: string; guestAccessToken: string };
  const checkoutRes = await app.inject({
    method: "POST",
    url: "/api/v1/payments/create-checkout",
    payload: {
      ticketId: draft.ticketId,
      guestAccessToken: draft.guestAccessToken,
      idempotencyKey: randomUUID(),
    },
  });
  const checkout = checkoutRes.json().data as { providerOrderId: string; amountMinor: number };
  const payload = {
    eventId: randomUUID(),
    providerOrderId: checkout.providerOrderId,
    amountMinor: checkout.amountMinor,
    currency: "INR",
    status: "captured",
  };
  const signed = signProviderBody("whsec_razorpay_test", payload);
  await app.inject({
    method: "POST",
    url: "/api/v1/payments/webhooks/razorpay",
    headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
    payload: signed.raw,
  });
  const booking = await app.inject({
    method: "GET",
    url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
  });
  return { draft, bookingId: booking.json().data.id as string, token: draft.guestAccessToken };
}

describe("dispatch and catalog", () => {
  it("assigns a driver only after payment and requires admin role", async () => {
    const { app } = await createTestApp();
    const { bookingId, draft, token } = await paidBooking(app);

    const unauth = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/bookings/${bookingId}/assign`,
      payload: { driverId: "11111111-1111-4111-8111-111111111111" },
    });
    expect(unauth.statusCode).toBe(401);

    const assign = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/bookings/${bookingId}/assign`,
      headers: { authorization: "Bearer test-dispatcher" },
      payload: { driverId: "11111111-1111-4111-8111-111111111111", note: "Taj pickup" },
    });
    expect(assign.statusCode).toBe(200);
    expect(assign.json().data.status).toBe("driver_assigned");

    const conflict = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/bookings/${bookingId}/assign`,
      headers: { authorization: "Bearer test-dispatcher" },
      payload: {
        driverId: "22222222-2222-4222-8222-222222222222",
        expectedVersion: 1,
      },
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json().error.code).toBe("ASSIGNMENT_CONFLICT");

    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/notify-driver`,
      headers: { authorization: "Bearer test-dispatcher" },
    });

    const voucher = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${token}`,
    });
    expect(voucher.json().data.assignedDriver.fullName).toBe("Ramesh Kumar");
    expect(voucher.json().data.assignedDriver.phone).toContain("98765");
    await app.close();
  });

  it("hides unpublished catalog and review content", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-content_editor" },
      payload: {
        type: "tour",
        slug: "hidden-tour",
        title: "Hidden Tour",
        shortDescription: "Not public yet",
        description: "Draft only tour description",
        durationText: "1 day",
        routeSummary: "Agra local",
        startingPriceInr: 4000,
      },
    });
    expect(created.statusCode).toBe(201);
    const publicDraft = await app.inject({ method: "GET", url: "/api/v1/catalog/hidden-tour" });
    expect(publicDraft.statusCode).toBe(404);

    const id = created.json().data.id as string;
    const forbiddenPublish = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${id}/publish`,
      headers: { authorization: "Bearer test-content_editor" },
    });
    expect(forbiddenPublish.statusCode).toBe(403);

    const published = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${id}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(published.statusCode).toBe(200);

    const visible = await app.inject({ method: "GET", url: "/api/v1/catalog/hidden-tour" });
    expect(visible.statusCode).toBe(200);
    expect(visible.json().data.title).toBe("Hidden Tour");

    const review = await app.inject({
      method: "POST",
      url: "/api/v1/reviews",
      payload: {
        catalogSlug: "hidden-tour",
        displayName: "Neha",
        rating: 5,
        reviewText: "Wonderful chauffeur and clean Innova for the family.",
      },
    });
    expect(review.statusCode).toBe(201);
    const reviewId = review.json().data.id as string;
    const before = await app.inject({ method: "GET", url: "/api/v1/catalog/hidden-tour/reviews" });
    expect(before.json().data).toHaveLength(0);

    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/reviews/${reviewId}/approve`,
      headers: { authorization: "Bearer test-review_moderator" },
    });
    await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/reviews/${reviewId}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
    });
    const after = await app.inject({ method: "GET", url: "/api/v1/catalog/hidden-tour/reviews" });
    expect(after.json().data).toHaveLength(1);
    await app.close();
  });
});
