import {
  LOCAL_PACKAGES,
  PACKAGE_UPGRADES,
  isGroupExceptionVehicle,
  toInternalVehicleId,
  type RouteFare,
  type VehicleSpec,
} from "../fare.catalogue.js";
import { titleCase } from "../resolvers/route.resolver.js";
import type { FareEngineInput } from "../fare.types.js";
import type { IntermediateFareCalculation } from "./calculator.types.js";

/**
 * Calculates pricing for local sightseeing tours (8hr-80km, 12hr-120km, local route tours).
 */
export function calculateLocalTourFare(
  input: FareEngineInput,
  _spec: VehicleSpec,
  fareVersion: string,
): IntermediateFareCalculation | null {
  const isLocal =
    input.tripType === "local-tour" ||
    input.localPackageKey === "8hr-80km" ||
    input.localPackageKey === "12hr-120km";

  if (!isLocal) return null;

  const vehicleId = toInternalVehicleId(input.vehicleTier);
  const isForce = isGroupExceptionVehicle(input.vehicleTier);

  // If there's a catalog-level price override for the local tour
  if (
    input.ruleOverrides?.catalogItemType === "tour" &&
    input.ruleOverrides.packageBasePrice !== undefined
  ) {
    const catalogDist = input.ruleOverrides.catalogDistanceKm ?? input.distanceKm;
    const baseFare = input.ruleOverrides.packageBasePrice + PACKAGE_UPGRADES[vehicleId];
    const driverAllowance =
      input.ruleOverrides?.driverAllowance !== undefined
        ? input.ruleOverrides.driverAllowance
        : isForce
        ? 500
        : 0;

    return {
      tripType: "local-tour",
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
      fareVersion,
      baseFare,
      nightAllowance: 0,
      driverAllowance,
      distanceKm: catalogDist,
      billedKm: catalogDist,
      alwaysRoundTrip: isForce && catalogDist < 300,
      label: input.ruleOverrides.packageName ?? "Local Tour",
      duration: input.ruleOverrides.packageDuration ?? "Full Day",
      roundMultiplierApplied: false,
      applyNight: false,
      rules: ["catalog-local-tour", "catalog-fixed", "vehicle-upgrade"],
      ruleOverrides: input.ruleOverrides,
    };
  }

  // Standard curated 8hr-80km or 12hr-120km package
  const key = input.localPackageKey === "12hr-120km" ? "12hr-120km" : "8hr-80km";
  const lp = LOCAL_PACKAGES[key];

  return {
    tripType: "local-tour",
    vehicleTier: input.vehicleTier,
    pickupDatetime: input.pickupDatetime,
    promoCode: input.promoCode,
    allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
    fareVersion,
    baseFare: lp.fares[vehicleId],
    nightAllowance: 0,
    driverAllowance: isForce ? 500 : 0,
    distanceKm: lp.km,
    billedKm: lp.km,
    alwaysRoundTrip: isForce,
    label: lp.label,
    duration: lp.duration,
    roundMultiplierApplied: false,
    applyNight: false,
    rules: ["local-package", key],
    ruleOverrides: input.ruleOverrides,
  };
}

/**
 * Calculates pricing when a route is identified as a local tour (origin === destination).
 */
export function calculateLocalRouteFare(
  input: FareEngineInput,
  route: RouteFare,
  fareVersion: string,
): IntermediateFareCalculation {
  const vehicleId = toInternalVehicleId(input.vehicleTier);
  const catalogFare = route.fares[vehicleId];
  const isForce = isGroupExceptionVehicle(input.vehicleTier);

  return {
    tripType: "local-tour",
    vehicleTier: input.vehicleTier,
    pickupDatetime: input.pickupDatetime,
    promoCode: input.promoCode,
    allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
    fareVersion,
    baseFare: catalogFare,
    nightAllowance: 0,
    driverAllowance: isForce ? 500 : 0,
    distanceKm: route.km,
    billedKm: route.km,
    alwaysRoundTrip: isForce,
    label: route.localLabel ?? `${titleCase(input.originName)} Local Tour`,
    duration: route.duration,
    roundMultiplierApplied: false,
    applyNight: false,
    rules: [`route:${route.id}`, "local-route"],
    ruleOverrides: input.ruleOverrides,
  };
}
