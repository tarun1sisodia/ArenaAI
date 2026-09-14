import { useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatINR } from "@/lib/utils";

const easeExpo = [0.16, 1, 0.3, 1] as const;

/* ── Area chart (revenue) ─────────────────────────────────── */

interface AreaPoint {
  label: string;
  value: number;
  sub?: string;
}

export function AreaChart({
  data,
  height = 260,
  formatValue = (v: number) => formatINR(v, true),
}: {
  data: AreaPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const reduce = useReducedMotion();
  const gid = useId().replace(/[:]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = height;
  const pad = { top: 18, right: 14, bottom: 28, left: 46 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value)) * 1.15;

  const pts = useMemo(
    () =>
      data.map((d, i) => ({
        x: pad.left + (i / (data.length - 1)) * iw,
        y: pad.top + ih - (d.value / max) * ih,
        d,
      })),
    [data, max, iw, ih]
  );

  // Smooth path (catmull-rom → cubic bézier)
  const line = useMemo(() => {
    if (pts.length < 2) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }, [pts]);

  const area = `${line} L ${pts[pts.length - 1].x} ${pad.top + ih} L ${pts[0].x} ${pad.top + ih} Z`;
  const gridLines = [0.25, 0.5, 0.75, 1];

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let best = Infinity;
    pts.forEach((p, i) => {
      const dist = Math.abs(p.x - rel);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  return (
    <div ref={wrapRef} className="relative w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue area chart">
        <defs>
          <linearGradient id={`gold-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5A044" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#E5A044" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = pad.top + ih - g * ih;
          return (
            <g key={g}>
              <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 5" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-[var(--text-faint)]" fontSize="10" fontFamily="var(--font-mono)">
                {formatValue(max * g)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <motion.path
          d={area}
          fill={`url(#gold-${gid})`}
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        {/* Line draw */}
        <motion.path
          d={line}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: easeExpo, delay: 0.15 }}
        />

        {/* Data dots */}
        {pts.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3}
            fill="var(--surface)"
            stroke="var(--gold)"
            strokeWidth="2"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + (i / pts.length) * 1.1 }}
          />
        ))}

        {/* Hover guide */}
        {hover !== null && (
          <g>
            <line x1={pts[hover].x} x2={pts[hover].x} y1={pad.top} y2={pad.top + ih} stroke="var(--gold-border)" strokeWidth="1" />
          </g>
        )}

        {/* Month labels */}
        {pts.map((p, i) =>
          i % 2 === 0 ? (
            <text key={`m${i}`} x={p.x} y={H - 8} textAnchor="middle" className="fill-[var(--text-faint)]" fontSize="10" fontFamily="var(--font-mono)">
              {p.d.label}
            </text>
          ) : null
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-sm border border-hairline bg-surface px-3 py-2 shadow-pop"
          style={{
            left: `${(pts[hover].x / W) * 100}%`,
            top: `${(pts[hover].y / H) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{pts[hover].d.label}</p>
          <p className="whitespace-nowrap text-sm font-semibold text-ink">{formatValue(pts[hover].d.value)}</p>
          {pts[hover].d.sub && <p className="text-[11px] text-ink-soft">{pts[hover].d.sub}</p>}
        </div>
      )}
    </div>
  );
}

/* ── Donut chart (status mix) ─────────────────────────────── */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 200,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const reduce = useReducedMotion();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
          {slices.map((s, i) => {
            const frac = total === 0 ? 0 : s.value / total;
            const dash = frac * C;
            const offset = -acc * C;
            acc += frac;
            return (
              <motion.circle
                key={s.label}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${C - dash}`}
                initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: C, opacity: 0 }}
                animate={{ strokeDashoffset: offset, opacity: 1 }}
                transition={{ duration: 1, ease: easeExpo, delay: 0.2 + i * 0.12 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">{centerValue}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{centerLabel}</span>
        </div>
      </div>
      <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {slices.map((s, i) => (
          <motion.li
            key={s.label}
            initial={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            className="flex items-center gap-2 text-[13px]"
          >
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
            <span className="flex-1 text-ink-soft">{s.label}</span>
            <span className="font-mono text-xs text-ink">{s.value}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ── Horizontal bars (ranked list) ────────────────────────── */

export function RankedBars({
  items,
  formatValue = (v: number) => formatINR(v, true),
}: {
  items: { label: string; value: number; sub?: string }[];
  formatValue?: (v: number) => string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...items.map((i) => i.value));

  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => (
        <motion.li
          key={item.label}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.09, duration: 0.45, ease: easeExpo }}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-ink">{item.label}</span>
            <span className="font-mono text-xs text-ink-soft">
              {item.sub ? `${item.sub} · ` : ""}
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-surface-2">
            <motion.div
              className="h-full rounded-pill"
              style={{
                background:
                  i === 0
                    ? "linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 100%)"
                    : "var(--gold-soft)",
              }}
              initial={reduce ? { width: `${(item.value / max) * 100}%` } : { width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.9, ease: easeExpo, delay: 0.35 + i * 0.1 }}
            />
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

/* ── Vertical bars (count per category) ───────────────────── */

export function VerticalBars({ items }: { items: { label: string; value: number }[] }) {
  const reduce = useReducedMotion();
  const max = Math.max(...items.map((i) => i.value));

  return (
    <div className="flex h-44 items-end gap-3">
      {items.map((item, i) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="font-mono text-[11px] text-ink-soft">{item.value}</span>
          <div className="flex w-full flex-1 items-end rounded-sm bg-surface-2">
            <motion.div
              className="w-full rounded-sm"
              style={{ background: "linear-gradient(180deg, var(--gold) 0%, var(--gold-deep) 100%)" }}
              initial={reduce ? { height: `${(item.value / max) * 100}%` } : { height: 0 }}
              animate={{ height: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: easeExpo, delay: 0.2 + i * 0.08 }}
              whileHover={{ opacity: 0.85 }}
            />
          </div>
          <span className="max-w-full truncate font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Sparkline (stat cards) ───────────────────────────────── */

export function Sparkline({ points, width = 96, height = 30, color = "var(--gold)" }: { points: number[]; width?: number; height?: number; color?: string }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - 3 - ((p - min) / span) * (height - 6);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: easeExpo, delay: 0.4 }}
      />
    </svg>
  );
}
