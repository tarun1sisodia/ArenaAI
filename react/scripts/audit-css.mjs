#!/usr/bin/env node
/**
 * CSS integrity audit (regression guard for the 2026-09-15 UI repair)
 * --------------------------------------------------------------------------
 * Fails when:
 *   1. a className used by src/**\/*.tsx has no matching rule in any stylesheet
 *   2. a `var(--token)` is referenced but never declared
 *
 * Usage:  node scripts/audit-css.mjs [--verbose]
 * Exit:   0 = clean, 1 = gaps found
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLESHEETS = ["src/styles/tokens.css", "src/styles/global.css", "src/styles/ui-kit.css"];
const verbose = process.argv.includes("--verbose");

// Identifiers that are clearly dynamic (state booleans, variant literals, etc.)
const IGNORE = new Set(["icon-tile--"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(full)) out.push(full);
  }
  return out;
}

const css = STYLESHEETS.map((file) => readFileSync(join(root, file), "utf8")).join("\n");

/* ---------- 1. class coverage ---------- */

const definedClasses = new Set();
for (const match of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) definedClasses.add(match[1]);

const usedClasses = new Map();
for (const file of walk(join(root, "src"))) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const raw = (match[1] ?? match[2] ?? "").replace(/\$\{[^}]*\}/g, " ");
    for (const token of raw.split(/[\s`]+/)) {
      if (!/^-?[A-Za-z][\w-]*$/.test(token)) continue;
      if (!usedClasses.has(token)) usedClasses.set(token, new Set());
      usedClasses.get(token).add(relative(root, file));
    }
  }
}

const missingClasses = [...usedClasses.keys()]
  .filter((name) => !definedClasses.has(name) && !IGNORE.has(name))
  .sort();

/* ---------- 2. custom property coverage ---------- */

const definedVars = new Set();
for (const match of css.matchAll(/(--[\w-]+)\s*:/g)) definedVars.add(match[1]);

const usedVars = new Map();
const varFiles = [...walk(join(root, "src")), ...STYLESHEETS.map((f) => join(root, f))];
for (const file of varFiles) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/var\((--[\w-]+)/g)) {
    usedVars.set(match[1], (usedVars.get(match[1]) ?? 0) + 1);
  }
}

const missingVars = [...usedVars.keys()].filter((name) => !definedVars.has(name)).sort();

/* ---------- report ---------- */

if (missingClasses.length || verbose) {
  console.log(
    `Class coverage: ${usedClasses.size} used · ${definedClasses.size} defined · ${missingClasses.length} missing`
  );
  for (const name of missingClasses) {
    console.log(`  ✗ .${name}  ← ${[...usedClasses.get(name)].join(", ")}`);
  }
}

if (missingVars.length || verbose) {
  console.log(`Custom properties: ${usedVars.size} used · ${missingVars.length} undefined`);
  for (const name of missingVars) {
    console.log(`  ✗ var(${name})  used ${usedVars.get(name)}×`);
  }
}

if (missingClasses.length || missingVars.length) {
  console.error(
    `\nCSS audit failed: ${missingClasses.length} unstyled class(es), ${missingVars.length} undefined token(s).`
  );
  process.exit(1);
}

console.log("CSS audit passed — every className and custom property resolves.");
