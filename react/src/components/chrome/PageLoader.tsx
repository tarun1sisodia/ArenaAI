import { useState, useEffect } from "react";

export interface PageLoaderProps {
  /** Minimum time in milliseconds the loader overlay remains visible (default: 600ms) */
  minDisplayMs?: number;
  /** Primary brand wordmark text displayed (default: "SK BAGHEL") */
  text?: string;
  /** Subtitle / location tagline displayed beneath brand wordmark (default: "TOUR & TRAVELS • AGRA") */
  tagline?: string;
  /** Whether to show the luxury metadata tagline and progress shimmer (default: true) */
  showTagline?: boolean;
  /** Optional callback invoked after the loader has completely faded out and unmounted */
  onDismiss?: () => void;
}

export function PageLoader({
  minDisplayMs = 600,
  text = "SK BAGHEL",
  tagline = "TOUR & TRAVELS \u2022 AGRA",
  showTagline = true,
  onDismiss,
}: PageLoaderProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if inline timestamp was recorded in HTML head, or use current time
    const startedAt =
      (window as unknown as { __skbLoaderStarted?: number }).__skbLoaderStarted ||
      Date.now();

    let dismissTimer: number | undefined;
    let unmountTimer: number | undefined;
    let fallbackTimer: number | undefined;

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const executeDismiss = () => {
      setIsDismissed(true);

      // Fade transition is 400ms; wait 450ms before unmounting to clean up DOM completely
      const cleanupDelay = isReducedMotion ? 0 : 450;
      unmountTimer = window.setTimeout(() => {
        setIsMounted(false);
        onDismiss?.();
      }, cleanupDelay);
    };

    const scheduleDismiss = () => {
      // Clear fallback once scheduled
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      dismissTimer = window.setTimeout(executeDismiss, remaining);
    };

    if (document.readyState === "complete") {
      scheduleDismiss();
    } else {
      window.addEventListener("load", scheduleDismiss, { once: true });
      // Safety guard: dismiss after 4000ms even if heavy network assets delay the load event
      fallbackTimer = window.setTimeout(scheduleDismiss, 4000);
    }

    return () => {
      if (dismissTimer !== undefined) window.clearTimeout(dismissTimer);
      if (unmountTimer !== undefined) window.clearTimeout(unmountTimer);
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      window.removeEventListener("load", scheduleDismiss);
    };
  }, [minDisplayMs, onDismiss]);

  if (!isMounted) return null;

  return (
    <div
      className={`page-loader ${isDismissed ? "is-hidden" : ""}`}
      data-page-loader
      data-dismissed={isDismissed ? "true" : undefined}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="page-loader__content">
        <div className="page-loader__brand">
          <span className="page-loader__text" aria-hidden="true">
            {text}
          </span>
        </div>

        {showTagline && (
          <div className="page-loader__meta" aria-hidden="true">
            <span className="page-loader__tagline">{tagline}</span>
            <div className="page-loader__bar">
              <div className="page-loader__bar-fill" />
            </div>
          </div>
        )}

        <span className="sr-only">Loading SK Baghel Tour &amp; Travels...</span>
      </div>
    </div>
  );
}

export default PageLoader;
