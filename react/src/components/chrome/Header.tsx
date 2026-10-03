import { useState, useEffect, useCallback } from "react";
import { BrandLogo } from "./BrandLogo";
import { MobileNavSheet } from "./MobileNavSheet";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { getCustomerDisplayName, useCustomerAuth } from "../../auth/customerAuth";

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
  const [accountError, setAccountError] = useState<string | null>(null);
  const { user, loading: authLoading, configured, signInWithGoogle } = useCustomerAuth();

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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/en/about/" },
    { label: "Services", href: "/en/services/" },
    { label: "Taxi Rental", href: "/en/taxis/rent/" },
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
        className={`fixed top-0 left-0 right-0 w-full z-50 ${isScrolled
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
                  className={`px-2.5 py-1 text-xs font-semibold transition-colors rounded-md ${active
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-sandstone-wash"
                    }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Actions: Phone, WhatsApp, and Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {!authLoading && (user ? (
              <a href="/my-bookings/" title={user.email ?? "My account"} className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-sandstone-wash px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-icon-16" aria-hidden="true">account_circle</span>
                <span className="max-w-24 truncate">{getCustomerDisplayName(user)}</span>
              </a>
            ) : configured ? (
              <button type="button" onClick={() => void signInWithGoogle().catch((error) => setAccountError(error instanceof Error ? error.message : "Sign-in could not start."))} className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-primary/25 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-sandstone-wash">
                <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-primary">G</span> Sign in
              </button>
            ) : null)}
            {/* Phone Call CTA */}
            <a
              href={`tel:${contact.phone}`}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sandstone-wash hover:bg-surface-container-high transition-colors text-xs text-primary font-bold border border-primary/20"
              aria-label={`Call ${contact.phoneDisplay}`}
            >
              <span className="material-symbols-outlined text-primary text-icon-15">call</span>
              <span>{contact.phoneDisplay}</span>
            </a>

            {/* WhatsApp - Luxury black button with real WhatsApp icon */}
            <a
              href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels,%20I%20would%20like%20to%20inquire%20about%20a%20booking.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ffffff" }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-black hover:bg-neutral-900 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-all active:scale-[0.98] border border-white/15"
            >
              <WhatsAppIcon className="w-[15px] h-[15px] shrink-0 text-white" />
              <span className="text-white font-medium" style={{ color: "#ffffff" }}>WhatsApp</span>
            </a>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileNavOpen}
              className="xl:hidden p-1.5 rounded-md text-on-surface hover:bg-sandstone-wash transition-colors flex items-center justify-center border border-border-warm/50"
            >
              <span className="material-symbols-outlined text-icon-20">
                {isMobileNavOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
          {accountError && <p role="status" className="absolute right-4 top-12 z-50 max-w-xs rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{accountError}</p>}
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
