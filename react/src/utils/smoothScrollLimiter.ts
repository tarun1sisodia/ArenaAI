/**
 * Smooth Scroll Speed Limiter
 * 
 * Prevents aggressive wheel/trackpad swipes from flinging through the entire page
 * in a single motion. Clamps delta per wheel event to a controlled maximum step
 * and applies a buttery smooth interpolation curve (lerp) via requestAnimationFrame.
 */

export function initSmoothScrollLimiter(): () => void {
  if (typeof window === "undefined") return () => {};

  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return () => {};
  }

  // Maximum delta pixels per single wheel event
  const MAX_STEP_DELTA = 90;
  // Maximum cumulative queue velocity to prevent queuing endless scroll from huge swipes
  const MAX_ACCUMULATED_DELTA = 250;
  // Smooth lerp easing factor (0.14 gives a luxurious, silky smooth glide)
  const EASING = 0.14;

  let currentY = window.scrollY;
  let targetY = window.scrollY;
  let animId: number | null = null;
  let isAnimating = false;

  const onWheel = (e: WheelEvent) => {
    // Ignore if Ctrl is held (user zooming in/out) or Shift held (horizontal scroll)
    if (e.ctrlKey || e.shiftKey) return;

    // Check if target or any ancestor is a scrollable element (e.g. textarea, select, modal dialog)
    let node = e.target as HTMLElement | null;
    let isInsideScrollableChild = false;
    while (node && node !== document.body && node !== document.documentElement) {
      const overflowY = window.getComputedStyle(node).overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        node.scrollHeight > node.clientHeight
      ) {
        const canScrollUp = e.deltaY < 0 && node.scrollTop > 0;
        const canScrollDown = e.deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight;
        if (canScrollUp || canScrollDown) {
          isInsideScrollableChild = true;
          break;
        }
      }
      node = node.parentElement;
    }

    if (isInsideScrollableChild) {
      return; // Allow native nested scroll
    }

    // Prevent default aggressive jump
    e.preventDefault();

    // Clamp the raw deltaY of the wheel event
    const rawDelta = e.deltaY;
    const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), MAX_STEP_DELTA);

    // Sync with actual scrollY if user dragged scrollbar or pressed keys
    if (!isAnimating) {
      currentY = window.scrollY;
      targetY = window.scrollY;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    // Add clamped delta to target, but restrict accumulated distance from current position
    let newTarget = targetY + clampedDelta;
    if (newTarget > currentY + MAX_ACCUMULATED_DELTA) {
      newTarget = currentY + MAX_ACCUMULATED_DELTA;
    } else if (newTarget < currentY - MAX_ACCUMULATED_DELTA) {
      newTarget = currentY - MAX_ACCUMULATED_DELTA;
    }

    targetY = Math.max(0, Math.min(maxScroll, newTarget));

    if (!isAnimating) {
      isAnimating = true;
      animId = requestAnimationFrame(tick);
    }
  };

  const tick = () => {
    const diff = targetY - currentY;
    if (Math.abs(diff) < 0.5) {
      currentY = targetY;
      window.scrollTo(0, currentY);
      isAnimating = false;
      animId = null;
      return;
    }

    currentY += diff * EASING;
    window.scrollTo(0, currentY);
    animId = requestAnimationFrame(tick);
  };

  // Sync position on window resize or user scrollbar interaction
  const onScroll = () => {
    if (!isAnimating) {
      currentY = window.scrollY;
      targetY = window.scrollY;
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    if (animId !== null) {
      cancelAnimationFrame(animId);
    }
  };
}
