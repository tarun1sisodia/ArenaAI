# Logo set B — bold transport

The direction from the client reference: **heavy initials, a fleet vehicle fused
into the letters, tapered speed lines, and the full company name locked
underneath.** Drawn for **SKB — SK Baghel Town & Travels**.

Set A (the quieter, symbol-led marks) lives in `../logos/`.
Open `index.html` for the review page, or `contact-sheet.png` for everything at once.

## The five concepts

| # | Name | Vehicle | Why it might win |
|---|------|---------|------------------|
| 01 | **Dash** | Box truck | Closest to the reference. Streaks run behind the initials and out the far side |
| 02 | **Tempo** | Tempo Traveller | The only **stacked** lockup — the one that works as a square avatar or a stamp |
| 03 | **Crysta** | Innova Crysta MPV | Low, wide, premium — matches the airport and outstation trade |
| 04 | **Italic** | Sedan taxi | Sheared 10° — fastest-feeling; strongest on a car door or a hoarding |
| 05 | **Road** | Urbania mini-coach | A dashed road bar underlines the initials — best for tours and packages |

## Four cuts per concept

| File | Use |
|---|---|
| `{n}-navy.svg` | **Brand colourway** — navy `#10212D` + gold `#E5A044`, on paper. Keeps the site's system intact |
| `{n}-blue.svg` | **Transport colourway** — blue `#1E3A8A` + orange `#F26B21` on white, like the reference |
| `{n}-dark.svg` | Reversed on navy `#0B171E` — site header, footer, OG banner |
| `{n}-mark.svg` | Compact cut with the name line removed — small placements, app icons, stickers |

## Notes

- **Type:** DM Sans Bold, outlined and stroke-thickened by 4 units to reach an
  ExtraBold/Black weight (Google Fonts is unreachable from the build sandbox, so
  the weight is synthesised rather than downloaded). If you want a true Black
  geometric face later — Montserrat ExtraBold, Archivo Black — drop the TTF into
  `design-guide/fonts/` and change `letters()` in `scripts/build_logos_bold.py`.
- **Colour:** the blue/orange colourway is *off* the current design system. If
  it's chosen, `DESIGN.md` and `css/tokens.css` need a Decision Log entry and a
  palette update first — don't run it alongside navy + gold.
- **Vehicles** are hand-built paths in a 100 × 43 box (`veh_truck`, `veh_van`,
  `veh_suv`, `veh_sedan`, `veh_bus`), so any concept can swap vehicles in one line.
- **Clear space:** half the cap height of the initials on all sides.
- **Minimum size:** 150px wide with the name line; use the compact cut below that.

## Rebuilding

```bash
python3 scripts/build_logos_bold.py     # 20 SVGs + index.html
python3 scripts/svg_preview.py bold     # contact-sheet.png
```
