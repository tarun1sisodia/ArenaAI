import { useState } from "react";
import { AnalyticsBoard } from "../components/ui/AnalyticsBoard";
import { Icon, type IconName } from "../components/ui/Icon";
import { Reveal, Stagger, StaggerItem } from "../components/ui/motion";
import { Button } from "../components/ui/Button";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import {
  services,
  faqs,
  vehicles,
  petFriendlyService,
  cancellationPolicyCab,
  outstationRules,
  type Service,
} from "../data";

interface ServicesPageProps {
  language?: SupportedLanguage;
}

interface AllocationGuide {
  vehicleId: string;
  category: { en: string; hi: string };
  capacity: { en: string; hi: string };
  bestFor: { en: string; hi: string };
  pricing: { en: string; hi: string };
  badge: { en: string; hi: string };
}

const ALLOCATION_GUIDE: AllocationGuide[] = [
  {
    vehicleId: "sedan",
    category: { en: "Sedan (Dzire / Etios)", hi: "सेडान (डिजायर / इटिओस)" },
    capacity: { en: "4 Passengers · 2 Large Bags", hi: "4 यात्री · 2 बड़े बैग" },
    bestFor: {
      en: "Couples, solo executives, and day trips to Taj Mahal & Delhi Airport.",
      hi: "दंपति, एकल यात्री, ताज महल दर्शन और दिल्ली एयरपोर्ट ट्रांसफर के लिए उत्तम।"
    },
    pricing: { en: "₹10–₹12/km · Agra–Delhi from ₹3,499", hi: "₹10–₹12/किमी · आगरा-दिल्ली ₹3,499 से" },
    badge: { en: "Most Popular", hi: "सर्वाधिक लोकप्रिय" }
  },
  {
    vehicleId: "ertiga",
    category: { en: "Maruti Ertiga (MPV)", hi: "मारुति अर्टिगा (एमपीवी)" },
    capacity: { en: "6 Passengers · 3 Large Bags", hi: "6 यात्री · 3 बड़े बैग" },
    bestFor: {
      en: "Small families seeking budget-friendly extra seating without a large SUV.",
      hi: "छोटे परिवार जिन्हें बजट में अतिरिक्त सीट और सामान की जगह चाहिए।"
    },
    pricing: { en: "₹14–₹16/km · Agra–Delhi from ₹4,500", hi: "₹14–₹16/किमी · आगरा-दिल्ली ₹4,500 से" },
    badge: { en: "Family Value", hi: "फैमिली वैल्यू" }
  },
  {
    vehicleId: "innova",
    category: { en: "Toyota Innova Crysta", hi: "टोयोटा इनोवा क्रिस्टा" },
    capacity: { en: "6+1 Passengers · 4 Large Bags", hi: "6+1 यात्री · 4 बड़े बैग" },
    bestFor: {
      en: "Long highway runs (Jaipur, Delhi, Lucknow) with superior suspension for elders.",
      hi: "लंबे हाईवे सफर (जयपुर, दिल्ली, लखनऊ) और बुजुर्गों के लिए सर्वोत्तम आरामदायक सस्पेंशन।"
    },
    pricing: { en: "₹18–₹23/km · Agra–Delhi from ₹6,499", hi: "₹18–₹23/किमी · आगरा-दिल्ली ₹6,499 से" },
    badge: { en: "Executive Choice", hi: "प्रीमियम चॉइस" }
  },
  {
    vehicleId: "tempo",
    category: { en: "Tempo Traveller (12–26 Seater)", hi: "टेम्पो ट्रैवलर (12–26 सीटर)" },
    capacity: { en: "12 to 26 Passengers · Luggage Bay", hi: "12 से 26 यात्री · लगेज स्पेस" },
    bestFor: {
      en: "Large family weddings, Mathura pilgrimage groups, and corporate site visits.",
      hi: "बड़े परिवार, मथुरा-वृंदावन तीर्थ यात्रा और कॉर्पोरेट ग्रुप टूर के लिए आदर्श।"
    },
    pricing: { en: "₹26–₹36/km · Agra–Delhi from ₹9,500", hi: "₹26–₹36/किमी · आगरा-दिल्ली ₹9,500 से" },
    badge: { en: "Group Specialist", hi: "ग्रुप स्पेशलिस्ट" }
  },
  {
    vehicleId: "urbania",
    category: { en: "Force Urbania Luxury Van", hi: "फोर्स अर्बनिया लग्जरी वैन" },
    capacity: { en: "10–17 Reclining Seats · Dual AC", hi: "10–17 रिक्लाइनर सीटें · डुअल एसी" },
    bestFor: {
      en: "VIP delegations, foreign tourist groups, and luxury Golden Triangle tours.",
      hi: "वीआईपी मेहमान, विदेशी पर्यटक और आलीशान गोल्डन ट्रायंगल टूर।"
    },
    pricing: { en: "Custom Luxury Quote · Flat Day Rates", hi: "विशेष लग्जरी कोटेशन · फिक्स डे रेट्स" },
    badge: { en: "Ultra Luxury", hi: "अल्ट्रा लग्जरी" }
  }
];

