/**
 * GENERATED — do not edit by hand.
 * Source: contracts/enums/product-verticals.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-ENUM-001 · contracts/LOCKED.md
 */
/**
 * @file product-verticals.ts — Canonical 5 Product Verticals contract.
 * @usage Contract C-ENUM-004: Eliminates polymorphic catalog ambiguity across all layers.
 */

export const PRODUCT_VERTICALS = [
  "tour-package",
  "route",
  "local-tour",
  "transfer",
  "monument",
] as const;

export type ProductVertical = (typeof PRODUCT_VERTICALS)[number];

export const PRODUCT_VERTICAL_META: Record<ProductVertical, { label: string; primaryPricing: string }> = {
  "tour-package": {
    label: "Tour Package",
    primaryPricing: "Fixed Tier Pricing",
  },
  "route": {
    label: "Intercity Highway Route",
    primaryPricing: "Distance (km) x Rate + Tolls",
  },
  "local-tour": {
    label: "Local Tour",
    primaryPricing: "Fixed Slab (8hr/80km or 12hr/120km) + Extra Surcharges",
  },
  "transfer": {
    label: "Airport / Railway Transfer",
    primaryPricing: "Fixed Pickup/Drop Rate",
  },
  "monument": {
    label: "Monument Sightseeing",
    primaryPricing: "Sightseeing Guide & Ticket Fees",
  },
};
