import { describe, expect, it } from "vitest";
import { CreateRouteCatalogSchema, UpdateRouteCatalogSchema } from "../../src/modules/route-catalog/route-catalog.schema.js";

describe("Route Catalog extension-field contract", () => {
  const base = {
    trip_type: "one-way" as const,
    source_city: "Agra",
    destination_city: "Delhi",
    slug: "agra-to-delhi-taxi",
    available_fleets: ["sedan"],
    fares_inr: { sedan: 6500 },
    interstate_charges: [],
    stops: [],
    use_per_km: true,
    per_km_rate_override: 12.5,
    highway: "Yamuna Expressway",
    all_inclusive_note: "Toll and driver allowance included",
  };

  it("accepts all database-backed extension fields on create", () => {
    const result = CreateRouteCatalogSchema.parse(base);
    expect(result.use_per_km).toBe(true);
    expect(result.per_km_rate_override).toBe(12.5);
    expect(result.highway).toBe("Yamuna Expressway");
    expect(result.all_inclusive_note).toBe("Toll and driver allowance included");
  });

  it("accepts partial extension-field updates without silently dropping them", () => {
    const result = UpdateRouteCatalogSchema.parse({
      use_per_km: false,
      per_km_rate_override: null,
      highway: "NH-21",
      all_inclusive_note: "All taxes included",
    });
    expect(result).toEqual({
      use_per_km: false,
      per_km_rate_override: null,
      highway: "NH-21",
      all_inclusive_note: "All taxes included",
    });
  });
});
