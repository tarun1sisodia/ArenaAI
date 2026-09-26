import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";

export interface ServicesPageProps {
  language?: SupportedLanguage;
}

interface ServiceModule {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  startingFare: string;
  fareDetail: string;
  description: string;
  image: string;
  highlights: string[];
  vehicleTypes: string;
  idealFor: string;
  bookingUrl: string;
}

const SERVICES_MODULES: ServiceModule[] = [
  {
    id: "service-01",
    number: "01",
    name: "One-Way Outstation Drops",
    subtitle: "POINT-TO-POINT INTERCITY",
    startingFare: "₹3,499",
    fareDetail: "Agra to Delhi IGI Airport / NCR · All Tolls Included",
    description:
      "Swift, private, access-controlled expressway drops from Agra to New Delhi, IGI Airport, Jaipur, Mathura, Gwalior, and Lucknow. You pay strictly for the single journey with zero empty return charges.",
    image: "/assets/fleet/sedan.webp",
    highlights: [
      "Yamuna & Agra-Lucknow expressway tolls included",
      "Doorstep pickup anywhere in Agra city",
      "Direct drop to Delhi IGI Airport Terminal 1, 2, 3",
      "Flight delay tracking for return pickups",
    ],
    vehicleTypes: "Sedan (Dzire), MPV (Ertiga), SUV (Innova Crysta)",
    idealFor: "Solo business executives, couples flying out of Delhi, and rapid one-way interstate travel.",
    bookingUrl: "/book?type=oneway",
  },
  {
    id: "service-02",
    number: "02",
    name: "Outstation Round-Trip Touring",
    subtitle: "MULTI-DAY CHAUFFEURED TRAVEL",
    startingFare: "₹10/km",
    fareDetail: "Min. 300 km/day · All-India Tourist Permit",
    description:
      "Hire a clean, comfortable vehicle and a polite driver for multi-day trips across Rajasthan, Uttarakhand, and Madhya Pradesh. Standard 300 km/day billing with zero hidden kilometer charges.",
    image: "/assets/fleet/innova.webp",
    highlights: [
      "Dedicated vehicle & chauffeur on standby all day",
      "Transparent garage-to-garage kilometer logbook",
      "Chauffeur overnight stay managed with simple ₹300 allowance",
      "Spotless interior cleaned daily before morning departure",
    ],
    vehicleTypes: "Sedan, Ertiga, Innova Crysta, 12–26 Seater Tempo",
    idealFor: "Family vacations, Golden Triangle trips, and corporate multi-city travel.",
    bookingUrl: "/book?type=round",
  },
  {
    id: "service-03",
    number: "03",
    name: "Local Sightseeing & City Tours",
    subtitle: "AGRA MONUMENTS AT YOUR PACE",
    startingFare: "₹1,900",
    fareDetail: "8 Hours / 80 Kilometers · AC Sedan & Chauffeur",
    description:
      "Explore the architectural crown jewels of the Mughal Empire without rushing. Our experienced chauffeurs navigate local monument gates, bypass tourist bottlenecks, and wait patiently while you explore.",
    image: "/assets/packages/agra-fort.webp",
    highlights: [
      "Covers Taj Mahal, Agra Fort, Itimad-ud-Daulah, Mehtab Bagh",
      "8h/80km (₹1,900) or 12h/120km (₹2,200) standard slots",
      "Zero commission shopping halts unless explicitly requested",
      "Doorstep pickup from any Agra hotel or home",
    ],
    vehicleTypes: "Sedan, Ertiga, Innova Crysta, Tempo Traveller",
    idealFor: "Heritage lovers, photography enthusiasts, and leisurely travelers.",
    bookingUrl: "/packages/same-day-agra-taj-mahal-tour",
  },
  {
    id: "service-04",
    number: "04",
    name: "Airport & Railway Station Transfers",
    subtitle: "PUNCTUAL PLATFORM & TERMINAL PICKUPS",
    startingFare: "₹800",
    fareDetail: "Agra Cantt from ₹800 · Delhi IGI Airport ₹3,499",
    description:
      "Guaranteed punctual station and airport transit. Whether arriving on the Gatimaan Express at Agra Cantt or catching an international departure from Delhi IGI Terminal 3, your driver is on the curb 15 minutes before your scheduled arrival.",
    image: "/assets/fleet/ertiga.webp",
    highlights: [
      "Chauffeur waiting with personalized name signboard",
      "Live flight and train delay tracking",
      "Luggage loading & unloading assistance",
      "Direct drop to departures curb",
    ],
    vehicleTypes: "Executive Sedan, Ertiga MPV, Innova Crysta",
    idealFor: "International travelers, business passengers with tight train or flight schedules.",
    bookingUrl: "/book",
  },
  {
    id: "service-05",
    number: "05",
    name: "Group Transit: Tempo & Urbania",
    subtitle: "LARGE FAMILY & DELEGATION TRANSIT",
    startingFare: "₹25/km",
    fareDetail: "9 to 26 Seats · Rear Baggage Cargo Hold",
    description:
      "Eliminate the hassle of splitting your party across multiple small cabs. Our Force Tempo Travellers and luxury Force Urbanias offer individual AC vents, reclining high-back seating, and ample cargo storage for everyone.",
    image: "/assets/fleet/tempo.webp",
    highlights: [
      "9, 12, 16, 20, and 26-seater configurations available",
      "Individual aircraft-style jet AC louvers",
      "Weatherproof roof carrier and deep rear luggage bay",
      "Dedicated microphone PA system for group leaders",
    ],
    vehicleTypes: "Force Tempo Traveller, Force Urbania VIP",
    idealFor: "Wedding entourages, pilgrim groups to Mathura & Vrindavan, school and college heritage tours.",
    bookingUrl: "/fleet",
  },
  {
    id: "service-06",
    number: "06",
    name: "Guided Heritage Tours",
    subtitle: "COMPLETE HANDCRAFTED ITINERARIES",
    startingFare: "₹3,499",
    fareDetail: "Same-Day to 3-Day Circuits · Doorstep Service",
    description:
      "All-inclusive private tours designed to maximize monument time and eliminate tourist stress. From sunrise at the Taj Mahal to the sacred evening aarti of Mathura and the royal palaces of Jaipur.",
    image: "/assets/packages/taj-dawn.webp",
    highlights: [
      "Sunrise Taj Mahal Guided Tour (VIP Dawn Entry)",
      "Mathura & Vrindavan Darshan with Krishna Janmabhoomi",
      "Same Day Agra by Gatimaan Superfast Express",
      "Golden Triangle 3-Day Circuit (Delhi-Agra-Jaipur)",
    ],
    vehicleTypes: "Any vehicle tier from Sedan to Force Urbania",
    idealFor: "First-time visitors, international tourists, and couples looking for a seamless private vacation.",
    bookingUrl: "/packages",
  },
];

