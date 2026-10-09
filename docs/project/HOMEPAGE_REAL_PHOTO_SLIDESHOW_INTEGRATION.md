# Homepage Real-Photo Slideshow Integration Guide

**Repository:** `tarun1sisodia/ArenaAI`  
**Application:** Customer site in `react/`  
**Status:** Ready for local agent integration  
**Scope:** Image behavior only; preserve the existing homepage UI, text, CTA layout, colors, overlays, and section dimensions.

## 1. Requested behavior

Replace the single full-screen Taj Mahal hero image with a ten-image slideshow of real photographs of famous Indian places.

Required behavior:

- Use **ten real photographs**; do not use AI-generated images.
- Keep the current hero layout and overlay treatment.
- Keep the existing heading, paragraph, Call CTA, WhatsApp CTA, spacing, and responsive sizing unchanged.
- Automatically change the image every **6 seconds**.
- The user can move backward or forward by clicking and holding the left or right side of the image.
- The navigation zones are invisible: **no visible arrows, dots, buttons, or icons** on the image.
- Holding the pointer continues moving through images at a controlled repeat rate.
- Releasing the pointer stops manual movement.
- Clicking without holding changes one image in the chosen direction.
- Pause autoplay while the user is interacting with the image.
- Pause autoplay when the browser tab is hidden or the hero is off-screen.
- Respect `prefers-reduced-motion` by showing one stable image and disabling autoplay.
- Support keyboard navigation for accessibility even though no visible controls are added.
- Support touch swipe because a phone has no mouse hold interaction.

## 2. Files to add/update

### Add

```text
react/src/components/home/HomeHeroSlideshow.tsx
react/src/data/homeHeroSlides.ts
react/public/assets/home-hero/README.md
react/public/assets/home-hero/*.webp
react/public/assets/home-hero/*.avif
```

Use one local image per slide. Do not hotlink Unsplash or Wikimedia files from the browser.

### Update

```text
react/src/pages/HomePage.tsx
```

Only replace the current `<picture>` hero block around the existing `/images/hero-taj-sunrise.*` references. Do not change the surrounding section, gradients, content, or CTA markup.

The current block is in the hero section immediately after the comment:

```tsx
{/* LCP hero image — real <img> ... */}
```

### Do not update

Do not modify the current hero section classes, the gradient overlays, `HomeBookingWidget`, the trust ticker, or the other homepage sections.

## 3. Image-source and licensing policy

Images must be downloaded from their original source pages, checked by a human, and self-hosted in `react/public/assets/home-hero/`.

Do not use:

- AI-generated images;
- search-result thumbnails as production assets;
- a CDN URL copied from an image-search result;
- an image with unclear photographer/license information;
- a stock image whose license does not allow this commercial website;
- an image that contains a visible watermark.

Unsplash's official license states that images may be used for commercial and non-commercial purposes without permission or mandatory attribution, while attribution is appreciated. The official license still prohibits selling images without significant modification and prohibits compiling Unsplash images to replicate a similar or competing service. This slideshow is a travel business homepage, not an image-compilation service, but the team should keep a local credit record.

Official license reference:

