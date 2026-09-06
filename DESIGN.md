---
version: beta
name: Clean White + Neutral Charcoal (No Blue) + Saffron Gold
description: Premium bilingual travel identity for SK Baghel Tour & Travels — Agra taxi, Tempo Traveller, and tours. Clean White canvas (#FFFFFF), crisp surfaces (#FFFFFF), neutral charcoal typography and chrome (#1A1D20, no blue tones), and warm saffron gold accents (#E5A044) with 60fps image scroll parallax engine.
colors:
  bg: "#FFFFFF"
  bg-alt: "#F8F9FA"
  surface: "#FFFFFF"
  text: "#1A1D20"
  text-soft: "#555B62"
  gold: "#E5A044"
  gold-light: "#F3C36C"
  gold-deep: "#B27123"
  gold-soft: "rgba(229, 160, 68, 0.12)"
  gold-border: "rgba(229, 160, 68, 0.28)"
  gold-wash: "#FDF7ED"
  gold-text: "#8A5A17"
  border: "rgba(0, 0, 0, 0.08)"
  navy-deep: "#121416"
  navy: "#1A1D20"
  navy-soft: "#2A2E33"
  navy-tint: "#F1F3F5"
  paper: "#FFFFFF"
  paper-lt: "#FFFFFF"
  paper-dk: "#F8F9FA"
  white: "#FFFFFF"
  muted-2: "#555B62"
  muted-lt: "#8C9298"
  coral: "#E16F4B"
  teal: "#3F7A74"
  success: "#2E7D32"
  error: "#C62828"
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

Warm Paper + Soft Slate Blue + Saffron Gold is the refined identity for SK Baghel Travels.
The mix is warm paper backgrounds (`#F5F0E8`), dark paper section alternation (`#EAE4DA`), crisp warm white card surfaces (`#FCFAF6` / `#FFFDF8`), refined Soft Slate Blue typography and chrome (`#2D3E50`), and warm saffron gold accents (`#E5A044`). The site balances comfortable warmth with executive polish.

This file is the agent-facing design spec. `css/tokens.css` must stay in lockstep with the YAML above.

## Colors

- **Background Paper (`#F5F0E8`):** Main page canvas and comfortable warm atmosphere.
- **Background Alt Paper Dark (`#EAE4DA`):** Subtle section alternation.
- **Surface Warm White (`#FCFAF6` / `#FFFDF8`):** Cards, booking panels, elevated elements.
- **Soft Slate Blue (`#2D3E50`):** Primary text, header background, dark CTAs, footer (lighter, elegant replacement for dark navy).
- **Deep Slate (`#1E2B37`):** Dark section bases, night mode canvas.
- **Mid Slate Blue (`#3B5268`):** Secondary dark surfaces, WhatsApp lead button.
- **Text Soft (`#5B6E80`):** Subtitles, meta descriptions, secondary copy.
- **Saffron Gold (`#E5A044`):** Primary CTA, key accents, focus rings, active indicators.
- **Gold Deep (`#B27123`):** Hover/active states, accessible gold on light backgrounds.
- **Gold Soft (`rgba(229, 160, 68, 0.12)`): Spotlight cards, badge backgrounds, pill highlights.
- **Border (`rgba(45, 62, 80, 0.12)`):** Dividers, subtle borders.
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
