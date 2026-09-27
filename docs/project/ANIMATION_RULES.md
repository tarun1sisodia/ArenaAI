# Animation Verification Rules — SK Baghel Tour & Travels

> **Core Mandate:**
> **"Fast content + subtle motion + real HTML + excellent accessibility"**  
> *Rather than:* Lots of JavaScript + huge animations + content hidden inside effects.

This rule file is the **mandatory pre-implementation gate** before adding or modifying any animation across the website.

---

## 1. SEO & AI-SEO Safety Rules (Zero Crawler Obstruction)

- [ ] **1. Real HTML Text in Initial DOM:**
  - All critical headings (`<h1>`, `<h2>`, `<h3>`), paragraphs, fares, route names, vehicle specs, and contact details must exist as raw, semantic HTML in the initial server-rendered DOM.
  - Never render core SEO copy through JavaScript after page load.
  - Never place important text solely inside canvas, images, SVG text, or video.
- [ ] **2. No Content Hiding:**
  - Never set `display: none` or `visibility: hidden` on crawlable content for animation entry.
  - Never lock text behind opacity 0 without immediate raw HTML readability for search engine crawlers.
  - If using CSS fade-up, use GPU-friendly animations (`animation: fade-up ... forwards`) or progressive enhancement where raw HTML is fully legible without JS.
- [ ] **3. No Fake/Duplicate Text for Effects:**
  - Do not create duplicate headings or paragraphs in the DOM just to achieve split-text or rolling effects that could dilute keyword density or confuse screen readers (use `aria-hidden="true"` for decorative duplicates).

---

## 2. Performance & Payload Rules (Zero Bloat)

- [ ] **1. Vanilla Only (<3KB Budget):**
  - Zero heavy third-party animation libraries (no GSAP, Framer Motion, Three.js, Anime.js, or full Lottie).
  - All interactive motion must reside in the lightweight, modular `js/motion.js` engine (<3KB).
- [ ] **2. GPU Acceleration Only (Zero Reflows):**
  - Animate ONLY `transform` and `opacity`.
  - NEVER animate properties that trigger browser layout recalculation: `top`, `left`, `right`, `bottom`, `width`, `height`, `margin`, `padding`, or `font-size`.
  - Use `will-change: transform` sparingly on active scrolling elements only.
- [ ] **3. Viewport-Bounded Execution:**
  - All scroll-triggered effects must use `IntersectionObserver` to unobserve elements after entry or only calculate offsets for elements currently in viewport.
  - Scroll listeners must be `passive: true` and throttled via `window.requestAnimationFrame`.

---

## 3. Accessibility & Reduced-Motion Rules

- [ ] **1. Strict `prefers-reduced-motion` Compliance:**
  - Every animation, transition, floating shape, parallax transform, and particle effect MUST have an immediate zero-motion fallback:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        transform: none !important;
      }
    }
    ```
  - In `js/motion.js`, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at initialization and bypass parallax / scrambler loops.
- [ ] **2. Focus States & Readability:**
  - Focus outlines must remain crisp and accessible (`:focus-visible` with 2px gold ring).
  - Animations must never obscure contrast ratios (all text must maintain WCAG 2.2 AA contrast: 4.5:1 for body, 3:1 for large text).

---

## 4. UI & Layout Integrity Rules

- [ ] **1. Form Fields & Placeholders:**
  - Never place floating labels inside input fields if placeholders exist.
  - Labels must remain static and top-aligned above inputs (`display: block; position: static !important;`).
- [ ] **2. Navigation & Critical Paths:**
  - Navigation links, booking buttons, Call buttons, and WhatsApp buttons must never depend on animation to become clickable.
  - `<noscript>` navigation must remain fully functional.
- [ ] **3. No Excessive Motion:**
  - Avoid animating every element independently.
  - Group card reveals into subtle, staggered entries (maximum 3–4 items staggered by 40–80ms).
  - Hover elevation should stay subtle (3px to 6px upward with soft shadow).

---

## 5. Pre-Commit Verification Gate

Before committing any animation change, run:

1. **Build Gate:** `python3 scripts/render_pages.py` (must succeed with 0 errors).
2. **Crawl Gate:** `python3 scripts/check_links.py` (must pass 102/102 URLs OK).
3. **HTML Inspection:** Verify `curl -s http://localhost:4173/` contains all real text in raw HTML.
4. **Reduced Motion Test:** Emulate `prefers-reduced-motion: reduce` and verify zero jitter or broken layouts.

---

## 6. Amendment — React application (`react/`, 2026-09-15)

The rules above were written for the legacy vanilla-JS site (`js/motion.js`, `<3KB`).
The customer app is now a React 19 + Vite build with a pre-render (SSG) pass at
`scripts/prerender.ts`. The animation contract is unchanged in **intent**, and is
enforced as follows:

| Rule | How it is satisfied in `react/` |
|---|---|
| 1. Real HTML in the initial DOM | `motion.tsx` primitives render a plain element until hydration completes (`useHydrated`), so the pre-rendered HTML is never `opacity: 0`. `AnalyticsBoard` always renders the final number server-side. |
| 2. No content hiding | No `display:none` / `visibility:hidden` entry states; the CSS `.reveal` utility is progressive enhancement only (`[data-static]` escape hatch). |
| 3. Vanilla-only budget | Amended: the React app uses **motion.dev** (`motion/react`), code-split into its own chunk (`motion-*.js`) so it loads only on pages that animate. `ScrollProgress` stays dependency-free (rAF). |
| 4. GPU-only | Only `transform` / `opacity` are animated; bar fills use `scaleX`, sparklines `scaleY`. |
| 5. Viewport-bounded | `whileInView` + `viewport={{ once: true }}`; stagger capped (`Math.min(index, 6)`). |
| 6. Reduced motion | `useReducedMotion()` short-circuits every primitive, and `ui-kit.css` §14 keeps the global zero-motion fallback. |

Budget guidance for new work: keep per-page motion payloads out of the critical
chunk, prefer the shared primitives over one-off animations, and never animate
anything that must stay legible without JavaScript.
