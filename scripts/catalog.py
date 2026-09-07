"""Single source of truth for SSG marketing pages. Fares stay identical in both languages."""

SITE = "https://skbagheltravels.in"
PHONE = "+919876543210"
PHONE_DISPLAY = "+91 98765 43210"
WHATSAPP = "919876543210"
EMAIL = "bookings@skbagheltravels.in"
ADDRESS = "Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001"
HOURS = "Bookings open 24×7"
MAPS_URL = "https://maps.google.com/?q=Taj+Ganj+Agra"
GST = "09ABCDE1234F1Z5"  # placeholder — replace before launch
GEO = {"lat": 27.1632, "lng": 78.0322}

CITIES = {
    "agra": {"en": "Agra", "hi": "आगरा", "code": "AGR"},
    "delhi": {"en": "Delhi", "hi": "दिल्ली", "code": "DEL"},
    "jaipur": {"en": "Jaipur", "hi": "जयपुर", "code": "JAI"},
    "mathura": {"en": "Mathura", "hi": "मथुरा", "code": "MAT"},
    "gwalior": {"en": "Gwalior", "hi": "ग्वालियर", "code": "GWL"},
    "lucknow": {"en": "Lucknow", "hi": "लखनऊ", "code": "LKO"},
}

VEHICLES = [
    {
        "id": "sedan",
        "slug": "sedan",
        "name": {"en": "Sedan", "hi": "सेडान"},
        "klass": {"en": "Dzire class", "hi": "डिजायर क्लास"},
        "seats": 4,
        "bags": 2,
        "per_km": 10,
        "image": "/assets/fleet/sedan.webp",
        "blurb": {
            "en": "Everyday comfort for city rides, Yamuna Expressway drops, and local sightseeing.",
            "hi": "शहर की सवारी, यमुना एक्सप्रेसवे ड्रॉप और लोकल दर्शन के लिए रोजमर्रा का आराम।",
        },
        "suitable": {
            "en": "Couples, airport transfers, 1–4 passengers",
            "hi": "कपल, एयरपोर्ट ट्रांसफर, 1–4 यात्री",
        },
        "tags": "4+1 SEATS · AC · 2 BAGS",
        "rate_range": "₹10–₹12/km",
        "models": {
            "en": ["Maruti Suzuki Dzire", "Toyota Etios", "Hyundai Aura", "Wagon R / Tiago (Hatchback ₹10/km)"],
            "hi": ["मारुति सुजुकी डिजायर", "टोयोटा इटियोस", "हुंडई ऑरा", "वैगन आर / टियागो (हैचबैक ₹10/किमी)"],
        },
    },
    {
        "id": "ertiga",
        "slug": "ertiga",
        "name": {"en": "Ertiga", "hi": "अर्टिगा"},
        "klass": {"en": "6+1 MPV", "hi": "6+1 एमपीवी"},
        "seats": 6,
        "bags": 3,
        "per_km": 14,
        "image": "/assets/fleet/ertiga.webp",
        "blurb": {
            "en": "A little more room for families without stepping up to a large SUV.",
            "hi": "बड़ी एसयूवी के बिना परिवार के लिए आरामदायक जगह और सामान की सुविधा।",
        },
        "suitable": {
            "en": "Families, 5–6 passengers",
            "hi": "परिवार, 5–6 यात्री",
        },
        "tags": "6+1 SEATS · AC · 3 BAGS",
        "rate_range": "₹14–₹16/km",
        "models": {
            "en": ["Maruti Suzuki Ertiga", "Toyota Rumion", "Renault Triber"],
            "hi": ["मारुति सुजुकी अर्टिगा", "टोयोटा रुमियन", "रेनॉ ट्राइबर"],
        },
    },
    {
        "id": "innova",
        "slug": "innova-crysta",
        "name": {"en": "Innova Crysta", "hi": "इनोवा क्रिस्टा"},
        "klass": {"en": "6+1 SUV", "hi": "6+1 एसयूवी"},
        "seats": 6,
        "bags": 4,
        "per_km": 18,
        "image": "/assets/fleet/innova.webp",
        "blurb": {
            "en": "The outstation favourite — plush pushback seats, smooth suspension, and a quiet cabin.",
            "hi": "आउटस्टेशन की पसंदीदा — आरामदायक पुशबैक सीटें, बेहतरीन सस्पेंशन और शांत केबिन।",
        },
        "suitable": {
            "en": "Longer routes, elders, 4–6 passengers",
            "hi": "लंबे रूट, बुजुर्ग, 4–6 यात्री",
        },
        "tags": "6+1 SEATS · AC · 4 BAGS",
        "rate_range": "₹18–₹23/km",
        "models": {
            "en": ["Toyota Innova Crysta", "Toyota Innova Hycross", "Toyota Fortuner VIP (₹35/km)"],
            "hi": ["टोयोटा इनोवा क्रिस्टा", "टोयोटा इनोवा हाइक्रॉस", "टोयोटा फॉर्च्यूनर वीआईपी (₹35/किमी)"],
        },
    },
    {
        "id": "tempo",
        "slug": "tempo-traveller",
        "name": {"en": "Tempo Traveller", "hi": "टेम्पो ट्रैवलर"},
        "klass": {"en": "12–17 seater", "hi": "12–17 सीटर"},
        "seats": 12,
        "bags": 8,
        "per_km": 25,
        "image": "/assets/fleet/tempo.webp",
        "blurb": {
            "en": "Spacious pushback seats, luggage bay, individual AC vents, and ice-box for group travel.",
            "hi": "ग्रुप ट्रैवल के लिए चौड़ी पुशबैक सीटें, बड़ा लगेज बे और पर्सनल एसी वेंट्स।",
        },
        "suitable": {
            "en": "Family tours, pilgrimage groups, 7–12 passengers",
            "hi": "पारिवारिक टूर, तीर्थ यात्रा, 7–12 यात्री",
        },
        "tags": "12+1 SEATS · AC · LUGGAGE BAY",
        "rate_range": "₹22–₹34/km",
        "models": {
            "en": ["9-Seater Luxury Maharaja", "12-Seater Standard Pushback", "16-Seater Executive", "20-Seater Deluxe", "26-Seater Grand Tourer"],
            "hi": ["9-सीटर लग्जरी महाराजा", "12-सीटर स्टैंडर्ड पुशबैक", "16-सीटर एग्जीक्यूटिव", "20-सीटर डीलक्स", "26-सीटर ग्रैंड टूरर"],
        },
    },
    {
        "id": "urbania",
        "slug": "urbania",
        "name": {"en": "Urbania", "hi": "अर्बनिया"},
        "klass": {"en": "Premium van", "hi": "प्रीमियम वैन"},
        "seats": 16,
        "bags": 10,
        "per_km": 34,
        "image": "/assets/fleet/urbania.webp",
        "blurb": {
            "en": "Chauffeur-grade luxury executive travel with airplane-style cabin styling and sealed acoustics.",
            "hi": "हवाई जहाज जैसी केबिन स्टाइलिंग और शांत राइड के साथ शोफर-ग्रेड लग्जरी ग्रुप ट्रैवल।",
        },
        "suitable": {
            "en": "Wedding parties, corporate delegations, 13–16 passengers",
            "hi": "शादी, कॉर्पोरेट डेलिगेशन, 13–16 यात्री",
        },
        "tags": "16 SEATS · PREMIUM · AC",
        "rate_range": "₹34–₹38/km",
        "models": {
            "en": ["Force Urbania 9-Seater Executive VIP", "12-Seater Luxury Cabin", "17-Seater Royal Van"],
            "hi": ["फ़ोर्स अर्बनिया 9-सीटर एग्जीक्यूटिव वीआईपी", "12-सीटर लग्जरी केबिन", "17-सीटर रॉयल वैन"],
        },
    },
]

