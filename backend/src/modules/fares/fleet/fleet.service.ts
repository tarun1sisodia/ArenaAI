import { toCanonicalTierKey } from "../../../contracts/vehicle-tiers.js";
import type { Repositories } from "../../../db/types.js";
import { VEHICLES } from "../fare.catalogue.js";
import type { FleetQueryResult, PublicFleetVehicle } from "./fleet.types.js";

/**
 * Resolves the live fleet configuration by reading default catalogue specifications
 * and merging active database fare rules (with desk-side vehicle edits for name, seats, bags, perKm, active).
 */
export async function resolveFleet(
  db?: Repositories,
  defaultVersion: string = "2026-09-13",
): Promise<FleetQueryResult> {
  const base: PublicFleetVehicle[] = VEHICLES.map((v) => ({
    id: v.id,
    tier: v.tier,
    name: v.name,
    seats: v.seats,
    bags: v.bags,
    perKm: v.perKm,
    active: true,
  }));

  if (!db) {
    return { version: defaultVersion, vehicles: base };
  }

  const rule = await db.fareRules.getActive();
  const cfgVehicles =
    rule && Array.isArray((rule.config as Record<string, unknown>).vehicles)
      ? ((rule.config as Record<string, unknown>).vehicles as Array<Record<string, unknown>>)
      : [];

  const vehicles = base.map((v) => {
    // C-ENUM-001: override keys are normalized to canonical tier keys, so
    // desk-side entries keyed by legacy short ids (innova/tempo) still match.
    const override = cfgVehicles.find((ov) => {
      const key = toCanonicalTierKey(String(ov.tier ?? ov.id ?? ""));
      return key !== undefined && key === v.tier;
    });

    if (!override) return v;

    return {
      ...v,
      name:
        typeof override.name === "string" && override.name.trim()
          ? override.name.trim()
          : v.name,
      seats:
        typeof override.seats === "number" && override.seats > 0
          ? Math.floor(override.seats)
          : v.seats,
      bags:
        typeof override.bags === "number" && override.bags >= 0
          ? Math.floor(override.bags)
          : v.bags,
      perKm:
        typeof override.perKm === "number" && override.perKm > 0
          ? override.perKm
          : v.perKm,
      active: typeof override.active === "boolean" ? override.active : v.active,
    };
  });

  return {
    version: rule?.version ?? defaultVersion,
    vehicles,
  };
}
