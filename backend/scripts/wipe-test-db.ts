import pg from "pg";
import { loadEnv } from "../src/config/env.js";

async function run() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log("Inspecting public tables in database...");
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    );
    const tables = res.rows.map((r: any) => r.table_name);
    console.log("Found tables:", tables);

    // Filter out migrations tracking table so schema versioning is preserved
    const tablesToWipe = tables.filter((t: string) => t !== "schema_migrations" && t !== "_prisma_migrations");

    console.log("\nTruncating tables...");
    for (const tbl of tablesToWipe) {
      try {
        await client.query(`TRUNCATE TABLE "${tbl}" CASCADE;`);
        console.log(`  ✓ Truncated ${tbl}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Could not truncate ${tbl}: ${err.message}`);
      }
    }

    console.log("\n✅ Successfully wiped test database!");
  } catch (err) {
    console.error("❌ Wipe failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
