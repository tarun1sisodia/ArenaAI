/**
 * AnalyticsBoard — the shared "analytics board" surface
 * --------------------------------------------------------------------------
 * A 21st.dev-style metric board used by the customer hub pages (fare & route
 * intelligence) and the operations desk (KPIs).
 *
 * Two layouts:
 *  - `variant="cells"`  → hairline metric grid with animated sparklines
 *  - `variant="bars"`   → ranked comparison rows with animated fills
 *
 * Motion: bars/sparklines grow on first scroll into view (motion.dev), the
 * numeric value always exists in the DOM for crawlers, and everything is
 * bypassed under `prefers-reduced-motion`.
 */

import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName } from "./Icon";
import { CountUp, useHydrated } from "./motion";

export interface BoardMetric {
  id: string;
  label: string;
  value: number;
  /** Optional unit rendered next to the value (e.g. "km", "/km"). */
  unit?: string;
  /** Rendered before the value (e.g. "₹"). */
  prefix?: string;
  decimals?: number;
  icon?: IconName;
  /** Trend chip, e.g. "+12% vs last quarter". */
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  /** Relative sparkline values (0–1 normalised internally). */
  spark?: number[];
}

export interface BoardBar {
  id: string;
  label: string;
  value: number;
  /** Rendered value label, e.g. "₹3,499 · 230 km". */
  display?: string;
  icon?: IconName;
  /** Muted bars read as secondary/reference data. */
  muted?: boolean;
}

export interface AnalyticsBoardProps {
  title: string;
  description?: string;
  metrics?: BoardMetric[];
  bars?: BoardBar[];
  barHeading?: string;
  footerNote?: string;
  legend?: Array<{ label: string; muted?: boolean }>;
  variant?: "cells" | "bars";
  /** Optional trailing content rendered in the board head (e.g. a tab group). */
  actions?: React.ReactNode;
  className?: string;
  id?: string;
}

export function AnalyticsBoard({
  title,
  description,
  metrics = [],
  bars,
  barHeading,
  footerNote,
  legend,
  variant = metrics.length ? "cells" : "bars",
  actions,
  className,
  id,
}: AnalyticsBoardProps) {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const animate = hydrated && !reduced;

  const maxBar = bars?.length ? Math.max(...bars.map((bar) => bar.value)) : 1;

  return (
    <section
      className={`board ${className ?? ""}`.trim()}
      id={id}
      aria-label={title}
    >
      <header className="board__head">
        <div className="board__title">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="board__actions">{actions}</div> : null}
      </header>

      {variant === "cells" && metrics.length > 0 ? (
        <div className="board__grid">
          {metrics.map((metric, index) => (
            <div className="board__cell" key={metric.id}>
              <span className="board__label">
                {metric.icon ? <Icon name={metric.icon} size={14} /> : null}
                {metric.label}
              </span>
              <span className="board__value">
                {hydrated ? (
                  <CountUp
                    value={metric.value}
                    prefix={metric.prefix ?? ""}
                    suffix={metric.unit ? ` ${metric.unit}` : ""}
                    decimals={metric.decimals ?? 0}
                  />
                ) : (
                  <>
                    {metric.prefix ?? ""}
                    {metric.value.toLocaleString("en-IN", {
                      minimumFractionDigits: metric.decimals ?? 0,
                      maximumFractionDigits: metric.decimals ?? 0,
                    })}
                    {metric.unit ? ` ${metric.unit}` : ""}
                  </>
                )}
              </span>
              {metric.delta ? (
                <span
                  className={`board__delta${
                    metric.deltaTone === "down"
                      ? " board__delta--down"
                      : metric.deltaTone === "flat"
                        ? " board__delta--flat"
                        : ""
                  }`}
                >
                  {metric.deltaTone === "down" ? (
                    <Icon name="trend-down" size={12} />
                  ) : metric.deltaTone === "flat" ? null : (
                    <Icon name="trend-up" size={12} />
                  )}
                  {metric.delta}
                </span>
              ) : null}
              {metric.spark?.length ? (
                <Sparkline values={metric.spark} index={index} animate={animate} />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {bars?.length ? (
        <div className="board__bars">
          {barHeading ? <span className="board__label">{barHeading}</span> : null}
          {bars.map((bar, index) => {
            const ratio = maxBar > 0 ? bar.value / maxBar : 0;
            return (
              <div className="board__bar-row" key={bar.id}>
                <span className="board__bar-label">
                  {bar.icon ? <Icon name={bar.icon} size={15} /> : null}
                  <span>{bar.label}</span>
                </span>
                <span className="board__bar-track">
                  <motion.span
                    className="board__bar-fill"
                    style={{ opacity: bar.muted ? 0.4 : 1 }}
                    initial={animate ? { scaleX: 0 } : { scaleX: ratio }}
                    whileInView={animate ? { scaleX: ratio } : undefined}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.85,
                      delay: Math.min(index, 6) * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </span>
                <span className="board__bar-value">{bar.display ?? bar.value.toLocaleString("en-IN")}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {footerNote || legend?.length ? (
        <div className="board__foot">
          {footerNote ? <span>{footerNote}</span> : <span />}
          {legend?.length ? (
            <span className="board__legend">
              {legend.map((entry) => (
                <span key={entry.label}>
                  <i className={entry.muted ? "is-muted" : ""} />
                  {entry.label}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Sparkline({
  values,
  index,
  animate,
}: {
  values: number[];
  index: number;
  animate: boolean;
}) {
  const max = Math.max(...values, 1);
  return (
    <span className="board__spark" aria-hidden="true">
      {values.map((value, barIndex) => (
        <motion.span
          key={barIndex}
          style={{ height: `${Math.max((value / max) * 100, 12)}%` }}
          initial={animate ? { scaleY: 0, opacity: 0 } : false}
          whileInView={animate ? { scaleY: 1, opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 0.5,
            delay: Math.min(index, 4) * 0.05 + barIndex * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </span>
  );
}

export default AnalyticsBoard;
