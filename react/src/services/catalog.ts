/**
 * Live Catalog Service — reads the published catalog from the Fastify API.
 *
 * The backend catalog is the SINGLE SOURCE OF TRIPS: the operations desk
 * publishes rides, tours, packages, routes, vehicles and famous places, and
 * they appear here automatically — no frontend deploy, no developer.
 *
 * The static data in `src/data.ts` remains the SSG baseline (fast first paint,
 * crawlable HTML); published catalog items are fetched at runtime and merged
 * over it.
 */

import { getApiBaseUrl } from "./api";

export type PublicCatalogType = "ride" | "tour" | "package" | "route" | "vehicle" | "place";
export type PublicTripType = "one-way" | "round-trip" | "local-tour" | "airport-transfer";
export type PublicAvailability = "available" | "limited" | "unavailable";

export interface PublicCatalogGalleryImage {
  id: string;
  mediaType: "image" | "video";
  altText: string;
  caption: string | null;
  sortOrder: number;
  url: string;
}

export interface PublicCatalogItem {
  id: string;
  type: PublicCatalogType;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  durationText: string;
  routeSummary: string;
  startingPriceInr: number;
  distanceKm: number | null;
  availability: PublicAvailability;
  seatsLeft: number | null;
  stops: string[];
  tripType: PublicTripType | null;
  publishedAt: string | null;
  updatedAt: string | null;
  coverImage: { url: string } | null;
  gallery: PublicCatalogGalleryImage[];
}

export interface PublicFleetVehicle {
  id: string;
  tier: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  active: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** Absolute, browser-loadable URL for a catalog media entry. */
export function resolveCatalogMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/api/v1/media/")) return `${getApiBaseUrl()}${url}`;
  return url;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Catalog request failed (${res.status})`);
  }
  const json = (await res.json().catch(() => ({}))) as { data?: T };
  if (!json || !("data" in json)) {
    throw new Error("Catalog response was malformed.");
  }
  return json.data as T;
}

function normalizeItem(raw: Record<string, unknown>): PublicCatalogItem {
  const gallery = Array.isArray(raw.gallery)
    ? (raw.gallery as Record<string, unknown>[])
        .filter((g) => g && typeof g === "object")
        .map((g) => {
          const url = typeof g.url === "string" ? g.url.trim() : "";
          return {
            id: String(g.id ?? ""),
            mediaType: (g.mediaType as "image" | "video") ?? "image",
            altText: String(g.altText ?? ""),
            caption: g.caption ? String(g.caption) : null,
            sortOrder: Number(g.sortOrder) || 0,
            url,
          };
        })
        .filter((g) => Boolean(g.url))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  return {
    id: String(raw.id ?? ""),
    type: (raw.type as PublicCatalogType) ?? "package",
    slug: String(raw.slug ?? ""),
    title: String(raw.title ?? ""),
    shortDescription: String(raw.shortDescription ?? ""),
    description: String(raw.description ?? ""),
    durationText: String(raw.durationText ?? ""),
    routeSummary: String(raw.routeSummary ?? ""),
    startingPriceInr: Number(raw.startingPriceInr) || 0,
    distanceKm:
      raw.distanceKm === null || raw.distanceKm === undefined ? null : Number(raw.distanceKm),
    availability: (raw.availability as PublicAvailability) ?? "available",
    seatsLeft: raw.seatsLeft === null || raw.seatsLeft === undefined ? null : Number(raw.seatsLeft),
    stops: Array.isArray(raw.stops) ? raw.stops.map((s) => String(s)) : [],
    tripType: (raw.tripType as PublicTripType | null) ?? null,
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
    coverImage: raw.coverImage && (raw.coverImage as { url?: string }).url
      ? { url: String((raw.coverImage as { url?: string }).url) }
      : gallery[0]
        ? { url: gallery[0].url }
        : null,
    gallery,
  };
}

/** Published catalog listing (optionally narrowed by vertical / trip type). */
export async function fetchPublishedCatalog(
  filter: { type?: PublicCatalogType; tripType?: PublicTripType } = {},
): Promise<PublicCatalogItem[]> {
  const params = new URLSearchParams();
  if (filter.type) params.set("type", filter.type);
  if (filter.tripType) params.set("tripType", filter.tripType);
  const qs = params.toString();
  const data = await getJson<unknown[]>(`/api/v1/catalog${qs ? `?${qs}` : ""}`);
  return (Array.isArray(data) ? data : []).filter(isRecord).map(normalizeItem);
}

/** Published catalog item by slug (used by dynamic detail pages). */
export async function fetchCatalogItemBySlug(slug: string): Promise<PublicCatalogItem> {
  const raw = await getJson<Record<string, unknown>>(`/api/v1/catalog/${encodeURIComponent(slug)}`);
  return normalizeItem(raw);
}

/** Live fleet from the active fare rules (admin Fleet & Fare editor). */
export async function fetchLiveFleet(): Promise<PublicFleetVehicle[]> {
  const data = await getJson<{ vehicles?: unknown[] }>("/api/v1/fleet");
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  return vehicles
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .map((v) => ({
      id: String(v.id ?? v.tier ?? ""),
      tier: String(v.tier ?? v.id ?? ""),
      name: String(v.name ?? ""),
      seats: Number(v.seats) || 0,
      bags: Number(v.bags) || 0,
      perKm: Number(v.perKm) || 0,
      active: v.active !== false,
    }));
}

export const TRIP_TYPE_LABEL: Record<PublicTripType, string> = {
  "one-way": "One-way drop",
  "round-trip": "Round trip",
  "local-tour": "Local sightseeing",
  "airport-transfer": "Airport / station transfer",
};
