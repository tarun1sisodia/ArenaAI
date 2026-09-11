import { ErrorBoundary } from "../components/ErrorBoundary";
import { SiteLayout } from "../layouts/SiteLayout";
import { HomePage } from "../pages/HomePage";
import { BookingPage } from "../features/booking/BookingPage";
import { MarketingPage } from "../pages/MarketingPage";
import { marketingHubs } from "./routes";
import { SeoHead } from "./SeoHead";
import { packages, routes, vehicles } from "../data/catalogue";

function getMarketingPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const localizedSegments = segments[0] === "en" || segments[0] === "hi" ? segments.slice(1) : segments;
  const lastSegment = localizedSegments.at(-1)?.replace(/\.html$/, "") ?? "home";
  return { language: segments[0] === "hi" ? "hi" as const : "en" as const, section: lastSegment };
}

function getSeo(pathname: string, section: string, language: "en" | "hi", isBooking: boolean) {
  if (isBooking) return { title: "Book a ride | SK Baghel Tour & Travels", description: "Compare vehicles and prepare a transparent mock booking from Agra." };
  const path = pathname.replace(/\/$/, "");
  const vehicle = path.includes("/vehicles/") && vehicles.find((item) => path.endsWith(item.id === "innova" ? "innova-crysta" : item.id === "tempo" ? "tempo-traveller" : item.id));
  const tour = path.includes("/packages/") && packages.find((item) => path.endsWith(item.slug));
  const route = routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    const hindiFrom = item.from === "agra" && item.to === "agra" ? "agra-darshan" : `${item.from}-se-${item.to}`;
    return path.includes(`${from}-taxi`) || path.includes(`${hindiFrom}-taxi`);
  });
  if (vehicle) return { title: `${vehicle.name} hire in Agra | SK Baghel`, description: `${vehicle.blurb} Compare seats, luggage, models, and transparent sample fares.` };
  if (tour) return { title: `${tour.name} | SK Baghel Tour & Travels`, description: tour.blurb };
  if (route) {
    const from = route.from[0].toUpperCase() + route.from.slice(1);
    const to = route.to[0].toUpperCase() + route.to.slice(1);
    return { title: `${from} to ${to} taxi fare | SK Baghel`, description: `${route.duration} private taxi from ${from} to ${to}, with transparent fares across our fleet.` };
  }
  if (section === "home") {
    if (language === "hi") {
      return {
        title: "आगरा टैक्सी और कैब बुकिंग | SK Baghel Tour & Travels",
        description: "आगरा टैक्सी, टेम्पो ट्रैवलर और इनोवा क्रिस्टा बुक करें। आगरा से दिल्ली ₹3,500 से शुरू। पारदर्शी किराये, जीएसटी इनवॉइस, सत्यापित ड्राइवर।"
      };
    }
    return {
      title: "Agra Taxi & Cab Booking | SK Baghel Tour & Travels",
      description: "Book an Agra taxi, Tempo Traveller or Innova. Agra to Delhi from ₹3,500. Call or WhatsApp to confirm. Transparent fares, GST invoice."
    };
  }
  const languagePrefix = language === "hi" ? " | SK Baghel Tour & Travels" : " | SK Baghel Tour & Travels";
  return {
    title: `${section.replaceAll("-", " ")}${languagePrefix}`,
    description: language === "hi" ? "आगरा टैक्सी, आउटस्टेशन कैब, टेम्पो ट्रैवलर और निजी टूर के लिए साफ किराये।" : "Agra taxi, outstation cabs, Tempo Travellers and private tours with transparent fares."
  };
}

function App() {
  const pathname = window.location.pathname;
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
  const isBooking = pathname.endsWith("book.html");
  const { title: pageTitle, description: pageDescription } = getSeo(pathname, isHome ? "home" : section, language, isBooking);

  return (
    <ErrorBoundary>
      <SeoHead language={language} pathname={pathname} title={pageTitle} description={pageDescription} noindex={isBooking} />
      <SiteLayout>
        {isBooking ? (
          <BookingPage />
        ) : isHome ? (
          <HomePage language={language} />
        ) : isMarketingHub || pathname.startsWith("/en/") || pathname.startsWith("/hi/") ? (
          <MarketingPage language={language} section={section} />
        ) : (
          <MarketingPage language={language} section={section} />
        )}
      </SiteLayout>
    </ErrorBoundary>
  );
}

export default App;
