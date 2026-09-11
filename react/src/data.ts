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

export type RouteGuidanceItem = {
  highway: string;
  transitTime: string;
  departureTip: Record<SupportedLanguage, string>;
  restStops: Record<SupportedLanguage, string>;
  tollTaxPolicy: Record<SupportedLanguage, string>;
};

export type TourItineraryStop = {
  time: string;
  title: Record<SupportedLanguage, string>;
  desc: Record<SupportedLanguage, string>;
};

export type VehicleUpgrade = {
  vehId: VehicleId;
  name: Record<SupportedLanguage, string>;
  seats: string;
  price: number;
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
  timeline?: readonly TourItineraryStop[];
  upgrades?: readonly VehicleUpgrade[];
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
  role?: string;
  avatar?: string;
  date?: string;
};

export type PromoCode = {
  discount: number;
  minTotal: number;
  desc: string;
};

export type TourCancellationSlab = {
  days: string;
  fee: string;
  refund: string;
};

export type FaqItem = {
  category: "booking" | "fares" | "outstation" | "night" | "cancellation" | "pet" | "intercity";
  question: Record<SupportedLanguage, string>;
  answer: Record<SupportedLanguage, string>;
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
  { id: "delhi-agra", from: "delhi", to: "agra", km: 230, duration: "3h 30m", kind: "one-way", fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 } },
  { id: "agra-jaipur", from: "agra", to: "jaipur", km: 240, duration: "4h 30m", kind: "one-way", fares: { sedan: 3499, ertiga: 4999, innova: 6999, tempo: 11000, urbania: 16000 } },
  { id: "agra-mathura", from: "agra", to: "mathura", km: 55, duration: "1h 15m", kind: "one-way", fares: { sedan: 2200, ertiga: 2800, innova: 3800, tempo: 5500, urbania: 8000 } },
  { id: "agra-gwalior", from: "agra", to: "gwalior", km: 120, duration: "2h 30m", kind: "one-way", fares: { sedan: 3000, ertiga: 3800, innova: 5500, tempo: 7500, urbania: 11000 } },
  { id: "delhi-jaipur", from: "delhi", to: "jaipur", km: 270, duration: "5h", kind: "one-way", fares: { sedan: 5000, ertiga: 6200, innova: 8800, tempo: 12000, urbania: 17500 } },
  { id: "agra-lucknow", from: "agra", to: "lucknow", km: 335, duration: "6h", kind: "one-way", fares: { sedan: 7000, ertiga: 8500, innova: 12000, tempo: 16000, urbania: 22000 } },
  { id: "agra-local", from: "agra", to: "agra", km: 80, duration: "8h", kind: "local", localLabel: "Agra sightseeing (8h / 80km)", fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 } },
];

