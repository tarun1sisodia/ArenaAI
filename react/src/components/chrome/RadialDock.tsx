import { useState, useEffect, useRef, useCallback } from "react";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";

export interface RadialDockProps {
  currentPath?: string;
  className?: string;
}

export function RadialDock({ currentPath, className = "" }: RadialDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const path =
    currentPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const isHindi = path.startsWith("/hi");
  const packagesHref = isHindi ? "/hi/packages/" : "/en/packages/";
  const bookHref = "/book.html";

  // Toggle open/closed state on click
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dockRef.current &&
        !dockRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      ref={dockRef}
      className={`about radial-dock ${isOpen ? "is-open" : ""} ${className}`.trim()}
      role="region"
      aria-label={isHindi ? "त्वरित संपर्क एवं नेविगेशन" : "Quick Actions"}
    >
      {/* 1. Phone Call Action */}
      <a
        className="bg_links social portfolio"
        href={`tel:${contact.phone}`}
        aria-label={isHindi ? `कॉल करें ${contact.phoneDisplay}` : `Call ${contact.phoneDisplay}`}
        title={isHindi ? `कॉल करें: ${contact.phoneDisplay}` : `Call ${contact.phoneDisplay}`}
        tabIndex={isOpen ? 0 : -1}
      >
        <span className="icon">
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
        </span>
      </a>

      {/* 2. WhatsApp Direct Action */}
      <a
        className="bg_links social dribbble"
        href={`https://wa.me/${contact.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label={isHindi ? "व्हाट्सएप संपर्क" : `WhatsApp ${contact.phoneDisplay}`}
        title="WhatsApp"
        tabIndex={isOpen ? 0 : -1}
      >
        <span className="icon">
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
        </span>
      </a>

      {/* 3. Explore Tour Packages Action */}
      <a
        className="bg_links social linkedin"
        href={packagesHref}
        onMouseEnter={() => prefetchDocument(packagesHref)}
        aria-label={isHindi ? "टूर पैकेज देखें" : "Explore Tours"}
        title={isHindi ? "टूर पैकेज देखें" : "Explore Tours"}
        tabIndex={isOpen ? 0 : -1}
      >
        <span className="icon">
          <span className="icon icon-compass" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </span>
        </span>
      </a>

      {/* 4. Instant Booking Action */}
      <a
        className="bg_links social booking"
        href={bookHref}
        onMouseEnter={() => prefetchDocument(bookHref)}
        aria-label={isHindi ? "तत्काल टैक्सी बुकिंग" : "Instant Taxi Booking"}
        title={isHindi ? "तत्काल टैक्सी बुकिंग" : "Instant Taxi Booking"}
        tabIndex={isOpen ? 0 : -1}
      >
        <span className="icon">
          <span className="icon icon-car" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </span>
        </span>
      </a>

      {/* Center Trigger Button */}
      <button
        type="button"
        className="bg_links logo"
        onClick={toggleOpen}
        aria-label={
          isOpen
            ? isHindi
              ? "त्वरित मेनू बंद करें"
              : "Close quick actions menu"
            : isHindi
            ? "त्वरित मेनू खोलें"
            : "Quick Actions"
        }
        aria-expanded={isOpen}
        title={isHindi ? "त्वरित मेनू" : "Quick Navigation"}
      >
        <span className="icon">
          <span className="icon icon-action" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
        </span>
      </button>
    </div>
  );
}
