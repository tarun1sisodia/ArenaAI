import { useState, useRef, useCallback, useEffect } from "react";

const ORIGINAL_TITLE = "SK BAGHEL";
const CHARSET = "SKBAGHEL0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface BrandLogoProps {
  href?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({
  href = "/",
  subtitle = "TOUR & TRAVELS",
  className = "",
  onClick,
}: BrandLogoProps) {
  const [displayText, setDisplayText] = useState(ORIGINAL_TITLE);
  const intervalRef = useRef<number | null>(null);

  const stopScramble = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayText(ORIGINAL_TITLE);
  }, []);

  const startScramble = useCallback(() => {
    // Respect user preference for reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    stopScramble();
    let iteration = 0;

    intervalRef.current = window.setInterval(() => {
      setDisplayText(
        ORIGINAL_TITLE.split("")
          .map((char, idx) => {
            if (char === " ") return " ";
            if (idx < iteration) return ORIGINAL_TITLE[idx];
            return CHARSET[Math.floor(Math.random() * CHARSET.length)];
          })
          .join("")
      );

      if (iteration >= ORIGINAL_TITLE.length) {
        stopScramble();
      }

      iteration += 1 / 3;
    }, 30);
  }, [stopScramble]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <a
      href={href}
      className={`brand ${className}`.trim()}
      aria-label="SK Baghel Tour & Travels"
      onMouseEnter={startScramble}
      onMouseLeave={stopScramble}
      onFocus={startScramble}
      onBlur={stopScramble}
      onClick={onClick}
    >
      <span className="brand-mark" aria-hidden="true">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="brand-compass-icon"
          aria-hidden="true"
        >
          {/* Compass Outer Ring */}
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.5"
          />
          {/* Compass Inner Cardinal Ring */}
          <circle
            cx="16"
            cy="16"
            r="11"
            stroke="var(--gold, #E5A044)"
            strokeWidth="1.2"
          />
          {/* Compass Needle - North (Gold Filled) */}
          <path
            d="M16 4L19 16H13L16 4Z"
            fill="var(--gold, #E5A044)"
          />
          {/* Compass Needle - South (Charcoal / Muted) */}
          <path
            d="M16 28L13 16H19L16 28Z"
            fill="currentColor"
            opacity="0.7"
          />
          {/* Center Pivot Gem */}
          <circle
            cx="16"
            cy="16"
            r="2.2"
            fill="var(--bg, #FFFFFF)"
            stroke="var(--gold, #E5A044)"
            strokeWidth="1.2"
          />
        </svg>
      </span>
      <span className="brand-copy">
        <strong data-scramble className="brand-wordmark" aria-hidden="true">
          {displayText}
        </strong>
        <small className="brand-subtext">{subtitle}</small>
      </span>
    </a>
  );
}
export default BrandLogo;