export const routeGuidance: Readonly<Record<string, RouteGuidanceItem>> = {
  "agra-delhi": {
    highway: "Yamuna Expressway (6-Lane Access-Controlled)",
    transitTime: "3h 30m (230 km)",
    departureTip: {
      en: "Early morning (05:00–07:00 AM) or mid-afternoon (01:00–03:00 PM) to avoid Delhi NCR peak rush hour.",
      hi: "दिल्ली एनसीआर के पीक ट्रैफिक से बचने के लिए सुबह जल्दी (05:00–07:00 AM) या दोपहर 1:00 से 3:00 बजे निकलना उत्तम रहता है।",
    },
    restStops: {
      en: "Jewar Toll Plaza & Tappal Plaza (Costa Coffee, Haldiram's, Subway, clean sanitised rest areas).",
      hi: "जेवर टोल प्लाजा व टप्पल प्लाजा फूड कोर्ट (हल्दीराम, सबवे, कोस्टा कॉफी व स्वच्छ वॉशरूम)।",
    },
    tollTaxPolicy: {
      en: "One-way booking includes Yamuna Expressway toll. Round-trip tolls and state permits charged at actuals.",
      hi: "वन-वे बुकिंग में यमुना एक्सप्रेसवे टोल शामिल है। राउंड-ट्रिप में टोल व स्टेट टैक्स वास्तविक पर्ची अनुसार।",
    },
  },
  "delhi-agra": {
    highway: "Yamuna Expressway (via Noida / Greater Noida)",
    transitTime: "3h 30m (230 km)",
    departureTip: {
      en: "06:00 AM departure from Delhi gets you to the Taj Mahal ticket gate by 09:30 AM before peak tourist crowds.",
      hi: "दिल्ली से सुबह 6:00 बजे निकलने पर आप सुबह 9:30 बजे तक ताज महल पहुँच सकते हैं, भीड़ से पहले।",
    },
    restStops: {
      en: "Food courts at KM 64 and KM 118 on Yamuna Expressway with hygienic breakfast options.",
      hi: "यमुना एक्सप्रेसवे पर किमी 64 और किमी 118 पर स्वच्छ रेस्टोरेंट व ब्रेकफास्ट सुविधा।",
    },
    tollTaxPolicy: {
      en: "One-way fare is 100% all-inclusive (expressway toll & driver allowance included).",
      hi: "वन-वे किराया पूरी तरह ऑल-इनक्लूसिव है (एक्सप्रेसवे टोल व ड्राइवर चार्ज शामिल)।",
    },
  },
  "agra-jaipur": {
    highway: "National Highway 21 (Agra–Bikaner Highway)",
    transitTime: "4h 30m (240 km)",
    departureTip: {
      en: "Depart by 07:30 AM with an optional 1.5-hour stop at UNESCO World Heritage Fatehpur Sikri en route.",
      hi: "सुबह 7:30 बजे प्रस्थान करें, रास्ते में विश्व धरोहर फतेहपुर सीकरी का 1.5 घंटे का स्टॉप ले सकते हैं।",
    },
    restStops: {
      en: "Midway restaurants near Bharatpur and Mahwa Highway Treat with pure vegetarian Rajasthani thalis.",
      hi: "भरतपुर और महवा के पास हाईवे डाइनिंग (शुद्ध शाकाहारी भोजन व जलपान)।",
    },
    tollTaxPolicy: {
      en: "NH-21 highway toll included in one-way fare. Rajasthan state tax is separate on round trips.",
      hi: "वन-वे किराये में हाईवे टोल शामिल। राउंड-ट्रिप पर राजस्थान राज्य प्रवेश कर अलग से देय।",
    },
  },
  "agra-mathura": {
    highway: "NH-19 / Delhi–Agra Highway",
    transitTime: "1h 15m (55 km)",
    departureTip: {
      en: "Plan your trip around temple aarti times: Morning (07:00–11:00 AM) or Evening (04:30–08:30 PM).",
      hi: "मंदिरों के पट खुलने व आरती के समय अनुसार यात्रा करें: सुबह 7 से 11 या शाम 4:30 से 8:30 बजे।",
    },
    restStops: {
      en: "Famous Brijwasi sweets and Highway Masala Dosa hubs along the Farah–Mathura stretch.",
      hi: "मथुरा मार्ग पर प्रसिद्ध ब्रजवासी मिष्ठान और हाईवे रेस्टोरेंट।",
    },
    tollTaxPolicy: {
      en: "Local toll and temple area parking assistance included in package.",
      hi: "लोकल टोल और मंदिर परिसर पार्किंग सहायता किराये में शामिल।",
    },
  },
  "agra-gwalior": {
    highway: "National Highway 44 (North–South Corridor)",
    transitTime: "2h 30m (120 km)",
    departureTip: {
      en: "Early morning departure recommended for scenic crossing of the Chambal river valley.",
      hi: "चंबल नदी घाटी के खूबसूरत नज़ारे देखने के लिए सुबह जल्दी प्रस्थान करें।",
    },
    restStops: {
      en: "Morena roadside dhabas famous for Gajak and North Indian breakfast.",
      hi: "मुरैना के पास प्रसिद्ध गज़क और स्वादिष्ट नाश्ते के ढाबे।",
    },
    tollTaxPolicy: {
      en: "Includes toll taxes. MP state commercial tax separate on outstation trips.",
      hi: "टोल टैक्स शामिल। आउटस्टेशन ट्रिप पर मध्य प्रदेश स्टेट टैक्स अलग से देय।",
    },
  },
  "delhi-jaipur": {
    highway: "Delhi–Mumbai Expressway (NE-4) / NH-48",
    transitTime: "4h 30m (270 km)",
    departureTip: {
      en: "Use the new Delhi–Mumbai Expressway via Sohna for ultra-smooth 120 km/h driving experience.",
      hi: "सोहना होकर नए दिल्ली-मुंबई एक्सप्रेसवे का उपयोग करें — तीव्र व आरामदायक सफर।",
    },
    restStops: {
      en: "Modern wayside amenities along NE-4 every 50 km with EV charging, McDonald's, and restrooms.",
      hi: "एक्सप्रेसवे पर प्रत्येक 50 किमी पर आधुनिक फूड प्लाजा व स्वच्छ विश्राम स्थल।",
    },
    tollTaxPolicy: {
      en: "Expressway toll included in one-way fare. Round trip subject to 300 km/day minimum billing.",
      hi: "वन-वे किराये में एक्सप्रेसवे टोल शामिल। राउंड ट्रिप 300 किमी/दिन की न्यूनतम दर पर।",
    },
  },
  "agra-lucknow": {
    highway: "Agra–Lucknow Expressway (6-Lane Greenfield)",
    transitTime: "5h 15m (335 km)",
    departureTip: {
      en: "Non-stop 100 km/h cruising. Ensure vehicle tyre pressure is checked before entering expressway.",
      hi: "100 किमी/घंटा की निर्बाध गति। एक्सप्रेसवे पर चढ़ने से पहले टायर प्रेशर अवश्य चेक करें।",
    },
    restStops: {
      en: "Official UPEIDA wayside food courts at Firozabad, Kannauj, and Saifai.",
      hi: "फिरोजाबाद, कन्नौज और सैफई पर आधिकारिक यूपीडा (UPEIDA) फूड प्लाजा।",
    },
    tollTaxPolicy: {
      en: "Expressway toll included for one-way journeys.",
      hi: "वन-वे यात्रा के लिए एक्सप्रेसवे टोल शामिल।",
    },
  },
  "agra-local": {
    highway: "Agra City Circuit & Fatehabad Road",
    transitTime: "8 Hours / 80 Kilometers",
    departureTip: {
      en: "Start by 08:30 AM at Taj Mahal East Gate, followed by Agra Fort, Baby Taj, and sunset at Mehtab Bagh.",
      hi: "सुबह 8:30 बजे ताज महल ईस्ट गेट से शुरुआत करें, फिर आगरा किला, बेबी ताज और मेहताब बाग सूर्यास्त।",
    },
    restStops: {
      en: "Pinch of Spice, Dasaprakash, and Joney's Place for lunch; Sadar Bazaar for evening tea.",
      hi: "फतेहाबाद रोड पर प्रसिद्ध रेस्टोरेंट (पिंच ऑफ स्पाइस आदि) और सदर बाजार में शाम की चाय।",
    },
    tollTaxPolicy: {
      en: "Includes fuel, driver allowance, and city parking. Extra km at ₹11/km (sedan) and extra hr at ₹150/hr.",
      hi: "ईंधन, ड्राइवर भत्ता व पार्किंग शामिल। अतिरिक्त किमी ₹11/किमी और अतिरिक्त घंटा ₹150/घंटा।",
    },
  },
};

export const airportTransfers: readonly AirportTransfer[] = [
  { id: "agra-station", name: "Agra Cantt / Fort Railway Station Transfer", fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 } },
  { id: "agra-airport", name: "Agra Kheria Airport (AGR) Transfer", fares: { sedan: 900, ertiga: 1000, innova: 1250, tempo: 2500, urbania: 3800 } },
  { id: "delhi-airport", name: "Delhi IGI Airport (DEL) ⇄ Agra Express Transfer", fares: { sedan: 3499, ertiga: 4499, innova: 6499, tempo: 9500, urbania: 14000 } },
];

