import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

export interface FleetPageProps {
  language?: SupportedLanguage;
}

interface FleetVehicle {
  id: string;
  name: string;
  classTag: string;
  category: "all" | "sedan" | "mpv" | "suv" | "group";
  highlightBadge: string;
  description: string;
  image: string;
  rates: {
    outstationPerKm: number;
    local8h80km: number;
    fullDayYamuna: number;
  };
  specs: {
    seats: string;
    luggage: string;
    climate: string;
    fuel: string;
  };
  amenities: string[];
  bestSuitedFor: string;
}

const FLEET_DATA: FleetVehicle[] = [
  {
    id: "sedan",
    name: "Maruti Dzire / Toyota Etios",
    classTag: "CLASS 01",
    category: "sedan",
    highlightBadge: "MOST POPULAR • CITY & EXPRESSWAY DROPS",
    description:
      "Agile, highly comfortable, and ideal for couples, solo business executives, and rapid airport transfers across the Yamuna Expressway and Delhi NCR.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDDtlpHyMEhQIkaWh-siDUWpvafWXLxtakmQnE3648Tz_fpFPqz3fclfXfL8vy2KSvlfvgNo6E6bBL87D1O1mNnTtnQI7pAPVo1lBjhMJyGHvzs7qVIIXZ2_s8qinUgznt8ZIoCYC7Ayc3QD1n36bl6SecXNPBKx1M65cSoi4R0xiQ4TFDVIxwVItPu_XvVGE2uZ6uo9DMIHDVXgQc1h2SyLWNR7obR2Lr2TpkGxcCVZXT3lRiaY4ZVqA",
    rates: {
      outstationPerKm: 10,
      local8h80km: 1900,
      fullDayYamuna: 3499,
    },
    specs: {
      seats: "4 Pax + Chauffeur",
      luggage: "2 Large + 2 Bags",
      climate: "Dual AC Vents",
      fuel: "1.2L DualJet Petrol",
    },
    amenities: [
      "Chilled bottled water on arrival",
      "Type-C & USB fast charging docks",
      "Reading lamps & tissues",
      "Umbrella on board",
    ],
    bestSuitedFor: "Same-day Taj Mahal tours, solo business transfers, couples visiting Fatehpur Sikri.",
  },
  {
    id: "ertiga",
    name: "Maruti Ertiga Hybrid",
    classTag: "CLASS 02",
    category: "mpv",
    highlightBadge: "FAMILY FAVORITE • ECONOMY 6-SEATER",
    description:
      "A versatile, fuel-efficient 6-passenger transporter designed for nuclear families, pilgrimage circles to Mathura-Vrindavan, and intercity sightseeing.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDhesay-ZLwlBtJ5ZxS_nHnmMWuLbYNhiTR_8-G0L93loc2JyYU38ra9_RnBzFYWW2VUkeB9EnuTm-a32VY1IqlUhT4nkGNkZNOGHaB80TLQrV-5viSEoaD9FSVqWtNLixnASZGTpeWs63Nv6x9due5VYDOo8MVPRk-0Avm26iQSVtPCRSdClQao_kvMc-jaqORcpO_6imYVUOwIdJwbqA11svh59eIGx8EgGvPvGljuPa7ScbwZiFy-w",
    rates: {
      outstationPerKm: 14,
      local8h80km: 2600,
      fullDayYamuna: 4800,
    },
    specs: {
      seats: "6 Pax + Chauffeur",
      luggage: "3 Large + 2 Cabin Bags",
      climate: "Roof-Mounted AC Blower",
      fuel: "1.5L K15C Smart Hybrid",
    },
    amenities: [
      "Dedicated roof blower airflow",
      "Flexible folding third-row seats",
      "Chilled bottled water & paper napkins",
      "Expressway emergency kit",
    ],
    bestSuitedFor: "Families with elders or children visiting temples in Mathura, Vrindavan, and Agra Fort.",
  },
  {
    id: "innova",
    name: "Toyota Innova Crysta",
    classTag: "CLASS 03",
    category: "suv",
    highlightBadge: "EXECUTIVE LUXURY • CAPTAIN CHAIRS",
    description:
      "The undisputed emperor of Indian highway touring. Featuring deep plush captain seats, independent climate control, and unmatched sound insulation.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCF3eDfcGr4R6CkrjMTNZxdC2HZoUjDprlMBBmp-43c8tc_7gD7QQ3ep6HQmju0Ih0j-VoflOA5Ir-p5czU5jDcnHPtbHrDeCAqZSmLfI9nsoFav-HUfJY3BAHuG2JPoSKlfh00Suyh6kFmuKtkXZbUCSnVDMhVCgEF864ewhoWwk8FfOJA_PEVu-riAnO_-aRUUQzBAtwTExczUJFmqOHxugrwQIWYeZeafE112-PSmuyUHzR5VUOv5Q",
    rates: {
      outstationPerKm: 18,
      local8h80km: 3500,
      fullDayYamuna: 6499,
    },
    specs: {
      seats: "6/7 Pax + Chauffeur",
      luggage: "4 Large Bags + Racks",
      climate: "Dual-Zone Digital Climate Control",
      fuel: "2.4L GD Turbo Diesel",
    },
    amenities: [
      "Reclining leatherette captain seats",
      "Dual-zone digital auto climate control",
      "Premium acoustic ride damping",
      "Mineral water bottles & newspaper",
    ],
    bestSuitedFor: "Foreign dignitaries, executive business delegations, and Golden Triangle multi-day loops.",
  },
  {
    id: "tempo",
    name: "Force Tempo Traveller",
    classTag: "CLASS 04",
    category: "group",
    highlightBadge: "GROUP TRAVEL • 12 TO 26 SEATER",
    description:
      "Roomy, high-roof touring van for large family groups, corporate offsites, and multi-city tourist parties who travel together in high comfort.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtim6k1xZ-oNG2CqsGD4G34wTroprBPYyPJ9w7UYnqlD3AJi1jQBwG4iez5kq2R7JnA5jrbU71f63NA4Fg_9ivUh1cG2YmwcFEHjP8uB8yCO_rR0jqQtih9RtLuHMblGb62Vkg7AmFKA2kJO3duZSuqnhbnsr2yPOs-zIhv8qU0SlxpBYkAneSec38qdvXX221BLjsfOswvxgP68jLhUTwIPkQ9BZgyAVkuWywbAZJbcXZVSeMcPR58g",
    rates: {
      outstationPerKm: 25,
      local8h80km: 5500,
      fullDayYamuna: 9500,
    },
    specs: {
      seats: "12 to 26 Reclining Seats",
      luggage: "Rear Bay + Heavy-Duty Carrier",
      climate: "Commercial Dual AC Compressor",
      fuel: "2.6L FM CR Common Rail",
    },
    amenities: [
      "Individual reclining high-back seats",
      "Dedicated reading lights and USB ports",
      "LCD multimedia screen & PA audio system",
      "Weatherproof roof luggage carrier",
    ],
    bestSuitedFor: "Wedding party transits, student heritage excursions, and extended Rajasthan circuits.",
  },
  {
    id: "urbania",
    name: "Force Urbania VIP",
    classTag: "CLASS 05",
    category: "group",
    highlightBadge: "VIP MONOCOQUE VAN • EUROPEAN STYLING",
    description:
      "State-of-the-art European monocoque architecture delivering whisper-quiet highway ride, plush passenger lounge, and wide panoramic windows.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDdR9ZGfEatK4fikITqlV-5YeoJBg58LlBbVg3bINsK4p3p94b0zZowjut7sHOfzG76_UwHnf8DSibSs8nFsOwlyYfZxr0Am8uXSUZDFWlP5gBNAbGaZwm04A-RAXFJmCGkHrC5ozEC8HtDyJxH8X87rz1fagIHja_tL6PuQ-HUAjHu_bL1Ba_yVq9wUlM3rRpelaYNjGly7ZXvmprg37BIu2CuP8q2Yp_Py0lH3imXVkBikdrFugYBnQ",
    rates: {
      outstationPerKm: 34,
      local8h80km: 7500,
      fullDayYamuna: 12500,
    },
    specs: {
      seats: "10 to 17 Luxury Captain Seats",
      luggage: "Dedicated Internal Deep Boot",
      climate: "Individual Jet AC Louvers",
      fuel: "Mercedes-Derived FM 2.6L CR",
    },
    amenities: [
      "Ultra-wide reclining plush captain seats",
      "Aircraft-style individual jet vents & lighting",
      "Panoramic tinted UV-cut glass",
      "Large dedicated rear luggage hold",
    ],
    bestSuitedFor: "Luxury inbound travel groups, VIP wedding entourage, and luxury Golden Triangle tours.",
  },
];

