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
    alt: "Taj Mahal reflected in the long garden pool at sunrise in Agra",
    ...image("taj-mahal-agra"),
    sourceUrl: "https://unsplash.com/photos/photo-of-taj-mahal-_WuPjE-MPHo",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "agra-fort",
    caption: "Agra Fort · Mughal Heritage",
    alt: "Red sandstone walls and gateway of Agra Fort",
    ...image("agra-fort"),
    sourceUrl: "https://unsplash.com/s/photos/agra-fort",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "fatehpur-sikri",
    caption: "Fatehpur Sikri · Buland Darwaza",
    alt: "Buland Darwaza gateway at Fatehpur Sikri near Agra",
    ...image("fatehpur-sikri"),
    sourceUrl: "https://unsplash.com/s/photos/fatehpur-sikri",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "hawa-mahal-jaipur",
    caption: "Hawa Mahal · Jaipur",
    alt: "Ornate pink facade of Hawa Mahal in Jaipur",
    ...image("hawa-mahal-jaipur"),
    sourceUrl: "https://unsplash.com/photos/hawa-mahal-india-at-daytime-WCgioEcEVNc",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "amber-fort-jaipur",
    caption: "Amber Fort · Jaipur",
    alt: "Amber Fort rising above the hills near Jaipur",
    ...image("amber-fort-jaipur"),
    sourceUrl: "https://unsplash.com/s/photos/amber-fort-jaipur",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "india-gate-delhi",
    caption: "India Gate · New Delhi",
    alt: "India Gate memorial standing along the ceremonial boulevard in New Delhi",
    ...image("india-gate-delhi"),
    sourceUrl: "https://unsplash.com/s/photos/india-gate",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "red-fort-delhi",
    caption: "Red Fort · Old Delhi",
    alt: "Historic red sandstone Red Fort in Old Delhi",
    ...image("red-fort-delhi"),
    sourceUrl: "https://unsplash.com/s/photos/red-fort-delhi",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "qutub-minar-delhi",
    caption: "Qutub Minar · Delhi",
    alt: "Qutub Minar tower rising above the historic complex in Delhi",
    ...image("qutub-minar-delhi"),
    sourceUrl: "https://unsplash.com/s/photos/qutub-minar",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "varanasi-ghats",
    caption: "Varanasi · Ganga Ghats",
    alt: "Varanasi riverfront ghats along the Ganga at dusk",
    ...image("varanasi-ghats"),
    sourceUrl: "https://unsplash.com/s/photos/varanasi-ghats",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
  {
    id: "kerala-backwaters",
    caption: "Kerala · Backwaters",
    alt: "Traditional boat moving through green Kerala backwaters",
    ...image("kerala-backwaters"),
    sourceUrl: "https://unsplash.com/s/photos/kerala-backwaters",
    photographer: "Source record from existing repository asset",
    license: "Unsplash License reference",
  },
];
