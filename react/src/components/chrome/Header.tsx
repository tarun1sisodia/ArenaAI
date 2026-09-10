import { useState, useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
import { RollLink } from "./RollLink";
import { ThemeToggle } from "./ThemeToggle";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";

export interface HeaderProps {
  currentPath?: string;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export function Header({
  currentPath,
  onToggleMobileNav,
  isMobileNavOpen = false,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const activePath =
    currentPath || (typeof window !== "undefined" ? window.location.pathname : "/");
  const isHindi = activePath.startsWith("/hi");
  const langSwitchHref = isHindi ? "/" : "/hi/";
  const langSwitchLabel = isHindi ? "English" : "हिन्दी";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`site-header ${isScrolled ? "is-scrolled" : ""}`.trim()}
      id="site-header"
    >
      <div className="container header-inner">
        <BrandLogo href={isHindi ? "/hi/" : "/"} />

        {/* Desktop Primary Navigation with Luxury Dropdowns */}
        <nav className="nav-desktop" aria-label="Primary">
          {/* Services Dropdown */}
          <div className="nav-item has-dropdown">
            <RollLink
              href="/en/services/"
              dataNav="services"
              hasDropdown
              isActive={activePath.startsWith("/en/services")}
            >
              Services
            </RollLink>
            <div className="nav-dropdown" role="menu">
              <div className="nav-dropdown-inner">
                <a
                  href="/en/services/#outstation"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Outstation Cabs</span>
                  <span className="nav-dropdown-item-meta">Delhi, Jaipur</span>
                </a>
                <a
                  href="/en/services/#local"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Local Agra Sightseeing</span>
                  <span className="nav-dropdown-item-meta">Taj Mahal, Fort</span>
                </a>
                <a
                  href="/en/services/#airport"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Airport Transfers</span>
                  <span className="nav-dropdown-item-meta">IGI Delhi & Agra</span>
                </a>
                <a
                  href="/en/services/#corporate"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Tempo & Group Travel</span>
                  <span className="nav-dropdown-item-meta">12–26 Seater</span>
                </a>
                <div className="nav-dropdown-divider" />
                <a href="/en/services/" className="nav-dropdown-view-all">
                  View All Services →
                </a>
              </div>
            </div>
          </div>

          {/* Routes Dropdown */}
          <div className="nav-item has-dropdown">
            <RollLink
              href="/en/routes/"
              dataNav="routes"
              hasDropdown
              isActive={activePath.startsWith("/en/routes")}
            >
              Routes
            </RollLink>
            <div className="nav-dropdown" role="menu">
              <div className="nav-dropdown-inner">
                <a
                  href="/en/agra-to-delhi-taxi/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Agra → Delhi</span>
                  <span className="nav-dropdown-item-meta">₹3,499</span>
                </a>
                <a
                  href="/en/delhi-to-agra-taxi/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Delhi → Agra</span>
                  <span className="nav-dropdown-item-meta">₹3,499</span>
                </a>
                <a
                  href="/en/agra-to-jaipur-taxi/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Agra → Jaipur</span>
                  <span className="nav-dropdown-item-meta">₹3,499</span>
                </a>
                <a
                  href="/en/agra-to-mathura-taxi/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Agra → Mathura</span>
                  <span className="nav-dropdown-item-meta">₹2,200</span>
                </a>
                <a
                  href="/en/agra-to-gwalior-taxi/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Agra → Gwalior</span>
                  <span className="nav-dropdown-item-meta">₹3,000</span>
                </a>
                <div className="nav-dropdown-divider" />
                <a href="/en/routes/" className="nav-dropdown-view-all">
                  View All 8 Routes →
                </a>
              </div>
            </div>
          </div>

          {/* Packages Dropdown */}
          <div className="nav-item has-dropdown">
            <RollLink
              href="/en/packages/"
              dataNav="packages"
              hasDropdown
              isActive={activePath.startsWith("/en/packages")}
            >
              Packages
            </RollLink>
            <div className="nav-dropdown" role="menu">
              <div className="nav-dropdown-inner">
                <a
                  href="/en/packages/agra-sightseeing/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Same Day Agra Taj Mahal Tour</span>
                  <span className="nav-dropdown-item-meta">₹3,499</span>
                </a>
                <a
                  href="/en/packages/taj-mahal-sunrise-tour/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Taj Mahal Sunrise Tour</span>
                  <span className="nav-dropdown-item-meta">₹12,999</span>
                </a>
                <a
                  href="/en/packages/mathura-vrindavan/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Mathura & Vrindavan Darshan</span>
                  <span className="nav-dropdown-item-meta">₹4,200</span>
                </a>
                <a
                  href="/en/packages/gatimaan-express-agra-tour/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Same Day Agra by Gatimaan Train</span>
                  <span className="nav-dropdown-item-meta">₹14,999</span>
                </a>
                <a
                  href="/en/packages/agra-unhurried/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Agra Overnight Experience</span>
                  <span className="nav-dropdown-item-meta">₹7,800</span>
                </a>
                <a
                  href="/en/packages/golden-triangle/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Golden Triangle Tour</span>
                  <span className="nav-dropdown-item-meta">₹18,500</span>
                </a>
                <div className="nav-dropdown-divider" />
                <a href="/en/packages/" className="nav-dropdown-view-all">
                  View All Packages →
                </a>
              </div>
            </div>
          </div>

          {/* Fleet Dropdown */}
          <div className="nav-item has-dropdown">
            <RollLink
              href="/en/fleet/"
              dataNav="fleet"
              hasDropdown
              isActive={activePath.startsWith("/en/fleet") || activePath.includes("/vehicles/")}
            >
              Fleet
            </RollLink>
            <div className="nav-dropdown" role="menu">
              <div className="nav-dropdown-inner">
                <a
                  href="/en/vehicles/sedan/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Sedan (Dzire class)</span>
                  <span className="nav-dropdown-item-meta">₹10/km</span>
                </a>
                <a
                  href="/en/vehicles/ertiga/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Ertiga (6+1 MPV)</span>
                  <span className="nav-dropdown-item-meta">₹14/km</span>
                </a>
                <a
                  href="/en/vehicles/innova-crysta/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Innova Crysta (6+1 SUV)</span>
                  <span className="nav-dropdown-item-meta">₹18/km</span>
                </a>
                <a
                  href="/en/vehicles/tempo-traveller/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Tempo Traveller (12–17 seater)</span>
                  <span className="nav-dropdown-item-meta">₹25/km</span>
                </a>
                <a
                  href="/en/vehicles/urbania/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Urbania (Premium van)</span>
                  <span className="nav-dropdown-item-meta">₹34/km</span>
                </a>
                <div className="nav-dropdown-divider" />
                <a href="/en/fleet/" className="nav-dropdown-view-all">
                  View Full Fleet →
                </a>
              </div>
            </div>
          </div>

          {/* Contact Dropdown */}
          <div className="nav-item has-dropdown">
            <RollLink
              href="/en/contact/"
              dataNav="contact"
              hasDropdown
              isActive={activePath.startsWith("/en/contact")}
            >
              Contact
            </RollLink>
            <div className="nav-dropdown" role="menu">
              <div className="nav-dropdown-inner">
                <a
                  href={`tel:${contact.phone}`}
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>24×7 Call Dispatch</span>
                  <span className="nav-dropdown-item-meta">{contact.phoneDisplay}</span>
                </a>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>WhatsApp Dispatch</span>
                  <span className="nav-dropdown-item-meta">Instant</span>
                </a>
                <a
                  href="/en/contact/"
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  <span>Taj Ganj Office</span>
                  <span className="nav-dropdown-item-meta">Agra</span>
                </a>
                <a href="/en/faq/" className="nav-dropdown-item" role="menuitem">
                  <span>Frequently Asked Questions</span>
                  <span className="nav-dropdown-item-meta">FAQ</span>
                </a>
                <a href="/en/about/" className="nav-dropdown-item" role="menuitem">
                  <span>About SK Baghel Travels</span>
                  <span className="nav-dropdown-item-meta">About</span>
                </a>
                <div className="nav-dropdown-divider" />
                <a href="/en/contact/" className="nav-dropdown-view-all">
                  Contact & Support Hub →
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <a
            className="lang-switch"
            href={langSwitchHref}
            hrefLang={isHindi ? "en-IN" : "hi-IN"}
            aria-label={`Switch language to ${langSwitchLabel}`}
          >
            {langSwitchLabel}
          </a>

          <a
            className="btn-outline btn-sm btn-outline--light"
            href={`tel:${contact.phone}`}
            aria-label={`Call us at ${contact.phoneDisplay}`}
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
            <span>Call</span>
          </a>

          <a
            className="btn-outline btn-sm btn-outline--light"
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Contact us on WhatsApp"
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
            <span>WhatsApp</span>
          </a>

          <a
            className="btn-primary btn-sm"
            href="/book.html"
            onMouseEnter={() => prefetchDocument("/book.html")}
          >
            Book now <span aria-hidden="true">↗</span>
          </a>

          {/* Cinematic Theme Switcher */}
          <ThemeToggle />

          {/* Mobile Hamburger Toggle */}
          <button
            className="nav-toggle"
            id="nav-toggle"
            type="button"
            aria-expanded={isMobileNavOpen}
            aria-controls="nav-sheet"
            aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
            onClick={onToggleMobileNav}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
