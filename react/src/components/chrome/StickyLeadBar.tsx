import { useState, useEffect } from "react";
import { contact } from "../../data/contact";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

export interface StickyLeadBarProps {
  currentPath?: string;
}

export function StickyLeadBar({ currentPath }: StickyLeadBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const path =
    currentPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const isBookingPage = path.includes("book");

  // Auto-hide when near the bottom of page to prevent collision with footer
  useEffect(() => {
    if (isBookingPage) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const nearBottom = scrollHeight - (scrollTop + clientHeight) < 140;

      setIsVisible(!nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBookingPage]);

  // Don't show on the booking page itself
  if (isBookingPage || !isVisible) return null;

  return (
    <aside
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)] border-t border-border-warm px-margin-mobile py-2 flex items-center justify-between gap-space-xs"
      aria-label="Quick contact and booking bar"
      data-nosnippet
    >
      <a
        className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 rounded-lg bg-surface-container text-on-surface font-label-caps text-label-md font-semibold hover:bg-surface-container-high transition-colors"
        href={`tel:${contact.phone}`}
        aria-label={`Call ${contact.phoneDisplay}`}
      >
        <span className="material-symbols-outlined text-primary text-icon-18">call</span>
        <span className="mt-0.5">Call Desk</span>
      </a>

      <a
        className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 rounded-lg bg-black text-white font-label-caps text-label-md font-semibold hover:bg-neutral-900 transition-colors shadow-xs border border-white/10"
        style={{ color: "#ffffff" }}
        href={`https://wa.me/${contact.whatsapp}?text=Hello%20SK%20Baghel%20Travels`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Support on WhatsApp"
      >
        <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
        <span className="mt-0.5 text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
      </a>

      <a
        className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 rounded-lg bg-primary text-white font-label-caps text-label-md font-semibold hover:bg-primary-container transition-colors shadow-xs"
        href="/book.html"
        aria-label="Book Cab or Tour Online"
      >
        <span className="material-symbols-outlined text-white text-icon-18">calendar_month</span>
        <span className="mt-0.5 text-white">Book Now</span>
      </a>
    </aside>
  );
}

export default StickyLeadBar;
