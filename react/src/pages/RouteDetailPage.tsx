import React, { useState } from "react";
import { contact } from "../data/contact";
import {
  type Route,
  vehicles,
  routeGuidance,
  type VehicleId,
} from "../data/catalogue";
import { WhatsAppIcon } from "../components/icons";

interface RouteDetailPageProps {
  language?: "en" | "hi";
  route: Route;
}

export function RouteDetailPage({ route }: RouteDetailPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const fromEn = route.from.charAt(0).toUpperCase() + route.from.slice(1);
  const toEn = route.to.charAt(0).toUpperCase() + route.to.slice(1);

  const isLocal = route.kind === "local";
  const routeGuidanceData = routeGuidance[route.id] || {
    highway: "National Highway / State Corridor",
    transitTime: `${route.duration} (${route.km} km)`,
    departureTip: {
      en: "Early morning or mid-day departures are ideal to avoid peak city rush hours.",
      hi: "Early morning departures avoid peak city rush hours.",
    },
    restStops: {
      en: "Verified highway food courts with hygienic washrooms and branded eateries.",
      hi: "Verified highway food courts with hygienic washrooms.",
    },
    tollTaxPolicy: {
      en: "One-way booking includes highway tolls. Round-trip subject to standard outstation rules.",
      hi: "One-way booking includes highway tolls.",
    },
  };

  // Route-specific stopovers
  const stopovers = isLocal
    ? [
        {
          icon: "mosque",
          title: "Taj Mahal (East Gate)",
          desc: "Marvel at pristine white marble in the soft golden light of sunrise.",
        },
        {
          icon: "castle",
          title: "Agra Fort & Diwan-i-Khas",
          desc: "Explore the red sandstone imperial citadel of the Mughal Emperors.",
        },
        {
          icon: "park",
          title: "Mehtab Bagh Sunset",
          desc: "Witness the silhouette of the Taj Mahal across the sacred Yamuna river.",
        },
      ]
    : route.id.includes("jaipur")
      ? [
          {
            icon: "fort",
            title: "Fatehpur Sikri UNESCO Citadel",
            desc: "Optional 90-minute stop at Emperor Akbar's ghost capital and Buland Darwaza.",
          },
          {
            icon: "flutter_dash",
            title: "Bharatpur Bird Sanctuary",
            desc: "A paradise for migratory birds and nature lovers midway along NH-21.",
          },
          {
            icon: "stairs",
            title: "Abhaneri Stepwell (Chand Baori)",
            desc: "One of the world's deepest and most visually stunning geometric stepwells.",
          },
        ]
      : route.id.includes("mathura")
        ? [
            {
              icon: "temple_hindu",
              title: "Krishna Janmabhoomi Mathura",
              desc: "Sacred birth temple of Lord Krishna located on the historic NH-19 corridor.",
            },
            {
              icon: "temple_buddhist",
              title: "Prem Mandir Vrindavan",
              desc: "Stunning Italian white marble temple renowned for its evening light show.",
            },
            {
              icon: "water",
              title: "Yamuna Vishram Ghat",
              desc: "Peaceful boat rides and evening devotional aarti on the banks of Yamuna.",
            },
          ]
        : route.id.includes("gwalior")
          ? [
              {
                icon: "phishing",
                title: "Chambal River Safari",
                desc: "Protected sanctuary famous for gharials, dolphins, and rare aquatic wildlife.",
              },
              {
                icon: "castle",
                title: "Gwalior Fort & Man Mandir",
                desc: "Hilltop fortress described by Mughal Emperor Babur as the 'pearl of fortresses'.",
              },
              {
                icon: "history_edu",
                title: "Jai Vilas Palace",
                desc: "19th-century royal palace housing the world's largest crystal chandeliers.",
              },
            ]
          : [
              {
                icon: "ev_station",
                title: "Expressway Rest Plaza",
                desc: "Modern expressway comfort stop with clean restrooms, branded food, and coffee.",
              },
              {
                icon: "temple_hindu",
                title: "Vrindavan Expressway Cut",
                desc: "Optional detour to Banke Bihari and ISKCON temples before entering Agra.",
              },
              {
                icon: "storefront",
                title: "Sikandra - Akbar's Tomb",
                desc: "Magnificent red sandstone mausoleum nestled in quiet deer park grounds.",
              },
            ];

  // Route-specific FAQs
  const faqItems = [
    {
      q: `Are expressway tolls, FASTag charges, and state road taxes included?`,
      a: `Yes! For fixed one-way transfers between ${fromEn} and ${toEn}, all Yamuna Expressway or national highway FASTag tolls and interstate taxes are 100% included in the quoted fare. There are zero surprise toll requests on the road.`,
    },
    {
      q: `Can we stop at en-route landmarks like Fatehpur Sikri or highway food plazas?`,
      a: `Absolutely! Unlike app-based aggregators with rigid routes, our private chauffeur services accommodate requested refreshment stops, coffee breaks, and sightseeing detours. Just let your driver know your preferences.`,
    },
    {
      q: `What is the night driving allowance for late-night departures?`,
      a: `Standard commercial regulations apply a nominal night driving charge of ₹300 (Sedan/Ertiga) or ₹500 (Innova/Tempo) for journeys active between 10:00 PM and 5:00 AM. Sunrise Taj Mahal tours commencing early morning are completely exempt.`,
    },
    {
      q: `What happens if my flight or train is delayed before pickup?`,
      a: `We provide complimentary flight and train tracking! When booking, simply provide your arrival flight number or train PNR. Your chauffeur will automatically sync departure and include up to 60 minutes of complimentary waiting at terminal pickup bays.`,
    },
    {
      q: `What is your cancellation and refund policy?`,
      a: `Enjoy full peace of mind with our 24-Hour Free Cancellation Policy. If cancelled 24 hours or more before scheduled pickup, your 28% advance deposit is refunded 100% with zero cancellation penalty.`,
    },
    {
      q: `What emergency roadside assistance do you provide along this corridor?`,
      a: `We guarantee a 45-Minute Emergency Vehicle Replacement along major highway corridors (Yamuna Expressway, NH-19, and NH-21). Our central Taj Ganj dispatch operations desk immediately deploys a replacement commercial cab if required.`,
    },
  ];

  const primaryFare = route.fares.sedan;
  const advanceToken = Math.round(primaryFare * 0.28);
  const bookingUrl = `/book?from=${encodeURIComponent(fromEn)}&to=${encodeURIComponent(toEn)}&vehicle=sedan&route=${encodeURIComponent(route.id)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hello SK Baghel Desk, I would like to inquire about taxi booking from ${fromEn} to ${toEn}.`)}`;

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-[14px] text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/routes/">Routes</a>
            <span className="material-symbols-outlined text-[14px] text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">{fromEn} to {toEn}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            Expressway Corridor
          </span>
        </div>
      </div>

      {/* Hero Corridor Showcase */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            {/* Left Column: Corridor Specs & Booking Callout */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-widest w-fit">
                <span className="material-symbols-outlined text-[14px]">directions_car</span>
                Doorstep Intercity Transit • Zero Return Penalties
              </span>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {isLocal ? "Agra Local Sightseeing Taxi" : `${fromEn} to ${toEn} Chauffeur Taxi`}
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Experience seamless, air-conditioned road journeys between {fromEn} and {toEn}. Fully permitted commercial
                yellow-plate fleet, sanitized cabins, and veteran chauffeurs with zero commission shopping detours.
              </p>

              {/* Highway Corridor Intelligence Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-[20px]">straighten</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-[14px] text-ink-charcoal font-semibold">{route.km} km</span>
                    <span className="text-[11px] text-secondary">Verified Distance</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-[20px]">schedule</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-[14px] text-ink-charcoal font-semibold">{route.duration}</span>
                    <span className="text-[11px] text-secondary">Est. Transit Time</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-[20px]">alt_route</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-[14px] text-ink-charcoal font-semibold">Tolls Inc.</span>
                    <span className="text-[11px] text-secondary">One-Way Drops</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-[20px]">verified</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-[14px] text-ink-charcoal font-semibold">28% Token</span>
                    <span className="text-[11px] text-secondary">Reserve to Lock</span>
                  </div>
                </div>
              </div>

              {/* Rate Card & Direct Booking Bar */}
              <div className="bg-sandstone-wash/80 p-space-lg rounded-xl border border-border-warm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase">Starting Corridor Fare (Sedan)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">
                      ₹{primaryFare.toLocaleString("en-IN")}
                    </span>
                    <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
                  </div>
                  <span className="text-body-sm text-secondary">
                    Lock with only ₹{advanceToken.toLocaleString("en-IN")} (28% advance deposit)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm">
                  <a
                    className="inline-flex items-center justify-center gap-space-xs bg-terracotta-sandstone text-on-primary px-6 py-3.5 rounded text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all duration-200"
                    href={bookingUrl}
                  >
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                    <span>Book This Route</span>
                  </a>
                  <a
                    className="inline-flex items-center justify-center gap-space-xs bg-black text-white hover:bg-neutral-900 border border-white/10 px-5 py-3.5 rounded text-label-lg font-label-lg shadow-sm transition-all duration-200 active:scale-[0.98]"
                    style={{ color: "#ffffff" }}
                    href={whatsappUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
                    <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Highway Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-xl overflow-hidden shadow-xl bg-surface-container border border-border-warm/60">
                <img
                  className="w-full h-[440px] object-cover"
                  src={
                    route.id.includes("delhi")
                      ? "/assets/routes/expressway.webp"
                      : route.id.includes("jaipur")
                        ? "/assets/routes/jaipur-highway.webp"
                        : "/assets/routes/agra-lucknow.webp"
                  }
                  alt={`${fromEn} to ${toEn} highway corridor`}
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/fleet/innova.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-space-lg flex items-center justify-between text-ivory-surface">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md font-serif">{routeGuidanceData.highway}</span>
                    <span className="text-body-sm text-sandstone-wash/80">{route.km} km • {route.duration}</span>
                  </div>
                  <span className="bg-primary/90 text-ivory-surface px-3 py-1 rounded text-label-caps font-label-caps uppercase">
                    Smooth Pavement
                  </span>
                </div>
              </div>

              {/* Trust signals strip */}
              <div className="grid grid-cols-2 gap-space-sm pt-space-md">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-success-jade text-[20px]">verified</span>
                  <span className="text-body-sm text-on-surface font-medium">100% Commercial Fleet</span>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-success-jade text-[20px]">car_repair</span>
                  <span className="text-body-sm text-on-surface font-medium">45-Min Highway Replacement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 5-Vehicle Fare Comparison Matrix */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Vehicle Comparison
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Select Your Travel Tier for {fromEn} to {toEn}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Transparent, guaranteed fares across all vehicle categories. Zero hidden meter charges or surprise return toll fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {vehicles.map((v) => {
              const fare = route.fares[v.id as VehicleId] || primaryFare;
              const token = Math.round(fare * 0.28);
              const vSlug = v.id === "innova" ? "innova-crysta" : v.id === "tempo" ? "tempo-traveller" : v.id;
              const isForceVehicle = v.id === "tempo" || v.id === "urbania" || Boolean(v.alwaysRoundTrip);

              return (
                <div
                  key={v.id}
                  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-border-warm/60 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-[11px] uppercase tracking-wider font-semibold">
                        {v.klass}
                      </span>
                      <span className="text-body-sm text-secondary font-medium">{v.seats} Seats</span>
                    </div>

                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif mt-1">{v.name}</h3>

                    <div className="flex flex-col gap-1 py-space-xs border-y border-border-warm/30 text-body-sm text-on-surface-variant">
                      <div className="flex items-center justify-between">
                        <span>Luggage Capacity:</span>
                        <span className="font-medium text-ink-charcoal">{v.bags} Bags</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Air Conditioning:</span>
                        <span className="font-medium text-success-jade">Verified Dual AC</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Chauffeur:</span>
                        <span className="font-medium text-ink-charcoal">Police Verified</span>
                      </div>
                    </div>

                    <div className="flex flex-col pt-1">
                      <span className="text-[11px] font-label-caps text-secondary uppercase">
                        {isForceVehicle ? "Round-Trip Fare" : "All-Inclusive Fare"}
                      </span>
                      <span className="font-headline-md text-headline-md text-terracotta-sandstone font-serif font-semibold">
                        ₹{fare.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-secondary">
                        ₹{token.toLocaleString("en-IN")} token to lock
                      </span>
                      {isForceVehicle && (
                        <div className="mt-1.5 p-1.5 rounded bg-primary/10 border border-primary/20 text-[10.5px] text-primary font-semibold leading-tight">
                          This vehicle is always booked as a round trip.
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    className="mt-space-md w-full inline-flex items-center justify-center gap-1 bg-terracotta-sandstone text-on-primary py-2.5 rounded text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center"
                    href={`/book?from=${encodeURIComponent(fromEn)}&to=${encodeURIComponent(toEn)}&vehicle=${vSlug}&route=${encodeURIComponent(route.id)}`}
                  >
                    <span>Select {v.name.split(" ")[0]}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Highway Advisory & Route Intelligence Bento Grid */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Highway Intelligence
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Transit Logistics &amp; Travel Advisory
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Expert highway insights curated by our Taj Ganj dispatch desk for an effortless transit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            <div className="bg-surface-container-low p-space-xl rounded-xl shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-[26px]">road</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Highway Infrastructure</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {routeGuidanceData.highway}. Fully access-controlled with continuous surveillance and wide lanes.
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 text-body-sm text-secondary font-medium">
                Fast &amp; Predictable
              </div>
            </div>

            <div className="bg-surface-container-low p-space-xl rounded-xl shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-[26px]">wb_sunny</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Recommended Departure</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {routeGuidanceData.departureTip.en}
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 text-body-sm text-secondary font-medium">
                Avoid City Bottlenecks
              </div>
            </div>

            <div className="bg-surface-container-low p-space-xl rounded-xl shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-[26px]">restaurant</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Hygienic Rest Stops</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {routeGuidanceData.restStops.en}
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 text-body-sm text-secondary font-medium">
                Family &amp; Senior Friendly
              </div>
            </div>

            <div className="bg-surface-container-low p-space-xl rounded-xl shadow-sm border border-border-warm/50 flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                  <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-serif">Toll &amp; Tax Policy</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {routeGuidanceData.tollTaxPolicy.en}
                </p>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-border-warm/40 text-body-sm text-secondary font-medium">
                Zero Toll Cash Shakedowns
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: En-Route Heritage Stopovers */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Curated Halts
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              En-Route Sights &amp; Historical Stopovers
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Turn your road transit into an authentic cultural excursion. Mention your preferred stops when booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {stopovers.map((s, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-border-warm/50 flex flex-col justify-between"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone">
                    <span className="material-symbols-outlined text-[26px]">{s.icon}</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-serif">{s.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-border-warm/40 text-body-sm text-terracotta-sandstone font-medium">
                  Custom Itinerary Flexible
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Route Specific FAQ Accordion */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Corridor Clarifications
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Frequently Asked Questions for {fromEn} to {toEn}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Clear answers regarding toll inclusions, pickup punctuality, night allowances, and cancellation.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-container-low rounded-lg border border-border-warm/60 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-space-lg flex items-center justify-between gap-space-md text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-title-md text-ink-charcoal font-serif">{item.q}</span>
                    <span
                      className={`material-symbols-outlined text-terracotta-sandstone text-[22px] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-space-lg pb-space-lg pt-0 text-body-md text-on-surface-variant leading-relaxed border-t border-border-warm/20">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6: Grand Call-to-Action Strip */}
      <section className="w-full bg-sandstone-wash py-space-3xl border-t border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 md:p-12 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 w-full border border-border-warm">
            <div className="flex flex-col gap-space-xs max-w-xl text-left w-full">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest">
                Reserve With 28% Token
              </span>
              <h2 className="font-headline-lg text-[28px] sm:text-headline-md md:text-headline-lg text-ink-charcoal font-serif leading-tight">
                Travel from {fromEn} to {toEn} in Comfort.
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg leading-relaxed">
                Guaranteed commercial yellow-plate vehicle, police-verified chauffeur, and clean air conditioning.
                Lock your schedule with a modest 28% advance deposit.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-terracotta-sandstone text-on-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all duration-200 text-center"
                href={bookingUrl}
              >
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                <span>Book This Journey</span>
              </a>
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-ink-charcoal text-ivory-surface px-6 py-3.5 sm:py-4 rounded text-label-lg font-label-lg shadow-sm hover:bg-ink-slate transition-all duration-200 text-center"
                href={`tel:${contact.phone}`}
              >
                <span className="material-symbols-outlined text-[20px] text-terracotta-sunlit">phone_in_talk</span>
                <span>{contact.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RouteDetailPage;
