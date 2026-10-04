import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTouristTripSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";

export interface DossierTourPackageItem {
  id: string;
  slug: string;
  packageCode?: string;
  name: string;
  durationText: string;
  days: number;
  nights: number;
  baseTierCode: string;
  startingPriceInr: number;
  fleetPrices: Record<string, number>;
  usePerKm: boolean;
  nightChargeInr: number;
  flatChargeInr: number;
  inclusionsHighlight?: string | null;
  inclusionsNote?: string | null;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  upgrades?: Array<{
    id?: string;
    tierCode: string;
    passengerNote?: string | null;
    surchargeInr: number;
  }>;
}

interface DossierTourPackagePageProps {
  language?: SupportedLanguage;
  item: DossierTourPackageItem;
}

const FLEET_SPECIFICATIONS = [
  { id: "sedan", name: "Sedan (Dzire / Etios)", seats: "4 Passengers", bags: "2 Bags", ac: "Dual Climate AC", desc: "Ideal for couples and small families." },
  { id: "ertiga", name: "Ertiga MPV", seats: "6 Passengers", bags: "3 Bags", ac: "Roof-Mounted AC", desc: "Extra legroom and flexible 3rd row seating." },
  { id: "innova", name: "Innova Crysta", seats: "6 Passengers", bags: "4 Bags", ac: "VIP Climate Cabin", desc: "Plush captain seats and whisper-quiet suspension." },
  { id: "tempo", name: "Tempo Traveller", seats: "12–16 Passengers", bags: "Luggage Bay", ac: "Individual AC Vents", desc: "Spacious pushback seats for large families and groups." },
  { id: "urbania", name: "Force Urbania", seats: "10–17 Passengers", bags: "Full Luggage Bay", ac: "Monocoque Luxury AC", desc: "Chauffeur-grade luxury executive travel." },
];

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

