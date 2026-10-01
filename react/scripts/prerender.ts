/**
 * Static HTML Pre-Renderer / SSG Build Script (Step R5.26)
 *
 * Pre-renders all bilingual URLs into fully-formed static HTML files.
 * Ensures primary copy, navigation, schema, and fares are 100% crawlable
 * by search engines and viewable without client-side JavaScript.
 */

import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { generateSitemapAndRobots } from "./generate-sitemap.ts";
import { assertBuildSafeSeo, inspectSeoHtml } from "./seo-content-guardrails.ts";
import { SEO_LANDING_SLUGS } from "../src/data/seoLandingSlugs.ts";
import { FLEETS } from "../src/data/fleets.ts";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const dist = join(reactRoot, "dist");

// HTML attribute escaping helper
function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Ensure public assets exist in dist
async function ensureAssets(): Promise<void> {
  const publicAssets = join(reactRoot, "public", "assets");
  const distAssets = join(dist, "assets");
  if (existsSync(publicAssets) && !existsSync(distAssets)) {
    await cp(publicAssets, distAssets, { recursive: true });
  }
}

// Manifest of all core marketing, detail, and utility routes
const hubRoutes = [
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

const vehicleRoutes = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
];

const packageRoutes = [
  "taj-mahal-sunrise-tour",
  "agra-sightseeing",
  "agra-unhurried",
  "mathura-vrindavan",
  "gatimaan-express-agra-tour",
  "golden-triangle",
];

function getPublishedPackageRoutes(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-catalog.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{ type?: string; slug?: string }>;
    return snapshot
      .filter((item) => (item.type === "package" || item.type === "tour") && /^[a-z0-9-]{2,80}$/.test(item.slug ?? ""))
      .map((item) => `/en/packages/${item.slug}/`);
  } catch {
    return [];
  }
}

function getPublishedRoutePages(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-routes.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{ slug?: string }>;
    return snapshot
      .filter((item) => /^[a-z0-9-]{2,80}$/.test(item.slug ?? ""))
      .map((item) => `/en/${item.slug}/`);
  } catch {
    return [];
  }
}

const routePairs = [
  "agra-to-delhi-taxi",
  "delhi-to-agra-taxi",
  "agra-to-jaipur-taxi",
  "delhi-to-jaipur-taxi",
  "agra-to-gwalior-taxi",
  "agra-to-lucknow-taxi",
  "agra-to-mathura-taxi",
  "agra-sightseeing-taxi",
];

const hindiRoutePairs = [
  "agra-se-delhi-taxi",
  "delhi-se-agra-taxi",
  "agra-se-jaipur-taxi",
  "delhi-se-jaipur-taxi",
  "agra-se-gwalior-taxi",
  "agra-se-lucknow-taxi",
  "agra-se-mathura-taxi",
  "agra-darshan-taxi",
];

// Full manifest of static paths to render (English only)
const routesToRender: string[] = [
  // Root & Home
  "/",
  "/en/",

  // Booking Funnel & 404 Recovery
  "/book.html",
  "/book/",
  "/en/book/",
  "/404.html",
  "/en/404/",

  // English Hubs (9)
  ...hubRoutes.map((hub) => `/en/${hub}/`),

  // Fleet / Vehicles (5)
  ...vehicleRoutes.map((v) => `/en/vehicles/${v}/`),

  // Tour Packages (6)
  ...packageRoutes.map((p) => `/en/packages/${p}/`),
  ...getPublishedPackageRoutes(),
  ...getPublishedRoutePages(),

  // English Routes (8)
  ...routePairs.map((r) => `/en/${r}/`),
  ...SEO_LANDING_SLUGS.map((slug) => `/en/${slug}/`),
];

// Legacy HTML redirect stubs for backward compatibility
const legacyRedirects = [
  { from: "services.html", to: "/en/services/" },
  { from: "routes.html", to: "/en/routes/" },
  { from: "packages.html", to: "/en/packages/" },
  { from: "fleet.html", to: "/en/fleet/" },
  { from: "about.html", to: "/en/about/" },
  { from: "contact.html", to: "/en/contact/" },
  { from: "faq.html", to: "/en/faq/" },
  { from: "privacy.html", to: "/en/privacy/" },
  { from: "terms.html", to: "/en/terms/" },
  { from: "en/index.html", to: "/" },
  { from: "en/agra-delhi/", to: "/en/agra-to-delhi-taxi/" },
  { from: "en/vehicles/innova/", to: "/en/vehicles/innova-crysta/" },
  { from: "en/vehicles/tempo/", to: "/en/vehicles/tempo-traveller/" },
  { from: "en/15-btn-pac-agra-to-chandigarh-taxi-services/", to: "/en/agra-to-chandigarh-taxi/" },
];

function generateRedirectHtml(targetUrl: string, canonicalDomain: string): string {
  const fullCanonical = `${canonicalDomain}${targetUrl}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta http-equiv="refresh" content="0; url=${targetUrl}" />
    <link rel="canonical" href="${fullCanonical}" />
    <title>Redirecting…</title>
    <script>location.replace(${JSON.stringify(targetUrl)});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${targetUrl}">${targetUrl}</a>…</p>
  </body>
</html>
`;
}

