import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { InstantRouteCalculator } from "../components/routes/InstantRouteCalculator";
import { Pagination } from "../components/ui/Pagination";

export interface RoutesPageProps {
  language?: SupportedLanguage;
}

interface RouteItem {
  id: string;
  name: string;
  category: "expressway" | "golden-triangle" | "pilgrimage" | "heritage";
  categoryBadge: string;
  distanceKm: number;
  duration: string;
  highway: string;
  description: string;
  tollNote: string;
  stateTaxNote: string;
  fares: {
    sedan: number;
    ertiga: number;
    crysta: number;
    tempo: number;
    urbania: number;
  };
}

const PRIMARY_ROUTES: RouteItem[] = [
  {
    id: "agra-delhi",
    name: "Agra → Delhi NCR & IGI Airport",
    category: "expressway",
    categoryBadge: "EXPRESSWAY CORRIDOR",
    distanceKm: 230,
    duration: "3h 30m",
    highway: "Yamuna Expressway (6-Lane Access-Controlled)",
    description: "Point-to-point drop directly to Delhi IGI Airport Terminal 1, 2, 3 or any hotel/residence across Delhi, Noida, or Gurugram.",
    tollNote: "Yamuna Expressway Toll included in one-way fare",
    stateTaxNote: "Delhi/Haryana entry tax included",
    fares: {
      sedan: 3499,
      ertiga: 4800,
      crysta: 6499,
      tempo: 9500,
      urbania: 11500,
    },
  },
  {
    id: "agra-jaipur",
    name: "Agra → Jaipur (Pink City)",
    category: "golden-triangle",
    categoryBadge: "GOLDEN TRIANGLE",
    distanceKm: 240,
    duration: "4h 30m",
    highway: "NH-21 via Bharatpur & Dausa Corridor",
    description: "The classic heritage trail connecting Agra to Jaipur. Optional stopover at Fatehpur Sikri or Chand Baori Stepwell en route.",
    tollNote: "Highway tolls included in one-way fare",
    stateTaxNote: "Rajasthan state passenger tax included",
    fares: {
      sedan: 3499,
      ertiga: 4800,
      crysta: 6499,
      tempo: 9800,
      urbania: 11800,
    },
  },
  {
    id: "agra-mathura",
    name: "Agra → Mathura & Vrindavan",
    category: "pilgrimage",
    categoryBadge: "PILGRIMAGE EXPRESS",
    distanceKm: 55,
    duration: "1h 15m",
    highway: "NH-19 (Delhi-Agra Highway)",
    description: "Short pilgrimage circuit tailored around temple prayer timings. Doorstep drops to Krishna Janmabhoomi, Banke Bihari, and Prem Mandir.",
    tollNote: "Toll included in one-way fare",
    stateTaxNote: "Within Uttar Pradesh (Zero interstate tax)",
    fares: {
      sedan: 2200,
      ertiga: 2900,
      crysta: 3800,
      tempo: 5800,
      urbania: 7200,
    },
  },
  {
    id: "agra-gwalior",
    name: "Agra → Gwalior Fort & Palace",
    category: "heritage",
    categoryBadge: "HERITAGE DAY-TRIP",
    distanceKm: 120,
    duration: "2h 30m",
    highway: "NH-44 via Dholpur & Chambal Corridor",
    description: "Majestic day excursion or one-way drop to Gwalior Fort, Jai Vilas Palace, and Scindia Museum with scenic Chambal river crossing.",
    tollNote: "Highway tolls included",
    stateTaxNote: "Madhya Pradesh state tax included",
    fares: {
      sedan: 3000,
      ertiga: 4200,
      crysta: 5400,
      tempo: 8200,
      urbania: 9800,
    },
  },
  {
    id: "agra-lucknow",
    name: "Agra → Lucknow (City of Nawabs)",
    category: "heritage",
    categoryBadge: "CAPITAL EXPRESSWAY",
    distanceKm: 335,
    duration: "4h 45m",
    highway: "Agra-Lucknow Expressway (Greenfield 6-Lane)",
    description: "Flawless high-speed transit directly on the 302-km greenfield expressway connecting Agra to Uttar Pradesh's capital city.",
    tollNote: "Agra-Lucknow expressway toll included",
    stateTaxNote: "Within Uttar Pradesh (Zero interstate tax)",
    fares: {
      sedan: 5800,
      ertiga: 7500,
      crysta: 9800,
      tempo: 14500,
      urbania: 17500,
    },
  },
  {
    id: "agra-haridwar",
    name: "Agra → Haridwar & Rishikesh",
    category: "pilgrimage",
    categoryBadge: "SACRED GANGA CORRIDOR",
    distanceKm: 385,
    duration: "6h 30m",
    highway: "Eastern Peripheral & Meerut-Haridwar Highway",
    description: "Comfortable pilgrimage or adventure transit to the foothills of the Himalayas. Direct drops to Har Ki Pauri and Tapovan Rishikesh.",
    tollNote: "Tolls included in one-way fare",
    stateTaxNote: "Uttarakhand state entry permit included",
    fares: {
      sedan: 6800,
      ertiga: 8800,
      crysta: 11500,
      tempo: 16800,
      urbania: 19800,
    },
  },
  {
    id: "agra-bharatpur",
    name: "Agra → Bharatpur Bird Sanctuary",
    category: "golden-triangle",
    categoryBadge: "WILDLIFE CORRIDOR",
    distanceKm: 56,
    duration: "1h 15m",
    highway: "NH-21 via Fatehpur Sikri",
    description: "Fast gateway transit to Keoladeo National Park (UNESCO World Heritage bird sanctuary). Ideal for morning birdwatching safaris.",
    tollNote: "Highway tolls included",
    stateTaxNote: "Rajasthan state passenger tax included",
    fares: {
      sedan: 2200,
      ertiga: 2900,
      crysta: 3800,
      tempo: 5800,
      urbania: 7200,
    },
  },
  {
    id: "agra-ayodhya",
    name: "Agra → Ayodhya Dham (Ram Mandir)",
    category: "pilgrimage",
    categoryBadge: "DEVOTIONAL PILGRIMAGE",
    distanceKm: 480,
    duration: "6h 45m",
    highway: "Agra-Lucknow Expressway & Purvanchal Link",
    description: "Direct expressway journey to Shri Ram Janmabhoomi Mandir with smooth cruising on access-controlled expressways all the way.",
    tollNote: "All expressway tolls included",
    stateTaxNote: "Within Uttar Pradesh (Zero interstate tax)",
    fares: {
      sedan: 7900,
      ertiga: 10500,
      crysta: 13800,
      tempo: 19800,
      urbania: 23500,
    },
  },
];

