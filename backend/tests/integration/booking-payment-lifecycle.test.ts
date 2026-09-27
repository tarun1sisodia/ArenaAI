import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft, signProviderBody } from "../helpers.js";

describe("Booking & Payment End-to-End Lifecycle State Machine (Step 1.5)", () => {
  it("payment failure webhook keeps booking unconfirmed and records failure reason", async () => {
    const { app } = await createTestApp();

    // 1. Create booking draft
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: sampleDraft,
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data as {
      id: string;
      ticketId: string;
      guestAccessToken: string;
    };

    // 2. Create checkout
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "a1111111-1111-4111-8111-111111111111",
        provider: "razorpay",
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data as {
      paymentId: string;
      providerOrderId: string;
      amountMinor: number;
    };

    // Booking must now be pending_payment
    const preCheck = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(preCheck.json().data.status).toBe("pending_payment");

    // 3. Receive payment.failed webhook
    const failPayload = {
      eventId: "evt_fail_123",
      eventType: "payment.failed",
      providerOrderId: checkout.providerOrderId,
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "failed",
    };
    const signed = signProviderBody("whsec_razorpay_test", failPayload);
    const webhookRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });
    expect(webhookRes.statusCode).toBe(200);
    expect(webhookRes.json().data.status).toBe("failed");

    // 4. Booking must NOT be confirmed; customer must not receive a voucher
    const postCheck = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(postCheck.json().data.status).not.toBe("paid_confirmed");
    expect(postCheck.json().data.status).toBe("pending_payment");

    // 5. Payment status endpoint reflects failed state
    const paymentStatusRes = await app.inject({
      method: "GET",
      url: `/api/v1/payments/${checkout.paymentId}/status?token=${draft.guestAccessToken}`,
    });
    expect(paymentStatusRes.statusCode).toBe(200);
    expect(paymentStatusRes.json().data.status).toBe("failed");

    await app.close();
  });

  it("enforces guest access token security: forbids phone or ticket alone from accessing booking or payment", async () => {
    const { app } = await createTestApp();

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: sampleDraft,
    });
    const draft = draftRes.json().data as {
      ticketId: string;
      guestAccessToken: string;
    };

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "b2222222-2222-4222-8222-222222222222",
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data as { paymentId: string };

    // Requesting booking without token -> 401
    const noToken = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}`,
    });
    expect(noToken.statusCode).toBe(401);

    // Requesting booking with invalid token -> 401
    const badToken = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=invalid-guest-token-12345`,
    });
    expect(badToken.statusCode).toBe(401);

    // Requesting payment status without token -> 401
    const noPaymentToken = await app.inject({
      method: "GET",
      url: `/api/v1/payments/${checkout.paymentId}/status`,
    });
    expect(noPaymentToken.statusCode).toBe(401);

    // Requesting payment status with invalid token -> 401
    const badPaymentToken = await app.inject({
      method: "GET",
      url: `/api/v1/payments/${checkout.paymentId}/status?token=wrong-token-abc-xyz-123`,
    });
    expect(badPaymentToken.statusCode).toBe(401);

    await app.close();
  });

  it("handles refund webhook and updates payment state", async () => {
    const { app } = await createTestApp();

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: sampleDraft,
    });
    const draft = draftRes.json().data as {
      ticketId: string;
      guestAccessToken: string;
    };

    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "c3333333-3333-4333-8333-333333333333",
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data as {
      paymentId: string;
      providerOrderId: string;
      amountMinor: number;
    };

    // 1. Capture payment first
    const capturePayload = {
      eventId: "evt_capture_for_refund",
      eventType: "payment.captured",
      providerOrderId: checkout.providerOrderId,
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "captured",
    };
    const captureSigned = signProviderBody("whsec_razorpay_test", capturePayload);
    await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": captureSigned.signature, "content-type": "application/json" },
      payload: captureSigned.raw,
    });

    const confirmedBooking = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(confirmedBooking.json().data.status).toBe("paid_confirmed");

    // 2. Refund webhook received
    const refundPayload = {
      eventId: "evt_refund_processed_1",
      eventType: "refund.processed",
      providerOrderId: checkout.providerOrderId,
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "refunded",
    };
    const refundSigned = signProviderBody("whsec_razorpay_test", refundPayload);
    const refundRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": refundSigned.signature, "content-type": "application/json" },
      payload: refundSigned.raw,
    });
    expect(refundRes.statusCode).toBe(200);
    expect(refundRes.json().data.status).toBe("refunded");

    // 3. Payment status reflects refunded
    const paymentStatus = await app.inject({
      method: "GET",
      url: `/api/v1/payments/${checkout.paymentId}/status?token=${draft.guestAccessToken}`,
    });
    expect(paymentStatus.json().data.status).toBe("refunded");

    await app.close();
  });
});
