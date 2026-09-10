import { useEffect, useState } from "react";
import { contact } from "../data/contact";
import { packages, routes, vehicles } from "../data/catalogue";

const heroSlides = [
  ["Taj Mahal · Dawn in Agra", "/assets/packages/taj-dawn.webp", "Majestic Taj Mahal at sunrise in Agra"],
  ["Agra Fort · Mughal Heritage", "/assets/packages/agra-fort.webp", "Historic red sandstone Agra Fort"],
  ["Mathura · Sacred Yamuna Ghats", "/assets/packages/mathura.webp", "Sacred ghats and temples of Mathura and Vrindavan"],
  ["Amber Palace · Golden Triangle", "/assets/packages/golden-triangle.webp", "Historic Amber Palace Fort in Jaipur"]
] as const;

const services = [
  ["01", "Outstation cabs", "Agra to Delhi, Jaipur, Mathura, Gwalior and Lucknow with transparent one-way and round-trip fares.", "/en/routes/"],
  ["02", "Local Agra sightseeing", "A full day around the Taj Mahal, Agra Fort, Mehtab Bagh and the city's quieter heritage corners.", "/en/agra-sightseeing-taxi/"],
  ["03", "Airport transfers", "Reliable pickups and drops for Agra Kheria, Agra Cantt and Delhi IGI Airport.", "/en/services/"],
  ["04", "Tempo & Urbania", "9 to 26 seater Tempo Travellers and luxury Force Urbania for family and corporate groups.", "/en/vehicles/tempo-traveller/"],
  ["05", "Tour packages", "Golden Triangle, Same Day Taj, Mathura Vrindavan and private multi-day journeys.", "/en/packages/"]
] as const;

export function HomePage() {
  const [slide, setSlide] = useState(0);
  const [from, setFrom] = useState("agra");
  const [to, setTo] = useState("delhi");
  const [date, setDate] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % heroSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  const [caption, image, alt] = heroSlides[slide];
  const bookingUrl = `/book.html?from=${from}&to=${to}${date ? `&date=${date}` : ""}`;

  return (
    <main id="main-content" className="home-page">
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="home-hero-media">
          <img src={image} alt={alt} width="1600" height="900" fetchPriority={slide === 0 ? "high" : "auto"} />
        </div>
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <p className="eyebrow eyebrow-light">Home · Agra, India</p>
          <h1 id="hero-heading">Agra to anywhere,<br /><i>in first-class comfort.</i></h1>
          <p className="hero-copy">Sedans, SUVs and Tempo Travellers with verified drivers. Transparent fares, UPI advance payment, and a confirmed booking in under two minutes.</p>
          <div className="hero-actions">
            <a className="button button-primary" href={`tel:${contact.phone}`}>Call {contact.phoneDisplay}</a>
            <a className="button button-outline button-light" href={`https://wa.me/${contact.whatsapp}`}>WhatsApp us</a>
            <a className="button button-outline button-light" href="/en/packages/">Explore tours</a>
          </div>
          <div className="home-slide-controls" aria-label="Hero background slides">
            <span aria-live="polite">{caption}</span>
            <div>{heroSlides.map(([label], index) => <button key={label} type="button" className={index === slide ? "is-active" : ""} aria-label={`Show ${label}`} aria-pressed={index === slide} onClick={() => setSlide(index)} />)}</div>
          </div>
        </div>
        <form className="home-search" action="/book.html" method="get">
          <label><span>Pickup city</span><select name="from" value={from} onChange={(event) => setFrom(event.target.value)}><option value="agra">Agra (AGR)</option><option value="delhi">Delhi (DEL)</option><option value="jaipur">Jaipur (JAI)</option></select></label>
          <label><span>Drop city</span><select name="to" value={to} onChange={(event) => setTo(event.target.value)}><option value="delhi">Delhi (DEL)</option><option value="jaipur">Jaipur (JAI)</option><option value="mathura">Mathura</option><option value="gwalior">Gwalior</option><option value="lucknow">Lucknow</option></select></label>
          <label><span>Travel date</span><input name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button className="button button-primary" type="submit">Check fare ↗</button>
        </form>
      </section>

      <section className="trust-strip" aria-label="Key trust credentials">
        {["Govt-registered fleet", "Verified commercial drivers", "Official GST invoice", "★ 4.9/5 · 380+ trips", "15+ years in Agra", "24×7 on-route support", "Transparent pricing"].map((item) => <span key={item}>{item}</span>)}
      </section>

      <section className="home-section" id="services" aria-labelledby="services-heading">
        <div className="section-heading"><div><p className="eyebrow">Services</p><h2 id="services-heading">One local team.<br /><i>Every kind of journey.</i></h2></div><a className="text-link" href="/en/services/">All services ↗</a></div>
        <div className="service-grid">{services.map(([index, title, body, href]) => <article className="service-card" key={title}><span className="service-index">{index}</span><h3>{title}</h3><p>{body}</p><a className="text-link" href={href}>Explore ↗</a></article>)}</div>
      </section>

      <section className="home-section home-section-alt" aria-labelledby="fleet-heading">
        <div className="section-heading"><div><p className="eyebrow">Fleet</p><h2 id="fleet-heading">Choose your comfort.<br /><i>Bring your people.</i></h2></div><a className="text-link" href="/en/fleet/">Full fleet ↗</a></div>
        <div className="fleet-grid">{vehicles.filter((vehicle) => ["sedan", "innova", "tempo"].includes(vehicle.id)).map((vehicle) => <article className="fleet-card" key={vehicle.id}><img src={vehicle.image} alt={`${vehicle.name} taxi in Agra`} width="480" height="300" loading="lazy" /><div><p className="eyebrow">{vehicle.tags.join(" · ")}</p><h3>{vehicle.name}</h3><p>{vehicle.blurb}</p><div className="card-meta"><span>from ₹{({ sedan: 3499, innova: 6499, tempo: 9500 } as Record<string, number>)[vehicle.id].toLocaleString("en-IN")}</span><a className="text-link" href={`/en/vehicles/${vehicle.id === "innova" ? "innova-crysta" : vehicle.id === "tempo" ? "tempo-traveller" : vehicle.id}/`}>Choose this car ↗</a></div></div></article>)}</div>
      </section>

      <section className="home-section home-packages" aria-labelledby="packages-heading">
        <div className="section-heading"><div><p className="eyebrow eyebrow-light">Tour packages</p><h2 id="packages-heading">See more,<br /><i>without rushing.</i></h2></div><a className="text-link text-link-light" href="/en/packages/">All packages ↗</a></div>
        <div className="package-grid">{packages.slice(0, 3).map((tour) => <article className="package-card" key={tour.id}><img src={tour.image} alt="" width="480" height="300" loading="lazy" /><div><p className="eyebrow">{tour.kicker} · {tour.duration}</p><h3>{tour.name}</h3><p>{tour.blurb}</p><div className="card-meta"><strong>₹{tour.from.toLocaleString("en-IN")}</strong><a className="text-link text-link-light" href={`/en/packages/${tour.slug}/`}>Details ↗</a></div></div></article>)}</div>
      </section>

      <section className="contact-card" id="contact" aria-labelledby="contact-heading"><div><p className="eyebrow">Start a conversation</p><h2 id="contact-heading">Plan your next journey.</h2></div><a className="button button-primary" href={`https://wa.me/${contact.whatsapp}`}>Message on WhatsApp</a></section>
      <a className="sr-only" href={bookingUrl}>Continue to fare check</a>
    </main>
  );
}
