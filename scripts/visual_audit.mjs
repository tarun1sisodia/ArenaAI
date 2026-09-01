#!/usr/bin/env node
/* Visual + layout audit for the SK Baghel static site.
 *
 * For every representative page × viewport width, this:
 *   1. FAILS on any horizontal overflow (scrollWidth > innerWidth) and lists
 *      the offending elements,
 *   2. FAILS on any page console error,
 *   3. saves a full-page screenshot to qa-shots/ for human review.
 *
 * Prereqs (once, on a machine with network):
 *   npm i -D playwright && npx playwright install chromium
 * Run (site must be served first):
 *   python3 scripts/serve.py &
 *   node scripts/visual_audit.mjs                 # base http://localhost:4173
 *   node scripts/visual_audit.mjs --base http://localhost:4173/ArenaAI
 */
import { chromium } from "playwright";

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith("--base="));
const BASE = (baseArg ? baseArg.split("=")[1] : "http://localhost:4173").replace(/\/$/, "");

const PAGES = [
  "/", "/hi/", "/book.html",
  "/en/services/", "/en/routes/", "/en/packages/", "/en/fleet/", "/en/about/", "/en/contact/", "/en/faq/",
  "/hi/services/", "/hi/routes/", "/hi/packages/", "/hi/fleet/", "/hi/about/", "/hi/contact/", "/hi/faq/",
  "/en/agra-to-delhi-taxi/", "/hi/agra-se-delhi-taxi/",
  "/en/vehicles/urbania/", "/hi/vehicles/tempo-traveller/",
  "/en/packages/golden-triangle/", "/hi/packages/mathura-vrindavan/",
];
const WIDTHS = [360, 390, 768, 1024, 1440];
const HEIGHT = 900;

const overflowProbe = `(() => {
  const vw = document.documentElement.clientWidth;
  const doc = document.documentElement;
  if (doc.scrollWidth <= vw + 1) return { overflow: false };
  const bad = [];
  document.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      const id = el.id ? "#" + el.id : "";
      const cls = typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\\s+/).slice(0, 3).join(".") : "";
      bad.push(el.tagName.toLowerCase() + id + cls + " right=" + Math.round(r.right) + " left=" + Math.round(r.left));
    }
  });
  return { overflow: true, scrollWidth: doc.scrollWidth, viewport: vw, offenders: bad.slice(0, 12) };
})()`;

const run = async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    for (const path of PAGES) {
      const url = BASE + path;
      try {
        const res = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
        const status = res ? res.status() : 0;
        if (status !== 200) { console.log(`FAIL ${width}px ${path} → HTTP ${status}`); failures++; continue; }
        const result = await page.evaluate(overflowProbe);
        if (result.overflow) {
          failures++;
          console.log(`FAIL ${width}px ${path} → horizontal overflow (scrollWidth ${result.scrollWidth} > ${result.viewport})`);
          result.offenders.forEach((o) => console.log(`      ${o}`));
        }
        if (consoleErrors.length) {
          failures++;
          console.log(`FAIL ${width}px ${path} → console errors:`);
          consoleErrors.forEach((e) => console.log(`      ${e}`));
          consoleErrors.length = 0;
        }
        const dir = `qa-shots/${width}/${path.replace(/^\//, "").replace(/\/$/, "") || "home"}`;
        await page.screenshot({ path: `${dir}.png`, fullPage: true });
      } catch (err) {
        failures++;
        console.log(`FAIL ${width}px ${path} → ${err.message.split("\n")[0]}`);
      }
    }
    await ctx.close();
    console.log(`${width}px · ${PAGES.length} pages swept`);
  }
  await browser.close();
  console.log(failures ? `\n${failures} FAILURE(S) — see qa-shots/ and list above` : "\nALL PASS — 0 overflow, 0 console errors");
  process.exit(failures ? 1 : 0);
};

run();
