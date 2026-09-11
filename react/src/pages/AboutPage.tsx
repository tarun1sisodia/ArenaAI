import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

interface AboutPageProps {
  language?: SupportedLanguage;
}

interface AboutFaq {
  q: { en: string; hi: string };
  a: { en: string; hi: string };
}

const ABOUT_FAQS: AboutFaq[] = [
  {
    q: {
      en: "How long has SK Baghel Tour & Travels been operating in Agra?",
      hi: "एस के बघेल टूर एंड ट्रेवल्स आगरा में कितने वर्षों से कार्यरत है?",
    },
    a: {
      en: "SK Baghel Tour & Travels was established in 2009 in Taj Ganj, Agra. Over the past 15+ years, we have grown from a boutique local service with two cabs to a trusted regional fleet managing airport transfers, outstation expressway corridors, and curated Golden Triangle tours with over 35,000 completed journeys.",
      hi: "एस के बघेल टूर एंड ट्रेवल्स की स्थापना वर्ष 2009 में ताजगंज, आगरा में हुई थी। पिछले 15 से अधिक वर्षों में हमने 2 गाड़ियों से शुरुआत करके आज 35,000 से अधिक सफल यात्राओं, एयरपोर्ट ट्रांसफर और गोल्डन ट्रायंगल टूर का भरोसेमंद नेटवर्क स्थापित किया है।",
    },
  },
  {
    q: {
      en: "Where is your physical office located in Agra?",
      hi: "आगरा में आपका मुख्य कार्यालय कहाँ स्थित है?",
    },
    a: {
      en: "Our primary operational headquarters is located on Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001 (just minutes from the Taj Mahal East Gate). Travelers are always welcome to visit our desk for itinerary planning, vehicle inspection, or face-to-face travel consultations.",
      hi: "हमारा मुख्य कार्यालय ताज ईस्ट गेट रोड, ताजगंज, आगरा (उत्तर प्रदेश 282001) में ताजमहल के पूर्वी द्वार के निकट स्थित है। यात्री यात्रा योजना, गाड़ी देखने या व्यक्तिगत परामर्श के लिए हमारे कार्यालय में सीधे आ सकते हैं।",
    },
  },
  {
    q: {
      en: "How do you vet and select your chauffeurs?",
      hi: "आप अपने ड्राइवरों का सत्यापन और चयन कैसे करते हैं?",
    },
    a: {
      en: "Every driver on our roster undergoes thorough police background verification, holds a valid commercial passenger transport badge, and has a minimum of 7+ years of driving experience across the Yamuna Expressway, Rajasthan highways, and hill corridors. We strictly enforce a non-smoking cabin policy and courteous, professional conduct.",
      hi: "हमारी टीम के प्रत्येक ड्राइवर का पुलिस सत्यापन होता है, उनके पास वैध कमर्शियल ड्राइविंग लाइसेंस और यमुना एक्सप्रेसवे व राष्ट्रीय राजमार्गों पर न्यूनतम 7+ वर्षों का ड्राइविंग अनुभव होता है। हमारी गाड़ियों में धूम्रपान निषेध और यात्रियों से शालीन व्यवहार अनिवार्य है।",
    },
  },
  {
    q: {
      en: "Do your chauffeurs take tourists to commission shopping stores?",
      hi: "क्या आपके ड्राइवर पर्यटकों को जबरन कमीशन की दुकानों पर ले जाते हैं?",
    },
    a: {
      en: "Strictly NO. We have a zero-tolerance policy against commercial shopping kickbacks, high-pressure marble souvenir traps, or forced restaurant detours. Our drivers are compensated fairly and instructed to follow only the guest's chosen itinerary and preferred halts.",
      hi: "बिल्कुल नहीं। हमारी कंपनी कमीशन की दुकानों, जबरन मार्बल या पेठा की दुकानों पर रुकने के सख्त खिलाफ है। हमारे ड्राइवरों को केवल वही स्टॉप लेने के निर्देश हैं जो यात्री अपनी इच्छा से चुनते हैं।",
    },
  },
  {
    q: {
      en: "Are all vehicles registered commercially with valid passenger insurance?",
      hi: "क्या आपकी सभी गाड़ियाँ कमर्शियल नंबर प्लेट व यात्री बीमा युक्त हैं?",
    },
    a: {
      en: "Yes, 100%. We operate strictly with yellow-plate commercial tourist vehicles registered under the Regional Transport Authority (RTO) with up-to-date fitness certificates, comprehensive passenger insurance, and valid All-India Tourist Permits (AITP). We never deploy illegal private white-plate cars.",
      hi: "हाँ, शत-प्रतिशत। हमारे सभी वाहन आरटीओ द्वारा अनुमोदित पीली कमर्शियल नंबर प्लेट, फिटनेस सर्टिफिकेट, ऑल-इंडिया टूरिस्ट परमिट और पूर्ण यात्री बीमा से सुरक्षित हैं। हम कभी भी अनधिकृत निजी सफेद प्लेट गाड़ियों का उपयोग नहीं करते।",
    },
  },
  {
    q: {
      en: "Can your team organize customized multi-day circuits across Rajasthan and North India?",
      hi: "क्या आपकी टीम राजस्थान व उत्तर भारत के लिए मनपसंद मल्टी-डे टूर प्लान कर सकती है?",
    },
    a: {
      en: "Absolutely. In addition to Agra local sightseeing, we specialize in tailor-made Golden Triangle circuits (Delhi–Agra–Jaipur), Mathura-Vrindavan spiritual yatras, Gwalior-Khajuraho heritage routes, and Ranthambore wildlife safaris with dedicated vehicles and experienced chauffeurs.",
      hi: "हाँ, बिल्कुल। आगरा दर्शन के अलावा हम दिल्ली-आगरा-जयपुर गोल्डन ट्रायंगल, मथुरा-वृंदावन तीर्थ यात्रा, ग्वालियर-ओरछा-खजुराहो हेरिटेज सर्किट और रणथंभौर सफारी के लिए विशेष रूप से अनुकूलित निजी वाहन उपलब्ध कराते हैं।",
    },
  },
];

