import { runMigrations } from "../src/db/migrate.js";

runMigrations().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

