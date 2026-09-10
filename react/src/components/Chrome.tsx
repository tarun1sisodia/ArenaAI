export { Header } from "./chrome/Header";
export { BrandLogo } from "./chrome/BrandLogo";
export { RollLink } from "./chrome/RollLink";
export { ThemeToggle } from "./chrome/ThemeToggle";
export { MobileNavSheet } from "./chrome/MobileNavSheet";
export { StickyLeadBar, StickyLeadBar as LeadBar } from "./chrome/StickyLeadBar";
export { RadialDock } from "./chrome/RadialDock";

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
