/**
 * Sync contract sources into each app's tree.
 *
 * Source of truth: contracts/enums/*.ts
 * Destinations (checked in, never hand-edited):
 *   backend/src/contracts/, admin/src/contracts/, react/src/contracts/
 *
 * Usage: npx tsx contracts/scripts/sync-contracts.ts [--check]
 *   --check: exit non-zero if any destination differs (used by CI / the lock test).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const srcDir = join(root, "contracts", "enums");
const dests = [
  join(root, "backend", "src", "contracts"),
  join(root, "admin", "src", "contracts"),
  join(root, "react", "src", "contracts"),
];

export const GENERATED_HEADER = (name: string) =>
  `/**\n` +
  ` * GENERATED — do not edit by hand.\n` +
  ` * Source: contracts/enums/${name}\n` +
  ` * Regenerate: npx tsx contracts/scripts/sync-contracts.ts\n` +
  ` * Contract: C-ENUM-001 · contracts/LOCKED.md\n` +
  ` */\n`;

function buildOutput(name: string, source: string): string {
  return GENERATED_HEADER(name) + source;
}

const checkOnly = process.argv.includes("--check");
let dirty = false;

for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".ts"))) {
  const source = readFileSync(join(srcDir, file), "utf8");
  const output = buildOutput(basename(file), source);
  for (const dest of dests) {
    mkdirSync(dest, { recursive: true });
    const target = join(dest, basename(file));
    const current = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (current !== output) {
      if (checkOnly) {
        console.error(`DRIFT: ${target} differs from contracts/enums/${basename(file)}`);
        dirty = true;
      } else {
        writeFileSync(target, output);
        console.log(`synced ${target}`);
      }
    }
  }
}

if (checkOnly && dirty) process.exit(1);
if (!checkOnly) console.log("contracts in sync.");
