#!/usr/bin/env python3
"""Build the SK Baghel "bold transport" logo family (Set B).

Reference language: heavy initials, a vehicle fused into the last letter,
tapered speed lines, full company name locked underneath.

Five concepts x four cuts:
  {slug}-navy.svg     brand colourway (navy + gold) on paper
  {slug}-blue.svg     transport colourway (blue + orange) on white
  {slug}-dark.svg     reversed, for navy backgrounds
  {slug}-mark.svg     compact cut, initials + vehicle only (no name line)

Letters are DM Sans Bold outlined and stroke-thickened to an ExtraBold/Black
weight (no webfont available offline), so every file is self-contained.

Run:  python3 scripts/build_logos_bold.py
Out:  assets/brand/logos-bold/
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_logos import text_outline  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "brand", "logos-bold")

INITIALS = "SKB"
COMPANY = "SK BAGHEL TOUR & TRAVELS"

# --- colourways -------------------------------------------------------------
NAVY_DEEP = "#0B171E"
PAPER = "#F5F0E8"

WAYS = {
    # slug        letters    vehicle    背景 bg     name colour
    "navy": dict(ink="#10212D", accent="#E5A044", bg=None, name="#10212D",
                 knock=PAPER, label="Navy + Gold (brand system)"),
    "blue": dict(ink="#1E3A8A", accent="#F26B21", bg="#FFFFFF", name="#1E3A8A",
                 knock="#FFFFFF", label="Blue + Orange (transport)"),
    "dark": dict(ink="#FFFDF8", accent="#F3C36C", bg=NAVY_DEEP, name="#FFFDF8",
                 knock=NAVY_DEEP, label="Reversed on navy"),
}


# --- vehicle silhouettes ----------------------------------------------------
# Each returns SVG drawn in a 100 x 43 box, right-facing, ground line at y=36.

def veh_truck(fill: str, knock: str) -> str:
    """Box truck — the reference vehicle."""
    return f"""<path d="M0 3h55v33H0z" fill="{fill}"/>
<path d="M57 11h14c3.2 0 5.6 1.1 7.6 3.6L88 26h3.4c4.4 0 7.6 2.6 7.6 6.6V36H57Z" fill="{fill}"/>
<path d="M61.5 15h13.2l6.6 8.4H61.5z" fill="{knock}"/>
<circle cx="20" cy="36.5" r="6.6" fill="{fill}"/><circle cx="20" cy="36.5" r="2.7" fill="{knock}"/>
<circle cx="79" cy="36.5" r="6.6" fill="{fill}"/><circle cx="79" cy="36.5" r="2.7" fill="{knock}"/>"""


def veh_van(fill: str, knock: str) -> str:
    """Tempo Traveller — the workhorse of the fleet."""
    return f"""<path d="M4 3h58c3.4 0 6 1 8.4 3.2L88 21.5c6.6 2 11 4.4 11 8.4V33c0 1.8-1.2 3-3 3H4c-2 0-3.4-1.2-3.4-3V6c0-1.8 1.4-3 3.4-3Z" fill="{fill}"/>
<path d="M7 9h22v10H7zM33 9h20v10H33zM57 9h6.6c1.6 0 2.6.4 3.6 1.6L74 19H57z" fill="{knock}"/>
<circle cx="24" cy="36.5" r="6.6" fill="{fill}"/><circle cx="24" cy="36.5" r="2.7" fill="{knock}"/>
<circle cx="80" cy="36.5" r="6.6" fill="{fill}"/><circle cx="80" cy="36.5" r="2.7" fill="{knock}"/>"""


def veh_suv(fill: str, knock: str) -> str:
    """Innova Crysta — the premium MPV booking."""
    return f"""<path d="M9 5h49c3.2 0 5.6.8 7.8 2.8L80 19l11 2.4c5 1.2 8 3.4 8 6.8V33c0 1.8-1.2 3-3 3H4c-2 0-3.4-1.2-3.4-3V13.4C.6 8.6 4 5 9 5Z" fill="{fill}"/>
