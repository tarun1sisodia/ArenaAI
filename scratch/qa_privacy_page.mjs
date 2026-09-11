/**
 * Comprehensive CDP Automated QA for Privacy Policy Hub Page (Step R5.19)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";

const CDP_PORT = 9342;
const CHROME_PATH = "/usr/bin/google-chrome";
const ARTIFACTS_DIR = "/home/bot/.gemini/antigravity-ide/brain/e0830be9-f21c-4fc2-84ba-c30ac4dc947c";

async function run() {
  console.log("Launching headless Chrome for Privacy Hub Page QA...");
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${CDP_PORT}`,
    "about:blank",
  ]);

  // Wait for DevTools listening log
  await new Promise((resolve) => {
    chrome.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("DevTools listening on")) {
        resolve();
      }
    });
    setTimeout(() => resolve(), 3000);
  });

  const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("DOM.enable");
  await send("Runtime.enable");

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async function captureScreenshot(filename) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.data, "base64");
    writeFileSync(`${ARTIFACTS_DIR}/${filename}`, buffer);
    console.log(`Captured ${filename}`);
  }

  try {
    // 1. Desktop Test (1280x900)
    console.log("Setting desktop viewport 1280x900...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to http://localhost:5173/en/privacy/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/privacy/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Basic page verification
    const desktopChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const pillars = document.querySelectorAll(".privacy-pillar-card").length;
        const pills = document.querySelectorAll(".terms-toc-link").length;
        const clauses = document.querySelectorAll(".terms-clause").length;
        const dpoCard = document.querySelector(".terms-legal-box") !== null;
        const schema = document.querySelector("script[type='application/ld+json']");
        let parsedSchema = null;
        if (schema) {
          try {
            parsedSchema = JSON.parse(schema.textContent);
          } catch(e) {}
        }
        const hasGraph = parsedSchema && Array.isArray(parsedSchema["@graph"]);
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const hasOverflow = scrollW > clientW;

        return {
          title,
          h1,
          pillars,
          pills,
          clauses,
          dpoCard,
          hasGraph,
          scrollW,
          clientW,
          hasOverflow
        };
      })()
    `);

    console.log("Desktop checks:", JSON.stringify(desktopChecks, null, 2));
    await captureScreenshot("privacy_page_desktop_hero.png");

    // Scroll to pillars & clauses
    await evaluate(`window.scrollTo({ top: 750, behavior: 'instant' });`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("privacy_page_desktop_clauses.png");

    // Scroll to DPO & Support desk
    await evaluate(`window.scrollTo({ top: 1800, behavior: 'instant' });`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("privacy_page_desktop_dpo.png");

    // 2. Hindi Locale Test
    console.log("Navigating to http://localhost:5173/hi/privacy/...");
    await send("Page.navigate", { url: "http://localhost:5173/hi/privacy/" });
    await new Promise((r) => setTimeout(r, 2000));

    const hindiChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const firstPill = document.querySelector(".terms-toc-link")?.textContent?.trim();
        return { title, h1, firstPill };
      })()
    `);
    console.log("Hindi checks:", JSON.stringify(hindiChecks, null, 2));
    await captureScreenshot("privacy_page_hindi.png");

    // 3. Tablet Viewport (768x1024)
    console.log("Setting tablet viewport 768x1024...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
    await new Promise((r) => setTimeout(r, 800));

    const tabletChecks = await evaluate(`
      (() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return {
          scrollW,
          innerW,
          hasOverflow: scrollW > innerW
        };
      })()
    `);
    console.log("Tablet checks:", JSON.stringify(tabletChecks, null, 2));
    await captureScreenshot("privacy_page_tablet.png");

    // 4. Mobile Viewport (375x812)
    console.log("Setting mobile viewport 375x812...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
    await new Promise((r) => setTimeout(r, 800));

    const mobileChecks = await evaluate(`
      (() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return {
          scrollW,
          innerW,
          hasOverflow: scrollW > innerW
        };
      })()
    `);
    console.log("Mobile checks:", JSON.stringify(mobileChecks, null, 2));
    await captureScreenshot("privacy_page_mobile.png");

    // 5. Dark Mode Verification
    console.log("Testing dark mode...");
    await evaluate(`document.documentElement.classList.add('dark');`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("privacy_page_darkmode.png");

    console.log("All automated QA checks completed successfully!");
  } catch (err) {
    console.error("QA script failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      ws.close();
    } catch (e) {}
    chrome.kill("SIGTERM");
  }
}

run();
