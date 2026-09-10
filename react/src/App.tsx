import { useEffect } from "react";
import { isReactMigrationEnabled, siteConfig } from "@/config";

const legacyHomeUrl = "/";

function App() {
  useEffect(() => {
    document.documentElement.lang = "en-IN";
  }, []);

  if (!isReactMigrationEnabled()) {
    return (
      <main className="migration-shell">
        <section className="migration-card" aria-labelledby="migration-paused-title">
          <p className="eyebrow">Platform migration in progress</p>
          <h1 id="migration-paused-title">
            The new experience is <em>not live yet.</em>
          </h1>
          <p>
            Please use the current SK Baghel Tour &amp; Travels website while
            the responsive platform is being completed and approved.
          </p>
          <div className="actions">
            <a className="primary-action" href={legacyHomeUrl}>
              Open current website
            </a>
            <a className="secondary-action" href={`tel:${siteConfig.contact.phone}`}>
              Call {siteConfig.contact.phoneDisplay}
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="migration-shell">
      <header className="migration-header">
        <a className="brand" href={legacyHomeUrl} aria-label="SK Baghel Tour & Travels">
          <strong>SK BAGHEL</strong>
          <span>TOUR &amp; TRAVELS</span>
        </a>
        <a className="call-link" href={`tel:${siteConfig.contact.phone}`}>
          Call {siteConfig.contact.phoneDisplay}
        </a>
      </header>
      <section className="migration-card" aria-labelledby="migration-title">
        <p className="eyebrow">Responsive customer platform</p>
        <h1 id="migration-title">
          Travel from Agra with <em>clarity.</em>
        </h1>
        <p>
          The React platform is ready for the phased migration. The existing
          website remains available while shared responsive components, fares,
          LocationIQ search, bilingual pages, and mock booking are moved safely.
        </p>
        <div className="actions">
          <a className="primary-action" href={legacyHomeUrl}>
            Open current website
          </a>
          <a
            className="secondary-action"
            href={`https://wa.me/${siteConfig.contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp the team
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
