import * as React from "react";
import { cn } from "@/lib/utils";

/* ── types ───────────────────────────────────────────────────── */

export interface PortfolioScrollGridImage {
  src: string;
  alt: string;
}

export interface PortfolioScrollGridProps {
  /** Name pinned to the centre of the viewport, *behind* the photos. */
  title: React.ReactNode;
  /**
   * Photos, recycled to fill the grid. Pass 8 or more and no photo ever
   * touches a copy of itself.
   */
  images: PortfolioScrollGridImage[];
  /** Grid rows — sets how long the section scrolls. Default `8`. */
  rows?: number;
  className?: string;
  imageClassName?: string;
}

/* ── layout ──────────────────────────────────────────────────── */

const COLUMNS = 5;
const CENTER = 2;

// Every size is a multiple of --u (1% of the section width), measured off a
// 1456px-wide reference and scaled up 12% for larger photos: 393px column
// pitch, 469px row pitch, a 320×309px image box and an 82px name. One unit
// keeps the whole composition in proportion at any width with no breakpoints.
const COL = 26.98;
const ROW = 32.23;
const BOX_W = 22;
const BOX_H = 21.24;
const TITLE = 5.63;

const u = (n: number) => `calc(var(--u) * ${n})`;

// The name sits at 50vh. PHASE is where that lands inside a row, measured
// from a row gap of the half-row-dropped columns. Pulling the grid up by it
// puts a gap of columns 1 and 3 exactly behind the name, and dropping the
// centre column past it clears the centre — so the name starts uncovered at
// any viewport ratio, with photos still reaching the top edge. Browsers
// without CSS `mod()` just start with the name partly covered.
const PHASE = `mod(50vh - ${u(ROW / 2)}, ${u(ROW)})`;

/* ── component ───────────────────────────────────────────────── */

/**
 * A portfolio overview: a big name stays pinned in the middle of the screen
 * while a staggered five-column photo grid scrolls over it, so the name is
 * covered by whichever photos pass and shows through the gaps between them.
 *
 * Pure CSS — `position: sticky` does the pinning and the page's own scroll
 * moves the photos, so there is no JS, no scroll listener, and it works in
 * any scroll container (including an iframe).
 */
export function PortfolioScrollGrid({
  title,
  images,
  rows = 8,
  className,
  imageClassName,
}: PortfolioScrollGridProps) {
  return (
    <section
      className={cn("relative w-full overflow-clip bg-background", className)}
      style={
        {
          containerType: "inline-size",
          // Floored so photos stay legible on phones; the outer columns
          // simply run off the edges instead.
          "--u": "max(1cqw, 5.5px)",
        } as React.CSSProperties
      }
    >
      {/* Name layer spans the section; its sticky child holds the name at the
          viewport centre. `overflow-clip` (not `hidden`) on the section is
          what lets sticky work — `hidden` would make the section the scroller. */}
      <div className="absolute inset-0">
        <div className="sticky top-0 flex h-screen items-center justify-center px-4">
          <h2
            className="text-center font-extrabold uppercase leading-none tracking-tight text-inherit"
            style={{ fontSize: u(TITLE) }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Positioned and later in the DOM, so it paints over the name. */}
      <div
        className="relative flex justify-center"
        style={{ marginTop: `calc(${PHASE} - ${u(ROW)})` }}
      >
        {Array.from({ length: COLUMNS }, (_, c) => (
          <div
            key={c}
            className="shrink-0"
            // Odd columns drop half a row — the staggered brick layout. Only
            // transforms, so the section height stays `rows` rows and any
            // overhang is clipped at the bottom edge.
            style={{
              width: u(COL),
              transform:
                c === CENTER
                  ? `translateY(calc(50vh - ${PHASE} + ${u(ROW * 1.5)}))`
                  : c % 2
                    ? `translateY(${u(ROW / 2)})`
                    : undefined,
            }}
          >
            {Array.from({ length: rows }, (_, r) => {
              // Strides chosen so that, with 8+ photos, no photo touches a
              // copy of itself however far the centre column is dropped.
              const image =
                images[(r + c * 4 + (c === CENTER ? 3 : 0)) % images.length];
              return (
                <div
                  key={r}
                  className="flex items-center justify-center"
                  style={{ height: u(ROW) }}
                >
                  {image && (
                    // A fixed box with object-contain: landscape photos fill
                    // the width, portraits fill the height, nothing is cropped
                    // and nothing shifts while images load.
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      decoding="async"
                      className={cn("object-contain", imageClassName)}
                      style={{ width: u(BOX_W), height: u(BOX_H) }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PortfolioScrollGrid;
