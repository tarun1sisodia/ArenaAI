import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { MongoClient } from "mongodb";
import { loadEnv, resetEnvCache } from "../../src/config/env.js";

// Ensure backend/.env is loaded regardless of process.cwd()
const backendDir = path.resolve(fileURLToPath(import.meta.url), "../../..");
try {
  process.loadEnvFile?.(path.join(backendDir, ".env"));
} catch {
  // fallback if file missing
}
resetEnvCache();

describe("Database Connectivity Integration", () => {
  const env = loadEnv();

  it("connects to PostgreSQL (Supabase) and executes queries", async () => {
    expect(env.DATABASE_URL).toBeTruthy();

    const client = new pg.Client({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const res = await client.query("SELECT 1 + 1 AS sum, current_database() AS db, current_user AS user;");
      expect(res.rows[0].sum).toBe(2);
      expect(res.rows[0].db).toBeTruthy();
      expect(res.rows[0].user).toBeTruthy();
    } finally {
      await client.end().catch(() => {});
    }
  }, 10000);

  it("connects to MongoDB Atlas and responds to ping", async () => {
    expect(env.MONGODB_URI).toBeTruthy();

    const client = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    try {
      await client.connect();
      const ping = await client.db("admin").command({ ping: 1 });
      expect(ping.ok).toBe(1);
    } finally {
      await client.close().catch(() => {});
    }
  }, 10000);
});
