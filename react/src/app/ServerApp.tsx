import { ErrorBoundary } from "../components/ErrorBoundary";
import { SiteLayout } from "../layouts/SiteLayout";
import { HomePage } from "../pages/HomePage";
import { ServicesPage } from "../pages/ServicesPage";
import { RoutesPage } from "../pages/RoutesPage";
import { PackagesPage } from "../pages/PackagesPage";
import { FleetPage } from "../pages/FleetPage";
import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { FaqPage } from "../pages/FaqPage";
import { TermsPage } from "../pages/TermsPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RouteDetailPage } from "../pages/RouteDetailPage";
import { PackageDetailPage } from "../pages/PackageDetailPage";
import { VehicleDetailPage } from "../pages/VehicleDetailPage";
import { BookingPage } from "../features/booking/BookingPage";
import { MarketingPage } from "../pages/MarketingPage";
import { SeoLandingPage } from "../pages/SeoLandingPage";
import { SEO_LANDING_SLUGS, type SeoLandingSlug } from "../data/seoLandingSlugs";
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
  if (SEO_LANDING_SLUGS.includes(section as SeoLandingSlug)) {
    const labels: Record<string, string> = {
      "tempo-traveller-on-rent-agra": "Tempo Traveller on Rent in Agra | 12–24 Seater, ₹25/km",
      "same-day-agra-tour-from-delhi": "Same Day Agra Tour from Delhi | Private Car",
      "delhi-to-agra-taxi": "Delhi to Agra Taxi | One-Way ₹3,499 | SK Baghel",
      "taj-mahal-taxi-service": "Taj Mahal Taxi Service Agra | One-Day & Full-Day Cabs",
    };
    const title = labels[section] || `${section.replaceAll("-", " ")} | SK Baghel Tour & Travels`;
    return { title, description: `${title}. Verified drivers, transparent fare confirmation and easy phone or WhatsApp booking.`, ogImage: "/assets/brand/og-banner.webp", keywords: [title, "Agra taxi", "Agra cab booking"] };
  }
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
    return {
      title: `${vehicle.name} Hire in Agra — Fares & Booking | SK Baghel`,
      description: `${vehicle.blurb} Compare seats (${vehicle.seats}), luggage (${vehicle.bags}), outstation rate from ₹${vehicle.perKm}/km, local & transfers.`,
      ogImage: vehicle.image,
      keywords: [vehicle.name, `${vehicle.name} Agra`, `${vehicle.name} rental`, "Agra taxi fleet", "outstation cab Agra"],
    };
  }

  if (tour) {
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
    return {
      title: `${from} to ${to} taxi fare | SK Baghel`,
      description: `${route.duration} private taxi from ${from} to ${to}, with transparent fares across our fleet.`,
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [`${from} to ${to} taxi`, `${from} to ${to} cab fare`, "outstation taxi Agra", "expressway cab"],
    };
  }

  if (section === "home") {
    return {
      title: "Agra Taxi & Cab Booking | SK Baghel Tour & Travels",
      description: "Book an Agra taxi, Tempo Traveller or Innova. Agra to Delhi from ₹3,499. Call or WhatsApp to confirm. Transparent fares and clear booking terms.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi service", "Agra cab booking", "Agra to Delhi cab", "Tempo Traveller Agra", "Taj Mahal tours", "SK Baghel Travels"],
    };
  }

  if (section === "services") {
    return {
      title: "Taxi Services in Agra | Outstation, Local & Airport Cabs | SK Baghel",
      description: "Complete guide to Agra taxi services: One-way outstation cabs to Delhi & Jaipur from ₹3,499, local sightseeing packages from ₹1,900, Tempo Travellers, and 24x7 airport transfers.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi services", "outstation cabs Agra", "local sightseeing Agra", "airport transfers Agra", "tempo traveller rental"],
    };
  }

  if (section === "routes") {
    return {
      title: "Agra Outstation Taxi Routes & Fares Directory | SK Baghel",
      description: "Outstation cab network from Agra to Delhi, Jaipur, Mathura, Gwalior & Lucknow. Live route calculator, distance matrix, expressway tolls included from ₹3,499.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra outstation taxi routes", "Agra to Delhi taxi fare", "Agra to Jaipur cab", "highway tolls included"],
    };
  }

  if (section === "packages") {
    return {
      title: "Agra Tour Packages & Taj Mahal Sightseeing Circuits | SK Baghel",
      description: "Curated private tour packages: Taj Mahal Sunrise tour, Mathura Vrindavan, Gatimaan train package & Golden Triangle. Multi-currency switcher, transparent all-inclusive fares.",
      ogImage: "/assets/packages/taj-dawn.webp",
      keywords: ["Agra tour packages", "Taj Mahal sunrise tour", "Mathura Vrindavan tour", "Golden Triangle package", "private tour guide"],
    };
  }

  if (section === "fleet") {
    return {
      title: "Our Fleet — Sedan, Ertiga, Innova Crysta & Tempo Traveller | SK Baghel",
      description: "Explore our sanitized, chauffeur-driven Agra cab fleet: Dzire sedan, Ertiga MPV, Innova Crysta, Tempo Traveller & Urbania van. Transparent per-km rates & flat transfers.",
      ogImage: "/assets/fleet/innova.webp",
      keywords: ["Agra cab fleet", "Dzire taxi Agra", "Ertiga rental", "Innova Crysta Agra", "Tempo Traveller", "Force Urbania"],
    };
  }

  if (section === "about") {
    return {
      title: "About Us — SK Baghel Tour & Travels Agra | 15+ Years Heritage",
      description: "Founded in Taj Ganj, Agra. Over 15 years of trusted chauffeur-driven outstation cabs, verified drivers, and transparent zero-commission heritage tours.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["About SK Baghel Travels", "Agra travel desk", "Taj Ganj taxi service", "verified drivers Agra", "heritage tours"],
    };
  }

  if (section === "contact") {
    return {
      title: "Contact Us — SK Baghel Tour & Travels Agra | 24×7 Travel Desk",
      description: "Get in touch with our 24×7 Taj Ganj dispatch desk for outstation cabs, sunrise Taj Mahal tours, and luxury group travel in Agra. Call +91 63958 67598.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Contact SK Baghel Travels", "Agra taxi phone number", "Taj Ganj dispatch desk", "24x7 cab booking"],
    };
  }

  if (section === "faq") {
    return {
      title: "Frequently Asked Questions (FAQs) — Cab Booking & Fares | SK Baghel Agra",
      description: "Find clear answers about outstation taxi rules, 300 km/day minimums, Yamuna Expressway toll inclusions, night allowances, and our 24-hr refund policy.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi FAQ", "cab booking questions", "outstation 300km rule", "night allowance taxi", "cancellation refund policy"],
    };
  }

  if (section === "terms") {
    return {
      title: "Terms & Conditions — SK Baghel Tour & Travels Agra | Cancellation Policy",
      description: "Review our transparent commercial terms: 24-hr cab cancellation with 100% refund, 6-tier tour schedule, 300 km/day outstation rules, and Agra jurisdiction.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Terms and conditions", "Agra taxi cancellation policy", "tour refund schedule", "commercial terms"],
    };
  }

  if (section === "privacy") {
    return {
      title: "Privacy Policy — SK Baghel Tour & Travels Agra | Data Protection",
      description: "Learn how we protect your personal information: DPDP Act 2023 compliance, zero third-party data selling, and secure booking phone & WhatsApp communication.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Privacy policy", "DPDP Act 2023", "passenger data protection", "confidentiality"],
    };
  }

  if (section === "404") {
    return {
      title: "404 Page Not Found — SK Baghel Tour & Travels Agra",
      description: "Uncharted route — let us guide you back. Search verified Agra cabs, outstation routes and private tour packages.",
      ogImage: "/assets/brand/og-banner.webp",
    };
  }

  return {
    title: `${section.replaceAll("-", " ")} | SK Baghel Tour & Travels`,
    description: "Agra taxi, outstation cabs, Tempo Travellers and private tours with transparent fares.",
    ogImage: "/assets/brand/og-banner.webp",
  };
}

