import { lazy, Suspense } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SiteLayout } from "../layouts/SiteLayout";
import { HomePage } from "../pages/HomePage";

const ServicesPage = lazy(() => import("../pages/ServicesPage").then((m) => ({ default: m.ServicesPage })));
const RoutesPage = lazy(() => import("../pages/RoutesPage").then((m) => ({ default: m.RoutesPage })));
const PackagesPage = lazy(() => import("../pages/PackagesPage").then((m) => ({ default: m.PackagesPage })));
const FleetPage = lazy(() => import("../pages/FleetPage").then((m) => ({ default: m.FleetPage })));
const AboutPage = lazy(() => import("../pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import("../pages/FaqPage").then((m) => ({ default: m.FaqPage })));
const TermsPage = lazy(() => import("../pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const RouteDetailPage = lazy(() => import("../pages/RouteDetailPage").then((m) => ({ default: m.RouteDetailPage })));
const PackageDetailPage = lazy(() => import("../pages/PackageDetailPage").then((m) => ({ default: m.PackageDetailPage })));
const VehicleDetailPage = lazy(() => import("../pages/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage })));
const BookingPage = lazy(() => import("../features/booking/BookingPage").then((m) => ({ default: m.BookingPage })));
const MarketingPage = lazy(() => import("../pages/MarketingPage").then((m) => ({ default: m.MarketingPage })));
import { marketingHubs } from "./routes";
import { SeoHead } from "../components/seo/SeoHead";
import { packages, routes, vehicles } from "../data/catalogue";

export function getMarketingPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const localizedSegments = segments[0] === "en" || segments[0] === "hi" ? segments.slice(1) : segments;
  const lastSegment = localizedSegments.at(-1)?.replace(/\.html$/, "") ?? "home";
  return { language: "en" as const, section: lastSegment };
}

export interface SeoMetadata {
  title: string;
  description: string;
  ogImage?: string;
  keywords?: string[];
}

export function getSeo(pathname: string, section: string, language: "en" | "hi", isBooking: boolean): SeoMetadata {
  if (isBooking) {
    return {
      title: "Book a ride | SK Baghel Tour & Travels",
      description: "Compare vehicles and prepare a transparent mock booking from Agra.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi booking", "Agra cab reservation", "online taxi booking Agra"],
    };
  }
  const path = pathname.replace(/\/$/, "");
  const vehicle =
    path.includes("/vehicles/") &&
    vehicles.find((item) =>
      path.endsWith(item.id === "innova" ? "innova-crysta" : item.id === "tempo" ? "tempo-traveller" : item.id)
    );
  const tour = path.includes("/packages/") && packages.find((item) => path.endsWith(item.slug));
  const route = routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    const hindiFrom = item.from === "agra" && item.to === "agra" ? "agra-darshan" : `${item.from}-se-${item.to}`;
    return path.includes(`${from}-taxi`) || path.includes(`${hindiFrom}-taxi`);
  });

  if (vehicle) {
    if (language === "hi") {
      return {
        title: `${vehicle.name} किराया व बुकिंग आगरा | SK Baghel`,
        description: `${vehicle.blurb} सीटें: ${vehicle.seats}, बैग: ${vehicle.bags}, दरें: ₹${vehicle.perKm}/किमी से शुरू। पारदर्शी किराया, सत्यापित ड्राइवर।`,
        ogImage: vehicle.image,
        keywords: [vehicle.name, `${vehicle.name} आगरा`, "आगरा कैब बुकिंग", "टैक्सी किराया आगरा"],
      };
    }
    return {
      title: `${vehicle.name} Hire in Agra — Fares & Booking | SK Baghel`,
      description: `${vehicle.blurb} Compare seats (${vehicle.seats}), luggage (${vehicle.bags}), outstation rate from ₹${vehicle.perKm}/km, local & transfers.`,
      ogImage: vehicle.image,
      keywords: [vehicle.name, `${vehicle.name} Agra`, `${vehicle.name} rental`, "Agra taxi fleet", "outstation cab Agra"],
    };
  }

  if (tour) {
    if (language === "hi") {
      return {
        title: `${tour.name} — निजी टूर पैकेज व किराया | SK Baghel`,
        description: `${tour.blurb} 100% निजी वातानुकूलित कैब, गाइड सहायता व पारदर्शी दरें। अभी ऑनलाइन या कॉल पर बुक करें।`,
        ogImage: tour.image,
        keywords: [tour.name, `${tour.name} आगरा`, "ताज महल टूर", "निजी दर्शनीय यात्रा", "आगरा टूर पैकेज"],
      };
    }
    return {
      title: `${tour.name} — Private Tour Package & Fares | SK Baghel`,
      description: `${tour.blurb} 100% private sanitized AC cab, verified guide, transparent all-inclusive fares. Book online or call 24x7.`,
      ogImage: tour.image,
      keywords: [tour.name, `${tour.name} Agra`, "Taj Mahal private tour", "Agra tour package", "sightseeing cab Agra"],
    };
  }

  if (route) {
    const from = route.from[0].toUpperCase() + route.from.slice(1);
    const to = route.to[0].toUpperCase() + route.to.slice(1);
    const fromHi = route.from === "agra" ? "आगरा" : route.from === "delhi" ? "दिल्ली" : route.from;
    const toHi =
      route.to === "agra"
        ? "आगरा"
        : route.to === "delhi"
          ? "दिल्ली"
          : route.to === "jaipur"
            ? "जयपुर"
            : route.to === "mathura"
              ? "मथुरा"
              : route.to === "gwalior"
                ? "ग्वालियर"
                : route.to === "lucknow"
                  ? "लखनऊ"
                  : route.to;
    if (language === "hi") {
      return {
        title: `${fromHi} से ${toHi} टैक्सी किराया व बुकिंग | SK Baghel`,
        description: `${fromHi} से ${toHi} तक ${route.duration} की निजी एसी टैक्सी। पारदर्शी किराया, एक्सप्रेसवे टोल सहित, ₹${route.fares.sedan.toLocaleString("en-IN")} से शुरू।`,
        ogImage: "/assets/brand/og-banner.webp",
        keywords: [`${fromHi} से ${toHi} टैक्सी`, `${fromHi} ${toHi} कैब किराया`, "एक्सप्रेसवे टैक्सी"],
      };
    }
    return {
      title: `${from} to ${to} taxi fare | SK Baghel`,
      description: `${route.duration} private taxi from ${from} to ${to}, with transparent fares across our fleet.`,
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [`${from} to ${to} taxi`, `${from} to ${to} cab fare`, "outstation taxi Agra", "expressway cab"],
    };
  }

  if (section === "home") {
    if (language === "hi") {
      return {
        title: "आगरा टैक्सी और कैब बुकिंग | SK Baghel Tour & Travels",
        description: "आगरा टैक्सी, टेम्पो ट्रैवलर और इनोवा क्रिस्टा बुक करें। आगरा से दिल्ली ₹3,500 से शुरू। पारदर्शी किराये, जीएसटी इनवॉइस, सत्यापित ड्राइवर।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["आगरा टैक्सी सेवा", "आगरा कैब बुकिंग", "ताजमहल टूर", "टेम्पो ट्रैवलर आगरा", "एस के बघेल"],
      };
    }
    return {
      title: "Agra Taxi & Cab Booking | SK Baghel Tour & Travels",
      description: "Book an Agra taxi, Tempo Traveller or Innova. Agra to Delhi from ₹3,500. Call or WhatsApp to confirm. Transparent fares, GST invoice.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi service", "Agra cab booking", "Agra to Delhi cab", "Tempo Traveller Agra", "Taj Mahal tours", "SK Baghel Travels"],
    };
  }

  if (section === "services") {
    if (language === "hi") {
      return {
        title: "आगरा टैक्सी सेवाएं | आउटस्टेशन, लोकल दर्शन व एयरपोर्ट कैब | SK Baghel",
        description: "आगरा टैक्सी सेवाओं की संपूर्ण जानकारी: दिल्ली व जयपुर वन-वे कैब ₹3,499 से, लोकल आगरा दर्शन ₹1,900 से, टेम्पो ट्रैवलर एवं 24 घंटे एयरपोर्ट ट्रांसफर।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["आगरा टैक्सी सेवाएं", "आउटस्टेशन कैब आगरा", "लोकल दर्शन", "एयरपोर्ट ट्रांसफर"],
      };
    }
    return {
      title: "Taxi Services in Agra | Outstation, Local & Airport Cabs | SK Baghel",
      description: "Complete guide to Agra taxi services: One-way outstation cabs to Delhi & Jaipur from ₹3,499, local sightseeing packages from ₹1,900, Tempo Travellers, and 24x7 airport transfers.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi services", "outstation cabs Agra", "local sightseeing Agra", "airport transfers Agra", "tempo traveller rental"],
    };
  }

  if (section === "routes") {
    if (language === "hi") {
      return {
        title: "आगरा आउटस्टेशन कैब रूट्स व किराया सूची | SK Baghel",
        description: "आगरा से दिल्ली, जयपुर, मथुरा, ग्वालियर व लखनऊ के लिए आउटस्टेशन टैक्सी। 100% ऑल-इनक्लूसिव एक्सप्रेसवे टोल, लाइव रूट कैलकुलेटर व दूरी सारणी।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["आगरा आउटस्टेशन कैब", "रूट्स व किराया", "यमुना एक्सप्रेसवे टैक्सी", "दूरी सारणी"],
      };
    }
    return {
      title: "Agra Outstation Taxi Routes & Fares Directory | SK Baghel",
      description: "Outstation cab network from Agra to Delhi, Jaipur, Mathura, Gwalior & Lucknow. Live route calculator, distance matrix, expressway tolls included from ₹3,499.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra outstation taxi routes", "Agra to Delhi taxi fare", "Agra to Jaipur cab", "highway tolls included"],
    };
  }

  if (section === "packages") {
    if (language === "hi") {
      return {
        title: "आगरा टूर पैकेज व ताज महल दर्शनीय यात्रा | SK Baghel",
        description: "ताज महल सूर्योदय टूर, मथुरा-वृंदावन, गतिमान एक्सप्रेस एवं 3-दिवसीय गोल्डन ट्रायंगल टूर पैकेज। टोल-टैक्स सहित पारदर्शी मूल्य व मुद्रा परिवर्तक (INR/USD/EUR/GBP)।",
        ogImage: "/assets/packages/taj-dawn.webp",
        keywords: ["आगरा टूर पैकेज", "ताज महल सूर्योदय", "मथुरा वृंदावन यात्रा", "गोल्डन ट्रायंगल टूर"],
      };
    }
    return {
      title: "Agra Tour Packages & Taj Mahal Sightseeing Circuits | SK Baghel",
      description: "Curated private tour packages: Taj Mahal Sunrise tour, Mathura Vrindavan, Gatimaan train package & Golden Triangle. Multi-currency switcher, transparent all-inclusive fares.",
      ogImage: "/assets/packages/taj-dawn.webp",
      keywords: ["Agra tour packages", "Taj Mahal sunrise tour", "Mathura Vrindavan tour", "Golden Triangle package", "private tour guide"],
    };
  }

  if (section === "fleet") {
    if (language === "hi") {
      return {
        title: "हमारी गाड़ियाँ व टैक्सी फ्लीट | SK Baghel Tour & Travels",
        description: "सेडान, अर्टिगा, इनोवा क्रिस्टा, टेम्पो ट्रैवलर व अर्बनिया लग्जरी वैन। पारदर्शी प्रति किमी दरें व स्टेशन/एयरपोर्ट ट्रांसफर।",
        ogImage: "/assets/fleet/innova.webp",
        keywords: ["आगरा कैब फ्लीट", "डिजायर टैक्सी", "अर्टिगा बुकिंग", "इनोवा क्रिस्टा आगरा", "टेम्पो ट्रैवलर"],
      };
    }
    return {
      title: "Our Fleet — Sedan, Ertiga, Innova Crysta & Tempo Traveller | SK Baghel",
      description: "Explore our sanitized, chauffeur-driven Agra cab fleet: Dzire sedan, Ertiga MPV, Innova Crysta, Tempo Traveller & Urbania van. Transparent per-km rates & flat transfers.",
      ogImage: "/assets/fleet/innova.webp",
      keywords: ["Agra cab fleet", "Dzire taxi Agra", "Ertiga rental", "Innova Crysta Agra", "Tempo Traveller", "Force Urbania"],
    };
  }

  if (section === "about") {
    if (language === "hi") {
      return {
        title: "हमारे बारे में — एस के बघेल टूर एंड ट्रेवल्स आगरा",
        description: "15+ वर्षों का अनुभव, स्थानीय ताजगंज आगरा मुख्यालय, सत्यापित ड्राइवर और पारदर्शी कैब सेवा। जानिए हमारी कहानी और सिद्धांत।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["एस के बघेल टूर एंड ट्रेवल्स", "आगरा ट्रेवल एजेंसी", "ताजगंज आगरा", "15 वर्ष अनुभव"],
      };
    }
    return {
      title: "About Us — SK Baghel Tour & Travels Agra | 15+ Years Heritage",
      description: "Founded in Taj Ganj, Agra. Over 15 years of trusted chauffeur-driven outstation cabs, verified drivers, and transparent zero-commission heritage tours.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["About SK Baghel Travels", "Agra travel desk", "Taj Ganj taxi service", "verified drivers Agra", "heritage tours"],
    };
  }

  if (section === "contact") {
    if (language === "hi") {
      return {
        title: "संपर्क करें — एस के बघेल टूर एंड ट्रेवल्स आगरा | 24×7 ट्रेवल डेस्क",
        description: "ताजगंज आगरा में स्थित 24×7 कंट्रोल रूम से संपर्क करें। आउटस्टेशन टैक्सी, ताज महल टूर व एयरपोर्ट ट्रांसफर के लिए फोन कॉल या व्हाट्सएप करें।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["संपर्क करें", "एस के बघेल फोन नंबर", "व्हाट्सएप टैक्सी आगरा", "ताजगंज ट्रेवल डेस्क"],
      };
    }
    return {
      title: "Contact Us — SK Baghel Tour & Travels Agra | 24×7 Travel Desk",
      description: "Get in touch with our 24×7 Taj Ganj dispatch desk for outstation cabs, sunrise Taj Mahal tours, and luxury group travel in Agra. Call +91 98765 43210.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Contact SK Baghel Travels", "Agra taxi phone number", "Taj Ganj dispatch desk", "24x7 cab booking"],
    };
  }

  if (section === "faq") {
    if (language === "hi") {
      return {
        title: "सामान्य प्रश्न (FAQs) — कैब बुकिंग, किराया व नियम | एस के बघेल आगरा",
        description: "आगरा कैब बुकिंग, आउटस्टेशन 300 किमी नियम, टोल-टैक्स, नाइट चार्ज, लगेज क्षमता और 24 घंटे में मुफ्त कैंसिलेशन से जुड़े सभी सवालों के स्पष्ट जवाब।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["सामान्य प्रश्न", "आगरा टैक्सी FAQ", "नाइट चार्ज नियम", "रिफंड नीति"],
      };
    }
    return {
      title: "Frequently Asked Questions (FAQs) — Cab Booking & Fares | SK Baghel Agra",
      description: "Find clear answers about outstation taxi rules, 300 km/day minimums, Yamuna Expressway toll inclusions, night allowances, and our 24-hr refund policy.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi FAQ", "cab booking questions", "outstation 300km rule", "night allowance taxi", "cancellation refund policy"],
    };
  }

  if (section === "terms") {
    if (language === "hi") {
      return {
        title: "नियम व शर्तें — एस के बघेल टूर एंड ट्रेवल्स आगरा | कैंसिलेशन व रिफंड नीति",
        description: "हमारी पारदर्शी वाणिज्यिक शर्तें पढ़ें: 24 घंटे में 100% पूरा रिफंड, मल्टी-डे टूर कैंसिलेशन तालिका, 300 किमी आउटस्टेशन नियम व आगरा कानूनी क्षेत्राधिकार।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["नियम व शर्तें", "कैंसिलेशन नीति", "रिफंड नियम", "एस के बघेल"],
      };
    }
    return {
      title: "Terms & Conditions — SK Baghel Tour & Travels Agra | Cancellation Policy",
      description: "Review our transparent commercial terms: 24-hr cab cancellation with 100% refund, 6-tier tour schedule, 300 km/day outstation rules, and Agra jurisdiction.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Terms and conditions", "Agra taxi cancellation policy", "tour refund schedule", "commercial terms"],
    };
  }

  if (section === "privacy") {
    if (language === "hi") {
      return {
        title: "गोपनीयता नीति — एस के बघेल टूर एंड ट्रेवल्स आगरा | डेटा सुरक्षा",
        description: "हमारी ग्राहक डेटा गोपनीयता नीति: DPDP अधिनियम 2023 अनुपालन, शून्य तृतीय-पक्ष डेटा बिक्री, और सुरक्षित बुकिंग व ड्राइवर समन्वय दिशानिर्देश।",
        ogImage: "/assets/brand/og-banner.webp",
        keywords: ["गोपनीयता नीति", "डेटा सुरक्षा", "DPDP अधिनियम 2023", "एस के बघेल"],
      };
    }
    return {
      title: "Privacy Policy — SK Baghel Tour & Travels Agra | Data Protection",
      description: "Learn how we protect your personal information: DPDP Act 2023 compliance, zero third-party data selling, and secure booking phone & WhatsApp communication.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Privacy policy", "DPDP Act 2023", "passenger data protection", "confidentiality"],
    };
  }

  if (section === "404") {
    if (language === "hi") {
      return {
        title: "404 पृष्ठ नहीं मिला — एस के बघेल टूर एंड ट्रेवल्स आगरा",
        description: "अनजान रास्ता — आइए आपकी यात्रा को सही दिशा दें। आगरा टैक्सी, आउटस्टेशन कैब व टूर पैकेज तुरंत खोजें।",
        ogImage: "/assets/brand/og-banner.webp",
      };
    }
    return {
      title: "404 Page Not Found — SK Baghel Tour & Travels Agra",
      description: "Uncharted route — let us guide you back. Search verified Agra cabs, outstation routes and private tour packages.",
      ogImage: "/assets/brand/og-banner.webp",
    };
  }

  const languagePrefix = language === "hi" ? " | SK Baghel Tour & Travels" : " | SK Baghel Tour & Travels";
  return {
    title: `${section.replaceAll("-", " ")}${languagePrefix}`,
    description:
      language === "hi"
        ? "आगरा टैक्सी, आउटस्टेशन कैब, टेम्पो ट्रैवलर और निजी टूर के लिए साफ किराये।"
        : "Agra taxi, outstation cabs, Tempo Travellers and private tours with transparent fares.",
    ogImage: "/assets/brand/og-banner.webp",
  };
}

