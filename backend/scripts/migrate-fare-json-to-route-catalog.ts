import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import { createPoolConfig } from "../src/db/poolConfig.js";

const backendRoot = new URL("../", import.meta.url).pathname;
const catalogPath = join(backendRoot, "src", "modules", "fares", "catalog.data.json");
const apply = process.argv.includes("-apply");
const raw = JSON.parse(await readFile(catalogPath, "utf8")) as Record<string, any>;
const rows = Object.entries(raw).map(([slug, item]) => ({ slug, item }));
const quarantined = rows.filter(({ slug }) => /^\d+-btn-/.test(slug) || /command/i.test(slug) || /--/.test(slug));
const importable = rows.filter(({ slug }) => !quarantined.some((item) => item.slug === slug));
console.log(`would import ${importable.length}, quarantine ${quarantined.length}, skip 0`);
if (quarantined.length) console.log(`quarantine slugs: ${quarantined.slice(0, 25).map(({ slug }) => slug).join(", ")}`);
if (!apply) { console.log("Dry-run only. Pass -apply after reviewing the report."); process.exit(0); }
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for -apply.");

const pool = new pg.Pool(createPoolConfig(process.env.DATABASE_URL, { max: 2, min: 0 }));
try {
  await pool.query("begin");
  for (const { slug, item } of importable) {
    const local = item.kind === "local";
    const tripType = local ? "local-tour" : "one-way";
    const stops = local ? [{ name: item.from || "Agra" }, { name: item.to || item.destination || "Sightseeing" }] : [];
    await pool.query(
      `insert into route_catalog (trip_type, source_city, source_detail, destination_city, slug, distance_km, duration_text, available_fleets, fares_inr, driver_charge_inr, night_halt_inr, toll_included, toll_amount_inr, interstate_charges, min_km_per_day, stops, status, needs_review)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,0,$10,null,'[]',$11,$12,'draft',$13)
       on conflict (slug) do update set trip_type=excluded.trip_type, source_city=excluded.source_city, source_detail=excluded.source_detail, destination_city=excluded.destination_city, distance_km=excluded.distance_km, duration_text=excluded.duration_text, available_fleets=excluded.available_fleets, fares_inr=excluded.fares_inr, toll_included=excluded.toll_included, min_km_per_day=excluded.min_km_per_day, stops=excluded.stops, needs_review=excluded.needs_review, updated_at=now()`,
      [tripType, item.origin || item.from || "Agra", item.origin || null, local ? null : item.destination || item.to || null, slug, item.km ?? null, item.duration || null, Object.keys(item.fares || {}), JSON.stringify(item.fares || {}), item.toll === 1, 300, JSON.stringify(stops), Boolean(item.fares == null)],
    );
  }
  await pool.query("commit");
  console.log(`Imported ${importable.length} route records as drafts. Review and publish them from Admin → Catalog → Routes.`);
} catch (error) {
  await pool.query("rollback");
  throw error;
} finally {
  await pool.end();
}
