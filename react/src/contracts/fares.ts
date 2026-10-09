/**
 * GENERATED — do not edit by hand.
 * Source: contracts/fares.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
import type { VehicleTier } from "./vehicle-tiers.js";
import type { TripType } from "./trip-types.js";

export interface FareSnapshot {
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  tollsTaxes: number;
  promoDiscount: number;
  discountAmount?: number;
  totalFare: number;
  advancePaid: number;
  advanceAmount?: number;
  balancePayable: number;
  balanceAmount?: number;
  currency?: string;
  fareVersion?: string;
  label?: string;
  duration?: string;
  distanceKm?: number;
  billedKm?: number;
  tripType?: string;
  vehicleTier?: string;
  promoCode?: string | null;
  promoValid?: boolean;
}

export interface CalculateFareInput {
  tripType: TripType | string;
  vehicleTier: VehicleTier | string;
  distanceKm?: number;
  packageCode?: string;
  routeCode?: string;
  promoCode?: string;
  pickupDatetime?: string;
  returnDatetime?: string;
  pickupTime?: string;
  returnTime?: string;
}

export interface CalculateFareResponse {
  fare: FareSnapshot;
  breakdown?: Record<string, unknown>;
}
