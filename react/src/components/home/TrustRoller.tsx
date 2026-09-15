/**
 * TrustRoller — Infinite 42s marquee of 8 E-E-A-T trust chips.
 *
 * - GPU-only: `transform: translateX` animation, no layout properties
 * - pause-on-hover via CSS animation-play-state
 * - Dual set of chips for seamless loop (no JS ticking)
 * - `@media (prefers-reduced-motion: reduce)` wraps to simple flex instead
 * - aria-hidden on duplicate chips, live region on visible set
 */

const TRUST_CHIPS = [
  { icon: "🏛️", text: "Govt-registered fleet" },
  { icon: "✅", text: "Verified commercial drivers" },
  { icon: "🧾", text: "Official GST invoice" },
  { icon: "⭐", text: "4.9/5 · 380+ trips" },
  { icon: "🕐", text: "15+ years in Agra" },
  { icon: "📞", text: "24×7 on-route support" },
  { icon: "💰", text: "Transparent pricing" },
  { icon: "🪪", text: "Chauffeur ID verified" },
] as const;

export function TrustRoller() {
  return (
    <section
      className="trust-roller"
      aria-label="Trust credentials"
    >
      {/* Screen-reader text listing all chips once */}
      <ul className="sr-only" aria-label="Our trust credentials">
        {TRUST_CHIPS.map((chip) => (
          <li key={chip.text}>{chip.text}</li>
        ))}
      </ul>

      {/* Visual marquee — aria-hidden so SR only reads the <ul> above */}
      <div className="trust-roller-track" aria-hidden="true">
        {/* First set */}
        <div className="trust-roller-inner">
          {TRUST_CHIPS.map((chip) => (
            <span className="trust-chip" key={chip.text}>
              <span className="trust-chip-icon">{chip.icon}</span>
              {chip.text}
            </span>
          ))}
        </div>

        {/* Duplicate set for seamless loop */}
        <div className="trust-roller-inner" aria-hidden="true">
          {TRUST_CHIPS.map((chip) => (
            <span className="trust-chip" key={`dup-${chip.text}`}>
              <span className="trust-chip-icon">{chip.icon}</span>
              {chip.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
