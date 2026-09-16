/**
 * ContactPage — Contact Us Hub Page (Step R5.16)
 *
 * Comprehensive bilingual contact & operational dispatch hub featuring:
 * 1. Semantic Breadcrumbs & Page Hero with Taj Ganj dispatch status badge
 * 2. 4 Direct Communication Channels (Phone, WhatsApp, Corporate Email, Physical Hub)
 * 3. Architectural Bento Contact Section:
 *    - Left: Verified NAP credentials, 24×7 control room details, emergency roadside guarantee, live map link
 *    - Right: Interactive multi-service booking & custom itinerary inquiry form with field validation,
 *             simulated dispatch submission, feedback toast, and pre-filled WhatsApp handoff
 * 4. Office Proximity & Travel Directions Grid (Agra Cantt, Agra Fort, Agra Airport, Yamuna Expressway, Taj East Gate)
 * 5. 6-Item Bilingual Contact & Support FAQ Accordion with accessible ARIA tags
 * 6. Bottom 24×7 Quick Travel Desk CTA card
 * 7. Schema.org JSON-LD graph (ContactPage, LocalBusiness, BreadcrumbList, FAQPage)
 */

import React, { useState } from "react";
import { Icon } from "../components/ui/Icon";
import { contact } from "../data/contact";
import { createInquiry, formatInquiryPhone, sanitizeInquiryName } from "../services/api";

interface ContactPageProps {
  language: "en" | "hi";
}

interface InquiryFormData {
  name: string;
  phone: string;
  serviceType: string;
  tripDate: string;
  pickupLocation: string;
  destination: string;
  vehiclePreference: string;
  message: string;
}

const FAQ_ITEMS = [
  {
    qEn: "How quickly will your dispatch team respond to my booking or inquiry?",
    qHi: "मेरी बुकिंग या पूछताछ पर आपकी टीम कितनी जल्दी जवाब देगी?",
    aEn: "Our 24×7 Taj Ganj dispatch team responds within 2 to 5 minutes on WhatsApp (+91 98765 43210) or direct phone call. Web inquiries submitted via the form above are reviewed and confirmed within 15 minutes with a transparent fare breakdown.",
    aHi: "हमारी 24×7 ताजगंज डिस्पैच टीम व्हाट्सएप (+91 98765 43210) या फोन कॉल पर 2 से 5 मिनट के भीतर तुरंत जवाब देती है। वेबसाइट फॉर्म द्वारा भेजी गई पूछताछ पर 15 मिनट में पारदर्शी किराए के साथ जवाब दिया जाता है।"
  },
  {
    qEn: "Can I book a cab for a 5:00 AM Taj Mahal sunrise tour on short notice?",
    qHi: "क्या मैं सुबह 5:00 बजे ताज महल सूर्योदय टूर के लिए तुरंत कैब बुक कर सकता हूँ?",
    aEn: "Yes, absolutely. Sunrise Taj Mahal tours are our everyday specialty. We maintain night-shift dispatchers and standby chauffeur-driven sedans and MPVs in Taj Ganj and Fatehabad Road hotel areas, ready for 5:00 AM or 5:30 AM pickups.",
    aHi: "हाँ, बिल्कुल। सुबह के ताज महल सूर्योदय टूर हमारी रोजमर्रा की विशेषता हैं। ताजगंज और फतेहाबाद रोड के होटलों के लिए हमारे ड्राइवर और गाड़ियाँ 24 घंटे तैयार रहते हैं, जिन्हें सुबह 5:00 या 5:30 बजे पिकअप के लिए आसानी से बुक किया जा सकता है।"
  },
  {
    qEn: "What exact information is required to confirm my outstation trip?",
    qHi: "आउटस्टेशन ट्रिप पक्की करने के लिए कौन सी जानकारी चाहिए?",
    aEn: "To confirm, we only need: (1) Pickup date and exact time, (2) Pickup address or hotel name in Agra/Delhi, (3) Drop destination, (4) Passenger count, and (5) Preferred car tier (Sedan, Ertiga, Innova Crysta, or Tempo Traveller). No complicated registrations required.",
    aHi: "पुष्टि के लिए केवल आवश्यक है: (1) पिकअप की तारीख व समय, (2) आगरा या दिल्ली में होटल/घर का पता, (3) गंतव्य शहर, (4) यात्रियों की संख्या, और (5) पसंदीदा गाड़ी (सेडान, अर्टिगा, इनोवा क्रिस्टा, या टेम्पो)। किसी जटिल पंजीकरण की आवश्यकता नहीं है।"
  },
  {
    qEn: "Is there any waiting penalty if my train or flight is delayed?",
    qHi: "यदि मेरी ट्रेन या फ्लाइट लेट हो जाती है, तो क्या कोई अतिरिक्त वेटिंग चार्ज लगेगा?",
    aEn: "No. When you provide your train number (e.g., Gatimaan Express, Shatabdi, Vande Bharat at Agra Cantt) or flight number (at Delhi IGI or Agra Kheria Airport), our dispatch team tracks real-time arrivals. Chauffeurs wait at the exit gate with zero delay penalty.",
    aHi: "बिल्कुल नहीं। जब आप अपनी ट्रेन (जैसे गतिमान एक्सप्रेस, शताब्दी, वंदे भारत) या फ्लाइट का नंबर साझा करते हैं, तो हमारी टीम लाइव ट्रैकिंग करती है। ट्रेन या फ्लाइट लेट होने पर एग्जिट गेट पर बिना किसी पेनल्टी के ड्राइवर आपका इंतजार करता है।"
  },
  {
    qEn: "What is your cancellation and refund policy?",
    qHi: "आपकी रद्दीकरण (कैंसिलेशन) और रिफंड नीति क्या है?",
    aEn: "For all standard outstation and local cab transfers, cancellation is 100% free up to 24 hours prior to scheduled pickup time. Any advance deposit is refunded in full within 5 to 7 business days to your original payment method.",
    aHi: "सभी सामान्य आउटस्टेशन और लोकल कैब के लिए, पिकअप समय से 24 घंटे पहले तक कैंसिलेशन 100% मुफ्त है। जमा किया गया अग्रिम शुल्क 5 से 7 कार्य दिवसों में आपके मूल खाते में पूरा वापस कर दिया जाता है।"
  },
  {
    qEn: "Can I visit your physical office in Agra to discuss a customized multi-day itinerary?",
    qHi: "क्या मैं मल्टी-डे टूर की योजना बनाने के लिए आपके आगरा कार्यालय आ सकता हूँ?",
    aEn: "You are always welcome! Our physical headquarters and passenger welcome center is situated near Taj East Gate Road, Taj Ganj, Agra. We offer secure luggage holding, comfortable seating, refreshing mineral water, and personal route planning with our tour experts.",
    aHi: "आपका हमेशा स्वागत है! हमारा मुख्य कार्यालय व ट्रेवल डेस्क ताज ईस्ट गेट रोड, ताजगंज, आगरा के पास स्थित है। यहाँ यात्रियों के लिए सामान सुरक्षित रखने की सुविधा, बैठने की व्यवस्था और टूर विशेषज्ञों से व्यक्तिगत सलाह उपलब्ध है।"
  }
];

