import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "dist");
async function collectRoutes(directory, prefix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const child = join(directory, entry.name);
    const route = `${prefix}/${entry.name}/`;
    const childEntries = await readdir(child);
    if (childEntries.includes("index.html")) found.push(route);
    found.push(...await collectRoutes(child, route.slice(0, -1)));
  }
  return found;
}

const repo = join(root, "..", "..");
await cp(join(repo, "assets"), join(dist, "assets"), { recursive: true });
const routes = ["/", "/book.html", "/en/", "/hi/", ...await collectRoutes(join(repo, "en"), "/en"), ...await collectRoutes(join(repo, "hi"), "/hi")];

const template = await readFile(join(dist, "index.html"), "utf8");
for (const route of routes) {
  if (route === "/") continue;
  const target = route.endsWith(".html") ? join(dist, route.slice(1)) : join(dist, route.slice(1), "index.html");
  const depth = route.endsWith(".html") ? 0 : route.split("/").filter(Boolean).length;
  const prefix = "../".repeat(Math.max(depth, 0));
  const html = template.replaceAll("./assets/", `${prefix}assets/`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}
console.log(`Generated ${routes.length} React route entry points.`);
