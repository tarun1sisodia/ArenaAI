import { loadEnv } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { createRepositories } from "./db/client.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);
  const { repos, mode } = await createRepositories(env);
  const { app } = await buildApp({ env, logger, db: repos });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info({ port: env.PORT, mode }, "SK Baghel API listening");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
