/**
 * Canonical UI fleet registry — the SINGLE source of truth for the 5 bookable fleets.
 *
 * Feeds: route widget (InstantRouteCalculator), fleet page, booking vehicle
 * selector, and the SEO hub. Do NOT create a second hardcoded vehicle list
 * anywhere — the 2026-10-01 "6 cards / bogus Hatchback / VIP_SERVIC" incident
 * was caused by a drifted duplicate list.
 *
 * Canonical fleets: Maruti Dzire / Toyota Etios (sedan), Maruti Ertiga Hybrid
 * (ertiga), Toyota Innova Crysta (innova), Force Tempo Traveller (tempo),
 * Force Urbania VIP (urbania). Rates live in ./prices (fleet_per_km).
 *
 * NOTE on id schemes: the backend API uses "innova-crysta" / "tempo-traveller"
 * (see services/api.ts BackendVehicleTier) and ./prices uses
 * "innova_crysta" / "tempo_traveller". The UI tier ids below are the short
 * forms used by the route widget and booking links. Map explicitly at API
 * boundaries — never assume the schemes match.
 */

import type { IconName } from "../components/icons/Icon";

export type UiVehicleTier = "sedan" | "ertiga" | "innova" | "tempo" | "urbania";

export interface FleetMeta {
  id: UiVehicleTier;
  /** Display label shown on cards */
  label: string;
  /** Capacity line shown under the label */
  seats: string;
  /**
   * Icon registry name (src/components/icons/Icon.tsx). MUST be a glyph that
   * actually renders — verify in the built page; a bad name paints raw
   * ligature text on the card.
   */
  icon: IconName;
}

export const FLEETS: readonly FleetMeta[] = [
  { id: "sedan", label: "Sedan", seats: "4 Seater · 2 Bags", icon: "directions_car" },
  { id: "ertiga", label: "Ertiga / SUV", seats: "6 Seater · 3 Bags", icon: "airport_shuttle" },
  { id: "innova", label: "Innova Crysta", seats: "6 Seater · 4 Bags", icon: "directions_car" },
  { id: "tempo", label: "Tempo Traveller", seats: "7-26 Seater", icon: "transportation" },
  { id: "urbania", label: "Force Urbania", seats: "10-13 Luxury", icon: "directions_bus" },
] as const;

/** The 5 canonical tier ids — use in tests to assert no 6th card ever renders. */
export const FLEET_IDS: readonly UiVehicleTier[] = FLEETS.map((f) => f.id);
