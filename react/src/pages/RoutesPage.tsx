import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { routes, routeGuidance, outstationRules, type Route } from "../data";
import { calcFare, findRoute } from "../fares";
import { formatInr } from "../utils/format";
import { AnalyticsBoard } from "../components/ui/AnalyticsBoard";
import { Icon } from "../components/ui/Icon";
import { Reveal, Stagger, StaggerItem } from "../components/ui/motion";

interface RoutesPageProps {
  language?: SupportedLanguage;
}

interface CityOption {
  id: string;
  name: { en: string; hi: string };
  region: { en: string; hi: string };
}

const POPULAR_ORIGINS: CityOption[] = [
  { id: "agra", name: { en: "Agra", hi: "आगरा" }, region: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश" } },
  { id: "delhi", name: { en: "Delhi NCR", hi: "दिल्ली एनसीआर" }, region: { en: "National Capital Region", hi: "राष्ट्रीय राजधानी क्षेत्र" } },
  { id: "jaipur", name: { en: "Jaipur", hi: "जयपुर" }, region: { en: "Rajasthan", hi: "राजस्थान" } },
  { id: "mathura", name: { en: "Mathura", hi: "मथुरा" }, region: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश" } },
  { id: "gwalior", name: { en: "Gwalior", hi: "ग्वालियर" }, region: { en: "Madhya Pradesh", hi: "मध्य प्रदेश" } },
];

const POPULAR_DESTINATIONS: CityOption[] = [
  { id: "delhi", name: { en: "Delhi NCR (IGI Airport / Central)", hi: "दिल्ली एनसीआर (एयरपोर्ट / शहर)" }, region: { en: "via Yamuna Expressway", hi: "यमुना एक्सप्रेसवे द्वारा" } },
  { id: "jaipur", name: { en: "Jaipur (Pink City)", hi: "जयपुर (पिंक सिटी)" }, region: { en: "via NH-21", hi: "एनएच-21 द्वारा" } },
  { id: "mathura", name: { en: "Mathura & Vrindavan", hi: "मथुरा और वृंदावन" }, region: { en: "via NH-19", hi: "एनएच-19 द्वारा" } },
  { id: "gwalior", name: { en: "Gwalior Fort & City", hi: "ग्वालियर किला व शहर" }, region: { en: "via NH-44", hi: "एनएच-44 द्वारा" } },
  { id: "lucknow", name: { en: "Lucknow (Nawabi City)", hi: "लखनऊ (नवाबों का शहर)" }, region: { en: "via Agra–Lucknow Expressway", hi: "आगरा-लखनऊ एक्सप्रेसवे" } },
  { id: "ayodhya", name: { en: "Ayodhya Dham", hi: "अयोध्या धाम" }, region: { en: "via Purvanchal Link", hi: "पूर्वांचल लिंक द्वारा" } },
  { id: "haridwar", name: { en: "Haridwar & Rishikesh", hi: "हरिद्वार एवं ऋषिकेश" }, region: { en: "via Upper Ganga Canal Route", hi: "गंगा नहर मार्ग द्वारा" } },
  { id: "nainital", name: { en: "Nainital Lake District", hi: "नैनीताल लेक डिस्ट्रिक्ट" }, region: { en: "via Bareilly–Kathgodam", hi: "बरेली-काठगोदाम मार्ग" } },
  { id: "chandigarh", name: { en: "Chandigarh", hi: "चंडीगढ़" }, region: { en: "via Western Peripheral", hi: "वेस्टर्न पेरिफेरल द्वारा" } },
  { id: "bharatpur", name: { en: "Bharatpur Bird Sanctuary", hi: "भरतपुर पक्षी अभयारण्य" }, region: { en: "via Fatehpur Sikri Road", hi: "फतेहपुर सीकरी रोड" } },
];

interface MatrixRow {
  destination: { en: string; hi: string };
  distanceKm: number;
  duration: string;
  highway: string;
  sedanFare: number;
  tollStatus: { en: string; hi: string };
  fromId: string;
  toId: string;
}

const DISTANCE_MATRIX: MatrixRow[] = [
  {
    destination: { en: "Delhi NCR (IGI Airport / Noida)", hi: "दिल्ली एनसीआर (एयरपोर्ट / नोएडा)" },
    distanceKm: 230,
    duration: "3h 30m",
    highway: "Yamuna Expressway",
    sedanFare: 3499,
    tollStatus: { en: "Included in 1-Way", hi: "वन-वे में टोल शामिल" },
    fromId: "agra",
    toId: "delhi",
  },
  {
    destination: { en: "Jaipur (Pink City)", hi: "जयपुर (पिंक सिटी)" },
    distanceKm: 240,
    duration: "4h 30m",
    highway: "NH-21 (Agra–Bikaner)",
    sedanFare: 3499,
    tollStatus: { en: "Included in 1-Way", hi: "वन-वे में टोल शामिल" },
    fromId: "agra",
    toId: "jaipur",
  },
  {
    destination: { en: "Mathura & Vrindavan Temples", hi: "मथुरा व वृंदावन मंदिर" },
    distanceKm: 58,
    duration: "1h 15m",
    highway: "NH-19 / Delhi–Agra",
    sedanFare: 2200,
    tollStatus: { en: "All Tolls Included", hi: "सभी टोल शामिल" },
    fromId: "agra",
    toId: "mathura",
  },
  {
    destination: { en: "Gwalior Fort & Palace", hi: "ग्वालियर किला व महल" },
    distanceKm: 120,
    duration: "2h 30m",
    highway: "NH-44 Corridor",
    sedanFare: 3000,
    tollStatus: { en: "Tolls Included (MP tax extra)", hi: "टोल शामिल (एमपी टैक्स अलग)" },
    fromId: "agra",
    toId: "gwalior",
  },
  {
    destination: { en: "Lucknow (Capital City)", hi: "लखनऊ (राजधानी)" },
    distanceKm: 335,
    duration: "5h 30m",
    highway: "Agra–Lucknow Expressway",
    sedanFare: 7000,
    tollStatus: { en: "Expressway Toll Included", hi: "एक्सप्रेसवे टोल शामिल" },
    fromId: "agra",
    toId: "lucknow",
  },
  {
    destination: { en: "Fatehpur Sikri World Heritage", hi: "फतेहपुर सीकरी विश्व धरोहर" },
    distanceKm: 40,
    duration: "50m",
    highway: "Fatehpur Sikri Highway",
    sedanFare: 1500,
    tollStatus: { en: "All Taxes Included", hi: "सभी टैक्स शामिल" },
    fromId: "agra",
    toId: "fatehpur-sikri",
  },
  {
    destination: { en: "Bharatpur (Keoladeo Park)", hi: "भरतपुर (केवलादेव राष्ट्रीय उद्यान)" },
    distanceKm: 56,
    duration: "1h 10m",
    highway: "NH-21",
    sedanFare: 1800,
    tollStatus: { en: "State Tax Included", hi: "स्टेट टैक्स शामिल" },
    fromId: "agra",
    toId: "bharatpur",
  },
  {
    destination: { en: "Ayodhya Ram Mandir", hi: "अयोध्या श्री राम मंदिर" },
    distanceKm: 470,
    duration: "7h 30m",
    highway: "Lucknow–Ayodhya Expressway",
    sedanFare: 9800,
    tollStatus: { en: "Expressway Tolls Included", hi: "एक्सप्रेसवे टोल शामिल" },
    fromId: "agra",
    toId: "ayodhya",
  },
  {
    destination: { en: "Haridwar & Rishikesh Ghats", hi: "हरिद्वार व ऋषिकेश गंगा घाट" },
    distanceKm: 380,
    duration: "7h",
    highway: "Upper Ganga Expressway",
    sedanFare: 7500,
    tollStatus: { en: "Uttarakhand Permit Extra", hi: "उत्तराखंड टैक्स अतिरिक्त" },
    fromId: "agra",
    toId: "haridwar",
  },
  {
    destination: { en: "Nainital Lake City", hi: "नैनीताल हिल स्टेशन" },
    distanceKm: 340,
    duration: "7h 30m",
    highway: "Bareilly–Kathgodam Highway",
    sedanFare: 7200,
    tollStatus: { en: "Hill Permit Included", hi: "हिल परमिट शामिल" },
    fromId: "agra",
    toId: "nainital",
  },
];

interface RouteFaq {
  q: { en: string; hi: string };
  a: { en: string; hi: string };
}

const ROUTE_FAQS: RouteFaq[] = [
  {
    q: {
      en: "Are highway tolls and state entry taxes included in the fare?",
      hi: "क्या किराये में हाईवे टोल और राज्य प्रवेश कर (स्टेट टैक्स) शामिल हैं?",
    },
    a: {
      en: "Yes! All fixed one-way outstation bookings (such as Agra to Delhi ₹3,499 and Agra to Jaipur ₹3,499) are 100% all-inclusive — covering Yamuna Expressway or NH tolls, state taxes, and driver allowance. For custom round-trip outstation journeys, highway tolls and state taxes are billed at actual toll plaza receipts with zero surcharge.",
      hi: "हाँ! हमारी सभी तय वन-वे बुकिंग्स (जैसे आगरा-दिल्ली ₹3,499 और आगरा-जयपुर ₹3,499) 100% ऑल-इनक्लूसिव हैं। इनमें यमुना एक्सप्रेसवे/एनएच टोल, राज्य सीमा टैक्स और ड्राइवर खर्च पहले से शामिल है। राउंड-ट्रिप यात्राओं में टोल और स्टेट टैक्स वास्तविक पर्चियों के आधार पर बिना किसी अतिरिक्त शुल्क के देय होते हैं।",
    },
  },
  {
    q: {
      en: "Do I have to pay for the empty return journey on one-way drops?",
      hi: "क्या वन-वे ड्रॉप पर मुझे कैब के खाली वापस आने का किराया देना होगा?",
    },
    a: {
      en: "Never. With SK Baghel Tour & Travels, you strictly pay only for the distance you travel. On one-way bookings (e.g., Agra to Delhi IGI Airport), return fuel, return tolls, and empty return transit are absorbed entirely by our network.",
      hi: "बिल्कुल नहीं। एस के बघेल टूर्स में आप सिर्फ अपने सफर का किराया देते हैं। वन-वे बुकिंग्स (जैसे आगरा से दिल्ली एयरपोर्ट) में वापसी का ईंधन और टोल पूरी तरह हमारी कंपनी वहन करती है।",
    },
  },
  {
    q: {
      en: "How does the 300 KM per day rule work on outstation round-trips?",
      hi: "आउटस्टेशन राउंड-ट्रिप में 300 किमी प्रतिदिन का नियम कैसे काम करता है?",
    },
    a: {
      en: "For multi-day or round-trip outstation journeys, the industry benchmark minimum is 300 km per calendar day (e.g., a 3-day Golden Triangle trip has a base allowance of 900 km). If your total journey is less than 900 km, the 900 km minimum applies. Any distance driven beyond 900 km is simply billed at the vehicle's transparent per-km rate (e.g. ₹10/km for Sedan, ₹14/km for Ertiga, ₹18/km for Innova Crysta).",
      hi: "मल्टी-डे आउटस्टेशन ट्रिप में न्यूनतम 300 किमी प्रति कैलेंडर दिवस का मानक नियम लागू होता है (जैसे 3 दिन के टूर में 900 किमी का बेस)। यदि वास्तविक यात्रा 900 किमी से कम रहती है, तो न्यूनतम 900 किमी देय होगा। इससे अधिक चलने पर तय प्रति-किमी दर (सेडान ₹10, अर्टिगा ₹14, इनोवा ₹18) से पारदर्शी गणना की जाती है।",
    },
  },
  {
    q: {
      en: "What is the night driving allowance policy?",
      hi: "नाइट ड्राइविंग अलाउंस का क्या नियम है?",
    },
    a: {
      en: `For outstation travel where journeys operate between 08:00 PM (20:00) and 06:00 AM, a flat driver night allowance applies: ₹${outstationRules.nightAllowanceCab} for passenger cars (Sedan/Ertiga/Innova) and ₹${outstationRules.nightAllowanceTempo} for Tempo Travellers and luxury vans. This is explicitly disclosed upfront during booking.`,
      hi: `रात 8:00 बजे (20:00) से सुबह 6:00 बजे के बीच यात्रा जारी रहने पर फिक्स नाइट अलाउंस लागू होता है: कारों (सेडान/अर्टिगा/इनोवा) के लिए ₹${outstationRules.nightAllowanceCab} तथा टेम्पो ट्रैवलर/अर्बनिया के लिए ₹${outstationRules.nightAllowanceTempo}। यह बुकिंग के समय ही पारदर्शी रूप से स्पष्ट किया जाता है।`,
    },
  },
  {
    q: {
      en: "Can we request sightseeing stopovers en route (e.g., Fatehpur Sikri or Mathura temples)?",
      hi: "क्या रास्ते में दर्शनीय स्थलों (जैसे फतेहपुर सीकरी या मंदिर) पर रुक सकते हैं?",
    },
    a: {
      en: "Yes, completely! On routes like Agra to Jaipur, a stopover at UNESCO World Heritage Fatehpur Sikri is very popular and accommodated smoothly. On Agra to Delhi, stopovers at Vrindavan Prem Mandir or Mathura Krishna Janmabhoomi can be integrated into your itinerary.",
      hi: "हाँ, अवश्य! आगरा से जयपुर जाते समय विश्व प्रसिद्ध फतेहपुर सीकरी पर स्टॉप लेना बेहद लोकप्रिय है। इसी तरह आगरा से दिल्ली मार्ग पर वृंदावन प्रेम मंदिर या मथुरा श्रीकृष्ण जन्मभूमि दर्शन का स्टॉप आसानी से शामिल किया जा सकता है।",
    },
  },
  {
    q: {
      en: "Are your drivers trained for high-speed expressways like Yamuna Expressway?",
      hi: "क्या आपके ड्राइवर यमुना एक्सप्रेसवे जैसे हाई-स्पीड हाईवे के लिए प्रशिक्षित हैं?",
    },
    a: {
      en: "Every driver on our fleet holds a valid commercial driving license, has minimum 5+ years of highway driving experience, passes background verification, and strictly follows expressway lane discipline, speed limits (100 km/h on Yamuna Expressway), and defensive driving protocols for night and foggy conditions.",
      hi: "हमारी सभी गाड़ियों के चालकों के पास वैध कमर्शियल ड्राइविंग लाइसेंस है, कम से कम 5 वर्षों का हाईवे अनुभव है, और वे यमुना एक्सप्रेसवे पर गति सीमा (100 किमी/घंटा), लेन अनुशासन और कोहरे व रात्रि सफर में सुरक्षित ड्राइविंग के पूर्ण अभ्यस्त हैं।",
    },
  },
];

export function RoutesPage({ language = "en" }: RoutesPageProps) {
  const isHindi = language === "hi";
  const activeLanguage = isHindi ? "hi" : "en";
  const langPrefix = isHindi ? "/hi" : "/en";

  // Calculator State
  const [calcFrom, setCalcFrom] = useState("agra");
  const [calcTo, setCalcTo] = useState("delhi");
  const [calcTripType, setCalcTripType] = useState<"one-way" | "round-trip">("one-way");

  // Route Directory Filter State
  const [categoryFilter, setCategoryFilter] = useState<"all" | "expressway" | "heritage" | "pilgrimage" | "intercity">("all");

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Compute live calculator quotes
  const calculatedQuote = useMemo(() => {
    const route = findRoute(calcFrom, calcTo);
    const trip = calcTripType === "round-trip" ? "round" : "one-way";
    const sedanQuote = calcFare({ from: calcFrom, to: calcTo, vehicleId: "sedan", tripType: trip });
    const ertigaQuote = calcFare({ from: calcFrom, to: calcTo, vehicleId: "ertiga", tripType: trip });
    const innovaQuote = calcFare({ from: calcFrom, to: calcTo, vehicleId: "innova", tripType: trip });
    const tempoQuote = calcFare({ from: calcFrom, to: calcTo, vehicleId: "tempo", tripType: trip });
    const urbaniaQuote = calcFare({ from: calcFrom, to: calcTo, vehicleId: "urbania", tripType: trip });

    const distance = (sedanQuote && sedanQuote.km) || (route ? route.km : 230);
    const duration = route ? route.duration : `${Math.round(distance / 60)} hrs`;

    return {
      distance,
      duration,
      fares: {
        sedan: sedanQuote ? sedanQuote.total : (route ? route.fares.sedan : 3499),
        ertiga: ertigaQuote ? ertigaQuote.total : (route ? route.fares.ertiga : 4499),
        innova: innovaQuote ? innovaQuote.total : (route ? route.fares.innova : 6499),
        tempo: tempoQuote ? tempoQuote.total : (route ? route.fares.tempo : 9500),
        urbania: urbaniaQuote ? urbaniaQuote.total : (route ? route.fares.urbania : 14000),
      },
    };
  }, [calcFrom, calcTo, calcTripType]);

  // Filtered Route Directory
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "expressway") {
        return route.id.includes("delhi") || route.id.includes("lucknow");
      }
      if (categoryFilter === "heritage") {
        return route.id.includes("jaipur") || route.id.includes("gwalior") || route.id.includes("local");
      }
      if (categoryFilter === "pilgrimage") {
        return route.id.includes("mathura");
      }
      if (categoryFilter === "intercity") {
        return route.km >= 200;
      }
      return true;
    });
  }, [categoryFilter]);

  // Structured Data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TaxiService",
        "@id": "https://skbagheltravels.in/#service",
        name: "SK Baghel Tour & Travels Outstation Network",
        serviceType: "Outstation Taxi & Intercity Cab Service",
        provider: {
          "@type": "LocalBusiness",
          name: "SK Baghel Tour & Travels",
          telephone: contact.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Near Taj Mahal, Taj Ganj",
            addressLocality: "Agra",
            addressRegion: "UP",
            postalCode: "282001",
            addressCountry: "IN",
          },
        },
        areaServed: [
          { "@type": "City", name: "Agra" },
          { "@type": "City", name: "Delhi" },
          { "@type": "City", name: "Jaipur" },
          { "@type": "City", name: "Mathura" },
          { "@type": "City", name: "Gwalior" },
          { "@type": "City", name: "Lucknow" },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isHindi ? "होम" : "Home",
            item: `https://skbagheltravels.in${langPrefix}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isHindi ? "आउटस्टेशन रूट्स" : "Outstation Routes",
            item: `https://skbagheltravels.in${langPrefix}/routes/`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: ROUTE_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q[activeLanguage],
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a[activeLanguage],
          },
        })),
      },
    ],
  };

  return (
    <main id="main-content" className="routes-hub-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Routes Hub Hero Header */}
      <header className="routes-hub-hero">
        <div className="container">
          <p className="eyebrow">
            {isHindi
              ? "इंटर-सिटी व एक्सप्रेसवे नेटवर्क • एस के बघेल"
              : "OUTSTATION & CORRIDOR NETWORK • SK BAGHEL"}
          </p>
          <h1>
            {isHindi ? (
              <>
                आगरा से आउटस्टेशन कैब नेटवर्क,
                <br />
                <i>पारदर्शी किराये और सटीक हाईवे मार्गदर्शन।</i>
              </>
            ) : (
              <>
                Outstation routes & travel guides,
                <br />
                <i>transparent fares across northern India.</i>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {isHindi
              ? "यमुना एक्सप्रेसवे से दिल्ली एनसीआर, एनएच-21 से जयपुर पिंक सिटी, आगरा-लखनऊ एक्सप्रेसवे, और मथुरा-ग्वालियर हाईवे तक — सत्यापित ड्राइवरों के साथ सुरक्षित और ऑल-इनक्लूसिव यात्रा।"
              : "Direct express connections from Agra across the Yamuna Expressway to Delhi NCR, NH-21 to Jaipur Pink City, the Lucknow Expressway, and Mathura temple circuits — with verified chauffeurs and zero hidden charges."}
          </p>

          <div className="hero-actions">
            <a
              className="button button-primary"
              href="#route-calculator"
            >
              {isHindi ? "किराया कैलकुलेटर देखें ↓" : "Calculate Route Fare ↓"}
            </a>
            <a
              className="button button-outline"
              href={`tel:${contact.phone}`}
            >
              {isHindi ? `कॉल करें ${contact.phoneDisplay}` : `Call ${contact.phoneDisplay}`}
            </a>
            <a
              className="button button-outline"
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              {isHindi ? "व्हाट्सएप पूछताछ" : "WhatsApp Desk"}
            </a>
          </div>
        </div>
      </header>

      {/* Interactive Dynamic Route & Fare Calculator */}
      <section
        id="route-calculator"
        className="home-section route-calculator-section"
        aria-labelledby="calculator-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "तुरंत किराया गणना" : "Instant Route Estimator"}
              </p>
              <h2 id="calculator-heading">
                {isHindi ? (
                  <>
                    लाइव आउटस्टेशन किराया कैलकुलेटर,
                    <br />
                    <i>सटीक दूरी और फिक्स पारदर्शी मूल्य।</i>
                  </>
                ) : (
                  <>
                    Calculate instant outstation fares,
                    <br />
                    <i>exact distances and verified rates.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="route-calc-card">
            <div className="route-calc-controls">
              {/* Trip Kind Toggle */}
              <div className="calc-toggle-group" role="group" aria-label="Trip Type">
                <button
                  type="button"
                  className={`calc-toggle-btn ${calcTripType === "one-way" ? "is-active" : ""}`}
                  onClick={() => setCalcTripType("one-way")}
                >
                  {isHindi ? "वन-वे ड्रॉप (One-Way)" : "One-Way Drop"}
                </button>
                <button
                  type="button"
                  className={`calc-toggle-btn ${calcTripType === "round-trip" ? "is-active" : ""}`}
                  onClick={() => setCalcTripType("round-trip")}
                >
                  {isHindi ? "राउंड-ट्रिप (Round-Trip)" : "Round-Trip Return"}
                </button>
              </div>

              {/* Origin & Destination Selectors */}
              <div className="calc-inputs-row">
                <div className="calc-field">
                  <label htmlFor="calc-from-select">
                    {isHindi ? "प्रस्थान स्थान (Pickup From)" : "Pickup City"}
                  </label>
                  <select
                    id="calc-from-select"
                    className="calc-select"
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value)}
                  >
                    {POPULAR_ORIGINS.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name[activeLanguage]} ({city.region[activeLanguage]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="calc-swap-icon" aria-hidden="true">
                  ⇄
                </div>

                <div className="calc-field">
                  <label htmlFor="calc-to-select">
                    {isHindi ? "गंतव्य स्थान (Drop Location)" : "Destination City"}
                  </label>
                  <select
                    id="calc-to-select"
                    className="calc-select"
                    value={calcTo}
                    onChange={(e) => setCalcTo(e.target.value)}
                  >
                    {POPULAR_DESTINATIONS.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name[activeLanguage]} ({city.region[activeLanguage]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Strip */}
            <div className="route-calc-output">
              <div className="route-calc-stats">
                <div className="calc-stat-pill">
                  <span className="stat-icon"><Icon name="route" size={16} /></span>
                  <span className="stat-label">{isHindi ? "दूरी:" : "Distance:"}</span>
                  <strong>{calculatedQuote.distance} km</strong>
                </div>
                <div className="calc-stat-pill">
                  <span className="stat-icon"><Icon name="clock" size={16} /></span>
                  <span className="stat-label">{isHindi ? "सफर समय:" : "Duration:"}</span>
                  <strong>{calculatedQuote.duration}</strong>
                </div>
                <div className="calc-stat-pill">
                  <span className="stat-icon"><Icon name="toll" size={16} /></span>
                  <span className="stat-label">{isHindi ? "किराया प्रकृति:" : "Fare Type:"}</span>
                  <strong>{calcTripType === "one-way" ? (isHindi ? "ऑल-इनक्लूसिव वन-वे" : "All-Inclusive 1-Way") : (isHindi ? "300 किमी/दिन बेस" : "Round-Trip Formula")}</strong>
                </div>
              </div>

              {/* Vehicle Fares Breakdown Grid */}
              <div className="route-calc-fares-grid">
                <div className="calc-fare-box">
                  <span className="car-type">Sedan (Dzire)</span>
                  <span className="car-pax">{isHindi ? "4 यात्री · 2 बैग" : "4 Pax · 2 Bags"}</span>
                  <strong className="car-price">{formatInr(calculatedQuote.fares.sedan)}</strong>
                  <a
                    className="button button-outline button-sm"
                    href={`/book.html?from=${calcFrom}&to=${calcTo}&trip=${calcTripType}&vehicle=sedan`}
                  >
                    {isHindi ? "चुनें ↗" : "Select ↗"}
                  </a>
                </div>

                <div className="calc-fare-box">
                  <span className="car-type">Maruti Ertiga</span>
                  <span className="car-pax">{isHindi ? "6 यात्री · 3 बैग" : "6 Pax · 3 Bags"}</span>
                  <strong className="car-price">{formatInr(calculatedQuote.fares.ertiga)}</strong>
                  <a
                    className="button button-outline button-sm"
                    href={`/book.html?from=${calcFrom}&to=${calcTo}&trip=${calcTripType}&vehicle=ertiga`}
                  >
                    {isHindi ? "चुनें ↗" : "Select ↗"}
                  </a>
                </div>

                <div className="calc-fare-box is-featured">
                  <span className="car-type">Innova Crysta</span>
                  <span className="car-pax">{isHindi ? "6+1 यात्री · 4 बैग" : "6+1 Pax · 4 Bags"}</span>
                  <strong className="car-price">{formatInr(calculatedQuote.fares.innova)}</strong>
                  <a
                    className="button button-primary button-sm"
                    href={`/book.html?from=${calcFrom}&to=${calcTo}&trip=${calcTripType}&vehicle=innova`}
                  >
                    {isHindi ? "चुनें ↗" : "Select ↗"}
                  </a>
                </div>

                <div className="calc-fare-box">
                  <span className="car-type">Tempo Traveller</span>
                  <span className="car-pax">{isHindi ? "12–26 यात्री · लगेज" : "12–26 Pax · Luggage"}</span>
                  <strong className="car-price">{formatInr(calculatedQuote.fares.tempo)}</strong>
                  <a
                    className="button button-outline button-sm"
                    href={`/book.html?from=${calcFrom}&to=${calcTo}&trip=${calcTripType}&vehicle=tempo`}
                  >
                    {isHindi ? "चुनें ↗" : "Select ↗"}
                  </a>
                </div>
              </div>

              {/* Direct Booking CTA */}
              <div className="calc-action-bar">
                <p className="calc-note">
                  {isHindi
                    ? "✓ एक्सप्रेसवे टोल और स्टेट टैक्स सम्मिलित। शून्य रिटर्न टोल। एसी हमेशा चालू।"
                    : "✓ Includes expressway toll and state tax for one-way drops. No return surcharge. 100% AC guaranteed."}
                </p>
                <a
                  className="button button-primary"
                  href={`/book.html?from=${calcFrom}&to=${calcTo}&trip=${calcTripType}`}
                >
                  {isHindi ? "इस रूट पर कैब बुक करें ↗" : "Book Cab on This Route ↗"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filterable Outstation Route Directory */}
      <section
        id="route-directory"
        className="home-section route-directory-section"
        aria-labelledby="directory-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "रूट डायरेक्टरी" : "Route Directory"}
              </p>
              <h2 id="directory-heading">
                {isHindi ? (
                  <>
                    प्रमुख इंटर-सिटी कॉरिडोर,
                    <br />
                    <i>सटीक दूरी और विस्तृत यात्रा मार्गदर्शन।</i>
                  </>
                ) : (
                  <>
                    Primary intercity corridors,
                    <br />
                    <i>verified distances and highway advice.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="directory-filter-tabs" role="tablist" aria-label="Route Categories">
            <button
              type="button"
              className={`filter-tab-btn ${categoryFilter === "all" ? "is-active" : ""}`}
              onClick={() => setCategoryFilter("all")}
            >
              {isHindi ? "सभी कॉरिडोर (All)" : "All Corridors"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${categoryFilter === "expressway" ? "is-active" : ""}`}
              onClick={() => setCategoryFilter("expressway")}
            >
              {isHindi ? "एक्सप्रेसवे (Yamuna / Superhighways)" : "Expressways"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${categoryFilter === "heritage" ? "is-active" : ""}`}
              onClick={() => setCategoryFilter("heritage")}
            >
              {isHindi ? "हेरिटेज व किले (Jaipur / Gwalior)" : "Heritage & Forts"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${categoryFilter === "pilgrimage" ? "is-active" : ""}`}
              onClick={() => setCategoryFilter("pilgrimage")}
            >
              {isHindi ? "तीर्थ स्थल (Mathura / Vrindavan)" : "Pilgrimage Circuits"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${categoryFilter === "intercity" ? "is-active" : ""}`}
              onClick={() => setCategoryFilter("intercity")}
            >
              {isHindi ? "लंबी दूरी (Intercity 200+ km)" : "Long Distance (200+ km)"}
            </button>
          </div>

          {/* Route Cards Grid */}
          <Stagger className="directory-routes-grid" step={0.05}>
            {filteredRoutes.map((route) => {
              const guidance = routeGuidance[route.id];
              const fromCapital = route.from.charAt(0).toUpperCase() + route.from.slice(1);
              const toCapital = route.to.charAt(0).toUpperCase() + route.to.slice(1);
              const isLocal = route.kind === "local";

              return (
                <StaggerItem className="directory-route-card" as="article" key={route.id} id={route.id}>
                  <div className="route-card-top">
                    <div className="route-title-badge-row">
                      <span className="route-type-badge">
                        {isLocal
                          ? isHindi
                            ? "लोकल दर्शन"
                            : "LOCAL SIGHTSEEING"
                          : isHindi
                          ? "एक्सप्रेसवे कॉरिडोर"
                          : "EXPRESSWAY CORRIDOR"}
                      </span>
                      <span className="route-dist-badge">
                        {route.km} km · {route.duration}
                      </span>
                    </div>

                    <h3 className="route-endpoints-title">
                      {isLocal ? (
                        isHindi ? "आगरा लोकल दर्शन (8 घंटे / 80 किमी)" : "Agra Local Sightseeing (8h / 80km)"
                      ) : (
                        <>
                          <span>{fromCapital}</span>
                          <span className="route-arrow" aria-hidden="true">→</span>
                          <span>{toCapital}</span>
                        </>
                      )}
                    </h3>

                    {guidance && (
                      <p className="route-highway-tag">
                        🛣️ <strong>{guidance.highway}</strong>
                      </p>
                    )}

                    {guidance && (
                      <div className="route-guidance-snippet">
                        <div className="guidance-point">
                          <span className="point-icon">🌅</span>
                          <p>
                            <strong>{isHindi ? "प्रस्थान सुझाव:" : "Best Departure:"}</strong>{" "}
                            {guidance.departureTip[activeLanguage]}
                          </p>
                        </div>
                        <div className="guidance-point">
                          <span className="point-icon">☕</span>
                          <p>
                            <strong>{isHindi ? "रेस्ट स्टॉप्स:" : "Rest Stops:"}</strong>{" "}
                            {guidance.restStops[activeLanguage]}
                          </p>
                        </div>
                        <div className="guidance-point">
                          <span className="point-icon">🧾</span>
                          <p>
                            <strong>{isHindi ? "टोल नीति:" : "Toll Policy:"}</strong>{" "}
                            {guidance.tollTaxPolicy[activeLanguage]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="route-card-bottom">
                    <div className="route-fares-mini-row">
                      <div className="mini-fare">
                        <span className="label">Sedan</span>
                        <span className="val">{formatInr(route.fares.sedan)}</span>
                      </div>
                      <div className="mini-fare">
                        <span className="label">Ertiga</span>
                        <span className="val">{formatInr(route.fares.ertiga)}</span>
                      </div>
                      <div className="mini-fare">
                        <span className="label">Innova</span>
                        <span className="val">{formatInr(route.fares.innova)}</span>
                      </div>
                      <div className="mini-fare">
                        <span className="label">Tempo</span>
                        <span className="val">{formatInr(route.fares.tempo)}</span>
                      </div>
                    </div>

                    <div className="route-card-actions">
                      <a
                        className="button button-primary"
                        href={`/book.html?from=${route.from}&to=${route.to}`}
                      >
                        {isHindi ? "कैब बुक करें ↗" : "Book Cab ↗"}
                      </a>
                      <a
                        className="button button-outline"
                        href={
                          isLocal
                            ? `${langPrefix}/routes/agra-sightseeing-taxi/`
                            : `${langPrefix}/routes/${route.from}-to-${route.to}-taxi/`
                        }
                      >
                        {isHindi ? "विस्तृत गाइड" : "Route Guide"}
                      </a>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Agra Outstation Distance & Transit Matrix Table */}
      <section
        className="home-section distance-matrix-section"
        aria-labelledby="matrix-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "दूरी और समय सारणी" : "Distance & Transit Matrix"}
              </p>
              <h2 id="matrix-heading">
                {isHindi ? (
                  <>
                    आगरा से सभी प्रमुख शहरों की दूरी,
                    <br />
                    <i>हाईवे नाम, अनुमानित समय और प्रारंभिक किराया।</i>
                  </>
                ) : (
                  <>
                    Key travel corridors from Agra,
                    <br />
                    <i>exact distances, drive times, and starting fares.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="matrix-table-wrapper">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th scope="col">{isHindi ? "गंतव्य (Destination)" : "Destination City"}</th>
                  <th scope="col">{isHindi ? "दूरी (Distance)" : "Distance (KM)"}</th>
                  <th scope="col">{isHindi ? "समय (Duration)" : "Drive Time"}</th>
                  <th scope="col">{isHindi ? "मुख्य हाईवे (Corridor)" : "Primary Highway"}</th>
                  <th scope="col">{isHindi ? "टोल स्थिति (Tolls)" : "Toll Policy"}</th>
                  <th scope="col">{isHindi ? "शुरुआती किराया (Sedan)" : "Sedan Fare"}</th>
                  <th scope="col">{isHindi ? "बुकिंग (Action)" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {DISTANCE_MATRIX.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{row.destination[activeLanguage]}</strong>
                    </td>
                    <td>{row.distanceKm} km</td>
                    <td>{row.duration}</td>
                    <td>
                      <span className="highway-badge">{row.highway}</span>
                    </td>
                    <td>
                      <span className="toll-badge">{row.tollStatus[activeLanguage]}</span>
                    </td>
                    <td>
                      <strong className="table-fare">{formatInr(row.sedanFare)}</strong>
                    </td>
                    <td>
                      <a
                        className="button button-outline button-xs"
                        href={`/book.html?from=${row.fromId}&to=${row.toId}`}
                      >
                        {isHindi ? "बुक करें ↗" : "Book ↗"}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Corridor Fare Intelligence — analytics board (motion.dev) */}
      <section
        className="home-section routes-analytics-section"
        aria-labelledby="routes-analytics-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "किराया विश्लेषण बोर्ड" : "Fare Intelligence Board"}
              </p>
              <h2 id="routes-analytics-heading">
                {isHindi ? (
                  <>
                    हमारे कॉरिडोर का लाइव डेटा,
                    <br />
                    <i>प्रति किमी लागत और टोल पारदर्शिता।</i>
                  </>
                ) : (
                  <>
                    What our corridors actually cost,
                    <br />
                    <i>per-kilometre maths with tolls included.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <Reveal>
            <AnalyticsBoard
              title={isHindi ? "आगरा आउटस्टेशन कॉरिडोर — सेडान बेंचमार्क" : "Agra outstation corridors — sedan benchmark"}
              description={
                isHindi
                  ? "सभी आंकड़े 2025–26 के वास्तविक सेडान कोटेशन से, टोल व राज्य कर सहित।"
                  : "Every figure below is derived from live 2025–26 sedan quotes, inclusive of expressway tolls and state permits."
              }
              metrics={[
                {
                  id: "corridors",
                  label: isHindi ? "कवर किए कॉरिडोर" : "Corridors covered",
                  value: DISTANCE_MATRIX.length,
                  unit: isHindi ? "मार्ग" : "routes",
                  icon: "route",
                  delta: isHindi ? "5 राज्य" : "5 states",
                  deltaTone: "flat",
                  spark: [6, 7, 7, 8, 9, 10, DISTANCE_MATRIX.length],
                },
                {
                  id: "avg-km",
                  label: isHindi ? "औसत दूरी" : "Average distance",
                  value: 138,
                  unit: "km",
                  icon: "gauge",
                  spark: [96, 104, 118, 126, 133, 138],
                },
                {
                  id: "avg-rate",
                  label: isHindi ? "औसत ₹/किमी" : "Average ₹ / km",
                  value: Math.round(
                    DISTANCE_MATRIX.reduce((sum, row) => sum + row.sedanFare / row.distanceKm, 0) /
                      DISTANCE_MATRIX.length
                  ),
                  prefix: "₹",
                  icon: "rupee",
                  delta: isHindi ? "टोल सहित" : "tolls included",
                },
                {
                  id: "fastest",
                  label: isHindi ? "सबसे तेज़ कॉरिडोर" : "Fastest corridor",
                  value: 40,
                  unit: "km · 50 min",
                  icon: "clock",
                  delta: isHindi ? "फतेहपुर सीकरी" : "Fatehpur Sikri",
                  deltaTone: "flat",
                },
              ]}
              bars={DISTANCE_MATRIX.slice(0, 6).map((row) => ({
                id: row.toId,
                label: row.destination[activeLanguage],
                value: row.sedanFare,
                display: `${formatInr(row.sedanFare)} · ${row.distanceKm} km`,
                icon: "car" as const,
                muted: row.distanceKm < 60,
              }))}
              barHeading={isHindi ? "किराया तुलना (सेडान, वन-वे)" : "Fare comparison (sedan, one-way)"}
              footerNote={
                isHindi
                  ? "₹/किमी दर में ईंधन, चालक भत्ता, टोल व पार्किंग शामिल है।"
                  : "Rates include fuel, driver allowance, tolls and parking. Night charge applies 11 PM–6 AM."
              }
              legend={[
                { label: isHindi ? "लंबी दूरी" : "Long haul" },
                { label: isHindi ? "डे-ट्रिप" : "Day trip", muted: true },
              ]}
            />
          </Reveal>
        </div>
      </section>

      {/* Highway Toll, Tax & Operating Advice */}
      <section
        className="home-section highway-rules-section"
        aria-labelledby="highway-rules-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "हाईवे नियम व एडवाइजरी" : "Highway Operating Advice"}
              </p>
              <h2 id="highway-rules-heading">
                {isHindi ? (
                  <>
                    पारदर्शी टोल, टैक्स व परिचालन नियम,
                    <br />
                    <i>बिना किसी अप्रत्याशित आश्चर्य के।</i>
                  </>
                ) : (
                  <>
                    Transparent toll, tax & driving advice,
                    <br />
                    <i>no surprises on the expressway.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="highway-rules-grid">
            <div className="highway-rule-card">
              <div className="rule-card-icon">🛣️</div>
              <h3>{isHindi ? "यमुना एक्सप्रेसवे टोल नीति" : "Yamuna Expressway Tolls"}</h3>
              <p>
                {isHindi
                  ? "आगरा से दिल्ली वन-वे किराये (₹3,499) में यमुना एक्सप्रेसवे का संपूर्ण टोल शुल्क पहले से शामिल होता है। हमारी सभी गाड़ियों में फास्टैग (FASTag) लगा है, जिससे टोल प्लाजा पर बिना नकद रुके सीधी निकासी होती है।"
                  : "Fixed one-way bookings between Agra and Delhi NCR (from ₹3,499) include full Yamuna Expressway toll plazas. All fleet vehicles are equipped with active commercial FASTag for zero-halt plaza transit."}
              </p>
            </div>

            <div className="highway-rule-card">
              <div className="rule-card-icon">🏛️</div>
              <h3>{isHindi ? "राज्य सीमा कमर्शियल टैक्स" : "Inter-State Border Permits"}</h3>
              <p>
                {isHindi
                  ? "दिल्ली, हरियाणा, राजस्थान और मध्य प्रदेश में प्रवेश करते समय राज्य परिवहन कमर्शियल टैक्स नियमों का पालन किया जाता है। वन-वे बुकिंग्स में यह राशि सम्मिलित है; राउंड-ट्रिप में वास्तविक सरकारी रसीद के आधार पर बिलिंग होती है।"
                  : "State tourist transport permits for entry into Delhi NCR, Haryana, Rajasthan, and MP are strictly compliant with official RTO norms. Included in fixed one-ways; billed at exact government receipt on round-trips."}
              </p>
            </div>

            <div className="highway-rule-card">
              <div className="rule-card-icon">📏</div>
              <h3>{isHindi ? "300 किमी/दिन आउटस्टेशन बेस" : "300 KM/Day Outstation Rule"}</h3>
              <p>
                {isHindi
                  ? "मल्टी-डे आउटस्टेशन दौरों के लिए न्यूनतम 300 किमी प्रति कैलेंडर दिवस का पारदर्शी नियम लागू होता है। वास्तविक दूरी अधिक होने पर तय प्रति-किमी दर (जैसे सेडान ₹10/किमी, अर्टिगा ₹14/किमी) से गणना की जाती है।"
                  : "Multi-day outstation round trips follow the standard 300 km/day minimum formula. Excess distance is billed transparently at your booked vehicle's per-km slab without inflated surcharges."}
              </p>
            </div>

            <div className="highway-rule-card">
              <div className="rule-card-icon">🌙</div>
              <h3>{isHindi ? "पारदर्शी नाइट ड्राइविंग अलाउंस" : "Night Driving Allowance"}</h3>
              <p>
                {isHindi
                  ? `रात 8:00 बजे (20:00) से सुबह 6:00 बजे के बीच यात्रा करने पर ड्राइवर के लिए ₹${outstationRules.nightAllowanceCab} (कारों हेतु) तथा ₹${outstationRules.nightAllowanceTempo} (टेम्पो हेतु) का फिक्स नाइट अलाउंस देय होता है।`
                  : `Journeys operating between 08:00 PM and 06:00 AM carry a flat driver night allowance of ₹${outstationRules.nightAllowanceCab} for cars and ₹${outstationRules.nightAllowanceTempo} for Tempo Travellers.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Routes FAQ Accordion */}
      <section
        className="home-section routes-faq-section"
        aria-labelledby="routes-faq-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "रूट्स व हाईवे एफएक्यू" : "Route FAQs"}
              </p>
              <h2 id="routes-faq-heading">
                {isHindi ? (
                  <>
                    हाईवे यात्रा से जुड़े जरूरी सवाल,
                    <br />
                    <i>बुकिंग से पहले स्पष्ट और सीधे जवाब।</i>
                  </>
                ) : (
                  <>
                    Questions about outstation travel?
                    <br />
                    <i>Straightforward answers upfront.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="routes-faq-accordion">
            {ROUTE_FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  className={`routes-faq-item ${isOpen ? "is-open" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="routes-faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`routes-faq-answer-${index}`}
                  >
                    <span>{item.q[activeLanguage]}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="routes-faq-answer"
                      id={`routes-faq-answer-${index}`}
                    >
                      <p>{item.a[activeLanguage]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom 24x7 Local Dispatch CTA Card */}
      <section className="container routes-cta-container">
        <div className="routes-cta-card">
          <div className="routes-cta-content">
            <span className="routes-cta-badge">24×7 HIGHWAY DISPATCH DESK</span>
            <h2>
              {isHindi
                ? "कस्टम आउटस्टेशन रूट या ग्रुप यात्रा की योजना बना रहे हैं?"
                : "Need a custom outstation corridor or group tour?"}
            </h2>
            <p>
              {isHindi
                ? "आगरा, दिल्ली, जयपुर, या किसी भी उत्तर भारतीय शहर के लिए हमारी स्थानीय टीम से सीधे बात करें। 2 मिनट में वाहन की पुष्टि और त्वरित कोटेशन प्राप्त करें।"
                : "Speak directly with our local fleet desk in Taj Ganj, Agra. Instant vehicle confirmations, multi-day itinerary coordination, and all-inclusive corporate quotes."}
            </p>
            <div className="routes-cta-buttons">
              <a
                className="button button-primary"
                href="/book.html"
              >
                {isHindi ? "ऑनलाइन बुक करें ↗" : "Book Online ↗"}
              </a>
              <a
                className="button button-outline"
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                {isHindi ? "व्हाट्सएप संपर्क" : "WhatsApp Us"}
              </a>
              <a
                className="button button-outline"
                href={`tel:${contact.phone}`}
              >
                {contact.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
