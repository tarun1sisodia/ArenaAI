import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "gold" | "success" | "error" | "teal" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-soft border-hairline",
  gold: "bg-gold-soft text-gold-text border-gold-border",
  success: "bg-success-soft text-success border-transparent",
  error: "bg-error-soft text-error border-transparent",
  teal: "bg-teal-soft text-teal border-transparent",
  ink: "bg-ink text-white border-transparent",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-[11px] tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