export async function prerender(): Promise<void> {
  const startTime = Date.now();
  console.log("🚀 Starting Static HTML Pre-Renderer (SSG)...");

  await ensureAssets();

  const indexPath = join(dist, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(`dist/index.html not found at ${indexPath}. Run vite build first.`);
  }
  const baseTemplate = await readFile(indexPath, "utf8");

  // Spin up Vite in middleware mode to load TypeScript/TSX modules with alias resolution
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: reactRoot,
  });

  try {
    // Load dynamic React App & SEO helpers
    const { default: App, getMarketingPath, getSeo } = await vite.ssrLoadModule("/src/app/ServerApp.tsx");
    const {
      CANONICAL_DOMAIN,
      normalizePath,
      resolveAbsoluteUrl,
      resolveHreflangAlternates,
    } = await vite.ssrLoadModule("/src/components/seo/SeoHead.tsx");

    let renderedCount = 0;
    let totalBytes = 0;

    // Unsplash hotlink guard (2026-10-01, PageSpeed): no full-size Unsplash
    // hotlinks (w>1200) may be added to source — self-host via public/images
    // (see hero-taj-sunrise.avif). Lazy w<=1200 gallery images are grandfathered.
    {
      const srcDir = join(reactRoot, "src");
      const offenders: string[] = [];
      const walk = async (dir: string): Promise<void> => {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const p = join(dir, entry.name);
          if (entry.isDirectory()) { await walk(p); continue; }
          if (!/\.(tsx?|css)$/.test(entry.name)) continue;
          const text = await readFile(p, "utf8");
          const re = /images\.unsplash\.com\/[^"'`\s]*[?&]w=(\d+)/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(text))) {
            if (parseInt(m[1], 10) > 1200) offenders.push(`${p}: w=${m[1]}`);
          }
        }
      };
      await walk(srcDir);
      assert.ok(
        offenders.length === 0,
        `Unsplash guard: full-size hotlinks (w>1200) must be self-hosted:\n${offenders.join("\n")}`
      );
    }

    for (const route of routesToRender) {
      const isBooking = route.endsWith("book.html") || route.includes("/book");
      const is404 = route.includes("404");
      const { language, section } = getMarketingPath(route);
      const effectiveSection = is404 ? "404" : (route === "/" || route === "/en/" || route === "/hi/") ? "home" : section;
      const seo = getSeo(route, effectiveSection, language, isBooking);

      // Render React component tree to string
      const appHtml = renderToString(createElement(App, { pathname: route }));

      // Calculate path depth and relative prefix for asset resolution
      const depth = route.endsWith(".html") ? 0 : route.split("/").filter(Boolean).length;
      const prefix = "../".repeat(Math.max(depth, 0));

      // Resolve SEO tags
      const canonicalPath = normalizePath(route);
      const canonicalUrl = `${CANONICAL_DOMAIN}${canonicalPath}`;
      const alternates = resolveHreflangAlternates(route, isBooking || is404);
      const robotsContent = isBooking || is404
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

      const ogImageUrl = resolveAbsoluteUrl(seo.ogImage);
      const ogLocale = language === "hi" ? "hi_IN" : "en_IN";
      const ogLocaleAlt = language === "hi" ? "en_IN" : "hi_IN";

      // Build consolidated <head> metadata block
      const headTags = [
        `<title>${escapeHtml(seo.title)}</title>`,
        `<meta name="description" content="${escapeHtml(seo.description)}" />`,
        seo.keywords?.length ? `<meta name="keywords" content="${escapeHtml(seo.keywords.join(", "))}" />` : "",
        `<meta name="robots" content="${robotsContent}" />`,
        `<link rel="canonical" href="${canonicalUrl}" />`,
        ...alternates.map((alt: { hreflang: string; href: string }) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`),
        `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
        `<meta property="og:url" content="${canonicalUrl}" />`,
        `<meta property="og:image" content="${ogImageUrl}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:image:alt" content="${escapeHtml(seo.title)}" />`,
        `<meta property="og:locale" content="${ogLocale}" />`,
        `<meta property="og:locale:alternate" content="${ogLocaleAlt}" />`,
        `<meta property="og:site_name" content="SK Baghel Tour & Travels" />`,
        `<meta property="og:type" content="website" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
        `<meta name="twitter:image" content="${ogImageUrl}" />`,
        `<meta name="twitter:image:alt" content="${escapeHtml(seo.title)}" />`,
        `<meta name="twitter:site" content="@skbagheltravels" />`,
        `<meta name="twitter:creator" content="@skbagheltravels" />`,
        `<meta name="geo.region" content="IN-UP" />`,
        `<meta name="geo.placename" content="Agra" />`,
        `<meta name="geo.position" content="27.1632;78.0322" />`,
        `<meta name="ICBM" content="27.1632, 78.0322" />`,
      ].filter(Boolean).join("\n    ");

      // Inject into base template
      let html = baseTemplate;

      // 1. Set html lang attribute
      html = html.replace(/<html lang="[^"]*"/, `<html lang="${language === "hi" ? "hi-IN" : "en-IN"}" dir="ltr"`);

      // 2. Replace title and generic meta description with full metadata block
      html = html.replace(/<title>.*?<\/title>/, headTags);
      html = html.replace(/<meta name="description" content="[^"]*" \/>\s*/, "");

      // 3. Inject pre-rendered React markup into #root
      // Fail loudly if the template was already prerendered (stale dist/index.html)
      // — a silent no-op here produces pages missing all React markup.
      assert.ok(
        html.includes('<div id="root"></div>'),
        `Prerender: dist/index.html is missing the empty <div id="root"></div> mount point. ` +
        `Run vite build before prerender.ts (do not run prerender twice on the same dist).`
      );
      html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

      // 4. Update only the accessibility fallback; preserve GTM's noscript iframe
      html = html.replace(
        /<noscript id="js-fallback">[\s\S]*?<\/noscript>/,
        `<noscript id="js-fallback"><p class="skip-link" style="position:static;padding:12px;background:#fff3cd;color:#856404;margin:0;text-align:center;font-size:14px;">JavaScript is recommended for dynamic calculations and interactive booking. Call us 24×7 at <a href="tel:+916395867598" style="color:#b8941f;font-weight:700;">+91 63958 67598</a>.</p></noscript>`
      );

      // 5. Ensure relative assets work correctly across directory depths if requested
      if (prefix) {
        html = html.replaceAll("./assets/", `${prefix}assets/`);
      }

      if (!isBooking && !is404) {
        const quality = inspectSeoHtml(route, html, CANONICAL_DOMAIN);
        for (const finding of quality.findings) {
          console.warn(`⚠️ SEO ${finding.severity} [${finding.code}] ${finding.path}: ${finding.message}`);
        }
        if (process.env.SEO_STRICT === "1") assertBuildSafeSeo(quality);
      }

      // Fleet registry guard (2026-10-01): the route widget must render exactly
      // the 5 canonical fleets — a drifted 6th "Hatchback" card must fail the build.
      if (route === "/en/routes/") {
        for (const fleet of FLEETS) {
          assert.ok(
            html.includes(`>${fleet.label}<`),
            `Fleet registry guard: prerendered ${route} is missing the "${fleet.label}" card.`
          );
        }
        assert.ok(
          !html.includes(">Hatchback<"),
          `Fleet registry guard: prerendered ${route} contains a bogus "Hatchback" card.`
        );
      }

      // CTA contrast guard (2026-10-01): these exact class pairs were measured
      // below WCAG AA 4.5:1 in production (#C85A32 on white = 4.23:1).
      // Use bg-terracotta-deep / text-gold-bronze instead — see theme.css.
      for (const badPair of ["bg-terracotta-sandstone text-white", "bg-terracotta-sandstone text-on-primary"]) {
        assert.ok(
          !html.includes(badPair),
          `Contrast guard: prerendered ${route} contains failing pair "${badPair}".`
        );
      }

      // Landmark guard (2026-10-02): every prerendered page must expose exactly
      // one <main id="main-content"> — the skip link targets it and Lighthouse's
      // landmark audit fails without it. SiteLayout owns the single <main>;
      // pages must not render their own.
      const mainCount = (html.match(/<main[\s>]/g) ?? []).length;
      assert.ok(
        mainCount === 1 && html.includes('<main id="main-content"'),
        `Landmark guard: prerendered ${route} has ${mainCount} <main> elements (expected exactly one with id="main-content").`
      );

      // Determine output file path
      const targetFile = route === "/"
        ? join(dist, "index.html")
        : route.endsWith(".html")
        ? join(dist, route.slice(1))
        : join(dist, route.slice(1), "index.html");

      await mkdir(dirname(targetFile), { recursive: true });
      await writeFile(targetFile, html, "utf8");

      renderedCount++;
      totalBytes += Buffer.byteLength(html, "utf8");
    }

    // Generate legacy redirect stubs
    let redirectCount = 0;
    for (const item of legacyRedirects) {
      const redirectHtml = generateRedirectHtml(item.to, CANONICAL_DOMAIN);
      const targetFile = join(dist, item.from.endsWith("/") ? item.from.slice(0, -1) : item.from);
      const redirectOutput = targetFile.endsWith(".html") ? targetFile : join(targetFile, "index.html");
      await mkdir(dirname(redirectOutput), { recursive: true });
      await writeFile(redirectOutput, redirectHtml, "utf8");
      redirectCount++;
    }

    // Generate XML sitemap & robots.txt
    await generateSitemapAndRobots();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✅ SSG Pre-Rendering Complete: ${renderedCount} pages rendered + ${redirectCount} redirects written ` +
      `(${(totalBytes / 1024 / 1024).toFixed(2)} MB total) in ${elapsed}s.`
    );
  } finally {
    await vite.close();
  }
}

// Execute directly if run via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  prerender().catch((err) => {
    console.error("❌ SSG Pre-Renderer failed:", err);
    process.exit(1);
  });
}
