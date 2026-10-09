import type { TripType, VehicleTier } from "../../../types/domain.js";
import type { FareRuleOverrides } from "../fare.types.js";

export interface IntermediateFareCalculation {
  tripType: TripType;
  vehicleTier: VehicleTier;
  pickupDatetime: string;
  promoCode?: string;
  allowPromo?: boolean;
  fareVersion: string;
  baseFare: number;
  nightAllowance?: number;
  driverAllowance: number;
  distanceKm: number;
  billedKm: number;
  alwaysRoundTrip: boolean;
  label: string;
  duration: string;
  roundMultiplierApplied: boolean;
  applyNight: boolean;
  rules: string[];
  ruleOverrides?: FareRuleOverrides;
}
