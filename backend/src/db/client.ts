import type { Env } from "../config/env.js";
import { createMemoryRepositories } from "./memory.js";
import { createPostgresRepositories } from "./postgres.js";
import type { Repositories } from "./types.js";

export async function createRepositories(env: Env): Promise<{ repos: Repositories; mode: "memory" | "postgres" }> {
  if (env.DATABASE_URL) {
    const repos = await createPostgresRepositories(env.DATABASE_URL);
    return { repos, mode: "postgres" };
  }
  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
  return { repos: createMemoryRepositories(), mode: "memory" };
}
