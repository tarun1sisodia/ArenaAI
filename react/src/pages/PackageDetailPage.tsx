import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { type TourPackage } from "../data";
import { WhatsAppIcon } from "../components/icons";

interface PackageDetailPageProps {
  language?: SupportedLanguage;
  pkg: TourPackage;
}

interface ItineraryItem {
  time: string;
  title: string;
  desc: string;
}

// Rich fallback itineraries for signature packages
const PACKAGE_DEFAULT_TIMELINES: Record<string, ItineraryItem[]> = {
  "taj-sunrise": [
    { time: "02:30 AM", title: "Doorstep Pickup from Delhi NCR / Hotel", desc: "Chauffeur arrives at your doorstep for a smooth, air-conditioned night drive via Yamuna Expressway." },
    { time: "05:30 AM", title: "Arrival in Agra & Meet ASI Guide", desc: "Quick freshen up and meet your approved government heritage guide near the Taj Mahal East Gate." },
    { time: "06:00 AM", title: "Taj Mahal Sunrise Exploration", desc: "Witness the pristine white marble bathed in golden dawn light before the public crowds arrive." },
    { time: "09:30 AM", title: "5-Star Royal Palace Buffet Breakfast", desc: "Relaxed lavish breakfast buffet at Courtyard by Marriott or ITC Mughal in Agra." },
    { time: "11:00 AM", title: "Agra Fort Royal Courtyards", desc: "Explore Jahangiri Mahal, Diwan-i-Khas, and Shah Jahan's historic prison with direct Taj views." },
    { time: "01:30 PM", title: "Lunch & Marble Inlay Atelier", desc: "Discover the age-old Pietra Dura marble inlay craft practiced by descendants of original Taj artisans." },
    { time: "04:30 PM", title: "Mehtab Bagh Sunset & Return Drive", desc: "Catch sunset reflections across the Yamuna River before a smooth expressway return drive back to Delhi NCR." },
  ],
  "agra-day": [
    { time: "06:00 AM", title: "Doorstep Hotel / Residence Pickup", desc: "Your dedicated commercial chauffeur arrives in a sanitized, chilled vehicle across Delhi NCR or Agra." },
    { time: "09:30 AM", title: "Taj Mahal Guided Heritage Excursion", desc: "Enter via express electronic gate with your licensed ASI guide for in-depth architectural narrative." },
    { time: "01:00 PM", title: "Authentic Mughlai Culinary Lunch", desc: "Enjoy a relaxed dining pause at a verified fine-dining multi-cuisine restaurant in Taj Ganj." },
    { time: "02:30 PM", title: "Agra Fort & Tomb of I'timād-ud-Daulah", desc: "Explore Akbar's majestic sandstone citadel and the delicate marble jewel-box Baby Taj." },
    { time: "05:30 PM", title: "Mehtab Bagh Sunset & Drop-Off", desc: "Capture sunset reflections across the Yamuna before comfortable drop at hotel or railway station." },
  ],
  "mathura-vrindavan": [
    { time: "07:00 AM", title: "Doorstep Pickup from Agra or Delhi NCR", desc: "Chauffeur greets you in a sanitized AC cab and departs for the sacred Braj corridor." },
    { time: "08:30 AM", title: "Shri Krishna Janmabhoomi Mathura", desc: "Visit the sacred birthplace of Lord Krishna, the ancient prison sanctum, and Keshavdev temple." },
    { time: "11:00 AM", title: "Dwarkadhish Temple & Vishram Ghat", desc: "Experience historic temple darshan followed by sacred Yamuna Aarti steps at Vishram Ghat." },
    { time: "01:00 PM", title: "Traditional Satvik Braj Bhojan", desc: "Enjoy authentic satvik vegetarian lunch with famous Mathura khoya pedas." },
    { time: "02:30 PM", title: "Banke Bihari Ji Mandir, Vrindavan", desc: "Chauffeur navigates you smoothly through Vrindavan to witness Thakur Ji's mesmerizing darshan." },
    { time: "05:00 PM", title: "ISKCON Krishna Balaram Temple", desc: "Immerse in joyful evening kirtan and peaceful marble temple corridors." },
    { time: "06:30 PM", title: "Prem Mandir Musical Light Show", desc: "Behold the magnificent white Italian marble temple illuminated in majestic evening lighting." },
    { time: "08:00 PM", title: "Smooth Expressway Return Journey", desc: "Relax in your AC vehicle on the Yamuna Expressway back to your hotel or residence." },
  ],
  "gatimaan-express": [
    { time: "07:00 AM", title: "Delhi Hotel Pickup to Nizamuddin Station", desc: "Private cab transfers you directly to Hazrat Nizamuddin Station for comfortable boarding." },
    { time: "08:10 AM", title: "Gatimaan Express High-Speed Transit", desc: "Train 12050 departs at 160 km/h. Enjoy warm complimentary breakfast served at your seat." },
    { time: "09:50 AM", title: "Agra Cantt Platform Chauffeur Greeting", desc: "Your dedicated chauffeur and ASI-licensed guide receive you right at the platform exit." },
    { time: "10:30 AM", title: "Taj Mahal Priority Guided Tour", desc: "Enter through priority channels and marvel at the world's greatest monument of love." },
    { time: "01:30 PM", title: "5-Star Luxury Buffet Lunch", desc: "Multi-cuisine gourmet lunch at an authorized 5-star hotel in Agra." },
    { time: "03:00 PM", title: "Agra Fort Mughal Citadel", desc: "Walk through royal apartments where Akbar, Jahangir, and Shah Jahan ruled the Mughal empire." },
    { time: "05:00 PM", title: "Transfer to Agra Cantt Station", desc: "Chauffeur assists with luggage and boards you on Train 12049 Gatimaan Express." },
    { time: "07:30 PM", title: "Arrival in Delhi & Hotel Drop", desc: "Meet your Delhi chauffeur at Nizamuddin Station and arrive back at your hotel safely." },
  ],
  "agra-unhurried": [
    { time: "Day 1 - 09:00 AM", title: "Doorstep Pickup & Hotel Check-in", desc: "Chauffeur picks you up and assists with your luxury hotel check-in in Agra." },
    { time: "Day 1 - 11:30 AM", title: "Agra Fort & Itimad-ud-Daulah (Baby Taj)", desc: "Unrushed exploration of Agra Fort and the exquisite precursor to the Taj Mahal." },
    { time: "Day 1 - 04:30 PM", title: "Mehtab Bagh Sunset Across Yamuna", desc: "Capture world-famous golden reflections across the river without tourist crowds." },
    { time: "Day 1 - 07:30 PM", title: "Mughal Cuisine Dinner & Artisan Bazaar", desc: "Experience authentic Mughlai dishes and stroll along vibrant local markets." },
    { time: "Day 2 - 06:00 AM", title: "Taj Mahal Sunrise Walk", desc: "Early morning tranquil visit to the Taj Mahal with ethereal golden dawn light." },
    { time: "Day 2 - 11:00 AM", title: "Fatehpur Sikri Imperial Capital Excursion", desc: "Drive 38 km to Akbar's ghost capital: Buland Darwaza, Jama Masjid, and Panch Mahal." },
    { time: "Day 2 - 04:30 PM", title: "Return Drop to Delhi NCR / Agra Station", desc: "Chauffeur ensures prompt drop to your preferred destination." },
  ],
  "golden-triangle": [
    { time: "Day 1", title: "Delhi City Highlights to Agra via Expressway", desc: "Tour India Gate, Qutub Minar, and Rashtrapati Bhavan, then cruise down Yamuna Expressway to Agra." },
    { time: "Day 2", title: "Agra Taj Mahal Dawn to Jaipur via Fatehpur Sikri", desc: "Sunrise at Taj Mahal, Agra Fort, then scenic drive past Buland Darwaza to the Pink City Jaipur." },
    { time: "Day 3", title: "Jaipur Forts & Palaces to Delhi Return", desc: "Explore Amber Fort with elephant pavilions, Hawa Mahal, City Palace, then return drop to Delhi." },
  ],
};