<path d="M11.6 9h19v10.4h-19zM34.5 9h14.6v10.4H34.5zm18.6 0h5c2 0 3.4.6 5 1.8l8.8 8.6H53.1z" fill="{knock}"/>
<circle cx="25" cy="36.5" r="6.8" fill="{fill}"/><circle cx="25" cy="36.5" r="2.8" fill="{knock}"/>
<circle cx="77" cy="36.5" r="6.8" fill="{fill}"/><circle cx="77" cy="36.5" r="2.8" fill="{knock}"/>"""


def veh_sedan(fill: str, knock: str) -> str:
    """Sedan taxi — the everyday city ride."""
    return f"""<path d="M28 12c2.6-2.6 5-3.6 8.6-3.6h20c3.6 0 6.4 1.2 9 4L78 22.6l13 2.6c5 1 8 3 8 6.4V33c0 1.8-1.2 3-3 3H5c-2.4 0-4.4-1.4-4.4-3.6v-3c0-3.2 2.2-5.4 6.2-6.4L20 20.4Z" fill="{fill}"/>
<path d="M31 14.6h11.6v7.2l-19 .5zM46.4 14.6h10c2.2 0 3.8.6 5.4 2.2l5.6 5.6-21 .6z" fill="{knock}"/>
<circle cx="25" cy="36.5" r="6.6" fill="{fill}"/><circle cx="25" cy="36.5" r="2.7" fill="{knock}"/>
<circle cx="77" cy="36.5" r="6.6" fill="{fill}"/><circle cx="77" cy="36.5" r="2.7" fill="{knock}"/>"""


def veh_bus(fill: str, knock: str) -> str:
    """Urbania / mini-coach — group tours and packages."""
    return f"""<path d="M4 2h81c7.6 0 14 5.4 14 12v18.4c0 2-1.4 3.6-3.4 3.6H4c-2 0-3.4-1.6-3.4-3.6V5.6C.6 3.6 2 2 4 2Z" fill="{fill}"/>
