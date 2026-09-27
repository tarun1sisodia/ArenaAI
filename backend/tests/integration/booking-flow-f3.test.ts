import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft, signProviderBody } from "../helpers.js";

describe("F3: Booking Flow & Server Authority Integration", () => {
  it("completes full end-to-end booking without client transmitting distance or price", async () => {
    const { app } = await createTestApp();

    // 1. Calculate fare via Fastify (no client price or distance sent)
    const fareRes = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: {
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: sampleDraft.pickupDatetime,
      },
    });
    expect(fareRes.statusCode).toBe(200);
    const fare = fareRes.json().data;
    expect(fare.totalFare).toBeGreaterThan(0);
    expect(fare.advanceAmount).toBeGreaterThan(0);
    expect(fare.distanceKm).toBe(230);

    // 2. Create draft booking (no money or distance sent by client)
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupAddress: "Clarks Shiraz Porch, Agra",
        dropAddress: "Terminal 3, New Delhi",
        pickupDatetime: sampleDraft.pickupDatetime,
        customerName: "Rohan Verma",
        customerPhone: "+919876543210",
        customerEmail: "rohan@example.com",
      },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data;
    expect(draft.ticketId).toMatch(/^AGR-\d{8}-\d{4}$/);
    expect(draft.fare.totalFare).toBe(fare.totalFare);
    expect(draft.fare.advanceAmount).toBe(fare.advanceAmount);

    // 3. Initiate payment checkout
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "12345678-1234-4234-8234-1234567890ab",
        provider: "razorpay",
        currency: "INR",
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data;
    expect(checkout.amountMinor).toBe(fare.advanceAmount * 100);

    // 4. Capture payment via webhook
    const webhookPayload = {
      eventId: "evt_test_f3_1",
      eventType: "payment.captured",
      providerOrderId: checkout.providerOrderId,
      providerPaymentId: "pay_test_f3_1",
      amountMinor: checkout.amountMinor,
      currency: "INR",
      status: "captured",
    };
    const signed = signProviderBody("whsec_razorpay_test", webhookPayload);
    const hookRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhooks/razorpay",
      headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
      payload: signed.raw,
    });
    expect(hookRes.statusCode).toBe(200);

    // 5. Verify booking state is paid_confirmed with masked customer phone
    const verifyRes = await app.inject({
      method: "GET",
      url: `/api/v1/bookings/${draft.ticketId}?token=${draft.guestAccessToken}`,
    });
    expect(verifyRes.statusCode).toBe(200);
    const confirmed = verifyRes.json().data;
    expect(confirmed.status).toBe("paid_confirmed");
    expect(confirmed.customerPhone).toContain("*");

    await app.close();
  });

  it("enforces Force Tempo Traveller round-trip rule during booking", async () => {
    const { app } = await createTestApp();

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        tripType: "one-way",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Mathura",
        pickupAddress: "Hotel Taj Resort, Agra",
        dropAddress: "Krishna Janmabhoomi, Mathura",
        pickupDatetime: sampleDraft.pickupDatetime,
        customerName: "Kavita Singh",
        customerPhone: "+919876543211",
      },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data;

    // One-way distance Mathura is 55 km -> billed 110 km + driver allowance ₹500
    // Rate for Tempo is ₹25/km -> 110 * 25 = 2750 + 500 = 3250
    expect(draft.fare.totalFare).toBe(3250);
    expect(draft.fare.driverAllowance).toBe(500);

    await app.close();
  });

  it("enforces Force Urbania round-trip rule with distinct pricing from Tempo", async () => {
    const { app } = await createTestApp();

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        tripType: "one-way",
        vehicleTier: "urbania",
        originName: "Agra",
        destinationName: "Mathura",
        pickupAddress: "ITC Mughal, Agra",
        dropAddress: "Radha Kund, Mathura",
        pickupDatetime: sampleDraft.pickupDatetime,
        customerName: "Vikram Malhotra",
        customerPhone: "+919876543212",
      },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data;

    // Urbania: 110 km * ₹34/km = 3740 + ₹500 driver allowance = 4240
    expect(draft.fare.totalFare).toBe(4240);
    expect(draft.fare.totalFare).not.toBe(3250); // Guards against tier collision

    await app.close();
  });

  it("ignores client tamper attempts on price, total, or distance", async () => {
    const { app } = await createTestApp();

    const tamperedRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        ...sampleDraft,
        // Attempting to inject client-controlled money values or distance
        totalFare: 1,
        advanceAmount: 1,
        price: 1,
        distanceKm: 1,
        customerName: "Sunil Grover",
        customerPhone: "+919876543213",
      },
    });
    expect(tamperedRes.statusCode).toBe(201);
    const draft = tamperedRes.json().data;

    // Server must ignore client 1 rupee total and price legitimately
    expect(draft.fare.totalFare).toBeGreaterThan(2000);
    expect(draft.fare.advanceAmount).toBeGreaterThan(500);

    await app.close();
  });

  it("creates booking draft for local tour packages", async () => {
    const { app } = await createTestApp();

    const localRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        tripType: "local-tour",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Agra",
        localPackageKey: "8hr-80km",
        pickupAddress: "Hotel Clarks Shiraz, Agra",
        pickupDatetime: sampleDraft.pickupDatetime,
        customerName: "Pooja Sharma",
        customerPhone: "+919876543214",
      },
    });
    expect(localRes.statusCode).toBe(201);
    const draft = localRes.json().data;
    expect(draft.fare.baseFare).toBe(1900);
    expect(draft.fare.totalFare).toBe(1900);

    await app.close();
  });

  it("creates booking draft for tour packages with vehicle upgrade", async () => {
    const { app } = await createTestApp();

    const packageRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        tripType: "round-trip",
        vehicleTier: "innova-crysta",
        originName: "Agra",
        destinationName: "Agra Taj Mahal Sunrise",
        packageId: "taj-sunrise",
        pickupAddress: "Oberoi Amarvilas Porch, Agra",
        pickupDatetime: sampleDraft.pickupDatetime,
        customerName: "David Miller",
        customerPhone: "+919876543215",
      },
    });
    expect(packageRes.statusCode).toBe(201);
    const draft = packageRes.json().data;
    // taj-sunrise base is 12999 + Innova upgrade 1800 = 14799
    expect(draft.fare.totalFare).toBe(14799);

    await app.close();
  });
});
