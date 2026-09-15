/**
 * Icon — inline SVG icon system
 * --------------------------------------------------------------------------
 * A single, dependency-free stroke icon set (24×24, currentColor) used across
 * the customer site. Replaces the ad-hoc emoji that previously stood in for
 * iconography (emoji rendered at inconsistent sizes/weights and could not
 * inherit brand colour).
 *
 * Contract:
 *  - always 24×24 viewBox, 1.75 stroke, round caps/joins
 *  - colour always inherits from `currentColor`
 *  - decorative by default (`aria-hidden`); pass `title` to expose a label
 */

import type { CSSProperties, ReactElement, SVGProps } from "react";

export type IconName =
  | "phone"
  | "whatsapp"
  | "mail"
  | "map-pin"
  | "arrow-right"
  | "arrow-up-right"
  | "arrow-left"
  | "check"
  | "check-circle"
  | "close"
  | "star"
  | "compass"
  | "car"
  | "bus"
  | "route"
  | "clock"
  | "calendar"
  | "users"
  | "luggage"
  | "shield"
  | "shield-check"
  | "sparkle"
  | "sun"
  | "moon"
  | "menu"
  | "search"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "plus"
  | "minus"
  | "info"
  | "toll"
  | "gauge"
  | "rupee"
  | "trend-up"
  | "trend-down"
  | "globe"
  | "headset"
  | "battery"
  | "snowflake"
  | "baby"
  | "paw"
  | "trophy";

const PATHS: Record<IconName, ReactElement> = {
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  ),
  whatsapp: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2.5 6.5 9.5 6.5 9.5-6.5" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M9 7h8v8" />,
  "arrow-left": <path d="M20 12H4m6-6-6 6 6 6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  star: (
    <path
      d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.5Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5.2-5.2 2 2-5.2 5.2-2Z" />
    </>
  ),
  car: (
    <>
      <path d="M5 17h14M4.5 17v1.5a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V17m9.5 0v1.5a1 1 0 0 0 1 1H20a1 1 0 0 0 1-1V17" />
      <path d="M3 12.5 5 7a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 7l2 5.5v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3.5Z" />
      <path d="M4 12.5h16M7 15h1.5M15.5 15H17" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="12" rx="2" />
      <path d="M4 10h16M9 4v6M15 4v6M7 20v-2M17 20v-2M8 20h8" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M15.5 6H10a4 4 0 0 0 0 8h4a4 4 0 0 1 0 8" strokeDasharray="0 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.6M17 14.2a5.5 5.5 0 0 1 3.5 5.3" />
    </>
  ),
  luggage: (
    <>
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M10 20v1.5M14 20v1.5M9.5 11v5M14.5 11v5" />
    </>
  ),
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />,
  "shield-check": (
    <>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkle: (
    <path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9 12 3.2Z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  toll: (
    <>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-5h6v5M4 20h16M9 11h6" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="m12 14 3.5-3.5" />
    </>
  ),
  rupee: <path d="M7 5h9M7 9h9M15 5c0 4-2.5 5.5-6.5 5.5H7l7 8.5" />,
  "trend-up": <path d="M4 16.5 10 10l3.5 3.5L20 7m0 0h-4.5M20 7v4.5" />,
  "trend-down": <path d="M4 7.5 10 14l3.5-3.5L20 17m0 0h-4.5M20 17v-4.5" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4ZM20 14h-2.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1v-4Z" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="8" width="16" height="9" rx="2" />
      <path d="M21 11v3M6 11v3M10 11v3" />
    </>
  ),
  snowflake: (
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M12 6.5 9.5 4M12 6.5 14.5 4M12 17.5 9.5 20M12 17.5l2.5 2.5" />
  ),
  baby: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M10.5 7.5h.01M13.5 7.5h.01M10.5 10c1 .8 2 .8 3 0M6 20v-2a6 6 0 0 1 12 0v2" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="9" r="2" />
      <circle cx="12" cy="6.5" r="2" />
      <circle cx="17" cy="9" r="2" />
      <path d="M12 12c3 0 5 2 5 4.2 0 2-1.6 3.3-3.6 3.3h-2.8c-2 0-3.6-1.3-3.6-3.3C7 14 9 12 12 12Z" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5C4 9 6 10.5 8 10.5M16 5h2.5A1.5 1.5 0 0 1 20 6.5c0 2.5-2 4-4 4M12 12v5M8.5 20h7M10 20v-2h4v2" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Pixel size for both axes. Defaults to 18. */
  size?: number;
  /** Accessible label. When omitted the icon is hidden from assistive tech. */
  title?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 18,
  title,
  strokeWidth = 1.75,
  className,
  style,
  ...rest
}: IconProps) {
  const a11y = title
    ? ({ role: "img", "aria-label": title } as const)
    : ({ "aria-hidden": true, focusable: false } as const);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "0 0 auto", ...style }}
      {...a11y}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

/** Small square tile that holds an icon — the 21st.dev "icon chip" pattern. */
export function IconTile({
  name,
  size = 18,
  className = "icon-tile",
  tone = "gold",
}: {
  name: IconName;
  size?: number;
  className?: string;
  tone?: "gold" | "outline" | "dark";
}) {
  return (
    <span className={`${className} icon-tile--${tone}`} aria-hidden="true">
      <Icon name={name} size={size} />
    </span>
  );
}

export default Icon;
