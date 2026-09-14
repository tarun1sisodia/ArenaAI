import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../src/config/env.js";
import { DEFAULT_PROMO, PACKAGES } from "../src/modules/fares/fare.catalogue.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  process.loadEnvFile?.(path.join(root, ".env"));
} catch {
  console.warn("No ENV file found");
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed");
  }
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `insert into promo_codes (id, code, discount_amount, min_total, description, is_active)
       values (gen_random_uuid(), $1, $2, $3, $4, true)
       on conflict (code) do nothing`,
      [DEFAULT_PROMO.code, DEFAULT_PROMO.discount, DEFAULT_PROMO.minTotal, DEFAULT_PROMO.desc],
    );
    for (const pack of PACKAGES) {
      await client.query(
        `insert into catalog_items (id, type, slug, title, short_description, description, status, duration_text, route_summary, starting_price_inr, published_at)
         values ($1,'package',$2,$3,$3,$3,'published',$4,$3,$5, now())
         on conflict (slug) do nothing`,
        [pack.id, pack.slug, pack.name, pack.duration, pack.from],
      );
    }
    process.stdout.write("seed complete\n");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
