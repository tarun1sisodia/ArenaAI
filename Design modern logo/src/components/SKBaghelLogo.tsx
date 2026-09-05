interface LogoProps {
  variant?: "stacked" | "horizontal" | "emblem";
  theme?: "dark" | "light" | "gold";
  scale?: number;
}

const PALETTE = {
  dark: {
    navy: "#0c1120",
    navyDeep: "#070c18",
    gold: "#c8a050",
    goldLight: "#e0be78",
    goldDim: "#a07830",
    text: "#f0ead8",
    sub: "#a89060",
    glow: "#c8a05022",
  },
  light: {
    navy: "#0c1120",
    navyDeep: "#1a2440",
    gold: "#a07830",
    goldLight: "#c8a050",
    goldDim: "#7a5c20",
    text: "#0c1120",
    sub: "#6b5a3a",
    glow: "#a0783018",
  },
  gold: {
    navy: "#0c1120",
    navyDeep: "#070c18",
    gold: "#0c1120",
    goldLight: "#1a2440",
    goldDim: "#2a3a60",
    text: "#0c1120",
    sub: "#1a2440cc",
    glow: "#0c112015",
  },
};

type Colors = typeof PALETTE.dark;

/* ─── Taj Mahal + Car Scene Emblem ─── */
function Emblem({ colors, size = 160 }: { colors: Colors; size?: number }) {
  const g = colors.gold;
  const gl = colors.goldLight;
  const gd = colors.goldDim;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SK Baghel — Taj Mahal and car emblem"
    >
      <defs>
        {/* Radial glow behind Taj */}
        <radialGradient id="tajGlow" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor={gl} stopOpacity="0.18" />
          <stop offset="100%" stopColor={g} stopOpacity="0" />
        </radialGradient>

        {/* Road gradient */}
        <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={g} stopOpacity="0.08" />
          <stop offset="50%" stopColor={g} stopOpacity="0.22" />
          <stop offset="100%" stopColor={g} stopOpacity="0.08" />
        </linearGradient>

        {/* Car body fill */}
        <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gl} />
          <stop offset="100%" stopColor={gd} />
        </linearGradient>

        {/* Clip for emblem circle */}
        <clipPath id="circleClip">
          <circle cx="80" cy="80" r="72" />
        </clipPath>
      </defs>

      {/* ── Outer ring system ── */}
      {/* Outer double ring */}
      <circle cx="80" cy="80" r="76" stroke={g} strokeWidth="1.2" opacity="0.55" />
      <circle cx="80" cy="80" r="72" stroke={g} strokeWidth="0.5" opacity="0.3" />

      {/* Decorative corner ornaments at 4 compass points */}
      {[0, 90, 180, 270].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const ox = 80 + 76 * Math.sin(rad);
        const oy = 80 - 76 * Math.cos(rad);
        return (
          <g key={i} transform={`translate(${ox},${oy}) rotate(${deg})`}>
            <polygon
              points="0,-3.5 1,-1 3.5,0 1,1 0,3.5 -1,1 -3.5,0 -1,-1"
              fill={g}
              opacity="0.8"
            />
          </g>
        );
      })}

      {/* ── Scene background glow ── */}
      <ellipse cx="80" cy="72" rx="52" ry="40" fill="url(#tajGlow)" />

      {/* ── TAJ MAHAL silhouette ── */}
      {/* Ground platform / plinth */}
      <rect x="28" y="104" width="104" height="5" fill={g} opacity="0.75" rx="0.5" />
      <rect x="34" y="100" width="92" height="5" fill={g} opacity="0.6" rx="0.5" />

      {/* Left minaret */}
      {/* Left far minaret */}
      <rect x="30" y="66" width="6" height="35" fill={g} opacity="0.4" rx="1" />
      <ellipse cx="33" cy="65" rx="4" ry="5.5" fill={g} opacity="0.4" />
      <ellipse cx="33" cy="62" rx="2" ry="2.5" fill={g} opacity="0.45" />
      <line x1="33" y1="59.5" x2="33" y2="56" stroke={g} strokeWidth="1.2" opacity="0.4" />
      <circle cx="33" cy="55.5" r="1.2" fill={g} opacity="0.4" />
      {/* Left near minaret */}
      <rect x="44" y="60" width="7" height="41" fill={g} opacity="0.6" rx="1" />
      <ellipse cx="47.5" cy="59" rx="5" ry="7" fill={g} opacity="0.65" />
      <ellipse cx="47.5" cy="55" rx="2.5" ry="3" fill={g} opacity="0.7" />
      <line x1="47.5" y1="52" x2="47.5" y2="47" stroke={g} strokeWidth="1.4" opacity="0.65" />
      <circle cx="47.5" cy="46.5" r="1.4" fill={g} opacity="0.65" />

      {/* Right near minaret */}
      <rect x="109" y="60" width="7" height="41" fill={g} opacity="0.6" rx="1" />
      <ellipse cx="112.5" cy="59" rx="5" ry="7" fill={g} opacity="0.65" />
      <ellipse cx="112.5" cy="55" rx="2.5" ry="3" fill={g} opacity="0.7" />
      <line x1="112.5" y1="52" x2="112.5" y2="47" stroke={g} strokeWidth="1.4" opacity="0.65" />
      <circle cx="112.5" cy="46.5" r="1.4" fill={g} opacity="0.65" />
      {/* Right far minaret */}
      <rect x="124" y="66" width="6" height="35" fill={g} opacity="0.4" rx="1" />
      <ellipse cx="127" cy="65" rx="4" ry="5.5" fill={g} opacity="0.4" />
      <ellipse cx="127" cy="62" rx="2" ry="2.5" fill={g} opacity="0.45" />
      <line x1="127" y1="59.5" x2="127" y2="56" stroke={g} strokeWidth="1.2" opacity="0.4" />
      <circle cx="127" cy="55.5" r="1.2" fill={g} opacity="0.4" />

      {/* Main building body */}
      <rect x="55" y="82" width="50" height="22" fill={g} opacity="0.8" rx="0.5" />

      {/* Side wings */}
      <rect x="36" y="90" width="20" height="15" fill={g} opacity="0.65" rx="0.5" />
      <rect x="104" y="90" width="20" height="15" fill={g} opacity="0.65" rx="0.5" />

      {/* Wing arched windows */}
      <path d="M40 90 Q46 84 52 90" fill={g} opacity="0.55" />
      <path d="M108 90 Q114 84 120 90" fill={g} opacity="0.55" />

      {/* Main arch — the defining Mughal gateway */}
      <path
        d="M62 104 L62 88 Q62 70 80 66 Q98 70 98 88 L98 104 Z"
        fill={colors.navy}
        opacity="0.85"
      />
      <path
        d="M62 104 L62 88 Q62 70 80 66 Q98 70 98 88 L98 104"
        stroke={g}
        strokeWidth="2"
        fill="none"
        opacity="0.9"
      />

      {/* Inner arch detail */}
      <path
        d="M66 104 L66 90 Q66 74 80 71 Q94 74 94 90 L94 104"
        stroke={g}
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />

      {/* Main dome */}
      <path
        d="M57 82 Q57 48 80 42 Q103 48 103 82 Z"
        fill={g}
        opacity="0.85"
      />
      {/* Dome highlight */}
      <path
        d="M68 82 Q68 56 80 51 Q92 56 92 82"
        fill={gl}
        opacity="0.18"
      />
      {/* Dome outline */}
      <path
        d="M57 82 Q57 48 80 42 Q103 48 103 82"
        stroke={gl}
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      {/* Neck below dome */}
      <rect x="72" y="78" width="16" height="8" fill={g} opacity="0.9" rx="0.5" />

      {/* Onion dome / kalash */}
      <ellipse cx="80" cy="42" rx="7" ry="10" fill={g} opacity="0.95" />
      <ellipse cx="80" cy="37" rx="3.5" ry="4.5" fill={g} opacity="0.95" />
      <ellipse cx="80" cy="33" rx="2" ry="2.5" fill={g} opacity="0.95" />
      {/* Finial */}
      <line x1="80" y1="30.5" x2="80" y2="22" stroke={g} strokeWidth="1.8" opacity="0.95" />
      <circle cx="80" cy="21.5" r="2" fill={g} opacity="0.95" />
      <circle cx="80" cy="21.5" r="3.5" stroke={gl} strokeWidth="0.6" fill="none" opacity="0.5" />

      {/* Side dome caps on wings */}
      <path d="M36 90 Q46 79 56 90" fill={g} opacity="0.55" />
      <path d="M104 90 Q114 79 124 90" fill={g} opacity="0.55" />

      {/* Minaret balcony rings */}
      {[72, 82, 90].map((y, i) => (
        <g key={i}>
          <rect x="43" y={y} width="9" height="1.5" fill={g} opacity={0.5 - i * 0.08} rx="0.5" />
          <rect x="108" y={y} width="9" height="1.5" fill={g} opacity={0.5 - i * 0.08} rx="0.5" />
        </g>
      ))}

      {/* Decorative stars flanking dome */}
      {[
        [60, 56], [100, 56], [55, 70], [105, 70],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <polygon
            points="0,-2 0.6,-0.6 2,0 0.6,0.6 0,2 -0.6,0.6 -2,0 -0.6,-0.6"
            fill={g}
            opacity={i < 2 ? 0.6 : 0.35}
          />
        </g>
      ))}

      {/* ── ROAD ── */}
      <rect x="28" y="110" width="104" height="14" fill="url(#roadGrad)" rx="0.5" />
      {/* Road center dashes */}
      {[36, 52, 68, 84, 100, 116].map((x, i) => (
        <rect key={i} x={x} y="116" width="8" height="2" fill={g} opacity="0.35" rx="0.5" />
      ))}
      {/* Road edge lines */}
      <line x1="28" y1="112" x2="132" y2="112" stroke={g} strokeWidth="0.7" opacity="0.4" />
      <line x1="28" y1="122" x2="132" y2="122" stroke={g} strokeWidth="0.7" opacity="0.4" />

      {/* ── CAR — sleek modern sedan driving left→right ── */}
      {/*
        Car body sits at y≈108–122, centered around x=80
        Total width ~52, height ~14
      */}
      <g transform="translate(54, 108)">
        {/* Shadow beneath car */}
        <ellipse cx="26" cy="16.5" rx="24" ry="2.5" fill={colors.navyDeep} opacity="0.5" />

        {/* Main body lower */}
        <rect x="2" y="8" width="50" height="8" fill="url(#carBody)" rx="2" />

        {/* Cabin glass — the roofline */}
        <path
          d="M10 8 L14 2 Q16 0 20 0 L36 0 Q40 0 42 2 L46 8 Z"
          fill={gd}
          opacity="0.95"
        />
        {/* Glass tint */}
        <path
          d="M13 8 L17 2.5 Q18 1 21 1 L35 1 Q38 1 39 2.5 L43 8 Z"
          fill={gl}
          opacity="0.2"
        />
        {/* Windshield highlight */}
        <path d="M17 2 L20 1 L20 7 L15 7 Z" fill={gl} opacity="0.25" />
        <path d="M36 1 L39 2 L41 7 L36 7 Z" fill={gl} opacity="0.2" />

        {/* A-pillar, B-pillar */}
        <line x1="14" y1="2.5" x2="14" y2="8" stroke={g} strokeWidth="0.8" opacity="0.6" />
        <line x1="28" y1="0.5" x2="28" y2="8" stroke={g} strokeWidth="0.8" opacity="0.5" />
        <line x1="42" y1="2.5" x2="42" y2="8" stroke={g} strokeWidth="0.8" opacity="0.5" />

        {/* Hood line + spoiler suggestion */}
        <path d="M2 9 Q4 8 8 8" stroke={gl} strokeWidth="0.8" fill="none" opacity="0.4" />
        <line x1="46" y1="8" x2="52" y2="8.5" stroke={gl} strokeWidth="0.8" opacity="0.35" />

        {/* Front bumper / grille */}
        <rect x="48" y="9" width="4" height="5" fill={gd} opacity="0.7" rx="0.5" />
        <line x1="49" y1="11" x2="52" y2="11" stroke={g} strokeWidth="0.6" opacity="0.5" />
        <line x1="49" y1="12.5" x2="52" y2="12.5" stroke={g} strokeWidth="0.4" opacity="0.35" />

        {/* Headlight */}
        <rect x="49" y="9.5" width="3" height="2" fill={gl} opacity="0.85" rx="0.5" />
        {/* Headlight beam */}
        <path d="M52 10.5 L60 8 L60 13 L52 11.5 Z" fill={gl} opacity="0.12" />

        {/* Tail light */}
        <rect x="1" y="9.5" width="3" height="2" fill={g} opacity="0.7" rx="0.5" />

        {/* Wheels */}
        {/* Rear wheel */}
        <circle cx="12" cy="16" r="5.5" fill={colors.navyDeep} stroke={g} strokeWidth="1.2" />
        <circle cx="12" cy="16" r="3" fill={gd} opacity="0.6" />
        <circle cx="12" cy="16" r="1.5" fill={g} opacity="0.8" />
        {/* Wheel spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={12 + 1.5 * Math.cos(rad)}
              y1={16 + 1.5 * Math.sin(rad)}
              x2={12 + 3 * Math.cos(rad)}
              y2={16 + 3 * Math.sin(rad)}
              stroke={g}
              strokeWidth="0.7"
              opacity="0.7"
            />
          );
        })}

        {/* Front wheel */}
        <circle cx="40" cy="16" r="5.5" fill={colors.navyDeep} stroke={g} strokeWidth="1.2" />
        <circle cx="40" cy="16" r="3" fill={gd} opacity="0.6" />
        <circle cx="40" cy="16" r="1.5" fill={g} opacity="0.8" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={40 + 1.5 * Math.cos(rad)}
              y1={16 + 1.5 * Math.sin(rad)}
              x2={40 + 3 * Math.cos(rad)}
              y2={16 + 3 * Math.sin(rad)}
              stroke={g}
              strokeWidth="0.7"
              opacity="0.7"
            />
          );
        })}

        {/* Door handle */}
        <rect x="20" y="10.5" width="5" height="1.2" fill={gl} opacity="0.45" rx="0.5" />
        <rect x="30" y="10.5" width="5" height="1.2" fill={gl} opacity="0.45" rx="0.5" />

        {/* Side trim line */}
        <line x1="4" y1="11" x2="46" y2="11" stroke={gl} strokeWidth="0.5" opacity="0.3" />

        {/* Motion blur lines behind car */}
        <line x1="0" y1="10" x2="-8" y2="10" stroke={g} strokeWidth="0.8" opacity="0.25" />
        <line x1="0" y1="12" x2="-12" y2="12" stroke={g} strokeWidth="0.5" opacity="0.18" />
        <line x1="0" y1="14" x2="-6" y2="14" stroke={g} strokeWidth="0.4" opacity="0.12" />
      </g>

      {/* ── Landscape elements — palm silhouettes ── */}
      {/* Left palm */}
      <line x1="22" y1="108" x2="22" y2="92" stroke={g} strokeWidth="1.5" opacity="0.3" />
      <path d="M22 92 Q16 86 12 88" stroke={g} strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M22 92 Q26 84 30 86" stroke={g} strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M22 94 Q14 90 11 93" stroke={g} strokeWidth="0.8" fill="none" opacity="0.2" />

      {/* Right palm */}
      <line x1="138" y1="108" x2="138" y2="92" stroke={g} strokeWidth="1.5" opacity="0.3" />
      <path d="M138 92 Q132 86 128 88" stroke={g} strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M138 92 Q144 84 148 86" stroke={g} strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M138 94 Q146 90 149 93" stroke={g} strokeWidth="0.8" fill="none" opacity="0.2" />

      {/* ── Moon (crescent) top right ── */}
      <path
        d="M132 26 A10 10 0 1 1 132 46 A7 7 0 1 0 132 26"
        fill={g}
        opacity="0.35"
      />

      {/* ── Sky stars ── */}
      {[
        [25, 30, 0.45], [38, 24, 0.35], [48, 36, 0.3],
        [120, 28, 0.4], [110, 38, 0.3], [142, 36, 0.35],
      ].map(([x, y, o], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill={g} opacity={o} />
      ))}
      {[
        [30, 38, 0.25], [144, 28, 0.3],
      ].map(([x, y, o], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill={g} opacity={o} />
      ))}

      {/* ── Inner ring (base of crest) ── */}
      <circle cx="80" cy="80" r="72" stroke={g} strokeWidth="0.4" fill="none" opacity="0.2" />
    </svg>
  );
}

