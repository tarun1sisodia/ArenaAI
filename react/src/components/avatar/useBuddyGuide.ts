import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Buddy's brain: global gaze tracking + field spotlighting.
 *
 * - lookAtRef: viewport-pixel point Buddy's pupils track (pointer, clicks,
 *   or the spotlighted field). Read every frame by BuddyAvatar's rAF loop —
 *   no re-renders on pointermove.
 * - spotlight: when the user focuses / taps an interactive element, Buddy
 *   glides next to it (transform offset from his home corner) and the bubble
 *   shows a contextual tip.
 *
 * Purely additive: it never mutates page markup, only observes it.
 */

export interface Spotlight {
  dx: number;
  dy: number;
  tip: string;
}

export interface LookPoint {
  x: number;
  y: number;
}

const HOME_TIP_POOL = [
  "Namaste! I'm Baghel Buddy — your travel sidekick. Tap me for a wave!",
  "Taj Mahal at sunrise: fewer crowds, softer light, better photos.",
  "A 28% advance locks your cab — the rest is paid after drop-off.",
  "Varanasi's evening Ganga aarti begins at sunset. Reach early!",
  "Carry a light shawl — desert nights around Jaisalmer turn chilly.",
];

function elementText(el: Element): string {
  const parts: string[] = [];
  const h = el as HTMLElement;
  if (h.id) parts.push(h.id);
  const name = el.getAttribute("name");
  if (name) parts.push(name);
  const ph = el.getAttribute("placeholder");
  if (ph) parts.push(ph);
  const aria = el.getAttribute("aria-label");
  if (aria) parts.push(aria);
  const val = el.getAttribute("value");
  if (val && val.length < 40) parts.push(val);
  const label = h.closest("label");
  if (label?.textContent) parts.push(label.textContent);
  const group = h.closest('[role="radiogroup"], fieldset, [data-trip-type]');
  if (group?.textContent) parts.push(group.textContent);
  // Nearby visible caption (previous sibling heading-ish text).
  const prev = h.previousElementSibling;
  if (prev?.textContent && prev.textContent.length < 60) parts.push(prev.textContent);
  // The element's own visible text (matters for buttons/tabs/links; inputs have none).
  const tag = el.tagName.toLowerCase();
  if (tag !== "input" && tag !== "select" && tag !== "textarea") {
    const own = (h.textContent || "").trim().replace(/\s+/g, " ");
    if (own.length > 0 && own.length < 80) parts.push(own);
  }
  return parts.join(" ").toLowerCase();
}

/** Normalized text: lowercase alphanumeric only, so "Round Trip", "round-trip" and "roundtrip" all match. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tipFor(el: Element): string {
  const h = el as HTMLElement;
  const tag = el.tagName.toLowerCase();
  // The control's own label wins over surrounding text (e.g. sibling tabs).
  let own = "";
  if (tag !== "input" && tag !== "select" && tag !== "textarea") {
    own = norm((h.textContent || "").trim().replace(/\s+/g, " "));
  } else {
    own = norm(
      [h.id, el.getAttribute("name"), el.getAttribute("placeholder"), el.getAttribute("aria-label")]
        .filter(Boolean)
        .join(" ")
    );
  }
  const t = norm(elementText(el));
  const hasOwn = (...words: string[]) => words.some((w) => own.includes(norm(w)));
  const has = (...words: string[]) => words.some((w) => t.includes(norm(w)));
  // Trip-type tabs: own text decides.
  if (hasOwn("roundtrip")) {
    return "Round trip — the car stays with you until you're back home.";
  }
  if (hasOwn("oneway")) {
    return "One-way, nice! You pay only for the distance you actually travel.";
  }
  if (hasOwn("localtour") || hasOwn("local")) {
    return "Local tour — perfect for a day of sightseeing around the city!";
  }
  if (has("pickup", "fromcity", "source", "boarding", "origin")) {
    return "Type your pickup spot — I'll keep an eye on it for you.";
  }
  if (has("drop", "destination", "tocity", "whereto")) {
    return "And where are we dropping you? Dream big.";
  }
  if (has("date", "journeydate", "traveldate", "departure")) {
    return "Pick your travel date — mornings mean emptier roads.";
  }
  if (has("time", "pickuptime", "slot")) {
    return "Choose a time. For the Taj, sunrise slots are pure magic.";
  }
  if (has("phone", "mobile", "contactnumber")) {
    return "Your number — our driver calls you 30 minutes before pickup.";
  }
  if (has("fullname", "yourname")) {
    return "Your good name, traveller?";
  }
  if (has("sedan", "hatchback", "suv", "innova", "ertiga", "tempo", "urbania", "vehicle", "cartype", "cabtype")) {
    return "Good choice of wheels! All our cars are sanitised and GPS-tracked.";
  }
  if (has("package", "tour")) {
    return "This package is a traveller favourite — great pick!";
  }
  if (has("coupon", "promo", "offercode")) {
    return "Psst — try ASTTCAR500OFF if you have it.";
  }
  if (has("email")) {
    return "Your email — the voucher lands here right after booking.";
  }
  if (tag === "select") return "Pick one — I'll remember it for you.";
  if (tag === "textarea") return "Tell us everything — special requests welcome.";
  return "Looking good — keep going, I'm right here with you.";
}

function isField(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    return !["hidden", "submit", "button", "checkbox", "radio", "file", "image"].includes(type);
  }
  return tag === "select" || tag === "textarea";
}

function isTripControl(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest('[data-trip-type], [role="radiogroup"], [role="tablist"]')) return true;
  const t = norm(elementText(el));
  return (
    (t.includes("oneway") || t.includes("roundtrip") || t.includes("localtour")) &&
    (el.tagName.toLowerCase() === "button" || el.getAttribute("role") === "radio" || el.getAttribute("role") === "tab")
  );
}

/** Where Buddy's avatar-center should sit to sit beside the rect. */
function placeFor(rect: DOMRect, vw: number, vh: number): { x: number; y: number } {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const AW = 76;
  const gap = 20;
  let x: number;
  let y: number;
  if (vw < 640) {
    x = clamp(rect.left + rect.width / 2, 60, vw - 60);
    y = rect.top - 78;
    if (y < 190) y = rect.bottom + 78;
  } else if (rect.left + rect.width / 2 > vw / 2) {
    x = rect.left - gap - AW / 2;
    y = rect.top + rect.height / 2;
  } else {
    x = rect.right + gap + AW / 2;
    y = rect.top + rect.height / 2;
  }
  return { x: clamp(x, 52, vw - 52), y: clamp(y, 190, vh - 70) };
}

