/**
 * RouteDetailPage — Dynamic Route Landing Template (Step R5.21)
 *
 * High-converting, SEO-optimized bilingual landing template for all 8 route pairs featuring:
 * 1. Semantic Breadcrumbs & Highway Hero with route stats & distance pill
 * 2. MakeMyTrip-style 5-Vehicle Fare Comparison Matrix (Sedan, Ertiga, Innova, Tempo, Urbania)
 * 3. 4-Card Highway Intelligence & Road Advisory Bento (Highway, Timing, Rest Stops, Tolls)
 * 4. En-Route Sightseeing & Stopovers Showcase
 * 5. Route-Specific 6-Item Bilingual FAQ Accordion (ARIA 1.2 accessible)
 * 6. 24×7 Local Dispatch Desk CTA Banner (Call, WhatsApp, Online Booking)
 * 7. Schema.org JSON-LD graph (TaxiService, BreadcrumbList, FAQPage, LocalBusiness)
 */

import React, { useState } from "react";
import { contact } from "../data/contact";
import {
  type Route,
  vehicles,
  routeGuidance,
  type VehicleId,
} from "../data/catalogue";

interface RouteDetailPageProps {
  language: "en" | "hi";
  route: Route;
}

const CITY_NAMES_HI: Record<string, string> = {
  agra: "आगरा",
  delhi: "दिल्ली",
  jaipur: "जयपुर",
  mathura: "मथुरा",
  gwalior: "ग्वालियर",
  lucknow: "लखनऊ",
};

