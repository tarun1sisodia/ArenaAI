import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { packages, cancellationSlabsTour, type TourPackage } from "../data";

interface PackagesPageProps {
  language?: SupportedLanguage;
}

type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // multiplier from INR
  label: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", rate: 1, label: "INR (₹)" },
  USD: { code: "USD", symbol: "$", rate: 0.012, label: "USD ($)" },
  EUR: { code: "EUR", symbol: "€", rate: 0.011, label: "EUR (€)" },
  GBP: { code: "GBP", symbol: "£", rate: 0.0095, label: "GBP (£)" },
};

function formatPrice(amountInr: number, currency: CurrencyConfig): string {
  if (currency.code === "INR") {
    return `₹${amountInr.toLocaleString("en-IN")}`;
  }
  const converted = Math.round(amountInr * currency.rate);
  return `${currency.symbol}${converted.toLocaleString("en-US")}`;
}

// Stylized Vector Car SVG Icons matching MakeMyTrip aesthetics
function SedanIcon() {
  return (
    <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 16C4 16 6 9 12 8C16 7 24 7 29 8C33 9 37 13 39 16C41 18 42 19 42 20C42 21 41 21.5 39 21.5H5C3 21.5 2 20.5 2 19C2 17.5 4 16 4 16Z" fill="#2D3E50" opacity="0.85"/>
      <path d="M12 9L15 14H28L27 9H12Z" fill="#A4C2DC"/>
      <circle cx="10" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="33" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

function MpvIcon() {
  return (
    <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 16C3 16 5 7 11 6C16 5 28 5 32 6C36 7 39 12 40 16C41 18 42 19.5 42 20.5C42 21.5 41 22 39 22H5C3 22 2 21 2 19.5C2 18 3 16 3 16Z" fill="#1E2B37" opacity="0.88"/>
      <path d="M11 7L13 13H31L29 7H11Z" fill="#90B7D7"/>
      <circle cx="9" cy="20.5" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="34" cy="20.5" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

function SuvIcon() {
  return (
    <svg width="44" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 15C3 15 5 6 10 5.5C15 5 29 5 33 5.5C37 6 40 11 41 15C42 17 42.5 19 42.5 20C42.5 21.5 41.5 22 39 22H5C3 22 2 21 2 19.5C2 17.5 3 15 3 15Z" fill="#121416" opacity="0.9"/>
      <path d="M10 6.5L12 13H33L31 6.5H10Z" fill="#7FA9CE"/>
      <circle cx="9" cy="20" r="3.8" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="34" cy="20" r="3.8" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

function VanIcon() {
  return (
    <svg width="46" height="24" viewBox="0 0 46 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="5" width="41" height="15" rx="3" fill="#201E1D" opacity="0.88"/>
      <rect x="6" y="8" width="8" height="6" rx="1" fill="#A4C2DC"/>
      <rect x="17" y="8" width="10" height="6" rx="1" fill="#A4C2DC"/>
      <rect x="30" y="8" width="10" height="6" rx="1" fill="#A4C2DC"/>
      <circle cx="10" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="36" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

interface PackageFaq {
  q: { en: string; hi: string };
  a: { en: string; hi: string };
}

const PACKAGE_FAQS: PackageFaq[] = [
  {
    q: {
      en: "Are monument entry tickets included in the package price?",
      hi: "क्या पैकेज के किराए में स्मारकों के प्रवेश टिकट शामिल हैं?",
    },
    a: {
      en: "Monument entry tickets (e.g. Taj Mahal ₹50 Indian / ₹1,100 Foreigner) are not bundled into the base transportation packages to give travelers complete booking flexibility. However, your chauffeur and licensed guide will assist you with seamless, queue-free official ASI online ticket booking on the day of travel.",
      hi: "स्मारकों के प्रवेश टिकट (जैसे ताज महल ₹50 भारतीय / ₹1,100 विदेशी) आधार पैकेज में शामिल नहीं हैं ताकि यात्रियों को टिकट चयन की पूर्ण स्वतंत्रता रहे। आपके ड्राइवर और अधिकृत गाइड आपको यात्रा के दिन भारतीय पुरातत्व सर्वेक्षण (ASI) के आधिकारिक पोर्टल से बिना लाइन के ऑनलाइन टिकट खरीदने में पूर्ण सहायता करते हैं।",
    },
  },
  {
    q: {
      en: "What is the cancellation and refund policy for tour packages?",
      hi: "टूर पैकेजों के लिए रद्दीकरण और रिफंड की क्या नीति है?",
    },
    a: {
      en: "For private day cab tours, 100% full refund is provided if cancelled 24 hours prior to departure. For multi-day packages (such as Golden Triangle 3D/2N or Agra Overnight), we follow a tiered schedule: 100% refund for 15+ days notice, 80% for 7–14 days, 50% for 2–6 days, and 0% within 48 hours. All approved refunds are credited back to the original payment source within 5–7 business days.",
      hi: "प्राइवेट डे टूर के लिए 24 घंटे पहले रद्दीकरण पर 100% पूरा रिफंड मिलता है। मल्टी-डे पैकेजों (जैसे 3-दिवसीय गोल्डन ट्रायंगल या आगरा ओवरनाइट) के लिए: 15+ दिन पहले 100%, 7–14 दिन पहले 80%, 2–6 दिन पहले 50%, और 48 घंटे के भीतर 0% रिफंड देय होता है। सभी रिफंड 5–7 कार्यदिवसों में आपके खाते में आ जाते हैं।",
    },
  },
  {
    q: {
      en: "Can we customize or modify the tour itinerary stopovers?",
      hi: "क्या हम टूर के दर्शनीय स्थलों और समय सारणी में बदलाव कर सकते हैं?",
    },
    a: {
      en: "Yes, 100%! All our tour packages are 100% private and chauffeured. You have complete freedom to pace your day, stop for sunrise photography at Mehtab Bagh, explore local Agra petha confectioners, or add en route halts at Fatehpur Sikri or Vrindavan without any rigid bus schedules.",
      hi: "हाँ, शत-प्रतिशत! हमारे सभी टूर पैकेज पूरी तरह प्राइवेट होते हैं। आप अपनी सुविधा अनुसार समय बिता सकते हैं, मेहताब बाग में फोटोग्राफी के लिए रुक सकते हैं, आगरा के मशहूर पेठा बाज़ार जा सकते हैं, या फतेहपुर सीकरी व वृंदावन में इच्छानुसार स्टॉप ले सकते हैं।",
    },
  },
  {
    q: {
      en: "Are your tour guides officially licensed by the Ministry of Tourism?",
      hi: "क्या आपके टूर गाइड पर्यटन मंत्रालय द्वारा अधिकृत और प्रमाणित हैं?",
    },
    a: {
      en: "Yes. When you request a guided excursion, we connect you only with approved, badge-holding guides certified by the Ministry of Tourism, Government of India. They speak English, Hindi, Spanish, French, and German, and strictly avoid tourist souvenir commission traps.",
      hi: "हाँ। यदि आप गाइड सेवा चुनते हैं, तो हम केवल भारत सरकार के पर्यटन मंत्रालय द्वारा अधिकृत और बैज-धारक गाइड ही उपलब्ध कराते हैं। वे हिंदी, अंग्रेजी और विदेशी भाषाओं के जानकार हैं तथा किसी भी प्रकार की कमीशन दुकानों से दूर प्रामाणिक इतिहास बताते हैं।",
    },
  },
  {
    q: {
      en: "Where can our group be picked up for the tour?",
      hi: "टूर के लिए हमारी पिकअप कहाँ से की जा सकती है?",
    },
    a: {
      en: "We provide doorstep pickup across Delhi NCR (any hotel, residence, or IGI Airport Terminal 3) as well as any Agra hotel, Agra Cantt Railway Station (for Gatimaan Express / Shatabdi passengers), or Mathura junction.",
      hi: "हम दिल्ली एनसीआर के किसी भी होटल, निवास या आईजीआई एयरपोर्ट टर्मिनल 3 से, अथवा आगरा के किसी भी होटल, आगरा कैंट रेलवे स्टेशन (गतिमान एक्सप्रेस / शताब्दी यात्रियों हेतु) से सुविधाजनक डोरस्टेप पिकअप प्रदान करते हैं।",
    },
  },
  {
    q: {
      en: "Which vehicle is best suited for our family or traveling group?",
      hi: "हमारे परिवार या समूह के लिए कौन सी गाड़ी सबसे उपयुक्त रहेगी?",
    },
    a: {
      en: "For solo travelers or couples, our air-conditioned Dzire/Etios Sedan is ideal. For families with children (4–6 pax), the Maruti Ertiga or luxury Toyota Innova Crysta provides unmatched highway comfort and luggage room. For wedding groups and extended families (9–26 pax), our Force Tempo Travellers and Urbania luxury vans offer reclining seats and dedicated luggage bays.",
      hi: "दंपति या 2-3 यात्रियों के लिए एसी सेडान (डिजायर / इटिओस) उत्तम है। 4 से 6 सदस्यों वाले परिवारों के लिए मारुति अर्टिगा या टोयोटा इनोवा क्रिस्टा सर्वोत्तम आराम देती है। 9 से 26 सदस्यों के बड़े ग्रुप व परिवारों के लिए हमारे 12 से 26 सीटर टेम्पो ट्रैवलर व अर्बनिया लग्जरी वैन सर्वोत्तम हैं।",
    },
  },
];

export function PackagesPage({ language = "en" }: PackagesPageProps) {
  const isHindi = language === "hi";
  const activeLanguage = isHindi ? "hi" : "en";
  const langPrefix = isHindi ? "/hi" : "/en";

  // Category Filter State
  const [filter, setFilter] = useState<"all" | "same-day" | "multi-day" | "devotional">("all");

  // Currency Converter State
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("INR");
  const currency = CURRENCIES[selectedCurrency];

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (filter === "all") return true;
      if (filter === "same-day") return pkg.duration.includes("1 day");
      if (filter === "multi-day") return pkg.duration.includes("day") && !pkg.duration.includes("1 day");
      if (filter === "devotional") return pkg.id.includes("mathura") || pkg.id.includes("sunrise");
      return true;
    });
  }, [filter]);

  // Structured Data (Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TaxiService",
        "@id": "https://skbagheltravels.in/#service",
        name: "SK Baghel Tour & Travels Private Sightseeing Packages",
        serviceType: "Private Heritage & Outstation Tour Packages",
        provider: {
          "@type": "LocalBusiness",
          name: "SK Baghel Tour & Travels",
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
            name: isHindi ? "होम" : "Home",
            item: `https://skbagheltravels.in${langPrefix}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isHindi ? "टूर पैकेज" : "Tour Packages",
            item: `https://skbagheltravels.in${langPrefix}/packages/`,
          },
        ],
      },
      ...packages.map((pkg) => ({
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
      })),
      {
        "@type": "FAQPage",
        mainEntity: PACKAGE_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q[activeLanguage],
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a[activeLanguage],
          },
        })),
      },
    ],
  };

  return (
    <main id="main-content" className="packages-hub-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Header with Currency Selector */}
      <header className="packages-hub-hero">
        <div className="container">
          <div className="hero-top-bar">
            <p className="eyebrow">
              {isHindi
                ? "प्रामाणिक हेरिटेज व दर्शनीय यात्रा • एस के बघेल"
                : "HERITAGE & PRIVATE CIRCUITS • SK BAGHEL"}
            </p>

            {/* International Currency Switcher */}
            <div className="currency-selector" role="group" aria-label="Select Currency">
              <span className="currency-label">{isHindi ? "मुद्रा:" : "Currency:"}</span>
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  type="button"
                  key={code}
                  className={`currency-pill ${selectedCurrency === code ? "is-active" : ""}`}
                  onClick={() => setSelectedCurrency(code)}
                >
                  {CURRENCIES[code].label}
                </button>
              ))}
            </div>
          </div>

          <h1>
            {isHindi ? (
              <>
                आगरा एवं उत्तर भारत के प्रसिद्ध,
                <br />
                <i>निजी टूर पैकेज व सटीक यात्रा योजना।</i>
              </>
            ) : (
              <>
                Curated private tours & circuits,
                <br />
                <i>crafted for unforgettable memories.</i>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {isHindi
              ? "ताजमहल सूर्योदय दर्शन से लेकर 3-दिवसीय गोल्डन ट्रायंगल तक — समर्पित एसी वाहन, टोल व पार्किंग सहित पारदर्शी मूल्य, और अनुभवी स्थानीय ड्राइवरों के साथ आरामदेह सफर।"
              : "From dawn departures at the Taj Mahal to seamless Golden Triangle heritage circuits and sacred Mathura-Vrindavan pilgrimages — private AC chauffeur travel with all highway tolls, parking, and taxes included."}
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#package-catalogue">
              {isHindi ? "सभी पैकेज देखें ↓" : "Explore Tour Catalogue ↓"}
            </a>
            <a className="button button-outline" href={`tel:${contact.phone}`}>
              {isHindi ? `कॉल करें ${contact.phoneDisplay}` : `Call ${contact.phoneDisplay}`}
            </a>
            <a
              className="button button-outline"
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              {isHindi ? "व्हाट्सएप पूछताछ" : "WhatsApp Desk"}
            </a>
          </div>
        </div>
      </header>

      {/* Filterable Tour Package Catalogue */}
      <section
        id="package-catalogue"
        className="home-section packages-catalogue-section"
        aria-labelledby="packages-catalogue-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "टूर पैकेज सूची" : "Curated Tour Directory"}
              </p>
              <h2 id="packages-catalogue-heading">
                {isHindi ? (
                  <>
                    हर प्रकार के सफर के लिए,
                    <br />
                    <i>सुव्यवस्थित निजी टूर पैकेज।</i>
                  </>
                ) : (
                  <>
                    Tailored for every schedule,
                    <br />
                    <i>private chauffeured excursions.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="package-filter-tabs" role="tablist" aria-label="Tour Categories">
            <button
              type="button"
              className={`filter-tab-btn ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              {isHindi ? "सभी टूर (All Packages)" : "All Packages (6)"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "same-day" ? "is-active" : ""}`}
              onClick={() => setFilter("same-day")}
            >
              {isHindi ? "सैम डे दर्शन (1 Day)" : "Same-Day Tours (4)"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "multi-day" ? "is-active" : ""}`}
              onClick={() => setFilter("multi-day")}
            >
              {isHindi ? "मल्टी-डे सर्किट (2–3 Days)" : "Multi-Day Circuits (2)"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "devotional" ? "is-active" : ""}`}
              onClick={() => setFilter("devotional")}
            >
              {isHindi ? "धार्मिक व भोर दर्शन" : "Devotional & Sunrise"}
            </button>
          </div>

          {/* Tour Package Cards Grid */}
          <div className="packages-grid">
            {filteredPackages.map((pkg) => {
              const basePriceFormatted = formatPrice(pkg.from, currency);

              return (
                <article className="package-card" key={pkg.id} id={pkg.id}>
                  {/* Photo & Duration Badge */}
                  <div className="package-card-media">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      width="600"
                      height="380"
                      loading="lazy"
                    />
                    <div className="media-overlay-strip">
                      <span className="duration-pill">⏱️ {pkg.duration}</span>
                      <span className="kicker-pill">{pkg.kicker}</span>
                    </div>
                  </div>

                  <div className="package-card-body">
                    {/* Places Pills */}
                    <div className="package-places-row">
                      {pkg.places.map((place, idx) => (
                        <span className="place-tag" key={idx}>
                          📍 {place}
                        </span>
                      ))}
                    </div>

                    <h3 className="package-title">{pkg.name}</h3>
                    <p className="package-blurb">{pkg.blurb}</p>

                    {/* Inclusions & Exclusions Summary */}
                    <div className="inclusions-box">
                      <div className="inclusions-col">
                        <span className="box-label">
                          {isHindi ? "शामिल सुविधाएं (Included):" : "Key Inclusions:"}
                        </span>
                        <ul className="inclusions-list">
                          {pkg.includes.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              <span className="check-icon">✓</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="exclusions-col">
                        <span className="box-label">
                          {isHindi ? "शामिल नहीं (Excluded):" : "Exclusions:"}
                        </span>
                        <ul className="exclusions-list">
                          {pkg.excludes.map((item, idx) => (
                            <li key={idx}>
                              <span className="cross-icon">✕</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* MakeMyTrip-Style Vehicle Option Boxes */}
                    <div className="vehicle-boxes-section">
                      <p className="vehicle-boxes-label">
                        {isHindi
                          ? "उपलब्ध गाड़ियाँ व शुरुआती किराये (Select Vehicle):"
                          : "Available Cabs & Transparent Fares:"}
                      </p>

                      <div className="vehicle-boxes-grid">
                        {/* Sedan Box */}
                        <div className="car-selection-box">
                          <div className="car-box-left">
                            <SedanIcon />
                            <span className="fuel-pill fuel-cng">CNG/Petrol</span>
                          </div>
                          <div className="car-box-mid">
                            <strong className="car-name">Sedan (Dzire / Etios)</strong>
                            <span className="car-specs">AC · 4+1 Seats · 2 Bags</span>
                          </div>
                          <div className="car-box-right">
                            <span className="car-price">
                              {formatPrice(pkg.from, currency)}
                            </span>
                            <a
                              className="button button-outline button-xs"
                              href={`/book.html?package=${pkg.id}&vehicle=sedan`}
                            >
                              {isHindi ? "चुनें ↗" : "Select ↗"}
                            </a>
                          </div>
                        </div>

                        {/* Ertiga Box */}
                        <div className="car-selection-box">
                          <div className="car-box-left">
                            <MpvIcon />
                            <span className="fuel-pill fuel-diesel">Diesel/CNG</span>
                          </div>
                          <div className="car-box-mid">
                            <strong className="car-name">Maruti Ertiga (MPV)</strong>
                            <span className="car-specs">AC · 6+1 Seats · 3 Bags</span>
                          </div>
                          <div className="car-box-right">
                            <span className="car-price">
                              {formatPrice(Math.round(pkg.from * 1.25), currency)}
                            </span>
                            <a
                              className="button button-outline button-xs"
                              href={`/book.html?package=${pkg.id}&vehicle=ertiga`}
                            >
                              {isHindi ? "चुनें ↗" : "Select ↗"}
                            </a>
                          </div>
                        </div>

                        {/* Innova Crysta Box */}
                        <div className="car-selection-box is-recommended">
                          <div className="car-box-left">
                            <SuvIcon />
                            <span className="fuel-pill fuel-diesel">Diesel Luxury</span>
                          </div>
                          <div className="car-box-mid">
                            <strong className="car-name">Toyota Innova Crysta</strong>
                            <span className="car-specs">AC · 6+1 Seats · 4 Bags · High Comfort</span>
                          </div>
                          <div className="car-box-right">
                            <span className="car-price">
                              {formatPrice(Math.round(pkg.from * 1.5), currency)}
                            </span>
                            <a
                              className="button button-primary button-xs"
                              href={`/book.html?package=${pkg.id}&vehicle=innova`}
                            >
                              {isHindi ? "चुनें ↗" : "Select ↗"}
                            </a>
                          </div>
                        </div>

                        {/* Tempo Traveller Box */}
                        <div className="car-selection-box">
                          <div className="car-box-left">
                            <VanIcon />
                            <span className="fuel-pill fuel-diesel">Group Van</span>
                          </div>
                          <div className="car-box-mid">
                            <strong className="car-name">Tempo Traveller (12–26)</strong>
                            <span className="car-specs">AC · 12–26 Seats · Luggage Boot</span>
                          </div>
                          <div className="car-box-right">
                            <span className="car-price">
                              {formatPrice(Math.round(pkg.from * 2.1), currency)}
                            </span>
                            <a
                              className="button button-outline button-xs"
                              href={`/book.html?package=${pkg.id}&vehicle=tempo`}
                            >
                              {isHindi ? "चुनें ↗" : "Select ↗"}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="package-card-footer">
                      <div className="pricing-summary">
                        <span className="summary-label">
                          {isHindi ? "शुरुआती पैकेज किराया:" : "Starting Package Rate:"}
                        </span>
                        <strong className="summary-val">{basePriceFormatted}</strong>
                        <small className="summary-tax">
                          {isHindi ? "टोल व ड्राइवर शुल्क सहित" : "All Tolls & Chauffeur Included"}
                        </small>
                      </div>

                      <div className="footer-actions">
                        <a
                          className="button button-primary"
                          href={`/book.html?package=${pkg.id}`}
                        >
                          {isHindi ? "टूर बुक करें ↗" : "Book Tour ↗"}
                        </a>
                        <a
                          className="button button-outline"
                          href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                            `Hi SK Baghel Travels, I am inquiring about the ${pkg.name} (${pkg.duration}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {isHindi ? "व्हाट्सएप" : "WhatsApp"}
                        </a>
                        <a
                          className="button button-outline"
                          href={`${langPrefix}/packages/${pkg.slug}/`}
                        >
                          {isHindi ? "विस्तृत विवरण" : "Details"}
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tour Cancellation & Refund Transparency */}
      <section
        className="home-section cancellation-transparency-section"
        aria-labelledby="cancellation-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "रिफंड व रद्दीकरण नीति" : "Transparent Tour Refund Policy"}
              </p>
              <h2 id="cancellation-heading">
                {isHindi ? (
                  <>
                    शून्य अनिश्चितता,
                    <br />
                    <i>100% स्पष्ट 6-चरणीय रिफंड तालिका।</i>
                  </>
                ) : (
                  <>
                    Clear commercial cancellation terms,
                    <br />
                    <i>tiered multi-day tour refund schedule.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="cancellation-table-card">
            <table className="cancellation-table">
              <thead>
                <tr>
                  <th scope="col">{isHindi ? "रद्दीकरण की पूर्व सूचना" : "Notice Prior to Departure"}</th>
                  <th scope="col">{isHindi ? "रिफंड प्रतिशत" : "Refund Percentage"}</th>
                  <th scope="col">{isHindi ? "कटौती शुल्क" : "Deduction"}</th>
                  <th scope="col">{isHindi ? "रिफंड समय सीमा" : "Credited Timeline"}</th>
                </tr>
              </thead>
              <tbody>
                {cancellationSlabsTour.map((tier, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{tier.days}</strong>
                    </td>
                    <td>
                      <span className="refund-badge">{tier.refund} Refund</span>
                    </td>
                    <td>{tier.fee}</td>
                    <td>{isHindi ? "5–7 कार्यदिवस में" : "5–7 Business Days"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Packages FAQ Accordion */}
      <section
        className="home-section packages-faq-section"
        aria-labelledby="packages-faq-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "टूर पैकेज एफएक्यू" : "Tour FAQs"}
              </p>
              <h2 id="packages-faq-heading">
                {isHindi ? (
                  <>
                    टूर और यात्रा से जुड़े जरूरी सवाल,
                    <br />
                    <i>बुकिंग से पहले सीधे जवाब।</i>
                  </>
                ) : (
                  <>
                    Frequently asked tour questions,
                    <br />
                    <i>honest answers before you reserve.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="packages-faq-accordion">
            {PACKAGE_FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  className={`packages-faq-item ${isOpen ? "is-open" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="packages-faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`packages-faq-answer-${index}`}
                  >
                    <span>{item.q[activeLanguage]}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="packages-faq-answer"
                      id={`packages-faq-answer-${index}`}
                    >
                      <p>{item.a[activeLanguage]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom 24x7 Custom Tour Dispatch Desk */}
      <section className="container packages-cta-container">
        <div className="packages-cta-card">
          <div className="packages-cta-content">
            <span className="packages-cta-badge">24×7 BESPOKE TOUR DESK</span>
            <h2>
              {isHindi
                ? "क्या आपकी कोई विशेष यात्रा योजना या पारिवारिक समूह है?"
                : "Looking for a bespoke circuit or custom family tour?"}
            </h2>
            <p>
              {isHindi
                ? "ताजगंज, आगरा स्थित हमारे स्थानीय कार्यालय से सीधे बात करें। राजस्थान, मध्य प्रदेश और उत्तर भारत के निजी दौरों के लिए त्वरित कोटेशन और मनपसंद वाहन प्राप्त करें।"
                : "Speak directly with our local tour coordination desk in Taj Ganj, Agra. Tailored multi-day itineraries, vetted heritage guides, and transparent group quotes."}
            </p>
            <div className="packages-cta-buttons">
              <a className="button button-primary" href="/book.html">
                {isHindi ? "ऑनलाइन बुक करें ↗" : "Book Online ↗"}
              </a>
              <a
                className="button button-outline"
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                {isHindi ? "व्हाट्सएप संपर्क" : "WhatsApp Us"}
              </a>
              <a className="button button-outline" href={`tel:${contact.phone}`}>
                {contact.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
