import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-white hover:bg-gold-deep shadow-card",
  default: "bg-night text-white hover:bg-night-soft",
  secondary: "bg-surface-2 text-ink hover:bg-hairline",
  outline:
    "border border-hairline-strong bg-transparent text-ink hover:bg-surface-2 hover:border-gold-border hover:text-gold-text",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink",
  destructive: "bg-error text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Adds a 21st.dev-style diagonal light sweep on hover. */
  shine?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "md", shine = false, children, ...props },
    ref
  ) => {
    const reduce = useReducedMotion();
    const MotionTag = reduce ? "button" : motion.button;

    return (
      <MotionTag
        ref={ref}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-sm font-medium tracking-tight transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          shine && "animate-shimmer",
          className
        )}
        {...(props as object)}
      >
        {children}
      </MotionTag>
    );
  }
);
Button.displayName = "Button";