const SERVICE_DETAILED_INFO: Record<
  string,
  {
    highlights: { en: string[]; hi: string[] };
    recommendedCars: string[];
    typicalRoutes: { en: string; hi: string };
  }
> = {
  oneway: {
    highlights: {
      en: [
        "100% all-inclusive expressway toll & state permit",
        "Zero return toll or empty-return charges",
        "Doorstep pickup anywhere in Agra / Delhi NCR",
        "Flight tracking for airport drops"
      ],
      hi: [
        "100% ऑल-इनक्लूसिव टोल व राज्य टैक्स",
        "कोई खाली वापसी या अतिरिक्त टोल शुल्क नहीं",
        "आगरा और दिल्ली एनसीआर में डोरस्टेप पिकअप",
        "एयरपोर्ट फ्लाइट लैंडिंग ट्रैकिंग"
      ]
    },
    recommendedCars: ["Sedan (Dzire)", "Innova Crysta", "Ertiga"],
    typicalRoutes: {
      en: "Agra to Delhi Airport, Agra to Jaipur, Agra to Noida / Gurgaon",
      hi: "आगरा से दिल्ली एयरपोर्ट, आगरा से जयपुर, आगरा से नोएडा / गुड़गांव"
    }
  },
  roundtrip: {
    highlights: {
      en: [
        "Standard 300 KM/day minimum billing benchmark",
        "Multi-day driver retention with verified background",
        "Complete flexibility for temple and heritage stopovers",
        "All-India tourist commercial permit"
      ],
      hi: [
        "मानक 300 किमी/दिन की न्यूनतम बिलिंग नीति",
        "सत्यापित ड्राइवर के साथ बहु-दिवसीय यात्रा",
        "मंदिरों व स्मारकों पर रुकने की पूरी स्वतंत्रता",
        "ऑल-इंडिया कमर्शियल टूरिस्ट परमिट"
      ]
    },
    recommendedCars: ["Innova Crysta", "Maruti Ertiga", "Tempo Traveller"],
    typicalRoutes: {
      en: "Golden Triangle (Delhi–Agra–Jaipur), Gwalior Fort, Ranthambore",
      hi: "गोल्डन ट्रायंगल (दिल्ली-आगरा-जयपुर), ग्वालियर किला, रणथंभौर"
    }
  },
  local: {
    highlights: {
      en: [
        "8 Hours / 80 KM or 12 Hours / 120 KM fixed packages",
        "Covers Taj Mahal, Agra Fort, Baby Taj & Mehtab Bagh sunset",
        "Chauffeurs know authorized ASI parking zones",
        "Air-conditioned waiting between monuments"
      ],
      hi: [
        "8 घंटे / 80 किमी अथवा 12 घंटे / 120 किमी फिक्स पैकेज",
        "ताज महल, आगरा किला, एत्मादुद्दौला व मेहताब बाग सूर्यास्त",
        "ड्राइवर को एएसआई अधिकृत पार्किंग की पूरी जानकारी",
        "स्मारकों के बीच वातानुकूलित कार में विश्राम"
      ]
    },
    recommendedCars: ["Sedan (Dzire)", "Ertiga", "Innova Crysta"],
    typicalRoutes: {
      en: "Agra Heritage Circuit, Fatehpur Sikri Day Trip, Local Markets",
      hi: "आगरा हेरिटेज सर्किट, फतेहपुर सीकरी डे ट्रिप, स्थानीय बाजार"
    }
  },
  airport: {
    highlights: {
      en: [
        "Real-time flight & train tracking for delayed arrivals",
        "60 minutes complimentary waiting at airport terminals",
        "Direct drop to Terminal 3 / Terminal 1 Delhi IGI",
        "Punctual pickups from Agra Cantt & Raja Ki Mandi stations"
      ],
      hi: [
        "फ्लाइट व ट्रेन समय की रियल-टाइम मॉनिटरिंग",
        "एयरपोर्ट टर्मिनल पर 60 मिनट निःशुल्क प्रतीक्षा",
        "दिल्ली आईजीआई टर्मिनल 3 / टर्मिनल 1 पर सीधा ड्रॉप",
        "आगरा कैंट व राजा की मंडी स्टेशन से समयबद्ध पिकअप"
      ]
    },
    recommendedCars: ["Sedan (Dzire)", "Innova Crysta", "Ertiga"],
    typicalRoutes: {
      en: "Delhi IGI T3 to Agra, Agra Cantt to Taj East Gate, Agra Airport drops",
      hi: "दिल्ली आईजीआई टी3 से आगरा, आगरा कैंट से ताज ईस्ट गेट, आगरा एयरपोर्ट"
    }
  },
  tempo: {
    highlights: {
      en: [
        "9, 12, 17, 20 & 26 seater configurations with pushback seats",
        "Individual AC vents and mobile charging points per row",
        "Dedicated rear luggage bay & roof carrier space",
        "Experienced highway drivers for hill and plains travel"
      ],
      hi: [
        "9, 12, 17, 20 व 26 सीटर पुशबैक लग्जरी सीटें",
        "हर पंक्ति में व्यक्तिगत एसी वेंट और चार्जिंग पॉइंट",
        "विशाल लगेज बूट और रूफ कैरियर की सुविधा",
        "पहाड़ी और मैदानी दोनों रास्तों के अनुभवी ड्राइवर"
      ]
    },
    recommendedCars: ["12 Seater Tempo", "17 Seater Tempo", "Force Urbania"],
    typicalRoutes: {
      en: "Agra to Mathura-Vrindavan, Rajasthan Circuits, Himachal Hill Tours",
      hi: "आगरा से मथुरा-वृंदावन, राजस्थान यात्रा, हिमाचल टूर"
    }
  },
  tours: {
    highlights: {
      en: [
        "Curated hour-by-hour itineraries designed around sunlight & aarti",
        "Transparent monument ticket and guide advice",
        "Verified clean vegetarian dining recommendations",
        "Pickup from Agra Cantt Gatimaan Express or hotel doorstep"
      ],
      hi: [
        "सूर्योदय और आरती के समय अनुसार योजनाबद्ध कार्यक्रम",
        "स्मारक टिकट और गाइड की निष्पक्ष सलाह",
        "स्वच्छ व विश्वसनीय भोजन स्थानों की जानकारी",
        "गतिमान एक्सप्रेस अथवा होटल से डोरस्टेप पिकअप"
      ]
    },
    recommendedCars: ["Innova Crysta", "Sedan", "Luxury Urbania"],
    typicalRoutes: {
      en: "Taj Sunrise Tour, Mathura-Vrindavan Darshan, Golden Triangle 4D/3N",
      hi: "ताज सूर्योदय टूर, मथुरा-वृंदावन दर्शन, 4-दिवसीय गोल्डन ट्रायंगल"
    }
  }
};

