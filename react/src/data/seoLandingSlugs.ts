export const SEO_LANDING_SLUGS = [
  "tempo-traveller-on-rent-agra", "12-seater-tempo-traveller-agra", "16-seater-tempo-traveller-agra",
  "18-seater-tempo-traveller-agra", "20-seater-tempo-traveller-agra", "24-seater-tempo-traveller-agra",
  "same-day-agra-tour-from-delhi", "delhi-to-agra-taxi", "taj-mahal-taxi-service", "agra-to-delhi-taxi",
  "agra-to-jaipur-taxi", "agra-to-mathura-taxi", "agra-to-gwalior-taxi", "agra-fatehpur-sikri-one-day-tour",
  // 2026-10-06 — SEO 40-ideas expansion (feat/seo-40-ideas-2026-10):
  // route+vehicle+fare pages (idea 12), airport transfer (13), pilgrimage (21),
  // comparison (20), Taj Ganj pickup (17). Every fare quoted on these pages is
  // published in react/src/data/prices.ts — never invent a fare (the SEO build
  // guardrail fails the build on TBD/unverified text).
  "delhi-airport-to-agra-taxi",
  "delhi-to-agra-sedan-taxi-fare",
  "delhi-to-agra-ertiga-taxi-fare",
  "delhi-to-agra-innova-crysta-taxi-fare",
  "delhi-to-agra-tempo-traveller-fare",
  "agra-to-vrindavan-taxi",
  "delhi-to-agra-cab-vs-train-vs-bus",
  "taxi-near-taj-mahal-agra",
] as const;
export type SeoLandingSlug = typeof SEO_LANDING_SLUGS[number];
