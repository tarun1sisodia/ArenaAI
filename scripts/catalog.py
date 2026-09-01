"""Single source of truth for SSG marketing pages. Fares stay identical in both languages."""

SITE = "https://skbagheltravels.in"
PHONE = "+919876543210"
PHONE_DISPLAY = "+91 98765 43210"
WHATSAPP = "919876543210"
EMAIL = "bookings@skbagheltravels.in"
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
        "per_km": 12,
        "image": "/assets/fleet/sedan.webp",
        "blurb": {
            "en": "Everyday comfort for city rides and one-way drops.",
            "hi": "शहर की सवारी और वन-वे ड्रॉप के लिए रोजमर्रा का आराम।",
        },
        "suitable": {
            "en": "Couples, airport transfers, 1–4 passengers",
            "hi": "कपल, एयरपोर्ट ट्रांसफर, 1–4 यात्री",
        },
        "tags": "4+1 SEATS · AC · 2 BAGS",
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
            "en": "A little more room for families without stepping up to an SUV.",
            "hi": "एसयूवी के बिना परिवार के लिए थोड़ी ज्यादा जगह।",
        },
        "suitable": {
            "en": "Families, 5–6 passengers",
            "hi": "परिवार, 5–6 यात्री",
        },
        "tags": "6+1 SEATS · AC · 3 BAGS",
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
            "en": "The outstation favourite — pushback seats and a quiet cabin.",
            "hi": "आउटस्टेशन की पसंदीदा — पुशबैक सीटें और शांत केबिन।",
        },
        "suitable": {
            "en": "Longer routes, elders, 4–6 passengers",
            "hi": "लंबे रूट, बुजुर्ग, 4–6 यात्री",
        },
        "tags": "6+1 SEATS · AC · 4 BAGS",
    },
    {
        "id": "tempo",
        "slug": "tempo-traveller",
        "name": {"en": "Tempo Traveller", "hi": "टेम्पो ट्रैवलर"},
        "klass": {"en": "12–17 seater", "hi": "12–17 सीटर"},
        "seats": 12,
        "bags": 8,
        "per_km": 22,
        "image": "/assets/fleet/tempo.webp",
        "blurb": {
            "en": "Spacious pushback seats, luggage bay and ice-box for group travel.",
            "hi": "ग्रुप ट्रैवल के लिए पुशबैक सीटें, लगेज बे और आइस-बॉक्स।",
        },
        "suitable": {
            "en": "Family tours, 7–12 passengers",
            "hi": "पारिवारिक टूर, 7–12 यात्री",
        },
        "tags": "12+1 SEATS · AC · LUGGAGE BAY",
    },
    {
        "id": "urbania",
        "slug": "urbania",
        "name": {"en": "Urbania", "hi": "अर्बनिया"},
        "klass": {"en": "Premium van", "hi": "प्रीमियम वैन"},
        "seats": 16,
        "bags": 10,
        "per_km": 28,
        "image": "/assets/fleet/urbania.webp",
        "blurb": {
            "en": "Chauffeur-grade group travel when the occasion asks for more.",
            "hi": "जब मौका विशेष हो — शोफर-ग्रेड ग्रुप ट्रैवल।",
        },
        "suitable": {
            "en": "Wedding parties, corporate, 13–16 passengers",
            "hi": "शादी, कॉर्पोरेट, 13–16 यात्री",
        },
        "tags": "16 SEATS · PREMIUM · AC",
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
        "fares": {"sedan": 3500, "ertiga": 4500, "innova": 7000, "tempo": 9500, "urbania": 14000},
        "intro": {
            "en": "A 230 km drop from Agra to Delhi. Sedan from ₹3,500. Advance shown before you pay. Call or WhatsApp to confirm the car.",
            "hi": "आगरा से दिल्ली 230 किमी का ड्रॉप। सेडान ₹3,500 से। भुगतान से पहले एडवांस दिखता है। गाड़ी कन्फर्म करने के लिए कॉल या व्हाट्सऐप करें।",
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
        "fares": {"sedan": 3500, "ertiga": 4500, "innova": 7000, "tempo": 9500, "urbania": 14000},
        "intro": {
            "en": "Delhi to Agra taxi for the Taj. Airport and hotel pickups. Sedan from ₹3,500.",
            "hi": "ताज के लिए दिल्ली से आगरा टैक्सी। एयरपोर्ट और होटल पिकअप। सेडान ₹3,500 से।",
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
        "fares": {"sedan": 4500, "ertiga": 5500, "innova": 8000, "tempo": 11000, "urbania": 16000},
        "intro": {
            "en": "Agra to Jaipur in about 4 hours 30 minutes. Sedan from ₹4,500, Innova from ₹8,000.",
            "hi": "आगरा से जयपुर लगभग 4 घंटे 30 मिनट। सेडान ₹4,500 से, इनोवा ₹8,000 से।",
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
            "en": "Agra to Mathura in 1 hour 15 minutes. Useful for same-day darshan with waiting.",
            "hi": "आगरा से मथुरा 1 घंटे 15 मिनट। उसी दिन दर्शन और वेटिंग के लिए सुविधाजनक।",
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
            "en": "Agra to Gwalior taxi, about 2 hours 30 minutes. Sedan from ₹3,000.",
            "hi": "आगरा से ग्वालियर टैक्सी, लगभग 2 घंटे 30 मिनट। सेडान ₹3,000 से।",
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
            "en": "Delhi to Jaipur outstation taxi. Sedan from ₹5,000. Round trip quoted at 1.85×.",
            "hi": "दिल्ली से जयपुर आउटस्टेशन टैक्सी। सेडान ₹5,000 से। राउंड ट्रिप 1.85× पर।",
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
            "en": "Agra to Lucknow, about 6 hours. Innova recommended for the longer highway run.",
            "hi": "आगरा से लखनऊ, लगभग 6 घंटे। लंबे हाईवे के लिए इनोवा बेहतर।",
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
        "fares": {"sedan": 3500, "ertiga": 4500, "innova": 6500, "tempo": 8500, "urbania": 12000},
        "intro": {
            "en": "Agra local sightseeing taxi for the Taj, Agra Fort and Mehtab Bagh. From ₹3,500 for the day.",
            "hi": "ताज, आगरा किला और मेहताब बाग के लिए आगरा लोकल दर्शनीय टैक्सी। दिन का ₹3,500 से।",
        },
    },
]

PACKAGES = [
    {
        "id": "agra-day",
        "slug": "agra-sightseeing",
        "name": {"en": "Agra sightseeing", "hi": "आगरा दर्शन"},
        "kicker": {"en": "Same day", "hi": "एक दिन"},
        "duration": {"en": "1 day", "hi": "1 दिन"},
        "price": 3500,
        "image": "/assets/packages/taj-dawn.webp",
        "places": {
            "en": ["Taj Mahal", "Agra Fort", "Mehtab Bagh"],
            "hi": ["ताज महल", "आगरा किला", "मेहताब बाग"],
        },
        "blurb": {
            "en": "One day. The icons of Agra. A comfortable way to take in the city with a local team.",
            "hi": "एक दिन। आगरा के मुख्य स्थल। स्थानीय टीम के साथ आराम से शहर देखें।",
        },
        "includes": {
            "en": ["AC vehicle", "Driver allowance", "Parking & tolls", "Hotel / station pickup"],
            "hi": ["एसी वाहन", "ड्राइवर भत्ता", "पार्किंग और टोल", "होटल / स्टेशन पिकअप"],
        },
    },
    {
        "id": "golden-triangle",
        "slug": "golden-triangle",
        "name": {"en": "Golden Triangle", "hi": "गोल्डन ट्रायंगल"},
        "kicker": {"en": "3 days", "hi": "3 दिन"},
        "duration": {"en": "3 days / 2 nights", "hi": "3 दिन / 2 रात"},
        "price": 18500,
        "image": "/assets/packages/golden-triangle.webp",
        "places": {"en": ["Delhi", "Agra", "Jaipur"], "hi": ["दिल्ली", "आगरा", "जयपुर"]},
        "blurb": {
            "en": "The classic North India loop — timed, chauffeured, and paced so the monuments have room to breathe.",
            "hi": "क्लासिक उत्तर भारत लूप — समयबद्ध, शोफर के साथ, स्मारकों को देखने की फुर्सत के साथ।",
        },
        "includes": {
            "en": ["AC Innova or similar", "Driver + fuel", "Toll, parking, state tax", "Hotel pickup"],
            "hi": ["एसी इनोवा या समान", "ड्राइवर + ईंधन", "टोल, पार्किंग, राज्य कर", "होटल पिकअप"],
        },
    },
    {
        "id": "mathura-vrindavan",
        "slug": "mathura-vrindavan",
        "name": {"en": "Mathura & Vrindavan", "hi": "मथुरा और वृंदावन"},
        "kicker": {"en": "Day trip", "hi": "डे ट्रिप"},
        "duration": {"en": "1 day", "hi": "1 दिन"},
        "price": 4200,
        "image": "/assets/packages/mathura.webp",
        "places": {
            "en": ["Krishna Janmabhoomi", "Prem Mandir", "Banke Bihari"],
            "hi": ["कृष्ण जन्मभूमि", "प्रेम मंदिर", "बांके बिहारी"],
        },
        "blurb": {
            "en": "A reverent day on the Yamuna — timed around aarti, with a driver who knows the lanes.",
            "hi": "यमुना किनारे एक दिन — आरती के समय के हिसाब से, गलियों को जानने वाले ड्राइवर के साथ।",
        },
        "includes": {
            "en": ["AC vehicle", "Waiting charges", "Parking"],
            "hi": ["एसी वाहन", "वेटिंग चार्ज", "पार्किंग"],
        },
    },
    {
        "id": "agra-fort-day",
        "slug": "agra-unhurried",
        "name": {"en": "Agra, unhurried", "hi": "आगरा, बिना जल्दबाजी"},
        "kicker": {"en": "2 days", "hi": "2 दिन"},
        "duration": {"en": "2 days / 1 night", "hi": "2 दिन / 1 रात"},
        "price": 7800,
        "image": "/assets/packages/agra-fort.webp",
        "places": {
            "en": ["Taj Mahal dawn", "Agra Fort", "Itimad-ud-Daulah", "Mehtab Bagh"],
            "hi": ["ताज महल सुबह", "आगरा किला", "एतमाद्-उद-दौला", "मेहताब बाग"],
        },
        "blurb": {
            "en": "Stay overnight so the Taj is yours at sunrise, then the rest of the city at a human pace.",
            "hi": "रात रुकें, सूर्योदय पर ताज देखें, फिर शहर को आराम से घूमें।",
        },
        "includes": {
            "en": ["AC vehicle both days", "Driver allowance", "Parking & tolls"],
            "hi": ["दोनों दिन एसी वाहन", "ड्राइवर भत्ता", "पार्किंग और टोल"],
        },
    },
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