export function AboutPage({ language = "en" }: AboutPageProps) {
  const isHindi = language === "hi";
  const activeLanguage = isHindi ? "hi" : "en";
  const langPrefix = isHindi ? "/hi" : "/en";

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Structured Data (Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://skbagheltravels.in/#organization",
        name: "SK Baghel Tour & Travels",
        alternateName: "SK Baghel Taxi Service Agra",
        telephone: contact.phone,
        email: contact.email,
        url: "https://skbagheltravels.in",
        foundingDate: "2009",
        founder: {
          "@type": "Person",
          name: "S.K. Baghel",
          jobTitle: "Founder & Managing Director",
        },
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
        priceRange: "₹₹",
        openingHours: "Mo-Su 00:00-24:00",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "3800",
          bestRating: "5",
          worstRating: "1",
        },
      },
      {
        "@type": "AboutPage",
        "@id": `https://skbagheltravels.in${langPrefix}/about/#webpage`,
        url: `https://skbagheltravels.in${langPrefix}/about/`,
        name: isHindi
          ? "हमारे बारे में — एस के बघेल टूर एंड ट्रेवल्स आगरा"
          : "About Us — SK Baghel Tour & Travels Agra",
        description: isHindi
          ? "15+ वर्षों का अनुभव, स्थानीय ताजगंज आगरा मुख्यालय, सत्यापित ड्राइवर और पारदर्शी कैब सेवा।"
          : "Founded in Taj Ganj, Agra in 2009. 15+ years of trusted outstation taxi and tour services.",
        breadcrumb: {
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
              name: isHindi ? "हमारे बारे में" : "About Us",
              item: `https://skbagheltravels.in${langPrefix}/about/`,
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: ABOUT_FAQS.map((faq) => ({
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
    <main id="main-content" className="about-hub-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Header */}
      <header className="about-hub-hero">
        <div className="container">
          <p className="eyebrow">
            {isHindi
              ? "स्थानीय अनुभव एवं प्रामाणिक सेवा • 2009 से"
              : "LOCAL HERITAGE & ETHICAL TRAVEL • SINCE 2009"}
          </p>
          <h1>
            {isHindi ? (
              <>
                ताजगंज, आगरा से शुरू हुआ सफर,
                <br />
                <i>सच्चाई, सुरक्षा और भरोसे की मिसाल।</i>
              </>
            ) : (
              <>
                Born in Taj Ganj, Agra,
                <br />
                <i>built on trust, safety, and honest travel.</i>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {isHindi
              ? "पिछले 15 वर्षों में 35,000 से अधिक सफल यात्राओं और 3,800+ 5-स्टार समीक्षाओं के साथ — हम पर्यटकों को कमीशन के चक्कर और छुपे किरायों से बचाकर परिवार जैसा आरामदायक सफर प्रदान करते हैं।"
              : "For over 15 years, we have guided travelers across Agra, the Yamuna Expressway, and the Golden Triangle. No hidden fees, no tourist shopping traps — just dependable vehicles, verified local chauffeurs, and genuine hospitality."}
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#founder-message">
              {isHindi ? "संस्थापक संदेश पढ़ें ↓" : "Founder's Message ↓"}
            </a>
            <a className="button button-outline" href="#company-pillars">
              {isHindi ? "हमारे सिद्धांत" : "Core Values & Pillars"}
            </a>
            <a className="button button-outline" href={`tel:${contact.phone}`}>
              {contact.phoneDisplay}
            </a>
          </div>

          {/* Key Trust Numbers Bento Grid */}
          <div className="about-stats-bento">
            <div className="about-stat-tile">
              <strong className="stat-number">15+</strong>
              <span className="stat-label">
                {isHindi ? "वर्षों का अनुभव (स्थापना 2009)" : "Years Operating Heritage (Est. 2009)"}
              </span>
            </div>
            <div className="about-stat-tile">
              <strong className="stat-number">35,000+</strong>
              <span className="stat-label">
                {isHindi ? "सफल यात्राएं व खुशहाल यात्री" : "Completed Tours & Transfers"}
              </span>
            </div>
            <div className="about-stat-tile">
              <strong className="stat-number">4.9 ★</strong>
              <span className="stat-label">
                {isHindi ? "3,800+ गूगल समीक्षाएं" : "3,800+ Verified 5-Star Reviews"}
              </span>
            </div>
            <div className="about-stat-tile">
              <strong className="stat-number">100%</strong>
              <span className="stat-label">
                {isHindi ? "कमर्शियल पीली प्लेट गाड़ियां" : "Commercial RTO Yellow-Plate Fleet"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Founder & Managing Director's Message */}
      <section
        id="founder-message"
        className="home-section founder-section"
        aria-labelledby="founder-heading"
      >
        <div className="container">
          <div className="founder-card">
            <div className="founder-card-quote-mark" aria-hidden="true">
              “
            </div>
            <div className="founder-card-content">
              <span className="founder-eyebrow">
                {isHindi ? "संस्थापक का संदेश" : "MESSAGE FROM OUR FOUNDER"}
              </span>
              <h2 id="founder-heading">
                {isHindi ? (
                  <>
                    "पर्यटक केवल ग्राहक नहीं,
                    <br />
                    <i>हमारे शहर के सम्मानीय अतिथि हैं।"</i>
                  </>
                ) : (
                  <>
                    "Travelers are not just customers,
                    <br />
                    <i>they are revered guests of our city."</i>
                  </>
                )}
              </h2>

              <div className="founder-letter">
                {isHindi ? (
                  <>
                    <p>
                      जब मैंने 2009 में आगरा में पहली बार पर्यटकों को ताजमहल ले जाना शुरू किया, तो मैंने अक्सर देखा कि दूर-दराज और विदेशों से आए यात्रियों को अनिश्चित किराये, अनपेक्षित कमीशन दुकानों और असंवेदनशील ड्राइवरों के कारण असुविधा होती थी।
                    </p>
                    <p>
                      मैंने एस के बघेल टूर एंड ट्रेवल्स की नींव एक बहुत ही सरल सिद्धांत पर रखी: <strong>हर यात्री के साथ अपने परिवार जैसा व्यवहार करना।</strong> हम बुकिंग के समय ही टोल, टैक्स और पार्किंग सहित अंतिम किराया बताते हैं, केवल पुलिस-सत्यापित और विनम्र ड्राइवरों को ही सेवा में लगाते हैं, और किसी भी प्रकार की कमीशन दुकानों पर समय बर्बाद नहीं करते।
                    </p>
                    <p>
                      आज 15 साल बाद भी, हमारे कार्यालय का हर सदस्य इसी ईमानदारी के साथ काम करता है। चाहे आप दिल्ली एयरपोर्ट से आधी रात में आ रहे हों या सूर्योदय के समय ताजमहल का दर्शन कर रहे हों — आपकी सुरक्षा और सुविधा हमारी व्यक्तिगत जिम्मेदारी है।
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      When I first began driving travelers around Agra in 2009, I saw firsthand how frequently visitors were burdened by hidden expressway surcharges, aggressive touts, and forced detours into overpriced commission emporiums.
                    </p>
                    <p>
                      I founded SK Baghel Tour & Travels on one simple, unbreakable pledge: <strong>treat every traveler like our own family.</strong> We quote transparent all-inclusive fares upfront, assign only background-verified chauffeurs who take genuine pride in their hospitality, and maintain a strict zero-tolerance policy against commercial shopping kickbacks.
                    </p>
                    <p>
                      Fifteen years later, whether we are dispatching a midnight pickup from Delhi IGI Airport or driving a family to the Taj Mahal at dawn, our commitment remains unchanged: punctual service, spotless cars, and honest local guidance you can trust.
                    </p>
                  </>
                )}
              </div>

              <div className="founder-signature-block">
                <div className="founder-details">
                  <strong className="founder-name">S.K. Baghel</strong>
                  <span className="founder-title">
                    {isHindi
                      ? "संस्थापक एवं प्रबंध निदेशक • एस के बघेल टूर एंड ट्रेवल्स"
                      : "Founder & Managing Director • SK Baghel Tour & Travels"}
                  </span>
                  <span className="founder-meta">
                    📍 Taj Ganj, Agra · Registered Commercial Transporter
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Operational Pillars */}
      <section
        id="company-pillars"
        className="home-section about-pillars-section"
        aria-labelledby="pillars-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "हमारे मूल सिद्धांत" : "Ethical Operating Pillars"}
              </p>
              <h2 id="pillars-heading">
                {isHindi ? (
                  <>
                    हम दूसरों से अलग क्यों हैं,
                    <br />
                    <i>हमारे 4 अटूट सेवा मानक।</i>
                  </>
                ) : (
                  <>
                    Why travelers trust us,
                    <br />
                    <i>our 4 non-negotiable operational commitments.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="pillars-grid">
            <div className="pillar-tile">
              <span className="pillar-badge">01</span>
              <h3>
                {isHindi ? "शून्य कमीशन व पारदर्शी यात्रा" : "Zero Commission Shopping Traps"}
              </h3>
              <p>
                {isHindi
                  ? "हम अपने ड्राइवरों को किसी भी मार्बल, कालीन या हस्तशिल्प की कमीशन दुकानों पर रुकने की सख्त मनाही करते हैं। आपका कीमती समय केवल दर्शनीय स्थलों के आनंद के लिए है।"
                  : "We strictly prohibit commission-based stops at overpriced souvenir marble or carpet shops. Your time in Agra belongs exclusively to sightseeing and relaxed exploration."}
              </p>
            </div>

            <div className="pillar-tile">
              <span className="pillar-badge">02</span>
              <h3>
                {isHindi ? "सत्यापित एवं संस्कारित ड्राइवर" : "Police-Verified Highway Chauffeurs"}
              </h3>
              <p>
                {isHindi
                  ? "हमारी फ्लीट के सभी ड्राइवरों का पुलिस रिकॉर्ड सत्यापित होता है। वे न्यूनतम 7+ वर्षों के अनुभवी, गैर-धूम्रपान करने वाले और शालीन व्यवहार वाले पेशेवर हैं।"
                  : "Every chauffeur holds a clean police record, valid commercial tourist badge, and minimum 7+ years of expressway and heritage driving experience. Courteous, punctual, and non-smoking."}
              </p>
            </div>

            <div className="pillar-tile">
              <span className="pillar-badge">03</span>
              <h3>
                {isHindi ? "साफ-सुथरी व सुरक्षित गाड़ियां" : "Spotless Fleet & Full Passenger Insurance"}
              </h3>
              <p>
                {isHindi
                  ? "प्रत्येक यात्रा से पूर्व अंदरूनी वैक्यूम क्लीनिंग, कार्यशील डुअल एसी की जांच, और केवल पीली प्लेट कमर्शियल आरटीओ परमिट वाले वाहनों का संचालन।"
                  : "Every vehicle is sanitized before pickup, features powerful dual air conditioning, and carries comprehensive commercial passenger insurance and All-India Tourist Permits."}
              </p>
            </div>

            <div className="pillar-tile">
              <span className="pillar-badge">04</span>
              <h3>
                {isHindi ? "100% स्पष्ट व पूर्व-निर्धारित किराया" : "Transparent Upfront Pricing"}
              </h3>
              <p>
                {isHindi
                  ? "यमुना एक्सप्रेसवे टोल, राज्य बॉर्डर टैक्स और ड्राइवर भत्ता पहले से स्पष्ट किया जाता है। यात्रा समाप्त होने पर कोई भी अप्रत्याशित अतिरिक्त शुल्क नहीं मांगा जाता।"
                  : "Yamuna Expressway tolls, state border permits, and chauffeur charges are stated upfront. No sudden hidden surcharges or post-trip fuel renegotiations."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Journey Milestones Timeline */}
      <section
        className="home-section about-timeline-section"
        aria-labelledby="timeline-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "हमारी विकास यात्रा" : "Company Heritage & Milestones"}
              </p>
              <h2 id="timeline-heading">
                {isHindi ? (
                  <>
                    2009 से 2024 तक का सफर,
                    <br />
                    <i>निरंतर विश्वास और सेवा विस्तार।</i>
                  </>
                ) : (
                  <>
                    From two cabs to a trusted fleet,
                    <br />
                    <i>15 years of continuous growth & reliability.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="timeline-cards-track">
            {/* 2009 */}
            <div className="timeline-event-card">
              <span className="timeline-year">2009</span>
              <h3 className="timeline-event-title">
                {isHindi ? "ताजगंज में स्थापना" : "Humble Beginnings in Taj Ganj"}
              </h3>
              <p className="timeline-event-desc">
                {isHindi
                  ? "आगरा कैंट स्टेशन और ताजगंज होटलों के लिए 2 सेडान कारों के साथ स्थानीय टैक्सी सेवा की शुरुआत की गई।"
                  : "Launched operations with two chauffeured sedans serving railway passengers at Agra Cantt and hotel guests in Taj Ganj."}
              </p>
            </div>

            {/* 2014 */}
            <div className="timeline-event-card">
              <span className="timeline-year">2014</span>
              <h3 className="timeline-event-title">
                {isHindi ? "यमुना एक्सप्रेसवे कॉरिडोर विस्तार" : "Yamuna Expressway Corridor Launch"}
              </h3>
              <p className="timeline-event-desc">
                {isHindi
                  ? "यमुना एक्सप्रेसवे के खुलते ही आगरा-दिल्ली के बीच 3.5 घंटे के नॉन-स्टॉप सुरक्षित आउटस्टेशन ट्रांसफर की शुरुआत हुई।"
                  : "Pioneered fast door-to-door transfers connecting Delhi NCR to Agra in 3.5 hours following the Yamuna Expressway opening."}
              </p>
            </div>

            {/* 2019 */}
            <div className="timeline-event-card">
              <span className="timeline-year">2019</span>
              <h3 className="timeline-event-title">
                {isHindi ? "टेम्पो ट्रैवलर व लग्जरी ग्रुप फ्लीट" : "Tempo Traveller & Group Fleet"}
              </h3>
              <p className="timeline-event-desc">
                {isHindi
                  ? "पारिवारिक व कॉर्पोरेट समूहों के लिए 9 से 26 सीटर लग्जरी टेम्पो ट्रैवलर और गोल्डन ट्रायंगल टूर पैकेज जोड़े गए।"
                  : "Inducted executive 9–26 seater Tempo Travellers for extended family vacations, destination weddings, and Golden Triangle circuits."}
              </p>
            </div>

            {/* 2024 */}
            <div className="timeline-event-card">
              <span className="timeline-year">2024</span>
              <h3 className="timeline-event-title">
                {isHindi ? "35,000+ यात्राएं व 24×7 डिजिटल डेस्क" : "35,000+ Journeys & 24×7 Digital Desk"}
              </h3>
              <p className="timeline-event-desc">
                {isHindi
                  ? "35,000 से अधिक सफल यात्राओं और 3,800+ 5-स्टार रेटिंग के साथ आधुनिक 24×7 ऑनलाइन बुकिंग व सपोर्ट डेस्क की शुरुआत।"
                  : "Crossed 35,000 completed journeys with 3,800+ five-star reviews, offering round-the-clock digital assistance and transparent billing."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Agra Office & Dispatch Desk */}
      <section
        className="home-section about-office-section"
        aria-labelledby="office-heading"
      >
        <div className="container">
          <div className="office-card">
            <div className="office-content">
              <p className="eyebrow">
                {isHindi ? "हमारा स्थानीय मुख्यालय" : "Physical Office & Dispatch Center"}
              </p>
              <h2 id="office-heading">
                {isHindi ? (
                  <>
                    ताजमहल के पास,
                    <br />
                    <i>हमारा स्थानीय कार्यालय हमेशा आपकी सेवा में।</i>
                  </>
                ) : (
                  <>
                    Minutes from the Taj Mahal,
                    <br />
                    <i>our local operations desk is always open.</i>
                  </>
                )}
              </h2>
              <p className="office-desc">
                {isHindi
                  ? "हम कोई अज्ञात ऑनलाइन एग्रीगेटर नहीं हैं। हमारा कार्यालय ताजमहल के पूर्वी द्वार के निकट ताजगंज में स्थित है। हमारे पास अपनी स्वयं की फ्लीट, स्थानीय कर्मचारी और 24×7 आपातकालीन सहायता केंद्र उपलब्ध है।"
                  : "Unlike faceless app aggregators, SK Baghel Tour & Travels operates a permanent physical headquarters in Taj Ganj, Agra. Our local dispatch team is on duty 24 hours a day to assist with early-morning departures, hotel pickups, and airport transfers."}
              </p>

              <div className="office-nap-list">
                <div className="nap-row">
                  <span className="nap-icon">📍</span>
                  <div>
                    <strong>{isHindi ? "पता:" : "Address:"}</strong>
                    <span>{contact.address}</span>
                  </div>
                </div>
                <div className="nap-row">
                  <span className="nap-icon">📞</span>
                  <div>
                    <strong>{isHindi ? "हेल्पलाइन:" : "Helpline:"}</strong>
                    <a href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a>
                  </div>
                </div>
                <div className="nap-row">
                  <span className="nap-icon">💬</span>
                  <div>
                    <strong>{isHindi ? "व्हाट्सएप:" : "WhatsApp Desk:"}</strong>
                    <a
                      href={`https://wa.me/${contact.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      +91 98765 43210 (24×7 Active)
                    </a>
                  </div>
                </div>
                <div className="nap-row">
                  <span className="nap-icon">🕒</span>
                  <div>
                    <strong>{isHindi ? "कार्य समय:" : "Operating Hours:"}</strong>
                    <span>{contact.hours}</span>
                  </div>
                </div>
              </div>

              <div className="office-actions">
                <a
                  className="button button-primary"
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {isHindi ? "गूगल मैप्स पर देखें ↗" : "Get Directions on Google Maps ↗"}
                </a>
                <a className="button button-outline" href="/book.html">
                  {isHindi ? "ऑनलाइन कैब बुक करें ↗" : "Book Online ↗"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About FAQs Accordion */}
      <section
        className="home-section about-faq-section"
        aria-labelledby="about-faq-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "कंपनी एफएक्यू" : "Company & Credibility FAQs"}
              </p>
              <h2 id="about-faq-heading">
                {isHindi ? (
                  <>
                    हमारी कंपनी के बारे में जरूरी सवाल,
                    <br />
                    <i>प्रामाणिक जानकारी और सीधे जवाब।</i>
                  </>
                ) : (
                  <>
                    Questions travelers ask about us,
                    <br />
                    <i>transparent answers about our operations.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="about-faq-accordion">
            {ABOUT_FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  className={`about-faq-item ${isOpen ? "is-open" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="about-faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`about-faq-answer-${index}`}
                  >
                    <span>{item.q[activeLanguage]}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="about-faq-answer"
                      id={`about-faq-answer-${index}`}
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

      {/* Bottom 24x7 Dispatch Desk CTA */}
      <section className="container about-cta-container">
        <div className="about-cta-card">
          <div className="about-cta-content">
            <span className="about-cta-badge">24×7 LOCAL TRAVEL DESK</span>
            <h2>
              {isHindi
                ? "क्या आप आगरा यात्रा की योजना बना रहे हैं?"
                : "Planning a visit to Agra or an outstation tour?"}
            </h2>
            <p>
              {isHindi
                ? "हमारे स्थानीय कार्यालय से सीधे बात करें। कोई मध्यस्थ नहीं, कोई कमीशन नहीं — केवल पारदर्शी किराये और अनुभवी ड्राइवर।"
                : "Speak directly with our local tour coordinators in Taj Ganj, Agra. Direct chauffeur allocation, transparent pricing, and 24×7 customer support."}
            </p>
            <div className="about-cta-buttons">
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