export function DossierTourPackagePage({ item }: DossierTourPackagePageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const startingFare = Number(item.startingPriceInr || item.fleetPrices?.sedan || 3499);
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);
  const bookingUrl = `/book.html?package=${encodeURIComponent(item.slug)}&step=1`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour & Travels, I want to book the tour package "${item.name}" from ₹${startingFare.toLocaleString("en-IN")}.`
  )}`;

  const faqs = [
    {
      q: `What is included in the ${item.name} package?`,
      a: `The package includes a private sanitized commercial AC cab dedicated exclusively to your group, a police-verified professional chauffeur, all highway tolls, interstate permits, and parking charges. ${item.inclusionsHighlight ? `Key highlights: ${item.inclusionsHighlight}.` : ""}`,
    },
    {
      q: `Are monument entry tickets included in this tour?`,
      a: `Monument tickets are kept separate so you have complete transparency with zero intermediary markups. Your driver will assist you directly at official Archaeological Survey of India (ASI) ticket counters or online QR portals.`,
    },
    {
      q: `What is the pickup and drop-off location?`,
      a: `We provide complimentary doorstep pickup and drop-off from any hotel in Agra, Agra Cantt Railway Station (AGC), Agra Fort Station, or nearby NCR arrival points as coordinated with your chauffeur.`,
    },
    {
      q: `What is your night allowance charge for early sunrise departures?`,
      a: item.nightChargeInr > 0
        ? `A night allowance of ₹${item.nightChargeInr} applies for late-night journeys between 20:00 and 06:00. Pre-dawn departures scheduled specifically for Taj Mahal sunrise are coordinated smoothly with no hidden fees.`
        : `Scheduled daytime departures incur zero night surcharge. Early morning Taj sunrise departures are smoothly coordinated with transparent advance notice.`,
    },
    {
      q: `How does the 28% advance deposit work?`,
      a: `You only pay a modest 28% token deposit (₹${tokenAdvance.toLocaleString("en-IN")}) online via UPI, debit/credit card, or net banking to lock in your vehicle and chauffeur. The remaining 72% balance is paid directly to the chauffeur upon tour completion.`,
    },
    {
      q: `What is the cancellation and refund policy?`,
      a: `Enjoy full peace of mind. Tour package cancellations requested 24 hours or more prior to departure receive a 100% full refund with zero cancellation penalty.`,
    },
    {
      q: `Can we customize the stops or add a lunch halt?`,
      a: `Yes! All tours are 100% private charters. You set the pace and can request refreshment stops, dining at renowned Agra restaurants, or handicraft demonstrations without extra driver fees within the duration.`,
    },
    {
      q: `Can we upgrade to an Innova Crysta or Tempo Traveller?`,
      a: `Yes. We operate 5 vehicle tiers. Upgrades to Ertiga, Innova Crysta, Tempo Traveller, or Force Urbania are available at guaranteed transparent fixed surcharges shown in our fare table.`,
    },
    {
      q: `What emergency assistance is provided during the tour?`,
      a: `Our 24×7 central dispatch desk in Taj Ganj monitors every active journey and guarantees a 45-minute vehicle replacement along major Agra corridors in the unlikely event of technical issues.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/packages/${item.slug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Tour Packages", url: "/en/packages/" },
    { name: item.name, url: `/en/packages/${item.slug}/` },
  ]);

  const faqSchema = buildFaqSchema(
    faqs.map((f) => ({ question: f.q, answer: f.a })),
    `${canonicalUrl}#faq`
  );

  const touristTripSchema = buildTouristTripSchema({
    id: `${canonicalUrl}#touristtrip`,
    name: item.name,
    description: item.inclusionsHighlight || `Private guided tour package: ${item.name}. AC cab with verified chauffeur.`,
    duration: item.durationText,
    offers: {
      price: startingFare,
      priceCurrency: "INR",
      availability: "InStock",
    },
  });

  const pageSchemaGraph = buildGraphSchema(breadcrumbSchema, faqSchema, touristTripSchema);

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
            <span className="material-symbols-outlined text-icon-14">verified</span>
            100% Private Guided Charter
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
                  <span className="material-symbols-outlined text-icon-14">tour</span>
                  {item.days} Day{item.days > 1 ? "s" : ""}{item.nights > 0 ? ` / ${item.nights} Night${item.nights > 1 ? "s" : ""}` : " Sightseeing"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-sandstone text-label-caps font-label-caps uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-icon-14">schedule</span>
                  {item.durationText}
                </span>
              </div>

              {/* Exactly one H1 per page */}
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {item.name}
              </h1>

              {item.inclusionsHighlight && (
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                  {item.inclusionsHighlight}
                </p>
              )}

              {/* Corridor / Feature Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">hotel_class</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.durationText}</span>
                    <span className="text-label-md text-secondary">Duration</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">alt_route</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">All Tolls</span>
                    <span className="text-label-md text-secondary">Included Upfront</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">person_check</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Private Cab</span>
                    <span className="text-label-md text-secondary">Verified Chauffeur</span>
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
                Package Starting Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-bold">
                  ₹{startingFare.toLocaleString("en-IN")}
                </span>
                <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
              </div>
              <p className="text-body-sm text-secondary">
                Lock your private tour with a ₹{tokenAdvance.toLocaleString("en-IN")} advance deposit (28%). Balance of 72% paid at drop-off.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white py-3.5 rounded-lg text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center font-bold"
                  href={bookingUrl}
                >
                  <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                  <span>Book This Tour Online</span>
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
              Guaranteed Fares Across All 5 Vehicle Tiers
            </h2>
            {/* Required dated fare table notice */}
            <p className="font-body-md text-body-md text-primary font-semibold">
              Fares updated {fareDateFormatted}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              All prices include private vehicle custody, commercial permit, driver charges, and highway tolls. Zero surprise roadside charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {FLEET_SPECIFICATIONS.map((fleet) => {
              const tierPrice = item.fleetPrices?.[fleet.id] ?? startingFare;
              const tierToken = Math.round(tierPrice * 0.28);
              const tierBookingUrl = `/book.html?package=${encodeURIComponent(item.slug)}&vehicle=${fleet.id}&step=1`;

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
                      <span className="text-label-md font-label-caps text-secondary uppercase font-semibold">Tour Package Fare</span>
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

          {/* Upgrades & Night-Charge Notes */}
          <div className="mt-space-2xl grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/60 shadow-xs">
              <div className="flex items-center gap-2 text-terracotta-sandstone mb-2">
                <span className="material-symbols-outlined text-icon-22">upgrade</span>
                <h3 className="font-title-md text-ink-charcoal font-bold">Vehicle Upgrade Surcharges</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed mb-3">
                Seamless vehicle upgrade surcharges applied over our standard sedan baseline:
              </p>
              <ul className="space-y-1.5 text-body-sm text-on-surface-variant">
                <li className="flex justify-between border-b border-border-warm/30 pb-1">
                  <span>Ertiga Smart MPV (up to 6 passengers)</span>
                  <strong className="text-ink-charcoal">+₹800 surcharge</strong>
                </li>
                <li className="flex justify-between border-b border-border-warm/30 pb-1">
                  <span>Innova Crysta VIP Executive (up to 6 passengers)</span>
                  <strong className="text-ink-charcoal">+₹1,800 surcharge</strong>
                </li>
                <li className="flex justify-between border-b border-border-warm/30 pb-1">
                  <span>Tempo Traveller 12–16 Seater (Group travel)</span>
                  <strong className="text-ink-charcoal">+₹3,500 surcharge</strong>
                </li>
                <li className="flex justify-between">
                  <span>Force Urbania Ultra-Luxury Van</span>
                  <strong className="text-ink-charcoal">+₹5,500 surcharge</strong>
                </li>
              </ul>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-warm/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-terracotta-sandstone mb-2">
                  <span className="material-symbols-outlined text-icon-22">bedtime</span>
                  <h3 className="font-title-md text-ink-charcoal font-bold">Night Pickup &amp; Operating Policies</h3>
                </div>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {item.nightChargeInr > 0
                    ? `A regulated driver night allowance of ₹${item.nightChargeInr} applies when the vehicle is dispatched between 20:00 and 06:00 to compensate chauffeur night duty.`
                    : `Daytime scheduled departures incur zero night surcharge. Early morning Taj sunrise tours commencing before 06:00 AM are organized with dedicated pre-dawn priority.`}
                </p>
                <p className="text-body-sm text-on-surface-variant leading-relaxed mt-2">
                  {item.inclusionsNote || "All packages include dedicated vehicle custody for the specified duration, fuel, parking at verified monument stands, and state road taxes."}
                </p>
              </div>
              <div className="pt-space-sm border-t border-border-warm/40 flex items-center justify-between text-body-sm text-secondary font-medium">
                <span>Zero Shopping Detours Guaranteed</span>
                <span className="text-success-jade font-semibold">100% Commercial Fleet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8–13 FAQs with Accordion */}
      <section className="w-full bg-surface py-space-3xl border-b border-border-warm/30">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs font-bold">
              Tour Questions &amp; Logistics
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-xs font-bold">
              Frequently Asked Questions for {item.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Clear answers regarding monument tickets, guide coordination, luggage, and punctuality.
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
                Direct Taj Ganj Dispatch Desk
              </span>
              {/* Phone in H2 requirement */}
              <h2 className="font-headline-md text-headline-md text-ink-charcoal font-serif font-bold leading-tight">
                Call 24×7 for Instant Booking:{" "}
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {contact.phoneDisplay}
                </a>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Ready to experience {item.name}? Reserve online with a 28% deposit or contact our dispatch concierge for customized itineraries.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                className="inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white px-8 py-4 rounded-xl text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all text-center font-bold"
                href={bookingUrl}
              >
                <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                <span>Book This Tour</span>
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

export default DossierTourPackagePage;
