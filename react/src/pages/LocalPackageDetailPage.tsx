import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTaxiServiceSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";

export interface DossierLocalPackageItem {
  id: string;
  slug: string;
  packageCode?: string;
  name: string;
  durationHours: number;
  includedKm: number;
  covers: string;
  parkingNote?: string | null;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  extraRates?: Record<string, { per_km?: number; per_hr?: number }>;
  nightChargeInr: number;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LocalPackageDetailPageProps {
  language?: SupportedLanguage;
  item: DossierLocalPackageItem;
}

const FLEET_SPECIFICATIONS = [
  { id: "sedan", name: "Sedan (Dzire / Etios)", seats: "4 Passengers", bags: "2 Bags", ac: "Dual Climate AC", desc: "Nimble city navigation for couples and small families." },
  { id: "ertiga", name: "Ertiga MPV", seats: "6 Passengers", bags: "3 Bags", ac: "Roof-Mounted AC", desc: "Spacious seating and elevated ride height for families." },
  { id: "innova", name: "Innova Crysta", seats: "6 Passengers", bags: "4 Bags", ac: "VIP Climate Cabin", desc: "VIP comfort with individual reclining captain armchairs." },
  { id: "tempo", name: "Tempo Traveller", seats: "12–16 Passengers", bags: "Luggage Bay", ac: "Individual AC Vents", desc: "Spacious group sightseeing charter for extended families." },
  { id: "urbania", name: "Force Urbania", seats: "10–17 Passengers", bags: "Full Luggage Bay", ac: "Monocoque Luxury AC", desc: "Chauffeur-grade luxury executive van charter." },
];

const DEFAULT_EXTRA_RATES: Record<string, { per_km: number; per_hr: number }> = {
  sedan: { per_km: 10, per_hr: 150 },
  ertiga: { per_km: 14, per_hr: 200 },
  innova: { per_km: 18, per_hr: 250 },
  tempo: { per_km: 25, per_hr: 400 },
  urbania: { per_km: 34, per_hr: 600 },
};

function formatFareDate(dateStr?: string | null): string {
  if (!dateStr) return "October 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "October 2026";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "October 2026";
  }
}

