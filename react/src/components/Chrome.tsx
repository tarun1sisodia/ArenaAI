import { useState } from "react";
import { contact } from "../data/contact";
import { prefetchDocument } from "../app/prefetch";
import { BrandLogo } from "./chrome/BrandLogo";
import { RollLink } from "./chrome/RollLink";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <header className="site-header">
      <BrandLogo href="/" onClick={closeMenu} />
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
      </button>
      <nav id="primary-navigation" className={menuOpen ? "primary-nav is-open" : "primary-nav"} aria-label="Primary navigation">
        <RollLink href="/en/services/" isActive={currentPath.startsWith("/en/services")} onNavigate={closeMenu}>
          Services
        </RollLink>
        <RollLink href="/en/routes/" isActive={currentPath.startsWith("/en/routes")} onNavigate={closeMenu}>
          Routes
        </RollLink>
        <RollLink href="/en/packages/" isActive={currentPath.startsWith("/en/packages")} onNavigate={closeMenu}>
          Packages
        </RollLink>
        <RollLink href="/en/fleet/" isActive={currentPath.startsWith("/en/fleet") || currentPath.includes("/vehicles/")} onNavigate={closeMenu}>
          Fleet
        </RollLink>
        <RollLink href="/en/contact/" isActive={currentPath.startsWith("/en/contact")} onNavigate={closeMenu}>
          Contact
        </RollLink>
        <RollLink href="/hi/" isActive={currentPath.startsWith("/hi")} onNavigate={closeMenu}>
          हिन्दी
        </RollLink>
        <a href="/book.html" onClick={closeMenu} onMouseEnter={() => prefetchDocument("/book.html")}>
          <span className="button button-primary">Book a ride</span>
        </a>
      </nav>
    </header>
  );
}

export function LeadBar() {
  return (
    <aside className="lead-bar" aria-label="Contact SK Baghel Tour & Travels">
      <span>Ready when you are</span>
      <a className="button button-primary" href={`tel:${contact.phone}`}>
        Call
      </a>
      <a className="button button-dark" href={`https://wa.me/${contact.whatsapp}`}>
        WhatsApp
      </a>
      <a className="button button-outline" href="/book.html" onMouseEnter={() => prefetchDocument("/book.html")}>
        Book
      </a>
    </aside>
  );
}

export function LoadingIndicator({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <span className="loading-indicator__dot" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message = "We could not load this section." }: { message?: string }) {
  return (
    <div className="error-state" role="alert">
      <strong>Something needs attention.</strong>
      <span>{message}</span>
      <button type="button" className="button button-outline" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
