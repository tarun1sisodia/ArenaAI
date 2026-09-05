#!/usr/bin/env python3
"""Build the SK Baghel logo suite.

Five logo concepts, each rendered as:
  {slug}-mark.svg          64x64 navy tile, art in paper + gold  (app icon / avatar)
  {slug}-mark-mono.svg     64x64 transparent, single-colour navy (stamp / invoice)
  {slug}-lockup-light.svg  mark + wordmark for paper backgrounds
  {slug}-lockup-dark.svg   mark + wordmark for navy backgrounds
  {slug}-favicon.svg       32x32 simplified tile

Wordmarks are converted to outlines from design-guide/fonts (Fraunces SemiBold +
DM Mono Medium) so every file renders identically without a webfont request.

Run:  python3 scripts/build_logos.py
Out:  assets/brand/logos/
"""
from __future__ import annotations

import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "design-guide", "fonts")
OUT = os.path.join(ROOT, "assets", "brand", "logos")

# --- tokens (DESIGN.md) -----------------------------------------------------
NAVY_DEEP = "#0B171E"
NAVY = "#10212D"
GOLD = "#E5A044"
GOLD_LIGHT = "#F3C36C"
WHITE = "#FFFDF8"
PAPER = "#F5F0E8"

_fonts: dict[str, TTFont] = {}


def font(name: str) -> TTFont:
    if name not in _fonts:
        _fonts[name] = TTFont(os.path.join(FONT_DIR, name + ".ttf"))
    return _fonts[name]


def text_outline(fontname: str, text: str, size: float, tracking: float = 0.0,
                 x: float = 0.0, y: float = 0.0) -> tuple[str, float]:
    """Return (svg path d, advance width) for `text` set on baseline y."""
    f = font(fontname)
    upem = f["head"].unitsPerEm
    scale = size / upem
    cmap = f.getBestCmap()
    glyphset = f.getGlyphSet()
    hmtx = f["hmtx"]
    space = tracking * size
    pen_x = x
    parts: list[str] = []
    for i, ch in enumerate(text):
        gname = cmap.get(ord(ch))
        if gname is None:
            pen_x += size * 0.4 + space
            continue
        spen = SVGPathPen(glyphset)
        tpen = TransformPen(spen, Transform(scale, 0, 0, -scale, pen_x, y))
        glyphset[gname].draw(tpen)
        d = spen.getCommands()
        if d:
            parts.append(d)
        pen_x += hmtx[gname][0] * scale
        if i != len(text) - 1:
            pen_x += space
    return " ".join(parts), pen_x - x


def text_width(fontname: str, text: str, size: float, tracking: float = 0.0) -> float:
    return text_outline(fontname, text, size, tracking)[1]


# --- marks ------------------------------------------------------------------
# Every mark draws inside a 64x64 box. `ink` is the primary art colour,
# `gold` the accent (set both equal for the mono cut).

def mark_roadline(ink: str, gold: str, contra: str, small: bool = False) -> str:
    """01 Roadline — a highway running to the horizon with the sun coming up
    behind it. The most literal 'we drive you there' mark of the set."""
    dashes = ('<path d="M30 44h4l.8 8.5h-5.6z" fill="%s"/>' % contra if small else
              '<path d="M30 44h4l.8 8.5h-5.6zM30.7 34h2.6l.5 6.4h-3.6zM31.3 26.6h1.4l.4 4.8h-2.2z"'
              ' fill="%s"/>' % contra)
    return f"""  <path d="M25 22a7 7 0 0 1 14 0Z" fill="{gold}"/>
  <path d="M9 55 25 22h14l16 33Z" fill="{ink}"/>
  {dashes}"""


def mark_signet(ink: str, gold: str, contra: str, small: bool = False) -> str:
    """02 Signet — Fraunces SK monogram in a hairline gold frame. Travel-desk
    stationery: embosses, stamps, and still reads at 16px."""
    size = 30 if small else 21
    base = 44 if small else 36.5
    d, w = text_outline("Fraunces-SemiBold", "SK", size, 0.015)
    d, _ = text_outline("Fraunces-SemiBold", "SK", size, 0.015, x=(64 - w) / 2, y=base)
    if small:
        return f"""  <rect x="4" y="4" width="56" height="56" rx="3" fill="none" stroke="{ink}" stroke-width="4"/>
  <path d="{d}" fill="{ink}"/>"""
    return f"""  <rect x="5.6" y="5.6" width="52.8" height="52.8" rx="3" fill="none" stroke="{ink}" stroke-width="2.6"/>
  <rect x="11" y="11" width="42" height="42" rx="2" fill="none" stroke="{gold}" stroke-width="1"/>
  <path d="{d}" fill="{ink}"/>
  <rect x="25" y="43" width="14" height="2.2" fill="{gold}"/>"""


