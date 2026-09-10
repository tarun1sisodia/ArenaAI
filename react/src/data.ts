import type { SupportedLanguage } from "@/config";

export type City = {
  id: string;
  name: string;
  code: string;
};

export type VehicleId = "sedan" | "ertiga" | "innova" | "tempo" | "urbania";
export type FareByVehicle = Record<VehicleId, number>;

export type Vehicle = {
  id: VehicleId;
  name: string;
  klass: string;
  seats: number;
  bags: number;
  ac: boolean;
  tags: readonly string[];
  blurb: string;
  perKm: number;
  rateRange: string;
  models: readonly string[];
  image: string;
  suitable: string;
};

export type Route = {
  id: string;
  from: string;
  to: string;
  km: number;
  duration: string;
  kind: "one-way" | "local";
  localLabel?: string;
  fares: FareByVehicle;
};

export type TourPackage = {
  id: string;
  slug: string;
  name: string;
  kicker: string;
  duration: string;
  from: number;
  image: string;
  places: readonly string[];
  blurb: string;
  includes: readonly string[];
  excludes: readonly string[];
};

export type AirportTransfer = {
  id: string;
  name: string;
  fares: FareByVehicle;
};

export type Service = {
  id: string;
  index: string;
  variant: "navy" | "light" | "gold";
  title: string;
  body: string;
  tags: readonly string[];
  href: string;
  cta: string;
};

export type Review = {
  name: string;
  place: string;
  rating: number;
  quote: string;
};

export type PromoCode = {
  discount: number;
  minTotal: number;
  desc: string;
};

export const cities: readonly City[] = [
  { id: "agra", name: "Agra", code: "AGR" },
  { id: "delhi", name: "Delhi", code: "DEL" },
  { id: "jaipur", name: "Jaipur", code: "JAI" },
  { id: "mathura", name: "Mathura", code: "MAT" },
  { id: "gwalior", name: "Gwalior", code: "GWL" },
  { id: "lucknow", name: "Lucknow", code: "LKO" },
];

export const vehicles: readonly Vehicle[] = [
  {
    id: "sedan",
    name: "Sedan",
    klass: "Dzire class",
    seats: 4,
    bags: 2,
    ac: true,
    tags: ["4+1 SEATS", "AC", "2 BAGS"],
    blurb: "Everyday comfort for city rides, Yamuna Expressway drops, and local sightseeing.",
    perKm: 10,
    rateRange: "₹10–₹12/km",
    models: ["Maruti Suzuki Dzire", "Toyota Etios", "Hyundai Aura", "Wagon R / Tiago (Hatchback ₹10/km)"],
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
    blurb: "A little more room for families without stepping up to a large SUV.",
    perKm: 14,
    rateRange: "₹14–₹16/km",
    models: ["Maruti Suzuki Ertiga", "Toyota Rumion", "Renault Triber"],
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
    blurb: "The outstation favourite — plush pushback seats, smooth suspension, and a quiet cabin.",
    perKm: 18,
    rateRange: "₹18–₹23/km",
    models: ["Toyota Innova Crysta", "Toyota Innova Hycross", "Toyota Fortuner VIP (₹35/km)"],
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
    blurb: "Spacious pushback seats, luggage bay, individual AC vents, and ice-box for group travel.",
    perKm: 25,
    rateRange: "₹22–₹34/km",
    models: ["9-Seater Maharaja", "12-Seater Standard", "16-Seater Executive", "20-Seater Deluxe", "26-Seater Tourer"],
    image: "/assets/fleet/tempo-480.webp",
    suitable: "Family tours, pilgrimage groups, 7–12 passengers",
  },
  {
    id: "urbania",
    name: "Urbania",
    klass: "Premium van",
    seats: 16,
    bags: 10,
    ac: true,
    tags: ["16 SEATS", "PREMIUM", "AC"],
    blurb: "Chauffeur-grade luxury executive travel with airplane-style cabin styling and sealed acoustics.",
    perKm: 34,
    rateRange: "₹34–₹38/km",
    models: ["Force Urbania 9-Seater VIP", "12-Seater Luxury Cabin", "17-Seater Royal Van"],
    image: "/assets/fleet/urbania-480.webp",
    suitable: "Wedding parties, corporate delegations, 13–16 passengers",
  },
];

