import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";

export interface StickyLeadBarProps {
  currentPath?: string;
}

export function StickyLeadBar({ currentPath }: StickyLeadBarProps) {
  const isBookingPage = currentPath?.includes("book");

  // Don't show on the actual booking page itself to avoid form overlap
  if (isBookingPage) return null;

  return (
    <aside className="lead-bar" aria-label="Quick contact and booking bar">
      <a
        className="lead-bar-btn lead-call"
        href={`tel:${contact.phone}`}
        aria-label={`Call ${contact.phoneDisplay}`}
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
        className="lead-bar-btn lead-wa"
        href={`https://wa.me/${contact.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp Dispatch"
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
        className="lead-bar-btn lead-book"
        href="/book.html"
        onMouseEnter={() => prefetchDocument("/book.html")}
        aria-label="Instant cab booking"
      >
        <span>Book</span>
        <span aria-hidden="true">↗</span>
      </a>
    </aside>
  );
}

export default StickyLeadBar;
