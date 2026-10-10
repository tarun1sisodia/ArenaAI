import { useEffect, useState } from "react";
import { BuddyAvatar } from "./BuddyAvatar";
import "./buddy.css";

const TIPS = [
  "Namaste! I'm Baghel Buddy — your travel sidekick. Tap me for a wave!",
  "Taj Mahal at sunrise: fewer crowds, softer light, better photos.",
  "A 28% advance locks your cab — the rest is paid after drop-off.",
  "Varanasi's evening Ganga aarti begins at sunset. Reach early!",
  "Carry a light shawl — desert nights around Jaisalmer turn chilly.",
];

const DISMISS_KEY = "baghel-buddy-dismissed";

/**
 * Floating Baghel Buddy mascot for the customer site.
 * Purely additive chrome: it never touches locked layouts or the booking flow.
 */
export function BuddyWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [animation, setAnimation] = useState("idle");
  const [mounted, setMounted] = useState(false);

  // Client-only: restore dismissal + rotate tips.
  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* storage unavailable — keep visible */
    }
    const id = window.setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      9000
    );
    return () => window.clearInterval(id);
  }, []);

  if (!mounted || dismissed) return null;

  const cheer = () => {
    setAnimation("excited");
    setTipIndex((i) => (i + 1) % TIPS.length);
    window.setTimeout(() => setAnimation("idle"), 2600);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="buddy-widget"
      role="region"
      aria-label="Baghel Buddy travel mascot"
    >
      <div className="buddy-bubble" aria-live="polite">
        <p>{TIPS[tipIndex]}</p>
        <button
          type="button"
          className="buddy-close"
          onClick={dismiss}
          aria-label="Dismiss Baghel Buddy"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>
      </div>
      <button
        type="button"
        className="buddy-avatar-btn buddy-float"
        onClick={cheer}
        aria-label="Baghel Buddy — tap for a cheerful wave"
        title="Say hi to Baghel Buddy"
      >
        <BuddyAvatar animation={animation} size={76} />
      </button>
    </div>
  );
}
