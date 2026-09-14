import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../src/config/env.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run migrations");
  }
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      "create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())",
    );
    const dir = path.join(root, "migrations");
    const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of files) {
      const applied = await client.query("select 1 from schema_migrations where id=$1", [file]);
      if ((applied.rowCount ?? 0) > 0) {
        continue;
      }
      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations(id) values ($1)", [file]);
        await client.query("commit");
        process.stdout.write(`applied ${file}\n`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