export const packages: readonly TourPackage[] = [
  {
    id: "agra-day",
    slug: "agra-sightseeing",
    name: "Same Day Agra Taj Mahal Tour",
    kicker: "Same day",
    duration: "1 day",
    from: 3499,
    image: "/assets/packages/taj-dawn.webp",
    places: ["Taj Mahal", "Agra Fort", "Itimad-ud-Daulah (Baby Taj)", "Mehtab Bagh"],
    blurb: "One-day private guided tour covering all iconic Mughal monuments with doorstep hotel or station pickup.",
    includes: ["Private AC vehicle", "Professional chauffeur", "All tolls, parking & state tax", "Guide assistance", "Bottled water"],
    excludes: ["Monument tickets", "Meals"],
    timeline: [
      { time: "06:00 AM", title: { en: "Doorstep Pickup", hi: "होटल अथवा निवास से पिकअप" }, desc: { en: "Chauffeur arrives at your hotel or residence in Delhi NCR / Agra.", hi: "दिल्ली एनसीआर या आगरा में आपके होटल से आरामदायक प्रस्थान।" } },
      { time: "09:30 AM", title: { en: "Taj Mahal Guided Visit", hi: "ताजमहल दर्शन" }, desc: { en: "Explore the UNESCO World Heritage marble mausoleum with historical insights.", hi: "विश्व प्रसिद्ध ताजमहल का विस्तृत व शांत भ्रमण।" } },
      { time: "01:00 PM", title: { en: "Mughal Buffet Lunch", hi: "लंच ब्रेक" }, desc: { en: "Relaxed lunch at a verified multi-cuisine restaurant.", hi: "स्वच्छ व प्रामाणिक रेस्टोरेंट में दोपहर का भोजन।" } },
      { time: "02:30 PM", title: { en: "Agra Fort & Baby Taj", hi: "आगरा किला व एत्मादुद्दौला" }, desc: { en: "Visit the red sandstone fort and the intricate jewel-box tomb.", hi: "भव्य लाल बलुआ पत्थर के किले व खूबसूरत नक्काशीदार मकबरे का दौरा।" } },
      { time: "05:30 PM", title: { en: "Mehtab Bagh Sunset & Drop", hi: "मेहताब बाग सूर्यास्त व वापसी" }, desc: { en: "Catch sunset reflections across the Yamuna before return drop.", hi: "यमुना पार से ताज का सूर्यास्त दर्शन और वापसी।" } },
    ],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "सेडान (डिज़ायर / इटियोस)" }, seats: "4+1", price: 3499 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "अर्टिगा एमपीवी (6+1)" }, seats: "6+1", price: 4499 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "इनोवा क्रिस्टा (6+1)" }, seats: "6+1", price: 6499 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "टेम्पो ट्रैवलर (12-सीटर)" }, seats: "12+1", price: 9500 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "फ़ोर्स अर्बनिया लग्जरी वैन" }, seats: "10+1", price: 14000 },
    ],
  },
  {
    id: "taj-sunrise",
    slug: "taj-mahal-sunrise-tour",
    name: "Taj Mahal Sunrise Tour",
    kicker: "Dawn special",
    duration: "1 day",
    from: 12999,
    image: "/assets/packages/taj-dawn.webp",
    places: ["Taj Mahal at Dawn", "Agra Fort", "Mehtab Bagh"],
    blurb: "Early 2:30 AM departure from Delhi to witness the breathtaking sunrise over the Taj Mahal before the crowds arrive.",
    includes: ["Dedicated luxury AC car", "Yamuna Expressway toll & taxes", "Sunrise guided entry", "Breakfast stop", "Agra Fort tour"],
    excludes: ["Monument tickets", "Personal expenses"],
  },
  {
    id: "mathura-vrindavan",
    slug: "mathura-vrindavan",
    name: "Mathura & Vrindavan Darshan",
    kicker: "Day trip",
    duration: "1 day",
    from: 4200,
    image: "/assets/packages/mathura.webp",
    places: ["Krishna Janmabhoomi", "Dwarkadhish Temple", "Prem Mandir", "Banke Bihari"],
    blurb: "A spiritual day trip timed around sacred temple aarti schedules, with a local driver who knows the temple lanes.",
    includes: ["AC vehicle with fuel", "Temple parking & waiting", "Driver allowance", "Pickup & drop"],
    excludes: ["Temple donations", "Meals", "Special VIP line passes"],
  },
  {
    id: "gatimaan-express",
    slug: "gatimaan-express-agra-tour",
    name: "Same Day Agra by Gatimaan Train",
    kicker: "Fast train",
    duration: "1 day",
    from: 14999,
    image: "/assets/packages/agra-fort.webp",
    places: ["Gatimaan Express (100 mins)", "Taj Mahal", "Agra Fort", "Buffet Lunch"],
    blurb: "Travel on India's premier high-speed train from Delhi to Agra in 100 minutes. Includes train tickets, private AC car in Agra, and lunch.",
    includes: ["Roundtrip Gatimaan train tickets", "Delhi station transfers", "Private AC car in Agra", "Approved guide", "Buffet lunch"],
    excludes: ["Personal shopping", "Alcoholic beverages"],
  },
  {
    id: "agra-fort-day",
    slug: "agra-unhurried",
    name: "Agra Overnight Experience",
    kicker: "2 days",
    duration: "2 days / 1 night",
    from: 7800,
    image: "/assets/packages/agra-fort.webp",
    places: ["Taj Mahal Dawn", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh Sunset"],
    blurb: "Stay overnight in Agra to capture sunset at Mehtab Bagh and sunrise at the Taj, with an excursion to royal Fatehpur Sikri.",
    includes: ["AC vehicle for 2 full days", "Driver overnight allowance", "Tolls & parking", "Fatehpur Sikri trip"],
    excludes: ["Hotel stay", "Monument entry tickets", "Meals"],
  },
  {
    id: "golden-triangle",
    slug: "golden-triangle",
    name: "Golden Triangle Tour",
    kicker: "3 days",
    duration: "3 days / 2 nights",
    from: 18500,
    image: "/assets/packages/golden-triangle.webp",
    places: ["Delhi", "Agra", "Fatehpur Sikri", "Jaipur"],
    blurb: "The iconic North India circuit — chauffeured, perfectly paced, and timed so monuments have breathing room.",
    includes: ["Dedicated AC car for 3 days", "Driver stay & fuel", "All interstate taxes & tolls", "Hotel pickups"],
    excludes: ["Hotels", "Monument tickets", "Meals"],
    upgrades: [
      { vehId: "sedan", name: { en: "Sedan (Dzire / Etios)", hi: "सेडान (डिज़ायर / इटियोस)" }, seats: "4+1", price: 18500 },
      { vehId: "ertiga", name: { en: "Ertiga MPV (6+1)", hi: "अर्टिगा एमपीवी (6+1)" }, seats: "6+1", price: 22500 },
      { vehId: "innova", name: { en: "Innova Crysta (6+1)", hi: "इनोवा क्रिस्टा (6+1)" }, seats: "6+1", price: 27500 },
      { vehId: "tempo", name: { en: "Tempo Traveller (12-Seater)", hi: "टेम्पो ट्रैवलर (12-सीटर)" }, seats: "12+1", price: 36500 },
      { vehId: "urbania", name: { en: "Force Urbania Luxury Van", hi: "फ़ोर्स अर्बनिया लग्जरी वैन" }, seats: "10+1", price: 45000 },
    ],
  },
];

