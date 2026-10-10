export interface HomeHeroSlide {
  id: string;
  caption: string;
  alt: string;
  objectPosition?: string;
  avif: { small: string; medium: string; desktop?: string; large: string };
  webp: { small: string; medium: string; desktop?: string; large: string };
  sourceUrl: string;
  photographer: string;
  license: string;
}

const image = (name: string) => ({
  avif: {
    small: `/assets/home-hero/${name}-480.avif`,
    medium: `/assets/home-hero/${name}-960.avif`,
    desktop: `/assets/home-hero/${name}-1280.avif`,
    large: `/assets/home-hero/${name}-1600.avif`,
  },
  webp: {
    small: `/assets/home-hero/${name}-480.webp`,
    medium: `/assets/home-hero/${name}-960.webp`,
    desktop: `/assets/home-hero/${name}-1280.webp`,
    large: `/assets/home-hero/${name}-1600.webp`,
  },
});

export const HOME_HERO_SLIDES: readonly HomeHeroSlide[] = [
  {
    id: "taj-mahal-agra",
    caption: "Taj Mahal · Agra",
    alt: "Taj Mahal on a bright sunny day with the long reflecting pool and gardens in Agra",
    ...image("taj-mahal-agra"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Taj_Mahal_on_a_bright_sunny_day.jpg",
    photographer: "Sourabhdotrai",
    license: "CC0",
  },
  {
    id: "agra-fort",
    caption: "Agra Fort · Mughal Heritage",
    alt: "Sunlit white-marble Khas Mahal and gardens inside Agra Fort under a bright sky",
    ...image("agra-fort"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Agra_03-2016_14_Agra_Fort.jpg",
    photographer: "Benh",
    license: "Free Art License 1.3",
  },
  {
    id: "fatehpur-sikri",
    caption: "Fatehpur Sikri · Buland Darwaza",
    alt: "Sunlit red-sandstone Buland Darwaza against a clear blue sky at Fatehpur Sikri",
    ...image("fatehpur-sikri"),
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Fatehpur_Sikri_near_Agra_2016-03_img08.jpg",
    photographer: "A.Savin",
    license: "Free Art License 1.3",
  },
  {
    id: "hawa-mahal-jaipur",
    caption: "Hawa Mahal · Jaipur",
    alt: "Hawa Mahal in full daylight with the sunlit pink facade under a blue sky in Jaipur",
    ...image("hawa-mahal-jaipur"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hawa_Mahal_Day_View.jpg",
    photographer: "Faraz iitj",
    license: "CC BY-SA 4.0",
  },
  {
    id: "amber-fort-jaipur",
    caption: "Amber Fort · Jaipur",
    alt: "Amber Fort in bright daylight with its reflection in Maota Lake near Jaipur",
    ...image("amber-fort-jaipur"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Jaipur_03-2016_02_Amber_Fort.jpg",
    photographer: "A.Savin",
    license: "Free Art License 1.3",
  },
  {
    id: "india-gate-delhi",
    caption: "India Gate · New Delhi",
    alt: "India Gate in bright daylight under a blue sky with white clouds in New Delhi",
    ...image("india-gate-delhi"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:All_India_War_Memorial_(INDIA_GATE).jpg",
    photographer: "AravindGP",
    license: "CC BY-SA 4.0",
  },
  {
    id: "varanasi-ghats",
    caption: "Varanasi · Ganga Ghats",
    alt: "Bright daylight on Dashashwamedh Ghat with colorful boats and umbrellas at Varanasi",
    ...image("varanasi-ghats"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:DASHASHWAMEDH_GHAT,_VARANASI.jpg",
    photographer: "Suzerainty13",
    license: "CC BY-SA 4.0",
  },
  {
    id: "kerala-backwaters",
    caption: "Kerala · Backwaters",
    alt: "Houseboat on glittering Kerala backwaters under a bright blue sky with lush palms",
    ...image("kerala-backwaters"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Houseboat_at_Kerala_Backwaters.jpg",
    photographer: "PrasanPadale",
    license: "CC BY-SA 4.0",
  },
  {
    id: "manali-solang-valley",
    caption: "Manali · Solang Valley",
    alt: "Green Solang Valley with snow peaks under a bright blue sky near Manali",
    ...image("manali-solang-valley"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Solang_Valley_,Manali,_Himachal_Pardes,_India.JPG",
    photographer: "Harvinder Chandigarh",
    license: "CC BY-SA 4.0",
  },
  {
    id: "golden-temple-amritsar",
    caption: "Golden Temple · Amritsar",
    alt: "Golden Temple gleaming in full daylight across the holy sarovar at Amritsar",
    ...image("golden-temple-amritsar"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hamandir_Sahib_(Golden_Temple).jpg",
    photographer: "Oleg Yunakov",
    license: "CC BY-SA 3.0",
  },
];
