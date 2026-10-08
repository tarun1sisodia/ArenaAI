import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// NOTE: react/ must stay self-contained — never import from backend/ here.
// Node's --experimental-strip-types cannot resolve cross-project `.js` -> `.ts`
// imports (ERR_MODULE_NOT_FOUND), which crashed `npm run build`.
// These specs mirror backend/src/modules/fares/fare.catalogue.ts VEHICLES;
// keep them in sync if the catalogue changes (future: move to contracts/).
const VEHICLE_SPECS = [
  { id: "sedan", perKm: 10, alwaysRoundTrip: false },
  { id: "ertiga", perKm: 14, alwaysRoundTrip: false },
  { id: "innova", perKm: 18, alwaysRoundTrip: false },
  { id: "tempo", perKm: 25, alwaysRoundTrip: true },
  { id: "urbania", perKm: 34, alwaysRoundTrip: true },
];

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const repoRoot = join(reactRoot, "..");
const backendCatalogPath = join(repoRoot, "backend", "src", "modules", "fares", "catalog.data.json");

export type PricingModelType = "oneway" | "day120" | "tempo" | "tour" | "custom";

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
  pm: PricingModelType;   // Pricing Model Flag
  c: string;              // Travel Corridor
  toll: 1 | 0;            // Toll inclusion: 1 = included, 0 = extra
}

