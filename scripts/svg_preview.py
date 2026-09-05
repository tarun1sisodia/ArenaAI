"""QA-only SVG -> PNG rasterizer (matplotlib Agg), plus the logo contact sheet.

Not a general SVG renderer: it covers exactly the subset that
`scripts/build_logos.py` emits (g/transform translate+scale, rect with rx,
circle, path, fill/stroke/opacity). It exists so the logo suite can be eyeballed
as a single PNG without a headless browser or a system cairo.

Requires: matplotlib, pillow, numpy.

Run:  python3 scripts/svg_preview.py            # rebuild the contact sheet
      python3 scripts/svg_preview.py in.svg out.png [scale]
Out:  assets/brand/logos/contact-sheet.png
"""
import re, math, sys
import xml.etree.ElementTree as ET
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.patches import PathPatch

NS = "{http://www.w3.org/2000/svg}"
NUM = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
CMD = re.compile(r"([MmLlHhVvCcSsQqTtAaZz])")


def arc_to_beziers(x0, y0, rx, ry, phi, fa, fs, x, y):
    if rx == 0 or ry == 0:
        return [("L", (x, y))]
    phi = math.radians(phi)
    cosp, sinp = math.cos(phi), math.sin(phi)
    dx2, dy2 = (x0 - x) / 2.0, (y0 - y) / 2.0
    x1p = cosp * dx2 + sinp * dy2
    y1p = -sinp * dx2 + cosp * dy2
    rx, ry = abs(rx), abs(ry)
    lam = x1p**2 / rx**2 + y1p**2 / ry**2
    if lam > 1:
        s = math.sqrt(lam); rx *= s; ry *= s
    num = rx**2 * ry**2 - rx**2 * y1p**2 - ry**2 * x1p**2
    den = rx**2 * y1p**2 + ry**2 * x1p**2
    co = math.sqrt(max(num / den, 0))
    if fa == fs:
        co = -co
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx = cosp * cxp - sinp * cyp + (x0 + x) / 2
    cy = sinp * cxp + cosp * cyp + (y0 + y) / 2

    def ang(ux, uy, vx, vy):
        d = (ux * vx + uy * vy) / (math.hypot(ux, uy) * math.hypot(vx, vy))
        a = math.acos(max(-1, min(1, d)))
        return -a if ux * vy - uy * vx < 0 else a

    th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dth > 0:
        dth -= 2 * math.pi
    elif fs and dth < 0:
        dth += 2 * math.pi
    n = max(1, int(math.ceil(abs(dth) / (math.pi / 2))))
    out = []
    delta = dth / n
    t = 4 / 3 * math.tan(delta / 4)
    for i in range(n):
        a1 = th1 + i * delta
        a2 = a1 + delta
        p1 = (cx + rx * math.cos(a1) * cosp - ry * math.sin(a1) * sinp,
              cy + rx * math.cos(a1) * sinp + ry * math.sin(a1) * cosp)
        p2 = (cx + rx * math.cos(a2) * cosp - ry * math.sin(a2) * sinp,
              cy + rx * math.cos(a2) * sinp + ry * math.sin(a2) * cosp)
        d1 = (-rx * math.sin(a1) * cosp - ry * math.cos(a1) * sinp,
              -rx * math.sin(a1) * sinp + ry * math.cos(a1) * cosp)
        d2 = (-rx * math.sin(a2) * cosp - ry * math.cos(a2) * sinp,
              -rx * math.sin(a2) * sinp + ry * math.cos(a2) * cosp)
        out.append(("C", (p1[0] + t * d1[0], p1[1] + t * d1[1],
                          p2[0] - t * d2[0], p2[1] - t * d2[1], p2[0], p2[1])))
    return out


