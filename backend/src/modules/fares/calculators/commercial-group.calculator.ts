import { calendarDaysInclusiveIst } from "../../../shared/clock.js";
import { roundRupees } from "../../../shared/money.js";
import { isGroupExceptionVehicle } from "../fare.catalogue.js";
import type { TripType } from "../../../types/domain.js";
import type { FareEngineInput } from "../fare.types.js";
import type { PricingCalculationResult, PricingStrategy, PricingStrategyContext } from "../fare.strategy.js";

/**
 * Exception Pricing Strategy for Group Commercial Vehicles (Tempo Traveller, Force Urbania).
 *
 * BUSINESS RULES ENFORCED:
 * 1. Trip Type Override: Destinations under 300 km must ALWAYS be calculated and charged as a Round Trip.
 * 2. Distance Rule:
 *    - Destinations under 300 km: forced round-trip (billedKm = distanceKm * 2).
 *    - Destinations at or above 300 km: billed according to requested trip type.
 * 3. Pricing Structure: Locked fixed-rate pricing (billedKm * perKm rate).
 * 4. Driver Allowance: Daily driver allowance of strictly ₹500/day.
 * 5. Promo Codes: Zero promo discounts permitted on commercial group vehicles unless promoAllowGroupVehicles.
 */
export class GroupCommercialVehicleStrategy implements PricingStrategy {
  readonly name = "GroupCommercialVehicleStrategy";

  isApplicable(vehicleTier: string): boolean {
    return isGroupExceptionVehicle(vehicleTier);
  }

  calculate(input: FareEngineInput, ctx: PricingStrategyContext): PricingCalculationResult {
    // Calendar Days (minimum 1 day)
    const days = Math.max(1, calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime));

    // Rule 1 & 2: Distance & Trip Type Rules
    // - Under 300 km: forced round-trip, distance doubled, ₹500/day driver allowance
    // - 300 km and above: per-kilometer logic without forced round trip
    const isUnder300 = input.distanceKm < 300;
    const isForcedRoundTrip = isUnder300;
    const effectiveTripType: TripType = isForcedRoundTrip ? "round-trip" : input.tripType;
    const alwaysRoundTrip = isForcedRoundTrip;

    const billedKm = isForcedRoundTrip
      ? input.distanceKm * 2
      : input.tripType === "round-trip" && input.distanceKm < 500 && !input.returnDatetime
      ? input.distanceKm * 2
      : input.distanceKm;

    // Rule 3: Fixed-rate pricing structure (billed km * perKm rate)
    const baseFare = roundRupees(billedKm * ctx.spec.perKm);

    // Rule 4: Driver Allowance — strictly ₹500/day unless configured
    const driverAllowance = (ctx.driverAllowance !== undefined ? ctx.driverAllowance : 500) * days;

    const rules: string[] = [
      "commercial-group-vehicle-exception",
      ...(isForcedRoundTrip
        ? ["forced-round-trip", "forced-round-trip-under-300km"]
        : ["per-km-group-vehicle"]),
      `distance-rule:${isForcedRoundTrip ? "round-trip" : "per-km"}`,
      `days:${days}`,
      `billable-km:${billedKm}`,
      `driver-allowance:${driverAllowance}`,
      "locked-fixed-rate-pricing",
    ];

    return {
      effectiveTripType,
      baseFare,
      driverAllowance,
      distanceKm: input.distanceKm,
      billedKm,
      alwaysRoundTrip,
      roundMultiplierApplied: false,
      rules,
      allowPromo: Boolean(input.promoAllowGroupVehicles),
    };
  }
}
