import { describe, expect, it } from "vitest";
import { createTestApp, sampleDraft, signProviderBody } from "../helpers.js";
import { createMemoryRepositories } from "../../src/db/memory.js";

const customer = { authorization: "Bearer test-customer" };

const scenarios = [
  {
    key: "11111111-1111-4111-8111-111111111111",
    eventId: "evt_canonical_outstation",
    phone: "+919876543221",
    selection: { kind: "outstation" as const, id: "agra-to-delhi", tripType: "one-way" as const, originName: "Agra", destinationName: "Delhi" },
    expectedId: "agra-delhi",
    expectedKind: "outstation",
    expectedName: "Agra → Delhi",
  },
  {
    key: "22222222-2222-4222-8222-222222222222",
    eventId: "evt_canonical_local",
    phone: "+919876543222",
    selection: { kind: "local" as const, id: "8hr-80km", source: "curated" as const, tripType: "local-tour" as const, localPackageKey: "8hr-80km" as const, pickupLocation: "Agra" },
    expectedId: "8hr-80km",
    expectedKind: "local",
    expectedName: "Agra Sightseeing (8 Hours / 80 KM)",
  },
  {
    key: "33333333-3333-4333-8333-333333333333",
    eventId: "evt_canonical_package",
    phone: "+919876543223",
    selection: { kind: "package" as const, id: "taj-sunrise", source: "catalog" as const, slug: "taj-mahal-sunrise-tour" },
    expectedId: "taj-sunrise",
    expectedKind: "package",
    expectedName: "Taj Mahal Sunrise Tour",
    expectedCatalogId: "taj-sunrise",
  },
] as const;

describe("canonical booking selection end-to-end", () => {
  it("preserves each selected entity through fare quote, booking, checkout, confirmation and customer history", async () => {
    const db = createMemoryRepositories();
    const { app } = await createTestApp(db);

    for (const [index, scenario] of scenarios.entries()) {
      const intentResponse = await app.inject({
        method: "POST",
        url: "/api/v1/booking-intents",
        payload: {
          idempotencyKey: scenario.key,
          vehicleTier: "ertiga",
          bookingSelection: scenario.selection,
          pickupAddress: index === 1 ? "Hotel lobby, Agra" : "Main entrance pickup, Agra",
          pickupDatetime: sampleDraft.pickupDatetime,
          customerName: ["Aman Sharma", "Pooja Sharma", "Rohan Verma"][index],
          customerPhone: scenario.phone,
          customerEmail: `aman${index + 1}@example.com`,
        },
      });
      expect(intentResponse.statusCode).toBe(201);
      const intent = intentResponse.json().data;
      expect(intent.quote.totalFare).toBeGreaterThan(0);
      expect(intent.quote.advanceAmount).toBeGreaterThan(0);

      const finalizedResponse = await app.inject({
        method: "POST",
        url: `/api/v1/booking-intents/${intent.intentId}/finalize`,
        headers: { ...customer, "x-booking-intent-secret": intent.resumeSecret },
        payload: {},
      });
      expect(finalizedResponse.statusCode).toBe(201);
      const booking = finalizedResponse.json().data.booking;
      expect(booking.bookingSelection.kind).toBe(scenario.expectedKind);
      expect(booking.bookingSelection.id).toBe(scenario.expectedId);
      expect(booking.bookingSelection.name).toBe(scenario.expectedName);
      expect(booking.fare.totalFare).toBe(intent.quote.totalFare);
      expect(booking.fare.advanceAmount).toBe(intent.quote.advanceAmount);

      if (scenario.expectedKind === "outstation") {
        expect(booking.bookingSelection.originName).toBe("Agra");
        expect(booking.bookingSelection.destinationName).toBe("Delhi");
        expect(booking.originName).toBe("Agra");
        expect(booking.destinationName).toBe("Delhi");
      } else {
        expect(booking.originName).toBeNull();
        expect(booking.destinationName).toBeNull();
        expect(booking.bookingSelection.id).toBe(scenario.selection.id);
      }
      if ("expectedCatalogId" in scenario) {
        expect(booking.selectedCatalogItemId).toBe(scenario.expectedCatalogId);
      }

      const checkoutResponse = await app.inject({
        method: "POST",
        url: "/api/v1/payments/create-checkout",
        headers: customer,
        payload: {
          ticketId: booking.ticketId,
          idempotencyKey: `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`,
        },
      });
      expect(checkoutResponse.statusCode).toBe(201);
      const checkout = checkoutResponse.json().data;
      expect(checkout.amountMinor).toBe(booking.fare.advanceAmount * 100);

      const webhookPayload = {
        eventId: scenario.eventId,
        eventType: "payment.captured",
        providerOrderId: checkout.providerOrderId,
        providerPaymentId: `pay_canonical_${index + 1}`,
        amountMinor: checkout.amountMinor,
        currency: "INR",
        status: "captured",
      };
      const signed = signProviderBody("whsec_razorpay_test", webhookPayload);
      const webhookResponse = await app.inject({
        method: "POST",
        url: "/api/v1/payments/webhooks/razorpay",
        headers: { "x-razorpay-signature": signed.signature, "content-type": "application/json" },
        payload: signed.raw,
      });
      expect(webhookResponse.statusCode).toBe(200);

      const ownedResponse = await app.inject({
        method: "GET",
        url: `/api/v1/me/bookings/${booking.id}`,
        headers: customer,
      });
      expect(ownedResponse.statusCode).toBe(200);
      const owned = ownedResponse.json().data;
      expect(owned.status).toBe("paid_confirmed");
      expect(owned.bookingSelection.id).toBe(booking.bookingSelection.id);
      expect(owned.bookingSelection.name).toBe(scenario.expectedName);
      if (scenario.expectedKind !== "outstation") {
        expect(owned.originName).toBeNull();
        expect(owned.destinationName).toBeNull();
      }
    }

    const historyResponse = await app.inject({ method: "GET", url: "/api/v1/me/bookings", headers: customer });
    expect(historyResponse.statusCode).toBe(200);
    for (const scenario of scenarios) {
      expect(historyResponse.json().data.items.some((item: { bookingSelection?: { id?: string } }) => item.bookingSelection?.id === scenario.expectedId)).toBe(true);
    }

    const profileResponse = await app.inject({ method: "GET", url: "/api/v1/me/profile", headers: customer });
    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.json().data).toMatchObject({ fullName: "Aman Sharma", phone: "+919876543221", email: "aman1@example.com" });

    await app.close();
  });
});
