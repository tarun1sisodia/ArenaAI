/**
 * FaqPage — Frequently Asked Questions Hub Page (Step R5.17)
 *
 * Comprehensive bilingual FAQ hub featuring:
 * 1. Semantic Breadcrumbs & Page Hero with 24×7 dispatch assurance
 * 2. Live Interactive Keyword Search Filter with clear button
 * 3. 5 Category Navigation Tabs with item counters:
 *    - All Questions
 *    - Booking & Reservations (बुकिंग व आरक्षण)
 *    - Fares & Toll Transparency (किराया, टोल व मूल्य पारदर्शिता)
 *    - Outstation Rules & Km Limits (आउटस्टेशन नियम व न्यूनतम किमी)
 *    - Night Allowances & Driver Batta (नाइट चार्ज व ड्राइवर भत्ता)
 *    - Luggage, Upgrades & Cancellations (लगेज, कैब अपग्रेड व कैंसिलेशन)
 * 4. Expand All / Collapse All convenience control
 * 5. Accessible Accordion List with ARIA 1.2 compliance
 * 6. "Still Have Questions?" 3-Card Support Bento Strip (Phone, WhatsApp, Email)
 * 7. Bottom Instant Booking CTA Banner
 * 8. Schema.org JSON-LD graph (FAQPage, LocalBusiness, BreadcrumbList)
 */

import React, { useState, useMemo } from "react";
import { Icon } from "../components/ui/Icon";
import { contact } from "../data/contact";

interface FaqPageProps {
  language: "en" | "hi";
}

export type FaqCategory = "all" | "booking" | "fares" | "outstation" | "night" | "luggage";

export interface FaqItem {
  id: string;
  category: "booking" | "fares" | "outstation" | "night" | "luggage";
  qEn: string;
  qHi: string;
  aEn: string;
  aHi: string;
}

