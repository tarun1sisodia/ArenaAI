export interface HomeHeroSlide {
  id: string;
  caption: string;
  alt: string;
  objectPosition?: string;
  avif: { small: string; medium: string; large: string };
  webp: { small: string; medium: string; large: string };
  sourceUrl: string;
  photographer: string;
  license: string;
}

const image = (name: string) => ({
  avif: {
    small: `/assets/home-hero/${name}-480.avif`,
    medium: `/assets/home-hero/${name}-960.avif`,
    large: `/assets/home-hero/${name}-1600.avif`,
  },
  webp: {
    small: `/assets/home-hero/${name}-480.webp`,
    medium: `/assets/home-hero/${name}-960.webp`,
    large: `/assets/home-hero/${name}-1600.webp`,
  },
});

export const HOME_HERO_SLIDES: readonly HomeHeroSlide[] = [
  {
    id: "taj-mahal-agra",
    caption: "Taj Mahal · Agra",
    alt: "Taj Mahal in bright daylight with the long reflecting pool and gardens in Agra",
    ...image("taj-mahal-agra"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Taj_Mahal,_Agra,_India.jpg",
    photographer: "Yann",
    license: "CC BY-SA 4.0",
  },
  {
    id: "agra-fort",
    caption: "Agra Fort · Mughal Heritage",
    alt: "Sunset glowing through an ornate archway inside Agra Fort",
    ...image("agra-fort"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sunset_at_Agra_Fort.jpg",
    photographer: "Preetam Chakraborty",
    license: "CC BY-SA 4.0",
  },
  {
    id: "fatehpur-sikri",
    caption: "Fatehpur Sikri · Jama Masjid",
    alt: "Warm sunset light streaming through the pillared corridor of Jama Masjid at Fatehpur Sikri",
    ...image("fatehpur-sikri"),
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Corridor_of_Jama_Masjid,_Fatehpur_Sikri,_Agra_during_sunset.jpg",
    photographer: "Kuntal Guharaja",
    license: "CC BY-SA 4.0",
  },
  {
    id: "hawa-mahal-jaipur",
    caption: "Hawa Mahal · Jaipur",
    alt: "Hawa Mahal floodlit at dusk against a deep blue sky in Jaipur",
    ...image("hawa-mahal-jaipur"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hawa_Mahal_flooded_with_lights.jpg",
    photographer: "shikhers",
    license: "CC BY-SA 4.0",
  },
  {
    id: "amber-fort-jaipur",
    caption: "Amber Fort · Jaipur",
    alt: "Amber Fort illuminated at night with its reflection in Maota Lake near Jaipur",
    ...image("amber-fort-jaipur"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Amber_Fort_Jaipur_india.jpg",
    photographer: "Sumedh Patil",
    license: "CC BY-SA 4.0",
  },
  {
    id: "india-gate-delhi",
    caption: "India Gate · New Delhi",
    alt: "India Gate illuminated at night with glowing street lamps in New Delhi",
    ...image("india-gate-delhi"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:India_Gate_at_night,_New_Delhi,_India.JPG",
    photographer: "Aravindjnath",
    license: "CC BY-SA 3.0",
  },
  {
    id: "varanasi-ghats",
    caption: "Varanasi · Ganga Ghats",
    alt: "Sun setting over the Ganges with boats and shimmering reflections at Varanasi",
    ...image("varanasi-ghats"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Light_in_Shade.jpg",
    photographer: "Nikhilesh Kumar Prajapati",
    license: "CC BY-SA 4.0",
  },
  {
    id: "kerala-backwaters",
    caption: "Kerala · Backwaters",
    alt: "Houseboats on the Kerala backwaters at sunset with palm reflections",
    ...image("kerala-backwaters"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Alleppey_Boat_houses.jpg",
    photographer: "Mohanrangaphotography",
    license: "CC BY-SA 4.0",
  },
  {
    id: "manali-solang-valley",
    caption: "Manali · Himalayan Sunrise",
    alt: "Sunrise over snow-capped Himalayan ranges above a sea of clouds near Manali",
    ...image("manali-solang-valley"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Manali,himalayas.jpg",
    photographer: "Aniket431",
    license: "CC BY-SA 4.0",
  },
  {
    id: "golden-temple-amritsar",
    caption: "Golden Temple · Amritsar",
    alt: "Golden Temple at dawn with its reflection in the holy sarovar at Amritsar",
    ...image("golden-temple-amritsar"),
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Golden_Temple_2022.jpg",
    photographer: "Indiancuisne",
    license: "CC BY-SA 4.0",
  },
];
