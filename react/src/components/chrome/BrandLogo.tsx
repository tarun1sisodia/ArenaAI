import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

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
      {/* Brand Emblem — Animated Motion Compass Rose & Route (from admin panel) */}
      <div className="w-8 h-8 rounded-lg bg-sandstone-wash/80 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-300 shadow-xs shrink-0 overflow-hidden">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 shrink-0"
          aria-hidden="true"
        >
          {/* Compass ring with pathLength animation */}
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            stroke="#D99A3E"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          <circle cx="24" cy="24" r="15.5" stroke="#9F3C16" strokeWidth="1" opacity="0.4" />
          
          {/* Cardinal direction ticks */}
          {[0, 90, 180, 270].map((deg) => (
            <motion.line
              key={deg}
              x1="24"
              y1="4.5"
              x2="24"
              y2="8"
              stroke="#D99A3E"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${deg} 24 24)`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + deg * 0.001, duration: 0.3 }}
            />
          ))}

          {/* Sinuous dashed route line: Agra → Destination */}
          <motion.path
            d="M13 33 C 18 33, 16 20, 24 20 C 30 20, 29 14, 34 13"
            stroke="#9F3C16"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="3 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, ease: "easeInOut", delay: 0.3 }}
          />

          {/* Spring-loaded rotating compass needle with hover spin */}
          <motion.g
            initial={{ rotate: -60, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.4 }}
            style={{ originX: "24px", originY: "24px" }}
            className="transform group-hover:rotate-[360deg] transition-transform duration-700 ease-out"
          >
            <path d="M24 14 L27 24 L24 22 L21 24 Z" fill="#D99A3E" />
          </motion.g>
          
          <circle cx="24" cy="24" r="2" fill="#9F3C16" />
          {/* Origin / destination pins */}
          <circle cx="13" cy="33" r="2.4" fill="#D99A3E" />
          <circle cx="34" cy="13" r="2.4" fill="#9F3C16" />
        </svg>
      </div>

      {/* Brand Wordmark & Subtitle */}
      <div className="flex flex-col">
        <span
          className="font-headline-sm text-headline-sm font-semibold tracking-wide text-ink-charcoal group-hover:text-primary transition-colors leading-none"
          aria-hidden="true"
        >
          {displayText}
        </span>
        <span className="font-label-caps text-label-caps tracking-wider text-secondary uppercase font-semibold leading-none mt-0.5">
          {subtitle}
        </span>
      </div>
    </a>
  );
}

export default BrandLogo;