const FAQS_DATA: FaqItem[] = [
  // 1. Booking & Reservations
  {
    id: "booking-1",
    category: "booking",
    qEn: "How can I book an outstation cab or local sightseeing tour?",
    qHi: "मैं आउटस्टेशन कैब या आगरा लोकल दर्शनीय टूर कैसे बुक कर सकता हूँ?",
    aEn: "You can book instantly through three easy channels: (1) Use our online booking engine on this website to select your route and vehicle, (2) Call our 24×7 Taj Ganj dispatch controller directly at +91 98765 43210, or (3) Message our WhatsApp desk for a fast 2-minute quote and immediate confirmation with photo of the car.",
    aHi: "आप तीन आसान तरीकों से तुरंत बुकिंग कर सकते हैं: (1) हमारी वेबसाइट पर ऑनलाइन बुकिंग इंजन से रूट और गाड़ी चुनें, (2) हमारे 24×7 ताजगंज कंट्रोल रूम में सीधे +91 98765 43210 पर कॉल करें, या (3) हमारे व्हाट्सएप डेस्क पर संदेश भेजकर 2 मिनट में गाड़ी की फोटो और पक्की पुष्टि प्राप्त करें।"
  },
  {
    id: "booking-2",
    category: "booking",
    qEn: "How far in advance do I need to make a reservation?",
    qHi: "मुझे यात्रा से कितने समय पहले बुकिंग करानी चाहिए?",
    aEn: "While we recommend reserving 24 to 48 hours in advance for popular weekend getaways and peak tourist season (October to March), our Taj Ganj dispatch fleet maintains standby vehicles in Agra and can fulfill urgent same-day booking requests within 15 to 30 minutes.",
    aHi: "हालांकि सप्ताहांत और पर्यटन सीजन (अक्टूबर से मार्च) के दौरान 24 से 48 घंटे पहले बुकिंग की सलाह दी जाती है, ताजगंज में हमारी गाड़ियाँ 24 घंटे तैयार रहती हैं और आपातकालीन स्थिति में 15 से 30 मिनट में कैब भेजी जा सकती है।"
  },
  {
    id: "booking-3",
    category: "booking",
    qEn: "Is an advance payment required to confirm my cab?",
    qHi: "क्या कैब पक्की करने के लिए कोई एडवांस (अग्रिम) भुगतान जरूरी है?",
    aEn: "Yes, a modest 25% to 28% advance deposit is required to lock in your preferred vehicle tier and assign your dedicated police-verified chauffeur. The remaining balance is payable directly to the chauffeur at the completion of your journey via cash, UPI, or card.",
    aHi: "हाँ, आपकी पसंदीदा गाड़ी सुरक्षित रखने और पुलिस-सत्यापित ड्राइवर नियुक्त करने के लिए केवल 25% से 28% अग्रिम टोकन राशि आवश्यक है। बाकी भुगतान आप यात्रा समाप्त होने पर ड्राइवर को नकद या यूपीआई द्वारा कर सकते हैं।"
  },
  {
    id: "booking-4",
    category: "booking",
    qEn: "When and how will I receive my driver and vehicle details?",
    qHi: "मुझे ड्राइवर और गाड़ी का विवरण कब और कैसे मिलेगा?",
    aEn: "Driver details (chauffeur name, mobile number, vehicle registration number, and live GPS tracking link) are automatically sent via SMS and WhatsApp 2 hours prior to your scheduled pickup time. For early morning pickups (e.g., 5:00 AM Taj Mahal sunrise), details are dispatched by 9:00 PM the previous evening.",
    aHi: "ड्राइवर का नाम, मोबाइल नंबर, गाड़ी नंबर और लाइव जीपीएस ट्रैकिंग लिंक यात्रा समय से 2 घंटे पहले एसएमएस और व्हाट्सएप पर भेज दिया जाता है। सुबह 5:00 बजे ताज महल सूर्योदय टूर के लिए यह विवरण पिछली रात 9:00 बजे तक मिल जाता है।"
  },
  {
    id: "booking-5",
    category: "booking",
    qEn: "Can I customize a multi-day itinerary across Rajasthan or the Golden Triangle?",
    qHi: "क्या मैं राजस्थान या गोल्डन ट्रायंगल के लिए अपनी मर्जी से मल्टी-डे टूर प्लान कर सकता हूँ?",
    aEn: "Absolutely! We specialize in tailored Golden Triangle circuits (Delhi-Agra-Jaipur) and extended Rajasthan/Uttarakhand tours. You can select your halt cities, sightseeing monuments, and tempo of travel. Our local travel planners will prepare a transparent day-wise itinerary with fixed pricing.",
    aHi: "हाँ, बिल्कुल! हम दिल्ली-आगरा-जयपुर गोल्डन ट्रायंगल और राजस्थान के व्यक्तिगत टूर में माहिर हैं। आप अपनी पसंद के शहर, होटल और रुकने के स्थान चुन सकते हैं। हमारे टूर विशेषज्ञ बिना किसी छुपे खर्च के पारदर्शी योजना तैयार करेंगे।"
  },

  // 2. Fares & Pricing Transparency
  {
    id: "fares-1",
    category: "fares",
    qEn: "Are expressway tolls, state border taxes, and parking fees included in the fare?",
    qHi: "क्या एक्सप्रेसवे टोल, राज्य बॉर्डर टैक्स और पार्किंग शुल्क किराये में शामिल हैं?",
    aEn: "On all flat outstation packages (such as Agra to Delhi IGI Airport via Yamuna Expressway or Agra to Jaipur flat transfers), expressway toll taxes and driver allowances are 100% included in the quoted fare. On flexible per-km round-trip rentals, tolls, state permit taxes, and parking are charged at actual government receipt rates with zero agency markup.",
    aHi: "सभी फिक्स्ड आउटस्टेशन पैकेज (जैसे यमुना एक्सप्रेसवे से दिल्ली एयरपोर्ट या जयपुर ट्रांसफर) में एक्सप्रेसवे टोल और ड्राइवर भत्ता पूरी तरह शामिल होता है। प्रति-किमी राउंड ट्रिप बुकिंग में टोल, बॉर्डर टैक्स व पार्किंग सरकारी रसीद के अनुसार वास्तविक दर पर जोड़े जाते हैं।"
  },
  {
    id: "fares-2",
    category: "fares",
    qEn: "Are there any hidden charges, luggage fees, or peak hour surge pricing?",
    qHi: "क्या कोई छुपा हुआ शुल्क, लगेज चार्ज या पीक-ऑवर सर्ज प्राइसिंग है?",
    aEn: "No. SK Baghel Tour & Travels operates on an unwavering principle of complete fare transparency. There is zero surge pricing during festivals or rush hours, zero luggage bag fees, and zero tourist commission trap kickbacks. Every single rupee is itemized on your quote before you confirm.",
    aHi: "बिल्कुल नहीं। एस के बघेल टूर एंड ट्रेवल्स में कोई छुपा शुल्क नहीं है। त्योहारों या भीड़-भाड़ में कोई सर्ज चार्ज नहीं लिया जाता, बैग रखने का कोई शुल्क नहीं है और न ही किसी दुकान पर जबरन रुकने का कोई कमीशन का खेल है।"
  },
  {
    id: "fares-3",
    category: "fares",
    qEn: "How are outstation journey distances and kilometers calculated?",
    qHi: "आउटस्टेशन यात्रा में दूरी और किलोमीटर की गणना कैसे की जाती है?",
    aEn: "For one-way transfers, the fare is fixed based on point-to-point highway distance. For round-trip outstation cab hires, kilometers are calculated from our Agra garage dispatch point back to the garage, adhering to standard commercial RTO guidelines.",
    aHi: "वन-वे यात्रा के लिए किराया दोनों शहरों के बीच की दूरी के आधार पर पहले से तय होता है। राउंड-ट्रिप में किलोमीटर की गणना आगरा गैराज से प्रस्थान कर पुनः गैराज लौटने तक सरकारी कमर्शियल नियमों के अनुसार होती है।"
  },
  {
    id: "fares-4",
    category: "fares",
    qEn: "Can I receive an official GST tax invoice for corporate business travel claims?",
    qHi: "क्या मुझे कंपनी क्लेम के लिए आधिकारिक जीएसटी (GST) टैक्स इनवॉइस मिलेगा?",
    aEn: "Yes. We are a registered commercial tour and transport entity with GSTIN 09ABCDE1234F1Z5. We issue formal, itemized GST tax invoices containing your company name and GSTIN number immediately upon trip completion via email and WhatsApp.",
    aHi: "हाँ। हमारी फर्म पंजीकृत है (GSTIN: 09ABCDE1234F1Z5)। यात्रा पूरी होते ही आपकी कंपनी के नाम और जीएसटी नंबर के साथ विधिवत पक्का बिल ईमेल व व्हाट्सएप पर प्रदान किया जाता है।"
  },
  {
    id: "fares-5",
    category: "fares",
    qEn: "What payment methods do you accept?",
    qHi: "भुगतान के कौन-कौन से तरीके स्वीकार किए जाते हैं?",
    aEn: "We accept all standard digital payment methods including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking, and cash directly to your chauffeur.",
    aHi: "हम सभी प्रमुख डिजिटल माध्यम स्वीकार करते हैं: यूपीआई (Google Pay, PhonePe, Paytm), क्रेडिट/डेबिट कार्ड, नेट बैंकिंग और यात्रा के अंत में ड्राइवर को नकद भुगतान।"
  },

  // 3. Outstation Rules & Minimum Kilometers
  {
    id: "outstation-1",
    category: "outstation",
    qEn: "What is the 300 km per calendar day minimum rule for round-trip cabs?",
    qHi: "राउंड-ट्रिप कैब के लिए 300 किमी प्रतिदिन का न्यूनतम नियम क्या है?",
    aEn: "Under standard commercial transport regulations across North India, all outstation round-trip taxi rentals are subject to a minimum average billing of 300 kilometers per calendar day (midnight to midnight). If you travel less than 300 km in a day, the minimum 300 km charge applies. If your cumulative total exceeds 300 km × total days, you simply pay the per-km rate for actual kilometers traveled.",
    aHi: "उत्तर भारत के कमर्शियल नियमों के अनुसार, राउंड-ट्रिप आउटस्टेशन कैब में प्रति कैलेंडर दिवस (मध्यरात्रि 12 से 12) न्यूनतम 300 किमी की गणना होती है। यदि कुल दूरी दिनों के न्यूनतम औसत से अधिक होती है, तो वास्तविक किलोमीटर की प्रति किमी दर से गणना की जाती है।"
  },
  {
    id: "outstation-2",
    category: "outstation",
    qEn: "Can our driver stop for meals, restrooms, and photography along the highway?",
    qHi: "क्या रास्ते में भोजन, वॉशरूम या फोटो खिंचवाने के लिए गाड़ी रोकी जा सकती है?",
    aEn: "Yes, of course. Your chauffeur-driven cab is private and dedicated solely to your party. You are free to take tea breaks at hygienic expressway rest plazas (such as Yamuna Expressway food malls) or detour briefly for photography and heritage monuments like Fatehpur Sikri or Sikandra at your own pace.",
    aHi: "हाँ, अवश्य। यह आपकी निजी आरक्षित कैब है। आप यमुना एक्सप्रेसवे के स्वच्छ फूड प्लाजा, ढाबों या रास्ते में फतेहपुर सीकरी और सिकंदरा जैसे दर्शनीय स्थलों पर अपनी सुविधानुसार रुक सकते हैं।"
  },
  {
    id: "outstation-3",
    category: "outstation",
    qEn: "What are the chauffeur's driving duty hours on long outstation journeys?",
    qHi: "लंबी आउटस्टेशन यात्राओं में ड्राइवर के काम के घंटे क्या होते हैं?",
    aEn: "For passenger highway safety, drivers operate for up to 10 to 12 hours of driving per day. While chauffeurs are flexible to accommodate sightseeing schedules, our dispatch policy strictly mandates adequate rest periods between legs to ensure alert and safe driving.",
    aHi: "यात्रियों की सड़क सुरक्षा के लिए ड्राइवर एक दिन में अधिकतम 10 से 12 घंटे गाड़ी चलाते हैं। दर्शनीय स्थलों के भ्रमण में ड्राइवर पूरा सहयोग करते हैं, पर रात में उन्हें पर्याप्त विश्राम मिलना अनिवार्य है।"
  },
  {
    id: "outstation-4",
    category: "outstation",
    qEn: "Who covers the driver's food and night accommodation on multi-day trips?",
    qHi: "मल्टी-डे टूर में ड्राइवर के खाने और रात में रुकने की व्यवस्था कौन करता है?",
    aEn: "Driver food and lodging are 100% taken care of by the daily driver batta/allowance included in your outstation quote. Guests do NOT need to provide hotel rooms or meals for the driver. Our chauffeurs arrange their own lodging and meals at designated transport rest facilities.",
    aHi: "ड्राइवर के खाने और रहने की व्यवस्था आउटस्टेशन कोट्स में शामिल 'ड्राइवर भत्ते' से पूरी होती है। यात्रियों को ड्राइवर के लिए होटल कमरा या भोजन उपलब्ध कराने की कोई आवश्यकता नहीं है।"
  },

  // 4. Night Allowances & Driver Batta
  {
    id: "night-1",
    category: "night",
    qEn: "When does the night allowance apply and what are the exact charges?",
    qHi: "नाइट चार्ज (रात का भत्ता) कब लागू होता है और इसका शुल्क क्या है?",
    aEn: "Night driving allowance applies when the vehicle is driven between 22:00 (10:00 PM) and 05:00 (5:00 AM) on outstation highways. The standard night fee is ₹300 per night for Sedans (Dzire/Etios), ₹500 per night for MPVs/SUVs (Ertiga/Innova Crysta), and ₹600 per night for Tempo Travellers.",
    aHi: "रात का भत्ता केवल तब लागू होता है जब आउटस्टेशन यात्रा रात 10:00 बजे से सुबह 5:00 बजे के बीच चल रही हो। सेडान के लिए ₹300/रात, अर्टिगा व इनोवा क्रिस्टा के लिए ₹500/रात और टेम्पो ट्रैवलर के लिए ₹600/रात का मानक शुल्क है।"
  },
  {
    id: "night-2",
    category: "night",
    qEn: "Does a night charge apply if I book a 5:00 AM Taj Mahal sunrise tour in Agra?",
    qHi: "क्या सुबह 5:00 बजे ताज महल सूर्योदय टूर बुक करने पर भी नाइट चार्ज लगेगा?",
    aEn: "No. For local Agra sightseeing tours and Taj Mahal sunrise packages scheduled at 5:00 AM or 5:30 AM, there is NO extra night charge. Our local packages are priced all-inclusive for sunrise hours.",
    aHi: "नहीं। आगरा स्थानीय दर्शनीय टूर और सुबह 5:00 या 5:30 बजे के ताज महल सूर्योदय पैकेज पर कोई अतिरिक्त नाइट चार्ज नहीं लिया जाता। यह पैकेज की सामान्य दर में ही शामिल रहता है।"
  },
  {
    id: "night-3",
    category: "night",
    qEn: "Why is night driving allowance billed separately on outstation trips?",
    qHi: "आउटस्टेशन यात्रा में रात का भत्ता अलग से क्यों लिया जाता है?",
    aEn: "Night allowance is a standard labor and safety standard in Indian commercial transport, paid directly to professional chauffeurs to compensate for heightened alertness, highway vigilance, and night-shift duty on intercity highways.",
    aHi: "भारतीय कमर्शियल परिवहन में यह ड्राइवरों का वैध अधिकार है। देर रात हाईवे पर विशेष सतर्कता और अतिरिक्त श्रम के लिए यह राशि सीधे ड्राइवर को दी जाती है।"
  },

  // 5. Luggage Capacity, Upgrades & Cancellations
  {
    id: "luggage-1",
    category: "luggage",
    qEn: "What is the luggage capacity for each car category in your fleet?",
    qHi: "आपकी विभिन्न गाड़ियों में सामान (लगेज) रखने की कितनी क्षमता है?",
    aEn: "Sedan (Dzire / Etios) comfortably fits 2 large suitcases (28\") plus 2 cabin trolley bags. Ertiga MPV accommodates 3 to 4 bags. Innova Crysta fits 4 large suitcases + hand bags. Tempo Travellers (12-20 seater) and Urbania have dedicated high-capacity luggage boots holding 10 to 18 bags, plus secure rooftop luggage carriers with waterproof protection.",
    aHi: "सेडान (Dzire/Etios) में 2 बड़े सूटकेस व 2 हैंडबैग; अर्टिगा में 3 से 4 बैग; इनोवा क्रिस्टा में 4 बड़े सूटकेस व 3 हैंडबैग आसानी से आते हैं। टेम्पो ट्रैवलर और अर्बनिया में 10 से 18 बैग रखने के लिए बड़ा बूट और वाटरप्रूफ रूफ कैरियर उपलब्ध है।"
  },
  {
    id: "luggage-2",
    category: "luggage",
    qEn: "What is your cancellation and refund policy?",
    qHi: "आपकी कैंसिलेशन और रिफंड नीति क्या है?",
    aEn: "We offer an authentic 100% full refund policy for all cab bookings cancelled at least 24 hours prior to scheduled pickup time. The advance deposit is refunded in full to your original payment method within 5 to 7 business days with zero deduction. For cancellations within 24 hours of pickup, the advance deposit covers vehicle staging and chauffeur reservation.",
    aHi: "पिकअप समय से 24 घंटे पहले तक कैंसिलेशन 100% मुफ्त है और पूरी अग्रिम राशि 5 से 7 कार्य दिवसों में बिना किसी कटौती के वापस कर दी जाती है। 24 घंटे से कम समय में कैंसिलेशन पर अग्रिम राशि ड्राइवर व गाड़ी तैयारी लागत के रूप में समायोजित होती है।"
  },
  {
    id: "luggage-3",
    category: "luggage",
    qEn: "What happens if the vehicle experiences a mechanical breakdown on the highway?",
    qHi: "यदि हाईवे पर गाड़ी में कोई तकनीकी खराबी आ जाए तो क्या होगा?",
    aEn: "We operate an ironclad 45-Minute Vehicle Replacement Guarantee across the Agra-Mathura belt and Yamuna Expressway corridor. If an unresolvable mechanical issue occurs, our 24×7 control room immediately dispatches a standby replacement vehicle of equal or higher tier at zero additional cost to you.",
    aHi: "हमारा 24×7 कंट्रोल रूम आगरा-मथुरा और यमुना एक्सप्रेसवे पर 45 मिनट के भीतर वैकल्पिक वाहन उपलब्ध कराने की गारंटी देता है। बिना किसी अतिरिक्त शुल्क के समान या उससे बेहतर गाड़ी तुरंत भेजी जाती है।"
  },
  {
    id: "luggage-4",
    category: "luggage",
    qEn: "Can I change my pickup time or upgrade my vehicle after booking?",
    qHi: "क्या बुकिंग के बाद पिकअप समय बदलना या गाड़ी अपग्रेड करना संभव है?",
    aEn: "Yes. You can reschedule your pickup time or request an upgrade (e.g., from Sedan to Innova Crysta) with at least 3 hours notice before pickup time, subject to vehicle availability. Just send a quick message to our WhatsApp dispatch desk at +91 98765 43210.",
    aHi: "हाँ। पिकअप से कम से कम 3 घंटे पहले सूचित करके आप समय में बदलाव या गाड़ी अपग्रेड (जैसे सेडान से इनोवा क्रिस्टा) करवा सकते हैं। इसके लिए हमारे व्हाट्सएप डेस्क पर संदेश भेजें।"
  }
];

