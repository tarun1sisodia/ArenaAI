"use client";
import { useState, useEffect } from "react";

export interface InitialLoaderProps {
  /**
   * Duration in milliseconds to count from 0 to 100
   * @default 2200
   */
  durationMs?: number;
  /**
   * Force show even if already shown in the session (useful for preview)
   * @default false
   */
  forceShow?: boolean;
}

export function InitialLoader({
  durationMs = 2200,
  forceShow = false,
}: InitialLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    const hasLoaded = sessionStorage.getItem("skb_initial_loaded");
    if (hasLoaded && !forceShow) {
      return;
    }

    setIsVisible(true);
    // Lock body scroll while initial loading counter runs
    document.body.style.overflow = "hidden";

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));

      setProgress(rawProgress);

      if (elapsed < durationMs) {
        requestAnimationFrame(updateCounter);
      } else {
        setProgress(100);
        sessionStorage.setItem("skb_initial_loaded", "true");

        // Short pause at 100 before fading out smoothly
        setTimeout(() => {
          setIsFadingOut(true);
          document.body.style.overflow = "";

          // Remove completely from DOM after fade animation completes
          setTimeout(() => {
            setIsVisible(false);
          }, 800);
        }, 250);
      }
    };

    const frameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(frameId);
      document.body.style.overflow = "";
    };
  }, [durationMs, forceShow]);

  if (!isVisible) return null;

  return (
    <div
      aria-label="Website Loading"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] bg-white text-black flex flex-col items-center justify-center select-none transition-opacity duration-700 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center text-center px-6 max-w-md w-full">
        {/* Brand Monogram / Heritage Tag */}
        <div className="mb-8 flex flex-col items-center gap-1.5">
          <span className="font-label-caps text-[11px] sm:text-[12px] tracking-[0.35em] text-black/60 uppercase font-semibold">
            SK BAGHEL TOUR &amp; TRAVELS
          </span>
          <span className="font-label-caps text-[9px] tracking-[0.25em] text-black/40 uppercase">
            AGRA · ESTD. 2011
          </span>
        </div>

        {/* PROMINENT CAPITAL "LOADING" INDICATOR */}
        <div className="mb-4">
          <h1 className="font-headline-hero text-2xl sm:text-3xl text-black uppercase tracking-[0.25em] font-normal">
            LOADING
          </h1>
        </div>

        {/* 0 TO 100 NUMERICAL PROGRESS COUNTER */}
        <div className="flex items-baseline justify-center mb-6">
          <span className="font-price-display text-6xl sm:text-8xl text-black font-normal tracking-tight tabular-nums">
            {progress}
          </span>
          <span className="font-title-md text-xl sm:text-2xl text-black/50 ml-1.5 font-light">
            %
          </span>
        </div>

        {/* Sleek Minimalist Progress Bar */}
        <div className="w-56 sm:w-72 h-[2px] bg-black/10 rounded-full overflow-hidden mb-8 relative">
          <div
            className="h-full bg-black transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Footer Subtext */}
        <p className="font-label-caps text-[10px] tracking-[0.2em] text-black/50 uppercase">
          PREPARING FIRST-CLASS EXPEDITION
        </p>
      </div>
    </div>
  );
}

export default InitialLoader;
