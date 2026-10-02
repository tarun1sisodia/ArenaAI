import { describe, expect, it } from "vitest";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { newId } from "../../src/shared/ids.js";
import { createTestApp, sampleDraft } from "../helpers.js";

/**
 * Fare-drift guard: Razorpay must charge the DRAFT's fareSnapshot amounts,
 * never a fare recomputed from rules published after the draft was created.
 * Simulates an admin fare publish between draft creation and checkout.
 */
describe("Booking fare snapshot vs published fare drift", () => {
  it("charges the draft advanceAmount even after sedan per-km rate is republished higher", async () => {
    const repos = createMemoryRepositories(new Date().toISOString());
    const { app } = await createTestApp(repos);

    const farePayload = {
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: sampleDraft.pickupDatetime,
    };

    // 1. Baseline fare + draft (draft persists fareSnapshot + advanceAmount)
    const fareRes = await app.inject({ method: "POST", url: "/api/v1/fares/calculate", payload: farePayload });
    expect(fareRes.statusCode).toBe(200);
    const fare = fareRes.json().data as { totalFare: number; advanceAmount: number };
    expect(fare.advanceAmount).toBeGreaterThan(0);

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/bookings/draft",
      payload: {
        ...farePayload,
        pickupAddress: "Clarks Shiraz Porch, Agra",
        dropAddress: "Terminal 3, New Delhi",
        customerName: "Rohan Verma",
        customerPhone: "+919876543210",
        customerEmail: "rohan@example.com",
      },
    });
    expect(draftRes.statusCode).toBe(201);
    const draft = draftRes.json().data;
    expect(draft.fare.advanceAmount).toBe(fare.advanceAmount);

    // 2. Admin republishes sedan at a much higher per-km rate
    await repos.fareRules.save({
      id: newId(),
      version: "drift-test-v2",
      effectiveFrom: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      config: {
        vehicles: [{ tier: "sedan", perKm: 99, active: true }],
      },
    });

    // 3. Sanity: a fresh calculation really does use the new rate
    const repricedRes = await app.inject({ method: "POST", url: "/api/v1/fares/calculate", payload: farePayload });
    expect(repricedRes.statusCode).toBe(200);
    const repriced = repricedRes.json().data as { totalFare: number; advanceAmount: number };
    expect(repriced.advanceAmount).toBeGreaterThan(fare.advanceAmount);

    // 4. Checkout for the existing draft must still charge the SNAPSHOT advance
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/payments/create-checkout",
      payload: {
        ticketId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        idempotencyKey: "12345678-1234-4234-8234-1234567890cd",
        provider: "razorpay",
        currency: "INR",
      },
    });
    expect(checkoutRes.statusCode).toBe(201);
    const checkout = checkoutRes.json().data;
    expect(checkout.amountMinor).toBe(fare.advanceAmount * 100);
    expect(checkout.amountMinor).not.toBe(repriced.advanceAmount * 100);

    await app.close();
  });
});
