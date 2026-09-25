import { useState, useEffect, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";
import { MobileNavSheet } from "./MobileNavSheet";
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
  isMobileNavOpen: controlledMobileNav,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [internalMobileNav, setInternalMobileNav] = useState(false);

  const isMobileNavOpen = controlledMobileNav !== undefined ? controlledMobileNav : internalMobileNav;

  const activePath =
    currentPath || (typeof window !== "undefined" ? window.location.pathname : "/");

  const toggleMobileNav = useCallback(() => {
    if (onToggleMobileNav) {
      onToggleMobileNav();
    } else {
      setInternalMobileNav((prev) => !prev);
    }
  }, [onToggleMobileNav]);

  const closeMobileNav = useCallback(() => {
    if (onToggleMobileNav) {
      onToggleMobileNav();
    } else {
      setInternalMobileNav(false);
    }
  }, [onToggleMobileNav]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/en/services/" },
    { label: "Routes", href: "/en/routes/" },
    { label: "Packages", href: "/en/packages/" },
    { label: "Fleet", href: "/en/fleet/" },
    { label: "Contact", href: "/en/contact/" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return activePath === "/" || activePath === "/en/" || activePath === "/index.html";
    }
    const cleanHref = href.replace(/\/$/, "");
    const cleanPath = activePath.replace(/\/$/, "");
    return cleanPath.startsWith(cleanHref);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-surface/95 backdrop-blur-xl shadow-[0_1px_12px_rgba(159,60,22,0.08)] border-b border-border-warm/60"
            : "bg-surface/90 backdrop-blur-md border-b border-border-warm/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
        }`}
        id="site-header"
      >
        <div className="h-20 max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between gap-space-md">
          {/* Logo & Brand Mark */}
          <div className="flex items-center gap-space-md shrink-0">
            <BrandLogo href="/" />
          </div>

          {/* Desktop Primary Navigation */}
          <nav className="hidden xl:flex items-center gap-space-xs" aria-label="Primary">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => prefetchDocument(link.href)}
                  aria-current={active ? "page" : undefined}
                  className={`px-3.5 py-2 text-label-lg font-label-lg transition-colors rounded-lg ${
                    active
                      ? "bg-primary-container text-on-primary-container font-semibold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-sandstone-wash"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Actions: Phone, WhatsApp Concierge, and Mobile Menu */}
          <div className="flex items-center gap-space-sm shrink-0">
            {/* Phone Call CTA */}
            <a
              href={`tel:${contact.phone}`}
              className="hidden lg:inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-label-lg text-label-lg text-on-surface"
              aria-label={`Call ${contact.phoneDisplay}`}
            >
              <span className="material-symbols-outlined text-primary text-[18px]">call</span>
              <span className="font-semibold">{contact.phoneDisplay}</span>
            </a>

            {/* WhatsApp Concierge */}
            <a
              href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels,%20I%20would%20like%20to%20inquire%20about%20a%20booking.`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-space-xs bg-ink-charcoal text-ivory-surface px-4 py-2.5 rounded-lg font-label-lg text-label-lg hover:bg-ink-slate hover:text-on-primary transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-gold-accent">chat</span>
              <span>WhatsApp Concierge</span>
            </a>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileNavOpen}
              className="xl:hidden p-2 rounded-lg text-on-surface hover:bg-sandstone-wash transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isMobileNavOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavSheet
        isOpen={isMobileNavOpen}
        onClose={closeMobileNav}
        currentPath={activePath}
      />
    </>
  );
}

export default Header;
