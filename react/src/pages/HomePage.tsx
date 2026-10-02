import { useState } from "react";
import { Icon, type IconName } from "../components/icons/Icon";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { ReviewsMarquee } from "../components/home/ReviewsMarquee";
import { FamousPlacesSection } from "../components/home/FamousPlacesSection";
import { WhatsAppIcon } from "../components/icons";
import { HomeBookingWidget } from "../components/home/HomeBookingWidget";

export interface HomePageProps {
  language?: SupportedLanguage;
}

export function HomePage({ language = "en" }: HomePageProps) {
  const text = "Agra to Anywhere";
  const [tripType, setTripType] = useState<"oneway" | "round" | "local">("oneway");
  const [origin, setOrigin] = useState("Agra");
  const [destination, setDestination] = useState("Delhi");
  const [selectedVehicle, setSelectedVehicle] = useState<"sedan" | "ertiga" | "innova" | "tempo" | "urbania">("sedan");
  const [couponCopied, setCouponCopied] = useState(false);

  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");



  const copyCoupon = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("ASTTCAR500OFF");
      setCouponCopied(true);
      setTimeout(() => setCouponCopied(false), 2500);
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hello SK Baghel Travels, I would like to inquire about a cab:%0A- Name: ${encodeURIComponent(inquiryName)}%0A- Phone: ${encodeURIComponent(inquiryPhone)}%0A- Date: ${encodeURIComponent(inquiryDate)}%0A- Route: ${encodeURIComponent(origin)} to ${encodeURIComponent(destination)} (${tripType})%0A- Vehicle: ${encodeURIComponent(selectedVehicle)}%0A- Details: ${encodeURIComponent(inquiryNotes)}`;
    window.open(`https://wa.me/919762817598?text=${text}`, "_blank");
  };

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        "@id": "https://agraskbagheltourandtravels.com/#business",
        name: "SK Baghel Tour & Travels",
        url: "https://agraskbagheltourandtravels.com",
        telephone: contact.phone,
        email: contact.email,
        image: "https://agraskbagheltourandtravels.com/assets/brand/og-banner.webp",
        priceRange: "₹",
        currenciesAccepted: "INR",
        paymentAccepted: "Cash, UPI, Credit Card",
        areaServed: ["Agra", "Delhi", "Jaipur", "Mathura", "Gwalior", "Lucknow"],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Near Taj East Gate Road, Taj Ganj",
          addressLocality: "Agra",
          addressRegion: "Uttar Pradesh",
          postalCode: "282001",
          addressCountry: "IN",
        },
        geo: { "@type": "GeoCoordinates", latitude: 27.1632, longitude: 78.0322 },
        openingHours: "Mo-Su 00:00-23:59",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "380",
          bestRating: "5",
          worstRating: "1",
        },
      },
    ],
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* ── MAIN HOMEPAGE CONTENT ── */}
      <div className="w-full relative z-20">
        {/* ── HERO ── Taj Mahal sunrise background, text left / booking dock right */}
        <section className="relative w-full pt-20 sm:pt-28 pb-16 bg-ink-midnight text-on-primary overflow-hidden">
          {/* LCP hero image — real <img> (not CSS background) so the browser can
              early-discover and prioritize it. Self-hosted AVIF/WebP, 1920w.
              Decorative: headline carries the content (alt=""). */}
          <picture className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <source srcSet="/images/hero-taj-sunrise.avif" type="image/avif" />
            <img
              src="/images/hero-taj-sunrise.webp"
              alt=""
              fetchPriority="high"
              decoding="async"
              width={1920}
              height={1280}
              className="h-full w-full object-cover opacity-80 contrast-105 brightness-100"
              style={{ objectPosition: "center 35%" }}
            />
          </picture>
          {/* Subtle gradient overlay to ensure text and booking form legibility while leaving ~80% of the image vividly visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-midnight/65 via-ink-midnight/10 to-ink-midnight/10 z-0 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-midnight to-transparent z-0 pointer-events-none" />

          <div className="relative z-10 max-w-[1280px] mx-auto px-margin-mobile lg:px-margin grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left — headline + two CTAs only (hero stack discipline: 3 elements max) */}
            <div className="lg:col-span-6 flex flex-col items-start gap-space-md">

              {/* 100% SEO-Safe Headline with Letter-by-Letter Handwriting Reveal */}
              <div className="flex flex-col items-start gap-1 w-full max-w-[640px]">
                {/* Prestige Heritage Pill Badge */}

                <h1 className="font-headline-hero text-headline-hero font-normal leading-[1.14] w-full">
                  {/* Semantic HTML text for search crawlers & screen readers */}
                  <span className="sr-only">Agra to anywhere, in first-class comfort.</span>

                  <div aria-hidden="true" className="select-none flex flex-col gap-1 w-full">
                    {/* Static, crawlable hero headline */}
                    <div
                      className="text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] overflow-visible pb-0.5"
                      aria-label={text}
                    >
                      {text.split("").map((letter, index) => (
                        <span
                          key={`${letter}-${index}`}
                          className="inline-block font-serif italic text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/80"
                        >
                          {letter === " " ? "\u00A0" : letter}
                        </span>
                      ))}
                    </div>

                    {/* Static Line 2: in first-class comfort. in luminous light white/champagne */}
                    <div className="relative w-full max-w-[560px] mt-0.5">
                      <div
                        className="font-serif italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] text-3xl sm:text-4xl md:text-5xl"
                        style={{
                          lineHeight: 1.18,
                          fontFamily: "'Playfair Display', 'EB Garamond', Georgia, serif",
                        }}
                      >
                        in first-class comfort.
                      </div>

                      {/* Cursive flourish underline stroke in luminous white silk */}
                      <svg
                        viewBox="0 0 520 24"
                        className="w-full max-w-[480px] h-auto overflow-visible mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 14 C120 18, 300 6, 500 12"
                          stroke="url(#underlineWhiteSilk)"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="underlineWhiteSilk" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.95" />
                            <stop offset="75%" stopColor="#F5F2EB" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </h1>
              </div>
              <p className="font-body-lg text-body-lg text-ivory-surface max-w-lg leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                Verified drivers, fixed fares, and all expressway tolls included. Direct pickup across Agra. Book online or on WhatsApp in 2 minutes.
              </p>
              <div className="flex flex-wrap items-center gap-space-sm">
                <a
                  className="inline-flex items-center gap-space-xs px-space-lg py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg shadow-md transition-all font-semibold active:scale-[0.98]"
                  href="tel:+919762817598"
                >
                  <Icon name="call" className="text-icon-18" />
                  <span className="text-white">Call +91 97628 17598</span>
                </a>
                <a
                  className="inline-flex items-center gap-space-xs px-space-lg py-3 rounded-lg bg-black hover:bg-neutral-900 text-white font-label-lg text-label-lg shadow-md transition-all font-semibold active:scale-[0.98] border border-white/10"
                  style={{ color: "#ffffff" }}
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
                  <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Right — compact first-step booking widget */}
            <div className="lg:col-span-6 w-full flex justify-end">
              <HomeBookingWidget />
            </div>
          </div>
        </section>

        {/* ── TRUST TICKER ── Directly below hero with smooth fade-in/out masks */}
        <div className="w-full bg-ink-charcoal border-y border-border-warm/15 py-3 overflow-hidden relative z-20">
          {/* Left edge fade gradient mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-ink-charcoal via-ink-charcoal/90 to-transparent z-10" />
          {/* Right edge fade gradient mask */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-ink-charcoal via-ink-charcoal/90 to-transparent z-10" />

          <div className="animate-marquee flex items-center gap-10 text-ivory-surface whitespace-nowrap">
            {[...Array(2)].flatMap(() => [
              { icon: "verified_user", title: "Govt-Registered", sub: "Tourist Vehicle Permit" },
              { icon: "badge", title: "Verified Chauffeurs", sub: "Police Background Check" },
              { icon: "receipt_long", title: "Tax Invoice", sub: "Tax invoice available on request" },
              { icon: "star", title: "4.9 / 5 Rating", sub: "3,800+ Verified Trips" },
              { icon: "support_agent", title: "24×7 Dispatch", sub: "Live Agra Control Desk" },
            ]).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 shrink-0 px-4">
                <Icon name={item.icon as IconName} className="text-gold-accent text-icon-20" />
                <div className="flex flex-col">
                  <span className="font-title-md text-title-lg font-semibold leading-tight text-ivory-surface">{item.title}</span>
                  <span className="font-label-caps text-label-lg text-surface-dim">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── POPULAR ROUTES ── Editorial horizontal rows, not a card grid */}
        <section
          className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin"
        >
          {/* Section header: centred, no eyebrow, no split-header */}
          <div className="mb-space-xl text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Popular routes</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
              Toll-inclusive one-way fares — zero hidden return charges.
            </p>
          </div>

          {/* Horizontal route rows — distinct from the card grid below */}
          <div className="divide-y divide-border-warm/40">
            {[
              { from: "Agra", to: "Delhi", badge: "Most Popular", km: "230 km", time: "3h 30m", note: "Yamuna Expressway, IGI Airport drop", price: 3499, icon: "flight" },
              { from: "Agra", to: "Jaipur", badge: "Golden Triangle", km: "240 km", time: "4h 30m", note: "Via NH-21, optional Fatehpur Sikri stop", price: 3699, icon: "castle" },
              { from: "Agra", to: "Mathura", badge: "Pilgrimage", km: "55 km", time: "1h 15m", note: "Banke Bihari & Prem Mandir circuit", price: 2200, icon: "temple_hindu" },
              { from: "Agra", to: "Gwalior", badge: "Day Trip", km: "120 km", time: "2h 30m", note: "Via NH-44, interstate permit included", price: 3000, icon: "fort" },
            ].map((route) => (
              <div key={route.to} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 group">
                {/* Route identity */}
                <div className="flex items-center gap-4 min-w-0">
                  <Icon name={route.icon as IconName} className="text-on-surface-variant text-icon-22 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-title-md text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {route.from} → {route.to}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-label-caps uppercase font-bold shrink-0">
                        {route.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-body-sm text-label-lg text-on-surface-variant">
                      <span>{route.km}</span>
                      <span className="w-1 h-1 rounded-full bg-on-surface-variant/40" />
                      <span>{route.time}</span>
                      <span className="w-1 h-1 rounded-full bg-on-surface-variant/40" />
                      <span className="truncate">{route.note}</span>
                    </div>
                  </div>
                </div>
                {/* Price + CTA */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-label-caps text-label-caps text-on-surface-variant block">Sedan from</span>
                    <span className="font-price-display text-lg font-bold text-primary">₹{route.price.toLocaleString("en-IN")}</span>
                  </div>
                  <a
                    className="px-3.5 py-1.5 rounded-lg bg-sandstone-wash hover:bg-primary/10 text-primary border border-primary/25 hover:border-primary/50 text-label-md font-semibold transition-all duration-200 whitespace-nowrap active:scale-[0.98] shadow-xs"
                    href={`/book?from=Agra&to=${route.to}`}
                  >
                    <span className="text-primary font-bold">Book ↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <a
              className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
              href="/routes"
            >
              <span>View all 980+ routes</span>
              <Icon name="east" className="text-icon-16" />
            </a>
          </div>
        </section>

        {/* ── SERVICES ── 2-col feature layout, NO numbered markers (content is not a sequence) */}
        <section
          className="w-full py-space-3xl bg-ink-midnight text-ivory-surface"
        >
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            {/* Single eyebrow for this page (1 of 3 allowed) */}
            <div className="mb-space-xl">
              <span className="font-label-caps text-label-caps text-terracotta-sunlit uppercase tracking-widest block mb-2">
                Cab Services
              </span>
              <h2 className="font-headline-lg text-headline-lg text-ivory-surface max-w-xl">
                Cab &amp; Tour Services
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-warm/15">
              {[
                {
                  icon: "directions_car",
                  title: "One-Way Outstation Drop",
                  body: "Fixed one-way fares with expressway tolls and driver allowance included. Zero return fare.",
                  tags: ["Delhi ₹3,499", "Jaipur ₹3,699"],
                  href: "/routes",
                },
                {
                  icon: "sync_alt",
                  title: "Outstation Round-Trip",
                  body: "Multi-day cab rentals with 300 km/day billing. Driver night charges included.",
                  tags: ["300 km/day minimum", "All-India Permit"],
                  href: "/book",
                },
                {
                  icon: "account_balance",
                  title: "Local Sightseeing",
                  body: "8-hour (80 km) and 12-hour (120 km) packages for Taj Mahal, Agra Fort, and local markets.",
                  tags: ["8h / 80km ₹1,900", "12h / 120km ₹2,200"],
                  href: "/packages",
                },
                {
                  icon: "flight_takeoff",
                  title: "Airport & Station Transfers",
                  body: "On-time pickup and drop at Delhi IGI Airport, Agra Cantt, and railway stations.",
                  tags: ["Agra Cantt ₹800", "Delhi IGI ₹3,499"],
                  href: "/book",
                },
                {
                  icon: "airport_shuttle",
                  title: "Tempo Traveller & Urbania",
                  body: "9 to 26-seater group vehicles with pushback seats, rear AC, and separate luggage bay.",
                  tags: ["9–26 Seater", "Luxury Urbania"],
                  href: "/fleet",
                },
                {
                  icon: "wb_twilight",
                  title: "Curated Tour Packages",
                  body: "Same-day Agra circuits and Golden Triangle routes with licensed tour guide options.",
                  tags: ["Same Day ₹3,499", "Triangle ₹18,500"],
                  href: "/packages",
                },
              ].map((svc) => (
                <div key={svc.title} className="bg-ink-midnight p-5 sm:p-6 flex flex-col gap-3 hover:bg-ink-charcoal transition-colors">
                  <Icon name={svc.icon as IconName} className="text-terracotta-sunlit text-icon-24" />
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-ivory-surface font-normal mb-1">{svc.title}</h3>
                    <p className="font-body-sm text-body-md text-ivory-surface/65 leading-relaxed">{svc.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {svc.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-border-warm/10 text-ivory-surface/70 font-label-caps text-label-caps">{t}</span>
                    ))}
                  </div>
                  <a className="inline-flex items-center gap-1 font-label-lg text-label-md text-terracotta-sunlit hover:text-gold-accent transition-colors font-semibold self-start" href={svc.href}>
                    <span>Learn more</span>
                    <Icon name="arrow_forward" className="text-icon-13" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FLEET ── 3-col grid with real images, proper card height (NOT 5-col cramped) */}
        <section
          className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin"
          id="fleet"
        >
          <div className="mb-space-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Choose your vehicle</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-xl">
              Clean AC vehicles with verified drivers. Fares include fuel, driver allowance, and tolls. Rates shown are one-way Agra to Delhi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[
              {
                id: "sedan", label: "Sedan", sub: "Dzire / Etios", note: "Ideal for 1-4 passengers and expressway trips",
                seats: "4+1", luggage: "2 Large Bags", rate: "₹10/km", price: "₹3,499",
                img: "/assets/fleet/sedan.webp",
              },
              {
                id: "ertiga", label: "Ertiga MPV", sub: "Maruti Ertiga", note: "6-passenger seating for families with luggage",
                seats: "6+1", luggage: "3 Large Bags", rate: "₹14/km", price: "₹4,800",
                img: "/assets/fleet/ertiga.webp",
              },
              {
                id: "innova", label: "Innova Crysta", sub: "Toyota Crysta", note: "Premium outstation ride with captain seats",
                seats: "6+1 Captain", luggage: "4 Large Bags", rate: "₹18/km", price: "₹6,499",
                img: "/assets/fleet/innova.webp",
              },
              {
                id: "tempo", label: "Tempo Traveller", sub: "12–17 Seater", note: "Reclining seats, rear AC, and separate luggage bay",
                seats: "12–17 Seater", luggage: "Rear Cargo Bay", rate: "₹25/km", price: "₹9,500",
                img: "/assets/fleet/tempo.webp",
              },
              {
                id: "urbania", label: "Force Urbania", sub: "10–13 Luxury Seats", note: "Luxury van with individual recline and USB charging",
                seats: "10–13 Luxury", luggage: "Huge Cargo Bay", rate: "₹34/km", price: "₹12,500",
                img: "/assets/fleet/urbania.webp",
              },
            ].map((v) => (
              <div key={v.id} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-border-warm/40 flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:ring-1 hover:ring-primary">
                <div className="h-44 w-full overflow-hidden relative bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={v.img}
                    alt={v.label}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/60 via-transparent to-transparent" />

                </div>
                <div className="p-3.5 flex-1 flex flex-col gap-2">
                  <div>
                    <h3 className="font-title-md text-title-lg font-bold text-on-surface">{v.label}</h3>
                    <p className="font-body-sm text-label-lg text-on-surface-variant mt-0.5">{v.note}</p>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant border-t border-border-warm/40 pt-2">
                    <span>{v.seats} seats</span>
                    <span className="text-primary font-semibold">{v.rate}</span>
                  </div>
                  <a
                    className="w-full block py-2 text-center rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-label-md transition-all font-semibold mt-auto shadow-xs active:scale-[0.98]"
                    href={`/book?vehicle=${v.id}`}
                  >
                    <span className="text-white">Select {v.label.split(" ")[0]}</span>
                  </a>
                </div>
              </div>
            ))}

            {/* 6th cell — CTA tile (avoids empty cell) */}
            <a
              href="/fleet"
              className="bg-sandstone-wash rounded-xl border border-border-warm/40 flex flex-col items-center justify-center p-8 gap-3 hover:bg-terracotta-sandstone/10 transition-colors group"
            >
              <Icon name="garage" className="text-primary text-icon-36 group-hover:scale-110 transition-transform" />
              <p className="font-title-md text-title-lg text-on-surface font-bold text-center">See entire fleet</p>
              <p className="font-body-sm text-label-lg text-on-surface-variant text-center">Compare specs, photos & per-km rates</p>
              <span className="inline-flex items-center gap-1 text-primary font-label-lg text-label-md font-semibold mt-1">
                <span>Explore fleet</span>
                <Icon name="east" className="text-icon-14" />
              </span>
            </a>
          </div>
        </section>

        {/* ── TOUR PACKAGES ── 3-col card grid (different from routes & services above) */}
        <section
          className="w-full py-space-3xl bg-surface-container-low"
          id="tours"
        >
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            {/* Second eyebrow (2 of 3 allowed, separated by 2 sections) */}
            <div className="mb-space-xl flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div>
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">Guided Tours</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Guided tours from Agra</h2>
              </div>
              <a
                className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
                href="/packages"
              >
                <span>All packages</span>
                <Icon name="east" className="text-icon-16" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {[
                {
                  badge: "Same Day", badgeColor: "bg-ink-midnight/80 text-tertiary-fixed",
                  price: "₹3,499", priceColor: "bg-terracotta-deep",
                  img: "/assets/packages/agra-fort.webp",
                  alt: "Taj Mahal Tour",
                  title: "Same Day Agra — Taj Mahal & Agra Fort",
                  body: "Full-day sightseeing covering Taj Mahal, Agra Fort, and Mehtab Bagh with hotel pickup.",
                  itinerary: ["Taj Mahal & Agra Fort", "Itimad-ud-Daulah", "Mehtab Bagh sunset"],
                  href: "/packages/agra-sightseeing",
                  cta: "View Tour",
                },
                {
                  badge: "Dawn Special", badgeColor: "bg-ink-midnight/80 text-gold-accent",
                  price: "₹5,200", priceColor: "bg-terracotta-deep",
                  img: "/assets/packages/taj-dawn.webp",
                  alt: "Taj Sunrise Tour",
                  title: "Taj Mahal Sunrise Guided Tour",
                  body: "Early morning entry to the Taj Mahal at dawn to beat crowds and heat, with licensed monument guide.",
                  itinerary: ["Taj Mahal dawn entry", "Agra Fort royal chambers", "Licensed guide option"],
                  href: "/packages/taj-mahal-sunrise-tour",
                  cta: "View Tour",
                },
                {
                  badge: "Pilgrimage", badgeColor: "bg-ink-midnight/80 text-tertiary-fixed",
                  price: "₹4,200", priceColor: "bg-terracotta-deep",
                  img: "/assets/packages/mathura.webp",
                  alt: "Mathura Vrindavan",
                  title: "Mathura & Vrindavan Darshan",
                  body: "Same-day temple circuit covering Krishna Janmabhoomi, Banke Bihari, and Prem Mandir.",
                  itinerary: ["Krishna Janmabhoomi", "Banke Bihari & Prem Mandir", "Evening aarti included"],
                  href: "/packages/mathura-vrindavan",
                  cta: "View Tour",
                },
              ].map((pkg) => (
                <div key={pkg.title} className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all border border-border-warm/40">
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={pkg.img}
                      alt={pkg.alt}
                    />
                    <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded ${pkg.badgeColor} font-label-caps text-label-caps uppercase font-bold backdrop-blur-sm`}>
                      {pkg.badge}
                    </span>
                    <div className={`absolute bottom-2 right-2 px-2 py-0.5 rounded ${pkg.priceColor} text-white font-price-display text-sm font-bold`}>
                      {pkg.price}
                    </div>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col gap-2">
                    <h3 className="font-title-md text-title-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">{pkg.title}</h3>
                    <p className="font-body-sm text-body-md text-on-surface-variant leading-relaxed">{pkg.body}</p>
                    <ul className="space-y-1 mt-1">
                      {pkg.itinerary.map((item) => (
                        <li key={item} className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                          <span className="w-1 h-1 rounded-full bg-gold-accent shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a
                      className="mt-auto pt-2 border-t border-border-warm/40 inline-flex items-center gap-1 font-label-lg text-label-md text-primary hover:text-primary-container font-bold transition-colors"
                      href={pkg.href}
                    >
                      <span>{pkg.cta}</span>
                      <Icon name="east" className="text-icon-13" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAMOUS PLACES & HERITAGE LANDMARKS ── Multi-image high-res Unsplash gallery */}
        <FamousPlacesSection />

        {/* ── REVIEWS MARQUEE ── LOCKED, no changes */}
        <ReviewsMarquee />

        {/* ── BENEFITS + COUPON ── 21st.dev Modern Motion Bento Layout ── */}
        <section
          className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin"
        >
          <div className="mb-space-xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">
              Why Choose Us
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Why book with us.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-lg">
              Direct dispatch from Taj Ganj, Agra. Transparent pricing, verified drivers, and zero surprises.
            </p>
          </div>

          {/* Accessible benefit grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md mb-space-xl">
            {[
              {
                icon: "touch_app",
                title: "Confirmed in 2 Minutes",
                desc: "Instant booking via website or WhatsApp. Fast SMS confirmation with driver details — no middlemen.",
                badge: "Fast Booking",
              },
              {
                icon: "price_check",
                title: "Zero Hidden Fees",
                desc: "All expressway tolls, state permits, and fuel charges included upfront. No return-trip charges on one-way rides.",
                badge: "Toll-Inclusive",
              },
              {
                icon: "schedule",
                title: "Punctual Every Time",
                desc: "Live train and flight delay tracking. Your cab arrives 15 minutes before scheduled pickup time.",
                badge: "Live Tracking",
              },
              {
                icon: "policy",
                title: "Verified Drivers",
                desc: "Commercial driver license, police background check, and minimum 5 years highway driving experience.",
                badge: "Police-Verified",
              },
              {
                icon: "garage",
                title: "Sedan to 26-Seater",
                desc: "Spotless AC Dzire, Ertiga, Innova Crysta, and 9–26 seat Tempo Travellers and luxury Urbania.",
                badge: "Clean AC Fleet",
              },
              {
                icon: "support_agent",
                title: "24×7 Local Dispatch",
                desc: "Direct phone and WhatsApp support from our Taj Ganj dispatch office in Agra. Real humans, not bots.",
                badge: "Taj Ganj Office",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border flex flex-col gap-3 group transition-all duration-300 bg-ink-charcoal text-ivory-surface border-border-warm/20 hover:border-gold-accent/40 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 bg-primary text-white">
                    <Icon name={item.icon as IconName} className="text-icon-20" />
                  </div>
                  <span className="font-label-caps text-label-caps uppercase font-bold px-2 py-0.5 rounded-full bg-gold-accent/15 text-gold-accent border border-gold-accent/30">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-ivory-surface">
                  {item.title}
                </h3>
                <p className="font-body-sm text-body-md leading-relaxed text-ivory-surface/75">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Promo coupon — interactive 21st.dev strip */}
          <div
            className="bg-sandstone-wash rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-space-md border border-border-warm/60 shadow-xs hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <Icon name="confirmation_number" className="text-icon-20 text-white" />
              </div>
              <div>
                <h3 className="font-title-md text-headline-sm text-on-surface font-bold">Flat ₹500 off your first outstation trip</h3>
                <p className="font-body-sm text-body-md text-on-surface-variant mt-0.5">
                  Valid on Agra to Delhi and Agra to Jaipur one-way routes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg border border-border-warm/40 shadow-sm shrink-0">
              <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">Coupon:</span>
              <code className="font-title-md font-bold text-primary tracking-wider text-xs">ASTTCAR500OFF</code>
              <button
                type="button"
                onClick={copyCoupon}
                className="text-label-lg px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-caps transition-all font-bold shadow-xs active:scale-[0.98] inline-flex items-center gap-1 cursor-pointer"
              >
                {couponCopied ? (
                  <>
                    <Icon name="check" className="text-icon-13 text-white" />
                    <span className="text-white">Copied!</span>
                  </>
                ) : (
                  <>
                    <Icon name="content_copy" className="text-icon-13 text-white" />
                    <span className="text-white">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── CONTACT / INQUIRY ── 2-col layout (same as hero split, but this is the CTA section) */}
        {/* Third eyebrow (3 of 3 allowed) */}
        <section
          className="w-full py-space-3xl bg-surface-container-low"
        >
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">Contact</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    Your driver is a call away.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-sm leading-relaxed">
                    Based in Taj Ganj, beside the Taj Mahal. 24×7 dispatch for airport drops, outstation cabs, and custom sightseeing.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <a className="p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center gap-3 shadow-sm border border-border-warm/40" href="tel:+919762817598">
                    <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                      <Icon name="call" className="text-icon-18" />
                    </div>
                    <div>
                      <span className="font-label-caps text-body-sm text-on-surface-variant block uppercase font-bold">Call 24×7</span>
                      <span className="font-title-md text-title-lg text-on-surface font-bold">+91 97628 17598</span>
                    </div>
                  </a>
                  <a className="p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center gap-3 shadow-sm border border-border-warm/40" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                      <WhatsAppIcon className="w-[18px] h-[18px] shrink-0" />
                    </div>
                    <div>
                      <span className="font-label-caps text-body-sm text-on-surface-variant block uppercase font-bold">WhatsApp</span>
                      <span className="font-title-md text-title-lg text-on-surface font-bold">Chat with Support</span>
                    </div>
                  </a>
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest flex items-center gap-3 shadow-sm border border-border-warm/40 sm:col-span-2">
                    <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                      <Icon name="pin_drop" className="text-icon-18" />
                    </div>
                    <div>
                      <span className="font-label-caps text-body-sm text-on-surface-variant block uppercase font-bold">Office</span>
                      <span className="font-title-md text-title-lg text-on-surface font-medium">Taj Ganj, Agra 282001</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — inquiry form */}
              <div className="lg:col-span-7">
                <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-xl shadow-md border border-border-warm/40">
                  <h3 className="font-headline-sm text-headline-sm font-normal text-on-surface mb-1">Send a booking inquiry</h3>
                  <p className="font-body-sm text-label-md text-on-surface-variant mb-space-md">
                    We'll reply on WhatsApp with a quote in under 5 minutes.
                  </p>
                  <form onSubmit={handleInquirySubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="homepage-inquiry-name" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Full Name</label>
                        <input
                          id="homepage-inquiry-name"
                          type="text"
                          required
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="homepage-inquiry-phone" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Phone / WhatsApp</label>
                        <input
                          id="homepage-inquiry-phone"
                          type="tel"
                          required
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          placeholder="+91 97628 17598"
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="homepage-inquiry-date" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Travel Date</label>
                      <input
                        id="homepage-inquiry-date"
                        type="date"
                        required
                        value={inquiryDate}
                        onChange={(e) => setInquiryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="homepage-inquiry-notes" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Itinerary & Pickup Details</label>
                      <textarea
                        id="homepage-inquiry-notes"
                        rows={3}
                        value={inquiryNotes}
                        onChange={(e) => setInquiryNotes(e.target.value)}
                        placeholder="Pick-up hotel, destination, monument preferences, or special requests..."
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-title-md text-xs font-semibold transition-all shadow-md active:scale-[0.98]"
                    >
                      <Icon name="send" className="text-icon-16 text-white" />
                      <span className="text-white">Send Inquiry via WhatsApp</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
