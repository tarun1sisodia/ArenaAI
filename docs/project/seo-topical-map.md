# SEO topical map and internal-link contract

**Scope:** Technical information architecture only. This document deliberately excludes reel/video production, social outreach, backlink campaigns, and client-owned pricing approvals.

## Hubs and spokes

- **Taxi in Agra** (`/en/routes/`)
  - Core route pages: `/en/agra-to-delhi-taxi/`, `/en/delhi-to-agra-taxi/`, `/en/agra-to-jaipur-taxi/`, `/en/agra-to-mathura-taxi/`, `/en/agra-to-gwalior-taxi/`
  - Vehicle pages: `/en/vehicles/sedan/`, `/en/vehicles/ertiga/`, `/en/vehicles/innova-crysta/`
  - Support pages: `/en/faq/`, `/en/contact/`
- **Tempo Traveller** (`/en/fleet/`)
  - `/en/tempo-traveller-on-rent-agra/`
  - `/en/12-seater-tempo-traveller-agra/`
  - `/en/16-seater-tempo-traveller-agra/`
  - `/en/18-seater-tempo-traveller-agra/`
  - `/en/20-seater-tempo-traveller-agra/`
  - `/en/24-seater-tempo-traveller-agra/`
  - `/en/vehicles/tempo-traveller/`
- **Agra sightseeing and tours** (`/en/packages/`)
  - `/en/taj-mahal-taxi-service/`
  - `/en/same-day-agra-tour-from-delhi/`
  - `/en/packages/taj-mahal-sunrise-tour/`
  - `/en/packages/agra-sightseeing/`
  - `/en/packages/mathura-vrindavan/`
- **Trust and conversion** (`/en/about/`, `/en/contact/`, `/en/faq/`)
  - Every money page should link to contact and at least one relevant hub.

## Internal-link acceptance rules

1. New indexable pages must be linked from one hub and at least two related pages using descriptive anchor text.
2. Do not link to redirect-only aliases (`/en/vehicles/innova/`, `/en/vehicles/tempo/`) or booking routes.
3. Do not use `click here`, keyword-stuffed anchors, or links to unconfirmed third-party listings.
4. Run `npm run customer:seo:audit` after a build; review `weak-internal-links` findings before publishing.
5. A page with client-pending figures must not be added to the sitemap until those figures are confirmed and the copy is updated.

## Source-quality rule

Use only facts already present in the canonical business record, current site catalogue, official ASI/UP Tourism material, or a client-confirmed pricing/policy record. Reel captions, anonymous SEO claims, and scraped competitor figures are discovery inputs—not publishable sources.
