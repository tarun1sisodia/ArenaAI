import {
  type TourPackage,
  type VehicleId,
  type FareByVehicle,
  type City,
  type Vehicle,
  type Route,
  type AirportTransfer,
  type Service,
  type Review,
  type PromoCode,
  cities,
  vehicles,
  routes,
  packages,
  airportTransfers,
  services,
  reviews,
  promoCodes,
} from "../data";
import { contact } from "./contact";

export type {
  VehicleId,
  FareByVehicle,
  City,
  Vehicle,
  Route,
  AirportTransfer,
  Service,
  Review,
  PromoCode,
};

export type Package = TourPackage;
export type TripKind = "one-way" | "local";
export type NAP = typeof contact;
export const nap = contact;

export {
  cities,
  vehicles,
  routes,
  packages,
  airportTransfers,
  services,
  reviews,
  promoCodes,
};
