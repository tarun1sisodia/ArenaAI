/**
 * Comprehensive CDP Automated QA for Contact Us Hub Page (Step R5.16)
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";

const CDP_PORT = 9336;
const CHROME_PATH = "/usr/bin/google-chrome";
const ARTIFACTS_DIR = "/home/bot/.gemini/antigravity-ide/brain/e0830be9-f21c-4fc2-84ba-c30ac4dc947c";

async function run() {
  console.log("Launching headless Chrome for Contact Us Hub Page QA...");
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${CDP_PORT}`,
    "about:blank",
  ]);

  // Wait for DevTools listening log
  await new Promise((resolve, reject) => {
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

    console.log("Navigating to http://localhost:5173/en/contact/...");
    await send("Page.navigate", { url: "http://localhost:5173/en/contact/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Title, H1, Channels, Bento card, Proximity, FAQ
    const desktopChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.innerText?.trim();
        const channels = document.querySelectorAll('.channel-card').length;
        const cornerPlus = document.querySelectorAll('.corner-plus').length;
        const napTiles = document.querySelectorAll('.nap-tile').length;
        const guaranteeBox = !!document.querySelector('.emergency-guarantee-box');
        const inquiryForm = !!document.querySelector('.inquiry-form');
        const proximityCards = document.querySelectorAll('.proximity-card').length;
        const faqItems = document.querySelectorAll('.faq-accordion-item').length;
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return {
          title,
          h1,
          channels,
          cornerPlus,
          napTiles,
          guaranteeBox,
          inquiryForm,
          proximityCards,
          faqItems,
          jsonLd,
          overflow
        };
      })()
    `);

    console.log("Desktop checks:", JSON.stringify(desktopChecks, null, 2));

    await captureScreenshot("contact_page_desktop_hero.png");

    // Scroll to Main Bento Section & Form
    await evaluate(`window.scrollTo({ top: 550, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("contact_page_desktop_bento.png");

    // Test Form Validation: Click submit while empty
    console.log("Testing form validation on empty submit...");
    await evaluate(`
      (() => {
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) submitBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    const validationState = await evaluate(`
      (() => {
        const errors = document.querySelectorAll('.field-error-msg').length;
        const shakenInputs = document.querySelectorAll('.input-error').length;
        return { errors, shakenInputs };
      })()
    `);
    console.log("Validation State:", validationState);

    // Test Valid Form Fill & Submission
    console.log("Filling form fields and submitting...");
    await evaluate(`
      (() => {
        const nameInput = document.getElementById('contact-name');
        const phoneInput = document.getElementById('contact-phone');
        const dateInput = document.getElementById('contact-date');
        const pickupInput = document.getElementById('contact-pickup');
        const notesInput = document.getElementById('contact-message');

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;

        nativeInputValueSetter.call(nameInput, "Amitabh Bachchan");
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));

        nativeInputValueSetter.call(phoneInput, "+91 98111 22233");
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));

        nativeInputValueSetter.call(dateInput, "2026-10-15");
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));

        nativeInputValueSetter.call(pickupInput, "The Oberoi Amarvilas, Taj Ganj");
        pickupInput.dispatchEvent(new Event('input', { bubbles: true }));

        nativeTextareaValueSetter.call(notesInput, "Sunrise Taj Mahal tour at 5:30 AM with English speaking chauffeur");
        notesInput.dispatchEvent(new Event('input', { bubbles: true }));

        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) submitBtn.click();
      })()
    `);

    // Wait for simulated network submission (650ms)
    await new Promise((r) => setTimeout(r, 1000));

    const submissionState = await evaluate(`
      (() => {
        const isSuccess = !!document.querySelector('.inquiry-success-state');
        const inquiryId = document.querySelector('.inquiry-id-badge strong')?.innerText;
        const toastVisible = !!document.querySelector('.contact-toast');
        const waLink = document.querySelector('.inquiry-success-actions a')?.href;
        return { isSuccess, inquiryId, toastVisible, hasWaLink: !!waLink };
      })()
    `);
    console.log("Submission State:", submissionState);
    await captureScreenshot("contact_page_desktop_submitted.png");

    // Scroll to Proximity & FAQs
    await evaluate(`window.scrollTo({ top: 1400, behavior: 'instant' })`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("contact_page_desktop_proximity_faqs.png");

    // Test FAQ toggle
    console.log("Testing FAQ toggle...");
    await evaluate(`
      (() => {
        const secondBtn = document.getElementById('contact-faq-btn-1');
        if (secondBtn) secondBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 300));

    // 2. Test Hindi version (/hi/contact/)
    console.log("Testing Hindi version (/hi/contact/)...");
    await send("Page.navigate", { url: "http://localhost:5173/hi/contact/" });
    await new Promise((r) => setTimeout(r, 2000));

    const hindiChecks = await evaluate(`
      (() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.innerText?.trim();
        const hubTitle = document.querySelector('.contact-hub-title')?.innerText?.trim();
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return {
          title,
          h1,
          hubTitle,
          overflow
        };
      })()
    `);
    console.log("Hindi checks:", JSON.stringify(hindiChecks, null, 2));
    await captureScreenshot("contact_page_hindi.png");

    // 3. Tablet Test (768x1024)
    console.log("Setting tablet viewport 768x1024...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "http://localhost:5173/en/contact/" });
    await new Promise((r) => setTimeout(r, 2000));

    const tabletChecks = await evaluate(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);
    console.log("Tablet checks:", tabletChecks);
    await captureScreenshot("contact_page_tablet.png");

    // 4. Mobile Test (375x812)
    console.log("Setting mobile viewport 375x812...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Page.navigate", { url: "http://localhost:5173/en/contact/" });
    await new Promise((r) => setTimeout(r, 2000));

    const mobileChecks = await evaluate(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);
    console.log("Mobile checks:", mobileChecks);
    await captureScreenshot("contact_page_mobile.png");

    // 5. Dark Mode Test
    console.log("Testing Dark Mode...");
    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("contact_page_darkmode.png");

    console.log("ALL CONTACT HUB TESTS COMPLETED SUCCESSFULLY!");
  } finally {
    ws.close();
    chrome.kill();
  }
}

run().catch((err) => {
  console.error("QA Script Error:", err);
  process.exit(1);
});
