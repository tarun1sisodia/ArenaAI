import { contact } from "../data/contact";
import type { ReactNode } from "react";
import { prices } from "../data/prices";
import { airportTransfers } from "../data";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildLocalBusinessSchema,
  buildFaqSchema,
} from "../components/seo/JsonLd";
import { SEO_LANDING_SLUGS, type SeoLandingSlug } from "../data/seoLandingSlugs";
import { SEO_LANDING_META } from "../data/seoLandingMeta";
export { SEO_LANDING_SLUGS } from "../data/seoLandingSlugs";

const seaterBestFor: Record<string, string> = { "12": "Small families and airport transfers", "16": "Wedding guest shuttles and day trips", "18": "Wedding parties and group tours", "20": "Corporate offsites", "24": "Baraat and large groups" };
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const cityTitle = (slug: string) => slug.split("-").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");

interface Faq { question: string; answer: string; }
interface SiblingLink { label: string; href: string; }
interface PageModel {
  opening: string;
  table: ReactNode;
  faqs: Faq[];
  hub: SiblingLink;
  siblings: SiblingLink[];
}

const ROUTES_HUB: SiblingLink = { label: "Agra Outstation Taxi Routes", href: "/en/routes/" };
const FLEET_HUB: SiblingLink = { label: "Our Taxi Fleet", href: "/en/fleet/" };
const routeSiblings: SiblingLink[] = [
  { label: "Delhi to Agra taxi", href: "/en/delhi-to-agra-taxi/" },
  { label: "Agra to Delhi taxi", href: "/en/agra-to-delhi-taxi/" },
  { label: "Agra to Jaipur taxi", href: "/en/agra-to-jaipur-taxi/" },
  { label: "Delhi Airport to Agra taxi", href: "/en/delhi-airport-to-agra-taxi/" },
];
const vehicleSiblings: SiblingLink[] = [
  { label: "Tempo Traveller on rent in Agra", href: "/en/tempo-traveller-on-rent-agra/" },
  { label: "Innova Crysta Delhi–Agra fare", href: "/en/delhi-to-agra-innova-crysta-taxi-fare/" },
  { label: "Sedan Delhi–Agra fare", href: "/en/delhi-to-agra-sedan-taxi-fare/" },
];

const tollFaq: Faq = {
  question: "Is the Yamuna Expressway toll included in the fare?",
  answer: "Yes — one-way bookings include the Yamuna Expressway toll. Round-trip tolls and interstate state permits are charged at actuals and confirmed with the travel desk before booking.",
};
const minKmFaq: Faq = {
  question: "Is there a minimum billing distance?",
  answer: "Yes — outstation trips are billed on a 300 km per calendar day minimum across our fleet. One-way fares like Delhi–Agra ₹3,499 already account for this; the desk confirms the math for your dates before booking.",
};
const advanceFaq: Faq = {
  question: "How is the booking confirmed?",
  answer: "Bookings are confirmed with a 28% advance token; the 72% balance is paid on drop-off. Cab bookings cancelled 24 hours before pickup receive a 100% refund.",
};
const vehiclesFaq: Faq = {
  question: "Which vehicles are available?",
  answer: `Sedan (4+1) at ${money(prices.fleet_per_km.sedan)}/km, Ertiga (6+1) at ${money(prices.fleet_per_km.ertiga)}/km, Innova Crysta (6+1) at ${money(prices.fleet_per_km.innova_crysta)}/km and Tempo Traveller at ${money(prices.fleet_per_km.tempo_traveller)}/km — all chauffeur-driven with verified drivers.`,
};

function vehicleFareTable(caption: string, oneWaySedan: string): ReactNode {
  return <table><caption>{caption}</caption><thead><tr><th>Vehicle</th><th>Seats</th><th>Per-km rate</th><th>One-way fare</th></tr></thead><tbody>
    <tr><td>Sedan</td><td>4+1</td><td>{money(prices.fleet_per_km.sedan)}/km</td><td>{oneWaySedan}</td></tr>
    <tr><td>Ertiga</td><td>6+1</td><td>{money(prices.fleet_per_km.ertiga)}/km</td><td>Confirmed at booking</td></tr>
    <tr><td>Innova Crysta</td><td>6+1</td><td>{money(prices.fleet_per_km.innova_crysta)}/km</td><td>Confirmed at booking</td></tr>
  </tbody></table>;
}

