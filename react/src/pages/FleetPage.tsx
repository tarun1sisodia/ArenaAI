import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { vehicles, airportTransfers } from "../data";

interface FleetPageProps {
  language?: SupportedLanguage;
}

interface FleetFaq {
  q: { en: string; hi: string };
  a: { en: string; hi: string };
}

const FLEET_FAQS: FleetFaq[] = [
  {
    q: {
      en: "What is the difference between Ertiga and Innova Crysta for outstation travel?",
      hi: "आउटस्टेशन यात्रा के लिए मारुति अर्टिगा और इनोवा क्रिस्टा में क्या अंतर है?",
    },
    a: {
      en: "While both seat 6 passengers, the Toyota Innova Crysta features a heavier ladder-frame chassis, superior highway suspension, wider captain-seat comfort, and dedicated luggage space behind the 3rd row. The Maruti Ertiga is lighter and more economical, ideal for budget-conscious families with light luggage.",
      hi: "हालाँकि दोनों में 6 यात्री बैठ सकते हैं, लेकिन टोयोटा इनोवा क्रिस्टा में भारी चेसिस, बेहतर हाईवे सस्पेंशन, कैप्टन-सीट आराम और तीसरी पंक्ति के पीछे अधिक सामान की जगह मिलती है। मारुति अर्टिगा हल्की, किफायती और हल्के सामान वाले परिवारों के लिए सबसे बेहतर बजट विकल्प है।",
    },
  },
  {
    q: {
      en: "How does the per-km billing work for outstation trips?",
      hi: "आउटस्टेशन यात्रा के लिए प्रति किलोमीटर किराया कैसे गिना जाता है?",
    },
    a: {
      en: "Outstation round-trips are billed based on the garage-to-garage distance with an industry-standard minimum threshold of 300 km per calendar day. For example, a 2-day round trip covers a minimum billable 600 km. Expressway toll taxes, state border permits, and parking are billed transparently at actuals.",
      hi: "आउटस्टेशन राउंड-ट्रिप में गैराज-से-गैराज दूरी के आधार पर न्यूनतम 300 किमी प्रतिदिन का मानक नियम लागू होता है। उदाहरण के लिए, 2 दिन की यात्रा में न्यूनतम 600 किमी देय होता है। हाईवे टोल, स्टेट बॉर्डर टैक्स और पार्किंग रसीद के अनुसार अलग से देय होते हैं।",
    },
  },
  {
    q: {
      en: "Are luggage carriers or roof racks available for extra bags?",
      hi: "क्या अतिरिक्त सामान के लिए गाड़ियों पर रूफ कैरियर उपलब्ध हैं?",
    },
    a: {
      en: "Yes. Our Force Tempo Travellers come equipped with heavy-duty roof luggage carriers with weatherproof tarpaulin covers, in addition to their rear luggage bays. For Ertiga and Innova Crysta, covered roof carriers can be mounted on advance request for airport groups carrying large suitcases.",
      hi: "हाँ। हमारे फ़ोर्स टेम्पो ट्रैवलर में पीछे बूट स्पेस के अलावा वाटरप्रूफ कवर वाले मजबूत रूफ कैरियर लगे होते हैं। अर्टिगा और इनोवा क्रिस्टा में भी एयरपोर्ट यात्रियों के बड़े सूटकेस के लिए पूर्व सूचना पर कैरियर की व्यवस्था की जाती है।",
    },
  },
  {
    q: {
      en: "Do all vehicles have full air-conditioning during peak summer and hill travel?",
      hi: "क्या भीषण गर्मी और पहाड़ी यात्रा के दौरान भी एसी पूरी तरह काम करता है?",
    },
    a: {
      en: "100% yes. Every cab and van in our fleet is fitted with powerful factory-installed dual air conditioning systems. AC is kept continuously running during highway travel and city sightseeing without any compromise on passenger comfort.",
      hi: "शत-प्रतिशत हाँ। हमारी फ्लीट की प्रत्येक गाड़ी में फैक्ट्री-फिटेड पावरफुल डुअल एसी सिस्टम है। हाईवे और शहर भ्रमण के दौरान यात्रियों के पूर्ण आराम के लिए एसी निरंतर चालू रखा जाता है।",
    },
  },
  {
    q: {
      en: "Can we inspect or select a specific vehicle model or color before departure?",
      hi: "क्या हम प्रस्थान से पहले गाड़ी का विशेष मॉडल या फोटो देख सकते हैं?",
    },
    a: {
      en: "Yes. Upon confirmation with our travel desk, we gladly share high-resolution photos, registration number, and chauffeur credentials on WhatsApp so you know exactly which car is arriving at your doorstep.",
      hi: "हाँ। बुकिंग कन्फर्म होने पर हमारी टीम आपको व्हाट्सएप पर गाड़ी के वास्तविक फोटो, गाड़ी नंबर और ड्राइवर का विवरण प्रेषित करती है ताकि आपको पहले से पूरी जानकारी रहे।",
    },
  },
  {
    q: {
      en: "What happens if a vehicle encounters an unexpected breakdown en route?",
      hi: "यदि रास्ते में गाड़ी में कोई अचानक खराबी आ जाए तो क्या व्यवस्था है?",
    },
    a: {
      en: "We operate a 24×7 commercial dispatch control room across Agra and Delhi NCR corridors. In the rare event of a mechanical failure or tire puncture, our roadside rescue protocol dispatches an equivalent or upgraded replacement vehicle within 30–45 minutes at zero extra cost to the passenger.",
      hi: "हमारा 24×7 कंट्रोल रूम आगरा और दिल्ली एनसीआर में सक्रिय रहता है। किसी तकनीकी खराबी की स्थिति में हमारा रेस्क्यू नेटवर्क 30 से 45 मिनट के भीतर उसी श्रेणी या उससे बेहतर वैकल्पिक गाड़ी बिना किसी अतिरिक्त शुल्क के उपलब्ध कराता है।",
    },
  },
];

