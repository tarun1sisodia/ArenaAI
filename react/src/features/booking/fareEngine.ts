import {
  calcFare,
  localPackages,
  NIGHT_ALLOWANCE,
  NIGHT_ALLOWANCE_TEMPO,
  advanceOf,
  getNightAllowance,
  isNightTime,
  applyPromo,
  formatInr,
  findRoute,
  getIndicativeBrowseFare,
  localTomorrow,
  type CalcFareParams,
  type FareQuote,
  type LocalPackageKey,
} from "@/fares";

export type TripType = "one-way" | "round";
export type FareRequest = CalcFareParams;
export type FareResult = FareQuote;
export type { LocalPackageKey };

export {
  calcFare,
  localPackages,
  localTomorrow,
  NIGHT_ALLOWANCE,
  NIGHT_ALLOWANCE_TEMPO,
  advanceOf,
  getNightAllowance,
  isNightTime,
  applyPromo,
  formatInr,
  findRoute,
  getIndicativeBrowseFare,
};