def parse_path(d):
    toks = [t for t in CMD.split(d) if t.strip()]
    verts, codes = [], []
    cx = cy = sx = sy = 0.0
    prev_ctrl = None
    prev_cmd = ""
    i = 0
    while i < len(toks):
        cmd = toks[i]; i += 1
        args = []
        if i < len(toks) and not CMD.fullmatch(toks[i]):
            args = [float(v) for v in NUM.findall(toks[i])]; i += 1
        rel = cmd.islower(); C = cmd.upper()
        if C == "M":
            for j in range(0, len(args), 2):
                x, y = args[j], args[j + 1]
                if rel: x, y = cx + x, cy + y
                verts.append((x, y)); codes.append(Path.MOVETO if j == 0 else Path.LINETO)
                if j == 0: sx, sy = x, y
                cx, cy = x, y
        elif C == "L":
            for j in range(0, len(args), 2):
                x, y = args[j], args[j + 1]
                if rel: x, y = cx + x, cy + y
                verts.append((x, y)); codes.append(Path.LINETO); cx, cy = x, y
        elif C == "H":
            for v in args:
                x = cx + v if rel else v
                verts.append((x, cy)); codes.append(Path.LINETO); cx = x
        elif C == "V":
            for v in args:
                y = cy + v if rel else v
                verts.append((cx, y)); codes.append(Path.LINETO); cy = y
        elif C in ("C", "S"):
            step = 6 if C == "C" else 4
            for j in range(0, len(args), step):
                a = args[j:j + step]
                if C == "C":
                    p = [(a[0], a[1]), (a[2], a[3]), (a[4], a[5])]
                    if rel: p = [(cx + px, cy + py) for px, py in p]
                else:
                    c1 = (2 * cx - prev_ctrl[0], 2 * cy - prev_ctrl[1]) if prev_ctrl and prev_cmd in "CS" else (cx, cy)
                    p2 = (a[0], a[1]); p3 = (a[2], a[3])
                    if rel: p2 = (cx + p2[0], cy + p2[1]); p3 = (cx + p3[0], cy + p3[1])
                    p = [c1, p2, p3]
                verts += p; codes += [Path.CURVE4] * 3
                prev_ctrl = p[1]; cx, cy = p[2]
        elif C in ("Q", "T"):
            step = 4 if C == "Q" else 2
            for j in range(0, len(args), step):
                a = args[j:j + step]
                if C == "Q":
                    p = [(a[0], a[1]), (a[2], a[3])]
                    if rel: p = [(cx + px, cy + py) for px, py in p]
                else:
                    c1 = (2 * cx - prev_ctrl[0], 2 * cy - prev_ctrl[1]) if prev_ctrl and prev_cmd in "QT" else (cx, cy)
                    p2 = (a[0], a[1])
                    if rel: p2 = (cx + p2[0], cy + p2[1])
                    p = [c1, p2]
                verts += p; codes += [Path.CURVE3] * 2
                prev_ctrl = p[0]; cx, cy = p[1]
        elif C == "A":
            for j in range(0, len(args), 7):
                a = args[j:j + 7]
                x, y = (cx + a[5], cy + a[6]) if rel else (a[5], a[6])
                for kind, p in arc_to_beziers(cx, cy, a[0], a[1], a[2], int(a[3]), int(a[4]), x, y):
                    if kind == "L":
                        verts.append(p); codes.append(Path.LINETO)
                    else:
                        verts += [(p[0], p[1]), (p[2], p[3]), (p[4], p[5])]
                        codes += [Path.CURVE4] * 3
                cx, cy = x, y
        elif C == "Z":
            verts.append((sx, sy)); codes.append(Path.CLOSEPOLY); cx, cy = sx, sy
        prev_cmd = C
    return Path(np.array(verts), np.array(codes))


def rect_path(x, y, w, h, rx):
    if rx <= 0:
        return parse_path(f"M{x} {y}H{x+w}V{y+h}H{x}Z")
    r = min(rx, w / 2, h / 2)
    return parse_path(
        f"M{x+r} {y}H{x+w-r}A{r} {r} 0 0 1 {x+w} {y+r}"
        f"V{y+h-r}A{r} {r} 0 0 1 {x+w-r} {y+h}"
        f"H{x+r}A{r} {r} 0 0 1 {x} {y+h-r}"
        f"V{y+r}A{r} {r} 0 0 1 {x+r} {y}Z")


def circle_path(cx, cy, r):
    k = 0.5523 * r
    return parse_path(
        f"M{cx} {cy-r}C{cx+k} {cy-r} {cx+r} {cy-k} {cx+r} {cy}"
        f"C{cx+r} {cy+k} {cx+k} {cy+r} {cx} {cy+r}"
        f"C{cx-k} {cy+r} {cx-r} {cy+k} {cx-r} {cy}"
        f"C{cx-r} {cy-k} {cx-k} {cy-r} {cx} {cy-r}Z")


