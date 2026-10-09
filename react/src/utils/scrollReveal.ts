/**
 * Lightweight, zero-dependency Scroll Reveal Observer (LOCK-N08)
 *
 * Compliant with ANIMATION_RULES.md:
 * 1. SSG & SEO safe: Raw pre-rendered HTML contains visible elements.
 * 2. GPU-only: animates transform and opacity.
 * 3. Viewport-bounded: unobserves elements immediately upon entering viewport.
 * 4. Respects prefers-reduced-motion: reduce without delay.
 */

import { useEffect } from "react";

export function initScrollReveal(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = document.querySelectorAll<HTMLElement>(".reveal");

  if (isReducedMotion) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return () => {};
  }

  // Arm the animations only after client runtime confirms JS is active
  document.documentElement.classList.add("js-ready");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.08,
    }
  );

  elements.forEach((el) => {
    if (!el.classList.contains("is-visible")) {
      observer.observe(el);
    }
  });

  return () => {
    observer.disconnect();
  };
}

/**
 * React hook to activate scroll reveal on page mount and route transitions.
 */
export function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    const cleanup = initScrollReveal();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
