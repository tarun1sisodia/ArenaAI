import { useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
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

  const links = [
    { label: "Home", href: "/", icon: "home" },
    { label: "Services", href: "/en/services/", icon: "room_service" },
    { label: "Outstation Routes", href: "/en/routes/", icon: "alt_route" },
    { label: "Tour Packages", href: "/en/packages/", icon: "explore" },
    { label: "Fleet Showroom", href: "/en/fleet/", icon: "directions_car" },
    { label: "Contact & Support", href: "/en/contact/", icon: "support_agent" },
    { label: "FAQs", href: "/en/faq/", icon: "help" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-midnight/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-surface-container-lowest h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-border-warm animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-space-md border-b border-border-warm bg-sandstone-wash/40">
            <BrandLogo href="/" onClick={onClose} />
            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={onClose}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-space-md flex flex-col gap-1" aria-label="Mobile Primary">
            {links.map((link) => {
              const active = currentPath === link.href || (link.href !== "/" && currentPath.startsWith(link.href.replace(/\/$/, "")));
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  onMouseEnter={() => prefetchDocument(link.href)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-space-sm px-3.5 py-3 rounded-lg text-title-md transition-colors ${
                    active
                      ? "bg-primary-container text-on-primary-container font-semibold"
                      : "text-on-surface hover:bg-sandstone-wash"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${active ? "text-on-primary-container" : "text-terracotta-sandstone"}`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-space-md border-t border-border-warm bg-sandstone-wash/30 flex flex-col gap-space-sm">
          {/* Direct Call & WhatsApp Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">call</span>
              <span>Call Desk</span>
            </a>
            <a
              href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-ink-charcoal text-ivory-surface font-label-lg text-label-lg hover:bg-ink-slate transition-colors"
            >
              <span className="material-symbols-outlined text-gold-accent text-[18px]">chat</span>
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="text-center text-body-sm text-secondary text-[12px] pt-1">
            24×7 Taj Ganj Agra Dispatch • Transparent Fares
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileNavSheet;
