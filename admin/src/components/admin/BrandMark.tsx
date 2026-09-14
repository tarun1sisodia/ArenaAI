import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Admin brand emblem — SVG compass rose + route line.
 * Companion to the public BrandLogo (LOCK-011); simplified for the admin shell.
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {/* Compass ring */}
      <motion.circle
        cx="24"
        cy="24"
        r="20"
        stroke="var(--gold)"
        strokeWidth="1.5"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
      <circle cx="24" cy="24" r="15.5" stroke="var(--border-strong)" strokeWidth="1" />
      {/* Cardinal ticks */}
      {[0, 90, 180, 270].map((deg) => (
        <motion.line
          key={deg}
          x1="24"
          y1="4.5"
          x2="24"
          y2="8"
          stroke="var(--gold)"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 24 24)`}
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + deg * 0.001, duration: 0.4 }}
        />
      ))}
      {/* Route line Agra → destination */}
      <motion.path
        d="M13 33 C 18 33, 16 20, 24 20 C 30 20, 29 14, 34 13"
        stroke="var(--text)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="3 3"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut", delay: 0.35 }}
      />
      {/* Needle */}
      <motion.g
        initial={reduce ? { rotate: 0 } : { rotate: -60, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.5 }}
        style={{ originX: "24px", originY: "24px" }}
      >
        <path d="M24 14 L27 24 L24 22 L21 24 Z" fill="var(--gold)" />
      </motion.g>
      <circle cx="24" cy="24" r="2" fill="var(--text)" />
      {/* Origin / destination pins */}
      <circle cx="13" cy="33" r="2.4" fill="var(--gold)" />
      <circle cx="34" cy="13" r="2.4" fill="var(--text)" />
    </svg>
  );
}
