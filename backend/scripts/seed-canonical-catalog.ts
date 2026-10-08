import pg from "pg";
import { loadEnv } from "../src/config/env.js";

async function run() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log("Seeding canonical catalog records (5 fleet tiers, nightChargeInr=0)...");
    await client.query("BEGIN");

    // 1. Tour Packages
    const tourPackages = [
      {
        id: "d0000000-0000-4000-a000-000000000001",
        package_code: "same-day-agra-taj-mahal-tour",
        name: "Same Day Agra Taj Mahal Tour",
        duration_text: "1 day",
        days: 1,
        nights: 0,
        base_tier_code: "sedan",
        starting_price_inr: 3499,
        fleet_prices: {
          sedan: 3499,
          ertiga: 4299,
          "innova-crysta": 5299,
          "tempo-traveller": 6999,
          urbania: 8999,
        },
        night_charge_inr: 0,
        inclusions_highlight: "Dedicated AC Cab, Uniformed Chauffeur, Highway Tolls & Chilled Water",
        inclusions_note: "Doorstep hotel or railway station pickup anywhere in Agra.",
        source: "Agra",
        destination: "Same Day Agra Taj Mahal Tour",
        inclusions: [
          "Private AC Cab dedicated exclusively to your group",
          "Police-verified professional chauffeur & fuel charges",
          "All highway toll taxes & state border permits",
          "Doorstep hotel / railway station pickup & drop",
          "Chilled packaged drinking water bottles",
        ],
        exclusions: [
          "Monument entry tickets & camera/drone permits",
          "Meals, buffet lunches & personal snacks/dining",
          "Chauffeur / guide discretionary tips & gratuities",
          "Special temple VIP pooja / express darshan passes",
          "Personal shopping & handicraft purchases",
        ],
        itinerary: [
          { time: "06:00 AM", title: "Taj Mahal Sunrise Departure", desc: "Private pickup from hotel or station; seamless entry at East Gate." },
          { time: "09:30 AM", title: "Agra Fort Royal Palaces", desc: "Explore the UNESCO red sandstone fortress and Mughal courtyards." },
          { time: "01:00 PM", title: "Lunch Break & Inlay Marble", desc: "Authentic lunch halt followed by pietra dura inlay craftsmanship." },
          { time: "04:30 PM", title: "Mehtab Bagh Sunset Vantage", desc: "Panoramic sunset view across Yamuna River with iconic silhouette." },
          { time: "06:30 PM", title: "Chauffeured Return Drop", desc: "Doorstep drop to your hotel or Agra Cantt Railway Station." },
        ],
        image_url: "/assets/places/gallery/taj-mahal-01.jpg",
        gallery: [
          { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at dawn", alt: "Taj Mahal dawn reflection Agra" },
          { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Grand Amar Singh Gate at Agra Red Fort", alt: "Amar Singh Gate Agra Red Fort" },
          { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Sunset vantage point over Yamuna", alt: "Sunset vantage point over Yamuna" },
          { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Taj Mahal marble archways & minarets", alt: "Taj Mahal marble archways" },
        ],
        status: "published",
        is_active: true,
      },
      {
        id: "d0000000-0000-4000-a000-000000000002",
        package_code: "taj-mahal-sunrise-tour",
        name: "Taj Mahal Sunrise Tour",
        duration_text: "1 day",
        days: 1,
        nights: 0,
        base_tier_code: "sedan",
        starting_price_inr: 3999,
        fleet_prices: {
          sedan: 3999,
          ertiga: 4799,
          "innova-crysta": 5799,
          "tempo-traveller": 7499,
          urbania: 9499,
        },
        night_charge_inr: 0,
        inclusions_highlight: "Pre-Dawn Hotel Pickup, Chauffeur Allowance & Sanitized AC Cab",
        inclusions_note: "Optimal pre-dawn timing avoids midday tourist crowds.",
        source: "Agra",
        destination: "Taj Mahal & Baby Taj",
        inclusions: [
          "Private AC Cab dedicated exclusively to your group",
          "Police-verified chauffeur & early-morning fuel allowance",
          "All state road taxes & toll permits",
          "Doorstep hotel pickup by 05:30 AM",
        ],
        exclusions: [
          "Monument entry permits",
          "Meals & refreshments",
          "Personal expenditures",
        ],
        itinerary: [
          { time: "05:30 AM", title: "Early Pre-Dawn Pickup", desc: "Direct hotel pickup to arrive before sunrise at Taj Mahal." },
          { time: "08:30 AM", title: "Breakfast & Relaxation", desc: "Leisure breakfast break in Agra city." },
          { time: "10:30 AM", title: "Baby Taj (Itmad-ud-Daulah)", desc: "Exquisite precursor to Taj Mahal on Yamuna riverfront." },
        ],
        image_url: "/assets/places/gallery/taj-mahal-02.jpg",
        gallery: [
          { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Taj Mahal marble archways & minarets", alt: "Taj Mahal dome architecture" },
          { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at dawn", alt: "Taj Mahal dawn reflection Agra" },
          { url: "/assets/places/gallery/agra-fort-02.jpg", caption: "Diwan-i-Khas marble royal pavilion", alt: "Diwan-i-Khas Agra Fort" },
        ],
        status: "published",
        is_active: true,
      },
      {
        id: "d0000000-0000-4000-a000-000000000003",
        package_code: "mathura-vrindavan",
        name: "Mathura & Vrindavan Spiritual Darshan",
        duration_text: "1 day",
        days: 1,
        nights: 0,
        base_tier_code: "sedan",
        starting_price_inr: 3200,
        fleet_prices: {
          sedan: 3200,
          ertiga: 3900,
          "innova-crysta": 4800,
          "tempo-traveller": 6500,
          urbania: 8500,
        },
        night_charge_inr: 0,
        inclusions_highlight: "Dedicated Chauffeur, Interstate Permits, Parking & Fuel",
        inclusions_note: "Seamless temple coordination for Banke Bihari & Prem Mandir.",
        source: "Agra",
        destination: "Mathura & Vrindavan",
        inclusions: [
          "Dedicated sanitized AC cab for full day (10 hrs)",
          "Police-verified chauffeur & fuel",
          "Toll taxes and state permits",
        ],
        exclusions: [
          "Special VIP pooja tickets",
          "Meals & prasad items",
        ],
        itinerary: [
          { time: "07:30 AM", title: "Departure from Agra", desc: "Expressway drive to Mathura holy land." },
          { time: "09:00 AM", title: "Krishna Janmabhoomi Darshan", desc: "Sacred temple complex and prison cell birth sanctum." },
          { time: "02:00 PM", title: "Banke Bihari Mandir", desc: "Heartfelt darshan at Vrindavan's most revered shrine." },
          { time: "06:30 PM", title: "Prem Mandir Evening Light Show", desc: "Illuminated marble complex before return to Agra." },
        ],
        image_url: "/assets/places/gallery/mathura-vrindavan-01.jpg",
        gallery: [
          { url: "/assets/places/gallery/mathura-vrindavan-01.jpg", caption: "Prem Mandir & Banke Bihari illumination", alt: "Prem Mandir illuminated at night" },
          { url: "/assets/places/gallery/fatehpur-sikri-01.jpg", caption: "Buland Darwaza imperial gate", alt: "Buland Darwaza Fatehpur Sikri" },
          { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Mehtab Bagh sunset vantage point", alt: "Mehtab Bagh across Yamuna River" },
        ],
        status: "published",
        is_active: true,
      },
    ];

    for (const p of tourPackages) {
      await client.query(
        `INSERT INTO tour_packages (
          id, package_code, name, duration_text, days, nights,
          base_tier_code, starting_price_inr, fleet_prices, night_charge_inr,
          inclusions_highlight, inclusions_note, source, destination,
          inclusions, exclusions, itinerary, image_url, gallery,
          status, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
        )
        ON CONFLICT (package_code) DO UPDATE SET
          name = EXCLUDED.name,
          fleet_prices = EXCLUDED.fleet_prices,
          night_charge_inr = EXCLUDED.night_charge_inr,
          gallery = EXCLUDED.gallery,
          inclusions = EXCLUDED.inclusions,
          exclusions = EXCLUDED.exclusions,
          itinerary = EXCLUDED.itinerary,
          status = EXCLUDED.status,
          updated_at = NOW();`,
        [
          p.id,
          p.package_code,
          p.name,
          p.duration_text,
          p.days,
          p.nights,
          p.base_tier_code,
          p.starting_price_inr,
          JSON.stringify(p.fleet_prices),
          p.night_charge_inr,
          p.inclusions_highlight,
          p.inclusions_note,
          p.source,
          p.destination,
          JSON.stringify(p.inclusions),
          JSON.stringify(p.exclusions),
          JSON.stringify(p.itinerary),
          p.image_url,
          JSON.stringify(p.gallery),
          p.status,
          p.is_active,
        ]
      );
      console.log(`  ✓ Seeded tour package: ${p.name}`);
    }

    // 2. Package Vehicle Upgrades (Canonical Tiers)
    const upgrades = [
      { tier_code: "ertiga", passenger_note: "Up to 6 Passengers with Luggage", surcharge_inr: 800 },
      { tier_code: "innova-crysta", passenger_note: "VIP Executive Comfort (6–7 Passengers)", surcharge_inr: 1800 },
      { tier_code: "tempo-traveller", passenger_note: "Large Family / Group (12–16 Passengers)", surcharge_inr: 3500 },
      { tier_code: "urbania", passenger_note: "Ultra-Luxury Chauffeur Cruiser (10–17 Passengers)", surcharge_inr: 5500 },
    ];

    for (const u of upgrades) {
      await client.query(
        `INSERT INTO package_vehicle_upgrades (package_id, tier_code, passenger_note, surcharge_inr)
         VALUES (NULL, $1, $2, $3)
         ON CONFLICT (tier_code) WHERE package_id IS NULL DO UPDATE SET
           passenger_note = EXCLUDED.passenger_note,
           surcharge_inr = EXCLUDED.surcharge_inr;`,
        [u.tier_code, u.passenger_note, u.surcharge_inr]
      );
    }
    console.log(`  ✓ Seeded 4 canonical package vehicle upgrades`);

    // 3. Transfer Routes
    const transfers = [
      {
        id: "e0000000-0000-4000-a000-000000000001",
        route_code: "agc-station-transfer",
        name: "Agra Cantt Railway Station (AGC) Transfer",
        distance_text: "~15–20 km",
        direction_note: "Doorstep pickup or drop at Agra Cantt Railway Station",
        fleet_prices: { sedan: 800, ertiga: 900, "innova-crysta": 1100, "tempo-traveller": 2200, urbania: 3500 },
        night_charge_inr: 0,
        status: "published",
        is_active: true,
      },
      {
        id: "e0000000-0000-4000-a000-000000000002",
        route_code: "af-station-transfer",
        name: "Agra Fort Railway Station (AF) Transfer",
        distance_text: "~12–15 km",
        direction_note: "Doorstep pickup or drop at Agra Fort Railway Station",
        fleet_prices: { sedan: 800, ertiga: 900, "innova-crysta": 1100, "tempo-traveller": 2200, urbania: 3500 },
        night_charge_inr: 0,
        status: "published",
        is_active: true,
      },
      {
        id: "e0000000-0000-4000-a000-000000000003",
        route_code: "kheria-airport-transfer",
        name: "Agra Airport (Kheria AGR) Transfer",
        distance_text: "~15–25 km",
        direction_note: "Doorstep pickup or drop at Agra Kheria Airport",
        fleet_prices: { sedan: 900, ertiga: 1050, "innova-crysta": 1250, "tempo-traveller": 2400, urbania: 3800 },
        night_charge_inr: 0,
        status: "published",
        is_active: true,
      },
      {
        id: "e0000000-0000-4000-a000-000000000004",
        route_code: "delhi-igi-oneway-transfer",
        name: "Delhi IGI Airport (DEL) Direct Transfer (One-Way)",
        distance_text: "225 km",
        direction_note: "Direct expressway express transfer between Agra and Delhi IGI Airport",
        fleet_prices: { sedan: 3499, ertiga: 4200, "innova-crysta": 5200, "tempo-traveller": 8500, urbania: 11500 },
        night_charge_inr: 0,
        status: "published",
        is_active: true,
      },
    ];

    for (const t of transfers) {
      await client.query(
        `INSERT INTO transfer_routes (
          id, route_code, name, distance_text, direction_note,
          fleet_prices, use_per_km, night_charge_inr, status, is_active,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (route_code) DO UPDATE SET
          fleet_prices = EXCLUDED.fleet_prices,
          night_charge_inr = EXCLUDED.night_charge_inr,
          status = EXCLUDED.status,
          updated_at = NOW();`,
        [t.id, t.route_code, t.name, t.distance_text, t.direction_note, JSON.stringify(t.fleet_prices), t.night_charge_inr, t.status, t.is_active]
      );
      console.log(`  ✓ Seeded transfer route: ${t.name}`);
    }

    // 4. Local Sightseeing Packages
    const localPackages = [
      {
        id: "f0000000-0000-4000-a000-000000000001",
        package_code: "agra-standard-sightseeing",
        name: "Agra Standard Sightseeing (8 Hours / 80 Km)",
        duration_hours: 8,
        included_km: 80,
        covers: "Taj Mahal, Agra Fort, Mehtab Bagh, Itmad-Ud-Daulah (Baby Taj), Sadar Bazaar",
        parking_note: "Monument entry fees & parking billed at actuals",
        fleet_prices: { sedan: 1900, ertiga: 2600, "innova-crysta": 2850, "tempo-traveller": 5500, urbania: 7500 },
        extra_rates: {
          sedan: { per_km: 10, per_hr: 150 },
          ertiga: { per_km: 14, per_hr: 200 },
          "innova-crysta": { per_km: 18, per_hr: 250 },
          "tempo-traveller": { per_km: 25, per_hr: 400 },
          urbania: { per_km: 34, per_hr: 600 },
        },
        night_charge_inr: 0,
        status: "published",
        is_active: true,
      },
    ];

    for (const l of localPackages) {
      await client.query(
        `INSERT INTO local_sightseeing_packages (
          id, package_code, name, duration_hours, included_km, covers,
          parking_note, fleet_prices, use_per_km, extra_rates, night_charge_inr,
          status, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (package_code) DO UPDATE SET
          fleet_prices = EXCLUDED.fleet_prices,
          night_charge_inr = EXCLUDED.night_charge_inr,
          status = EXCLUDED.status,
          updated_at = NOW();`,
        [
          l.id,
          l.package_code,
          l.name,
          l.duration_hours,
          l.included_km,
          l.covers,
          l.parking_note,
          JSON.stringify(l.fleet_prices),
          JSON.stringify(l.extra_rates),
          l.night_charge_inr,
          l.status,
          l.is_active,
        ]
      );
      console.log(`  ✓ Seeded local sightseeing package: ${l.name}`);
    }

    // 5. Route Catalog (High Volume Corridors with Canonical Fleets)
    const routes = [
      {
        id: "c0000000-0000-4000-a000-000000000001",
        source_city: "Agra",
        destination_city: "Delhi",
        slug: "delhi-to-agra-one-way",
        trip_type: "one-way",
        distance_km: 210,
        duration_text: "3.5 hrs",
        fares_inr: { sedan: 2800, ertiga: 3600, "innova-crysta": 4600, "tempo-traveller": 7500, urbania: 10500 },
        available_fleets: ["sedan", "ertiga", "innova-crysta", "tempo-traveller", "urbania"],
        driver_charge_inr: 0,
        night_halt_inr: 0,
        toll_amount_inr: 0,
        min_km_per_day: 300,
        highway: "Yamuna Expressway",
        status: "published",
      },
      {
        id: "c0000000-0000-4000-a000-000000000002",
        source_city: "Agra",
        destination_city: "Jaipur",
        slug: "agra-to-jaipur-one-way",
        trip_type: "one-way",
        distance_km: 240,
        duration_text: "4 hrs",
        fares_inr: { sedan: 3400, ertiga: 4300, "innova-crysta": 5400, "tempo-traveller": 8500, urbania: 12000 },
        available_fleets: ["sedan", "ertiga", "innova-crysta", "tempo-traveller", "urbania"],
        driver_charge_inr: 0,
        night_halt_inr: 0,
        toll_amount_inr: 0,
        min_km_per_day: 300,
        highway: "NH 21",
        status: "published",
      },
    ];

    for (const r of routes) {
      await client.query(
        `INSERT INTO route_catalog (
          id, source_city, destination_city, slug, trip_type, distance_km,
          duration_text, fares_inr, available_fleets, driver_charge_inr,
          night_halt_inr, toll_amount_inr, min_km_per_day, highway,
          status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          fares_inr = EXCLUDED.fares_inr,
          available_fleets = EXCLUDED.available_fleets,
          status = EXCLUDED.status,
          updated_at = NOW();`,
        [
          r.id,
          r.source_city,
          r.destination_city,
          r.slug,
          r.trip_type,
          r.distance_km,
          r.duration_text,
          JSON.stringify(r.fares_inr),
          r.available_fleets,
          r.driver_charge_inr,
          r.night_halt_inr,
          r.toll_amount_inr,
          r.min_km_per_day,
          r.highway,
          r.status,
        ]
      );
      console.log(`  ✓ Seeded route: ${r.slug}`);
    }

    await client.query("COMMIT");
    console.log("✅ Canonical catalog seeded successfully with 0 legacy keys!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Canonical seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
