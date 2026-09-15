/**
 * TermsPage — Terms & Conditions Hub Page (Step R5.18)
 *
 * Comprehensive bilingual commercial terms & operational contract featuring:
 * 1. Semantic Breadcrumbs & Page Hero with effective date badge
 * 2. Quick-Jump Sticky Navigation Anchor Strip (8 clauses)
 * 3. Clause 01: 24-Hour Cab Cancellation & 100% Refund Policy
 * 4. Clause 02: 6-Tier Multi-Day Tour Package Cancellation Schedule (Table)
 * 5. Clause 03: Fare Structure, Expressway Tolls, Parking & Tax Transparency (GSTIN: 09ABCDE1234F1Z5)
 * 6. Clause 04: Outstation Rules: 300 KM/Day Rule & Night Driving Allowance (22:00–05:00)
 * 7. Clause 05: Passenger Safety, Seatbelt Mandate & Chauffeur Protocol
 * 8. Clause 06: Luggage Limits, Vehicle Capacity & Personal Valuables Liability
 * 9. Clause 07: 45-Minute Emergency Vehicle Replacement Guarantee
 * 10. Clause 08: Legal Entity, Dispute Resolution & Agra Jurisdiction
 * 11. Support Desk Contact Strip & Instant Booking CTA
 * 12. Schema.org JSON-LD graph (WebPage, BreadcrumbList, LocalBusiness)
 */

import React from "react";
import { contact } from "../data/contact";
import { cancellationSlabsTour } from "../data";

interface TermsPageProps {
  language: "en" | "hi";
}

const TOC_ITEMS = [
  { id: "cancellation-cab", labelEn: "1. 24-Hr Cab Cancellation", labelHi: "1. 24-घंटे कैब कैंसिलेशन" },
  { id: "cancellation-tour", labelEn: "2. Tour Refund Slabs", labelHi: "2. टूर रिफंड तालिका" },
  { id: "pricing-tolls", labelEn: "3. Pricing & Toll Taxes", labelHi: "3. किराया व टोल टैक्स" },
  { id: "outstation-rules", labelEn: "4. 300 KM & Night Rules", labelHi: "4. 300 किमी व नाइट नियम" },
  { id: "passenger-safety", labelEn: "5. Passenger Code & Safety", labelHi: "5. यात्री सुरक्षा व नियम" },
  { id: "luggage-liability", labelEn: "6. Luggage & Liability", labelHi: "6. लगेज व जिम्मेदारी" },
  { id: "replacement-guarantee", labelEn: "7. 45-Min Replacement", labelHi: "7. 45-मिनट रिप्लेसमेंट" },
  { id: "legal-jurisdiction", labelEn: "8. Agra Legal Jurisdiction", labelHi: "8. आगरा क्षेत्राधिकार" }
];

