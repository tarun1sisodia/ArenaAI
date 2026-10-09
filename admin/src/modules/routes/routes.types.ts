import type { CatalogStatus, RouteCatalogItem, RouteFleet, RouteStop, RouteTripType } from "@/lib/types";

export type { CatalogStatus, RouteCatalogItem, RouteFleet, RouteStop, RouteTripType };

export interface RouteFormState {
  sourceCity: string;
  sourceDetail: string;
  destinationCity: string;
  slug: string;
  distanceKm: string;
  durationText: string;
  driverChargeInr: string;
  nightHaltInr: string;
  tollAmountInr: string;
  minKmPerDay: string;
  usePerKm: boolean;
  perKmRateOverride: string;
  highway: string;
  allInclusiveNote: string;
}

export const EMPTY_ROUTE_FORM: RouteFormState = {
  sourceCity: "Agra",
  sourceDetail: "",
  destinationCity: "",
  slug: "",
  distanceKm: "",
  durationText: "",
  driverChargeInr: "0",
  nightHaltInr: "0",
  tollAmountInr: "",
  minKmPerDay: "300",
  usePerKm: true,
  perKmRateOverride: "",
  highway: "",
  allInclusiveNote: "",
};
