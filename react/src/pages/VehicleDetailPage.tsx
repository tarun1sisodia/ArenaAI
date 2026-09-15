/**
 * VehicleDetailPage — Dynamic Fleet Vehicle Landing Template (Step R5.23)
 *
 * High-converting, SEO-optimized bilingual landing template for all 5 fleet tiers:
 * 1. Sedan (Dzire / Etios class)
 * 2. Ertiga (6+1 MPV)
 * 3. Innova Crysta (6+1 Premium SUV)
 * 4. Tempo Traveller (9–26 Seater Tourist Van)
 * 5. Force Urbania (Luxury Executive Van)
 *
 * Features:
 * - Semantic Breadcrumbs & Category Pill Tags
 * - 2-Column Hero Showcase with high-res photo, floating spec badges, rate card & direct booking CTA
 * - 4-Card Technical Specifications & Cabin Comfort Bento Grid
 * - Available Models Lineup Showcase with specs
 * - Comprehensive Multi-Service Pricing Breakdown:
 *   * Outstation Round-Trip (₹/km with 300 km/day rule)
 *   * Agra Local Sightseeing (8h/80km & Full Day)
 *   * Fixed One-Way Outstation Drops (Delhi, Jaipur, Mathura, Gwalior, Lucknow, Ayodhya)
 *   * Airport & Railway Transfers (Agra Cantt, Agra Airport, Delhi IGI)
 *   * Operating Policy Notes (Night allowance past 8PM, parking, Tempo round-trip mandate)
 * - Recommended Travel Scenarios ("Best For") Bento Grid
 * - Vehicle-Specific 6-Item Bilingual FAQ Accordion (ARIA 1.2 accessible)
 * - 24×7 Local Fleet Dispatch CTA Banner
 * - Schema.org JSON-LD graph (TaxiService, Product/Car, BreadcrumbList, FAQPage, LocalBusiness)
 */

import React, { useState, useMemo } from "react";
import { contact } from "../data/contact";
import { Icon } from "../components/ui/Icon";
import { type Vehicle, vehicles, routes } from "../data/catalogue";

interface VehicleDetailPageProps {
  language: "en" | "hi";
  vehicle: Vehicle;
}

// Fixed route prices by vehicle tier (aligned with CLIENT_CONFIRMATION_FARES_AND_RULES.md)
const ONE_WAY_FARES_BY_VEHICLE: Record<string, Array<{ routeId: string; routeEn: string; routeHi: string; highway: string; km: number; fare: number }>> = {
  sedan: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", routeHi: "आगरा ⇄ दिल्ली (या IGI एयरपोर्ट)", highway: "Yamuna Expressway", km: 210, fare: 4999 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", routeHi: "आगरा ⇄ जयपुर", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 4500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", routeHi: "आगरा ⇄ मथुरा / वृन्दावन", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 2500 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", routeHi: "आगरा ⇄ ग्वालियर", highway: "NH-44 (North–South)", km: 120, fare: 3999 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", routeHi: "आगरा ⇄ लखनऊ", highway: "Agra–Lucknow Expressway", km: 335, fare: 7500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", routeHi: "दिल्ली ⇄ जयपुर", highway: "NH-48 / NE-4", km: 280, fare: 5999 },
  ],
  ertiga: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", routeHi: "आगरा ⇄ दिल्ली (या IGI एयरपोर्ट)", highway: "Yamuna Expressway", km: 210, fare: 5999 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", routeHi: "आगरा ⇄ जयपुर", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 6800 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", routeHi: "आगरा ⇄ मथुरा / वृन्दावन", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 3000 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", routeHi: "आगरा ⇄ ग्वालियर", highway: "NH-44 (North–South)", km: 120, fare: 4500 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", routeHi: "आगरा ⇄ लखनऊ", highway: "Agra–Lucknow Expressway", km: 335, fare: 8500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", routeHi: "दिल्ली ⇄ जयपुर", highway: "NH-48 / NE-4", km: 280, fare: 6999 },
  ],
  innova: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", routeHi: "आगरा ⇄ दिल्ली (या IGI एयरपोर्ट)", highway: "Yamuna Expressway", km: 210, fare: 7500 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", routeHi: "आगरा ⇄ जयपुर", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 8500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", routeHi: "आगरा ⇄ मथुरा / वृन्दावन", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 4000 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", routeHi: "आगरा ⇄ ग्वालियर", highway: "NH-44 (North–South)", km: 120, fare: 6899 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", routeHi: "आगरा ⇄ लखनऊ", highway: "Agra–Lucknow Expressway", km: 335, fare: 9500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", routeHi: "दिल्ली ⇄ जयपुर", highway: "NH-48 / NE-4", km: 280, fare: 8499 },
  ],
  tempo: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", routeHi: "आगरा ⇄ दिल्ली (या IGI एयरपोर्ट)", highway: "Yamuna Expressway", km: 210, fare: 8500 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", routeHi: "आगरा ⇄ जयपुर", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 8500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", routeHi: "आगरा ⇄ मथुरा / वृन्दावन", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 5200 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", routeHi: "आगरा ⇄ ग्वालियर", highway: "NH-44 (North–South)", km: 120, fare: 7200 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", routeHi: "आगरा ⇄ लखनऊ", highway: "Agra–Lucknow Expressway", km: 335, fare: 12800 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", routeHi: "दिल्ली ⇄ जयपुर", highway: "NH-48 / NE-4", km: 280, fare: 10500 },
  ],
  urbania: [
    { routeId: "agra-delhi", routeEn: "Agra ⇄ Delhi (or IGI Airport)", routeHi: "आगरा ⇄ दिल्ली (या IGI एयरपोर्ट)", highway: "Yamuna Expressway", km: 210, fare: 11500 },
    { routeId: "agra-jaipur", routeEn: "Agra ⇄ Jaipur (Pink City)", routeHi: "आगरा ⇄ जयपुर", highway: "NH-21 (Agra–Bikaner)", km: 240, fare: 11500 },
    { routeId: "agra-mathura", routeEn: "Agra ⇄ Mathura / Vrindavan", routeHi: "आगरा ⇄ मथुरा / वृन्दावन", highway: "NH-19 (Delhi–Agra)", km: 58, fare: 7200 },
    { routeId: "agra-gwalior", routeEn: "Agra ⇄ Gwalior", routeHi: "आगरा ⇄ ग्वालियर", highway: "NH-44 (North–South)", km: 120, fare: 9800 },
    { routeId: "agra-lucknow", routeEn: "Agra ⇄ Lucknow", routeHi: "आगरा ⇄ लखनऊ", highway: "Agra–Lucknow Expressway", km: 335, fare: 16500 },
    { routeId: "delhi-jaipur", routeEn: "Delhi ⇄ Jaipur (Intercity)", routeHi: "दिल्ली ⇄ जयपुर", highway: "NH-48 / NE-4", km: 280, fare: 14200 },
  ],
};

