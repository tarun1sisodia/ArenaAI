import { findRoute } from "./route.resolver.js";
import type { CalculateFareInput } from "../fare.types.js";

/**
 * Resolves the billable distance in kilometers.
 * Enforces strict precedence:
 * 1. Dossier distance from database package/transfer/route records
 * 2. Catalog distance from published items
 * 3. Standard package defaults (Tour package: 100km, 8hr-80km: 80km, 12hr-120km: 120km, Transfers: 20km)
 * 4. Corridor route distance calculated from origin/destination
 */
export function resolveTripDistanceKm(
  input: CalculateFareInput,
  dossierDistanceKm?: number,
  catalogDistanceKm?: number,
): number {
  if (input.distanceKm && Number.isFinite(input.distanceKm) && input.distanceKm > 0) {
    return input.distanceKm;
  }

  if (dossierDistanceKm && dossierDistanceKm > 0) {
    return dossierDistanceKm;
  }

  if (catalogDistanceKm && catalogDistanceKm > 0) {
    return catalogDistanceKm;
  }

  if (input.ruleOverrides?.catalogDistanceKm && input.ruleOverrides.catalogDistanceKm > 0) {
    return input.ruleOverrides.catalogDistanceKm;
  }

  if (input.packageId) {
    return 100;
  }

  if (input.localPackageKey === "8hr-80km") {
    return 80;
  }

  if (input.localPackageKey === "12hr-120km") {
    return 120;
  }

  if (
    input.localPackageKey === "airport-transfer" ||
    input.tripType === "airport-transfer"
  ) {
    return 20;
  }

  const route = findRoute(input.originName, input.destinationName);
  return route.km;
}
