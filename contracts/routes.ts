import type { CatalogStatus } from "./product-verticals.js";

export type RouteTripType = "one-way" | "round-trip" | "local-tour";

export interface InterstateCharge {
  state: string;
  amount_inr: number;
  note?: string;
}

export interface RouteStop {
  name: string;
  halt_mins?: number;
}

export interface RouteFleet {
  id: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
}

export interface RouteItem {
  id: string;
  tripType: RouteTripType;
  sourceCity: string;
  sourceDetail?: string | null;
  destinationCity: string | null;
  slug: string;
  distanceKm: number | null;
  durationText: string | null;
  availableFleets: string[];
  faresInr: Record<string, number>;
  driverChargeInr: number;
  nightHaltInr: number;
  tollIncluded: boolean;
  tollAmountInr: number | null;
  interstateCharges: InterstateCharge[];
  minKmPerDay: number;
  stops: RouteStop[];
  usePerKm?: boolean;
  perKmRateOverride?: number | null;
  highway?: string | null;
  allInclusiveNote?: string | null;
  status: CatalogStatus;
  needsReview?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRouteInput {
  tripType: RouteTripType;
  sourceCity: string;
  sourceDetail?: string | null;
  destinationCity: string | null;
  slug: string;
  distanceKm?: number | null;
  durationText?: string | null;
  availableFleets: string[];
  faresInr: Record<string, number>;
  driverChargeInr?: number;
  nightHaltInr?: number;
  tollIncluded?: boolean;
  tollAmountInr?: number | null;
  interstateCharges?: InterstateCharge[];
  minKmPerDay?: number;
  stops?: RouteStop[];
  usePerKm?: boolean;
  perKmRateOverride?: number | null;
  highway?: string | null;
  allInclusiveNote?: string | null;
  status?: CatalogStatus;
}

export type UpdateRouteInput = Partial<CreateRouteInput>;
