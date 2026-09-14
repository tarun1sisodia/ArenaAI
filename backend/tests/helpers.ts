import pino from "pino";
import { buildApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { createMemoryRepositories } from "../src/db/memory.js";
import { hmacSha256Hex } from "../src/shared/hmac.js";
import type { Repositories } from "../src/db/types.js";

export async function createTestApp(db?: Repositories) {
  const env = loadEnv();
  const logger = pino({ level: "silent" });
  const repos = db ?? createMemoryRepositories();
  const built = await buildApp({ env, logger, db: repos });
  return { ...built, env };
}

export function signProviderBody(secret: string, payload: unknown): { raw: Buffer; signature: string } {
  const raw = Buffer.from(JSON.stringify(payload));
  return { raw, signature: hmacSha256Hex(secret, raw) };
}

export const sampleDraft = {
  tripType: "one-way" as const,
  vehicleTier: "sedan" as const,
  originName: "Agra",
  destinationName: "Delhi",
  pickupAddress: "Taj East Gate Road, Taj Ganj",
  dropAddress: "IGI Airport T3",
  pickupDatetime: "2026-10-01T08:00:00+05:30",
  distanceKm: 230,
  customerName: "Aman Sharma",
  customerPhone: "9876543221",
  customerEmail: "aman@example.com",
};