export async function buildRouteCatalogAndManifest(): Promise<void> {
  // Read backend single-source-of-truth catalog
  const rawCatalog = readFileSync(backendCatalogPath, "utf-8");
  const catalogRoutes: Record<string, any> = JSON.parse(rawCatalog);

  const manifest: Record<string, CompressedRoute> = {};
  const allRoutesList: any[] = [];
  const publishedRouteItems: any[] = [];

  const apiBase = (process.env.VITE_API_BASE_URL || process.env.CATALOG_API_URL || "https://skb-baghel-api-staging.onrender.com").replace(/\/+$/, "");

  for (const [slug, item] of Object.entries(catalogRoutes)) {
    const fs = item.fares.sedan;
    const fe = item.fares.ertiga;
    const fi = item.fares.innova;
    const ft = item.fares.tempo;
    const fu = item.fares.urbania;

    manifest[slug] = {
      o: item.origin,
      d: item.destination,
      km: item.km,
      m: item.durationMins || Math.round((item.km / 55) * 60),
      fs,
      fe,
      fi,
      ft,
      fu,
      pm: item.pricingModel || "oneway",
      c: item.corridor || "Direct Highway Corridor",
      toll: item.toll === 1 ? 1 : 0,
    };

    allRoutesList.push({
      id: slug,
      from: item.from,
      to: item.to,
      origin: item.origin,
      destination: item.destination,
      corridor: item.corridor,
      km: item.km,
      duration: item.duration,
      kind: item.kind,
      localLabel: item.localLabel,
      pricingModel: item.pricingModel,
      toll: item.toll === 1 ? 1 : 0,
      fares: {
        sedan: fs,
        ertiga: fe,
        innova: fi,
        tempo: ft,
        urbania: fu,
      },
    });

    // Alias `-taxi` slug if not present (e.g. agra-delhi -> agra-to-delhi-taxi)
    if (!slug.endsWith("-taxi") && item.from && item.to) {
      const taxiAlias = `${item.from}-to-${item.to}-taxi`;
      if (!manifest[taxiAlias]) {
        manifest[taxiAlias] = manifest[slug];
      }
    }

    // Bidirectional return route for catalogRoutes if reverse does not exist
    if (item.origin && item.destination && item.from && item.to && item.from !== item.to && item.kind !== "local") {
      const revSlug = `${item.to}-to-${item.from}-taxi`;
      if (!manifest[revSlug]) {
        manifest[revSlug] = {
          o: item.destination,
          d: item.origin,
          km: item.km,
          m: item.durationMins || Math.round((item.km / 55) * 60),
          fs,
          fe,
          fi,
          ft,
          fu,
          pm: item.pricingModel || "oneway",
          c: `${item.destination} to ${item.origin} Corridor`,
          toll: item.toll === 1 ? 1 : 0,
        };
      }
    }
  }

  // Published admin routes become the customer site's source of truth on the
  // next frontend rebuild. Static JSON remains the safe fallback for local
  // builds and environments where the backend is not reachable.
  const manifestUrl = process.env.ROUTE_CATALOG_MANIFEST_URL || (apiBase ? `${apiBase}/api/v1/route-catalog/manifest` : undefined);
  if (manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      if (response.ok) {
        const payload = await response.json() as { data?: Array<any> };
        for (const item of payload.data ?? []) {
          if (item.status !== "published") continue;
          publishedRouteItems.push(item);
          const fares = item.faresInr ?? item.fares_inr ?? {};
          const routeSlug = String(item.slug);
          const distanceKm = Number(item.distanceKm ?? item.distance_km ?? 0);
          const durationText = String(item.durationText ?? item.duration_text ?? "");
          const durationMins = Number(durationText.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1] ?? 0) * 60 || Math.round((distanceKm / 55) * 60);
          const sourceCity = String(item.sourceCity ?? item.source_city ?? "");
          const destCity = String(item.destinationCity ?? item.destination_city ?? "Local sightseeing");

          manifest[routeSlug] = {
            o: sourceCity,
            d: destCity,
            km: distanceKm,
            m: durationMins,
            fs: Number(fares.sedan ?? 2000),
            fe: Number(fares.ertiga ?? 2800),
            fi: Number(fares.innova ?? 3800),
            ft: Number(fares.tempo ?? 5500),
            fu: Number(fares.urbania ?? 7500),
            pm: item.tripType === "round-trip" ? "day120" : item.tripType === "local-tour" ? "tour" : "oneway",
            c: item.sourceDetail ?? "Direct Highway Corridor",
            toll: item.tollIncluded === false ? 0 : 1,
          };
          allRoutesList.push({
            id: routeSlug,
            from: sourceCity,
            to: destCity,
            origin: sourceCity,
            destination: destCity,
            km: distanceKm,
            duration: durationText,
            kind: item.tripType,
            pricingModel: item.tripType === "round-trip" ? "day120" : item.tripType === "local-tour" ? "tour" : "oneway",
            toll: item.tollIncluded === false ? 0 : 1,
            fares: {
              sedan: Number(fares.sedan ?? 2000),
              ertiga: Number(fares.ertiga ?? 2800),
              innova: Number(fares.innova ?? 3800),
              tempo: Number(fares.tempo ?? 5500),
              urbania: Number(fares.urbania ?? 7500),
            },
          });

          // Bidirectional reverse route generation for SEO ranking and reverse search
          if (sourceCity && destCity && destCity !== "Local sightseeing" && item.tripType !== "local-tour") {
            const sSlug = sourceCity.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const dSlug = destCity.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const revSlug = `${dSlug}-to-${sSlug}-${item.tripType === "round-trip" ? "round-trip-" : ""}taxi`.replace(/--+/g, "-");

            if (!manifest[revSlug]) {
              manifest[revSlug] = {
                o: destCity,
                d: sourceCity,
                km: distanceKm,
                m: durationMins,
                fs: Number(fares.sedan ?? 2000),
                fe: Number(fares.ertiga ?? 2800),
                fi: Number(fares.innova ?? 3800),
                ft: Number(fares.tempo ?? 5500),
                fu: Number(fares.urbania ?? 7500),
                pm: item.tripType === "round-trip" ? "day120" : "oneway",
                c: `${destCity} to ${sourceCity} Highway Corridor`,
                toll: item.tollIncluded === false ? 0 : 1,
              };
              allRoutesList.push({
                id: revSlug,
                from: destCity,
                to: sourceCity,
                origin: destCity,
                destination: sourceCity,
                km: distanceKm,
                duration: durationText,
                kind: item.tripType,
                pricingModel: item.tripType === "round-trip" ? "day120" : "oneway",
                toll: item.tollIncluded === false ? 0 : 1,
                fares: {
                  sedan: Number(fares.sedan ?? 2000),
                  ertiga: Number(fares.ertiga ?? 2800),
                  innova: Number(fares.innova ?? 3800),
                  tempo: Number(fares.tempo ?? 5500),
                  urbania: Number(fares.urbania ?? 7500),
                },
              });
              publishedRouteItems.push({
                ...item,
                id: `${item.id ?? revSlug}-rev`,
                slug: revSlug,
                sourceCity: destCity,
                source_city: destCity,
                destinationCity: sourceCity,
                destination_city: sourceCity,
                title: `${destCity} to ${sourceCity} Taxi`,
              });
            }
          }
        }
        console.log(`✅ [Manifest Builder] Merged published admin route catalog from ${manifestUrl}.`);
      }
    } catch (error) {
      console.warn("⚠️ [Manifest Builder] Admin route catalog unavailable; using static catalog.", error);
    }
  }

  // 1. Emit react/public/routes-manifest.json
  const manifestOutputPath = join(reactRoot, "public", "routes-manifest.json");
  writeFileSync(manifestOutputPath, JSON.stringify(manifest), "utf-8");
  console.log(`✅ [Manifest Builder] Emitted public/routes-manifest.json (${Object.keys(manifest).length} routes) from backend catalog.`);

  // 2. Emit react/src/data/generated-catalog.json
  const getRate = (id: string) => VEHICLE_SPECS.find((v) => v.id === id)?.perKm ?? 10;
  const isAlwaysRoundTrip = (id: string) => Boolean(VEHICLE_SPECS.find((v) => v.id === id)?.alwaysRoundTrip);

  const catalogPayload = {
    routes: allRoutesList,
    vehicles: [
      {
        id: "sedan",
        name: "Sedan",
        klass: "Dzire class",
        seats: 4,
        bags: 2,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("sedan"),
        tags: ["4+1 SEATS", "AC", "2 BAGS"],
        blurb: "Everyday comfort for city rides, Yamuna Expressway drops, and local sightseeing.",
        perKm: getRate("sedan"),
        rateRange: `₹${getRate("sedan")}–₹${getRate("sedan") + 2}/km`,
        models: ["Maruti Suzuki Dzire", "Toyota Etios", "Hyundai Aura"],
        image: "/assets/fleet/sedan-480.webp",
        suitable: "Couples, airport transfers, 1–4 passengers",
      },
      {
        id: "ertiga",
        name: "Ertiga",
        klass: "6+1 MPV",
        seats: 6,
        bags: 3,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("ertiga"),
        tags: ["6+1 SEATS", "AC", "3 BAGS"],
        blurb: "A little more room for families without stepping up to a large SUV.",
        perKm: getRate("ertiga"),
        rateRange: `₹${getRate("ertiga")}–₹${getRate("ertiga") + 2}/km`,
        models: ["Maruti Suzuki Ertiga", "Toyota Rumion", "Renault Triber"],
        image: "/assets/fleet/ertiga-480.webp",
        suitable: "Families, 5–6 passengers",
      },
      {
        id: "innova",
        name: "Innova Crysta",
        klass: "6+1 SUV",
        seats: 6,
        bags: 4,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("innova"),
        tags: ["6+1 SEATS", "AC", "4 BAGS"],
        blurb: "The outstation favourite — plush pushback seats, smooth suspension, and a quiet cabin.",
        perKm: getRate("innova"),
        rateRange: `₹${getRate("innova")}–₹${getRate("innova") + 5}/km`,
        models: ["Toyota Innova Crysta", "Toyota Innova Hycross"],
        image: "/assets/fleet/innova-480.webp",
        suitable: "Longer routes, elders, 4–6 passengers",
      },
      {
        id: "tempo",
        name: "Tempo Traveller",
        klass: "12–17 seater",
        seats: 12,
        bags: 8,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("tempo"),
        tags: ["12+1 SEATS", "AC", "LUGGAGE BAY"],
        blurb: "Spacious pushback seats, luggage bay, individual AC vents, and ice-box for group travel.",
        perKm: getRate("tempo"),
        rateRange: `₹${getRate("tempo")}–₹${getRate("tempo") + 9}/km`,
        models: ["9-Seater Maharaja", "12-Seater Standard", "16-Seater Executive", "20-Seater Deluxe", "26-Seater Tourer"],
        image: "/assets/fleet/tempo-480.webp",
        suitable: "Family tours, pilgrimage groups, 7–12 passengers",
      },
      {
        id: "urbania",
        name: "Force Urbania",
        klass: "Premium van",
        seats: 16,
        bags: 10,
        ac: true,
        alwaysRoundTrip: isAlwaysRoundTrip("urbania"),
        tags: ["16 SEATS", "PREMIUM", "AC"],
        blurb: "Chauffeur-grade luxury executive travel with airplane-style cabin styling and sealed acoustics.",
        perKm: getRate("urbania"),
        rateRange: `₹${getRate("urbania")}–₹${getRate("urbania") + 4}/km`,
        models: ["Force Urbania 9-Seater VIP", "12-Seater Luxury Cabin", "17-Seater Royal Van"],
        image: "/assets/fleet/urbania-480.webp",
        suitable: "Wedding parties, corporate delegations, 13–16 passengers",
      },
    ],
  };

  const catalogOutputPath = join(reactRoot, "src", "data", "generated-catalog.json");
  writeFileSync(catalogOutputPath, JSON.stringify(catalogPayload, null, 2), "utf-8");
  console.log(`✅ [Manifest Builder] Emitted src/data/generated-catalog.json with ${allRoutesList.length} typed routes.`);

  // Published catalog items are also snapshotted for SSG. Runtime API reads
  // keep the customer UI fresh, while this snapshot gives crawlers complete
  // HTML for catalog pages instead of a client-only loading shell.
  const publishedCatalogPath = join(reactRoot, "src", "data", "generated-published-catalog.json");
  const catalogUrl = process.env.CATALOG_API_URL || process.env.VITE_API_BASE_URL || apiBase;
  let publishedCatalog: unknown[] = [];
  if (catalogUrl) {
    try {
      const response = await fetch(`${catalogUrl.replace(/\/+$/, "")}/api/v1/catalog`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { data?: unknown };
      publishedCatalog = Array.isArray(payload.data) ? payload.data : [];
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedCatalog.length} published catalog items for SSG.`);
    } catch (error) {
      console.warn(`⚠️ [Manifest Builder] Published catalog snapshot unavailable; rendering static baseline only (${error instanceof Error ? error.message : String(error)}).`);
    }
  } else {
    console.warn("⚠️ [Manifest Builder] CATALOG_API_URL/VITE_API_BASE_URL not set; published catalog SSG snapshot is empty.");
  }
  writeFileSync(publishedCatalogPath, JSON.stringify(publishedCatalog, null, 2), "utf-8");
  writeFileSync(join(reactRoot, "src", "data", "generated-published-routes.json"), JSON.stringify(publishedRouteItems, null, 2), "utf-8");

  // Fleet prices sanitizer: canonical 5-key tier mapping (sedan, ertiga, innova, tempo, urbania). No crysta.
  const CANONICAL_FLEET_TIERS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
  const sanitizeFleetPrices = (raw: any): Record<string, number> => {
    const sanitized: Record<string, number> = {};
    if (!raw || typeof raw !== "object") return sanitized;
    for (const tier of CANONICAL_FLEET_TIERS) {
      if (typeof raw[tier] === "number") {
        sanitized[tier] = raw[tier];
      } else if (raw[tier] !== undefined && raw[tier] !== null && !Number.isNaN(Number(raw[tier]))) {
        sanitized[tier] = Number(raw[tier]);
      }
    }
    return sanitized;
  };

  // 1. Tour Packages manifest (GET /api/v1/tour-packages/manifest)
  const tourPackagesManifestUrl = process.env.TOUR_PACKAGES_MANIFEST_URL || (apiBase ? `${apiBase}/api/v1/tour-packages/manifest` : undefined);
  let publishedTourPackages: any[] = [];
  if (tourPackagesManifestUrl) {
    try {
      const response = await fetch(tourPackagesManifestUrl, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { data?: any[] };
      const rawItems = Array.isArray(payload.data) ? payload.data : [];
      const resolveMediaUrl = (url?: string) => {
        if (!url) return "/assets/packages/taj-dawn.webp";
        const trimmed = url.trim();
        if (trimmed.startsWith("/api/")) return `${apiBase}${trimmed}`;
        return trimmed;
      };

      publishedTourPackages = rawItems
        .filter((item) => item.status === "published")
        .map((item) => {
          const rawImg = item.imageUrl ?? item.image_url ?? item.image;
          const image = resolveMediaUrl(rawImg);
          const gallery = Array.isArray(item.gallery)
            ? item.gallery.map((g: any) => {
                if (typeof g === "string") return { url: resolveMediaUrl(g), alt: item.name, caption: item.name };
                return {
                  ...g,
                  url: resolveMediaUrl(g.url),
                };
              })
            : [];
          return {
            ...item,
            slug: item.slug ?? item.packageCode ?? item.package_code,
            image,
            gallery: gallery.length > 0 ? gallery : [{ url: image, alt: item.name, caption: item.name }],
            fleetPrices: sanitizeFleetPrices(item.fleetPrices ?? item.fleet_prices),
          };
        });
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedTourPackages.length} published tour packages from ${tourPackagesManifestUrl}.`);
    } catch (error) {
      console.warn(`⚠️ [Manifest Builder] Tour packages manifest unavailable; preserving existing snapshot (${error instanceof Error ? error.message : String(error)}).`);
    }
  } else {
    console.warn("⚠️ [Manifest Builder] TOUR_PACKAGES_MANIFEST_URL not set; skipping remote tour packages fetch.");
  }
  const publishedTourPackagesPath = join(reactRoot, "src", "data", "generated-published-tour-packages.json");
  if (publishedTourPackages.length > 0) {
    writeFileSync(publishedTourPackagesPath, JSON.stringify(publishedTourPackages, null, 2), "utf-8");
  } else {
    // If empty and existing file exists, update any relative /api/ media URLs in existing snapshot
    try {
      const existing = JSON.parse(readFileSync(publishedTourPackagesPath, "utf-8"));
      if (Array.isArray(existing) && existing.length > 0) {
        const resolveMediaUrl = (url?: string) => {
          if (!url) return "/assets/packages/taj-dawn.webp";
          const trimmed = url.trim();
          if (trimmed.startsWith("/api/")) return `${apiBase}${trimmed}`;
          return trimmed;
        };
        const updated = existing.map((item: any) => ({
          ...item,
          image: resolveMediaUrl(item.image ?? item.imageUrl),
          gallery: Array.isArray(item.gallery)
            ? item.gallery.map((g: any) => ({
                ...g,
                url: resolveMediaUrl(g.url),
              }))
            : [],
        }));
        writeFileSync(publishedTourPackagesPath, JSON.stringify(updated, null, 2), "utf-8");
      }
    } catch {}
  }

  // 2. Transfer Routes manifest (GET /api/v1/transfer-routes/manifest)
  const transferRoutesManifestUrl = process.env.TRANSFER_ROUTES_MANIFEST_URL || (apiBase ? `${apiBase}/api/v1/transfer-routes/manifest` : undefined);
  let publishedTransferRoutes: any[] = [];
  if (transferRoutesManifestUrl) {
    try {
      const response = await fetch(transferRoutesManifestUrl, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { data?: any[] };
      const rawItems = Array.isArray(payload.data) ? payload.data : [];
      publishedTransferRoutes = rawItems
        .filter((item) => item.status === "published")
        .map((item) => ({
          ...item,
          slug: item.slug ?? item.routeCode ?? item.route_code,
          fleetPrices: sanitizeFleetPrices(item.fleetPrices ?? item.fleet_prices),
        }));
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedTransferRoutes.length} published transfer routes from ${transferRoutesManifestUrl}.`);
    } catch (error) {
      console.warn(`⚠️ [Manifest Builder] Transfer routes manifest unavailable; using empty snapshot (${error instanceof Error ? error.message : String(error)}).`);
    }
  } else {
    console.warn("⚠️ [Manifest Builder] TRANSFER_ROUTES_MANIFEST_URL not set; published transfer routes SSG snapshot is empty.");
  }
  writeFileSync(join(reactRoot, "src", "data", "generated-published-transfer-routes.json"), JSON.stringify(publishedTransferRoutes, null, 2), "utf-8");

  // 3. Local Packages manifest (GET /api/v1/local-packages/manifest)
  const localPackagesManifestUrl = process.env.LOCAL_PACKAGES_MANIFEST_URL || (apiBase ? `${apiBase}/api/v1/local-packages/manifest` : undefined);
  let publishedLocalPackages: any[] = [];
  if (localPackagesManifestUrl) {
    try {
      const response = await fetch(localPackagesManifestUrl, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { data?: any[] };
      const rawItems = Array.isArray(payload.data) ? payload.data : [];
      publishedLocalPackages = rawItems
        .filter((item) => item.status === "published")
        .map((item) => ({
          ...item,
          slug: item.slug ?? item.packageCode ?? item.package_code,
          fleetPrices: sanitizeFleetPrices(item.fleetPrices ?? item.fleet_prices),
        }));
      console.log(`✅ [Manifest Builder] Snapshotted ${publishedLocalPackages.length} published local packages from ${localPackagesManifestUrl}.`);
    } catch (error) {
      console.warn(`⚠️ [Manifest Builder] Local packages manifest unavailable; using empty snapshot (${error instanceof Error ? error.message : String(error)}).`);
    }
  } else {
    console.warn("⚠️ [Manifest Builder] LOCAL_PACKAGES_MANIFEST_URL not set; published local packages SSG snapshot is empty.");
  }
  writeFileSync(join(reactRoot, "src", "data", "generated-published-local-packages.json"), JSON.stringify(publishedLocalPackages, null, 2), "utf-8");

  // 4. Combined Content manifest (GET /api/v1/content/manifest)
  const contentManifestUrl = process.env.CONTENT_MANIFEST_URL || (apiBase ? `${apiBase}/api/v1/content/manifest` : undefined);
  let publishedContent: Record<string, any> = {
    cancellationPolicies: [],
    monuments: [],
    petPolicy: null,
    companyProfile: null,
    dossierSignoffs: [],
  };
  if (contentManifestUrl) {
    try {
      const response = await fetch(contentManifestUrl, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { data?: Record<string, any> };
      if (payload.data && typeof payload.data === "object") {
        publishedContent = payload.data;
      }
      console.log(`✅ [Manifest Builder] Snapshotted content manifest (${Object.keys(publishedContent).length} sections) from ${contentManifestUrl}.`);
    } catch (error) {
      console.warn(`⚠️ [Manifest Builder] Content manifest unavailable; using fallback snapshot (${error instanceof Error ? error.message : String(error)}).`);
    }
  } else {
    console.warn("⚠️ [Manifest Builder] CONTENT_MANIFEST_URL not set; content SSG snapshot is empty.");
  }
  writeFileSync(join(reactRoot, "src", "data", "generated-published-content.json"), JSON.stringify(publishedContent, null, 2), "utf-8");
}

await buildRouteCatalogAndManifest();