const PROXIMITY_HUBS = [
  {
    nameEn: "Agra Cantt Railway Station (AGC)",
    nameHi: "आगरा कैंट रेलवे स्टेशन",
    dist: "6.8 km",
    time: "15 mins",
    routeEn: "Via Mall Road & Fatehabad Road corridor. Dedicated pickup lane at Platform 1 exit.",
    routeHi: "माल रोड व फतेहाबाद रोड मार्ग से। प्लेटफार्म 1 के बाहर समर्पित पिकअप लेन।"
  },
  {
    nameEn: "Agra Fort Railway Station (AF)",
    nameHi: "आगरा फोर्ट रेलवे स्टेशन",
    dist: "4.2 km",
    time: "10 mins",
    routeEn: "Via Taj Road & Shahjahan Park. Direct 10-minute transit to Taj Ganj.",
    routeHi: "ताज रोड व शाहजहां पार्क से। ताजगंज तक 10 मिनट का सीधा सफर।"
  },
  {
    nameEn: "Agra Kheria Airport (AGR)",
    nameHi: "आगरा खेरिया एयरपोर्ट",
    dist: "11.5 km",
    time: "25 mins",
    routeEn: "Via VIP Road & Sadar Bazaar. Chauffeurs wait outside the arrival terminal gate.",
    routeHi: "वीआईपी रोड व सदर बाजार से। अराइवल गेट के बाहर ड्राइवर नेम-बोर्ड के साथ मिलेंगे।"
  },
  {
    nameEn: "Yamuna Expressway Toll Plaza (Agra Exit)",
    nameHi: "यमुना एक्सप्रेसवे टोल प्लाजा (आगरा एग्जिट)",
    dist: "14.0 km",
    time: "20 mins",
    routeEn: "Via Agra Inner Ring Road 6-lane bypass directly into Taj Ganj without city traffic.",
    routeHi: "आगरा इनर रिंग रोड 6-लेन बाईपास से बिना शहर के ट्रैफिक के सीधे ताजगंज।"
  },
  {
    nameEn: "Taj Mahal East Gate Ticket Plaza",
    nameHi: "ताज महल पूर्वी गेट टिकट प्लाजा",
    dist: "850 meters",
    time: "3 mins",
    routeEn: "Short 3-minute electric battery golf cart ride or gentle 10-minute heritage walk.",
    routeHi: "बैटरी ई-रिक्शा / गोल्फ कार्ट से 3 मिनट या 10 मिनट की पैदल दूरी।"
  }
];

