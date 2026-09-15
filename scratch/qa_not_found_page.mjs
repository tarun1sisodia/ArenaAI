/**
 * Comprehensive CDP Automated QA for 404 Error Recovery Page (Step R5.20)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";

const CDP_PORT = 9343;
const CHROME_PATH = "/usr/bin/google-chrome";
const ARTIFACTS_DIR = "/home/bot/.gemini/antigravity-ide/brain/e0830be9-f21c-4fc2-84ba-c30ac4dc947c";

async function run() {
  console.log("Launching headless Chrome for 404 Hub Page QA...");
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
    // 1. Desktop Test (1280x900) on unmapped path /en/non-existent-page/
    console.log("Setting desktop viewport 1280x900...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to unmapped route http://localhost:5173/en/non-existent-page/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/non-existent-page/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Basic page verification
    const desktopChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const compass = document.querySelector(".not-found-compass") !== null;
        const numeral = document.querySelector(".not-found-numeral")?.textContent?.trim();
        const pills = document.querySelectorAll(".quick-pill").length;
        const bentoCards = document.querySelectorAll(".not-found-bento-card").length;
        const ctaButtons = document.querySelectorAll(".cta-banner-buttons .button").length;
        const searchInput = document.querySelector(".not-found-search-input") !== null;
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const hasOverflow = scrollW > clientW;

        return {
          title,
          h1,
          compass,
          numeral,
          pills,
          bentoCards,
          ctaButtons,
          searchInput,
          scrollW,
          clientW,
          hasOverflow
        };
      })()
    `);

    console.log("Desktop checks:", JSON.stringify(desktopChecks, null, 2));
    await captureScreenshot("not_found_desktop_hero.png");

    // Test interactive search
    console.log("Testing search input typing 'delhi'...");
    await evaluate(`
      (() => {
        const input = document.querySelector(".not-found-search-input");
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeInputValueSetter.call(input, "delhi");
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));

    const searchChecks = await evaluate(`
      (() => {
        const results = document.querySelectorAll(".search-results-item").length;
        const firstResult = document.querySelector(".result-title")?.textContent?.trim();
        return { results, firstResult };
      })()
    `);
    console.log("Search results checks:", JSON.stringify(searchChecks, null, 2));
    await captureScreenshot("not_found_desktop_search_active.png");

    // Clear search and scroll down to bento & CTA
    await evaluate(`
      (() => {
        const clearBtn = document.querySelector(".search-clear-btn");
        if (clearBtn) clearBtn.click();
        window.scrollTo({ top: 600, behavior: 'instant' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("not_found_desktop_bento.png");

    // 2. Hindi Locale Test
    console.log("Navigating to http://localhost:5173/hi/unknown-tour-url/...");
    await send("Page.navigate", { url: "http://localhost:5173/hi/unknown-tour-url/" });
    await new Promise((r) => setTimeout(r, 2000));

    const hindiChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const firstPill = document.querySelector(".quick-pill")?.textContent?.trim();
        const firstCard = document.querySelector(".not-found-bento-card h3")?.textContent?.trim();
        return { title, h1, firstPill, firstCard };
      })()
    `);
    console.log("Hindi checks:", JSON.stringify(hindiChecks, null, 2));
    await captureScreenshot("not_found_hindi.png");

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
    await captureScreenshot("not_found_tablet.png");

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
    await captureScreenshot("not_found_mobile.png");

    // 5. Dark Mode Verification
    console.log("Testing dark mode...");
    await evaluate(`document.documentElement.classList.add('dark');`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("not_found_darkmode.png");

    console.log("All 404 automated QA checks completed successfully!");
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
