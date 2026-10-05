import type { SeoLandingSlug } from "./seoLandingSlugs";

/**
 * Single source of truth for SEO-landing-page head tags (ideas 25–26).
 * Title formula: main keyword + benefit + brand (<=60 chars, clampSeoText enforces).
 * Description: price + promise + call to action (<=155 chars).
 * Every fare quoted here is published in ./prices.ts — never invent a fare.
 * Used by: SeoLandingPage (H1 + breadcrumb) and getSeo() in App.tsx/ServerApp.tsx.
 */
export const SEO_LANDING_META: Record<SeoLandingSlug, { title: string; description: string }> = {
  "tempo-traveller-on-rent-agra": {
    title: "Tempo Traveller on Rent in Agra | 12–24 Seater, ₹25/km",
    description: "Tempo traveller on rent in Agra from ₹25/km. 12 to 24-seater pushback coaches with verified drivers for weddings and group tours. Call or WhatsApp to book.",
  },
  "12-seater-tempo-traveller-agra": {
    title: "12-Seater Tempo Traveller Agra | ₹25/km | SK Baghel",
    description: "12-seater tempo traveller on rent in Agra at ₹25/km. Best for small families and airport transfers. Verified drivers, pushback seats. Call or WhatsApp to book.",
  },
  "16-seater-tempo-traveller-agra": {
    title: "16-Seater Tempo Traveller Agra | ₹25/km | SK Baghel",
    description: "16-seater tempo traveller on rent in Agra at ₹25/km. Ideal for wedding guest shuttles and day trips. Verified drivers. Call or WhatsApp to book.",
  },
  "18-seater-tempo-traveller-agra": {
    title: "18-Seater Tempo Traveller Agra | ₹25/km | SK Baghel",
    description: "18-seater tempo traveller on rent in Agra at ₹25/km. Built for wedding parties and group tours. Verified drivers. Call or WhatsApp to book.",
  },
  "20-seater-tempo-traveller-agra": {
    title: "20-Seater Tempo Traveller Agra | ₹25/km | SK Baghel",
    description: "20-seater tempo traveller on rent in Agra at ₹25/km. Suited to corporate offsites and large groups. Verified drivers. Call or WhatsApp to book.",
  },
  "24-seater-tempo-traveller-agra": {
    title: "24-Seater Tempo Traveller Agra | ₹25/km | SK Baghel",
    description: "24-seater tempo traveller on rent in Agra at ₹25/km. For baraats and large groups with luggage space. Verified drivers. Call or WhatsApp to book.",
  },
  "same-day-agra-tour-from-delhi": {
    title: "Same Day Agra Tour from Delhi | Private Car ₹3,499",
    description: "Same day Agra tour from Delhi by private car, ₹3,499. Taj Mahal and Agra Fort with pickup from Delhi/NCR and a verified driver. Book on WhatsApp.",
  },
  "delhi-to-agra-taxi": {
    title: "Delhi to Agra Taxi | One-Way ₹3,499 | SK Baghel",
    description: "Delhi to Agra one-way taxi ₹3,499. Sedan, Ertiga and Innova Crysta with verified drivers on the Yamuna Expressway. Book on WhatsApp.",
  },
  "taj-mahal-taxi-service": {
    title: "Taj Mahal Taxi Service Agra | From ₹1,900 | SK Baghel",
    description: "Taj Mahal taxi service in Agra from ₹1,900 (8h/80km). Taj, Agra Fort and Mehtab Bagh with pickup near Taj East Gate. Call or WhatsApp.",
  },
  "agra-to-delhi-taxi": {
    title: "Agra to Delhi Taxi | One-Way ₹3,499 | SK Baghel",
    description: "Agra to Delhi one-way taxi ₹3,499. Sedan, Ertiga and Innova Crysta with verified drivers on the Yamuna Expressway. Book on WhatsApp.",
  },
  "agra-to-jaipur-taxi": {
    title: "Agra to Jaipur Taxi | One-Way ₹3,699 | SK Baghel",
    description: "Agra to Jaipur one-way taxi ₹3,699. Sedan, Ertiga and Innova Crysta with verified drivers. Fatehpur Sikri halt possible. Book on WhatsApp.",
  },
  "agra-to-mathura-taxi": {
    title: "Agra to Mathura Taxi | One-Way ₹2,200 | SK Baghel",
    description: "Agra to Mathura one-way taxi ₹2,200. Sedan, Ertiga and Innova Crysta with verified drivers. Extend to Vrindavan on the same day. Book on WhatsApp.",
  },
  "agra-to-gwalior-taxi": {
    title: "Agra to Gwalior Taxi | One-Way ₹3,000 | SK Baghel",
    description: "Agra to Gwalior one-way taxi ₹3,000. Sedan, Ertiga and Innova Crysta with verified drivers. Book on WhatsApp.",
  },
  "agra-fatehpur-sikri-one-day-tour": {
    title: "Agra to Fatehpur Sikri Taxi | Day Trip ₹1,800 | SK Baghel",
    description: "Agra to Fatehpur Sikri one-day taxi tour, ₹1,800 one-way. UNESCO site 40 km from Agra, 2–3 hours with a verified driver. Book on WhatsApp.",
  },
  "delhi-airport-to-agra-taxi": {
    title: "Delhi Airport to Agra Taxi | ₹3,499 | SK Baghel",
    description: "Delhi IGI Airport to Agra taxi, one-way ₹3,499 sedan. Arrival-gate pickup from T3/T1, ~4 hours via Yamuna Expressway. Book on WhatsApp.",
  },
  "delhi-to-agra-sedan-taxi-fare": {
    title: "Delhi to Agra Sedan Taxi Fare ₹3,499 | SK Baghel",
    description: "Delhi to Agra sedan taxi: one-way ₹3,499, ₹10/km. Swift Dzire-class, 4+1 seats, Yamuna Expressway toll included. Book on WhatsApp.",
  },
  "delhi-to-agra-ertiga-taxi-fare": {
    title: "Delhi to Agra Ertiga Fare ₹14/km | SK Baghel",
    description: "Delhi to Agra Ertiga taxi at ₹14/km, 6+1 seats for families with luggage. One-way fare confirmed at booking. Book on WhatsApp.",
  },
  "delhi-to-agra-innova-crysta-taxi-fare": {
    title: "Delhi to Agra Innova Crysta Fare | SK Baghel",
    description: "Delhi to Agra Innova Crysta taxi at ₹18/km, 6+1 pushback seats. The comfortable choice for families and seniors. Fare confirmed at booking.",
  },
  "delhi-to-agra-tempo-traveller-fare": {
    title: "Delhi to Agra Tempo Traveller ₹25/km | SK Baghel",
    description: "Delhi to Agra tempo traveller at ₹25/km, 12–24 seaters for groups, weddings and corporate trips. Fare confirmed at booking. Call or WhatsApp.",
  },
  "agra-to-vrindavan-taxi": {
    title: "Agra to Vrindavan Taxi | Day Trip | SK Baghel",
    description: "Agra to Vrindavan taxi for the Mathura–Vrindavan temple circuit. Prem Mandir, Banke Bihari and ISKCON with a verified driver. Fare confirmed at booking.",
  },
  "delhi-to-agra-cab-vs-train-vs-bus": {
    title: "Delhi to Agra: Cab vs Train vs Bus | SK Baghel",
    description: "Delhi to Agra compared: private cab from ₹3,499 vs Gatimaan train vs bus. Door-to-door time, flexibility and cost — pick what fits your trip.",
  },
  "taxi-near-taj-mahal-agra": {
    title: "Taxi Near Taj Mahal Agra | From ₹1,900 | SK Baghel",
    description: "Taxi near the Taj Mahal from ₹1,900 (8h/80km). Hotel pickup in Taj Ganj, East Gate and Fatehabad Road. Verified drivers. Call or WhatsApp.",
  },
};
