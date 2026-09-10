import { useState } from "react";
import { contact } from "../data/contact";
import { packages, routes, vehicles } from "../data/catalogue";
import { HeroBentoGrid } from "../components/home/HeroBentoGrid";
import { HeroFareWidget } from "../components/home/HeroFareWidget";
import { TrustRoller } from "../components/home/TrustRoller";
import { PopularRoutes } from "../components/home/PopularRoutes";
import { ServicesGrid } from "../components/home/ServicesGrid";

export function HomePage() {
  const [activeLandmark, setActiveLandmark] = useState("Taj Mahal · Dawn in Agra");

  return (
    <main id="main-content" className="home-page">
      <section className="home-hero" aria-labelledby="hero-heading">
        <HeroBentoGrid onMainLandmarkChange={setActiveLandmark} />
        <div className="home-hero-overlay" />
        <div className="hero-location-badge" aria-live="polite">
          <span className="hero-location-dot" />
          <span className="hero-location-text">{activeLandmark}</span>
        </div>
        <div className="home-hero-content">
          <p className="eyebrow eyebrow-light">Home · Agra, India</p>
          <h1 id="hero-heading">Agra to anywhere,<br /><i>in first-class comfort.</i></h1>
          <p className="hero-copy">Sedans, SUVs and Tempo Travellers with verified drivers. Transparent fares, UPI advance payment, and a confirmed booking in under two minutes.</p>
          <div className="hero-actions">
            <a className="button button-primary" href={`tel:${contact.phone}`}>Call {contact.phoneDisplay}</a>
            <a className="button button-outline button-light" href={`https://wa.me/${contact.whatsapp}`}>WhatsApp us</a>
            <a className="button button-outline button-light" href="/en/packages/">Explore tours</a>
          </div>
        </div>
        <HeroFareWidget />
      </section>

      <TrustRoller />

      <PopularRoutes />

      <ServicesGrid />

      <section className="home-section home-section-alt" aria-labelledby="fleet-heading">
        <div className="section-heading"><div><p className="eyebrow">Fleet</p><h2 id="fleet-heading">Choose your comfort.<br /><i>Bring your people.</i></h2></div><a className="text-link" href="/en/fleet/">Full fleet ↗</a></div>
        <div className="fleet-grid">{vehicles.filter((vehicle) => ["sedan", "innova", "tempo"].includes(vehicle.id)).map((vehicle) => <article className="fleet-card" key={vehicle.id}><img src={vehicle.image} alt={`${vehicle.name} taxi in Agra`} width="480" height="300" loading="lazy" /><div><p className="eyebrow">{vehicle.tags.join(" · ")}</p><h3>{vehicle.name}</h3><p>{vehicle.blurb}</p><div className="card-meta"><span>from ₹{({ sedan: 3499, innova: 6499, tempo: 9500 } as Record<string, number>)[vehicle.id].toLocaleString("en-IN")}</span><a className="text-link" href={`/en/vehicles/${vehicle.id === "innova" ? "innova-crysta" : vehicle.id === "tempo" ? "tempo-traveller" : vehicle.id}/`}>Choose this car ↗</a></div></div></article>)}</div>
      </section>

      <section className="home-section home-packages" aria-labelledby="packages-heading">
        <div className="section-heading"><div><p className="eyebrow eyebrow-light">Tour packages</p><h2 id="packages-heading">See more,<br /><i>without rushing.</i></h2></div><a className="text-link text-link-light" href="/en/packages/">All packages ↗</a></div>
        <div className="package-grid">{packages.slice(0, 3).map((tour) => <article className="package-card" key={tour.id}><img src={tour.image} alt="" width="480" height="300" loading="lazy" /><div><p className="eyebrow">{tour.kicker} · {tour.duration}</p><h3>{tour.name}</h3><p>{tour.blurb}</p><div className="card-meta"><strong>₹{tour.from.toLocaleString("en-IN")}</strong><a className="text-link text-link-light" href={`/en/packages/${tour.slug}/`}>Details ↗</a></div></div></article>)}</div>
      </section>

      <section className="contact-card" id="contact" aria-labelledby="contact-heading"><div><p className="eyebrow">Start a conversation</p><h2 id="contact-heading">Plan your next journey.</h2></div><a className="button button-primary" href={`https://wa.me/${contact.whatsapp}`}>Message on WhatsApp</a></section>
    </main>
  );
}