export function ContactPage({ language }: ContactPageProps) {
  const isHi = language === "hi";
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Inquiry Form State
  const [formData, setFormData] = useState<InquiryFormData>({
    name: "",
    phone: "",
    serviceType: "outstation",
    tripDate: "",
    pickupLocation: "",
    destination: "",
    vehiclePreference: "sedan",
    message: ""
  });

  const [formErrors, setFormErrors] = useState<{
    name?: boolean;
    phone?: boolean;
    tripDate?: boolean;
    pickupLocation?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ""
  });

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof formErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = true;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      errors.phone = true;
    }
    if (!formData.pickupLocation.trim() || formData.pickupLocation.trim().length < 3) {
      errors.pickupLocation = true;
    }
    if (!formData.tripDate) {
      errors.tripDate = true;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedName = sanitizeInquiryName(formData.name);
      const sanitizedPhone = formatInquiryPhone(formData.phone);
      const tripInterest = `${formData.serviceType}: ${formData.pickupLocation} to ${formData.destination || "local"}`.slice(0, 160);

      const tripMeta = `Service: ${formData.serviceType} | Date: ${formData.tripDate} | Vehicle: ${formData.vehiclePreference} | Pickup: ${formData.pickupLocation} | Drop: ${formData.destination || "Local Agra"}`;
      const userMsg = formData.message.trim();
      const message = userMsg.length >= 10
        ? `${tripMeta}\nNotes: ${userMsg}`.slice(0, 2000)
        : `${tripMeta}. Please provide quote and confirm availability.`.slice(0, 2000);

      const res = await createInquiry({
        name: sanitizedName,
        phone: sanitizedPhone,
        message,
        tripInterest,
      });

      const generatedId = res.id || `SKB-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setInquiryId(generatedId);
      setIsSubmitting(false);
      setIsSubmitted(true);

      const successMsg = isHi
        ? `धन्यवाद ${formData.name.trim()}! आपकी पूछताछ (${generatedId}) दर्ज कर ली गई है। हमारा 24×7 कंट्रोल रूम आपसे जल्द संपर्क करेगा।`
        : `Thank you, ${formData.name.trim()}! Your inquiry (${generatedId}) has been received. Our 24×7 Agra dispatch desk will contact you at ${formData.phone.trim()} shortly.`;

      setToast({ show: true, message: successMsg });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 6000);
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMsg = isHi
        ? `पूछताछ सबमिट करने में असमर्थ: ${err?.message || "कृपया पुनः प्रयास करें या सीधे कॉल करें।"}`
        : `Failed to submit inquiry: ${err?.message || "Please try again or contact us directly."}`;
      setToast({ show: true, message: errorMsg });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 6000);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      phone: "",
      serviceType: "outstation",
      tripDate: "",
      pickupLocation: "",
      destination: "",
      vehiclePreference: "sedan",
      message: ""
    });
    setFormErrors({});
    setIsSubmitted(false);
    setInquiryId("");
  };

  // Build WhatsApp text from form data for 1-click continuation
  const buildWhatsAppUrl = () => {
    const serviceName =
      formData.serviceType === "outstation"
        ? "Outstation Cab"
        : formData.serviceType === "sightseeing"
        ? "Agra Sightseeing (8h/80km)"
        : formData.serviceType === "transfer"
        ? "Airport / Station Transfer"
        : formData.serviceType === "goldentriangle"
        ? "Golden Triangle Tour"
        : "Tour / Taxi Service";

    const carName =
      formData.vehiclePreference === "innova"
        ? "Innova Crysta"
        : formData.vehiclePreference === "ertiga"
        ? "Ertiga MPV"
        : formData.vehiclePreference === "tempo"
        ? "Tempo Traveller"
        : formData.vehiclePreference === "urbania"
        ? "Force Urbania"
        : "Sedan (Dzire)";

    const text = `Hello SK Baghel Travels! I submitted Inquiry ${inquiryId || "Request"}:
• Name: ${formData.name}
• Service: ${serviceName}
• Vehicle: ${carName}
• Date: ${formData.tripDate}
• Pickup: ${formData.pickupLocation}
• Destination: ${formData.destination || "As discussed"}
• Notes: ${formData.message || "None"}
Please share available cabs and upfront fare quote.`;

    return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  // JSON-LD Schema.org Graph
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `https://skbagheltravels.in/${language}/contact/#webpage`,
        "url": `https://skbagheltravels.in/${language}/contact/`,
        "name": isHi
          ? "संपर्क करें — एस के बघेल टूर एंड ट्रेवल्स आगरा | 24×7 ट्रेवल डेस्क"
          : "Contact Us — SK Baghel Tour & Travels Agra | 24×7 Travel Desk",
        "description": isHi
          ? "ताजगंज आगरा में स्थित 24×7 कंट्रोल रूम से संपर्क करें। फोन कॉल, व्हाट्सएप और ऑनलाइन फॉर्म द्वारा तुरंत कैब बुकिंग और सहायता।"
          : "Contact our 24×7 operational control room in Taj Ganj, Agra. Instant booking via phone, WhatsApp, or interactive web inquiry.",
        "inLanguage": isHi ? "hi-IN" : "en-IN",
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://skbagheltravels.in/#website",
          "name": "SK Baghel Tour & Travels",
          "url": "https://skbagheltravels.in/"
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://skbagheltravels.in/#localbusiness",
        "name": "SK Baghel Tour & Travels",
        "image": "https://skbagheltravels.in/assets/packages/taj-dawn.webp",
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
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "27.1751",
          "longitude": "78.0421"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
          }
        ],
        "hasMap": contact.mapsUrl
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://skbagheltravels.in/${language}/contact/#breadcrumb`,
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
            "name": isHi ? "संपर्क करें" : "Contact Us",
            "item": `https://skbagheltravels.in/${language}/contact/`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `https://skbagheltravels.in/${language}/contact/#faq`,
        "mainEntity": FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          "name": isHi ? item.qHi : item.qEn,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": isHi ? item.aHi : item.aEn
          }
        }))
      }
    ]
  };

  return (
    <main id="main-content" className="contact-page">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Floating Feedback Toast Notification */}
      {toast.show && (
        <aside
          className="contact-toast"
          role="status"
          aria-live="polite"
        >
          <div className="contact-toast__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="contact-toast__content">
            <p className="contact-toast__title">{isHi ? "पूछताछ प्राप्त हुई" : "Inquiry Received"}</p>
            <p className="contact-toast__desc">{toast.message}</p>
          </div>
          <button
            type="button"
            className="contact-toast__close"
            onClick={() => setToast({ show: false, message: "" })}
            aria-label={isHi ? "सूचना बंद करें" : "Dismiss notification"}
          >
            ✕
          </button>
        </aside>
      )}

      {/* Hero & Breadcrumb Section */}
      <section className="page-hero contact-hero">
        <div className="container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <a href={`/${language}/`}>{isHi ? "होम" : "Home"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item breadcrumb-item--active" aria-current="page">
                {isHi ? "संपर्क करें" : "Contact Us"}
              </li>
            </ol>
          </nav>

          <div className="page-hero__badge">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {isHi
                ? "24×7 सक्रिय कंट्रोल रूम • ताजगंज, आगरा"
                : "24×7 Active Control Room • Taj Ganj, Agra"}
            </span>
          </div>

          <h1 className="page-hero__title">
            {isHi ? (
              <>
                हमसे संपर्क करें —<br />
                <i>आपकी सुरक्षित यात्रा हमारा संकल्प।</i>
              </>
            ) : (
              <>
                Let’s Plan Your Journey —<br />
                <i>24×7 Local Dispatch & Chauffeur Desk.</i>
              </>
            )}
          </h1>

          <p className="page-hero__lead">
            {isHi
              ? "आगरा से दिल्ली, जयपुर, राजस्थान या स्थानीय ताज महल भ्रमण के लिए सीधी बात करें। कोई स्वचालित बॉट नहीं, सीधे हमारे अनुभवी टूर मैनेजर और ड्राइवर से संवाद करें।"
              : "Direct human coordination for outstation cabs, sunrise Taj Mahal tours, and luxury group transport. No chatbots, no commission traps, and 100% transparent pricing."}
          </p>
        </div>
      </section>

      {/* 4 Direct Communication Channels Bento Strip */}
      <section className="contact-channels-section">
        <div className="container">
          <div className="contact-channels-grid">
            {/* Phone Channel */}
            <a
              href={`tel:${contact.phone}`}
              className="channel-card"
              aria-label={isHi ? "कॉल करें: +91 98765 43210" : "Call dispatch desk: +91 98765 43210"}
            >
              <div className="channel-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="channel-card__content">
                <span className="channel-card__tag">{isHi ? "तत्काल फोन सेवा" : "24×7 Phone Dispatch"}</span>
                <span className="channel-card__value">{contact.phoneDisplay}</span>
                <p className="channel-card__sub">{isHi ? "15 मिनट में ड्राइवर पुष्टि" : "Driver assigned in 15 mins"}</p>
              </div>
              <span className="channel-card__arrow" aria-hidden="true">↗</span>
            </a>

            {/* WhatsApp Channel */}
            <a
              href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                isHi
                  ? "नमस्ते! मुझे आगरा से कैब बुकिंग और टूर पैकेज की जानकारी चाहिए।"
                  : "Hello SK Baghel Travels, I would like to inquire about cab booking and tour packages."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="channel-card channel-card--highlight"
              aria-label={isHi ? "व्हाट्सएप चैट शुरू करें" : "Open WhatsApp chat"}
            >
              <div className="channel-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="channel-card__content">
                <span className="channel-card__tag">{isHi ? "त्वरित चैट डेस्क" : "Direct WhatsApp Desk"}</span>
                <span className="channel-card__value">+91 {contact.whatsapp.slice(2)}</span>
                <p className="channel-card__sub">{isHi ? "लाइव लोकेशन व फोटो शेयरिंग" : "Live cab photos & quotes"}</p>
              </div>
              <span className="channel-card__arrow" aria-hidden="true">↗</span>
            </a>

            {/* Email Channel */}
            <a
              href={`mailto:${contact.email}?subject=Booking%20Inquiry%20-%20SK%20Baghel%20Travels`}
              className="channel-card"
              aria-label={isHi ? "ईमेल भेजें: bookings@skbagheltravels.in" : "Email: bookings@skbagheltravels.in"}
            >
              <div className="channel-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="channel-card__content">
                <span className="channel-card__tag">{isHi ? "कॉर्पोरेट व जीएसटी" : "Corporate & Invoicing"}</span>
                <span className="channel-card__value">{contact.email}</span>
                <p className="channel-card__sub">{isHi ? "विस्तृत यात्रा विवरण व बिल" : "GST invoices & tour plans"}</p>
              </div>
              <span className="channel-card__arrow" aria-hidden="true">↗</span>
            </a>

            {/* Physical Address Channel */}
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="channel-card"
              aria-label={isHi ? "गूगल मैप्स पर ऑफिस देखें" : "View office location on Google Maps"}
            >
              <div className="channel-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="channel-card__content">
                <span className="channel-card__tag">{isHi ? "मुख्यालय व लाउंज" : "Operational Hub"}</span>
                <span className="channel-card__value">Taj Ganj, Agra</span>
                <p className="channel-card__sub">{isHi ? "ताज महल पूर्वी गेट के निकट" : "Near Taj East Gate Rd"}</p>
              </div>
              <span className="channel-card__arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Architectural Bento Section (2 Columns: Left Credentials & Map, Right Inquiry Form) */}
      <section className="contact-main-section">
        <div className="container">
          <div className="contact-grid-container">
            {/* Left Column: Architectural Credentials, Operating Hours & Emergency Hotline */}
            <div className="contact-bento-left">
              <div className="contact-card contact-card--hub">
                {/* 4 Architectural Corner Plus Crosses */}
                <svg className="corner-plus corner-plus--tl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <svg className="corner-plus corner-plus--tr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <svg className="corner-plus corner-plus--bl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <svg className="corner-plus corner-plus--br" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>

                <div className="contact-hub-header">
                  <span className="contact-hub-eyebrow">
                    {isHi ? "सत्यापित क्रेडेंशियल" : "Verified Credentials"}
                  </span>
                  <h2 className="contact-hub-title">
                    {isHi ? "आगरा मुख्यालय व कंट्रोल रूम" : "Agra Headquarters & Dispatch Command"}
                  </h2>
                  <p className="contact-hub-desc">
                    {isHi
                      ? "ताजगंज में स्थित हमारा मुख्य केंद्र चौबीसों घंटे सक्रिय रहता है। हम सीधे अपने ड्राइवरों और फ्लीट की निगरानी करते हैं ताकि आपकी यात्रा में कोई व्यवधान न आए।"
                      : "Our physical dispatch facility operates around the clock, managing expressway toll coordination, train arrivals at Agra Cantt, and 24×7 customer assistance."}
                  </p>
                </div>

                {/* NAP Details Grid */}
                <div className="nap-bento-grid">
                  <div className="nap-tile">
                    <span className="nap-tile__label">{isHi ? "पंजीकृत व्यापार नाम" : "Registered Legal Entity"}</span>
                    <strong className="nap-tile__text">S.K. Baghel Tour & Travels (Regd.)</strong>
                  </div>

                  <div className="nap-tile">
                    <span className="nap-tile__label">{isHi ? "जीएसटी नंबर (GSTIN)" : "GST Identification Number"}</span>
                    <strong className="nap-tile__text nap-tile__text--mono">{contact.gst}</strong>
                  </div>

                  <div className="nap-tile nap-tile--wide">
                    <span className="nap-tile__label">{isHi ? "कार्यालय का पता" : "Physical Office Address"}</span>
                    <p className="nap-tile__text">{contact.address}</p>
                  </div>

                  <div className="nap-tile">
                    <span className="nap-tile__label">{isHi ? "कार्य समय" : "Operating Hours"}</span>
                    <strong className="nap-tile__text">{isHi ? "24×7, 365 दिन खुली" : "24 Hours / 7 Days / 365 Days"}</strong>
                  </div>

                  <div className="nap-tile">
                    <span className="nap-tile__label">{isHi ? "सेवा क्षेत्र" : "Service Region"}</span>
                    <strong className="nap-tile__text">{isHi ? "आगरा, मथुरा, दिल्ली एनसीआर, जयपुर" : "Agra, Mathura, Delhi NCR, Jaipur"}</strong>
                  </div>
                </div>

                {/* Roadside Assistance & Emergency Guarantee Box */}
                <div className="emergency-guarantee-box">
                  <div className="emergency-guarantee-box__header">
                    <span className="emergency-badge">{isHi ? "सुरक्षा गारंटी" : "Safety Assurance"}</span>
                    <h3>{isHi ? "45 मिनट रिप्लेसमेंट गारंटी" : "45-Minute Vehicle Replacement Guarantee"}</h3>
                  </div>
                  <p>
                    {isHi
                      ? "आगरा-मथुरा या यमुना एक्सप्रेसवे मार्ग पर किसी भी तकनीकी समस्या की स्थिति में हमारा बैकअप कंट्रोल रूम 45 मिनट के भीतर वैकल्पिक वाहन उपलब्ध कराने का वचन देता है।"
                      : "In the rare event of mechanical difficulty along the Yamuna Expressway or Agra-Jaipur corridor, our standby network guarantees an identical replacement car within 45 minutes."}
                  </p>
                  <div className="emergency-features">
                    <div className="emergency-feature">
                      <span className="check-icon" aria-hidden="true">✓</span>
                      <span>{isHi ? "पुलिस-सत्यापित वर्दीधारी ड्राइवर" : "Police-Verified Chauffeurs"}</span>
                    </div>
                    <div className="emergency-feature">
                      <span className="check-icon" aria-hidden="true">✓</span>
                      <span>{isHi ? "100% कमर्शियल येलो-प्लेट फ्लीट" : "Commercial RTO Yellow-Plate Fleet"}</span>
                    </div>
                    <div className="emergency-feature">
                      <span className="check-icon" aria-hidden="true">✓</span>
                      <span>{isHi ? "महिला व पारिवारिक सुरक्षा प्राथमिकता" : "Family & Solo Female Safety Protocol"}</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Map Button */}
                <div className="contact-map-action">
                  <a
                    href={contact.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-outline button-block"
                  >
                    <span>{isHi ? "गूगल मैप्स पर रास्ता देखें" : "Open Driving Directions on Google Maps"}</span>
                    <span aria-hidden="true">📍</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Multi-Service Booking & Inquiry Form */}
            <div className="contact-bento-right">
              <div className="inquiry-form-card">
                <div className="inquiry-form-header">
                  <span className="inquiry-form-eyebrow">
                    {isHi ? "त्वरित पूछताछ फॉर्म" : "Fast Inquiry Form"}
                  </span>
                  <h2 className="inquiry-form-title">
                    {isHi ? "अपनी यात्रा का विवरण भेजें" : "Request a Trip Quote or Custom Tour"}
                  </h2>
                  <p className="inquiry-form-subtitle">
                    {isHi
                      ? "नीचे दिया गया फॉर्म भरें। हमारे टूर एक्सपर्ट तुरंत उपलब्ध गाड़ियों की सूची और किराया भेजेंगे।"
                      : "Fill out the form below. We will calculate the transparent fare with zero hidden charges and confirm vehicle availability."}
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="inquiry-success-state" role="alert">
                    <div className="inquiry-success-state__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>

                    <h3 className="inquiry-success-state__title">
                      {isHi ? "आपकी पूछताछ सफलतापूर्वक दर्ज हो गई!" : "Inquiry Submitted Successfully!"}
                    </h3>

                    <div className="inquiry-id-badge">
                      <span>{isHi ? "संदर्भ संख्या:" : "Reference ID:"}</span>
                      <strong>{inquiryId}</strong>
                    </div>

                    <p className="inquiry-success-state__text">
                      {isHi
                        ? `धन्यवाद ${formData.name}! हमारा 24×7 कंट्रोल रूम आपके नंबर ${formData.phone} पर अगले 15 मिनट में सर्वोत्तम किराये का प्रस्ताव भेजेगा।`
                        : `Thank you, ${formData.name}! Our 24×7 control room has registered your travel request for ${formData.tripDate}. A travel specialist will contact you at ${formData.phone} within 15 minutes.`}
                    </p>

                    <div className="inquiry-success-actions">
                      <a
                        href={buildWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button-gold button-block"
                      >
                        <span>{isHi ? "व्हाट्सएप पर तुरंत पुष्टि पाएं" : "Continue on WhatsApp for Instant Confirmation"}</span>
                        <span aria-hidden="true"><Icon name="whatsapp" size={16} /></span>
                      </a>

                      <button
                        type="button"
                        className="button button-outline button-block"
                        onClick={handleReset}
                      >
                        {isHi ? "एक और पूछताछ भेजें" : "Submit Another Inquiry"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-row form-row--2col">
                      <div className={`form-group ${formErrors.name ? "form-group--error" : ""}`}>
                        <label htmlFor="contact-name" className="form-label">
                          {isHi ? "आपका नाम *" : "Your Full Name *"}
                        </label>
                        <input
                          type="text"
                          id="contact-name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder={isHi ? "उदा. राहुल शर्मा" : "e.g. John Miller"}
                          className={`form-input ${formErrors.name ? "input-error" : ""}`}
                          aria-required="true"
                          aria-invalid={!!formErrors.name}
                        />
                        {formErrors.name && (
                          <span className="field-error-msg" role="alert">
                            {isHi ? "कृपया अपना नाम दर्ज करें" : "Please enter your name"}
                          </span>
                        )}
                      </div>

                      <div className={`form-group ${formErrors.phone ? "form-group--error" : ""}`}>
                        <label htmlFor="contact-phone" className="form-label">
                          {isHi ? "मोबाइल / व्हाट्सएप नंबर *" : "WhatsApp / Phone Number *"}
                        </label>
                        <input
                          type="tel"
                          id="contact-phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className={`form-input ${formErrors.phone ? "input-error" : ""}`}
                          aria-required="true"
                          aria-invalid={!!formErrors.phone}
                        />
                        {formErrors.phone && (
                          <span className="field-error-msg" role="alert">
                            {isHi ? "कृपया सही फोन नंबर दर्ज करें" : "Please enter a valid phone number"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-row form-row--2col">
                      <div className="form-group">
                        <label htmlFor="contact-service" className="form-label">
                          {isHi ? "सेवा का प्रकार" : "Service Requirement"}
                        </label>
                        <select
                          id="contact-service"
                          name="serviceType"
                          value={formData.serviceType}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          <option value="outstation">{isHi ? "आउटस्टेशन कैब (वन-वे / राउंड-ट्रिप)" : "Outstation Taxi (One-Way / Round-Trip)"}</option>
                          <option value="sightseeing">{isHi ? "आगरा स्थानीय दर्शन (8 घंटे / 80 किमी)" : "Agra Local Sightseeing (8h / 80km)"}</option>
                          <option value="mathura">{isHi ? "मथुरा-वृंदावन दर्शन टूर" : "Mathura-Vrindavan Pilgrimage Tour"}</option>
                          <option value="goldentriangle">{isHi ? "गोल्डन ट्रायंगल टूर (दिल्ली-आगरा-जयपुर)" : "Golden Triangle Multi-Day Tour"}</option>
                          <option value="transfer">{isHi ? "रेलवे स्टेशन / एयरपोर्ट ट्रांसफर" : "Station / Airport Transfer"}</option>
                          <option value="corporate">{isHi ? "कॉर्पोरेट / शादी-विवाह फ्लीट" : "Corporate / Wedding Event Transport"}</option>
                        </select>
                      </div>

                      <div className={`form-group ${formErrors.tripDate ? "form-group--error" : ""}`}>
                        <label htmlFor="contact-date" className="form-label">
                          {isHi ? "यात्रा की तारीख *" : "Trip Date *"}
                        </label>
                        <input
                          type="date"
                          id="contact-date"
                          name="tripDate"
                          value={formData.tripDate}
                          onChange={handleInputChange}
                          className={`form-input ${formErrors.tripDate ? "input-error" : ""}`}
                          aria-required="true"
                          aria-invalid={!!formErrors.tripDate}
                        />
                        {formErrors.tripDate && (
                          <span className="field-error-msg" role="alert">
                            {isHi ? "कृपया यात्रा की तारीख चुनें" : "Please select your travel date"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-row form-row--2col">
                      <div className={`form-group ${formErrors.pickupLocation ? "form-group--error" : ""}`}>
                        <label htmlFor="contact-pickup" className="form-label">
                          {isHi ? "पिकअप स्थान / होटल *" : "Pickup Location / Hotel *"}
                        </label>
                        <input
                          type="text"
                          id="contact-pickup"
                          name="pickupLocation"
                          value={formData.pickupLocation}
                          onChange={handleInputChange}
                          placeholder={isHi ? "उदा. होटल ओबेरॉय अमरविलास / आगरा कैंट" : "e.g. Hotel in Taj Ganj / Agra Cantt"}
                          className={`form-input ${formErrors.pickupLocation ? "input-error" : ""}`}
                          aria-required="true"
                          aria-invalid={!!formErrors.pickupLocation}
                        />
                        {formErrors.pickupLocation && (
                          <span className="field-error-msg" role="alert">
                            {isHi ? "कृपया पिकअप स्थान दर्ज करें" : "Please enter pickup location"}
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="contact-vehicle" className="form-label">
                          {isHi ? "पसंदीदा गाड़ी" : "Preferred Vehicle Tier"}
                        </label>
                        <select
                          id="contact-vehicle"
                          name="vehiclePreference"
                          value={formData.vehiclePreference}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          <option value="sedan">Sedan (Dzire / Etios — 4 Seater)</option>
                          <option value="ertiga">Ertiga MPV (Family — 6 Seater)</option>
                          <option value="innova">Innova Crysta (Luxury — 6-7 Seater)</option>
                          <option value="tempo">Tempo Traveller (Group — 12-20 Seater)</option>
                          <option value="urbania">Force Urbania (VIP Luxury Van — 10-17 Seater)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact-message" className="form-label">
                        {isHi ? "विशेष आवश्यकताएं / अतिरिक्त जानकारी" : "Special Requests / Trip Notes (Optional)"}
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={3}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder={
                          isHi
                            ? "उदा. सुबह 5:30 बजे ताज महल सूर्योदय, वरिष्ठ नागरिक साथ हैं, या अतिरिक्त लगेज की जगह चाहिए..."
                            : "e.g., 5:30 AM sunrise pickup, traveling with elderly parents, luggage space needed, English-speaking guide requested..."
                        }
                        className="form-textarea"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="button button-gold button-block submit-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="btn-spinner" aria-hidden="true" />
                          <span>{isHi ? "पूछताछ भेजी जा रही है..." : "Submitting Inquiry..."}</span>
                        </>
                      ) : (
                        <>
                          <span>{isHi ? "मुफ्त किराया अनुमान प्राप्त करें" : "Get Upfront Fare Estimate"}</span>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                    </button>

                    <p className="form-privacy-note">
                      🔒 {isHi ? "आपकी जानकारी सुरक्षित है। हम कभी स्पैम नहीं भेजते।" : "Zero spam guarantee. Your details are used solely to confirm your cab."}
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proximity Matrix & Transport Hubs Section */}
      <section className="contact-proximity-section">
        <div className="container">
          <div className="section-heading text-center">
            <p className="eyebrow">{isHi ? "पहुंच मार्ग व कनेक्टिविटी" : "Strategic Location"}</p>
            <h2>
              {isHi ? (
                <>
                  आगरा के मुख्य केंद्रों से<br />
                  <i>हमारी दूरी व समय।</i>
                </>
              ) : (
                <>
                  Minutes from Agra Cantt &<br />
                  <i>Taj Mahal East Gate.</i>
                </>
              )}
            </h2>
            <p className="section-lead">
              {isHi
                ? "हमारा ऑपरेशनल हब ताजगंज में स्थित है, जहां से आगरा के सभी रेलवे स्टेशनों, एयरपोर्ट और हाईवे तक पहुंच अत्यंत सुगम है।"
                : "Located in the heart of Taj Ganj's hospitality belt with quick 15-minute access to Agra Cantt railway station and Yamuna Expressway."}
            </p>
          </div>

          <div className="proximity-cards-grid">
            {PROXIMITY_HUBS.map((hub, idx) => (
              <div className="proximity-card" key={idx}>
                <div className="proximity-card__top">
                  <div className="proximity-card__distance">
                    <span className="proximity-card__km">{hub.dist}</span>
                    <span className="proximity-card__time">~{hub.time}</span>
                  </div>
                  <span className="proximity-card__badge">
                    {idx === 4 ? "Walking Distance" : "Direct Highway/Road"}
                  </span>
                </div>
                <h3 className="proximity-card__name">
                  {isHi ? hub.nameHi : hub.nameEn}
                </h3>
                <p className="proximity-card__route">
                  {isHi ? hub.routeHi : hub.routeEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6-Item Contact & Dispatch FAQ Accordion */}
      <section className="contact-faqs-section">
        <div className="container">
          <div className="section-heading text-center">
            <p className="eyebrow">{isHi ? "सामान्य प्रश्न" : "Frequently Asked Questions"}</p>
            <h2>
              {isHi ? (
                <>
                  बुकिंग व संपर्क से जुड़े<br />
                  <i>आपके सभी सवालों के जवाब।</i>
                </>
              ) : (
                <>
                  Booking, Dispatch &<br />
                  <i>Support Questions Answered.</i>
                </>
              )}
            </h2>
          </div>

          <div className="faq-accordion-wrap">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-accordion-item ${isOpen ? "faq-accordion-item--open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-accordion-trigger"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`contact-faq-ans-${idx}`}
                    id={`contact-faq-btn-${idx}`}
                  >
                    <span className="faq-accordion-q">
                      {isHi ? faq.qHi : faq.qEn}
                    </span>
                    <span className="faq-accordion-chevron" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={`contact-faq-ans-${idx}`}
                      role="region"
                      aria-labelledby={`contact-faq-btn-${idx}`}
                      className="faq-accordion-body"
                    >
                      <p>{isHi ? faq.aHi : faq.aEn}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom 24×7 Local Travel Desk CTA Strip */}
      <section className="contact-cta-strip">
        <div className="container">
          <div className="cta-banner-box">
            <div className="cta-banner-content">
              <span className="cta-banner-tag">
                {isHi ? "24×7 लाइव ट्रेवल डेस्क" : "24×7 Live Travel Desk"}
              </span>
              <h2 className="cta-banner-title">
                {isHi
                  ? "तुरंत कैब चाहिए या विशेष टूर की योजना है?"
                  : "Need an Urgent Ride or Planning a Custom Tour?"}
              </h2>
              <p className="cta-banner-desc">
                {isHi
                  ? "हमारे डिस्पैच मैनेजर से सीधे बात करें और बिना किसी एजेंट कमीशन के अपनी गाड़ी सुरक्षित करें।"
                  : "Speak directly with our Taj Ganj dispatch controller. Honest upfront pricing, zero hidden charges, and guaranteed clean cars."}
              </p>
            </div>

            <div className="cta-banner-buttons">
              <a
                href={`tel:${contact.phone}`}
                className="button button-gold"
                aria-label="Call SK Baghel Tour & Travels"
              >
                <span>{isHi ? "कॉल करें: " + contact.phoneDisplay : "Call " + contact.phoneDisplay}</span>
                <span aria-hidden="true"><Icon name="phone" size={16} /></span>
              </a>

              <a
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                  isHi
                    ? "नमस्ते! मुझे तुरंत कैब बुकिंग में सहायता चाहिए।"
                    : "Hello SK Baghel Travels, I need assistance with an urgent cab booking."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline"
                aria-label="Chat on WhatsApp"
              >
                <span>{isHi ? "व्हाट्सएप चैट" : "WhatsApp Desk"}</span>
                <span aria-hidden="true"><Icon name="whatsapp" size={16} /></span>
              </a>

              <a
                href="/book.html"
                className="button button-secondary"
              >
                <span>{isHi ? "ऑनलाइन बुकिंग करें" : "Book Online"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
