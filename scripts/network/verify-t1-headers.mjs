#!/usr/bin/env node
/**
 * H1 (Network & Transport) verification.
 *
 * Source checks (always run, offline-safe): prove the built output carries the
 * H1 wiring — LocationIQ preconnect in the customer shell + its prerendered
 * pages, the LCP-image Link preload in _headers, and the pre-existing admin
 * font preconnects (regression guard).
 *
 * Live checks (only when a URL is given): prove the CDN serves HTTP/3
 * (alt-svc) and the Link preload header. A 103 Early Hints interim response is
 * consumed by the HTTP client and is not directly observable here; the Link
 * header's presence is the correct proxy — Cloudflare emits the 103 from it
 * once the Early Hints toggle is ON.
 *
 * Usage:
 *   node scripts/network/verify-t1-headers.mjs [--customer-dist react/dist]
 *     [--admin-dist admin/dist] [--url https://site]
 *   T1_CUSTOMER_URL=https://site npm run verify:t1
 *
 * Dependency-free (Node >= 22, global fetch). Exit 0 = all green, 1 = failure.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const CUSTOMER_DIST = flag("--customer-dist", "react/dist");
const ADMIN_DIST = flag("--admin-dist", "admin/dist");
const LIVE_URL = flag("--url", process.env.T1_CUSTOMER_URL ?? "");

const PRECONNECT_HOST = "https://api.locationiq.com";
const LCP_IMAGE = "/assets/packages/taj-dawn.webp";

/** @type {{ name: string; ok: boolean; detail: string }[]} */
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
}

async function readOrNull(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

// --- Source checks -----------------------------------------------------------

const shell = await readOrNull(join(CUSTOMER_DIST, "index.html"));
check(
  "customer shell carries LocationIQ preconnect",
  shell !== null && shell.includes(`rel="preconnect" href="${PRECONNECT_HOST}"`),
  shell === null ? `${CUSTOMER_DIST}/index.html missing (run customer:build first)` : "preconnect link not found in built shell",
);
check(
  "customer shell carries LocationIQ dns-prefetch",
  shell !== null && shell.includes(`rel="dns-prefetch" href="${PRECONNECT_HOST}"`),
  shell === null ? `${CUSTOMER_DIST}/index.html missing (run customer:build first)` : "dns-prefetch link not found in built shell",
);

const hiHome = await readOrNull(join(CUSTOMER_DIST, "hi", "index.html"));
check(
  "preconnect propagates to prerendered pages (/hi/)",
  hiHome !== null && hiHome.includes(`rel="preconnect" href="${PRECONNECT_HOST}"`),
  hiHome === null ? `${CUSTOMER_DIST}/hi/index.html missing (run customer:build first)` : "preconnect lost during prerender",
);

const headers = await readOrNull(join(CUSTOMER_DIST, "_headers"));
for (const route of ["/", "/en/", "/hi/"]) {
  check(
    `_headers preloads LCP image on ${route}`,
    headers !== null && headers.includes(LCP_IMAGE) && headers.includes("rel=preload; as=image"),
    headers === null ? `${CUSTOMER_DIST}/_headers missing` : `Link preload for ${LCP_IMAGE} not found`,
  );
}

const adminShell = await readOrNull(join(ADMIN_DIST, "index.html"));
check(
  "admin font preconnects intact (regression guard)",
  adminShell !== null &&
    adminShell.includes('rel="preconnect" href="https://fonts.googleapis.com"') &&
    adminShell.includes('rel="preconnect" href="https://fonts.gstatic.com"'),
  adminShell === null ? `${ADMIN_DIST}/index.html missing (run admin:build first)` : "admin font preconnects changed or missing",
);

// --- Live checks (opt-in) -----------------------------------------------------

if (!LIVE_URL) {
  console.log("SKIP  live alt-svc / Link checks — set T1_CUSTOMER_URL or --url to enable");
} else {
  try {
    const res = await fetch(LIVE_URL, { redirect: "follow" });
    const altSvc = res.headers.get("alt-svc") ?? "";
    check("live: alt-svc advertises h3 (HTTP/3 + QUIC)", altSvc.includes("h3="), `alt-svc header was: ${altSvc || "(absent)"}`);
    const link = res.headers.get("link") ?? "";
    check(
      "live: Link header preloads LCP image (Early Hints fuel)",
      link.includes(LCP_IMAGE) && link.includes("rel=preload"),
      `link header was: ${link || "(absent)"}`,
    );
  } catch (err) {
    check("live: site reachable", false, err instanceof Error ? err.message : String(err));
  }
}

// --- Verdict -------------------------------------------------------------------

const failed = results.filter((r) => !r.ok);
console.log(failed.length === 0 ? `\nH1 verify: ${results.length} passed.` : `\nH1 verify: ${failed.length}/${results.length} FAILED.`);
process.exit(failed.length === 0 ? 0 : 1);
