import { describe, expect, it } from "vitest";
import { advanceOf } from "../../src/shared/money.js";
import { applyPromo, calculateFare, isNightPickup } from "../../src/modules/fares/fare.engine.js";

const pickupDay = "2026-10-01T08:00:00+05:30";
const pickupNight = "2026-10-01T22:30:00+05:30";

describe("advanceOf", () => {
  it("rounds 28% to nearest 100 with a 500 minimum", () => {
    expect(advanceOf(1900)).toBe(500);
    expect(advanceOf(3499)).toBe(1000);
    expect(advanceOf(18500)).toBe(5200);
  });

  it("never exceeds the total fare", () => {
    expect(advanceOf(400)).toBe(400);
  });
});

describe("calculateFare", () => {
  it("computes a catalog one-way fare and ignores any client money fields", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      distanceKm: 230,
    });
    expect(fare.baseFare).toBe(3499);
    expect(fare.nightAllowance).toBe(0);
    expect(fare.totalFare).toBe(3499);
    expect(fare.advanceAmount).toBe(1000);
    expect(fare.balanceAmount).toBe(2499);
    expect(fare.currency).toBe("INR");
  });

  it("applies night allowance for 20:00-06:00 pickups", () => {
    expect(isNightPickup(pickupNight)).toBe(true);
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupNight,
      distanceKm: 230,
    });
    expect(fare.nightAllowance).toBe(300);
    expect(fare.totalFare).toBe(3799);
  });

  it("uses tempo night allowance", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupNight,
      distanceKm: 230,
    });
    expect(fare.nightAllowance).toBe(500);
  });

  it("applies same-day round-trip 1.85x with 300 km/day floor", () => {
    const fare = calculateFare({
      tripType: "round-trip",
      vehicleTier: "ertiga",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      returnDatetime: "2026-10-01T20:00:00+05:30",
      distanceKm: 230,
    });
    expect(fare.roundMultiplierApplied).toBe(true);
    expect(fare.baseFare).toBeGreaterThanOrEqual(Math.round(4499 * 1.85));
  });

  it("enforces 300 km/day on multi-day outstation trips", () => {
    const fare = calculateFare({
      tripType: "round-trip",
      vehicleTier: "ertiga",
      originName: "Agra",
      destinationName: "Jaipur",
      pickupDatetime: pickupDay,
      returnDatetime: "2026-10-03T18:00:00+05:30",
      distanceKm: 240,
    });
    expect(fare.baseFare).toBeGreaterThanOrEqual(3 * 300 * 14);
    expect(fare.rules.some((rule) => rule.includes("300km"))).toBe(true);
  });

  it("uses local sightseeing package fares", () => {
    const fare = calculateFare({
      tripType: "local-tour",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Agra",
      pickupDatetime: pickupDay,
      distanceKm: 80,
    });
    expect(fare.baseFare).toBe(1900);
    expect(fare.tripType).toBe("local-tour");
  });

  it("uses airport transfer fares", () => {
    const fare = calculateFare({
      tripType: "airport-transfer",
      vehicleTier: "sedan",
      originName: "Taj Ganj",
      destinationName: "Agra Airport Kheria",
      pickupDatetime: pickupDay,
      distanceKm: 20,
    });
    expect(fare.baseFare).toBe(900);
  });

  it("applies ASTTCAR500OFF when total >= 2000", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Delhi",
      pickupDatetime: pickupDay,
      distanceKm: 230,
      promoCode: "asttcar500off",
    });
    expect(fare.promoValid).toBe(true);
    expect(fare.discountAmount).toBe(500);
    expect(fare.totalFare).toBe(2999);
  });

  it("ignores invalid promo codes without failing", () => {
    const promo = applyPromo("VIP100", 5000);
    expect(promo.valid).toBe(false);
    expect(promo.discount).toBe(0);
  });

  it("rejects return before pickup", () => {
    expect(() =>
      calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        returnDatetime: "2026-09-01T08:00:00+05:30",
        distanceKm: 230,
      }),
    ).toThrow(/Return datetime/);
  });

  it("prices curated packages with vehicle upgrades", () => {
    const sedan = calculateFare({
      tripType: "one-way",
      vehicleTier: "sedan",
      originName: "Agra",
      destinationName: "Agra",
      pickupDatetime: pickupDay,
      distanceKm: 80,
      packageId: "golden-triangle",
    });
    const ertiga = calculateFare({
      tripType: "one-way",
      vehicleTier: "ertiga",
      originName: "Agra",
      destinationName: "Agra",
      pickupDatetime: pickupDay,
      distanceKm: 80,
      packageId: "golden-triangle",
    });
    expect(sedan.baseFare).toBe(18500);
    expect(ertiga.baseFare).toBe(19300);
  });
});
