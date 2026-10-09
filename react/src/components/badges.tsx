/**
 * @file badges.tsx — Section headings, badges, and brand typographic headers.
 * @usage Used across pages with animated saffron rule .sh-line and wide-tracked kickers.
 */

import React from "react";

export interface SectionHeadingProps {
  index?: string;
  kicker?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}

/**
 * Editorial Section Heading with animated .sh-line saffron rule.
 */
export function SectionHeading({
  index,
  kicker,
  title,
  subtitle,
  align = "left",
  className = "",
  as: Tag = "h2",
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div className={`mb-10 md:mb-14 ${isCenter ? "text-center" : ""} ${className}`.trim()}>
      <div className={`flex items-center gap-2 mb-3 ${isCenter ? "justify-center" : ""}`}>
        {index && (
          <span className="font-display text-lg italic text-ink/30 select-none">
            {index}
          </span>
        )}
        {kicker && (
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-saffron">
            {kicker}
          </p>
        )}
      </div>

      <Tag className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-ink leading-[1.04]">
        {title}
      </Tag>

      {/* Saffron rule: scales X 0 -> 1 after parent reveals */}
      <div className={`mt-4 ${isCenter ? "mx-auto" : ""}`}>
        <span className={`sh-line w-16 sm:w-20 ${isCenter ? "mx-auto" : ""}`} />
      </div>

      {subtitle && (
        <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-smoke max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * Leaf green NEW badge for recently published corridors and monuments.
 */
export function NewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.18em] bg-leaf text-white shadow-xs ${className}`.trim()}
    >
      NEW
    </span>
  );
}

/**
 * Gold featured badge.
 */
export function GoldBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.18em] bg-gold text-ink shadow-xs ${className}`.trim()}
    >
      {children}
    </span>
  );
}
