import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { packages, type TourPackage } from "../data";

interface PackagesPageProps {
  language?: SupportedLanguage;
}

type PackageFilterCategory = "all" | "sightseeing" | "dawn" | "pilgrimage" | "multiday";

interface PackageCardData {
  pkg: TourPackage;
  categories: PackageFilterCategory[];
  badgeTag: string;
  badgeClass: string;
  durationBadge: string;
  durationIcon: string;
  stops: string[];
  inclusions: string[];
  vehiclePrices: { label: string; price: string }[];
}

const PACKAGE_METADATA: Record<string, {
  categories: PackageFilterCategory[];
  badgeTag: string;
  badgeClass: string;
  durationBadge: string;
  durationIcon: string;
  stops: string[];
  inclusions: string[];
  vehiclePrices: { label: string; price: string }[];
  suitedFor: string;
  recommendedFleet: string;
}> = {
  "agra-day": {
    categories: ["sightseeing"],
    badgeTag: "MOST POPULAR",
    badgeClass: "bg-primary text-on-primary",
    durationBadge: "8–10 Hours",
    durationIcon: "schedule",
    stops: ["Taj Mahal (Dawn/Morning)", "Agra Fort Diwan-i-Khas", "Baby Taj (Itimad-ud-Daulah)", "Mehtab Bagh Sunset"],
    inclusions: [
      "Hotel or Agra Cantt Railway Station pickup & drop",
      "All fuel, commercial toll parking receipts included",
      "Dedicated AC chauffeur & chilled bottled water",
    ],
    vehiclePrices: [
      { label: "Ertiga", price: "₹4,499" },
      { label: "Innova", price: "₹6,499" },
      { label: "Tempo", price: "₹9,500" },
    ],
    suitedFor: "First-Time Visitors",
    recommendedFleet: "Sedan Dzire / Ertiga",
  },
  "taj-sunrise": {
    categories: ["dawn", "sightseeing"],
    badgeTag: "DAWN SPECIAL",
    badgeClass: "bg-gold-accent text-ink-charcoal font-bold",
    durationBadge: "5:00 AM Departure",
    durationIcon: "alarm",
    stops: ["5:15 AM Gate Queue Priority", "Taj First Light Glow", "Mehtab Bagh Morning View", "Heritage Breakfast Halt"],
    inclusions: [
      "VIP Dawn priority chauffeur timing & hotel pickup",
      "Skip-the-line guidance & prime photo vantage access",
      "Chilled towels, hydration kit & umbrella on board",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹12,999" },
      { label: "Innova Crysta", price: "₹15,500" },
      { label: "Urbania Van", price: "₹22,000" },
    ],
    suitedFor: "Couples & Photographers",
    recommendedFleet: "Innova Crysta VIP",
  },
  "mathura-vrindavan": {
    categories: ["pilgrimage"],
    badgeTag: "PILGRIMAGE",
    badgeClass: "bg-terracotta-sandstone text-on-primary",
    durationBadge: "55 KM Corridor",
    durationIcon: "map",
    stops: ["Krishna Janmabhoomi", "Dwarkadhish Mathura", "Banke Bihari Temple", "Prem Mandir Light Show"],
    inclusions: [
      "Aarti schedule synchronized so you never encounter closed gates",
      "Designated drop points nearest to temple e-rickshaw links",
      "Agra round-trip transit with UP state permit paid",
    ],
    vehiclePrices: [
      { label: "Ertiga", price: "₹5,500" },
      { label: "Innova", price: "₹7,500" },
      { label: "Tempo", price: "₹11,500" },
    ],
    suitedFor: "Families & Pilgrims",
    recommendedFleet: "Ertiga / Innova / Tempo",
  },
  "gatimaan-express": {
    categories: ["dawn", "sightseeing"],
    badgeTag: "FAST-TRACK",
    badgeClass: "bg-primary text-on-primary",
    durationBadge: "12h Total Tour",
    durationIcon: "train",
    stops: ["Nizamuddin Train Reception", "Agra Cantt Nameboard Meet", "Taj Mahal & Red Fort", "5-Star Buffet & Return"],
    inclusions: [
      "Agra Cantt platform greeting with guest nameboard",
      "Full-day dedicated executive sedan or Innova in Agra",
      "Assisted drop back to Gatimaan Express 5:50 PM return",
    ],
    vehiclePrices: [
      { label: "Executive Sedan", price: "₹14,999" },
      { label: "Innova Crysta", price: "₹17,999" },
    ],
    suitedFor: "Business & Delhi Expats",
    recommendedFleet: "Train + Executive Cab",
  },
  "agra-fort-day": {
    categories: ["sightseeing", "multiday"],
    badgeTag: "2 DAYS / 1 NIGHT",
    badgeClass: "bg-terracotta-sandstone text-on-primary",
    durationBadge: "2 Full Days",
    durationIcon: "hotel",
    stops: ["Day 1: Fort + Artisan Lane", "Sunset Yamuna Point", "Day 2: Taj Dawn & Sikandra", "Fatehpur Sikri Capital"],
    inclusions: [
      "48-hour continuous vehicle custody for your family",
      "Excursion to Emperor Akbar's Tomb & Fatehpur Sikri",
      "Driver night allowance & parking fully settled",
    ],
    vehiclePrices: [
      { label: "Innova Crysta", price: "₹11,500" },
      { label: "Tempo Traveller", price: "₹16,500" },
    ],
    suitedFor: "Unhurried Elders",
    recommendedFleet: "Innova Crysta",
  },
  "golden-triangle": {
    categories: ["multiday"],
    badgeTag: "ICONIC CIRCUIT",
    badgeClass: "bg-ink-charcoal text-gold-accent font-bold",
    durationBadge: "3 Imperial Cities",
    durationIcon: "route",
    stops: ["Delhi India Gate & Qutub", "Agra Taj Mahal Sunrise", "Chand Baori Stepwell", "Jaipur Amber Fort & Hawa"],
    inclusions: [
      "All 3 interstate border permits (UP, RJ, Delhi NCT)",
      "Dedicated long-range highway chauffeur with night halt",
      "Flexible Delhi airport or Jaipur airport conclusion",
    ],
    vehiclePrices: [
      { label: "Innova Crysta", price: "₹24,000" },
      { label: "Tempo Traveller", price: "₹36,000" },
    ],
    suitedFor: "International Voyagers",
    recommendedFleet: "Innova / Tempo Traveller",
  },
};

