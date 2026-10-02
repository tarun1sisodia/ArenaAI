/**
 * Typed LocationIQ Client & Hook (Step R6.1)
 *
 * Provides:
 * 1. Typed LocationIQ API client (`fetchLocationIQSuggestions`) with autocomplete support.
 *    The ONLY live path is the secure backend proxy (`/api/v1/locations/autocomplete`),
 *    which holds the token server-side. The browser never calls LocationIQ directly.
 * 2. React hook (`useLocationIQ`) with 300ms debouncing, AbortController race prevention.
 * 3. Safe SSR execution with fallback to empty state when offline or headless.
 *
 * Security (2026-10-02): there is intentionally no browser-side token at all —
 * no build-time env token, no `window` global, no localStorage persistence,
 * and no UI that displays or edits a token. Frontend bundles are public, so
 * any token shipped to the browser would be exposed; the proxy holds it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../services/api";

/** Raw address object returned by LocationIQ Autocomplete API */
export interface LocationIQAddress {
  name?: string;
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  [key: string]: string | undefined;
}

/** Raw place object returned by LocationIQ Autocomplete API */
export interface LocationIQRawPlace {
  place_id: string;
  osm_id?: string;
  osm_type?: string;
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: LocationIQAddress;
}

/** Normalized suggestion structure used across comboboxes and booking forms */
export interface LocationSuggestion {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  isLocationIQ: boolean;
  lat?: number;
  lon?: number;
  raw?: LocationIQRawPlace;
}

/** Options for fetching suggestions from LocationIQ */
export interface FetchLocationIQParams {
  query: string;
  limit?: number;
  countrycodes?: string;
  signal?: AbortSignal;
}

/** Options for the useLocationIQ hook */
export interface UseLocationIQOptions {
  /** Debounce delay in milliseconds before dispatching fetch. Defaults to 300ms. */
  debounceMs?: number;
  /** Minimum character length to trigger search. Defaults to 2. */
  minQueryLength?: number;
  /** Maximum number of results to fetch from LocationIQ. Defaults to 5. */
  limit?: number;
  /** Comma-separated ISO country codes. Defaults to "in" (India). */
  countrycodes?: string;
  /** Whether autocomplete querying is enabled. Defaults to true. */
  enabled?: boolean;
  /** Callback fired when suggestions successfully arrive */
  onSuccess?: (results: LocationSuggestion[]) => void;
  /** Callback fired when an error occurs */
  onError?: (error: Error) => void;
}

/** Return object from the useLocationIQ hook */
export interface UseLocationIQResult {
  /** Current search query string */
  query: string;
  /** State setter for updating the search query */
  setQuery: (q: string) => void;
  /** Array of normalized location suggestions */
  results: LocationSuggestion[];
  /** Whether a network request is currently in-flight */
  isLoading: boolean;
  /** Error message if request failed, or null */
  error: string | null;
  /** Whether the last completed search returned live proxy (LocationIQ) results */
  liveSearchAvailable: boolean;
  /** Imperative search method that bypasses the debounce delay */
  search: (overrideQuery?: string) => Promise<LocationSuggestion[]>;
  /** Clears the current results list and error message */
  clearResults: () => void;
}

/**
 * Low-level typed client function for location autocomplete.
 * Queries the secure backend proxy (`/api/v1/locations/autocomplete`), which
 * holds the LocationIQ token server-side, and maps the response into
 * normalized suggestions. Returns an empty list when the proxy is
 * unreachable, so callers fall back to the curated static destinations.
 */
