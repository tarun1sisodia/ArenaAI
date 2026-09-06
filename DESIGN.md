---
version: beta
name: Light Premium (Ivory + Navy + Gold)
description: Premium bilingual travel identity for SK Baghel Tour & Travels — Agra taxi, Tempo Traveller, and tours. Warm ivory canvas, white cards, deep navy text/chrome, and refined gold accents.
colors:
  bg: "#FAF7F0"
  bg-alt: "#F0EBE0"
  surface: "#FFFFFF"
  text: "#0A1128"
  text-soft: "#4A5578"
  gold: "#B8941F"
  gold-deep: "#9A7B14"
  gold-soft: "rgba(184, 148, 31, 0.1)"
  gold-border: "rgba(184, 148, 31, 0.25)"
  border: "rgba(10, 17, 40, 0.08)"
  navy-deep: "#0A1128"
  navy: "#0A1128"
  navy-soft: "#142146"
  navy-tint: "#F0EBE0"
  paper: "#FAF7F0"
  paper-lt: "#FFFFFF"
  paper-dk: "#F0EBE0"
  white: "#FFFFFF"
  muted-2: "#4A5578"
  muted-lt: "#8A96B4"
  coral: "#D96A43"
  teal: "#3B7A75"
  success: "#2A7E56"
  error: "#C0392B"
typography:
  display:
    fontFamily: Fraunces
    fontWeight: 500
    letterSpacing: -0.045em
    lineHeight: 0.98

  display-hi:
    fontFamily: Noto Serif Devanagari
  sans:
    fontFamily: DM Sans
    fontWeight: 400
    fontSize: 16px
    lineHeight: 1.6
  sans-hi:
    fontFamily: Noto Sans Devanagari
  mono:
    fontFamily: DM Mono
    fontSize: 11px
    letterSpacing: 0.16em
    textTransform: uppercase
  h1:
    fontFamily: Fraunces
    fontSize: clamp(44px, 6vw, 76px)
    fontWeight: 500
  h2:
    fontFamily: Fraunces
    fontSize: clamp(32px, 4.4vw, 52px)
    fontWeight: 500
  h3:
    fontFamily: Fraunces
    fontSize: clamp(24px, 2.2vw, 28px)
    fontWeight: 500
  lead:
    fontFamily: DM Sans
    fontSize: 18px
    lineHeight: 1.55
  fare:
    fontFamily: Fraunces
    fontWeight: 600
    fontSize: clamp(30px, 3vw, 40px)
rounded:
  none: 0px
  default: 3px
  pill: 999px
spacing:
  base: 8px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  2xl: 64px
  3xl: 96px
  gutter: 24px
  container: 1140px
  header: 78px
  header-mobile: 64px
  touch: 44px
motion:
  fast: 180ms
  medium: 400ms
  slow: 1200ms
  easing: ease
  ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    rounded: "{rounded.default}"
    minHeight: 44px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.navy}"
    borderColor: "rgba(10,17,40,0.08)"
    rounded: "{rounded.default}"
    minHeight: 44px
  button-text:
    backgroundColor: transparent
    textColor: "{colors.navy}"
    borderBottom: "1px solid {colors.coral}"
  lead-call:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
  lead-wa:
    backgroundColor: "{colors.navy-soft}"
    textColor: "{colors.white}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.default}"
    borderColor: "rgba(10,17,40,0.08)"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: 2px
    minHeight: 44px
---

## Overview

Light Premium (Warm Ivory + Navy + Gold) is the approved identity for SK Baghel Travels.
The mix is ivory backgrounds (`#FAF7F0`), cream section alternation (`#F0EBE0`), crisp white card surfaces (`#FFFFFF`), deep navy typography and chrome (`#0A1128`), and refined gold accents (`#B8941F`). The site feels like an exclusive, well-run private travel desk, with smooth micro-animations that enhance trust.

This file is the agent-facing design spec. `css/tokens.css` must stay in lockstep with the YAML above.

## Colors

- **Background Ivory (`#FAF7F0`):** Main page canvas and light atmosphere.
- **Background Alt Cream (`#F0EBE0`):** Subtle section alternation.
- **Surface White (`#FFFFFF`):** Cards, booking panels, elevated elements.
- **Navy Deep / Navy (`#0A1128`):** Primary text, header background, dark CTAs, footer.
- **Navy Soft (`#142146`):** Secondary dark surfaces, WhatsApp lead button.
- **Text Soft (`#4A5578`):** Subtitles, meta descriptions, secondary copy.
- **Gold (`#B8941F`):** Primary CTA, key accents, focus rings, active indicators.
- **Gold Deep (`#9A7B14`):** Hover/active states, accessible gold on light backgrounds.
- **Gold Soft (`rgba(184, 148, 31, 0.1)`): Spotlight cards, badge backgrounds, pill highlights.
- **Border (`rgba(10, 17, 40, 0.08)`):** Dividers, subtle borders.
- **Error / Success:** Functional feedback states only.


Do not introduce a second accent. Do not use WhatsApp brand green on the lead bar.

## Typography

- **Fraunces** for h1–h3 and fares. One italic phrase per heading.
- **DM Sans** for UI and body.
- **DM Mono** for eyebrows, chips, codes (AGR → DEL).
- Hindi pages swap display → **Noto Serif Devanagari**, sans → **Noto Sans Devanagari**. Tighten tracking slightly (`-0.02em`).
- One Google Fonts request, `display=swap`. Hindi adds Noto on the same request.

## Layout

Single container **1140px**, header **78px** (64px ≤700px). Touch targets **44px**.
Radius **3px** almost everywhere; pills only for chips/filters. Grid 3 / 2 / 1
collapses at 1120px and 700px.

## Elevation & Depth

No heavy drop shadows on marketing cards. Lift on hover is `0 12px 23px rgba(22,39,48,0.14)`
and a 2px translate, 180ms. Hero uses the locked overlay
`linear-gradient(90deg, rgba(11,23,30,0.96) 0%, rgba(11,23,30,0.74) 47%, rgba(11,23,30,0.17) 100%)`.
Photo cards use the film-grain overlay, not extra borders.

## Shapes

Sharp-ish 3px radius — travel stationery, not a consumer super-app. Filters and
demo chip are pills. Do not mix large rounded-xl cards with 3px buttons.

## Components

- **Three buttons only:** primary gold, outline, text (coral underline).
- **Lead bar:** Call (gold) · WhatsApp (navy-soft) · Book (outline). Sticky on
  route pages; every marketing page on ≤700px. Hidden on `book.html`.
- **Lang switch:** gold-light outline in the header.
- **Route card:** paper-lt, city codes in Fraunces, fare + “from”.
- **Vehicle / package cards:** photo 16:10, overlay, kicker in mono.
- **Forms:** 44px inputs, gold focus ring, error border `--error`.

## Do's and Don'ts

- Do keep gold as seasoning — never a full-bleed gold section except the one gold service card.
- Don't invent hex, font sizes, or radii. Add to this file first.
- Do use Call + WhatsApp as primary conversion; payment is secondary.
- Don't load `booking.js` on marketing pages.
- Do respect `prefers-reduced-motion`.
- Don't edit files under `design-guide/` or `proposal/`.
- Do keep fares identical in EN and HI; translate copy only.
