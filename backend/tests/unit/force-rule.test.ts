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

  it("200 km round trip in Tempo Traveller bills 400 km under the sub-300 km round-trip rule", () => {
    const fare = calculateFare({
      tripType: "round-trip",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      returnDatetime: "2026-10-01T20:00:00+05:30",
      distanceKm: 200,
    });

    expect(fare.billedKm).toBe(400);
    expect(fare.alwaysRoundTrip).toBe(true);
    expect(fare.tripType).toBe("round-trip");
    expect(fare.baseFare).toBe(400 * 25); // ₹10,000
    expect(fare.driverAllowance).toBe(500); // ₹500/day
    expect(fare.totalFare).toBe(10000 + 500); // ₹10,500
  });

  it("300 km uses one-way per-km billing for both group vehicles and keeps ₹500 allowance without forced round trip", () => {
    for (const [vehicleTier, rate] of [["tempo-traveller", 25], ["urbania", 34]] as const) {
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier,
        originName: "Agra",
        destinationName: "Jaipur",
        pickupDatetime: pickupDay,
        distanceKm: 300,
      });
      expect(fare.billedKm).toBe(300);
      expect(fare.baseFare).toBe(300 * rate);
      expect(fare.driverAllowance).toBe(500);
      expect(fare.alwaysRoundTrip).toBe(false);
      expect(fare.tripType).toBe("one-way");
    }
  });

  it("350 km one-way in Tempo Traveller is billed per-km without forced round trip", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Lucknow",
      pickupDatetime: pickupDay,
      distanceKm: 350,
    });
    expect(fare.billedKm).toBe(350);
    expect(fare.alwaysRoundTrip).toBe(false);
    expect(fare.tripType).toBe("one-way");
    expect(fare.baseFare).toBe(350 * 25); // ₹8,750
    expect(fare.driverAllowance).toBe(500); // ₹500/day
    expect(fare.totalFare).toBe(8750 + 500); // ₹9,250
  });

  it("honors custom route driver allowance override on group commercial vehicles", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Lucknow",
      pickupDatetime: pickupDay,
      distanceKm: 350,
      ruleOverrides: {
        driverAllowance: 750,
      },
    });
    expect(fare.driverAllowance).toBe(750);
    expect(fare.totalFare).toBe(350 * 25 + 750);
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