export function LocalPackageDetailPage({ item }: LocalPackageDetailPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const startingFare = Number(item.fleetPrices?.sedan ?? 1900);
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);
  const bookingUrl = `/book.html?trip=local&package=${encodeURIComponent(item.slug)}&step=1`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour & Travels, I want to book local sightseeing package "${item.name}" from ₹${startingFare.toLocaleString("en-IN")}.`
  )}`;

  const faqs = [
    {
      q: `What is included in the ${item.name} package?`,
      a: `The package includes dedicated vehicle custody for ${item.durationHours} Hours and up to ${item.includedKm} KM, a polite police-verified chauffeur, fuel, and air-conditioning throughout your sightseeing circuit.`,
    },
    {
      q: `What destinations are covered during this tour?`,
      a: `This package covers: ${item.covers}. You have complete flexibility to visit these monuments at your preferred pace or substitute stops within the city limits.`,
    },
    {
      q: `How are extra hours and extra kilometers billed?`,
      a: `If your tour exceeds ${item.durationHours} hours or ${item.includedKm} km, extra rates apply strictly at published transparent tariffs (e.g. ₹10/km and ₹150/hr for Sedan; ₹14/km and ₹200/hr for Ertiga; ₹18/km and ₹250/hr for Innova). There are no hidden surcharges.`,
    },
    {
      q: `Are monument entry fees and parking included?`,
      a: item.parkingNote || "Monument entry tickets and parking stand fees are billed at actuals. Your chauffeur parks at authorized stands and assists you at ticketing gates.",
    },
    {
      q: `Can the chauffeur pick us up from our hotel or railway station?`,
      a: `Yes! We provide complimentary doorstep pickup from any hotel, homestay, or railway station (Agra Cantt AGC or Agra Fort AF) within municipal Agra city limits.`,
    },
    {
      q: `How does the 28% advance deposit work?`,
      a: `Lock in your private vehicle and driver with a 28% token deposit (₹${tokenAdvance.toLocaleString("en-IN")}). The remaining 72% balance is paid directly to the chauffeur at the conclusion of your sightseeing day.`,
    },
    {
      q: `What is your cancellation and refund policy?`,
      a: `We offer a 24-Hour Free Cancellation guarantee. If cancelled 24 hours or more before scheduled pickup, your 28% advance deposit is refunded 100% with zero cancellation fees.`,
    },
    {
      q: `Can we stop for lunch or authentic Agra Petha shopping?`,
      a: `Absolutely! Since the car is reserved exclusively for your party, your chauffeur will gladly accommodate lunch halts at top-rated hygienic restaurants and guide you to authentic government-approved sweet shops in Sadar Bazaar or Kinari Bazaar.`,
    },
    {
      q: `Do you provide assistance for senior citizens or toddlers?`,
      a: `Yes! Our chauffeurs drop guests at the closest allowable vehicular point near monument gates and assist with coordinating battery-operated golf cart shuttles at the Taj Mahal and Agra Fort.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/local-packages/${item.slug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Local Packages", url: "/en/packages/" },
    { name: item.name, url: `/en/local-packages/${item.slug}/` },
  ]);

  const faqSchema = buildFaqSchema(
    faqs.map((f) => ({ question: f.q, answer: f.a })),
    `${canonicalUrl}#faq`
  );

  const taxiServiceSchema = buildTaxiServiceSchema({
    id: `${canonicalUrl}#taxiservice`,
    name: `${item.name} — Local Agra Cab Charter`,
    description: `Agra local sightseeing cab charter: ${item.durationHours} hrs / ${item.includedKm} km. Covers: ${item.covers}. AC cab with verified chauffeur.`,
    offers: [
      { name: "Sedan", price: item.fleetPrices?.sedan ?? startingFare },
      { name: "Ertiga", price: item.fleetPrices?.ertiga ?? Math.round(startingFare * 1.35) },
      { name: "Innova Crysta", price: item.fleetPrices?.innova ?? Math.round(startingFare * 1.5) },
      { name: "Tempo Traveller", price: item.fleetPrices?.tempo ?? Math.round(startingFare * 2.8) },
      { name: "Force Urbania", price: item.fleetPrices?.urbania ?? Math.round(startingFare * 3.8) },
    ],
  });

  const pageSchemaGraph = buildGraphSchema(breadcrumbSchema, faqSchema, taxiServiceSchema);

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={pageSchemaGraph} />

      {/* Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/en/packages/">Packages</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium truncate max-w-xs">{item.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider font-semibold">
            <span className="material-symbols-outlined text-icon-14">location_city</span>
            Dedicated City Charter
          </span>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-label-caps font-label-caps uppercase tracking-widest font-bold">
                  <span className="material-symbols-outlined text-icon-14">schedule</span>
                  {item.durationHours} Hours Included
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-sandstone text-label-caps font-label-caps uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-icon-14">straighten</span>
                  {item.includedKm} KM Range
                </span>
              </div>

              {/* Exactly one H1 per page */}
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {item.name}
              </h1>

              <div className="bg-surface-container-low p-space-md rounded-xl border border-border-warm/60">
                <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-wider font-bold block mb-1">
                  Heritage Monuments &amp; Landmarks Covered
                </span>
                <p className="font-body-md text-body-md text-ink-charcoal leading-relaxed font-medium">
                  {item.covers}
                </p>
              </div>

              {/* Transit Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">hourglass_bottom</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.durationHours} Hrs</span>
                    <span className="text-label-md text-secondary">Vehicle Custody</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">speed</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.includedKm} KM</span>
                    <span className="text-label-md text-secondary">Included Distance</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">hotel_class</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Doorstep</span>
                    <span className="text-label-md text-secondary">Hotel / Station</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">verified</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">28% Token</span>
                    <span className="text-label-md text-secondary">Reserve to Lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Callout Card */}
            <div className="lg:col-span-4 bg-sandstone-wash/90 p-space-xl rounded-2xl border border-border-warm shadow-md flex flex-col gap-space-md">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest font-bold">
                Package Base Rate (Sedan)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-bold">
                  ₹{startingFare.toLocaleString("en-IN")}
                </span>
                <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
              </div>
              <p className="text-body-sm text-secondary">
                Lock your day charter with a ₹{tokenAdvance.toLocaleString("en-IN")} deposit (28%). Pay the remaining 72% at tour completion.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white py-3.5 rounded-lg text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center font-bold"
                  href={bookingUrl}
                >
                  <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                  <span>Book City Charter</span>
                </a>
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg text-label-lg font-label-lg shadow-xs hover:bg-ink-slate transition-all text-center"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                  <span>Chat with Concierge</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dated 5-Tier Fare Comparison Matrix */}
      <section className="w-full bg-surface-container-low py-space-3xl border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs font-bold">
              Transparent Fleet Pricing
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-xs font-bold">
              Guaranteed Sightseeing Fares by Vehicle Tier
            </h2>
            {/* Required dated fare table notice */}
            <p className="font-body-md text-body-md text-primary font-semibold">
              Fares updated {fareDateFormatted}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Complete {item.durationHours}-hour vehicle charter with verified AC comfort and police-checked chauffeurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {FLEET_SPECIFICATIONS.map((fleet) => {
              const tierPrice = item.fleetPrices?.[fleet.id] ?? startingFare;
              const tierToken = Math.round(tierPrice * 0.28);
              const tierBookingUrl = `/book.html?trip=local&package=${encodeURIComponent(item.slug)}&vehicle=${fleet.id}&step=1`;

              return (
                <div
                  key={fleet.id}
                  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-border-warm/70 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-md uppercase tracking-wider font-bold">
                        {fleet.id}
                      </span>
                      <span className="text-body-sm text-secondary font-medium">{fleet.seats}</span>
                    </div>
                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif mt-1 font-bold">{fleet.name}</h3>
                    <p className="text-body-sm text-on-surface-variant leading-snug">{fleet.desc}</p>

                    <div className="flex flex-col gap-1 py-space-xs border-y border-border-warm/30 text-body-sm text-on-surface-variant mt-2">
                      <div className="flex items-center justify-between">
                        <span>Luggage:</span>
                        <span className="font-medium text-ink-charcoal">{fleet.bags}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Air Conditioning:</span>
                        <span className="font-medium text-success-jade">{fleet.ac}</span>
                      </div>
                    </div>

                    <div className="flex flex-col pt-2">
                      <span className="text-label-md font-label-caps text-secondary uppercase font-semibold">Full Charter Rate</span>
                      <span className="font-headline-md text-headline-md text-terracotta-sandstone font-serif font-bold">
                        ₹{tierPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-label-md text-secondary">
                        ₹{tierToken.toLocaleString("en-IN")} token to lock
                      </span>
                    </div>
                  </div>

                  <a
                    className="mt-space-md w-full inline-flex items-center justify-center gap-1 bg-terracotta-deep text-white py-2.5 rounded text-label-lg font-label-lg shadow-xs hover:bg-terracotta-sunlit transition-all text-center font-semibold"
                    href={tierBookingUrl}
                  >
                    <span>Select {fleet.id}</span>
                    <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Extra Rates per-km / per-hr Table */}
          <div className="mt-space-2xl p-space-xl rounded-2xl bg-surface-container-lowest border border-border-warm/60 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
              <div>
                <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-wider font-bold">
                  Overtime &amp; Distance Extensions
                </span>
                <h3 className="font-title-lg text-title-lg text-ink-charcoal font-bold mt-0.5">
                  Published Extra Rates (Per-KM &amp; Per-Hour)
                </h3>
              </div>
              <span className="text-body-sm text-secondary">
                {item.parkingNote || "Monument entry fees & parking billed at actuals."}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border-warm bg-sandstone-wash/60 text-ink-charcoal font-bold">
                    <th className="py-2.5 px-4">Vehicle Tier</th>
                    <th className="py-2.5 px-4">Passenger Capacity</th>
                    <th className="py-2.5 px-4">Extra Distance Rate</th>
                    <th className="py-2.5 px-4">Extra Time Rate</th>
                    <th className="py-2.5 px-4">Included Duration &amp; Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm/30 text-on-surface-variant">
                  {FLEET_SPECIFICATIONS.map((fleet) => {
                    const extra = item.extraRates?.[fleet.id] ?? DEFAULT_EXTRA_RATES[fleet.id];
                    return (
                      <tr key={fleet.id} className="hover:bg-sandstone-wash/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-ink-charcoal capitalize">{fleet.name}</td>
                        <td className="py-3 px-4">{fleet.seats}</td>
                        <td className="py-3 px-4 text-terracotta-sandstone font-bold">₹{extra.per_km}/km</td>
                        <td className="py-3 px-4 text-ink-charcoal font-bold">₹{extra.per_hr}/hr</td>
                        <td className="py-3 px-4">{item.durationHours} hrs / {item.includedKm} km</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 8–13 FAQs with Accordion */}
      <section className="w-full bg-surface py-space-3xl border-b border-border-warm/30">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs font-bold">
              Sightseeing Logistics
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-xs font-bold">
              Frequently Asked Sightseeing Questions
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Everything you need to know about monument timings, itinerary pacing, parking, and vehicle comfort.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-container-low rounded-lg border border-border-warm/60 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-space-lg flex items-center justify-between gap-space-md text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-title-md text-ink-charcoal font-serif font-bold">{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-terracotta-sandstone text-icon-22 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-space-lg pb-space-lg pt-0 text-body-md text-on-surface-variant leading-relaxed border-t border-border-warm/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking CTA Strip with Phone in H2 */}
      <section className="w-full bg-sandstone-wash py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-10 shadow-lg border border-border-warm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            <div className="flex flex-col gap-space-xs max-w-xl">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest font-bold">
                Agra Taj Ganj City Concierge
              </span>
              {/* Phone in H2 requirement */}
              <h2 className="font-headline-md text-headline-md text-ink-charcoal font-serif font-bold leading-tight">
                Call 24×7 for Sightseeing Booking:{" "}
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {contact.phoneDisplay}
                </a>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Tour Agra at your own pace with a dedicated private vehicle and polite local driver.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                className="inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white px-8 py-4 rounded-xl text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all text-center font-bold"
                href={bookingUrl}
              >
                <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                <span>Reserve City Charter</span>
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 bg-ink-charcoal text-white px-6 py-4 rounded-xl text-label-lg font-label-lg shadow-sm hover:bg-ink-slate transition-all text-center font-semibold"
                href={`tel:${contact.phone}`}
              >
                <span className="material-symbols-outlined text-icon-20 text-terracotta-sunlit">phone_in_talk</span>
                <span>Call Chauffeur Desk</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LocalPackageDetailPage;
