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
      const trimmed = query.trim();
      if (trimmed.length < 2 || trimmed.length > 80) {
        throw Errors.validation([{ path: "q", message: "Query must be 2-80 characters" }]);
      }
      // Prevent injection / XSS in query
      if (/<script|javascript:/i.test(trimmed)) {
        throw Errors.validation([{ path: "q", message: "Invalid query" }]);
      }
      const key = trimmed.toLowerCase().replace(/\s+/g, " ");
      const cached = await deps.db.locationCache.get(key);
      if (cached) {
        const age = deps.clock.now().getTime() - new Date(cached.storedAt).getTime();
        if (age < CACHE_TTL_MS && age >= 0) {
          return { source: "cache" as const, suggestions: cached.suggestions };
        }
      }
      try {
        const suggestions = await deps.geocoding.autocomplete(key);
        // Validate suggestions don't contain malicious content
        const safe = suggestions.slice(0, 8).map((s) => ({
          ...s,
          displayName: s.displayName.replace(/<[^>]*>/g, "").slice(0, 200),
        }));
        await deps.db.locationCache.set(key, safe, toIso(deps.clock.now()));
        return { source: "provider" as const, suggestions: safe };
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
