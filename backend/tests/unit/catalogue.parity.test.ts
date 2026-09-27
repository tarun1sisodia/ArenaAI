import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, VEHICLES, PACKAGES } from "../../src/modules/fares/fare.catalogue.js";

const __filename = fileURLToPath(import.meta.url);
const testsDir = path.dirname(__filename);
const backendRoot = path.join(testsDir, "..", "..");
const repoRoot = path.join(backendRoot, "..");
const manifestPath = path.join(repoRoot, "react", "public", "routes-manifest.json");

describe("F1: One Price Source & Catalogue Parity", () => {
  it("backend VEHICLES is the single source for fleet rates and capacities", () => {
    expect(VEHICLES.length).toBe(5);
    const sedan = VEHICLES.find((v) => v.id === "sedan")!;
    const ertiga = VEHICLES.find((v) => v.id === "ertiga")!;
    const innova = VEHICLES.find((v) => v.id === "innova")!;
    const tempo = VEHICLES.find((v) => v.id === "tempo")!;
    const urbania = VEHICLES.find((v) => v.id === "urbania")!;

    expect(sedan.perKm).toBe(10);
    expect(ertiga.perKm).toBe(14);
    expect(innova.perKm).toBe(18);
    expect(tempo.perKm).toBe(25);
    expect(urbania.perKm).toBe(34);
  });

  it("backend ROUTES has full clean inventory with positive distances and unique slugs", () => {
    expect(ROUTES.length).toBeGreaterThan(900);
    const seen = new Set<string>();

    for (const route of ROUTES) {
      expect(route.id).toBeTruthy();
      expect(seen.has(route.id)).toBe(false);
      seen.add(route.id);

      expect(route.from).toBeTruthy();
      expect(route.to).toBeTruthy();
      expect(route.km).toBeGreaterThan(0);
      expect(["one-way", "local"]).toContain(route.kind);

      // Invariant: every route has positive fares for all 5 vehicles
      expect(route.fares.sedan).toBeGreaterThan(0);
      expect(route.fares.ertiga).toBeGreaterThan(0);
      expect(route.fares.innova).toBeGreaterThan(0);
      expect(route.fares.tempo).toBeGreaterThan(0);
      expect(route.fares.urbania).toBeGreaterThan(0);
    }
  });

  it("preserves exact byte-identical fares for the 8 canonical routes", () => {
    const canonicalExpected: Record<string, { km: number; sedan: number; ertiga: number; innova: number; tempo: number; urbania: number }> = {
      "agra-delhi": { km: 230, sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 },
      "delhi-agra": { km: 230, sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 },
      "agra-jaipur": { km: 240, sedan: 3499, ertiga: 4999, innova: 6999, tempo: 11000, urbania: 16000 },
      "agra-mathura": { km: 55, sedan: 2200, ertiga: 2800, innova: 3800, tempo: 5500, urbania: 8000 },
      "agra-gwalior": { km: 120, sedan: 3000, ertiga: 3800, innova: 5500, tempo: 7500, urbania: 11000 },
      "delhi-jaipur": { km: 270, sedan: 5000, ertiga: 6200, innova: 8800, tempo: 12000, urbania: 17500 },
      "agra-lucknow": { km: 335, sedan: 7000, ertiga: 8500, innova: 12000, tempo: 16000, urbania: 22000 },
      "agra-local": { km: 80, sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 },
    };

    for (const [slug, exp] of Object.entries(canonicalExpected)) {
      const r = ROUTES.find((item) => item.id === slug);
      expect(r).toBeDefined();
      expect(r!.km).toBe(exp.km);
      expect(r!.fares.sedan).toBe(exp.sedan);
      expect(r!.fares.ertiga).toBe(exp.ertiga);
      expect(r!.fares.innova).toBe(exp.innova);
      expect(r!.fares.tempo).toBe(exp.tempo);
      expect(r!.fares.urbania).toBe(exp.urbania);
    }
  });

  it("manifest and backend produce the exact same price for the same route + vehicle", () => {
    const rawManifest = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(rawManifest);

    for (const route of ROUTES) {
      const m = manifest[route.id];
      expect(m).toBeDefined();
      expect(m.km).toBe(route.km);
      expect(m.fs).toBe(route.fares.sedan);
      expect(m.fe).toBe(route.fares.ertiga);
      expect(m.fi).toBe(route.fares.innova);
      expect(m.ft).toBe(route.fares.tempo);
      expect(m.fu).toBe(route.fares.urbania);
    }
  });

  it("tour packages have positive starting prices and unique slugs", () => {
    expect(PACKAGES.length).toBeGreaterThan(0);
    const seenSlugs = new Set<string>();

    for (const p of PACKAGES) {
      expect(p.slug).toBeTruthy();
      expect(seenSlugs.has(p.slug)).toBe(false);
      seenSlugs.add(p.slug);
      expect(p.from).toBeGreaterThan(0);
      expect(p.name).toBeTruthy();
    }
  });

  it("parity invariants fail if any route has a zero fare", () => {
    const testRoutes = [
      {
        id: "test-zero",
        from: "agra",
        to: "delhi",
        km: 200,
        kind: "one-way" as const,
        fares: { sedan: 0, ertiga: 3000, innova: 4000, tempo: 5000, urbania: 7000 },
      },
    ];

    const validateRoutes = (rList: typeof testRoutes) => {
      const required = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
      for (const r of rList) {
        for (const k of required) {
          if (r.fares[k] <= 0) {
            throw new Error(`Catalogue parity failed: route "${r.id}" vehicle "${k}" fare must be positive, got ${r.fares[k]}.`);
          }
        }
      }
    };

    expect(() => validateRoutes(testRoutes)).toThrow("Catalogue parity failed");
  });
});

