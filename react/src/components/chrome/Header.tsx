import { useState, useEffect, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";
import { MobileNavSheet } from "./MobileNavSheet";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

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

  const isHomePage =
    activePath === "/" || activePath === "/en/" || activePath === "/index.html";

  const [heroScrolledPast, setHeroScrolledPast] = useState(() => {
    if (!isHomePage) return true;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("skb_hero_shown") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const heroAlreadyShown =
        typeof window !== "undefined" &&
        sessionStorage.getItem("skb_hero_shown") === "true";

      if (isHomePage && !heroAlreadyShown) {
        // Show navigation bar only when the whole hero image has been scrolled past
        setHeroScrolledPast(window.scrollY >= 1050);
      } else {
        setHeroScrolledPast(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

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
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ease-out transform ${
          heroScrolledPast
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none"
        } ${
          isScrolled
            ? "bg-surface/95 backdrop-blur-xl shadow-[0_1px_12px_rgba(159,60,22,0.08)] border-b border-border-warm/60"
            : "bg-surface/90 backdrop-blur-md border-b border-border-warm/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
        }`}
        id="site-header"
      >
        <div className="h-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Logo & Brand Mark */}
          <div className="flex items-center gap-2 shrink-0">
            <BrandLogo href="/" />
          </div>

          {/* Desktop Primary Navigation */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => prefetchDocument(link.href)}
                  aria-current={active ? "page" : undefined}
                  className={`px-2.5 py-1 text-xs font-semibold transition-colors rounded-md ${
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-sandstone-wash"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Actions: Phone, WhatsApp Concierge, and Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Phone Call CTA */}
            <a
              href={`tel:${contact.phone}`}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sandstone-wash hover:bg-surface-container-high transition-colors text-xs text-primary font-bold border border-primary/20"
              aria-label={`Call ${contact.phoneDisplay}`}
            >
              <span className="material-symbols-outlined text-primary text-[15px]">call</span>
              <span>{contact.phoneDisplay}</span>
            </a>

            {/* WhatsApp Concierge - Light, vibrant luxury terracotta with crisp white text */}
            <a
              href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels,%20I%20would%20like%20to%20inquire%20about%20a%20booking.`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <WhatsAppIcon className="w-[15px] h-[15px] text-white shrink-0" />
              <span className="text-white font-medium">WhatsApp Concierge</span>
            </a>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileNavOpen}
              className="xl:hidden p-1.5 rounded-md text-on-surface hover:bg-sandstone-wash transition-colors flex items-center justify-center border border-border-warm/50"
            >
              <span className="material-symbols-outlined text-[20px]">
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
