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
    providerPaymentId: `pay_${randomUUID().slice(0, 8)}`,
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

describe("admin operations and catalog", () => {
  it("allows authorized staff to list bookings and super_admin to refund", async () => {
    const { app } = await createTestApp();
    const { bookingId, draft, token } = await paidBooking(app);

    const unauth = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/bookings",
    });
    expect(unauth.statusCode).toBe(401);

    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/bookings?status=paid_confirmed",
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().data.bookings.length).toBeGreaterThan(0);
    expect(listRes.json().data.bookings[0].id).toBe(bookingId);

    const forbiddenRefund = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/refunds",
      headers: { authorization: "Bearer test-customer" },
      payload: {
        bookingId,
        reason: "Customer cancelled",
        idempotencyKey: randomUUID(),
      },
    });
    expect(forbiddenRefund.statusCode).toBe(403);

    const refundRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/refunds",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        bookingId,
        reason: "Customer requested cancellation before trip",
        idempotencyKey: randomUUID(),
      },
    });
    expect(refundRes.statusCode).toBe(201);
    expect(refundRes.json().data.status).toBe("processed");

    const voucher = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${token}`,
    });
    expect(voucher.json().data.status).toBe("refunded");
    await app.close();
  });

  it("hides unpublished catalog and review content", async () => {
    const { app } = await createTestApp();
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog",
      headers: { authorization: "Bearer test-super_admin" },
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
      headers: { authorization: "Bearer test-customer" },
    });
    expect(forbiddenPublish.statusCode).toBe(403);

    const published = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${id}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(published.statusCode).toBe(200);

    // Verify media attachment by slug uses item.id for foreign key (FIND-007)
    const mediaRes = await app.inject({
      method: "POST",
      url: "/api/v1/ops/admin/catalog/hidden-tour/media",
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        storagePath: "catalog/hidden-tour-hero.webp",
        mediaType: "image",
        altText: "Hidden Tour Hero",
        sortOrder: 1,
      },
    });
    expect(mediaRes.statusCode).toBe(201);
    expect(mediaRes.json().data.catalogItemId).toBe(id);
    expect(mediaRes.json().data.catalogItemId).not.toBe("hidden-tour");

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
      headers: { authorization: "Bearer test-super_admin" },
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

  it("provides operations desk endpoints for inquiries, payments, and fare rules (FIND-016)", async () => {
    const { app } = await createTestApp();

    // 1. Check fare rules
    const fareRulesRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/fare-rules",
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(fareRulesRes.statusCode).toBe(200);
    expect(fareRulesRes.json().data.version).toBeDefined();
    expect(fareRulesRes.json().data.vehicles.length).toBeGreaterThan(0);

    // 2. Submit customer inquiry
    const inquiryRes = await app.inject({
      method: "POST",
      url: "/api/v1/inquiries",
      payload: {
        name: "Vikram Malhotra",
        phone: "+919876543210",
        email: "vikram@example.com",
        message: "Need 2 Innova Crysta for 3 days Agra to Jaipur tour.",
        tripInterest: "Agra to Jaipur",
      },
    });
    expect(inquiryRes.statusCode).toBe(201);
    const inquiryId = inquiryRes.json().data.id as string;

    // 3. List inquiries as admin
    const listInquiriesRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/inquiries",
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(listInquiriesRes.statusCode).toBe(200);
    expect(listInquiriesRes.json().data.total).toBeGreaterThanOrEqual(1);

    // 4. Update inquiry status and append note
    const updateInquiryRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/ops/admin/inquiries/${inquiryId}`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        status: "contacted",
        note: "Called customer and sent quote via WhatsApp.",
      },
    });
    expect(updateInquiryRes.statusCode).toBe(200);
    expect(updateInquiryRes.json().data.status).toBe("contacted");
    expect(updateInquiryRes.json().data.notes).toContain("Called customer and sent quote via WhatsApp.");

    // 5. Inspect payments list
    const paymentsRes = await app.inject({
      method: "GET",
      url: "/api/v1/ops/admin/payments",
      headers: { authorization: "Bearer test-super_admin" },
    });
    expect(paymentsRes.statusCode).toBe(200);
    expect(paymentsRes.json().data.total).toBeDefined();
    expect(paymentsRes.json().data.totalCapturedPaise).toBeDefined();

    await app.close();
  });
});
