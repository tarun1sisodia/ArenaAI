import { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { type TourPackage, cancellationSlabsTour } from "../data";

interface PackageDetailPageProps {
  language?: SupportedLanguage;
  pkg: TourPackage;
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

// Vector car SVG icons matching MakeMyTrip styling
function SedanVector() {
  return (
    <svg width="46" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 16C4 16 6 9 12 8C16 7 24 7 29 8C33 9 37 13 39 16C41 18 42 19 42 20C42 21 41 21.5 39 21.5H5C3 21.5 2 20.5 2 19C2 17.5 4 16 4 16Z" fill="#1E2B37" opacity="0.88"/>
      <path d="M12 9L15 14H28L27 9H12Z" fill="#90B7D7"/>
      <circle cx="10" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="33" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

function MpvVector() {
  return (
    <svg width="46" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 16C3 16 5 7 11 6C16 5 28 5 32 6C36 7 39 12 40 16C41 18 42 19.5 42 20.5C42 21.5 41 22 39 22H5C3 22 2 21 2 19.5C2 18 3 16 3 16Z" fill="#1E2B37" opacity="0.88"/>
      <path d="M11 7L13 13H31L29 7H11Z" fill="#90B7D7"/>
      <circle cx="9" cy="20.5" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="34" cy="20.5" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

function SuvVector() {
  return (
    <svg width="46" height="24" viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 15C3 15 5 6 10 5.5C15 5 29 5 33 5.5C37 6 40 11 41 15C42 17 42.5 19 42.5 20C42.5 21.5 41.5 22 39 22H5C3 22 2 21 2 19.5C2 17.5 3 15 3 15Z" fill="#121416" opacity="0.9"/>
      <path d="M10 6.5L12 13H33L31 6.5H10Z" fill="#7FA9CE"/>
      <circle cx="9" cy="20" r="3.8" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="34" cy="20" r="3.8" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

function VanVector() {
  return (
    <svg width="48" height="24" viewBox="0 0 46 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="5" width="41" height="15" rx="3" fill="#201E1D" opacity="0.88"/>
      <rect x="6" y="8" width="8" height="6" rx="1" fill="#A4C2DC"/>
      <rect x="17" y="8" width="10" height="6" rx="1" fill="#A4C2DC"/>
      <rect x="30" y="8" width="10" height="6" rx="1" fill="#A4C2DC"/>
      <circle cx="10" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
      <circle cx="36" cy="20" r="3.5" fill="#181615" stroke="#E5A044" strokeWidth="1.5"/>
    </svg>
  );
}

interface ItineraryItem {
  time: string;
  title: { en: string; hi: string };
  desc: { en: string; hi: string };
}

// Fallback high-detail timelines for packages that don't have explicit timeline in data.ts
const PACKAGE_DEFAULT_TIMELINES: Record<string, ItineraryItem[]> = {
  "taj-sunrise": [
    { time: "02:30 AM", title: { en: "Doorstep Pickup from Delhi NCR / Hotel", hi: "दिल्ली एनसीआर अथवा होटल से प्रस्थान" }, desc: { en: "Chauffeur arrives at your doorstep for a smooth, chilled night drive via Yamuna Expressway.", hi: "ड्राइवर समय पर आपके निवास पर पहुंचता है और यमुना एक्सप्रेसवे से शांत प्रस्थान।" } },
    { time: "05:30 AM", title: { en: "Arrival in Agra & Meet ASI Guide", hi: "आगरा आगमन व अधिकृत गाइड से मिलन" }, desc: { en: "Quick freshen up and meet your approved government heritage guide near the Taj Mahal East Gate.", hi: "आगरा पहुंचकर कुछ देर विश्राम और ताजमहल पूर्वी द्वार पर सरकारी गाइड से भेंट।" } },
    { time: "06:00 AM", title: { en: "Taj Mahal Sunrise Exploration", hi: "ताजमहल सूर्योदय दर्शन" }, desc: { en: "Witness the pristine white marble bathed in golden dawn light before the public crowd arrives.", hi: "भीड़ जुटने से पहले सुबह की सुनहरी धूप में संगमरमर के ताज का अद्वितीय दृश्य।" } },
    { time: "09:30 AM", title: { en: "Luxury Buffet Breakfast", hi: "शानदार बुफे नाश्ता" }, desc: { en: "Relaxed breakfast at a verified multi-cuisine restaurant in Taj Ganj.", hi: "ताजगंज के स्वच्छ व प्रतिष्ठित रेस्टोरेंट में भरपेट नाश्ता।" } },
    { time: "11:00 AM", title: { en: "Agra Fort Royal Courtyards", hi: "आगरा किला भ्रमण" }, desc: { en: "Explore Jahangiri Mahal, Diwan-i-Khas, and Shah Jahan's historic prison with Taj views.", hi: "मुगल बादशाहों के दीवान-ए-खास, शीश महल और जहांगीरी महल का ऐतिहासिक दर्शन।" } },
    { time: "01:30 PM", title: { en: "Lunch & Marble Inlay Atelier", hi: "दोपहर का भोजन व स्थानीय शिल्प" }, desc: { en: "Discover the age-old Pietra Dura marble inlay craft practiced by descendants of Taj artisans.", hi: "स्वादिष्ट भोजन और ताजमहल के कारीगरों की वंश परंपरा वाले संगमरमर शिल्प का अवलोकन।" } },
    { time: "04:30 PM", title: { en: "Mehtab Bagh Sunset & Drop", hi: "मेहताब बाग से ताज का सूर्यास्त व वापसी" }, desc: { en: "Catch sunset reflections across the Yamuna River before smooth return drive back.", hi: "यमुना नदी के उस पार से ताज का सूर्यास्त दर्शन और सुरक्षित वापसी।" } },
  ],
  "mathura-vrindavan": [
    { time: "07:00 AM", title: { en: "Doorstep Pickup from Agra / Delhi", hi: "आगरा अथवा दिल्ली से पिकअप" }, desc: { en: "Chauffeur greets you in a sanitized AC cab and departs for holy Braj Bhoomi.", hi: "पवित्र ब्रजभूमि यात्रा के लिए वातानुकूलित कार से समय पर प्रस्थान।" } },
    { time: "08:30 AM", title: { en: "Shri Krishna Janmabhoomi Mathura", hi: "श्री कृष्ण जन्मभूमि दर्शन, मथुरा" }, desc: { en: "Visit the sacred birthplace of Lord Krishna, the ancient prison cell and sanctum sanctorum.", hi: "भगवान श्रीकृष्ण के पावन जन्म स्थान, प्राचीन गर्भगृह और मुख्य मंदिर में दर्शन।" } },
    { time: "11:00 AM", title: { en: "Dwarkadhish Temple & Yamuna Ghat", hi: "द्वारकाधीश मंदिर व विश्राम घाट" }, desc: { en: "Visit the historic Dwarkadhish temple followed by sacred Yamuna Aarti steps at Vishram Ghat.", hi: "विश्राम घाट पर पवित्र यमुना दर्शन और प्राचीन श्री द्वारकाधीश मंदिर में हाजिरी।" } },
    { time: "01:00 PM", title: { en: "Traditional Braj Bhojan Lunch", hi: "पारंपरिक ब्रज थाली भोजन" }, desc: { en: "Enjoy authentic satvik vegetarian lunch with famous Mathura pedas.", hi: "मथुरा के प्रसिद्ध पेड़े और शुद्ध सात्विक ब्रज भोजन का आनंद।" } },
    { time: "02:30 PM", title: { en: "Banke Bihari Ji Mandir, Vrindavan", hi: "श्री बांके बिहारी मंदिर, वृंदावन" }, desc: { en: "Chauffeur guides you safely through Vrindavan alleys to witness Thakur Ji's mesmerizing darshan.", hi: "वृंदावन की पावन कुंज गलियों से होकर ठाकुर श्री बांके बिहारी जी के दर्शन।" } },
    { time: "05:00 PM", title: { en: "ISKCON Krishna Balaram Temple", hi: "इस्कॉन कृष्ण बलराम मंदिर" }, desc: { en: "Immerse in joyful evening kirtan and serene temple architecture.", hi: "इस्कॉन मंदिर में भव्य संध्या आरती व मधुर संकीर्तन का आनंद।" } },
    { time: "06:30 PM", title: { en: "Prem Mandir Musical Light Show", hi: "प्रेम मंदिर लाइट व फव्वारा शो" }, desc: { en: "Behold the grand white Italian marble temple illuminate in majestic colored lighting.", hi: "शाम को प्रेम मंदिर की मनमोहक रंग-बिरंगी रोशनी और फव्वारा शो का दर्शन।" } },
    { time: "08:00 PM", title: { en: "Return Journey to Agra / Delhi", hi: "सुरक्षित वापसी प्रस्थान" }, desc: { en: "Relax in your AC cab on the Yamuna Expressway back to your hotel.", hi: "आरामदायक कार में यमुना एक्सप्रेसवे से सुरक्षित वापसी।" } },
  ],
  "gatimaan-express": [
    { time: "07:00 AM", title: { en: "Delhi Hotel Pickup to Nizamuddin Station", hi: "दिल्ली होटल से हज़रत निज़ामुद्दीन स्टेशन पिकअप" }, desc: { en: "Private cab transfers you directly to Hazrat Nizamuddin Station for comfortable boarding.", hi: "हज़रत निज़ामुद्दीन स्टेशन पर गतिमान एक्सप्रेस में सवार होने के लिए प्राइवेट कैब।" } },
    { time: "08:10 AM", title: { en: "Gatimaan Express High-Speed Departure", hi: "गतिमान एक्सप्रेस से द्रुतगामी यात्रा" }, desc: { en: "Train 12050 departs at 160 km/h. Enjoy warm complimentary breakfast served at your seat.", hi: "भारत की सबसे तेज़ ट्रेनों में से एक, ऑन-बोर्ड स्वादिष्ट नाश्ते के साथ 100 मिनट का सफर।" } },
    { time: "09:50 AM", title: { en: "Arrival at Agra Cantt & Chauffeur Greeting", hi: "आगरा कैंट स्टेशन पर ड्राइवर द्वारा स्वागत" }, desc: { en: "Your dedicated chauffeur and ASI-licensed guide receive you right at the platform exit.", hi: "आगरा कैंट रेलवे स्टेशन पर निजी एसी कार व गाइड द्वारा नेमबोर्ड के साथ स्वागत।" } },
    { time: "10:30 AM", title: { en: "Taj Mahal Priority Guided Tour", hi: "ताजमहल वीआईपी व विस्तृत भ्रमण" }, desc: { en: "Enter through priority channels and marvel at the world's greatest monument of love.", hi: "अनुभवी सरकारी गाइड के साथ ताज की अद्भुत वास्तुकला और इतिहास का जीवंत अनुभव।" } },
    { time: "01:30 PM", title: { en: "5-Star Luxury Buffet Lunch", hi: "पंचसितारा होटल में बुफे लंच" }, desc: { en: "Multi-cuisine gourmet lunch at an authorized 5-star hotel in Agra.", hi: "आगरा के प्रतिष्ठित 5-स्टार होटल में स्वादिष्ट बहु-व्यंजन लंच।" } },
    { time: "03:00 PM", title: { en: "Agra Fort Mughal Citadel", hi: "आगरा किला शाही महल दर्शन" }, desc: { en: "Walk through the royal apartments where Akbar, Jahangir, and Shah Jahan ruled India.", hi: "मुगल सल्तनत की राजधानी रहे विशाल लाल किले के दीवान-ए-आम व महलों का भ्रमण।" } },
    { time: "05:00 PM", title: { en: "Transfer to Agra Cantt Station", hi: "आगरा कैंट स्टेशन के लिए विदाई" }, desc: { en: "Chauffeur assists with luggage and boards you on Train 12049 Gatimaan Express.", hi: "शाम की वापसी ट्रेन 12049 गतिमान एक्सप्रेस के लिए स्टेशन पर समय से ड्रॉप।" } },
    { time: "07:30 PM", title: { en: "Arrival in Delhi & Hotel Drop", hi: "दिल्ली आगमन व होटल सुरक्षित ड्रॉप" }, desc: { en: "Meet your Delhi cab at Nizamuddin Station and arrive back at your hotel safely.", hi: "निज़ामुद्दीन स्टेशन पर कार से आपके दिल्ली होटल तक सुरक्षित प्रस्थान।" } },
  ],
  "agra-unhurried": [
    { time: "Day 1 - 09:00 AM", title: { en: "Doorstep Pickup & Hotel Check-in", hi: "पिकअप व होटल चेक-इन" }, desc: { en: "Chauffeur picks you up and assists with your hotel check-in in Agra.", hi: "आगरा में होटल आगमन और कमरों में आरामदायक विश्राम।" } },
    { time: "Day 1 - 11:30 AM", title: { en: "Agra Fort & Itimad-ud-Daulah (Baby Taj)", hi: "आगरा किला व एत्मादुद्दौला मकबरा" }, desc: { en: "Unrushed exploration of Agra Fort and the exquisite precursor to the Taj Mahal.", hi: "आगरा के लाल किले और संगमरमर के नक्काशीदार बेबी ताज का शांत व विस्तृत दौरा।" } },
    { time: "Day 1 - 04:30 PM", title: { en: "Mehtab Bagh Sunset Across the Yamuna", hi: "मेहताब बाग से ताज का सुरम्य सूर्यास्त" }, desc: { en: "Capture world-famous golden reflections across the river without tourist crowds.", hi: "यमुना पार चारबाग से ताजमहल का सबसे खूबसूरत सूर्यास्त फोटोग्राफी व्यू।" } },
    { time: "Day 1 - 07:30 PM", title: { en: "Mughal Cuisine Dinner & Artisan Bazaar", hi: "मुगलई रात्रिभोज व सदर बाजार" }, desc: { en: "Experience authentic Mughlai dishes and stroll along vibrant local markets.", hi: "आगरा के प्रसिद्ध खान-पान और हस्तशिल्प बाज़ारों की सैर।" } },
    { time: "Day 2 - 06:00 AM", title: { en: "Taj Mahal Sunrise Walk", hi: "ताजमहल शांत सूर्योदय दर्शन" }, desc: { en: "Early morning calm visit to the Taj Mahal with mesmerizing light.", hi: "सुबह की ताजगी और शांति में ताज का मुख्य गुंबद दर्शन।" } },
    { time: "Day 2 - 11:00 AM", title: { en: "Fatehpur Sikri Imperial Capital Excursion", hi: "फतेहपुर सीकरी शाही राजधानी दौरा" }, desc: { en: "Drive 38 km to Akbar's ghost capital: Buland Darwaza, Jama Masjid, and Panch Mahal.", hi: "बादशाह अकबर की राजधानी फतेहपुर सीकरी, बुलंद दरवाजा और शेख सलीम चिश्ती की दरगाह।" } },
    { time: "Day 2 - 04:30 PM", title: { en: "Return Drop to Delhi / Agra Station", hi: "दिल्ली अथवा आगरा स्टेशन पर वापसी ड्रॉप" }, desc: { en: "Chauffeur ensures prompt drop to your preferred destination.", hi: "यात्रा की मधुर स्मृतियों के साथ आपके गंतव्य तक सुरक्षित विदाई।" } },
  ],
  "golden-triangle": [
    { time: "Day 1", title: { en: "Delhi City Highlights to Agra via Expressway", hi: "दिल्ली दर्शन से आगरा एक्सप्रेसवे यात्रा" }, desc: { en: "Tour India Gate, Rashtrapati Bhavan, Qutub Minar, then cruise down Yamuna Expressway to Agra.", hi: "दिल्ली के प्रमुख स्थलों का भ्रमण और यमुना एक्सप्रेसवे से आगरा की ओर आरामदायक ड्राइव।" } },
    { time: "Day 2", title: { en: "Agra Taj Mahal Dawn to Jaipur via Fatehpur Sikri", hi: "ताजमहल दर्शन से फतेहपुर सीकरी होते हुए जयपुर" }, desc: { en: "Sunrise at Taj Mahal, Agra Fort, then scenic drive past Buland Darwaza to the Pink City Jaipur.", hi: "सुबह ताज महल, फिर आगरा किला और रास्ते में फतेहपुर सीकरी देखते हुए जयपुर आगमन।" } },
    { time: "Day 3", title: { en: "Jaipur Forts & Palaces to Delhi Return", hi: "जयपुर के किले, महल व दिल्ली सुरक्षित वापसी" }, desc: { en: "Explore Amber Fort with elephant pavilions, Hawa Mahal, City Palace, then return drop to Delhi.", hi: "आमेर किला, हवा महल, जल महल और सिटी पैलेस का शाही दौरा, फिर दिल्ली वापसी।" } },
  ],
};

interface VehicleUpgradeTier {
  vehId: string;
  name: { en: string; hi: string };
  seats: string;
  bags: string;
  price: number;
  popular?: boolean;
}

function getPackageVehicleTiers(pkg: TourPackage): VehicleUpgradeTier[] {
  if (pkg.upgrades && pkg.upgrades.length > 0) {
    return pkg.upgrades.map((u) => ({
      vehId: u.vehId,
      name: u.name,
      seats: u.seats,
      bags: u.vehId === "sedan" ? "2 Bags" : u.vehId === "ertiga" ? "3 Bags" : u.vehId === "innova" ? "4 Bags" : u.vehId === "tempo" ? "8 Bags" : "10 Bags",
      price: u.price,
      popular: u.vehId === "innova",
    }));
  }

  // Realistic multipliers based on base fare (from)
  const base = pkg.from;
  const isMultiDay = pkg.duration.includes("day") && !pkg.duration.includes("1 day");
  const multErtiga = isMultiDay ? 1.22 : 1.25;
  const multInnova = isMultiDay ? 1.5 : 1.65;
  const multTempo = isMultiDay ? 2.0 : 2.45;
  const multUrbania = isMultiDay ? 2.5 : 3.4;

  return [
    {
      vehId: "sedan",
      name: { en: "Dzire / Etios Sedan", hi: "डिज़ायर / इटियोस सेडान" },
      seats: "4+1",
      bags: "2 Bags",
      price: base,
    },
    {
      vehId: "ertiga",
      name: { en: "Maruti Ertiga MPV", hi: "मारुति अर्टिगा एमपीवी" },
      seats: "6+1",
      bags: "3 Bags",
      price: Math.round((base * multErtiga) / 100) * 100,
    },
    {
      vehId: "innova",
      name: { en: "Toyota Innova Crysta", hi: "टोयोटा इनोवा क्रिस्टा" },
      seats: "6+1",
      bags: "4 Bags",
      price: Math.round((base * multInnova) / 100) * 100,
      popular: true,
    },
    {
      vehId: "tempo",
      name: { en: "Tempo Traveller (12-Seater)", hi: "टेम्पो ट्रैवलर (12-सीटर)" },
      seats: "12+1",
      bags: "8 Bags",
      price: Math.round((base * multTempo) / 100) * 100,
    },
    {
      vehId: "urbania",
      name: { en: "Force Urbania Luxury Van", hi: "फ़ोर्स अर्बनिया लग्जरी वैन" },
      seats: "10+1",
      bags: "10 Bags",
      price: Math.round((base * multUrbania) / 100) * 100,
    },
  ];
}

interface TourFaq {
  q: { en: string; hi: string };
  a: { en: string; hi: string };
}

const TOUR_SPECIFIC_FAQS: Record<string, TourFaq[]> = {
  default: [
    {
      q: {
        en: "Is the Taj Mahal closed on any day of the week?",
        hi: "क्या ताजमहल सप्ताह के किसी दिन बंद रहता है?",
      },
      a: {
        en: "Yes, the Taj Mahal remains strictly closed to tourists every Friday for afternoon prayers. If you book a Friday tour, we adjust the itinerary to cover the royal Fatehpur Sikri ghost city, Agra Fort, Baby Taj, and Mathura temples, or schedule Taj entry on the following morning.",
        hi: "हाँ, ताजमहल प्रत्येक शुक्रवार को जुमे की नमाज के कारण पर्यटकों के लिए पूर्णतः बंद रहता है। यदि आपका टूर शुक्रवार का है, तो हम आगरा किला, फतेहपुर सीकरी, बेबी ताज और मथुरा दर्शन की व्यवस्था करते हैं अथवा अगले दिन सुबह ताज दर्शन कराते हैं।",
      },
    },
    {
      q: {
        en: "Can we book official ASI monument tickets online in advance?",
        hi: "क्या हम स्मारकों के आधिकारिक ASI टिकट पहले से ऑनलाइन बुक कर सकते हैं?",
      },
      a: {
        en: "Yes! In fact, we strongly recommend booking tickets through the official Archaeological Survey of India (ASI) portal (asi.payumoney.com) to avoid physical queue counters. Your chauffeur and certified guide will share the official link and assist you with quick QR scanning at the gate.",
        hi: "हाँ! हम भारतीय पुरातत्व सर्वेक्षण (ASI) के आधिकारिक पोर्टल से ही ऑनलाइन टिकट लेने की सलाह देते हैं ताकि टिकट खिड़की पर लाइन न लगानी पड़े। आपके ड्राइवर और गाइड गेट पर तुरंत क्यूआर कोड स्कैनिंग में पूरी सहायता करते हैं।",
      },
    },
    {
      q: {
        en: "Can we safely store our luggage inside the cab while visiting monuments?",
        hi: "स्मारकों के भ्रमण के दौरान क्या हमारा सामान कार में सुरक्षित रहेगा?",
      },
      a: {
        en: "100% yes. Your private vehicle remains locked and guarded by your dedicated commercial chauffeur throughout your monument visits. You can leave heavy suitcases, backpacks, and personal shopping securely in the car.",
        hi: "बिल्कुल सुरक्षित रहेगा। आपके भ्रमण के दौरान गाड़ी लॉक रहती है और आपके समर्पित वर्दीधारी ड्राइवर की देखरेख में रहती है। आप अपने भारी सूटकेस और खरीदारी का सामान कार में सुरक्षित छोड़ सकते हैं।",
      },
    },
    {
      q: {
        en: "Are your tour guides licensed by the Ministry of Tourism?",
        hi: "क्या आपके टूर गाइड पर्यटन मंत्रालय द्वारा अधिकृत और प्रमाणित हैं?",
      },
      a: {
        en: "Yes. All guides arranged by SK Baghel Tour & Travels carry valid Ministry of Tourism (Govt. of India) or UP State Tourism identity badges. They are fluent in English, Hindi, and regional languages with deep scholarly knowledge of Mughal architecture, with zero forced shopping stops.",
        hi: "हाँ, हमारे सभी गाइड भारत सरकार के पर्यटन मंत्रालय या उत्तर प्रदेश पर्यटन विभाग द्वारा अधिकृत बैजधारक हैं। उन्हें मुग़ल वास्तुकला की गहरी जानकारी है और वे किसी भी दुकान पर जबरन रुकने के दबाव से पूर्णतः मुक्त सेवा देते हैं।",
      },
    },
    {
      q: {
        en: "What is your cancellation and refund policy for this tour package?",
        hi: "इस टूर पैकेज के लिए रद्दीकरण और रिफंड की क्या नीति है?",
      },
      a: {
        en: "For same-day cab tours, we offer 100% full refund if cancelled up to 24 hours prior to departure. For multi-day circuits (like Golden Triangle or Agra Overnight), cancellation is tiered: 100% refund for 61+ days notice, 80% for 31–60 days, down to 0% within 5 days. Approved refunds are credited in 5–7 business days.",
        hi: "सेम-डे कैब टूर के लिए प्रस्थान से 24 घंटे पहले रद्द करने पर 100% पूरा रिफंड मिलता है। मल्टी-डे टूर के लिए 61+ दिन पहले 100%, 31–60 दिन पहले 80% और 5 दिन के भीतर 0% रिफंड देय होता है। रिफंड 5–7 दिनों में आपके बैंक में आ जाता है।",
      },
    },
    {
      q: {
        en: "Are child safety seats or senior citizen wheelchairs available?",
        hi: "क्या छोटे बच्चों के लिए सीट या वरिष्ठ नागरिकों के लिए व्हीलचेयर उपलब्ध है?",
      },
      a: {
        en: "Yes! Child booster seats can be installed in our Sedans and Innova Crystas upon advance request. For senior citizens, authorized wheelchairs and electric golf-carts are readily available at the Taj Mahal and Agra Fort entry gates, and our chauffeurs assist you with complete priority access.",
        hi: "हाँ! अनुरोध पर सेडान और इनोवा में चाइल्ड सीट लगाई जा सकती है। वरिष्ठ नागरिकों के लिए ताजमहल व आगरा किला प्रवेश द्वारों पर व्हीलचेयर और इलेक्ट्रिक गोल्फ कार्ट उपलब्ध रहते हैं, जिसमें हमारे ड्राइवर पूरा सहयोग करते हैं।",
      },
    },
  ],
};

export function PackageDetailPage({ language = "en", pkg }: PackageDetailPageProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("INR");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const currency = CURRENCIES[selectedCurrency];
  const vehicleTiers = useMemo(() => getPackageVehicleTiers(pkg), [pkg]);
  const timeline = useMemo(() => {
    if (pkg.timeline && pkg.timeline.length > 0) {
      return pkg.timeline;
    }
    return PACKAGE_DEFAULT_TIMELINES[pkg.id] || PACKAGE_DEFAULT_TIMELINES["taj-sunrise"];
  }, [pkg]);

  const faqs = TOUR_SPECIFIC_FAQS[pkg.id] || TOUR_SPECIFIC_FAQS.default;

  const startingPrice = formatPrice(pkg.from, currency);
  const langPrefix = language === "hi" ? "/hi" : "/en";

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const whatsappInquiryUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello SK Baghel Tour & Travels, I am interested in booking the "${pkg.name}" (${pkg.duration}). Please share vehicle availability and final all-inclusive quote.`
  )}`;

  // Schema.org JSON-LD Structured Data
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip",
        "@id": `https://skbagheltravels.in${langPrefix}/packages/${pkg.slug}/#tour`,
        name: pkg.name,
        description: pkg.blurb,
        touristType: ["Family", "Couple", "International Tourist", "Solo Traveler"],
        itinerary: {
          "@type": "ItemList",
          numberOfItems: timeline.length,
          itemListElement: timeline.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: language === "hi" ? item.title.hi : item.title.en,
            description: language === "hi" ? item.desc.hi : item.desc.en,
          })),
        },
        offers: {
          "@type": "Offer",
          price: pkg.from,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          validFrom: "2026-01-01",
          url: `https://skbagheltravels.in${langPrefix}/packages/${pkg.slug}/`,
        },
      },
      {
        "@type": "TaxiService",
        "@id": `https://skbagheltravels.in${langPrefix}/packages/${pkg.slug}/#service`,
        name: `${pkg.name} — Private Chauffeur Tour`,
        provider: {
          "@type": "LocalBusiness",
          name: "SK Baghel Tour & Travels",
          telephone: contact.phone,
          email: contact.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Near Taj East Gate Road, Taj Ganj",
            addressLocality: "Agra",
            addressRegion: "Uttar Pradesh",
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
            name: language === "hi" ? "होम" : "Home",
            item: `https://skbagheltravels.in${langPrefix}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: language === "hi" ? "टूर पैकेज" : "Tour Packages",
            item: `https://skbagheltravels.in${langPrefix}/packages/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: pkg.name,
            item: `https://skbagheltravels.in${langPrefix}/packages/${pkg.slug}/`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: language === "hi" ? f.q.hi : f.q.en,
          acceptedAnswer: {
            "@type": "Answer",
            text: language === "hi" ? f.a.hi : f.a.en,
          },
        })),
      },
    ],
  };

  return (
    <main id="main-content" className="package-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* 1. Breadcrumbs & Top Utilities */}
      <div className="detail-topbar">
        <div className="container">
          <div className="topbar-inner">
            <nav className="breadcrumb-nav" aria-label="Breadcrumb">
              <ol className="breadcrumb-list">
                <li>
                  <a href={langPrefix === "/hi" ? "/hi/" : "/"}>
                    {language === "hi" ? "होम" : "Home"}
                  </a>
                </li>
                <li className="separator">/</li>
                <li>
                  <a href={`${langPrefix}/packages/`}>
                    {language === "hi" ? "टूर पैकेज" : "Tour Packages"}
                  </a>
                </li>
                <li className="separator">/</li>
                <li className="current" aria-current="page">
                  {pkg.name}
                </li>
              </ol>
            </nav>

            {/* Currency Selector */}
            <div className="currency-selector-wrap" aria-label="Select Currency">
              <span className="currency-label">
                {language === "hi" ? "मुद्रा चुनें:" : "Currency:"}
              </span>
              <div className="currency-pills" role="radiogroup">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={selectedCurrency === c}
                    className={`currency-pill ${selectedCurrency === c ? "active" : ""}`}
                    onClick={() => setSelectedCurrency(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Package Hero Section */}
      <section className="pkg-hero-section">
        <div className="container">
          <div className="pkg-hero-grid">
            {/* Left Content Column */}
            <div className="pkg-hero-content">
              <div className="pkg-kicker-row">
                <span className="pkg-kicker-pill">{pkg.kicker.toUpperCase()}</span>
                <span className="pkg-duration-pill">⏱ {pkg.duration}</span>
                <span className="pkg-rating-pill">★ 5.0 (480+ Reviews)</span>
              </div>

              <h1 className="pkg-title">{pkg.name}</h1>
              <p className="pkg-blurb">{pkg.blurb}</p>

              <div className="pkg-highlights-strip">
                <span className="pkg-h-item">✓ 100% Private Sanitized AC Cab</span>
                <span className="pkg-h-item">✓ Police-Verified Chauffeur</span>
                <span className="pkg-h-item">✓ Zero Commission Traps</span>
                <span className="pkg-h-item">✓ Doorstep Hotel/Station Pickup</span>
              </div>

              {/* Pricing Box */}
              <div className="pkg-pricing-box">
                <div className="pricing-left">
                  <span className="pricing-caption">
                    {language === "hi" ? "शुरुआती सर्व-समावेशी दर" : "Starting All-Inclusive Fare"}
                  </span>
                  <div className="pricing-val-wrap">
                    <span className="pricing-val">{startingPrice}</span>
                    <span className="pricing-unit">
                      / {language === "hi" ? "निजी सेडान (4+1)" : "Private Sedan (4+1)"}
                    </span>
                  </div>
                  <p className="pricing-subtext">
                    ✓ {language === "hi" ? "टोल, पार्किंग व ड्राइवर भत्ता शामिल" : "All Tolls, Parking & Driver Batta Included"}
                  </p>
                </div>

                <div className="pricing-actions">
                  <a
                    href={`/book.html?package=${pkg.slug}`}
                    className="button button-primary pkg-book-btn"
                  >
                    {language === "hi" ? "अभी ऑनलाइन बुक करें ↗" : "Book This Tour ↗"}
                  </a>
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-whatsapp pkg-wa-btn"
                  >
                    💬 {language === "hi" ? "व्हाट्सएप इन्क्वायरी" : "WhatsApp Inquiry"}
                  </a>
                </div>
              </div>
            </div>

            {/* Right Media Column */}
            <div className="pkg-hero-media">
              <div className="pkg-image-card">
                <picture>
                  <source
                    srcSet={pkg.image.replace(".webp", "-480.webp")}
                    media="(max-width: 600px)"
                  />
                  <source
                    srcSet={pkg.image.replace(".webp", "-768.webp")}
                    media="(max-width: 1024px)"
                  />
                  <img
                    src={pkg.image}
                    alt={`${pkg.name} Sightseeing Tour`}
                    width="600"
                    height="380"
                    className="pkg-hero-img"
                    loading="eager"
                  />
                </picture>
                <div className="pkg-badge-overlay">
                  <span className="gold-dot" />
                  <span>
                    {language === "hi"
                      ? "विश्व धरोहर व ऐतिहासिक सर्किट"
                      : "UNESCO World Heritage Circuit"}
                  </span>
                </div>
                <div className="pkg-type-badge">
                  <span>100% PRIVATE CHAUFFEURED</span>
                </div>
              </div>

              {/* Quick Trust Strip Below Image */}
              <div className="pkg-media-trust">
                <div className="trust-micro-item">
                  <span className="trust-icon">🛡</span>
                  <div>
                    <strong>24×7 Local Desk</strong>
                    <span>Taj Ganj, Agra</span>
                  </div>
                </div>
                <div className="trust-micro-item">
                  <span className="trust-icon">⚡</span>
                  <div>
                    <strong>Instant Confirmation</strong>
                    <span>No Hidden Fees</span>
                  </div>
                </div>
                <div className="trust-micro-item">
                  <span className="trust-icon">🔄</span>
                  <div>
                    <strong>24h Free Cancel</strong>
                    <span>100% Full Refund</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Monuments & Places Covered */}
      <section className="pkg-places-section">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">
              {language === "hi" ? "दर्शनीय स्थल" : "TOUR HIGHLIGHTS"}
            </span>
            <h2 className="section-title">
              {language === "hi" ? "इस यात्रा में शामिल ऐतिहासिक स्मारक" : "Monuments & Sights Covered in This Tour"}
            </h2>
            <p className="section-desc">
              {language === "hi"
                ? "हमारी निजी गाड़ियाँ आपको बिना किसी हड़बड़ी के इन सभी ऐतिहासिक स्थलों का शांतिपूर्ण भ्रमण कराती हैं।"
                : "A seamless, unrushed circuit covering the crown jewels of Mughal architecture and spiritual heritage."}
            </p>
          </div>

          <div className="places-cards-grid">
            {pkg.places.map((place, idx) => (
              <div className="place-card" key={place}>
                <div className="place-num">0{idx + 1}</div>
                <div className="place-info">
                  <h3 className="place-title">{place}</h3>
                  <p className="place-desc">
                    {language === "hi"
                      ? "निजी एसी कैब से द्वार तक आसान पहुँच, गाइड सहायता एवं फोटोग्राफी के लिए पर्याप्त समय।"
                      : "Direct doorstep access, guided historical insights, and relaxed time for architectural photography."}
                  </p>
                </div>
                <span className="place-check-icon">✓</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Hour-by-Hour Itinerary Timeline */}
      <section className="pkg-itinerary-section">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">
              {language === "hi" ? "समय सारणी" : "DETAILED ITINERARY"}
            </span>
            <h2 className="section-title">
              {language === "hi" ? "घंटे-दर-घंटे यात्रा कार्यक्रम" : "Hour-by-Hour Planned Schedule"}
            </h2>
            <p className="section-desc">
              {language === "hi"
                ? "यह एक निजी यात्रा है। आप अपनी सुविधा अनुसार किसी भी स्थल पर समय कम या ज्यादा कर सकते हैं।"
                : "Designed for optimal monument lighting and minimum queue times. Paced entirely around your comfort."}
            </p>
          </div>

          <div className="timeline-container">
            {timeline.map((stop, index) => (
              <div className="timeline-item" key={index}>
                <div className="timeline-marker">
                  <div className="marker-dot" />
                  {index !== timeline.length - 1 && <div className="marker-line" />}
                </div>
                <div className="timeline-content">
                  <span className="timeline-time">{stop.time}</span>
                  <h3 className="timeline-title">
                    {language === "hi" ? stop.title.hi : stop.title.en}
                  </h3>
                  <p className="timeline-desc">
                    {language === "hi" ? stop.desc.hi : stop.desc.en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MakeMyTrip-Style Vehicle Upgrade Pricing Matrix */}
      <section className="pkg-vehicles-section">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">
              {language === "hi" ? "गाड़ी विकल्प व किराया" : "VEHICLE OPTIONS & UPGRADES"}
            </span>
            <h2 className="section-title">
              {language === "hi" ? "अपनी पसंद की गाड़ी चुनें" : "Select Your Preferred Chauffeur Vehicle"}
            </h2>
            <p className="section-desc">
              {language === "hi"
                ? "सभी किराये सर्व-समावेशी हैं। टोल, पार्किंग, ईंधन और ड्राइवर भत्ता पहले से शामिल है।"
                : "Transparent flat package pricing across our sanitized commercial fleet. No surge, no hidden fees."}
            </p>
          </div>

          <div className="pkg-vehicles-grid">
            {vehicleTiers.map((tier) => {
              const tierPriceFormatted = formatPrice(tier.price, currency);
              return (
                <div
                  key={tier.vehId}
                  className={`pkg-veh-card ${tier.popular ? "is-popular" : ""}`}
                >
                  {tier.popular && (
                    <div className="veh-pop-tag">
                      {language === "hi" ? "सर्वाधिक लोकप्रिय" : "★ MOST POPULAR CHOICE"}
                    </div>
                  )}

                  <div className="veh-icon-wrapper">
                    {tier.vehId === "sedan" && <SedanVector />}
                    {tier.vehId === "ertiga" && <MpvVector />}
                    {tier.vehId === "innova" && <SuvVector />}
                    {(tier.vehId === "tempo" || tier.vehId === "urbania") && <VanVector />}
                  </div>

                  <div className="veh-header-info">
                    <h3 className="veh-model-name">
                      {language === "hi" ? tier.name.hi : tier.name.en}
                    </h3>
                    <div className="veh-spec-pills">
                      <span className="veh-pill">👥 {tier.seats}</span>
                      <span className="veh-pill">🧳 {tier.bags}</span>
                      <span className="veh-pill">❄️ Dual AC</span>
                    </div>
                  </div>

                  <div className="veh-price-block">
                    <div className="veh-price-row">
                      <span className="veh-price">{tierPriceFormatted}</span>
                      <span className="veh-price-basis">
                        {language === "hi" ? "कुल पैकेज किराया" : "Total Tour Fare"}
                      </span>
                    </div>
                    <span className="veh-inclusive-label">
                      ✓ {language === "hi" ? "टोल, पार्किंग व ड्राइवर शामिल" : "All Tolls, Parking & Driver Included"}
                    </span>
                  </div>

                  <div className="veh-card-action">
                    <a
                      href={`/book.html?package=${pkg.slug}&vehicle=${tier.vehId}`}
                      className={`button ${tier.popular ? "button-primary" : "button-outline"} veh-book-btn`}
                    >
                      {language === "hi" ? "यह गाड़ी चुनें ↗" : "Select & Book ↗"}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Inclusions & Exclusions Breakdown Bento */}
      <section className="pkg-inclusions-section">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">
              {language === "hi" ? "पारदर्शिता" : "CLEAR TRANSPARENCY"}
            </span>
            <h2 className="section-title">
              {language === "hi" ? "पैकेज में क्या शामिल है और क्या नहीं" : "What is Included vs. Excluded"}
            </h2>
            <p className="section-desc">
              {language === "hi"
                ? "हमारी नीति 100% स्पष्ट है। यात्रा के दौरान आपसे कोई अघोषित या गुप्त शुल्क नहीं लिया जाता।"
                : "Honest upfront billing with zero surprises. Compare exactly what you get."}
            </p>
          </div>

          <div className="inclusions-bento-grid">
            {/* Inclusions Box */}
            <div className="inc-box inc-box-included">
              <div className="inc-box-header">
                <span className="inc-header-icon green">✓</span>
                <h3 className="inc-header-title">
                  {language === "hi" ? "100% पैकेज में शामिल" : "Included in Package Fare"}
                </h3>
              </div>
              <ul className="inc-list">
                {pkg.includes.map((inc, i) => (
                  <li key={i}>
                    <span className="check-bullet">✓</span>
                    <span>{inc}</span>
                  </li>
                ))}
                <li>
                  <span className="check-bullet">✓</span>
                  <span>{language === "hi" ? "स्वच्छ व वातानुकूलित (AC) निजी कैब" : "Dedicated sanitized private AC vehicle"}</span>
                </li>
                <li>
                  <span className="check-bullet">✓</span>
                  <span>{language === "hi" ? "सभी एक्सप्रेसवे टोल व राज्य बॉर्डर टैक्स" : "All Expressway tolls and inter-state permit taxes"}</span>
                </li>
                <li>
                  <span className="check-bullet">✓</span>
                  <span>{language === "hi" ? "स्मारकों की अधिकृत पार्किंग व ड्राइवर भत्ता" : "Monument authorized parking & driver allowances"}</span>
                </li>
              </ul>
            </div>

            {/* Exclusions Box */}
            <div className="inc-box inc-box-excluded">
              <div className="inc-box-header">
                <span className="inc-header-icon red">✕</span>
                <h3 className="inc-header-title">
                  {language === "hi" ? "पैकेज में शामिल नहीं (वैकल्पिक)" : "Excluded (Pay As You Go)"}
                </h3>
              </div>
              <ul className="inc-list">
                {pkg.excludes.map((exc, i) => (
                  <li key={i}>
                    <span className="cross-bullet">✕</span>
                    <span>{exc}</span>
                  </li>
                ))}
                <li>
                  <span className="cross-bullet">✕</span>
                  <span>{language === "hi" ? "स्मारक प्रवेश टिकट (ASI ऑनलाइन पोर्टल से सीधे लें)" : "Monument entry tickets (booked directly via official ASI portal)"}</span>
                </li>
                <li>
                  <span className="cross-bullet">✕</span>
                  <span>{language === "hi" ? "व्यक्तिगत भोजन, जलपान व स्नैक्स" : "Meals, drinks & personal snacks"}</span>
                </li>
                <li>
                  <span className="cross-bullet">✕</span>
                  <span>{language === "hi" ? "मंदिरों में विशेष दर्शन वीआईपी पास व दान" : "Temple VIP line passes or personal donations"}</span>
                </li>
              </ul>

              {/* Explanatory note */}
              <div className="inc-explanation-note">
                <strong>
                  💡 {language === "hi" ? "टिकट अलग क्यों रखे गए हैं?" : "Why are tickets separate?"}
                </strong>
                <p>
                  {language === "hi"
                    ? "भारतीय व विदेशी पर्यटकों के टिकट मूल्य भिन्न होते हैं (जैसे ताज महल ₹50 भारतीय / ₹1,100 विदेशी)। टिकट अलग रखने से विदेशी व घरेलू यात्रियों से कोई अनुचित कमीशन नहीं लिया जाता और आपको सीधे आधिकारिक दर पर टिकट मिलता है।"
                    : "ASI charges different entry fees for domestic (₹50) and international travelers (₹1,100). Keeping tickets unbundled ensures you pay only the genuine government rate with zero travel agency markup."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Departure Advice & Travel Tips Bento */}
      <section className="pkg-advisory-section">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">
              {language === "hi" ? "यात्रा परामर्श" : "ESSENTIAL TOUR ADVICE"}
            </span>
            <h2 className="section-title">
              {language === "hi" ? "सफल और आनंददायक यात्रा के सुझाव" : "Travel Tips & Planning Advisory"}
            </h2>
            <p className="section-desc">
              {language === "hi"
                ? "हमारी 15 वर्षों की स्थानीय विशेषज्ञता से तैयार किए गए महत्वपूर्ण दिशा-निर्देश।"
                : "Local wisdom to ensure a hassle-free, memorable visit to the world's most famous monuments."}
            </p>
          </div>

          <div className="pkg-advisory-grid">
            <div className="advisory-card">
              <div className="advisory-icon-wrap">🕌</div>
              <h3 className="advisory-card-title">
                {language === "hi" ? "शुक्रवार बंदी नियम" : "Friday Taj Closure Rule"}
              </h3>
              <p className="advisory-card-text">
                {language === "hi"
                  ? "ताजमहल प्रत्येक शुक्रवार को नमाज के लिए बंद रहता है। शुक्रवार को फतेहपुर सीकरी, आगरा किला व मथुरा-वृंदावन टूर खुले रहते हैं।"
                  : "The Taj Mahal is closed every Friday. Other monuments (Agra Fort, Baby Taj, Fatehpur Sikri, Mathura) operate normally on Fridays."}
              </p>
            </div>

            <div className="advisory-card">
              <div className="advisory-icon-wrap">🌅</div>
              <h3 className="advisory-card-title">
                {language === "hi" ? "सूर्योदय का जादुई समय" : "Best Photography Hours"}
              </h3>
              <p className="advisory-card-text">
                {language === "hi"
                  ? "सुबह 6:00 से 8:30 बजे के बीच ताजमहल में सबसे सुंदर रोशनी और न्यूनतम भीड़ होती है। फोटोग्राफी के लिए यह समय सर्वोत्तम है।"
                  : "06:00 AM to 08:30 AM offers mesmerizing golden light, cool morning breezes, and zero crowd reflections for photography."}
              </p>
            </div>

            <div className="advisory-card">
              <div className="advisory-icon-wrap">👟</div>
              <h3 className="advisory-card-title">
                {language === "hi" ? "पहनावा व जूते" : "Footwear & Dress Etiquette"}
              </h3>
              <p className="advisory-card-text">
                {language === "hi"
                  ? "ताजमहल के मुख्य संगमरमर चबूतरे पर जूता कवर आवश्यक हैं। मथुरा-वृंदावन मंदिरों में शालीन पोशाक पहनना अनिवार्य है।"
                  : "Shoe covers are provided at the Taj Mahal mausoleum entrance. Modest shoulder-and-knee covering attire is required in Braj temples."}
              </p>
            </div>

            <div className="advisory-card">
              <div className="advisory-icon-wrap">🛡️</div>
              <h3 className="advisory-card-title">
                {language === "hi" ? "जीरो कमीशन गारंटी" : "Zero Commission Trap Guarantee"}
              </h3>
              <p className="advisory-card-text">
                {language === "hi"
                  ? "हमारे ड्राइवर आपको किसी भी कमीशन वाली मार्बल या कपड़े की दुकान पर जाने के लिए कभी मजबूर नहीं करेंगे। आपकी संतुष्टि ही हमारी प्राथमिकता है।"
                  : "Our drivers are strictly prohibited from driving you to commission gift shops or fake emporiums. 100% honest local hospitality."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Cancellation Policy Table */}
      <section className="pkg-cancellation-section">
        <div className="container">
          <div className="cancellation-card">
            <div className="cancellation-head">
              <div className="cancel-badge">
                {language === "hi" ? "पारदर्शी नीति" : "100% REFUND GUARANTEE"}
              </div>
              <h2 className="cancellation-title">
                {language === "hi" ? "रद्दीकरण व रिफंड अनुसूची" : "Tour Cancellation & Refund Schedule"}
              </h2>
              <p className="cancellation-subtitle">
                {language === "hi"
                  ? "डे कैब टूर 24 घंटे पहले रद्द करने पर 100% पूरा रिफंड मिलता है। मल्टी-डे टूर के लिए निम्न तालिका लागू होती है:"
                  : "Same-day cab packages enjoy 100% free cancellation up to 24 hours before pickup. Multi-day tours follow our published transparent slabs:"}
              </p>
            </div>

            <div className="cancellation-table-wrap">
              <table className="cancellation-table">
                <thead>
                  <tr>
                    <th>{language === "hi" ? "रद्दीकरण का समय" : "Notice Period Prior to Tour"}</th>
                    <th>{language === "hi" ? "कटौती शुल्क" : "Cancellation Fee"}</th>
                    <th>{language === "hi" ? "रिफंड राशि" : "Refund Amount"}</th>
                  </tr>
                </thead>
                <tbody>
                  {cancellationSlabsTour.map((slab, i) => (
                    <tr key={i}>
                      <td><strong>{slab.days}</strong></td>
                      <td>{slab.fee}</td>
                      <td><span className="refund-pill">{slab.refund}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="cancel-footer-note">
              {language === "hi"
                ? "सभी स्वीकृत रिफंड सीधे आपके मूल भुगतान स्रोत (बैंक खाता/यूपीआई/कार्ड) में 5–7 कार्यदिवसों के भीतर जमा कर दिए जाते हैं।"
                : "All approved refunds are credited back to the original bank, UPI, or card account within 5 to 7 business days."}
            </p>
          </div>
        </div>
      </section>

      {/* 9. Tour-Specific FAQ Accordion */}
      <section className="pkg-faqs-section">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">
              {language === "hi" ? "सामान्य प्रश्न" : "TOUR FAQS"}
            </span>
            <h2 className="section-title">
              {language === "hi" ? "टूर से जुड़े अक्सर पूछे जाने वाले सवाल" : "Frequently Asked Questions"}
            </h2>
            <p className="section-desc">
              {language === "hi"
                ? "इस पैकेज के बारे में यात्रियों द्वारा अक्सर पूछे जाने वाले महत्वपूर्ण प्रश्न।"
                : "Everything you need to know about timings, guide services, child safety, and tickets."}
            </p>
          </div>

          <div className="pkg-faqs-accordion">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className={`pkg-faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="pkg-faq-btn"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`pkg-faq-ans-${idx}`}
                  >
                    <span className="pkg-faq-q">
                      {language === "hi" ? faq.q.hi : faq.q.en}
                    </span>
                    <span className="pkg-faq-chevron" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={`pkg-faq-ans-${idx}`}
                      className="pkg-faq-body"
                      role="region"
                      aria-labelledby={`pkg-faq-btn-${idx}`}
                    >
                      <p>{language === "hi" ? faq.a.hi : faq.a.en}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. 24x7 Custom Tour Planning & Dispatch Banner */}
      <section className="pkg-cta-section">
        <div className="container">
          <div className="pkg-cta-banner">
            <div className="pkg-cta-text">
              <span className="pkg-cta-eyebrow">
                {language === "hi" ? "कस्टम टूर योजना" : "NEED A CUSTOM ITINERARY?"}
              </span>
              <h2 className="pkg-cta-title">
                {language === "hi"
                  ? "अपनी पसंद के अनुसार पैकेज कस्टमाइज़ कराएं"
                  : "Tailor This Tour Exactly to Your Schedule"}
              </h2>
              <p className="pkg-cta-desc">
                {language === "hi"
                  ? "परिवार, समूह या विदेशी मेहमानों के लिए विशेष समय, गाइड अथवा वाहन व्यवस्था हेतु हमारे स्थानीय सहायता डेस्क से तुरंत संपर्क करें।"
                  : "Traveling with family, corporate delegates, or international guests? Speak with our Taj Ganj dispatch team for customized timing and vehicle upgrades."}
              </p>
            </div>

            <div className="pkg-cta-actions">
              <a
                href={`tel:${contact.phone}`}
                className="button button-primary"
              >
                📞 {contact.phoneDisplay}
              </a>
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-whatsapp"
              >
                💬 {language === "hi" ? "व्हाट्सएप चैट" : "WhatsApp Chat"}
              </a>
              <a
                href={`/book.html?package=${pkg.slug}`}
                className="button button-outline"
              >
                {language === "hi" ? "ऑनलाइन बुकिंग ↗" : "Book Online ↗"}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PackageDetailPage;
