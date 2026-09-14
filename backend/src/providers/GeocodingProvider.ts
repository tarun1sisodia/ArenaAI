import type { LocationSuggestion } from "../types/domain.js";

export interface GeocodingProvider {
  autocomplete(query: string): Promise<LocationSuggestion[]>;
}

export function createStaticGeocodingProvider(
  places: readonly { id: string; name: string; city: string; state: string }[],
): GeocodingProvider {
  return {
    async autocomplete(query: string) {
      const q = query.trim().toLowerCase();
      return places
        .filter((place) => place.name.toLowerCase().includes(q) || place.city.toLowerCase().includes(q))
        .slice(0, 8)
        .map((place) => ({
          placeId: place.id,
          displayName: `${place.name}, ${place.state}`,
          city: place.city,
          state: place.state,
          country: "India",
          lat: null,
          lon: null,
        }));
    },
  };
}

export function createLocationIqProvider(token: string, fetchImpl: typeof fetch = fetch): GeocodingProvider {
  return {
    async autocomplete(query: string) {
      const url = new URL("https://api.locationiq.com/v1/autocomplete");
      url.searchParams.set("key", token);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "8");
      url.searchParams.set("countrycodes", "in");
      url.searchParams.set("dedupe", "1");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      try {
        const response = await fetchImpl(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`LocationIQ HTTP ${response.status}`);
        }
        const body = (await response.json()) as Array<Record<string, unknown>>;
        return body.map((item) => ({
          placeId: String(item.place_id ?? item.osm_id ?? item.display_name),
          displayName: String(item.display_name ?? ""),
          city: item.address && typeof item.address === "object" ? String((item.address as Record<string, unknown>).city ?? "") || null : null,
          state: item.address && typeof item.address === "object" ? String((item.address as Record<string, unknown>).state ?? "") || null : null,
          country: "India",
          lat: item.lat ? Number(item.lat) : null,
          lon: item.lon ? Number(item.lon) : null,
        }));
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