export const services: readonly Service[] = [
  {
    id: "oneway",
    index: "01",
    variant: "navy",
    title: "One-Way Outstation Drop",
    body: "Point-to-point intercity drops on expressway corridors. Verified fixed fares, no hidden return charges.",
    tags: ["DELHI ₹3,499", "JAIPUR ₹3,499", "EXPRESSWAY"],
    href: "/en/routes/",
    cta: "View all routes",
  },
  {
    id: "roundtrip",
    index: "02",
    variant: "light",
    title: "Outstation Round-Trip",
    body: "Multi-day chauffeured outstation travel. Transparent 300 km/day billing with clean cars and verified drivers.",
    tags: ["MIN 300 KM/DAY", "ALL INDIA PERMIT"],
    href: "/en/routes/",
    cta: "Calculate round-trip",
  },
  {
    id: "local",
    index: "03",
    variant: "gold",
    title: "Local Sightseeing & City Tours",
    body: "Dedicated 8 Hours / 80 KM and 12 Hours / 120 KM sightseeing packages covering Taj Mahal, Agra Fort, and Mehtab Bagh.",
    tags: ["8H / 80KM ₹1,900", "12H / 120KM ₹2,200"],
    href: "/en/packages/",
    cta: "Explore city tours",
  },
  {
    id: "airport",
    index: "04",
    variant: "light",
    title: "Airport & Station Transfers",
    body: "Reliable, on-time pickups for Delhi IGI Airport, Agra Cantt, Agra Airport, and Gatimaan Express arrivals.",
    tags: ["AGRA CANTT ₹800", "DELHI AIRPORT ₹3,499"],
    href: "/en/fleet/",
    cta: "Book a transfer",
  },
  {
    id: "tempo",
    index: "05",
    variant: "navy",
    title: "Tempo Traveller & Urbania",
    body: "Spacious group travel from 9 to 26 seats with individual AC vents, pushback seats, and ample luggage bays.",
    tags: ["9–26 SEATER", "LUXURY URBANIA"],
    href: "/en/fleet/",
    cta: "Explore group fleet",
  },
  {
    id: "tours",
    index: "06",
    variant: "gold",
    title: "Curated Tour Packages",
    body: "Handcrafted same-day and multi-day heritage circuits including Sunrise Taj, Mathura-Vrindavan, and Golden Triangle.",
    tags: ["SAME DAY ₹3,499", "GOLDEN TRIANGLE ₹18,500"],
    href: "/en/packages/",
    cta: "View all packages",
  },
];

export type AgraMonument = {
  id: string;
  name: string;
  location: string;
  timings: string;
  builtBy: string;
  builtIn: string;
  blurb: Record<SupportedLanguage, string>;
};

export type TouristDestination = {
  id: string;
  name: string;
  state: string;
  distanceKm: number;
  tagline: Record<SupportedLanguage, string>;
  highlights: readonly string[];
  blurb: Record<SupportedLanguage, string>;
};

export const reviews: readonly Review[] = [
  {
    name: "Vikram Malhotra",
    place: "Delhi",
    role: "Delhi to Agra Roundtrip",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    quote: "Sedan arrived 15 mins early at Delhi T3. Transparent ₹3,500 fare with all tolls included. Best taxi service in Agra!",
  },
  {
    name: "Elena Rostova",
    place: "London",
    role: "Taj Sunrise Tour",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    quote: "Spotless Innova Crysta with courteous English-speaking chauffeur. Taj sunrise tour was completely hassle-free.",
  },
  {
    name: "Rajesh & Sunita Sharma",
    place: "Agra",
    role: "Mathura-Vrindavan Pilgrimage",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    quote: "Booked Tempo Traveller for 12 family members. Punctual, safe driving along Yamuna Expressway and patient temple stops.",
  },
  {
    name: "David Miller",
    place: "California",
    role: "Golden Triangle Traveler",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    quote: "Reliable dispatch via WhatsApp, verified driver, no commission shop traps. Pure hospitality and transparent pricing.",
  },
  {
    name: "Vijay Kumar",
    place: "Agra",
    role: "Local Sightseeing Tour",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    quote: "Booked taxi service for local sightseeing and had a very smooth experience. The car was clean, driver was polite, and everything was on time.",
  },
  {
    name: "Ananya Singhal",
    place: "Gurugram",
    role: "Corporate Travel Manager",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    quote: "Regular vendor for our executives visiting Agra. Official GST invoices delivered instantly with pristine fleet.",
  },
  {
    name: "Marcus Vance",
    place: "London",
    role: "Photographer & Explorer",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    quote: "Driver knew optimal timing for Mehtab Bagh sunset and Fatehpur Sikri lighting. Exceptional experience!",
  },
  {
    name: "Priya Nair",
    place: "Jaipur",
    role: "Jaipur to Agra Route",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    quote: "Comfortable outstation cab with child seat accommodated. Driver was attentive and polite throughout the 5-hour drive.",
  },
  {
    name: "Dr. Arvind Gupta",
    place: "Delhi",
    role: "Senior Citizen Pilgrimage",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    quote: "Special care given to elderly parents at Agra Cantt station. AC was comfortable and driving was very gentle.",
  },
  {
    name: "Meera K.",
    place: "Lucknow",
    role: "Family Wedding Group",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80",
    quote: "Tempo Traveller for a family wedding party — ice-box, luggage bay, and a calm, courteous driver.",
  },
];

