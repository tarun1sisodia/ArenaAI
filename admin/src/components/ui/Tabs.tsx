import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const el = refs.current[value];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [value, items]);

  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-sm border border-hairline bg-surface-2 p-1",
        className
      )}
    >
      {indicator.ready && !reduce && (
        <motion.span
          initial={false}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute top-1 bottom-1 rounded-sm bg-surface shadow-card"
        />
      )}
      {items.map((item) => (
        <button
          key={item.value}
          ref={(el) => {
            refs.current[item.value] = el;
          }}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "relative z-10 flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors",
            value === item.value ? "text-ink" : "text-ink-soft hover:text-ink"
          )}
        >
          {item.label}
          {typeof item.count === "number" && (
            <span
              className={cn(
                "rounded-pill px-1.5 py-px font-mono text-[10px]",
                value === item.value ? "bg-gold-soft text-gold-text" : "bg-hairline text-ink-faint"
              )}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
