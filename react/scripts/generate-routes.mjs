import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", join(scriptsDir, "prerender.ts")],
  { stdio: "inherit" }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
