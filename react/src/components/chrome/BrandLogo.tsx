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
  subtitle = "TOUR & TRAVELS AGRA",
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
      className={`flex items-center gap-space-sm group select-none ${className}`.trim()}
      aria-label="SK Baghel Tour & Travels"
      onMouseEnter={startScramble}
      onMouseLeave={stopScramble}
      onFocus={startScramble}
      onBlur={stopScramble}
      onClick={onClick}
    >
      {/* Brand Emblem */}
      <div className="w-7 h-7 rounded-md bg-primary-container/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-xs shrink-0">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 transform group-hover:rotate-45 transition-transform duration-500"
          aria-hidden="true"
        >
          {/* Outer Ring */}
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.6"
          />
          {/* Inner Ring */}
          <circle
            cx="16"
            cy="16"
            r="10"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          {/* North Point */}
          <path
            d="M16 5L19 16H13L16 5Z"
            fill="currentColor"
          />
          {/* South Point */}
          <path
            d="M16 27L13 16H19L16 27Z"
            fill="currentColor"
            opacity="0.4"
          />
          {/* Center Gem */}
          <circle
            cx="16"
            cy="16"
            r="2.5"
            fill="#D99A3E"
          />
        </svg>
      </div>

      {/* Brand Wordmark & Subtitle */}
      <div className="flex flex-col">
        <span
          className="font-headline-sm text-[13.5px] font-semibold tracking-wide text-ink-charcoal group-hover:text-primary transition-colors leading-none"
          aria-hidden="true"
        >
          {displayText}
        </span>
        <span className="font-label-caps text-[7.5px] tracking-wider text-secondary uppercase font-semibold leading-none mt-0.5">
          {subtitle}
        </span>
      </div>
    </a>
  );
}

export default BrandLogo;
