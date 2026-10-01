import React, { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";

export interface ContactPageProps {
  language?: SupportedLanguage;
}

const FAQ_ITEMS = [
  {
    q: "How quickly will your dispatch team respond to my booking or inquiry?",
    a: "Our 24×7 Taj Ganj dispatch team responds within 2 to 5 minutes on WhatsApp (+91 63958 67598) or direct phone call. Inquiries submitted via the form are confirmed within 15 minutes with a transparent fare breakdown.",
  },
  {
    q: "Can I book a cab for a 5:00 AM Taj Mahal sunrise tour on short notice?",
    a: "Yes, absolutely. Sunrise Taj Mahal tours are our everyday specialty. We maintain standby chauffeur-driven sedans and MPVs in Taj Ganj and Fatehabad Road hotel areas, ready for 5:00 AM or 5:30 AM pickups.",
  },
  {
    q: "What exact information is required to confirm my outstation trip?",
    a: "To confirm, we only need: (1) Pickup date and exact time, (2) Pickup address or hotel name in Agra/Delhi, (3) Drop destination, (4) Passenger count, and (5) Preferred car tier. No complicated registrations required.",
  },
  {
    q: "Is there any waiting penalty if my train or flight is delayed?",
    a: "No. When you provide your train number (e.g., Gatimaan Express, Shatabdi at Agra Cantt) or flight number (at Delhi IGI Airport), our dispatch team tracks real-time arrivals. Chauffeurs wait at the exit gate with zero delay penalty.",
  },
  {
    q: "Do you issue official booking receipts for corporate expense claims?",
    a: "Yes. Every booking includes a verified booking receipt tax invoice ( ) with itemized kilometer logs, expressway tolls, and state passenger permits.",
  },
];

export function ContactPage({ language = "en" }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceType: "outstation-oneway",
    vehiclePreference: "sedan",
    tripDate: "",
    tripTime: "",
    pickupLocation: "",
    notes: "",
    companyReceiptRequested: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const text = `Hello SK Baghel Travels, I would like to book a trip:%0A- Name: ${encodeURIComponent(
      formData.name
    )}%0A- Phone: ${encodeURIComponent(formData.phone)}%0A- Email: ${encodeURIComponent(
      formData.email
    )}%0A- Service: ${encodeURIComponent(formData.serviceType)}%0A- Vehicle: ${encodeURIComponent(
      formData.vehiclePreference
    )}%0A- Date/Time: ${encodeURIComponent(formData.tripDate)} at ${encodeURIComponent(
      formData.tripTime
    )}%0A- Pickup: ${encodeURIComponent(formData.pickupLocation)}%0A- Notes: ${encodeURIComponent(
      formData.notes
    )}%0A- booking receipt: ${formData.companyReceiptRequested ? "Yes" : "No"}`;

    setTimeout(() => {
      window.open(`https://wa.me/919762817598?text=${text}`, "_blank");
    }, 400);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-surface-container-low/70 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-4 text-on-surface-variant font-label-caps">
            <a className="text-primary hover:underline" href="/">
              Home
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold">Contact &amp; 24×7 Dispatch Desk</span>
          </nav>

          <div className="max-w-4xl">

            <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight mb-3">
              Your chauffeur is stationed. We&apos;re a ring away.
            </h1>
            <p className="text-on-surface-variant font-body-lg text-body-lg leading-relaxed mb-4">
              Headquartered directly beside the Taj Mahal in Taj Ganj, Agra. Dedicated round-the-clock dispatch for airport drops,
              outstation cabs across North India, and bespoke heritage tours.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="size-2 rounded-full bg-success-jade animate-pulse shrink-0" />
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                24×7 Active Garage &amp; Dispatch (&lt; 3 mins response)
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Direct WhatsApp Travel Desk (+91 63958 67598)
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-terracotta-sandstone shrink-0">
                verified_user
              </span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Official booking receipt Billing &amp; Invoices
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-terracotta-sandstone shrink-0">
                pin_drop
              </span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Taj Ganj Physical Garage (Near Taj East Gate Rd)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE CONTACT CHANNELS (3 ELEVATED CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        <div>
          <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
            Direct Communication Channels
          </span>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
            Immediate Connectivity with Central Fleet Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {/* Card 1: Immediate Call Dispatch (Compact -20%) */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-terracotta-deep text-white font-label-caps text-label-caps px-2.5 py-0.5 rounded-bl uppercase tracking-wider font-semibold">
                Average Pick-up: 2 Rings
              </span>
            </div>
            <div>
              <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone mb-3 mt-1">
                <span className="material-symbols-outlined text-lg">phone_in_talk</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-base mb-1 font-semibold">Immediate Call Dispatch (24×7)</h3>
              <p className="font-title-lg text-terracotta-sandstone mb-2 font-bold text-sm sm:text-base">+91 63958 67598</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-4 text-body-md">
                Immediate taxi allocation, late-night expressway emergencies, 3:00 AM airport pickups, and instant driver
                assignment.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-1.5 bg-terracotta-deep hover:bg-primary text-white font-label-lg py-2 px-3 rounded-lg transition-colors text-center text-xs font-semibold shadow-xs"
              href="tel:+916395867598"
            >
              <span className="material-symbols-outlined text-icon-16">call</span>
              <span>Call Dispatch Now</span>
            </a>
          </div>

          {/* Card 2: WhatsApp Desk (Compact -20%) */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-success-jade text-white font-label-caps text-label-caps px-2.5 py-0.5 rounded-bl uppercase tracking-wider font-semibold">
                Typical Reply: &lt; 5 mins
              </span>
            </div>
            <div>
              <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center mb-3 mt-1 shadow-sm">
                <WhatsAppIcon className="w-5 h-5 shrink-0" />
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-base mb-1 font-semibold">
                WhatsApp Desk (Fastest)
              </h3>
              <p className="font-title-lg text-ink-charcoal mb-2 font-bold text-sm sm:text-base">+91 63958 67598</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-4 text-body-md">
                Send itinerary details, receive vehicle photos, driver credentials, live location tracking, and instant quote
                cards with UPI advance links.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg py-2.5 px-3 rounded-lg transition-colors text-center text-xs font-semibold shadow-xs active:scale-[0.98]"
              style={{ color: "#ffffff" }}
              href="https://wa.me/919762817598"
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
              <span className="text-white" style={{ color: "#ffffff" }}>Chat on WhatsApp ↗</span>
            </a>
          </div>

          {/* Card 3: Corporate & Tour Desk (Compact -20%) */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-3.5 sm:p-4.5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-secondary text-white font-label-caps text-label-caps px-2.5 py-0.5 rounded-bl uppercase tracking-wider font-semibold">
                Corporate Rates &amp; booking receipt
              </span>
            </div>
            <div>
              <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone mb-3 mt-1">
                <span className="material-symbols-outlined text-lg">business_center</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-base mb-1 font-semibold">Corporate &amp; Tour Desk</h3>
              <p className="font-title-md text-ink-charcoal mb-0.5 font-semibold text-xs break-all">
                bookings@agraskbagheltourandtravels.com
              </p>
              <p className="text-on-surface-variant font-body-sm mb-2 text-label-lg break-all">dispatch@agraskbagheltourandtravels.com</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-4 text-body-md">
                Multi-day Golden Triangle itineraries, wedding group transit in Tempo Travellers/Urbania, and B2B booking receipt tax
                invoices.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-ink-charcoal font-label-lg py-2 px-3 rounded-lg transition-colors border border-outline-variant text-center text-xs font-semibold"
              href="mailto:bookings@agraskbagheltourandtravels.com"
            >
              <span className="material-symbols-outlined text-icon-16">mail</span>
              <span>Email Itinerary</span>
            </a>
          </div>
        </div>



        {/* 4. DISPATCH FAQS (Compact -20%) */}
        <div className="max-w-4xl mx-auto pt-6">
          <div className="text-center mb-6">
            <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
              Dispatch Questions
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Dispatch Questions
            </h2>
          </div>
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-xs sm:text-title-lg font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-icon-18 shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-3 sm:p-3.5 pt-0 text-on-surface-variant font-body-sm text-body-md leading-relaxed border-t border-border-warm/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
