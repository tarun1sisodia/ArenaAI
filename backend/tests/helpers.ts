import pino from "pino";
import { buildApp } from "../src/app.js";
import { loadEnv, resetEnvCache } from "../src/config/env.js";
import { createMemoryRepositories } from "../src/db/memory.js";
import { hmacSha256Hex } from "../src/shared/hmac.js";
import type { Repositories } from "../src/db/types.js";

export async function createTestApp(db?: Repositories) {
  resetEnvCache();
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    ALLOW_TEST_AUTH: "true",
    CORS_ORIGINS: "http://localhost:5173,http://localhost:3000,https://agraskbagheltourandtravels.com,https://skbagheltravels-admin.coccoder999.workers.dev/,https://skbagheltravels-customer.coccoder999.workers.dev/",
  });
  const logger = pino({ level: "silent" });
  const repos = db ?? createMemoryRepositories(new Date().toISOString());
  const built = await buildApp({ env, logger, db: repos, clock: { now: () => new Date() } });
  return { ...built, env };
}

export function signProviderBody(secret: string, payload: unknown): { raw: Buffer; signature: string } {
  const raw = Buffer.from(JSON.stringify(payload));
  return { raw, signature: hmacSha256Hex(secret, raw) };
}

function futureIso(daysAhead = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export const sampleDraft = {
  tripType: "one-way" as const,
  vehicleTier: "sedan" as const,
  originName: "Agra",
  destinationName: "Delhi",
  pickupAddress: "Taj East Gate Road, Taj Ganj",
  dropAddress: "IGI Airport T3",
  get pickupDatetime() {
    return futureIso(17);
  },
  distanceKm: 230,
  customerName: "Aman Sharma",
  customerPhone: "9876543221",
  customerEmail: "aman@example.com",
};
