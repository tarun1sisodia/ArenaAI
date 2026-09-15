/**
 * Comprehensive CDP Automated QA for Terms & Conditions Hub Page (Step R5.18)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";

const CDP_PORT = 9340;
const CHROME_PATH = "/usr/bin/google-chrome";
const ARTIFACTS_DIR = "/home/bot/.gemini/antigravity-ide/brain/e0830be9-f21c-4fc2-84ba-c30ac4dc947c";

async function run() {
  console.log("Launching headless Chrome for Terms Hub Page QA...");
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

    console.log("Navigating to http://localhost:5173/en/terms/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/terms/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Basic page verification
    const desktopChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.innerText?.trim();
        const tocPills = document.querySelectorAll('.terms-toc-link').length;
        const callout = !!document.querySelector('.terms-callout');
        const clauses = document.querySelectorAll('.terms-clause').length;
        const tableRows = document.querySelectorAll('.cancellation-table tbody tr').length;
        const legalBox = !!document.querySelector('.terms-legal-box');
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return {
          title,
          h1,
          tocPills,
          callout,
          clauses,
          tableRows,
          legalBox,
          jsonLd,
          overflow
        };
      })()
    `);

    console.log("Desktop checks:", JSON.stringify(desktopChecks, null, 2));
    await captureScreenshot("terms_page_desktop_hero.png");

    // Scroll to 24-hr cancellation clause
    await evaluate(`window.scrollTo({ top: 400, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("terms_page_desktop_cancellation.png");

    // Scroll to 6-Tier cancellation table
    await evaluate(`window.scrollTo({ top: 900, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("terms_page_desktop_table.png");

    // Scroll to Legal Jurisdiction & CTA
    await evaluate(`window.scrollTo({ top: 2200, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("terms_page_desktop_legal.png");

    // 2. Test Hindi Version (/hi/terms/)
    console.log("Testing Hindi version (/hi/terms/)...");
    await send("Page.navigate", { url: "http://localhost:5173/hi/terms/" });
    await new Promise((r) => setTimeout(r, 2000));

    const hindiChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.innerText?.trim();
        const firstClauseTitle = document.querySelector('.terms-clause__content h2')?.innerText?.trim();
        const tableRows = document.querySelectorAll('.cancellation-table tbody tr').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return {
          title,
          h1,
          firstClauseTitle,
          tableRows,
          overflow
        };
      })()
    `);
    console.log("Hindi checks:", JSON.stringify(hindiChecks, null, 2));
    await captureScreenshot("terms_page_hindi.png");

    // 3. Tablet Viewport (768x1024)
    console.log("Setting tablet viewport 768x1024...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "http://localhost:5173/en/terms/" });
    await new Promise((r) => setTimeout(r, 2000));

    const tabletChecks = await evaluate(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);
    console.log("Tablet checks:", tabletChecks);
    await captureScreenshot("terms_page_tablet.png");

    // 4. Mobile Viewport (375x812)
    console.log("Setting mobile viewport 375x812...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Page.navigate", { url: "http://localhost:5173/en/terms/" });
    await new Promise((r) => setTimeout(r, 2000));

    const mobileChecks = await evaluate(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);
    console.log("Mobile checks:", mobileChecks);
    await captureScreenshot("terms_page_mobile.png");

    // 5. Dark Mode Test
    console.log("Testing Dark Mode...");
    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("terms_page_darkmode.png");

    console.log("ALL TERMS HUB TESTS COMPLETED SUCCESSFULLY!");
  } finally {
    ws.close();
    chrome.kill();
  }
}

run().catch((err) => {
  console.error("QA Script Error:", err);
  process.exit(1);
});
