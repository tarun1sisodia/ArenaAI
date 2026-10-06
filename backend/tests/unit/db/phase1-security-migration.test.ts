import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationPath = path.join(backendDir, "migrations", "0032_phase1_security_hardening.sql");

describe("Phase 1 database security migration contract", () => {
  it("enables RLS on every audited post-0016 content table", async () => {
    const sql = await readFile(migrationPath, "utf8");
    for (const table of [
      "schema_migrations",
      "fare_rules",
      "route_catalog",
      "local_sightseeing_packages",
      "transfer_routes",
      "tour_packages",
      "package_vehicle_upgrades",
      "cancellation_policies",
      "company_profile",
      "pet_taxi_policy",
      "monuments",
      "dossier_signoffs",
    ]) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, "i"));
    }
  });

  it("contains no anonymous or authenticated write policy", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).not.toMatch(/CREATE POLICY[^;]+ON\s+\w+\s+FOR\s+(INSERT|UPDATE|DELETE|ALL)[^;]*(anon|authenticated)/is);
    expect(sql).toMatch(/REVOKE ALL ON schema_migrations FROM PUBLIC/i);
    expect(sql).toMatch(/REVOKE ALL ON schema_migrations FROM anon/i);
    expect(sql).toMatch(/REVOKE ALL ON schema_migrations FROM authenticated/i);
  });

  it("limits public content reads to published or explicitly public records", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toMatch(/status = 'published' AND needs_review = false/i);
    expect(sql).toMatch(/status = 'published' AND is_active = true/i);
    expect(sql).toMatch(/effective_from <= now\(\)/i);
    expect(sql).toMatch(/dossier_status = 'signed_off'/i);
  });
});