export function ServicesPage({ language }: ServicesPageProps) {
  const activeLanguage: SupportedLanguage =
    language ??
    (typeof window !== "undefined" && window.location.pathname.startsWith("/hi")
      ? "hi"
      : "en");

  const isHindi = activeLanguage === "hi";
  const langPrefix = isHindi ? "/hi" : "/en";

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const handleCopyCoupon = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(petFriendlyService.couponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 3000);
    }
  };

  // Structured Data Schema.org
  const servicesSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        "@id": "https://skbagheltravels.in/#business",
        name: "SK Baghel Tour & Travels",
        url: "https://skbagheltravels.in",
        telephone: contact.phone,
        email: contact.email,
        priceRange: "₹₹",
        areaServed: [
          "Agra",
          "Delhi",
          "Jaipur",
          "Mathura",
          "Gwalior",
          "Lucknow"
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Near Taj East Gate Road, Taj Ganj",
          addressLocality: "Agra",
          addressRegion: "Uttar Pradesh",
          postalCode: "282001",
          addressCountry: "IN"
        }
      },
      {
        "@type": "Service",
        "@id": `https://skbagheltravels.in${langPrefix}/services/#service`,
        name: isHindi ? "आगरा टैक्सी एवं टूर सेवाएं" : "Agra Taxi & Tour Services",
        provider: { "@id": "https://skbagheltravels.in/#business" },
        serviceType: "Taxi & Chauffeur Services",
        areaServed: { "@type": "City", name: "Agra" },
        description: isHindi
          ? "आगरा से वन-वे आउटस्टेशन कैब, राउंड-ट्रिप, आगरा दर्शन और टेम्पो ट्रैवलर रेंटल।"
          : "Professional chauffeured taxi services across Agra, outstation expressways, local sightseeing, and tempo travellers."
      },
      {
        "@type": "FAQPage",
        "@id": `https://skbagheltravels.in${langPrefix}/services/#faq`,
        mainEntity: faqs.slice(0, 6).map((faq) => ({
          "@type": "Question",
          name: faq.question[activeLanguage],
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer[activeLanguage]
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://skbagheltravels.in${langPrefix}/services/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isHindi ? "होम" : "Home",
            item: `https://skbagheltravels.in${isHindi ? "/hi/" : "/"}`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isHindi ? "सेवाएं" : "Services",
            item: `https://skbagheltravels.in${langPrefix}/services/`
          }
        ]
      }
    ]
  };

  return (
    <main id="main-content" className="services-hub-page">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />

      {/* Hero Section */}
      <header className="services-hub-hero">
        <div className="container">
          <p className="eyebrow">
            {isHindi
              ? "यात्रा सेवाएं · एस के बघेल टूर & ट्रेवल्स"
              : "Travel Services · SK Baghel Tour & Travels"}
          </p>
          <h1>
            {isHindi ? (
              <>
                आगरा एवं उत्तर भारत के लिए,
                <br />
                <i>विश्वसनीय और प्रीमियम कैब सेवाएं।</i>
              </>
            ) : (
              <>
                Chauffeured taxi services,
                <br />
                <i>tailored for northern India.</i>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {isHindi
              ? "ताजमहल के सूर्योदय से लेकर गोल्डन ट्रायंगल, एयरपोर्ट एक्सप्रेस और फैमिली टेम्पो ट्रैवलर तक — पारदर्शी और निश्चित किराये के साथ सुरक्षित यात्रा।"
              : "From dawn departures at the Taj Mahal to multi-city Golden Triangle journeys, airport express pickups, and group tempo travel — transparent fares with verified local drivers."}
          </p>
          <div className="hero-actions">
            <Button href={`tel:${contact.phone}`}>
              <Icon name="phone" size={17} />
              {isHindi
                ? `कॉल करें ${contact.phoneDisplay}`
                : `Call ${contact.phoneDisplay}`}
            </Button>
            <Button
              variant="outline"
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="whatsapp" size={17} />
              {isHindi ? "व्हाट्सएप सहायता" : "WhatsApp Desk"}
            </Button>
            <Button variant="outline" href="/book.html">
              <Icon name="arrow-up-right" size={17} />
              {isHindi ? "उपलब्धता जांचें" : "Check Availability"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main 6 Service Verticals Deep Dive */}
      <section
        className="home-section services-deep-section"
        aria-labelledby="all-services-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{isHindi ? "6 प्रमुख सेवाएं" : "6 Operational Verticals"}</p>
              <h2 id="all-services-heading">
                {isHindi ? (
                  <>
                    हर सफर के लिए सही वाहन,
                    <br />
                    <i>स्पष्ट और तय मूल्य।</i>
                  </>
                ) : (
                  <>
                    Every kind of journey,
                    <br />
                    <i>with clear upfront pricing.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <Stagger className="services-deep-grid" step={0.06}>
            {services.map((service: Service) => {
              const details = SERVICE_DETAILED_INFO[service.id];
              const variantClass = `service-deep-card--${service.variant}`;

              return (
                <StaggerItem
                  as="article"
                  className={`service-deep-card ${variantClass}`}
                  key={service.id}
                  id={service.id}
                >
                  <div className="service-deep-card-top">
                    <div className="service-deep-badge-row">
                      <span className="service-deep-index">{service.index}</span>
                      <span className="service-deep-title-tag">
                        {service.tags[0] ?? "PREMIUM"}
                      </span>
                    </div>
                    <h3>{service.title}</h3>
                    <p className="service-deep-desc">{service.body}</p>
                  </div>

                  {details && (
                    <div className="service-deep-highlights">
                      <h4>{isHindi ? "मुख्य विशेषताएं" : "Key Highlights"}</h4>
                      <ul>
                        {details.highlights[activeLanguage].map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {details && (
                    <div className="service-deep-meta-strip">
                      <div className="service-deep-meta-item">
                        <span className="meta-label">
                          {isHindi ? "उपयुक्त गाड़ियां:" : "Recommended Fleet:"}
                        </span>
                        <span className="meta-val">
                          {details.recommendedCars.join(" · ")}
                        </span>
                      </div>
                      <div className="service-deep-meta-item">
                        <span className="meta-label">
                          {isHindi ? "प्रमुख रूट्स:" : "Typical Routes:"}
                        </span>
                        <span className="meta-val">
                          {details.typicalRoutes[activeLanguage]}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="service-deep-footer">
                    <div className="service-deep-tags">
                      {service.tags.map((tag, tIdx) => (
                        <span className="service-pill" key={tIdx}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      className="button button-primary service-deep-cta"
                      href={`/book.html?service=${service.id}`}
                    >
                      <span>{isHindi ? "यह सेवा बुक करें" : "Book This Service"}</span>
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Service Coverage Analytics Board (motion.dev) */}
      <section
        className="home-section services-analytics-section"
        aria-labelledby="services-analytics-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "सेवा कवरेज बोर्ड" : "Service Coverage Board"}
              </p>
              <h2 id="services-analytics-heading">
                {isHindi ? (
                  <>
                    हमारे संचालन के आंकड़े,
                    <br />
                    <i>क्षमता, बेड़ा और राजमार्ग पहुंच।</i>
                  </>
                ) : (
                  <>
                    Our operating numbers,
                    <br />
                    <i>capacity, fleet depth and highway reach.</i>
                  </>
                )}
              </h2>
            </div>
            <a className="text-link" href={`${langPrefix}/routes/`}>
              {isHindi ? "सभी रूट्स देखें ↗" : "Browse all routes ↗"}
            </a>
          </div>

          <Reveal>
            <AnalyticsBoard
              title={isHindi ? "सेवा मिश्रण व बेड़ा क्षमता" : "Service mix & fleet capacity"}
              description={
                isHindi
                  ? "प्रतिदिन संभाली जाने वाली बुकिंग, उपलब्ध वाहन और कवर किए गए कॉरिडोर।"
                  : "Daily dispatch capacity, available vehicles and covered corridors across the network."
              }
              metrics={[
                {
                  id: "verticals",
                  label: isHindi ? "सेवा श्रेणियां" : "Service verticals",
                  value: services.length,
                  unit: isHindi ? "सेवाएं" : "verticals",
                  icon: "sparkle",
                  delta: isHindi ? "24×7 संचालन" : "24×7 dispatch",
                  deltaTone: "flat",
                },
                {
                  id: "fleet-size",
                  label: isHindi ? "बेड़े की श्रेणियां" : "Fleet categories",
                  value: vehicles.length,
                  unit: isHindi ? "श्रेणियां" : "classes",
                  icon: "car",
                  spark: [3, 3, 4, 4, 5, vehicles.length],
                },
                {
                  id: "seats",
                  label: isHindi ? "अधिकतम सीट क्षमता" : "Max seat capacity",
                  value: 26,
                  unit: isHindi ? "सीटें" : "seats",
                  icon: "users",
                  delta: isHindi ? "26 सीटर टेम्पो" : "26-seater Tempo",
                  deltaTone: "flat",
                },
                {
                  id: "cities",
                  label: isHindi ? "कवर किए शहर" : "Cities served",
                  value: 42,
                  unit: isHindi ? "शहर" : "cities",
                  icon: "map-pin",
                  delta: isHindi ? "5 राज्य" : "across 5 states",
                },
              ]}
              bars={ALLOCATION_GUIDE.map((guide, index) => ({
                id: guide.vehicleId,
                label: guide.category[activeLanguage],
                value: 5 - index,
                display: guide.capacity[activeLanguage],
                icon: (guide.vehicleId === "tempo" || guide.vehicleId === "urbania" ? "bus" : "car") as IconName,
                muted: index > 2,
              }))}
              barHeading={isHindi ? "वाहन आवंटन मार्गदर्शिका" : "Vehicle allocation guide"}
              footerNote={
                isHindi
                  ? "समूह आकार के अनुसार वाहन आवंटन; टोल व पार्किंग सहित दरें।"
                  : "Vehicles are assigned by group size. All quoted fares include tolls and monument parking."
              }
              legend={[
                { label: isHindi ? "प्राथमिक" : "Primary allocation" },
                { label: isHindi ? "वैकल्पिक" : "Alternate", muted: true },
              ]}
            />
          </Reveal>
        </div>
      </section>

      {/* Vehicle Allocation Advice Matrix */}
      <section
        className="home-section allocation-section"
        aria-labelledby="allocation-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "गाड़ी चयन मार्गदर्शिका" : "Fleet Allocation Advice"}
              </p>
              <h2 id="allocation-heading">
                {isHindi ? (
                  <>
                    अपनी यात्रा और समूह के अनुसार,
                    <br />
                    <i>सर्वोत्तम वाहन का चयन करें।</i>
                  </>
                ) : (
                  <>
                    Which vehicle should you book?
                    <br />
                    <i>Practical fleet selection guidance.</i>
                  </>
                )}
              </h2>
            </div>
            <a className="text-link" href={`${langPrefix}/fleet/`}>
              {isHindi ? "पूरी फ्लीट देखें ↗" : "Full fleet guide ↗"}
            </a>
          </div>

          <div className="allocation-grid">
            {ALLOCATION_GUIDE.map((guide) => (
              <div className="allocation-card" key={guide.vehicleId}>
                <div className="allocation-card-header">
                  <span className="allocation-badge">
                    {guide.badge[activeLanguage]}
                  </span>
                  <h3>{guide.category[activeLanguage]}</h3>
                </div>
                <div className="allocation-specs">
                  <span className="spec-pill">{guide.capacity[activeLanguage]}</span>
                </div>
                <p className="allocation-desc">{guide.bestFor[activeLanguage]}</p>
                <div className="allocation-footer">
                  <span className="allocation-price">
                    {guide.pricing[activeLanguage]}
                  </span>
                  <a
                    className="button button-outline"
                    href={`/book.html?vehicle=${guide.vehicleId}`}
                  >
                    {isHindi ? "बुक करें ↗" : "Select ↗"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pet-Friendly Travel Callout Banner */}
      <section className="container pet-banner-container" aria-label="Pet friendly travel">
        <div className="pet-banner">
          <div className="pet-banner-content">
            <span className="pet-banner-badge"><Icon name="paw" size={14} /> {isHindi ? "पेट फ्रेंडली यात्रा" : "PET FRIENDLY TRAVEL"}</span>
            <h2>{petFriendlyService.title[activeLanguage]}</h2>
            <p>{petFriendlyService.blurb[activeLanguage]}</p>
            <div className="pet-coupon-box">
              <span className="coupon-label">
                {isHindi ? "विशेष ऑफर कूपन:" : "Special Offer Coupon:"}
              </span>
              <code className="coupon-code">{petFriendlyService.couponCode}</code>
              <button
                type="button"
                className="button button-outline button-copy"
                onClick={handleCopyCoupon}
              >
                {copiedCoupon
                  ? isHindi
                    ? "कॉपी हो गया! ✓"
                    : "Copied! ✓"
                  : isHindi
                  ? "कूपन कॉपी करें"
                  : "Copy Code"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Transparency & Rules */}
      <section
        className="home-section transparency-section"
        aria-labelledby="transparency-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "किराया और नियम पारदर्शिता" : "Pricing Transparency"}
              </p>
              <h2 id="transparency-heading">
                {isHindi ? (
                  <>
                    शून्य छिपे शुल्क,
                    <br />
                    <i>100% स्पष्ट व्यावसायिक नियम।</i>
                  </>
                ) : (
                  <>
                    Zero hidden surcharges,
                    <br />
                    <i>clear commercial operating rules.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="transparency-grid">
            <div className="transparency-card">
              <div className="transparency-icon"><Icon name="info" size={20} /></div>
              <h3>{isHindi ? "ऑल-इनक्लूसिव वन-वे ड्रॉप" : "All-Inclusive One-Way"}</h3>
              <p>
                {isHindi
                  ? "आगरा-दिल्ली एक्सप्रेसवे (₹3,499) और आगरा-जयपुर किराए में यमुना एक्सप्रेसवे टोल, स्टेट एंट्री टैक्स और ड्राइवर शुल्क पहले से शामिल हैं। कोई वापसी टोल नहीं लिया जाता।"
                  : "Our fixed one-way drops (Agra to Delhi ₹3,499) include all expressway tolls, state permits, and driver charges. Never pay empty return tolls."}
              </p>
            </div>

            <div className="transparency-card">
              <div className="transparency-icon"><Icon name="gauge" size={20} /></div>
              <h3>{isHindi ? "300 किमी/दिन का आउटस्टेशन मानक" : "300 KM/Day Outstation Rule"}</h3>
              <p>
                {isHindi
                  ? "मल्टी-डे आउटस्टेशन टूर के लिए न्यूनतम 300 किमी प्रति कैलेंडर दिवस का मानक उद्योग नियम लागू होता है। वास्तविक दूरी अधिक होने पर प्रति-किमी दर से गणना होती है।"
                  : `Outstation round trips follow the standard benchmark of minimum ${outstationRules.minKmPerDay} km per calendar day, or the base round-trip formula.`}
              </p>
            </div>

            <div className="transparency-card">
              <div className="transparency-icon"><Icon name="clock" size={20} /></div>
              <h3>{isHindi ? "पारदर्शी नाइट अलाउंस" : "Night Driving Allowance"}</h3>
              <p>
                {isHindi
                  ? `रात 8:00 बजे (20:00) से सुबह 6:00 बजे के बीच प्रस्थान करने वाली आउटस्टेशन गाड़ियों पर कारों के लिए ₹${outstationRules.nightAllowanceCab} तथा टेम्पो के लिए ₹${outstationRules.nightAllowanceTempo} का फिक्स नाइट अलाउंस लागू होता है।`
                  : `For outstation travel departing between 08:00 PM and 06:00 AM, a flat driver night allowance of ₹${outstationRules.nightAllowanceCab} for cars and ₹${outstationRules.nightAllowanceTempo} for Tempo Travellers applies.`}
              </p>
            </div>

            <div className="transparency-card">
              <div className="transparency-icon"><Icon name="shield-check" size={20} /></div>
              <h3>{isHindi ? "24-घंटे में 100% रिफंड" : "24-Hour Free Cancellation"}</h3>
              <p>
                {cancellationPolicyCab[activeLanguage]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services FAQ Accordion */}
      <section
        className="home-section services-faq-section"
        aria-labelledby="services-faq-heading"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isHindi ? "अक्सर पूछे जाने वाले प्रश्न" : "Service FAQs"}
              </p>
              <h2 id="services-faq-heading">
                {isHindi ? (
                  <>
                    सेवाओं से जुड़े जरूरी सवाल,
                    <br />
                    <i>बुकिंग से पहले सीधे जवाब।</i>
                  </>
                ) : (
                  <>
                    Questions about our services?
                    <br />
                    <i>Straightforward answers upfront.</i>
                  </>
                )}
              </h2>
            </div>
          </div>

          <div className="services-faq-accordion">
            {faqs.slice(0, 6).map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  className={`services-faq-item ${isOpen ? "is-open" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="services-faq-question"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`services-faq-answer-${index}`}
                  >
                    <span>{item.question[activeLanguage]}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="services-faq-answer"
                      id={`services-faq-answer-${index}`}
                    >
                      <p>{item.answer[activeLanguage]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ready to Travel CTA Banner */}
      <section className="container ready-cta-container">
        <div className="ready-cta-card">
          <div className="ready-cta-content">
            <p className="eyebrow eyebrow-light">
              {isHindi ? "तत्काल सहायता" : "24×7 Local Dispatch Desk"}
            </p>
            <h2>
              {isHindi ? (
                <>अपनी यात्रा आज ही शुरू करें।</>
              ) : (
                <>Ready to plan your journey from Agra?</>
              )}
            </h2>
            <p>
              {isHindi
                ? "हमारी स्थानीय टीम से सीधे बात करें या 2 मिनट में ऑनलाइन कैब बुक करें।"
                : "Speak directly with our local booking desk in Taj Ganj or reserve online in under two minutes."}
            </p>
          </div>
          <div className="ready-cta-actions">
            <a className="button button-primary" href="/book.html">
              {isHindi ? "ऑनलाइन बुक करें ↗" : "Book Online ↗"}
            </a>
            <a
              className="button button-outline button-light"
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              {isHindi ? "व्हाट्सएप करें" : "WhatsApp Us"}
            </a>
            <a
              className="button button-outline button-light"
              href={`tel:${contact.phone}`}
            >
              {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
