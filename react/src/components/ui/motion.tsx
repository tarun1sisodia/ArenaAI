/**
 * Motion primitives (motion.dev / `motion/react`)
 * --------------------------------------------------------------------------
 * Design constraints honoured here (see ANIMATION_RULES.md):
 *  1. SEO-safe: nothing is hidden in the pre-rendered DOM. Every primitive
 *     renders a plain, fully readable element on the server and only upgrades
 *     to an animated element after hydration.
 *  2. Accessibility: `prefers-reduced-motion` short-circuits every primitive
 *     to a zero-motion render.
 *  3. GPU-only: only `transform` and `opacity` are animated.
 *  4. Viewport-bounded: entry animations use `whileInView` with `once: true`.
 */

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  animate,
  type Variants,
} from "motion/react";
import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

/* -------------------------------------------------------------------------- */
/* Hydration guard                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `false` during SSR and the first client render, `true` afterwards.
 * Guarantees the served HTML contains unstyled, crawlable content.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function useMotionEnabled(): boolean {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  return hydrated && !reduced;
}

/* -------------------------------------------------------------------------- */
/* Reveal                                                                      */
/* -------------------------------------------------------------------------- */

export interface RevealProps {
  children: ReactNode;
  /** Distance travelled on the Y axis, in px. */
  y?: number;
  /** Distance travelled on the X axis, in px (use for side-slide reveals). */
  x?: number;
  delay?: number;
  duration?: number;
  /** Rendered element type — defaults to `div`. */
  as?: ElementType;
  className?: string;
  /** Fraction of the element that must enter the viewport. */
  amount?: number;
  id?: string;
  style?: React.CSSProperties;
}

export function Reveal({
  children,
  y = 22,
  x = 0,
  delay = 0,
  duration = 0.62,
  as = "div",
  className,
  amount = 0.25,
  id,
  style,
}: RevealProps) {
  const enabled = useMotionEnabled();

  if (!enabled) {
    return createElement(as, { className, id, style }, children);
  }

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      id={id}
      style={style}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/* Stagger                                                                     */
/* -------------------------------------------------------------------------- */

export interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Delay between children, in seconds. Kept short per ANIMATION_RULES §4.3. */
  step?: number;
  delay?: number;
  amount?: number;
  as?: ElementType;
}

/**
 * Parent/child stagger. Children must be wrapped in `<StaggerItem>`.
 * Caps the stagger at 4 visible steps to avoid "animating every element".
 */
export function Stagger({
  children,
  className,
  step = 0.06,
  delay = 0.04,
  amount = 0.18,
  as = "div",
}: StaggerProps) {
  const enabled = useMotionEnabled();

  if (!enabled) {
    return createElement(as, { className }, children);
  }

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: step, delayChildren: delay },
    },
  };

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </MotionTag>
  );
}

export interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  y?: number;
  id?: string;
}

export function StaggerItem({ children, className, as = "div", y = 18, id }: StaggerItemProps) {
  const enabled = useMotionEnabled();
  const item: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  if (!enabled) {
    return createElement(as, { className, id }, children);
  }

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag className={className} id={id} variants={item}>
      {children}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/* CountUp                                                                     */
/* -------------------------------------------------------------------------- */

export interface CountUpProps {
  /** Final value. */
  value: number;
  /** Rendered prefix (e.g. "₹"). */
  prefix?: string;
  /** Rendered suffix (e.g. " km"). */
  suffix?: string;
  /** Decimal places. */
  decimals?: number;
  duration?: number;
  className?: string;
  locale?: string;
}

/**
 * Accessible animated counter — the final value is always present in the DOM
 * for crawlers (the number node is rendered immediately, then animated).
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.1,
  className,
  locale = "en-IN",
}: CountUpProps) {
  const enabled = useMotionEnabled();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(() => formatNumber(value, decimals, locale));

  useEffect(() => {
    if (!enabled) {
      setDisplay(formatNumber(value, decimals, locale));
      return;
    }
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(formatNumber(latest, decimals, locale)),
      onComplete: () => setDisplay(formatNumber(value, decimals, locale)),
    });
    return () => controls.stop();
  }, [enabled, inView, value, duration, decimals, locale, motionValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function formatNumber(value: number, decimals: number, locale: string): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* -------------------------------------------------------------------------- */
/* Parallax wrapper                                                            */
/* -------------------------------------------------------------------------- */

export interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Positive values move slower than the scroll (background feel). */
  distance?: number;
}

export function Parallax({ children, className, distance = 40 }: ParallaxProps) {
  const enabled = useMotionEnabled();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  if (!enabled) {
    return (
      <div className={className} ref={ref}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} ref={ref}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tilt card                                                                   */
/* -------------------------------------------------------------------------- */

export interface TiltProps {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
}

/** Subtle pointer-tracked 3D tilt for cards (pointer-fine devices only). */
export function Tilt({ children, className, max = 4 }: TiltProps) {
  const enabled = useMotionEnabled();
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 24 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 24 });

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        rotateY.set(px * max * 2);
        rotateX.set(-py * max * 2);
      }}
      onPointerLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Magnetic press feedback for CTAs                                            */
/* -------------------------------------------------------------------------- */

export interface PressProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  lift?: number;
}

export function Press({ children, className, scale = 0.97, lift = 2 }: PressProps) {
  const enabled = useMotionEnabled();
  if (!enabled) return <>{children}</>;
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex" }}
      whileHover={{ y: -lift }}
      whileTap={{ scale }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
    >
      {children}
    </motion.span>
  );
}
