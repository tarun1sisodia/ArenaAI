import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3_s7rAtCf0nSQi2UuDDGFBpDDjQmVfkvW4yJ2S-0o90HP_rho-IpEndht4M3LbtXYNSHc27KqpjLABZGjgL0KtSOfKlHL3UcUA6LNLDTQR263zPSPhjmFNvASkp2v-zJJGRazHc5AxxuOQCm7_UpRbHUEC40w53UzJtoTiqcLbq-fJnrQGIDK26kmB5yUmIDRkswtLLg6UhMnRfmgun0kJ35P_X8J5GJH33A2u_VNL7tXkNjhTRom0w",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHrE-wY56s83l-D-i7k_9eY5l1rL3zO2fO-5lFw6bL7m1p8s9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFhG9SwH6I507dQuN34sU4ztKi3I66cmDMi8b2wQ9-mgznrz6OBZW9nRuYxUlrqmon_CvVUHDheRh9SL1uEan5slXPh1a6-8-V8ImuIJekxYh9TMlwzphg1crfgHAAdFmn_IvAyGACdBKhKDCs-cLtchmJIMuiwT_QuVr6njYzGc_Q9ULbq5FL0YmYy2Oh65CgOwQjvFhvpu4L0J26qByHJmdd3URyQv2dEdNa3x5KdEX-mPUzW233fw",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJz6QxABxfP0OnVaOxqZq5rxESNxi9wIVmcCbgVAmkuZgwEvEeOZF9kZSlE1a8Lz5_LsvjLQTkP04nP8ZcwXtSO9Vb1hXJgUZQgUp806bzIlzdh8EYOCrLKVoJgqtaWDBROiLrIBn8VabE0cpSyt0xKbpZhZx7ma9PksfkS80dSiCsVQZ_Uq8ermU8bimVRPEcFLL6hMTLJSC17PJXFER28Z8SvArG5SqWUh_5PyH64i-RYMOs1V3uMg",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtim6k1xZ-oNG2CqsGD4G34wTroprBPYyPJ9w7UYnqlD3AJi1jQBwG4iez5kq2R7JnA5jrbU71f63NA4Fg_9ivUh1cG2YmwcFEHjP8uB8yCO_rR0jqQtih9RtLuHMblGb62Vkg7AmFKA2kJO3duZSuqnhbnsr2yPOs-zIhv8qU0SlxpBYkAneSec38qdvXX221BLjsfOswvxgP68jLhUTwIPkQ9BZgyAVkuWywbAZJbcXZVSeMcPR58g",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxTJ0Lw2g0E-2f7Njva0bk9tnu2uxD4fDQEnjl9HfXhIsZPXpREe6IH64YxcrkLTU9LA-Sq18VOKNINmCXcE1SqhLJ0FRlDY7PcP8mXPJGqImX8UX6ulEV1tfIi-EaTk44xK2SVpNfowCr9XWRL4DoGWaRLWcuc9yzCK9WgY9T9q6I7XUpPjl8Suc6hiJQtpkLga47lMN99jxmLDggAJ-a-DA6OJ6dZ-ji_iNWU1c4dm5DVgEpmyTxBQ",
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
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-[11px] uppercase tracking-wider font-bold w-max mb-3">
                Taxi &amp; Tour Services
              </span>
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight max-w-3xl leading-[1.1]">
                Every journey in North India,{" "}
                <span className="italic font-normal text-terracotta-sandstone">thoughtfully chauffeured.</span>
              </h1>
            </div>
            <div className="lg:col-span-4 flex flex-col pb-1">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-lg">
                From fast one-way expressway drops to multi-day Golden Triangle tours, our fleet delivers
                transparent billing, courteous drivers, and round-the-clock local support.
              </p>
              <div className="flex items-center gap-space-md">
                <a
                  className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg transition-colors shadow-sm font-semibold"
                  href="/book"
                >
                  <span>Book Cab Online</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
                <a
                  className="inline-flex items-center justify-center gap-space-xs px-space-md py-3 bg-ink-charcoal hover:bg-ink-slate text-ivory-surface font-label-lg text-label-lg rounded-lg transition-colors font-semibold"
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-gold-accent text-[18px]">chat</span>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Directory Jump Strip */}
          <div className="mt-space-2xl pt-space-lg">
            <p className="font-label-caps text-xs text-on-surface-variant uppercase mb-space-sm tracking-wider font-bold">
              Quick Directory Jump
            </p>
            <div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm">
              {SERVICES_MODULES.map((s) => (
                <a
                  key={s.id}
                  className="whitespace-nowrap px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-label-caps text-xs transition-all font-bold"
                  href={`#${s.id}`}
                >
                  {s.number} {s.name.split(":")[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 6 DETAILED SERVICE MODULES */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-space-3xl flex flex-col gap-space-3xl">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-space-xs font-bold">
            Concierge Transit Portfolio
          </span>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-semibold">
            Handcrafted transportation designed for modern voyagers.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
            Every service is backed by our Taj Ganj dispatch operations, strict vehicle cleanliness inspections, and honest
            per-kilometer billing.
          </p>
        </div>

        {SERVICES_MODULES.map((s) => (
          <div
            key={s.id}
            id={s.id}
            className="scroll-mt-28 bg-surface-container-lowest rounded-xl shadow-md overflow-hidden border border-border-warm/70"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-[460px] bg-sandstone-wash overflow-hidden">
                <img
                  className="w-full h-full object-cover min-h-[300px] lg:min-h-[460px]"
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                />
                <div className="absolute bottom-space-md left-space-md right-space-md p-space-md bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-sm border border-border-warm/40">
                  <div className="flex items-center justify-between text-on-surface">
                    <span className="font-label-caps text-[10px] text-primary uppercase font-bold">Starting Tariff</span>
                    <span className="font-price-display text-2xl text-primary font-bold">{s.startingFare}</span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">{s.fareDetail}</p>
                </div>
              </div>

              <div className="lg:col-span-7 p-space-xl lg:p-space-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-xs">
                    <span className="font-price-display text-headline-sm text-primary font-bold">{s.number}</span>
                    <span className="font-label-caps text-[11px] text-terracotta-sandstone uppercase font-bold tracking-wider">
                      {s.subtitle}
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-ink-charcoal mb-space-md font-semibold">{s.name}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-lg">
                    {s.description}
                  </p>

                  <div className="space-y-2 mb-space-lg border-y border-border-warm/50 py-space-md">
                    {s.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-on-surface font-body-sm text-sm">
                        <span className="material-symbols-outlined text-success-jade text-[18px] shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mb-space-md text-xs text-on-surface-variant">
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

                <div className="flex items-center gap-3 pt-space-md border-t border-border-warm/50">
                  <a
                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
                    href={s.bookingUrl}
                  >
                    <span>Reserve Service</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                  <a
                    className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-sm font-semibold transition-colors"
                    href={`https://wa.me/919876543210?text=Inquiry%20for%20${encodeURIComponent(s.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp Inquiry
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 3. WHY CHOOSE US (4 ASSURANCES) */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest font-bold block mb-1">
              The 4 Uncompromising Standards
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Why Discerning Travelers Choose SK Baghel
            </h2>
            <p className="font-body-md text-on-surface-variant mt-2">
              Over two decades serving Agra and North India with zero complaints and unmatched reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">timer</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-2">Punctuality Guarantee</h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Chauffeurs arrive at your pickup location 15 minutes before the scheduled rendezvous. If any delay occurs, our
                  standby backup fleet in Taj Ganj deploys immediately.
                </p>
              </div>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">payments</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-2">Upfront Inclusive Pricing</h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Every quoted fare itemizes GST, toll clearances, and fuel. What you agree upon is exactly what you pay—with zero
                  hidden roadside extras or tourist surcharges.
                </p>
              </div>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">badge</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-2">Police-Verified Drivers</h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Every chauffeur holds an active commercial badge, police background verification certificate, and follows our
                  strict guest etiquette code for families and solo women travelers.
                </p>
              </div>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">sanitizer</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-2">Spotless Vehicles</h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
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
