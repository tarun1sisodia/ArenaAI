/**
 * XML Sitemap & Robots Generator (Step R5.27)
 *
 * Generates valid Schema-compliant XML sitemaps with:
 * 1. Fully-qualified canonical URLs for all indexable bilingual routes.
 * 2. Multi-language xhtml:link hreflang alternates (en-IN, hi-IN, x-default).
 * 3. Source-owned lastmod timestamps (YYYY-MM-DD) when available, crawl priorities and change frequencies.
 * 4. Robots.txt directing crawlers to the sitemap while guarding noindex routes.
 *
 * Outputs to dist/react/sitemap.xml, react/dist/sitemap.xml, react/public/sitemap.xml,
 * and workspace roots.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_LANDING_SLUGS } from "../src/data/seoLandingSlugs.ts";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");

export const CANONICAL_DOMAIN = "https://agraskbagheltourandtravels.com";

export interface SitemapEntry {
  path: string;
  priority: number;
  changefreq: "daily" | "weekly" | "monthly";
  /** Set only from a real content update timestamp, never from build time. */
  lastmod?: string;
  enPath?: string;
  hiPath?: string;
}

function getPublishedCatalogEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-catalog.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      type?: string;
      slug?: string;
      updatedAt?: string | null;
      publishedAt?: string | null;
    }>;
    return snapshot
      .filter((item) => (item.type === "package" || item.type === "tour") && /^[a-z0-9-]{2,80}$/.test(item.slug ?? ""))
      .map((item) => ({
        path: `/en/packages/${item.slug}/`,
        hiPath: `/hi/packages/${item.slug}/`,
        enPath: `/en/packages/${item.slug}/`,
        priority: 0.85,
        changefreq: "weekly" as const,
        lastmod: (item.updatedAt || item.publishedAt || undefined)?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

function getPublishedRouteEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-routes.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{ slug?: string; updatedAt?: string | null }>;
    return snapshot
      .filter((item) => /^[a-z0-9-]{2,80}$/.test(item.slug ?? ""))
      .map((item) => ({
        path: `/en/${item.slug}/`,
        hiPath: `/hi/${item.slug}/`,
        enPath: `/en/${item.slug}/`,
        priority: 0.85,
        changefreq: "weekly" as const,
        lastmod: item.updatedAt?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

// 9 Hubs
const hubSlugs = [
  "services",
  "routes",
  "packages",
  "fleet",
  "about",
  "contact",
  "faq",
  "privacy",
  "terms",
];

// 5 Fleet Vehicles
const vehicleSlugs = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
];

// 6 Tour Packages
const packageSlugs = [
  "taj-mahal-sunrise-tour",
  "agra-sightseeing",
  "agra-unhurried",
  "mathura-vrindavan",
  "gatimaan-express-agra-tour",
  "golden-triangle",
];

// 8 Route Pairs (English and Hindi transliterated pairs)
const routePairs: Array<{ en: string; hi: string }> = [
  { en: "agra-to-delhi-taxi", hi: "agra-se-delhi-taxi" },
  { en: "delhi-to-agra-taxi", hi: "delhi-se-agra-taxi" },
  { en: "agra-to-jaipur-taxi", hi: "agra-se-jaipur-taxi" },
  { en: "delhi-to-jaipur-taxi", hi: "delhi-se-jaipur-taxi" },
  { en: "agra-to-gwalior-taxi", hi: "agra-se-gwalior-taxi" },
  { en: "agra-to-lucknow-taxi", hi: "agra-se-lucknow-taxi" },
  { en: "agra-to-mathura-taxi", hi: "agra-se-mathura-taxi" },
  { en: "agra-sightseeing-taxi", hi: "agra-darshan-taxi" },
];

export function getSitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    // 1. Home Pages
    {
      path: "/",
      priority: 1.0,
      changefreq: "daily",
      enPath: "/",
      hiPath: "/hi/",
    },
    {
      path: "/en/",
      priority: 0.9,
      changefreq: "daily",
      enPath: "/",
      hiPath: "/hi/",
    },
  ];

  // 2. Hubs (English)
  for (const hub of hubSlugs) {
    entries.push({
      path: `/en/${hub}/`,
      priority: 0.9,
      changefreq: "weekly",
      enPath: `/en/${hub}/`,
      hiPath: `/hi/${hub}/`,
    });
  }

  // 3. Vehicles (English)
  for (const veh of vehicleSlugs) {
    entries.push({
      path: `/en/vehicles/${veh}/`,
      priority: 0.85,
      changefreq: "weekly",
      enPath: `/en/vehicles/${veh}/`,
      hiPath: `/hi/vehicles/${veh}/`,
    });
  }

  // 4. Packages (English)
  for (const pkg of packageSlugs) {
    entries.push({
      path: `/en/packages/${pkg}/`,
      priority: 0.85,
      changefreq: "weekly",
      enPath: `/en/packages/${pkg}/`,
      hiPath: `/hi/packages/${pkg}/`,
    });
  }

  // 5. Routes (English)
  const existingPaths = new Set(entries.map((e) => e.path));
  for (const pair of routePairs) {
    const p = `/en/${pair.en}/`;
    if (!existingPaths.has(p)) {
      existingPaths.add(p);
      entries.push({
        path: p,
        priority: 0.85,
        changefreq: "weekly",
        enPath: p,
        hiPath: `/hi/${pair.hi}/`,
      });
    }
  }

  for (const slug of SEO_LANDING_SLUGS) {
    const p = `/en/${slug}/`;
    if (!existingPaths.has(p)) {
      existingPaths.add(p);
      entries.push({ path: p, priority: 0.9, changefreq: "weekly", enPath: p, hiPath: `/hi/${slug}/` });
    }
  }

  // Only catalog items that are included in the SSG snapshot are eligible for
  // the sitemap. This keeps unpublished/draft items out and prevents the old
  // locality inventory from becoming a thin-content indexation expansion.
  for (const entry of getPublishedCatalogEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }
  for (const entry of getPublishedRouteEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }

  return entries;
}

export function generateSitemapXml(entries: SitemapEntry[]): string {
  const xmlUrls = entries.map((entry) => {
    const loc = `${CANONICAL_DOMAIN}${entry.path}`;
    const enUrl = entry.enPath ? `${CANONICAL_DOMAIN}${entry.enPath}` : loc;
    const lastmod = entry.lastmod;

    return `  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(2)}</priority>
    <xhtml:link rel="alternate" hreflang="en-IN" href="${enUrl}" />
    ${entry.hiPath ? `<xhtml:link rel="alternate" hreflang="hi-IN" href="${CANONICAL_DOMAIN}${entry.hiPath}" />` : ""}
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlUrls}
</urlset>
`;
}

export function generateRobotsTxt(): string {
  return `# Robots.txt — Agra SK Baghel Tour and Travels Agra
User-agent: *
Allow: /
Disallow: /book.html
Disallow: /404.html
Disallow: /design-guide/

# Sitemaps
Sitemap: ${CANONICAL_DOMAIN}/sitemap.xml
`;
}

export async function generateSitemapAndRobots(): Promise<{
  entriesCount: number;
  sitemapPath: string;
  robotsPath: string;
}> {
  const entries = getSitemapEntries();
  const sitemapXml = generateSitemapXml(entries);
  const robotsTxt = generateRobotsTxt();

  // Target destinations — the build only ever writes inside this application.
  // `dist` is the deployable Cloudflare Pages output; `public` keeps the
  // tracked source copy in sync for Vite's publicDir copy step. Writing to the
  // repository root or to a root `dist/` was legacy static-site behaviour and
  // made every build dirty tracked files outside the app.
  const destinations = [
    join(reactRoot, "dist"),
    join(reactRoot, "public"),
  ];

  for (const destDir of destinations) {
    try {
      await mkdir(destDir, { recursive: true });
      await writeFile(join(destDir, "sitemap.xml"), sitemapXml, "utf8");
      await writeFile(join(destDir, "robots.txt"), robotsTxt, "utf8");
    } catch (e) {
      console.warn(`Warning writing sitemap to ${destDir}:`, e);
    }
  }

  console.log(
    `✅ Generated sitemap.xml (${entries.length} URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) ` +
    `and robots.txt pointing to ${CANONICAL_DOMAIN}/sitemap.xml`
  );

  return {
    entriesCount: entries.length,
    sitemapPath: join(reactRoot, "dist", "sitemap.xml"),
    robotsPath: join(reactRoot, "dist", "robots.txt"),
  };
}

// Execute directly if run via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generateSitemapAndRobots().catch((err) => {
    console.error("❌ Sitemap generation failed:", err);
    process.exit(1);
  });
}
