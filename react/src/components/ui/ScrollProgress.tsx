/**
 * ScrollProgress — reading-progress indicator
 * --------------------------------------------------------------------------
 * Deliberately dependency-free (rAF + `transform: scaleX`) so the motion
 * runtime never enters the critical main bundle for this single indicator.
 * GPU-only, passive listener, disabled under `prefers-reduced-motion`.
 */

import { useEffect, useRef } from "react";

export function ScrollProgress({ className = "scroll-progress" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.display = "none";
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      node.style.transform = `scaleX(${progress})`;
      node.style.opacity = progress > 0.01 ? "1" : "0";
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" />;
}

export default ScrollProgress;