export interface AppProps {
  pathname?: string;
}

export function App({ pathname: propPathname }: AppProps = {}) {
  const pathname = propPathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const { language, section } = getMarketingPath(pathname);
  const isHome =
    pathname === "/" ||
    pathname === "/en/" ||
    pathname === "/en" ||
    pathname === "/index.html" ||
    section === "home";
  const isMarketingHub = marketingHubs.includes(section as (typeof marketingHubs)[number]);
  const cleanPath = pathname.replace(/\/$/, "");
  const isBooking =
    cleanPath.endsWith("book.html") ||
    section === "book" ||
    section === "booking" ||
    cleanPath === "/book" ||
    cleanPath === "/booking" ||
    cleanPath === "/en/book";

  const matchedRoute = routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    return pathname.includes(`${from}-taxi`);
  });

  const matchedPackage = pathname.includes("/packages/") && packages.find((item) => {
    const p = pathname.replace(/\/$/, "");
    return p.endsWith(`/${item.slug}`) || p.endsWith(item.slug);
  });

  const matchedVehicle =
    (pathname.includes("/vehicles/") || pathname.includes("/fleet/")) &&
    vehicles.find((item) => {
      const p = pathname.replace(/\/$/, "").replace(/\.html$/, "");
      const slug = item.id === "innova" ? "innova-crysta" : item.id === "tempo" ? "tempo-traveller" : item.id;
      return p.endsWith(`/${slug}`) || p.endsWith(slug) || p.endsWith(`/${item.id}`) || p.endsWith(item.id);
    });

  const isKnownRoute =
    isHome ||
    isBooking ||
    isMarketingHub ||
    Boolean(matchedRoute) ||
    Boolean(matchedPackage) ||
    Boolean(matchedVehicle) ||
    packages.some((item) => pathname.endsWith(item.slug) || pathname.endsWith(item.slug + "/"));

  const is404 =
    !isKnownRoute ||
    section === "404" ||
    pathname.endsWith("/404") ||
    pathname.endsWith("/404.html") ||
    pathname.endsWith("/404/");

  const effectiveSection = is404 ? "404" : isHome ? "home" : section;
  const {
    title: pageTitle,
    description: pageDescription,
    ogImage: pageOgImage,
    keywords: pageKeywords,
  } = getSeo(pathname, effectiveSection, language, isBooking);

  return (
    <ErrorBoundary>
      <SeoHead
        language={language}
        pathname={pathname}
        title={pageTitle}
        description={pageDescription}
        ogImage={pageOgImage}
        keywords={pageKeywords}
        noindex={isBooking || is404}
      />
      <SiteLayout>
        <Suspense fallback={null}>
          {is404 ? (
            <NotFoundPage language={language} />
          ) : isBooking ? (
            <BookingPage />
          ) : isHome ? (
            <HomePage language={language} />
          ) : matchedRoute ? (
            <RouteDetailPage language={language} route={matchedRoute} />
          ) : matchedPackage ? (
            <PackageDetailPage language={language} pkg={matchedPackage} />
          ) : matchedVehicle ? (
            <VehicleDetailPage language={language} vehicle={matchedVehicle} />
          ) : section === "services" ? (
            <ServicesPage language={language} />
          ) : section === "routes" ? (
            <RoutesPage language={language} />
          ) : section === "packages" ? (
            <PackagesPage language={language} />
          ) : section === "fleet" ? (
            <FleetPage language={language} />
          ) : section === "about" ? (
            <AboutPage language={language} />
          ) : section === "contact" ? (
            <ContactPage language={language} />
          ) : section === "faq" ? (
            <FaqPage language={language} />
          ) : section === "terms" ? (
            <TermsPage language={language} />
          ) : section === "privacy" ? (
            <PrivacyPage language={language} />
          ) : isMarketingHub || pathname.startsWith("/en/") ? (
            <MarketingPage language={language} section={section} />
          ) : (
            <NotFoundPage language={language} />
          )}
        </Suspense>
      </SiteLayout>
    </ErrorBoundary>
  );
}

export default App;
