/* Mock catalogue for the SK Baghel frontend. Nothing here hits a server.
   NAP/contact data is single-sourced in scripts/catalog.py and delivered as
   js/contact.js (generated) — do not re-add a SKB.contact block here. */
window.SKB = window.SKB || {};

// Relative base to site root, set by the build per page (".", "../..", …).
const BASE = (document.body && document.body.dataset.base) || ".";

SKB.cities = [
  { id: "agra", name: "Agra", code: "AGR" },
  { id: "delhi", name: "Delhi", code: "DEL" },
  { id: "jaipur", name: "Jaipur", code: "JAI" },
  { id: "mathura", name: "Mathura", code: "MAT" },
  { id: "gwalior", name: "Gwalior", code: "GWL" },
  { id: "lucknow", name: "Lucknow", code: "LKO" },
];

SKB.vehicles = [
  {
    id: "sedan",
    name: "Sedan",
    klass: "Dzire class",
    seats: 4,
    bags: 2,
    ac: true,
    tags: ["4+1 SEATS", "AC", "2 BAGS"],
    blurb: "Everyday comfort for city rides and one-way drops.",
    perKm: 12,
    image: "/assets/fleet/sedan-480.webp",
    suitable: "Couples, airport transfers, 1–4 passengers",
  },
  {
    id: "ertiga",
    name: "Ertiga",
    klass: "6+1 MPV",
    seats: 6,
    bags: 3,
    ac: true,
    tags: ["6+1 SEATS", "AC", "3 BAGS"],
    blurb: "A little more room for families without stepping up to an SUV.",
    perKm: 14,
    image: "/assets/fleet/ertiga-480.webp",
    suitable: "Families, 5–6 passengers",
  },
  {
    id: "innova",
    name: "Innova Crysta",
    klass: "6+1 SUV",
    seats: 6,
    bags: 4,
    ac: true,
    tags: ["6+1 SEATS", "AC", "4 BAGS"],
    blurb: "The outstation favourite — pushback seats and a quiet cabin.",
    perKm: 18,
    image: "/assets/fleet/innova-480.webp",
    suitable: "Longer routes, elders, 4–6 passengers",
  },
  {
    id: "tempo",
    name: "Tempo Traveller",
    klass: "12–17 seater",
    seats: 12,
    bags: 8,
    ac: true,
    tags: ["12+1 SEATS", "AC", "LUGGAGE BAY"],
    blurb: "Spacious pushback seats, luggage bay and ice-box for group travel.",
    perKm: 22,
    image: "/assets/fleet/tempo-480.webp",
    suitable: "Family tours, 7–12 passengers",
  },
  {
    id: "urbania",
    name: "Urbania",
    klass: "Premium van",
    seats: 16,
    bags: 10,
    ac: true,
    tags: ["16 SEATS", "PREMIUM", "AC"],
    blurb: "Chauffeur-grade group travel when the occasion asks for more.",
    perKm: 28,
    image: "/assets/fleet/urbania-480.webp",
    suitable: "Wedding parties, corporate, 13–16 passengers",
  },
];

SKB.routes = [
  {
    id: "agra-delhi",
    from: "agra",
    to: "delhi",
    km: 230,
    duration: "3h 30m",
    kind: "one-way",
    fares: { sedan: 3500, ertiga: 4500, innova: 7000, tempo: 9500, urbania: 14000 },
  },
  {
    id: "agra-jaipur",
    from: "agra",
    to: "jaipur",
    km: 240,
    duration: "4h 30m",
    kind: "one-way",
    fares: { sedan: 4500, ertiga: 5500, innova: 8000, tempo: 11000, urbania: 16000 },
  },
  {
    id: "agra-mathura",
    from: "agra",
    to: "mathura",
    km: 55,
    duration: "1h 15m",
    kind: "one-way",
    fares: { sedan: 2200, ertiga: 2800, innova: 3800, tempo: 5500, urbania: 8000 },
  },
  {
    id: "agra-gwalior",
    from: "agra",
    to: "gwalior",
    km: 120,
    duration: "2h 30m",
    kind: "one-way",
    fares: { sedan: 3000, ertiga: 3800, innova: 5500, tempo: 7500, urbania: 11000 },
  },
  {
    id: "delhi-jaipur",
    from: "delhi",
    to: "jaipur",
    km: 270,
    duration: "5h",
    kind: "one-way",
    fares: { sedan: 5000, ertiga: 6200, innova: 8800, tempo: 12000, urbania: 17500 },
  },
  {
    id: "delhi-agra",
    from: "delhi",
    to: "agra",
    km: 230,
    duration: "3h 30m",
    kind: "one-way",
    fares: { sedan: 3500, ertiga: 4500, innova: 7000, tempo: 9500, urbania: 14000 },
  },
  {
    id: "agra-lucknow",
    from: "agra",
    to: "lucknow",
    km: 335,
    duration: "6h",
    kind: "one-way",
    fares: { sedan: 7000, ertiga: 8500, innova: 12000, tempo: 16000, urbania: 22000 },
  },
  {
    id: "agra-local",
    from: "agra",
    to: "agra",
    km: 80,
    duration: "8h",
    kind: "local",
    localLabel: "Agra sightseeing",
    fares: { sedan: 3500, ertiga: 4500, innova: 6500, tempo: 8500, urbania: 12000 },
  },
];

