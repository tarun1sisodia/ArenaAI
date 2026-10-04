import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft, signProviderBody } from "../helpers.js";

describe("Booking Cancellation Refund Engine Wiring", () => {
  it("creates a 100% refund record when confirmed booking is cancelled with >= 24h notice", async () => {
    const { app, db } = await createTestApp();

    // 1. Create booking with pickup 48 hours in future
    const pickupDatetime = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: { ...sampleDraft, pickupDatetime },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data as { ticketId: string; guestAccessToken: string };

    // 2. Checkout & capture payment
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: randomUUID(),
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data as { providerOrderId: string; amountMinor: number };

    const capturePayload = {
      eventId: randomUUID(),
      eventType: "payment.captured",
      providerOrderId: checkout.providerOrderId,
      providerPaymentId: `pay_${randomUUID().slice(0, 8)}`,
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "captured",
    };
    const signed = signProviderBody("whsec_razorpay_test", capturePayload);
    await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });

    // 3. Confirm booking is paid_confirmed
    const bookingRes = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    const bookingId = bookingRes.json().data.id as string;
    const confirmedBooking = await db.bookings.getById(bookingId);
    expect(confirmedBooking?.status).toBe("paid_confirmed");

    // 4. Cancel booking via admin transition
    const cancelRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        to: "cancelled",
        expectedVersion: confirmedBooking!.version,
      },
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.json().data.status).toBe("cancelled");

    // 5. Verify refund record created in DB matching Slab 1 (100% refund, 0% retained)
    const refunds = await db.refunds.listByBookingId(bookingId);
    expect(refunds.length).toBe(1);
    expect(refunds[0]!.amountMinor).toBe(checkout.amountMinor);
    expect(refunds[0]!.status).toBe("pending");
    expect(refunds[0]!.reason).toContain("24+ hours before departure");
    expect(refunds[0]!.reason).toContain("Full refund");

    await app.close();
  });

  it("creates a 0% refund record (advance retained) when confirmed booking is cancelled with < 24h notice", async () => {
    const { app, db } = await createTestApp();

    // 1. Create booking with pickup 6 hours in future
    const pickupDatetime = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: { ...sampleDraft, pickupDatetime },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data as { ticketId: string; guestAccessToken: string };

    // 2. Checkout & capture payment
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: randomUUID(),
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data as { providerOrderId: string; amountMinor: number };

    const capturePayload = {
      eventId: randomUUID(),
      eventType: "payment.captured",
      providerOrderId: checkout.providerOrderId,
      providerPaymentId: `pay_${randomUUID().slice(0, 8)}`,
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "captured",
    };
    const signed = signProviderBody("whsec_razorpay_test", capturePayload);
    await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });

    const bookingRes = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    const bookingId = bookingRes.json().data.id as string;
    const confirmedBooking = await db.bookings.getById(bookingId);
    expect(confirmedBooking?.status).toBe("paid_confirmed");

    // 3. Cancel booking via admin transition
    const cancelRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/bookings/${bookingId}/transition`,
      headers: { authorization: "Bearer test-super_admin" },
      payload: {
        to: "cancelled",
        expectedVersion: confirmedBooking!.version,
      },
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.json().data.status).toBe("cancelled");

    // 4. Verify refund record created in DB matching Slab 2 (0% refund, 100% retained)
    const refunds = await db.refunds.listByBookingId(bookingId);
    expect(refunds.length).toBe(1);
    expect(refunds[0]!.amountMinor).toBe(0);
    expect(refunds[0]!.status).toBe("processed");
    expect(refunds[0]!.reason).toContain("<24 hours before departure");
    expect(refunds[0]!.reason).toContain("Advance retained");

    await app.close();
  });
});