export function TermsPage({ language }: TermsPageProps) {
  const isHi = language === "hi";

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Schema.org JSON-LD graph
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `https://skbagheltravels.in/${language}/terms/#webpage`,
        "url": `https://skbagheltravels.in/${language}/terms/`,
        "name": isHi
          ? "नियम व शर्तें — एस के बघेल टूर एंड ट्रेवल्स आगरा | कैंसिलेशन व रिफंड नीति"
          : "Terms & Conditions — SK Baghel Tour & Travels Agra | Cancellation Policy",
        "description": isHi
          ? "हमारी पारदर्शी वाणिज्यिक शर्तें पढ़ें: 24 घंटे में 100% पूरा रिफंड, मल्टी-डे टूर कैंसिलेशन तालिका, 300 किमी आउटस्टेशन नियम व आगरा कानूनी क्षेत्राधिकार।"
          : "Standard commercial guidelines for chauffeur-driven cabs, 24-hr 100% refund policy, 6-tier tour cancellation schedule, 300 km daily minimums, and Agra jurisdiction.",
        "inLanguage": isHi ? "hi-IN" : "en-IN"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://skbagheltravels.in/${language}/terms/#breadcrumb`,
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
            "name": isHi ? "नियम व शर्तें" : "Terms & Conditions",
            "item": `https://skbagheltravels.in/${language}/terms/`
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://skbagheltravels.in/#localbusiness",
        "name": "SK Baghel Tour & Travels",
        "telephone": contact.phone,
        "email": contact.email,
        "priceRange": "₹₹",
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
    <div className="terms-page">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Hero & Breadcrumbs Section */}
      <section className="page-hero terms-hero">
        <div className="container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <a href={`/${language}/`}>{isHi ? "होम" : "Home"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item breadcrumb-item--active" aria-current="page">
                {isHi ? "नियम व शर्तें" : "Terms & Conditions"}
              </li>
            </ol>
          </nav>

          <div className="page-hero__badge">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {isHi
                ? "लागू तिथि: सितंबर 2026 • 100% पारदर्शी अनुबंध"
                : "Effective Date: September 2026 • Transparent Commercial Agreement"}
            </span>
          </div>

          <h1 className="page-hero__title">
            {isHi ? (
              <>
                नियम व शर्तें —<br />
                <i>स्पष्ट, निष्पक्ष व पारदर्शी वाणिज्यिक अनुबंध।</i>
              </>
            ) : (
              <>
                Terms & Conditions —<br />
                <i>Clear, Fair & Transparent Commercial Terms.</i>
              </>
            )}
          </h1>

          <p className="page-hero__lead">
            {isHi
              ? "एस के बघेल टूर एंड ट्रेवल्स (पंजीकृत) के साथ यात्रा करने पर लागू होने वाले सभी अधिकार, रद्दीकरण नीतियां, सुरक्षा नियम और किराया पारदर्शिता दिशानिर्देश।"
              : "Standard operational and legal terms governing chauffeur-driven cab bookings, private sightseeing circuits, airport transfers, and outstation rentals from Agra."}
          </p>
        </div>
      </section>

      {/* Quick Jump Navigation Pill Bar */}
      <nav className="terms-toc-strip" aria-label={isHi ? "विषय सूची" : "Table of contents"}>
        <div className="container">
          <div className="terms-toc-scroll">
            {TOC_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className="terms-toc-link"
              >
                {isHi ? item.labelHi : item.labelEn}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Legal Content Container */}
      <div className="terms-content-section">
        <div className="container">
          <div className="terms-layout">
            <article className="terms-article">
              {/* Introduction Callout */}
              <div className="terms-callout terms-callout--brand">
                <div className="terms-callout__icon" aria-hidden="true">⚖️</div>
                <div className="terms-callout__body">
                  <h4>{isHi ? "हमारा सेवा संकल्प" : "Our Service Commitment"}</h4>
                  <p>
                    {isHi
                      ? "यह अनुबंध एस के बघेल टूर एंड ट्रेवल्स (पंजीकृत कार्यालय: ताज ईस्ट गेट रोड, ताजगंज, आगरा, उत्तर प्रदेश 282001, जीएसटी: 09ABCDE1234F1Z5) और हमारे सम्मानित यात्रियों के बीच विश्वास और पारदर्शिता की नींव रखता है। हमारे सभी नियम उपभोक्ता अधिकारों और भारतीय मोटर वाहन अधिनियम के पूर्ण अनुपालन में हैं।"
                      : "This agreement governs the relationship between S.K. Baghel Tour & Travels (Registered Office: Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001, GSTIN: 09ABCDE1234F1Z5) and our passengers. All terms are structured to eliminate ambiguity, protect traveler interests, and comply fully with the Indian Motor Vehicles Act."}
                  </p>
                </div>
              </div>

              {/* Clause 01: 24-Hour Cab Cancellation & Refund Policy */}
              <section id="cancellation-cab" className="terms-clause">
                <div className="terms-clause__num">01</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "24-घंटे कैब कैंसिलेशन व 100% रिफंड नीति"
                      : "24-Hour Cab Cancellation & 100% Refund Policy"}
                  </h2>
                  <p>
                    {isHi
                      ? "हम समझते हैं कि यात्रा योजनाओं में अप्रत्याशित बदलाव हो सकते हैं। इसलिए हम सभी सामान्य आउटस्टेशन कैब, रेलवे स्टेशन ट्रांसफर और स्थानीय दर्शनीय यात्राओं पर पूर्ण रिफंड की सुविधा देते हैं:"
                      : "We recognize that travel schedules can shift unpredictably due to delayed connecting trains, flights, or family circumstances. We offer a clear, customer-first cancellation guarantee for all standard taxi bookings:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "यात्रा से 24+ घंटे पूर्व रद्दीकरण:" : "Notice 24+ Hours Prior to Scheduled Pickup:"}</strong>{" "}
                      {isHi
                        ? "100% पूरा रिफंड। अग्रिम जमा की गई पूरी टोकन राशि बिना किसी कटौती के मूल भुगतान खाते (UPI/Card/Bank) में वापस कर दी जाती है।"
                        : "100% Full Refund. The entire advance deposit is refunded with zero cancellation penalty or administrative deductions."}
                    </li>
                    <li>
                      <strong>{isHi ? "यात्रा से 24 घंटे के भीतर रद्दीकरण:" : "Notice Less Than 24 Hours Prior to Pickup:"}</strong>{" "}
                      {isHi
                        ? "अग्रिम जमा राशि (25-28%) वाहन आरक्षण और ड्राइवर स्टेजिंग लागत के रूप में समायोजित की जाती है, क्योंकि अंतिम क्षणों में ड्राइवर अन्य बुकिंग स्वीकार नहीं कर सकता।"
                        : "The advance deposit (typically 25%–28%) is retained to cover driver staging, route allocation, and opportunity costs, as that vehicle was exclusively held for your schedule."}
                    </li>
                    <li>
                      <strong>{isHi ? "रिफंड प्रोसेसिंग समय-सीमा:" : "Refund Processing Timeline:"}</strong>{" "}
                      {isHi
                        ? "सभी अधिकृत रिफंड 5 से 7 बैंक कार्यदिवसों के भीतर उसी माध्यम में वापस जमा कर दिए जाते हैं जिससे भुगतान किया गया था।"
                        : "Approved refunds are credited directly back to the original funding source (credit card, debit card, UPI, or bank transfer) within 5 to 7 business days."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 02: 6-Tier Multi-Day Tour Package Cancellation Schedule */}
              <section id="cancellation-tour" className="terms-clause">
                <div className="terms-clause__num">02</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "मल्टी-डे टूर पैकेज: 6-चरणीय रद्दीकरण तालिका"
                      : "Multi-Day Tour Packages: 6-Tier Cancellation Schedule"}
                  </h2>
                  <p>
                    {isHi
                      ? "मल्टी-डे पैकेज (जैसे 3-दिवसीय गोल्डन ट्रायंगल, राजस्थान सर्किट, या मथुरा-आगरा ओवरनाइट टूर) में होटल आरक्षण और धरोहर स्थलों के परमिट अग्रिम रूप से सुरक्षित किए जाते हैं। इन पैकेजों के लिए निम्नलिखित 6-चरणीय समय-सीमा लागू होती है:"
                      : "Multi-day packaged tours (such as Golden Triangle Delhi-Agra-Jaipur, Rajasthan Heritage circuits, or overnight excursions) require advance hotel blockades and monument logistics. Cancellation of packaged tours is governed by the following standardized 6-tier schedule:"}
                  </p>

                  <div className="cancellation-table-wrap">
                    <table className="cancellation-table">
                      <thead>
                        <tr>
                          <th scope="col">{isHi ? "रद्दीकरण की पूर्व सूचना" : "Notice Prior to Tour Date"}</th>
                          <th scope="col">{isHi ? "रिफंड प्रतिशत" : "Refund Percentage"}</th>
                          <th scope="col">{isHi ? "कटौती शुल्क" : "Cancellation Fee"}</th>
                          <th scope="col">{isHi ? "रिफंड अवधि" : "Credited Within"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancellationSlabsTour.map((tier, idx) => (
                          <tr key={idx}>
                            <td><strong>{tier.days}</strong></td>
                            <td className="refund-highlight">{tier.refund}</td>
                            <td>{tier.fee}</td>
                            <td>{isHi ? "5–7 कार्यदिवस" : "5–7 Business Days"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="terms-table-note">
                    ℹ️ {isHi
                      ? "नोट: यदि आपने पैकेज के साथ स्मारक प्रवेश टिकट (जैसे ताज महल VIP टिकट) खरीदे हैं, तो वे भारतीय पुरातत्व सर्वेक्षण (ASI) के गैर-वापसी योग्य नियमों के अधीन होते हैं।"
                      : "Note: Monument entry permits (e.g. Archaeological Survey of India Taj Mahal tickets) are subject to official government non-refundable policies and cannot be refunded once issued."}
                  </p>
                </div>
              </section>

              {/* Clause 03: Pricing, Expressway Tolls, Parking & Tax Transparency */}
              <section id="pricing-tolls" className="terms-clause">
                <div className="terms-clause__num">03</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "किराया संरचना, एक्सप्रेसवे टोल, पार्किंग व टैक्स पारदर्शिता"
                      : "Fare Structure, Expressway Tolls, Parking & Tax Transparency"}
                  </h2>
                  <p>
                    {isHi
                      ? "हमारा सबसे बड़ा सिद्धांत है: शून्य छुपा खर्च (Zero Hidden Charges)। किराए की संरचना पारदर्शी और स्पष्ट है:"
                      : "Our operating philosophy is built upon strict fare transparency. Every single line item is defined prior to departure:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "फिक्स्ड ट्रांसफर पैकेज:" : "Flat Outstation Packages (e.g. Agra to Delhi IGI Airport / Jaipur):"}</strong>{" "}
                      {isHi
                        ? "यमुना एक्सप्रेसवे टोल, दिल्ली एमसीडी / स्टेट बॉर्डर टैक्स और ड्राइवर भत्ता पैकेज में 100% शामिल हैं। यात्री को रास्ते में किसी टोल बूथ पर जेब से पैसे देने की जरूरत नहीं है।"
                        : "Yamuna Expressway toll taxes, state border permits, and driver allowance are 100% included in the quoted fare. Passengers do not pay out-of-pocket at highway toll plazas."}
                    </li>
                    <li>
                      <strong>{isHi ? "लचीली प्रति-किमी राउंड ट्रिप रेंटल:" : "Flexible Per-Kilometer Round-Trip Rentals:"}</strong>{" "}
                      {isHi
                        ? "टोल प्लाजा शुल्क, अंतर्राज्यीय बॉर्डर परमिट (जैसे उत्तर प्रदेश से राजस्थान या हरियाणा) और स्मारकों की पार्किंग सरकारी रसीद के अनुसार वास्तविक मूल्य पर देय होती है। हम इस पर कोई कमीशन या मार्कअप नहीं जोड़ते।"
                        : "Expressway toll plazas, inter-state entry taxes, and monument parking are charged strictly at actual government receipt rates with zero agency markup."}
                    </li>
                    <li>
                      <strong>{isHi ? "जीएसटी चालान (Tax Invoice):" : "GST Compliance & Tax Invoicing:"}</strong>{" "}
                      {isHi
                        ? "सभी दरों पर लागू भारतीय माल व सेवा कर (GST) के अनुसार आधिकारिक टैक्स इनवॉइस जारी किया जाता है (GSTIN: 09ABCDE1234F1Z5)।"
                        : "Formal GST tax invoices with input tax credit eligibility are issued upon request for all corporate business and leisure bookings under GSTIN 09ABCDE1234F1Z5."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 04: Outstation Rules: 300 KM/Day Rule & Night Allowance */}
              <section id="outstation-rules" className="terms-clause">
                <div className="terms-clause__num">04</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "आउटस्टेशन नियम: 300 किमी न्यूनतम व नाइट चार्ज"
                      : "Outstation Rules: 300 KM/Day Minimum & Night Allowances"}
                  </h2>
                  <p>
                    {isHi
                      ? "उत्तर भारत के वाणिज्यिक टैक्सी नियमों के तहत आउटस्टेशन यात्राओं पर निम्नलिखित मानक परिचालन नियम लागू होते हैं:"
                      : "Standard commercial transportation guidelines across Northern India govern multi-day outstation taxi hires:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "300 किमी / कैलेंडर दिवस न्यूनतम नियम:" : "300 KM per Calendar Day Rule:"}</strong>{" "}
                      {isHi
                        ? "आउटस्टेशन राउंड ट्रिप के लिए प्रतिदिन (मध्यरात्रि 12 से 12) न्यूनतम 300 किमी का बिलिंग नियम मान्य है। यदि कुल दिनों की वास्तविक यात्रा कुल न्यूनतम औसत (300 × दिन) से अधिक है, तो केवल वास्तविक किमी का भुगतान लिया जाएगा।"
                        : "All outstation round-trip bookings are subject to a minimum average billing of 300 km per calendar day (00:00 to 23:59). If cumulative distance exceeds (300 km × total days), you simply pay for actual kilometers traveled."}
                    </li>
                    <li>
                      <strong>{isHi ? "नाइट ड्राइविंग भत्ता (22:00 से 05:00):" : "Night Driving Allowance (22:00 to 05:00):"}</strong>{" "}
                      {isHi
                        ? "जब आउटस्टेशन यात्रा रात 10:00 बजे से सुबह 5:00 बजे के बीच हाईवे पर चल रही हो, तो ड्राइवर को रात का भत्ता देय होता है: सेडान के लिए ₹300/रात, अर्टिगा/इनोवा के लिए ₹500/रात, और टेम्पो ट्रैवलर के लिए ₹600/रात।"
                        : "Night driving allowance applies strictly when the vehicle is in active transit between 22:00 (10:00 PM) and 05:00 (5:00 AM) on outstation routes: ₹300/night for Sedans, ₹500/night for MPVs/SUVs (Ertiga/Innova Crysta), and ₹600/night for Tempo Travellers."}
                    </li>
                    <li>
                      <strong>{isHi ? "ताज महल सूर्योदय टूर छूट:" : "Taj Mahal Sunrise Tour Exemption:"}</strong>{" "}
                      {isHi
                        ? "आगरा स्थानीय दर्शनीय टूर पर सुबह 5:00 बजे या 5:30 बजे ताज महल सूर्योदय पिकअप पर कोई अलग से नाइट चार्ज नहीं लिया जाता।"
                        : "Local Agra sunrise packages starting at 5:00 AM or 5:30 AM are completely exempt from night charges."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 05: Passenger Safety, Seatbelts & Chauffeur Protocol */}
              <section id="passenger-safety" className="terms-clause">
                <div className="terms-clause__num">05</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "यात्री आचार संहिता, सुरक्षा व ड्राइवर प्रोटोकॉल"
                      : "Passenger Code of Conduct, Safety & Chauffeur Protocol"}
                  </h2>
                  <p>
                    {isHi
                      ? "हमारी प्राथमिकता हर यात्री — विशेषकर परिवारों, वरिष्ठ नागरिकों और अकेले यात्रा करने वाली महिलाओं — की पूर्ण सुरक्षा है:"
                      : "Passenger safety, comfort, and mutual respect are non-negotiable standards across our entire fleet operation:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "धूम्रपान व मद्यपान निषेध:" : "Strictly Smoke-Free & Alcohol-Free Vehicles:"}</strong>{" "}
                      {isHi
                        ? "हमारी सभी व्यावसायिक गाड़ियों में धूम्रपान, शराब या किसी भी प्रकार के नशीले पदार्थों का सेवन पूर्णतया प्रतिबंधित है।"
                        : "Smoking, vaping, alcohol consumption, and any unlawful substances are strictly prohibited inside all commercial vehicles."}
                    </li>
                    <li>
                      <strong>{isHi ? "सीटबेल्ट अनिवार्यता:" : "Seatbelt Mandate:"}</strong>{" "}
                      {isHi
                        ? "भारतीय मोटर वाहन कानून के अनुसार, वाहन में बैठे सभी यात्रियों को सीटबेल्ट लगाना अनिवार्य है।"
                        : "Per the Indian Motor Vehicles Act, all front and rear seat passengers must wear seatbelts while the vehicle is in motion."}
                    </li>
                    <li>
                      <strong>{isHi ? "गति सीमा व सुरक्षित ड्राइविंग:" : "Highway Speed Limit Adherence:"}</strong>{" "}
                      {isHi
                        ? "हमारे ड्राइवर एक्सप्रेसवे गति सीमा (यमुना एक्सप्रेसवे 100 किमी/घंटा, शहर 40-50 किमी/घंटा) का कड़ाई से पालन करते हैं। यात्रियों से अनुरोध है कि वे ड्राइवर पर ओवरस्पीडिंग का दबाव न बनाएं।"
                        : "Chauffeurs strictly adhere to regulatory highway speed limits (100 km/h on Yamuna Expressway, 80 km/h on national highways). Chauffeurs cannot be compelled to exceed legal limits."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 06: Luggage Limits, Vehicle Capacity & Personal Valuables */}
              <section id="luggage-liability" className="terms-clause">
                <div className="terms-clause__num">06</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "लगेज क्षमता, वाहन भार व व्यक्तिगत सामान का दायित्व"
                      : "Luggage Capacity Limits, Vehicle Loading & Valuables"}
                  </h2>
                  <p>
                    {isHi
                      ? "प्रत्येक वाहन की सामान रखने की क्षमता निर्धारित है ताकि यात्रा सुरक्षित और आरामदायक रहे:"
                      : "Each vehicle tier has a designated baggage capacity engineered for passenger comfort and structural road safety:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "श्रेणीवार क्षमता:" : "Capacity by Category:"}</strong>{" "}
                      {isHi
                        ? "सेडान (2 बड़े + 2 छोटे बैग), अर्टिगा (3-4 बैग), इनोवा क्रिस्टा (4 बड़े + 3 हैंडबैग), टेम्पो ट्रैवलर (10-18 बैग + वाटरप्रूफ रूफ कैरियर)।"
                        : "Sedan (2 large suitcases + 2 small bags), Ertiga MPV (3–4 bags), Innova Crysta (4 large + 3 cabin bags), Tempo Traveller / Urbania (10–18 bags in dedicated boot + rooftop carrier)."}
                    </li>
                    <li>
                      <strong>{isHi ? "ज्वलनशील व खतरनाक सामग्री निषेध:" : "Prohibited Items:"}</strong>{" "}
                      {isHi
                        ? "ज्वलनशील पदार्थ, विस्फोटक, गैस सिलेंडर या कोई भी अवैध सामान ले जाना कानूनन अपराध है।"
                        : "Carriage of explosives, inflammable liquids, hazardous chemicals, or contraband goods is strictly prohibited."}
                    </li>
                    <li>
                      <strong>{isHi ? "सामान की देखभाल व खोया-पाया (Lost & Found):" : "Personal Valuables & Lost Property:"}</strong>{" "}
                      {isHi
                        ? "कीमती सामान (कैमरा, पर्स, आभूषण, लैपटॉप) की सुरक्षा यात्री की व्यक्तिगत जिम्मेदारी है। फिर भी, यदि कोई वस्तु गाड़ी में छूट जाती है, तो हमारा 24×7 कंट्रोल रूम तुरंत खोजबीन कर उसे सुरक्षित लौटाने में पूरी सहायता करता है।"
                        : "Passengers are responsible for their personal electronics, wallets, and jewelry. If any item is inadvertently left behind, our 24×7 Taj Ganj lost-and-found team coordinates immediate recovery and return."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 07: 45-Minute Emergency Vehicle Replacement Guarantee */}
              <section id="replacement-guarantee" className="terms-clause">
                <div className="terms-clause__num">07</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "45-मिनट आपातकालीन वाहन प्रतिस्थापन गारंटी"
                      : "45-Minute Emergency Vehicle Replacement Guarantee"}
                  </h2>
                  <p>
                    {isHi
                      ? "यमुना एक्सप्रेसवे, आगरा-मथुरा या आगरा-जयपुर कॉरिडोर पर किसी भी अनपेक्षित तकनीकी खराबी की स्थिति में हमारा कंट्रोल रूम 45 मिनट के भीतर समान या उससे बेहतर श्रेणी की वैकल्पिक गाड़ी उपलब्ध कराने के लिए वचनबद्ध है। इस प्रतिस्थापन का कोई अतिरिक्त शुल्क नहीं लिया जाएगा।"
                      : "In the rare event of mechanical failure or breakdown along the Yamuna Expressway, Agra-Delhi, or Agra-Jaipur corridors, our standby dispatch network guarantees to provide an identical or higher-tier replacement vehicle within 45 minutes at zero extra cost."}
                  </p>
                </div>
              </section>

              {/* Clause 08: Legal Entity, Dispute Resolution & Agra Legal Jurisdiction */}
              <section id="legal-jurisdiction" className="terms-clause">
                <div className="terms-clause__num">08</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "पंजीकृत इकाई, विवाद समाधान व कानूनी क्षेत्राधिकार"
                      : "Registered Entity, Dispute Resolution & Agra Jurisdiction"}
                  </h2>
                  <p>
                    {isHi
                      ? "इस अनुबंध से उत्पन्न किसी भी प्रकार के विवाद या मतभेद की स्थिति में दोनों पक्ष पहले सौहार्दपूर्ण बातचीत और मध्यस्थता से समाधान का प्रयास करेंगे। यदि कानूनी कार्रवाई आवश्यक होती है, तो यह स्पष्ट रूप से सहमति है कि समस्त कानूनी कार्यवाही का अनन्य क्षेत्राधिकार केवल आगरा (उत्तर प्रदेश), भारत की सक्षम अदालतों के अधीन होगा।"
                      : "This agreement is governed by the laws of India. Any disputes arising out of or in connection with transportation services provided by S.K. Baghel Tour & Travels shall be resolved through good-faith mediation. In the event of legal proceedings, it is mutually agreed that exclusive jurisdiction shall vest solely in the competent courts located in Agra, Uttar Pradesh, India."}
                  </p>
                  <div className="terms-legal-box">
                    <p><strong>{isHi ? "पंजीकृत व्यापार इकाई:" : "Registered Commercial Entity:"}</strong> S.K. Baghel Tour & Travels (Regd.)</p>
                    <p><strong>{isHi ? "मुख्यालय का पता:" : "Headquarters Address:"}</strong> Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001</p>
                    <p><strong>{isHi ? "जीएसटी पहचान संख्या (GSTIN):" : "GSTIN Registration:"}</strong> 09ABCDE1234F1Z5</p>
                    <p><strong>{isHi ? "हेल्पलाइन / कंट्रोल रूम:" : "Operational Control Helpline:"}</strong> {contact.phoneDisplay} / {contact.email}</p>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </div>
      </div>

      {/* Support Strip & CTA */}
      <section className="terms-cta-strip">
        <div className="container">
          <div className="cta-banner-box">
            <div className="cta-banner-content">
              <span className="cta-banner-tag">
                {isHi ? "पारदर्शी यात्रा" : "Transparent Journeys"}
              </span>
              <h2 className="cta-banner-title">
                {isHi
                  ? "नियमों या शर्तों के संबंध में कोई प्रश्न है?"
                  : "Have Questions About Our Terms or Cancellation Policies?"}
              </h2>
              <p className="cta-banner-desc">
                {isHi
                  ? "हमारे 24×7 आगरा ट्रेवल डेस्क से सीधे संपर्क करें। हम हर सवाल का सच्चा और स्पष्ट जवाब देने के लिए सदैव उपलब्ध हैं।"
                  : "Speak directly with our Taj Ganj dispatch controller. We believe in 100% transparency before you step into our cabs."}
              </p>
            </div>

            <div className="cta-banner-buttons">
              <a href={`tel:${contact.phone}`} className="button button-gold">
                <span>{isHi ? "कॉल करें: " + contact.phoneDisplay : "Call " + contact.phoneDisplay}</span>
                <span aria-hidden="true">📞</span>
              </a>

              <a
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                  isHi
                    ? "नमस्ते! मुझे आपकी सेवा शर्तों और कैंसिलेशन नीति के बारे में जानकारी चाहिए।"
                    : "Hello SK Baghel Travels, I would like to inquire about your terms and cancellation policy."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline"
              >
                <span>{isHi ? "व्हाट्सएप चैट" : "WhatsApp Desk"}</span>
                <span aria-hidden="true">💬</span>
              </a>

              <a href="/book.html" className="button button-secondary">
                <span>{isHi ? "कैब बुक करें" : "Book Cab Now"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