/** Home avatar-center in viewport coords (matches .buddy-widget CSS). */
function homeCenter(): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = vw < 768 ? 12 : 16;
  const bottom = vw < 768 ? 12 : 16;
  return { x: left + 38, y: vh - bottom - 38 };
}

export function useBuddyGuide() {
  const lookAtRef = useRef<LookPoint>({ x: -1, y: -1 }); // -1 = unset
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [homeTip, setHomeTip] = useState(0);
  const targetElRef = useRef<HTMLElement | null>(null);
  const returnTimer = useRef<number>(0);
  const reducedRef = useRef(false);

  const clearReturnTimer = () => {
    if (returnTimer.current) {
      window.clearTimeout(returnTimer.current);
      returnTimer.current = 0;
    }
  };

  const goHome = useCallback(() => {
    targetElRef.current = null;
    setSpotlight(null);
  }, []);

  const scheduleReturnHome = useCallback(() => {
    clearReturnTimer();
    returnTimer.current = window.setTimeout(goHome, 1600);
  }, [goHome]);

  const spotlightEl = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    // Ignore off-screen or zero-size elements.
    if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) return;
    targetElRef.current = el;
    clearReturnTimer();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const home = homeCenter();
    if (reducedRef.current) {
      // Reduced motion: stay home, just update the tip.
      setSpotlight({ dx: 0, dy: 0, tip: tipFor(el) });
      return;
    }
    const p = placeFor(rect, vw, vh);
    setSpotlight({ dx: p.x - home.x, dy: p.y - home.y, tip: tipFor(el) });
    // Gaze locks onto the field's center.
    lookAtRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let pendingPointer: LookPoint | null = null;

    const onPointerMove = (e: PointerEvent) => {
      pendingPointer = { x: e.clientX, y: e.clientY };
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          // While spotlighting a field, gaze stays locked on it.
          if (!targetElRef.current && pendingPointer) {
            lookAtRef.current = pendingPointer;
          }
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null;
      lookAtRef.current = { x: e.clientX, y: e.clientY };
      if (!el || !(el instanceof HTMLElement)) return;
      if (el.closest(".buddy-widget")) return; // Buddy handles his own clicks.
      const control = el.closest("button, [role='radio'], [role='tab'], a") as HTMLElement | null;
      if (control && isTripControl(control)) {
        spotlightEl(control);
        return;
      }
      const field = (el.closest("input, select, textarea") as HTMLElement | null);
      if (field && isField(field)) spotlightEl(field);
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as Element | null;
      if (el instanceof HTMLElement && isField(el)) spotlightEl(el);
    };

    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Element | null;
      // If focus moves to another field, focusin will re-spotlight; otherwise head home.
      if (!next || !isField(next)) scheduleReturnHome();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") goHome();
    };

    const onScroll = () => {
      // Keep Buddy glued beside the field while the page scrolls.
      const el = targetElRef.current;
      if (!el || reducedRef.current) return;
      if (!document.contains(el)) {
        goHome();
        return;
      }
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const home = homeCenter();
      const p = placeFor(rect, vw, vh);
      setSpotlight((s) =>
        s ? { ...s, dx: p.x - home.x, dy: p.y - home.y } : s
      );
      lookAtRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const onResize = () => {
      if (targetElRef.current) onScroll();
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize);

    const tipId = window.setInterval(
      () => setHomeTip((i) => (i + 1) % HOME_TIP_POOL.length),
      9000
    );

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("click", onClick);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
      window.clearInterval(tipId);
      clearReturnTimer();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [spotlightEl, scheduleReturnHome, goHome]);

  return { lookAtRef, spotlight, homeTip, homeTipText: HOME_TIP_POOL[homeTip], goHome };
}
