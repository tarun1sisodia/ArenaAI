import assert from "node:assert";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");

async function runTests() {
  console.log("🧪 Running LocationIQ Client & Hook Automated Tests...");

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: reactRoot,
    optimizeDeps: { noDiscovery: true },
  });

  try {
    const { fetchLocationIQSuggestions } = await vite.ssrLoadModule(
      "/src/hooks/useLocationIQ.ts"
    );
    const {
      getLocationIqAccessToken,
      setLocationIqAccessToken,
      clearLocationIqAccessToken,
    } = await vite.ssrLoadModule("/src/config.ts");

    // 1. Short query returns empty
    const shortResult = await fetchLocationIQSuggestions({
      query: "a",
      token: "sample-token",
    });
    assert.deepStrictEqual(
      shortResult,
      [],
      "Query with < 2 characters must return empty array"
    );

    // 2. Whitespace query returns empty
    const emptyResult = await fetchLocationIQSuggestions({
      query: "   ",
      token: "sample-token",
    });
    assert.deepStrictEqual(
      emptyResult,
      [],
      "Whitespace query must return empty array"
    );

    // 3. Missing token returns empty
    const noTokenResult = await fetchLocationIQSuggestions({
      query: "Delhi",
      token: "",
    });
    assert.deepStrictEqual(
      noTokenResult,
      [],
      "Missing token must return empty array"
    );

    // 4. Mock fetch for autocomplete suggestions parsing
    const originalFetch = globalThis.fetch;
    let capturedUrl = "";

    const mockPlaces = [
      {
        place_id: "98765",
        lat: "27.1751448",
        lon: "78.0421422",
        display_name:
          "Taj Mahal, Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh, 282001, India",
        address: {
          suburb: "Tajganj",
          city: "Agra",
          state: "Uttar Pradesh",
          postcode: "282001",
          country: "India",
          country_code: "in",
        },
      },
      {
        place_id: "54321",
        lat: "28.5561624",
        lon: "77.1002812",
        display_name:
          "Indira Gandhi International Airport, New Delhi, Delhi, India",
        address: {
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          country_code: "in",
        },
      },
    ];

    globalThis.fetch = async (input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify(mockPlaces), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      const suggestions = await fetchLocationIQSuggestions({
        query: "Taj",
        token: "test_token_123",
        limit: 5,
        countrycodes: "in",
      });

      assert.strictEqual(
        suggestions.length,
        2,
        "Expected 2 suggestions parsed from API response"
      );

      // URL parameter verification
      assert(
        capturedUrl.startsWith("https://api.locationiq.com/v1/autocomplete"),
        "Must hit LocationIQ autocomplete endpoint"
      );
      assert(
        capturedUrl.includes("key=test_token_123"),
        "Must include token key"
      );
      assert(capturedUrl.includes("q=Taj"), "Must include query param");
      assert(capturedUrl.includes("limit=5"), "Must include limit param");
      assert(
        capturedUrl.includes("countrycodes=in"),
        "Must include countrycodes param"
      );
      assert(capturedUrl.includes("format=json"), "Must request json format");

      // Item 1 structure
      const taj = suggestions[0];
      assert.strictEqual(taj.id, "locationiq-98765");
      assert.strictEqual(taj.name, "Taj Mahal");
      assert.strictEqual(taj.subtitle, "Agra, Uttar Pradesh, 282001");
      assert.strictEqual(taj.code, "IQ");
      assert.strictEqual(taj.isLocationIQ, true);
      assert.strictEqual(taj.lat, 27.1751448);
      assert.strictEqual(taj.lon, 78.0421422);
      assert.strictEqual(taj.raw?.place_id, "98765");

      // Item 2 structure
      const airport = suggestions[1];
      assert.strictEqual(airport.id, "locationiq-54321");
      assert.strictEqual(
        airport.name,
        "Indira Gandhi International Airport"
      );
      assert.strictEqual(airport.subtitle, "New Delhi, Delhi");
      assert.strictEqual(airport.code, "IQ");
      assert.strictEqual(airport.isLocationIQ, true);

      // 5. Test 401 Authorization error
      globalThis.fetch = async () => {
        return new Response("Unauthorized", { status: 401 });
      };

      let caught401 = false;
      try {
        await fetchLocationIQSuggestions({
          query: "Agra",
          token: "bad_token",
        });
      } catch (e: any) {
        caught401 = true;
        assert(
          e.message.includes("LocationIQ authorization failed (401)"),
          `Unexpected error message: ${e.message}`
        );
      }
      assert(caught401, "Expected 401 error to be thrown");

      // 6. Test 429 Rate limit error
      globalThis.fetch = async () => {
        return new Response("Rate limit exceeded", { status: 429 });
      };

      let caught429 = false;
      try {
        await fetchLocationIQSuggestions({
          query: "Agra",
          token: "overused_token",
        });
      } catch (e: any) {
        caught429 = true;
        assert(
          e.message.includes("LocationIQ rate limit exceeded (429)"),
          `Unexpected error message: ${e.message}`
        );
      }
      assert(caught429, "Expected 429 error to be thrown");

      // 7. Test AbortSignal cancellation
      // 7a. Pre-aborted signal
      const controller = new AbortController();
      controller.abort();

      const abortedResults = await fetchLocationIQSuggestions({
        query: "Jaipur",
        token: "test_token",
        signal: controller.signal,
      });
      assert.deepStrictEqual(
        abortedResults,
        [],
        "Pre-aborted request must return empty array without throwing"
      );

      // 7b. Signal aborted during network fetch
      const activeController = new AbortController();
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.signal?.aborted) {
          throw new DOMException("The operation was aborted", "AbortError");
        }
        return new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
          setTimeout(() => {
            activeController.abort();
          }, 10);
        });
      };

      const abortedMidFlight = await fetchLocationIQSuggestions({
        query: "Gwalior",
        token: "test_token",
        signal: activeController.signal,
      });
      assert.deepStrictEqual(
        abortedMidFlight,
        [],
        "Mid-flight aborted request must return empty array without throwing"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 8. Test runtime token helpers
    const storage = new Map<string, string>();
    (globalThis as any).window = {
      localStorage: {
        getItem: (key: string) => storage.get(key) || null,
        setItem: (key: string, val: string) => storage.set(key, val),
        removeItem: (key: string) => storage.delete(key),
      },
      location: { search: "" },
    };

    clearLocationIqAccessToken();
    assert.strictEqual(
      getLocationIqAccessToken(),
      "",
      "Token should be empty after clear"
    );

    setLocationIqAccessToken("my_test_access_token_999");
    assert.strictEqual(
      getLocationIqAccessToken(),
      "my_test_access_token_999",
      "Token should match persisted value"
    );

    clearLocationIqAccessToken();
    assert.strictEqual(
      getLocationIqAccessToken(),
      "",
      "Token should be cleared"
    );

    delete (globalThis as any).window;

    console.log("✅ All 24 LocationIQ Client & Hook unit assertions PASSED!");
  } finally {
    await vite.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