const PACKAGES_FAQS = [
  {
    q: "Are monument entry tickets included in the package price?",
    a: "Monument tickets are intentionally excluded to give you full financial transparency and avoid exorbitant intermediary markups. Indian citizens pay ₹50, SAARC tourists pay ₹540, and foreign tourists pay ₹1,100 at the Taj Mahal. Your chauffeur will guide you directly to the electronic ASI contactless kiosk or assist you with booking online via the official ASI portal on your phone.",
  },
  {
    q: "Can we customize monument stops or spend extra time at the Taj Mahal?",
    a: "Yes, absolutely. Because all our tours are 100% private charters, you set the tempo. If you want to spend 3 hours immersed in the Taj Mahal's marble gardens and skip a minor monument, or make a lunch stopover at a particular culinary spot in Agra, your chauffeur will happily accommodate your preferences without extra charges within the daily duration.",
  },
  {
    q: "Do you provide English, Spanish, German, or French-speaking tour guides?",
    a: "Yes. We coordinate with Ministry of Tourism certified and licensed Archaeological Survey of India (ASI) guides who speak fluent English, French, Spanish, German, Italian, or Russian. The guide fee is fixed at government-mandated tariffs and can be added directly to your itinerary upon reservation.",
  },
  {
    q: "What happens if our train (e.g. Gatimaan Express) or flight is delayed?",
    a: "We track train numbers (such as 12050 Gatimaan Express or 12002 Shatabdi) and flight arrivals in real-time. If your train or flight is delayed, your assigned chauffeur remains stationed at the arrival terminal with zero waiting penalty for up to 90 minutes.",
  },
  {
    q: "Can elderly passengers or wheelchair users be accommodated comfortably?",
    a: "Yes, our fleet includes comfortable high-seating vehicles like the Innova Crysta and Force Urbania that offer easy ingress and egress. We can arrange collapsible wheelchair storage in the trunk and coordinate golf-cart battery shuttle transit between monument gates and monument entries where walking distances are extensive.",
  },
];