def mark_arch(ink: str, gold: str, contra: str, small: bool = False) -> str:
    """03 Arch — the Taj onion dome and minarets over a road plinth. Says Agra
    in one glance without drawing the whole monument."""
    dome = ("M32 10c1.5 3.2 1.8 4.4 3.2 5.6 4.6 4 7.2 8.9 7.2 14.4V45H21.6V30"
            "c0-5.5 2.6-10.4 7.2-14.4C30.2 14.4 30.5 13.2 32 10Z")
    return f"""  <path d="{dome}" fill="{ink}"/>
  <rect x="12.6" y="22" width="4.6" height="23" rx="1" fill="{ink}"/>
  <rect x="46.8" y="22" width="4.6" height="23" rx="1" fill="{ink}"/>
  <circle cx="14.9" cy="20.4" r="2.7" fill="{ink}"/>
  <circle cx="49.1" cy="20.4" r="2.7" fill="{ink}"/>
  <rect x="8" y="46.6" width="48" height="3.6" rx="1.2" fill="{ink}"/>
  <path d="M32 4.6c1 2.4 1.7 3.6 1.7 4.6 0 1-.8 1.8-1.7 1.8s-1.7-.8-1.7-1.8c0-1 .7-2.2 1.7-4.6Z" fill="{gold}"/>
  {"" if small else f'<path d="M20 54h8.4v3.2H20zM35.6 54H44v3.2h-8.4z" fill="{gold}"/>'}"""


def mark_compass(ink: str, gold: str, contra: str, small: bool = False) -> str:
    """04 Compass — a navigation rose inside a wheel: tours and fleet in one
    symbol. Strongest silhouette at avatar size."""
    return f"""  <circle cx="32" cy="32" r="25" fill="none" stroke="{ink}" stroke-width="3.2"/>
  <path d="M32 7 38.4 32 32 26.4 25.6 32Z" fill="{gold}"/>
  <path d="M32 57 25.6 32 32 37.6 38.4 32Z" fill="{ink}"/>
  <circle cx="32" cy="32" r="4.2" fill="{ink}"/>
  {"" if small else f'<rect x="4" y="30.6" width="6.5" height="2.8" rx="1.4" fill="{ink}"/><rect x="53.5" y="30.6" width="6.5" height="2.8" rx="1.4" fill="{ink}"/>'}"""


def mark_milestone(ink: str, gold: str, contra: str, small: bool = False) -> str:
    """05 Milestone — the Indian highway kilometre stone, gold cap, SK cut into
    the face. The most ownable shape of the five."""
    body = (f'<path d="M13.5 56.5V29a18.5 18.5 0 0 1 37 0v27.5Z" fill="{ink}"/>'
            f'<path d="M32 10.5A18.5 18.5 0 0 1 50.5 29v4.6h-37V29A18.5 18.5 0 0 1 32 10.5Z" fill="{gold}"/>')
    if small:
        return f"""  {body}"""
    d, w = text_outline("Fraunces-SemiBold", "SK", 16, 0.02)
    d, _ = text_outline("Fraunces-SemiBold", "SK", 16, 0.02, x=(64 - w) / 2, y=50)
    return f"""  {body}
  <path d="{d}" fill="{contra}"/>
  <rect x="19.5" y="38.4" width="25" height="1.8" rx=".9" fill="{contra}" opacity=".55"/>"""


CONCEPTS = [
    ("01-roadline", "Roadline", mark_roadline,
     "A highway running to the horizon with the sun coming up behind it. The most literal \u2018we drive you there\u2019 mark of the set."),
    ("02-signet", "Signet", mark_signet,
     "Fraunces SK monogram in a hairline gold frame. Travel-desk stationery — embosses, stamps, survives 16px."),
    ("03-arch", "Arch", mark_arch,
     "Taj onion dome and minarets over a road plinth. Says Agra instantly without drawing the whole monument."),
    ("04-compass", "Compass", mark_compass,
     "Navigation rose inside a wheel: tours and fleet in one symbol. Strongest silhouette at avatar size."),
    ("05-milestone", "Milestone", mark_milestone,
     "The Indian highway kilometre stone with a gold cap. The most ownable shape of the five."),
]


# --- file writers -----------------------------------------------------------

def svg(width: float, height: float, body: str, vb: str | None = None,
        title: str = "SK Baghel Town &amp; Travels") -> str:
    vb = vb or f"0 0 {width:g} {height:g}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" '
            f'width="{width:g}" height="{height:g}" role="img" aria-label="{title}">\n'
            f'  <title>{title}</title>\n{body}\n</svg>\n')