SKB.packages = [
  {
    id: "agra-day",
    name: "Agra sightseeing",
    kicker: "Same day",
    duration: "1 day",
    from: 3500,
    image: "/assets/packages/taj-dawn.webp",
    places: ["Taj Mahal", "Agra Fort", "Mehtab Bagh"],
    blurb: "One day. The icons of Agra. A comfortable way to take in the city with a local team.",
    includes: ["AC vehicle", "Driver allowance", "Parking & tolls", "Hotel / station pickup"],
    excludes: ["Monument tickets", "Meals", "Guide"],
  },
  {
    id: "golden-triangle",
    name: "Golden Triangle",
    kicker: "3 days",
    duration: "3 days / 2 nights",
    from: 18500,
    image: "/assets/packages/golden-triangle.webp",
    places: ["Delhi", "Agra", "Jaipur"],
    blurb: "The classic North India loop — timed, chauffeured, and paced so the monuments have room to breathe.",
    includes: ["AC Innova or similar", "Driver + fuel", "Toll, parking, state tax", "Hotel pickup"],
    excludes: ["Hotels", "Monument tickets", "Meals"],
  },
  {
    id: "mathura-vrindavan",
    name: "Mathura & Vrindavan",
    kicker: "Day trip",
    duration: "1 day",
    from: 4200,
    image: "/assets/packages/mathura.webp",
    places: ["Krishna Janmabhoomi", "Prem Mandir", "Banke Bihari"],
    blurb: "A reverent day on the Yamuna — timed around aarti, with a driver who knows the lanes.",
    includes: ["AC vehicle", "Waiting charges", "Parking"],
    excludes: ["Temple donations", "Meals", "Guide"],
  },
  {
    id: "agra-fort-day",
    name: "Agra, unhurried",
    kicker: "2 days",
    duration: "2 days / 1 night",
    from: 7800,
    image: "/assets/packages/agra-fort.webp",
    places: ["Taj Mahal dawn", "Agra Fort", "Itimad-ud-Daulah", "Mehtab Bagh"],
    blurb: "Stay overnight so the Taj is yours at sunrise, then the rest of the city at a human pace.",
    includes: ["AC vehicle both days", "Driver allowance", "Parking & tolls"],
    excludes: ["Hotel", "Tickets", "Meals"],
  },
];

SKB.services = [
  {
    id: "taxi",
    index: "01",
    variant: "navy",
    title: "Taxi <i>/ Cab</i>",
    body: "Sedan, Ertiga and Innova Crysta for city rides and intercity drops.",
    tags: ["SEDAN", "ERTIGA", "INNOVA"],
    href: "/en/fleet/",
    cta: "Choose a vehicle",
  },
  {
    id: "tempo",
    index: "02",
    variant: "light",
    title: "Tempo<br /><i>Traveller</i>",
    body: "Comfortable group travel, from 12 seats to a premium Urbania.",
    tags: ["12+1", "16 SEAT"],
    href: "/en/vehicles/tempo-traveller/",
    cta: "View vehicles",
  },
  {
    id: "tours",
    index: "03",
    variant: "gold",
    title: "Tour<br /><i>packages</i>",
    body: "Local sightseeing, one-way drops and ready-made multi-day itineraries.",
    tags: ["TAJ", "3-DAY"],
    href: "/en/packages/",
    cta: "Explore tours",
  },
  {
    id: "airport",
    index: "04",
    variant: "light",
    title: "Airport <i>&amp; station</i>",
    body: "Timed pickups for Delhi Airport, Agra Cantt and the Gatimaan.",
    tags: ["DEL AIRPORT", "STATION"],
    href: "book.html?route=delhi-agra",
    cta: "Book a transfer",
  },
];

SKB.reviews = [
  { name: "Priya S.", place: "Delhi", rating: 5, quote: "The Agra drop was on time and the sedan was spotless. Fare matched what we saw on the site." },
  { name: "James W.", place: "London", rating: 5, quote: "Sunrise at the Taj without the scramble. Driver Rakesh knew every gate and every queue." },
  { name: "Ankit M.", place: "Jaipur", rating: 5, quote: "Booked an Innova for the family. Transparent advance, GST invoice the same evening." },
  { name: "Meera K.", place: "Lucknow", rating: 4.9, quote: "Tempo Traveller for a wedding party — ice-box, luggage bay, and a calm driver." },
];

SKB.trust = [
  "GOVT-REGISTERED FLEET",
  "VERIFIED DRIVERS",
  "GST INVOICE",
  "4.9/5 · 380+ TRIPS",
  "24×7 ON-ROUTE SUPPORT",
];

// FAQs are single-sourced in scripts/render_pages.py (FAQ page + JSON-LD).
// The unused SKB.faqs copy was removed to stop the two lists drifting.


// Rewrite root-relative asset/link paths to page-relative using data-base
// (".", "../..", …) so one build works under any hosting base path.
{
  const joinBase = (p) => BASE.replace(/\/?$/, "/") + p.replace(/^\/+/, "");
  SKB.vehicles.forEach((v) => {
    if (v.image.startsWith("/")) v.image = joinBase(v.image);
  });
  SKB.packages.forEach((p) => {
    if (p.image.startsWith("/")) p.image = joinBase(p.image);
  });
  SKB.services.forEach((s) => {
    if (s.href && s.href.startsWith("/")) s.href = joinBase(s.href);
  });
}
