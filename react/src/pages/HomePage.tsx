import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { packages, routes, vehicles, reviews } from "../data/catalogue";

export interface HomePageProps {
  language?: SupportedLanguage;
}

export function HomePage({ language = "en" }: HomePageProps) {
  // Booking widget state in hero
  const [tripType, setTripType] = useState<"oneway" | "round" | "local">("oneway");
  const [origin, setOrigin] = useState("Agra");
  const [destination, setDestination] = useState("Delhi");
  const [selectedVehicle, setSelectedVehicle] = useState<"sedan" | "ertiga" | "innova" | "tempo" | "urbania">("sedan");
  const [couponCopied, setCouponCopied] = useState(false);

  // Inquiry form state
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");

  // Live estimated fare for widget
  const estimatedFare = useMemo(() => {
    let base = 3499;
    if (destination === "Jaipur") base = 3699;
    if (destination === "Mathura") base = 2200;
    if (destination === "Gwalior") base = 3000;
    if (destination === "Lucknow") base = 5800;

    const multiplier: Record<string, number> = {
      sedan: 1,
      ertiga: 1.35,
      innova: 1.85,
      tempo: 2.7,
      urbania: 3.5,
    };

    const roundMultiplier = tripType === "round" ? 1.85 : 1;
    const localFare = tripType === "local" ? 1900 : base;

    return Math.round(localFare * (multiplier[selectedVehicle] || 1) * roundMultiplier);
  }, [destination, selectedVehicle, tripType]);

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
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
  };

  // Schema.org Structured Data Graph
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        "@id": "https://skbagheltravels.in/#business",
        name: "SK Baghel Tour & Travels",
        url: "https://skbagheltravels.in",
        telephone: contact.phone,
        email: contact.email,
        image: "https://skbagheltravels.in/assets/brand/og-banner.webp",
        priceRange: "₹₹",
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
        geo: {
          "@type": "GeoCoordinates",
          latitude: 27.1632,
          longitude: 78.0322,
        },
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

      {/* 1. HERO EXPEDITION DOCK */}
      <section className="relative w-full -mt-12 pt-16 sm:pt-20 pb-12 bg-ink-midnight text-on-primary overflow-hidden">
        {/* Atmospheric Underlay: Mughal Dawn Glow */}
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDPtttU-jpbOVEWTBP8i1uroSUKtDGMWrLiPJvqPlHaQezFSfDw7z2mnuDBVEkWaG7RZoG-LAyjSWszwEts_yTQ92vLi4t64KSwb9kbzHGOqbR89PkKf8Nl7pszbGkKoRyZFeVH36l-eP6z7PfPnnkY_de2gXivokp3Ely7yQngRxXWI2zQP-mgviW0eARyG5Q69xcHzaok639x50mvjDQrHG9SGiP2oNoqtzmGXWXQVwdTKwmxZBEkXQ")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight via-ink-midnight/80 to-transparent z-0" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-margin-mobile lg:px-margin grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Narrative Left Column */}
          <div className="lg:col-span-6 flex flex-col items-start gap-space-md pt-2">
            <h1 className="font-headline-hero text-headline-hero font-normal leading-[1.15] text-ivory-surface">
              Agra to anywhere, <br />
              <span className="italic font-normal text-terracotta-sunlit">in first-class comfort.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-surface-container-high/90 max-w-xl">
              Sedans, SUVs and Tempo Travellers with verified chauffeurs. Transparent toll-inclusive fares, UPI advance
              payment, and a confirmed booking in under two minutes.
            </p>
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <a
                className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md transition-all font-semibold"
                href="tel:+919876543210"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call +91 98765 43210</span>
              </a>
              <a
                className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-ivory-surface font-label-lg text-label-lg backdrop-blur-sm transition-all font-semibold"
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-gold-accent text-[18px]">chat</span>
                <span>WhatsApp Dispatch</span>
              </a>
              <a
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-tertiary-fixed hover:text-white font-label-lg text-label-lg transition-colors"
                href="#tours"
              >
                <span>Explore Tours</span>
                <span className="material-symbols-outlined text-[16px]">south</span>
              </a>
            </div>
          </div>

          {/* Elevated Fare Engine Dock (Reduced by 20%) */}
          <div className="lg:col-span-6 w-full flex justify-end">
            <div className="w-full max-w-[430px] bg-surface-container-lowest text-on-surface rounded-xl p-3.5 sm:p-4 shadow-xl relative border border-border-warm/40">
              {/* Mode Segmented Pill */}
              <div className="grid grid-cols-3 gap-1 bg-surface-container p-1 rounded-lg mb-3 text-center font-label-caps text-label-caps">
                <button
                  type="button"
                  onClick={() => setTripType("oneway")}
                  className={`py-1.5 rounded-md transition-all font-semibold text-[10.5px] tracking-wider ${tripType === "oneway"
                      ? "bg-ink-charcoal text-ivory-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  ONE WAY
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("round")}
                  className={`py-1.5 rounded-md transition-all font-semibold text-[10.5px] tracking-wider ${tripType === "round"
                      ? "bg-ink-charcoal text-ivory-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  ROUND TRIP
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("local")}
                  className={`py-1.5 rounded-md transition-all font-semibold text-[10.5px] tracking-wider ${tripType === "local"
                      ? "bg-ink-charcoal text-ivory-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  LOCAL TAXI
                </button>
              </div>

              {/* Corridors Selection Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9.5px] text-on-surface-variant uppercase font-semibold">FROM</label>
                  <div className="relative flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 border border-border-warm/40">
                    <span className="material-symbols-outlined text-primary text-[17px] mr-1.5">trip_origin</span>
                    <select
                      className="w-full bg-transparent font-title-md text-xs sm:text-[13px] text-on-surface focus:outline-none cursor-pointer"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    >
                      <option value="Agra">Agra (AGR)</option>
                      <option value="Delhi">Delhi / IGI (DEL)</option>
                      <option value="Jaipur">Jaipur City (JAI)</option>
                      <option value="Mathura">Mathura / Vrindavan</option>
                      <option value="Gwalior">Gwalior Fort (GWL)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-[9.5px] text-on-surface-variant uppercase font-semibold">TO</label>
                  <div className="relative flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 border border-border-warm/40">
                    <span className="material-symbols-outlined text-primary-container text-[17px] mr-1.5">location_on</span>
                    <select
                      className="w-full bg-transparent font-title-md text-xs sm:text-[13px] text-on-surface focus:outline-none cursor-pointer"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      <option value="Delhi">Delhi / NCR</option>
                      <option value="Jaipur">Jaipur (Rajasthan)</option>
                      <option value="Mathura">Mathura &amp; Vrindavan</option>
                      <option value="Gwalior">Gwalior (MP)</option>
                      <option value="Lucknow">Lucknow Expressway</option>
                      <option value="Agra">Agra Heritage Loop</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Vehicle Selector */}
              <div className="mb-3">
                <label className="font-label-caps text-[9.5px] text-on-surface-variant uppercase mb-1 block font-semibold">
                  Vehicle Class
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle("sedan")}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all border ${selectedVehicle === "sedan"
                        ? "bg-sandstone-wash border-primary text-primary font-bold shadow-sm"
                        : "bg-surface-container-low border-transparent text-on-surface hover:bg-surface-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    <span className="font-title-md text-[10.5px] mt-0.5">Sedan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle("ertiga")}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all border ${selectedVehicle === "ertiga"
                        ? "bg-sandstone-wash border-primary text-primary font-bold shadow-sm"
                        : "bg-surface-container-low border-transparent text-on-surface hover:bg-surface-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    <span className="font-title-md text-[10.5px] mt-0.5">Ertiga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle("innova")}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all border ${selectedVehicle === "innova"
                        ? "bg-sandstone-wash border-primary text-primary font-bold shadow-sm"
                        : "bg-surface-container-low border-transparent text-on-surface hover:bg-surface-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">airport_shuttle</span>
                    <span className="font-title-md text-[10.5px] mt-0.5">Crysta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle("tempo")}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all border ${selectedVehicle === "tempo"
                        ? "bg-sandstone-wash border-primary text-primary font-bold shadow-sm"
                        : "bg-surface-container-low border-transparent text-on-surface hover:bg-surface-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">rv_hookup</span>
                    <span className="font-title-md text-[10.5px] mt-0.5">Tempo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle("urbania")}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all border ${selectedVehicle === "urbania"
                        ? "bg-sandstone-wash border-primary text-primary font-bold shadow-sm"
                        : "bg-surface-container-low border-transparent text-on-surface hover:bg-surface-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">directions_bus</span>
                    <span className="font-title-md text-[10.5px] mt-0.5">Urbania</span>
                  </button>
                </div>
              </div>

              {/* Live Fare Banner */}
              <div className="p-2.5 bg-surface-container-low rounded-lg mb-3 flex items-center justify-between border border-border-warm/40">
                <div>
                  <span className="font-label-caps text-[9px] text-on-surface-variant block uppercase tracking-wider">Estimated Toll-Inclusive Fare</span>
                  <span className="font-price-display text-base sm:text-lg text-primary font-bold">₹{estimatedFare.toLocaleString("en-IN")}</span>
                </div>
                <span className="font-label-caps text-[9.5px] text-success-jade bg-success-jade/10 px-2 py-0.5 rounded font-bold">
                  28% Advance Token
                </span>
              </div>

              {/* Direct CTA */}
              <a
                className="w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-title-md text-xs sm:text-[13px] transition-all shadow-md text-center font-semibold"
                href={`/book?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&vehicle=${selectedVehicle}&type=${tripType}`}
              >
                <span>Book Now · ₹{estimatedFare.toLocaleString("en-IN")}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST ROLLER TICKER (Continuous Infinite Marquee) */}
      <div className="w-full bg-ink-charcoal border-y border-border-warm/15 py-3 overflow-hidden relative z-20 shadow-md">
        <div className="animate-marquee flex items-center gap-10 text-ivory-surface whitespace-nowrap">
          {[...Array(2)].flatMap(() => [
            {
              icon: "verified_user",
              title: "Govt-Registered",
              sub: "Tourist Vehicle Permit",
            },
            {
              icon: "badge",
              title: "Verified Chauffeurs",
              sub: "Police Background Check",
            },
            {
              icon: "receipt_long",
              title: "Official GST Billing",
              sub: "GSTIN Invoices",
            },
            {
              icon: "star",
              title: "4.9/5 Rating",
              sub: "3,800+ Verified Trips",
            },
            {
              icon: "support_agent",
              title: "24×7 Route Dispatch",
              sub: "Live Agra Control Desk",
            },
          ]).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 shrink-0 px-4">
              <span className="material-symbols-outlined text-gold-accent text-[20px]">{item.icon}</span>
              <div className="flex flex-col">
                <span className="font-title-md text-[13px] font-semibold leading-tight text-ivory-surface">
                  {item.title}
                </span>
                <span className="font-label-caps text-[10px] text-surface-dim">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. POPULAR OUTSTATION ROUTES */}
      <section className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
          <div>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-1">
              Popular Routes
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Popular routes from Agra.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Toll-inclusive one-way and round trips with zero hidden return charges.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
            href="/routes"
          >
            <span>View all 980+ routes</span>
            <span className="material-symbols-outlined text-[16px]">east</span>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Agra -> Delhi */}
          <div className="bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group border border-border-warm/40">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-[8.5px] uppercase font-bold">
                  Most Popular
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">flight</span>
              </div>
              <h3 className="font-title-md text-[13px] font-bold text-on-surface group-hover:text-primary transition-colors">
                Agra → Delhi
              </h3>
              <div className="flex items-center gap-2 font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">pin_drop</span>230 km
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>3h 30m
                </span>
              </div>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                Yamuna Expressway toll included. Direct drop to Delhi IGI Airport Terminal 1, 2 &amp; 3.
              </p>
            </div>
            <div className="pt-1.5 flex items-baseline justify-between border-t border-border-warm/40">
              <div>
                <span className="font-label-caps text-[8.5px] text-on-surface-variant block uppercase">Sedan from</span>
                <span className="font-price-display text-lg font-bold text-primary">₹3,499</span>
              </div>
              <a
                className="px-2.5 py-1 rounded-md bg-ink-charcoal hover:bg-primary text-ivory-surface text-[11px] font-semibold transition-colors"
                href="/book?from=Agra&to=Delhi"
              >
                Book ↗
              </a>
            </div>
          </div>

          {/* Agra -> Jaipur */}
          <div className="bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group border border-border-warm/40">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-[8.5px] uppercase font-bold">
                  Golden Triangle
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">castle</span>
              </div>
              <h3 className="font-title-md text-[13px] font-bold text-on-surface group-hover:text-primary transition-colors">
                Agra → Jaipur
              </h3>
              <div className="flex items-center gap-2 font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">pin_drop</span>240 km
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>4h 30m
                </span>
              </div>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                Via NH-21. Optional stopover at Fatehpur Sikri heritage palace en route.
              </p>
            </div>
            <div className="pt-1.5 flex items-baseline justify-between border-t border-border-warm/40">
              <div>
                <span className="font-label-caps text-[8.5px] text-on-surface-variant block uppercase">Sedan from</span>
                <span className="font-price-display text-lg font-bold text-primary">₹3,499</span>
              </div>
              <a
                className="px-2.5 py-1 rounded-md bg-ink-charcoal hover:bg-primary text-ivory-surface text-[11px] font-semibold transition-colors"
                href="/book?from=Agra&to=Jaipur"
              >
                Book ↗
              </a>
            </div>
          </div>

          {/* Agra -> Mathura */}
          <div className="bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group border border-border-warm/40">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-[8.5px] uppercase font-bold">
                  Pilgrimage
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">temple_hindu</span>
              </div>
              <h3 className="font-title-md text-[13px] font-bold text-on-surface group-hover:text-primary transition-colors">
                Agra → Mathura
              </h3>
              <div className="flex items-center gap-2 font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">pin_drop</span>55 km
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>1h 15m
                </span>
              </div>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                Coordinated around temple darshan. Banke Bihari &amp; Prem Mandir visit.
              </p>
            </div>
            <div className="pt-1.5 flex items-baseline justify-between border-t border-border-warm/40">
              <div>
                <span className="font-label-caps text-[8.5px] text-on-surface-variant block uppercase">Sedan from</span>
                <span className="font-price-display text-lg font-bold text-primary">₹2,200</span>
              </div>
              <a
                className="px-2.5 py-1 rounded-md bg-ink-charcoal hover:bg-primary text-ivory-surface text-[11px] font-semibold transition-colors"
                href="/book?from=Agra&to=Mathura"
              >
                Book ↗
              </a>
            </div>
          </div>

          {/* Agra -> Gwalior */}
          <div className="bg-surface-container-lowest rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group border border-border-warm/40">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-[8.5px] uppercase font-bold">
                  Day Trip
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">fort</span>
              </div>
              <h3 className="font-title-md text-[13px] font-bold text-on-surface group-hover:text-primary transition-colors">
                Agra → Gwalior
              </h3>
              <div className="flex items-center gap-2 font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">pin_drop</span>120 km
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>2h 30m
                </span>
              </div>
              <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                Via NH-44. Gwalior Fort &amp; Jai Vilas Palace drop with interstate permit included.
              </p>
            </div>
            <div className="pt-1.5 flex items-baseline justify-between border-t border-border-warm/40">
              <div>
                <span className="font-label-caps text-[8.5px] text-on-surface-variant block uppercase">Sedan from</span>
                <span className="font-price-display text-lg font-bold text-primary">₹3,000</span>
              </div>
              <a
                className="px-2.5 py-1 rounded-md bg-ink-charcoal hover:bg-primary text-ivory-surface text-[11px] font-semibold transition-colors"
                href="/book?from=Agra&to=Gwalior"
              >
                Book ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICES SYSTEM (01 TO 06) */}
      <section className="w-full py-space-3xl bg-surface-container-low">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
            <div>
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-1">
                Our Services
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                One local team. <br className="hidden sm:inline" />
                <span className="italic">Every kind of journey.</span>
              </h2>
            </div>
            <a
              className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
              href="/services"
            >
              <span>Explore All Services</span>
              <span className="material-symbols-outlined text-[16px]">east</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {/* 01: One-Way Outstation Drop */}
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-price-display text-lg font-bold text-primary">01</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
                </div>
                <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-1">One-Way Outstation Drop</h3>
                <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                  Point-to-point intercity drops on expressways. Guaranteed fixed fares with zero return journey charges.
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">DELHI ₹3,499</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">JAIPUR ₹3,499</span>
                </div>
                <a className="inline-flex items-center gap-1 font-label-lg text-[11px] text-primary hover:underline font-semibold" href="/routes">
                  <span>View all routes</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 02: Outstation Round-Trip */}
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-price-display text-lg font-bold text-primary">02</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">sync_alt</span>
                </div>
                <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-1">Outstation Round-Trip</h3>
                <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                  Multi-day travel with verified drivers. Transparent 300 km/day billing in clean, comfortable cabs.
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">MIN 300 KM/DAY</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">ALL INDIA PERMIT</span>
                </div>
                <a className="inline-flex items-center gap-1 font-label-lg text-[11px] text-primary hover:underline font-semibold" href="/book">
                  <span>Calculate round-trip</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 03: Local Sightseeing */}
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-price-display text-lg font-bold text-primary">03</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                </div>
                <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-1">Local Sightseeing &amp; City Tours</h3>
                <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                  Flexible 8h / 80km or 12h / 120km tours covering Taj Mahal, Agra Fort, and Mehtab Bagh at your own pace.
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">8H/80KM ₹1,900</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">12H/120KM ₹2,200</span>
                </div>
                <a className="inline-flex items-center gap-1 font-label-lg text-[11px] text-primary hover:underline font-semibold" href="/packages">
                  <span>Explore city tours</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 04: Transfers */}
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-price-display text-lg font-bold text-primary">04</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">flight_takeoff</span>
                </div>
                <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-1">Airport &amp; Station Transfers</h3>
                <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                  Punctual pickups for Delhi IGI Airport, Agra Cantt, and Gatimaan Express arrivals with signboard welcome.
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">AGRA CANTT ₹800</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">DELHI IGI ₹3,499</span>
                </div>
                <a className="inline-flex items-center gap-1 font-label-lg text-[11px] text-primary hover:underline font-semibold" href="/book">
                  <span>Book a transfer</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 05: Tempo & Urbania */}
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-price-display text-lg font-bold text-primary">05</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">airport_shuttle</span>
                </div>
                <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-1">Tempo Traveller &amp; Urbania</h3>
                <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                  Spacious group travel from 9 to 26 seats with pushback seating, individual AC vents, and large luggage space.
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">9–26 SEATER</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">LUXURY URBANIA</span>
                </div>
                <a className="inline-flex items-center gap-1 font-label-lg text-[11px] text-primary hover:underline font-semibold" href="/fleet">
                  <span>Explore group fleet</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* 06: Curated Tour Packages */}
            <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-price-display text-lg font-bold text-primary">06</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">wb_twilight</span>
                </div>
                <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-1">Sightseeing Tour Packages</h3>
                <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-2.5 leading-normal">
                  Single-day and multi-day packages including Taj Sunrise, Mathura-Vrindavan, and the Golden Triangle.
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">SAME DAY ₹3,499</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[8.5px]">TRIANGLE ₹18,500</span>
                </div>
                <a className="inline-flex items-center gap-1 font-label-lg text-[11px] text-primary hover:underline font-semibold" href="/packages">
                  <span>View all packages</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OUR FLEET */}
      <section className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
          <div>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-1">
              Our Fleet
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Choose your vehicle. <span className="italic">Travel in comfort.</span>
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              All-India commercial tourist permits, spotless air-conditioned cabins, and verified chauffeurs.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
            href="/fleet"
          >
            <span>Explore Entire Fleet</span>
            <span className="material-symbols-outlined text-[16px]">east</span>
          </a>
        </div>

        {/* Fleet Cards Mosaic */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
          {/* Sedan */}
          <div className="bg-surface-container-lowest rounded-xl p-2 sm:p-2.5 shadow-sm border border-border-warm/40 flex flex-col justify-between group transition-all duration-300 hover:ring-2 hover:ring-primary hover:border-transparent hover:shadow-xl hover:-translate-y-1.5 cursor-pointer">
            <div>
              <div className="h-24 w-full rounded-lg mb-2 bg-surface-container-low overflow-hidden relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDtlpHyMEhQIkaWh-siDUWpvafWXLxtakmQnE3648Tz_fpFPqz3fclfXfL8vy2KSvlfvgNo6E6bBL87D1O1mNnTtnQI7pAPVo1lBjhMJyGHvzs7qVIIXZ2_s8qinUgznt8ZIoCYC7Ayc3QD1n36bl6SecXNPBKx1M65cSoi4R0xiQ4TFDVIxwVItPu_XvVGE2uZ6uo9DMIHDVXgQc1h2SyLWNR7obR2Lr2TpkGxcCVZXT3lRiaY4ZVqA"
                  alt="Sedan tourist car"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-ink-charcoal group-hover:bg-primary transition-colors text-ivory-surface font-label-caps text-[8px] uppercase font-semibold">
                  01 / Sedan
                </span>
              </div>
              <h3 className="font-title-md text-[12px] text-on-surface font-bold">Dzire / Etios</h3>
              <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5 leading-tight">
                Ideal for couples &amp; expressway sprints.
              </p>
              <div className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant border-t border-border-warm/40 pt-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span>Seating:</span>
                  <span className="font-medium text-on-surface">4+1 Passengers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Luggage:</span>
                  <span className="font-medium text-on-surface">2 Large Bags</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outstation Rate:</span>
                  <span className="font-medium text-primary">₹10/km</span>
                </div>
              </div>
            </div>
            <div>
              <div className="font-price-display text-base text-on-surface mb-1.5 font-bold">
                ₹3,499 <span className="font-label-caps text-[8px] text-on-surface-variant font-normal">Delhi drop</span>
              </div>
              <a
                className="w-full block py-1.5 text-center rounded-md bg-sandstone-wash text-primary group-hover:bg-primary group-hover:text-white font-label-lg text-[11px] transition-colors font-semibold"
                href="/book?vehicle=sedan"
              >
                Choose Sedan
              </a>
            </div>
          </div>

          {/* Ertiga */}
          <div className="bg-surface-container-lowest rounded-xl p-2 sm:p-2.5 shadow-sm border border-border-warm/40 flex flex-col justify-between group transition-all duration-300 hover:ring-2 hover:ring-primary hover:border-transparent hover:shadow-xl hover:-translate-y-1.5 cursor-pointer">
            <div>
              <div className="h-24 w-full rounded-lg mb-2 bg-surface-container-low overflow-hidden relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhesay-ZLwlBtJ5ZxS_nHnmMWuLbYNhiTR_8-G0L93loc2JyYU38ra9_RnBzFYWW2VUkeB9EnuTm-a32VY1IqlUhT4nkGNkZNOGHaB80TLQrV-5viSEoaD9FSVqWtNLixnASZGTpeWs63Nv6x9due5VYDOo8MVPRk-0Avm26iQSVtPCRSdClQao_kvMc-jaqORcpO_6imYVUOwIdJwbqA11svh59eIGx8EgGvPvGljuPa7ScbwZiFy-w"
                  alt="Maruti Ertiga MPV"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-ink-charcoal group-hover:bg-primary transition-colors text-ivory-surface font-label-caps text-[8px] uppercase font-semibold">
                  02 / MPV
                </span>
              </div>
              <h3 className="font-title-md text-[12px] text-on-surface font-bold">Maruti Ertiga</h3>
              <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5 leading-tight">
                Spacious economy MPV for small families.
              </p>
              <div className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant border-t border-border-warm/40 pt-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span>Seating:</span>
                  <span className="font-medium text-on-surface">6+1 Passengers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Luggage:</span>
                  <span className="font-medium text-on-surface">3 Large Bags</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outstation Rate:</span>
                  <span className="font-medium text-primary">₹14/km</span>
                </div>
              </div>
            </div>
            <div>
              <div className="font-price-display text-base text-on-surface mb-1.5 font-bold">
                ₹4,800 <span className="font-label-caps text-[8px] text-on-surface-variant font-normal">Delhi drop</span>
              </div>
              <a
                className="w-full block py-1.5 text-center rounded-md bg-sandstone-wash text-primary group-hover:bg-primary group-hover:text-white font-label-lg text-[11px] transition-colors font-semibold"
                href="/book?vehicle=ertiga"
              >
                Choose Ertiga
              </a>
            </div>
          </div>

          {/* Innova Crysta */}
          <div className="bg-surface-container-lowest rounded-xl p-2 sm:p-2.5 shadow-sm border border-border-warm/40 flex flex-col justify-between group transition-all duration-300 hover:ring-2 hover:ring-primary hover:border-transparent hover:shadow-xl hover:-translate-y-1.5 cursor-pointer">
            <div>
              <div className="h-24 w-full rounded-lg mb-2 bg-surface-container-low overflow-hidden relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF3eDfcGr4R6CkrjMTNZxdC2HZoUjDprlMBBmp-43c8tc_7gD7QQ3ep6HQmju0Ih0j-VoflOA5Ir-p5czU5jDcnHPtbHrDeCAqZSmLfI9nsoFav-HUfJY3BAHuG2JPoSKlfh00Suyh6kFmuKtkXZbUCSnVDMhVCgEF864ewhoWwk8FfOJA_PEVu-riAnO_-aRUUQzBAtwTExczUJFmqOHxugrwQIWYeZeafE112-PSmuyUHzR5VUOv5Q"
                  alt="Innova Crysta Luxury Cab"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-ink-charcoal group-hover:bg-primary transition-colors text-ivory-surface font-label-caps text-[8px] uppercase font-semibold">
                  03 / Crysta
                </span>
              </div>
              <h3 className="font-title-md text-[12px] text-on-surface font-bold">Innova Crysta</h3>
              <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5 leading-tight">
                The outstation gold standard with captain seats.
              </p>
              <div className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant border-t border-border-warm/40 pt-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span>Seating:</span>
                  <span className="font-medium text-on-surface">6+1 Captain</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Luggage:</span>
                  <span className="font-medium text-on-surface">4 Large Bags</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outstation Rate:</span>
                  <span className="font-medium text-primary">₹18/km</span>
                </div>
              </div>
            </div>
            <div>
              <div className="font-price-display text-base text-on-surface mb-1.5 font-bold">
                ₹6,499 <span className="font-label-caps text-[8px] text-on-surface-variant font-normal">Delhi drop</span>
              </div>
              <a
                className="w-full block py-1.5 text-center rounded-md bg-sandstone-wash text-primary group-hover:bg-primary group-hover:text-white font-label-lg text-[11px] transition-colors font-semibold"
                href="/book?vehicle=innova"
              >
                Choose Crysta
              </a>
            </div>
          </div>

          {/* Tempo Traveller */}
          <div className="bg-surface-container-lowest rounded-xl p-2 sm:p-2.5 shadow-sm border border-border-warm/40 flex flex-col justify-between group transition-all duration-300 hover:ring-2 hover:ring-primary hover:border-transparent hover:shadow-xl hover:-translate-y-1.5 cursor-pointer">
            <div>
              <div className="h-24 w-full rounded-lg mb-2 bg-surface-container-low overflow-hidden relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtim6k1xZ-oNG2CqsGD4G34wTroprBPYyPJ9w7UYnqlD3AJi1jQBwG4iez5kq2R7JnA5jrbU71f63NA4Fg_9ivUh1cG2YmwcFEHjP8uB8yCO_rR0jqQtih9RtLuHMblGb62Vkg7AmFKA2kJO3duZSuqnhbnsr2yPOs-zIhv8qU0SlxpBYkAneSec38qdvXX221BLjsfOswvxgP68jLhUTwIPkQ9BZgyAVkuWywbAZJbcXZVSeMcPR58g"
                  alt="Tempo Traveller Group Van"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-ink-charcoal group-hover:bg-primary transition-colors text-ivory-surface font-label-caps text-[8px] uppercase font-semibold">
                  04 / Group
                </span>
              </div>
              <h3 className="font-title-md text-[12px] text-on-surface font-bold">Tempo Traveller</h3>
              <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5 leading-tight">
                Reclining seats, rear AC &amp; baggage bay.
              </p>
              <div className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant border-t border-border-warm/40 pt-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span>Seating:</span>
                  <span className="font-medium text-on-surface">12–17 Seater</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Luggage:</span>
                  <span className="font-medium text-on-surface">Rear Cargo Bay</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outstation Rate:</span>
                  <span className="font-medium text-primary">₹25/km</span>
                </div>
              </div>
            </div>
            <div>
              <div className="font-price-display text-base text-on-surface mb-1.5 font-bold">
                ₹9,500 <span className="font-label-caps text-[8px] text-on-surface-variant font-normal">Starting</span>
              </div>
              <a
                className="w-full block py-1.5 text-center rounded-md bg-sandstone-wash text-primary group-hover:bg-primary group-hover:text-white font-label-lg text-[11px] transition-colors font-semibold"
                href="/book?vehicle=tempo"
              >
                Choose Tempo
              </a>
            </div>
          </div>

          {/* Force Urbania */}
          <div className="bg-surface-container-lowest rounded-xl p-2 sm:p-2.5 shadow-sm border border-border-warm/40 flex flex-col justify-between group transition-all duration-300 hover:ring-2 hover:ring-primary hover:border-transparent hover:shadow-xl hover:-translate-y-1.5 cursor-pointer">
            <div>
              <div className="h-24 w-full rounded-lg mb-2 bg-surface-container-low overflow-hidden relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdR9ZGfEatK4fikITqlV-5YeoJBg58LlBbVg3bINsK4p3p94b0zZowjut7sHOfzG76_UwHnf8DSibSs8nFsOwlyYfZxr0Am8uXSUZDFWlP5gBNAbGaZwm04A-RAXFJmCGkHrC5ozEC8HtDyJxH8X87rz1fagIHja_tL6PuQ-HUAjHu_bL1Ba_yVq9wUlM3rRpelaYNjGly7ZXvmprg37BIu2CuP8q2Yp_Py0lH3imXVkBikdrFugYBnQ"
                  alt="Force Urbania Luxury Van"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-ink-charcoal group-hover:bg-primary transition-colors text-ivory-surface font-label-caps text-[8px] uppercase font-semibold">
                  05 / VIP
                </span>
              </div>
              <h3 className="font-title-md text-[12px] text-on-surface font-bold">Force Urbania</h3>
              <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5 mb-1.5 leading-tight">
                Boutique VIP cabin, individual reading lights &amp; USB.
              </p>
              <div className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant border-t border-border-warm/40 pt-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <span>Seating:</span>
                  <span className="font-medium text-on-surface">10–13 Luxury</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Luggage:</span>
                  <span className="font-medium text-on-surface">Huge Cargo Bay</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outstation Rate:</span>
                  <span className="font-medium text-primary">₹34/km</span>
                </div>
              </div>
            </div>
            <div>
              <div className="font-price-display text-base text-on-surface mb-1.5 font-bold">
                ₹12,500 <span className="font-label-caps text-[8px] text-on-surface-variant font-normal">Starting</span>
              </div>
              <a
                className="w-full block py-1.5 text-center rounded-md bg-sandstone-wash text-primary group-hover:bg-primary group-hover:text-white font-label-lg text-[11px] transition-colors font-semibold"
                href="/book?vehicle=urbania"
              >
                Choose Urbania
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CURATED TOUR PACKAGES */}
      <section className="w-full py-space-3xl bg-surface text-on-surface" id="tours">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
            <div>
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-1">
                Tour Packages
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Curated Tour Packages.</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Private guided tours with doorstep hotel or station pickup.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
              href="/packages"
            >
              <span>Explore All Packages</span>
              <span className="material-symbols-outlined text-[16px]">east</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {/* Package 1: Same Day Agra */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all border border-border-warm/40">
              <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFhG9SwH6I507dQuN34sU4ztKi3I66cmDMi8b2wQ9-mgznrz6OBZW9nRuYxUlrqmon_CvVUHDheRh9SL1uEan5slXPh1a6-8-V8ImuIJekxYh9TMlwzphg1crfgHAAdFmn_IvAyGACdBKhKDCs-cLtchmJIMuiwT_QuVr6njYzGc_Q9ULbq5FL0YmYy2Oh65CgOwQjvFhvpu4L0J26qByHJmdd3URyQv2dEdNa3x5KdEX-mPUzW233fw"
                  alt="Same Day Agra Taj Mahal Tour"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-ink-midnight/80 backdrop-blur-sm text-tertiary-fixed font-label-caps text-[8.5px] uppercase font-bold">
                  SAME DAY
                </span>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-terracotta-sandstone text-white font-price-display text-sm font-bold">
                  ₹3,499
                </div>
              </div>
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-0.5 group-hover:text-primary transition-colors">
                    Same Day Agra Taj Mahal Tour
                  </h3>
                  <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-1.5 leading-normal">
                    One-day private guided tour covering all iconic Mughal monuments with hotel pickup.
                  </p>
                  <ul className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant mb-2">
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Taj Mahal &amp; Agra Fort visit
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Itimad-ud-Daulah (Baby Taj)
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Mehtab Bagh sunset viewpoint
                    </li>
                  </ul>
                </div>
                <div className="pt-1.5 flex items-center justify-between border-t border-border-warm/40">
                  <span className="font-label-caps text-[8.5px] text-on-surface-variant uppercase font-semibold">
                    Starting Fare
                  </span>
                  <a
                    className="px-2.5 py-1 rounded-md bg-terracotta-sandstone hover:bg-terracotta-sunlit text-white font-label-lg text-[11px] transition-colors font-semibold"
                    href="/packages/agra-sightseeing"
                  >
                    View Tour ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Package 2: Taj Sunrise */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all border border-border-warm/40">
              <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxTJ0Lw2g0E-2f7Njva0bk9tnu2uxD4fDQEnjl9HfXhIsZPXpREe6IH64YxcrkLTU9LA-Sq18VOKNINmCXcE1SqhLJ0FRlDY7PcP8mXPJGqImX8UX6ulEV1tfIi-EaTk44xK2SVpNfowCr9XWRL4DoGWaRLWcuc9yzCK9WgY9T9q6I7XUpPjl8Suc6hiJQtpkLga47lMN99jxmLDggAJ-a-DA6OJ6dZ-ji_iNWU1c4dm5DVgEpmyTxBQ"
                  alt="Taj Mahal Sunrise Tour"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-ink-midnight/80 backdrop-blur-sm text-gold-accent font-label-caps text-[8.5px] uppercase font-bold">
                  DAWN SPECIAL
                </span>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-terracotta-sandstone text-white font-price-display text-sm font-bold">
                  ₹5,200
                </div>
              </div>
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-0.5 group-hover:text-primary transition-colors">
                    Taj Mahal Sunrise Guided Tour
                  </h3>
                  <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-1.5 leading-normal">
                    Beat the crowds and heat. Experience the monument of love as morning light hits white marble.
                  </p>
                  <ul className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant mb-2">
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Taj Mahal early morning dawn entry
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Agra Fort royal palace chambers
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Licensed monument guide option
                    </li>
                  </ul>
                </div>
                <div className="pt-1.5 flex items-center justify-between border-t border-border-warm/40">
                  <span className="font-label-caps text-[8.5px] text-on-surface-variant uppercase font-semibold">VIP Dawn Package</span>
                  <a
                    className="px-2.5 py-1 rounded-md bg-terracotta-sandstone hover:bg-terracotta-sunlit text-white font-label-lg text-[11px] transition-colors font-semibold"
                    href="/packages/taj-mahal-sunrise-tour"
                  >
                    View Tour ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Package 3: Mathura-Vrindavan */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all border border-border-warm/40">
              <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWn_np3YTwZ3dHJXWWaNmOYnGK1EVc0QOQHv15SFtKbGuB9q4FGRB2nZMtjPCVCVd-YWzfB53bYpDbPE7ln2sNi_CX1qb54jetI4Ygnuvy902WKeKQiNDsxrvf_u0bx6cNCBTK5lK1ZC6a8TG6_rZOuWT1-hszrhb8F_sTmie0J3CbmI7a192IdUb1RDlnk8TI0t5khOuhP_RUokajdQ2qc_Xw3GjJx99Sai5se6qYz9Lrt7-3cQCLsw"
                  alt="Mathura & Vrindavan Darshan"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-ink-midnight/80 backdrop-blur-sm text-tertiary-fixed font-label-caps text-[8.5px] uppercase font-bold">
                  PILGRIMAGE
                </span>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-terracotta-sandstone text-white font-price-display text-sm font-bold">
                  ₹4,200
                </div>
              </div>
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-title-md text-[13px] font-bold text-on-surface mb-0.5 group-hover:text-primary transition-colors">
                    Mathura &amp; Vrindavan Darshan
                  </h3>
                  <p className="font-body-sm text-[10.5px] text-on-surface-variant mb-1.5 leading-normal">
                    Comfortable holy circuit tailored around temple prayer timings and evening aarti.
                  </p>
                  <ul className="space-y-0.5 font-body-sm text-[9.5px] text-on-surface-variant mb-2">
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Krishna Janmabhoomi &amp; Dwarkadhish
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Banke Bihari &amp; Prem Mandir
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent shrink-0" />
                      Zero night waiting surcharges
                    </li>
                  </ul>
                </div>
                <div className="pt-1.5 flex items-center justify-between border-t border-border-warm/40">
                  <span className="font-label-caps text-[8.5px] text-on-surface-variant uppercase font-semibold">Full Day Circuit</span>
                  <a
                    className="px-2.5 py-1 rounded-md bg-terracotta-sandstone hover:bg-terracotta-sunlit text-white font-label-lg text-[11px] transition-colors font-semibold"
                    href="/packages/mathura-vrindavan"
                  >
                    View Tour ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE US (BENEFITS & PROMO COUPON) */}
      <section className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
        <div className="text-center max-w-2xl mx-auto mb-space-xl">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-1">
            Why Choose Us
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Benefits To Book Cab With Us.</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
            Dependable taxi service in Agra with upfront pricing, clean cars, and verified drivers.
          </p>
        </div>

        {/* 6 Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md mb-space-xl">
          <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-border-warm/40">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">touch_app</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[8.5px] text-on-surface-variant uppercase font-bold">
                Instant Confirm
              </span>
            </div>
            <h3 className="font-title-md text-[12px] text-on-surface mb-0.5 font-bold">Easy Booking</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant leading-normal">
              Book your cab in under 2 minutes with a simple checkout. Instant confirmation via Call &amp; WhatsApp.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-border-warm/40">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">garage</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[8.5px] text-on-surface-variant uppercase font-bold">
                Sedan to 26-Seater
              </span>
            </div>
            <h3 className="font-title-md text-[12px] text-on-surface mb-0.5 font-bold">Wide Vehicle Choice</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant leading-normal">
              Choose from clean Sedans, Ertiga, Innova Crysta, 9–26 seater Tempo Travellers, and Force Urbania.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-border-warm/40">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">price_check</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[8.5px] text-on-surface-variant uppercase font-bold">
                Zero Hidden Fees
              </span>
            </div>
            <h3 className="font-title-md text-[12px] text-on-surface mb-0.5 font-bold">Fixed &amp; Honest Rates</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant leading-normal">
              Transparent per-km billing, expressway tolls included upfront, and zero surprise driver surcharges.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-border-warm/40">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[8.5px] text-on-surface-variant uppercase font-bold">
                100% Punctual
              </span>
            </div>
            <h3 className="font-title-md text-[12px] text-on-surface mb-0.5 font-bold">Always On Time</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant leading-normal">
              Punctual doorstep pickups, flight delay tracking for airport arrivals, and knowledgeable drivers.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-border-warm/40">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[8.5px] text-on-surface-variant uppercase font-bold">
                Live Support 24×7
              </span>
            </div>
            <h3 className="font-title-md text-[12px] text-on-surface mb-0.5 font-bold">24×7 Local Support</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant leading-normal">
              Direct phone and WhatsApp support from our local Agra dispatch office whenever you need help.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-border-warm/40">
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-sandstone-wash flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[16px]">policy</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[8.5px] text-on-surface-variant uppercase font-bold">
                Police Verified
              </span>
            </div>
            <h3 className="font-title-md text-[12px] text-on-surface mb-0.5 font-bold">Verified Drivers</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant leading-normal">
              Every driver carries valid commercial documents, police verification, and adheres to courteous guest conduct.
            </p>
          </div>
        </div>

        {/* Promotional Coupon Callout */}
        <div className="bg-sandstone-wash rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-space-md border border-border-warm/50">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-primary uppercase font-bold">Limited Season Offer</span>
              <h4 className="font-title-md text-[15px] text-on-surface font-bold">Flat ₹500 Off on Outstation Trips</h4>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Apply coupon during booking for instant savings on your Agra to Delhi or Jaipur trip.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-border-warm/40 shadow-sm">
            <span className="font-label-caps text-[10px] text-on-surface-variant font-semibold">COUPON:</span>
            <code className="font-title-md font-bold text-primary tracking-wider text-xs">ASTTCAR500OFF</code>
            <button
              type="button"
              onClick={copyCoupon}
              className="text-[11px] px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps transition-colors font-bold"
            >
              {couponCopied ? "COPIED!" : "COPY"}
            </button>
          </div>
        </div>
      </section>

      {/* 8. VERIFIED TRAVELER REVIEWS */}
      <section className="w-full py-space-3xl bg-surface-container-low">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-accent/15 text-gold-accent font-label-caps text-[10px] mb-2 font-bold">
              <span className="material-symbols-outlined text-[15px]">hotel_class</span>
              VERIFIED TRAVELER REVIEWS
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              3,800+ Trips <br />
              <span className="italic">Across North India.</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex text-gold-accent">
                <span className="material-symbols-outlined text-[18px]">star</span>
                <span className="material-symbols-outlined text-[18px]">star</span>
                <span className="material-symbols-outlined text-[18px]">star</span>
                <span className="material-symbols-outlined text-[18px]">star</span>
                <span className="material-symbols-outlined text-[18px]">star</span>
              </div>
              <span className="font-title-md text-sm text-on-surface font-bold">4.9 / 5</span>
              <span className="text-on-surface-variant text-xs">· Over 3,800 Verified Journeys</span>
            </div>
          </div>

          {/* Testimonial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {/* Review 1 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      VM
                    </div>
                    <div>
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface leading-tight">Vikram Malhotra</h4>
                      <span className="font-label-caps text-[9.5px] text-on-surface-variant">Delhi to Agra Roundtrip</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-[8.5px] uppercase font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                  </span>
                </div>
                <p className="font-body-md text-[12.5px] italic text-on-surface-variant leading-relaxed">
                  “Sedan arrived 15 mins early at Delhi T3. Transparent ₹3,500 fare with all tolls included. Best taxi service in Agra!”
                </p>
              </div>
              <div className="flex text-gold-accent mt-3">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      ER
                    </div>
                    <div>
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface leading-tight">Elena Rostova</h4>
                      <span className="font-label-caps text-[9.5px] text-on-surface-variant">Taj Sunrise Tour</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-[8.5px] uppercase font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                  </span>
                </div>
                <p className="font-body-md text-[12.5px] italic text-on-surface-variant leading-relaxed">
                  “Spotless Innova Crysta with courteous English-speaking driver. Taj sunrise tour was completely hassle-free.”
                </p>
              </div>
              <div className="flex text-gold-accent mt-3">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      RS
                    </div>
                    <div>
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface leading-tight">Rajesh &amp; Sunita Sharma</h4>
                      <span className="font-label-caps text-[9.5px] text-on-surface-variant">Mathura-Vrindavan Pilgrimage</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-[8.5px] uppercase font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                  </span>
                </div>
                <p className="font-body-md text-[12.5px] italic text-on-surface-variant leading-relaxed">
                  “Booked Tempo Traveller for 12 family members. Punctual, safe driving along Yamuna Expressway and patient temple stops.”
                </p>
              </div>
              <div className="flex text-gold-accent mt-3">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
              </div>
            </div>

            {/* Review 4 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      DM
                    </div>
                    <div>
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface leading-tight">David Miller</h4>
                      <span className="font-label-caps text-[9.5px] text-on-surface-variant">Golden Triangle Traveler</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-[8.5px] uppercase font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                  </span>
                </div>
                <p className="font-body-md text-[12.5px] italic text-on-surface-variant leading-relaxed">
                  “Quick response via WhatsApp, verified driver, no tourist shop commission stops. Pure hospitality and fair rates.”
                </p>
              </div>
              <div className="flex text-gold-accent mt-3">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
              </div>
            </div>

            {/* Review 5 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      VK
                    </div>
                    <div>
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface leading-tight">Vijay Kumar</h4>
                      <span className="font-label-caps text-[9.5px] text-on-surface-variant">Local Sightseeing Tour</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-[8.5px] uppercase font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                  </span>
                </div>
                <p className="font-body-md text-[12.5px] italic text-on-surface-variant leading-relaxed">
                  “Booked cab for local sightseeing and had a very smooth experience. The car was clean, driver was polite, and on time.”
                </p>
              </div>
              <div className="flex text-gold-accent mt-3">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
              </div>
            </div>

            {/* Review 6 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-border-warm/40">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                      AS
                    </div>
                    <div>
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface leading-tight">Ananya Singhal</h4>
                      <span className="font-label-caps text-[9.5px] text-on-surface-variant">Corporate Travel Manager</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success-jade/10 text-success-jade font-label-caps text-[8.5px] uppercase font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                  </span>
                </div>
                <p className="font-body-md text-[12.5px] italic text-on-surface-variant leading-relaxed">
                  “Regular vendor for our executives visiting Agra. Official GST invoices delivered promptly with clean cars.”
                </p>
              </div>
              <div className="flex text-gold-accent mt-3">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span className="material-symbols-outlined text-[14px]">star</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. DIRECT DISPATCH & INQUIRY */}
      <section className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Left Dispatch Information */}
          <div className="lg:col-span-6 flex flex-col gap-space-md">
            <div>
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-1">
                24×7 Local Support
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Your driver is <br />
                <span className="italic">a call away.</span>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-lg">
                Based in Taj Ganj beside the Taj Mahal. 24×7 local dispatch desk for airport drops, outstation
                cabs, and custom sightseeing across North India.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
              <a
                className="p-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center gap-3 shadow-sm border border-border-warm/40"
                href="tel:+919876543210"
              >
                <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div>
                  <span className="font-label-caps text-[9.5px] text-on-surface-variant block uppercase font-bold">Call 24×7</span>
                  <span className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold">+91 98765 43210</span>
                </div>
              </a>
              <a
                className="p-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center gap-3 shadow-sm border border-border-warm/40"
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
              >
                <div className="w-9 h-9 rounded-full bg-ink-charcoal text-gold-accent flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </div>
                <div>
                  <span className="font-label-caps text-[9.5px] text-on-surface-variant block uppercase font-bold">WhatsApp</span>
                  <span className="font-title-md text-xs sm:text-[13px] text-on-surface font-bold">Chat with Support</span>
                </div>
              </a>
              <div className="p-3 rounded-lg bg-surface-container-lowest flex items-center gap-3 shadow-sm border border-border-warm/40">
                <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div className="min-w-0">
                  <span className="font-label-caps text-[9.5px] text-on-surface-variant block uppercase font-bold">Email Support</span>
                  <span className="font-title-md text-xs text-on-surface font-medium truncate block">bookings@skbagheltravels.in</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest flex items-center gap-3 shadow-sm border border-border-warm/40">
                <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div>
                  <span className="font-label-caps text-[9.5px] text-on-surface-variant block uppercase font-bold">Office Location</span>
                  <span className="font-title-md text-xs sm:text-[13px] text-on-surface font-medium">Taj Ganj, Agra 282001</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Dispatch Form */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-md border border-border-warm/40">
              <h3 className="font-title-md text-[16px] text-on-surface mb-1 font-bold">Direct Booking Inquiry</h3>
              <p className="font-body-sm text-[12px] text-on-surface-variant mb-space-md">
                Send your travel details for a quick quotation via WhatsApp.
              </p>
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                      Preferred Date of Travel
                    </label>
                    <input
                      type="date"
                      required
                      value={inquiryDate}
                      onChange={(e) => setInquiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                    Itinerary Details / Pickup Address
                  </label>
                  <textarea
                    rows={2.5}
                    value={inquiryNotes}
                    onChange={(e) => setInquiryNotes(e.target.value)}
                    placeholder="Pick-up hotel, drop location, monument preferences, or special requests..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white font-title-md text-xs font-semibold transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Send Inquiry to Support Desk</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
