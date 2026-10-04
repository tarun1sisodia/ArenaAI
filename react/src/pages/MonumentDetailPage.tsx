import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTouristTripSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";
import { WhatsAppIcon } from "../components/icons";

export interface DossierMonumentItem {
  id: string;
  slug?: string;
  monumentCode?: string;
  name: string;
  visitingHours: string;
  closedNote: string;
  historicalContext?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface MonumentDetailPageProps {
  language?: SupportedLanguage;
  item: DossierMonumentItem;
}

const FLEET_SPECIFICATIONS = [
  { id: "sedan", name: "Sedan (Dzire / Etios)", seats: "4 Passengers", bags: "2 Bags", ac: "Dual Climate AC", fare: 800 },
  { id: "ertiga", name: "Ertiga MPV", seats: "6 Passengers", bags: "3 Bags", ac: "Roof-Mounted AC", fare: 1050 },
  { id: "innova", name: "Innova Crysta", seats: "6 Passengers", bags: "4 Bags", ac: "VIP Climate Cabin", fare: 1400 },
  { id: "tempo", name: "Tempo Traveller", seats: "12–16 Passengers", bags: "Luggage Bay", ac: "Individual AC Vents", fare: 2400 },
  { id: "urbania", name: "Force Urbania", seats: "10–17 Passengers", bags: "Full Luggage Bay", ac: "Monocoque Luxury AC", fare: 3800 },
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

export function MonumentDetailPage({ item }: MonumentDetailPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const startingFare = 800;
  const tokenAdvance = Math.round(startingFare * 0.28);
  const fareDateFormatted = formatFareDate(item.updatedAt);
  const monumentSlug = item.slug ?? item.monumentCode ?? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const bookingUrl = `/book.html?trip=local&from=Agra&to=${encodeURIComponent(item.name)}&vehicle=sedan`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hello Agra SK Baghel Tour & Travels, I want to book a cab transfer or guided tour for "${item.name}".`
  )}`;

  const faqs = [
    {
      q: `What are the visiting hours for ${item.name}?`,
      a: `${item.name} is open from ${item.visitingHours}. ${item.closedNote}. For sunrise viewing, visitors are advised to reach the ticket barrier 30–45 minutes prior to gate opening.`,
    },
    {
      q: `Is ${item.name} closed on any day of the week?`,
      a: `Operational status: ${item.closedNote}. Please note that the Taj Mahal is closed on Fridays for congregational prayers, whereas other Agra monuments (Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah) remain open all 7 days.`,
    },
    {
      q: `How can we book monument entry tickets?`,
      a: `Tickets can be purchased electronically on the official Archaeological Survey of India (ASI) ticketing portal (asi.payumoney.com) or via on-site contactless QR kiosks at the entry plaza. Your chauffeur will guide you directly to the correct line.`,
    },
    {
      q: `Where does the taxi or cab drop visitors at ${item.name}?`,
      a: `Due to Agra Archaeological Protection regulations, commercial motorized vehicles drop passengers at designated parking plazas (such as Taj East Gate or West Gate parking). Battery-operated electric golf carts and shuttles transport visitors the remaining 500 meters to the main gate.`,
    },
    {
      q: `Are official tour guides available at ${item.name}?`,
      a: `Yes! We coordinate with Ministry of Tourism and ASI-licensed historians speaking English, French, Spanish, German, and Italian at government-approved rates. Beware of unauthorized touts near parking bays.`,
    },
    {
      q: `What items are prohibited inside ${item.name}?`,
      a: `Eating items, chewing gum, smoking devices, matchboxes, tripods, large backpacks, and sharp objects are strictly prohibited inside central Mughal monument sanctums. Cell phones and small handheld digital cameras are permitted. Locker rooms are available at security checkpoints.`,
    },
    {
      q: `What shoe protocol is required inside ${item.name}?`,
      a: `To protect ancient marble and red sandstone floors, visitors must either remove footwear or wear disposable shoe covers (provided complimentary or for a nominal fee at the main plinth security booth).`,
    },
    {
      q: `How does cab booking to ${item.name} work?`,
      a: `You can book a dedicated point-to-point transfer or full-day sightseeing charter online with a 28% deposit (₹${tokenAdvance.toLocaleString("en-IN")}). Your chauffeur will meet you at your hotel lobby or Agra Cantt station and wait until your visit concludes.`,
    },
    {
      q: `What is the cancellation policy for monument transfers?`,
      a: `Enjoy full flexibility with our 24-Hour Free Cancellation guarantee. If your schedule changes and you cancel 24 hours prior to pickup, 100% of your deposit is refunded without deduction.`,
    },
  ];

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/monuments/${monumentSlug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Monuments", url: "/en/packages/" },
    { name: item.name, url: `/en/monuments/${monumentSlug}/` },
  ]);

  const faqSchema = buildFaqSchema(
    faqs.map((f) => ({ question: f.q, answer: f.a })),
    `${canonicalUrl}#faq`
  );

  const touristTripSchema = buildTouristTripSchema({
    id: `${canonicalUrl}#touristtrip`,
    name: `${item.name} Cab Tour`,
    description: item.historicalContext || `Visiting guide and private cab transfer to ${item.name} in Agra. Timings: ${item.visitingHours}. ${item.closedNote}.`,
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
            <a className="hover:text-primary transition-colors" href="/en/packages/">Monuments &amp; Heritage</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium truncate max-w-xs">{item.name}</span>
          </nav>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-label-caps font-label-caps uppercase tracking-wider font-semibold">
            <span className="material-symbols-outlined text-icon-14">temple_hindu</span>
            UNESCO Heritage &amp; History Guide
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
                  {item.visitingHours}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-sandstone text-label-caps font-label-caps uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-icon-14">event_busy</span>
                  {item.closedNote}
                </span>
              </div>

              {/* Exactly one H1 per page */}
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal tracking-tight font-serif">
                {item.name}
              </h1>

              {item.historicalContext && (
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                  {item.historicalContext}
                </p>
              )}

              {/* Heritage Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">history_edu</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Mughal Era</span>
                    <span className="text-label-md text-secondary">Historical Site</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">schedule</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">{item.visitingHours.split(" ")[0]}</span>
                    <span className="text-label-md text-secondary">Opening Time</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">confirmation_number</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">ASI Kiosk</span>
                    <span className="text-label-md text-secondary">Entry Tickets</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-space-sm rounded bg-surface-container-low border border-border-warm/40">
                  <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">directions_car</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-headline-sm text-ink-charcoal font-semibold">Private Cab</span>
                    <span className="text-label-md text-secondary">Doorstep Drop</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cab Transfer Card */}
            <div className="lg:col-span-4 bg-sandstone-wash/90 p-space-xl rounded-2xl border border-border-warm shadow-md flex flex-col gap-space-md">
              <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest font-bold">
                Cab Transfer to {item.name}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-bold">
                  ₹{startingFare.toLocaleString("en-IN")}
                </span>
                <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
              </div>
              <p className="text-body-sm text-secondary">
                Private sanitized AC cab from your Agra hotel or railway station with 28% advance token (₹{tokenAdvance.toLocaleString("en-IN")}).
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white py-3.5 rounded-lg text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center font-bold"
                  href={bookingUrl}
                >
                  <span className="material-symbols-outlined text-icon-20">directions_car</span>
                  <span>Book Cab to Monument</span>
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
              Cab Fares to {item.name}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-xs font-bold">
              Private Cab Tour Rates Across Fleet Tiers
            </h2>
            {/* Required dated fare table notice */}
            <p className="font-body-md text-body-md text-primary font-semibold">
              Fares updated {fareDateFormatted}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Round-trip transfer from any Agra hotel or station to {item.name} with dedicated chauffeur waiting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {FLEET_SPECIFICATIONS.map((fleet) => {
              const tierToken = Math.round(fleet.fare * 0.28);
              const tierBookingUrl = `/book.html?trip=local&from=Agra&to=${encodeURIComponent(item.name)}&vehicle=${fleet.id}`;

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
                      <span className="text-label-md font-label-caps text-secondary uppercase font-semibold">Round-Trip Cab Fare</span>
                      <span className="font-headline-md text-headline-md text-terracotta-sandstone font-serif font-bold">
                        ₹{fleet.fare.toLocaleString("en-IN")}
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
        </div>
      </section>

      {/* 8–13 FAQs with Accordion */}
      <section className="w-full bg-surface py-space-3xl border-b border-border-warm/30">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs font-bold">
              Visitor Information
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-xs font-bold">
              Frequently Asked Questions About {item.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Visiting hours, ticket fees, photography rules, and authorized transport guidance.
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
                Agra Heritage Concierge Desk
              </span>
              {/* Phone in H2 requirement */}
              <h2 className="font-headline-md text-headline-md text-ink-charcoal font-serif font-bold leading-tight">
                Call 24×7 for Monument Cab Booking:{" "}
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {contact.phoneDisplay}
                </a>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Book a verified AC cab to {item.name} with polite chauffeurs and zero tourist-trap shopping detours.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                className="inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white px-8 py-4 rounded-xl text-label-lg font-label-lg shadow-md hover:bg-terracotta-sunlit transition-all text-center font-bold"
                href={bookingUrl}
              >
                <span className="material-symbols-outlined text-icon-20">directions_car</span>
                <span>Book Monument Cab</span>
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

export default MonumentDetailPage;
