import { isGroupExceptionVehicle, nightAllowanceFor } from "../fare.catalogue.js";
import type { FareEngineResult } from "../fare.types.js";
import { isNightPickup } from "../rules/night.rules.js";
import { applyPromo } from "../rules/promo.rules.js";
import { calculateAdvanceAndBalance } from "../rules/advance.rules.js";
import type { IntermediateFareCalculation } from "./calculator.types.js";

/**
 * Finalizes fare calculation by applying:
 * - Night allowances (IST window 20:00-06:00, tier rates)
 * - Toll charges
 * - Promo code discounts
 * - Advance deposit calculation (28% with ₹500 floor, rounded to ₹100, zero client price trust)
 * - Remaining balance
 */
export function finalizeFare(args: IntermediateFareCalculation): FareEngineResult {
  const overrides = args.ruleOverrides;
  const isNight = isNightPickup(args.pickupDatetime, overrides);

  const standardNight = isGroupExceptionVehicle(args.vehicleTier)
    ? (overrides?.nightAllowanceTempo ?? nightAllowanceFor(args.vehicleTier))
    : (overrides?.nightAllowanceCab ?? nightAllowanceFor(args.vehicleTier));

  let nightRate = standardNight;
  if (typeof overrides?.nightChargeInr === "number") {
    nightRate = overrides.nightChargeInr;
  } else if (typeof overrides?.nightHaltInr === "number" && overrides.nightHaltInr > 0) {
    nightRate = overrides.nightHaltInr;
  }

  // Multi-day packages multiply per-night charge by nights (default 1 night on night pickup)
  const effectiveNights = overrides?.nights && overrides.nights > 0 ? overrides.nights : 1;

  let nightAllowance = 0;
  if (isNight) {
    if (
      nightRate > 0 &&
      (args.applyNight ||
        typeof overrides?.nightChargeInr === "number" ||
        typeof overrides?.nightHaltInr === "number")
    ) {
      nightAllowance = nightRate * effectiveNights;
    }
  } else if (args.nightAllowance && args.nightAllowance > 0) {
    nightAllowance = args.nightAllowance;
  }

  if (nightAllowance > 0 && !args.rules.includes("night-allowance")) {
    args.rules.push("night-allowance");
  }

  const tollAmount =
    typeof overrides?.tollAmountInr === "number" && overrides.tollAmountInr > 0
      ? overrides.tollAmountInr
      : 0;
  if (tollAmount > 0 && !args.rules.includes("toll-charge")) {
    args.rules.push("toll-charge");
  }

  const subtotal = args.baseFare + nightAllowance + args.driverAllowance + tollAmount;
  const promo =
    args.allowPromo !== false
      ? applyPromo(args.promoCode, subtotal)
      : { valid: false, discount: 0, code: null };
  const totalFare = Math.max(1, subtotal - promo.discount);
  const { advanceAmount, balanceAmount } = calculateAdvanceAndBalance(totalFare);

  return {
    baseFare: args.baseFare,
    nightAllowance,
    driverAllowance: args.driverAllowance,
    discountAmount: promo.discount,
    totalFare,
    advanceAmount,
    balanceAmount,
    currency: "INR",
    fareVersion: args.fareVersion,
    label: args.label,
    duration: args.duration,
    distanceKm: args.distanceKm,
    billedKm: args.billedKm,
    alwaysRoundTrip: args.alwaysRoundTrip,
    tripType: args.tripType,
    vehicleTier: args.vehicleTier,
    promoCode: promo.valid ? promo.code : args.promoCode ? args.promoCode.trim().toUpperCase() : null,
    promoValid: promo.valid,
    roundMultiplierApplied: args.roundMultiplierApplied,
    rules: args.rules,
  };
}
