import type { TourPackage } from "../data";
import { packages as staticPackages } from "../data";
import { getApiBaseUrl } from "./api";

export interface CompressedRoute {
  o: string;              // Origin
  d: string;              // Destination
  km: number;             // Distance in km (One-Way)
  m: number;              // Duration in minutes
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
  etag?: string;
  isStale?: boolean;
}

interface CachedManifestEnvelope {
  etag?: string;
  cachedAt: number;
  data: CatalogManifestData;
}

const CACHE_STORAGE_KEY = "arena_catalog_manifest_v3";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes bounded TTL

let inMemoryManifest: CatalogManifestData | null = null;
let fetchPromise: Promise<CatalogManifestData | null> | null = null;

export async function fetchCatalogManifest(): Promise<CatalogManifestData | null> {
  if (inMemoryManifest) return inMemoryManifest;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    // 1. In browser, check localStorage for cached manifest envelope
    let localEnvelope: CachedManifestEnvelope | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.data) {
            localEnvelope = parsed;
          } else if (parsed && parsed.routes) {
            localEnvelope = { cachedAt: 0, data: parsed };
          }
        }
      } catch {
        // LocalStorage blocked or quota error
      }
    }

    // 2. Try fetching latest manifest from backend authoritative endpoint with ETag
    try {
      const apiBase = getApiBaseUrl();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (localEnvelope?.etag) {
        headers["If-None-Match"] = localEnvelope.etag;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${apiBase}/api/v1/catalog/manifest`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle 304 Not Modified
      if (res.status === 304 && localEnvelope?.data) {
        inMemoryManifest = { ...localEnvelope.data, isStale: false };
        try {
          window.localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify({ ...localEnvelope, cachedAt: Date.now() }),
          );
        } catch {}
        return inMemoryManifest;
      }

      if (res.ok) {
        const json = await res.json();
        const data = json?.data as CatalogManifestData;
        if (data && data.routes && typeof data.version === "number") {
          const etag = res.headers.get("etag") ?? undefined;
          data.etag = etag;
          data.isStale = false;
          inMemoryManifest = data;
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(
                CACHE_STORAGE_KEY,
                JSON.stringify({ etag, cachedAt: Date.now(), data }),
              );
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

    // 3. Fallback to localStorage if available (mark stale if expired)
    if (localEnvelope?.data) {
      const isStale = Date.now() - localEnvelope.cachedAt > CACHE_TTL_MS;
      inMemoryManifest = {
        ...localEnvelope.data,
        isStale,
      };
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
            isStale: true,
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
  const bySlug = new Map<string, TourPackage>();

  // 1. Static baseline
  for (const p of staticPackages) {
    bySlug.set(p.slug, p);
  }

  // 2. Manifest snapshot if available
  try {
    const manifest = await fetchCatalogManifest();
    if (manifest?.packages && manifest.packages.length > 0) {
      for (const p of manifest.packages) {
        bySlug.set(p.slug, p);
      }
    }
  } catch {
    // Ignore fallback
  }

  // 3. Live tour-packages manifest from Fastify API
  try {
    const apiBase = getApiBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${apiBase}/api/v1/tour-packages/manifest`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];
      for (const item of items) {
        if (item.status && item.status !== "published") continue;
        const slug = String(item.slug ?? item.packageCode ?? item.package_code);
        const startingPrice = Number(item.startingPriceInr || item.fleetPrices?.sedan || 3499);
        bySlug.set(slug, {
          id: slug,
          slug,
          name: item.name,
          kicker: `${item.days ?? 1} Day${(item.days ?? 1) > 1 ? "s" : ""} Private Tour`,
          duration: item.durationText || `${item.days ?? 1} Day`,
          from: startingPrice,
          image: item.image || "/assets/packages/taj-dawn.webp",
          places: [item.name, "Agra Heritage Sites"],
          blurb: item.inclusionsHighlight || "Private sanitized AC cab, dedicated verified chauffeur & monument sightseeing.",
          includes: [
            "Private AC vehicle & dedicated verified chauffeur",
            "All highway tolls & monument parking fees included",
            "Doorstep pickup & drop-off from hotel or station",
          ],
          excludes: ["Monument entry tickets", "Meals & personal expenses"],
        });
      }
    }
  } catch {
    // Ignore and return existing map
  }

  return Array.from(bySlug.values());
}
