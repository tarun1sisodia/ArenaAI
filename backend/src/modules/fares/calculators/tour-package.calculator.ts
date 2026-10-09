import { AppError } from "../../../shared/errors.js";
import { calendarDaysInclusiveIst } from "../../../shared/clock.js";
import { roundRupees } from "../../../shared/money.js";
import { resolveTierKey } from "../../../contracts/vehicle-tiers.js";
import {
  PACKAGES,
  PACKAGE_UPGRADES,
  isGroupExceptionVehicle,
  toInternalVehicleId,
  type VehicleSpec,
} from "../fare.catalogue.js";
import type { FareEngineInput, FareRuleOverrides } from "../fare.types.js";
import type { VehicleTier } from "../../../types/domain.js";
import type { IntermediateFareCalculation } from "./calculator.types.js";

export function packageByIdOrSlug(id?: string): (typeof PACKAGES)[number] | undefined {
  if (!id) return undefined;
  const clean = id.trim().toLowerCase();
  return PACKAGES.find((item) => item.id === clean || item.slug === clean);
}

/**
 * Evaluates the dossier fare path with strict precedence per tier:
 * 1. Admin fleetPrices[tier] for dossier tour packages and fixed local/transfer prices
 * 2. startingPrice + upgrade surcharge when no fleet-specific price exists
 * 3. per-km only for routes and local-package extra-distance rules
 */
export function evaluateDossierTierBaseFare(input: {
  vehicleTier: VehicleTier;
  distanceKm: number;
  spec: { perKm: number };
  ruleOverrides?: FareRuleOverrides;
}): { baseFare: number; rule: string } | null {
  const overrides = input.ruleOverrides;
  if (!overrides) return null;
  const tierKey = toInternalVehicleId(input.vehicleTier);

  const hasDossierFields =
    overrides.fleetPrices !== undefined ||
    overrides.usePerKm !== undefined ||
    overrides.perKmRateOverride !== undefined ||
    overrides.upgradeSurcharges !== undefined ||
    overrides.packageBasePrice !== undefined;

  if (!hasDossierFields) return null;

  // Tour packages are always fixed-price by vehicle tier. Never fall through
  // to a per-km calculation for a tour package.
  if ((overrides.catalogItemType === "tour" || overrides.usePerKm === false) && overrides.fleetPrices) {
    const hit = resolveTierKey(overrides.fleetPrices, input.vehicleTier);
    const rawPrice = hit.value;
    if (typeof rawPrice === "number" && rawPrice > 0) {
      return { baseFare: rawPrice, rule: "dossier-admin-fleet-price" };
    }
  }

  // Fixed package fallback when a tier-specific fleet price is unavailable.
  if (
    (overrides.catalogItemType !== "ride" || overrides.usePerKm === false) &&
    typeof overrides.packageBasePrice === "number" &&
    overrides.packageBasePrice > 0
  ) {
    const upgradeHit = resolveTierKey(overrides.upgradeSurcharges, input.vehicleTier);
    const upgradeSurcharge = upgradeHit.value ?? PACKAGE_UPGRADES[tierKey] ?? 0;
    return {
      baseFare: overrides.packageBasePrice + upgradeSurcharge,
      rule: "dossier-starting-price-upgrade",
    };
  }

  // Precedence 3: per-km
  if (overrides.usePerKm === false) {
    throw new AppError(
      "TIER_NOT_PRICED",
      `No fixed price configured for tier "${input.vehicleTier}" on this route/package.`,
      400,
    );
  }
  const rate =
    typeof overrides.perKmRateOverride === "number" && overrides.perKmRateOverride > 0
      ? overrides.perKmRateOverride
      : input.spec.perKm;
  return {
    baseFare: roundRupees(rate * input.distanceKm),
    rule: "dossier-per-km-rate",
  };
}

/**
 * Calculates tour package pricing for heritage packages or dossier tour packages.
 */
export function calculateTourPackageFare(
  input: FareEngineInput,
  spec: VehicleSpec,
  fareVersion: string,
): IntermediateFareCalculation | null {
  const isForce = isGroupExceptionVehicle(input.vehicleTier);
  const pack = packageByIdOrSlug(input.packageId);
  const packageBasePrice = input.ruleOverrides?.packageBasePrice ?? pack?.from;
  const packageName = input.ruleOverrides?.packageName ?? pack?.name;
  const packageDuration = input.ruleOverrides?.packageDuration ?? pack?.duration;

  if (
    (pack || input.ruleOverrides?.packageBasePrice !== undefined) &&
    input.ruleOverrides?.catalogItemType !== "tour" &&
    input.ruleOverrides?.catalogItemType !== "ride"
  ) {
    if (isForce) {
      const days = Math.max(1, calendarDaysInclusiveIst(input.pickupDatetime, input.returnDatetime));
      const billedKm = input.distanceKm < 300 ? input.distanceKm * 2 : input.distanceKm;
      const baseFare = roundRupees(billedKm * spec.perKm);
      const driverAllowance =
        (input.ruleOverrides?.driverAllowance !== undefined
          ? input.ruleOverrides.driverAllowance
          : 500) * days;

      return {
        tripType: "round-trip",
        vehicleTier: input.vehicleTier,
        pickupDatetime: input.pickupDatetime,
        promoCode: input.promoCode,
        allowPromo: Boolean(input.promoAllowGroupVehicles),
        fareVersion,
        baseFare,
        nightAllowance: 0,
        driverAllowance,
        distanceKm: input.distanceKm,
        billedKm,
        alwaysRoundTrip: true,
        label: packageName ?? "Tour Package",
        duration: packageDuration ?? "Tour Package",
        roundMultiplierApplied: false,
        applyNight: false,
        rules: ["package-tour-force-rule", "commercial-group-vehicle-exception", "forced-round-trip"],
        ruleOverrides: input.ruleOverrides,
      };
    }

    const basePrice = packageBasePrice ?? 0;
    return {
      tripType: input.tripType,
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: true,
      fareVersion,
      baseFare: basePrice + PACKAGE_UPGRADES[toInternalVehicleId(input.vehicleTier)],
      nightAllowance: 0,
      driverAllowance: 0,
      distanceKm: input.distanceKm,
      billedKm: input.distanceKm,
      alwaysRoundTrip: false,
      label: packageName ?? "Tour Package",
      duration: packageDuration ?? "Tour Package",
      roundMultiplierApplied: false,
      applyNight: false,
      rules: ["package-fixed", "vehicle-upgrade"],
      ruleOverrides: input.ruleOverrides,
    };
  }

  return null;
}
