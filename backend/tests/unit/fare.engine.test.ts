import { describe, expect, it } from "vitest";
import { advanceOf } from "../../src/shared/money.js";
import { applyPromo, calculateCancellationRefund, calculateFare, isNightPickup } from "../../src/modules/fares/fare.engine.js";

const pickupDay = "2026-10-01T08:00:00+05:30";
const pickupNight = "2026-10-01T22:30:00+05:30";
const pickupEdgeNight = "2026-10-01T05:59:00+05:30";
const pickupEdgeDay = "2026-10-01T06:01:00+05:30";

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

  it("applies night allowance for 20:00-06:00 IST pickups (Dossier §5)", () => {
    expect(isNightPickup(pickupNight)).toBe(true);
    expect(isNightPickup(pickupEdgeNight)).toBe(true);
    expect(isNightPickup(pickupEdgeDay)).toBe(false);

    // Also supports configurable override window
    expect(isNightPickup("2026-10-01T05:01:00+05:30", { nightStartHour: 22, nightEndHour: 5 })).toBe(false);

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

describe("Phase 4 Dossier Engine Wiring", () => {
  describe("Night boundaries (19:59 no charge / 20:00 charge / 05:59 charge / 06:00 no charge)", () => {
    it("boundary 19:59 IST is day (no night charge)", () => {
      expect(isNightPickup("2026-10-01T19:59:00+05:30")).toBe(false);
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: "2026-10-01T19:59:00+05:30",
        distanceKm: 230,
      });
      expect(fare.nightAllowance).toBe(0);
    });

    it("boundary 20:00 IST is night (charge applied)", () => {
      expect(isNightPickup("2026-10-01T20:00:00+05:30")).toBe(true);
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: "2026-10-01T20:00:00+05:30",
        distanceKm: 230,
      });
      expect(fare.nightAllowance).toBe(300);
    });

    it("boundary 05:59 IST is night (charge applied)", () => {
      expect(isNightPickup("2026-10-01T05:59:00+05:30")).toBe(true);
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: "2026-10-01T05:59:00+05:30",
        distanceKm: 230,
      });
      expect(fare.nightAllowance).toBe(300);
    });

    it("boundary 06:00 IST is day (no night charge)", () => {
      expect(isNightPickup("2026-10-01T06:00:00+05:30")).toBe(false);
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: "2026-10-01T06:00:00+05:30",
        distanceKm: 230,
      });
      expect(fare.nightAllowance).toBe(0);
    });

    it("prefers override hours when present (e.g. 22:00 to 05:00)", () => {
      const overrides = { nightStartHour: 22, nightEndHour: 5 };
      expect(isNightPickup("2026-10-01T20:30:00+05:30", overrides)).toBe(false);
      expect(isNightPickup("2026-10-01T22:00:00+05:30", overrides)).toBe(true);
      expect(isNightPickup("2026-10-01T04:59:00+05:30", overrides)).toBe(true);
      expect(isNightPickup("2026-10-01T05:00:00+05:30", overrides)).toBe(false);
    });
  });

  describe("Dossier Strict Precedence per Tier", () => {
    it("Priority 1: admin fleetPrices[tier] when usePerKm is false takes top precedence", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Agra",
        pickupDatetime: "2026-10-01T10:00:00+05:30",
        distanceKm: 80,
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 3499, ertiga: 4299 },
          packageBasePrice: 2800, // Should be ignored in favor of fleetPrices
          perKmRateOverride: 15,  // Should be ignored in favor of fleetPrices
        },
      });
      expect(fare.baseFare).toBe(3499);
      expect(fare.totalFare).toBe(3499);
      expect(fare.rules).toContain("dossier-admin-fleet-price");
    });

    it("Priority 2: startingPrice + upgrade surcharge when fleetPrices[tier] is omitted", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "ertiga",
        originName: "Agra",
        destinationName: "Agra",
        pickupDatetime: "2026-10-01T10:00:00+05:30",
        distanceKm: 80,
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 3499 }, // ertiga omitted
          packageBasePrice: 3499,
          upgradeSurcharges: { ertiga: 800, innova: 1800 },
          perKmRateOverride: 15,
        },
      });
      expect(fare.baseFare).toBe(4299); // 3499 + 800
      expect(fare.rules).toContain("dossier-starting-price-upgrade");
    });

    it("Priority 3: per-km rate × km when usePerKm is true", () => {
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupDatetime: "2026-10-01T10:00:00+05:30",
        distanceKm: 200,
        ruleOverrides: {
          usePerKm: true,
          fleetPrices: { sedan: 3499 }, // Ignored because usePerKm is true
          perKmRateOverride: 12,
        },
      });
      expect(fare.baseFare).toBe(2400); // 200 km × 12/km
      expect(fare.rules).toContain("dossier-per-km-rate");
    });

    it("published dossier rows take precedence over legacy constants", () => {
      // Legacy "agra-day" constant has from: 3499, but dossier published row has updated prices
      const fare = calculateFare({
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Agra",
        pickupDatetime: "2026-10-01T10:00:00+05:30",
        distanceKm: 80,
        packageId: "agra-day",
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 3800 },
        },
      });
      expect(fare.baseFare).toBe(3800);
      expect(fare.rules).toContain("dossier-admin-fleet-price");
    });

    it("F2/C-API: fixed-price row with no price for the tier fails loud (no silent per-km fallthrough)", () => {
      // usePerKm === false (route_catalog fixed-price row) + tier missing from
      // fleetPrices + no packageBasePrice -> must throw TIER_NOT_PRICED, never
      // price per-km.
      let caught: unknown;
      try {
        calculateFare({
          tripType: "one-way",
          vehicleTier: "ertiga",
          originName: "Agra",
          destinationName: "Delhi",
          pickupDatetime: "2026-10-01T10:00:00+05:30",
          distanceKm: 200,
          ruleOverrides: {
            usePerKm: false,
            fleetPrices: { sedan: 3499 }, // ertiga omitted
          },
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeDefined();
      expect((caught as { code?: string }).code).toBe("TIER_NOT_PRICED");
    });
  });

  describe("Per-Night × Nights Math", () => {
    it("multi-night package on night pickup multiplies per-night charge by nights", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Agra",
        pickupDatetime: "2026-10-01T21:00:00+05:30", // Night pickup
        distanceKm: 300,
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 18500 },
          nightChargeInr: 300,
          nights: 2,
        },
      });
      expect(fare.nightAllowance).toBe(600); // 300 × 2 nights
      expect(fare.totalFare).toBe(19100);
    });

    it("single-day package on night pickup charges exactly 1 night charge", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Agra",
        pickupDatetime: "2026-10-01T21:00:00+05:30",
        distanceKm: 80,
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 3499 },
          nightChargeInr: 300,
          nights: 0,
        },
      });
      expect(fare.nightAllowance).toBe(300); // 300 × 1
      expect(fare.totalFare).toBe(3799);
    });

    it("multi-night package on day pickup has 0 night charge", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Agra",
        pickupDatetime: "2026-10-01T10:00:00+05:30", // Day pickup
        distanceKm: 300,
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 18500 },
          nightChargeInr: 300,
          nights: 2,
        },
      });
      expect(fare.nightAllowance).toBe(0);
      expect(fare.totalFare).toBe(18500);
    });

    it("consumes route_catalog.night_halt_inr the same way", () => {
      const fare = calculateFare({
        tripType: "round-trip",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Jaipur",
        pickupDatetime: "2026-10-01T20:30:00+05:30",
        distanceKm: 240,
        ruleOverrides: {
          usePerKm: false,
          fleetPrices: { sedan: 6500 },
          nightHaltInr: 350,
          nights: 2,
        },
      });
      expect(fare.nightAllowance).toBe(700); // 350 × 2
      expect(fare.totalFare).toBe(7200);
    });
  });

  describe("Quote-vs-Charge Parity Check", () => {
    it("guarantees admin-set fleet price exactly equals engine output for all 5 tiers", () => {
      const adminFleetPrices = {
        sedan: 3499,
        ertiga: 4299,
        "innova-crysta": 5299,
        "tempo-traveller": 6999,
        urbania: 8999,
      };

      const tiers = [
        "sedan",
        "ertiga",
        "innova-crysta",
        "tempo-traveller",
        "urbania",
      ] as const;

      for (const tier of tiers) {
        const fare = calculateFare({
          tripType: "round-trip",
          vehicleTier: tier,
          originName: "Agra",
          destinationName: "Agra",
          pickupDatetime: "2026-10-01T10:00:00+05:30", // Day pickup (no night surcharge)
          distanceKm: 100,
          ruleOverrides: {
            usePerKm: false,
            fleetPrices: {
              sedan: 3499,
              ertiga: 4299,
              innova: 5299,
              tempo: 6999,
              urbania: 8999,
            },
          },
        });
        expect(fare.baseFare).toBe(adminFleetPrices[tier]);
        expect(fare.totalFare).toBe(adminFleetPrices[tier]);
      }
    });
  });

  describe("Dossier Cancellation Policies & Refund Slabs (All 9 Cases)", () => {
    const paidMinor = 100000; // ₹1,000.00 advance (100,000 paise)

    // Cab / Outstation Slabs (Dossier §6)
    it("Slab 1: Cab with >= 24h notice gets 100% refund, 0% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "cab",
        noticeHours: 24,
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(100);
      expect(result.feeRetainedPercent).toBe(0);
      expect(result.refundAmountMinor).toBe(100000);
      expect(result.feeRetainedAmountMinor).toBe(0);
    });

    it("Slab 2: Cab with < 24h notice gets 0% refund, 100% fee retained", () => {
      const result = calculateCancellationRefund({
        policyType: "cab",
        noticeHours: 12,
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(0);
      expect(result.feeRetainedPercent).toBe(100);
      expect(result.refundAmountMinor).toBe(0);
      expect(result.feeRetainedAmountMinor).toBe(100000);
    });

    it("Slab 3: Cab no-show (0h notice) gets 0% refund, advance forfeited", () => {
      const result = calculateCancellationRefund({
        policyType: "cab",
        noticeHours: 0,
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(0);
      expect(result.feeRetainedPercent).toBe(100);
      expect(result.refundAmountMinor).toBe(0);
      expect(result.feeRetainedAmountMinor).toBe(100000);
    });

    // Tour Package Slabs (Dossier §8)
    it("Slab 4: Tour package > 60 days gets 100% refund, 0% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "tour_package",
        noticeHours: 65 * 24, // 65 days
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(100);
      expect(result.feeRetainedPercent).toBe(0);
      expect(result.refundAmountMinor).toBe(100000);
      expect(result.feeRetainedAmountMinor).toBe(0);
    });

    it("Slab 5: Tour package 46–60 days gets 90% refund, 10% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "tour_package",
        noticeHours: 50 * 24, // 50 days
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(90);
      expect(result.feeRetainedPercent).toBe(10);
      expect(result.refundAmountMinor).toBe(90000);
      expect(result.feeRetainedAmountMinor).toBe(10000);
    });

    it("Slab 6: Tour package 31–45 days gets 80% refund, 20% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "tour_package",
        noticeHours: 35 * 24, // 35 days
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(80);
      expect(result.feeRetainedPercent).toBe(20);
      expect(result.refundAmountMinor).toBe(80000);
      expect(result.feeRetainedAmountMinor).toBe(20000);
    });

    it("Slab 7: Tour package 16–30 days gets 70% refund, 30% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "tour_package",
        noticeHours: 20 * 24, // 20 days
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(70);
      expect(result.feeRetainedPercent).toBe(30);
      expect(result.refundAmountMinor).toBe(70000);
      expect(result.feeRetainedAmountMinor).toBe(30000);
    });

    it("Slab 8: Tour package 6–15 days gets 45% refund, 55% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "tour_package",
        noticeHours: 10 * 24, // 10 days
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(45);
      expect(result.feeRetainedPercent).toBe(55);
      expect(result.refundAmountMinor).toBe(45000);
      expect(result.feeRetainedAmountMinor).toBe(55000);
    });

    it("Slab 9: Tour package 0–5 days / no-show gets 0% refund, 100% fee", () => {
      const result = calculateCancellationRefund({
        policyType: "tour_package",
        noticeHours: 3 * 24, // 3 days
        paidAmountMinor: paidMinor,
      });
      expect(result.refundPercent).toBe(0);
      expect(result.feeRetainedPercent).toBe(100);
      expect(result.refundAmountMinor).toBe(0);
      expect(result.feeRetainedAmountMinor).toBe(100000);
    });
  });
});
