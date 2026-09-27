import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSitemapXml } from "./generate-sitemap.ts";

const jsonLdSource = readFileSync(
  join(fileURLToPath(new URL("..", import.meta.url)), "src/components/seo/JsonLd.tsx"),
  "utf8",
);
assert.match(jsonLdSource, /availability\?: "InStock" \| "LimitedAvailability" \| "OutOfStock"/);
assert.match(jsonLdSource, /options\.offers\.availability \|\| "InStock"/);
assert.doesNotMatch(
  jsonLdSource,
  /availability:\s*"https:\/\/schema\.org\/InStock"/,
  "Structured data must not hard-code InStock for every item.",
);

const sitemap = generateSitemapXml([
  { path: "/en/packages/current/", priority: 0.85, changefreq: "weekly", lastmod: "2026-09-27" },
  { path: "/en/packages/unchanged/", priority: 0.85, changefreq: "weekly" },
]);
assert.match(sitemap, /<lastmod>2026-09-27<\/lastmod>/);
assert.equal((sitemap.match(/<lastmod>/g) ?? []).length, 1, "Sitemap must omit unknown lastmod values.");

console.log("SEO lifecycle checks passed.");
