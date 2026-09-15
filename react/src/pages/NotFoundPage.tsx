/**
 * NotFoundPage — 404 Error Recovery Page (Step R5.20)
 *
 * High-converting, user-friendly bilingual error recovery experience featuring:
 * 1. Animated Architectural Compass Emblem (rotating needle & cardinal ring)
 * 2. Prominent 404 Error Badge & Reassuring Guidance Copy (EN/HI)
 * 3. Interactive Quick Recovery Search with instant matching across routes, tours & fleet
 * 4. Quick-Jump Destination Tag Pills (Delhi, Jaipur, Taj Sunrise, Innova, Mathura, Airport)
 * 5. 4-Way Navigation Bento Grid (Home, Routes, Packages, Fleet)
 * 6. 24×7 Emergency Dispatch Support Strip (Call, WhatsApp, Online Booking)
 * 7. Schema.org JSON-LD graph (WebPage, BreadcrumbList, LocalBusiness)
 */

import React, { useState, useMemo } from "react";
import { contact } from "../data/contact";
import { routes, packages, vehicles } from "../data/catalogue";
import { Icon } from "../components/ui/Icon";

interface NotFoundPageProps {
  language: "en" | "hi";
}

interface SearchItem {
  id: string;
  title: string;
  titleHi: string;
  category: "route" | "package" | "vehicle";
  url: string;
}

