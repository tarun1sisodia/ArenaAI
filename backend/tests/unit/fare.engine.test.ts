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
    expect(fare.rules.some((rule) => rule.includes("300km"))).toBe(true);
  });

  it("enforces 300 km minimum for tempo/urbania outside corridors", () => {
    const fare = calculateFare({
      tripType: "one-way",
      vehicleTier: "tempo-traveller",
      originName: "Agra",
      destinationName: "SomeUnknownPlace",
      pickupDatetime: pickupDay,
      distanceKm: 100,
    });
    expect(fare.baseFare).toBeGreaterThanOrEqual(300 * 25);
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
      expect(fare.rules).toContain("forced-round-trip");
      expect(fare.rules).toContain("commercial-group-vehicle-exception");
    });

    it("Rule 2 (Minimum Distance Override): floors at 300 km when 2x one-way distance is less than 300 km", () => {
      // 55km one-way -> 110km round-trip -> floored to 300km
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Mathura",
        pickupDatetime: pickupDay,
        distanceKm: 55,
      });
      expect(fare.distanceKm).toBe(300);
      expect(fare.baseFare).toBe(300 * 25); // ₹7,500
      expect(fare.driverAllowance).toBe(500); // ₹500 daily driver allowance
      expect(fare.totalFare).toBe(7500 + 500); // ₹8,000
    });

    it("Rule 2 (Distance Doubling): calculates 2x distance for deadhead return when 2x distance > 300 km", () => {
      // 230km one-way (Agra to Delhi) -> 460km round-trip (> 300km)
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "urbania",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        distanceKm: 230,
      });
      expect(fare.distanceKm).toBe(460);
      expect(fare.baseFare).toBe(460 * 34); // ₹15,640
      expect(fare.driverAllowance).toBe(500);
      expect(fare.totalFare).toBe(15640 + 500); // ₹16,140
    });

    it("Rule 3 (Locked Pricing Structure): ignores promo discounts on commercial group vans", () => {
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "urbania",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: pickupDay,
        distanceKm: 230,
        promoCode: "ASTTCAR500OFF",
      });
      expect(fare.promoValid).toBe(false);
      expect(fare.discountAmount).toBe(0);
      expect(fare.totalFare).toBe(fare.baseFare + fare.driverAllowance);
    });

    it("Multi-Day commercial van rules: charges 300km/day and ₹500/day driver allowance", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "tempo-traveller",
        originName: "Agra",
        destinationName: "Jaipur",
        pickupDatetime: pickupDay,
        returnDatetime: "2026-10-03T18:00:00+05:30", // 3 days
        distanceKm: 240, // 240 * 2 = 480km, but 3 days * 300 = 900km floor
      });
      expect(fare.distanceKm).toBe(900);
      expect(fare.baseFare).toBe(900 * 25); // ₹22,500
      expect(fare.driverAllowance).toBe(1500); // 3 * 500
      expect(fare.totalFare).toBe(22500 + 1500); // ₹24,000
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
      expect(urbaniaFare.baseFare).toBe(300 * 34); // ₹10,200
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
