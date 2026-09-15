/**
 * PrivacyPage — Privacy Policy Hub Page (Step R5.19)
 *
 * Comprehensive bilingual customer privacy & data protection policy featuring:
 * 1. Semantic Breadcrumbs & Page Hero with DPDP Act 2023 compliance badge
 * 2. Quick-Jump Sticky Navigation Anchor Strip (7 clauses)
 * 3. Core Privacy Commitments Bento Card (Zero Spam, Zero Data Selling, DPDP 2023 Rights)
 * 4. Clause 01: Categories of Information We Collect (Contact, Trip Logistics, Billing)
 * 5. Clause 02: Purpose & Lawful Basis of Processing (Chauffeur Allocation, Safety)
 * 6. Clause 03: Zero Data Selling & Limited Third-Party Disclosures
 * 7. Clause 04: Chauffeur Communication & Non-Disclosure Protocol
 * 8. Clause 05: Data Retention, Storage & Passenger Erasure Rights
 * 9. Clause 06: Cookies, Local Storage & Session State (Zero Ad Tracking)
 * 10. Clause 07: Data Protection Officer (DPO) & Grievance Redressal Mechanism
 * 11. Support Desk Contact Strip & Instant Booking CTA
 * 12. Schema.org JSON-LD graph (WebPage, BreadcrumbList, LocalBusiness)
 */

import React from "react";
import { Icon } from "../components/ui/Icon";
import { contact } from "../data/contact";

interface PrivacyPageProps {
  language: "en" | "hi";
}

const PRIVACY_TOC = [
  { id: "info-collected", labelEn: "1. Information We Collect", labelHi: "1. एकत्रित की जाने वाली जानकारी" },
  { id: "purpose-use", labelEn: "2. Purpose & Use of Data", labelHi: "2. डेटा उपयोग के उद्देश्य" },
  { id: "zero-selling", labelEn: "3. Zero Data Selling Policy", labelHi: "3. शून्य डेटा बिक्री नीति" },
  { id: "chauffeur-protocol", labelEn: "4. Chauffeur Protocol", labelHi: "4. ड्राइवर गोपनीयता नियम" },
  { id: "retention-rights", labelEn: "5. Retention & Your Rights", labelHi: "5. डेटा सुरक्षा व आपके अधिकार" },
  { id: "cookies-storage", labelEn: "6. Cookies & Local Storage", labelHi: "6. कुकीज व लोकल स्टोरेज" },
  { id: "grievance-dpo", labelEn: "7. Grievance Officer & DPO", labelHi: "7. शिकायत निवारण अधिकारी" }
];

