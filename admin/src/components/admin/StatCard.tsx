import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "./AnimatedCounter";
import { Sparkline } from "@/components/charts/Charts";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number;
  format?: "inr" | "number" | "percent";
  icon: LucideIcon;
  /** Percentage vs the previous period — omit when no real comparison exists. */
  delta?: number;
  deltaLabel?: string;
  spark?: number[];
  index?: number;
}

export function StatCard({ label, value, format, icon: Icon, delta, deltaLabel, spark, index = 0 }: StatCardProps) {
  const reduce = useReducedMotion();
  const up = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 * index }}
      whileHover={reduce ? undefined : { y: -3 }}
    >
      <Card className="group relative overflow-hidden p-5 transition-shadow duration-200 hover:shadow-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex items-start justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
          <motion.span
            className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-soft text-gold-text"
            whileHover={reduce ? undefined : { scale: 1.12, rotate: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Icon className="h-4.5 w-4.5" />
          </motion.span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink truncate">
              <AnimatedCounter value={value} format={format} />
            </p>
            {typeof delta === "number" && deltaLabel ? (
              <p className="mt-1.5 flex items-center gap-1 text-[12px]">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 font-mono text-[10px] tracking-wide",
                    up ? "bg-success-soft text-success" : "bg-error-soft text-error"
                  )}
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(delta).toFixed(1)}%
                </span>
                <span className="text-ink-faint">{deltaLabel}</span>
              </p>
            ) : null}
          </div>
          {spark ? <Sparkline points={spark} /> : null}
        </div>
      </Card>
    </motion.div>
  );
}
