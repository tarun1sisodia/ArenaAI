import { AppError } from "../../../shared/errors.js";
import { roundRupees } from "../../../shared/money.js";
import {
  DIST_MAP,
  LOCAL_PACKAGES,
  ROUTES,
  slugifyPlace,
  VEHICLES,
  type FareByVehicle,
  type RouteFare,
} from "../fare.catalogue.js";

export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function estimateDistanceKm(fromSlug: string, toSlug: string): number {
  const d1 = DIST_MAP[fromSlug] ?? 100;
  const d2 = DIST_MAP[toSlug] ?? 250;
  return Math.max(60, Math.abs(d1 - d2) || d1 + d2 || 250);
}

export function perKmFares(km: number): FareByVehicle {
  const getRate = (id: string) => VEHICLES.find((v) => v.id === id)?.perKm ?? 10;
  return {
    sedan: roundRupees(Math.max(2200, km * getRate("sedan"))),
    ertiga: roundRupees(Math.max(2800, km * getRate("ertiga"))),
    innova: roundRupees(Math.max(3800, km * getRate("innova"))),
    tempo: roundRupees(Math.max(5500, km * getRate("tempo"))),
    urbania: roundRupees(Math.max(7500, km * getRate("urbania"))),
  };
}

export function findRoute(originName: string, destinationName: string): RouteFare {
  const from = slugifyPlace(originName);
  const to = slugifyPlace(destinationName);
  if (!from || !to) {
    throw new AppError("FARE_CALCULATION_FAILED", "Origin and destination are required.", 422);
  }

  if (from === to) {
    const existing = ROUTES.find((route) => route.from === from && route.to === to && route.kind === "local");
    if (existing) return existing;
    return {
      id: `${from}-local`,
      from,
      to,
      kind: "local",
      localLabel: `${titleCase(originName)} Sightseeing & Local Tour`,
      duration: "8 hrs / 80 km",
      km: 80,
      fares: LOCAL_PACKAGES["8hr-80km"].fares,
    };
  }

  const direct = ROUTES.find((route) => route.from === from && route.to === to);
  if (direct) return direct;

  const reverse = ROUTES.find((route) => route.from === to && route.to === from);
  if (reverse) {
    return { ...reverse, id: `${from}-to-${to}`, from, to };
  }

  const estimatedKm = estimateDistanceKm(from, to);
  const hrs = Math.max(1, Math.round(estimatedKm / 55));
  return {
    id: `${from}-to-${to}`,
    from,
    to,
    kind: "one-way",
    duration: `${hrs}–${hrs + 1} hrs (${estimatedKm} km)`,
    km: estimatedKm,
    fares: perKmFares(estimatedKm),
  };
}
