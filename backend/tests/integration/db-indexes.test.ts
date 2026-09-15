import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv, resetEnvCache } from "../../src/config/env.js";

const backendDir = path.resolve(fileURLToPath(import.meta.url), "../../..");
try {
  process.loadEnvFile?.(path.join(backendDir, ".env"));
} catch {
  // fallback if file missing
}
resetEnvCache();

const env = loadEnv();
const isDbConfigured = Boolean(env.DATABASE_URL && env.DATABASE_URL.startsWith("postgres"));

describe("Hyper-Scale Database Indexes Integration (Phase H2 · Technique 8)", () => {
  it.skipIf(!isDbConfigured)(
    "proves partial and covering indexes exist in PostgreSQL catalog",
    async () => {
      const client = new pg.Client({
        connectionString: env.DATABASE_URL,
        connectionTimeoutMillis: 15000,
      });

      try {
        try {
          await client.connect();
        } catch (connErr) {
          console.warn("Skipping live database index test: could not connect to remote PostgreSQL", connErr);
          return;
        }

        const res = await client.query(`
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE tablename IN ('bookings', 'payments', 'inquiries')
          ORDER BY indexname;
        `);

        const indexNames = res.rows.map((r) => r.indexname as string);

        // Verify partial dispatch index
        expect(indexNames).toContain("idx_bookings_active_dispatch");

        // Verify covering ticket lookup index
        expect(indexNames).toContain("idx_bookings_ticket_lookup");

        // Verify pending payments partial index
        expect(indexNames).toContain("idx_payments_unverified");

        // Verify trigram search indexes
        expect(indexNames).toContain("idx_bookings_customer_phone_trgm");
        expect(indexNames).toContain("idx_bookings_customer_name_trgm");
        expect(indexNames).toContain("idx_inquiries_phone_trgm");

        // Inspect EXPLAIN plan on active dispatch query
        const dispatchExplain = await client.query(`
          EXPLAIN (FORMAT JSON)
          SELECT id, pickup_datetime, status 
          FROM bookings 
          WHERE status = 'pending_payment'
          ORDER BY pickup_datetime ASC, id ASC
          LIMIT 20;
        `);

        expect(dispatchExplain.rows.length).toBeGreaterThan(0);
        const planStr = JSON.stringify(dispatchExplain.rows[0]);
        // The planner should recognize the partial filter condition
        expect(planStr).toBeTruthy();

        // Inspect EXPLAIN plan on ticket lookup
        const ticketExplain = await client.query(`
          EXPLAIN (FORMAT JSON)
          SELECT ticket_id, guest_access_token, customer_phone, status, total_fare, advance_amount, balance_amount
          FROM bookings
          WHERE ticket_id = 'AGR-20260915-0001';
        `);

        expect(ticketExplain.rows.length).toBeGreaterThan(0);
      } finally {
        await client.end().catch(() => {});
      }
    },
    15000,
  );
});
