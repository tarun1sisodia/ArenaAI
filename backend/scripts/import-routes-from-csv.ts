import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(__filename);
const backendRoot = path.join(scriptsDir, "..");
const repoRoot = path.join(backendRoot, "..");
const csvPath = path.join(repoRoot, "react", "new_design", "all_routes_and_prices.csv");
const outputPath = path.join(backendRoot, "src", "modules", "fares", "catalog.data.json");

// Canonical 8 locked routes with exact byte-identical fares
const CANONICAL_ROUTES: Record<string, {
  sedan: number;
  ertiga: number;
  innova: number;
  tempo: number;
  urbania: number;
  km: number;
  duration: string;
  kind: "one-way" | "local";
  localLabel?: string;
}> = {
  "agra-delhi": { km: 230, duration: "3h 30m", kind: "one-way", sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 },
  "delhi-agra": { km: 230, duration: "3h 30m", kind: "one-way", sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 },
  "agra-jaipur": { km: 240, duration: "4h 30m", kind: "one-way", sedan: 3499, ertiga: 4999, innova: 6999, tempo: 11000, urbania: 16000 },
  "agra-mathura": { km: 55, duration: "1h 15m", kind: "one-way", sedan: 2200, ertiga: 2800, innova: 3800, tempo: 5500, urbania: 8000 },
  "agra-gwalior": { km: 120, duration: "2h 30m", kind: "one-way", sedan: 3000, ertiga: 3800, innova: 5500, tempo: 7500, urbania: 11000 },
  "delhi-jaipur": { km: 270, duration: "5h", kind: "one-way", sedan: 5000, ertiga: 6200, innova: 8800, tempo: 12000, urbania: 17500 },
  "agra-lucknow": { km: 335, duration: "6h", kind: "one-way", sedan: 7000, ertiga: 8500, innova: 12000, tempo: 16000, urbania: 22000 },
  "agra-noida": { km: 190, duration: "3h", kind: "one-way", sedan: 3999, ertiga: 4999, innova: 6999, tempo: 8500, urbania: 11500 },
  "agra-gurgaon": { km: 215, duration: "3h 45m", kind: "one-way", sedan: 4999, ertiga: 5499, innova: 6550, tempo: 8900, urbania: 11900 },
  "agra-ayodhya": { km: 470, duration: "7h", kind: "one-way", sedan: 9999, ertiga: 11999, innova: 13999, tempo: 17500, urbania: 23000 },
  "agra-local": { km: 80, duration: "8h", kind: "local", localLabel: "Agra sightseeing (8h / 80km)", sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 },
};

function parseFare(val: string | undefined): number {
  if (!val || /per\s*km|\/\s*km/i.test(val)) return 0;
  const m = val.match(/Rs\.?\s*([\d,]+)/i);
  return m ? parseInt(m[1]!.replace(/,/g, ""), 10) : 0;
}

