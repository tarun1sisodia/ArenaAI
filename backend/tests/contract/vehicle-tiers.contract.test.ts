import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createTestApp } from "../helpers.js";
import {
  VEHICLE_TIERS as CONTRACT_TIERS,
  VEHICLE_TIER_META,
  normalizeFleetCode,
  resolveTierKey,
  toCanonicalTierKey,
} from "../../src/contracts/vehicle-tiers.js";
import { VEHICLE_TIERS as DOMAIN_TIERS } from "../../src/types/domain.js";
import { FareResponseSchema } from "../../src/modules/fares/fare.schema.js";

const repoRoot = new URL("../../..", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, repoRoot), "utf8");

function futureIso(daysAhead = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

describe("C-ENUM-001: canonical vehicle tiers (contract lock)", () => {
  it("generated backend copy is byte-identical to the contract source", () => {
    const source = read("contracts/enums/vehicle-tiers.ts");
    const copy = read("backend/src/contracts/vehicle-tiers.ts");
    expect(copy.endsWith(source)).toBe(true);
    expect(copy).toContain("GENERATED — do not edit by hand.");
  });

  it("domain.ts VEHICLE_TIERS has not drifted from the contract", () => {
    expect([...DOMAIN_TIERS]).toEqual([...CONTRACT_TIERS]);
  });

  it("contract tiers match the DB vehicle_tier_enum (migration 0002)", () => {
    const sql = read("backend/migrations/0002_create_enums.sql");
    const m = sql.match(/CREATE TYPE vehicle_tier_enum AS ENUM \(([^)]+)\)/);
    expect(m).toBeTruthy();
    const dbValues = (m?.[1] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/^'|'$/g, ""))
      .filter(Boolean);
    expect(new Set(dbValues)).toEqual(new Set(CONTRACT_TIERS));
  });

  it("toCanonicalTierKey normalizes short ids, snake_case aliases, compound forms and passes canonical through", () => {
    expect(toCanonicalTierKey("innova")).toBe("innova-crysta");
    expect(toCanonicalTierKey("innova_crysta")).toBe("innova-crysta");
    expect(toCanonicalTierKey("tempo")).toBe("tempo-traveller");
    expect(toCanonicalTierKey("tempo_traveller")).toBe("tempo-traveller");
    expect(toCanonicalTierKey("tempo-12")).toBe("tempo-traveller");
    expect(toCanonicalTierKey("tempo-16")).toBe("tempo-traveller");
    expect(toCanonicalTierKey("sedan")).toBe("sedan");
    expect(toCanonicalTierKey("innova-crysta")).toBe("innova-crysta");
    expect(toCanonicalTierKey("  Tempo-Traveller ")).toBe("tempo-traveller");
    expect(toCanonicalTierKey("  innova_crysta  ")).toBe("innova-crysta");
    expect(toCanonicalTierKey("suv")).toBeUndefined();
    expect(toCanonicalTierKey("")).toBeUndefined();
  });

  it("normalizeFleetCode normalizes known tiers and falls back cleanly", () => {
    expect(normalizeFleetCode("innova_crysta")).toBe("innova-crysta");
    expect(normalizeFleetCode("tempo")).toBe("tempo-traveller");
    expect(normalizeFleetCode("unknown_model")).toBe("sedan");
    expect(normalizeFleetCode("unknown_model", "ertiga")).toBe("ertiga");
  });

  it("every tier has meta with a shortId", () => {
    for (const tier of CONTRACT_TIERS) {
      expect(VEHICLE_TIER_META[tier].label).toBeTruthy();
      expect(VEHICLE_TIER_META[tier].seats).toBeTruthy();
      expect(VEHICLE_TIER_META[tier].shortId).toBeTruthy();
    }
    expect(VEHICLE_TIER_META["innova-crysta"].shortId).toBe("innova");
    expect(VEHICLE_TIER_META["tempo-traveller"].shortId).toBe("tempo");
  });

  it("resolveTierKey prefers canonical, falls back to legacy short id and snake_case, never throws", () => {
    const legacySeedShaped = { sedan: 1900, innova: 2850 } as Record<string, number>;
    const legacySnakeShaped = { sedan: 10, innova_crysta: 18, tempo_traveller: 25 } as Record<string, number>;
    const canonicalShaped = { sedan: 1900, "innova-crysta": 3000 } as Record<string, number>;

    const legacyHit = resolveTierKey(legacySeedShaped, "innova-crysta");
    expect(legacyHit).toEqual({ value: 2850, via: "legacy" });

    const snakeHit = resolveTierKey(legacySnakeShaped, "innova-crysta");
    expect(snakeHit).toEqual({ value: 18, via: "legacy" });

    const snakeTempoHit = resolveTierKey(legacySnakeShaped, "tempo-traveller");
    expect(snakeTempoHit).toEqual({ value: 25, via: "legacy" });

    const canonicalHit = resolveTierKey(canonicalShaped, "innova-crysta");
    expect(canonicalHit).toEqual({ value: 3000, via: "canonical" });

    expect(resolveTierKey(canonicalShaped, "tempo-traveller")).toEqual({
      value: undefined,
      via: "miss",
    });
    expect(resolveTierKey(null, "sedan")).toEqual({ value: undefined, via: "miss" });
  });
});

describe("C-API-001: POST /api/v1/fares/calculate (contract)", () => {
  const basePayload = {
    tripType: "one-way" as const,
    originName: "Agra",
    destinationName: "Delhi",
    pickupDatetime: futureIso(),
    distanceKm: 230,
  };

  it("accepts a canonical tier and the response matches FareResponseSchema", async () => {
    const { app } = await createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: { ...basePayload, vehicleTier: "sedan" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    // True contract assertion: the wire response must parse against the
    // response schema — no extra/missing fields drift.
    const parsed = FareResponseSchema.safeParse(body.data);
    expect(parsed.success).toBe(true);
    expect(body.data.vehicleTier).toBe("sedan");
    expect(body.data.totalFare).toBeGreaterThan(0);
    await app.close();
  });

  it("rejects a legacy short tier id at the API boundary (canonical only)", async () => {
    const { app } = await createTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fares/calculate",
      payload: { ...basePayload, vehicleTier: "innova" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
    await app.close();
  });
});