interface TourFaq {
  q: string;
  a: string;
}

const TOUR_FAQS: TourFaq[] = [
  {
    q: "What happens if there is morning winter fog or overcast clouds?",
    a: "While morning mist occurs predominantly during late December and January, the Taj Mahal creates an enchanting mystical silhouette in soft morning conditions. Our guides adapt the route pacing—starting with the intricate interiors and marble corridors, transitioning to open courtyard photography as the morning sun burns off the mist by 08:00 AM.",
  },
  {
    q: "Are shoes allowed inside the main mausoleum chamber?",
    a: "Shoes are not permitted on the main white marble plinth. Our tour package provides complimentary hygienic fabric shoe covers so you do not have to walk barefoot or wait in long queues at the public shoe deposit counters.",
  },
  {
    q: "How do we purchase monument entry tickets?",
    a: "The Archaeological Survey of India (ASI) requires photo identification (Passport or Aadhaar card) for ticket issuance. You may purchase tickets online via the ASI portal, or simply ask our WhatsApp to pre-book them electronically under your names to bypass all on-site ticketing counters entirely.",
  },
  {
    q: "Can we alter the departure timing or customize stops?",
    a: "Yes, this is an entirely private tour. If you wish to adjust departure by 30 minutes, or replace Mehtab Bagh with the Tomb of I'timād-ud-Daulah (Baby Taj) or local petha sweets tasting, simply inform your concierge via WhatsApp or telephone without any penalty surcharge.",
  },
  {
    q: "What is the exact 28% advance payment policy?",
    a: "In accordance with our customer-protection charter, you pay only 28% online to lock the chauffeur and guide. The remaining 72% is paid directly to your chauffeur upon completion of your tour, after you are completely satisfied with your journey.",
  },
];

