import { contact } from "../data/contact";
import { prefetchDocument } from "../app/prefetch";

export { Header } from "./chrome/Header";
export { BrandLogo } from "./chrome/BrandLogo";
export { RollLink } from "./chrome/RollLink";
export { ThemeToggle } from "./chrome/ThemeToggle";

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