export const routes: readonly Route[] = [
  { id: "agra-delhi", from: "agra", to: "delhi", km: 230, duration: "3h 30m", kind: "one-way", fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 } },
  { id: "agra-jaipur", from: "agra", to: "jaipur", km: 240, duration: "4h 30m", kind: "one-way", fares: { sedan: 3499, ertiga: 4999, innova: 6999, tempo: 11000, urbania: 16000 } },
  { id: "agra-mathura", from: "agra", to: "mathura", km: 55, duration: "1h 15m", kind: "one-way", fares: { sedan: 2200, ertiga: 2800, innova: 3800, tempo: 5500, urbania: 8000 } },
  { id: "agra-gwalior", from: "agra", to: "gwalior", km: 120, duration: "2h 30m", kind: "one-way", fares: { sedan: 3000, ertiga: 3800, innova: 5500, tempo: 7500, urbania: 11000 } },
  { id: "delhi-jaipur", from: "delhi", to: "jaipur", km: 270, duration: "5h", kind: "one-way", fares: { sedan: 5000, ertiga: 6200, innova: 8800, tempo: 12000, urbania: 17500 } },
  { id: "delhi-agra", from: "delhi", to: "agra", km: 230, duration: "3h 30m", kind: "one-way", fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 } },
  { id: "agra-lucknow", from: "agra", to: "lucknow", km: 335, duration: "6h", kind: "one-way", fares: { sedan: 7000, ertiga: 8500, innova: 12000, tempo: 16000, urbania: 22000 } },
  { id: "agra-local", from: "agra", to: "agra", km: 80, duration: "8h", kind: "local", localLabel: "Agra sightseeing (8h / 80km)", fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 } },
];

export const airportTransfers: readonly AirportTransfer[] = [
  { id: "agra-station", name: "Agra Cantt / Fort Railway Station Transfer", fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 } },
  { id: "agra-airport", name: "Agra Kheria Airport (AGR) Transfer", fares: { sedan: 900, ertiga: 1000, innova: 1250, tempo: 2500, urbania: 3800 } },
  { id: "delhi-airport", name: "Delhi IGI Airport (DEL) ⇄ Agra Express Transfer", fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 } },
];

