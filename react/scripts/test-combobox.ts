import assert from "node:assert";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");

async function runTests() {
  console.log("🧪 Running Searchable Location Combobox Automated Tests...");

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: reactRoot,
    optimizeDeps: { noDiscovery: true },
  });

  try {
    const {
      LocationCombobox,
      STATIC_DESTINATIONS,
      resolveLocationIcon,
    } = await vite.ssrLoadModule(
      "/src/components/search/LocationCombobox.tsx"
    );

    // 1. Verify static destinations catalog
    assert(
      Array.isArray(STATIC_DESTINATIONS),
      "STATIC_DESTINATIONS must be an array"
    );
    assert(
      STATIC_DESTINATIONS.length >= 25,
      `Expected at least 25 static destinations, got ${STATIC_DESTINATIONS.length}`
    );

    const destIds = new Set(STATIC_DESTINATIONS.map((d: any) => d.id));
    assert(destIds.has("agra"), "Must contain Agra");
    assert(destIds.has("delhi"), "Must contain Delhi");
    assert(destIds.has("jaipur"), "Must contain Jaipur");
    assert(destIds.has("mathura"), "Must contain Mathura");
    assert(destIds.has("vrindavan"), "Must contain Vrindavan");
    assert(destIds.has("gwalior"), "Must contain Gwalior");
    assert(destIds.has("lucknow"), "Must contain Lucknow");
    assert(destIds.has("ayodhya"), "Must contain Ayodhya");
    assert(destIds.has("varanasi"), "Must contain Varanasi");

    // 2. Verify icon mapping logic
    assert.strictEqual(
      resolveLocationIcon({ name: "Delhi IGI Airport", code: "DEL" }),
      "✈️",
      "Airport should resolve to plane icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Jolly Grant Aerodrome", code: "DED" }),
      "✈️",
      "Aerodrome should resolve to plane icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Agra Cantt Railway Station" }),
      "🚆",
      "Railway station should resolve to train icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "New Delhi Rly Junction", code: "NDLS" }),
      "🚆",
      "Rly junction should resolve to train icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Taj Mahal", subtitle: "Agra, Uttar Pradesh" }),
      "🏛️",
      "Taj Mahal should resolve to monument icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Prem Mandir Temple", subtitle: "Vrindavan" }),
      "🏛️",
      "Temple should resolve to monument icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Solang Valley Hill", subtitle: "Manali" }),
      "🏔️",
      "Hill/Valley should resolve to mountain icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Random Street Address", isLocationIQ: true }),
      "📍",
      "LocationIQ geocoded item should resolve to pin icon"
    );
    assert.strictEqual(
      resolveLocationIcon({ name: "Sector 18 Market", subtitle: "Noida" }),
      "🏙️",
      "City landmark should resolve to cityscape icon"
    );

    // 3. Test React SSR rendering
    const renderedHtml = renderToString(
      createElement(LocationCombobox, {
        value: "Agra",
        onChange: () => {},
        placeholder: "From City",
        label: "Pickup Location",
      })
    );

    assert(
      renderedHtml.includes('class="loc-picker'),
      "Rendered markup must contain .loc-picker"
    );
    assert(
      renderedHtml.includes('role="combobox"'),
      "Rendered button must contain role=combobox"
    );
    assert(
      renderedHtml.includes('aria-expanded="false"'),
      "Initial combobox must have aria-expanded=false"
    );
    assert(
      renderedHtml.includes("Agra"),
      "Rendered button must contain selected value Agra"
    );
    assert(
      renderedHtml.includes("▼"),
      "Rendered button must contain chevron indicator"
    );

    // 4. Test empty value rendering
    const emptyHtml = renderToString(
      createElement(LocationCombobox, {
        value: "",
        onChange: () => {},
        placeholder: "Search drop city...",
        label: "Drop Location",
      })
    );

    assert(
      emptyHtml.includes("Search drop city..."),
      "Empty state must display placeholder"
    );
    assert(
      emptyHtml.includes("is-empty"),
      "Empty state must have .is-empty class"
    );

    // 5. Test barrel index re-export
    const barrel = await vite.ssrLoadModule("/src/components/search/index.ts");
    assert(barrel.LocationCombobox, "Barrel index must export LocationCombobox");
    assert(barrel.default, "Barrel index must export default");

    console.log("✅ All 21 LocationCombobox assertions PASSED cleanly!");
  } finally {
    await vite.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
