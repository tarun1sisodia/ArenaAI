import type { FareBreakdown, TripType, VehicleTier } from "../../types/domain.js";

export type FareEngineInput = {
  tripType: TripType;
  vehicleTier: VehicleTier;
  originName: string;
  destinationName: string;
  pickupDatetime: string;
  returnDatetime?: string;
  distanceKm: number;
  promoCode?: string;
  packageId?: string;
  localPackageKey?: "8hr-80km" | "12hr-120km" | "airport-transfer";
  fareVersion?: string;
};

export type CalculateFareInput = Omit<FareEngineInput, "distanceKm"> & {
  distanceKm?: number;
};

export type PromoEvaluation = {
  valid: boolean;
  discount: number;
  code: string | null;
  description?: string;
};

export type FareEngineResult = FareBreakdown;