export function RouteDetailPage({ language, route }: RouteDetailPageProps) {
  const isHi = language === "hi";
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const fromEn = route.from.charAt(0).toUpperCase() + route.from.slice(1);
  const toEn = route.to.charAt(0).toUpperCase() + route.to.slice(1);
  const fromHi = CITY_NAMES_HI[route.from] || fromEn;
  const toHi = CITY_NAMES_HI[route.to] || toEn;

  const isLocal = route.kind === "local";
  const routeGuidanceData = routeGuidance[route.id] || {
    highway: "National Highway / State Corridor",
    transitTime: `${route.duration} (${route.km} km)`,
    departureTip: {
      en: "Early morning or mid-day departures are ideal to avoid peak city rush hours.",
      hi: "शहर के पीक ट्रैफिक से बचने के लिए सुबह जल्दी या दोपहर में प्रस्थान करना उत्तम है।",
    },
    restStops: {
      en: "Verified highway food courts with hygienic washrooms and branded eateries.",
      hi: "स्वच्छ वॉशरूम और भोजन सुविधा वाले प्रमाणित हाईवे रेस्टोरेंट।",
    },
    tollTaxPolicy: {
      en: "One-way booking includes highway tolls. Round-trip subject to standard outstation rules.",
      hi: "वन-वे बुकिंग में हाईवे टोल शामिल है। राउंड-ट्रिप मानक आउटस्टेशन नियमानुसार।",
    },
  };

  const routeTitle = isLocal
    ? isHi
      ? "आगरा लोकल दर्शन व दर्शनीय टैक्सी सेवा"
      : "Agra Sightseeing & Heritage City Cab Service"
    : isHi
      ? `${fromHi} से ${toHi} टैक्सी सेवा — निश्चित ऑल-इनक्लूसिव किराया`
      : `${fromEn} to ${toEn} Taxi Service — Fixed All-Inclusive Cabs`;

  const canonicalUrl = `https://skbagheltravels.in/${language}/${
    isLocal
      ? isHi
        ? "agra-darshan-taxi"
        : "agra-sightseeing-taxi"
      : isHi
        ? `${route.from}-se-${route.to}-taxi`
        : `${route.from}-to-${route.to}-taxi`
  }/`;

  // Route-Specific FAQs
  const faqs = [
    {
      qEn: `Are expressway toll taxes and driver allowances included in the ${fromEn} to ${toEn} one-way fare?`,
      qHi: `क्या ${fromHi} से ${toHi} वन-वे किराये में एक्सप्रेसवे टोल टैक्स और ड्राइवर भत्ता शामिल हैं?`,
      aEn: `Yes, 100%! All published one-way fares for the ${fromEn} to ${toEn} route are all-inclusive. Yamuna Expressway or national highway tolls, state entry permits for one-way transfers, and driver allowances are bundled upfront with strictly zero hidden surcharges.`,
      aHi: `हाँ, बिल्कुल! ${fromHi} से ${toHi} रूट के लिए सभी प्रकाशित वन-वे किराये 100% ऑल-इनक्लूसिव हैं। इसमें एक्सप्रेसवे टोल, स्टेट टैक्स और ड्राइवर भत्ता पहले से शामिल हैं — यात्रा के दौरान कोई छुपा हुआ चार्ज नहीं लिया जाता।`,
    },
    {
      qEn: `Can the chauffeur stop for food, coffee, or a sightseeing monument on the way from ${fromEn} to ${toEn}?`,
      qHi: `क्या ${fromHi} से ${toHi} रास्ते में ड्राइवर भोजन, कॉफी या किसी स्मारक पर गाड़ी रोक सकते हैं?`,
      aEn: `Certainly. Our chauffeur will happily pause at sanitized wayside plazas (such as Haldiram's, Costa Coffee, or McDonald's) for breakfast, tea, or restroom breaks. En-route heritage stops (e.g., Fatehpur Sikri on the Jaipur route, or Mathura Vrindavan on the Delhi route) can be accommodated seamlessly.`,
      aHi: `हाँ, बिल्कुल। हमारे ड्राइवर रास्ते में स्वच्छ फूड प्लाजा (जैसे हल्दीराम, कोस्टा कॉफी) पर जलपान या वॉशरूम ब्रेक के लिए आसानी से रुकते हैं। रास्ते में पड़ने वाले दर्शनीय स्थलों (जैसे फतेहपुर सीकरी या मथुरा-वृंदावन) पर भी सुविधापूर्वक स्टॉप लिया जा सकता है।`,
    },
    {
      qEn: `What is the night driving allowance policy for late-night departures or early morning airport drops?`,
      qHi: `देर रात के प्रस्थान या तड़के एयरपोर्ट ड्रॉप के लिए नाइट ड्राइविंग चार्ज का क्या नियम है?`,
      aEn: `Per commercial transport norms, an outstation night allowance of ₹300 (for Sedans and Ertigas) or ₹500 (for Innova Crysta and Tempo Travellers) applies only if travel occurs between 22:00 (10:00 PM) and 05:00 (05:00 AM). Sunrise Taj Mahal departures are strictly exempt from night charges.`,
      aHi: `वाणिज्यिक नियमों के अनुसार, रात्रि 10:00 बजे से सुबह 05:00 बजे के बीच यात्रा करने पर ₹300 (सेडान/अर्टिगा) या ₹500 (इनोवा/टेम्पो ट्रैवलर) का नाइट अलाउंस लगता है। सूर्योदय ताज महल टूर पर यह पूरी तरह मुफ्त है।`,
    },
    {
      qEn: `What happens if my train or flight is delayed before pickup in ${fromEn}?`,
      qHi: `यदि ${fromHi} में पिकअप से पहले मेरी ट्रेन या फ्लाइट लेट हो जाती है तो क्या होगा?`,
      aEn: `We provide free flight and train tracking! Provide your flight number or train PNR when booking, and your chauffeur will adjust their arrival time automatically. We include up to 60 minutes of complimentary waiting at airport terminals and railway stations.`,
      aHi: `हम फ्लाइट व ट्रेन का लाइव स्टेटस ट्रैक करते हैं! बुकिंग के समय अपनी ट्रेन या फ्लाइट नंबर दर्ज करें। एयरपोर्ट व रेलवे स्टेशन पर 60 मिनट तक का वेटिंग समय पूरी तरह निःशुल्क रहता है।`,
    },
    {
      qEn: `What is your cancellation and refund policy if my ${fromEn} to ${toEn} travel schedule changes?`,
      qHi: `यदि मेरा यात्रा कार्यक्रम बदल जाए तो कैंसिलेशन और रिफंड की क्या नीति है?`,
      aEn: `Enjoy complete peace of mind with our 24-Hour Cab Cancellation Policy: If you cancel 24 hours or more before scheduled pickup, you receive a 100% full refund with zero cancellation fee, credited back within 5 to 7 business days.`,
      aHi: `हमारी 24 घंटे की कैब कैंसिलेशन नीति के तहत, यदि आप निर्धारित समय से 24 घंटे पहले बुकिंग रद्द करते हैं, तो आपको बिना किसी कटौती के 100% पूरा रिफंड 5 से 7 कार्यदिवसों में वापस मिल जाता है।`,
    },
    {
      qEn: `What emergency breakdown replacement guarantee do you provide along the highway?`,
      qHi: `हाईवे पर गाड़ी में खराबी आने पर क्या इमरजेंसी रिप्लेसमेंट गारंटी उपलब्ध है?`,
      aEn: `We operate a 45-Minute Emergency Vehicle Replacement Guarantee along the Yamuna Expressway and Agra highway corridors. Our dispatch control center continuously monitors vehicles, and a backup commercial cab will be deployed immediately if required.`,
      aHi: `यमुना एक्सप्रेसवे व प्रमुख हाईवे कॉरिडोर पर हम 45-मिनट की इमरजेंसी गाड़ी रिप्लेसमेंट गारंटी देते हैं। किसी भी तकनीकी खराबी की स्थिति में हमारा 24×7 कंट्रोल रूम तुरंत बैकअप गाड़ी भेजता है।`,
    },
  ];

  // Stopover recommendations
  const stopovers = isLocal
    ? [
        {
          icon: "🕌",
          titleEn: "Taj Mahal (East Gate)",
          titleHi: "ताज महल (ईस्ट गेट)",
          descEn: "Marvel at pristine white marble in the soft golden light of sunrise.",
          descHi: "सूर्योदय की सुनहरी रोशनी में विश्व प्रसिद्ध संगमरमरी ताज का दीदार करें।",
        },
        {
          icon: "🏰",
          titleEn: "Agra Fort & Diwan-i-Khas",
          titleHi: "आगरा किला व दीवान-ए-खास",
          descEn: "Explore the red sandstone imperial citadel of the Mughal Emperors.",
          descHi: "मुगल सम्राटों के भव्य लाल बलुआ पत्थर के ऐतिहासिक किले का भ्रमण करें।",
        },
        {
          icon: "🌅",
          titleEn: "Mehtab Bagh Sunset",
          titleHi: "मेहताब बाग सूर्यास्त",
          descEn: "Witness the silhouette of the Taj Mahal across the sacred Yamuna river.",
          descHi: "यमुना नदी के पार से ताज महल के भव्य सूर्यास्त का मनमोहक नजारा देखें।",
        },
      ]
    : route.id.includes("jaipur")
      ? [
          {
            icon: "🏛️",
            titleEn: "Fatehpur Sikri UNESCO Citadel",
            titleHi: "फतेहपुर सीकरी विश्व धरोहर",
            descEn: "Optional 90-minute stop at Emperor Akbar's ghost capital and Buland Darwaza.",
            descHi: "सम्राट अकबर की ऐतिहासिक राजधानी और बुलंद दरवाजे पर 90 मिनट का स्टॉप लें।",
          },
          {
            icon: "🦚",
            titleEn: "Bharatpur Bird Sanctuary",
            titleHi: "केवलादेव राष्ट्रीय पक्षी अभयारण्य",
            descEn: "A paradise for migratory birds and nature lovers midway along NH-21.",
            descHi: "हाईवे पर स्थित विश्व प्रसिद्ध पक्षी अभयारण्य जहाँ दुर्लभ विदेशी पक्षी आते हैं।",
          },
          {
            icon: "🏰",
            titleEn: "Abhaneri Stepwell (Chand Baori)",
            titleHi: "आभानेरी चाँद बावड़ी",
            descEn: "One of the world's deepest and most visually stunning geometric stepwells.",
            descHi: "संसार की सबसे गहरी और ज्यामितीय सुंदरता वाली 8वीं शताब्दी की ऐतिहासिक बावड़ी।",
          },
        ]
      : route.id.includes("mathura")
        ? [
            {
              icon: "🛕",
              titleEn: "Krishna Janmabhoomi Mathura",
              titleHi: "श्री कृष्ण जन्मभूमि मथुरा",
              descEn: "Sacred birth temple of Lord Krishna located on the historic NH-19 corridor.",
              descHi: "भगवान श्री कृष्ण की पावन जन्मस्थली व प्राचीन मंदिर परिसर के दर्शन।",
            },
            {
              icon: "✨",
              titleEn: "Prem Mandir Vrindavan",
              titleHi: "प्रेम मंदिर वृंदावन",
              descEn: "Stunning Italian white marble temple renowned for its evening laser light show.",
              descHi: "इतालवी सफेद संगमरमर से निर्मित भव्य मंदिर और शाम का मनमोहक प्रकाश दृश्य।",
            },
            {
              icon: "🌊",
              titleEn: "Yamuna Vishram Ghat",
              titleHi: "विश्राम घाट व यमुना आरती",
              descEn: "Peaceful boat rides and evening devotional aarti on the banks of Yamuna.",
              descHi: "यमुना नदी के तट पर शाम की पावन आरती और शांत नौकायन का आनंद।",
            },
          ]
        : route.id.includes("gwalior")
          ? [
              {
                icon: "🐊",
                titleEn: "Chambal River Safari",
                titleHi: "राष्ट्रीय चंबल घड़ियाल अभयारण्य",
                descEn: "Scenic river crossing home to gharials, marsh crocodiles, and rare dolphins.",
                descHi: "चंबल नदी के स्वच्छ पानी में घड़ियाल, मगरमच्छ और दुर्लभ डॉल्फ़िन देखें।",
              },
              {
                icon: "🍬",
                titleEn: "Morena Gajak Hub",
                titleHi: "मुरैना की प्रसिद्ध गज़क",
                descEn: "Authentic sesame and jaggery delicacies freshly made at roadside dhabas.",
                descHi: "सर्दियों की प्रसिद्ध शुद्ध तिल-गुड़ की पारंपरिक मुरैना गज़क का स्वाद लें।",
              },
              {
                icon: "🏰",
                titleEn: "Gwalior Fort & Man Singh Palace",
                titleHi: "ग्वालियर दुर्ग व मान सिंह महल",
                descEn: "The pearl of Indian fortresses rising majestically over the sandstone cliff.",
                descHi: "पहाड़ी की चोटी पर स्थित अभेद्य ग्वालियर किला और प्राचीन नक्काशीदार महल।",
              },
            ]
          : route.id.includes("lucknow")
            ? [
                {
                  icon: "💎",
                  titleEn: "Firozabad Glass Bazaars",
                  titleHi: "फिरोजाबाद सुहागनगरी व ग्लास हब",
                  descEn: "India's celebrated glass-blowing and crystal chandelier center along the expressway.",
                  descHi: "भारत का सुप्रसिद्ध चूड़ी व कांच हस्तशिल्प बाजार एक्सप्रेसवे के समीप।",
                },
                {
                  icon: "🌸",
                  titleEn: "Kannauj Perfume Capital",
                  titleHi: "कन्नौज इत्र की नगरी",
                  descEn: "Century-old artisanal rose and soil attar distilleries near the wayside plaza.",
                  descHi: "प्राचीन मिट्टी व गुलाब के प्राकृतिक इत्र बनाने की पारंपरिक भट्टियाँ।",
                },
                {
                  icon: "✈️",
                  titleEn: "Expressway Air Strip Stretch",
                  titleHi: "एक्सप्रेसवे फाइटर जेट हवाई पट्टी",
                  descEn: "Famous 3.5 km reinforced roadway designed as an emergency fighter jet landing strip.",
                  descHi: "भारतीय वायुसेना के लड़ाकू विमानों की इमरजेंसी लैंडिंग के लिए निर्मित विशेष पट्टी।",
                },
              ]
            : [
                {
                  icon: "🛣️",
                  titleEn: "Yamuna Expressway 6-Lane Cruise",
                  titleHi: "यमुना एक्सप्रेसवे 6-लेन सुगम यात्रा",
                  descEn: "Smooth 165 km concrete access-controlled speedway with 100 km/h cruising.",
                  descHi: "165 किमी लंबा कंक्रीट हाईवे जहाँ 100 किमी/घंटा की गति से सुगम सफर होता है।",
                },
                {
                  icon: "☕",
                  titleEn: "Tappal & Jewar Food Courts",
                  titleHi: "टप्पल व जेवर आधुनिक फूड प्लाजा",
                  descEn: "Haldiram's, Costa Coffee, Subway, and sanitised restrooms at KM 64 and KM 118.",
                  descHi: "किमी 64 और 118 पर हल्दीराम, सबवे, कोस्टा कॉफी व स्वच्छ विश्राम गृह।",
                },
                {
                  icon: "🛡️",
                  titleEn: "24×7 Highway Patrol & Safety",
                  titleHi: "24×7 हाईवे पेट्रोल व सुरक्षा",
                  descEn: "Speed cameras, SOS call boxes every 2 km, and 45-minute breakdown replacement.",
                  descHi: "प्रत्येक 2 किमी पर इमरजेंसी बूथ, आधुनिक कैमरे और 45-मिनट रिप्लेसमेंट गारंटी।",
                },
              ];

  // Schema.org JSON-LD
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TaxiService",
        "@id": `${canonicalUrl}#service`,
        "url": canonicalUrl,
        "name": routeTitle,
        "description": isHi
          ? `${fromHi} से ${toHi} तक वातानुकूलित टैक्सी सेवा। एक्सप्रेसवे टोल सहित, शून्य सर्ज प्राइसिंग, ₹${route.fares.sedan} से शुरू।`
          : `Chauffeur-driven private taxi from ${fromEn} to ${toEn}. Toll included, zero surge pricing, fares starting at ₹${route.fares.sedan}.`,
        "provider": {
          "@type": "LocalBusiness",
          "name": "SK Baghel Tour & Travels",
          "telephone": contact.phone,
          "email": contact.email,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Near Taj East Gate Road, Taj Ganj",
            "addressLocality": "Agra",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "282001",
            "addressCountry": "IN",
          },
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": route.fares.sedan,
          "availability": "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": isHi ? "होम" : "Home",
            "item": `https://skbagheltravels.in/${language}/`,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": isHi ? "रूट्स" : "Routes",
            "item": `https://skbagheltravels.in/${language}/routes/`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": isLocal ? (isHi ? "आगरा दर्शन" : "Agra Sightseeing") : `${fromEn} to ${toEn}`,
            "item": canonicalUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        "mainEntity": faqs.map((f) => ({
          "@type": "Question",
          "name": isHi ? f.qHi : f.qEn,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": isHi ? f.aHi : f.aEn,
          },
        })),
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
          "addressCountry": "IN",
        },
      },
    ],
  };

  return (
    <main id="main-content" className="route-detail-page">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Hero Section */}
      <section className="page-hero route-detail-hero">
        <div className="container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <a href={`/${language}/`}>{isHi ? "होम" : "Home"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item">
                <a href={`/${language}/routes/`}>{isHi ? "रूट्स" : "Routes"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item breadcrumb-item--active" aria-current="page">
                {isLocal ? (isHi ? "आगरा दर्शन टैक्सी" : "Agra Sightseeing Taxi") : `${fromEn} → ${toEn}`}
              </li>
            </ol>
          </nav>

          <div className="page-hero__badge">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {route.duration} • {route.km} KM • {routeGuidanceData.highway}
            </span>
          </div>

          <h1 className="page-hero__title">
            {isLocal ? (
              isHi ? (
                <>
                  आगरा लोकल दर्शन टैक्सी —<br />
                  <i>₹{route.fares.sedan.toLocaleString("en-IN")} से 8 घंटे / 80 किमी दर्शनीय यात्रा</i>
                </>
              ) : (
                <>
                  Agra Sightseeing Cab Service —<br />
                  <i>8 Hours / 80 KM Private Heritage Tour from ₹{route.fares.sedan.toLocaleString("en-IN")}</i>
                </>
              )
            ) : isHi ? (
              <>
                {fromHi} से {toHi} टैक्सी सेवा —<br />
                <i>₹{route.fares.sedan.toLocaleString("en-IN")} से निश्चित ऑल-इनक्लूसिव किराया</i>
              </>
            ) : (
              <>
                {fromEn} to {toEn} Taxi Service —<br />
                <i>Fixed All-Inclusive Fares from ₹{route.fares.sedan.toLocaleString("en-IN")}</i>
              </>
            )}
          </h1>

          <p className="page-hero__lead">
            {isHi
              ? `निजी वातानुकूलित कैब, सत्यापित स्थानीय ड्राइवर, 100% ऑल-इनक्लूसिव एक्सप्रेसवे टोल और घर से पिकअप सुविधा। कोई सर्ज प्राइसिंग नहीं और 45-मिनट रिप्लेसमेंट गारंटी।`
              : `Private sanitized cabs with 100% upfront toll transparency, zero surge pricing, verified English/Hindi-speaking chauffeurs, and door-to-door pickup across ${fromEn} and ${toEn}.`}
          </p>

          <div className="hero-cta-buttons">
            <a href={`/book.html?route=${route.id}`} className="button button-gold">
              <span>{isHi ? "यह रूट बुक करें" : "Book This Route Now"}</span>
              <span aria-hidden="true">↗</span>
            </a>

            <a href={`tel:${contact.phone}`} className="button button-secondary">
              <span>{isHi ? "कॉल करें: " + contact.phoneDisplay : "Call " + contact.phoneDisplay}</span>
              <span aria-hidden="true">📞</span>
            </a>

            <a
              href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                isHi
                  ? `नमस्ते! मुझे ${fromHi} से ${toHi} टैक्सी बुकिंग के लिए किराया कोटेशन चाहिए।`
                  : `Hello SK Baghel Travels, I would like a quote for ${fromEn} to ${toEn} taxi.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-outline"
            >
              <span>{isHi ? "व्हाट्सएप कोट" : "WhatsApp Quote"}</span>
              <span aria-hidden="true">💬</span>
            </a>
          </div>
        </div>
      </section>

      {/* Vehicle Comparison Matrix Section */}
      <section className="route-matrix-section">
        <div className="container">
          <div className="section-header-compact">
            <span className="section-kicker">
              {isHi ? "पारदर्शी किराया सारणी" : "TRANSPARENT TARIFF MATRIX"}
            </span>
            <h2 className="section-title">
              {isHi
                ? "अपनी यात्रा के लिए उपयुक्त गाड़ी चुनें"
                : "Compare Vehicles for This Journey"}
            </h2>
            <p className="section-subtitle">
              {isHi
                ? "सभी किराये एक्सप्रेसवे टोल, ड्राइवर भत्ता व जीएसटी इनवॉइस सुविधा सहित हैं।"
                : "All one-way tariffs include highway tolls, fuel, chauffeur allowances, and complimentary waiting."}
            </p>

            {/* Inclusions Pill Bar */}
            <div className="matrix-inclusions-bar">
              <span className="inclusion-chip">✓ {isHi ? "एक्सप्रेसवे टोल शामिल" : "Highway Tolls Included"}</span>
              <span className="inclusion-chip">✓ {isHi ? "ड्राइवर भत्ता शामिल" : "Chauffeur Allowance Included"}</span>
              <span className="inclusion-chip">✓ {isHi ? "शून्य सर्ज चार्ज" : "Zero Surge Pricing"}</span>
              <span className="inclusion-chip">✓ {isHi ? "जीएसटी इनवॉइस उपलब्ध" : "GST Invoice Available"}</span>
              <span className="inclusion-chip">✓ {isHi ? "24 घंटे में मुफ्त कैंसिलेशन" : "24-Hr Free Cancellation"}</span>
            </div>
          </div>

          {/* 5 Vehicle Cards Grid */}
          <div className="route-vehicles-grid">
            {vehicles.map((v) => {
              const fare = route.fares[v.id];
              const isPopular = v.id === "sedan" || v.id === "innova";

              return (
                <div
                  key={v.id}
                  className={`route-vehicle-card ${isPopular ? "route-vehicle-card--popular" : ""}`}
                >
                  {isPopular && (
                    <div className="vehicle-badge-popular">
                      {v.id === "sedan"
                        ? isHi ? "सर्वश्रेष्ठ बजट" : "Best Value"
                        : isHi ? "सर्वाधिक लोकप्रिय" : "Most Popular"}
                    </div>
                  )}

                  <div className="vehicle-card-top">
                    <div className="vehicle-icon-circle" aria-hidden="true">
                      {v.id === "sedan" ? "🚗" : v.id === "ertiga" ? "🚙" : v.id === "innova" ? "🚐" : "🚌"}
                    </div>
                    <div>
                      <span className="vehicle-class-tag">{v.klass}</span>
                      <h3 className="vehicle-name">{v.name}</h3>
                    </div>
                  </div>

                  <p className="vehicle-models-text">
                    {v.models.slice(0, 2).join(" • ")}
                  </p>

                  <div className="vehicle-specs-row">
                    <span className="spec-pill">👥 {v.seats} {isHi ? "सीटें" : "Seats"}</span>
                    <span className="spec-pill">🧳 {v.bags} {isHi ? "बैग" : "Bags"}</span>
                    <span className="spec-pill">❄️ {isHi ? "एसी" : "Dual AC"}</span>
                  </div>

                  <div className="vehicle-fare-block">
                    <div className="fare-label">{isHi ? "निश्चित वन-वे किराया" : "Fixed One-Way Fare"}</div>
                    <div className="fare-amount">
                      ₹{fare.toLocaleString("en-IN")}
                    </div>
                    <div className="fare-subtext">
                      {isLocal
                        ? isHi ? "8 घंटे / 80 किमी पैकेज" : "8h / 80km package"
                        : isHi ? `बेस दर: ₹${v.perKm}/किमी` : `Base: ₹${v.perKm}/km`}
                    </div>
                  </div>

                  <a
                    href={`/book.html?route=${route.id}&vehicle=${v.id}`}
                    className={`button ${isPopular ? "button-gold" : "button-outline"} vehicle-book-btn`}
                  >
                    <span>{isHi ? `${v.name} चुनें` : `Select ${v.name}`}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highway Intelligence & Advisory Bento Section */}
      <section className="route-advisory-section">
        <div className="container">
          <div className="section-header-compact">
            <span className="section-kicker">
              {isHi ? "हाईवे गाइडेंस व यात्रा सलाह" : "HIGHWAY INTELLIGENCE"}
            </span>
            <h2 className="section-title">
              {isHi
                ? `${fromHi} ⇄ ${toHi} मार्ग से जुड़ी महत्वपूर्ण जानकारी`
                : `Travel Advisory for ${fromEn} ⇄ ${toEn}`}
            </h2>
            <p className="section-subtitle">
              {isHi
                ? "स्थानीय ज्ञान, सड़क की स्थिति और समय की बचत के लिए व्यावहारिक सुझाव।"
                : "Real highway conditions, optimal transit timings, and vetted pitstops."}
            </p>
          </div>

          <div className="route-advisory-grid">
            {/* Card 1: Highway Profile */}
            <div className="advisory-bento-card">
              <div className="advisory-card-header">
                <span className="advisory-icon" aria-hidden="true">🛣️</span>
                <span className="advisory-tag">{isHi ? "सड़क विनिर्देश" : "Highway Profile"}</span>
              </div>
              <h3>{routeGuidanceData.highway}</h3>
              <p>
                {isHi
                  ? `दूरी: ${route.km} किमी • औसत समय: ${route.duration}। उच्च गति एक्सप्रेसवे जहाँ 100 किमी/घंटा की निर्बाध गति रहती है। FASTag टोल स्वचालित रूप से निष्पादित होता है।`
                  : `Distance: ${route.km} km • Estimated transit time: ${route.duration}. Access-controlled corridor built for continuous 100–120 km/h cruising with automated FASTag lanes.`}
              </p>
            </div>

            {/* Card 2: Timing Advisory */}
            <div className="advisory-bento-card">
              <div className="advisory-card-header">
                <span className="advisory-icon" aria-hidden="true">⏱️</span>
                <span className="advisory-tag">{isHi ? "प्रस्थान समय" : "Optimal Timing"}</span>
              </div>
              <h3>{isHi ? "सुझाया गया प्रस्थान समय" : "Recommended Departure Window"}</h3>
              <p>
                {isHi
                  ? routeGuidanceData.departureTip.hi
                  : routeGuidanceData.departureTip.en}
              </p>
            </div>

            {/* Card 3: Rest Stops */}
            <div className="advisory-bento-card">
              <div className="advisory-card-header">
                <span className="advisory-icon" aria-hidden="true">☕</span>
                <span className="advisory-tag">{isHi ? "विश्राम स्थल" : "Pitstops & Dining"}</span>
              </div>
              <h3>{isHi ? "प्रमाणित फूड कोर्ट व स्वच्छ वॉशरूम" : "Vetted Rest Areas & Food Plazas"}</h3>
              <p>
                {isHi
                  ? routeGuidanceData.restStops.hi
                  : routeGuidanceData.restStops.en}
              </p>
            </div>

            {/* Card 4: Tolls & Night Allowances */}
            <div className="advisory-bento-card">
              <div className="advisory-card-header">
                <span className="advisory-icon" aria-hidden="true">🎫</span>
                <span className="advisory-tag">{isHi ? "टोल व कर नियम" : "Tolls & Tax Clarity"}</span>
              </div>
              <h3>{isHi ? "100% पारदर्शी टोल व नियम" : "Tolls, Taxes & Night Surcharges"}</h3>
              <p>
                {isHi
                  ? `${routeGuidanceData.tollTaxPolicy.hi} रात्रि 10:00 से सुबह 05:00 के बीच ₹300/₹500 नाइट चार्ज लागू होता है।`
                  : `${routeGuidanceData.tollTaxPolicy.en} Night driving allowance of ₹300/₹500 applies only between 22:00 and 05:00.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* En-Route Sightseeing & Highlights Section */}
      <section className="route-stopovers-section">
        <div className="container">
          <div className="section-header-compact">
            <span className="section-kicker">
              {isHi ? "रास्ते के दर्शनीय स्थल" : "EN-ROUTE HIGHLIGHTS"}
            </span>
            <h2 className="section-title">
              {isHi
                ? "यात्रा के दौरान लोकप्रिय स्टॉपओवर विकल्प"
                : "Popular En-Route Sightseeing & Stopovers"}
            </h2>
            <p className="section-subtitle">
              {isHi
                ? "हमारी निजी कैब में आप रास्ते के प्रसिद्ध स्मारकों और मंदिरों के दर्शन का अनुरोध कर सकते हैं।"
                : "Customize your private road journey with scenic detours and heritage stopovers."}
            </p>
          </div>

          <div className="stopovers-grid">
            {stopovers.map((s, idx) => (
              <div key={idx} className="stopover-card">
                <div className="stopover-icon" aria-hidden="true">{s.icon}</div>
                <h3>{isHi ? s.titleHi : s.titleEn}</h3>
                <p>{isHi ? s.descHi : s.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Route-Specific FAQs Section */}
      <section className="route-faqs-section">
        <div className="container">
          <div className="section-header-compact">
            <span className="section-kicker">
              {isHi ? "अक्सर पूछे जाने वाले सवाल" : "ROUTE FAQS"}
            </span>
            <h2 className="section-title">
              {isHi
                ? `${fromHi} से ${toHi} टैक्सी से जुड़े सामान्य प्रश्न`
                : `Frequently Asked Questions for ${fromEn} to ${toEn}`}
            </h2>
          </div>

          <div className="route-faqs-accordion">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  className={`route-faq-item ${isOpen ? "route-faq-item--open" : ""}`}
                >
                  <button
                    type="button"
                    className="route-faq-question-btn"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{isHi ? item.qHi : item.qEn}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="route-faq-answer">
                      <p>{isHi ? item.aHi : item.aEn}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conversion CTA Banner Strip */}
      <section className="route-cta-strip">
        <div className="container">
          <div className="cta-banner-box">
            <div className="cta-banner-content">
              <span className="cta-banner-tag">
                {isHi ? "निश्चित व सुरक्षित" : "Fixed & Reliable"}
              </span>
              <h2 className="cta-banner-title">
                {isHi
                  ? `अपनी ${fromHi} ⇄ ${toHi} यात्रा को अभी सुरक्षित करें।`
                  : `Reserve Your ${fromEn} ⇄ ${toEn} Private Cab Today.`}
              </h2>
              <p className="cta-banner-desc">
                {isHi
                  ? "पारदर्शी मूल्य, शून्य सर्ज, 45-मिनट रिप्लेसमेंट बैकअप और 24×7 व्यक्तिगत सहायता। कूपन ASTTCAR500OFF के साथ ₹500 की छूट पाएं।"
                  : "Transparent fares, zero surge pricing, 45-minute breakdown replacement guarantee, and 24×7 chauffeur support. Use coupon ASTTCAR500OFF for ₹500 discount."}
              </p>
            </div>

            <div className="cta-banner-buttons">
              <a href={`/book.html?route=${route.id}`} className="button button-gold">
                <span>{isHi ? "ऑनलाइन बुक करें" : "Book Cab Online"}</span>
                <span aria-hidden="true">↗</span>
              </a>

              <a href={`tel:${contact.phone}`} className="button button-secondary">
                <span>{isHi ? "कॉल करें: " + contact.phoneDisplay : "Call " + contact.phoneDisplay}</span>
                <span aria-hidden="true">📞</span>
              </a>

              <a
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                  isHi
                    ? `नमस्ते! मुझे ${fromHi} से ${toHi} टैक्सी बुकिंग के लिए तुरंत सहायता चाहिए।`
                    : `Hello SK Baghel Travels, I would like to book a cab for ${fromEn} to ${toEn}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline"
              >
                <span>{isHi ? "व्हाट्सएप चैट" : "WhatsApp Desk"}</span>
                <span aria-hidden="true">💬</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