export function importRoutesFromCsv(): void {
  const raw = readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  const cleanRoutes: Record<string, any> = {};
  const droppedSlugs: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (!row || row.length < 12) continue;

    const rawId = (row[0] || "").replace(/"/g, "").trim();
    if (!rawId || rawId === "home") {
      droppedSlugs.push(rawId || `row_${i}`);
      continue;
    }

    const origin = (row[1] || "").replace(/"/g, "").trim();
    const dest = (row[2] || "").replace(/"/g, "").trim();
    const corridor = (row[3] || "").replace(/"/g, "").trim() || "Regional Routes";
    const rawPricingModel = (row[5] || "").replace(/"/g, "").trim();
    const distStr = (row[6] || "").replace(/"/g, "").trim();
    const timeStr = (row[7] || "").replace(/"/g, "").trim();

    // Drop non-route pages (WordPress legacy remnants, marketing blogs, generic hubs)
    if (
      origin.toLowerCase() === "general" ||
      dest.toLowerCase() === "general" ||
      rawId.includes("measures") ||
      rawId.includes("attractions") ||
      dest.toLowerCase().includes("places-to-visit") ||
      rawId.includes("photo-gallery") ||
      rawId.includes("our-fleet") ||
      rawId.includes("testimonials") ||
      rawId.includes("news-") ||
      rawId.includes("contact") ||
      rawId.includes("typography") ||
      rawId === "pages" ||
      rawId === "full-width" ||
      rawId === "service-rates"
    ) {
      droppedSlugs.push(rawId);
      continue;
    }

    // Determine distance in km
    const distMatch = distStr.match(/(\d+)/);
    let distKm = distMatch ? parseInt(distMatch[1]!, 10) : 0;

    // Determine duration in minutes
    const timeMatch = timeStr.match(/(\d+)\s*(?:to\s*(\d+))?\s*(?:hours|hrs|h)/i);
    let durationMins = 180;
    if (timeMatch) {
      const h1 = parseInt(timeMatch[1]!, 10);
      const h2 = timeMatch[2] ? parseInt(timeMatch[2]!, 10) : h1;
      durationMins = Math.round(((h1 + h2) / 2) * 60);
    } else if (distKm > 0) {
      durationMins = Math.round((distKm / 55) * 60);
    }

    // Fill km if 0 based on travel duration
    if (distKm <= 0) {
      distKm = Math.max(30, Math.round((durationMins / 60) * 55));
    }

    const durationHrs = Math.floor(durationMins / 60);
    const durationRem = durationMins % 60;
    const durationStr = `${durationHrs}h${durationRem ? ` ${durationRem}m` : ""}`;

    // Pricing model mapping
    let pm: "oneway" | "day120" | "tempo" | "tour" | "custom" = "oneway";
    if (rawPricingModel === "tempo_traveller" || rawId.includes("tempo-traveller")) {
      pm = "tempo";
    } else if (rawPricingModel === "day_package_120km") {
      pm = "day120";
    } else if (rawPricingModel === "tour_package") {
      pm = "tour";
    } else if (rawPricingModel === "custom_or_hourly") {
      pm = "custom";
    }

    let hatch = parseFare(row[8]);
    let sedan = parseFare(row[9]);
    let suv = parseFare(row[10]);
    let innova = parseFare(row[11]);
    let tempo: number;
    let urbania: number;

    if (pm === "day120") {
      hatch = hatch || 2200;
      sedan = sedan || 2800;
      suv = suv || 3000;
      innova = innova || 3600;
      tempo = 6500;
      urbania = 8500;
    } else if (pm === "tour") {
      sedan = sedan || 2000;
      suv = suv || 2700;
      innova = innova || Math.round(suv * 1.35);
      hatch = hatch || Math.round(sedan * 0.85);
      tempo = distKm > 0 ? Math.round(distKm * 25) : 6500;
      urbania = distKm > 0 ? Math.round(distKm * 34) : 8500;
    } else if (pm === "tempo") {
      hatch = Math.max(1800, distKm * 9);
      sedan = Math.max(2200, distKm * 10);
      suv = Math.max(2800, distKm * 14);
      innova = Math.max(3800, distKm * 18);
      tempo = Math.max(5500, distKm * 25);
      urbania = Math.max(7500, distKm * 34);
    } else {
      hatch = hatch || Math.max(1800, distKm * 9);
      sedan = sedan || Math.max(2200, distKm * 10);
      suv = suv || Math.max(2800, distKm * 14);
      innova = innova || Math.max(3800, distKm * 18);
      tempo = Math.max(5500, distKm * 25);
      urbania = Math.max(7500, distKm * 34);
    }

    const canonical = CANONICAL_ROUTES[rawId];
    let fares: { sedan: number; ertiga: number; innova: number; tempo: number; urbania: number };
    let kind: "one-way" | "local" = pm === "day120" ? "local" : "one-way";
    let finalDist = distKm;
    let finalDuration = durationStr;

    if (canonical) {
      fares = {
        sedan: canonical.sedan,
        ertiga: canonical.ertiga,
        innova: canonical.innova,
        tempo: canonical.tempo,
        urbania: canonical.urbania,
      };
      finalDist = canonical.km;
      finalDuration = canonical.duration;
      kind = canonical.kind;
    } else {
      fares = {
        sedan,
        ertiga: suv,
        innova,
        tempo,
        urbania,
      };
    }

    const tollInclusive = (row[15] || "").toLowerCase().includes("included") ? 1 : 0;

    cleanRoutes[rawId] = {
      id: rawId,
      from: origin.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      to: dest.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      origin,
      destination: dest,
      corridor,
      km: finalDist,
      duration: finalDuration,
      durationMins,
      kind,
      pricingModel: pm,
      toll: tollInclusive,
      hatchbackFare: hatch,
      fares,
    };
  }

  // Also verify all CANONICAL_ROUTES exist in cleanRoutes
  for (const [slug, item] of Object.entries(CANONICAL_ROUTES)) {
    if (!cleanRoutes[slug]) {
      const parts = slug.split("-");
      const fromName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Agra";
      const toName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "Delhi";
      cleanRoutes[slug] = {
        id: slug,
        from: parts[0] || "agra",
        to: parts[1] || "delhi",
        origin: fromName,
        destination: toName,
        corridor: "Verified Primary Corridor",
        km: item.km,
        duration: item.duration,
        durationMins: 210,
        kind: item.kind,
        pricingModel: "oneway",
        toll: 1,
        hatchbackFare: Math.round(item.sedan * 0.85),
        fares: {
          sedan: item.sedan,
          ertiga: item.ertiga,
          innova: item.innova,
          tempo: item.tempo,
          urbania: item.urbania,
        },
      };
    }
  }

  writeFileSync(outputPath, JSON.stringify(cleanRoutes, null, 2), "utf-8");
  console.log(`[Import] Wrote ${Object.keys(cleanRoutes).length} clean routes to ${outputPath}`);
  console.log(`[Import] Dropped ${droppedSlugs.length} non-route legacy rows.`);
}

importRoutesFromCsv();