const FLEET_FAQS = [
  {
    q: "What is the difference between Ertiga and Innova Crysta for outstation travel?",
    a: "While both accommodate 6 passengers, the Toyota Innova Crysta features a heavier ladder-frame chassis, superior highway suspension, wider captain-seat comfort, and dedicated luggage space behind the 3rd row. The Maruti Ertiga is lighter and more economical, ideal for budget-conscious families with light luggage.",
  },
  {
    q: "How does the per-km billing work for outstation trips?",
    a: "Outstation round-trips are billed based on the garage-to-garage distance with an industry-standard minimum threshold of 300 km per calendar day. For example, a 2-day round trip covers a minimum billable 600 km. Expressway toll taxes, state border permits, and parking are billed transparently at actuals.",
  },
  {
    q: "Are luggage carriers or roof racks available for extra bags?",
    a: "Yes. Our Force Tempo Travellers come equipped with heavy-duty roof luggage carriers with weatherproof tarpaulin covers, in addition to their rear luggage bays. For Ertiga and Innova Crysta, covered roof carriers can be mounted on advance request for airport groups carrying large suitcases.",
  },
  {
    q: "Do all vehicles have full air-conditioning during peak summer and hill travel?",
    a: "100% yes. Every cab and van in our fleet is fitted with powerful factory-installed dual air conditioning systems. AC is kept continuously running during highway travel and city sightseeing without any compromise on passenger comfort.",
  },
  {
    q: "Are the vehicles yellow-plate commercial tourist cabs?",
    a: "Every vehicle operated by SK Baghel Tour & Travels carries a registered commercial yellow plate, All-India Tourist Permit (AITP), up-to-date fitness certificates, and comprehensive passenger insurance.",
  },
];