export const agraMonuments: readonly AgraMonument[] = [
  {
    id: "taj-mahal",
    name: "Taj Mahal",
    location: "Dharmapuri, Forest Colony, Tajganj, Agra 282001",
    timings: "6:00 AM to 6:30 PM (Closed Fridays)",
    builtBy: "Shah Jahan",
    builtIn: "1631 – 1648",
    blurb: {
      en: "The iconic white marble mausoleum and UNESCO World Heritage wonder built on the banks of the Yamuna River.",
      hi: "यमुना नदी के तट पर स्थित विश्व प्रसिद्ध संगमरमर का मकबरा और यूनेस्को विश्व धरोहर स्थल।",
    },
  },
  {
    id: "agra-fort",
    name: "Agra Red Fort",
    location: "Agra Fort, Rakabganj, Agra 282003",
    timings: "6:00 AM to 6:00 PM",
    builtBy: "Mughal Emperor Akbar",
    builtIn: "1565",
    blurb: {
      en: "Massive 16th-century red sandstone fortress that served as the imperial seat of the Mughal dynasty.",
      hi: "मुगल साम्राज्य की राजधानी रहा 16वीं शताब्दी का विशाल लाल बलुआ पत्थर का ऐतिहासिक किला।",
    },
  },
  {
    id: "fatehpur-sikri",
    name: "Fatehpur Sikri",
    location: "Fatehpur Sikri, Agra District, UP 283110",
    timings: "6:00 AM to 6:00 PM",
    builtBy: "Emperor Akbar",
    builtIn: "1571",
    blurb: {
      en: "Preserved royal ghost city boasting the magnificent Buland Darwaza and Salim Chishti Dargah.",
      hi: "अकबर द्वारा बसाई गई ऐतिहासिक नगरी, जहाँ विशाल बुलंद दरवाजा और शेख सलीम चिश्ती की दरगाह स्थित है।",
    },
  },
  {
    id: "itmad-ud-daulah",
    name: "Itmad-Ud-Daulah (Baby Taj)",
    location: "Moti Bagh, Agra 282006",
    timings: "8:00 AM to 12:00 AM",
    builtBy: "Noor Jahan",
    builtIn: "1622 – 1628",
    blurb: {
      en: "Delicate marble tomb renowned as the 'Jewel Box' and architectural precursor to the Taj Mahal.",
      hi: "'ज्वेल बॉक्स' के नाम से प्रसिद्ध नक्काशीदार संगमरमर का मकबरा, जो ताजमहल की प्रेरणा बना।",
    },
  },
  {
    id: "mehtab-bagh",
    name: "Mehtab Bagh",
    location: "Opposite Taj Mahal, Nagla Devjit, Agra 282001",
    timings: "6:00 AM to 9:00 PM",
    builtBy: "Emperor Babur / Shah Jahan",
    builtIn: "Early 1500s / 1631",
    blurb: {
      en: "Charbagh complex across the river offering the quintessential sunset reflection of the Taj Mahal.",
      hi: "यमुना पार स्थित चारबाग कॉम्प्लेक्स, जहाँ से सूर्यास्त के समय ताजमहल का भव्य नजारा दिखता है।",
    },
  },
  {
    id: "sikandra-fort",
    name: "Sikandra (Akbar's Tomb)",
    location: "Tomb of Akbar The Great, Sikandra, Agra 282007",
    timings: "8:00 AM to 6:00 PM",
    builtBy: "Akbar & Jahangir",
    builtIn: "1605 – 1613",
    blurb: {
      en: "Majestic five-tiered sandstone and marble tomb set amidst lush gardens with roaming deer.",
      hi: "हरे-भरे उद्यानों के बीच स्थित सम्राट अकबर का भव्य पांच मंजिला बलुआ पत्थर व संगमरमर का मकबरा।",
    },
  },
  {
    id: "jama-masjid",
    name: "Jama Masjid Agra",
    location: "Kinari Bazar, Subhash Bazar, Mantola, Agra 282003",
    timings: "8:00 AM to 6:00 PM",
    builtBy: "Shah Jahan",
    builtIn: "1648 A.D.",
    blurb: {
      en: "Historic red sandstone congregational mosque built by Shah Jahan dedicated to his daughter Jahanara Begum.",
      hi: "शाहजहाँ द्वारा अपनी पुत्री जहाँआरा बेगम की स्मृति में बनवाई गई लाल बलुआ पत्थर की ऐतिहासिक जामा मस्जिद।",
    },
  },
  {
    id: "moti-masjid",
    name: "Moti Masjid (Pearl Mosque)",
    location: "Inside Agra Fort Complex, Rakabganj, Agra 282003",
    timings: "8:00 AM to 6:00 PM",
    builtBy: "Shah Jahan",
    builtIn: "1648 A.D.",
    blurb: {
      en: "Gleaming pure white marble mosque situated inside the Agra Fort complex overlooking the Yamuna.",
      hi: "आगरा किला परिसर में स्थित सफेद संगमरमर की अत्यंत सुंदर और भव्य मोती मस्जिद।",
    },
  },
  {
    id: "jodha-bai-rauza",
    name: "Jodha Bai Ka Rauza",
    location: "Fatehpur Sikri / Arjun Nagar, Agra",
    timings: "10:00 AM to 7:00 PM",
    builtBy: "Mughal Emperor Akbar",
    builtIn: "16th century",
    blurb: {
      en: "Grand architectural fusion of Hindu Rajputana and Mughal styles built to honor Empress Mariam-uz-Zamani (Jodha Bai).",
      hi: "राजपूताना और मुगल वास्तुकला का अनुपम संगम, जिसे अकबर ने महारानी जोधाबाई के लिए बनवाया था।",
    },
  },
  {
    id: "mariam-uz-zamani",
    name: "Mariam-Uz-Zamani Tomb",
    location: "Mathura Rd, Kailash Mode, Sikandra, Agra 282007",
    timings: "10:00 AM to 7:00 PM",
    builtBy: "Jahangir",
    builtIn: "1611 A.D.",
    blurb: {
      en: "Serene Mughal garden tomb built by Emperor Jahangir for his mother Mariam-uz-Zamani.",
      hi: "सम्राट जहाँगीर द्वारा अपनी माता मरियम-उज़-ज़मानी के सम्मान में बनवाया गया शांत मुगल बाग मकबरा।",
    },
  },
];

