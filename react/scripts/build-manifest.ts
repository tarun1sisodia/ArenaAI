import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");

export type PricingModelType = "oneway" | "day120" | "tempo" | "tour" | "custom";

export interface CompressedRoute {
  o: string;              // Origin
  d: string;              // Destination
  km: number;             // Distance in km (One-Way)
  m: number;              // Duration in minutes
  fh: number;             // Fare Hatchback
  fs: number;             // Fare Sedan (Dzire / Etios)
  fe: number;             // Fare Ertiga / SUV
  fi: number;             // Fare Innova Crysta
  ft: number;             // Tempo Traveller Per-KM Rate (or base)
  fu: number;             // Force Urbania Per-KM Rate
  pm: PricingModelType;   // Pricing Model Flag
  c: string;              // Travel Corridor
  toll: 1 | 0;            // Toll inclusion: 1 = included, 0 = extra
}

export function buildRouteManifest(): void {
  const csvPath = join(reactRoot, "new_design", "all_routes_and_prices.csv");
  const rawContent = readFileSync(csvPath, "utf-8");
  const lines = rawContent.split(/\r?\n/).filter(Boolean);

  const manifest: Record<string, CompressedRoute> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Parse CSV line handling potential quoted commas
    const row = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (!row || row.length < 12) continue;

    const firstCell = row[0];
    if (!firstCell) continue;
    const routeId = firstCell.replace(/"/g, "").trim();
    if (!routeId || routeId === "home") continue;

    const origin = row[1]?.replace(/"/g, "").trim() || "Agra";
    const dest = row[2]?.replace(/"/g, "").trim() || "Delhi";
    const corridor = row[3]?.replace(/"/g, "").trim() || "Regional Routes";
    const rawPricingModel = (row[5] || "").replace(/"/g, "").trim();

    // Map pricing model flag
    let pm: PricingModelType = "oneway";
    if (rawPricingModel === "tempo_traveller" || routeId.includes("tempo-traveller")) {
      pm = "tempo";
    } else if (rawPricingModel === "day_package_120km") {
      pm = "day120";
    } else if (rawPricingModel === "tour_package") {
      pm = "tour";
    } else if (rawPricingModel === "custom_or_hourly") {
      pm = "custom";
    }

    const distMatch = row[6]?.match(/(\d+)/);
    const distKm = distMatch ? parseInt(distMatch[1], 10) : 0;

    const timeMatch = row[7]?.match(/(\d+)\s*(?:to\s*(\d+))?\s*(?:hours|hrs|h)/i);
    let durationMins = 180;
    if (timeMatch) {
      const h1 = parseInt(timeMatch[1], 10);
      const h2 = timeMatch[2] ? parseInt(timeMatch[2], 10) : h1;
      durationMins = Math.round(((h1 + h2) / 2) * 60);
    }

    const parseFare = (val: string): number => {
      // Don't treat "From Rs. 17 / KM" as a flat 17 rupee fare!
      if (/per\s*km|\/\s*km/i.test(val)) {
        return 0; // Handled via per-km logic
      }
      const m = val?.match(/Rs\.?\s*([\d,]+)/i);
      return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
    };

    let hatch = parseFare(row[8] || "");
    let sedan = parseFare(row[9] || "");
    let suv = parseFare(row[10] || "");
    let innova = parseFare(row[11] || "");
    let tempoPerKm = 17;
    let urbaniaPerKm = 25;

    // Special handling for Tempo Traveller routes
    if (pm === "tempo") {
      // Extract per km rate from row[10] e.g. "From Rs. 17 / KM" or row[12]
      const kmMatch = (row[10] || row[12] || "").match(/(\d+)\s*(?:\/|\s*per)\s*km/i);
      if (kmMatch) {
        tempoPerKm = parseInt(kmMatch[1], 10);
      }
      urbaniaPerKm = Math.round(tempoPerKm * 1.45); // Urbania luxury rate
      hatch = 0;
      sedan = 0;
      suv = 0;
      innova = 0;
    } else if (pm === "day120") {
      // 120km Day package
      hatch = hatch || 2200;
      sedan = sedan || 2800;
      suv = suv || 3000;
      innova = innova || 3600;
      tempoPerKm = 22;
      urbaniaPerKm = 30;
    } else if (pm === "tour") {
      // Tour package
      sedan = sedan || 2000;
      suv = suv || 2700;
      innova = Math.round(suv * 1.35);
      hatch = Math.round(sedan * 0.85);
      tempoPerKm = 22;
      urbaniaPerKm = 30;
    }

    const tollInclusive = (row[15] || "").toLowerCase().includes("included") ? 1 : 0;

    manifest[routeId] = {
      o: origin,
      d: dest,
      km: distKm,
      m: durationMins,
      fh: hatch,
      fs: sedan,
      fe: suv,
      fi: innova,
      ft: tempoPerKm,
      fu: urbaniaPerKm,
      pm,
      c: corridor,
      toll: tollInclusive,
    };
  }

  const outputPath = join(reactRoot, "public", "routes-manifest.json");
  writeFileSync(outputPath, JSON.stringify(manifest), "utf-8");
  console.log(`✅ [Manifest Builder] Built public/routes-manifest.json with ${Object.keys(manifest).length} routes (with pricing models & per-km group rates).`);
}

buildRouteManifest();