/* ─── Stacked lockup ─── */
function StackedLogo({ colors }: { colors: Colors }) {
  const g = colors.gold;
  const gl = colors.goldLight;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <Emblem colors={colors} size={172} />

      <div style={{ textAlign: "center" }}>
        {/* Main brand name */}
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 34,
            letterSpacing: "0.14em",
            color: colors.text,
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          SK Baghel
        </div>

        {/* Ornamental rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            margin: "10px auto",
            width: 240,
          }}
        >
          <div style={{ flex: 1, height: "0.5px", background: g, opacity: 0.5 }} />
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
            <polygon points="9,0 11,4 18,5 11,6 9,10 7,6 0,5 7,4" fill={g} opacity="0.75" />
          </svg>
          <div style={{ flex: 1, height: "0.5px", background: g, opacity: 0.5 }} />
        </div>

        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 13.5,
            letterSpacing: "0.35em",
            color: colors.sub,
            textTransform: "uppercase",
          }}
        >
          Town &amp; Travels
        </div>

        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontWeight: 300,
            fontSize: 9,
            letterSpacing: "0.22em",
            color: g,
            textTransform: "uppercase",
            marginTop: 8,
            opacity: 0.65,
          }}
        >
          Agra · Est. 2010
        </div>
      </div>
    </div>
  );
}

/* ─── Horizontal lockup ─── */
function HorizontalLogo({ colors }: { colors: Colors }) {
  const g = colors.gold;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <Emblem colors={colors} size={100} />

      <div
        style={{
          width: "1px",
          height: 72,
          background: `linear-gradient(to bottom, transparent, ${g}88, transparent)`,
          flexShrink: 0,
        }}
      />

      <div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 26,
            letterSpacing: "0.12em",
            color: colors.text,
            lineHeight: 1.05,
            textTransform: "uppercase",
          }}
        >
          SK Baghel
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 10.5,
            letterSpacing: "0.3em",
            color: colors.sub,
            textTransform: "uppercase",
            marginTop: 5,
          }}
        >
          Town &amp; Travels
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontWeight: 300,
            fontSize: 8,
            letterSpacing: "0.2em",
            color: g,
            textTransform: "uppercase",
            marginTop: 5,
            opacity: 0.6,
          }}
        >
          Premium Taxi &amp; Tours · Agra
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function SKBaghelLogo({
  variant = "stacked",
  theme = "dark",
  scale = 1,
}: LogoProps) {
  const colors = PALETTE[theme];

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
      {variant === "stacked" && <StackedLogo colors={colors} />}
      {variant === "horizontal" && <HorizontalLogo colors={colors} />}
      {variant === "emblem" && <Emblem colors={colors} size={120} />}
    </div>
  );
}