export function FleetPage({ language = "en" }: FleetPageProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | "sedan" | "mpv" | "suv" | "group">("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredVehicles = useMemo(() => {
    if (activeCategory === "all") return FLEET_DATA;
    return FLEET_DATA.filter((v) => v.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. BREADCRUMB & HERO */}
      <section className="w-full bg-sandstone-wash/40 py-10 sm:py-space-xl border-b border-border-warm/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-wrap">
            <a className="hover:text-primary transition-colors" href="/">
              Home
            </a>
            <span className="text-outline-variant font-medium">/</span>
            <span className="text-ink-charcoal font-semibold">Fleet &amp; Chauffeured Vehicles</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg mb-space-xl">
            <div className="max-w-3xl">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-[11px] uppercase tracking-wider font-bold">
                Commercial Luxury Fleet
              </span>
              <h1 className="font-headline-hero text-headline-hero-mobile sm:text-headline-lg lg:text-headline-hero text-ink-charcoal leading-tight tracking-tight mt-2">
                Clean, modern vehicles. Verified drivers.{" "}
                <span className="text-terracotta-sandstone italic block sm:inline">
                  Transparent rates per kilometer.
                </span>
              </h1>
              <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mt-space-md leading-relaxed">
                Explore our clean, government-registered commercial fleet in Agra. From fuel-efficient sedans
                for the Yamuna Expressway to spacious Innova Crystas and Force Urbanias for families and group travel.
                Zero hidden charges, 100% AC performance guaranteed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                className="inline-flex items-center justify-center gap-2 bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-lg text-label-lg px-6 py-3.5 rounded-lg shadow-md transition-all whitespace-nowrap font-semibold"
                href="#spec-comparison"
              >
                <span>Compare Specs</span>
                <span className="material-symbols-outlined text-[18px]">south</span>
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 bg-ink-charcoal hover:bg-ink-slate text-surface font-label-lg text-label-lg px-6 py-3.5 rounded-lg shadow-sm transition-all whitespace-nowrap font-semibold"
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[18px] text-success-jade">chat</span>
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>

          {/* Trust Proof Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm border border-border-warm/70 flex items-start gap-space-sm h-full">
              <div className="w-10 h-10 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div>
                <h4 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">100% Commercial Plates</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  All-India Tourist Permit with pre-cleared interstate taxes.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm border border-border-warm/70 flex items-start gap-space-sm h-full">
              <div className="w-10 h-10 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-[22px]">speed</span>
              </div>
              <div>
                <h4 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Speed Governed</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Strict adherence to 80/100 km/h expressway security benchmarks.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm border border-border-warm/70 flex items-start gap-space-sm h-full">
              <div className="w-10 h-10 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-[22px]">airline_seat_recline_extra</span>
              </div>
              <div>
                <h4 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Clean, Sanitized Cabins</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Vacuumed and cleaned before every single guest pickup.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm border border-border-warm/70 flex items-start gap-space-sm h-full">
              <div className="w-10 h-10 rounded bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone shrink-0">
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
              </div>
              <div>
                <h4 className="font-title-md text-title-md text-ink-charcoal leading-snug font-bold">Official GST Billing</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Instant GSTIN tax invoice for corporate &amp; family travel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY FILTERS */}
      <section className="w-full bg-surface border-b border-border-warm/60 py-4 sticky top-20 z-30 backdrop-blur-md bg-surface/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Vehicles (5)" },
            { id: "sedan", label: "Executive Sedans" },
            { id: "mpv", label: "Family MPVs (6-Seater)" },
            { id: "suv", label: "Premium SUV (Innova Crysta)" },
            { id: "group", label: "Group Vans & Minibus" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-lg font-label-caps text-xs uppercase tracking-wider transition-all whitespace-nowrap font-bold ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. COMPREHENSIVE FLEET SHOWROOM */}
      <section className="w-full py-12 sm:py-space-2xl bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-space-2xl">
          {filteredVehicles.map((veh) => (
            <article
              key={veh.id}
              className="bg-surface-container-lowest rounded-xl shadow-md border border-border-warm/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch transition-all duration-300 hover:shadow-xl"
            >
              <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] lg:min-h-full bg-sandstone-wash overflow-hidden">
                <img
                  className="w-full h-full object-cover min-h-[260px] sm:min-h-[320px] lg:min-h-full"
                  src={veh.image}
                  alt={veh.name}
                />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  <span className="inline-block px-3 py-1 rounded bg-sandstone-wash/95 backdrop-blur-sm text-terracotta-sandstone font-label-caps text-[10px] uppercase tracking-wider shadow-sm font-bold">
                    {veh.highlightBadge}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 p-6 sm:p-space-lg lg:p-space-xl flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h2 className="font-headline-md text-headline-sm sm:text-headline-md text-ink-charcoal font-semibold">
                      {veh.name}
                    </h2>
                    <span className="font-label-caps text-xs px-2.5 py-1 rounded bg-sandstone-wash text-ink-charcoal font-bold border border-border-warm">
                      {veh.classTag}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">
                    {veh.description}
                  </p>

                  {/* Pricing Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-surface-container-low p-space-md rounded-lg mb-space-md border border-border-warm/60 text-center">
                    <div className="py-1">
                      <span className="block font-label-caps text-[10px] text-secondary uppercase font-semibold">
                        Outstation Rate
                      </span>
                      <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                        <span className="font-price-display text-2xl text-terracotta-sandstone font-bold">
                          ₹{veh.rates.outstationPerKm}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">/ km</span>
                      </div>
                    </div>
                    <div className="bg-surface-container-high/40 rounded py-1 px-1 sm:border-x sm:border-border-warm/40">
                      <span className="block font-label-caps text-[10px] text-secondary uppercase font-semibold">
                        8h/80Km Local
                      </span>
                      <span className="block font-price-display text-xl text-ink-charcoal font-bold mt-0.5">
                        ₹{veh.rates.local8h80km.toLocaleString("en-IN")}
                      </span>
                      <span className="block font-body-sm text-xs text-on-surface-variant">Standard Day</span>
                    </div>
                    <div className="py-1">
                      <span className="block font-label-caps text-[10px] text-secondary uppercase font-semibold">
                        Full Day Agra
                      </span>
                      <span className="block font-price-display text-xl text-ink-charcoal font-bold mt-0.5">
                        ₹{veh.rates.fullDayYamuna.toLocaleString("en-IN")}
                      </span>
                      <span className="block font-body-sm text-xs text-success-jade font-semibold">Tolls Included</span>
                    </div>
                  </div>

                  {/* Technical Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-space-md">
                    <div className="bg-surface-container p-2.5 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-[10px] text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">
                          airline_seat_recline_normal
                        </span>
                        Seats
                      </span>
                      <span className="font-title-md text-xs text-ink-charcoal mt-1 block font-semibold">{veh.specs.seats}</span>
                    </div>
                    <div className="bg-surface-container p-2.5 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-[10px] text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">luggage</span>
                        Luggage
                      </span>
                      <span className="font-title-md text-xs text-ink-charcoal mt-1 block font-semibold">{veh.specs.luggage}</span>
                    </div>
                    <div className="bg-surface-container p-2.5 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-[10px] text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">ac_unit</span>
                        Climate
                      </span>
                      <span className="font-title-md text-xs text-ink-charcoal mt-1 block font-semibold">{veh.specs.climate}</span>
                    </div>
                    <div className="bg-surface-container p-2.5 rounded border border-border-warm/50 flex flex-col justify-between">
                      <span className="flex items-center gap-1 font-label-caps text-[10px] text-secondary uppercase font-bold">
                        <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">directions_car</span>
                        Engine
                      </span>
                      <span className="font-title-md text-xs text-ink-charcoal mt-1 block font-semibold">{veh.specs.fuel}</span>
                    </div>
                  </div>

                  {/* Amenities & Best Suited */}
                  <div className="flex flex-col gap-2 mb-space-md text-on-surface-variant font-body-sm text-sm">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-success-jade shrink-0 mt-0.5">check_circle</span>
                      <span>
                        <strong>Complimentary Amenities:</strong> {veh.amenities.join(" · ")}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone shrink-0 mt-0.5">stars</span>
                      <span>
                        <strong>Best Suited For:</strong> {veh.bestSuitedFor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-space-sm border-t border-border-warm/60 pb-2">
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <a
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-ink-charcoal hover:bg-ink-slate text-surface font-label-lg text-label-lg inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 font-semibold"
                      href={`https://wa.me/919876543210?text=Inquiry%20for%20${encodeURIComponent(veh.name)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-success-jade">chat</span>
                      <span>WhatsApp Inquiry</span>
                    </a>
                    <a
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-lg text-label-lg inline-flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 font-semibold"
                      href={`/book?vehicle=${veh.id}`}
                    >
                      <span>Book {veh.name.split(" ")[0]}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. COMPREHENSIVE COMPARISON TABLE */}
      <section id="spec-comparison" className="w-full bg-sandstone-wash/30 py-12 sm:py-space-2xl border-y border-border-warm/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-space-xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest font-bold">
              TRANSPARENT TARIFF BENCHMARK
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal mt-1 font-semibold">
              Side-by-Side Fleet Comparison
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              Compare key technical capabilities and outstation billing guidelines across all five classes before reserving your journey.
            </p>
          </div>
          <div className="w-full overflow-x-auto rounded-xl shadow-md bg-surface-container-lowest border border-border-warm/80">
            <table className="w-full text-left font-body-sm text-body-sm min-w-[760px] border-collapse">
              <thead className="bg-surface-container text-ink-charcoal font-label-caps text-[11px] uppercase tracking-wider border-b border-border-warm font-bold">
                <tr>
                  <th className="py-4 px-5 align-middle">Vehicle Class</th>
                  <th className="py-4 px-5 align-middle">Passenger Capacity</th>
                  <th className="py-4 px-5 align-middle">Luggage Capacity</th>
                  <th className="py-4 px-5 align-middle">AC &amp; Climate Control</th>
                  <th className="py-4 px-5 align-middle">Outstation Rate</th>
                  <th className="py-4 px-5 align-middle text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-4 px-5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Maruti Dzire / Etios</span>
                    <span className="font-body-sm text-xs text-secondary font-normal">Executive Sedan</span>
                  </td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant font-medium whitespace-nowrap">4 + 1 Pax</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">2 Large Trolley Bags</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">Dual Front/Rear Vents</td>
                  <td className="py-4 px-5 align-middle font-bold text-terracotta-sandstone text-base whitespace-nowrap">₹10 / km</td>
                  <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-3.5 py-1.5 rounded bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-caps text-xs tracking-wider transition-all shadow-sm font-bold"
                      href="/book?vehicle=sedan"
                    >
                      Select Sedan
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-4 px-5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Maruti Suzuki Ertiga</span>
                    <span className="font-body-sm text-xs text-secondary font-normal">Smart Hybrid MPV</span>
                  </td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant font-medium whitespace-nowrap">6 + 1 Pax</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">3 Medium + 3 Cabin</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">Roof Blower Airflow</td>
                  <td className="py-4 px-5 align-middle font-bold text-terracotta-sandstone text-base whitespace-nowrap">₹14 / km</td>
                  <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-3.5 py-1.5 rounded bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-caps text-xs tracking-wider transition-all shadow-sm font-bold"
                      href="/book?vehicle=ertiga"
                    >
                      Select MPV
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors bg-sandstone-wash/10">
                  <td className="py-4 px-5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Toyota Innova Crysta</span>
                    <span className="font-body-sm text-xs text-terracotta-sandstone font-semibold">Executive Touring</span>
                  </td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant font-medium whitespace-nowrap">6/7 + 1 Pax</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">4 Large + 4 Handbags</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">Dual-Zone Auto Digital</td>
                  <td className="py-4 px-5 align-middle font-bold text-terracotta-sandstone text-base whitespace-nowrap">₹18 / km</td>
                  <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-3.5 py-1.5 rounded bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-caps text-xs tracking-wider transition-all shadow-sm font-bold"
                      href="/book?vehicle=innova"
                    >
                      Select Crysta
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-4 px-5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Force Tempo Traveller</span>
                    <span className="font-body-sm text-xs text-secondary font-normal">Luxury Minibus</span>
                  </td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant font-medium whitespace-nowrap">12 to 26 Pax</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">15+ Bags + Deep Boot</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">Commercial Dual AC</td>
                  <td className="py-4 px-5 align-middle font-bold text-terracotta-sandstone text-base whitespace-nowrap">₹25 / km</td>
                  <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-3.5 py-1.5 rounded bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-caps text-xs tracking-wider transition-all shadow-sm font-bold"
                      href="/book?vehicle=tempo"
                    >
                      Select Minibus
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-sandstone-wash/20 transition-colors">
                  <td className="py-4 px-5 align-middle">
                    <span className="block font-title-md text-title-md text-ink-charcoal font-semibold">Force Urbania VIP</span>
                    <span className="font-body-sm text-xs text-secondary font-normal">Monocoque Executive Van</span>
                  </td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant font-medium whitespace-nowrap">9 to 17 Pax</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">12+ Suitcases Hold</td>
                  <td className="py-4 px-5 align-middle text-on-surface-variant">Individual Jet AC Louvers</td>
                  <td className="py-4 px-5 align-middle font-bold text-terracotta-sandstone text-base whitespace-nowrap">₹34 / km</td>
                  <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                    <a
                      className="inline-block px-3.5 py-1.5 rounded bg-terracotta-sandstone hover:bg-terracotta-sunlit text-on-primary font-label-caps text-xs tracking-wider transition-all shadow-sm font-bold"
                      href="/book?vehicle=urbania"
                    >
                      Select Urbania
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. FLEET FAQS */}
      <section className="w-full bg-surface py-12 sm:py-space-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-space-xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest font-bold block mb-1">
              Vehicle Guidelines &amp; Policies
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Fleet Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FLEET_FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-space-md flex items-center justify-between gap-4 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-sm sm:text-base font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-space-md pt-0 text-on-surface-variant font-body-sm leading-relaxed border-t border-border-warm/40 mt-1">
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
