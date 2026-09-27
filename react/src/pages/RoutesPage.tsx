import { useState, useMemo, useEffect } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import { InstantRouteCalculator } from "../components/routes/InstantRouteCalculator";
import { Pagination } from "../components/ui/Pagination";
import { loadRoutesManifest } from "../services/catalogManifest";

export interface RoutesPageProps {
  language?: SupportedLanguage;
}

export type RouteCategory = "expressway" | "golden-triangle" | "pilgrimage" | "heritage" | "local" | "tempo";

interface RouteItem {
  id: string;
  name: string;
  origin?: string;
  destination?: string;
  category: RouteCategory;
  categoryBadge: string;
  distanceKm: number;
  duration: string;
  highway: string;
  description: string;
  tollNote: string;
  stateTaxNote: string;
  pricingModel?: string;
  fares: {
    sedan: number;
    ertiga: number;
    crysta: number;
    tempo: number;
    urbania: number;
  };
}

interface ManifestRouteData {
  o: string;
  d: string;
  km: number;
  m: number;
  fh: number;
  fs: number;
  fe: number;
  fi: number;
  ft: number;
  fu: number;
  pm: "oneway" | "day120" | "tempo" | "tour" | "custom";
  c: string;
  toll: 1 | 0;
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
  const [manifest, setManifest] = useState<Record<string, ManifestRouteData> | null>(null);
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
  const itemsPerPage = 12;

  useEffect(() => {
    let isMounted = true;
    loadRoutesManifest()
      .then((data) => {
        if (isMounted && data && Object.keys(data).length > 0) {
          setManifest(data as any);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const allRoutes = useMemo<RouteItem[]>(() => {
    if (!manifest) return PRIMARY_ROUTES;
    return Object.entries(manifest).map(([slug, item]) => {
      const isLocal = item.pm === "day120";
      const isTempo = item.pm === "tempo";
      let category: RouteCategory = "expressway";
      const cLower = (item.c || "").toLowerCase();
      if (cLower.includes("expressway") || cLower.includes("delhi") || cLower.includes("gurgaon") || cLower.includes("noida")) {
        category = "expressway";
      } else if (cLower.includes("jaipur") || cLower.includes("golden") || cLower.includes("rajasthan")) {
        category = "golden-triangle";
      } else if (cLower.includes("mathura") || cLower.includes("vrindavan") || cLower.includes("haridwar") || cLower.includes("ayodhya") || cLower.includes("ganga")) {
        category = "pilgrimage";
      } else if (cLower.includes("lucknow") || cLower.includes("gwalior") || cLower.includes("heritage")) {
        category = "heritage";
      } else if (isLocal) {
        category = "local";
      } else if (isTempo) {
        category = "tempo";
      } else {
        category = "expressway";
      }

      const durationHrs = Math.floor(item.m / 60);
      const durationMins = item.m % 60;
      const durationStr = `${durationHrs}h${durationMins ? ` ${durationMins}m` : ""}`;
      const dist = item.km > 0 ? item.km : durationHrs * 55;

      return {
        id: slug,
        name: `${item.o} → ${item.d}`,
        origin: item.o,
        destination: item.d,
        category,
        categoryBadge: item.c ? item.c.replace("->", "→") : (isLocal ? "LOCAL 120KM PACKAGE" : "OUTSTATION CORRIDOR"),
        distanceKm: dist,
        duration: durationStr,
        highway: item.c.includes("->") ? item.c.replace("->", "⇄") : item.c || "Direct Highway Corridor",
        description: isLocal
          ? `Dedicated 120 km full-day local & outstation chauffeur service connecting ${item.o} to ${item.d}.`
          : isTempo
          ? `Spacious 9-26 seater Tempo Traveller & Force Urbania group rental connecting ${item.o} to ${item.d}.`
          : `Point-to-point AC outstation cab directly connecting ${item.o} to ${item.d} with transparent pricing.`,
        tollNote: item.toll === 1 ? "Highway tolls included in one-way fare" : "Tolls as per actuals",
        stateTaxNote: item.o.toLowerCase().includes("delhi") || item.d.toLowerCase().includes("delhi")
          ? "Delhi/Haryana state permit included"
          : item.o.toLowerCase().includes("jaipur") || item.d.toLowerCase().includes("jaipur")
          ? "Rajasthan state entry tax included"
          : "Interstate commercial permits clear",
        pricingModel: item.pm,
        fares: {
          sedan: item.fs || 2500,
          ertiga: item.fe || 3200,
          crysta: item.fi || 4500,
          tempo: item.ft > 100 ? item.ft : (dist > 0 ? dist * (item.ft || 17) : 9500),
          urbania: item.fu > 100 ? item.fu : (dist > 0 ? dist * (item.fu || 25) : 14000),
        },
      };
    });
  }, [manifest]);

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
    const q = searchQuery.trim().toLowerCase();
    return allRoutes.filter((route) => {
      const matchesFilter =
        selectedFilter === "all" ||
        route.category === selectedFilter ||
        (selectedFilter === "local" && route.pricingModel === "day120") ||
        (selectedFilter === "tempo" && route.pricingModel === "tempo");
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        route.name.toLowerCase().includes(q) ||
        (route.origin && route.origin.toLowerCase().includes(q)) ||
        (route.destination && route.destination.toLowerCase().includes(q)) ||
        route.categoryBadge.toLowerCase().includes(q) ||
        route.highway.toLowerCase().includes(q) ||
        route.description.toLowerCase().includes(q)
      );
    });
  }, [allRoutes, selectedFilter, searchQuery]);

  const paginatedRoutes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRoutes.slice(start, start + itemsPerPage);
  }, [filteredRoutes, currentPage, itemsPerPage]);

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
                <div className="font-title-md text-xs sm:text-[13px] text-ink-charcoal font-bold">{allRoutes.length} Corridors</div>
                <div className="font-body-sm text-[9.5px] text-on-surface-variant">Verified Intercity Drops</div>
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
                { id: "all", label: `All Corridors (${allRoutes.length})` },
                { id: "expressway", label: "Expressway & NCR" },
                { id: "golden-triangle", label: "Jaipur & Rajasthan" },
                { id: "pilgrimage", label: "Mathura & Pilgrimage" },
                { id: "heritage", label: "Lucknow & Gwalior" },
                { id: "local", label: "Day Packages (120 KM)" },
                { id: "tempo", label: "Tempo Traveller" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full font-label-caps text-xs uppercase tracking-wider transition-all font-bold ${
                    selectedFilter === tab.id
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-on-surface-variant font-medium mb-4">
            <span>
              Showing <strong className="text-on-surface">{filteredRoutes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredRoutes.length)}</strong> of <strong className="text-on-surface">{filteredRoutes.length}</strong> verified corridors
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="text-primary hover:underline font-semibold text-xs"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {paginatedRoutes.map((route) => (
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
                      href={`/book?from=${encodeURIComponent(route.origin || route.name.split("→")[0]?.trim() || "Agra")}&to=${encodeURIComponent(route.destination || route.name.split("→")[1]?.trim() || "")}`}
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
        {filteredRoutes.length > itemsPerPage && (
          <Pagination
            totalItems={filteredRoutes.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            className="mt-8"
            showFirstLastButtons={true}
            pageButtonLimit={5}
          />
        )}
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
