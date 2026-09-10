import { useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";

export interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

export function MobileNavSheet({
  isOpen,
  onClose,
  currentPath = "/",
}: MobileNavSheetProps) {
  const isHindi = currentPath.startsWith("/hi");
  const langSwitchHref = isHindi ? "/" : "/hi/";
  const langSwitchLabel = isHindi ? "English Version" : "हिन्दी संस्करण";

  // Close on Escape key press and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`nav-sheet ${isOpen ? "is-open" : ""}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="sheet-content">
        {/* Header with Brand and Close button */}
        <div className="sheet-head">
          <BrandLogo href={isHindi ? "/hi/" : "/"} onClick={onClose} />
          <button
            type="button"
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Theme and Language Row */}
        <div className="sheet-theme-row">
          <div className="sheet-theme-info">
            <span className="sheet-theme-label">Theme</span>
            <span className="sheet-theme-sub">White / Solar Dusk</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="sheet-lang-row">
          <a
            href={langSwitchHref}
            className="sheet-lang-link"
            onClick={onClose}
          >
            <span>Language</span>
            <strong>{langSwitchLabel} →</strong>
          </a>
        </div>

        {/* Navigation Categories */}
        <nav className="sheet-nav" aria-label="Mobile Navigation">
          <a href="/" className="sheet-nav-link" onClick={onClose}>
            Home
          </a>

          {/* Services Group */}
          <div className="sheet-group">
            <a
              href="/en/services/"
              className="sheet-group-title"
              onClick={onClose}
              onMouseEnter={() => prefetchDocument("/en/services/")}
            >
              Services
            </a>
            <div className="sheet-sub-links">
              <a
                href="/en/services/#outstation"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Outstation Cabs (Delhi, Jaipur)
              </a>
              <a
                href="/en/services/#local"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Local Agra Sightseeing (Taj Mahal)
              </a>
              <a
                href="/en/services/#airport"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Airport Transfers (IGI Delhi & Agra)
              </a>
              <a
                href="/en/services/#corporate"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Tempo & Group Travel (12–26 Seater)
              </a>
            </div>
          </div>

          {/* Routes Group */}
          <div className="sheet-group">
            <a
              href="/en/routes/"
              className="sheet-group-title"
              onClick={onClose}
              onMouseEnter={() => prefetchDocument("/en/routes/")}
            >
              Popular Routes
            </a>
            <div className="sheet-sub-links">
              <a
                href="/en/agra-to-delhi-taxi/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Agra → Delhi <span>₹3,499</span>
              </a>
              <a
                href="/en/delhi-to-agra-taxi/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Delhi → Agra <span>₹3,499</span>
              </a>
              <a
                href="/en/agra-to-jaipur-taxi/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Agra → Jaipur <span>₹3,499</span>
              </a>
              <a
                href="/en/agra-to-mathura-taxi/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Agra → Mathura <span>₹2,200</span>
              </a>
              <a
                href="/en/agra-to-gwalior-taxi/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Agra → Gwalior <span>₹3,000</span>
              </a>
            </div>
          </div>

          {/* Tour Packages Group */}
          <div className="sheet-group">
            <a
              href="/en/packages/"
              className="sheet-group-title"
              onClick={onClose}
              onMouseEnter={() => prefetchDocument("/en/packages/")}
            >
              Tour Packages
            </a>
            <div className="sheet-sub-links">
              <a
                href="/en/packages/agra-sightseeing/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Same Day Agra Taj Mahal Tour <span>₹3,499</span>
              </a>
              <a
                href="/en/packages/taj-mahal-sunrise-tour/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Taj Mahal Sunrise Tour <span>₹12,999</span>
              </a>
              <a
                href="/en/packages/mathura-vrindavan/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Mathura & Vrindavan Darshan <span>₹4,200</span>
              </a>
              <a
                href="/en/packages/golden-triangle/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Golden Triangle Tour <span>₹18,500</span>
              </a>
            </div>
          </div>

          {/* Fleet Group */}
          <div className="sheet-group">
            <a
              href="/en/fleet/"
              className="sheet-group-title"
              onClick={onClose}
              onMouseEnter={() => prefetchDocument("/en/fleet/")}
            >
              Our Fleet
            </a>
            <div className="sheet-sub-links">
              <a
                href="/en/vehicles/sedan/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Sedan (Dzire Class) <span>₹10/km</span>
              </a>
              <a
                href="/en/vehicles/ertiga/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Ertiga (6+1 MPV) <span>₹14/km</span>
              </a>
              <a
                href="/en/vehicles/innova-crysta/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Innova Crysta (6+1 SUV) <span>₹18/km</span>
              </a>
              <a
                href="/en/vehicles/tempo-traveller/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Tempo Traveller (12–17) <span>₹25/km</span>
              </a>
            </div>
          </div>

          {/* Contact & Support Links */}
          <div className="sheet-group">
            <a
              href="/en/contact/"
              className="sheet-group-title"
              onClick={onClose}
            >
              Contact & Support
            </a>
            <div className="sheet-sub-links">
              <a href="/en/about/" className="sheet-sub-link" onClick={onClose}>
                About SK Baghel Travels
              </a>
              <a href="/en/faq/" className="sheet-sub-link" onClick={onClose}>
                Frequently Asked Questions (FAQ)
              </a>
              <a
                href="/en/terms/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Terms & Cancellation Policy
              </a>
              <a
                href="/en/privacy/"
                className="sheet-sub-link"
                onClick={onClose}
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </nav>

        {/* Sheet Actions Footer */}
        <div className="sheet-actions">
          <a
            className="btn-outline sheet-action-call"
            href={`tel:${contact.phone}`}
          >
            <span className="icon icon-call" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="16"
                height="16"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span>Call {contact.phoneDisplay}</span>
          </a>
          <a
            className="btn-outline sheet-action-wa"
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="icon icon-wa" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="16"
                height="16"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </span>
            <span>WhatsApp Dispatch</span>
          </a>
          <a
            className="btn-primary sheet-action-book"
            href="/book.html"
            onClick={onClose}
          >
            Book Now <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default MobileNavSheet;