// Local Sightseeing & Transfer rates by vehicle (Section 2.1 & 2.2)
const LOCAL_RATES: Record<string, { standard8h: number; fullDay: number; agraCantt: number; agraAirport: number; delAirport: number }> = {
  sedan: { standard8h: 2200, fullDay: 3000, agraCantt: 1200, agraAirport: 900, delAirport: 4999 },
  ertiga: { standard8h: 2900, fullDay: 4000, agraCantt: 1500, agraAirport: 1050, delAirport: 5999 },
  innova: { standard8h: 4150, fullDay: 5499, agraCantt: 2000, agraAirport: 1250, delAirport: 7500 },
  tempo: { standard8h: 7500, fullDay: 8500, agraCantt: 3500, agraAirport: 2400, delAirport: 8500 },
  urbania: { standard8h: 9500, fullDay: 11500, agraCantt: 4500, agraAirport: 3800, delAirport: 11500 },
};

export function VehicleDetailPage({ language, vehicle }: VehicleDetailPageProps) {
  const isHi = language === "hi";
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const vehicleSlug = vehicle.id === "innova" ? "innova-crysta" : vehicle.id === "tempo" ? "tempo-traveller" : vehicle.id;
  const rates = LOCAL_RATES[vehicle.id] || LOCAL_RATES.sedan;
  const oneWayRoutes = ONE_WAY_FARES_BY_VEHICLE[vehicle.id] || ONE_WAY_FARES_BY_VEHICLE.sedan;
  const isCommercialVan = vehicle.id === "tempo" || vehicle.id === "urbania";

  // Vehicle-specific FAQ items
  const faqItems = useMemo(() => [
    {
      q: {
        en: `Can the air conditioning run continuously during sightseeing in the ${vehicle.name}?`,
        hi: `क्या ${vehicle.name} में दर्शनीय स्थलों पर रुकने के दौरान एसी लगातार चालू रह सकता है?`
      },
      a: {
        en: `Yes. All our ${vehicle.name} cabs come equipped with high-efficiency air conditioning with dual or individual roof vents. AC remains operational throughout your journey, monument transitions, and parking halts.`,
        hi: `हाँ, हमारी सभी ${vehicle.name} गाड़ियों में शक्तिशाली एसी उपलब्ध है। यात्रा के दौरान, स्मारकों के आवागमन और ठहराव के समय भी वातानुकूलन निर्बाध रूप से चालू रहता है।`
      }
    },
    {
      q: {
        en: `How much luggage can comfortably fit in the ${vehicle.name}?`,
        hi: `${vehicle.name} में कितने बैग और सूटकेस आसानी से रखे जा सकते हैं?`
      },
      a: {
        en: `The ${vehicle.name} accommodates up to ${vehicle.bags} large hard-case suitcases plus personal soft backpacks. For large groups traveling in Tempos or Urbanias, a dedicated overhead luggage bay or rear carrier is provided.`,
        hi: `${vehicle.name} में लगभग ${vehicle.bags} बड़े सूटकेस और हैंडबैग आसानी से रखे जा सकते हैं। टेम्पो व अर्बनिया में बड़ा लगेज कम्पार्टमेंट और कैरियर उपलब्ध रहता है।`
      }
    },
    {
      q: {
        en: `Are highway tolls, parking fees, and state border taxes included in the fare?`,
        hi: `क्या किराये में टोल टैक्स, पार्किंग शुल्क और राज्य सीमा कर शामिल हैं?`
      },
      a: {
        en: `For all pre-fixed One-Way expressway drops, highway tolls, state commercial entry taxes, and driver allowances are 100% all-inclusive. For local sightseeing and custom multi-day outstation round trips, monument parking slips and interstate taxes are billed at actuals.`,
        hi: `निर्धारित वन-वे एक्सप्रेसवे बुकिंग में हाईवे टोल, बॉर्डर टैक्स और ड्राइवर भत्ता 100% शामिल रहता है। स्थानीय दर्शनीय स्थल व राउंड ट्रिप में पार्किंग पर्चियां वास्तविक मूल्य पर देय होती हैं।`
      }
    },
    {
      q: {
        en: `What is the night driving allowance policy for the ${vehicle.name}?`,
        hi: `${vehicle.name} के लिए रात्रि चालक भत्ता (Night Allowance) नियम क्या है?`
      },
      a: {
        en: `For duty running past 8:00 PM (20:00) or departures before 6:00 AM, a standard driver night allowance applies: ₹300 for cars (Sedan, Ertiga, Innova Crysta) and ₹500 for commercial tourist vans (Tempo Traveller, Force Urbania).`,
        hi: `रात 8:00 बजे (20:00) के बाद या सुबह 6:00 बजे से पहले सेवा पर मानक चालक रात्रि भत्ता लागू होता है: कारों के लिए ₹300 तथा टेम्पो ट्रैवलर व अर्बनिया के लिए ₹500।`
      }
    },
    {
      q: {
        en: isCommercialVan
          ? `Why are one-way Tempo Traveller and Urbania bookings billed on a round-trip basis?`
          : `Can I book the ${vehicle.name} for same-day return or outstation multi-day trips?`,
        hi: isCommercialVan
          ? `टेम्पो ट्रैवलर और अर्बनिया वन-वे यात्रा के लिए दोनों तरफ (आने-जाने) का किराया क्यों लेते हैं?`
          : `क्या मैं ${vehicle.name} को उसी दिन वापसी या बहु-दिवसीय यात्रा के लिए बुक कर सकता हूँ?`
      },
      a: {
        en: isCommercialVan
          ? `Commercial passenger vehicles (9–26 seats) cannot obtain return loads on one-way drop routes in the open market. Therefore, all outstation tempo bookings mandate round-trip return coverage or follow the standard 300 km/day minimum billing.`
          : `Yes. You can book for same-day return (which benefits from our discounted 1.85× one-way multiplier) or multi-day outstation tours with standard 300 km/day minimum billing.`,
        hi: isCommercialVan
          ? `व्यावसायिक पर्यटक वाहनों (9-26 सीट) को वन-वे ड्राप पर वापसी यात्री नहीं मिलते। अतः सभी आउटस्टेशन टेम्पो बुकिंग आने-जाने के कुल किराये या 300 किमी/दिन के न्यूनतम आधार पर मान्य होती हैं।`
          : `हाँ, आप उसी दिन वापसी (1.85× रियायती गुणक) अथवा बहु-दिवसीय आउटस्टेशन यात्रा (300 किमी/दिन न्यूनतम) के लिए आसानी से बुक कर सकते हैं।`
      }
    },
    {
      q: {
        en: `What is the cancellation and refund policy if my schedule changes?`,
        hi: `यदि मेरा यात्रा कार्यक्रम बदल जाता है तो रद्दीकरण (Cancellation) नीति क्या है?`
      },
      a: {
        en: `We offer 100% free cancellation for cab and vehicle bookings up to 24 hours prior to scheduled pickup time with full refund credited within 5–7 business days. No questions asked.`,
        hi: `यात्रा के निर्धारित समय से 24 घंटे पहले तक कैब बुकिंग रद्द करने पर 100% पूर्ण रिफंड 5–7 कार्यदिवसों में वापस मिल जाता है। कोई कटौती नहीं की जाती।`
      }
    }
  ], [vehicle.name, vehicle.bags, isCommercialVan]);

  // Schema.org Structured Data Graph
  const schemaGraph = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `https://skbagheltravels.in/#vehicle-${vehicle.id}`,
        "name": `${vehicle.name} Taxi Hire in Agra`,
        "description": vehicle.blurb,
        "image": `https://skbagheltravels.in${vehicle.image}`,
        "category": "Car Rental",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": vehicle.perKm,
          "priceValidUntil": "2027-12-31",
          "availability": "https://schema.org/InStock",
          "unitText": "per kilometer",
          "url": `https://skbagheltravels.in/en/vehicles/${vehicleSlug}/`
        }
      },
      {
        "@type": "TaxiService",
        "@id": `https://skbagheltravels.in/#service-${vehicle.id}`,
        "name": `${vehicle.name} Chauffeur Drive Service`,
        "provider": {
          "@type": "LocalBusiness",
          "name": "SK Baghel Tour & Travels",
          "telephone": contact.phone,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Near Taj East Gate Road, Taj Ganj",
            "addressLocality": "Agra",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "282001",
            "addressCountry": "IN"
          }
        },
        "areaServed": ["Agra", "Delhi", "Jaipur", "Mathura", "Gwalior", "Lucknow"]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": isHi ? "होम" : "Home", "item": isHi ? "https://skbagheltravels.in/hi/" : "https://skbagheltravels.in/" },
          { "@type": "ListItem", "position": 2, "name": isHi ? "गाड़ियां" : "Fleet", "item": isHi ? "https://skbagheltravels.in/hi/fleet/" : "https://skbagheltravels.in/en/fleet/" },
          { "@type": "ListItem", "position": 3, "name": vehicle.name, "item": `https://skbagheltravels.in/${language}/vehicles/${vehicleSlug}/` }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqItems.map(item => ({
          "@type": "Question",
          "name": isHi ? item.q.hi : item.q.en,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": isHi ? item.a.hi : item.a.en
          }
        }))
      }
    ]
  }), [vehicle, vehicleSlug, language, isHi, faqItems]);

  const bookingUrl = `/book.html?vehicle=${vehicle.id}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    isHi
      ? `नमस्ते, मैं आगरा से ${vehicle.name} बुकिंग व किराये के बारे में जानकारी चाहता हूँ।`
      : `Hello, I would like to inquire about booking the ${vehicle.name} from Agra.`
  )}`;

  return (
    <div className="vehicle-detail-page">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Top Breadcrumbs Bar */}
      <nav className="detail-topbar" aria-label="Breadcrumb">
        <div className="container topbar-inner">
          <ol className="breadcrumb-trail">
            <li><a href={isHi ? "/hi/" : "/"}>{isHi ? "होम" : "Home"}</a></li>
            <li className="sep">/</li>
            <li><a href={isHi ? "/hi/fleet/" : "/en/fleet/"}>{isHi ? "गाड़ियां" : "Fleet"}</a></li>
            <li className="sep">/</li>
            <li className="current" aria-current="page">{vehicle.name}</li>
          </ol>
          <div className="topbar-tags">
            <span className="spec-tag">{vehicle.seats} {isHi ? "सीटें" : "Seats"}</span>
            <span className="spec-tag">{vehicle.bags} {isHi ? "बैग" : "Bags"}</span>
            <span className="spec-tag">AC</span>
            <span className="spec-tag rate-tag">₹{vehicle.perKm}/km</span>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* 1. Vehicle Hero Section */}
        <section className="veh-hero-section">
          <div className="container">
            <div className="veh-hero-grid">
              {/* Left Column: Vehicle Identity, Blurb & Pricing Box */}
              <div className="veh-hero-info">
                <div className="veh-kicker-strip">
                  <span className="veh-kicker-badge">
                    {isHi ? "प्रीमियम फ्लीट" : "PREMIER FLEET"} • {vehicle.klass.toUpperCase()}
                  </span>
                  <span className="veh-rating-badge">★ 4.9 (500+ {isHi ? "समीक्षाएं" : "Trips"})</span>
                </div>

                <h1 className="veh-title">
                  {isHi ? `${vehicle.name} किराया व बुकिंग आगरा` : `${vehicle.name} Hire in Agra`}
                </h1>
                <p className="veh-subtitle">
                  {isHi
                    ? "वातानुकूलित, आधुनिक और आरामदायक व्यावसायिक कैब — स्थानीय व आउटस्टेशन यात्रा के लिए।"
                    : "Air-conditioned, certified commercial vehicle for local sightseeing, outstation expressways, and transfers."}
                </p>

                <p className="veh-blurb">{vehicle.blurb}</p>

                {/* Comfort Feature Badges */}
                <div className="veh-highlights-strip">
                  <div className="veh-h-item">
                    <span className="check-icon">✓</span>
                    <span>{vehicle.seats} {isHi ? "आरामदायक सीटें" : "Pushback Seats"}</span>
                  </div>
                  <div className="veh-h-item">
                    <span className="check-icon">✓</span>
                    <span>{vehicle.bags} {isHi ? "बड़े बैग बूट स्पेस" : "Bags Luggage Bay"}</span>
                  </div>
                  <div className="veh-h-item">
                    <span className="check-icon">✓</span>
                    <span>{isHi ? "शक्तिशाली वातानुकूलन (AC)" : "High-Output AC Vents"}</span>
                  </div>
                  <div className="veh-h-item">
                    <span className="check-icon">✓</span>
                    <span>{isHi ? "सत्यापित अनुभवी ड्राइवर" : "Police-Verified Chauffeur"}</span>
                  </div>
                </div>

                {/* Pricing Showcase Box */}
                <div className="veh-pricing-box">
                  <div className="pricing-headline">
                    <span className="pricing-caption">{isHi ? "आउटस्टेशन शुरुआती दर" : "Starting Outstation Rate"}</span>
                    <div className="pricing-amount">
                      <span className="currency-symbol">₹</span>
                      <span className="amount-num">{vehicle.perKm}</span>
                      <span className="unit-label">/ km</span>
                    </div>
                    <span className="pricing-subtext">
                      {isHi ? `दर सीमा: ${vehicle.rateRange} • पारदर्शी दरें` : `Rate range: ${vehicle.rateRange} • Zero hidden meter`}
                    </span>
                  </div>

                  <div className="pricing-actions">
                    <a href={bookingUrl} className="button button--primary button--gold">
                      {isHi ? `यह ${vehicle.name} बुक करें ↗` : `Book This ${vehicle.name} ↗`}
                    </a>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button--outline">
                      {isHi ? "व्हाट्सएप पूछताछ" : "WhatsApp Enquiry"}
                    </a>
                    <a href={`tel:${contact.phone}`} className="button button--ghost">
                      📞 {contact.phoneDisplay}
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Res Photo Card & Trust Signals */}
              <div className="veh-hero-media">
                <div className="veh-image-card">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.name} luxury fleet`}
                    className="veh-main-image"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="veh-image-overlay">
                    <span className="veh-overlay-pill">
                      👥 {vehicle.seats} {isHi ? "यात्री" : "Passengers"} • 🧳 {vehicle.bags} {isHi ? "बैग" : "Bags"}
                    </span>
                  </div>
                </div>

                <div className="veh-media-trust">
                  <div className="trust-micro-item">
                    <strong>100% Commercial</strong>
                    <span>{isHi ? "कानूनी पीली नंबर प्लेट" : "Verified Yellow Plate"}</span>
                  </div>
                  <div className="trust-micro-item">
                    <strong>GPS Tracked</strong>
                    <span>{isHi ? "24×7 फ्लीट मॉनिटरिंग" : "Live Route Tracking"}</span>
                  </div>
                  <div className="trust-micro-item">
                    <strong>45-Min SLA</strong>
                    <span>{isHi ? "एक्सप्रेसवे वाहन रिप्लेसमेंट" : "Highway Replacement"}</span>
                  </div>
                  <div className="trust-micro-item">
                    <strong>Zero Commission</strong>
                    <span>{isHi ? "दुकान/गाइड कमीशन मुक्त" : "Honest Direct Travel"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Technical Specifications & Cabin Amenities Bento Grid */}
        <section className="veh-specs-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">{isHi ? "तकनीकी विवरण" : "SPECIFICATIONS & COMFORT"}</span>
              <h2 className="section-title">{isHi ? "केबिन सुविधाएं व सुरक्षा मानक" : "Engineered for Highway Comfort & Safety"}</h2>
              <p className="section-blurb">
                {isHi
                  ? "लंबी यात्राओं और पारिवारिक पर्यटन के लिए विशेष रूप से सज्जित एवं अनुपालित गाड़ियां।"
                  : "Every vehicle is inspected before dispatch to guarantee pristine cleanliness, mechanical reliability, and passenger safety."}
              </p>
            </div>

            <div className="specs-bento-grid">
              <div className="spec-card">
                <div className="spec-icon-wrap"><Icon name="users" size={22} /></div>
                <h3 className="spec-card-title">{isHi ? "सीटिंग व केबिन स्पेस" : "Seating & Ergonomics"}</h3>
                <p className="spec-card-desc">
                  {isHi
                    ? `${vehicle.seats} यात्रियों के लिए आरामदायक पुशबैक सीटें, पर्याप्त लेगरूम और हेडरेस्ट।`
                    : `Comfortable pushback seats contoured for spinal support, generous legroom, and effortless ingress.`}
                </p>
                <div className="spec-pill-row">
                  <span className="spec-detail-pill">{vehicle.seats} {isHi ? "सीटें" : "Seats"}</span>
                  <span className="spec-detail-pill">{vehicle.klass}</span>
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-icon-wrap"><Icon name="luggage" size={22} /></div>
                <h3 className="spec-card-title">{isHi ? "लगेज व बूट क्षमता" : "Luggage & Storage"}</h3>
                <p className="spec-card-desc">
                  {isHi
                    ? `${vehicle.bags} बड़े सूटकेस आसानी से बूट में व्यवस्थित हो जाते हैं। बड़े समूहों के लिए कैरियर सुविधा।`
                    : `Dedicated secure trunk space accommodating ${vehicle.bags} full-size suitcases plus cabin rucksacks.`}
                </p>
                <div className="spec-pill-row">
                  <span className="spec-detail-pill">{vehicle.bags} {isHi ? "बड़े बैग" : "Large Bags"}</span>
                  <span className="spec-detail-pill">{isHi ? "सुरक्षित बूट" : "Clean Boot"}</span>
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-icon-wrap"><Icon name="snowflake" size={22} /></div>
                <h3 className="spec-card-title">{isHi ? "क्लाइमेट कंट्रोल व एसी" : "Climate Control & AC"}</h3>
                <p className="spec-card-desc">
                  {isHi
                    ? "सभी सीटों तक पहुंचने वाले शक्तिशाली एसी वेंट, हीट रिफ्लेक्टिंग ग्लास व स्वच्छ एयर फिल्टर।"
                    : "High-capacity air conditioning delivering rapid cooling even in peak 45°C summer heat."}
                </p>
                <div className="spec-pill-row">
                  <span className="spec-detail-pill">{isHi ? "पूर्ण वातानुकूलित" : "Dual / Roof AC"}</span>
                  <span className="spec-detail-pill">{isHi ? "धूल-मुक्त केबिन" : "Sealed Cabin"}</span>
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-icon-wrap"><Icon name="shield-check" size={22} /></div>
                <h3 className="spec-card-title">{isHi ? "सुरक्षा व सरकारी परमिट" : "Safety & Permitted Fleet"}</h3>
                <p className="spec-card-desc">
                  {isHi
                    ? "ड्यूल एयरबैग, एबीएस, स्पीड गवर्नर, ऑल-इंडिया कमर्शियल परमिट व पुलिस सत्यापित चालक।"
                    : "ABS brakes, speed-governed cruising, all-India commercial tourist permits, and emergency toolkits."}
                </p>
                <div className="spec-pill-row">
                  <span className="spec-detail-pill">{isHi ? "पीली नंबर प्लेट" : "Commercial Yellow Plate"}</span>
                  <span className="spec-detail-pill">{isHi ? "स्पीड गवर्नर" : "80 km/h Governed"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Available Models in this Category */}
        <section className="veh-models-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">{isHi ? "उपलब्ध मॉडल" : "FLEET MODELS"}</span>
              <h2 className="section-title">{isHi ? `${vehicle.name} श्रेणी में प्रमुख गाड़ियां` : `Models Available in ${vehicle.name} Category`}</h2>
              <p className="section-blurb">
                {isHi
                  ? "आवश्यकता व उपलब्धता के अनुसार हम आपको शीर्ष ब्रांड्स के आधुनिक मॉडल उपलब्ध कराते हैं।"
                  : "We assign well-maintained, latest-generation models from leading automakers."}
              </p>
            </div>

            <div className="models-chips-grid">
              {vehicle.models.map((modelName, index) => (
                <div key={index} className="model-chip-card">
                  <div className="model-chip-badge">0{index + 1}</div>
                  <div className="model-chip-info">
                    <h3 className="model-chip-name">{modelName}</h3>
                    <span className="model-chip-tag">{isHi ? "व्यावसायिक अनुपालित" : "Commercial Tourist Permit"}</span>
                  </div>
                  <div className="model-chip-arrow">↗</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Transparent Multi-Service Pricing Table for this Vehicle */}
        <section className="veh-pricing-table-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">{isHi ? "पारदर्शी किराया दरें" : "TRANSPARENT TARIFF"}</span>
              <h2 className="section-title">{isHi ? `${vehicle.name} किराया चार्ट व पैकेज` : `${vehicle.name} Complete Rate Card`}</h2>
              <p className="section-blurb">
                {isHi
                  ? "कोई छिपा हुआ शुल्क नहीं। स्थानीय दर्शनीय स्थल, वन-वे एक्सप्रेसवे ड्राप और एयरपोर्ट ट्रांसफर की प्रमाणित दरें।"
                  : "Transparent, upfront rates verified directly by our Agra travel desk."}
              </p>
            </div>

            <div className="rate-tables-wrapper">
              {/* Table A: Local Sightseeing & Transfers */}
              <div className="rate-table-card">
                <div className="table-card-header">
                  <h3 className="table-card-title">🏙️ {isHi ? "आगरा स्थानीय दर्शनीय स्थल व ट्रांसफर" : "Agra Local Sightseeing & City Transfers"}</h3>
                  <span className="table-card-badge">{isHi ? "निर्धारित पैकेज" : "Fixed Tariff"}</span>
                </div>
                <div className="table-responsive">
                  <table className="veh-table">
                    <thead>
                      <tr>
                        <th>{isHi ? "सेवा / पैकेज का नाम" : "Service / Package Name"}</th>
                        <th>{isHi ? "अवधि व दूरी" : "Duration & Distance"}</th>
                        <th>{isHi ? "कुल किराया" : "All-Inclusive Fare"}</th>
                        <th>{isHi ? "कार्रवाई" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>{isHi ? "आगरा मानक दर्शनीय स्थल (Half Day)" : "Agra Standard Sightseeing"}</strong></td>
                        <td>8 Hours / 80 KM</td>
                        <td className="price-td">₹{rates.standard8h.toLocaleString("en-IN")}</td>
                        <td><a href={`${bookingUrl}&trip=local&pkg=8h80km`} className="table-book-link">{isHi ? "बुक ↗" : "Book ↗"}</a></td>
                      </tr>
                      <tr>
                        <td><strong>{isHi ? "आगरा फुल डे दर्शनीय स्थल (Full Day)" : "Agra Full Day Sightseeing"}</strong></td>
                        <td>Full Day (12h / 120 km)</td>
                        <td className="price-td">₹{rates.fullDay.toLocaleString("en-IN")}</td>
                        <td><a href={`${bookingUrl}&trip=local&pkg=12h120km`} className="table-book-link">{isHi ? "बुक ↗" : "Book ↗"}</a></td>
                      </tr>
                      <tr>
                        <td><strong>{isHi ? "आगरा कैंट रेलवे स्टेशन (AGC) ट्रांसफर" : "Agra Cantt Railway Station (AGC) Transfer"}</strong></td>
                        <td>~15–20 km</td>
                        <td className="price-td">₹{rates.agraCantt.toLocaleString("en-IN")}</td>
                        <td><a href={`${bookingUrl}&trip=transfer&to=agra-cantt`} className="table-book-link">{isHi ? "बुक ↗" : "Book ↗"}</a></td>
                      </tr>
                      <tr>
                        <td><strong>{isHi ? "आगरा एयरपोर्ट (Kheria AGR) ट्रांसफर" : "Agra Airport (AGR) Transfer"}</strong></td>
                        <td>~15–25 km</td>
                        <td className="price-td">₹{rates.agraAirport.toLocaleString("en-IN")}</td>
                        <td><a href={`${bookingUrl}&trip=transfer&to=agra-airport`} className="table-book-link">{isHi ? "बुक ↗" : "Book ↗"}</a></td>
                      </tr>
                      <tr>
                        <td><strong>{isHi ? "दिल्ली IGI एयरपोर्ट (DEL) एक्सप्रेसवे ट्रांसफर" : "Delhi IGI Airport (DEL) Direct Express Transfer"}</strong></td>
                        <td>225 km (Yamuna Exp)</td>
                        <td className="price-td">₹{rates.delAirport.toLocaleString("en-IN")}</td>
                        <td><a href={`${bookingUrl}&trip=oneway&from=agra&to=delhi-airport`} className="table-book-link">{isHi ? "बुक ↗" : "Book ↗"}</a></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table B: Fixed One-Way Outstation Drops */}
              <div className="rate-table-card">
                <div className="table-card-header">
                  <h3 className="table-card-title">🛣️ {isHi ? "प्रमुख वन-वे एक्सप्रेसवे कॉरिडोर दरें" : "Key Intercity One-Way Expressway Drops"}</h3>
                  <span className="table-card-badge">{isHi ? "टोल सहित" : "Tolls Included"}</span>
                </div>
                <div className="table-responsive">
                  <table className="veh-table">
                    <thead>
                      <tr>
                        <th>{isHi ? "रूट कॉरिडोर" : "Corridor Route"}</th>
                        <th>{isHi ? "हाईवे" : "Highway"}</th>
                        <th>{isHi ? "दूरी" : "Distance"}</th>
                        <th>{isHi ? "किराया" : "One-Way Fare"}</th>
                        <th>{isHi ? "कार्रवाई" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oneWayRoutes.map((r, idx) => (
                        <tr key={idx}>
                          <td><strong>{isHi ? r.routeHi : r.routeEn}</strong></td>
                          <td><span className="highway-pill">{r.highway}</span></td>
                          <td>{r.km} km</td>
                          <td className="price-td">₹{r.fare.toLocaleString("en-IN")}</td>
                          <td><a href={`${bookingUrl}&trip=oneway&route=${r.routeId}`} className="table-book-link">{isHi ? "बुक ↗" : "Book ↗"}</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Operating Rules Callout */}
            <div className="veh-rules-callout">
              <div className="rules-icon">ℹ️</div>
              <div className="rules-text">
                <h4 className="rules-heading">{isHi ? "महत्वपूर्ण परिचालन व किराया नियम" : "Important Commercial & Operational Rules"}</h4>
                <ul className="rules-list">
                  <li>
                    <strong>{isHi ? "आउटस्टेशन 300 किमी/दिन नियम:" : "Outstation 300 KM/Day Rule:"}</strong>{" "}
                    {isHi
                      ? `राउंड ट्रिप आउटस्टेशन यात्राओं पर न्यूनतम औसत 300 किमी प्रति दिन का बिलिंग आधार लागू होता है (@ ₹${vehicle.perKm}/किमी)।`
                      : `Multi-day outstation bookings follow the standard 300 KM/day minimum billing benchmark (@ ₹${vehicle.perKm}/km).`}
                  </li>
                  <li>
                    <strong>{isHi ? "रात्रि चालक भत्ता (Night Allowance):" : "Driver Night Allowance (Past 8:00 PM):"}</strong>{" "}
                    {isHi
                      ? `रात 8:00 बजे (20:00) के बाद या सुबह 6:00 बजे से पहले सेवा पर ${isCommercialVan ? "₹500" : "₹300"} का अतिरिक्त रात्रि शुल्क लागू होता है।`
                      : `For duty running past 8:00 PM or starting before 6:00 AM, a flat driver night charge of ${isCommercialVan ? "₹500" : "₹300"} applies.`}
                  </li>
                  {isCommercialVan && (
                    <li className="highlight-rule">
                      <strong>{isHi ? "टेम्पो व अर्बनिया आने-जाने का किराया नियम:" : "Tempo Traveller & Urbania Two-Way Return Rule:"}</strong>{" "}
                      {isHi
                        ? "बाजार में व्यावसायिक टेम्पो वन-वे नहीं मिलते। अतः सभी आउटस्टेशन टेम्पो बुकिंग आने-जाने के कुल किराये (Round-Trip) अथवा 300 किमी/दिन के आधार पर देय होती हैं। ऊपर दी गई वन-वे दरें वापसी वाहन आवागमन को ध्यान में रखकर निर्धारित की गई हैं।"
                        : "In the open tourist transport market, commercial 12–26 seaters do not get return passenger loads. All outstation tempo bookings mandate round-trip coverage. The one-way rates listed above are pre-factored to cover return empty-run mobilization."}
                    </li>
                  )}
                  <li>
                    <strong>{isHi ? "पार्किंग शुल्क:" : "Parking Charges:"}</strong>{" "}
                    {isHi
                      ? "स्मारकों, रेलवे स्टेशनों व दर्शनीय स्थलों पर पार्किंग पर्चियां वास्तविक मूल्य पर सीधे ग्राहक द्वारा देय होती हैं।"
                      : "Parking charges at monuments, railway stations, and airports are billed at actuals."}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Recommended Travel Scenarios Bento */}
        <section className="veh-scenarios-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">{isHi ? "सर्वोत्तम उपयोग" : "RECOMMENDED USE-CASES"}</span>
              <h2 className="section-title">{isHi ? `${vehicle.name} किन यात्राओं के लिए उत्तम है?` : `When Should You Choose the ${vehicle.name}?`}</h2>
              <p className="section-blurb">
                {vehicle.suitable}
              </p>
            </div>

            <div className="scenarios-grid">
              <div className="scenario-card">
                <span className="sc-icon">🏛️</span>
                <h3 className="sc-title">{isHi ? "आगरा दर्शनीय स्थल व ताजमहल" : "Agra Sightseeing & Taj Mahal"}</h3>
                <p className="sc-desc">
                  {isHi
                    ? "ताजमहल, आगरा किला और फतेहपुर सीकरी के लिए दिनभर के वातानुकूलित सफर का सर्वोत्तम विकल्प।"
                    : "Hassle-free point-to-point drop at monument gates with chilled AC during waiting periods."}
                </p>
              </div>

              <div className="scenario-card">
                <span className="sc-icon">✈️</span>
                <h3 className="sc-title">{isHi ? "दिल्ली व जयपुर एक्सप्रेसवे ड्राप" : "Expressway Airport Transfers"}</h3>
                <p className="sc-desc">
                  {isHi
                    ? "यमुना एक्सप्रेसवे से दिल्ली IGI एयरपोर्ट या जयपुर के लिए समयबद्ध और सुरक्षित आवागमन।"
                    : "Punctual, non-stop transit along Yamuna Expressway and NH-48 with generous luggage space."}
                </p>
              </div>

              <div className="scenario-card">
                <span className="sc-icon">🛕</span>
                <h3 className="sc-title">{isHi ? "मथुरा-वृन्दावन व धार्मिक यात्राएं" : "Mathura-Vrindavan Circuits"}</h3>
                <p className="sc-desc">
                  {isHi
                    ? "बांके बिहारी मंदिर, प्रेम मंदिर और गोवर्धन परिक्रमा के लिए परिवार के साथ आरामदायक भ्रमण।"
                    : "Smooth spiritual day trips for elders and families with respectful, courteous local chauffeurs."}
                </p>
              </div>

              <div className="scenario-card">
                <span className="sc-icon">💼</span>
                <h3 className="sc-title">{isHi ? "कॉर्पोरेट व वीआईपी टूरिज्म" : "Corporate & Golden Triangle"}</h3>
                <p className="sc-desc">
                  {isHi
                    ? "दिल्ली-आगरा-जयपुर गोल्डन ट्रायंगल परिपथ के लिए भरोसेमंद और प्रतिष्ठित वाहन सेवा।"
                    : "Pristine executive vehicle condition suitable for foreign delegates, business executives, and luxury circuits."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Vehicle-Specific Bilingual FAQ Accordion */}
        <section className="veh-faqs-section">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">{isHi ? "अक्सर पूछे जाने वाले प्रश्न" : "FAQS"}</span>
              <h2 className="section-title">{isHi ? `${vehicle.name} से जुड़े मुख्य सवाल` : `Frequently Asked Questions About ${vehicle.name}`}</h2>
              <p className="section-blurb">
                {isHi
                  ? "बुकिंग से पहले यात्रियों द्वारा सबसे अधिक पूछे जाने वाले प्रश्नों के स्पष्ट व सीधे उत्तर।"
                  : "Clear, transparent answers to help you book with absolute confidence."}
              </p>
            </div>

            <div className="faqs-accordion-list">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`faq-accordion-item ${isOpen ? "is-open" : ""}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-q-text">{isHi ? item.q.hi : item.q.en}</span>
                      <span className="faq-chevron-icon">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-body">
                        <p>{isHi ? item.a.hi : item.a.en}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Bottom 24x7 Local Dispatch CTA Banner */}
        <section className="veh-cta-section">
          <div className="container">
            <div className="veh-cta-banner">
              <div className="cta-left">
                <span className="cta-eyebrow">{isHi ? "24×7 स्थानीय सहायता डेस्क" : "24×7 DIRECT FLEET DISPATCH"}</span>
                <h2 className="cta-title">{isHi ? `आगरा से ${vehicle.name} तुरंत बुक करें` : `Ready to Reserve Your ${vehicle.name}?`}</h2>
                <p className="cta-desc">
                  {isHi
                    ? "ऑनलाइन बुकिंग करें या हमारे स्थानीय आगरा डेस्क से सीधे कॉल व व्हाट्सएप पर बात करें। कोई मध्यस्थ नहीं, शून्य कमीशन।"
                    : "Reserve online with zero prepayment anxiety or connect directly with our Agra travel desk for customized itineraries."}
                </p>
              </div>

              <div className="cta-actions">
                <a href={bookingUrl} className="button button--primary button--gold">
                  {isHi ? "ऑनलाइन अभी बुक करें ↗" : "Book Online Now ↗"}
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button--outline">
                  {isHi ? "व्हाट्सएप चैट" : "Chat on WhatsApp"}
                </a>
                <a href={`tel:${contact.phone}`} className="button button--ghost">
                  📞 {contact.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