AIRPORT_STATION_TRANSFERS = [
    {
        "id": "agra-station",
        "name": {"en": "Agra Cantt / Fort Railway Station Transfer", "hi": "आगरा कैंट / फोर्ट रेलवे स्टेशन ट्रांसफर"},
        "desc": {"en": "Doorstep chauffeur pickup with name-board at station platform exit; luggage assistance to hotel.", "hi": "प्लेटफॉर्म एग्जिट पर नेम-बोर्ड के साथ स्वागत और होटल तक आरामदायक ड्रॉप।"},
        "duration": "45m",
        "fares": {"sedan": 800, "ertiga": 900, "innova": 1100, "tempo": 2200, "urbania": 3500},
    },
    {
        "id": "agra-airport",
        "name": {"en": "Agra Kheria Airport (AGR) Transfer", "hi": "आगरा खेरिया एयरपोर्ट ट्रांसफर"},
        "desc": {"en": "Flight tracking, terminal arrival meet & greet, sanitized air-conditioned transfer to city.", "hi": "फ्लाइट ट्रैकिंग और टर्मिनल अराइवल पर त्वरित पिकअप व होटल ड्रॉप।"},
        "duration": "40m",
        "fares": {"sedan": 900, "ertiga": 1000, "innova": 1250, "tempo": 2500, "urbania": 3800},
    },
    {
        "id": "delhi-airport",
        "name": {"en": "Delhi IGI Airport (DEL) ⇄ Agra Express Transfer", "hi": "दिल्ली आईजीआई एयरपोर्ट ⇄ आगरा एक्सप्रेसवे ट्रांसफर"},
        "desc": {"en": "Direct Yamuna Expressway non-stop highway drop between IGI Airport Terminals 1/2/3 and Agra hotels.", "hi": "दिल्ली एयरपोर्ट टर्मिनलों से सीधे यमुना एक्सप्रेसवे द्वारा आगरा होटल ड्रॉप।"},
        "duration": "3h 30m",
        "fares": {"sedan": 3499, "ertiga": 4499, "innova": 6499, "tempo": 9500, "urbania": 14000},
    },
]


ROUTES = [
    {
        "id": "agra-delhi",
        "from": "agra",
        "to": "delhi",
        "km": 230,
        "duration": "3h 30m",
        "kind": "one-way",
        "slug_en": "agra-to-delhi-taxi",
        "slug_hi": "agra-se-delhi-taxi",
        "fares": {"sedan": 3499, "ertiga": 4499, "innova": 6499, "tempo": 9500, "urbania": 14000},
        "intro": {
            "en": "A 230 km direct expressway drop from Agra to Delhi. Sedan from ₹3,499. Advance shown before you pay. Call or WhatsApp to confirm the car.",
            "hi": "आगरा से दिल्ली 230 किमी एक्सप्रेसवे ड्रॉप। सेडान ₹3,499 से। भुगतान से पहले स्पष्ट एडवांस। कॉल या व्हाट्सऐप पर तुरंत बुकिंग।",
        },
    },
    {
        "id": "delhi-agra",
        "from": "delhi",
        "to": "agra",
        "km": 230,
        "duration": "3h 30m",
        "kind": "one-way",
        "slug_en": "delhi-to-agra-taxi",
        "slug_hi": "delhi-se-agra-taxi",
        "fares": {"sedan": 3499, "ertiga": 4499, "innova": 6499, "tempo": 9500, "urbania": 14000},
        "intro": {
            "en": "Delhi to Agra taxi for the Taj Mahal. Airport and hotel pickups via Yamuna Expressway. Sedan from ₹3,499.",
            "hi": "ताजमहल के लिए दिल्ली से आगरा टैक्सी। यमुना एक्सप्रेसवे से एयरपोर्ट और होटल पिकअप। सेडान ₹3,499 से।",
        },
    },
    {
        "id": "agra-jaipur",
        "from": "agra",
        "to": "jaipur",
        "km": 240,
        "duration": "4h 30m",
        "kind": "one-way",
        "slug_en": "agra-to-jaipur-taxi",
        "slug_hi": "agra-se-jaipur-taxi",
        "fares": {"sedan": 3499, "ertiga": 4999, "innova": 6999, "tempo": 11000, "urbania": 16000},
        "intro": {
            "en": "Agra to Jaipur in about 4 hours 30 minutes via NH-21. Sedan from ₹3,499, Ertiga from ₹4,999, Innova from ₹6,999.",
            "hi": "आगरा से जयपुर लगभग 4 घंटे 30 मिनट (NH-21)। सेडान ₹3,499 से, अर्टिगा ₹4,999 से, इनोवा ₹6,999 से।",
        },
    },
    {
        "id": "agra-mathura",
        "from": "agra",
        "to": "mathura",
        "km": 55,
        "duration": "1h 15m",
        "kind": "one-way",
        "slug_en": "agra-to-mathura-taxi",
        "slug_hi": "agra-se-mathura-taxi",
        "fares": {"sedan": 2200, "ertiga": 2800, "innova": 3800, "tempo": 5500, "urbania": 8000},
        "intro": {
            "en": "Agra to Mathura & Vrindavan in 1 hour 15 minutes. Sedan from ₹2,200. Ideal for darshan and temple visits.",
            "hi": "आगरा से मथुरा और वृंदावन 1 घंटे 15 मिनट। सेडान ₹2,200 से। मंदिर दर्शन के लिए सबसे सुगम विकल्प।",
        },
    },
    {
        "id": "agra-gwalior",
        "from": "agra",
        "to": "gwalior",
        "km": 120,
        "duration": "2h 30m",
        "kind": "one-way",
        "slug_en": "agra-to-gwalior-taxi",
        "slug_hi": "agra-se-gwalior-taxi",
        "fares": {"sedan": 3000, "ertiga": 3800, "innova": 5500, "tempo": 7500, "urbania": 11000},
        "intro": {
            "en": "Agra to Gwalior taxi, about 2 hours 30 minutes. Sedan from ₹3,000, Innova from ₹5,500.",
            "hi": "आगरा से ग्वालियर टैक्सी, लगभग 2 घंटे 30 मिनट। सेडान ₹3,000 से, इनोवा ₹5,500 से।",
        },
    },
    {
        "id": "delhi-jaipur",
        "from": "delhi",
        "to": "jaipur",
        "km": 270,
        "duration": "5h",
        "kind": "one-way",
        "slug_en": "delhi-to-jaipur-taxi",
        "slug_hi": "delhi-se-jaipur-taxi",
        "fares": {"sedan": 5000, "ertiga": 6200, "innova": 8800, "tempo": 12000, "urbania": 17500},
        "intro": {
            "en": "Delhi to Jaipur outstation taxi. Sedan from ₹5,000. Round trip with minimum 300 km/day billing.",
            "hi": "दिल्ली से जयपुर आउटस्टेशन टैक्सी। सेडान ₹5,000 से। राउंड ट्रिप 300 किमी/दिन की न्यूनतम दर पर।",
        },
    },
    {
        "id": "agra-lucknow",
        "from": "agra",
        "to": "lucknow",
        "km": 335,
        "duration": "6h",
        "kind": "one-way",
        "slug_en": "agra-to-lucknow-taxi",
        "slug_hi": "agra-se-lucknow-taxi",
        "fares": {"sedan": 7000, "ertiga": 8500, "innova": 12000, "tempo": 16000, "urbania": 22000},
        "intro": {
            "en": "Agra to Lucknow via Agra-Lucknow Expressway, about 5-6 hours. Innova recommended for highway comfort.",
            "hi": "आगरा-लखनऊ एक्सप्रेसवे से लगभग 5-6 घंटे। एक्सप्रेसवे के आरामदायक सफर के लिए इनोवा क्रिस्टा सर्वश्रेष्ठ।",
        },
    },
    {
        "id": "agra-local",
        "from": "agra",
        "to": "agra",
        "km": 80,
        "duration": "8h",
        "kind": "local",
        "slug_en": "agra-sightseeing-taxi",
        "slug_hi": "agra-darshan-taxi",
        "fares": {"sedan": 1900, "ertiga": 2600, "innova": 2850, "tempo": 5500, "urbania": 7500},
        "intro": {
            "en": "Agra local sightseeing package (8 Hours / 80 KM) for Taj Mahal, Agra Fort, and Baby Taj. Sedan from ₹1,900.",
            "hi": "ताजमहल, आगरा किला और एतमाद्-उद-दौला के लिए आगरा लोकल दर्शन (8 घंटे / 80 किमी)। सेडान ₹1,900 से।",
        },
    },
]