<path d="M6 7.5h20v11.6H6zM30 7.5h20v11.6H30zM54 7.5h20v11.6H54zM78 7.5h6.4c6 0 10.4 4 10.4 9.2v2.4H78z" fill="{knock}"/>
<rect x="6" y="24" width="60" height="3.2" rx="1.6" fill="{knock}" opacity=".4"/>
<rect x="70" y="23" width="2.6" height="13" rx="1.3" fill="{knock}" opacity=".55"/>
<circle cx="22" cy="36.5" r="6.8" fill="{fill}"/><circle cx="22" cy="36.5" r="2.8" fill="{knock}"/>
<circle cx="76" cy="36.5" r="6.8" fill="{fill}"/><circle cx="76" cy="36.5" r="2.8" fill="{knock}"/>"""


def speed_lines(fill: str, x_right: float, y_top: float, n: int = 7,
                span: float = 44, step: float = 6.4, thick: float = 3.4) -> str:
    """Tapered motion streaks trailing left from x_right."""
    out = []
    for i in range(n):
        y = y_top + i * step
        # middle streaks are longest, like the reference
        k = 1 - abs(i - (n - 1) / 2) / ((n - 1) / 2)
        length = span * (0.42 + 0.58 * k)
        x0 = x_right - length
        out.append(f'<path d="M{x_right:.1f} {y:.1f}L{x0:.1f} {y + thick / 2:.1f}'
                   f'L{x0:.1f} {y - thick / 2:.1f}Z" fill="{fill}"/>')
    return "".join(out)


# --- composition ------------------------------------------------------------
# Concepts draw with the initials starting at x=0 on baseline y=BASE_Y and
# return (body, art_width, art_height). The writer then centres the art and the
# name line inside a canvas sized to whichever is wider.

BASE_Y = 116.0
GROUND = 124.0          # where the wheels touch
LETTER_SIZE = 92.0
BOLDEN = 4.0            # stroke added to DM Sans Bold to reach ~Black
NAME_SIZE = 21.0
NAME_TRACK = 0.115
PAD = 22.0


def letters(ink: str, size: float = LETTER_SIZE, text: str = INITIALS,
            tracking: float = -0.005, x: float = 0.0, y: float = BASE_Y) -> tuple[str, float]:
    d, w = text_outline("DMSans-Bold", text, size, tracking, x=x, y=y)
    return (f'<path d="{d}" fill="{ink}" stroke="{ink}" stroke-width="{BOLDEN}" '
            f'stroke-linejoin="round"/>', w)


def name_line(colour: str, cx: float, y: float, size: float = NAME_SIZE,
              text: str = COMPANY) -> tuple[str, float]:
    w = text_outline("DMSans-Bold", text, size, NAME_TRACK)[1]
    d, _ = text_outline("DMSans-Bold", text, size, NAME_TRACK, x=cx - w / 2, y=y)
    return f'<path d="{d}" fill="{colour}"/>', w


def place(vehicle, fill: str, knock: str, x: float, scale: float,
          ground: float = GROUND) -> tuple[str, float]:
    """Drop a 100x43 vehicle so its wheels rest on `ground`. Returns (svg, width)."""
    ty = ground - 43.1 * scale
    return (f'<g transform="translate({x:.1f} {ty:.1f}) scale({scale})">'
            f'{vehicle(fill, knock)}</g>', 100 * scale)


def concept_dash(c: dict) -> tuple[str, float, float]:
    """01 Dash — box truck bursting out of the B, streaks running back behind
    the initials and out the far side."""
    lead = 52.0
    g, w = letters(c["ink"], x=lead)
    vx, vs = lead + w - 6, 1.5
    veh, vw = place(veh_truck, c["accent"], c["knock"], vx, vs)
    # drawn first, so the letters stay crisp and the streaks read as motion
    lines = speed_lines(c["accent"], vx + 6, 66, 7, w + 46, 8.0, 4.0)
    return lines + g + veh, vx + vw, 140.0


def concept_tempo(c: dict) -> tuple[str, float, float]:
    """02 Tempo — stacked lockup: initials over a Tempo Traveller."""
    g, w = letters(c["ink"], 96, y=86)
    vs = 1.62
    vw = 100 * vs
    art_w = max(w, vw)
    gx = (art_w - w) / 2
    g, _ = letters(c["ink"], 96, x=gx, y=86)
    veh, _ = place(veh_van, c["accent"], c["knock"], (art_w - vw) / 2, vs, ground=166)
    lines = speed_lines(c["accent"], (art_w - vw) / 2 + 8, 118, 5, 44, 8.4, 4.6)
    return g + lines + veh, art_w, 182.0


def concept_crysta(c: dict) -> tuple[str, float, float]:
    """03 Crysta — Innova overlapping the last letter, trail behind the word."""
    lead = 62.0
    g, w = letters(c["ink"], x=lead)
    vx, vs = lead + w - 12, 1.62
    veh, vw = place(veh_suv, c["accent"], c["knock"], vx, vs)
    lines = speed_lines(c["accent"], lead - 12, 62, 6, 50, 9.0, 4.2)
    return lines + g + veh, vx + vw, 140.0


def concept_italic(c: dict) -> tuple[str, float, float]:
    """04 Italic — sheared initials and a sedan taxi: maximum speed."""
    skew = 10.0
    lead = 58.0
    shift = BASE_Y * 0.1763 + lead  # tan(10deg) — keep the baseline where we expect it
    g, w = letters(c["ink"], 90)
    g = f'<g transform="translate({shift:.1f} 0) skewX(-{skew:g})">{g}</g>'
    vx, vs = lead + w + 2, 1.46
    veh, vw = place(veh_sedan, c["accent"], c["knock"], vx, vs)
    lines = speed_lines(c["accent"], lead - 10, 60, 5, 48, 9.4, 4.2)
    return lines + g + veh, vx + vw, 140.0


def concept_road(c: dict) -> tuple[str, float, float]:
    """05 Road — a dashed road bar underlines the initials and carries the coach."""
    g, w = letters(c["ink"], 88, y=110)
    vx, vs = w + 10, 1.3
    veh, vw = place(veh_bus, c["accent"], c["knock"], vx, vs, ground=118)
    art_w = vx + vw
    bar_y = 122.0
    dashes = "".join(
        f'<rect x="{14 + i * 52:.0f}" y="{bar_y + 3.8:.1f}" width="26" height="4.4" rx="2.2" '
        f'fill="{c["knock"]}" opacity=".9"/>'
        for i in range(int((art_w - 20) // 52)))
    bar = (f'<rect x="0" y="{bar_y}" width="{art_w:.0f}" height="12" rx="6" '
           f'fill="{c["accent"]}"/>')
    lines = speed_lines(c["accent"], vx - 4, 56, 4, 44, 8.2, 3.8)
    return lines + g + bar + dashes + veh, art_w, 142.0


CONCEPTS = [
    ("01-dash", "Dash", concept_dash,
     "Box truck bursting out of the B with streaks raking back across the initials. Closest to the reference \u2014 goods, speed, distance."),
    ("02-tempo", "Tempo", concept_tempo,
     "Stacked lockup: initials over a Tempo Traveller. The only square-ish cut of the five, so it is the one that works as an avatar or a stamp."),
    ("03-crysta", "Crysta", concept_crysta,
     "Innova Crysta overlapping the last letter \u2014 low, wide, premium. Best fit for the airport and outstation trade."),
    ("04-italic", "Italic", concept_italic,
     "Sheared initials and a sedan taxi. Fastest-feeling of the five; strongest on a vehicle door or a hoarding."),
    ("05-road", "Road", concept_road,
     "A dashed road bar underlines the initials and carries the Urbania coach. Best for tours and group packages."),
]


# --- writers ----------------------------------------------------------------

def svg(w: float, h: float, body: str, bg: str | None) -> str:
    plate = f'  <rect width="{w:g}" height="{h:g}" fill="{bg}"/>\n' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" '
            f'width="{w:g}" height="{h:g}" role="img" '
            f'aria-label="SK Baghel Tour &amp; Travels">\n'
            f'  <title>SK Baghel Tour &amp; Travels</title>\n{plate}  {body}\n</svg>\n')


def write(name: str, content: str) -> None:
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)


def compose(fn, c: dict, with_name: bool = True) -> tuple[str, float, float]:
    art, art_w, art_h = fn(c)
    name_w = text_outline("DMSans-Bold", COMPANY, NAME_SIZE, NAME_TRACK)[1] if with_name else 0
    total_w = max(art_w, name_w) + 2 * PAD
    total_h = art_h + (NAME_SIZE + 30 if with_name else 0) + PAD
    body = f'<g transform="translate({(total_w - art_w) / 2:.1f} {PAD / 2:.1f})">{art}</g>'
    if with_name:
        nm, _ = name_line(c["name"], total_w / 2, art_h + PAD / 2 + NAME_SIZE + 14)
        body += nm
    return body, total_w, total_h


def build(slug: str, fn) -> None:
    for way, c in WAYS.items():
        body, w, h = compose(fn, c, with_name=True)
        write(f"{slug}-{way}.svg", svg(round(w), round(h), body, c["bg"]))
    body, w, h = compose(fn, WAYS["navy"], with_name=False)
    write(f"{slug}-mark.svg", svg(round(w), round(h), body, None))


def build_index() -> None:
    cards = []
    for i, (slug, name, _fn, blurb) in enumerate(CONCEPTS, 1):
        cards.append(f"""
    <article class="card">
      <header class="card-h"><span class="num">0{i}</span>
        <div><h2>{name}</h2><p>{blurb}</p></div></header>
      <div class="cell paper"><img src="{slug}-navy.svg" alt="{name}, navy and gold">
        <span class="cap">Navy + gold · brand system</span></div>
      <div class="cell white"><img src="{slug}-blue.svg" alt="{name}, blue and orange">
        <span class="cap">Blue + orange · transport</span></div>
      <div class="cell navy"><img src="{slug}-dark.svg" alt="{name} reversed">
        <span class="cap">Reversed on navy</span></div>
      <div class="cell paper small"><img src="{slug}-mark.svg" alt="{name} compact">
        <span class="cap">Compact · no name line</span></div>
      <div class="files"><code>{slug}-navy.svg</code> <code>{slug}-blue.svg</code>
        <code>{slug}-dark.svg</code> <code>{slug}-mark.svg</code></div>
    </article>""")

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Logo set B — bold transport — SK Baghel</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=DM+Sans:wght@400;500;700&family=Fraunces:opsz,wght@9..144,500&display=swap" rel="stylesheet">
<style>
  :root {{ --navy:#10212D; --navy-deep:#0B171E; --gold:#E5A044; --paper:#F5F0E8;
    --paper-lt:#FCFAF6; --muted:#5B656D; --line:rgba(16,33,45,.14); }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--paper); color:var(--navy);
    font:16px/1.6 "DM Sans",system-ui,sans-serif; }}
  .wrap {{ max-width:1140px; margin:0 auto; padding:0 24px 96px; }}
  .top {{ background:var(--navy-deep); color:#FFFDF8; padding:48px 0 44px; margin-bottom:44px; }}
  .top .wrap {{ padding-bottom:0; }}
  .eyebrow {{ font:11px/1 "DM Mono",monospace; letter-spacing:.16em; text-transform:uppercase; color:#F3C36C; }}
  h1 {{ font:500 clamp(34px,5vw,56px)/1 Fraunces,Georgia,serif; letter-spacing:-.045em; margin:14px 0 12px; }}
  h1 em {{ color:#F3C36C; }}
  .top p {{ max-width:66ch; color:#AEB8B9; margin:0; }}
  .card {{ background:var(--paper-lt); border:1px solid var(--line); border-radius:3px;
    padding:26px; margin-bottom:26px; }}
  .card-h {{ display:flex; gap:18px; align-items:flex-start; margin-bottom:22px; }}
  .num {{ font:11px/1 "DM Mono",monospace; letter-spacing:.16em; color:#8A5A17;
    border:1px solid var(--line); border-radius:999px; padding:8px 12px; }}
  h2 {{ font:500 28px/1.1 Fraunces,Georgia,serif; letter-spacing:-.03em; margin:0 0 6px; }}
  .card-h p {{ margin:0; color:var(--muted); max-width:74ch; }}
  .cell {{ position:relative; padding:26px 24px 36px; margin-bottom:12px;
    border:1px solid var(--line); border-radius:3px; text-align:center; }}
  .paper {{ background:var(--paper); }} .white {{ background:#fff; }}
  .navy {{ background:var(--navy-deep); border-color:transparent; }}
  .cell img {{ width:min(100%,470px); height:auto; display:inline-block; }}
  .cell.small img {{ width:min(100%,300px); }}
  .cap {{ position:absolute; left:14px; bottom:10px; font:10px/1 "DM Mono",monospace;
    letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }}
  .navy .cap {{ color:#AEB8B9; }}
  .files {{ display:flex; flex-wrap:wrap; gap:8px; padding-top:6px; }}
  code {{ font:10px/1.8 "DM Mono",monospace; background:var(--paper);
    border:1px solid var(--line); border-radius:2px; padding:3px 8px; color:var(--muted); }}
  .note {{ border-left:2px solid var(--gold); padding:4px 0 4px 18px; color:var(--muted);
    max-width:80ch; margin:0 0 36px; }}
  a {{ color:#8A5A17; }}
</style>
</head>
<body>
  <div class="top"><div class="wrap">
    <span class="eyebrow">Brand identity · Set B</span>
    <h1>Bold transport <em>direction</em></h1>
    <p>SK Baghel Tour &amp; Travels. Heavy initials, a vehicle fused into the letters,
    tapered speed lines and the full name locked underneath — the language from the
    reference, drawn for SKB. Each concept comes in the brand navy + gold, a blue +
    orange transport colourway, a reversed cut for navy, and a compact cut without the
    name line.</p>
  </div></div>
  <div class="wrap">
    <p class="note">Set A (the quieter, premium marks) is at
    <a href="../logos/">../logos/</a>. Pick a direction and a colourway and I'll wire it
    through the header, footer, favicon and OG banner in both language trees.</p>
    {"".join(cards)}
  </div>
</body>
</html>
"""
    write("index.html", html)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for slug, _n, fn, _b in CONCEPTS:
        build(slug, fn)
    build_index()
    print(f"wrote {len(os.listdir(OUT))} files to assets/brand/logos-bold/")


if __name__ == "__main__":
    main()