def write(name: str, content: str) -> None:
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def wordmark(ink: str, gold: str, x: float, baseline: float) -> tuple[str, float]:
    """SK BAGHEL / TOWN & TRAVELS set in outlines. Returns (svg, width)."""
    top, w1 = text_outline("Fraunces-SemiBold", "SK BAGHEL", 27, 0.015, x=x, y=baseline)
    sub_size = 9.2
    sub, w2 = text_outline("DMMono-Medium", "TOWN & TRAVELS", sub_size, 0.16,
                           x=x + 0.6, y=baseline + 17)
    rule_y = baseline + 6.4
    body = (f'  <path d="{top}" fill="{ink}"/>\n'
            f'  <rect x="{x + 0.6:.1f}" y="{rule_y:.1f}" width="14" height="2" fill="{gold}"/>\n'
            f'  <path d="{sub}" fill="{ink}" opacity=".82"/>')
    return body, max(w1, w2 + 0.6)


def build_concept(slug: str, mark) -> None:
    # 1. tile mark — navy plate, paper art, gold accent
    write(f"{slug}-mark.svg", svg(64, 64,
          f'  <rect width="64" height="64" rx="4" fill="{NAVY_DEEP}"/>\n'
          f'  <g transform="translate(6.4 6.4) scale(0.8)">\n{mark(WHITE, GOLD_LIGHT, NAVY_DEEP)}\n  </g>'))

    # 2. mono cut — one colour, no plate
    write(f"{slug}-mark-mono.svg", svg(64, 64, mark(NAVY, NAVY, PAPER)))

    # 3/4. horizontal lockups
    for variant, bg, ink, gold, contra in (
        ("light", None, NAVY, GOLD, PAPER),
        ("dark", NAVY_DEEP, WHITE, GOLD_LIGHT, NAVY_DEEP),
    ):
        mark_size = 56.0
        gap = 19.0
        pad = 14.0
        mx = pad
        my = 12.0
        wm_x = mx + mark_size + gap
        wm, wm_w = wordmark(ink, gold, wm_x, 44.0)
        total_w = wm_x + wm_w + pad
        total_h = 80.0
        plate = (f'  <rect width="{total_w:.1f}" height="{total_h:g}" fill="{bg}"/>\n'
                 if bg else "")
        scale = mark_size / 64
        body = (plate +
                f'  <g transform="translate({mx:.1f} {my:g}) scale({scale:.5f})">\n'
                f'{mark(ink, gold, contra)}\n  </g>\n{wm}')
        write(f"{slug}-lockup-{variant}.svg", svg(round(total_w, 1), total_h, body))

    # 5. favicon
    write(f"{slug}-favicon.svg", svg(32, 32,
          f'  <rect width="32" height="32" rx="3" fill="{NAVY_DEEP}"/>\n'
          f'  <g transform="translate(2 2) scale(0.4375)">\n'
          f'{mark(WHITE, GOLD_LIGHT, NAVY_DEEP, small=True)}\n  </g>'))


# --- preview page -----------------------------------------------------------

