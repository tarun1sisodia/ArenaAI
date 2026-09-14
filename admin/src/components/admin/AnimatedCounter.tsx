import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatINR, formatNumber } from "@/lib/utils";

export function AnimatedCounter({
  value,
  format = "inr",
  duration = 1.2,
  className,
}: {
  value: number;
  format?: "inr" | "number" | "percent";
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return controls.stop;
  }, [value, duration, reduce]);

  const text =
    format === "inr"
      ? formatINR(Math.round(display), true)
      : format === "percent"
        ? `${display.toFixed(1)}%`
        : formatNumber(Math.round(display));

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
