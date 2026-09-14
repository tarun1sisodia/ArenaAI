import pg from "pg";
import { loadEnv } from "../src/config/env.js";
import { DEFAULT_PROMO, PACKAGES, VEHICLES, toVehicleTier } from "../src/modules/fares/fare.catalogue.js";

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed");
  }
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    for (const vehicle of VEHICLES) {
      await client.query(
        `insert into vehicles (id, tier, name, plate_number, seating_capacity, luggage_capacity, per_km_rate, is_active)
         values ($1,$2,$3,$4,$5,$6,$7,true)
         on conflict (id) do nothing`,
        [
          vehicle.id,
          toVehicleTier(vehicle.id),
          vehicle.name,
          `UP80-${vehicle.id.slice(0, 3).toUpperCase()}-01`,
          vehicle.seats,
          vehicle.bags,
          vehicle.perKm,
        ],
      );
    }
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