def build_preview() -> None:
    cards = []
    for i, (slug, name, _fn, blurb) in enumerate(CONCEPTS, 1):
        cards.append(f"""
    <article class="card" id="{slug}">
      <header class="card-h">
        <span class="num">0{i}</span>
        <div>
          <h2>{name}</h2>
          <p>{blurb}</p>
        </div>
      </header>
      <div class="row">
        <div class="cell paper wide">
          <img src="{slug}-lockup-light.svg" alt="{name} lockup on paper" height="80">
          <span class="cap">Lockup · paper</span>
        </div>
        <div class="cell navy wide">
          <img src="{slug}-lockup-dark.svg" alt="{name} lockup on navy" height="80">
          <span class="cap">Lockup · navy</span>
        </div>
      </div>
      <div class="row">
        <div class="cell paper"><img src="{slug}-mark.svg" alt="" width="88"><span class="cap">Mark</span></div>
        <div class="cell paper"><img src="{slug}-mark-mono.svg" alt="" width="88"><span class="cap">Mono</span></div>
        <div class="cell paper"><img src="{slug}-mark.svg" alt="" width="40"><span class="cap">40px</span></div>
        <div class="cell paper"><img src="{slug}-favicon.svg" alt="" width="24"><span class="cap">Favicon 24px</span></div>
        <div class="cell navy"><img src="{slug}-mark.svg" alt="" width="88"><span class="cap">On navy</span></div>
      </div>
      <div class="files"><code>{slug}-lockup-light.svg</code> <code>{slug}-lockup-dark.svg</code> <code>{slug}-mark.svg</code> <code>{slug}-mark-mono.svg</code> <code>{slug}-favicon.svg</code></div>
    </article>""")

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Logo options — SK Baghel Town &amp; Travels</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=DM+Sans:wght@400;500&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap" rel="stylesheet">
<link rel="icon" href="04-compass-favicon.svg" type="image/svg+xml">
<style>
  :root {{
    --navy-deep:{NAVY_DEEP}; --navy:{NAVY}; --gold:{GOLD}; --gold-light:{GOLD_LIGHT};
    --paper:{PAPER}; --paper-lt:#FCFAF6; --white:{WHITE}; --muted:#5B656D;
    --line:rgba(16,33,45,.14);
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--paper); color:var(--navy);
    font:16px/1.6 "DM Sans",system-ui,-apple-system,Segoe UI,sans-serif; }}
  .wrap {{ max-width:1140px; margin:0 auto; padding:0 24px 96px; }}
  .top {{ background:var(--navy-deep); color:var(--white); padding:48px 0 44px; margin-bottom:48px; }}
  .top .wrap {{ padding-bottom:0; }}
  .eyebrow {{ font:11px/1 "DM Mono",ui-monospace,monospace; letter-spacing:.16em;
    text-transform:uppercase; color:var(--gold-light); }}
  h1 {{ font:500 clamp(34px,5vw,56px)/1 Fraunces,Georgia,serif; letter-spacing:-.045em; margin:14px 0 12px; }}
  h1 em {{ color:var(--gold-light); }}
  .top p {{ max-width:62ch; color:#AEB8B9; margin:0; }}
  .card {{ background:var(--paper-lt); border:1px solid var(--line); border-radius:3px;
    padding:28px; margin-bottom:28px; }}
  .card-h {{ display:flex; gap:18px; align-items:flex-start; margin-bottom:24px; }}
  .num {{ font:11px/1 "DM Mono",ui-monospace,monospace; letter-spacing:.16em; color:#8A5A17;
    border:1px solid var(--line); border-radius:999px; padding:8px 12px; }}
  h2 {{ font:500 28px/1.1 Fraunces,Georgia,serif; letter-spacing:-.03em; margin:0 0 6px; }}
  .card-h p {{ margin:0; color:var(--muted); max-width:70ch; }}
  .row {{ display:flex; flex-wrap:wrap; gap:14px; margin-bottom:14px; }}
  .cell {{ position:relative; flex:0 0 auto; min-width:150px; min-height:132px;
    display:flex; align-items:center; justify-content:center; padding:26px 22px 34px;
    border:1px solid var(--line); border-radius:3px; }}
  .cell.wide {{ flex:1 1 380px; }}
  .paper {{ background:var(--paper); }}
  .navy {{ background:var(--navy-deep); border-color:transparent; }}
  .cap {{ position:absolute; left:12px; bottom:9px;
    font:10px/1 "DM Mono",ui-monospace,monospace; letter-spacing:.14em; text-transform:uppercase;
    color:var(--muted); }}
  .navy .cap {{ color:#AEB8B9; }}
  img {{ display:block; max-width:100%; height:auto; }}
  .cell.wide img {{ height:80px; width:auto; }}
  .files {{ display:flex; flex-wrap:wrap; gap:8px; padding-top:6px; }}
  code {{ font:10px/1.8 "DM Mono",ui-monospace,monospace; letter-spacing:.06em;
    background:var(--paper); border:1px solid var(--line); border-radius:2px; padding:3px 8px;
    color:var(--muted); }}
  .note {{ border-left:2px solid var(--gold); padding:4px 0 4px 18px; color:var(--muted);
    max-width:78ch; margin:0 0 40px; }}
</style>
</head>
<body>
  <div class="top"><div class="wrap">
    <span class="eyebrow">Brand identity · Option set</span>
    <h1>Five logo <em>directions</em></h1>
    <p>SK Baghel Town &amp; Travels. All five are built from the approved Dark Navy + Golden
    system — navy {NAVY_DEEP}, gold {GOLD}, Fraunces wordmark, DM Mono descender. Each ships as a
    paper lockup, a navy lockup, a tile mark, a single-colour cut and a favicon. Pure SVG,
    text outlined, no webfont needed.</p>
  </div></div>
  <div class="wrap">
    <p class="note">Pick one and I'll wire it through the header, footer, favicon and OG banner
    in both language trees, then regenerate the site. The bolder
    <a href="../logos-bold/">transport direction (set B)</a> is the other option set.</p>
    {"".join(cards)}
  </div>
</body>
</html>
"""
    write("index.html", html)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for slug, _name, fn, _blurb in CONCEPTS:
        build_concept(slug, fn)
    build_preview()
    files = sorted(os.listdir(OUT))
    print(f"wrote {len(files)} files to assets/brand/logos/")
    for f in files:
        print("  ", f)


if __name__ == "__main__":
    main()
