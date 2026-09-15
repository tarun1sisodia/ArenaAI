/**
 * ServicesGrid — Six Operational Services Grid (Phase R5.5)
 *
 * Displays the 6 core travel verticals from typed catalogue:
 * 01. One-Way Outstation Drop (navy variant border)
 * 02. Outstation Round-Trip (light variant border)
 * 03. Local Sightseeing & City Tours (gold variant border)
 * 04. Airport & Station Transfers (light variant border)
 * 05. Tempo Traveller & Urbania (navy variant border)
 * 06. Curated Tour Packages (gold variant border)
 *
 * Each card features:
 * - Monospace index numeral (01-06)
 * - Decorative service mark emblem (✦) & category icon
 * - Display-font heading (Fraunces)
 * - Descriptive paragraph
 * - Live feature & pricing tags
 * - Dedicated CTA with arrow slide interaction
 * - Variant color top-border (navy, light, gold)
 * - 3-col desktop → 2-col tablet → 1-col mobile layout
 */

import { services, type Service } from "../../data/catalogue";

/** Category icons corresponding to each service vertical */
const SERVICE_ICONS: Record<string, string> = {
  oneway: "🛣️",
  roundtrip: "🔄",
  local: "🏛️",
  airport: "✈️",
  tempo: "🚐",
  tours: "🌅",
};

export function ServicesGrid() {
  return (
    <section
      className="home-section services-grid-section"
      id="services"
      aria-labelledby="services-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Services</p>
          <h2 id="services-heading">
            One local team.
            <br />
            <i>Every kind of journey.</i>
          </h2>
        </div>
        <a className="text-link" href="/en/services/">
          All services ↗
        </a>
      </div>

      <div className="services-grid" role="list">
        {services.map((service: Service) => {
          const icon = SERVICE_ICONS[service.id] ?? "✦";
          const variantClass = `services-card--${service.variant}`;

          return (
            <article
              className={`services-card ${variantClass}`}
              key={service.id}
              role="listitem"
              aria-labelledby={`service-title-${service.id}`}
            >
              {/* Card top bar: Index numeral + Category icon & brand mark */}
              <div className="services-card-header">
                <div className="services-card-index-wrapper">
                  <span className="services-card-index" aria-label={`Service ${service.index}`}>
                    {service.index}
                  </span>
                  <span className="services-card-variant-badge" aria-hidden="true">
                    {service.variant}
                  </span>
                </div>
                <div className="services-card-marks" aria-hidden="true">
                  <span className="services-card-icon">{icon}</span>
                  <span className="services-card-sparkle">✦</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="services-card-title" id={`service-title-${service.id}`}>
                {service.title}
              </h3>

              {/* Description body */}
              <p className="services-card-body">{service.body}</p>

              {/* Tags row */}
              <div className="services-card-tags" aria-label="Service highlights">
                {service.tags.map((tag) => (
                  <span className="services-card-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="services-card-footer">
                <a
                  className="services-card-cta"
                  href={service.href}
                  aria-label={`${service.cta} for ${service.title}`}
                >
                  <span className="services-card-cta-text">{service.cta}</span>
                  <span className="services-card-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
