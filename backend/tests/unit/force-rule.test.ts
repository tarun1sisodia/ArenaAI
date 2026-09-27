import { describe, expect, it } from "vitest";
import { calculateFare } from "../../src/modules/fares/fare.engine.js";

const pickupDay = "2026-10-01T08:00:00+05:30";

describe("F2 — Force Vehicle Business Rule", () => {
  it("55 km one-way in Tempo Traveller bills 110 km (NOT 300 km, NOT 55 km)", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Mathura",
      pickupDatetime: pickupDay,
      distanceKm: 55,
    });

    expect(fare.billedKm).toBe(110);
    expect(fare.alwaysRoundTrip).toBe(true);
    expect(fare.tripType).toBe("round-trip");
    expect(fare.baseFare).toBe(110 * 25); // ₹2,750
    expect(fare.driverAllowance).toBe(500); // ₹500/day
    expect(fare.totalFare).toBe(2750 + 500); // ₹3,250
  });

  it("55 km one-way in Urbania bills 110 km", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "urbania",
      originName: "Agra",
      destinationName: "Mathura",
      pickupDatetime: pickupDay,
      distanceKm: 55,
    });

    expect(fare.billedKm).toBe(110);
    expect(fare.alwaysRoundTrip).toBe(true);
    expect(fare.tripType).toBe("round-trip");
    expect(fare.baseFare).toBe(110 * 34); // ₹3,740
    expect(fare.driverAllowance).toBe(500); // ₹500/day
    expect(fare.totalFare).toBe(3740 + 500); // ₹4,240
  });

  it("200 km round trip in Tempo Traveller bills 200 km (do not double to 400 km)", () => {
    const fare = calculateFare({
      tripType: "round-trip",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      returnDatetime: "2026-10-01T20:00:00+05:30",
      distanceKm: 200,
    });

    expect(fare.billedKm).toBe(200);
    expect(fare.alwaysRoundTrip).toBe(true);
    expect(fare.tripType).toBe("round-trip");
    expect(fare.baseFare).toBe(200 * 25); // ₹5,000
    expect(fare.driverAllowance).toBe(500); // ₹500/day
    expect(fare.totalFare).toBe(5000 + 500); // ₹5,500
  });

  it("55 km one-way in Sedan bills 55 km (Sedan is not Force)", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Mathura",
      pickupDatetime: pickupDay,
      distanceKm: 55,
    });

    expect(fare.billedKm).toBe(55);
    expect(fare.alwaysRoundTrip).toBe(false);
    expect(fare.tripType).toBe("one-way");
    expect(fare.driverAllowance).toBe(0);
    // Sedan catalog rate for Agra-Mathura is 2200
    expect(fare.baseFare).toBe(2200);
    expect(fare.totalFare).toBe(2200);
  });

  it("Force vehicle with promo code has promo rejected with clear error code", () => {
    expect(() =>
      calculateFare({
        tripType: "one-way",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        distanceKm: 230,
        promoCode: "ASTTCAR500OFF",
      })
    ).toThrowError(
      expect.objectContaining({
        code: "PROMO_NOT_ALLOWED",
        statusCode: 400,
      })
    );
  });

  it("Force vehicle on tour package has round trip rule applied", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Agra",
      pickupDatetime: pickupDay,
      distanceKm: 80,
      packageId: "agra-day",
    });

    expect(fare.alwaysRoundTrip).toBe(true);
    expect(fare.tripType).toBe("round-trip");
    // One-way distance 80 doubled to 160 km
    expect(fare.billedKm).toBe(160);
    expect(fare.baseFare).toBe(160 * 25); // ₹4,000
    expect(fare.driverAllowance).toBe(500);
    expect(fare.totalFare).toBe(4000 + 500); // ₹4,500
  });
});
