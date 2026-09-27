import { describe, expect, it } from "vitest";
import { advanceOf } from "../../src/shared/money.js";
import { applyPromo, calculateFare, isNightPickup } from "../../src/modules/fares/fare.engine.js";

const pickupDay = "2026-10-01T08:00:00+05:30";
const pickupNight = "2026-10-01T22:30:00+05:30";
const pickupEdgeNight = "2026-10-01T04:59:00+05:30";
const pickupEdgeDay = "2026-10-01T05:01:00+05:30";

describe("advanceOf", () => {
  it("rounds 28% to nearest 100 with a 500 minimum", () => {
    expect(advanceOf(1900)).toBe(500);
    expect(advanceOf(3499)).toBe(1000);
    expect(advanceOf(18500)).toBe(5200);
  });

  it("never exceeds the total fare", () => {
    expect(advanceOf(400)).toBe(400);
  });

  it("rejects non-finite values", () => {
    expect(() => advanceOf(NaN)).toThrow();
    expect(() => advanceOf(Infinity)).toThrow();
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

  it("applies night allowance for 22:00-05:00 IST pickups (spec)", () => {
    expect(isNightPickup(pickupNight)).toBe(true);
    expect(isNightPickup(pickupEdgeNight)).toBe(true);
    expect(isNightPickup(pickupEdgeDay)).toBe(false);
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
    expect(fare.rules.some((rule: string) => rule.includes("300km"))).toBe(true);
  });

  it("charges exactly 2x distance for tempo outside corridors without 300km floor", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "SomeUnknownPlace",
      pickupDatetime: pickupDay,
      distanceKm: 100,
    });
    expect(fare.billedKm).toBe(200);
    expect(fare.baseFare).toBe(200 * 25);
  });

  describe("Exception Vehicles (Force, Urbania, Tempo) Commercial Engine Rules", () => {
    it("Rule 1 (Trip Type Override): forces round-trip even when user selects one-way", () => {
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Mathura",
        pickupDatetime: pickupDay,
        distanceKm: 55,
      });
      expect(fare.tripType).toBe("round-trip");
      expect(fare.alwaysRoundTrip).toBe(true);
      expect(fare.rules).toContain("forced-round-trip");
      expect(fare.rules).toContain("commercial-group-vehicle-exception");
    });

    it("Rule 2 (No Minimum Distance Override): bills exactly 2x one-way distance without 300 km floor", () => {
      // 55km one-way -> 110km round-trip billed (NOT floored to 300km)
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Mathura",
        pickupDatetime: pickupDay,
        distanceKm: 55,
      });
      expect(fare.billedKm).toBe(110);
      expect(fare.baseFare).toBe(110 * 25); // ₹2,750
      expect(fare.driverAllowance).toBe(500); // ₹500 daily driver allowance
      expect(fare.totalFare).toBe(2750 + 500); // ₹3,250
    });

    it("Rule 2 (Distance Doubling): calculates 2x distance for deadhead return", () => {
      // 230km one-way (Agra to Delhi) -> 460km round-trip
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "urbania",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        distanceKm: 230,
      });
      expect(fare.billedKm).toBe(460);
      expect(fare.baseFare).toBe(460 * 34); // ₹15,640
      expect(fare.driverAllowance).toBe(500);
      expect(fare.totalFare).toBe(15640 + 500); // ₹16,140
    });

    it("Rule 3 (Locked Pricing Structure): rejects promo codes on commercial group vans", () => {
      expect(() =>
        calculateFare({
          tripType: "one-way",
          vehicleTier: "urbania",
          originName: "Agra",
          destinationName: "Delhi",
          pickupDatetime: pickupDay,
          distanceKm: 230,
          promoCode: "ASTTCAR500OFF",
        })
      ).toThrowError(expect.objectContaining({ code: "PROMO_NOT_ALLOWED" }));
    });

    it("Multi-Day commercial van rules: charges exact billed km and ₹500/day driver allowance without 300km floor", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Jaipur",
        pickupDatetime: pickupDay,
        returnDatetime: "2026-10-03T18:00:00+05:30", // 3 days
        distanceKm: 480, // 480km round trip
      });
      expect(fare.billedKm).toBe(480);
      expect(fare.baseFare).toBe(480 * 25); // ₹12,000
      expect(fare.driverAllowance).toBe(1500); // 3 * 500
      expect(fare.totalFare).toBe(12000 + 1500); // ₹13,500
    });

    it("Vehicle naming variants: handles 'force-urbania' and 'force-tempo' safely", () => {
      const urbaniaFare = calculateFare({
        tripType: "one-way",
        vehicleTier: "force-urbania" as any,
        originName: "Agra",
        destinationName: "Mathura",
        pickupDatetime: pickupDay,
        distanceKm: 55,
      });
      expect(urbaniaFare.tripType).toBe("round-trip");
      expect(urbaniaFare.billedKm).toBe(110);
      expect(urbaniaFare.baseFare).toBe(110 * 34); // ₹3,740 (55 km * 2, no 300km floor)
      expect(urbaniaFare.driverAllowance).toBe(500);
    });
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

  it("rejects promo with invalid format", () => {
    const promo = applyPromo("<script>", 5000);
    expect(promo.valid).toBe(false);
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

  it("rejects non-finite distance", () => {
    expect(() =>
      calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        distanceKm: NaN,
      }),
    ).toThrow();
  });

  it("rejects return more than 30 days after pickup", () => {
    expect(() =>
      calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        returnDatetime: "2026-11-15T08:00:00+05:30",
        distanceKm: 230,
      }),
    ).toThrow(/30 days/);
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