function pageModel(slug: SeoLandingSlug): PageModel {
  const seater = slug.match(/^(12|16|18|20|24)-seater/)?.[1];
  if (slug === "tempo-traveller-on-rent-agra" || seater) {
    const label = seater ? `${seater}-Seater Tempo Traveller on Rent in Agra` : "Tempo Traveller on Rent in Agra";
    const opening = seater
      ? `A ${seater}-seater tempo traveller in Agra costs ${money(prices.fleet_per_km.tempo_traveller)} per km with SK Baghel Tour & Travels. It is suited to ${seaterBestFor[seater].toLowerCase()}, with pushback seating and luggage space. Driver allowance, state tax, parking and night halt are confirmed before booking. Call or WhatsApp ${contact.phoneDisplay} to book.`
      : `Hiring a tempo traveller in Agra costs ${money(prices.fleet_per_km.tempo_traveller)} per km with SK Baghel Tour & Travels. Choose from 12, 16, 18, 20 and 24-seater options for weddings, corporate trips and group sightseeing, with verified drivers and pushback seats. Driver allowance, state tax, parking and night halt are confirmed before booking. Call or WhatsApp ${contact.phoneDisplay} to book.`;
    return {
      opening,
      table: seater
        ? <table><caption>{label} details</caption><thead><tr><th>Seating</th><th>Price per km</th><th>Best for</th></tr></thead><tbody><tr><td>{seater}-seater</td><td>{money(prices.fleet_per_km.tempo_traveller)}/km</td><td>{seaterBestFor[seater]}</td></tr></tbody></table>
        : <table><caption>Tempo traveller rates in Agra</caption><thead><tr><th>Seater</th><th>Price per km</th><th>Best for</th></tr></thead><tbody>{Object.entries(seaterBestFor).map(([size, best]) => <tr key={size}><td>{size}-seater</td><td>{money(prices.fleet_per_km.tempo_traveller)}/km</td><td>{best}</td></tr>)}</tbody></table>,
      faqs: [
        { question: seater ? `What is the per km rate for a ${seater}-seater tempo traveller in Agra?` : "What is the per km rate for a tempo traveller in Agra?", answer: `${money(prices.fleet_per_km.tempo_traveller)} per km. Driver allowance, interstate state tax, parking and night halt are confirmed with the travel desk before booking — nothing is added silently later.` },
        ...(seater ? [] : [{ question: "Which tempo traveller size should I choose?", answer: "12-seater for small families and airport transfers, 16 for wedding guest shuttles and day trips, 18 for wedding parties and group tours, 20 for corporate offsites and 24 for baraats and large groups." } as Faq]),
        { question: "Is there a minimum distance for booking?", answer: "Yes — outstation bookings are billed on a 300 km per calendar day minimum. Tell the desk your dates and route and they will confirm the exact billing before you pay." },
        { question: "Can I take the tempo traveller out of Agra?", answer: "Yes — Delhi, Jaipur, Mathura–Vrindavan and Haridwar are common outstation runs. Interstate state tax is charged at actuals and confirmed before booking." },
        advanceFaq,
      ],
      hub: FLEET_HUB,
      siblings: vehicleSiblings.filter((s) => !s.href.includes(slug)),
    };
  }

  const routeMap: Record<string, { from: string; to: string; fare: number; distance: string }> = {
    "delhi-to-agra-taxi": { from: "Delhi", to: "Agra", fare: prices.routes_oneway.delhi_igi, distance: "230 km via the Yamuna Expressway, about 3 hours 30 minutes" },
    "agra-to-delhi-taxi": { from: "Agra", to: "Delhi", fare: prices.routes_oneway.delhi_igi, distance: "230 km via the Yamuna Expressway, about 3 hours 30 minutes" },
    "agra-to-jaipur-taxi": { from: "Agra", to: "Jaipur", fare: prices.routes_oneway.jaipur, distance: "about 4 hours via Fatehpur Sikri" },
    "agra-to-mathura-taxi": { from: "Agra", to: "Mathura", fare: prices.routes_oneway.mathura, distance: "about 1 hour 30 minutes" },
    "agra-to-gwalior-taxi": { from: "Agra", to: "Gwalior", fare: prices.routes_oneway.gwalior, distance: "about 2 hours 30 minutes" },
  };
  if (routeMap[slug]) {
    const r = routeMap[slug];
    return {
      opening: `A one-way taxi from ${r.from} to ${r.to} costs ${money(r.fare)} (sedan) with SK Baghel Tour & Travels — ${r.distance}, with verified drivers and Yamuna Expressway toll included on one-way bookings. Choose a Sedan (${money(prices.fleet_per_km.sedan)}/km), Ertiga (${money(prices.fleet_per_km.ertiga)}/km) or Innova Crysta (${money(prices.fleet_per_km.innova_crysta)}/km); Ertiga and Innova one-way fares are confirmed at booking. Call or WhatsApp ${contact.phoneDisplay} to book.`,
      table: vehicleFareTable(`${r.from} to ${r.to} one-way fares`, money(r.fare)),
      faqs: [
        tollFaq,
        { question: `How long does ${r.from} to ${r.to} take by taxi?`, answer: `${r.distance[0].toUpperCase()}${r.distance.slice(1)}, traffic permitting. Leave a buffer in winter — fog on the expressway can slow the run in December and January.` },
        { question: `Do you pick up from ${r.from} airport or railway station?`, answer: `Yes — airport and railway station pickups are standard, including Delhi IGI Airport and Agra Cantt. Share your terminal or train number on WhatsApp and the driver meets you at the arrival gate.` },
        minKmFaq,
        advanceFaq,
      ],
      hub: ROUTES_HUB,
      siblings: routeSiblings.filter((s) => !s.href.includes(slug)),
    };
  }

  if (slug === "delhi-airport-to-agra-taxi") {
    const t = airportTransfers.find((item) => item.id === "delhi-airport")!;
    return {
      opening: `Our Delhi IGI Airport to Agra transfer runs ${money(t.fares.sedan)} one-way by sedan (${money(t.fares.ertiga)} Ertiga, ${money(t.fares.innova)} Innova Crysta, ${money(t.fares.tempo)} Tempo Traveller) — about 3 hours 30 minutes for the 230 km via the Yamuna Expressway, toll included. Pickup from T3 and T1 arrival gates with a verified driver. Call or WhatsApp ${contact.phoneDisplay} to book.`,
      table: <table><caption>Delhi IGI Airport to Agra one-way fares</caption><thead><tr><th>Vehicle</th><th>Seats</th><th>One-way fare</th></tr></thead><tbody>
        <tr><td>Sedan</td><td>4+1</td><td>{money(t.fares.sedan)}</td></tr>
        <tr><td>Ertiga</td><td>6+1</td><td>{money(t.fares.ertiga)}</td></tr>
        <tr><td>Innova Crysta</td><td>6+1</td><td>{money(t.fares.innova)}</td></tr>
        <tr><td>Tempo Traveller</td><td>12+</td><td>{money(t.fares.tempo)}</td></tr>
        <tr><td>Urbania</td><td>17+</td><td>{money(t.fares.urbania)}</td></tr>
      </tbody></table>,
      faqs: [
        { question: "Which terminal do you pick up from at Delhi Airport?", answer: "T3 and T1 arrival gates. Share your flight number on WhatsApp when you book so the driver is at the right gate." },
        { question: "How long is the Delhi Airport to Agra drive?", answer: "About 3 hours 30 minutes for 230 km via the Yamuna Expressway, traffic permitting. Add a buffer for winter fog in December–January." },
        { question: "Is there a waiting charge if my flight is delayed?", answer: "Share your flight number when you book — the travel desk confirms the waiting arrangement for your pickup before the booking is finalized." },
        tollFaq,
        advanceFaq,
      ],
      hub: ROUTES_HUB,
      siblings: routeSiblings.filter((s) => !s.href.includes(slug)),
    };
  }

  if (slug === "delhi-to-agra-sedan-taxi-fare" || slug === "delhi-to-agra-ertiga-taxi-fare" || slug === "delhi-to-agra-innova-crysta-taxi-fare" || slug === "delhi-to-agra-tempo-traveller-fare") {
    const vehicle = slug.includes("ertiga") ? { name: "Ertiga", perKm: prices.fleet_per_km.ertiga, seats: "6+1", note: "the family choice with room for luggage" }
      : slug.includes("innova") ? { name: "Innova Crysta", perKm: prices.fleet_per_km.innova_crysta, seats: "6+1", note: "the comfortable choice for families and senior travellers, with pushback seating" }
      : slug.includes("tempo") ? { name: "Tempo Traveller", perKm: prices.fleet_per_km.tempo_traveller, seats: "12–24", note: "the group choice for weddings, corporate trips and large families" }
      : { name: "Sedan", perKm: prices.fleet_per_km.sedan, seats: "4+1", note: "the economical choice for couples and small families" };
    const oneWay = slug.includes("sedan") ? money(prices.routes_oneway.delhi_igi) : "Confirmed at booking";
    return {
      opening: `A ${vehicle.name} from Delhi to Agra costs ${money(vehicle.perKm)} per km with SK Baghel Tour & Travels — ${vehicle.seats} seating, ${vehicle.note}. The 230 km run takes about 3 hours 30 minutes via the Yamuna Expressway with toll included on one-way bookings. Call or WhatsApp ${contact.phoneDisplay} to book.`,
      table: <table><caption>Delhi to Agra {vehicle.name.toLowerCase()} fares</caption><thead><tr><th>Vehicle</th><th>Seats</th><th>Per-km rate</th><th>One-way fare</th></tr></thead><tbody>
        <tr><td>{vehicle.name}</td><td>{vehicle.seats}</td><td>{money(vehicle.perKm)}/km</td><td>{oneWay}</td></tr>
        <tr><td>Sedan (reference)</td><td>4+1</td><td>{money(prices.fleet_per_km.sedan)}/km</td><td>{money(prices.routes_oneway.delhi_igi)}</td></tr>
      </tbody></table>,
      faqs: [
        { question: `What is the ${vehicle.name} fare from Delhi to Agra?`, answer: `${money(vehicle.perKm)} per km${slug.includes("sedan") ? `, with a published one-way fare of ${money(prices.routes_oneway.delhi_igi)}` : "; the one-way fare is confirmed with the travel desk at booking"}. Yamuna Expressway toll is included on one-way bookings.` },
        { question: `Is the ${vehicle.name} good for a same-day Delhi–Agra trip?`, answer: `Yes — the ${vehicle.seats}-seater handles the 230 km expressway run comfortably in about 3 hours 30 minutes each way. For same-day returns the car stays with you all day; the desk confirms the day's billing before booking.` },
        minKmFaq,
        advanceFaq,
      ],
      hub: FLEET_HUB,
      siblings: vehicleSiblings.filter((s) => !s.href.includes(slug)),
    };
  }

  if (slug === "agra-to-vrindavan-taxi") {
    return {
      opening: `Our Agra to Vrindavan taxi covers the Mathura–Vrindavan temple circuit — Krishna Janmabhoomi and Dwarkadhish in Mathura, Banke Bihari, Prem Mandir and ISKCON in Vrindavan — with a verified driver who knows the temple-town parking points. The guided Mathura & Vrindavan Darshan day trip is ${money(prices.tours.mathura_vrindavan)}; standalone taxi fares are confirmed at booking. Call or WhatsApp ${contact.phoneDisplay}.`,
      table: <table><caption>Agra – Mathura – Vrindavan fares</caption><thead><tr><th>Service</th><th>Price</th></tr></thead><tbody>
        <tr><td>Agra to Mathura one-way (sedan)</td><td>{money(prices.routes_oneway.mathura)}</td></tr>
        <tr><td>Mathura &amp; Vrindavan Darshan day trip</td><td>{money(prices.tours.mathura_vrindavan)}</td></tr>
        <tr><td>Sedan per-km (custom circuit)</td><td>{money(prices.fleet_per_km.sedan)}/km</td></tr>
        <tr><td>Innova Crysta per-km (custom circuit)</td><td>{money(prices.fleet_per_km.innova_crysta)}/km</td></tr>
      </tbody></table>,
      faqs: [
        { question: "Can I cover Mathura and Vrindavan in one day from Agra?", answer: `Yes — the Mathura & Vrindavan Darshan day trip (${money(prices.tours.mathura_vrindavan)}) covers Krishna Janmabhoomi, Dwarkadhish Temple, Banke Bihari, Prem Mandir and ISKCON with a verified driver. Start early; temple aartis set the day's rhythm.` },
        { question: "Should I take the taxi or the guided tour?", answer: "Take the guided day trip if it is your first visit — temple timings, parking and darshan queues are handled for you. Take the standalone taxi if you have your own plan and only need the car and driver." },
        { question: "Is Vrindavan crowded on weekends and festivals?", answer: "Yes — weekends, Ekadashi and Holi see heavy crowds. The driver plans parking and walking stretches accordingly; for Holi week, book the car a few days ahead." },
        advanceFaq,
      ],
      hub: ROUTES_HUB,
      siblings: [
        { label: "Agra to Mathura taxi", href: "/en/agra-to-mathura-taxi/" },
        { label: "Mathura & Vrindavan Darshan tour", href: "/en/packages/mathura-vrindavan/" },
        { label: "Delhi to Agra taxi", href: "/en/delhi-to-agra-taxi/" },
      ],
    };
  }

  if (slug === "delhi-to-agra-cab-vs-train-vs-bus") {
    return {
      opening: `Delhi to Agra gives you three real options: a private cab (from ${money(prices.routes_oneway.delhi_igi)} per car), the Gatimaan/Shatabdi trains, or UPSRTC and private buses. The honest answer depends on your group size, your Delhi starting point and whether you want Agra sightseeing in the same trip. Here is the full comparison from a taxi operator that runs this route daily.`,
      table: <table><caption>Delhi to Agra: cab vs train vs bus</caption><thead><tr><th></th><th>Private cab</th><th>Train (Gatimaan/Shatabdi)</th><th>Bus</th></tr></thead><tbody>
        <tr><td>Door-to-door time</td><td>3.5–4 hours</td><td>~1h 40m on board + station transfers both ends</td><td>4–5 hours + terminal transfers</td></tr>
        <tr><td>Cost indicator</td><td>From {money(prices.routes_oneway.delhi_igi)} per car</td><td>Per-seat train fare + Agra local transport</td><td>Lowest per-seat fare</td></tr>
        <tr><td>Departure flexibility</td><td>Any time you choose</td><td>Fixed schedule</td><td>Fixed schedule</td></tr>
        <tr><td>Mathura/Vrindavan halt</td><td>Easy detour</td><td>Not possible</td><td>Not possible</td></tr>
        <tr><td>Luggage</td><td>Boot space included</td><td>Limited</td><td>Limited</td></tr>
        <tr><td>Best for</td><td>Families, groups, seniors, same-day tours</td><td>Solo travellers near Nizammuddin station</td><td>Tight budgets</td></tr>
      </tbody></table>,
      faqs: [
        { question: "Which is cheapest: cab, train or bus from Delhi to Agra?", answer: "The bus is cheapest per seat, then the train. But do the full math: for a group of four, a sedan at ₹3,499 works out to about ₹875 per person with no Agra local taxi needed at either end — often cheaper than four train tickets plus station transfers." },
        { question: "Which is fastest door-to-door?", answer: "For most Delhi addresses, the private cab — there are no station transfers at either end. The Gatimaan Express is faster station-to-station (about 1h 40m), but add the Delhi and Agra transfers and the gap narrows sharply." },
        { question: "Can I stop at Mathura or Vrindavan on the way?", answer: "Only by cab — trains and buses cannot detour. Tell the desk when you book and the halt is built into your day's plan." },
        { question: "Is the Yamuna Expressway safe at night?", answer: "It is a 6-lane access-controlled expressway and our preferred corridor day and night. Our drivers run it daily; in winter fog (December–January) we recommend daytime travel with a buffer." },
      ],
      hub: ROUTES_HUB,
      siblings: [
        { label: "Delhi to Agra taxi", href: "/en/delhi-to-agra-taxi/" },
        { label: "Same-day Agra tour from Delhi", href: "/en/same-day-agra-tour-from-delhi/" },
        { label: "Agra to Delhi taxi", href: "/en/agra-to-delhi-taxi/" },
      ],
    };
  }

  if (slug === "taxi-near-taj-mahal-agra") {
    return {
      opening: `Need a taxi near the Taj Mahal? We are based near Taj East Gate and pick up from hotels across Taj Ganj, Fatehabad Road and the Cantonment — usually within the hour for local sightseeing. Local packages run ${money(prices.local_packages["8h_80km"])} for 8 hours / 80 km and ${money(prices.local_packages["12h_120km"])} for 12 hours / 120 km, covering the Taj Mahal, Agra Fort and Mehtab Bagh. Call or WhatsApp ${contact.phoneDisplay}.`,
      table: <table><caption>Taj Mahal local taxi packages</caption><thead><tr><th>Package</th><th>Hours / km</th><th>Price</th></tr></thead><tbody>
        <tr><td>Taj Mahal half-day</td><td>8 hrs / 80 km</td><td>{money(prices.local_packages["8h_80km"])}</td></tr>
        <tr><td>Taj Mahal full day</td><td>12 hrs / 120 km</td><td>{money(prices.local_packages["12h_120km"])}</td></tr>
        <tr><td>Extra km / hour</td><td>Beyond package</td><td>Confirmed at booking</td></tr>
      </tbody></table>,
      faqs: [
        { question: "Do you pick up from hotels near the Taj Mahal?", answer: "Yes — Taj Ganj, Fatehabad Road, the Cantonment and the East Gate area are our home ground. Share your hotel name on WhatsApp and the driver meets you in the lobby." },
        { question: "Can the taxi wait while I visit the Taj Mahal?", answer: "Yes — local packages are time-and-distance based, so the car waits at the designated parking while you tour. The Taj complex itself is a no-vehicle zone; the driver guides you to the shuttle or walking entry." },
        { question: "Is the Taj Mahal open on Fridays?", answer: "No — the Taj Mahal is closed to general visitors on Fridays. On Fridays we recommend Agra Fort, Fatehpur Sikri or a Mehtab Bagh sunset instead." },
        { question: "Can I do a sunrise Taj visit?", answer: `Yes — our Taj Mahal Sunrise tour (${money(prices.tours.taj_sunrise)}) starts before dawn for the classic sunrise view. Book the evening before; winter fog can delay sunrise visibility in December–January.` },
      ],
      hub: ROUTES_HUB,
      siblings: [
        { label: "Taj Mahal taxi service", href: "/en/taj-mahal-taxi-service/" },
        { label: "Agra sightseeing taxi", href: "/en/agra-sightseeing-taxi/" },
        { label: "Same-day Agra tour from Delhi", href: "/en/same-day-agra-tour-from-delhi/" },
      ],
    };
  }

  if (slug === "same-day-agra-tour-from-delhi") return {
    opening: `Visit the Taj Mahal and Agra Fort in a single day with pickup from Delhi, Noida, Gurgaon or Ghaziabad. A private car with a verified driver starts from ${money(prices.tours.same_day_agra)}; Delhi-pickup pricing is confirmed before booking. Call or WhatsApp ${contact.phoneDisplay} to book.`,
    table: <table><caption>Sample same-day Agra itinerary</caption><thead><tr><th>Time</th><th>Stop</th></tr></thead><tbody>{[["06:00", "Pickup from Delhi/NCR"], ["09:30", "Taj Mahal"], ["13:00", "Lunch at own expense"], ["14:30", "Agra Fort"], ["18:00", "Drive back via Yamuna Expressway"], ["21:30", "Drop at Delhi"]].map(([time, stop]) => <tr key={time}><td>{time}</td><td>{stop}</td></tr>)}</tbody></table>,
    faqs: [
      { question: "Can you visit the Taj Mahal and Agra Fort in one day?", answer: "Yes — the standard circuit is Taj Mahal (2–3 hours), lunch, Agra Fort (1.5–2 hours), with drop back in Delhi around 21:30. It is a long day; seniors and young children often prefer the relaxed two-day version." },
      { question: "What time should you leave Delhi?", answer: "06:00 — you reach the Taj by 09:30, ahead of the worst crowds, and stay ahead of the return traffic." },
      { question: "What happens if my tour day is a Friday?", answer: "The Taj Mahal is closed on Fridays. Friday tours reroute to Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah and a Mehtab Bagh sunset — the desk confirms the revised plan when you book." },
      { question: "Private car or train for a Delhi–Agra day trip?", answer: "The car is door-to-door and doubles as your Agra sightseeing car, with Mathura halts possible. The train suits solo travellers starting near Nizamuddin. See our full cab-vs-train-vs-bus comparison." },
      advanceFaq,
    ],
    hub: ROUTES_HUB,
    siblings: [
      { label: "Delhi to Agra taxi", href: "/en/delhi-to-agra-taxi/" },
      { label: "Cab vs train vs bus", href: "/en/delhi-to-agra-cab-vs-train-vs-bus/" },
      { label: "Taxi near Taj Mahal", href: "/en/taxi-near-taj-mahal-agra/" },
    ],
  };

  if (slug === "taj-mahal-taxi-service") return {
    opening: `Our Taj Mahal taxi service covers the Taj Mahal, Agra Fort and Mehtab Bagh, with 8-hour/80-km packages at ${money(prices.local_packages["8h_80km"])} and 12-hour/120-km packages at ${money(prices.local_packages["12h_120km"])}. We are based near Taj East Gate. Call or WhatsApp ${contact.phoneDisplay} to book.`,
    table: <table><caption>Taj Mahal taxi packages in Agra</caption><thead><tr><th>Package</th><th>Hours / km</th><th>Price</th></tr></thead><tbody><tr><td>Taj Mahal Day Trip</td><td>8 hrs / 80 km</td><td>{money(prices.local_packages["8h_80km"])}</td></tr><tr><td>Taj Mahal Full Day</td><td>12 hrs / 120 km</td><td>{money(prices.local_packages["12h_120km"])}</td></tr></tbody></table>,
    faqs: [
      { question: "What does the one-day Taj Mahal taxi package include?", answer: `Private AC car with verified driver for ${money(prices.local_packages["8h_80km"])} (8h/80km) or ${money(prices.local_packages["12h_120km"])} (12h/120km), covering the Taj Mahal, Agra Fort and Mehtab Bagh. Monument tickets, guide and meals are extra and confirmed before booking.` },
      { question: "Do you provide railway station and airport pickup?", answer: `Yes — Agra Cantt/Fort station transfers run ${money(airportTransfers.find((t) => t.id === "agra-station")!.fares.sedan)} by sedan and Agra Kheria Airport ${money(airportTransfers.find((t) => t.id === "agra-airport")!.fares.sedan)}. Share your train or flight number on WhatsApp.` },
      { question: "Can I add Fatehpur Sikri to the day trip?", answer: `Yes — the 12-hour package absorbs it comfortably. Fatehpur Sikri standalone one-way is ${money(prices.routes_oneway.fatehpur_sikri)} by sedan; the desk confirms the combined plan when you book.` },
      advanceFaq,
    ],
    hub: ROUTES_HUB,
    siblings: [
      { label: "Taxi near Taj Mahal", href: "/en/taxi-near-taj-mahal-agra/" },
      { label: "Agra to Fatehpur Sikri day tour", href: "/en/agra-fatehpur-sikri-one-day-tour/" },
      { label: "Same-day Agra tour from Delhi", href: "/en/same-day-agra-tour-from-delhi/" },
    ],
  };

  if (slug === "agra-fatehpur-sikri-one-day-tour") return {
    opening: `Fatehpur Sikri — Akbar's UNESCO-listed Mughal capital — is the classic half-day extension from Agra. Our one-day taxi tour runs ${money(prices.routes_oneway.fatehpur_sikri)} one-way by sedan with a verified driver, combinable with the Taj Mahal and Agra Fort in a full day. Call or WhatsApp ${contact.phoneDisplay} to book.`,
    table: <table><caption>Agra to Fatehpur Sikri fares</caption><thead><tr><th>Service</th><th>Price</th></tr></thead><tbody>
      <tr><td>One-way (sedan)</td><td>{money(prices.routes_oneway.fatehpur_sikri)}</td></tr>
      <tr><td>Sedan per-km</td><td>{money(prices.fleet_per_km.sedan)}/km</td></tr>
      <tr><td>Full-day 12h/120km package</td><td>{money(prices.local_packages["12h_120km"])}</td></tr>
    </tbody></table>,
    faqs: [
      { question: "How much time do I need at Fatehpur Sikri?", answer: "Two to three hours covers the Buland Darwaza, Jama Masjid, Panch Mahal and the palace complex at an unhurried pace." },
      { question: "Can I combine Fatehpur Sikri with the Taj Mahal in one day?", answer: "Yes — Taj Mahal in the morning, Fatehpur Sikri after lunch, back via Agra Fort if time permits. The 12-hour/120-km package is built for exactly this circuit." },
      advanceFaq,
    ],
    hub: ROUTES_HUB,
    siblings: [
      { label: "Taj Mahal taxi service", href: "/en/taj-mahal-taxi-service/" },
      { label: "Agra to Jaipur taxi", href: "/en/agra-to-jaipur-taxi/" },
      { label: "Taxi near Taj Mahal", href: "/en/taxi-near-taj-mahal-agra/" },
    ],
  };

  // Fallback — should never render for a listed slug; kept generic on purpose.
  return {
    opening: `Private taxi bookings from Agra are available for ${cityTitle(slug)} with verified drivers and clear fare confirmation. Call or WhatsApp ${contact.phoneDisplay} with your date, route and group size.`,
    table: <table><caption>Booking information</caption><thead><tr><th>Service</th><th>Details</th></tr></thead><tbody><tr><td>Vehicle</td><td>Private chauffeur-driven taxi</td></tr><tr><td>Fare</td><td>Confirmed before booking</td></tr></tbody></table>,
    faqs: [
      { question: "Which vehicle is right for this journey?", answer: "Sedan (4+1) for couples, Ertiga (6+1) for families, Innova Crysta (6+1) for comfort and Tempo Traveller (12–24) for groups. The desk recommends based on your group size and luggage." },
      { question: "What is included in the fare?", answer: "The confirmed fare covers the car, driver and Yamuna Expressway toll on one-way bookings. Parking, state tax and night halt are confirmed before booking." },
      advanceFaq,
    ],
    hub: ROUTES_HUB,
    siblings: routeSiblings,
  };
}

