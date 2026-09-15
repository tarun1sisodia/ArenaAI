/**
 * BenefitsSection — "Benefits To Book Cab With Us" Section (Phase R5.7)
 *
 * 6 core value proposition cards:
 * 1. Easy Booking (Instant Confirm)
 * 2. Multiple Fleets (Sedan to 26-Seater)
 * 3. Lowest Fares (Zero Hidden Fees)
 * 4. Exciting Offers (Coupon ASTTCAR500OFF)
 * 5. On-Time Service (100% Punctual)
 * 6. 24×7 Dedicated Support (Live Support 24×7)
 *
 * Micro-interactions:
 * - Card lifts -4px with ambient shadow and gold border
 * - Icon wrapper fills with solid gold and rotates + scales
 * - SVG icon transitions from gold to crisp white
 * - ASTTCAR500OFF promo code badge
 */

import React from "react";

interface BenefitCardData {
  id: string;
  title: string;
  pill: string;
  desc: React.ReactNode;
  icon: React.ReactNode;
}

const BENEFITS: BenefitCardData[] = [
  {
    id: "easy-booking",
    title: "Easy Booking",
    pill: "Instant Confirm",
    desc: "Book your taxi in minutes with a simple, hassle-free process. Instant confirmation via Call & WhatsApp with zero waiting.",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" /> 
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "multiple-fleets",
    title: "Multiple Fleets",
    pill: "Sedan to 26-Seater",
    desc: "Choose from clean Sedans, Ertiga, Innova Crysta, 9–26 seater Tempo Travellers, and luxury Force Urbania suited for any group.",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11 2 11.3V16c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: "lowest-fares",
    title: "Lowest Fares",
    pill: "Zero Hidden Fees",
    desc: "Book with confidence enjoying the best guaranteed rates, transparent per-km billing, and zero hidden platform surcharges.",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3h12" />
        <path d="M6 8h12" />
        <path d="m6 13 8.5 8" />
        <path d="M6 13h3a4.5 4.5 0 0 0 0-9" />
      </svg>
    ),
  },
  {
    id: "exciting-offers",
    title: "Exciting Offers",
    pill: "Coupon ASTTCAR500OFF",
    desc: (
      <>
        Unlock seasonal tour deals and instant savings. Use coupon{" "}
        <code className="benefit-code">ASTTCAR500OFF</code> for flat ₹500 off on outstation trips.
      </>
    ),
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <circle cx="18" cy="16" r="2" />
      </svg>
    ),
  },
  {
    id: "on-time-service",
    title: "On-Time Service",
    pill: "100% Punctual",
    desc: "Punctual doorstep pickups, GPS-tracked vehicles, flight delay monitoring, and experienced chauffeurs who know Agra inside out.",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "24x7-support",
    title: "24×7 Dedicated Support",
    pill: "Live Support 24×7",
    desc: "Get instant human assistance anytime, anywhere you travel with our round-the-clock live dispatch desk on Call & WhatsApp.",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
];

export function BenefitsSection() {
  return (
    <section
      className="home-section section--paper benefits-section"
      id="benefits"
      aria-labelledby="benefits-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Why Choose Us</p>
          <h2 id="benefits-heading">
            Benefits To Book Cab
            <br />
            <i>With Us.</i>
          </h2>
          <p className="benefits-lead">
            Professional and dependable cab services in Agra designed for comfort, safety, and
            convenience with 100% transparent fares and verified chauffeurs.
          </p>
        </div>
      </div>

      <div className="benefits-grid" role="list">
        {BENEFITS.map((benefit) => (
          <article
            className="benefit-card"
            key={benefit.id}
            role="listitem"
            aria-labelledby={`benefit-title-${benefit.id}`}
          >
            <div className="benefit-head">
              <div className="benefit-icon-wrapper" aria-hidden="true">
                {benefit.icon}
              </div>
              <span className="benefit-pill">{benefit.pill}</span>
            </div>
            <h3 id={`benefit-title-${benefit.id}`}>{benefit.title}</h3>
            <p>{benefit.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
