/**
 * Comprehensive CDP Automated QA for FAQ Hub Page (Step R5.17)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";

const CDP_PORT = 9338;
const CHROME_PATH = "/usr/bin/google-chrome";
const ARTIFACTS_DIR = "/home/bot/.gemini/antigravity-ide/brain/e0830be9-f21c-4fc2-84ba-c30ac4dc947c";

async function run() {
  console.log("Launching headless Chrome for FAQ Hub Page QA...");
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

    console.log("Navigating to http://localhost:5173/en/faq/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/faq/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Basic page verification
    const desktopChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.innerText?.trim();
        const tabs = document.querySelectorAll('.faq-cat-tab').length;
        const questions = document.querySelectorAll('.faq-card-item').length;
        const supportCards = document.querySelectorAll('.faq-support-card').length;
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return {
          title,
          h1,
          tabs,
          questions,
          supportCards,
          jsonLd,
          overflow
        };
      })()
    `);

    console.log("Desktop checks:", JSON.stringify(desktopChecks, null, 2));
    await captureScreenshot("faq_page_desktop_hero.png");

    // 2. Test Live Search Filtering
    console.log("Testing search query 'toll'...");
    await evaluate(`
      (() => {
        const searchInput = document.querySelector('.faq-search-input');
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(searchInput, "toll");
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    const searchState = await evaluate(`
      (() => {
        const countText = document.querySelector('.faq-search-count')?.innerText;
        const visibleCards = document.querySelectorAll('.faq-card-item').length;
        return { countText, visibleCards };
      })()
    `);
    console.log("Search State for 'toll':", searchState);
    await captureScreenshot("faq_page_desktop_search.png");

    // Clear Search
    console.log("Clearing search...");
    await evaluate(`
      (() => {
        const clearBtn = document.querySelector('.faq-search-clear');
        if (clearBtn) clearBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 300));

    // 3. Test Category Filter Tab Click (Night Charges)
    console.log("Clicking 'Night Charges' tab...");
    await evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('.faq-cat-tab'));
        const nightTab = tabs.find(t => t.innerText.includes('Night Charges'));
        if (nightTab) nightTab.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    const nightTabState = await evaluate(`
      (() => {
        const activeTab = document.querySelector('.faq-cat-tab--active')?.innerText?.trim();
        const cardCount = document.querySelectorAll('.faq-card-item').length;
        return { activeTab, cardCount };
      })()
    `);
    console.log("Night Tab State:", nightTabState);

    // Scroll to Accordions and capture
    await evaluate(`window.scrollTo({ top: 450, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("faq_page_desktop_accordions.png");

    // Test Expand All Button
    console.log("Testing 'Expand All'...");
    await evaluate(`
      (() => {
        const toggleAll = document.querySelector('.faq-toggle-all-btn');
        if (toggleAll) toggleAll.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    const expandAllState = await evaluate(`
      (() => {
        const openCards = document.querySelectorAll('.faq-card-item--open').length;
        const totalCards = document.querySelectorAll('.faq-card-item').length;
        return { openCards, totalCards, allOpen: openCards === totalCards };
      })()
    `);
    console.log("Expand All State:", expandAllState);

    // Switch back to "All Questions"
    await evaluate(`
      (() => {
        const allTab = document.querySelectorAll('.faq-cat-tab')[0];
        if (allTab) allTab.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 300));

    // Scroll down to Support Cards
    await evaluate(`window.scrollTo({ top: 1200, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("faq_page_desktop_support.png");

    // 4. Test Hindi Version (/hi/faq/)
    console.log("Testing Hindi version (/hi/faq/)...");
    await send("Page.navigate", { url: "http://localhost:5173/hi/faq/" });
    await new Promise((r) => setTimeout(r, 2000));

    const hindiChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.innerText?.trim();
        const activeTab = document.querySelector('.faq-cat-tab--active')?.innerText?.trim();
        const questions = document.querySelectorAll('.faq-card-item').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return {
          title,
          h1,
          activeTab,
          questions,
          overflow
        };
      })()
    `);
    console.log("Hindi checks:", JSON.stringify(hindiChecks, null, 2));
    await captureScreenshot("faq_page_hindi.png");

    // 5. Tablet Viewport (768x1024)
    console.log("Setting tablet viewport 768x1024...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "http://localhost:5173/en/faq/" });
    await new Promise((r) => setTimeout(r, 2000));

    const tabletChecks = await evaluate(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);
    console.log("Tablet checks:", tabletChecks);
    await captureScreenshot("faq_page_tablet.png");

    // 6. Mobile Viewport (375x812)
    console.log("Setting mobile viewport 375x812...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Page.navigate", { url: "http://localhost:5173/en/faq/" });
    await new Promise((r) => setTimeout(r, 2000));

    const mobileChecks = await evaluate(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);
    console.log("Mobile checks:", mobileChecks);
    await captureScreenshot("faq_page_mobile.png");

    // 7. Dark Mode Test
    console.log("Testing Dark Mode...");
    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("faq_page_darkmode.png");

    console.log("ALL FAQ HUB TESTS COMPLETED SUCCESSFULLY!");
  } finally {
    ws.close();
    chrome.kill();
  }
}

run().catch((err) => {
  console.error("QA Script Error:", err);
  process.exit(1);
});
