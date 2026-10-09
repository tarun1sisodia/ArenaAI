import { hourInIst } from "../../../shared/clock.js";
import { OUTSTATION_RULES, toInternalVehicleId } from "../fare.catalogue.js";
import type { FareRuleOverrides } from "../fare.types.js";

/**
 * Checks if a given pickup datetime falls within the night window.
 * Default window is 20:00–06:00 IST (Dossier §5).
 * Configurable via ruleOverrides.
 */
export function isNightPickup(
  pickupDatetime: string,
  overrides?: { nightStartHour?: number; nightEndHour?: number } | FareRuleOverrides,
): boolean {
  try {
    const hour = hourInIst(pickupDatetime);
    const startHour = typeof overrides?.nightStartHour === "number" ? overrides.nightStartHour : 20;
    const endHour = typeof overrides?.nightEndHour === "number" ? overrides.nightEndHour : 6;
    return hour >= startHour || hour < endHour;
  } catch {
    // If datetime invalid, don't apply night allowance but don't crash
    return false;
  }
}

/**
 * Resolves the nightly driver allowance for a vehicle tier.
 * Cabs (Sedan, Ertiga, Innova): ₹300/night (or override)
 * Group commercial (Tempo, Urbania): ₹500/night (or override)
 */
export function getNightAllowanceForTier(
  tier: string,
  overrides?: { nightAllowanceCab?: number; nightAllowanceTempo?: number } | FareRuleOverrides,
): number {
  const id = toInternalVehicleId(tier);
  if (id === "tempo" || id === "urbania") {
    return overrides?.nightAllowanceTempo ?? OUTSTATION_RULES.nightAllowanceTempo;
  }
  return overrides?.nightAllowanceCab ?? OUTSTATION_RULES.nightAllowanceCab;
}

export { nightAllowanceFor } from "../fare.catalogue.js";