- [Unsplash License](https://unsplash.com/license)
- [Unsplash guidance for landmarks and notable buildings](https://help.unsplash.com/en/articles/2612326-can-i-use-images-of-landmarks-and-notable-buildings)

### Ten recommended real-photo source pages

These are source pages, not hotlink URLs. Download the selected original file, verify that it is a real photograph, record the photographer/license information, then convert it to the local WebP/AVIF variants.

| # | Slide | Suggested source page | Local output |
|---:|---|---|---|
| 1 | Taj Mahal, Agra — sunrise/reflection | [Unsplash: Photo of Taj Mahal](https://unsplash.com/photos/photo-of-taj-mahal-_WuPjE-MPHo) | `taj-mahal-agra.webp` / `.avif` |
| 2 | Agra Fort — red sandstone fortress | [Unsplash Agra Fort search](https://unsplash.com/s/photos/agra-fort) | `agra-fort.webp` / `.avif` |
| 3 | Fatehpur Sikri — Buland Darwaza | [Unsplash Fatehpur Sikri search](https://unsplash.com/s/photos/fatehpur-sikri) | `fatehpur-sikri.webp` / `.avif` |
| 4 | Hawa Mahal, Jaipur | [Unsplash: Hawa Mahal, India at daytime](https://unsplash.com/photos/hawa-mahal-india-at-daytime-WCgioEcEVNc) | `hawa-mahal-jaipur.webp` / `.avif` |
| 5 | Amber Fort, Jaipur | [Unsplash Amber Fort search](https://unsplash.com/s/photos/amber-fort-jaipur) | `amber-fort-jaipur.webp` / `.avif` |
| 6 | India Gate, New Delhi | [Unsplash India Gate search](https://unsplash.com/s/photos/india-gate) | `india-gate-delhi.webp` / `.avif` |
| 7 | Red Fort, Old Delhi | [Unsplash Red Fort search](https://unsplash.com/s/photos/red-fort-delhi) | `red-fort-delhi.webp` / `.avif` |
| 8 | Qutub Minar, Delhi | [Unsplash Qutub Minar search](https://unsplash.com/s/photos/qutub-minar) | `qutub-minar-delhi.webp` / `.avif` |
| 9 | Varanasi Ghats / Ganga riverfront | [Unsplash Varanasi Ghats search](https://unsplash.com/s/photos/varanasi-ghats) | `varanasi-ghats.webp` / `.avif` |
| 10 | Kerala backwaters | [Unsplash Kerala backwaters search](https://unsplash.com/s/photos/kerala-backwaters) | `kerala-backwaters.webp` / `.avif` |

The source page for a search result must be replaced in the credits file with the exact selected photographer page before production. The agent must not assume that a search page itself is the final image attribution record.

### Existing repository candidates

The repository already contains several likely real-photo assets under `react/public/assets/`, including:

```text
assets/destinations/delhi-india-gate.webp
assets/destinations/delhi-red-fort.webp
assets/destinations/fatehpur-sikri.webp
assets/destinations/jaipur-hawa-mahal.webp
assets/images/qutub-minar.webp
assets/packages/agra-fort.webp
assets/packages/taj-dawn.webp
```

The agent may reuse these only after checking their actual provenance and recording the source page. Existing presence in the repository is not proof of a valid license or proof that the image is non-AI.

## 4. Image preparation requirements

Do not use remote image URLs at runtime. Prepare local responsive assets:

```text
react/public/assets/home-hero/taj-mahal-agra-480.avif
react/public/assets/home-hero/taj-mahal-agra-960.avif
react/public/assets/home-hero/taj-mahal-agra-1600.avif
react/public/assets/home-hero/taj-mahal-agra-480.webp
react/public/assets/home-hero/taj-mahal-agra-960.webp
react/public/assets/home-hero/taj-mahal-agra-1600.webp
```

Repeat the same three widths and two formats for all ten images.

Recommended target:

- source image: at least 2400px wide where available;
- hero desktop: 1600px or 1920px maximum rendered width;
- mobile: 480px or 768px variant;
- WebP quality: approximately 80–84;
- AVIF quality: approximately 55–65;
- preserve the original photograph; do not use AI upscaling or generative editing;
- crop with CSS `object-fit: cover`, not by distorting the image;
- keep each hero image below approximately 300 KB for the main desktop variant where quality permits.

Example conversion commands, after ImageMagick or Sharp is available:

```bash
# Example only; replace INPUT with a verified, licensed source file.
magick INPUT -resize '1600x1600^' -gravity center -extent 1600x900 -strip -quality 82 taj-mahal-agra-1600.webp
magick INPUT -resize '960x960^'  -gravity center -extent 960x600  -strip -quality 82 taj-mahal-agra-960.webp
magick INPUT -resize '480x480^'  -gravity center -extent 480x640  -strip -quality 82 taj-mahal-agra-480.webp
magick INPUT -resize '1600x1600^' -gravity center -extent 1600x900 -strip -quality 60 taj-mahal-agra-1600.avif
```

Do not commit the original downloaded file unless the license and repository policy permit storing it.

## 5. Add the slide data file

Create `react/src/data/homeHeroSlides.ts`:

```ts
export interface HomeHeroSlide {
  id: string;
  caption: string;
  alt: string;
  objectPosition?: string;
  avif: {
    small: string;
    medium: string;
    large: string;
  };
  webp: {
    small: string;
    medium: string;
    large: string;
  };
  sourceUrl: string;
  photographer: string;
  license: string;
}

const image = (name: string) => ({
  avif: {
    small: `/assets/home-hero/${name}-480.avif`,
    medium: `/assets/home-hero/${name}-960.avif`,
    large: `/assets/home-hero/${name}-1600.avif`,
  },
  webp: {
    small: `/assets/home-hero/${name}-480.webp`,
    medium: `/assets/home-hero/${name}-960.webp`,
    large: `/assets/home-hero/${name}-1600.webp`,
  },
});

export const HOME_HERO_SLIDES: readonly HomeHeroSlide[] = [
  {
    id: "taj-mahal-agra",
    caption: "Taj Mahal · Agra",
    alt: "Taj Mahal reflected in the long garden pool at sunrise in Agra",
    ...image("taj-mahal-agra"),
    sourceUrl: "https://unsplash.com/photos/photo-of-taj-mahal-_WuPjE-MPHo",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "agra-fort",
    caption: "Agra Fort · Mughal Heritage",
    alt: "Red sandstone walls and gateway of Agra Fort",
    ...image("agra-fort"),
    sourceUrl: "https://unsplash.com/s/photos/agra-fort",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "fatehpur-sikri",
    caption: "Fatehpur Sikri · Buland Darwaza",
    alt: "Buland Darwaza gateway at Fatehpur Sikri near Agra",
    ...image("fatehpur-sikri"),
    sourceUrl: "https://unsplash.com/s/photos/fatehpur-sikri",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "hawa-mahal-jaipur",
    caption: "Hawa Mahal · Jaipur",
    alt: "Ornate pink facade of Hawa Mahal in Jaipur",
    ...image("hawa-mahal-jaipur"),
    sourceUrl: "https://unsplash.com/photos/hawa-mahal-india-at-daytime-WCgioEcEVNc",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "amber-fort-jaipur",
    caption: "Amber Fort · Jaipur",
    alt: "Amber Fort rising above the hills near Jaipur",
    ...image("amber-fort-jaipur"),
    sourceUrl: "https://unsplash.com/s/photos/amber-fort-jaipur",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "india-gate-delhi",
    caption: "India Gate · New Delhi",
    alt: "India Gate memorial standing along the ceremonial boulevard in New Delhi",
    ...image("india-gate-delhi"),
    sourceUrl: "https://unsplash.com/s/photos/india-gate",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "red-fort-delhi",
    caption: "Red Fort · Old Delhi",
    alt: "Historic red sandstone Red Fort in Old Delhi",
    ...image("red-fort-delhi"),
    sourceUrl: "https://unsplash.com/s/photos/red-fort-delhi",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "qutub-minar-delhi",
    caption: "Qutub Minar · Delhi",
    alt: "Qutub Minar tower rising above the historic complex in Delhi",
    ...image("qutub-minar-delhi"),
    sourceUrl: "https://unsplash.com/s/photos/qutub-minar",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "varanasi-ghats",
    caption: "Varanasi · Ganga Ghats",
    alt: "Varanasi riverfront ghats along the Ganga at dusk",
    ...image("varanasi-ghats"),
    sourceUrl: "https://unsplash.com/s/photos/varanasi-ghats",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
  {
    id: "kerala-backwaters",
    caption: "Kerala · Backwaters",
    alt: "Traditional boat moving through the green Kerala backwaters",
    ...image("kerala-backwaters"),
    sourceUrl: "https://unsplash.com/s/photos/kerala-backwaters",
    photographer: "REPLACE_WITH_VERIFIED_PHOTOGRAPHER",
    license: "Unsplash License",
  },
];
```

Before merging, replace every `REPLACE_WITH_VERIFIED_PHOTOGRAPHER` and every search-page URL with the exact selected photo page.

## 6. Add the slideshow component

Create `react/src/components/home/HomeHeroSlideshow.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { HOME_HERO_SLIDES } from "../../data/homeHeroSlides";

const AUTOPLAY_MS = 6000;
const HOLD_STEP_MS = 520;

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

export function HomeHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const isInViewportRef = useRef(true);
  const touchStartXRef = useRef<number | null>(null);

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex((previous) => {
      const next = wrapIndex(previous + direction, HOME_HERO_SLIDES.length);
      return next;
    });
  }, []);

  const stopHolding = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startHolding = useCallback(
    (direction: -1 | 1) => {
      stopHolding();
      move(direction);
      holdTimerRef.current = window.setInterval(() => move(direction), HOLD_STEP_MS);
    },
    [move, stopHolding]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      if (isVisibleRef.current && isInViewportRef.current && holdTimerRef.current === null) {
        move(1);
      }
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [move, reducedMotion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewportRef.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    if (rootRef.current) observer.observe(rootRef.current);
    const onVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (document.hidden) stopHolding();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopHolding();
    };
  }, [stopHolding]);

  const handlePointerDown = (direction: -1 | 1) => {
    startHolding(direction);
  };

  const handlePointerUp = () => {
    stopHolding();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    stopHolding();
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX === null || endX === undefined) return;
    const delta = endX - startX;
    if (Math.abs(delta) < 36) return;
    move(delta < 0 ? 1 : -1);
  };

  const slide = HOME_HERO_SLIDES[activeIndex] ?? HOME_HERO_SLIDES[0];

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-0"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured destinations in India"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <picture className="absolute inset-0 block pointer-events-none" aria-hidden="true">
        <source
          type="image/avif"
          media="(max-width: 640px)"
          srcSet={`${slide.avif.small} 480w, ${slide.avif.medium} 960w`}
          sizes="100vw"
        />
        <source
          type="image/avif"
          srcSet={`${slide.avif.medium} 960w, ${slide.avif.large} 1600w`}
          sizes="100vw"
        />
        <source
          type="image/webp"
          media="(max-width: 640px)"
          srcSet={`${slide.webp.small} 480w, ${slide.webp.medium} 960w`}
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet={`${slide.webp.medium} 960w, ${slide.webp.large} 1600w`}
          sizes="100vw"
        />
        <img
          src={slide.webp.large}
          alt={slide.alt}
          fetchPriority={activeIndex === 0 ? "high" : "auto"}
          decoding="async"
          width={1600}
          height={900}
          className="h-full w-full object-cover opacity-80 contrast-105 brightness-100 transition-opacity duration-700"
          style={{ objectPosition: slide.objectPosition ?? "center 35%" }}
        />
      </picture>

      {/* Invisible interaction zones. They have no visual background, icon, or border. */}
      {!reducedMotion && (
        <>
          <div
            className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-w-resize"
            role="button"
            tabIndex={-1}
            aria-label="Previous featured destination"
            onPointerDown={() => handlePointerDown(-1)}
          />
          <div
            className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-e-resize"
            role="button"
            tabIndex={-1}
            aria-label="Next featured destination"
            onPointerDown={() => handlePointerDown(1)}
          />
        </>
      )}

      <span className="sr-only" aria-live="polite">
        {slide.caption}
      </span>
    </div>
  );
}
```

### Important implementation note

The invisible zones are intentionally rendered without visible controls. The only visual change to the current hero is the photograph. The `cursor-w-resize`/`cursor-e-resize` cursor is optional; if the requirement means absolutely no cursor change, remove those two cursor classes and keep the zones invisible.

## 7. Update `HomePage.tsx`

Add this import near the existing homepage imports:

```tsx
import { HomeHeroSlideshow } from "../components/home/HomeHeroSlideshow";
```

Replace only the current `<picture>...</picture>` block with:

```tsx
<HomeHeroSlideshow />
```

Keep the two existing overlays immediately after it unchanged:

```tsx
{/* Subtle gradient overlay to ensure text and booking form legibility while leaving ~80% of the image vividly visible */}
<div className="absolute inset-0 bg-gradient-to-r from-ink-midnight/65 via-ink-midnight/10 to-ink-midnight/10 z-0 pointer-events-none" />
<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-midnight to-transparent z-0 pointer-events-none" />
```

Do not move the slideshow outside the existing hero section. Its `absolute inset-0` positioning depends on the current `section` being `relative` and `overflow-hidden`.

## 8. Add image credits

Create `react/public/assets/home-hero/README.md`:

```md
# Homepage hero photo credits

These photographs are locally self-hosted for performance. Each row must identify the exact source photo page and photographer before production.

| File stem | Landmark | Photographer | Source photo page | License | Verified non-AI |
|---|---|---|---|---|---|
| taj-mahal-agra | Taj Mahal, Agra | TODO | TODO | Unsplash License | TODO |
| agra-fort | Agra Fort | TODO | TODO | Unsplash License | TODO |
| fatehpur-sikri | Fatehpur Sikri | TODO | TODO | Unsplash License | TODO |
| hawa-mahal-jaipur | Hawa Mahal, Jaipur | TODO | TODO | Unsplash License | TODO |
| amber-fort-jaipur | Amber Fort, Jaipur | TODO | TODO | Unsplash License | TODO |
| india-gate-delhi | India Gate, Delhi | TODO | TODO | Unsplash License | TODO |
| red-fort-delhi | Red Fort, Delhi | TODO | TODO | Unsplash License | TODO |
| qutub-minar-delhi | Qutub Minar, Delhi | TODO | TODO | Unsplash License | TODO |
| varanasi-ghats | Varanasi Ghats | TODO | TODO | Unsplash License | TODO |
| kerala-backwaters | Kerala Backwaters | TODO | TODO | Unsplash License | TODO |
```

The integration is not ready for production while any `TODO` remains in the credits record.

## 9. Tests and verification

Run from the repository root:

```bash
npm run customer:typecheck
npm run customer:build
npm test
```

If the repository uses the `react` package directly, also run:

```bash
cd react
npm run typecheck
npm run build
```

### Manual browser test

1. Open the homepage on desktop.
2. Confirm the existing headline, paragraph, CTAs, gradients, and hero height are unchanged.
3. Wait at least 18 seconds and confirm the image changes automatically.
4. Press and hold the left half of the image for two seconds. Confirm it moves backward repeatedly.
5. Release the pointer. Confirm repeated movement stops.
6. Press and hold the right half. Confirm it moves forward repeatedly.
7. Click the left or right half once. Confirm exactly one image change occurs.
8. Move the pointer away and confirm no visible button/icon/dot appeared.
9. Open browser DevTools and confirm image requests are local `/assets/home-hero/...` paths, not remote hotlinks.
10. Switch to a hidden tab and return. Confirm autoplay pauses while hidden and resumes normally after return.
11. Resize to a mobile viewport and test left/right swipe.
12. Focus the hero region with keyboard navigation and test `ArrowLeft` and `ArrowRight`.
13. Enable `prefers-reduced-motion`. Confirm the first image remains stable and autoplay is disabled.
14. Inspect the generated build output and confirm all ten referenced image variants exist.
15. Confirm the first slide is the only image with high-priority loading behavior.

### Failure conditions

Reject the integration if:

- any photo is AI-generated or provenance is unclear;
- any source URL is left as a search page in the final credits file;
- image URLs are remote at runtime;
- the hero layout or visible UI changes unexpectedly;
- the slideshow adds visible arrows, dots, buttons, or icons;
- holding the pointer causes an uncontrolled high-frequency loop;
- a failed image silently replaces the slide with a misleading image;
- the SSG build fails because the new assets are not present;
- keyboard/touch interaction breaks the existing hero CTAs.

## 10. Recommended integration sequence for the agent

1. Verify the ten selected photographs and complete `react/public/assets/home-hero/README.md`.
2. Generate local WebP and AVIF variants.
3. Add `homeHeroSlides.ts` and replace every placeholder photographer/source value.
4. Add `HomeHeroSlideshow.tsx`.
5. Replace only the old hero `<picture>` in `HomePage.tsx`.
6. Run typecheck and build before changing any styling.
7. Run the manual desktop/mobile/accessibility checklist.
8. If any visual regression appears, revert only the slideshow integration rather than changing unrelated homepage sections.
