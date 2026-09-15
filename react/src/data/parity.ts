import { packages, routes, vehicles } from "./catalogue";

export function assertCatalogueInvariants(): void {
  if (vehicles.length !== 5) throw new Error("Catalogue parity failed: expected five vehicles.");
  if (routes.length !== 8) throw new Error("Catalogue parity failed: expected eight routes.");
  if (packages.length !== 6) throw new Error("Catalogue parity failed: expected six packages.");
  if (vehicles.some((vehicle) => vehicle.perKm <= 0 || vehicle.seats <= 0)) {
    throw new Error("Catalogue parity failed: vehicle rates and capacities must be positive.");
  }
  if (routes.some((route) => Object.values(route.fares).some((fare) => fare <= 0))) {
    throw new Error("Catalogue parity failed: route fares must be positive.");
  }
}

