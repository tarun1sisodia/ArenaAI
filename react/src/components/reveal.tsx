/**
 * @file reveal.tsx — Reusable scroll reveal component (Progressive Enhancement & SEO-Safe).
 * @usage Wraps headings, card grids, and banners with staggered IntersectionObserver motion.
 */

import React from "react";

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Stagger delay in milliseconds (e.g. i * 80) */
  delay?: number;
  /** Animation primitive variant: 'up' (default) | 'img' (mask-open) | 'pop' */
  variant?: "up" | "img" | "pop";
  /** HTML tag or custom component to render */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Progressive scroll reveal wrapper.
 * Pre-rendered HTML is 100% visible (opacity: 1) for search engines.
 * Smoothly cascades into view upon entering viewport when client-side JS is active.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  as: Component = "div",
  className = "",
  style = {},
  ...props
}: RevealProps) {
  const variantClass =
    variant === "img"
      ? "reveal-img"
      : variant === "pop"
      ? "reveal-pop"
      : "reveal";

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(delay > 0 ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : {}),
  };

  return (
    <Component
      className={`${variantClass} ${className}`.trim()}
      style={mergedStyle}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