export interface AppProps {
  pathname?: string;
}

export function ServerApp({ pathname: propPathname }: AppProps = {}) {
  const pathname = propPathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const { language, section } = getMarketingPath(pathname);
  const isHome =
    pathname === "/" ||
    pathname === "/hi/" ||
    pathname === "/hi" ||
    pathname === "/en/" ||
    pathname === "/en" ||
    pathname === "/index.html" ||
    section === "home";
  const isMarketingHub = marketingHubs.includes(section as (typeof marketingHubs)[number]);
  const isSeoLanding = SEO_LANDING_SLUGS.includes(section as SeoLandingSlug);
  const cleanPath = pathname.replace(/\/$/, "");
  const isBooking =
    cleanPath.endsWith("book.html") ||
    section === "book" ||
    section === "booking" ||
    cleanPath === "/book" ||
    cleanPath === "/booking" ||
    cleanPath === "/en/book" ||
    cleanPath === "/hi/book";

  const matchedRoute = routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    const hindiFrom = item.from === "agra" && item.to === "agra" ? "agra-darshan" : `${item.from}-se-${item.to}`;
    return pathname.includes(`${from}-taxi`) || pathname.includes(`${hindiFrom}-taxi`);
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
    isSeoLanding ||
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
        ) : isSeoLanding ? (
          <SeoLandingPage slug={section as SeoLandingSlug} />
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
        ) : isMarketingHub || pathname.startsWith("/en/") || pathname.startsWith("/hi/") ? (
          <MarketingPage language={language} section={section} />
        ) : (
          <NotFoundPage language={language} />
        )}
      </SiteLayout>
    </ErrorBoundary>
  );
}

export default ServerApp;
export { ServerApp as App };
