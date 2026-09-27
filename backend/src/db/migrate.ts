import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../config/env.js";

export async function runMigrations(options?: {
  connectionString?: string;
  migrationsDir?: string;
  silent?: boolean;
}): Promise<{ applied: string[]; total: number }> {
  const env = loadEnv();
  const connectionString = options?.connectionString ?? env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultDir = path.resolve(moduleDir, "../../migrations");
  const dir = options?.migrationsDir ?? defaultDir;

  const client = new pg.Client({ connectionString });
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query(
      "create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())",
    );
    const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
    for (const file of files) {
      const existing = await client.query("select 1 from schema_migrations where id=$1", [file]);
      if ((existing.rowCount ?? 0) > 0) {
        continue;
      }
      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations(id) values ($1)", [file]);
        await client.query("commit");
        applied.push(file);
        if (!options?.silent) {
          process.stdout.write(`applied ${file}\n`);
        }
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
    return { applied, total: files.length };
  } finally {
    await client.end();
  }
}

// If executed directly as CLI script
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runMigrations().catch((error: unknown) => {
    console.error("Migration error:", error);
    process.exit(1);
  });
}