export function PackagesPage({ language = "en" }: PackagesPageProps) {
  // Category Filter State
  const [activeCategory, setActiveCategory] = useState<PackageFilterCategory>("all");

  // Enrich packages with metadata
  const enrichedPackages = useMemo<PackageCardData[]>(() => {
    return packages.map((pkg) => {
      const meta = PACKAGE_METADATA[pkg.id] || {
        categories: ["sightseeing"],
        badgeTag: "CURATED TOUR",
        badgeClass: "bg-primary text-on-primary",
        durationBadge: pkg.duration,
        durationIcon: "schedule",
        stops: [...pkg.places],
        inclusions: [...pkg.includes].slice(0, 3),
        vehiclePrices: [
          { label: "Ertiga", price: `₹${Math.round((pkg.from * 1.25) / 100) * 100}` },
          { label: "Innova", price: `₹${Math.round((pkg.from * 1.8) / 100) * 100}` },
        ],
        suitedFor: "Sightseeing Travelers",
        recommendedFleet: "Sedan / Innova",
      };
      return {
        pkg,
        categories: meta.categories,
        badgeTag: meta.badgeTag,
        badgeClass: meta.badgeClass,
        durationBadge: meta.durationBadge,
        durationIcon: meta.durationIcon,
        stops: meta.stops,
        inclusions: meta.inclusions,
        vehiclePrices: meta.vehiclePrices,
      };
    });
  }, []);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    if (activeCategory === "all") return enrichedPackages;
    return enrichedPackages.filter((item) => item.categories.includes(activeCategory));
  }, [enrichedPackages, activeCategory]);

  // Structured Data (Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TaxiService",
        "@id": "https://skbagheltravels.in/#service",
        name: "SK Baghel Tour & Travels Private Sightseeing Packages",
        serviceType: "Private Heritage & Outstation Tour Packages",
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
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://skbagheltravels.in/en/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Packages",
            item: "https://skbagheltravels.in/en/packages/",
          },
        ],
      },
      ...packages.map((pkg) => ({
        "@type": "TouristTrip",
        name: pkg.name,
        description: pkg.blurb,
        touristType: "Cultural, Heritage & Sightseeing",
        itinerary: {
          "@type": "ItemList",
          numberOfItems: pkg.places.length,
          itemListElement: pkg.places.map((place, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: place,
          })),
        },
        offers: {
          "@type": "Offer",
          price: pkg.from,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      })),
      {
        "@type": "FAQPage",
        mainEntity: PACKAGES_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* TOP ARCHITECTURAL HERO INTRO */}
      <section className="relative bg-surface-container-low overflow-hidden border-b border-border-warm/60">
        {/* Subtle architectural lattice watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full text-on-surface" preserveAspectRatio="none" viewBox="0 0 100 100">
            <pattern height="20" id="mughal-lattice-hero" patternUnits="userSpaceOnUse" width="20">
              <path d="M 0 10 L 10 0 L 20 10 L 10 20 Z" fill="none" stroke="currentColor" strokeWidth="0.75"></path>
              <circle cx="10" cy="10" fill="currentColor" r="1.5"></circle>
            </pattern>
            <rect fill="url(#mughal-lattice-hero)" height="100%" width="100%"></rect>
          </svg>
        </div>

        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-2xl relative z-10">
          {/* Breadcrumb Bar */}
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm mb-space-lg" aria-label="Breadcrumb">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">Tour Packages</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-sandstone-wash w-fit">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-terracotta-sandstone font-semibold">
                  Agra Tour &amp; Sightseeing Desk
                </span>
              </div>
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal leading-[1.12]">
                Handcrafted North India journeys. <br className="hidden sm:inline" />
                <span className="italic font-normal text-terracotta-sandstone">Thoughtfully chauffeured.</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Private, doorstep-pickup itineraries covering the Taj Mahal, sacred Braj temples, imperial Mughal ruins, and the Golden Triangle. Complete fare transparency, verified English &amp; Hindi-speaking commercial chauffeurs, and zero commission-shop traps.
              </p>
            </div>
            
          </div>

          {/* Trust Ribbon Mosaic (Compact -20%) */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-3">
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg flex items-center gap-2 shadow-xs border border-border-warm/60">
              <span className="material-symbols-outlined text-primary text-[20px]">explore</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">6 Signature Packages</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Same-Day to Multi-Day</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg flex items-center gap-2 shadow-xs border border-border-warm/60">
              <span className="material-symbols-outlined text-success-jade text-[20px]">verified_user</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">0% Shopping Traps</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Direct monuments only</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg flex items-center gap-2 shadow-xs border border-border-warm/60">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">Govt-Approved Guides</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Licensed ASI historians</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-lg flex items-center gap-2 shadow-xs border border-border-warm/60">
              <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">Doorstep Pickup</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Hotel &amp; Cantt Station</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & TAB NAVIGATION BAR (Compact -20%) */}
      <section className="bg-surface-container py-3 border-b border-border-warm/60 sticky top-20 z-30 backdrop-blur-md bg-surface-container/95">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin flex flex-wrap items-center justify-between gap-space-md">
          {/* Filter Segmented Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-high rounded-xl">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeCategory === "all"
                  ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                  : "text-on-surface hover:bg-surface-container-lowest"
              }`}
              onClick={() => setActiveCategory("all")}
              type="button"
            >
              All Packages ({packages.length})
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeCategory === "sightseeing"
                  ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                  : "text-on-surface hover:bg-surface-container-lowest"
              }`}
              onClick={() => setActiveCategory("sightseeing")}
              type="button"
            >
              Taj &amp; Agra Sightseeing
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeCategory === "dawn"
                  ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                  : "text-on-surface hover:bg-surface-container-lowest"
              }`}
              onClick={() => setActiveCategory("dawn")}
              type="button"
            >
              Dawn &amp; Fast-Track
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeCategory === "pilgrimage"
                  ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                  : "text-on-surface hover:bg-surface-container-lowest"
              }`}
              onClick={() => setActiveCategory("pilgrimage")}
              type="button"
            >
              Pilgrimage Circuits
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeCategory === "multiday"
                  ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                  : "text-on-surface hover:bg-surface-container-lowest"
              }`}
              onClick={() => setActiveCategory("multiday")}
              type="button"
            >
              Multi-Day Golden Triangle
            </button>
          </div>

          {/* Quick Assistance Anchor */}
          <div className="flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-primary text-[16px]">support_agent</span>
            <span>Need a tailored route?</span>
            <a className="text-primary font-bold hover:underline text-xs" href="#custom-quote">
              Custom Itinerary Desk ↓
            </a>
          </div>
        </div>
      </section>

      {/* CURATED PACKAGES CATALOG GRID (Compact -20%) */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-6">
          <div>
            <span className="font-label-caps text-[9.5px] text-primary uppercase font-bold tracking-widest">
              Handpicked Itineraries
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">Curated North India Tours</h2>
          </div>
          <p className="font-body-sm text-[10.5px] text-on-surface-variant max-w-md">
            All vehicles strictly private, sanitized with commercial yellow-plate tourist permits. Guaranteed on-time dispatch from Taj Ganj, Agra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPackages.map((item) => {
            const { pkg } = item;
            const packageDetailUrl = `/en/packages/${pkg.slug}`;
            const bookStep1Url = `/book.html?package=${encodeURIComponent(pkg.slug)}&step=1`;
            const whatsappPackageUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
              `Hello SK Baghel Travels, I am interested in the ${pkg.name}.`
            )}`;

            return (
              <article
                key={pkg.id}
                className="flex flex-col bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden border border-border-warm"
              >
                <div className="relative h-44 sm:h-48 bg-surface-container overflow-hidden group">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={pkg.name}
                    src={pkg.image}
                  />
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-label-caps uppercase tracking-wider shadow-xs font-bold ${item.badgeClass}`}>
                      {item.badgeTag}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-ink-charcoal/90 text-ivory-surface text-[8.5px] font-label-caps uppercase tracking-wider backdrop-blur-sm font-semibold">
                      {pkg.kicker}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm text-ink-charcoal text-[8.5px] font-label-caps font-semibold flex items-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">{item.durationIcon}</span>
                    <span>{item.durationBadge}</span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <a href={packageDetailUrl} className="group">
                      <h3 className="font-headline-sm text-base sm:text-[17px] text-ink-charcoal font-bold leading-snug group-hover:text-primary transition-colors">
                        {pkg.name}
                      </h3>
                    </a>
                    <p className="font-body-sm text-[10.5px] text-on-surface-variant line-clamp-2 leading-relaxed">
                      {pkg.blurb}
                    </p>
                  </div>

                  {/* Key Monument Stops pills */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <span className="font-label-caps text-[8.5px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      Key Monument Stops
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.stops.map((stop, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.5 bg-sandstone-wash rounded font-label-caps text-[8.5px] text-on-surface font-medium"
                        >
                          {stop}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Inclusions List */}
                  <div className="space-y-1 text-on-surface-variant font-body-sm text-[10px] pt-0.5">
                    {item.inclusions.map((inc, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[14px] shrink-0">check_circle</span>
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing & CTAs */}
                  <div className="pt-2 mt-auto flex flex-col gap-2 bg-surface-container-low p-2.5 sm:p-3 rounded-lg border border-border-warm/60">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="font-body-sm text-[9.5px] text-on-surface-variant block">Sedan Starting</span>
                        <span className="font-price-display text-lg text-primary leading-none font-bold">
                          ₹{pkg.from.toLocaleString("en-IN")}
                        </span>
                        <span className="font-body-sm text-[9.5px] text-on-surface-variant"> / group</span>
                      </div>
                      <div className="text-right font-label-caps text-[8.5px] text-on-surface-variant space-y-0.5">
                        {item.vehiclePrices.map((vp, vIdx) => (
                          <div key={vIdx}>{vp.label}: {vp.price}</div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <a
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-ink-charcoal text-ivory-surface text-xs font-semibold hover:bg-ink-slate transition-colors"
                        href={whatsappPackageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined text-gold-accent text-[16px]">chat</span> WhatsApp
                      </a>
                      <a
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs"
                        href={packageDetailUrl}
                      >
                        <span>View Details</span> →
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* PACKAGE COMPARISON & FLEET DECISION MATRIX (Compact -20%) */}
      <section className="bg-surface-container-low py-8 sm:py-10 border-t border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-3xl mx-auto mb-6">
            <span className="font-label-caps text-[9.5px] text-primary uppercase font-bold tracking-widest">
              Executive Comparison
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">
              Package &amp; Fleet Decision Matrix
            </h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              Compare durations, monument highlights, recommended vehicle choices, and fixed honest pricing side-by-side.
            </p>
          </div>
          {/* Matrix Table Container */}
          <div className="overflow-x-auto bg-surface-container-lowest rounded-xl shadow-xs border border-border-warm">
            <table className="w-full text-left font-body-sm text-xs text-on-surface">
              <thead className="bg-surface-container font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider border-b border-border-warm">
                <tr>
                  <th className="py-2.5 px-3">Tour Circuit</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Key Monuments Covered</th>
                  <th className="py-2.5 px-3">Starting Fare</th>
                  <th className="py-2.5 px-3">Best Suited For</th>
                  <th className="py-2.5 px-3">Recommended Fleet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/50">
                {packages.map((pkg, idx) => {
                  const meta = PACKAGE_METADATA[pkg.id] || {
                    suitedFor: "Sightseeing Travelers",
                    recommendedFleet: "Sedan / Innova",
                  };
                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-sandstone-wash/40 transition-colors ${
                        idx % 2 === 1 ? "bg-sandstone-wash/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-ink-charcoal">
                        <a href={`/en/packages/${pkg.slug}`} className="hover:text-primary transition-colors">
                          {pkg.name}
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{pkg.duration}</td>
                      <td className="py-2.5 px-3 text-[10.5px]">{pkg.places.join(", ")}</td>
                      <td className="py-2.5 px-3 font-bold text-primary">₹{pkg.from.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-sandstone-wash text-ink-charcoal font-label-caps text-[8.5px]">
                          {meta.suitedFor}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-secondary text-[10.5px]">{meta.recommendedFleet}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* THE HONEST HERITAGE CHARTER (Compact -20%) */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full">
        <div className="flex flex-col gap-1 text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center justify-center gap-1 text-primary font-label-caps text-[9.5px] uppercase font-bold tracking-widest">
            <span className="material-symbols-outlined text-[15px]">verified</span> 100% Transparent Chauffeur Ethics
          </div>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">The Honest Heritage Charter</h2>
          <p className="font-body-md text-xs text-on-surface-variant">
            No unexpected baggage surcharges, no hidden highway entry cess, and an absolute zero tolerance policy toward unwanted tourist emporium detours.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Included Column */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success-jade/10 text-success-jade flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </div>
              <div>
                <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Always Included in Your Quote</h3>
                <p className="font-body-sm text-[10px] text-on-surface-variant">Full contractual transparency backed by GST invoice</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 font-body-md text-xs text-on-surface">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-[16px] mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Clean Commercial AC Vehicle:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Deeply sanitized interior, functional climate control, ample boot luggage space.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-[16px] mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Police-Verified Professional Chauffeur:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Uniformed, non-smoking, courteous, and thoroughly route-trained on Yamuna &amp; Braj corridors.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-[16px] mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">All Tolls, Fuel &amp; Parking Included:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">No demanding loose cash at monument parking stands or highway expressway booths.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-[16px] mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Interstate Border Passenger Taxes:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Pre-paid UP, Rajasthan, and Delhi commercial tourist entry permits.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-[16px] mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Complimentary Hydration:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Sealed chilled mineral water bottles and route tissue packs in every car.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Excluded / Transparent Clarifications Column */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              </div>
              <div>
                <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Transparent Exclusions</h3>
                <p className="font-body-sm text-[10px] text-on-surface-variant">Pay direct or book separately with zero markup</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 font-body-md text-xs text-on-surface">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-[16px] mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">ASI Monument Entrance Tickets:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Payable directly via the Archaeological Survey of India QR portal or ticket counter (e.g., Taj Mahal ₹50 Indian / ₹1,100 Foreigner).</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-[16px] mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">ASI Licensed Guide Fees (Optional):</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Govt-approved multilingual guides can be arranged upon request at fixed official tariffs (approx ₹1,200–₹1,800).</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-[16px] mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Personal Dining &amp; Hotel Stays:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">Lunches, dinners, and accommodation are traveler's choice unless booking all-inclusive packages.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-[16px] mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Driver Night Allowance past 10:00 PM:</strong>
                  <p className="text-on-surface-variant text-[10.5px]">A nominal ₹300 night charge applies strictly if tours extend past 10:00 PM for late-night highway transits.</p>
                </div>
              </li>
            </ul>
            {/* Zero Commission Callout Banner */}
            <div className="mt-auto p-2.5 rounded-lg bg-sandstone-wash flex items-center gap-2 border border-border-warm">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">article_shortcut</span>
              <p className="font-body-sm text-[10px] text-on-surface font-medium">
                <span className="font-bold text-primary">Strict Zero-Commission Shopping Promise:</span> Our chauffeurs never divert you to overpriced marble emporiums or craft bazaars unless you specifically request an artisan visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (SIMPLE 3-STEP BOOKING - Compact -20%) */}
      <section className="bg-surface-container py-8 sm:py-10 border-t border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="font-label-caps text-[9.5px] text-primary uppercase font-bold tracking-widest">
              Frictionless Process
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">Reserve in Three Simple Steps</h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              From enquiry to chauffeur doorstep arrival in Agra or Delhi within hours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4.5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sandstone-wash text-primary flex items-center justify-center font-headline-sm text-sm font-bold">
                01
              </div>
              <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Choose Circuit &amp; Vehicle</h3>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant">
                Select your favored heritage itinerary, vehicle class (Dzire, Ertiga, Crysta, or Tempo), and travel date via our online engine or direct WhatsApp.
              </p>
              <div className="font-label-caps text-[9.5px] text-primary mt-auto flex items-center gap-1 font-bold">
                <span>INSTANT QUOTE RESPONSE</span> →
              </div>
            </div>
            {/* Step 2 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4.5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sandstone-wash text-primary flex items-center justify-center font-headline-sm text-sm font-bold">
                02
              </div>
              <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">28% Advance Deposit</h3>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant">
                Secure vehicle custody via UPI, Google Pay, or direct Bank Transfer. An instant booking voucher with full operator details and GST invoice is dispatched.
              </p>
              <div className="font-label-caps text-[9.5px] text-success-jade mt-auto flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>SECURE ALLOCATION GUARANTEE</span>
              </div>
            </div>
            {/* Step 3 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4.5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sandstone-wash text-primary flex items-center justify-center font-headline-sm text-sm font-bold">
                03
              </div>
              <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Doorstep Chauffeur Arrival</h3>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant">
                Receive chauffeur contact and cab registration number 2 hours prior to start. Chauffeur arrives at your hotel porch or station platform with your name placard.
              </p>
              <div className="font-label-caps text-[9.5px] text-primary mt-auto flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">done_all</span>
                <span>BALANCE PAID AT TRIP END</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (Compact -20%) */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="font-label-caps text-[9.5px] text-primary uppercase font-bold tracking-widest">
              Concierge Answers
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">Frequently Asked Questions</h2>
            <p className="font-body-md text-xs text-on-surface-variant">
              Everything you need to know about monument timings, multilingual guides, luggage capacities, and cancellation policies.
            </p>
            <div className="p-3 bg-sandstone-wash rounded-xl mt-2 flex flex-col gap-1 border border-border-warm">
              <span className="font-label-caps text-[9px] text-primary font-bold">UNSURE ABOUT FRIDAY TAJ CLOSING?</span>
              <p className="font-body-sm text-[10px] text-on-surface">
                Please note: The Taj Mahal is closed every Friday for general visitors. Our Friday itineraries swap to Agra Fort, Fatehpur Sikri, and Mathura.
              </p>
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col gap-2" id="package-faq-accordion">
            {PACKAGES_FAQS.map((faq, fIdx) => (
              <details
                key={fIdx}
                className="group bg-surface-container-lowest rounded-xl p-3 sm:p-3.5 shadow-2xs border border-border-warm open:shadow-xs transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-title-md text-xs sm:text-[13px] text-ink-charcoal font-semibold select-none">
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform text-[18px]">
                    expand_more
                  </span>
                </summary>
                <div className="pt-2 font-body-md text-[10.5px] text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* DIRECT DISPATCH & CUSTOM ITINERARY INQUIRY DESK */}
      <section className="bg-ink-charcoal text-ivory-surface py-space-3xl relative overflow-hidden" id="custom-quote">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center">
            {/* Left Column Info */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-ink-slate text-gold-accent w-fit font-label-caps text-label-caps uppercase tracking-widest">
                <span className="material-symbols-outlined text-[16px]">headset_mic</span>
                <span>24×7 Custom Tour Planning Desk</span>
              </div>
              <h2 className="font-headline-hero text-headline-hero text-ivory-surface leading-tight">
                Need a custom multi-city itinerary or group tour?
              </h2>
              <p className="font-body-lg text-body-lg text-secondary-container max-w-xl leading-relaxed">
                From multi-day wedding travel to multi-week Rajasthan heritage loops, our Agra dispatch desk plans personalized turn-by-turn routes with verified commercial tourist vehicles.
              </p>
              {/* Trust Badges Row */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs text-secondary-container font-label-caps text-label-caps">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-ink-slate/60 border border-warm/10">
                  <span className="material-symbols-outlined text-gold-accent text-[18px]">bolt</span>
                  <span>15-Minute Response</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-ink-slate/60 border border-warm/10">
                  <span className="material-symbols-outlined text-gold-accent text-[18px]">directions_car</span>
                  <span>Tailored Fleet Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Column Dedicated Luxury Concierge Box */}
            <div className="lg:col-span-5">
              <div className="bg-ink-slate/80 p-space-xl rounded-xl border border-warm/10 shadow-xl flex flex-col gap-space-md backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-warm/10 pb-space-sm">
                  <div>
                    <span className="font-label-caps text-label-caps text-gold-accent uppercase tracking-wider block">
                      Direct Chauffeur Dispatch
                    </span>
                    <h3 className="font-title-lg text-title-lg text-ivory-surface font-semibold">
                      Connect With Our Supervisor
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[28px]">support_agent</span>
                </div>
                {/* Contact Channels */}
                <div className="flex flex-col gap-space-sm">
                  {/* Call Card */}
                  <a
                    className="flex items-center justify-between p-space-md rounded-lg bg-terracotta-sandstone hover:bg-terracotta-sunlit text-ivory-surface transition-colors shadow-sm group"
                    href={`tel:${contact.phone}`}
                  >
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-full bg-ink-charcoal/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-label-lg text-label-lg font-bold">Call {contact.phoneDisplay}</span>
                        <span className="font-body-sm text-body-sm opacity-90">Immediate 24×7 Call Dispatch</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </a>
                  {/* WhatsApp Card */}
                  <a
                    className="flex items-center justify-between p-space-md rounded-lg bg-ink-charcoal hover:bg-ink-charcoal/90 text-ivory-surface transition-colors border border-warm/10 group"
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      "Hello SK Baghel Travels, I would like a custom tour quote."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-full bg-gold-accent/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-gold-accent text-[20px]">chat</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-label-lg text-label-lg font-bold">WhatsApp Direct Quote</span>
                        <span className="font-body-sm text-body-sm text-secondary-container">
                          Route estimates &amp; vehicle photos in 15 mins
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gold-accent text-[20px] transition-transform group-hover:translate-x-1">
                      open_in_new
                    </span>
                  </a>
                </div>
                {/* Operating Assurance Badge */}
                <div className="pt-space-xs flex items-center justify-center gap-1.5 text-center font-label-caps text-label-caps text-secondary-container border-t border-warm/10">
                  <span className="w-2 h-2 rounded-full bg-success-jade"></span>
                  <span>Available 24 hours · Taj Ganj Agra Headquarters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PackagesPage;
