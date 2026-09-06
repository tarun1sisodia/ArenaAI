"""Pages 1-7 of the SK Baghel website design system guide."""
import os
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
import reportlab.lib.colors as rc
from dg_kit import *

BANNER = os.path.join(ASSETS, "hero-banner-luxury-highway.png")

# ---------------------------------------------------------------- cover
def p01_cover(c, pg):
    c.setFillColor(NAVY_DEEP); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setStrokeColor(GOLD); c.setLineWidth(2); c.line(MARGIN, PAGE_H - 34, MARGIN + 30, PAGE_H - 34)
    c.setStrokeColor(LINE_LIGHT); c.setLineWidth(0.7); c.line(MARGIN + 36, PAGE_H - 34, PAGE_W - MARGIN, PAGE_H - 34)
    brand_lockup(c, MARGIN, PAGE_H - 66, light=True)
    rtext(c, PAGE_W - MARGIN, PAGE_H - 60, "WEBSITE PROJECT", "DMMono-Medium", 6.8, GOLD_LIGHT, tracking=1.2)
    rtext(c, PAGE_W - MARGIN, PAGE_H - 71, "PRODUCT & UI/UX DELIVERABLE", "DMMono", 5.8, MUTED_LT, tracking=1.0)

    eyebrow(c, MARGIN + 2, PAGE_H - 126, "DESIGN SYSTEM & UX PLAYBOOK — V1.0 — AUGUST 2026", GOLD_LIGHT, 7.4)

    st = ParagraphStyle("t", fontName="Fraunces", fontSize=39, leading=41.5, textColor=WHITE)
    p = Paragraph('One brand. One system.<br/><i><font color="#F3C36C">Every pixel accounted for.</font></i>', st)
    w, h = p.wrapOn(c, CONTENT_W, 200); p.drawOn(c, MARGIN, PAGE_H - 136 - h)

    intro_top = PAGE_H - 136 - h - 14
    para(c, "The complete reference for designing and building the <b>SK Baghel Tour &amp; Travels</b> "
            "website — the approved <b>Dark Navy + Golden</b> premium direction: colour tokens, typography scale, "
            "spacing, components, imagery, motion, accessibility and page-by-page UX blueprints.",
         MARGIN, intro_top, 392, "DMSans", 9.3, 14.2, MUTED_LT)

    # contents index (fills middle band)
    toc_top = intro_top - 84
    block_label(c, MARGIN + 2, toc_top, "INSIDE THIS DOCUMENT", GOLD_LIGHT)
    toc = [("01", "Design direction", "02"), ("06", "Imagery & icons", "10"),
           ("02", "Colour package", "03"), ("07", "Motion & states", "11"),
           ("03", "Typography", "05"), ("08", "UX blueprint", "12"),
           ("04", "Spacing & grid", "07"), ("09", "Quality gates", "13"),
           ("05", "Components", "08"), ("10", "Dev handoff", "14")]
    for i, (n, t, pno) in enumerate(toc):
        x = MARGIN + 2 + (i % 2) * 210
        yy = toc_top - 16 - (i // 2) * 17
        text(c, x, yy, n, "DMMono-Medium", 6.8, GOLD, tracking=0.5)
        text(c, x + 22, yy, t, "DMSans-Medium", 7.8, WHITE)
        rtext(c, x + 186, yy, "p." + pno, "DMMono", 6.4, MUTED_LT)
        rule(c, x, yy - 6, 186, Color(1, 1, 1, alpha=0.07), 0.5)

    # meta strip (anchored above the banner)
    img_y, img_h = 78, 252
    my = img_y + img_h + 42
    meta = [("DESIGN DIRECTION", "Premium travel — Option A"),
            ("PALETTE", "Navy · gold · warm white"),
            ("HERO BANNER", "Luxury car + highway, dusk"),
            ("TYPE", "Fraunces · DM Sans · DM Mono")]
    mx = MARGIN
    for i, (k, v) in enumerate(meta):
        text(c, mx, my, k, "DMMono-Medium", 6.0, GOLD_LIGHT, tracking=1.0)
        text(c, mx, my - 12.5, v, "DMSans-Medium", 7.6, WHITE)
        if i < 3:
            vrule(c, mx + 122, my - 16, 21, LINE_LIGHT, 0.7)
        mx += 132

    # banner image with navy overlay (copy-safe left)
    tw = CONTENT_W
    c.saveState()
    c.setFillColor(NAVY_SOFT); c.roundRect(MARGIN, img_y, tw, img_h, 4, fill=1, stroke=0)
    pth = c.beginPath(); pth.roundRect(MARGIN, img_y, tw, img_h, 4); c.clipPath(pth, stroke=0, fill=0)
    img = ImageReader(BANNER)
    iw, ih = img.getSize()
    sc = max(tw / iw, img_h / ih)
    c.drawImage(img, MARGIN + (tw - iw * sc) / 2, img_y + (img_h - ih * sc) / 2, iw * sc, ih * sc)
    c.setFillColor(rc.Color(11/255, 23/255, 30/255, alpha=0.62))
    c.rect(MARGIN, img_y, tw * 0.46, img_h, fill=1, stroke=0)
    c.restoreState()
    block_label(c, MARGIN + 16, img_y + img_h - 26, "APPROVED HERO ART DIRECTION", GOLD_LIGHT)
    para(c, "Luxury sedan on an open highway at dusk — navy tones, golden light, dark copy-safe zone on the left.",
         MARGIN + 16, img_y + img_h - 38, 224, "DMSans", 7.8, 11, WHITE)
    chip(c, MARGIN + 16, img_y + 14, "21:9 · PHOTO + NAVY OVERLAY", GOLD_LIGHT, size=5.6)

    # bottom strip
    c.setFillColor(Color(1, 1, 1, alpha=0.045)); c.rect(0, 0, PAGE_W, 54, fill=1, stroke=0)
    rule(c, MARGIN, 54, CONTENT_W, LINE_LIGHT, 0.7)
    text(c, MARGIN, 37, "PREPARED BY", "DMMono-Medium", 5.6, MUTED_LT, tracking=1.0)
    text(c, MARGIN, 25, "Product & UI/UX Manager — website project", "DMSans-Medium", 8, WHITE)
    text(c, PAGE_W - 300, 37, "STATUS", "DMMono-Medium", 5.6, MUTED_LT, tracking=1.0)
    text(c, PAGE_W - 300, 25, "Direction approved — ready for build", "DMSans-Medium", 8, GOLD_LIGHT)
    rtext(c, PAGE_W - MARGIN, 37, "DOCUMENT", "DMMono-Medium", 5.6, MUTED_LT, tracking=1.0)
    rtext(c, PAGE_W - MARGIN, 25, "14 pages · v1.0", "DMSans-Medium", 8, WHITE)

# ---------------------------------------------------------- 01 direction
def p02_direction(c, pg):
    content_header(c, 1, "Design direction")
    y = section_title(c, PAGE_H - 66, 1,
        'Dark navy &amp; golden —<br/><i><font color="#E16F4B">premium, clean, modern.</font></i>',
        "Of the three moods in the proposal (slide 16), <b>Option A — Premium Travel</b> is approved: deep blue, gold and "
        "warm white, destination-led photography. This page is the filter for every design decision.")

    cw = (CONTENT_W - 20) / 3
    labels = [("OPTION A — CHOSEN", "Premium travel", "Deep navy, gold &amp; white. Destination-led photos, editorial serif headlines, quiet luxury.", NAVY, WHITE, True),
              ("OPTION B — PARKED", "Modern travel", "Bright blue &amp; orange, bold lively cards. Too loud for premium positioning.", CARD_LT, NAVY, False),
              ("OPTION C — PARKED", "Clean professional", "Navy &amp; white, minimal accent. Safe, but misses the brand's golden warmth.", CARD_LT, NAVY, False)]
    cy = y - 130
    for i, (tag, name, desc, bg, fg, chosen) in enumerate(labels):
        x = MARGIN + i * (cw + 10)
        rect(c, x, cy, cw, 122, bg, GOLD if chosen else None, 1.4 if chosen else 0.9, r=3)
        if chosen:
            rect(c, x, cy + 119, cw, 3, GOLD)
        text(c, x + 14, cy + 100, tag, "DMMono-Medium", 6.0, GOLD_LIGHT if chosen else MUTED, tracking=0.8)
        st = ParagraphStyle("n", fontName="Fraunces", fontSize=14.5, leading=16.5, textColor=fg)
        p = Paragraph(name, st); pw, ph = p.wrapOn(c, cw - 28, 40); p.drawOn(c, x + 14, cy + 78)
        para(c, desc, x + 14, cy + 66, cw - 28, "DMSans", 7.3, 10, MUTED_LT if chosen else MUTED)
        if chosen:
            chip(c, x + 14, cy + 12, "APPROVED — BUILD THIS", GOLD_LIGHT, size=5.6)

    ly = cy - 34
    block_label(c, MARGIN, ly, "Brand pillars — what the site must feel like")
    pillars = [("Premium", "Chauffeur-grade polish. No clutter, generous space."),
               ("Clean", "One idea per screen, one obvious next action."),
               ("Modern", "Fluid type, real photography, subtle 180ms motion."),
               ("Trustworthy", "Transparent fares, visible contact, payment trail.")]
    pw = (CONTENT_W - 30) / 4
    for i, (t, d) in enumerate(pillars):
        x = MARGIN + i * (pw + 10)
        rect(c, x, ly - 84, pw, 74, PAPER, LINE_INK, 0.9, r=3)
        sparkle(c, x + 13, ly - 34, 3.6, GOLD_DEEP)
        text(c, x + 22, ly - 38, t, "DMSans-Bold", 9.2, NAVY)
        para(c, d, x + 12, ly - 46, pw - 24, "DMSans", 7.0, 9.6, MUTED)

    ry = ly - 124
    block_label(c, MARGIN, ry, "Colour balance on every screen — the 60 / 25 / 15 rule")
    bw = CONTENT_W - 250
    seg = [(0.60, NAVY, "60% NAVY & DARK SURFACES"), (0.25, PAPER_DK, "25% WARM PAPER"), (0.15, GOLD, "15% GOLD (MAX)")]
    sx = MARGIN
    for frac, colr, lab in seg:
        rect(c, sx, ry - 28, bw * frac - 2, 16, colr, r=1.5)
        text(c, sx, ry - 42, lab, "DMMono-Medium", 5.6, NAVY, tracking=0.4)
        sx += bw * frac
    text(c, MARGIN + bw + 14, ry - 18, "Gold is the seasoning,", "DMSans-Medium", 8.6, GOLD_DEEP)
    text(c, MARGIN + bw + 14, ry - 30, "never the main course.", "DMSans-Medium", 8.6, GOLD_DEEP)
    para(c, "If a screen feels loud, reduce gold first — premium comes from restraint.",
         MARGIN + bw + 14, ry - 36, 232, "DMSans", 7.4, 10.2, MUTED)

    dy = ry - 82
    block_label(c, MARGIN, dy, "Do / don't — the fast quality check")
    colw = (CONTENT_W - 16) / 2
    dos = ["Full-viewport hero: luxury car + highway photo under a navy overlay",
           "Fraunces serif headlines; gold italic on one key phrase",
           "True black-navy (#0B171E) surfaces, warm paper sections between",
           "Real fleet photos, graded to the navy/gold palette"]
    donts = ["No orange-red CTAs or blue-purple gradients — off palette",
             "No system-ui fallbacks — self-host the three fonts",
             "No pure #000 black or pure #FFF white — use warm variants",
             "No clip-art cars or generic handshake stock photos"]
    rect(c, MARGIN, dy - 134, colw, 126, PAPER, LINE_INK, 0.9, r=3)
    rect(c, MARGIN + colw + 16, dy - 134, colw, 126, PAPER, LINE_INK, 0.9, r=3)
    for i, d in enumerate(dos):
        yy = dy - 24 - i * 27
        check(c, MARGIN + 14, yy - 1.5, 5)
        para(c, d, MARGIN + 28, yy + 5.5, colw - 44, "DMSans", 7.6, 10.4, NAVY)
    for i, d in enumerate(donts):
        yy = dy - 24 - i * 27
        cross(c, MARGIN + colw + 30, yy - 1.5, 5)
        para(c, d, MARGIN + colw + 44, yy + 5.5, colw - 44, "DMSans", 7.6, 10.4, NAVY)
    content_footer(c, pg)

# ---------------------------------------------------------- 02 color core
def swatch(c, x, y, w, h, fill, name, hexs, token, usage):
    rect(c, x, y, w, h, PAPER_LT, LINE_INK, 0.8, r=3)
    sh = 40
    rect(c, x, y + h - sh, w, sh, fill)
    # hairline around very light fills so edges stay visible
    lum = 0.2126 * fill.red + 0.7152 * fill.green + 0.0722 * fill.blue
    if lum > 0.75:
        rect(c, x, y + h - sh, w, sh, None, LINE_INK, 0.6)
    text(c, x + 9, y + h - sh - 13, name, "DMSans-Bold", 8.4, NAVY)
    text(c, x + 9, y + h - sh - 24, hexs + "  ·  " + token, "DMMono-Medium", 5.9, GOLD_DEEP)
    para(c, usage, x + 9, y + h - sh - 28, w - 18, "DMSans", 6.7, 8.8, MUTED)

def p03_color(c, pg):
    content_header(c, 2, "Color package")
    y = section_title(c, PAGE_H - 66, 2,
        'The colour package —<br/><i><font color="#B27123">navy first, gold second.</font></i>',
        "Every token ships as a CSS variable (handoff, p.14). Tokens are renamed from the proposal deck "
        "(<font face='DMMono-Medium'>--ink</font> becomes <font face='DMMono-Medium'>--navy</font>, "
        "<font face='DMMono-Medium'>--saffron</font> becomes <font face='DMMono-Medium'>--gold</font>); "
        "hex values are unchanged.")
    cols, gx = 4, 10
    w = (CONTENT_W - (cols - 1) * gx) / cols
    h = 94

    def row(lab, items, yy):
        block_label(c, MARGIN, yy, lab)
        for i, it in enumerate(items):
            swatch(c, MARGIN + i * (w + gx), yy - h - 10, w, h, *it)
        return yy - h - 10

    y2 = row("Navy scale — structure, header, footer, text", [
        (NAVY_DEEP, "Navy Deep", "#0B171E", "--navy-deep", "Page bg, header, footer, hero overlays — the night-highway base."),
        (NAVY, "Navy", "#10212D", "--navy", "Primary text on light; dark sections and card surfaces."),
        (NAVY_SOFT, "Navy Soft", "#173444", "--navy-soft", "Raised panels on navy: booking widget, admin views."),
        (CARD_LT, "Navy Tint", "#EEF0EA", "--navy-tint", "Light card surface with a cool cast (services, tables).")], y)
    y3 = row("Gold scale — actions & accents only", [
        (GOLD, "Gold", "#E5A044", "--gold", "Primary CTA fill, active states, fares, ratings, keylines."),
        (GOLD_LIGHT, "Gold Light", "#F3C36C", "--gold-light", "Accent text and italic headline words on navy only."),
        (GOLD_DEEP, "Gold Deep", "#B27123", "--gold-deep", "CTA hover/darken; graphic accents on paper."),
        (HexColor("#FBF1DE"), "Gold Wash", "#FBF1DE", "--gold-wash", "Tinted panels: fare summary, offers strip.")], y2 - 26)
    y4 = row("Warm neutrals — light surfaces & muted text", [
        (PAPER, "Paper", "#F5F0E8", "--paper", "Default light page background between navy sections."),
        (PAPER_LT, "Paper Light", "#FCFAF6", "--paper-light", "Cards, form fields, elevated surfaces on paper."),
        (PAPER_DK, "Paper Dark", "#EAE4DA", "--paper-dark", "Inset panels, note blocks, zebra rows, dividers."),
        (WHITE, "Warm White", "#FFFDF8", "--white", "Headline text on navy. Never use pure #FFFFFF.")], y3 - 26)

    block_label(c, MARGIN, y4 - 28, "Supporting accents — editorial & information")
    swatch(c, MARGIN, y4 - 28 - 104, w, h, CORAL, "Coral", "#E16F4B", "--coral",
           "Italic serif accent inside light headlines; tiny editorial marks.")
    swatch(c, MARGIN + w + gx, y4 - 28 - 104, w, h, TEAL, "Teal", "#4D8580", "--teal",
           "Informational accents: availability, on-route, map pins.")
    nx = MARGIN + 2 * (w + gx)
    para(c, "<b>Muted greys</b> — <font face='DMMono-Medium'>--muted #AEB8B9</font> on navy; on light use "
            "<font face='DMMono-Medium'>--muted-2 #5B656D</font> (AA), not the deck's #778087 — it only reaches 3.5:1 "
            "on paper, so it stays decorative. <b>Hairlines</b> — rgba(16,33,45,.14) on light, rgba(255,255,255,.16) on navy.",
         nx, y4 - 36, CONTENT_W - (nx - MARGIN), "DMSans", 7.6, 10.8, MUTED)
    content_footer(c, pg)

# ---------------------------------------------------------- 02 color usage
def _strip(c, x, y, w, h, kind):
    """Recipe preview: fake photo base + overlay gradient."""
    steps = 26
    for j in range(steps):
        t = j / (steps - 1.0)
        if kind == "gold":
            col = Color(0.898 + t * (0.953 - 0.898), 0.627 + t * (0.765 - 0.627), 0.267 + t * (0.424 - 0.267))
        else:
            # base fake photo: slate blue-grey; overlay navy alpha along direction
            base = Color(0.52 - t * 0.06, 0.56 - t * 0.05, 0.60 - t * 0.04)
            al = (0.90 + t * (0.08 - 0.90)) if kind == "hero" else (0.10 + t * 0.52)
            ov = (11/255, 23/255, 30/255) if kind == "hero" else (13/255, 31/255, 38/255)
            col = Color(ov[0]*al + base.red*(1-al), ov[1]*al + base.green*(1-al), ov[2]*al + base.blue*(1-al))
        rect(c, x + j * (w / steps), y, w / steps + 0.4, h, col)

def p04_color_usage(c, pg):
    content_header(c, 2, "Color usage & contrast")
    block_label(c, MARGIN, PAGE_H - 78, "SECTION 02 · CONTINUED", GOLD_DEEP)
    text(c, MARGIN, PAGE_H - 99, "Gradients, overlays & measured contrast.", "Fraunces", 19, NAVY)

    y = PAGE_H - 130
    block_label(c, MARGIN, y, "Signature surface recipes — copy these exactly")
    recipes = [
        ("hero", "HERO OVERLAY — TEXT SIDE", "Keeps headlines legible over any photo",
         "linear-gradient(90deg, rgba(11,23,30,.96) 0%, .74 47%, .17 100%)"),
        ("card", "CARD OVERLAY — THUMBNAILS", "Fleet & destination image bottoms",
         "linear-gradient(180deg, rgba(13,31,38,.10) 0%, .62 100%)"),
        ("gold", "GOLD HIGHLIGHT", "Offers strip, 'starting at' fares",
         "linear-gradient(90deg, #E5A044 0%, #F3C36C 100%)")]
    rw = (CONTENT_W - 20) / 3
    for i, (kind, name, use, css) in enumerate(recipes):
        x = MARGIN + i * (rw + 10)
        rect(c, x, y - 112, rw, 104, PAPER, LINE_INK, 0.9, r=3)
        _strip(c, x + 10, y - 30, rw - 20, 16, kind)
        text(c, x + 10, y - 48, name, "DMMono-Medium", 6.2, NAVY, tracking=0.6)
        text(c, x + 10, y - 59, use, "DMSans-Medium", 7.4, MUTED)
        para(c, "<font face='DMMono'>%s</font>" % css, x + 10, y - 66, rw - 20, "DMSans", 6.2, 8.4, GOLD_DEEP)

    gy = y - 146
    block_label(c, MARGIN, gy, "Film grain on photographic areas (subtle, always)")
    para(c, "SVG turbulence at ≤16% opacity over photos — the quiet-luxury texture from the deck. Never on flat panels.",
         MARGIN, gy - 8, 228, "DMSans", 7.6, 10.4, MUTED)
    rect(c, MARGIN + 242, gy - 52, CONTENT_W - 242, 44, NAVY, r=3)
    text(c, MARGIN + 254, gy - 24, '<filter id="n">', "DMMono", 6.0, GOLD_LIGHT)
    text(c, MARGIN + 254, gy - 35, '  <feTurbulence baseFrequency=".82" numOctaves="3"/>', "DMMono", 6.0, GOLD_LIGHT)
    text(c, MARGIN + 254, gy - 46, '  <rect filter="url(#n)" opacity=".16"/></filter>', "DMMono", 6.0, GOLD_LIGHT)

    ty = gy - 80
    block_label(c, MARGIN, ty, "Contrast matrix — only passing pairs are approved (measured, WCAG 2.2)")
    pairs = [("#FFFDF8", "Warm White", "#0B171E", "Navy Deep", "Hero, dark sections, footer text", False),
             ("#F3C36C", "Gold Light", "#0B171E", "Navy Deep", "Italic headline accents on navy", True),
             ("#10212D", "Navy", "#E5A044", "Gold", "Primary CTA label", False),
             ("#10212D", "Navy", "#F5F0E8", "Paper", "Default body text", False),
             ("#5B656D", "Muted-2 (new)", "#F5F0E8", "Paper", "Secondary text on light", False),
             ("#AEB8B9", "Muted Light", "#0B171E", "Navy Deep", "Secondary text on navy", False),
             ("#E5A044", "Gold", "#10212D", "Navy", "Large fares / numerals on navy", True),
             ("#8A5A17", "Gold Text (new)", "#F5F0E8", "Paper", "Small gold mono labels on light", False)]
    cols = [("FOREGROUND", 0), ("ON", 118), ("PAIRING USE", 190), ("RATIO", 358), ("WCAG", 404), ("VERDICT", 448)]
    hy = ty - 18
    rect(c, MARGIN, hy - 4, CONTENT_W, 14, NAVY, r=2)
    for lab, dx in cols:
        text(c, MARGIN + 6 + dx, hy, lab, "DMMono-Medium", 5.8, GOLD_LIGHT, tracking=0.6)
    yy = hy - 20
    for fg, fgname, bg, bgname, use, large in pairs:
        r_ = contrast(fg, bg)
        badge = wcag_badge(r_, large)
        rect(c, MARGIN + 2, yy - 4.5, 10, 10, HexColor(fg), LINE_INK, 0.6, r=2)
        text(c, MARGIN + 17, yy - 1, fgname, "DMSans-Medium", 7.2, NAVY)
        rect(c, MARGIN + 120, yy - 4.5, 10, 10, HexColor(bg), LINE_INK, 0.6, r=2)
        text(c, MARGIN + 135, yy - 1, bgname, "DMSans-Medium", 7.2, NAVY)
        text(c, MARGIN + 196, yy - 1, use, "DMSans", 7.0, MUTED)
        text(c, MARGIN + 358, yy - 1, "%.1f : 1" % r_, "DMMono-Medium", 7.4, NAVY)
        ok = badge != "FAIL"
        text(c, MARGIN + 404, yy - 1, badge, "DMMono-Medium", 6.8, SUCCESS if ok else ERROR)
        (check if ok else cross)(c, MARGIN + 450, yy - 1.5, 4.5)
        text(c, MARGIN + 460, yy - 1, "Pass" if ok else "Avoid", "DMSans", 6.8, SUCCESS if ok else ERROR)
        rule(c, MARGIN, yy - 7.5, CONTENT_W, LINE_INK, 0.4)
        yy -= 19
    para(c, "Corrections vs the proposal deck: #778087 and #B27123 on paper both measure ~3.5:1 — below AA for text. "
            "They stay <b>decorative only</b> (icons, hairlines); the two 'new' tokens are their AA-safe text replacements.",
         MARGIN, yy - 8, CONTENT_W - 30, "DMSans", 7.6, 10.6, MUTED)
    content_footer(c, pg)

# ---------------------------------------------------------- 03 typography
def p05_type(c, pg):
    content_header(c, 3, "Typography")
    y = section_title(c, PAGE_H - 66, 3,
        'Three fonts. Zero improvisation.<br/><i><font color="#E16F4B">The editorial hybrid.</font></i>',
        "The brand voice is set in <b>Fraunces</b> (serif display), <b>DM Sans</b> (UI text) and <b>DM Mono</b> "
        "(labels &amp; data) — the exact trio from this proposal. Self-host all three; never rely on system fallbacks.")

    fcol = (CONTENT_W - 20) / 3
    cards = [("Fraunces", "DISPLAY / EMOTION", "Fraunces-Semi", "500 · 600 · Italic",
              "Headlines, section titles, big fares, pull quotes. Always -0.045em tracking, italic accent word in gold/coral."),
             ("DM Sans", "TEXT / FUNCTION", "DMSans-Bold", "400 · 500 · 700",
              "Body, buttons, nav, forms, tables — 90% of the interface. 16px base, 1.6 line-height for reading."),
             ("DM Mono", "LABELS / DATA", "DMMono-Medium", "400 · 500 · CAPS",
              "Eyebrows, badges, tags, ticket data, fare breakdowns. Always UPPERCASE with +0.08 to +0.17em tracking.")]
    for i, (name, role, dispfont, wght, use) in enumerate(cards):
        x = MARGIN + i * (fcol + 10)
        rect(c, x, y - 134, fcol, 124, PAPER, LINE_INK, 0.9, r=3)
        text(c, x + 12, y - 26, role, "DMMono-Medium", 5.8, GOLD_DEEP, tracking=1.0)
        text(c, x + 12, y - 72, "Aa", dispfont, 32, NAVY)
        text(c, x + 62, y - 50, name, "DMSans-Bold", 10, NAVY)
        text(c, x + 62, y - 62, wght, "DMMono", 5.8, MUTED)
        para(c, use, x + 12, y - 88, fcol - 24, "DMSans", 7.0, 9.6, MUTED)

    iy = y - 168
    block_label(c, MARGIN, iy, "Font loading — one preconnect'd request (mirrors repo)")
    rect(c, MARGIN, iy - 62, CONTENT_W, 54, NAVY, r=3)
    code = ['<font color="#F3C36C">&lt;link rel="preconnect" href="https://fonts.gstatic.com" crossorigin&gt;</font>',
            '<font color="#AEB8B9">https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;display=swap</font>',
            '<font color="#AEB8B9">&amp;family=</font><font color="#FFFDF8">DM+Sans:wght@400;500;600;700</font>',
            '<font color="#AEB8B9">&amp;family=</font><font color="#FFFDF8">Fraunces:opsz,wght@9..144,500;9..144,600</font><font color="#AEB8B9">&amp;display=swap</font>']
    for li, ln in enumerate(code):
        para(c, ln, MARGIN + 14, iy - 14 - li * 11.5, CONTENT_W - 28, "DMMono", 6.6, 11.5, MUTED_LT)

    sy = iy - 98
    block_label(c, MARGIN, sy, "Type scale — proposal-deck px and the website mapping (16px base)")
    heads = [("TOKEN", 0), ("FONT", 66), ("DECK (PX)", 148), ("WEBSITE", 214), ("LH", 296), ("TRACKING", 326), ("USE", 382)]
    rows = [
        ("Display", "Fraunces 500", "≤74 fluid", "clamp(44–76px)", "0.98", "-0.045em", "Hero headline only — one per page"),
        ("H2", "Fraunces 500", "42–74", "clamp(32–52px)", "0.98", "-0.045em", "Section titles, gold-italic key phrase"),
        ("H3 / Card", "Fraunces 500", "30", "24–28px", "1.05", "-0.04em", "Card titles, fare names, ticket heads"),
        ("Lead", "DM Sans 400", "14", "18–20px", "1.55", "0", "Intros under H2 (max 62 characters)"),
        ("Body", "DM Sans 400", "11–12", "16px", "1.6", "0", "Default reading text"),
        ("Small", "DM Sans 500", "10", "14px", "1.5", "0", "Meta, captions, form hints"),
        ("Eyebrow", "DM Mono 500", "9", "10–11px", "1", "+0.16em", "Section labels, 16–22px gold tick, UPPER"),
        ("Button", "DM Sans 700", "11", "13–14px", "1", "+0.01em", "All buttons; arrow glyph set in DM Sans"),
        ("Badge/Tag", "DM Mono 500", "8", "9–10px", "1", "+0.08em", "Pills, status chips, vehicle tags — CAPS"),
        ("Stat/Fare", "Fraunces 600", "35", "30–40px", "1", "-0.02em", "₹ fares, route counts, ratings")]
    th_y = sy - 18
    rect(c, MARGIN, th_y - 4, CONTENT_W, 15, NAVY, r=2)
    for lab, dx in heads:
        text(c, MARGIN + 6 + dx, th_y, lab, "DMMono-Medium", 5.8, GOLD_LIGHT, tracking=0.6)
    yy = th_y - 20
    for i, r in enumerate(rows):
        if i % 2 == 0:
            rect(c, MARGIN, yy - 5.5, CONTENT_W, 16.5, PAPER)
        text(c, MARGIN + 6, yy, r[0], "DMSans-Bold", 7.2, NAVY)
        text(c, MARGIN + 6 + 66, yy, r[1], "DMSans-Medium", 7.0, NAVY)
        text(c, MARGIN + 6 + 148, yy, r[2], "DMMono", 6.6, MUTED)
        text(c, MARGIN + 6 + 214, yy, r[3], "DMMono", 6.6, GOLD_DEEP)
        text(c, MARGIN + 6 + 296, yy, r[4], "DMMono", 6.6, MUTED)
        text(c, MARGIN + 6 + 326, yy, r[5], "DMMono", 6.6, MUTED)
        text(c, MARGIN + 6 + 382, yy, r[6], "DMSans", 6.7, MUTED)
        rule(c, MARGIN, yy - 5.5, CONTENT_W, LINE_INK, 0.4)
        yy -= 18.6
    content_footer(c, pg)

# ---------------------------------------------------------- 03 type rules
def p06_type_rules(c, pg):
    content_header(c, 3, "Type specimens & rules")
    block_label(c, MARGIN, PAGE_H - 78, "SECTION 03 · CONTINUED", GOLD_DEEP)
    text(c, MARGIN, PAGE_H - 99, "Type in context — measure twice, build once.", "Fraunces", 19, NAVY)

    y = PAGE_H - 130
    ph_panel = 186
    rect(c, MARGIN, y - ph_panel, CONTENT_W, ph_panel, NAVY_DEEP, r=4)
    sparkle(c, MARGIN + CONTENT_W - 26, y - 22, 5, GOLD)
    eyebrow(c, MARGIN + 18, y - 28, "HOME · HERO HEADLINE — 60PX", GOLD_LIGHT, 6.2)
    st = ParagraphStyle("s", fontName="Fraunces", fontSize=29, leading=30, textColor=WHITE)
    p = Paragraph('Agra to anywhere,<br/><i><font color="#F3C36C">in first-class comfort.</font></i>', st)
    pw, ph = p.wrapOn(c, CONTENT_W - 36, 120); p.drawOn(c, MARGIN + 18, y - 40 - ph)
    body_top = y - 48 - ph
    para(c, "Sedans, SUVs and Tempo Travellers with verified drivers. Transparent fares, UPI advance payment, "
            "and a confirmed booking in under two minutes.",
         MARGIN + 18, body_top, 300, "DMSans", 8.2, 12, MUTED_LT)
    chip(c, MARGIN + 18, y - ph_panel + 12, "EYEBROW: DM MONO CAPS +0.16EM", GOLD_LIGHT, size=5.4)
    chip(c, MARGIN + 214, y - ph_panel + 12, "ITALIC ACCENT #F3C36C — NAVY ONLY", GOLD_LIGHT, size=5.4)

    ry = y - ph_panel - 34
    block_label(c, MARGIN, ry, "Composition rules")
    rules = [
        ("One italic accent per headline", "Colour one meaningful phrase in the serif italic — gold-light on navy, coral on paper. Never two accents."),
        ("Serif = emotion, sans = function", "Headlines and fares in Fraunces; everything actionable in DM Sans. Never mix roles."),
        ("Mono is always uppercase + tracked", "DM Mono lowercase reads like code, not a label. Lock caps + +0.08 to 0.17em."),
        ("Line length discipline", "Body copy 52–68 characters; leads max 62. Cards never exceed 3 body lines."),
        ("Numeric alignment", "Fares and route tables use DM Mono figures so ₹ columns align; prices never in serif."),
        ("Hierarchy by weight, not size jumps", "Inside cards: Fraunces 24–28 title, 14–16 body, mono 9 tag. Nothing else.")]
    colw = (CONTENT_W - 28) / 2
    rowgap = 72
    for i, (t, d) in enumerate(rules):
        cx = MARGIN + (i % 2) * (colw + 28)
        cyy = ry - 24 - (i // 2) * rowgap
        text(c, cx, cyy, "%02d" % (i + 1), "DMMono-Medium", 7.6, GOLD_DEEP)
        text(c, cx + 22, cyy, t, "DMSans-Bold", 9.0, NAVY)
        para(c, d, cx + 22, cyy - 8, colw - 22, "DMSans", 7.4, 10.2, MUTED)

    sy2 = ry - 24 - 2 * rowgap - 48
    block_label(c, MARGIN, sy2, "Live scale specimen")
    rect(c, MARGIN, sy2 - 146, CONTENT_W, 138, PAPER, LINE_INK, 0.9, r=3)
    eyebrow(c, MARGIN + 16, sy2 - 26, "EYEBROW · DM MONO 10PX CAPS", GOLD_DEEP, 6.4)
    text(c, MARGIN + 16, sy2 - 56, "Tempo Traveller, 17 seats.", "Fraunces", 20, NAVY)
    para(c, "Body 16 — Spacious pushback seats, luggage bay and ice-box. Ideal for family "
            "tours and outstation group travel from Agra.",
         MARGIN + 16, sy2 - 66, 300, "DMSans", 9.0, 12.4, NAVY)
    text(c, MARGIN + 16, sy2 - 128, "₹7,500", "Fraunces-Semi", 16, GOLD_DEEP)
    text(c, MARGIN + 92, sy2 - 128, "PER DAY · ALL-INCLUSIVE SAMPLE", "DMMono-Medium", 6.2, MUTED, tracking=0.7)
    vrule(c, MARGIN + 352, sy2 - 132, 108, LINE_INK, 0.8)
    para(c, "<b>Anatomy</b> — eyebrow introduces, serif title names, sans body explains, mono data prices. "
            "This 4-layer stack is the whole vocabulary: every card, hero and panel is a variation of it.",
         MARGIN + 368, sy2 - 18, CONTENT_W - 384, "DMSans", 7.4, 10.4, MUTED)
    content_footer(c, pg)

# ---------------------------------------------------------- 04 spacing
def p07_spacing(c, pg):
    content_header(c, 4, "Spacing, grid & breakpoints")
    y = section_title(c, PAGE_H - 66, 4,
        'An 8-pixel rhythm,<br/><i><font color="#E16F4B">navy-deep calm.</font></i>',
        "All spacing derives from an 8px base unit. Components keep the radii and densities proven in the proposal "
        "deck; only the presentation scale changes for a marketing website.")

    block_label(c, MARGIN, y - 4, "Spacing scale — the only values allowed")
    vals = [(4, "0.5×"), (8, "1×"), (12, "1.5×"), (16, "2×"), (24, "3×"), (32, "4×"), (48, "6×"), (64, "8×"), (96, "12×")]
    cellw = (CONTENT_W) / 9.0
    for i, (v, mult) in enumerate(vals):
        x = MARGIN + i * cellw
        rect(c, x + 2, y - 46, cellw - 8, 24, PAPER, LINE_INK, 0.8, r=3)
        rect(c, x + 8, y - 37, min(v * 0.5, cellw - 20), 6, GOLD, r=2)
        text(c, x + 8, y - 60, "%dpx" % v, "DMMono-Medium", 6.4, NAVY)
        text(c, x + 8, y - 70, mult, "DMMono", 5.4, MUTED)

    ly = y - 104
    block_label(c, MARGIN, ly, "Layout constants")
    rows = [("Header height", "78px", "64px", "Fixed, navy, blur on scroll"),
            ("Container max", "1140px", "100% - 32px", "Centered; full-bleed only for hero/footer art"),
            ("Section padding Y", "96 / 72px", "56px", "Alternate navy / paper sections"),
            ("Card gap", "16–24px", "14px", "One value per grid, never mixed"),
            ("Card padding", "22–24px", "18px", "Matches deck service cards"),
            ("Control height", "44px min", "44px min", "Buttons & inputs — touch minimum"),
            ("Radius — cards", "3–4px", "3–4px", "Nearly square = premium; no big blobs"),
            ("Radius — pills/badges", "999px", "999px", "Only true pills are fully round")]
    th = [("PROPERTY", 0), ("DESKTOP", 150), ("MOBILE", 228), ("NOTES", 306)]
    hy = ly - 18
    rect(c, MARGIN, hy - 4, CONTENT_W, 15, NAVY, r=2)
    for lab, dx in th: text(c, MARGIN + 6 + dx, hy, lab, "DMMono-Medium", 5.8, GOLD_LIGHT, tracking=0.6)
    yy = hy - 21
    for i, r in enumerate(rows):
        if i % 2 == 0: rect(c, MARGIN, yy - 4.5, CONTENT_W, 16, PAPER)
        text(c, MARGIN + 6, yy, r[0], "DMSans-Bold", 7.2, NAVY)
        text(c, MARGIN + 6 + 150, yy, r[1], "DMMono", 6.6, GOLD_DEEP)
        text(c, MARGIN + 6 + 228, yy, r[2], "DMMono", 6.6, GOLD_DEEP)
        text(c, MARGIN + 6 + 306, yy, r[3], "DMSans", 7.2, MUTED)
        rule(c, MARGIN, yy - 4.5, CONTENT_W, LINE_INK, 0.4)
        yy -= 17.5

    by = yy - 26
    block_label(c, MARGIN, by, "Breakpoints — inherited from the proposal deck")
    bps = [("Desktop", "> 1120px", "12-col grid, 3-up cards, 2-col forms", True),
           ("Tablet", "701–1120px", "2-up cards, condensed header", False),
           ("Mobile", "≤ 700px", "Single column, sticky book CTA", False),
           ("Tiny", "≤ 380px", "Drop meta; headline min 34px", False)]
    bw = (CONTENT_W - 24) / 4
    for i, (t, rng, d, on) in enumerate(bps):
        x = MARGIN + i * (bw + 8)
        rect(c, x, by - 78, bw, 70, NAVY if on else PAPER, None if on else LINE_INK, 0.9, r=3)
        text(c, x + 10, by - 26, t, "DMSans-Bold", 8.4, WHITE if on else NAVY)
        text(c, x + 10, by - 38, rng, "DMMono-Medium", 6.2, GOLD_LIGHT if on else GOLD_DEEP)
        para(c, d, x + 10, by - 44, bw - 20, "DMSans", 6.6, 8.8, MUTED_LT if on else MUTED)
    para(c, "<b>Grid:</b> 12 columns, 24px gutters on desktop. Cards span 4/4/4, split headers 7/5, booking 6/6. "
            "Full-bleed is reserved for photography and the footer strip.",
         MARGIN, by - 94, CONTENT_W, "DMSans", 7.8, 11.2, MUTED)
    content_footer(c, pg)