export function NotFoundPage({ language }: NotFoundPageProps) {
  const isHi = language === "hi";
  const [searchQuery, setSearchQuery] = useState("");

  // Searchable catalog database
  const searchItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];

    // Outstation Routes
    routes.forEach((r) => {
      const fromEn = r.from.charAt(0).toUpperCase() + r.from.slice(1);
      const toEn = r.to.charAt(0).toUpperCase() + r.to.slice(1);
      const fromHi = r.from === "delhi" ? "दिल्ली" : r.from === "jaipur" ? "जयपुर" : "आगरा";
      const toHi = r.to === "delhi" ? "दिल्ली" : r.to === "jaipur" ? "जयपुर" : r.to === "mathura" ? "मथुरा" : r.to === "gwalior" ? "ग्वालियर" : "आगरा";

      items.push({
        id: `route-${r.id}`,
        title: `${fromEn} to ${toEn} Taxi (${r.duration})`,
        titleHi: `${fromHi} से ${toHi} टैक्सी (${r.duration})`,
        category: "route",
        url: `/${language}/${r.from}-to-${r.to}-taxi/`
      });
    });

    // Tour Packages
    packages.forEach((p) => {
      items.push({
        id: `package-${p.id}`,
        title: `${p.name} (${p.duration})`,
        titleHi: `${p.name} (${p.duration})`,
        category: "package",
        url: `/${language}/packages/${p.slug}/`
      });
    });

    // Vehicles
    vehicles.forEach((v) => {
      const vSlug = v.id === "innova" ? "innova-crysta" : v.id === "tempo" ? "tempo-traveller" : v.id;
      items.push({
        id: `vehicle-${v.id}`,
        title: `${v.name} Hire (${v.seats} Seats, ₹${v.perKm}/km)`,
        titleHi: `${v.name} किराया (${v.seats} सीटें, ₹${v.perKm}/किमी)`,
        category: "vehicle",
        url: `/${language}/vehicles/${vSlug}/`
      });
    });

    return items;
  }, [language]);

  // Live filter based on query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.titleHi.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, searchItems]);

  // Quick suggestion pills
  const quickPills = [
    { labelEn: "Delhi to Agra Taxi", labelHi: "दिल्ली से आगरा टैक्सी", url: `/${language}/delhi-to-agra-taxi/` },
    { labelEn: "Taj Mahal Sunrise Tour", labelHi: "ताज महल सूर्योदय टूर", url: `/${language}/packages/taj-mahal-sunrise-tour/` },
    { labelEn: "Innova Crysta Hire", labelHi: "इनोवा क्रिस्टा किराया", url: `/${language}/vehicles/innova-crysta/` },
    { labelEn: "Agra to Jaipur Taxi", labelHi: "आगरा से जयपुर टैक्सी", url: `/${language}/agra-to-jaipur-taxi/` },
    { labelEn: "Mathura Vrindavan", labelHi: "मथुरा-वृंदावन दर्शन", url: `/${language}/packages/mathura-vrindavan/` },
    { labelEn: "All Fleet Rates", labelHi: "सभी गाड़ियों की दरें", url: `/${language}/fleet/` }
  ];

  // Schema.org JSON-LD
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `https://skbagheltravels.in/${language}/404/#webpage`,
        "url": `https://skbagheltravels.in/${language}/404/`,
        "name": isHi
          ? "404 पृष्ठ नहीं मिला — एस के बघेल टूर एंड ट्रेवल्स आगरा"
          : "404 Page Not Found — SK Baghel Tour & Travels Agra",
        "description": isHi
          ? "अनजान रास्ता — आइए आपकी यात्रा को सही दिशा दें। आगरा टैक्सी, आउटस्टेशन कैब व टूर पैकेज तुरंत खोजें।"
          : "Uncharted route — let us guide you back. Search verified Agra cabs, outstation routes and private tour packages.",
        "inLanguage": isHi ? "hi-IN" : "en-IN"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://skbagheltravels.in/${language}/404/#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": isHi ? "होम" : "Home",
            "item": `https://skbagheltravels.in/${language}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "404 Not Found",
            "item": `https://skbagheltravels.in/${language}/404/`
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://skbagheltravels.in/#localbusiness",
        "name": "SK Baghel Tour & Travels",
        "telephone": contact.phone,
        "email": contact.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Near Taj East Gate Road, Taj Ganj",
          "addressLocality": "Agra",
          "addressRegion": "Uttar Pradesh",
          "postalCode": "282001",
          "addressCountry": "IN"
        }
      }
    ]
  };

  return (
    <main id="main-content" className="not-found-page">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      <section className="not-found-hero">
        <div className="container">
          {/* Breadcrumbs */}
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <a href={`/${language}/`}>{isHi ? "होम" : "Home"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item breadcrumb-item--active" aria-current="page">
                404 Not Found
              </li>
            </ol>
          </nav>

          <div className="not-found-hero__content">
            {/* Animated Compass Graphic */}
            <div className="not-found-compass" aria-hidden="true">
              <div className="compass-outer-ring">
                <span className="compass-cardinal compass-cardinal--n">N</span>
                <span className="compass-cardinal compass-cardinal--e">E</span>
                <span className="compass-cardinal compass-cardinal--s">S</span>
                <span className="compass-cardinal compass-cardinal--w">W</span>
                <div className="compass-tick compass-tick--1" />
                <div className="compass-tick compass-tick--2" />
                <div className="compass-tick compass-tick--3" />
                <div className="compass-tick compass-tick--4" />
              </div>
              <div className="compass-needle-wrapper">
                <svg className="compass-needle-svg" viewBox="0 0 40 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0L26 50L20 44L14 50L20 0Z" fill="url(#needle-gold)" />
                  <path d="M20 100L14 50L20 56L26 50L20 100Z" fill="#1A1D20" opacity="0.65" />
                  <circle cx="20" cy="50" r="5" fill="#D9943B" stroke="#FAF7F0" strokeWidth="2" />
                  <defs>
                    <linearGradient id="needle-gold" x1="14" y1="0" x2="26" y2="50" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F5B942" />
                      <stop offset="1" stopColor="#D9943B" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Error Code & Reassurance */}
            <div className="not-found-code-badge">
              <span className="not-found-numeral">404</span>
              <span className="not-found-kicker">
                {isHi ? "अनजान रास्ता • पृष्ठ नहीं मिला" : "UNCHARTED ROUTE • PAGE NOT FOUND"}
              </span>
            </div>

            <h1 className="not-found-title">
              {isHi ? (
                <>
                  लगता है आप एक<br />
                  <i>अनजान मोड़ पर आ गए हैं।</i>
                </>
              ) : (
                <>
                  Looks Like You've Taken<br />
                  <i>An Uncharted Turn.</i>
                </>
              )}
            </h1>

            <p className="not-found-lead">
              {isHi
                ? "आप जिस पृष्ठ की तलाश कर रहे हैं, उसका पता बदल गया है या वह उपलब्ध नहीं है। कोई बात नहीं — हमारी 24×7 आगरा ट्रेवल टीम आपको सही मार्ग पर लाने के लिए तैयार है।"
                : "The page or destination you are looking for might have been moved, renamed, or temporarily unavailable. Let us navigate you safely back to your Agra journey."}
            </p>

            {/* Interactive Search Box */}
            <div className="not-found-search-container">
              <div className="not-found-search-box">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="not-found-search-input"
                  placeholder={
                    isHi
                      ? "रूट, टूर पैकेज या गाड़ी का नाम खोजें (उदा. दिल्ली, इनोवा)..."
                      : "Search routes, tour packages or fleet (e.g., Delhi, Innova)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={isHi ? "वेबसाइट खोजें" : "Search website content"}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label={isHi ? "खोज साफ करें" : "Clear search"}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Instant Search Results Dropdown */}
              {searchQuery && (
                <div className="not-found-search-results" role="region" aria-live="polite">
                  {searchResults.length > 0 ? (
                    <ul className="search-results-list">
                      {searchResults.map((item) => (
                        <li key={item.id} className="search-results-item">
                          <a href={item.url} className="search-results-link">
                            <span className="result-category-badge">{item.category}</span>
                            <span className="result-title">
                              {isHi ? item.titleHi : item.title}
                            </span>
                            <span className="result-arrow" aria-hidden="true">→</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="search-no-results">
                      {isHi
                        ? `"${searchQuery}" के लिए कोई परिणाम नहीं मिला। कृपया नीचे दिए गए लोकप्रिय लिंक्स देखें।`
                        : `No direct matches for "${searchQuery}". Explore popular paths below.`}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Jump Suggestions Pills */}
              <div className="not-found-quick-pills">
                <span className="quick-pills-label">
                  {isHi ? "त्वरित सुझाव:" : "Quick Suggestions:"}
                </span>
                <div className="quick-pills-wrap">
                  {quickPills.map((pill, idx) => (
                    <a key={idx} href={pill.url} className="quick-pill">
                      {isHi ? pill.labelHi : pill.labelEn}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Way Navigation Bento Grid */}
      <section className="not-found-bento-section">
        <div className="container">
          <div className="section-header-compact">
            <span className="section-kicker">
              {isHi ? "पुनः नेविगेट करें" : "WAYFINDING DIRECTORY"}
            </span>
            <h2 className="section-title">
              {isHi ? "अपनी यात्रा को फिर से शुरू करें" : "Chart Your Course Back"}
            </h2>
          </div>

          <div className="not-found-bento-grid">
            {/* Card 1: Homepage */}
            <a href={`/${language}/`} className="not-found-bento-card">
              <div className="bento-card-header">
                <span className="bento-icon" aria-hidden="true"><Icon name="compass" size={22} /></span>
                <span className="bento-badge">{isHi ? "मुख्य पृष्ठ" : "Home"}</span>
              </div>
              <h3>{isHi ? "आगरा कैब व टैक्सी बुकिंग" : "Agra Cab & Taxi Booking"}</h3>
              <p>
                {isHi
                  ? "लाइव किराया कैलकुलेटर, वन-वे व राउंड-ट्रिप दरें और सीधे बुकिंग पोर्टल पर जाएं।"
                  : "Instant fare calculator, outstation quotes, and verified local chauffeur reservations."}
              </p>
              <div className="bento-action-link">
                <span>{isHi ? "होमपेज पर जाएं" : "Return to Home"}</span>
                <span aria-hidden="true">→</span>
              </div>
            </a>

            {/* Card 2: Outstation Routes */}
            <a href={`/${language}/routes/`} className="not-found-bento-card">
              <div className="bento-card-header">
                <span className="bento-icon" aria-hidden="true"><Icon name="route" size={22} /></span>
                <span className="bento-badge">{isHi ? "रूट्स" : "Routes"}</span>
              </div>
              <h3>{isHi ? "आउटस्टेशन टैक्सी रूट्स" : "Outstation Taxi Routes"}</h3>
              <p>
                {isHi
                  ? "आगरा से दिल्ली, जयपुर, मथुरा, ग्वालियर व लखनऊ के लिए टोल सहित पारदर्शी किराया सूची।"
                  : "Explore 8+ outstation highway routes with transparent distance matrices & toll advice."}
              </p>
              <div className="bento-action-link">
                <span>{isHi ? "सभी रूट्स देखें" : "View Outstation Routes"}</span>
                <span aria-hidden="true">→</span>
              </div>
            </a>

            {/* Card 3: Tour Packages */}
            <a href={`/${language}/packages/`} className="not-found-bento-card">
              <div className="bento-card-header">
                <span className="bento-icon" aria-hidden="true">🏛️</span>
                <span className="bento-badge">{isHi ? "टूर पैकेज" : "Packages"}</span>
              </div>
              <h3>{isHi ? "निजी टूर व दर्शनीय यात्रा" : "Private Heritage Tours"}</h3>
              <p>
                {isHi
                  ? "ताज महल सूर्योदय, मथुरा-वृंदावन दर्शन और गोल्डन ट्रायंगल सर्किट के सुनियोजित पैकेज।"
                  : "Curated Taj Mahal sunrise tours, temple circuits, and Golden Triangle private itineraries."}
              </p>
              <div className="bento-action-link">
                <span>{isHi ? "टूर पैकेज देखें" : "Explore Tour Circuits"}</span>
                <span aria-hidden="true">→</span>
              </div>
            </a>

            {/* Card 4: Fleet Directory */}
            <a href={`/${language}/fleet/`} className="not-found-bento-card">
              <div className="bento-card-header">
                <span className="bento-icon" aria-hidden="true"><Icon name="car" size={22} /></span>
                <span className="bento-badge">{isHi ? "फ्लीट" : "Fleet"}</span>
              </div>
              <h3>{isHi ? "सत्यापित वाहन व प्रति किमी दरें" : "Commercial Fleet Directory"}</h3>
              <p>
                {isHi
                  ? "सेडान, अर्टिगा, इनोवा क्रिस्टा, टेम्पो ट्रैवलर व अर्बनिया के यात्री व सामान विनिर्देश।"
                  : "Sedan, Ertiga, Innova Crysta, Tempo Traveller & Urbania specs with per-km rates."}
              </p>
              <div className="bento-action-link">
                <span>{isHi ? "फ्लीट विवरण देखें" : "Browse Fleet Lineup"}</span>
                <span aria-hidden="true">→</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Immediate Emergency Assistance CTA Strip */}
      <section className="not-found-cta-strip">
        <div className="container">
          <div className="cta-banner-box">
            <div className="cta-banner-content">
              <span className="cta-banner-tag">
                {isHi ? "24×7 कंट्रोल रूम सहायता" : "24×7 Local Dispatch Support"}
              </span>
              <h2 className="cta-banner-title">
                {isHi
                  ? "क्या आपको तुरंत कैब की आवश्यकता है?"
                  : "Need Immediate Travel Assistance in Agra?"}
              </h2>
              <p className="cta-banner-desc">
                {isHi
                  ? "यदि आप किसी लिंक को लेकर भ्रमित हैं या तुरंत कैब बुक करना चाहते हैं, तो हमारे 24×7 ताजगंज कंट्रोल रूम से सीधे संपर्क करें।"
                  : "If you can't find what you need or have an urgent train/flight connection, our Taj Ganj dispatch desk is ready around the clock."}
              </p>
            </div>

            <div className="cta-banner-buttons">
              <a href={`tel:${contact.phone}`} className="button button-gold">
                <span>{isHi ? "कॉल करें: " + contact.phoneDisplay : "Call " + contact.phoneDisplay}</span>
                <span aria-hidden="true"><Icon name="phone" size={16} /></span>
              </a>

              <a
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                  isHi
                    ? "नमस्ते SK Baghel Travels! मुझे कैब बुकिंग में सहायता चाहिए।"
                    : "Hello SK Baghel Travels, I got lost on your website. Please assist me with cab booking."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline"
              >
                <span>{isHi ? "व्हाट्सएप डेस्क" : "WhatsApp Desk"}</span>
                <span aria-hidden="true"><Icon name="whatsapp" size={16} /></span>
              </a>

              <a href="/book.html" className="button button-secondary">
                <span>{isHi ? "कैब बुक करें" : "Book Cab Now"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
