import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { HeroBentoGrid } from "../components/home/HeroBentoGrid";
import { HeroFareWidget } from "../components/home/HeroFareWidget";
import { TrustRoller } from "../components/home/TrustRoller";
import { PopularRoutes } from "../components/home/PopularRoutes";
import { ServicesGrid } from "../components/home/ServicesGrid";
import { FleetSection } from "../components/home/FleetSection";
import { CoverflowCarousel } from "../components/home/CoverflowCarousel";
import { BenefitsSection } from "../components/home/BenefitsSection";
import { ReviewsMarquee } from "../components/home/ReviewsMarquee";
import { ContactCard } from "../components/home/ContactCard";

export interface HomePageProps {
  language?: SupportedLanguage;
}

export function HomePage({ language }: HomePageProps) {
  // Infer language if not explicitly passed
  const activeLanguage: SupportedLanguage =
    language ??
    (typeof window !== "undefined" && window.location.pathname.startsWith("/hi")
      ? "hi"
      : "en");

  const isHindi = activeLanguage === "hi";
  const [activeLandmark, setActiveLandmark] = useState(
    isHindi ? "ताज महल · आगरा का सूर्योदय" : "Taj Mahal · Dawn in Agra"
  );

  // Schema.org Structured Data Graph
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        "@id": "https://skbagheltravels.in/#business",
        name: "SK Baghel Tour & Travels",
        url: "https://skbagheltravels.in",
        telephone: contact.phone,
        email: contact.email,
        image: "https://skbagheltravels.in/assets/brand/og-banner.webp",
        priceRange: "₹₹",
        currenciesAccepted: "INR",
        paymentAccepted: "Cash, UPI, Credit Card",
        areaServed: [
          "Agra",
          "Delhi",
          "Jaipur",
          "Mathura",
          "Gwalior",
          "Lucknow"
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: contact.phone,
            contactType: "customer service",
            areaServed: "IN",
            availableLanguage: ["en-IN", "hi-IN"]
          }
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Near Taj East Gate Road, Taj Ganj",
          addressLocality: "Agra",
          addressRegion: "Uttar Pradesh",
          postalCode: "282001",
          addressCountry: "IN"
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 27.1632,
          longitude: 78.0322
        },
        openingHours: "Mo-Su 00:00-23:59",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "380",
          bestRating: "5",
          worstRating: "1"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://skbagheltravels.in/#website",
        name: "SK Baghel Tour & Travels",
        url: "https://skbagheltravels.in",
        inLanguage: isHindi ? "hi-IN" : "en-IN",
        potentialAction: {
          "@type": "SearchAction",
          target:
            "https://skbagheltravels.in/en/routes/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://skbagheltravels.in/#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isHindi ? "होम" : "Home",
            item: isHindi
              ? "https://skbagheltravels.in/hi/"
              : "https://skbagheltravels.in/"
          }
        ]
      }
    ]
  };

  return (
    <main id="main-content" className="home-page">
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* Hero Section */}
      <section className="home-hero" aria-labelledby="hero-heading">
        <HeroBentoGrid onMainLandmarkChange={setActiveLandmark} />
        <div className="home-hero-overlay" />

        <div className="hero-location-badge" aria-live="polite">
          <span className="hero-location-dot" />
          <span className="hero-location-text">{activeLandmark}</span>
        </div>

        <div className="home-hero-content">
          <p className="eyebrow eyebrow-light">
            {isHindi ? "होम · आगरा, भारत" : "Home · Agra, India"}
          </p>
          <h1 id="hero-heading">
            {isHindi ? (
              <>
                आगरा से कहीं भी जाएं,
                <br />
                <i>प्रीमियम और आरामदायक सफर।</i>
              </>
            ) : (
              <>
                Agra to anywhere,
                <br />
                <i>in first-class comfort.</i>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {isHindi
              ? "सत्यापित ड्राइवरों के साथ सेडान, एसयूवी और टेम्पो ट्रैवलर। पारदर्शी किराये, यूपीआई अग्रिम भुगतान, और दो मिनट में पक्की बुकिंग।"
              : "Sedans, SUVs and Tempo Travellers with verified drivers. Transparent fares, UPI advance payment, and a confirmed booking in under two minutes."}
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={`tel:${contact.phone}`}>
              {isHindi
                ? `कॉल करें ${contact.phoneDisplay}`
                : `Call ${contact.phoneDisplay}`}
            </a>
            <a
              className="button button-outline button-light"
              href={`https://wa.me/${contact.whatsapp}`}
            >
              {isHindi ? "व्हाट्सएप करें" : "WhatsApp us"}
            </a>
            <a
              className="button button-outline button-light"
              href={isHindi ? "/hi/packages/" : "/en/packages/"}
            >
              {isHindi ? "टूर पैकेज देखें" : "Explore tours"}
            </a>
          </div>
        </div>

        <HeroFareWidget />
      </section>

      {/* Trust Bar Marquee */}
      <TrustRoller />

      {/* Popular Outstation Routes Grid */}
      <PopularRoutes />

      {/* Six Operational Services Grid */}
      <ServicesGrid />

      {/* Fleet Showcase Section */}
      <FleetSection language={activeLanguage} />

      {/* 3D Coverflow Sightseeing Carousel */}
      <CoverflowCarousel />

      {/* Core Benefits Section with Gold Fill-on-Hover */}
      <BenefitsSection />

      {/* Dual Opposing Liquid Glass Reviews Marquee */}
      <ReviewsMarquee />

      {/* Architectural Bento Contact Card Section with Feedback Toast */}
      <ContactCard />
    </main>
  );
}