export async function fetchLocationIQSuggestions(
  params: FetchLocationIQParams
): Promise<LocationSuggestion[]> {
  const q = params.query.trim();

  // Return empty if query is too short or already aborted
  if (q.length < 2 || params.signal?.aborted) {
    return [];
  }

  // 1. Try secure backend proxy endpoint first (FIND-004) to avoid client token exposure
  try {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/v1/locations/autocomplete?q=${encodeURIComponent(q)}`;
    const response = await fetch(endpoint, {
      signal: params.signal,
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const resData = (await response.json()) as {
        success?: boolean;
        data?:
          | {
              source?: string;
              suggestions?: Array<{
                placeId: string;
                name?: string;
                displayName?: string;
                city?: string | null;
                state?: string | null;
                latitude?: number | null;
                longitude?: number | null;
                lat?: number | null;
                lon?: number | null;
              }>;
            }
          | Array<{
              placeId: string;
              name?: string;
              displayName?: string;
              city?: string | null;
              state?: string | null;
              latitude?: number | null;
              longitude?: number | null;
              lat?: number | null;
              lon?: number | null;
            }>;
      };
      const rawData = resData?.data;
      const items = Array.isArray(rawData)
        ? rawData
        : rawData && typeof rawData === "object" && "suggestions" in rawData && Array.isArray((rawData as any).suggestions)
          ? (rawData as any).suggestions
          : [];

      if (items.length > 0) {
        return items.map((place: any) => {
          const latVal = typeof place.latitude === "number" ? place.latitude : (typeof place.lat === "number" ? place.lat : undefined);
          const lonVal = typeof place.longitude === "number" ? place.longitude : (typeof place.lon === "number" ? place.lon : undefined);
          const nameVal = place.name || (place.displayName ? place.displayName.split(",")[0].trim() : "Location");
          const subtitleVal = place.displayName || `${place.city || ""}, ${place.state || ""}`.trim();
          return {
            id: `location-${place.placeId}`,
            name: nameVal,
            subtitle: subtitleVal,
            code: "IQ",
            isLocationIQ: true,
            lat: latVal,
            lon: lonVal,
            raw: {
              place_id: place.placeId,
              lat: String(latVal ?? ""),
              lon: String(lonVal ?? ""),
              display_name: place.displayName || nameVal,
            },
          };
        });
      }
    }
  } catch (err: unknown) {
    if (
      (err instanceof DOMException && (err.name === "AbortError" || err.code === 20)) ||
      (err instanceof Error && err.name === "AbortError")
    ) {
      return [];
    }
    // Proxy unreachable: return empty so callers fall back to the curated
    // static destination list. The browser never calls LocationIQ directly.
  }

  return [];
}

/**
 * Custom React hook for LocationIQ address search and discovery.
 *
 * Features:
 * - 300ms debounced execution to reduce API consumption
 * - AbortController race condition prevention on rapid typing
 * - Proxy-only live search: the secure backend endpoint authenticates with
 *   its server-held token, so the browser needs (and holds) no token at all
 * - Imperative search override
 * - SSR safety
 */
export function useLocationIQ(
  initialQuery = "",
  options: UseLocationIQOptions = {}
): UseLocationIQResult {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    limit = 5,
    countrycodes = "in",
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveSearchAvailable, setLiveSearchAvailable] = useState(false);

  // Refs for tracking in-flight requests and timers
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear results helper
  const clearResults = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setResults([]);
    setLiveSearchAvailable(false);
    setError(null);
    setIsLoading(false);
  }, []);

  // Imperative search method (immediate, bypassing debounce timer)
  const search = useCallback(
    async (overrideQuery?: string): Promise<LocationSuggestion[]> => {
      const q = (overrideQuery !== undefined ? overrideQuery : query).trim();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // The secure backend proxy authenticates with its server-held token, so
      // browser searches must work even when no client token is available.
      if (q.length < minQueryLength) {
        setResults([]);
        setIsLoading(false);
        setError(null);
        return [];
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);
      setError(null);

      try {
        const items = await fetchLocationIQSuggestions({
          query: q,
          limit,
          countrycodes,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setResults(items);
          setLiveSearchAvailable(items.some((item) => item.isLocationIQ));
          setIsLoading(false);
          onSuccess?.(items);
        }
        return items;
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const errMsg =
            err instanceof Error ? err.message : "Failed to search LocationIQ";
          setError(errMsg);
          setIsLoading(false);
          onError?.(err instanceof Error ? err : new Error(errMsg));
        }
        return [];
      }
    },
    [query, minQueryLength, limit, countrycodes, onSuccess, onError]
  );

  // Debounced effect reacting to query changes
  useEffect(() => {
    if (!enabled) {
      clearResults();
      return;
    }

    const trimmed = query.trim();

    // Keep the proxy path enabled without exposing or requiring a browser token.
    if (trimmed.length < minQueryLength) {
      clearResults();
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void search(trimmed);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, minQueryLength, enabled, search, clearResults]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    liveSearchAvailable,
    search,
    clearResults,
  };
}
