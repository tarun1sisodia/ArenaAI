import assert from "node:assert";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");

async function runTests() {
  console.log("🧪 Running Static Destinations & Distance Matrix Automated Tests...");

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: reactRoot,
    optimizeDeps: { noDiscovery: true },
  });

  try {
    const {
      VERIFIED_DESTINATIONS,
      lookupDestination,
      normalizeDestinationKey,
      getHighwayDistance,
      formatDurationHours,
      haversineRoadDistanceKm,
      getAllDestinations,
      getPopularDestinations,
    } = await vite.ssrLoadModule("/src/utils/distance.ts");

    // 1. Total destinations count
    assert(
      Array.isArray(VERIFIED_DESTINATIONS),
      "VERIFIED_DESTINATIONS must be an array"
    );
    assert(
      VERIFIED_DESTINATIONS.length >= 30,
      `Expected at least 30 verified destinations, got ${VERIFIED_DESTINATIONS.length}`
    );

    // 2. Key destination lookups
    const agra = lookupDestination("Agra");
    assert(agra, "Must find Agra");
    assert.strictEqual(agra?.code, "AGR");
    assert.strictEqual(agra?.distanceFromAgra, 0);

    const delhi = lookupDestination("Delhi (IGI Airport)");
    assert(delhi, "Must find Delhi");
    assert.strictEqual(delhi?.code, "DEL");
    assert.strictEqual(delhi?.distanceFromAgra, 210);
    assert.strictEqual(delhi?.distanceFromDelhi, 0);

    const jaipur = lookupDestination("JAI");
    assert(jaipur, "Must find Jaipur by code");
    assert.strictEqual(jaipur?.name, "Jaipur (Pink City)");
    assert.strictEqual(jaipur?.distanceFromAgra, 240);
    assert.strictEqual(jaipur?.distanceFromDelhi, 270);

    const lucknow = lookupDestination("lucknow");
    assert(lucknow, "Must find Lucknow");
    assert.strictEqual(lucknow?.distanceFromAgra, 335);

    const ayodhya = lookupDestination("Ram Janmabhoomi");
    assert(ayodhya, "Must find Ayodhya by alias");
    assert.strictEqual(ayodhya?.id, "ayodhya");
    assert.strictEqual(ayodhya?.distanceFromAgra, 470);

    const manali = lookupDestination("Solang Valley");
    assert(manali, "Must find Manali by alias");
    assert.strictEqual(manali?.id, "manali");
    assert.strictEqual(manali?.distanceFromAgra, 750);
    assert.strictEqual(manali?.distanceFromDelhi, 520);

    // 3. Direct highway distance calculations from Agra
    const agraToDelhi = getHighwayDistance("Agra", "Delhi");
    assert.strictEqual(agraToDelhi.distanceKm, 210);
    assert.strictEqual(agraToDelhi.durationHours, 3.25);
    assert.strictEqual(agraToDelhi.durationFormatted, "3 hrs 15 mins");
    assert(agraToDelhi.highwayVia.includes("Yamuna Expressway"));
    assert(agraToDelhi.isDirectRoute);

    const delhiToAgra = getHighwayDistance("delhi", "agra");
    assert.strictEqual(delhiToAgra.distanceKm, 210);
    assert.strictEqual(delhiToAgra.durationHours, 3.25);

    const agraToJaipur = getHighwayDistance("Agra", "Jaipur");
    assert.strictEqual(agraToJaipur.distanceKm, 240);
    assert.strictEqual(agraToJaipur.durationHours, 4.25);

    const agraToMathura = getHighwayDistance("Agra", "Mathura");
    assert.strictEqual(agraToMathura.distanceKm, 58);
    assert.strictEqual(agraToMathura.durationHours, 1.0);
    assert.strictEqual(agraToMathura.durationFormatted, "1 hr");

    const agraToVrindavan = getHighwayDistance("Agra", "Vrindavan");
    assert.strictEqual(agraToVrindavan.distanceKm, 64);

    const agraToGwalior = getHighwayDistance("Agra", "Gwalior");
    assert.strictEqual(agraToGwalior.distanceKm, 120);
    assert.strictEqual(agraToGwalior.durationHours, 2.5);

    const agraToLucknow = getHighwayDistance("Agra", "Lucknow");
    assert.strictEqual(agraToLucknow.distanceKm, 335);
    assert(agraToLucknow.highwayVia.includes("Agra-Lucknow Expressway"));

    const agraToVaranasi = getHighwayDistance("Agra", "Varanasi");
    assert.strictEqual(agraToVaranasi.distanceKm, 600);

    // 4. Direct highway distances from Delhi
    const delhiToJaipur = getHighwayDistance("Delhi", "Jaipur");
    assert.strictEqual(delhiToJaipur.distanceKm, 270);
    assert.strictEqual(delhiToJaipur.durationHours, 4.5);

    const delhiToChandigarh = getHighwayDistance("Delhi", "Chandigarh");
    assert.strictEqual(delhiToChandigarh.distanceKm, 245);
    assert.strictEqual(delhiToChandigarh.durationHours, 4.0);

    const delhiToDehradun = getHighwayDistance("Delhi", "Dehradun");
    assert.strictEqual(delhiToDehradun.distanceKm, 250);

    const delhiToShimla = getHighwayDistance("Delhi", "Shimla");
    assert.strictEqual(delhiToShimla.distanceKm, 350);

    // 5. Twin-city corridors
    const mathuraVrindavan = getHighwayDistance("Mathura", "Vrindavan");
    assert.strictEqual(mathuraVrindavan.distanceKm, 15);
    assert.strictEqual(mathuraVrindavan.durationFormatted, "30 mins");

    const haridwarRishikesh = getHighwayDistance("Haridwar", "Rishikesh");
    assert.strictEqual(haridwarRishikesh.distanceKm, 25);
    assert.strictEqual(haridwarRishikesh.durationFormatted, "45 mins");

    const dehradunMussoorie = getHighwayDistance("Dehradun", "Mussoorie");
    assert.strictEqual(dehradunMussoorie.distanceKm, 35);
    assert.strictEqual(dehradunMussoorie.durationFormatted, "1 hr 15 mins");

    // 6. Local sightseeing (Same origin & destination)
    const localAgra = getHighwayDistance("Agra", "Agra");
    assert.strictEqual(localAgra.distanceKm, 80);
    assert.strictEqual(localAgra.durationHours, 8);
    assert.strictEqual(localAgra.isLocal, true);

    // 7. Triangle routing between non-hub cities
    const gwaliorToJaipur = getHighwayDistance("Gwalior", "Jaipur");
    assert(gwaliorToJaipur.distanceKm > 250, "Gwalior to Jaipur should route via corridor");
    assert(!gwaliorToJaipur.isDirectRoute);

    // 8. Duration formatting tests
    assert.strictEqual(formatDurationHours(0), "Point-to-Point");
    assert.strictEqual(formatDurationHours(0.5), "30 mins");
    assert.strictEqual(formatDurationHours(1.0), "1 hr");
    assert.strictEqual(formatDurationHours(2.5), "2 hrs 30 mins");
    assert.strictEqual(formatDurationHours(4.25), "4 hrs 15 mins");

    // 9. Haversine distance tests
    const hDist = haversineRoadDistanceKm(27.1767, 78.0081, 28.5562, 77.1);
    assert(hDist >= 200 && hDist <= 240, `Expected ~210 km, got ${hDist}`);

    // 10. Utils barrel re-export test
    const utilsIndex = await vite.ssrLoadModule("/src/utils/index.ts");
    assert(utilsIndex.getHighwayDistance, "Utils index must export getHighwayDistance");
    assert(utilsIndex.formatInr, "Utils index must export formatInr");

    console.log("✅ All 30 Distance Matrix & Routing assertions PASSED cleanly!");
  } finally {
    await vite.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