export function PackageDetailPage({ language = "en", pkg }: PackageDetailPageProps) {
  // Interactive FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculate 28% advance token
  const grossPrice = pkg.from;
  const advanceAmount = Math.round(grossPrice * 0.28);
  const balanceAmount = grossPrice - advanceAmount;

  // Resolve timeline stops
  const timelineStops = useMemo<ItineraryItem[]>(() => {
    if (pkg.itinerary && pkg.itinerary.length > 0) {
      return pkg.itinerary.map((stop: any, idx: number) => ({
        time: stop.time || `Stop 0${idx + 1}`,
        title: typeof stop.title === "string" ? stop.title : stop.title?.en || stop.name || `Sightseeing Stop ${idx + 1}`,
        desc: typeof stop.desc === "string" ? stop.desc : stop.desc?.en || stop.description || "Chauffeured sightseeing and heritage exploration.",
      }));
    }
    if (pkg.timeline && pkg.timeline.length > 0) {
      return pkg.timeline.map((stop) => ({
        time: stop.time,
        title: typeof stop.title === "string" ? stop.title : stop.title.en,
        desc: typeof stop.desc === "string" ? stop.desc : stop.desc.en,
      }));
    }
    if (PACKAGE_DEFAULT_TIMELINES[pkg.id] || PACKAGE_DEFAULT_TIMELINES[pkg.slug]) {
      return PACKAGE_DEFAULT_TIMELINES[pkg.id] || PACKAGE_DEFAULT_TIMELINES[pkg.slug];
    }
    // Dynamic fallback stops generated from places
    const placesList = pkg.places && pkg.places.length > 0 ? pkg.places : [pkg.source || "Agra", pkg.destination || pkg.name];
    return placesList.map((place, idx) => ({
      time: `Stop 0${idx + 1}`,
      title: place,
      desc: `Chauffeured visit and guided architectural exploration of ${place} with dedicated waiting time and parking assistance.`,
    }));
  }, [pkg]);

  // Schema.org structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
        provider: {
          "@type": "LocalBusiness",
          name: "Agra SK Baghel Tour and Travels",
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
            item: "https://agraskbagheltourandtravels.com/en/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Packages",
            item: "https://agraskbagheltourandtravels.com/en/packages/",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: pkg.name,
            item: `https://agraskbagheltourandtravels.com/en/packages/${pkg.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: TOUR_FAQS.map((faq) => ({
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

  // Step 1 booking link (Vehicle Selection screen)
  const fromParam = encodeURIComponent(pkg.source || "Agra");
  const toParam = encodeURIComponent(pkg.destination || pkg.name);
  const bookStep1Url = `/book.html?trip=package&package=${encodeURIComponent(pkg.slug)}&from=${fromParam}&to=${toParam}&step=1`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour and Travels, I wish to reserve the ${pkg.name} (Starting ₹${pkg.from.toLocaleString("en-IN")}).`
  )}`;

  return (
    <div className="flex flex-col w-full bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* BREADCRUMBS BAR */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm px-margin-mobile lg:px-margin border-b border-border-warm/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
          <nav className="flex items-center gap-space-xs" aria-label="Breadcrumb">
            <a className="hover:text-primary transition-colors" href="/en/">Home</a>
            <span className="text-outline-variant text-body-lg font-sans">/</span>
            <a className="hover:text-primary transition-colors" href="/en/packages/">Packages</a>
            <span className="text-outline-variant text-body-lg font-sans">/</span>
            <span className="text-primary font-medium">{pkg.name}</span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-body-lg text-secondary">
            <span className="w-2 h-2 rounded-full bg-success-jade inline-block animate-pulse"></span>
            <span>24×7 Instant Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* HERO STORY & VISUAL SHOWCASE */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-lg">
        <div className="flex flex-col gap-space-md">
          {/* Eyebrow Badges */}
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg text-label-caps uppercase font-semibold tracking-widest">
              {pkg.kicker || "Signature Tour"}
            </span>
            <span className="bg-sandstone-wash text-terracotta-sandstone px-3 py-1 rounded-lg text-label-caps uppercase font-semibold tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-icon-14">route</span>
              {pkg.source || "Agra"} → {pkg.destination || pkg.name}
            </span>
            <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-lg text-label-caps uppercase font-semibold">
              All-Inclusive Chauffeur &amp; Guide
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-gold-accent font-semibold text-body-sm bg-ink-charcoal text-ivory-surface px-3 py-1 rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-icon-16 text-gold-accent">star</span>
              4.98 / 5 <span className="text-secondary-fixed-dim font-normal text-label-md">(650+ Verified Visitors)</span>
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-xs">
              <h1 className="font-headline-hero text-headline-hero text-on-surface leading-tight">
                {pkg.name}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                {pkg.blurb}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary text-body-sm">
                <span className="material-symbols-outlined text-primary text-icon-18">schedule</span>
                <span>Duration: <strong className="text-on-surface">{pkg.duration}</strong></span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mosaic */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md mt-space-md">
            {/* Main Feature Image: Road Expedition / Luxury Vehicle */}
            <div className="md:col-span-8 relative rounded-xl overflow-hidden min-h-[360px] lg:min-h-[460px] shadow-md group">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={`${pkg.name} luxury chauffeur expedition`}
                src={pkg.image || "/assets/packages/taj-dawn.webp"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/85 via-ink-charcoal/25 to-transparent"></div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-space-sm text-ivory-surface">
                <div>
                  <span className="text-label-caps uppercase text-gold-accent font-semibold tracking-wider">
                    Unrivaled Comfort
                  </span>
                  <h3 className="font-headline-md text-headline-sm text-surface">Yamuna Expressway VIP Cruiser</h3>
                  <p className="text-body-sm text-secondary-fixed-dim max-w-lg">
                    Zero toll delays, unlimited chilled Himalayan bottled water, wet wipes, and mints.
                  </p>
                </div>
                <span className="bg-surface/20 backdrop-blur-md px-3 py-1 rounded-lg text-body-sm font-medium">
                  Fastag Pass Included
                </span>
              </div>
            </div>

            {/* Secondary Heritage Views */}
            <div className="md:col-span-4 grid grid-cols-1 gap-space-md">
              <div className="relative rounded-xl overflow-hidden min-h-[170px] lg:min-h-[215px] shadow-sm group">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Taj Mahal morning sunlight view"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2yf-yBU3hlsj0yoDvKQuP0oe6WgHmL9Zp1It3UX4nt2DQnx758CLagwRSUfUyxP1x94bKKqwL8EeD-VILb9XhvYHbrj9ajEPX9oXgLEMY_ksbGoFyGii8FeQlpfiDsaJEaBiElqArswBsy-Szo9P1AiuEHzAqAHIBl2U5mryTmHPcxLdKPwyvoEk7Pc17rJDEn76H1pc-eP1-8L2SqkX8sVvPSIZZAjXjDDd2o__BhvpU5Aw0v4WFIw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-ivory-surface">
                  <span className="text-label-caps uppercase text-terracotta-sunlit">Monument Vantage</span>
                  <p className="font-headline-sm text-headline-card leading-snug">Priority Entry &amp; Prime Photography</p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden min-h-[170px] lg:min-h-[215px] shadow-sm group">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="5-Star royal palace dining and refreshments"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI1YNHnPOUMAYZXIn-msx_lCMvf_qW2T2cwxbtIVgvOgnUSQ5Es3br-96fv0T8NuwFm4EFi6bGA_QPKTGF6yKCLYfa279a_zZA8U4Dud5Ex6k0QTPqUTiymsfL4UhCGp9nhedjTOV-2Dg9Q4Y4MHN9bs0U-F_FF0lT2CBiiB1gfW0n8kVIE_azmlZqxA6lKnKD5AJXt2lZTxubG2rf9Grv4GXrmpphWD5jUJHc04_9DLcyq3sYwDVQ7Q"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-ivory-surface">
                  <span className="text-label-caps uppercase text-gold-accent">Gourmet Repast</span>
                  <p className="font-headline-sm text-headline-card leading-snug">5-Star Royal Palace Buffet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO COLUMN ARCHITECTURAL CORE: ITINERARY & RESERVATION DOCK */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* LEFT COLUMN: Comprehensive Itinerary, Inclusions & Guidelines */}
          <div className="lg:col-span-7 flex flex-col gap-space-2xl">
            {/* Chapter 01: The Experience Overview */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">01.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">The Imperial Heritage Experience</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {pkg.blurb} Designed with complete flexibility and royal hospitality, this private expedition bypasses crowded tour buses, ensuring an intimate, personalized connection with the grand history and architecture of North India.
              </p>
              <div className="bg-surface-container rounded-xl p-space-md flex items-start gap-space-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-gold-accent text-icon-24 shrink-0 mt-0.5">hotel_class</span>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">Why Private Chauffeur Travel is Paramount</span>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Doorstep hotel pickup, peaceful expressway transit, zero midway detours, and complete freedom to pause for photography and dining whenever you desire.
                  </p>
                </div>
              </div>
            </div>

            {/* Chapter 02: Clear Transparent Package Accounting */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">02.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Clear Transparent Package Accounting</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {/* Included */}
                <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-border-warm/60">
                  <div className="flex items-center gap-space-xs text-success-jade">
                    <span className="material-symbols-outlined text-icon-22">check_circle</span>
                    <span className="font-title-md text-title-md font-semibold text-on-surface">What is Fully Included</span>
                  </div>
                  <ul className="flex flex-col gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                    {pkg.includes && pkg.includes.length > 0 ? (
                      pkg.includes.map((inc, i) => (
                        <li key={i} className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0 mt-0.5">check_circle</span>
                          <span>{inc}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0 mt-0.5">check_circle</span>
                          <span>Chauffeur-driven AC vehicle dedicated exclusively to your group</span>
                        </li>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0 mt-0.5">check_circle</span>
                          <span>All highway tolls, state entry permits &amp; monument parking fees</span>
                        </li>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0 mt-0.5">check_circle</span>
                          <span>Doorstep pickup &amp; drop-off from hotel or station</span>
                        </li>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0 mt-0.5">check_circle</span>
                          <span>Chilled Himalayan mineral water &amp; sanitizing wipes</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Excluded */}
                <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-border-warm/60">
                  <div className="flex items-center gap-space-xs text-secondary">
                    <span className="material-symbols-outlined text-icon-22">cancel</span>
                    <span className="font-title-md text-title-md font-semibold text-on-surface">What is Excluded</span>
                  </div>
                  <ul className="flex flex-col gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                    {pkg.excludes && pkg.excludes.length > 0 ? (
                      pkg.excludes.map((exc, i) => (
                        <li key={i} className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-icon-18 shrink-0 mt-0.5">cancel</span>
                          <span>{exc}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-icon-18 shrink-0 mt-0.5">cancel</span>
                          <span>Monument entrance tickets (Pay direct or request concierge pre-booking)</span>
                        </li>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-icon-18 shrink-0 mt-0.5">cancel</span>
                          <span>Personal purchases, meals &amp; souvenir artisan items</span>
                        </li>
                        <li className="flex items-start gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-icon-18 shrink-0 mt-0.5">cancel</span>
                          <span>Driver &amp; Guide discretionary gratuity / tips</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Chapter 03: Essential Visitor Guidelines */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">03.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Essential Visitor Guidelines &amp; Protocols</h2>
              </div>
              <div className="bg-sandstone-wash/80 rounded-xl p-space-md flex flex-col gap-space-sm border border-border-warm">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="material-symbols-outlined">warning</span>
                  <span className="font-title-md text-title-md">Strict ASI Monument Protocols</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">event_busy</span>
                    <div>
                      <strong className="text-on-surface">Friday Taj Closure:</strong> The Taj Mahal is strictly closed to visitors every Friday for prayers. Agra Fort remains open.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">photo_camera</span>
                    <div>
                      <strong className="text-on-surface">Camera Regulations:</strong> Still cameras and smartphones permitted free. Drones, video tripods, and extra battery packs strictly prohibited by CISF.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">backpack</span>
                    <div>
                      <strong className="text-on-surface">Baggage Restrictions:</strong> Large backpacks, food items, tobacco, and lighters are confiscated at gate lockers. Please leave luggage inside our secured car trunk.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">badge</span>
                    <div>
                      <strong className="text-on-surface">Zero Commission Guarantee:</strong> We do not conduct high-pressure carpet or jewellery shop detours. Your time is dedicated strictly to heritage monuments.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter 04: Hour-by-Hour Curated Itinerary */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">04.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Hour-by-Hour Curated Itinerary</h2>
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-warm">
                {timelineStops.map((stop, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface group-hover:scale-125 transition-transform"></div>
                    <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm border border-border-warm/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-label-caps uppercase text-terracotta-sandstone font-bold tracking-wider">
                          {stop.time}
                        </span>
                      </div>
                      <h3 className="font-title-md text-title-md text-ink-charcoal font-semibold">{stop.title}</h3>
                      <p className="text-body-sm text-on-surface-variant leading-relaxed">{stop.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Reservation & Vehicle Selection Console */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md border border-border-warm">
              {/* Box Header */}
              <div className="flex flex-col gap-space-xs pb-space-sm border-b border-border-warm/60">
                <div className="flex items-center justify-between">
                  <span className="text-label-caps text-terracotta-sandstone uppercase font-bold tracking-wider">
                    Instant Reservation
                  </span>
                  <span className="inline-flex items-center gap-1 text-label-md font-semibold text-success-jade bg-surface-container px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-icon-14">verified</span> Instant Confirmation
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-sm text-on-surface">Reserve Your Private Tour</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-body-sm text-secondary font-medium">Starting from</span>
                  <span className="font-price-display text-price-display text-primary font-bold">
                    ₹{pkg.from.toLocaleString("en-IN")}
                  </span>
                  <span className="text-label-md text-terracotta-sandstone bg-sandstone-wash px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                    All-Inclusive
                  </span>
                </div>
                <p className="text-body-lg text-secondary mt-0.5">
                  Lock with only 28% advance deposit (₹{advanceAmount.toLocaleString("en-IN")}) • Pay remaining 72% on drop-off
                </p>
              </div>

              {/* Key Highlights / Quick Inclusions */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-xs border border-border-warm shadow-sm">
                <span className="text-label-caps text-secondary font-bold uppercase tracking-wider mb-1">
                  Package Highlights
                </span>
                <div className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">
                    directions_car
                  </span>
                  <span>
                    <strong className="text-on-surface font-semibold">Private Doorstep Chauffeur:</strong> Sedan, Ertiga, Innova Crysta VIP, Tempo Traveller, or Urbania
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">
                    toll
                  </span>
                  <span>
                    <strong className="text-on-surface font-semibold">Expressway FastPass:</strong> Pre-cleared FASTag tolls &amp; interstate permits
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">
                    history_edu
                  </span>
                  <span>
                    <strong className="text-on-surface font-semibold">Licensed ASI Historian Guide:</strong> Expert English heritage narrative
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0 mt-0.5">
                    restaurant
                  </span>
                  <span>
                    <strong className="text-on-surface font-semibold">Hospitality Care:</strong> Chilled mineral water, sanitized cabin, and luggage assistance
                  </span>
                </div>
              </div>

              {/* Direct Booking CTAs */}
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={bookStep1Url}
                  className="w-full bg-primary hover:bg-terracotta-sunlit text-on-primary py-3.5 px-4 rounded-lg font-title-md text-title-md transition-all shadow-md flex items-center justify-center gap-2 group text-center"
                >
                  <span>Book Now</span>
                  <span className="material-symbols-outlined text-icon-20 group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </a>
                <span className="text-center text-body-lg text-secondary font-medium">
                  Select vehicle class &amp; pickup date in 2 easy steps
                </span>

                <a
                  className="w-full bg-black hover:bg-neutral-900 border border-white/10 text-white py-3 px-4 rounded-lg font-label-lg text-label-lg transition-colors flex items-center justify-center gap-2 mt-1 shadow-sm active:scale-[0.98]"
                  style={{ color: "#ffffff" }}
                  href={whatsappUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
                  <span className="text-white" style={{ color: "#ffffff" }}>Chat with Concierge on WhatsApp</span>
                </a>
              </div>

              {/* Trust & Peace-of-Mind Proof Signals */}
              <div className="bg-sandstone-wash/60 p-space-md rounded-xl flex flex-col gap-2 text-body-lg text-on-surface-variant border border-border-warm/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0">verified</span>
                  <span><strong className="text-on-surface font-semibold">100% Full Refund Guarantee:</strong> Free cancellation up to 24h prior</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gold-accent text-icon-18 shrink-0">lock</span>
                  <span><strong className="text-on-surface font-semibold">28% Advance Token Lock:</strong> Remaining balance upon tour completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-18 shrink-0">no_meeting_room</span>
                  <span><strong className="text-on-surface font-semibold">Zero Tourist Commission Traps:</strong> 100% authentic heritage time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-icon-18 shrink-0">support_agent</span>
                  <span><strong className="text-on-surface font-semibold">24×7 Active Dispatch Desk:</strong> Chauffeur &amp; flight delay assistance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE ROUTE MAP & CORRIDOR */}
      <section className="w-full bg-sandstone-wash/40 py-space-2xl border-t border-b border-border-warm/60">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex flex-col gap-space-xl">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <span className="text-label-caps text-terracotta-sandstone uppercase font-bold tracking-widest">
              Expressway Corridor
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">The Seamless Expressway Transit</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Experience North India's prime 6-lane access-controlled expressways. Our verified chauffeur takes care of all electronic toll plazas and interstate permits while you recline in comfort.
            </p>
          </div>
          {/* Corridor Map Card & Milestone Stops */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-7 rounded-xl overflow-hidden shadow-md">
              <div
                className="w-full h-80 lg:h-96 bg-cover bg-center rounded-xl relative"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB5MplUWgIL3dBa34ksge2spKfOa_LJdpNiXZTHbwGt0HJ90RXV-xQehE_dNsw_shNP1dE9XU_hgbSObgOhTXH28BttgpGLWZ-bpeDgs0EQD8rjCeh1-16fy6FY8c_LBvIF9Wg-vou14nFagq6ah3sHX18MxOLFMqqPlpWBvfphCuUDuO-IhNmdOBDRWCESUiBQqjzD0CYpYJIwjYdV_aaaCb45l-rGexCnNH4hTfoEU_xxri2kUKtAtA")`,
                }}
              >
                <div className="absolute inset-0 bg-ink-charcoal/20"></div>
                <div className="absolute bottom-4 left-4 bg-surface/95 backdrop-blur-md p-space-sm rounded-lg shadow-md max-w-xs border border-border-warm">
                  <span className="text-label-caps uppercase text-primary font-bold">Corridor Analytics</span>
                  <p className="text-body-sm font-semibold text-on-surface">{pkg.source || "Agra"} → {pkg.destination || pkg.name}</p>
                  <p className="text-body-lg text-secondary">{pkg.duration} Private Charter • Verified Chauffeur • All Tolls &amp; Permits Included</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex items-start gap-space-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-primary text-icon-24 shrink-0 mt-1">speed</span>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">Pristine 100 km/h Highway Cruising</h3>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Eliminates the congested old GT road. Constant tire pressure monitored fleet for top security at high speeds.
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex items-start gap-space-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-gold-accent text-icon-24 shrink-0 mt-1">local_cafe</span>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">Express Rest Stops at Jewel of Yamuna</h3>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Optional 15-minute quick stop at certified hygienic plazas featuring Costa Coffee, Subway, and spotless restrooms.
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex items-start gap-space-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-terracotta-sandstone text-icon-24 shrink-0 mt-1">electric_rickshaw</span>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">Eco-Zone Battery Cart Transit</h3>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Pre-reserved golf cart drops you directly from Shilpgram parking right to the East Gate turnstiles without walking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS & PHOTO TESTIMONIALS */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-3xl">
        <div className="flex flex-col gap-space-2xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
            <div>
              <span className="text-label-caps text-terracotta-sandstone uppercase font-bold tracking-widest">
                Guest Impressions
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Verified Voyagers</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-gold-accent">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-icon-20">star</span>
                ))}
              </div>
              <span className="font-bold text-on-surface">4.98 Rating</span>
              <span className="text-secondary text-body-sm">• 650+ Reviews</span>
            </div>
          </div>
          {/* Testimonial Cards Mosaic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Review 1 */}
            <div className="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col justify-between gap-space-md border border-border-warm/60">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex text-gold-accent">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-icon-16">star</span>
                    ))}
                  </div>
                  <span className="text-label-caps text-secondary">April 2025</span>
                </div>
                <p className="font-headline-sm text-headline-lg text-on-surface font-serif italic">
                  "Worth every second of the 2:30 AM wake up call. Truly ethereal."
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Driver Vikram was waiting outside our Aerocity hotel at 02:20 AM. The Innova Crysta was spotless. Seeing the Taj emerge out of the dawn fog with our guide Tariq explaining the architecture without another soul in our photo was unforgettable. Breakfast at Courtyard Marriott was top class.
                </p>
              </div>
              <div className="flex items-center gap-space-sm pt-space-xs">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoasPiitvHvyFvUqAWzXDFCGXiP1aBrZ67L-jI6N9FMA2qIsGmAiSYQRBc9QxBZGj9Mib7R50xaoEa7CFKAle8Vcz0IDnbOCNSIjXO_agmmAGIfbv9ZdK3PVX8sXB4T4cLVGUD-EIaTnIc44WioqxcR5eW_quOTdh8IEXPDcI3DxVmPvx2EQBKziB5J0L4AYsJaEAEym8zPM2NSv98fwU7GWmSIsOeiLlXCsCHKkI4Znu294QRWhAmZg"
                  alt="Claire & William H."
                  className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">Claire &amp; William H.</span>
                  <span className="text-body-sm text-secondary">London, United Kingdom</span>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col justify-between gap-space-md border border-border-warm/60">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex text-gold-accent">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-icon-16">star</span>
                    ))}
                  </div>
                  <span className="text-label-caps text-secondary">March 2025</span>
                </div>
                <p className="font-headline-sm text-headline-lg text-on-surface font-serif italic">
                  "Honest, prompt and completely free of tourist shopping tricks."
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Having been to India before, we were wary of driver commission stops. Agra SK Baghel Tour and Travels's agency stayed true to their promise: not a single pressured stop. Just pure history, magnificent views of Agra Fort, and smooth expressway cruising back to Gurgaon by 4 PM.
                </p>
              </div>
              <div className="flex items-center gap-space-sm pt-space-xs">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBd9RCW5uuhOXQGC0Vx4YUS6e8fr4A9xEpwT9B99QN8flc7YWRptTRoZhuSaSGZfYiDN-E1biwiXzII0SZVbslArKmXfT7dw6nHR38bRE-h9ENzfCJvdCRVVojK8lFSnNtu3FHLNiCTtVuOcf3riy7bUyPL2Xjdceu3TfRdtGkmPMPCV3O2SZLpOKAfAnUhu15mZsdXCzsoVT2zC9it_-DjHXGqXju_QBkbZkHtin3pjVmK0ogIyXT4mg"
                  alt="Rajesh & Smita Sharma"
                  className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">Rajesh &amp; Smita Sharma</span>
                  <span className="text-body-sm text-secondary">San Jose, California</span>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-surface-container-low p-space-lg rounded-xl shadow-sm flex flex-col justify-between gap-space-md border border-border-warm/60">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex text-gold-accent">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-icon-16">star</span>
                    ))}
                  </div>
                  <span className="text-label-caps text-secondary">February 2025</span>
                </div>
                <p className="font-headline-sm text-headline-lg text-on-surface font-serif italic">
                  "The 28% advance booking gave absolute peace of mind."
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Booking online while in Sydney was simple. We paid the 28% token lock, received WhatsApp chauffeur dispatch details immediately, and settled the rest easily on drop-off. The morning breakfast buffet alone was exceptional. Highly recommended!
                </p>
              </div>
              <div className="flex items-center gap-space-sm pt-space-xs">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPuUl77zgjEFRMI4neU9dYWnuwt7Ttiw0MY7msBIlxUHqTDUd2kxRSwx-4Ukr4fTOW6ZlmBO3WlTTNoh6b2u74YBJ7Nk6IaGr5gOJUF_tpJHUsOl4MrG-6fu8GS3rEplOE9TDImUCwvBSMqMeBlrtxPJ_fVTikjQxCZ7wCSwxUrfuetRoACOCCsW7miZhTSiZG1ZpVYcpDFIfnq6eIfGUCHMBKehblO7kWxKXTlEXlu6ra8nUpy2nU2w"
                  alt="Marcus & Delphine B."
                  className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">Marcus &amp; Delphine B.</span>
                  <span className="text-body-sm text-secondary">Sydney, Australia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALIST FAQ DRAWER ACCORDION */}
      <section className="w-full bg-surface-container-low py-space-2xl border-t border-border-warm/60">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin flex flex-col gap-space-xl">
          <div className="text-center flex flex-col gap-space-xs">
            <span className="text-label-caps text-terracotta-sandstone uppercase font-bold tracking-widest">
              Clear Inquiries
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Frequently Asked Questions</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Everything you need to know about the tour departure, entrance protocols, and luxury transit.
            </p>
          </div>
          <div className="flex flex-col gap-space-sm" id="faq-accordion">
            {TOUR_FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-surface rounded-xl p-space-md shadow-sm border border-border-warm/60 cursor-pointer transition-all"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className="flex items-center justify-between gap-space-sm">
                    <h3 className="font-title-md text-title-md text-on-surface font-medium">{faq.q}</h3>
                    <span
                      className={`material-symbols-outlined text-primary text-icon-20 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    >
                      expand_more
                    </span>
                  </div>
                  {isOpen && (
                    <div className="pt-space-sm text-body-md text-on-surface-variant leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CALL TO ACTION STRIP */}
      <section className="w-full bg-ink-charcoal text-ivory-surface py-space-xl px-margin-mobile lg:px-margin">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-1">
            <span className="text-label-caps text-gold-accent uppercase font-bold tracking-widest">
              Limited Daily Capacity
            </span>
            <h3 className="font-headline-md text-headline-md text-surface">
              Ready to experience {pkg.name}?
            </h3>
            <p className="text-body-sm text-secondary-fixed-dim">
              Book today with only ₹{advanceAmount.toLocaleString("en-IN")} advance token (28%). Free cancellation up to 24 hours prior.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <a
              className="px-5 py-3 rounded-lg bg-surface/10 hover:bg-surface/20 text-surface text-label-lg font-semibold flex items-center gap-2 transition-colors"
              href={`tel:${contact.phone}`}
            >
              <span className="material-symbols-outlined text-gold-accent text-icon-18">call</span>
              <span>Call Desk</span>
            </a>
            <a
              className="px-6 py-3 rounded-lg bg-terracotta-deep hover:bg-terracotta-sunlit text-white text-label-lg font-semibold shadow-md transition-all flex items-center gap-2"
              href={bookStep1Url}
            >
              <span>Book Now</span>
              <span className="material-symbols-outlined text-icon-18">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PackageDetailPage;