export function FleetPage({ language = "en" }: FleetPageProps) {
  const isHindi = language === "hi";
  const activeLanguage = isHindi ? "hi" : "en";
  const langPrefix = isHindi ? "/hi" : "/en";

  // Category filter state
  const [filter, setFilter] = useState<"all" | "sedan" | "suv" | "van">("all");

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((veh) => {
      if (filter === "all") return true;
      if (filter === "sedan") return veh.id === "sedan";
      if (filter === "suv") return veh.id === "ertiga" || veh.id === "innova";
      if (filter === "van") return veh.id === "tempo" || veh.id === "urbania";
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
        name: "SK Baghel Tour & Travels Commercial Cab & Van Fleet",
        serviceType: "Chauffeur-Driven Car Rental & Fleet Transporter",
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
            name: isHindi ? "हमारी गाड़ियाँ" : "Our Fleet",
            item: `https://skbagheltravels.in${langPrefix}/fleet/`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Available Vehicles & Rates",
        numberOfItems: vehicles.length,
        itemListElement: vehicles.map((veh, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Product",
            name: `${veh.name} (${veh.klass})`,
            description: veh.blurb,
            offers: {
              "@type": "Offer",
              price: veh.perKm,
              priceCurrency: "INR",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: veh.perKm,
                priceCurrency: "INR",
                unitText: "per KM",
              },
            },
          },
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: FLEET_FAQS.map((faq) => ({
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
    <main id="main-content" className="fleet-hub-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section */}
      <header className="fleet-hub-hero">
        <div className="container">
          <p className="eyebrow">
            {isHindi
              ? "अनुमोदित एसी फ्लीट व कमर्शियल वाहन • एस के बघेल"
              : "AC FLEET & COMMERCIAL TRANSPORTER • AGRA"}
          </p>
          <h1>
            {isHindi ? (
              <>
                आगरा की सबसे भरोसेमंद व साफ-सुथरी फ्लीट,
                <br />
                <i>हर सफर और हर परिवार के लिए तैयार।</i>
              </>
            ) : (
              <>
                Well-maintained cabs and luxury vans,
                <br />
                <i>clean, inspected, and ready to roll.</i>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {isHindi
              ? "दैनिक रूप से सैनिटाइज्ड सेडान से लेकर 6-सीटर इनोवा क्रिस्टा, 12-26 सीटर टेम्पो ट्रैवलर और प्रीमियम अर्बनिया लग्जरी वैन तक — पारदर्शी प्रति किमी दरें, पेशेवर ड्राइवर, और शत-प्रतिशत आरामदायक यात्रा।"
              : "From fuel-efficient Dzire sedans to family-favourite Toyota Innova Crysta, 12–26 seater Tempo Travellers, and executive Force Urbania vans — spotless interiors, dual AC, verified chauffeurs, and transparent outstation billing."}
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#fleet-catalogue">
              {isHindi ? "गाड़ियाँ देखें ↓" : "Explore Fleet Below ↓"}
            </a>
            <a className="button button-outline" href="#transfers-matrix">
              {isHindi ? "एयरपोर्ट व स्टेशन दरें" : "Airport & Station Transfers"}
            </a>
            <a className="button button-outline" href={`tel:${contact.phone}`}>
              {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </header>

      {/* Fleet Catalogue Section */}
      <section
        id="fleet-catalogue"
        className="home-section fleet-catalogue-section"
        aria-labelledby="fleet-catalogue-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "वाहन चयन" : "Vehicle Lineup & Specifications"}
              </p>
              <h2 id="fleet-catalogue-heading">
                {isHindi ? (
                  <>
                    हर यात्री समूह के लिए,
                    <br />
                    <i>उचित श्रेणी व पारदर्शी मूल्य।</i>
                  </>
                ) : (
                  <>
                    Engineered for comfort,
                    <br />
                    <i>tailored for your travelling party.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="fleet-filter-tabs" role="tablist" aria-label="Vehicle Categories">
            <button
              type="button"
              className={`filter-tab-btn ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              {isHindi ? "सभी गाड़ियाँ (All Fleet)" : "All Fleet (5)"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "sedan" ? "is-active" : ""}`}
              onClick={() => setFilter("sedan")}
            >
              {isHindi ? "सेडान (Sedan 4+1)" : "Sedan & Hatchback (1)"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "suv" ? "is-active" : ""}`}
              onClick={() => setFilter("suv")}
            >
              {isHindi ? "पारिवारिक एसयूवी (MPV/SUV 6+1)" : "Family MPVs & SUVs (2)"}
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filter === "van" ? "is-active" : ""}`}
              onClick={() => setFilter("van")}
            >
              {isHindi ? "ग्रुप वैन (Tempo & Urbania)" : "Group Luxury Vans (2)"}
            </button>
          </div>

          {/* Vehicle Cards Grid */}
          <div className="fleet-cards-grid">
            {filteredVehicles.map((veh) => {
              const isRecommended = veh.id === "innova";

              return (
                <article
                  className={`fleet-vehicle-card ${isRecommended ? "is-featured" : ""}`}
                  key={veh.id}
                  id={veh.id}
                >
                  {/* Photo with Overlay Badges */}
                  <div className="fleet-card-media">
                    <img
                      src={veh.image}
                      alt={`${veh.name} cab hire in Agra`}
                      width="640"
                      height="360"
                      loading="lazy"
                    />
                    <div className="media-overlay-tags">
                      <span className="spec-badge">💺 {veh.seats}+1 Seats</span>
                      <span className="spec-badge">🧳 {veh.bags} Bags</span>
                      <span className="spec-badge">❄️ Dual AC</span>
                      {isRecommended && (
                        <span className="gold-star-badge">★ HIGHWAY FAVORITE</span>
                      )}
                    </div>
                  </div>

                  <div className="fleet-card-body">
                    <div className="fleet-header-row">
                      <div>
                        <span className="vehicle-class-tag">{veh.klass}</span>
                        <h3 className="vehicle-title">{veh.name}</h3>
                      </div>
                      <div className="rate-pill-wrap">
                        <span className="rate-range-pill">{veh.rateRange}</span>
                      </div>
                    </div>

                    <p className="vehicle-blurb">{veh.blurb}</p>

                    {/* Suitable For Pill */}
                    <div className="suitable-row">
                      <span className="suitable-label">
                        {isHindi ? "किसके लिए उपयुक्त:" : "Ideal For:"}
                      </span>
                      <span className="suitable-val">{veh.suitable}</span>
                    </div>

                    {/* Models Lineup */}
                    <div className="models-box">
                      <span className="models-label">
                        {isHindi ? "शामिल वाहन मॉडल:" : "Models in this Category:"}
                      </span>
                      <div className="models-tags-list">
                        {veh.models.map((model, idx) => (
                          <span className="model-chip" key={idx}>
                            🚗 {model}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="specs-table-grid">
                      <div className="spec-item">
                        <span className="spec-k">
                          {isHindi ? "बैठने की क्षमता" : "Seating"}
                        </span>
                        <strong className="spec-v">{veh.seats} Passengers + 1 Chauffeur</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-k">
                          {isHindi ? "सामान क्षमता" : "Luggage"}
                        </span>
                        <strong className="spec-v">{veh.bags} Large Suitcases</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-k">
                          {isHindi ? "आउटस्टेशन दर" : "Base Outstation Rate"}
                        </span>
                        <strong className="spec-v gold-accent">₹{veh.perKm} / km</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-k">
                          {isHindi ? "दैनिक न्यूनतम" : "Outstation Min Rule"}
                        </span>
                        <strong className="spec-v">300 km / calendar day</strong>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="fleet-card-footer">
                      <div className="footer-rates-hint">
                        <span className="hint-label">
                          {isHindi ? "स्थानीय 8 घंटे / 80 किमी:" : "Agra Local (8h/80km):"}
                        </span>
                        <strong className="hint-price">
                          {veh.id === "sedan"
                            ? "₹1,900"
                            : veh.id === "ertiga"
                              ? "₹2,600"
                              : veh.id === "innova"
                                ? "₹2,850"
                                : veh.id === "tempo"
                                  ? "₹5,500"
                                  : "₹7,500"}
                        </strong>
                      </div>

                      <div className="card-buttons-cluster">
                        <a
                          className={`button ${isRecommended ? "button-primary" : "button-outline"}`}
                          href={`/book.html?vehicle=${veh.id}`}
                        >
                          {isHindi ? "गाड़ी बुक करें ↗" : "Book Vehicle ↗"}
                        </a>
                        <a
                          className="button button-outline"
                          href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                            `Hi SK Baghel Travels, I want to check availability for ${veh.name} (${veh.klass}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {isHindi ? "व्हाट्सएप" : "WhatsApp"}
                        </a>
                        <a
                          className="button button-outline"
                          href={`${langPrefix}/vehicles/${veh.id === "innova" ? "innova-crysta" : veh.id === "tempo" ? "tempo-traveller" : veh.id}/`}
                        >
                          {isHindi ? "विवरण" : "Specs"}
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

      {/* Airport & Railway Station Flat Transfers Section */}
      <section
        id="transfers-matrix"
        className="home-section transfers-matrix-section"
        aria-labelledby="transfers-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "फिक्स किराया तालिका" : "Flat Rate Transfer Matrix"}
              </p>
              <h2 id="transfers-heading">
                {isHindi ? (
                  <>
                    एयरपोर्ट एवं रेलवे स्टेशन ट्रांसफर,
                    <br />
                    <i>बिना मोलभाव, निश्चित व पारदर्शी किराये।</i>
                  </>
                ) : (
                  <>
                    Punctual airport & station pickups,
                    <br />
                    <i>flat transparent rates with zero surge.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="transfers-table-card">
            <table className="transfers-table">
              <thead>
                <tr>
                  <th scope="col">{isHindi ? "ट्रांसफर रूट व विवरण" : "Transfer Corridor / Route"}</th>
                  <th scope="col">Sedan (4+1)</th>
                  <th scope="col">Ertiga (6+1)</th>
                  <th scope="col">Innova Crysta</th>
                  <th scope="col">Tempo (12–26)</th>
                  <th scope="col">Urbania Van</th>
                  <th scope="col">{isHindi ? "कार्रवाई" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {airportTransfers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className="transfer-corridor-name">{item.name}</strong>
                      <span className="transfer-meta">
                        {item.id === "delhi-airport"
                          ? isHindi
                            ? "यमुना एक्सप्रेसवे टोल व स्टेट टैक्स सहित"
                            : "Yamuna Expressway Toll & Taxes Included"
                          : isHindi
                            ? "डोरस्टेप पिकअप / ड्रॉप व स्टेशन पार्किंग सहित"
                            : "Doorstep Pickup/Drop & Station Parking Included"}
                      </span>
                    </td>
                    <td className="transfer-fare">₹{item.fares.sedan.toLocaleString("en-IN")}</td>
                    <td className="transfer-fare">₹{item.fares.ertiga.toLocaleString("en-IN")}</td>
                    <td className="transfer-fare gold-fare">₹{item.fares.innova.toLocaleString("en-IN")}</td>
                    <td className="transfer-fare">₹{item.fares.tempo.toLocaleString("en-IN")}</td>
                    <td className="transfer-fare">₹{item.fares.urbania.toLocaleString("en-IN")}</td>
                    <td>
                      <a
                        className="button button-outline button-xs"
                        href={`/book.html?service=airport&transfer=${item.id}`}
                      >
                        {isHindi ? "बुक करें ↗" : "Book ↗"}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Fleet Standards & Hygiene Pillars */}
      <section
        className="home-section fleet-standards-section"
        aria-labelledby="standards-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "सुरक्षा एवं रखरखाव मानक" : "Vehicle Maintenance & Chauffeur Protocol"}
              </p>
              <h2 id="standards-heading">
                {isHindi ? (
                  <>
                    हर सफर से पहले पूरी जांच,
                    <br />
                    <i>आपकी सुरक्षा और आराम की गारंटी।</i>
                  </>
                ) : (
                  <>
                    Inspected before every departure,
                    <br />
                    <i>uncompromising safety & cleanliness.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="standards-grid">
            <div className="standard-pillar-card">
              <span className="pillar-num">01</span>
              <h3>
                {isHindi ? "दैनिक सैनिटाइजेशन व एसी क्लीनिंग" : "Daily Sanitization & AC Duct Care"}
              </h3>
              <p>
                {isHindi
                  ? "हर ट्रिप के बाद वैक्यूम क्लीनिंग, फ्रेश इंटीरियर, और शक्तिशाली डुअल एसी डक्ट्स की नियमित सर्विसिंग ताकि यात्रा में ताजी हवा मिले।"
                  : "Vacuumed interiors, fresh non-smoking cabin ambiance, and thoroughly serviced AC cooling ducts prior to every highway departure."}
              </p>
            </div>

            <div className="standard-pillar-card">
              <span className="pillar-num">02</span>
              <h3>
                {isHindi ? "सत्यापित एवं अनुभवी ड्राइवर" : "Verified Professional Chauffeurs"}
              </h3>
              <p>
                {isHindi
                  ? "पुलिस सत्यापन, वैध कमर्शियल ड्राइविंग लाइसेंस, और न्यूनतम 7+ वर्षों का एक्सप्रेसवे व पहाड़ी रास्तों का अनुभव।"
                  : "Strict police background checks, verified commercial badges, and minimum 7+ years of Yamuna Expressway and heritage highway experience."}
              </p>
            </div>

            <div className="standard-pillar-card">
              <span className="pillar-num">03</span>
              <h3>
                {isHindi ? "आरसी व ऑल-इंडिया परमिट" : "Commercial RTO Yellow-Plate Permits"}
              </h3>
              <p>
                {isHindi
                  ? "सभी वाहनों में वैध कमर्शियल बीमा, फिटनेस सर्टिफिकेट, ऑल-इंडिया टूरिस्ट परमिट और जीपीएस ट्रैकिंग उपकरण लगे हैं।"
                  : "Every vehicle operates with valid tourist commercial registration, passenger insurance, annual fitness certification, and live GPS tracking."}
              </p>
            </div>

            <div className="standard-pillar-card">
              <span className="pillar-num">04</span>
              <h3>
                {isHindi ? "24×7 आकस्मिक बैकअप गारंटी" : "24×7 Roadside Replacement Guarantee"}
              </h3>
              <p>
                {isHindi
                  ? "आगरा, दिल्ली एनसीआर और जयपुर कॉरिडोर में किसी तकनीकी रुकावट की स्थिति में 30–45 मिनट में वैकल्पिक वाहन का पक्का वादा।"
                  : "In the unlikely event of a tire puncture or mechanical delay, our corridor rescue network dispatches a replacement car within 30–45 minutes."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet FAQs Accordion */}
      <section
        className="home-section fleet-faq-section"
        aria-labelledby="fleet-faq-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "फ्लीट एफएक्यू" : "Vehicle & Billing FAQs"}
              </p>
              <h2 id="fleet-faq-heading">
                {isHindi ? (
                  <>
                    गाड़ियों व किराये से जुड़े सवाल,
                    <br />
                    <i>सच्चे जवाब, बिना किसी छिपे नियम के।</i>
                  </>
                ) : (
                  <>
                    Answers to fleet & billing questions,
                    <br />
                    <i>clarity before you step on board.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="fleet-faq-accordion">
            {FLEET_FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  className={`fleet-faq-item ${isOpen ? "is-open" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="fleet-faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`fleet-faq-answer-${index}`}
                  >
                    <span>{item.q[activeLanguage]}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="fleet-faq-answer"
                      id={`fleet-faq-answer-${index}`}
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

      {/* Bottom 24x7 Fleet Dispatch Desk CTA */}
      <section className="container fleet-cta-container">
        <div className="fleet-cta-card">
          <div className="fleet-cta-content">
            <span className="fleet-cta-badge">24×7 FLEET CONTROL ROOM</span>
            <h2>
              {isHindi
                ? "क्या आपकी कोई विशेष ग्रुप यात्रा या शादी की बुकिंग है?"
                : "Need a tailored fleet quote for an event, wedding, or VIP delegation?"}
            </h2>
            <p>
              {isHindi
                ? "ताजगंज, आगरा स्थित हमारे मुख्य फ्लीट ऑपरेशन्स डेस्क से सीधे संपर्क करें। एक साथ कई वाहनों की बुकिंग और विशेष दरों के लिए तुरंत सहायता प्राप्त करें।"
                : "Connect with our fleet manager directly. Multi-vehicle convoys, corporate airport runs, and bespoke outstation van rentals across North India."}
            </p>
            <div className="fleet-cta-buttons">
              <a className="button button-primary" href="/book.html">
                {isHindi ? "ऑनलाइन बुक करें ↗" : "Book Online ↗"}
              </a>
              <a
                className="button button-outline"
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                {isHindi ? "व्हाट्सएप संपर्क" : "WhatsApp Fleet Desk"}
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