const CATEGORIES = [
  { id: "all", labelEn: "All Questions", labelHi: "सभी प्रश्न", icon: "✦" },
  { id: "booking", labelEn: "Booking & Reservations", labelHi: "बुकिंग व आरक्षण", icon: "🗓" },
  { id: "fares", labelEn: "Fares & Tolls", labelHi: "किराया व टोल टैक्स", icon: "💳" },
  { id: "outstation", labelEn: "Outstation Rules", labelHi: "आउटस्टेशन नियम", icon: "🛣" },
  { id: "night", labelEn: "Night Charges", labelHi: "नाइट चार्ज व भत्ते", icon: "🌙" },
  { id: "luggage", labelEn: "Luggage & Cancellations", labelHi: "लगेज व कैंसिलेशन", icon: "🧳" }
] as const;

export function FaqPage({ language }: FaqPageProps) {
  const isHi = language === "hi";

  const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set(["booking-1", "fares-1"]));

  // Filtered FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.qEn.toLowerCase().includes(q) ||
        item.qHi.toLowerCase().includes(q) ||
        item.aEn.toLowerCase().includes(q) ||
        item.aHi.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  // Toggle single FAQ accordion
  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand All / Collapse All
  const areAllExpanded = filteredFaqs.length > 0 && filteredFaqs.every((f) => openFaqIds.has(f.id));

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setOpenFaqIds(new Set());
    } else {
      setOpenFaqIds(new Set(filteredFaqs.map((f) => f.id)));
    }
  };

  // Count helper per category
  const getCategoryCount = (catId: string) => {
    if (catId === "all") return FAQS_DATA.length;
    return FAQS_DATA.filter((item) => item.category === catId).length;
  };

  // JSON-LD Schema.org Graph
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `https://skbagheltravels.in/${language}/faq/#webpage`,
        "url": `https://skbagheltravels.in/${language}/faq/`,
        "name": isHi
          ? "सामान्य प्रश्न (FAQs) — कैब बुकिंग, किराया व नियम | एस के बघेल टूर एंड ट्रेवल्स"
          : "Frequently Asked Questions (FAQs) — Cab Booking, Fares & Rules | SK Baghel Tour & Travels",
        "description": isHi
          ? "आगरा कैब बुकिंग, आउटस्टेशन 300 किमी नियम, टोल-टैक्स, नाइट चार्ज, लगेज क्षमता और 24 घंटे में मुफ्त कैंसिलेशन से जुड़े सभी सवालों के स्पष्ट जवाब।"
          : "Comprehensive questions and answers about booking outstation cabs, Agra sightseeing, toll inclusions, 300 km daily minimums, night allowance, and 24-hr cancellations.",
        "inLanguage": isHi ? "hi-IN" : "en-IN",
        "mainEntity": FAQS_DATA.map((item) => ({
          "@type": "Question",
          "name": isHi ? item.qHi : item.qEn,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": isHi ? item.aHi : item.aEn
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://skbagheltravels.in/${language}/faq/#breadcrumb`,
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
            "name": isHi ? "सामान्य प्रश्न (FAQ)" : "FAQs",
            "item": `https://skbagheltravels.in/${language}/faq/`
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
    <main id="main-content" className="faq-page">
      {/* Inject SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Hero & Breadcrumbs Section */}
      <section className="page-hero faq-hero">
        <div className="container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <a href={`/${language}/`}>{isHi ? "होम" : "Home"}</a>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
              <li className="breadcrumb-item breadcrumb-item--active" aria-current="page">
                {isHi ? "सामान्य प्रश्न (FAQ)" : "FAQs"}
              </li>
            </ol>
          </nav>

          <div className="page-hero__badge">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {isHi
                ? "21 सत्यापित उत्तर • 100% पारदर्शी नीति"
                : "21 Verified Answers • 100% Transparent Travel Policies"}
            </span>
          </div>

          <h1 className="page-hero__title">
            {isHi ? (
              <>
                सामान्य प्रश्न (FAQs) —<br />
                <i>आपकी यात्रा से जुड़े हर सवाल का स्पष्ट जवाब।</i>
              </>
            ) : (
              <>
                Frequently Asked Questions —<br />
                <i>Clear, Honest Answers for Every Journey.</i>
              </>
            )}
          </h1>

          <p className="page-hero__lead">
            {isHi
              ? "आगरा कैब बुकिंग, आउटस्टेशन 300 किमी नियम, टोल-टैक्स, नाइट चार्ज, लगेज क्षमता और 24 घंटे में मुफ्त कैंसिलेशन से जुड़े सभी सवालों के जवाब यहाँ पढ़ें।"
              : "Everything you need to know about booking chauffeur-driven cabs from Agra: expressway toll transparency, 300 km/day outstation rules, luggage capacity, and free 24-hr refunds."}
          </p>

          {/* Interactive Search Bar */}
          <div className="faq-search-bar-wrap">
            <div className="faq-search-bar">
              <span className="faq-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHi
                    ? "कीवर्ड खोजें (उदा. टोल, नाइट चार्ज, कैंसिलेशन, लगेज)..."
                    : "Search questions (e.g. tolls, night charge, 300 km, refund, luggage)..."
                }
                className="faq-search-input"
                aria-label={isHi ? "प्रश्न खोजें" : "Search questions"}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="faq-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label={isHi ? "खोज साफ़ करें" : "Clear search"}
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="faq-search-count">
                {isHi
                  ? `"${searchQuery}" के लिए ${filteredFaqs.length} परिणाम मिले`
                  : `Found ${filteredFaqs.length} results for "${searchQuery}"`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main FAQ Content Section */}
      <section className="faq-main-section">
        <div className="container">
          {/* Category Filter Tabs */}
          <div className="faq-category-tabs" role="tablist" aria-label="FAQ Categories">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`faq-cat-tab ${isActive ? "faq-cat-tab--active" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat.id as FaqCategory);
                    setSearchQuery("");
                  }}
                >
                  <span className="faq-cat-tab__icon" aria-hidden="true">{cat.icon}</span>
                  <span className="faq-cat-tab__label">
                    {isHi ? cat.labelHi : cat.labelEn}
                  </span>
                  <span className="faq-cat-tab__count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Controls Bar: Active Category Title + Expand/Collapse All */}
          <div className="faq-controls-bar">
            <div className="faq-controls-info">
              <span className="faq-controls-tag">
                {isHi ? "श्रेणी" : "Category"}:
              </span>
              <strong className="faq-controls-category-name">
                {isHi
                  ? CATEGORIES.find((c) => c.id === activeCategory)?.labelHi
                  : CATEGORIES.find((c) => c.id === activeCategory)?.labelEn}
              </strong>
              <span className="faq-controls-total">
                ({filteredFaqs.length} {isHi ? "प्रश्न" : "Questions"})
              </span>
            </div>

            {filteredFaqs.length > 0 && (
              <button
                type="button"
                className="faq-toggle-all-btn"
                onClick={handleToggleAll}
              >
                {areAllExpanded
                  ? isHi ? "सभी बंद करें −" : "Collapse All −"
                  : isHi ? "सभी खोलें +" : "Expand All +"}
              </button>
            )}
          </div>

          {/* Accordion Questions List */}
          {filteredFaqs.length === 0 ? (
            <div className="faq-empty-state">
              <p className="faq-empty-state__icon">🔍</p>
              <h3>{isHi ? "कोई प्रश्न नहीं मिला" : "No Matching Questions Found"}</h3>
              <p>
                {isHi
                  ? `"${searchQuery}" से मेल खाता कोई परिणाम नहीं मिला। कृपया अलग शब्द खोजें या हमारी टीम से संपर्क करें।`
                  : `We couldn't find any questions matching "${searchQuery}". Please try another keyword or reach out directly.`}
              </p>
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                {isHi ? "सभी प्रश्न देखें" : "View All Questions"}
              </button>
            </div>
          ) : (
            <div className="faq-accordion-list">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIds.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className={`faq-card-item ${isOpen ? "faq-card-item--open" : ""}`}
                  >
                    <button
                      type="button"
                      className="faq-card-trigger"
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${faq.id}`}
                      id={`faq-btn-${faq.id}`}
                    >
                      <span className="faq-card-q-wrap">
                        <span className="faq-card-index">{String(idx + 1).padStart(2, "0")}.</span>
                        <span className="faq-card-q-text">
                          {isHi ? faq.qHi : faq.qEn}
                        </span>
                      </span>
                      <span className="faq-card-icon" aria-hidden="true">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        id={`faq-answer-${faq.id}`}
                        role="region"
                        aria-labelledby={`faq-btn-${faq.id}`}
                        className="faq-card-body"
                      >
                        <p>{isHi ? faq.aHi : faq.aEn}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* "Still Have Questions?" Support Bento Section */}
      <section className="faq-support-section">
        <div className="container">
          <div className="section-heading text-center">
            <p className="eyebrow">{isHi ? "सहायता डेस्क" : "Human Support"}</p>
            <h2>
              {isHi ? (
                <>
                  क्या आपका प्रश्न यहाँ नहीं है?<br />
                  <i>हमसे सीधे संपर्क करें।</i>
                </>
              ) : (
                <>
                  Still Have Unanswered Questions?<br />
                  <i>Talk Directly with Our Agra Desk.</i>
                </>
              )}
            </h2>
            <p className="section-lead">
              {isHi
                ? "हमारी 24×7 सहायता टीम आपके किसी भी संदेह या विशेष यात्रा मांग का तुरंत समाधान करने के लिए तत्पर है।"
                : "Our Taj Ganj dispatch controllers are available 24 hours a day to answer route inquiries, vehicle sizing questions, or custom tour planning."}
            </p>
          </div>

          <div className="faq-support-grid">
            {/* Phone Card */}
            <div className="faq-support-card">
              <div className="faq-support-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <h3>{isHi ? "फोन पर बात करें" : "Direct Phone Call"}</h3>
              <p>{isHi ? "तत्काल उत्तर और 15 मिनट में कैब बुकिंग के लिए कॉल करें।" : "Immediate answer and 15-minute emergency dispatch."}</p>
              <a href={`tel:${contact.phone}`} className="button button-outline button-block">
                <span>{contact.phoneDisplay}</span>
                <span aria-hidden="true"><Icon name="phone" size={16} /></span>
              </a>
            </div>

            {/* WhatsApp Card */}
            <div className="faq-support-card faq-support-card--highlight">
              <div className="faq-support-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3>{isHi ? "व्हाट्सएप चैट" : "WhatsApp Chat"}</h3>
              <p>{isHi ? "गाड़ियों की वास्तविक तस्वीरें और सटीक किराये का कोटेशन पाएं।" : "Live vehicle photography, itinerary review & fast quotes."}</p>
              <a
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                  isHi
                    ? "नमस्ते! मेरे पास कैब बुकिंग से संबंधित कुछ प्रश्न हैं।"
                    : "Hello SK Baghel Travels, I have some questions regarding cab booking and fares."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-gold button-block"
              >
                <span>{isHi ? "व्हाट्सएप चैट शुरू करें" : "Chat on WhatsApp"}</span>
                <span aria-hidden="true"><Icon name="whatsapp" size={16} /></span>
              </a>
            </div>

            {/* Email Card */}
            <div className="faq-support-card">
              <div className="faq-support-card__icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3>{isHi ? "ईमेल सहायता" : "Email Dispatch"}</h3>
              <p>{isHi ? "कॉर्पोरेट बिलिंग और बड़े टूर पैकेजों के लिए ईमेल भेजें।" : "For GST corporate invoices and multi-day group tours."}</p>
              <a href={`mailto:${contact.email}`} className="button button-outline button-block">
                <span>{contact.email}</span>
                <span aria-hidden="true"><Icon name="mail" size={16} /></span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Booking CTA Banner */}
      <section className="faq-cta-strip">
        <div className="container">
          <div className="cta-banner-box">
            <div className="cta-banner-content">
              <span className="cta-banner-tag">
                {isHi ? "तैयार हैं?" : "Ready to Travel?"}
              </span>
              <h2 className="cta-banner-title">
                {isHi
                  ? "अपनी भरोसेमंद आगरा कैब अभी सुरक्षित करें।"
                  : "Book Your Sanitized, Chauffeur-Driven Cab Today."}
              </h2>
              <p className="cta-banner-desc">
                {isHi
                  ? "पारदर्शी मूल्य, स्वच्छ गाड़ियाँ और पुलिस-सत्यापित ड्राइवर। कूपन ASTTCAR500OFF का उपयोग करके ₹500 की छूट पाएं।"
                  : "Transparent upfront fares, zero surge pricing, and 45-minute replacement guarantee. Use coupon ASTTCAR500OFF for ₹500 off."}
              </p>
            </div>

            <div className="cta-banner-buttons">
              <a href="/book.html" className="button button-gold">
                <span>{isHi ? "ऑनलाइन बुकिंग करें" : "Book Online Now"}</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={`tel:${contact.phone}`}
                className="button button-outline"
              >
                <span>{isHi ? "कॉल करें: " + contact.phoneDisplay : "Call " + contact.phoneDisplay}</span>
                <span aria-hidden="true"><Icon name="phone" size={16} /></span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
