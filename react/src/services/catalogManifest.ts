import type { TourPackage } from "../data";
import { packages as staticPackages } from "../data";
import { getApiBaseUrl } from "./api";

export interface CompressedRoute {
  o: string;              // Origin
  d: string;              // Destination
  km: number;             // Distance in km (One-Way)
  m: number;              // Duration in minutes
  fh: number;             // Fare Hatchback
  fs: number;             // Fare Sedan (Dzire / Etios)
  fe: number;             // Fare Ertiga / SUV
  fi: number;             // Fare Innova Crysta
  ft: number;             // Tempo Traveller Fare
  fu: number;             // Force Urbania Fare
  pm: string;             // Pricing Model Flag
  c: string;              // Travel Corridor
  toll: 1 | 0;            // Toll inclusion: 1 = included, 0 = extra
}

export interface CatalogManifestData {
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
  routes: Record<string, CompressedRoute>;
  packages: TourPackage[];
  vehicles: readonly any[];
}

const CACHE_STORAGE_KEY = "arena_catalog_manifest_v2";

let inMemoryManifest: CatalogManifestData | null = null;
let fetchPromise: Promise<CatalogManifestData | null> | null = null;

export async function fetchCatalogManifest(): Promise<CatalogManifestData | null> {
  if (inMemoryManifest) return inMemoryManifest;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    // 1. In browser, check localStorage for cached manifest
    let localCached: CatalogManifestData | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          localCached = JSON.parse(raw);
        }
      } catch {
        // LocalStorage blocked or quota error
      }
    }

    // 2. Try fetching latest manifest from backend authoritative endpoint
    try {
      const apiBase = getApiBaseUrl();
      const headers: Record<string, string> = { Accept: "application/json" };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${apiBase}/api/v1/catalog/manifest`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 304 && localCached) {
        inMemoryManifest = localCached;
        return inMemoryManifest;
      }

      if (res.ok) {
        const json = await res.json();
        const data = json?.data as CatalogManifestData;
        if (data && data.routes && typeof data.version === "number") {
          inMemoryManifest = data;
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
            } catch {
              // Ignore quota issues
            }
          }
          return inMemoryManifest;
        }
      }
    } catch {
      // API unreachable or timed out
    }

    // 3. Fallback to localStorage if available
    if (localCached) {
      inMemoryManifest = localCached;
      return inMemoryManifest;
    }

    // 4. Fallback to static /routes-manifest.json and staticPackages
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/routes-manifest.json");
        if (res.ok) {
          const routes = await res.json();
          inMemoryManifest = {
            version: 1,
            updatedAt: new Date().toISOString(),
            routeCount: Object.keys(routes).length,
            packageCount: staticPackages.length,
            routes,
            packages: [...staticPackages],
            vehicles: [],
          };
          return inMemoryManifest;
        }
      }
    } catch {
      // Fallback failed
    }

    return null;
  })().finally(() => {
    fetchPromise = null;
  });

  return fetchPromise;
}

export async function loadRoutesManifest(): Promise<Record<string, CompressedRoute>> {
  const manifest = await fetchCatalogManifest();
  if (manifest?.routes && Object.keys(manifest.routes).length > 0) {
    return manifest.routes;
  }
  // Hard static fallback
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/routes-manifest.json");
      if (res.ok) return await res.json();
    } catch {
      // Ignore
    }
  }
  return {};
}

export async function loadPublishedPackages(): Promise<TourPackage[]> {
  const manifest = await fetchCatalogManifest();
  if (manifest?.packages && manifest.packages.length > 0) {
    return manifest.packages;
  }
  return [...staticPackages];
}
