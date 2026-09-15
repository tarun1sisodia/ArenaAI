import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft, signProviderBody } from "../helpers.js";

describe("booking + payment vertical slice", () => {
  it("creates a draft, checkout from persisted advance, and confirms via signed webhook", async () => {
    const { app } = await createTestApp();

    const fareRes = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: {
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: sampleDraft.pickupDatetime,
        distanceKm: 230,
      },
    });
    expect(fareRes.statusCode).toBe(200);
    const fare = fareRes.json().data as { advanceAmount: number; totalFare: number };

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: { ...sampleDraft, totalFare: 1, advanceAmount: 1 },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data as {
      ticketId: string;
      guestAccessToken: string;
      fare: { advanceAmount: number; totalFare: number };
    };
    expect(draft.ticketId).toMatch(/^AGR-\d{8}-\d{4}$/);
    expect(draft.fare.advanceAmount).toBe(fare.advanceAmount);
    expect(draft.fare.totalFare).toBe(fare.totalFare);

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        provider: "razorpay",
        currency: "INR",
        amount: 1,
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data as {
      paymentId: string;
      providerOrderId: string;
      amountMinor: number;
    };
    expect(checkout.amountMinor).toBe(fare.advanceAmount * 100);

    const replay = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        provider: "razorpay",
        currency: "INR",
      },
    });
    expect(replay.json().data.paymentId).toBe(checkout.paymentId);

    const payload = {
      eventId: "evt_pay_1",
      eventType: "payment.captured",
      providerOrderId: checkout.providerOrderId,
      providerPaymentId: "pay_1",
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "captured",
    };
    const signed = signProviderBody("whsec_razorpay_test", payload);
    const webhookRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });
    expect(webhookRes.statusCode).toBe(200);
    expect(webhookRes.json().data.status).toBe("captured");

    const duplicate = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.json().data.duplicate).toBe(true);

    const bookingRes = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(bookingRes.statusCode).toBe(200);
    const booking = bookingRes.json().data as {
      status: string;
      customerPhone: string;
    };
    expect(booking.status).toBe("paid_confirmed");
    expect(booking.customerPhone).toContain("*");

    await app.close();
  });

  it("rejects invalid webhook signatures without mutating paid state", async () => {
    const { app } = await createTestApp();
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: sampleDraft,
    });
    const draft = draftRes.json().data as { ticketId: string; guestAccessToken: string };
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      },
    });
    const checkout = checkoutRes.json().data as { providerOrderId: string; amountMinor: number };
    const payload = {
      eventId: "evt_bad",
      providerOrderId: checkout.providerOrderId,
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "captured",
    };
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": "nope", "content-type": "application/json" },
      payload: JSON.stringify(payload),
    });
    expect(res.statusCode).toBe(401);

    const bookingRes = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(bookingRes.json().data.status).toBe("pending_payment");
    await app.close();
  });

  it("flags amount mismatch as needs_review", async () => {
    const { app } = await createTestApp();
    const draftRes = await app.inject({ method: "POST", url: "/api/v1/bookings/draft", payload: sampleDraft });
    const draft = draftRes.json().data as { ticketId: string; guestAccessToken: string };
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "33333333-3333-4333-8333-333333333333",
      },
    });
    const checkout = checkoutRes.json().data as { providerOrderId: string };
    const payload = {
      eventId: "evt_mismatch",
      providerOrderId: checkout.providerOrderId,
      amountMinor: 100,
      currency: "INR",
      status: "captured",
    };
    const signed = signProviderBody("whsec_razorpay_test", payload);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });
    expect(res.json().data.status).toBe("needs_review");
    const bookingRes = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(bookingRes.json().data.status).toBe("pending_payment");
    await app.close();
  });
});