export const outstationDestinations: readonly TouristDestination[] = [
  {
    id: "gwalior",
    name: "Gwalior",
    state: "Madhya Pradesh",
    distanceKm: 120,
    tagline: { en: "City of Forts, Music & Royal Palaces", hi: "किलों, संगीत और राजमहलों की ऐतिहासिक नगरी" },
    highlights: ["Gwalior Fort", "Jai Vilas Palace", "Gujari Mahal", "Teli Ka Mandir", "Scindia Museum"],
    blurb: {
      en: "Historical powerhouse featuring the impregnable 15th-century Gwalior Fort and the opulent Italian-designed Jai Vilas Palace.",
      hi: "मध्य प्रदेश का ऐतिहासिक शहर, जो अजेय ग्वालियर किले और भव्य जय विलास पैलेस के लिए विख्यात है।",
    },
  },
  {
    id: "nainital",
    name: "Nainital",
    state: "Uttarakhand",
    distanceKm: 340,
    tagline: { en: "The Pristine Lake City in the Kumaon Hills", hi: "कुमाऊं की पहाड़ियों में झीलों का सुरम्य शहर" },
    highlights: ["Naini Lake", "Naina Devi Temple", "Snow View Point", "Bhimtal", "Sattal Lake"],
    blurb: {
      en: "Scenic hill station nestled around emerald lunar-shaped Naini Lake at 1,938 meters altitude with snow-capped Himalayan vistas.",
      hi: "समुद्र तल से 1,938 मीटर की ऊंचाई पर नैनी झील के चारों ओर बसा शांत व ठंडा हिल स्टेशन।",
    },
  },
  {
    id: "corbett",
    name: "Jim Corbett National Park",
    state: "Uttarakhand",
    distanceKm: 380,
    tagline: { en: "India's Oldest Tiger Reserve & Wildlife Haven", hi: "भारत का पहला राष्ट्रीय उद्यान एवं बाघ अभयारण्य" },
    highlights: ["Bengal Tiger Safari", "Dhikala Zone", "Jhirna Zone", "Corbett Falls", "Kosi River"],
    blurb: {
      en: "Established in 1936 as Hailey National Park, the cradle of Project Tiger boasting 5 diverse forest zones and rich wildlife.",
      hi: "1936 में स्थापित भारत का सबसे पुराना राष्ट्रीय उद्यान, जो रॉयल बंगाल टाइगर और घने जंगलों के लिए प्रसिद्ध है।",
    },
  },
  {
    id: "dholpur",
    name: "Dholpur",
    state: "Rajasthan",
    distanceKm: 55,
    tagline: { en: "Ancient Red Sandstone & Sacred Heritage", hi: "प्राचीन लाल बलुआ पत्थर और पवित्र तीर्थ स्थल" },
    highlights: ["Machkund Temple", "Damoh Waterfall", "Shergarh Fort", "Van Vihar Sanctuary", "Khanpur Mahal"],
    blurb: {
      en: "Historic city dating back to Mahabharata times, celebrated for the sacred Muchukund pilgrim kund and Damoh waterfalls.",
      hi: "महाभारत कालीन ऐतिहासिक नगरी, जो पवित्र मचकुंड तीर्थ और सुरम्य दमोह जलप्रपात के लिए विख्यात है।",
    },
  },
  {
    id: "bharatpur",
    name: "Bharatpur",
    state: "Rajasthan",
    distanceKm: 56,
    tagline: { en: "World-Renowned UNESCO Keoladeo Bird Sanctuary", hi: "विश्व प्रसिद्ध यूनेस्को केवलादेव पक्षी अभयारण्य" },
    highlights: ["Keoladeo National Park", "Lohagarh Fort", "Deeg Palace", "Ganga Mandir", "Government Museum"],
    blurb: {
      en: "UNESCO World Heritage bird paradise welcoming thousands of migratory birds, alongside the unbreached Lohagarh Fort.",
      hi: "हजारों दुर्लभ प्रवासी पक्षियों का स्वर्ग यूनेस्को केवलादेव पक्षी अभयारण्य और अजेय लोहागढ़ किला।",
    },
  },
  {
    id: "mathura-vrindavan",
    name: "Mathura & Vrindavan",
    state: "Uttar Pradesh",
    distanceKm: 55,
    tagline: { en: "The Divine Brijbhoomi & Sacred Krishna Circuit", hi: "पवित्र ब्रजभूमि एवं भगवान श्री कृष्ण की जन्मस्थली" },
    highlights: ["Krishna Janmabhoomi", "Banke Bihari Mandir", "Prem Mandir", "Dwarkadhish Temple", "ISKCON"],
    blurb: {
      en: "The sacred spiritual heartland on the banks of Yamuna celebrating Lord Krishna's divine leelas with evening aartis.",
      hi: "भगवान श्री कृष्ण की पावन जन्मभूमि और लीलास्थली, जहाँ के भव्य मंदिर और यमुना आरती मन मोह लेते हैं।",
    },
  },
  {
    id: "alwar-sariska",
    name: "Alwar & Sariska",
    state: "Rajasthan",
    distanceKm: 160,
    tagline: { en: "Aravalli Wilderness, Palaces & Mysterious Forts", hi: "अरावली की वादियां, भव्य महल और रहस्यमयी किले" },
    highlights: ["Sariska Tiger Reserve", "Bhangarh Fort", "Siliserh Lake", "Bala Quila", "Neemrana Fort"],
    blurb: {
      en: "Dramatic Aravalli destination combining Sariska wildlife sightings with the historic Bala Quila and legendary Bhangarh.",
      hi: "अरावली पहाड़ियों में बसा शहर जहाँ सरिस्का टाइगर रिजर्व, सिलीसेढ़ झील और ऐतिहासिक भानगढ़ किला स्थित हैं।",
    },
  },
];

