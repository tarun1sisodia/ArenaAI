# Logo options — Agra SK Baghel Tour and Travels

Five logo directions, all built from the approved **Dark Navy + Golden** system in
`DESIGN.md` (navy `#0B171E`, gold `#E5A044` / `#F3C36C`, paper `#F5F0E8`,
Fraunces wordmark, DM Mono descender). Nothing here is live on the site yet —
this is the option set to choose from.

Open `index.html` (served locally, or via `python3 scripts/serve.py` at
`/assets/brand/logos/`) for the side-by-side review, or look at
`contact-sheet.png`.

## The five directions

| # | Name | Idea | Best at |
|---|------|------|---------|
| 01 | **Roadline** | Highway running to the horizon, sun rising behind it | Warmest and most literal; great on vehicle stickers |
| 02 | **Signet** | Fraunces `SK` monogram in a hairline gold frame | Most premium; embosses, stamps, invoice headers |
| 03 | **Arch** | Taj onion dome + minarets over a road plinth | Instantly "Agra"; strong for tour packages |
| 04 | **Compass** | Navigation rose inside a wheel | Best silhouette at avatar size; fleet + tours in one |
| 05 | **Milestone** | Indian highway kilometre stone with a gold cap | Most ownable / most distinctive shape |

## Files per direction

| File | Use |
|---|---|
| `{n}-lockup-light.svg` | Mark + wordmark on paper backgrounds (letterhead, invoices, light header) |
| `{n}-lockup-dark.svg` | Mark + wordmark on navy (site header, footer, OG banner) |
| `{n}-mark.svg` | 64×64 navy tile — app icon, WhatsApp DP, Google Business avatar |
| `{n}-mark-mono.svg` | Single-colour navy cut — stamps, faxes, one-colour print, embroidery |
| `{n}-favicon.svg` | 32×32 simplified cut — micro-detail dropped so it survives a browser tab |

All files are plain SVG. The wordmark is **converted to outlines** from the
licensed TTFs in `design-guide/fonts/`, so a file renders identically everywhere
with no webfont request and no font licence question at the client's end.

## Rules

- **Clear space:** one mark-height on all sides of the lockup.
- **Minimum sizes:** lockup 120px wide; mark 24px; use the favicon cut below 24px.
- **Colour:** never recolour the gold. On photography, use the dark lockup over
  the locked hero overlay, never straight on the image.
- **Don't** stretch, add shadows, outline the wordmark, or set it in another
  typeface — the outlines are the wordmark.

## Rebuilding

```bash
python3 scripts/build_logos.py    # regenerate all 25 SVGs + index.html
python3 scripts/svg_preview.py    # regenerate contact-sheet.png
```

Geometry lives in the `mark_*()` functions in `scripts/build_logos.py`; each mark
draws inside a 64×64 box and takes `(ink, gold, contra, small)` so every variant
falls out of one definition.

## Adopting one

Once a direction is picked, it replaces `BRAND_SVG` in `scripts/render_pages.py`
plus `assets/brand/favicon.svg` and the OG banner, then
`python3 scripts/render_pages.py` regenerates both language trees.
