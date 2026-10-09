import type { FareRuleset, VehicleTier } from "@/lib/types";

export type { FareRuleset, VehicleTier };

export interface EditableVehicle {
  tier: VehicleTier;
  name: string;
  seats: number;
  perKm: number;
  active: boolean;
}

export interface FareRulesFormState {
  minKmPerDay: number;
  nightAllowanceCab: number;
  nightAllowanceTempo: number;
}