export const petFriendlyService = {
  enabled: true,
  title: { en: "Pet-Friendly Cabs in Agra", hi: "पेट-फ्रेंडली कैब सेवा आगरा" },
  blurb: {
    en: "Travel comfortably across Agra and outstation destinations with your dogs, cats, and pets. Dedicated sanitized vehicles with carrier space and scheduled relief stops.",
    hi: "अपने पालतू जानवरों के साथ आराम से यात्रा करें। विशेष सैनिटाइज्ड गाड़ियाँ, कैरियर स्पेस और आवश्यकतानुसार स्टॉप्स की सुविधा।",
  },
  couponCode: "ASTTCAR500OFF",
} as const;

export const promoCodes: Readonly<Record<string, PromoCode>> = {
  ASTTCAR500OFF: { discount: 500, minTotal: 2000, desc: "Flat ₹500 OFF on car bookings" },
};

export const trustSignals = [
  "GOVT-REGISTERED FLEET",
  "VERIFIED DRIVERS",
  "GST INVOICE",
  "4.9/5 · 3,800+ GOOGLE REVIEWS",
  "24×7 ON-ROUTE SUPPORT",
  "PET-FRIENDLY VEHICLES AVAILABLE",
] as const;

export const cancellationPolicyCab = {
  en: "Free cancellation up to 24 hours before pickup for a 100% refund (credited via original payment method in 5–7 business days). Cancellations within 24 hours may be subject to partial advance retention. No refund for no-shows.",
  hi: "पिकअप से 24 घंटे पहले तक रद्द करने पर 100% पूरा रिफंड (मूल भुगतान माध्यम में 5-7 कार्य दिवसों में)। 24 घंटे के भीतर रद्द करने पर आंशिक कटौती हो सकती है। नो-शो पर कोई रिफंड नहीं।",
} as const;

export const cancellationSlabsTour: readonly TourCancellationSlab[] = [
  { days: "61+ days", fee: "0%", refund: "100%" },
  { days: "46–60 days", fee: "10%", refund: "90%" },
  { days: "31–45 days", fee: "20%", refund: "80%" },
  { days: "16–30 days", fee: "30%", refund: "70%" },
  { days: "6–15 days", fee: "55%", refund: "45%" },
  { days: "0–5 days", fee: "100%", refund: "0%" },
];

export const outstationRules = {
  minKmPerDay: 300,
  nightAllowanceCab: 300,
  nightAllowanceTempo: 500,
  nightStartHour: 20,
  nightEndHour: 6,
} as const;

