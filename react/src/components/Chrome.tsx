import { useState, type ReactNode } from "react";
import { contact } from "../data/contact";
import { prefetchDocument } from "../app/prefetch";
import { BrandLogo } from "./chrome/BrandLogo";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  onNavigate?: () => void;
}

function NavLink({ href, children, onNavigate }: NavLinkProps) {
  return (
    <a
      href={href}
      onMouseEnter={() => prefetchDocument(href)}
      onFocus={() => prefetchDocument(href)}
      onClick={onNavigate}
    >
      {children}
    </a>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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
        <NavLink href="/en/services/" onNavigate={closeMenu}>Services</NavLink>
        <NavLink href="/en/routes/" onNavigate={closeMenu}>Routes</NavLink>
        <NavLink href="/en/packages/" onNavigate={closeMenu}>Packages</NavLink>
        <NavLink href="/en/fleet/" onNavigate={closeMenu}>Fleet</NavLink>
        <NavLink href="/en/contact/" onNavigate={closeMenu}>Contact</NavLink>
        <NavLink href="/hi/" onNavigate={closeMenu}>हिन्दी</NavLink>
        <NavLink href="/book.html" onNavigate={closeMenu}>
          <span className="button button-primary">Book a ride</span>
        </NavLink>
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
