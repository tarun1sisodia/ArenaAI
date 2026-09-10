import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const dist = join(reactRoot, "dist");

// Ensure public assets exist in dist
const publicAssets = join(reactRoot, "public", "assets");
const distAssets = join(dist, "assets");
if (existsSync(publicAssets) && !existsSync(distAssets)) {
  await cp(publicAssets, distAssets, { recursive: true });
}

const hubRoutes = [
  "services",
  "routes",
  "packages",
  "fleet",
  "about",
  "contact",
  "faq",
  "privacy",
  "terms"
];

const vehicleRoutes = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania"
];

const packageRoutes = [
  "taj-mahal-sunrise-tour",
  "agra-sightseeing",
  "agra-unhurried",
  "mathura-vrindavan",
  "gatimaan-express-agra-tour",
  "golden-triangle"
];

const routePairs = [
  "agra-to-delhi-taxi",
  "delhi-to-agra-taxi",
  "agra-to-jaipur-taxi",
  "delhi-to-jaipur-taxi",
  "agra-to-gwalior-taxi",
  "agra-to-lucknow-taxi",
  "agra-to-mathura-taxi",
  "agra-sightseeing-taxi"
];

const hindiRoutePairs = [
  "agra-se-delhi-taxi",
  "delhi-se-agra-taxi",
  "agra-se-jaipur-taxi",
  "delhi-se-jaipur-taxi",
  "agra-se-gwalior-taxi",
  "agra-se-lucknow-taxi",
  "agra-se-mathura-taxi",
  "agra-darshan-taxi"
];

const routes = [
  "/",
  "/book.html",
  "/en/",
  "/hi/",
  // English & Hindi Hubs
  ...hubRoutes.flatMap((hub) => [`/en/${hub}/`, `/hi/${hub}/`]),
  // Vehicles
  ...vehicleRoutes.flatMap((v) => [`/en/vehicles/${v}/`, `/hi/vehicles/${v}/`]),
  // Packages
  ...packageRoutes.flatMap((p) => [`/en/packages/${p}/`, `/hi/packages/${p}/`]),
  // Routes
  ...routePairs.map((r) => `/en/${r}/`),
  ...routePairs.map((r) => `/hi/${r}/`),
  ...hindiRoutePairs.map((r) => `/hi/${r}/`)
];

const template = await readFile(join(dist, "index.html"), "utf8");
for (const route of routes) {
  if (route === "/") continue;
  const target = route.endsWith(".html")
    ? join(dist, route.slice(1))
    : join(dist, route.slice(1), "index.html");
  const depth = route.endsWith(".html")
    ? 0
    : route.split("/").filter(Boolean).length;
  const prefix = "../".repeat(Math.max(depth, 0));
  const html = template.replaceAll("./assets/", `${prefix}assets/`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}

console.log(`Generated ${routes.length} React route entry points in ${dist}.`);
