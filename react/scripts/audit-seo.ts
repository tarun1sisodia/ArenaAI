import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectSeoHtml } from "./seo-content-guardrails.ts";

const reactRoot = join(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(reactRoot, "dist");
const output = process.argv[2] || join(reactRoot, "..", "seo-audits", `seo-audit-${new Date().toISOString().slice(0, 10)}.csv`);
const canonicalDomain = "https://agraskbagheltourandtravels.com";

async function collectHtml(dir: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await collectHtml(path));
    else if (entry.name.endsWith(".html")) result.push(path);
  }
  return result;
}

function routeFromFile(file: string): string {
  const rel = relative(dist, file).replaceAll("\\", "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}/`;
  return `/${rel}`;
}

function csv(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function main(): Promise<void> {
  if (!existsSync(dist)) throw new Error(`Missing ${dist}; run npm run customer:build first.`);
  const files = await collectHtml(dist);
  const rows = files.map((file) => {
    const path = routeFromFile(file);
    const html = requireText(file);
    const quality = inspectSeoHtml(path, html, canonicalDomain);
    const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "missing";
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)?.[1] ?? "missing";
    const errors = quality.findings.filter((finding) => finding.severity === "error").map((finding) => `${finding.code}: ${finding.message}`).join(" | ");
    const warnings = quality.findings.filter((finding) => finding.severity === "warning").map((finding) => `${finding.code}: ${finding.message}`).join(" | ");
    return [path, robots, canonical, quality.titleLength, quality.descriptionLength, quality.h1Count, quality.wordCount, quality.internalLinkCount, errors, warnings];
  });
  const header = ["path", "robots", "canonical", "title_chars", "description_chars", "h1_count", "word_count", "internal_links", "errors", "warnings"];
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${[header, ...rows].map((row) => row.map(csv).join(",")).join("\n")}\n`, "utf8");
  console.log(`SEO audit written to ${output} (${rows.length} HTML files).`);
}

function requireText(file: string): string {
  // Kept synchronous so an individual broken HTML file fails the audit deterministically.
  return readFileSync(file, "utf8");
}

void main().catch((error) => {
  console.error(`SEO audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
