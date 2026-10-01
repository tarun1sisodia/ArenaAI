import React from "react";
import { Icon } from "../components/icons/Icon";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

export interface PrivacyPageProps {
  language?: SupportedLanguage;
}

const PRIVACY_TOC = [
  { id: "info-collected", label: "1. Information We Collect" },
  { id: "purpose-use", label: "2. Purpose & Lawful Use" },
  { id: "zero-selling", label: "3. Zero Data Selling Guarantee" },
  { id: "chauffeur-protocol", label: "4. Chauffeur Discretion & Privacy" },
  { id: "retention-rights", label: "5. Retention & Passenger Rights" },
  { id: "cookies-storage", label: "6. Cookies & Session Storage" },
  { id: "grievance-dpo", label: "7. Data Protection Officer (DPO)" },
];

export function PrivacyPage({ language = "en" }: PrivacyPageProps) {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-sandstone-wash/60 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-4 text-on-surface-variant font-label-caps">
            <a className="text-primary hover:underline" href="/">
              Home
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold">Passenger Data Integrity</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
            <div className="lg:col-span-8 space-y-2">
              <span className="font-label-caps text-xs text-terracotta-sandstone uppercase tracking-widest block font-bold">
                Statutory Charter &amp; Digital Discretion
              </span>
              <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight">
                Privacy Policy &amp; <br />
                <span className="text-terracotta-sandstone italic font-normal">Passenger Data Integrity</span>
              </h1>
              <p className="font-body-lg text-xs sm:text-title-lg text-on-surface-variant max-w-2xl pt-1">
                Upholding timeless hospitality discretion with state-of-the-art telemetry compliance. Your movement across
                North India remains strictly sovereign, encrypted, and respected.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-2 bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-border-warm/70">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Last Revision:</span>
                <span className="font-bold text-ink-charcoal">January 2026</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-terracotta-sandstone h-full w-full" />
              </div>
              <div className="flex items-center justify-between font-label-caps text-label-lg text-on-surface-variant uppercase tracking-wider">
                <span>Compliance Standard:</span>
                <span className="text-success-jade font-bold">DPDP Act (India) Compliant</span>
              </div>
            </div>
          </div>

          {/* Quick Jump Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-6">
            {PRIVACY_TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-label-caps text-xs transition-colors font-bold"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 2. PRIVACY CONTENT BODY */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Core Commitments */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm shadow-xs">
            <Icon name="lock" className="text-primary text-xl mb-1.5" />
            <h2 className="font-bold text-xs text-ink-charcoal mb-0.5">Zero Data Selling</h2>
            <p className="text-label-lg text-on-surface-variant leading-relaxed">
              We never sell or rent passenger phone numbers, itineraries, or emails to souvenir shops, hotels, or advertisers.
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm shadow-xs">
            <Icon name="encrypted" className="text-success-jade text-xl mb-1.5" />
            <h2 className="font-bold text-xs text-ink-charcoal mb-0.5">Encrypted Transit</h2>
            <p className="text-label-lg text-on-surface-variant leading-relaxed">
              All booking vouchers, driver allocations, and payment tokens are processed over secure HTTPS with 256-bit encryption.
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest border border-border-warm shadow-xs">
            <Icon name="delete_forever" className="text-primary text-xl mb-1.5" />
            <h2 className="font-bold text-xs text-ink-charcoal mb-0.5">Right to Erasure</h2>
            <p className="text-label-lg text-on-surface-variant leading-relaxed">
              Guests can email privacy@agraskbagheltourandtravels.com anytime to request immediate deletion of their historical travel records.
            </p>
          </div>
        </div>

        {/* Clause 1: Information Collected */}
        <div id="info-collected" className="scroll-mt-28 space-y-2.5">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">1. Categories of Information We Collect</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            To coordinate high-precision pickups and issue verified booking receipts, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-body-md sm:text-xs text-on-surface-variant">
            <li>
              <strong>Identity &amp; Contact:</strong> Guest Full Name, Primary Phone/WhatsApp Number, and Email Address.
            </li>
            <li>
              <strong>Itinerary Logistics:</strong> Pickup Date, Rendezvous Location/Hotel, Flight/Train Number (for delay tracking), and Destination.
            </li>
            <li>
              <strong>Financial Tokens:</strong> Advance token payment transaction IDs (card/banking credentials are never stored on our servers).
            </li>
          </ul>
        </div>

        {/* Clause 2: Purpose */}
        <div id="purpose-use" className="scroll-mt-28 space-y-2.5 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">2. Purpose &amp; Lawful Basis of Processing</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Data is collected solely to perform our contractual service: assigning a verified chauffeur, tracking vehicle arrival
            punctuality, issuing computerized tax invoices, and providing immediate customer support on WhatsApp and phone.
          </p>
        </div>

        {/* Clause 3: Zero Data Selling */}
        <div id="zero-selling" className="scroll-mt-28 space-y-2.5 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">3. Zero Data Selling Guarantee</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Unlike mass online aggregators, SK Baghel Tour &amp; Travels operates as an independent, private fleet. We do not
            monetize guest telemetry or share personal contact details with commercial telemarketers, shopping emporiums, or tourist
            commission networks.
          </p>
        </div>

        {/* Clause 4: Chauffeur Protocol */}
        <div id="chauffeur-protocol" className="scroll-mt-28 space-y-2.5 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">4. Chauffeur Discretion &amp; Privacy Protocol</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Chauffeurs receive only the minimal logistical details needed to meet you (Name, Pickup Time, and Hotel/Terminal). Drivers
            are bound by our strict non-solicitation agreement and are forbidden from sharing passenger phone numbers or taking
            unauthorized photos.
          </p>
        </div>

        {/* Clause 5: Retention & Rights */}
        <div id="retention-rights" className="scroll-mt-28 space-y-2.5 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">5. Retention &amp; Passenger Rights</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Under India&apos;s Digital Personal Data Protection (DPDP) Act 2023, you have the right to review, update, or request the
            permanent erasure of all personal records held in our dispatch registry upon completion of your journey.
          </p>
        </div>

        {/* Clause 6: Cookies */}
        <div id="cookies-storage" className="scroll-mt-28 space-y-2.5 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">6. Cookies &amp; Session Storage</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Our website uses strictly necessary local storage cookies to retain your chosen itinerary parameters while you complete
            your booking form. We do not utilize third-party cross-site advertising trackers or retargeting pixels.
          </p>
        </div>

        {/* Clause 7: DPO */}
        <div id="grievance-dpo" className="scroll-mt-28 space-y-2.5 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">7. Data Protection Officer (DPO)</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            For any privacy inquiries, grievance redressals, or data deletion requests, contact our designated Data Protection Officer:
          </p>
          <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm text-body-md space-y-1">
            <p><strong>Officer:</strong> Privacy &amp; Compliance Officer</p>
            <p><strong>Email:</strong> privacy@agraskbagheltourandtravels.com</p>
            <p><strong>Address:</strong> Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001, India</p>
          </div>
        </div>
      </section>
    </div>
  );
}