export const faqs: readonly FaqItem[] = [
  {
    category: "booking",
    question: { en: "How does the advance payment work?", hi: "एडवांस पेमेंट कैसे काम करता है?" },
    answer: {
      en: "You pay a 28% advance deposit (minimum ₹500) online to secure the chauffeur and vehicle. The remaining balance is paid directly to the driver at the start or completion of your trip.",
      hi: "आप ड्राइवर और गाड़ी सुरक्षित करने के लिए 28% एडवांस (न्यूनतम ₹500) ऑनलाइन भुगतान करते हैं। बाकी राशि यात्रा शुरू या पूरी होने पर सीधे ड्राइवर को दी जाती है।",
    },
  },
  {
    category: "cancellation",
    question: { en: "What is the cancellation and refund policy?", hi: "रद्दीकरण और रिफंड नीति क्या है?" },
    answer: {
      en: "For cab bookings, free cancellation is available up to 24 hours before pickup for a 100% refund (credited in 5–7 business days). Tour packages follow a tiered refund schedule based on notice days.",
      hi: "टैक्सी बुकिंग के लिए पिकअप से 24 घंटे पहले तक 100% रिफंड के साथ निःशुल्क रद्दीकरण उपलब्ध है (5-7 दिनों में रिफंड)। टूर पैकेज के लिए पूर्व सूचना के दिनों के आधार पर स्लैब लागू होता है।",
    },
  },
  {
    category: "fares",
    question: { en: "Are highway tolls, state tax, and parking included?", hi: "क्या हाईवे टोल, स्टेट टैक्स और पार्किंग शामिल हैं?" },
    answer: {
      en: "All our one-way expressway fares (such as Agra–Delhi ₹3,499) are 100% all-inclusive (toll, state permits, and driver charges included). For outstation round-trips, tolls and parking are billed at actuals.",
      hi: "हमारे सभी वन-वे एक्सप्रेसवे किराए (जैसे आगरा-दिल्ली ₹3,499) ऑल-इनक्लूसिव हैं (टोल, राज्य कर व ड्राइवर चार्ज शामिल)। राउंड-ट्रिप में टोल व पार्किंग वास्तविक रसीद अनुसार देय हैं।",
    },
  },
  {
    category: "night",
    question: { en: "What is the night driving allowance?", hi: "नाइट ड्राइविंग अलाउंस क्या है?" },
    answer: {
      en: "For outstation pickups between 08:00 PM (20:00) and 06:00 AM, a flat driver night allowance of ₹300 for cars and ₹500 for Tempo Travellers is added to the fare.",
      hi: "रात 8:00 बजे से सुबह 6:00 बजे के बीच आउटस्टेशन पिकअप के लिए कारों पर ₹300 और टेम्पो ट्रैवलर पर ₹500 का फिक्स नाइट अलाउंस लागू होता है।",
    },
  },
  {
    category: "outstation",
    question: { en: "How are outstation round-trips billed?", hi: "आउटस्टेशन राउंड-ट्रिप का किराया कैसे तय होता है?" },
    answer: {
      en: "Outstation round trips follow the standard tourism industry benchmark of minimum 300 KM per calendar day, or the 1.85× base route formula, whichever accurately covers the itinerary.",
      hi: "आउटस्टेशन राउंड ट्रिप में पर्यटन उद्योग के मानक 300 किमी प्रति दिन या 1.85× फॉर्मूला के अनुसार पारदर्शी बिलिंग होती है।",
    },
  },
  {
    category: "pet",
    question: { en: "Can I travel with my pets in your taxis?", hi: "क्या मैं आपकी टैक्सी में पालतू जानवरों के साथ यात्रा कर सकता हूँ?" },
    answer: {
      en: "Yes, we provide dedicated pet-friendly cabs equipped with protective seat covers and carrier space. There are no breed or size restrictions; please mention your pet while reserving so we can arrange relief stops.",
      hi: "हाँ, हम पालतू जानवरों के लिए विशेष सैनिटाइज्ड गाड़ियाँ उपलब्ध कराते हैं। किसी भी नस्ल या आकार पर प्रतिबंध नहीं है; कृपया बुकिंग के समय जानकारी दें।",
    },
  },
  {
    category: "intercity",
    question: { en: "Is one-way intercity cab service available without paying return fare?", hi: "क्या बिना वापसी किराए के वन-वे इंटरसिटी कैब सेवा उपलब्ध है?" },
    answer: {
      en: "Yes, our one-way intercity taxi service covers Agra to Delhi, Noida, Gurgaon, Jaipur, and Lucknow at fixed all-inclusive rates without any return toll or empty-return charges.",
      hi: "हाँ, आगरा से दिल्ली, नोएडा, गुड़गांव, जयपुर और लखनऊ के लिए हमारी वन-वे सेवा उपलब्ध है, जिसमें कोई वापसी किराया नहीं लिया जाता।",
    },
  },
];

export type BenefitItem = {
  id: string;
  title: Record<SupportedLanguage, string>;
  desc: Record<SupportedLanguage, string>;
};

export const coreBenefits: readonly BenefitItem[] = [
  {
    id: "easy-booking",
    title: { en: "Easy Booking", hi: "आसान बुकिंग" },
    desc: {
      en: "Book your taxi in minutes with a simple, user-friendly and transparent process.",
      hi: "बिना किसी झंझट के कुछ ही मिनटों में अपनी टैक्सी आसानी से बुक करें।",
    },
  },
  {
    id: "multiple-fleets",
    title: { en: "Multiple Fleets", hi: "विविध फ्लीट विकल्प" },
    desc: {
      en: "Choose from clean Sedans, Ertiga, Innova Crysta, and 9–26 seater luxury Tempo Travellers.",
      hi: "सेडान, अर्टिगा, इनोवा क्रिस्टा और 9-26 सीटर टेम्पो ट्रैवलर में से अपनी पसंद चुनें।",
    },
  },
  {
    id: "lowest-fares",
    title: { en: "Lowest Fares", hi: "किफायती व पारदर्शी दरें" },
    desc: {
      en: "Book with confidence and enjoy authentic fixed fares starting at ₹10/KM with zero hidden fees.",
      hi: "₹10/किमी से शुरू होने वाले पारदर्शी और सबसे किफायती किराए का लाभ उठाएं।",
    },
  },
  {
    id: "exciting-offers",
    title: { en: "Exciting Offers", hi: "विशेष छूट व ऑफर्स" },
    desc: {
      en: "Unlock flat ₹500 OFF with promo code ASTTCAR500OFF on bookings above ₹2,000.",
      hi: "कूपन कोड ASTTCAR500OFF से ₹2,000 से अधिक की बुकिंग पर पाएं ₹500 की फ्लैट छूट।",
    },
  },
  {
    id: "on-time-service",
    title: { en: "On-Time Service", hi: "समय की पाबंदी" },
    desc: {
      en: "Punctual airport transfers, railway pickups, and morning sunrise tours guaranteed.",
      hi: "एयरपोर्ट, रेलवे स्टेशन और सनराइज टूर के लिए समय पर गाड़ी पहुंचने की गारंटी।",
    },
  },
  {
    id: "24x7-support",
    title: { en: "24×7 Support", hi: "24×7 ग्राहक सहायता" },
    desc: {
      en: "Direct phone and WhatsApp support on route for complete peace of mind throughout India.",
      hi: "यात्रा के दौरान किसी भी सहायता के लिए हमारी टीम 24 घंटे कॉल व व्हाट्सएप पर उपलब्ध है।",
    },
  },
];

export const agraLocalities = [
  "Tajganj",
  "Sanjay Place",
  "Sikandra",
  "Kamla Nagar",
  "Ram Bagh",
  "Lohamandi",
  "Fatehabad Road",
  "Agra Cantt Railway Station",
  "Agra Fort Railway Station",
  "Agra Airport (Kheria)",
  "Dayal Bagh",
  "Sadar Bazaar",
  "Civil Lines",
  "MG Road",
  "Shah Ganj",
  "Bodla",
  "Delhi Gate",
  "Rakabganj",
  "VIP Road",
  "Transport Nagar",
  "Idgah Colony",
  "Tedi Bagiya",
  "Kalindi Vihar",
  "TDI City",
  "Bateshwar",
  "Dholpur House",
  "Khandari",
  "Bhagwan Talkies",
] as const;

export type LocalizedValue = Record<SupportedLanguage, string>;

