/**
 * Comprehensive CDP Automated QA for Dynamic Route Landing Template (Step R5.21)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";

const CDP_PORT = 9344;
const CHROME_PATH = "/usr/bin/google-chrome";
const ARTIFACTS_DIR = "/home/bot/.gemini/antigravity-ide/brain/e0830be9-f21c-4fc2-84ba-c30ac4dc947c";

async function run() {
  console.log("Launching headless Chrome for Route Detail Page QA...");
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
    // 1. Desktop Test (1280x900) on /en/agra-to-delhi-taxi/
    console.log("Setting desktop viewport 1280x900...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to http://localhost:5173/en/agra-to-delhi-taxi/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/agra-to-delhi-taxi/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Basic page verification
    const desktopChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const vehicleCards = document.querySelectorAll(".route-vehicle-card").length;
        const firstFare = document.querySelector(".fare-amount")?.textContent?.trim();
        const advisoryCards = document.querySelectorAll(".advisory-bento-card").length;
        const stopoverCards = document.querySelectorAll(".stopover-card").length;
        const faqItems = document.querySelectorAll(".route-faq-item").length;
        const ctaButtons = document.querySelectorAll(".cta-banner-buttons .button").length;
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const hasOverflow = scrollW > clientW;

        return {
          title,
          h1,
          vehicleCards,
          firstFare,
          advisoryCards,
          stopoverCards,
          faqItems,
          ctaButtons,
          scrollW,
          clientW,
          hasOverflow
        };
      })()
    `);

    console.log("Desktop checks (Agra to Delhi):", JSON.stringify(desktopChecks, null, 2));
    await captureScreenshot("route_detail_desktop_hero.png");

    // Scroll to Vehicle matrix
    await evaluate(`window.scrollTo({ top: 600, behavior: 'instant' });`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("route_detail_desktop_matrix.png");

    // Scroll to Advisory & Stopovers
    await evaluate(`window.scrollTo({ top: 1250, behavior: 'instant' });`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("route_detail_desktop_advisory.png");

    // Test FAQ Accordion expansion
    console.log("Expanding FAQ item 1...");
    await evaluate(`
      (() => {
        const btn = document.querySelector(".route-faq-question-btn");
        if (btn) btn.click();
        window.scrollTo({ top: 1850, behavior: 'instant' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("route_detail_desktop_faqs.png");

    // 2. Test Jaipur Route: /en/agra-to-jaipur-taxi/
    console.log("Navigating to http://localhost:5173/en/agra-to-jaipur-taxi/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/agra-to-jaipur-taxi/" });
    await new Promise((r) => setTimeout(r, 2000));

    const jaipurChecks = await evaluate(`
      (() => {
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const firstStopover = document.querySelector(".stopover-card h3")?.textContent?.trim();
        const firstFare = document.querySelector(".fare-amount")?.textContent?.trim();
        return { h1, firstStopover, firstFare };
      })()
    `);
    console.log("Jaipur Route checks:", JSON.stringify(jaipurChecks, null, 2));
    await captureScreenshot("route_detail_jaipur.png");

    // 3. Hindi Locale Test on /hi/agra-se-delhi-taxi/
    console.log("Navigating to http://localhost:5173/hi/agra-se-delhi-taxi/...");
    await send("Page.navigate", { url: "http://localhost:5173/hi/agra-se-delhi-taxi/" });
    await new Promise((r) => setTimeout(r, 2000));

    const hindiChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector("h1")?.textContent?.trim();
        const firstFaq = document.querySelector(".route-faq-question-btn span")?.textContent?.trim();
        return { title, h1, firstFaq };
      })()
    `);
    console.log("Hindi checks:", JSON.stringify(hindiChecks, null, 2));
    await captureScreenshot("route_detail_hindi.png");

    // 4. Tablet Viewport (768x1024)
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
    await captureScreenshot("route_detail_tablet.png");

    // 5. Mobile Viewport (375x812)
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
    await captureScreenshot("route_detail_mobile.png");

    // 6. Dark Mode Verification
    console.log("Testing dark mode...");
    await evaluate(`document.documentElement.classList.add('dark');`);
    await new Promise((r) => setTimeout(r, 500));
    await captureScreenshot("route_detail_darkmode.png");

    console.log("All Route Detail automated QA checks completed successfully!");
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