def apply_tf(path, tf):
    if not tf:
        return path
    v = path.vertices.copy()
    for op, args in reversed(tf):
        if op == "translate":
            v[:, 0] += args[0]; v[:, 1] += args[1 if len(args) > 1 else 0]
        elif op == "scale":
            sx = args[0]; sy = args[1] if len(args) > 1 else sx
            v[:, 0] *= sx; v[:, 1] *= sy
    return Path(v, path.codes)


def parse_tf(s):
    out = []
    for name, body in re.findall(r"(translate|scale)\(([^)]*)\)", s or ""):
        out.append((name, [float(x) for x in NUM.findall(body)]))
    return out


def render(svg_file, out_png, scale=4, bg=None):
    tree = ET.parse(svg_file)
    root = tree.getroot()
    vb = [float(x) for x in root.get("viewBox").split()]
    W, H = vb[2], vb[3]
    dpi = 100.0
    fig = plt.figure(figsize=(W * scale / dpi, H * scale / dpi), dpi=dpi)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(H, 0); ax.axis("off")
    if bg:
        fig.patch.set_facecolor(bg)
    else:
        fig.patch.set_alpha(0)
    lw_factor = scale * 72.0 / dpi

    def walk(node, tf):
        tf = tf + parse_tf(node.get("transform"))
        tag = node.tag.replace(NS, "")
        p = None
        if tag == "path" and node.get("d"):
            p = parse_path(node.get("d"))
        elif tag == "rect":
            p = rect_path(float(node.get("x", 0)), float(node.get("y", 0)),
                          float(node.get("width")), float(node.get("height")),
                          float(node.get("rx", 0)))
        elif tag == "circle":
            p = circle_path(float(node.get("cx", 0)), float(node.get("cy", 0)), float(node.get("r")))
        if p is not None:
            fill = node.get("fill", "#000")
            stroke = node.get("stroke")
            sw = float(node.get("stroke-width", 1))
            op = float(node.get("opacity", 1))
            ax.add_patch(PathPatch(apply_tf(p, tf),
                                   facecolor="none" if fill in (None, "none") else fill,
                                   edgecolor="none" if not stroke else stroke,
                                   linewidth=0 if not stroke else sw * lw_factor,
                                   alpha=op, antialiased=True))
        for ch in node:
            walk(ch, tf)

    for ch in root:
        walk(ch, [])
    fig.savefig(out_png, dpi=dpi, transparent=bg is None)
    plt.close(fig)
    return W, H


PAPER_RGB = (245, 240, 232, 255)
SLUGS = ["01-roadline", "02-signet", "03-arch", "04-compass", "05-milestone"]


def contact_sheet(out_png="assets/brand/logos/contact-sheet.png"):
    """Rasterise every logo variant into one review PNG."""
    import os
    from PIL import Image
    tmp = "/tmp/_logo_png"
    os.makedirs(tmp, exist_ok=True)
    rows = []
    for slug in SLUGS:
        tiles = []
        for suf, bg, sc in (("lockup-light", "#F5F0E8", 4), ("lockup-dark", None, 4),
                            ("mark", "#F5F0E8", 4), ("mark-mono", "#F5F0E8", 4),
                            ("favicon", "#F5F0E8", 3)):
            src = f"assets/brand/logos/{slug}-{suf}.svg"
            png = f"{tmp}/{slug}-{suf}.png"
            render(src, png, scale=sc, bg=bg)
            im = Image.open(png).convert("RGBA")
            plate = Image.new("RGBA", im.size, PAPER_RGB)
            plate.alpha_composite(im)
            tiles.append(plate.convert("RGB"))
        h = max(t.height for t in tiles)
        w = sum(t.width for t in tiles) + 30 * len(tiles)
        row = Image.new("RGB", (w, h + 30), "#CFC9C0")
        x = 15
        for t in tiles:
            row.paste(t, (x, (h + 30 - t.height) // 2))
            x += t.width + 30
        rows.append(row)
    W = max(r.width for r in rows)
    H = sum(r.height for r in rows)
    sheet = Image.new("RGB", (W, H), "#CFC9C0")
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height
    sheet.thumbnail((1600, 6000))
    sheet.save(out_png)
    print(f"wrote {out_png} {sheet.size[0]}x{sheet.size[1]}")


if __name__ == "__main__":
    if len(sys.argv) > 2:
        render(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 4)
    else:
        contact_sheet()
