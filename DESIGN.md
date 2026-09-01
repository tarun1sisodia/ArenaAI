---
version: alpha
name: Dark Navy + Golden
description: Premium travel identity for SK Baghel Town & Travels — Agra taxi, Tempo Traveller, and tours. Navy surfaces, warm paper, gold as seasoning.
colors:
  navy-deep: "#0B171E"
  navy: "#10212D"
  navy-soft: "#173444"
  navy-tint: "#EEF0EA"
  gold: "#E5A044"
  gold-light: "#F3C36C"
  gold-deep: "#B27123"
  gold-wash: "#FBF1DE"
  gold-text: "#8A5A17"
  paper: "#F5F0E8"
  paper-lt: "#FCFAF6"
  paper-dk: "#EAE4DA"
  white: "#FFFDF8"
  muted-2: "#5B656D"
  muted-lt: "#AEB8B9"
  coral: "#E16F4B"
  teal: "#4D8580"
  success: "#3E7C62"
  error: "#C24A33"
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
  duration: 180ms
  easing: ease
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    rounded: "{rounded.default}"
    minHeight: 44px
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.navy}"
    borderColor: "rgba(16,33,45,0.14)"
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
    backgroundColor: "{colors.paper-lt}"
    rounded: "{rounded.default}"
    borderColor: "rgba(16,33,45,0.14)"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: 2px
    minHeight: 44px
---

## Overview

Dark Navy + Golden is the approved Option A from the proposal (Premium travel).
The mix is **60 / 25 / 15**: navy surfaces, warm paper, gold as seasoning — never
as a fill. Headlines are Fraunces; one italic accent per heading in gold (on navy)
or coral (on paper). The site should feel like a well-run Agra travel desk, not a
marketplace grid.

`design-guide/` is the original 14-page PDF kit. This file is the agent-facing
spec. `css/tokens.css` must stay in lockstep with the YAML above.

## Colors

- **Navy deep / navy / navy-soft:** header, footer, hero overlay, dark sections.
- **Gold (`#E5A044`):** primary button, live clock of conversion (Call), brand mark accent. One primary gold action per cluster.
- **Gold-light:** italic accents on navy, chips.
- **Gold-text (`#8A5A17`):** small labels on paper (AA).
- **Paper / paper-lt:** page canvas.
- **Muted-2 (`#5B656D`):** secondary text on light (AA).
- **Coral:** italic accents on paper, text-button underline — not a second CTA color.
- **Error / success:** validation only, never decorative.

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