PACKAGES = [
    {
        "id": "agra-day",
        "slug": "agra-sightseeing",
        "name": {"en": "Same Day Agra Taj Mahal Tour", "hi": "सेम डे आगरा ताजमहल दर्शन"},
        "kicker": {"en": "Same day", "hi": "एक दिन"},
        "duration": {"en": "1 day", "hi": "1 दिन"},
        "price": 3499,
        "image": "/assets/packages/taj-dawn.webp",
        "places": {
            "en": ["Taj Mahal", "Agra Fort", "Itimad-ud-Daulah (Baby Taj)", "Mehtab Bagh"],
            "hi": ["ताज महल", "आगरा किला", "एतमाद्-उद-दौला (बेबी ताज)", "मेहताब बाग"],
        },
        "blurb": {
            "en": "One-day private guided tour covering all iconic Mughal monuments with doorstep hotel or station pickup.",
            "hi": "होटल या स्टेशन पिकअप के साथ सभी मुख्य मुगल स्मारकों का एक दिवसीय गाइडेड टूर।",
        },
        "includes": {
            "en": ["Private AC vehicle with fuel", "Professional commercial chauffeur", "All tolls, parking & state taxes", "Pickup & drop across Agra", "Chilled bottled water"],
            "hi": ["ईंधन सहित प्राइवेट एसी वाहन", "अनुभवी वाणिज्यिक ड्राइवर", "सभी टोल, पार्किंग और राज्य कर", "आगरा में डोरस्टेप पिकअप व ड्रॉप", "मिनरल वाटर"],
        },
        "excludes": {
            "en": ["Monument admission tickets", "Lunch & personal beverages", "Government approved guide fee (optional)", "Camera & video permits"],
            "hi": ["स्मारक प्रवेश टिकट", "भोजन और व्यक्तिगत पेय", "सरकारी गाइड शुल्क (वैकल्पिक)", "कैमरा परमिट"],
        },
        "itinerary": [
            {
                "time": "08:30 AM",
                "title": {"en": "Doorstep Pickup & Welcome", "hi": "पिकअप व यात्रा शुरुआत"},
                "desc": {"en": "Your chauffeur arrives at your Agra hotel, railway station, or residence in a sanitized AC cab.", "hi": "आपके होटल या रेलवे स्टेशन पर एसी कैब के साथ शोफर का आगमन।"},
            },
            {
                "time": "09:00 AM",
                "title": {"en": "Taj Mahal Exploration", "hi": "भव्य ताजमहल भ्रमण"},
                "desc": {"en": "Experience the world wonder, intricate marble inlay work, and walk through the Mughal Charbagh gardens.", "hi": "विश्व धरोहर ताजमहल का विस्तृत दीदार और संगमरमर पच्चीकारी कला का अवलोकन।"},
            },
            {
                "time": "12:30 PM",
                "title": {"en": "Authentic Mughlai Lunch Break", "hi": "मुगलई लंच ब्रेक"},
                "desc": {"en": "Relaxed lunch at a premier restaurant savoring authentic Agra culinary specialties.", "hi": "प्रसिद्ध रेस्टोरेंट में लजीज मुगलई व उत्तर भारतीय भोजन का आनंद।"},
            },
            {
                "time": "02:00 PM",
                "title": {"en": "Agra Fort Heritage Tour", "hi": "ऐतिहासिक आगरा किला दर्शन"},
                "desc": {"en": "Explore the royal red sandstone fortress, Jahangiri Mahal, Diwan-i-Khas, and Shah Jahan's prison balcony.", "hi": "लाल बलुआ पत्थर का विशाल किला, जहाँगीरी महल और शाहजहाँ की नजरबंदी बुर्ज का भ्रमण।"},
            },
            {
                "time": "04:00 PM",
                "title": {"en": "Itimad-ud-Daulah (Baby Taj)", "hi": "एतमाद्-उद-दौला (बेबी ताज)"},
                "desc": {"en": "Visit the delicate jewel-box tomb on the Yamuna riverbank, the architectural precursor to the Taj.", "hi": "यमुना तट पर स्थित उत्तम पच्चीकारी वाला सफेद संगमरमर का मकबरा।"},
            },
            {
                "time": "05:30 PM",
                "title": {"en": "Mehtab Bagh Sunset View", "hi": "मेहताब बाग सूर्यास्त दर्शन"},
                "desc": {"en": "Catch the golden hour reflection of the Taj Mahal across the Yamuna from the moonlight gardens.", "hi": "यमुना पार से सूर्यास्त के समय ताजमहल का मनोरम स्वर्णिम दृश्य।"},
            },
            {
                "time": "06:30 PM",
                "title": {"en": "Evening Return Drop", "hi": "शाम की वापसी व ड्रॉप"},
                "desc": {"en": "Safe drop-off back to your hotel, Agra Cantt station, or preferred city location.", "hi": "होटल, आगरा कैंट स्टेशन या आपके इच्छित स्थान पर सुरक्षित वापसी ड्रॉप।"},
            },
        ],
        "upgrades": [
            {"veh_id": "sedan", "name": {"en": "Sedan (Dzire / Etios)", "hi": "सेडान (डिज़ायर / इटियोस)"}, "seats": "4+1", "price": 3499},
            {"veh_id": "ertiga", "name": {"en": "Ertiga (6+1 MPV)", "hi": "अर्टिगा (6+1 एमपीवी)"}, "seats": "6+1", "price": 4499},
            {"veh_id": "innova-crysta", "name": {"en": "Innova Crysta (6+1 SUV)", "hi": "इनोवा क्रिस्टा (6+1)"}, "seats": "6+1", "price": 5499},
            {"veh_id": "tempo-traveller", "name": {"en": "Tempo Traveller (12-Seater)", "hi": "टेम्पो ट्रैवलर (12-सीटर)"}, "seats": "12+1", "price": 7500},
            {"veh_id": "urbania", "name": {"en": "Force Urbania Luxury Van", "hi": "फ़ोर्स अर्बनिया लग्जरी वैन"}, "seats": "10+1", "price": 9500},
        ],
    },
    {
        "id": "taj-sunrise",
        "slug": "taj-mahal-sunrise-tour",
        "name": {"en": "Taj Mahal Sunrise Tour", "hi": "ताजमहल सूर्योदय टूर"},
        "kicker": {"en": "Dawn special", "hi": "सूर्योदय स्पेशल"},
        "duration": {"en": "1 day", "hi": "1 दिन"},
        "price": 12999,
        "image": "/assets/packages/taj-dawn.webp",
        "places": {
            "en": ["Taj Mahal at Dawn", "Agra Fort", "Mehtab Bagh"],
            "hi": ["सूर्योदय पर ताजमहल", "आगरा किला", "मेहताब बाग"],
        },
        "blurb": {
            "en": "Early 2:30 AM departure from Delhi to witness the breathtaking sunrise over the Taj Mahal before the crowds arrive.",
            "hi": "भीड़ से पहले ताजमहल पर अद्भुत सूर्योदय देखने के लिए दिल्ली से तड़के 2:30 बजे प्रस्थान।",
        },
        "includes": {
            "en": ["Dedicated private AC car from Delhi NCR", "Yamuna Expressway toll & state entry taxes", "Sunrise ticket assistance", "Breakfast stop", "Agra Fort tour & guide assistance"],
            "hi": ["दिल्ली एनसीआर से समर्पित प्राइवेट एसी कार", "यमुना एक्सप्रेसवे टोल व अंतरराज्यीय टैक्स", "सूर्योदय टिकट सहायता", "नाश्ता स्टॉप", "आगरा किला दर्शन व गाइड"],
        },
        "excludes": {
            "en": ["Monument entry tickets", "Personal shopping & handicrafts", "Alcoholic beverages", "Driver tip (optional)"],
            "hi": ["स्मारक टिकट", "व्यक्तिगत खरीदारी", "अल्कोहलिक पेय", "ड्राइवर टिप (ऐच्छिक)"],
        },
        "itinerary": [
            {
                "time": "02:30 AM",
                "title": {"en": "Departure from Delhi NCR", "hi": "दिल्ली एनसीआर से प्रस्थान"},
                "desc": {"en": "Private chauffeur pickup from your home, hotel, or IGI Airport Delhi for a smooth expressway night drive.", "hi": "दिल्ली/नोएडा/गुड़गांव से प्राइवेट पिकअप और यमुना एक्सप्रेसवे से प्रस्थान।"},
            },
            {
                "time": "05:45 AM",
                "title": {"en": "Taj Mahal East Gate Arrival", "hi": "ताजमहल ईस्ट गेट आगमन"},
                "desc": {"en": "Arrive in Agra just as the gates open; step into the monument grounds amidst morning silence.", "hi": "सुबह के शांत वातावरण में ठीक कपाट खुलने के समय ताज परिसर में प्रवेश।"},
            },
            {
                "time": "06:15 AM",
                "title": {"en": "Taj Mahal Sunrise Wonder", "hi": "अद्भुत सूर्योदय दर्शन"},
                "desc": {"en": "Watch soft morning light bathe the marble dome in golden and pink shades — the ultimate photographer's hour.", "hi": "गुलाबी व स्वर्णिम धूप में चमकते संगमरमर का मनमोहक दीदार।"},
            },
            {
                "time": "09:00 AM",
                "title": {"en": "Deluxe Buffet Breakfast", "hi": "स्वादिष्ट बुफे नाश्ता"},
                "desc": {"en": "Hearty breakfast at a 5-star heritage hotel (Courtyard by Marriott or similar).", "hi": "आगरा के 5-स्टार होटल में पौष्टिक बुफे ब्रेकफास्ट का आनंद।"},
            },
            {
                "time": "10:30 AM",
                "title": {"en": "Agra Fort Guided Tour", "hi": "आगरा किला गाइडेड टूर"},
                "desc": {"en": "Walk through the royal halls of the Mughal emperors with sweeping views of the Taj across the river.", "hi": "शाहजहाँ और अकबर के भव्य महलों व दीवान-ए-आम का ऐतिहासिक अवलोकन।"},
            },
            {
                "time": "01:00 PM",
                "title": {"en": "Marble Artisan Workshop", "hi": "संगमरमर शिल्पकला दर्शन"},
                "desc": {"en": "Witness authentic Pietra Dura marble inlay work passed down through generations since 1632.", "hi": "मुगलकालीन पच्चीकारी कारीगरों की जीवंत कला का अनुभव।"},
            },
            {
                "time": "03:00 PM",
                "title": {"en": "Expressway Drive to Delhi", "hi": "दिल्ली वापसी प्रस्थान"},
                "desc": {"en": "Cruising back via the 6-lane Yamuna Expressway with a refreshment break.", "hi": "यमुना एक्सप्रेसवे से चाय-नाश्ता ब्रेक के साथ दिल्ली की ओर सुगम सफर।"},
            },
            {
                "time": "07:00 PM",
                "title": {"en": "Delhi Arrival & Drop-off", "hi": "दिल्ली आगमन व सुरक्षित ड्रॉप"},
                "desc": {"en": "Doorstep drop at your Delhi hotel, residence, or airport terminal in time for your flight.", "hi": "दिल्ली होटल, घर या आईजीआई एयरपोर्ट पर सुरक्षित ड्रॉप।"},
            },
        ],
        "upgrades": [
            {"veh_id": "sedan", "name": {"en": "Dzire Sedan (4+1)", "hi": "डिज़ायर सेडान (4+1)"}, "seats": "4+1", "price": 12999},
            {"veh_id": "ertiga", "name": {"en": "Ertiga MPV (6+1)", "hi": "अर्टिगा एमपीवी (6+1)"}, "seats": "6+1", "price": 14499},
            {"veh_id": "innova-crysta", "name": {"en": "Innova Crysta (6+1)", "hi": "इनोवा क्रिस्टा (6+1)"}, "seats": "6+1", "price": 16999},
            {"veh_id": "urbania", "name": {"en": "Force Urbania Luxury Van", "hi": "फ़ोर्स अर्बनिया लग्जरी वैन"}, "seats": "10+1", "price": 22500},
        ],
    },
    {
        "id": "mathura-vrindavan",
        "slug": "mathura-vrindavan",
        "name": {"en": "Mathura & Vrindavan Darshan", "hi": "मथुरा और वृंदावन दर्शन"},
        "kicker": {"en": "Day trip", "hi": "डे ट्रिप"},
        "duration": {"en": "1 day", "hi": "1 दिन"},
        "price": 4200,
        "image": "/assets/packages/mathura.webp",
        "places": {
            "en": ["Krishna Janmabhoomi", "Dwarkadhish Temple", "Prem Mandir", "Banke Bihari"],
            "hi": ["कृष्ण जन्मभूमि", "द्वारकाधीश मंदिर", "प्रेम मंदिर", "बांके बिहारी"],
        },
        "blurb": {
            "en": "A spiritual day trip timed around sacred temple aarti schedules, with a local driver who knows the temple lanes.",
            "hi": "मंदिरों की पवित्र आरती के समय अनुसार सुनियोजित दर्शन, तंग गलियों से परिचित स्थानीय ड्राइवर के साथ।",
        },
        "includes": {
            "en": ["AC vehicle with all fuel & driver charges", "Temple area parking and waiting", "Driver allowance", "Doorstep pickup & drop from Agra"],
            "hi": ["ईंधन सहित एसी वाहन", "मंदिर परिसर पार्किंग व वेटिंग", "ड्राइवर भत्ता", "आगरा से डोरस्टेप पिकअप व ड्रॉप"],
        },
        "excludes": {
            "en": ["Special VIP darshan queue passes", "Temple donations & offerings", "Meals, prasad and personal snacks"],
            "hi": ["विशेष वीआईपी दर्शन पास", "व्यक्तिगत दान-दक्षिणा व भोग", "भोजन, नाश्ता व प्रसाद"],
        },
        "itinerary": [
            {
                "time": "07:30 AM",
                "title": {"en": "Morning Departure from Agra", "hi": "आगरा से सुबह प्रस्थान"},
                "desc": {"en": "Chauffeur pickup from your hotel or residence for the 55 km drive to sacred Mathura.", "hi": "आगरा से पावन तीर्थ नगरी मथुरा के लिए 55 किमी का सफर।"},
            },
            {
                "time": "09:00 AM",
                "title": {"en": "Shri Krishna Janmabhoomi", "hi": "श्री कृष्ण जन्मभूमि दर्शन"},
                "desc": {"en": "Visit the holy prison cell (Garbha Griha) where Lord Krishna appeared, and Keshavdev Temple.", "hi": "भगवान श्रीकृष्ण के प्राकट्य स्थल गर्भगृह और केशवदेव मंदिर के दर्शन।"},
            },
            {
                "time": "11:00 AM",
                "title": {"en": "Dwarkadhish Temple & Vishram Ghat", "hi": "द्वारकाधीश मंदिर व विश्राम घाट"},
                "desc": {"en": "Darshan at the historic Dwarkadhish temple and witness the serene Yamuna river ghats.", "hi": "भव्य द्वारकाधीश मंदिर दर्शन और यमुना जी के पावन विश्राम घाट का अवलोकन।"},
            },
            {
                "time": "01:00 PM",
                "title": {"en": "Pure Satvik Lunch in Vrindavan", "hi": "वृंदावन में सात्विक भोजन"},
                "desc": {"en": "Enjoy authentic Brijwasi vegetarian delicacies and fresh sweet lassi in Vrindavan.", "hi": "वृंदावन के प्रसिद्ध रेस्टोरेंट में शुद्ध शाकाहारी सात्विक थाली का स्वाद।"},
            },
            {
                "time": "03:00 PM",
                "title": {"en": "Shri Banke Bihari Ji Temple", "hi": "श्री बांके बिहारी जी दर्शन"},
                "desc": {"en": "Experience the divine afternoon darshan and curtain ceremony at the revered Banke Bihari shrine.", "hi": "अलौकिक बांके बिहारी मंदिर में दर्शन और भावपूर्ण भक्ति का अनुभव।"},
            },
            {
                "time": "05:00 PM",
                "title": {"en": "ISKCON Krishna Balaram Mandir", "hi": "इस्कॉन मंदिर दर्शन"},
                "desc": {"en": "Immerse in joyful kirtan and view the magnificent white marble temple architecture.", "hi": "हरे रामा हरे कृष्णा संकीर्तन और श्वेत संगमरमर स्थापत्य कला का दर्शन।"},
            },
            {
                "time": "06:30 PM",
                "title": {"en": "Prem Mandir Light & Sound Show", "hi": "प्रेम मंदिर भव्य प्रकाश दर्शन"},
                "desc": {"en": "Marvel at the illuminated Italian Carrara marble temple and evening musical fountain display.", "hi": "रंग-बिरंगी रोशनी में नहाए प्रेम मंदिर और संगीतमय फव्वारे का भव्य दृश्य।"},
            },
            {
                "time": "08:30 PM",
                "title": {"en": "Evening Return to Agra", "hi": "आगरा वापसी व ड्रॉप"},
                "desc": {"en": "Relaxed return drive back to Agra with doorstep drop-off.", "hi": "आगरा वापसी और आपके गंतव्य पर सुरक्षित विदाई।"},
            },
        ],
        "upgrades": [
            {"veh_id": "sedan", "name": {"en": "Sedan (Dzire / Etios)", "hi": "सेडान (डिज़ायर / इटियोस)"}, "seats": "4+1", "price": 4200},
            {"veh_id": "ertiga", "name": {"en": "Ertiga MPV (6+1)", "hi": "अर्टिगा एमपीवी (6+1)"}, "seats": "6+1", "price": 5400},
            {"veh_id": "innova-crysta", "name": {"en": "Innova Crysta (6+1)", "hi": "इनोवा क्रिस्टा (6+1)"}, "seats": "6+1", "price": 6800},
            {"veh_id": "tempo-traveller", "name": {"en": "Tempo Traveller (12-Seater)", "hi": "टेम्पो ट्रैवलर (12-सीटर)"}, "seats": "12+1", "price": 8500},
            {"veh_id": "urbania", "name": {"en": "Force Urbania Luxury Van", "hi": "फ़ोर्स अर्बनिया लग्जरी वैन"}, "seats": "10+1", "price": 11500},
        ],
    },
    {
        "id": "gatimaan-express",
        "slug": "gatimaan-express-agra-tour",
        "name": {"en": "Same Day Agra by Gatimaan Train", "hi": "गतिमान एक्सप्रेस ट्रेन आगरा टूर"},
        "kicker": {"en": "Fast train", "hi": "हाई-स्पीड ट्रेन"},
        "duration": {"en": "1 day", "hi": "1 दिन"},
        "price": 14999,
        "image": "/assets/packages/agra-fort.webp",
        "places": {
            "en": ["Gatimaan Express (100 mins)", "Taj Mahal", "Agra Fort", "Buffet Lunch"],
            "hi": ["गतिमान एक्सप्रेस (100 मिनट)", "ताजमहल", "आगरा किला", "स्वादिष्ट लंच"],
        },
        "blurb": {
            "en": "Travel on India's premier high-speed train from Delhi to Agra in 100 minutes. Includes train tickets, private AC car in Agra, and lunch.",
            "hi": "भारत की सुपरफास्ट गतिमान एक्सप्रेस से मात्र 100 मिनट में दिल्ली से आगरा। ट्रेन टिकट, आगरा में प्राइवेट कैब और लंच शामिल।",
        },
        "includes": {
            "en": ["Roundtrip confirmed Gatimaan Express tickets (2 Pax)", "Delhi hotel to Nizamuddin station transfers", "Dedicated private AC car in Agra with chauffeur", "Approved monument guide", "5-Star buffet lunch at luxury hotel"],
            "hi": ["गतिमान एक्सप्रेस के राउंडट्रिप कन्फर्म टिकट (2 व्यक्ति)", "दिल्ली होटल से निज़ामुद्दीन स्टेशन ट्रांसफर", "आगरा में पूरे दिन प्राइवेट एसी कार व शोफर", "अधिकृत टूर गाइड", "5-स्टार होटल में लजीज बुफे लंच"],
        },
        "excludes": {
            "en": ["Monument admission tickets", "Personal shopping and souvenirs", "Alcoholic beverages"],
            "hi": ["स्मारक प्रवेश टिकट", "व्यक्तिगत खरीदारी", "अल्कोहलिक पेय"],
        },
        "itinerary": [
            {
                "time": "07:00 AM",
                "title": {"en": "Delhi Hotel Pickup", "hi": "दिल्ली होटल से पिकअप"},
                "desc": {"en": "Private chauffeur transfers you to Hazrat Nizamuddin Railway Station platform in time for departure.", "hi": "दिल्ली होटल से हजरत निज़ामुद्दीन रेलवे स्टेशन तक प्राइवेट कार द्वारा पिकअप।"},
            },
            {
                "time": "08:10 AM",
                "title": {"en": "Board Gatimaan Express (Train 12050)", "hi": "गतिमान एक्सप्रेस प्रस्थान"},
                "desc": {"en": "India's fastest semi-high speed train departs non-stop for Agra. Hot breakfast served at your seat.", "hi": "ट्रेन नंबर 12050 से नॉन-स्टॉप आगरा प्रस्थान, सीट पर नाश्ता सर्व किया जाता है।"},
            },
            {
                "time": "09:50 AM",
                "title": {"en": "Agra Cantt Platform Welcome", "hi": "आगरा कैंट स्टेशन स्वागत"},
                "desc": {"en": "Arrive in Agra in just 100 minutes; met at the carriage door by your chauffeur and government guide.", "hi": "मात्र 100 मिनट में आगरा कैंट आगमन, स्टेशन पर पर्सनल ड्राइवर व गाइड द्वारा स्वागत।"},
            },
            {
                "time": "10:30 AM",
                "title": {"en": "Guided Taj Mahal Tour", "hi": "ताजमहल विस्तृत भ्रमण"},
                "desc": {"en": "Enter via priority gate and explore the crown jewel of Mughal architecture with historical narrative.", "hi": "गाइड के साथ ताजमहल का विस्तृत और ज्ञानवर्धक दीदार।"},
            },
            {
                "time": "01:00 PM",
                "title": {"en": "5-Star Buffet Lunch", "hi": "5-स्टार बुफे लंच"},
                "desc": {"en": "Multicuisine buffet lunch included at a premier 5-star hotel in Agra (ITC Mughal or Trident).", "hi": "आगरा के 5-स्टार लग्जरी होटल में शानदार बुफे लंच का आनंद।"},
            },
            {
                "time": "02:30 PM",
                "title": {"en": "Agra Fort Heritage Visit", "hi": "आगरा किला दर्शन"},
                "desc": {"en": "Explore the majestic halls, gardens, and Shah Jahan's palace overlooking the river.", "hi": "मुगल साम्राज्य के शक्ति केंद्र रहे भव्य आगरा किले का भ्रमण।"},
            },
            {
                "time": "04:30 PM",
                "title": {"en": "Artisan Workshops & Tea", "hi": "शिल्प कला व शाम की चाय"},
                "desc": {"en": "Visit Agra's legacy zardozi embroidery and marble inlay artisan studios.", "hi": "आगरा की पारंपरिक जरदोज़ी व संगमरमर पच्चीकारी कला का अवलोकन।"},
            },
            {
                "time": "05:15 PM",
                "title": {"en": "Transfer to Agra Cantt Station", "hi": "आगरा कैंट स्टेशन ट्रांसफर"},
                "desc": {"en": "Chauffeur escorts you directly to the platform for your return train.", "hi": "वापसी ट्रेन के लिए आगरा कैंट स्टेशन पर सुविधाजनक ड्रॉप।"},
            },
            {
                "time": "05:50 PM",
                "title": {"en": "Gatimaan Express Return (Train 12049)", "hi": "गतिमान एक्सप्रेस से दिल्ली वापसी"},
                "desc": {"en": "Relax on the air-conditioned return journey. Hot multi-course dinner served on board.", "hi": "ट्रेन नंबर 12049 से दिल्ली वापसी, सफर के दौरान स्वादिष्ट डिनर शामिल।"},
            },
            {
                "time": "07:30 PM",
                "title": {"en": "Delhi Arrival & Hotel Drop", "hi": "दिल्ली आगमन व होटल ड्रॉप"},
                "desc": {"en": "Arrive at Nizamuddin; your waiting chauffeur drops you back to your hotel or airport.", "hi": "निज़ामुद्दीन स्टेशन से आपके होटल या एयरपोर्ट तक सुरक्षित वापसी ड्रॉप।"},
            },
        ],
        "upgrades": [
            {"veh_id": "ac-chair-car", "name": {"en": "AC Chair Car Package (2 Pax)", "hi": "एसी चेयर कार पैकेज (2 व्यक्ति)"}, "seats": "2 Adults", "price": 14999},
            {"veh_id": "executive-class", "name": {"en": "Executive Luxury Class (2 Pax)", "hi": "एग्जीक्यूटिव लग्जरी क्लास (2 व्यक्ति)"}, "seats": "2 Adults", "price": 18999},
        ],
    },
    {
        "id": "agra-fort-day",
        "slug": "agra-unhurried",
        "name": {"en": "Agra Overnight Experience", "hi": "आगरा ओवरनाइट अनुभव"},
        "kicker": {"en": "2 days", "hi": "2 दिन"},
        "duration": {"en": "2 days / 1 night", "hi": "2 दिन / 1 रात"},
        "price": 7800,
        "image": "/assets/packages/agra-fort.webp",
        "places": {
            "en": ["Taj Mahal Dawn", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh Sunset"],
            "hi": ["सुबह का ताजमहल", "आगरा किला", "फतेहपुर सीकरी", "मेहताब बाग सूर्यास्त"],
        },
        "blurb": {
            "en": "Stay overnight in Agra to capture sunset at Mehtab Bagh and sunrise at the Taj, with an excursion to royal Fatehpur Sikri.",
            "hi": "आगरा में एक रात रुकें: मेहताब बाग से सूर्यास्त और ताज पर सूर्योदय देखें, साथ में शाही फतेहपुर सीकरी का भ्रमण।",
        },
        "includes": {
            "en": ["Dedicated private AC vehicle for 2 full days", "Driver night allowance & outstation duty", "All highway tolls, parking and state taxes", "Excursion drive to Fatehpur Sikri", "Doorstep hotel and station pickups"],
            "hi": ["2 पूरे दिन समर्पित प्राइवेट एसी वाहन", "ड्राइवर नाइट चार्ज व ड्यूटी", "सभी हाईवे टोल, पार्किंग और टैक्स", "फतेहपुर सीकरी की विशेष यात्रा", "होटल व रेलवे स्टेशन से पिकअप व ड्रॉप"],
        },
        "excludes": {
            "en": ["Hotel room bookings (vehicle & chauffeur service only)", "Monument entrance tickets", "Meals and personal expenses"],
            "hi": ["होटल रूम बुकिंग (केवल कैब व शोफर शामिल)", "स्मारक प्रवेश शुल्क", "भोजन और व्यक्तिगत खर्च"],
        },
        "itinerary": [
            {
                "time": "Day 1 · 12:00 PM",
                "title": {"en": "Agra Check-in & Freshen Up", "hi": "होटल चेक-इन व शुरुआत"},
                "desc": {"en": "Chauffeur meets you upon arrival in Agra; transfer to your chosen hotel.", "hi": "आगरा आगमन पर ड्राइवर से मुलाकात और होटल चेक-इन।"},
            },
            {
                "time": "Day 1 · 02:30 PM",
                "title": {"en": "Agra Fort & Baby Taj", "hi": "आगरा किला व बेबी ताज दर्शन"},
                "desc": {"en": "Explore the expansive ramparts of Agra Fort followed by the exquisite tomb of Itmad-ud-Daulah.", "hi": "आगरा का लाल किला और यमुना किनारे स्थित खूबसूरत एतमाद्-उद-दौला मकबरा।"},
            },
            {
                "time": "Day 1 · 05:30 PM",
                "title": {"en": "Sunset at Mehtab Bagh", "hi": "मेहताब बाग में सूर्यास्त"},
                "desc": {"en": "Witness the sunset across the river behind the Taj Mahal silhouette.", "hi": "यमुना पार से ढलते सूरज की रोशनी में ताजमहल का जादुई दृश्य।"},
            },
            {
                "time": "Day 1 · 07:30 PM",
                "title": {"en": "Sadar Bazaar Cultural Walk", "hi": "सदर बाजार भ्रमण"},
                "desc": {"en": "Evening walk through Agra's lively market for leather goods and famous Agra Petha.", "hi": "शाम को स्थानीय बाजार में शॉपिंग और स्वादिष्ट पेठे का स्वाद।"},
            },
            {
                "time": "Day 2 · 05:45 AM",
                "title": {"en": "Unhurried Dawn at the Taj", "hi": "सूर्योदय पर ताजमहल दीदार"},
                "desc": {"en": "Experience the Taj Mahal in peaceful morning tranquility without rush or crowds.", "hi": "बिना भीड़-भाड़ के सुबह के शांत वातावरण में ताजमहल का संपूर्ण दर्शन।"},
            },
            {
                "time": "Day 2 · 09:30 AM",
                "title": {"en": "Hotel Breakfast & Check-Out", "hi": "होटल ब्रेकफास्ट व चेक-आउट"},
                "desc": {"en": "Return to your hotel for breakfast and luggage loading.", "hi": "होटल में नाश्ता और लगेज लोड कर चेक-आउट।"},
            },
            {
                "time": "Day 2 · 10:30 AM",
                "title": {"en": "Fatehpur Sikri Royal Excursion", "hi": "फतेहपुर सीकरी शाही भ्रमण"},
                "desc": {"en": "Drive 38 km to the ghost city of Emperor Akbar, Buland Darwaza, and Salim Chishti shrine.", "hi": "अकबर की ऐतिहासिक राजधानी, 54 मीटर ऊँचा बुलंद दरवाज़ा व दरगाह दर्शन।"},
            },
            {
                "time": "Day 2 · 04:00 PM",
                "title": {"en": "Final Return Drop", "hi": "अंतिम वापसी व सुरक्षित ड्रॉप"},
                "desc": {"en": "Chauffeur drops you at Agra Cantt station, hotel, or Expressway junction.", "hi": "आगरा कैंट स्टेशन या एक्सप्रेसवे जंक्शन पर विदाई।"},
            },
        ],
        "upgrades": [
            {"veh_id": "sedan", "name": {"en": "Sedan (Dzire / Etios)", "hi": "सेडान (डिज़ायर / इटियोस)"}, "seats": "4+1", "price": 7800},
            {"veh_id": "ertiga", "name": {"en": "Ertiga MPV (6+1)", "hi": "अर्टिगा एमपीवी (6+1)"}, "seats": "6+1", "price": 9500},
            {"veh_id": "innova-crysta", "name": {"en": "Innova Crysta (6+1)", "hi": "इनोवा क्रिस्टा (6+1)"}, "seats": "6+1", "price": 11800},
            {"veh_id": "tempo-traveller", "name": {"en": "Tempo Traveller (12-Seater)", "hi": "टेम्पो ट्रैवलर (12-सीटर)"}, "seats": "12+1", "price": 16500},
        ],
    },
    {
        "id": "golden-triangle",
        "slug": "golden-triangle",
        "name": {"en": "Golden Triangle Tour", "hi": "गोल्डन ट्रायंगल टूर"},
        "kicker": {"en": "3 days", "hi": "3 दिन"},
        "duration": {"en": "3 days / 2 nights", "hi": "3 दिन / 2 रात"},
        "price": 18500,
        "image": "/assets/packages/golden-triangle.webp",
        "places": {
            "en": ["Delhi", "Agra", "Fatehpur Sikri", "Jaipur"],
            "hi": ["दिल्ली", "आगरा", "फतेहपुर सीकरी", "जयपुर"],
        },
        "blurb": {
            "en": "The iconic North India circuit — chauffeured, perfectly paced, and timed so monuments have breathing room.",
            "hi": "उत्तर भारत का प्रतिष्ठित सर्किट — अनुभवी शोफर के साथ, ऐतिहासिक स्मारकों को सुकून से देखने का अनुभव।",
        },
        "includes": {
            "en": ["Dedicated private AC car for 3 full days", "Professional chauffeur stay, fuel and interstate permits", "All highway tolls, parking and border taxes", "Delhi, Agra and Jaipur city transfers"],
            "hi": ["3 पूरे दिन समर्पित प्राइवेट एसी कार", "ड्राइवर का रहना, ईंधन व ऑल-स्टेट परमिट", "सभी हाईवे टोल, पार्किंग और बॉर्डर टैक्स", "दिल्ली, आगरा व जयपुर शहर में समस्त भ्रमण"],
        },
        "excludes": {
            "en": ["Hotel room reservations (cab service only)", "Monument entrance tickets", "Meals, drinks, and guide charges"],
            "hi": ["होटल रूम बुकिंग (केवल कैब व शोफर शामिल)", "स्मारक प्रवेश टिकट", "भोजन, पेय व निजी गाइड शुल्क"],
        },
        "itinerary": [
            {
                "time": "Day 1",
                "title": {"en": "Delhi Sightseeing & Drive to Agra", "hi": "दिल्ली दर्शन व आगरा प्रस्थान"},
                "desc": {"en": "Pickup from Delhi hotel/airport. Explore India Gate, Qutub Minar, and drive to Agra via Yamuna Expressway. Overnight in Agra.", "hi": "दिल्ली पिकअप, इंडिया गेट व कुतुब मीनार दर्शन, फिर एक्सप्रेसवे से आगरा प्रस्थान। रात्रि विश्राम आगरा।"},
            },
            {
                "time": "Day 2",
                "title": {"en": "Sunrise Taj Mahal, Fatehpur Sikri & Jaipur", "hi": "ताजमहल, सीकरी व जयपुर प्रस्थान"},
                "desc": {"en": "Dawn visit to Taj Mahal and Agra Fort. Drive to Jaipur with stops at Fatehpur Sikri and Abhaneri Stepwell. Overnight in Jaipur.", "hi": "सूर्योदय पर ताजमहल व आगरा किला। सीकरी व आभानेरी होकर जयपुर प्रस्थान। रात्रि विश्राम जयपुर।"},
            },
            {
                "time": "Day 3",
                "title": {"en": "Jaipur Forts & Return to Delhi", "hi": "जयपुर के किले व दिल्ली वापसी"},
                "desc": {"en": "Explore Amber Fort with elephant/jeep ride, Jal Mahal, Hawa Mahal, and City Palace. Scenic afternoon drive back to Delhi.", "hi": "आमेर का किला, जल महल, हवा महल और सिटी पैलेस का दीदार। दोपहर बाद दिल्ली वापसी प्रस्थान।"},
            },
        ],
        "upgrades": [
            {"veh_id": "sedan", "name": {"en": "Sedan (Dzire / Etios)", "hi": "सेडान (डिज़ायर / इटियोस)"}, "seats": "4+1", "price": 18500},
            {"veh_id": "ertiga", "name": {"en": "Ertiga MPV (6+1)", "hi": "अर्टिगा एमपीवी (6+1)"}, "seats": "6+1", "price": 22500},
            {"veh_id": "innova-crysta", "name": {"en": "Innova Crysta (6+1)", "hi": "इनोवा क्रिस्टा (6+1)"}, "seats": "6+1", "price": 27500},
            {"veh_id": "tempo-traveller", "name": {"en": "Tempo Traveller (12-Seater)", "hi": "टेम्पो ट्रैवलर (12-सीटर)"}, "seats": "12+1", "price": 36500},
            {"veh_id": "urbania", "name": {"en": "Force Urbania Luxury Van", "hi": "फ़ोर्स अर्बनिया लग्जरी वैन"}, "seats": "10+1", "price": 45000},
        ],
    },
]

ROUTE_GUIDANCE = {
    "agra-delhi": {
        "highway": "Yamuna Expressway (6-Lane Access-Controlled)",
        "transit_time": "3h 30m (230 km)",
        "departure_tip": {
            "en": "Early morning (05:00–07:00 AM) or mid-afternoon (01:00–03:00 PM) to avoid Delhi NCR peak rush hour.",
            "hi": "दिल्ली एनसीआर के पीक ट्रैफिक से बचने के लिए सुबह जल्दी (05:00–07:00 AM) या दोपहर 1:00 से 3:00 बजे निकलना उत्तम रहता है।",
        },
        "rest_stops": {
            "en": "Jewar Toll Plaza & Tappal Plaza (Costa Coffee, Haldiram's, Subway, clean sanitised rest areas).",
            "hi": "जेवर टोल प्लाजा व टप्पल प्लाजा फूड कोर्ट (हल्दीराम, सबवे, कोस्टा कॉफी व स्वच्छ वॉशरूम)।",
        },
        "toll_tax_policy": {
            "en": "One-way booking includes Yamuna Expressway toll. Round-trip tolls and state permits charged at actuals.",
            "hi": "वन-वे बुकिंग में यमुना एक्सप्रेसवे टोल शामिल है। राउंड-ट्रिप में टोल व स्टेट टैक्स वास्तविक पर्ची अनुसार।",
        },
    },
    "delhi-agra": {
        "highway": "Yamuna Expressway (via Noida / Greater Noida)",
        "transit_time": "3h 30m (230 km)",
        "departure_tip": {
            "en": "06:00 AM departure from Delhi gets you to the Taj Mahal ticket gate by 09:30 AM before peak tourist crowds.",
            "hi": "दिल्ली से सुबह 6:00 बजे निकलने पर आप सुबह 9:30 बजे तक ताज महल पहुँच सकते हैं, भीड़ से पहले।",
        },
        "rest_stops": {
            "en": "Food courts at KM 64 and KM 118 on Yamuna Expressway with hygienic breakfast options.",
            "hi": "यमुना एक्सप्रेसवे पर किमी 64 और किमी 118 पर स्वच्छ रेस्टोरेंट व ब्रेकफास्ट सुविधा।",
        },
        "toll_tax_policy": {
            "en": "One-way fare is 100% all-inclusive (expressway toll & driver allowance included).",
            "hi": "वन-वे किराया पूरी तरह ऑल-इनक्लूसिव है (एक्सप्रेसवे टोल व ड्राइवर चार्ज शामिल)।",
        },
    },
    "agra-jaipur": {
        "highway": "National Highway 21 (Agra–Bikaner Highway)",
        "transit_time": "4h 30m (240 km)",
        "departure_tip": {
            "en": "Depart by 07:30 AM with an optional 1.5-hour stop at UNESCO World Heritage Fatehpur Sikri en route.",
            "hi": "सुबह 7:30 बजे प्रस्थान करें, रास्ते में विश्व धरोहर फतेहपुर सीकरी का 1.5 घंटे का स्टॉप ले सकते हैं।",
        },
        "rest_stops": {
            "en": "Midway restaurants near Bharatpur and Mahwa Highway Treat with pure vegetarian Rajasthani thalis.",
            "hi": "भरतपुर और महवा के पास हाईवे डाइनिंग (शुद्ध शाकाहारी भोजन व जलपान)।",
        },
        "toll_tax_policy": {
            "en": "NH-21 highway toll included in one-way fare. Rajasthan state tax is separate on round trips.",
            "hi": "वन-वे किराये में हाईवे टोल शामिल। राउंड-ट्रिप पर राजस्थान राज्य प्रवेश कर अलग से देय।",
        },
    },
    "agra-mathura": {
        "highway": "NH-19 / Delhi–Agra Highway",
        "transit_time": "1h 15m (55 km)",
        "departure_tip": {
            "en": "Plan your trip around temple aarti times: Morning (07:00–11:00 AM) or Evening (04:30–08:30 PM).",
            "hi": "मंदिरों के पट खुलने व आरती के समय अनुसार यात्रा करें: सुबह 7 से 11 या शाम 4:30 से 8:30 बजे।",
        },
        "rest_stops": {
            "en": "Famous Brijwasi sweets and Highway Masala Dosa hubs along the Farah–Mathura stretch.",
            "hi": "मथुरा मार्ग पर प्रसिद्ध ब्रजवासी मिष्ठान और हाईवे रेस्टोरेंट।",
        },
        "toll_tax_policy": {
            "en": "Local toll and temple area parking assistance included in package.",
            "hi": "लोकल टोल और मंदिर परिसर पार्किंग सहायता किराये में शामिल।",
        },
    },
    "agra-gwalior": {
        "highway": "National Highway 44 (North–South Corridor)",
        "transit_time": "2h 30m (120 km)",
        "departure_tip": {
            "en": "Early morning departure recommended for scenic crossing of the Chambal river valley.",
            "hi": "चंबल नदी घाटी के खूबसूरत नज़ारे देखने के लिए सुबह जल्दी प्रस्थान करें।",
        },
        "rest_stops": {
            "en": "Morena roadside dhabas famous for Gajak and North Indian breakfast.",
            "hi": "मुरैना के पास प्रसिद्ध गज़क और स्वादिष्ट नाश्ते के ढाबे।",
        },
        "toll_tax_policy": {
            "en": "Includes toll taxes. MP state commercial tax separate on outstation trips.",
            "hi": "टोल टैक्स शामिल। आउटस्टेशन ट्रिप पर मध्य प्रदेश स्टेट टैक्स अलग से देय।",
        },
    },
    "delhi-jaipur": {
        "highway": "Delhi–Mumbai Expressway (NE-4) / NH-48",
        "transit_time": "4h 30m (270 km)",
        "departure_tip": {
            "en": "Use the new Delhi–Mumbai Expressway via Sohna for ultra-smooth 120 km/h driving experience.",
            "hi": "सोहना होकर नए दिल्ली-मुंबई एक्सप्रेसवे का उपयोग करें — तीव्र व आरामदायक सफर।",
        },
        "rest_stops": {
            "en": "Modern wayside amenities along NE-4 every 50 km with EV charging, McDonald's, and restrooms.",
            "hi": "एक्सप्रेसवे पर प्रत्येक 50 किमी पर आधुनिक फूड प्लाजा व स्वच्छ विश्राम स्थल।",
        },
        "toll_tax_policy": {
            "en": "Expressway toll included in one-way fare. Round trip subject to 300 km/day minimum billing.",
            "hi": "वन-वे किराये में एक्सप्रेसवे टोल शामिल। राउंड ट्रिप 300 किमी/दिन की न्यूनतम दर पर।",
        },
    },
    "agra-lucknow": {
        "highway": "Agra–Lucknow Expressway (6-Lane Greenfield)",
        "transit_time": "5h 15m (335 km)",
        "departure_tip": {
            "en": "Non-stop 100 km/h cruising. Ensure vehicle tyre pressure is checked before entering expressway.",
            "hi": "100 किमी/घंटा की निर्बाध गति। एक्सप्रेसवे पर चढ़ने से पहले टायर प्रेशर अवश्य चेक करें।",
        },
        "rest_stops": {
            "en": "Official UPEIDA wayside food courts at Firozabad, Kannauj (perfume capital), and Saifai.",
            "hi": "फिरोजाबाद, कन्नौज और सैफई पर आधिकारिक यूपीडा (UPEIDA) फूड प्लाजा।",
        },
        "toll_tax_policy": {
            "en": "Expressway toll included for one-way journeys.",
            "hi": "वन-वे यात्रा के लिए एक्सप्रेसवे टोल शामिल।",
        },
    },
    "agra-local": {
        "highway": "Agra City Circuit & Fatehabad Road",
        "transit_time": "8 Hours / 80 Kilometers",
        "departure_tip": {
            "en": "Start by 08:30 AM at Taj Mahal East Gate, followed by Agra Fort, Baby Taj, and sunset at Mehtab Bagh.",
            "hi": "सुबह 8:30 बजे ताज महल ईस्ट गेट से शुरुआत करें, फिर आगरा किला, बेबी ताज और मेहताब बाग सूर्यास्त।",
        },
        "rest_stops": {
            "en": "Pinch of Spice, Dasaprakash, and Joney's Place for lunch; Sadar Bazaar for evening tea.",
            "hi": "फतेहाबाद रोड पर प्रसिद्ध रेस्टोरेंट (पिंच ऑफ स्पाइस आदि) और सदर बाजार में शाम की चाय।",
        },
        "toll_tax_policy": {
            "en": "Includes fuel, driver allowance, and city parking. Extra km at ₹11/km (sedan) and extra hr at ₹150/hr.",
            "hi": "ईंधन, ड्राइवर भत्ता व पार्किंग शामिल। अतिरिक्त किमी ₹11/किमी और अतिरिक्त घंटा ₹150/घंटा।",
        },
    },
}

# Market Data Constants (ASTT Reference Baseline)
NIGHT_ALLOWANCE_CAB = 300
NIGHT_ALLOWANCE_TEMPO = 500
NIGHT_START_HOUR = 20  # 8:00 PM
OUTSTATION_MIN_KM = 300
PROMO_CODE = "ASTTCAR500OFF"
PROMO_DISCOUNT = 500

CANCELLATION_POLICY_CAB = {
    "en": "Free cancellation up to 24 hours before pickup for a 100% refund (credited via original payment method in 5–7 business days). Cancellations within 24 hours may be subject to partial advance retention. No refund for no-shows.",
    "hi": "पिकअप से 24 घंटे पहले तक रद्द करने पर 100% पूरा रिफंड (मूल भुगतान माध्यम में 5-7 कार्य दिवसों में)। 24 घंटे के भीतर रद्द करने पर आंशिक कटौती हो सकती है। नो-शो पर कोई रिफंड नहीं।"
}

CANCELLATION_SLABS_TOUR = [
    {"days": "61+ days", "fee": "0%", "refund": "100%"},
    {"days": "46–60 days", "fee": "10%", "refund": "90%"},
    {"days": "31–45 days", "fee": "20%", "refund": "80%"},
    {"days": "16–30 days", "fee": "30%", "refund": "70%"},
    {"days": "6–15 days", "fee": "55%", "refund": "45%"},
    {"days": "0–5 days", "fee": "100%", "refund": "0%"}
]



def inr(n):
    return "₹" + f"{int(n):,}"


def vehicle(vid):
    return next(v for v in VEHICLES if v["id"] == vid)


def route_path(route, lang):
    slug = route["slug_en"] if lang == "en" else route["slug_hi"]
    return f"/{lang}/{slug}/"


def vehicle_path(veh, lang):
    return f"/{lang}/vehicles/{veh['slug']}/"


def package_path(pack, lang):
    return f"/{lang}/packages/{pack['slug']}/"


def hub_path(hub, lang):
    if hub == "home":
        return "/" if lang == "en" else "/hi/"
    return f"/{lang}/{hub}/"