const ROUTE_FAQS = [
  {
    q: "How does one-way outstation taxi billing work?",
    a: "One-way fares are fixed and point-to-point. You only pay for the journey from your pickup address in Agra to your destination drop address. There are zero empty return charges and zero dead-mileage billing.",
  },
  {
    q: "Are expressway tolls and state entry taxes included in the fare?",
    a: "Yes. All our published one-way fares are 100% all-inclusive. Yamuna Expressway tolls, FASTag deductions, and commercial border passenger entry permits (Delhi, Rajasthan, Haryana, MP) are covered with zero hidden surprises.",
  },
  {
    q: "What is the 300 km/day rule for outstation round-trips?",
    a: "For multi-day or round-trip journeys, outstation cabs operate on a standard minimum billing threshold of 300 km per calendar day. For example, a 2-day round-trip has a minimum billable distance of 600 km.",
  },
  {
    q: "Can the chauffeur pick us up directly from Agra Cantt railway station or our hotel?",
    a: "Absolutely. Chauffeurs provide complimentary doorstep pickup from any hotel, residence, Agra Cantt, Agra Fort, or Raja Ki Mandi railway station.",
  },
];

export function RoutesPage({ language = "en" }: RoutesPageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const page = Number(new URLSearchParams(window.location.search).get("page"));
      return page > 0 ? page : 1;
    }
    return 1;
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(newPage));
      window.history.pushState({}, "", url.toString());
      const section = document.getElementById("routes-directory");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const filteredRoutes = useMemo(() => {
    return PRIMARY_ROUTES.filter((route) => {
      const matchesFilter = selectedFilter === "all" || route.category === selectedFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.highway.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, searchQuery]);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. BREADCRUMBS & EDITORIAL HERO */}
      <section className="relative w-full bg-surface py-space-xl lg:py-space-2xl overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin relative z-10">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-caps text-xs uppercase tracking-wider mb-space-md">
            <a className="hover:text-primary transition-colors" href="/">
              Home
            </a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Routes &amp; Outstation Corridors</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end mb-space-xl">
            <div className="lg:col-span-8">
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight max-w-3xl">
                Point-to-point intercity cabs.{" "}
                <span className="italic font-normal text-terracotta-sandstone">Zero hidden return fares.</span>
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Transparent one-way and round-trip chauffeurs connecting Agra directly to Delhi NCR, Jaipur, Mathura, Gwalior,
                Lucknow, and Rajasthan circuits. Every fare includes toll clearance options, verified commercial drivers.
              </p>
            </div>
          </div>

          {/* Trust Stats Strip (Compact -20%) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-surface-container shadow-xs mb-space-lg border border-border-warm/50">
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">signpost</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-[13px] text-ink-charcoal font-bold">8 Primary</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Expressway Corridors</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-success-jade shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-[13px] text-ink-charcoal font-bold">100% Fastag</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">&amp; Toll Clarity</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-gold-accent shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">speed</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-[13px] text-ink-charcoal font-bold">300 KM/Day</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Round-Trip Baseline</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1">
              <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-terracotta-sunlit shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">money_off</span>
              </div>
              <div>
                <div className="font-title-md text-xs sm:text-[13px] text-ink-charcoal font-bold">Zero Empty</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Return Surcharges</div>
              </div>
            </div>
          </div>

          {/* 0ms In-Memory Route Calculator across all 982 corridors */}
          <InstantRouteCalculator className="mb-space-xl" />

          {/* Search & Filter Bar (Compact -20%) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-space-md">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "All Corridors (8)" },
                { id: "expressway", label: "Expressway (Delhi NCR)" },
                { id: "golden-triangle", label: "Golden Triangle (Jaipur)" },
                { id: "pilgrimage", label: "Pilgrimage (Mathura & Ganga)" },
                { id: "heritage", label: "Heritage (Gwalior / Lucknow)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full font-label-caps text-xs uppercase tracking-wider transition-all font-bold ${selectedFilter === tab.id
                      ? "bg-ink-charcoal text-white shadow-xs"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-2 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search corridor or city..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 text-on-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPREHENSIVE ROUTE DIRECTORY (CARDS -20% Compact) */}
      <section id="routes-directory" className="w-full bg-surface py-6 sm:py-8">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-surface-container-lowest rounded-xl p-3.5 sm:p-4.5 shadow-xs border border-border-warm/70 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-[9.5px] uppercase font-bold tracking-wider">
                      {route.categoryBadge}
                    </span>
                    <span className="font-label-caps text-[9.5px] text-on-surface-variant flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-success-jade">check_circle</span>
                      {route.tollNote}
                    </span>
                  </div>

                  <h3 className="font-headline-md text-sm sm:text-base text-on-surface font-bold mb-1.5">{route.name}</h3>

                  <div className="flex items-center gap-3 font-body-sm text-[10.5px] text-on-surface-variant mb-2 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
                      {route.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                      {route.duration}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary">route</span>
                      {route.highway}
                    </span>
                  </div>

                  <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-3 leading-relaxed">
                    {route.description}
                  </p>

                  {/* Fare Grid (5-column: Sedan, Ertiga, Innova, Tempo, Urbania) */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3 p-2 rounded-lg bg-surface-container-low border border-border-warm/40 text-center">
                    <div className="p-0.5">
                      <span className="font-label-caps text-[9px] text-secondary uppercase block font-semibold">Sedan</span>
                      <span className="font-price-display text-sm sm:text-base text-primary font-bold">
                        ₹{route.fares.sedan.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-[9px] text-secondary uppercase block font-semibold">Ertiga</span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        ₹{route.fares.ertiga.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-[9px] text-secondary uppercase block font-semibold">Innova</span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        ₹{route.fares.crysta.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-[9px] text-secondary uppercase block font-semibold">Tempo</span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        ₹{route.fares.tempo.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-0.5">
                      <span className="font-label-caps text-[9px] text-secondary uppercase block font-semibold">Urbania</span>
                      <span className="font-price-display text-sm sm:text-base text-ink-charcoal font-bold">
                        ₹{route.fares.urbania.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border-warm/60">
                  <span className="font-label-caps text-[9px] text-on-surface-variant uppercase font-semibold">
                    {route.stateTaxNote}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      className="px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-caps text-xs transition-colors font-bold inline-flex items-center gap-1.5 active:scale-[0.98]"
                      href={`https://wa.me/919876543210?text=Booking%20Route%20${encodeURIComponent(route.name)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-caps text-xs transition-all shadow-xs font-bold flex items-center gap-1"
                      href={`/book?from=Agra&to=${encodeURIComponent(route.name.split("→")[1]?.trim() || "")}`}
                    >
                      <span>Book Cab</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Pagination
          totalItems={searchQuery || selectedFilter !== "all" ? filteredRoutes.length : 982}
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          className="mt-6"
          showFirstLastButtons={true}
          pageButtonLimit={5}
        />
      </section>

      {/* 3. OUTSTATION BILLING PRINCIPLES (Compact -20%) */}
      <section className="w-full bg-surface-container-low py-8 sm:py-10 border-t border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="font-label-caps text-[9.5px] text-primary uppercase tracking-widest font-bold block mb-1">
              Transparent Commercial Billing
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              The 4 Rules of Outstation Pricing
            </h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              Every fare calculated by SK Baghel Tour &amp; Travels adheres to these strict principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-[22px] mb-1.5">straighten</span>
              <h4 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">300 km/Day Minimum</h4>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant leading-relaxed">
                Standard outstation threshold applied to round-trips to ensure driver wages and highway vehicle upkeep are fairly compensated.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-[22px] mb-1.5">toll</span>
              <h4 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">All-Inclusive Tolls</h4>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant leading-relaxed">
                Yamuna Expressway and national highway tolls are included upfront in one-way quotations with zero roadside toll haggling.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-[22px] mb-1.5">bedtime</span>
              <h4 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">Night Allowance</h4>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant leading-relaxed">
                A fixed ₹300 allowance applies when the vehicle is driven between 10:00 PM and 6:00 AM to ensure chauffeur safety.
              </p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs">
              <span className="material-symbols-outlined text-primary text-[22px] mb-1.5">savings</span>
              <h4 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">28% Token Advance</h4>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant leading-relaxed">
                Reserve your ride with just a 28% advance deposit via UPI or card. Pay the remaining 72% directly to the chauffeur at trip completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROUTE FAQS (Compact -20%) */}
      <section className="w-full bg-surface py-8 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="font-label-caps text-[9.5px] text-primary uppercase tracking-widest font-bold block mb-1">
              Corridor Inquiries
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Route Questions
            </h2>
          </div>
          <div className="space-y-2.5">
            {ROUTE_FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-xs sm:text-[13px] font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-3 sm:p-3.5 pt-0 text-on-surface-variant font-body-sm text-[10.5px] leading-relaxed border-t border-border-warm/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
