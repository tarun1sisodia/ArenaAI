import type { PortfolioScrollGridImage } from "@/components/ui/portfolio-scroll-grid";

export interface FamousPlaceItem extends PortfolioScrollGridImage {
  id: string;
  name: string;
  region: string;
  category: "Agra" | "Delhi" | "Mathura" | "Rajasthan" | "Gwalior" | "Lucknow" | "Varanasi" | "Ayodhya" | "Rishikesh";
}

export const FAMOUS_PLACES_SCROLL_IMAGES: FamousPlaceItem[] = [
  // ── 1. AGRA ──
  {
    id: "agra-taj-mahal",
    name: "Taj Mahal",
    region: "Agra, Uttar Pradesh",
    category: "Agra",
    src: "/assets/places/agra-taj-mahal.webp",
    alt: "Taj Mahal ivory-white marble mausoleum reflecting at sunrise in Agra",
  },
  {
    id: "agra-red-fort",
    name: "Agra Red Fort",
    region: "Agra, Uttar Pradesh",
    category: "Agra",
    src: "/assets/places/agra-red-fort.webp",
    alt: "Agra Red Fort monumental 16th-century Mughal sandstone citadel",
  },
  {
    id: "agra-fatehpur-sikri",
    name: "Buland Darwaza & Fatehpur Sikri",
    region: "Agra, Uttar Pradesh",
    category: "Agra",
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Buland Darwaza highest gateway in the world at Fatehpur Sikri, Agra",
  },

  // ── 2. DELHI ──
  {
    id: "delhi-india-gate",
    name: "India Gate",
    region: "New Delhi",
    category: "Delhi",
    src: "/assets/places/delhi-india-gate.webp",
    alt: "India Gate national war memorial arch along Kartavya Path, New Delhi",
  },
  {
    id: "delhi-red-fort",
    name: "Lal Qila (Red Fort)",
    region: "Old Delhi",
    category: "Delhi",
    src: "/assets/places/delhi-red-fort.webp",
    alt: "Red Fort historic Mughal ramparts and Lahore Gate in Old Delhi",
  },
  {
    id: "delhi-qutub-minar",
    name: "Qutub Minar",
    region: "South Delhi",
    category: "Delhi",
    src: "/assets/places/delhi-qutub-minar.webp",
    alt: "Qutub Minar soaring 73-meter fluted sandstone minaret in Delhi",
  },
  {
    id: "delhi-akshardham",
    name: "Akshardham Temple",
    region: "East Delhi",
    category: "Delhi",
    src: "/assets/places/delhi-akshardham.webp",
    alt: "Swaminarayan Akshardham intricately carved pink sandstone temple in Delhi",
  },

  // ── 3. MATHURA & VRINDAVAN ──
  {
    id: "mathura-prem-mandir",
    name: "Prem Mandir",
    region: "Vrindavan, Mathura",
    category: "Mathura",
    src: "/assets/places/mathura-prem-mandir.webp",
    alt: "Prem Mandir Italian white marble temple illuminated at night in Vrindavan",
  },
  {
    id: "mathura-krishna-janmabhoomi",
    name: "Krishna Janmabhoomi",
    region: "Mathura, Uttar Pradesh",
    category: "Mathura",
    src: "/assets/places/mathura-krishna-janmabhoomi.webp",
    alt: "Shri Krishna Janmabhoomi sacred temple sanctum in holy Mathura",
  },

  // ── 4. RAJASTHAN (JAIPUR & FORTS) ──
  {
    id: "rajasthan-hawa-mahal",
    name: "Hawa Mahal",
    region: "Jaipur, Rajasthan",
    category: "Rajasthan",
    src: "/assets/places/rajasthan-jaipur-hawa-mahal.webp",
    alt: "Hawa Mahal Palace of Winds iconic 953-casement pink facade in Jaipur",
  },
  {
    id: "rajasthan-amber-fort",
    name: "Amber Fort & Palace",
    region: "Jaipur, Rajasthan",
    category: "Rajasthan",
    src: "/assets/places/rajasthan-amber-fort.webp",
    alt: "Amber Fort majestic hilltop palace overlooking Maota Lake in Jaipur",
  },
  {
    id: "rajasthan-palace-architecture",
    name: "Royal Rajput Courtyards",
    region: "Rajasthan",
    category: "Rajasthan",
    src: "/assets/places/rajasthan-palace-architecture.webp",
    alt: "Royal Rajput palace courtyards with carved marble jharokhas in Rajasthan",
  },

  // ── 5. FIVE MORE FAMOUS PLACES ──
  // 5a. Gwalior
  {
    id: "gwalior-fort",
    name: "Gwalior Fort",
    region: "Gwalior, Madhya Pradesh",
    category: "Gwalior",
    src: "/assets/places/gwalior-fort.jpg",
    alt: "Majestic Gwalior Fort perched on sandstone hill with blue-tiled battlements",
  },

  // 5b. Lucknow
  {
    id: "lucknow-imambara",
    name: "Rumi Darwaza & Bara Imambara",
    region: "Lucknow, Uttar Pradesh",
    category: "Lucknow",
    src: "/assets/places/lucknow-imambara.jpg",
    alt: "Rumi Darwaza grand Awadhi arched gateway and Bara Imambara in Lucknow",
  },

  // 5c. Varanasi
  {
    id: "varanasi-ghats",
    name: "Dashashwamedh Ghat & Ganga Aarti",
    region: "Varanasi (Kashi), Uttar Pradesh",
    category: "Varanasi",
    src: "/assets/places/varanasi-ghats.jpg",
    alt: "Sacred Dashashwamedh Ghat with glowing Ganga Aarti brass lamps in Varanasi",
  },

  // 5d. Ayodhya
  {
    id: "ayodhya-ram-mandir",
    name: "Shri Ram Janmabhoomi Mandir",
    region: "Ayodhya, Uttar Pradesh",
    category: "Ayodhya",
    src: "/assets/places/ayodhya-ram-mandir.jpg",
    alt: "Shri Ram Janmabhoomi Mandir grand Nagara style pink sandstone temple in Ayodhya",
  },

  // 5e. Rishikesh / Haridwar
  {
    id: "rishikesh-ganga",
    name: "Laxman Jhula & Holy Ganga",
    region: "Rishikesh, Uttarakhand",
    category: "Rishikesh",
    src: "/assets/places/rishikesh-ganga.jpg",
    alt: "Laxman Jhula suspension bridge over emerald Ganges river in Rishikesh foothills",
  },

  // ── ADDITIONAL SCENIC DESTINATIONS ──
  {
    id: "himachal-manali",
    name: "Manali Alpine Valley",
    region: "Himachal Pradesh",
    category: "Rishikesh",
    src: "/assets/places/himachal-manali.webp",
    alt: "Snow-capped Himalayan peaks and alpine cedar valleys in Manali",
  },
  {
    id: "himachal-shimla",
    name: "Shimla Hill Ridge",
    region: "Himachal Pradesh",
    category: "Rishikesh",
    src: "/assets/places/himachal-shimla.webp",
    alt: "Scenic colonial ridge and pine valleys of Shimla, Himachal",
  },
  {
    id: "ancient-temple-architecture",
    name: "Heritage Temple Sanctum",
    region: "Braj Circuit",
    category: "Mathura",
    src: "/assets/places/ancient-temple-architecture.webp",
    alt: "Intricate ancient stone temple architecture and holy sanctum carvings",
  },
];
