import {
  AIRPORT_TRANSFERS,
  LOCAL_PACKAGES,
  PACKAGE_UPGRADES,
  isGroupExceptionVehicle,
  toInternalVehicleId,
  type VehicleSpec,
} from "../fare.catalogue.js";
import { roundRupees } from "../../../shared/money.js";
import type { FareEngineInput } from "../fare.types.js";
import type { IntermediateFareCalculation } from "./calculator.types.js";

export function matchAirportTransfer(
  originName: string,
  destinationName: string,
): keyof typeof AIRPORT_TRANSFERS | null {
  const haystack = `${originName} ${destinationName}`.toLowerCase();
  if (haystack.includes("igi") || haystack.includes("delhi airport") || haystack.includes("indira gandhi")) {
    return "delhi-airport";
  }
  if (haystack.includes("kheria") || haystack.includes("agra airport")) {
    return "agra-airport";
  }
  if (haystack.includes("cantt") || haystack.includes("agra cantt") || haystack.includes("agra fort station")) {
    return "agra-station";
  }
  return null;
}

/**
 * Calculates pricing for airport or railway station transfers.
 */
export function calculateAirportTransferFare(
  input: FareEngineInput,
  spec: VehicleSpec,
  fareVersion: string,
): IntermediateFareCalculation | null {
  const isAirport =
    input.tripType === "airport-transfer" || input.localPackageKey === "airport-transfer";

  if (!isAirport) return null;

  const vehicleId = toInternalVehicleId(input.vehicleTier);
  const isForce = isGroupExceptionVehicle(input.vehicleTier);

  // If there's a catalog-level price override for the transfer ride
  if (input.ruleOverrides?.catalogItemType === "ride" && input.ruleOverrides.packageBasePrice !== undefined) {
    const catalogDist = input.ruleOverrides.catalogDistanceKm ?? input.distanceKm;
    const isUnder300 = catalogDist < 300;
    const baseFare = isForce
      ? roundRupees(isUnder300 ? catalogDist * 2 * spec.perKm : catalogDist * spec.perKm)
      : input.ruleOverrides.packageBasePrice + PACKAGE_UPGRADES[vehicleId];

    const driverAllowance =
      input.ruleOverrides?.driverAllowance !== undefined
        ? input.ruleOverrides.driverAllowance
        : isForce
        ? 500
        : 0;

    return {
      tripType: "airport-transfer",
      vehicleTier: input.vehicleTier,
      pickupDatetime: input.pickupDatetime,
      promoCode: input.promoCode,
      allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
      fareVersion,
      baseFare,
      nightAllowance: 0,
      driverAllowance,
      distanceKm: catalogDist,
      billedKm: isForce ? (isUnder300 ? catalogDist * 2 : catalogDist) : catalogDist,
      alwaysRoundTrip: isForce && isUnder300,
      label: input.ruleOverrides.packageName ?? "Airport / Station Transfer",
      duration: input.ruleOverrides.packageDuration ?? "Point to Point",
      roundMultiplierApplied: false,
      applyNight: false,
      rules: ["catalog-transfer", "catalog-fixed", "vehicle-upgrade"],
      ruleOverrides: input.ruleOverrides,
    };
  }

  // Standard curated transfer lookup
  const key = matchAirportTransfer(input.originName, input.destinationName) ?? "agra-airport";
  const transfer = AIRPORT_TRANSFERS[key] ?? {
    name: "Airport / Station Pickup & Drop",
    km: 20,
    fares: LOCAL_PACKAGES["airport-transfer"].fares,
  };

  return {
    tripType: "airport-transfer",
    vehicleTier: input.vehicleTier,
    pickupDatetime: input.pickupDatetime,
    promoCode: input.promoCode,
    allowPromo: !isForce || Boolean(input.promoAllowGroupVehicles),
    fareVersion,
    baseFare: transfer.fares[vehicleId],
    nightAllowance: 0,
    driverAllowance: 0,
    distanceKm: transfer.km,
    billedKm: transfer.km,
    alwaysRoundTrip: isForce,
    label: transfer.name,
    duration: "Point to Point",
    roundMultiplierApplied: false,
    applyNight: true,
    rules: ["airport-transfer", key],
    ruleOverrides: input.ruleOverrides,
  };
}