export function ServicesPage({ language = "en" }: ServicesPageProps) {
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO & BREADCRUMBS */}
      <section className="relative w-full bg-surface-container-low overflow-hidden">
        <div className="relative max-w-[1280px] mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-2xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs mb-space-lg text-on-surface-variant font-label-caps text-xs">
            <a className="hover:text-primary transition-colors" href="/">
              Home
            </a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Services</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-end">
            <div className="lg:col-span-8 flex flex-col">
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight max-w-3xl leading-[1.1]">
                Every journey in North India,{" "}
                <span className="italic font-normal text-terracotta-sandstone">thoughtfully chauffeured.</span>
              </h1>
            </div>
            <div className="lg:col-span-4 flex flex-col pb-1">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-lg">
                From fast one-way expressway drops to multi-day tours, our fleet delivers
                transparent billing, courteous drivers, and round-the-clock local support.
              </p>
              <div className="flex items-center gap-space-sm">
                <a
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-xs rounded-lg transition-colors shadow-xs font-semibold"
                  href="/book"
                >
                  <span>Book Cab Online</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Directory Jump Strip */}
          <div className="mt-space-lg pt-space-md">
            <p className="font-label-caps text-[9.5px] text-on-surface-variant uppercase mb-space-xs tracking-wider font-bold">
              Quick Directory Jump
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-space-xs">
              {SERVICES_MODULES.map((s) => (
                <a
                  key={s.id}
                  className="whitespace-nowrap px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-label-caps text-[9.5px] transition-all font-bold"
                  href={`#${s.id}`}
                >
                  {s.number} {s.name.split(":")[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 6 DETAILED SERVICE MODULES (Compact -20%) */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-space-xl flex flex-col gap-6 sm:gap-space-xl">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <span className="font-label-caps text-[9.5px] text-primary uppercase tracking-widest mb-1 font-bold">
            Concierge Transit Portfolio
          </span>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-semibold">
            Handcrafted transportation designed for modern voyagers.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
            Every service is backed by our Taj Ganj dispatch operations, strict vehicle cleanliness inspections, and honest
            per-kilometer billing.
          </p>
        </div>

        {SERVICES_MODULES.map((s) => (
          <div
            key={s.id}
            id={s.id}
            className="scroll-mt-24 bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden border border-border-warm/70"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 relative min-h-[190px] lg:min-h-[260px] bg-sandstone-wash overflow-hidden">
                <img
                  className="w-full h-full object-cover min-h-[190px] lg:min-h-[260px]"
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 sm:p-2.5 bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-xs border border-border-warm/40">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-caps text-[9px] text-primary uppercase font-bold">Starting Tariff</span>
                    <span className="font-price-display text-base sm:text-lg text-primary font-bold">{s.startingFare}</span>
                  </div>
                  <p className="font-body-sm text-[9.5px] text-on-surface-variant mt-0.5">{s.fareDetail}</p>
                </div>
              </div>

              <div className="lg:col-span-7 p-3.5 sm:p-4.5 lg:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-price-display text-headline-sm text-primary font-bold">{s.number}</span>
                    <span className="font-label-caps text-[9.5px] text-terracotta-sandstone uppercase font-bold tracking-wider">
                      {s.subtitle}
                    </span>
                  </div>
                  <h3 className="font-headline-md text-base sm:text-lg text-ink-charcoal mb-1.5 font-semibold">{s.name}</h3>
                  <p className="font-body-sm text-[10.5px] sm:text-[11px] text-on-surface-variant leading-relaxed mb-3">
                    {s.description}
                  </p>

                  <div className="space-y-1.5 mb-3 border-y border-border-warm/50 py-2">
                    {s.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-1.5 text-on-surface font-body-sm text-[10.5px]">
                        <span className="material-symbols-outlined text-success-jade text-[15px] shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[10px] text-on-surface-variant">
                    <div>
                      <strong className="block text-ink-charcoal mb-0.5">Fleet Options:</strong>
                      {s.vehicleTypes}
                    </div>
                    <div>
                      <strong className="block text-ink-charcoal mb-0.5">Best Suited For:</strong>
                      {s.idealFor}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2.5 border-t border-border-warm/50">
                  <a
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    href={s.bookingUrl}
                  >
                    <span>Reserve Service</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </a>
                  <a
                    className="px-3.5 py-2 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 active:scale-[0.98]"
                    href={`https://wa.me/919876543210?text=Inquiry%20for%20${encodeURIComponent(s.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 3. WHY CHOOSE US (4 ASSURANCES) (Compact -20%) */}
      <section className="w-full bg-surface-container-low py-8 sm:py-space-xl border-t border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-space-lg">
            <span className="font-label-caps text-[9.5px] text-primary uppercase tracking-widest font-bold block mb-1">
              The 4 Uncompromising Standards
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Why Discerning Travelers Choose SK Baghel
            </h2>
            <p className="font-body-md text-on-surface-variant mt-1.5 leading-relaxed">
              Over two decades serving Agra and North India with zero complaints and unmatched reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-2.5">
                  <span className="material-symbols-outlined text-[20px]">timer</span>
                </div>
                <h3 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">Punctuality Guarantee</h3>
                <p className="font-body-sm text-[9.5px] sm:text-[10px] text-on-surface-variant leading-relaxed">
                  Chauffeurs arrive at your pickup location 15 minutes before the scheduled rendezvous. If any delay occurs, our
                  standby backup fleet in Taj Ganj deploys immediately.
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-2.5">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <h3 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">Upfront Inclusive Pricing</h3>
                <p className="font-body-sm text-[9.5px] sm:text-[10px] text-on-surface-variant leading-relaxed">
                  Every quoted fare itemizes GST, toll clearances, and fuel. What you agree upon is exactly what you pay—with zero
                  hidden roadside extras or tourist surcharges.
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-2.5">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <h3 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">Police-Verified Drivers</h3>
                <p className="font-body-sm text-[9.5px] sm:text-[10px] text-on-surface-variant leading-relaxed">
                  Every chauffeur holds an active commercial badge, police background verification certificate, and follows our
                  strict guest etiquette code for families and solo women travelers.
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-2.5">
                  <span className="material-symbols-outlined text-[20px]">sanitizer</span>
                </div>
                <h3 className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold mb-1">Spotless Vehicles</h3>
                <p className="font-body-sm text-[9.5px] sm:text-[10px] text-on-surface-variant leading-relaxed">
                  Each cab undergoes vacuum sanitization, high-performance AC checks, and is stocked with sealed mineral water bottles
                  and device charging cables before dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
