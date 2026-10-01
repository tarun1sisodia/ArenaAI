import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { VEHICLES } from "../../backend/src/modules/fares/fare.catalogue.ts";

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
  }

  // Published admin routes become the customer site's source of truth on the
  // next frontend rebuild. Static JSON remains the safe fallback for local
  // builds and environments where the backend is not reachable.
  const manifestUrl = process.env.ROUTE_CATALOG_MANIFEST_URL;
  if (manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      if (response.ok) {
        const payload = await response.json() as { data?: Array<any> };
        for (const item of payload.data ?? []) {
          if (item.status !== "published") continue;
          const fares = item.faresInr ?? item.fares_inr ?? {};
          const routeSlug = String(item.slug);
          const distanceKm = Number(item.distanceKm ?? item.distance_km ?? 0);
          const durationText = String(item.durationText ?? item.duration_text ?? "");
          const durationMins = Number(durationText.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1] ?? 0) * 60 || Math.round((distanceKm / 55) * 60);
          manifest[routeSlug] = {
            o: item.sourceCity ?? item.source_city,
            d: item.destinationCity ?? item.destination_city ?? "Local sightseeing",
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
          allRoutesList.push({ id: routeSlug, from: item.sourceCity ?? item.source_city, to: item.destinationCity ?? item.destination_city ?? "Local sightseeing", origin: item.sourceCity ?? item.source_city, destination: item.destinationCity ?? item.destination_city ?? "Local sightseeing", km: distanceKm, duration: durationText, kind: item.tripType, pricingModel: item.tripType === "round-trip" ? "day120" : item.tripType === "local-tour" ? "tour" : "oneway", toll: item.tollIncluded === false ? 0 : 1, fares: { sedan: Number(fares.sedan ?? 2000), ertiga: Number(fares.ertiga ?? 2800), innova: Number(fares.innova ?? 3800), tempo: Number(fares.tempo ?? 5500), urbania: Number(fares.urbania ?? 7500) } });
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
  const getRate = (id: string) => VEHICLES.find((v) => v.id === id)?.perKm ?? 10;
  const isAlwaysRoundTrip = (id: string) => Boolean(VEHICLES.find((v) => v.id === id)?.alwaysRoundTrip);

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
}

await buildRouteCatalogAndManifest();