export function SeoLandingPage({ slug }: { slug: SeoLandingSlug }) {
  const meta = SEO_LANDING_META[slug];
  const model = pageModel(slug);
  const canonical = `/en/${slug}/`;
  const h1 = meta.title.split(" | ")[0];
  const schema = buildGraphSchema(
    buildLocalBusinessSchema({ includeAggregateRating: false }),
    buildBreadcrumbSchema([{ name: "Home", url: "/" }, { name: model.hub.label, url: model.hub.href }, { name: h1, url: canonical }]),
    buildFaqSchema(model.faqs.map((f) => ({ question: f.question, answer: f.answer }))),
  );
  return <div className="marketing-page seo-landing-page"><JsonLd schema={schema} />
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a className="text-link" href="/">Home</a><span aria-hidden="true"> / </span><a className="text-link" href={model.hub.href}>{model.hub.label}</a><span aria-hidden="true"> / </span><span aria-current="page">{h1}</span></nav>
    <section className="marketing-hero"><p className="eyebrow">SK Baghel Tour &amp; Travels · Taj Ganj, Agra</p><h1>{h1}</h1><p className="hero-copy">{model.opening}</p><div className="hero-actions"><a className="button button-primary" href={`tel:${contact.phone}`}>Call {contact.phoneDisplay}</a><a className="button button-whatsapp" href={`https://wa.me/${contact.whatsapp}?text=Hi%20SK%20Baghel%20Travels%2C%20I%20want%20to%20book`} target="_blank" rel="noreferrer">WhatsApp to book</a></div></section>
    <section className="detail-content"><div className="fare-table-wrap">{model.table}</div><p className="muted-note">Toll, parking, interstate tax, driver allowance and night halt charges are confirmed for the route before booking. <em>Fares last updated October 2026.</em></p><h2>What should I know before booking?</h2><p>Call or WhatsApp with your travel date, pickup point, destination and group size. We confirm vehicle availability and the complete fare before the booking is finalized.</p>
    {model.faqs.map((faq) => <section key={faq.question}><h2>{faq.question}</h2><p>{faq.answer}</p></section>)}
    <h2>How do I book this service?</h2><ol><li>Call or WhatsApp {contact.phoneDisplay} with your date, route and group size.</li><li>We confirm the vehicle, timing and total fare.</li><li>Follow the booking instructions shared by the travel desk.</li></ol>
    <p><span className="related-label">Related: </span>{model.siblings.map((s, i) => <span key={s.href}><a className="text-link" href={s.href}>{s.label}</a>{i < model.siblings.length - 1 ? " · " : ""}</span>)} · <a className="text-link" href="/en/contact/">Contact the Agra travel desk</a></p></section></div>;
}
