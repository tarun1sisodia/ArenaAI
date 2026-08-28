# SK Baghel — Website Design System & UX Playbook

**Deliverable:** `SK-Baghel-Website-Design-System.pdf` — 14 pages, A4.
The build reference for the SK Baghel Town & Travels website in the approved
**Dark Navy + Golden** direction (Premium travel — Option A from proposal slide 16),
with the luxury-car + highway hero art direction.

## What's inside

| § | Section | Page |
|---|---------|------|
| 01 | Design direction — pillars, 60/25/15 rule, do/don't | 02 |
| 02 | Colour package — tokens, gradients, measured WCAG contrast matrix | 03 |
| 03 | Typography — Fraunces / DM Sans / DM Mono, scale, composition rules | 05 |
| 04 | Spacing, grid & breakpoints | 07 |
| 05 | Components — buttons, forms, cards, nav, footer (with states) | 08 |
| 06 | Imagery & iconography — hero art direction, photo treatment, icons, logo | 10 |
| 07 | Motion & interaction — 180ms system, six mandatory states | 11 |
| 08 | UX blueprint — sitemap, 5-step booking flow, trust bar | 12 |
| 09 | Accessibility, performance budget, SEO baseline, voice & tone | 13 |
| 10 | Developer handoff — drop-in `tokens.css`, structure, checklist, sign-off | 14 |

Assets: `assets/hero-banner-luxury-highway.png` (rendered hero art direction) ·
`fonts/` (licensed Google Fonts TTFs embedded in the PDF).

## Rebuilding the PDF

Requires Python 3.11+ with `reportlab` (fonts live in `fonts/`):

```bash
python3 -m venv .venv && .venv/bin/pip install reportlab
cd design-guide
../.venv/bin/python build_guide.py
```

Layout code lives in `dg_kit.py` (tokens, chrome, helpers), `pages_a.py` (pages 1–7)
and `pages_b.py` (pages 8–14).

## Notes

- Colour tokens and component specs are extracted from the proposal deck
  (`styles.css`) and renamed semantically (`--ink → --navy`, `--saffron → --gold`).
- Two AA-safe text tokens were added vs the deck: `--muted-2 #5B656D` (secondary
  text on light) and `--gold-text #8A5A17` (small gold labels on light) — see the
  contrast matrix on page 4.