export const packages: readonly TourPackage[] = [
  { id: "agra-day", slug: "agra-sightseeing", name: "Same Day Agra Taj Mahal Tour", kicker: "Same day", duration: "1 day", from: 3499, image: "/assets/packages/taj-dawn.webp", places: ["Taj Mahal", "Agra Fort", "Itimad-ud-Daulah (Baby Taj)", "Mehtab Bagh"], blurb: "One-day private guided tour covering all iconic Mughal monuments with doorstep hotel or station pickup.", includes: ["Private AC vehicle", "Professional chauffeur", "All tolls, parking & state tax", "Guide assistance", "Bottled water"], excludes: ["Monument tickets", "Meals"] },
  { id: "taj-sunrise", slug: "taj-mahal-sunrise-tour", name: "Taj Mahal Sunrise Tour", kicker: "Dawn special", duration: "1 day", from: 12999, image: "/assets/packages/taj-dawn.webp", places: ["Taj Mahal at Dawn", "Agra Fort", "Mehtab Bagh"], blurb: "Early 2:30 AM departure from Delhi to witness the breathtaking sunrise over the Taj Mahal before the crowds arrive.", includes: ["Dedicated luxury AC car", "Yamuna Expressway toll & taxes", "Sunrise guided entry", "Breakfast stop", "Agra Fort tour"], excludes: ["Monument tickets", "Personal expenses"] },
  { id: "mathura-vrindavan", slug: "mathura-vrindavan", name: "Mathura & Vrindavan Darshan", kicker: "Day trip", duration: "1 day", from: 4200, image: "/assets/packages/mathura.webp", places: ["Krishna Janmabhoomi", "Dwarkadhish Temple", "Prem Mandir", "Banke Bihari"], blurb: "A spiritual day trip timed around sacred temple aarti schedules, with a local driver who knows the temple lanes.", includes: ["AC vehicle with fuel", "Temple parking & waiting", "Driver allowance", "Pickup & drop"], excludes: ["Temple donations", "Meals", "Special VIP line passes"] },
  { id: "gatimaan-express", slug: "gatimaan-express-agra-tour", name: "Same Day Agra by Gatimaan Train", kicker: "Fast train", duration: "1 day", from: 14999, image: "/assets/packages/agra-fort.webp", places: ["Gatimaan Express (100 mins)", "Taj Mahal", "Agra Fort", "Buffet Lunch"], blurb: "Travel on India's premier high-speed train from Delhi to Agra in 100 minutes. Includes train tickets, private AC car in Agra, and lunch.", includes: ["Roundtrip Gatimaan train tickets", "Delhi station transfers", "Private AC car in Agra", "Approved guide", "Buffet lunch"], excludes: ["Personal shopping", "Alcoholic beverages"] },
  { id: "agra-fort-day", slug: "agra-unhurried", name: "Agra Overnight Experience", kicker: "2 days", duration: "2 days / 1 night", from: 7800, image: "/assets/packages/agra-fort.webp", places: ["Taj Mahal Dawn", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh Sunset"], blurb: "Stay overnight in Agra to capture sunset at Mehtab Bagh and sunrise at the Taj, with an excursion to royal Fatehpur Sikri.", includes: ["AC vehicle for 2 full days", "Driver overnight allowance", "Tolls & parking", "Fatehpur Sikri trip"], excludes: ["Hotel stay", "Monument entry tickets", "Meals"] },
  { id: "golden-triangle", slug: "golden-triangle", name: "Golden Triangle Tour", kicker: "3 days", duration: "3 days / 2 nights", from: 18500, image: "/assets/packages/golden-triangle.webp", places: ["Delhi", "Agra", "Fatehpur Sikri", "Jaipur"], blurb: "The iconic North India circuit — chauffeured, perfectly paced, and timed so monuments have breathing room.", includes: ["Dedicated AC car for 3 days", "Driver stay & fuel", "All interstate taxes & tolls", "Hotel pickups"], excludes: ["Hotels", "Monument tickets", "Meals"] },
];

export const services: readonly Service[] = [
  { id: "taxi", index: "01", variant: "navy", title: "Taxi / Cab", body: "Sedan, Ertiga and Innova Crysta for city rides and intercity drops.", tags: ["SEDAN", "ERTIGA", "INNOVA"], href: "/en/fleet/", cta: "Choose a vehicle" },
  { id: "tempo", index: "02", variant: "light", title: "Tempo Traveller", body: "Comfortable group travel, from 12 seats to a premium Urbania.", tags: ["12+1", "16 SEAT"], href: "/en/vehicles/tempo-traveller/", cta: "View vehicles" },
  { id: "tours", index: "03", variant: "gold", title: "Tour packages", body: "Local sightseeing, one-way drops and ready-made multi-day itineraries.", tags: ["TAJ", "3-DAY"], href: "/en/packages/", cta: "Explore tours" },
  { id: "airport", index: "04", variant: "light", title: "Airport & station", body: "Timed pickups for Delhi Airport, Agra Cantt and the Gatimaan.", tags: ["DEL AIRPORT", "STATION"], href: "/book.html?route=delhi-agra", cta: "Book a transfer" },
];

export const reviews: readonly Review[] = [
  { name: "Priya S.", place: "Delhi", rating: 5, quote: "The Agra drop was on time and the sedan was spotless. Fare matched what we saw on the site." },
  { name: "James W.", place: "London", rating: 5, quote: "Sunrise at the Taj without the scramble. Driver Rakesh knew every gate and every queue." },
  { name: "Ankit M.", place: "Jaipur", rating: 5, quote: "Booked an Innova for the family. Transparent advance, GST invoice the same evening." },
  { name: "Meera K.", place: "Lucknow", rating: 4.9, quote: "Tempo Traveller for a wedding party — ice-box, luggage bay, and a calm driver." },
];

export const promoCodes: Readonly<Record<string, PromoCode>> = {
  ASTTCAR500OFF: { discount: 500, minTotal: 2000, desc: "Flat ₹500 OFF on car bookings" },
};

export const trustSignals = [
  "GOVT-REGISTERED FLEET",
  "VERIFIED DRIVERS",
  "GST INVOICE",
  "4.9/5 · 380+ TRIPS",
  "24×7 ON-ROUTE SUPPORT",
] as const;

export type LocalizedValue = Record<SupportedLanguage, string>;