export function PrivacyPage({ language }: PrivacyPageProps) {
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
        "@id": `https://skbagheltravels.in/${language}/privacy/#webpage`,
        "url": `https://skbagheltravels.in/${language}/privacy/`,
        "name": isHi
          ? "गोपनीयता नीति — एस के बघेल टूर एंड ट्रेवल्स आगरा | डेटा सुरक्षा"
          : "Privacy Policy — SK Baghel Tour & Travels Agra | Data Protection",
        "description": isHi
          ? "हमारी ग्राहक डेटा गोपनीयता नीति: DPDP अधिनियम 2023 अनुपालन, शून्य तृतीय-पक्ष डेटा बिक्री, और सुरक्षित बुकिंग व ड्राइवर समन्वय दिशानिर्देश।"
          : "Transparent customer privacy policy compliant with the Digital Personal Data Protection Act 2023. Zero data selling guarantee and secure booking communications.",
        "inLanguage": isHi ? "hi-IN" : "en-IN"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://skbagheltravels.in/${language}/privacy/#breadcrumb`,
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
            "name": isHi ? "गोपनीयता नीति" : "Privacy Policy",
            "item": `https://skbagheltravels.in/${language}/privacy/`
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
    <main id="main-content" className="privacy-page">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Hero & Breadcrumbs Section */}
      <section className="page-hero privacy-hero">
        <div className="container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <a href={`/${language}/`}>{isHi ? "होम" : "Home"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item breadcrumb-item--active" aria-current="page">
                {isHi ? "गोपनीयता नीति" : "Privacy Policy"}
              </li>
            </ol>
          </nav>

          <div className="page-hero__badge">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {isHi
                ? "DPDP अधिनियम 2023 अनुपालन • शून्य डेटा बिक्री गारंटी"
                : "DPDP Act 2023 Compliant • Zero Data Selling Guarantee"}
            </span>
          </div>

          <h1 className="page-hero__title">
            {isHi ? (
              <>
                गोपनीयता नीति —<br />
                <i>आपकी व्यक्तिगत जानकारी व विश्वास की पूर्ण सुरक्षा।</i>
              </>
            ) : (
              <>
                Privacy Policy —<br />
                <i>Protecting Your Personal Data & Travel Trust.</i>
              </>
            )}
          </h1>

          <p className="page-hero__lead">
            {isHi
              ? "हम आपकी निजता का सम्मान करते हैं। जानिए हम बुकिंग समन्वय के लिए कौन सा डेटा एकत्र करते हैं, इसे कैसे सुरक्षित रखते हैं और हम कभी भी आपकी जानकारी किसी तीसरे पक्ष को क्यों नहीं बेचते।"
              : "We treat your personal travel details with the highest integrity. Transparent data practices, strictly zero advertising spam, and full alignment with Indian data protection laws."}
          </p>
        </div>
      </section>

      {/* Quick Jump Navigation Pill Bar */}
      <nav className="terms-toc-strip" aria-label={isHi ? "विषय सूची" : "Privacy Table of contents"}>
        <div className="container">
          <div className="terms-toc-scroll">
            {PRIVACY_TOC.map((item) => (
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

      {/* Main Privacy Policy Content */}
      <div className="terms-content-section">
        <div className="container">
          <div className="terms-layout">
            <article className="terms-article">
              {/* Three Core Privacy Pillars Callout Card */}
              <div className="privacy-pillars-bento">
                <div className="privacy-pillar-card">
                  <span className="privacy-pillar-card__icon" aria-hidden="true">🔒</span>
                  <h4>{isHi ? "शून्य स्पैम गारंटी" : "Zero Spam Guarantee"}</h4>
                  <p>
                    {isHi
                      ? "हम कभी भी अवांछित मार्केटिंग कॉल, प्रोमोशनल एसएमएस या स्पैम नहीं भेजते। आपका फोन नंबर केवल ड्राइवर और कैब समन्वय के लिए उपयोग होता है।"
                      : "We never send unsolicited promotional SMS or telemarketing calls. Your contact details are used strictly for trip confirmations and chauffeur dispatch."}
                  </p>
                </div>

                <div className="privacy-pillar-card">
                  <span className="privacy-pillar-card__icon" aria-hidden="true">🚫</span>
                  <h4>{isHi ? "शून्य डेटा बिक्री" : "Zero Data Selling"}</h4>
                  <p>
                    {isHi
                      ? "हम आपके नाम, फोन नंबर, यात्रा इतिहास या होटल के पते को किसी भी विज्ञापन नेटवर्क, डेटा ब्रोकर या तीसरे पक्ष को कभी नहीं बेचते।"
                      : "We strictly never sell, rent, monetize, or trade traveler profiles, location histories, or personal identities with third-party advertisers."}
                  </p>
                </div>

                <div className="privacy-pillar-card">
                  <span className="privacy-pillar-card__icon" aria-hidden="true">🛡️</span>
                  <h4>{isHi ? "DPDP 2023 अधिकार" : "DPDP 2023 Compliance"}</h4>
                  <p>
                    {isHi
                      ? "भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण कानून के तहत आपको अपने डेटा को देखने, संशोधित करने या पूरी तरह मिटाने का कानूनी अधिकार है।"
                      : "Full compliance with India's Digital Personal Data Protection Act 2023, upholding your right to information, correction, and permanent data erasure."}
                  </p>
                </div>
              </div>

              {/* Clause 01: Information We Collect */}
              <section id="info-collected" className="terms-clause">
                <div className="terms-clause__num">01</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "एकत्रित की जाने वाली जानकारी की श्रेणियां"
                      : "Categories of Information We Collect"}
                  </h2>
                  <p>
                    {isHi
                      ? "कैब आरक्षण और यात्रा संचालन को निर्बाध बनाने के लिए हम केवल आवश्यक न्यूनतम व्यक्तिगत जानकारी एकत्र करते हैं:"
                      : "To safely coordinate chauffeur dispatch, calculate transparent route fares, and issue tax receipts, we collect only the strictly necessary minimum data:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "यात्री संपर्क विवरण:" : "Primary Traveler Contact Data:"}</strong>{" "}
                      {isHi
                        ? "आपका पूरा नाम, मोबाइल / व्हाट्सएप फोन नंबर और ईमेल पता (बुकिंग वाउचर व रसीद भेजने के लिए)।"
                        : "Your full name, mobile / WhatsApp phone number, and email address (for dispatch confirmations and trip receipts)."}
                    </li>
                    <li>
                      <strong>{isHi ? "यात्रा संभारिकी व मार्ग विवरण:" : "Trip Logistics & Route Data:"}</strong>{" "}
                      {isHi
                        ? "पिकअप होटल/पता, गंतव्य शहर, यात्रा की तारीख व समय, यात्रियों की संख्या, और ट्रेन/फ्लाइट नंबर (ताकि ट्रेन/फ्लाइट लेट होने पर ड्राइवर बिना किसी अतिरिक्त चार्ज के इंतजार कर सके)।"
                        : "Pickup address or hotel in Agra/Delhi, drop destination, trip dates, passenger count, and train/flight arrival numbers (enabling zero-charge wait tracking for delayed arrivals)."}
                    </li>
                    <li>
                      <strong>{isHi ? "कॉर्पोरेट बिलिंग जानकारी (यदि लागू हो):" : "Corporate Billing Data (If Applicable):"}</strong>{" "}
                      {isHi
                        ? "कंपनी का कानूनी नाम और वैध जीएसटी पहचान संख्या (GSTIN) — केवल आधिकारिक टैक्स इनवॉइस जारी करने के लिए।"
                        : "Registered company name and GSTIN number provided voluntarily by business travelers to claim Input Tax Credit (ITC)."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 02: Purpose & Lawful Basis of Processing */}
              <section id="purpose-use" className="terms-clause">
                <div className="terms-clause__num">02</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "डेटा उपयोग के कानूनी आधार व उद्देश्य"
                      : "Lawful Purpose & Use of Collected Data"}
                  </h2>
                  <p>
                    {isHi
                      ? "हम आपके व्यक्तिगत डेटा का उपयोग केवल निम्नलिखित वैध व्यावसायिक और सुरक्षा उद्देश्यों के लिए करते हैं:"
                      : "We process customer information solely under explicit contractual necessity and legitimate legal grounds:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "ड्राइवर व वाहन आवंटन:" : "Chauffeur & Vehicle Allocation:"}</strong>{" "}
                      {isHi
                        ? "आपकी चुनी हुई गाड़ी (सेडान, अर्टिगा, इनोवा, टेम्पो) को आरक्षित करना और संबंधित ड्राइवर को पिकअप स्थान पर समय पर पहुंचाना।"
                        : "Reserving your designated vehicle tier and staging the assigned chauffeur at your designated pickup address or station exit."}
                    </li>
                    <li>
                      <strong>{isHi ? "2-घंटे पूर्व स्वचालित सूचना:" : "Pre-Trip Dispatch Communication:"}</strong>{" "}
                      {isHi
                        ? "यात्रा समय से 2 घंटे पहले ड्राइवर का नाम, मोबाइल नंबर, गाड़ी नंबर और लाइव जीपीएस ट्रैकिंग लिंक एसएमएस व व्हाट्सएप पर भेजना।"
                        : "Transmitting driver contact details, vehicle registration number, and live tracking links 2 hours prior to scheduled departure via SMS/WhatsApp."}
                    </li>
                    <li>
                      <strong>{isHi ? "मार्ग सुरक्षा व 45-मिनट आपातकालीन बैकअप:" : "Highway Safety & 45-Minute Emergency Backup:"}</strong>{" "}
                      {isHi
                        ? "यमुना एक्सप्रेसवे या हाईवे पर किसी अप्रत्याशित समस्या की स्थिति में तत्काल सहायता और 45 मिनट के भीतर बैकअप वाहन उपलब्ध कराना।"
                        : "Coordinating real-time emergency dispatch and roadside support in accordance with our 45-Minute Replacement Guarantee."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 03: Zero Data Selling Policy */}
              <section id="zero-selling" className="terms-clause">
                <div className="terms-clause__num">03</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "शून्य डेटा बिक्री व सीमित प्रकटीकरण नीति"
                      : "Zero Data Selling & Strict Non-Disclosure Policy"}
                  </h2>
                  <p>
                    {isHi
                      ? "एस के बघेल टूर एंड ट्रेवल्स का स्पष्ट और अटल सिद्धांत है कि हम कभी भी अपने यात्रियों का डेटा किसी को नहीं बेचते। डेटा केवल इन सीमित परिस्थितियों में साझा किया जाता है:"
                      : "S.K. Baghel Tour & Travels maintains a zero-tolerance policy against commercial data monetization. We never trade passenger data. Disclosures occur strictly under these three narrow conditions:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "नियुक्त ड्राइवर के साथ सीमित साझाकरण:" : "Operational Sharing with Assigned Chauffeurs:"}</strong>{" "}
                      {isHi
                        ? "यात्रा के दिन आपके नियुक्त ड्राइवर को केवल आपका नाम, पिकअप समय और होटल/घर का पता दिया जाता है। ड्राइवर को कोई अन्य वित्तीय या व्यक्तिगत जानकारी नहीं दी जाती।"
                        : "The assigned chauffeur receives only operational essentials (passenger name, pickup time, and pickup address) on the day of travel. No financial or historical data is accessible."}
                    </li>
                    <li>
                      <strong>{isHi ? "सुरक्षित भुगतान गेटवे:" : "Secure Payment Gateways:"}</strong>{" "}
                      {isHi
                        ? "अग्रिम भुगतान आरबीआई (RBI) द्वारा अधिकृत सुरक्षित बैंकिंग गेटवे व यूपीआई चैनलों द्वारा 256-बिट एन्क्रिप्शन के साथ संसाधित होते हैं। हम कभी भी आपके क्रेडिट/डेबिट कार्ड का सीवीवी या पासवर्ड संग्रहीत नहीं करते।"
                        : "Advance transactions are processed through RBI-authorized payment aggregators with 256-bit SSL encryption. We never capture or store credit/debit card numbers or CVV codes."}
                    </li>
                    <li>
                      <strong>{isHi ? "कानूनी अनिवार्यता (न्यायिक आदेश):" : "Statutory Judicial Compliance:"}</strong>{" "}
                      {isHi
                        ? "केवल तब जब भारत की किसी अधिकृत अदालत, पुलिस या सरकारी प्राधिकरण द्वारा वैध कानूनी वारंट के तहत जानकारी मांगी जाए।"
                        : "Exclusively when legally compelled by a valid warrant, subpoena, or statutory order issued by an authorized Indian court or law enforcement agency."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 04: Chauffeur Communication Protocol */}
              <section id="chauffeur-protocol" className="terms-clause">
                <div className="terms-clause__num">04</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "ड्राइवर आचार संहिता व गोपनीयता नियम"
                      : "Chauffeur Privacy Protocol & Non-Disclosure"}
                  </h2>
                  <p>
                    {isHi
                      ? "हमारी फ्लीट के सभी ड्राइवर पुलिस-सत्यापित (Police-Verified) हैं और सख्त गोपनीयता अनुबंध से बंधे हैं:"
                      : "Every chauffeur operating under the SK Baghel banner is police-verified and bound by strict professional privacy obligations:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "यात्रा उपरांत संपर्क निषेध:" : "No Post-Trip Contact:"}</strong>{" "}
                      {isHi
                        ? "यात्रा समाप्त होने के बाद ड्राइवरों को यात्रियों को व्यक्तिगत रूप से कॉल या मैसेज करने की सख्त मनाही है। किसी भी शिकायत या फॉलो-अप के लिए हमारे 24×7 कंट्रोल रूम से संपर्क किया जाता है।"
                        : "Chauffeurs are strictly forbidden from contacting passengers personally via phone, SMS, or social media once a journey concludes. All customer care is routed through our central desk."}
                    </li>
                    <li>
                      <strong>{isHi ? "गोपनीय बातचीत का सम्मान:" : "In-Cab Confidentiality:"}</strong>{" "}
                      {isHi
                        ? "वाहन के भीतर यात्रियों की व्यक्तिगत या व्यावसायिक बातचीत का पूर्ण सम्मान किया जाता है। ड्राइवर अनुशासन और सौम्य आचरण का पालन करते हैं।"
                        : "Chauffeurs maintain complete discretion regarding private or business conversations conducted inside the cabin during travel."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 05: Data Retention & Your Legal Rights */}
              <section id="retention-rights" className="terms-clause">
                <div className="terms-clause__num">05</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "डेटा संग्रहण अवधि व आपके कानूनी अधिकार"
                      : "Data Retention Period & Passenger Erasure Rights"}
                  </h2>
                  <p>
                    {isHi
                      ? "भारतीय कानून और उपभोक्ता अधिकारों के तहत आपको अपने डेटा पर पूर्ण नियंत्रण प्राप्त है:"
                      : "Under the Digital Personal Data Protection Act 2023, you maintain complete rights over your personal data:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "डेटा संग्रहण की अवधि:" : "Retention Duration:"}</strong>{" "}
                      {isHi
                        ? "बुकिंग रिकॉर्ड भारतीय जीएसटी और वित्तीय नियमों के अनुसार 7 वर्षों तक टैक्स ऑडिट के लिए सुरक्षित रखे जाते हैं। इसके बाद गैर-आवश्यक डेटा स्थायी रूप से नष्ट कर दिया जाता है।"
                        : "Tax-compliant invoicing records are retained for the statutory 7-year audit period mandated under Indian GST legislation. Non-essential operational records are routinely purged."}
                    </li>
                    <li>
                      <strong>{isHi ? "डेटा देखने व सुधारने का अधिकार:" : "Right to Access & Rectify:"}</strong>{" "}
                      {isHi
                        ? "आप किसी भी समय अपने संग्रहीत विवरण की समीक्षा करने या उसमें सुधार कराने के लिए अनुरोध कर सकते हैं।"
                        : "You may request an electronic copy of your stored booking data or update incorrect contact information at any time."}
                    </li>
                    <li>
                      <strong>{isHi ? "स्थायी रूप से मिटाने का अधिकार (Right to Erasure):" : "Right to Erasure / Deletion:"}</strong>{" "}
                      {isHi
                        ? "यदि आप चाहते हैं कि आपका गैर-वित्तीय डेटा हमारे सिस्टम से हटा दिया जाए, तो privacy@skbagheltravels.in पर ईमेल करें। हमारा कंट्रोल रूम 48 घंटे में कार्रवाई करेगा।"
                        : "You have the statutory right to request permanent deletion of non-tax operational data. Simply email privacy@skbagheltravels.in for processing within 48 hours."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 06: Cookies & Client-Side Local Storage */}
              <section id="cookies-storage" className="terms-clause">
                <div className="terms-clause__num">06</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "कुकीज व लोकल स्टोरेज — शून्य विज्ञापन ट्रैकिंग"
                      : "Cookies & Local Storage — Zero Ad Tracking"}
                  </h2>
                  <p>
                    {isHi
                      ? "हमारी वेबसाइट अत्यंत आधुनिक और निजता-केंद्रित (Privacy-First) आर्किटेक्चर पर बनी है। हम किसी भी आक्रामक विज्ञापन ट्रैकिंग कुकी का उपयोग नहीं करते:"
                      : "Our digital web application is engineered on a clean, privacy-first static frontend. We deploy zero intrusive third-party cross-site ad trackers:"}
                  </p>
                  <ul className="terms-list">
                    <li>
                      <strong>{isHi ? "कार्यात्मक लोकल स्टोरेज (Functional Storage):" : "Functional Local Preferences:"}</strong>{" "}
                      {isHi
                        ? "हम केवल आपकी भाषा पसंद (अंग्रेजी / हिंदी), थीम चयन (क्लीन व्हाइट / सोलर डस्क), और बुकिंग फॉर्म का ड्राफ्ट सुरक्षित रखने के लिए ब्राउज़र के लोकल स्टोरेज का उपयोग करते हैं।"
                        : "We store only essential functional state: your language preference (EN/HI), theme preference (Clean White vs. Solar Dusk), and in-progress booking drafts (`skb-booking`)."}
                    </li>
                    <li>
                      <strong>{isHi ? "थर्ड-पार्टी विज्ञापनों का पूर्ण अभाव:" : "No Third-Party Ad Networks:"}</strong>{" "}
                      {isHi
                        ? "हमारी वेबसाइट पर गूगल एडसेंस, फेसबुक पिक्सल या अनचाहे रीमार्केटिंग कोड नहीं हैं। आपका ब्राउज़िंग अनुभव पूरी तरह निजी और सुरक्षित है।"
                        : "We do not host Google AdSense banners, invasive tracking pixels, or remarketing beacons. Your visit remains private and untracked across the web."}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Clause 07: Grievance Redressal & Data Protection Officer */}
              <section id="grievance-dpo" className="terms-clause">
                <div className="terms-clause__num">07</div>
                <div className="terms-clause__content">
                  <h2>
                    {isHi
                      ? "शिकायत निवारण अधिकारी व डेटा संरक्षण संपर्क"
                      : "Data Protection Officer & Grievance Redressal"}
                  </h2>
                  <p>
                    {isHi
                      ? "डीपीडीपी अधिनियम 2023 के अनुपालन में, यदि आपके पास गोपनीयता नीति या व्यक्तिगत डेटा के संबंध में कोई प्रश्न या शिकायत है, तो हमारे नियुक्त शिकायत निवारण अधिकारी से संपर्क करें:"
                      : "In compliance with Section 10 of India's DPDP Act 2023, our designated Data Protection & Grievance Officer is accessible for any inquiries, access requests, or privacy concerns:"}
                  </p>

                  <div className="terms-legal-box">
                    <p><strong>{isHi ? "डेटा संरक्षण अधिकारी (DPO):" : "Data Protection Officer:"}</strong> S.K. Baghel (Managing Director)</p>
                    <p><strong>{isHi ? "पंजीकृत इकाई:" : "Commercial Entity:"}</strong> S.K. Baghel Tour & Travels (Regd.)</p>
                    <p><strong>{isHi ? "कार्यालय का पता:" : "Office Address:"}</strong> Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001, India</p>
                    <p><strong>{isHi ? "समर्पित गोपनीयता ईमेल:" : "Privacy Email:"}</strong> privacy@skbagheltravels.in</p>
                    <p><strong>{isHi ? "24×7 कंट्रोल रूम फोन:" : "Dispatch Phone:"}</strong> {contact.phoneDisplay}</p>
                    <p><strong>{isHi ? "निवारण समय सीमा:" : "Resolution SLA:"}</strong> {isHi ? "प्राप्ति के 48 घंटे के भीतर उत्तर" : "Formal response within 48 business hours"}</p>
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
                {isHi ? "सुरक्षित व गोपनीय" : "Safe & Private"}
              </span>
              <h2 className="cta-banner-title">
                {isHi
                  ? "विश्वास और सुरक्षा के साथ आगरा कैब बुक करें।"
                  : "Book with Complete Confidence & Guaranteed Data Privacy."}
              </h2>
              <p className="cta-banner-desc">
                {isHi
                  ? "पारदर्शी मूल्य, स्वच्छ गाड़ियाँ, शून्य स्पैम और 24×7 व्यक्तिगत सहायता। कूपन ASTTCAR500OFF के साथ ₹500 की छूट पाएं।"
                  : "Zero spam, zero surge pricing, and 45-minute replacement guarantee. Use coupon ASTTCAR500OFF for ₹500 off your outstation ride."}
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
                    ? "नमस्ते! मुझे सुरक्षित कैब बुकिंग के लिए सहायता चाहिए।"
                    : "Hello SK Baghel Travels, I would like to book a cab with verified privacy."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline"
              >
                <span>{isHi ? "व्हाट्सएप चैट" : "WhatsApp Desk"}</span>
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
