import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import type { GeocodingProvider } from "../../providers/GeocodingProvider.js";
import { CURATED_PLACES } from "../fares/fare.catalogue.js";
import { createStaticGeocodingProvider } from "../../providers/GeocodingProvider.js";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createLocationService(deps: {
  db: Repositories;
  clock: Clock;
  geocoding: GeocodingProvider;
}) {
  const fallback = createStaticGeocodingProvider(CURATED_PLACES);
  return {
    async autocomplete(query: string) {
      const key = query.trim().toLowerCase().replace(/\s+/g, " ");
      const cached = await deps.db.locationCache.get(key);
      if (cached) {
        const age = deps.clock.now().getTime() - new Date(cached.storedAt).getTime();
        if (age < CACHE_TTL_MS) {
          return { source: "cache" as const, suggestions: cached.suggestions };
        }
      }
      try {
        const suggestions = await deps.geocoding.autocomplete(key);
        await deps.db.locationCache.set(key, suggestions, toIso(deps.clock.now()));
        return { source: "provider" as const, suggestions };
      } catch {
        const suggestions = await fallback.autocomplete(key);
        if (suggestions.length > 0) {
          return { source: "fallback" as const, suggestions };
        }
        throw Errors.unavailable(
          "LOCATION_PROVIDER_UNAVAILABLE",
          "Location suggestions are temporarily unavailable.",
        );
      }
    },
  };
}
