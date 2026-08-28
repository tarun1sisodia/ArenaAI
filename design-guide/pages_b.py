"""Pages 8-14 of the SK Baghel website design system guide."""
import os
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from dg_kit import *

BANNER = os.path.join(ASSETS, "hero-banner-luxury-highway.png")

def spec_table(c, x, y_top, w, rows, col1=92, min_h=15.5, head=("PROPERTY", "VALUE"), size=6.6):
    """Two-column spec table with dynamic row heights. Returns bottom y."""
    hy = y_top
    rect(c, x, hy - 4, w, 14, NAVY, r=2)
    text(c, x + 6, hy, head[0], "DMMono-Medium", 5.6, GOLD_LIGHT, tracking=0.6)
    text(c, x + 6 + col1, hy, head[1], "DMMono-Medium", 5.6, GOLD_LIGHT, tracking=0.6)
    yy = hy - 10
    for i, (k, v) in enumerate(rows):
        st = ParagraphStyle("v", fontName="DMSans", fontSize=size, leading=size + 1.9, textColor=MUTED)
        p = Paragraph(v, st)
        pw, ph = p.wrapOn(c, w - col1 - 14, 400)
        rh = max(min_h, ph + 8.5)
        yy -= rh
        if i % 2 == 0: rect(c, x, yy, w, rh, PAPER)
        text(c, x + 6, yy + rh - 10, k, "DMSans-Bold", size, NAVY)
        p.drawOn(c, x + 6 + col1, yy + rh - 10 - ph + 3)
        rule(c, x, yy, w, LINE_INK, 0.4)
    return yy

def mock_button(c, x, y, w, label, kind="primary", state="default"):
    h, r = 30, 3
    if kind == "primary":
        fill, fg = (GOLD, NAVY)
        if state == "disabled": fill, fg = (PAPER_DK, MUTED)
        if state == "hover":
            c.setFillColor(Color(22/255, 39/255, 48/255, alpha=0.14))
            c.roundRect(x + 1, y - 4, w, h, r + 1, fill=1, stroke=0)
        rect(c, x, y, w, h, fill, r=r)
        text(c, x + 13, y + h/2 - 3, label, "DMSans-Bold", 8.2, fg)
        aw = stringWidth(label, "DMSans-Bold", 8.2)
        text(c, x + 13 + aw + 9, y + h/2 - 3.5, "↗", "DMSans", 10.5, fg)
    elif kind == "outline":
        fg = NAVY if state != "disabled" else MUTED
        rect(c, x, y, w, h, None, NAVY if state == "hover" else LINE_INK, 1.1, r=r)
        text(c, x + 13, y + h/2 - 3, label, "DMSans-Bold", 8.2, fg)
    else:
        text(c, x + 4, y + 8, label, "DMSans-Bold", 8.2, NAVY if state != "disabled" else MUTED)
        c.setStrokeColor(CORAL); c.setLineWidth(1)
        c.line(x + 4, y + 4, x + 4 + stringWidth(label, "DMSans-Bold", 8.2), y + 4)

# ---------------------------------------------------------- 05 components A
def p08_buttons_forms(c, pg):
    content_header(c, 5, "Components — actions & forms")
    y = section_title(c, PAGE_H - 66, 5,
        'Buttons &amp; forms<br/><i><font color="#E16F4B">built to convert.</font></i>',
        "Specs below are the tokenised versions of the deck's working components. "
        "States are mandatory: default, hover, focus, disabled, loading.")

    block_label(c, MARGIN, y, "Buttons — three kinds only; never invent a fourth")
    by = y - 44
    kinds = [("primary", "Book your ride"), ("outline", "View packages"), ("text", "See fare rules")]
    for j, st_ in enumerate(["default", "hover", "disabled"]):
        text(c, MARGIN + 10 + j * 122, y - 16, st_.upper(), "DMMono-Medium", 5.6, MUTED, tracking=0.7)
    for i, (k, lab) in enumerate(kinds):
        yy = by - i * 46
        for j, st_ in enumerate(["default", "hover", "disabled"]):
            mock_button(c, MARGIN + 10 + j * 122, yy - 22, 104, lab, k, st_)

    fy = by - 3 * 46 - 18
    spec_bottom = spec_table(c, MARGIN, fy, 366, [
        ("Shape", "min-h 44px · pad 0 17px (deck) / 0 20px (web) · radius 3px · 15px label-to-glyph gap"),
        ("Primary", "fill --gold #E5A044 · label --navy #10212D · weight 700 · 13–14px"),
        ("Shadow", "0 8px 20px rgba(178,113,35,.16) — the signature gold glow"),
        ("Hover", "lift translateY(-2px) · shadow 0 12px 23px rgba(22,39,48,.14) · 180ms ease"),
        ("Focus", "2px gold outline, 2px offset — visible everywhere"),
        ("Loading", "label swaps to spinner; width locked; aria-busy on")], col1=70)

    fx = MARGIN + 390
    fw = CONTENT_W - 390
    block_label(c, fx, y, "Badges, tags & live-dot")
    rect(c, fx + 2, y - 40, 124, 20, None, Color(GOLD_LIGHT.red, GOLD_LIGHT.green, GOLD_LIGHT.blue, 0.5), 0.9, r=10)
    circle(c, fx + 13, y - 30, 2.2, fill=GOLD)
    text(c, fx + 21, y - 33, "DISCUSSION DRAFT", "DMMono-Medium", 6.0, GOLD_DEEP, tracking=0.5)
    tx = fx + 2
    for t in ["SEDAN", "ERTIGA", "INNOVA"]:
        w_, _ = chip(c, tx, y - 66, t, NAVY, size=6.2)
        tx += w_ + 6
    text(c, fx + 2, y - 84, "Badge: rad 999 · mono caps · gold border 30%", "DMMono", 5.6, MUTED)
    text(c, fx + 2, y - 94, "Tags: 5×7 padding · radius 2 · 1px hairline", "DMMono", 5.6, MUTED)
    circle(c, fx + 6, y - 112, 3, fill=GOLD)
    c.setStrokeColor(Color(GOLD.red, GOLD.green, GOLD.blue, 0.28)); c.setLineWidth(1.2)
    c.circle(fx + 6, y - 112, 5.5, stroke=1, fill=0)
    text(c, fx + 18, y - 115, "Live-dot: 6px gold + halo — availability", "DMSans", 6.6, MUTED)

    fy2 = fy + 4
    block_label(c, fx, fy2, "Form fields")
    fw2 = fw - 10
    text(c, fx + 2, fy2 - 16, "PICKUP CITY", "DMMono-Medium", 5.6, MUTED, tracking=0.8)
    rect(c, fx + 2, fy2 - 40, fw2, 21, WHITE, Color(16/255, 33/255, 45/255, .15), 0.9, r=2)
    text(c, fx + 10, fy2 - 34, "Agra (AGR)", "DMSans", 7.4, NAVY)
    text(c, fx + 2, fy2 - 52, "DROP CITY — FOCUSED", "DMMono-Medium", 5.6, GOLD_DEEP, tracking=0.8)
    c.setFillColor(Color(GOLD.red, GOLD.green, GOLD.blue, 0.15))
    c.roundRect(fx - 3, fy2 - 79, fw2 + 10, 27, 4, fill=1, stroke=0)
    rect(c, fx + 2, fy2 - 76, fw2, 21, WHITE, GOLD, 1.1, r=2)
    text(c, fx + 10, fy2 - 70, "Delhi (DEL)", "DMSans", 7.4, NAVY)
    text(c, fx + 2, fy2 - 88, "TRAVEL DATE — ERROR", "DMMono-Medium", 5.6, ERROR, tracking=0.8)
    rect(c, fx + 2, fy2 - 112, fw2, 21, WHITE, ERROR, 1.1, r=2)
    text(c, fx + 10, fy2 - 106, "31/02/2026", "DMSans", 7.4, NAVY)
    text(c, fx + 2, fy2 - 124, "Pick a valid date.", "DMSans-Medium", 6.6, ERROR)
    para(c, "<b>Field anatomy:</b> mono-caps label → 1px rgba(16,33,45,.15) border, radius 2, pad 10px, white bg → "
            "focus: gold border + 3px rgba(229,160,68,.15) halo → error: red border + one-line help. "
            "Labels always visible — never placeholder-only.", fx, fy2 - 134, fw, "DMSans", 7.2, 10, MUTED)
    content_footer(c, pg)

# ---------------------------------------------------------- 05 components B
def mini_service_card(c, x, y, w, h, variant, idx, title_html, body, tags):
    if variant == "gold": bg, fg, sub = GOLD, NAVY, HexColor("#4D4A40")
    elif variant == "light": bg, fg, sub = CARD_LT, NAVY, MUTED
    else: bg, fg, sub = NAVY, WHITE, HexColor("#B4C1C0")
    rect(c, x, y, w, h, bg, LINE_INK if variant == "light" else None, 0.8, r=3)
    accent = GOLD_LIGHT if variant == "navy" else (NAVY if variant == "gold" else CORAL)
    text(c, x + 10, y + h - 15, idx, "DMMono-Medium", 6.0, accent, tracking=0.5)
    sparkle(c, x + 11, y + h - 34, 3.8, accent)
    st = ParagraphStyle("t", fontName="Fraunces", fontSize=13.5, leading=14, textColor=fg)
    p = Paragraph(title_html, st); pw, ph = p.wrapOn(c, w - 20, 40); p.drawOn(c, x + 10, y + h - 46 - ph)
    para(c, body, x + 10, y + h - 52 - ph, w - 20, "DMSans", 6.4, 8.6, sub)
    tx = x + 10
    for t in tags:
        w_, _ = chip(c, tx, y + 17, t, fg, size=5.0, pad=4)
        tx += w_ + 4
    text(c, x + 10, y + 5, "Book now ↗", "DMSans-Bold", 6.4, accent)

def p09_cards_nav(c, pg):
    content_header(c, 5, "Components — cards, nav & footer")
    block_label(c, MARGIN, PAGE_H - 74, "SECTION 05 · CONTINUED", GOLD_DEEP)
    text(c, MARGIN, PAGE_H - 95, "Cards, navigation & page furniture.", "Fraunces", 19, NAVY)

    y = PAGE_H - 126
    block_label(c, MARGIN, y, "Service cards — three sanctioned variants (navy / gold / light)")
    specw = 172
    cw = (CONTENT_W - specw - 24) / 3
    card_h = 142
    mini_service_card(c, MARGIN, y - card_h - 8, cw, card_h, "navy", "01",
                      "Taxi <i>/ Cab</i>", "Sedan, Ertiga &amp; Innova Crysta for city rides and intercity drops.", ["SEDAN", "ERTIGA"])
    mini_service_card(c, MARGIN + cw + 8, y - card_h - 8, cw, card_h, "gold", "02",
                      "Tour <i>packages</i>", "Same-day Agra, Golden Triangle, custom multi-day itineraries.", ["TAJ", "3-DAY"])
    mini_service_card(c, MARGIN + 2 * (cw + 8), y - card_h - 8, cw, card_h, "light", "03",
                      "Tempo <i>&amp; Urbania</i>", "12–17 seat group travel, luggage bay, pushback seats.", ["12+1", "17+1"])
    spec_table(c, MARGIN + CONTENT_W - specw, y - 8, specw, [
        ("Min height", "320px deck / fluid web"),
        ("Padding", "23/22/20 → 24px web"),
        ("Radius", "3px; hairline border on light variant"),
        ("Index + mark", "mono 9px + gold sparkle"),
        ("Link", "bottom-left; '↗' glyph in DM Sans"),
        ("Hover", "lift -2px, 180ms ease")], col1=64, size=6.2, min_h=15)

    ny = y - card_h - 52
    block_label(c, MARGIN, ny, "Header (navbar) — navy, 78px, blur on scroll")
    nh = 42
    rect(c, MARGIN, ny - nh - 10, CONTENT_W, nh, NAVY_DEEP, r=3)
    logo_mark(c, MARGIN + 14, ny - nh + 6, 16, True)
    text(c, MARGIN + 36, ny - nh + 15, "SK BAGHEL", "DMSans-Bold", 7.6, WHITE, tracking=1.0)
    text(c, MARGIN + 36, ny - nh + 6, "TOWN & TRAVELS", "DMMono", 4.4, MUTED_LT, tracking=0.9)
    links = ["Services", "Routes", "Packages", "Fleet", "Contact"]
    lx = MARGIN + 150
    for l in links:
        text(c, lx, ny - nh + 12, l, "DMSans-Medium", 7.0, MUTED_LT)
        lx += stringWidth(l, "DMSans-Medium", 7.0) + 15
    # active under-bar on Services
    c.setStrokeColor(GOLD); c.setLineWidth(2)
    c.line(MARGIN + 150, ny - nh + 7, MARGIN + 150 + stringWidth("Services", "DMSans-Medium", 7.0), ny - nh + 7)
    bw_ = 96
    rect(c, MARGIN + CONTENT_W - bw_ - 10, ny - nh + 5, bw_, 26, GOLD, r=3)
    ctext(c, MARGIN + CONTENT_W - bw_ / 2 - 10, ny - nh + 14, "Book now ↗", "DMSans-Bold", 7.2, NAVY)
    para(c, "Active link: 2px gold under-bar, 180ms slide. Mobile: hamburger opens a full-screen navy sheet with 44px rows; "
            "'Book now' persists as a floating bottom pill on ≤700px.", MARGIN, ny - nh - 22, CONTENT_W - 8, "DMSans", 7.4, 10.2, MUTED)

    cy2 = ny - nh - 70
    block_label(c, MARGIN, cy2, "Fleet & booking cards — built from the same anatomy")
    half = (CONTENT_W - 16) / 2
    rect(c, MARGIN, cy2 - 118, half, 110, PAPER, LINE_INK, 0.9, r=3)
    text(c, MARGIN + 12, cy2 - 26, "VEHICLE CARD", "DMMono-Medium", 6.0, GOLD_DEEP, tracking=0.9)
    para(c, "<b>16:10 photo with card overlay gradient</b> · Fraunces 24 name (Sedan — Dzire class) · mono spec row "
            "<font face='DMMono'>4+1 SEATS · AC · 2 BAGS</font> · fare line <b>₹12/km, from ₹3,500 Agra–Delhi</b> · "
            "gold 'Choose this car' button. Hover: image scales 1.03, card lifts -2px.",
         MARGIN + 12, cy2 - 34, half - 26, "DMSans", 7.4, 10.4, MUTED)
    rect(c, MARGIN + half + 16, cy2 - 118, half, 110, PAPER, LINE_INK, 0.9, r=3)
    text(c, MARGIN + half + 28, cy2 - 26, "BOOKING SUMMARY / TICKET", "DMMono-Medium", 6.0, GOLD_DEEP, tracking=0.9)
    para(c, "Navy-soft panel with perforation rule above the fare. <font face='DMMono'>AGR → DEL</font> mono route line, "
            "live-dot + booking badge up top, fare breakdown in DM Mono rows, total in Fraunces 28 gold. "
            "After payment the same card flips to CONFIRMED — teal tick + booking ID.",
         MARGIN + half + 28, cy2 - 34, half - 26, "DMSans", 7.4, 10.4, MUTED)

    fy2 = cy2 - 152
    block_label(c, MARGIN, fy2, "Footer — navy deep, utility grid + trust strip")
    rect(c, MARGIN, fy2 - 78, CONTENT_W, 68, NAVY_DEEP, r=3)
    cols = [("EXPLORE", ["Services", "Tour packages", "Fleet"]),
            ("BOOK", ["One-way drops", "Outstation", "Airport transfers"]),
            ("TRUST", ["Verified drivers", "GST invoice", "24×7 support"])]
    fx2 = MARGIN + 14
    for h3, items in cols:
        text(c, fx2, fy2 - 28, h3, "DMMono-Medium", 5.6, GOLD_LIGHT, tracking=0.9)
        for k, it in enumerate(items):
            text(c, fx2, fy2 - 40 - k * 9.5, it, "DMSans", 6.8, MUTED_LT)
        fx2 += 116
    logo_mark(c, MARGIN + CONTENT_W - 132, fy2 - 42, 15, True)
    text(c, MARGIN + CONTENT_W - 112, fy2 - 30, "AGRA → INDIA", "DMSans-Bold", 6.8, GOLD_LIGHT)
    text(c, MARGIN + CONTENT_W - 112, fy2 - 41, "Discover → Book → Go", "DMSans-Medium", 6.6, WHITE)
    text(c, MARGIN + CONTENT_W - 112, fy2 - 52, "© 2026 SK Baghel", "DMMono", 5.4, MUTED_LT)
    content_footer(c, pg)

# ---------------------------------------------------------- 06 imagery
def p10_imagery(c, pg):
    content_header(c, 6, "Imagery & iconography")
    y = section_title(c, PAGE_H - 66, 6,
        'Photography that sells<br/><i><font color="#E16F4B">the journey, not the car.</font></i>',
        "The approved hero is a luxury sedan on an open highway at dusk — navy skies, golden light. "
        "All photography follows this grade: cool navy shadows, warm gold highlights, gentle film grain.")

    img_h = 186
    tw = CONTENT_W
    c.saveState()
    rect(c, MARGIN, y - img_h - 8, tw, img_h, NAVY_SOFT, r=4)
    pth = c.beginPath(); pth.roundRect(MARGIN, y - img_h - 8, tw, img_h, 4); c.clipPath(pth, stroke=0, fill=0)
    img = ImageReader(BANNER)
    iw, ih = img.getSize(); sc = max(tw / iw, img_h / ih)
    c.drawImage(img, MARGIN + (tw - iw * sc) / 2, y - img_h - 8 + (img_h - ih * sc) / 2, iw * sc, ih * sc)
    c.restoreState()
    c.setStrokeColor(GOLD); c.setLineWidth(1); c.setDash(2, 2)
    c.rect(MARGIN + 12, y - img_h + 2, tw * 0.4, img_h - 22, stroke=1, fill=0)
    c.setDash()
    text(c, MARGIN + 18, y - 26, "COPY-SAFE ZONE — HERO H1 + CTA", "DMMono-Medium", 5.6, GOLD_LIGHT, tracking=0.6)
    chip(c, MARGIN + tw - 120, y - img_h + 2, "RENDERED ART DIRECTION — 21:9", GOLD_LIGHT, size=5.2)

    cy = y - img_h - 40
    block_label(c, MARGIN, cy, "Treatment recipe — every photo, no exceptions")
    steps = [("01", "Grade", "Cool shadows toward navy (#0B171E tint); lift warm highlights toward gold."),
             ("02", "Overlay", "Hero: 90° navy overlay .96→.17. Thumbnails: 180° bottom overlay .10→.62."),
             ("03", "Grain", "feTurbulence film grain at ≤16% opacity over photographic areas only."),
             ("04", "Export", "WebP/AVIF, q ≤ 82, 2× retina, hero ≤ 220KB; lazy-load below the fold.")]
    colw = (CONTENT_W - 30) / 4
    for i, (n, t, d) in enumerate(steps):
        x = MARGIN + i * (colw + 10)
        rect(c, x, cy - 86, colw, 78, PAPER, LINE_INK, 0.9, r=3)
        text(c, x + 10, cy - 24, n, "DMMono-Medium", 6.8, GOLD_DEEP)
        text(c, x + 26, cy - 24.5, t, "DMSans-Bold", 8.0, NAVY)
        para(c, d, x + 10, cy - 32, colw - 20, "DMSans", 6.6, 9.0, MUTED)

    sy = cy - 122
    block_label(c, MARGIN, sy, "Shot list — what to photograph")
    shots = ["Sedan / SUV front three-quarter at golden hour, Agra skyline",
             "Highway sweeping curve with copy space on the left",
             "Taj Mahal dawn + car silhouette (tour packages)",
             "Driver opening the door — uniform, warm smile",
             "Interior: clean leather, bottled water, AC vents",
             "Group boarding a Tempo Traveller at the depot"]
    for i, s in enumerate(shots):
        yy = sy - 16 - i * 14.5
        circle(c, MARGIN + 3, yy + 2, 1.7, fill=GOLD_DEEP)
        text(c, MARGIN + 12, yy, s, "DMSans", 7.4, NAVY)

    ix = MARGIN + CONTENT_W / 2 + 14
    block_label(c, ix, sy, "Iconography & logo")
    para(c, "<b>Icons:</b> 24px grid, 1.5px stroke, round caps &amp; joins (deck style), sizes 16/20/24. "
            "Line only — never filled or emoji sets.",
         ix, sy - 10, CONTENT_W / 2 - 26, "DMSans", 7.2, 10.0, MUTED)
    para(c, "<b>Logo:</b> mountain-road monogram, gold spark #F3B34C. Clear space = mark height on all sides. "
            "Min 28px digital / 12mm print. Warm-white mark on navy; never recolour the spark.",
         ix, sy - 46, CONTENT_W / 2 - 26, "DMSans", 7.2, 10.0, MUTED)
    para(c, "<b>Banned:</b> clip-art cars, gradient stickers, HDR-crushed skies, watermarked stock, "
            "more than one gold focal point per image.",
         ix, sy - 88, CONTENT_W / 2 - 26, "DMSans", 7.2, 10.0, MUTED)
    rule(c, MARGIN, sy - 116, CONTENT_W, LINE_INK, 0.6)
    para(c, "<b>Hero production note:</b> shoot or commission one master 21:9 frame (above) and derive hero, OG banner "
            "(1200×630) and package thumbnails from the same grade — consistency reads as premium.",
         MARGIN, sy - 126, CONTENT_W, "DMSans", 7.8, 11, MUTED)
    content_footer(c, pg)

# ---------------------------------------------------------- 07 motion
def p11_motion(c, pg):
    content_header(c, 7, "Motion & interaction")
    y = section_title(c, PAGE_H - 66, 7,
        'Motion is seasoning —<br/><i><font color="#E16F4B">180ms is enough.</font></i>',
        "The deck runs on a single timing: 180ms ease. The website keeps that discipline — motion confirms "
        "actions and guides focus; it never performs.")

    block_label(c, MARGIN, y, "The motion vocabulary — the only sanctioned moves")
    rows = [("Hover lift", "transform: translateY(-2px)", "180ms ease", "Buttons, cards, nav CTA"),
            ("Hover grow", "shadow → 0 12px 23px rgba(22,39,48,.14)", "180ms ease", "Pairs with lift"),
            ("Colour shift", "background / colour only", "180ms ease", "Links, tabs, chips"),
            ("Under-bar slide", "2px gold bar scales in", "180ms ease", "Nav active link"),
            ("Card image zoom", "scale(1.03) inside overflow:hidden", "400ms ease", "Fleet & destination cards"),
            ("Section reveal", "fade + translateY(12px) in view", "320ms ease-out", "Once per element, no replay"),
            ("Drawer / sheet", "slide in from edge", "240ms ease-out", "Mobile nav, filters"),
            ("Live-dot pulse", "halo ring 1 → 1.6, alpha to 0", "1.6s loop", "Booking availability only")]
    th = [("MOVE", 0), ("SPEC", 96), ("TIMING", 292), ("WHERE", 372)]
    hy = y - 18
    rect(c, MARGIN, hy - 4, CONTENT_W, 15, NAVY, r=2)
    for lab, dx in th: text(c, MARGIN + 6 + dx, hy, lab, "DMMono-Medium", 5.8, GOLD_LIGHT, tracking=0.6)
    yy = hy - 20
    for i, r in enumerate(rows):
        if i % 2 == 0: rect(c, MARGIN, yy - 4.5, CONTENT_W, 16, PAPER)
        text(c, MARGIN + 6, yy, r[0], "DMSans-Bold", 7.2, NAVY)
        text(c, MARGIN + 6 + 96, yy, r[1], "DMSans", 6.9, GOLD_DEEP)
        text(c, MARGIN + 6 + 292, yy, r[2], "DMMono", 6.6, MUTED)
        text(c, MARGIN + 6 + 372, yy, r[3], "DMSans", 6.9, MUTED)
        rule(c, MARGIN, yy - 4.5, CONTENT_W, LINE_INK, 0.4)
        yy -= 17.5

    ry = yy - 26
    block_label(c, MARGIN, ry, "Interaction rules")
    gap = 28
    half = (CONTENT_W - gap) / 2
    left = ["<b>Feedback &lt; 100ms:</b> busy states show instantly — skeletons for fares; the spinner lives inside the pressed button.",
            "<b>Focus always visible:</b> 2px gold outline + 2px offset on every interactive; tab order follows the page.",
            "<b>Nothing loops forever:</b> no carousels, auto-sliders or parallax. The live-dot pulse is the only allowed infinite animation."]
    right = ["<b>Reduced motion:</b> prefers-reduced-motion switches all transforms off — instant fades only. Honour it.",
             "<b>No scroll-jacking:</b> native scroll always; sticky allowed only for the header and the booking summary.",
             "<b>Delight budget:</b> one 'moment' per page, e.g. the booking ticket flipping to CONFIRMED."]
    for i, s in enumerate(left):
        para(c, s, MARGIN, ry - 14 - i * 48, half, "DMSans", 7.6, 10.4, NAVY)
    for i, s in enumerate(right):
        para(c, s, MARGIN + half + gap, ry - 14 - i * 48, half, "DMSans", 7.6, 10.4, NAVY)

    sy = ry - 172
    block_label(c, MARGIN, sy, "Every interactive element ships six states")
    states = ["DEFAULT", "HOVER", "FOCUS", "ACTIVE", "DISABLED", "LOADING"]
    sx = MARGIN
    for s in states:
        w_, _ = chip(c, sx, sy - 24, s, NAVY if s != "LOADING" else GOLD_DEEP, size=6.2, pad=7)
        sx += w_ + 6
    para(c, "A pull request missing a state fails design review. Keep states in CSS custom-property pairs so navy and "
            "paper sections never fork component code.", MARGIN, sy - 42, CONTENT_W, "DMSans", 7.6, 10.6, MUTED)
    content_footer(c, pg)

# ---------------------------------------------------------- 08 UX blueprint
def p12_blueprint(c, pg):
    content_header(c, 8, "UX blueprint — pages & flow")
    y = section_title(c, PAGE_H - 66, 8,
        'From first visit<br/><i><font color="#E16F4B">to paid advance.</font></i>',
        "North Star (from the deck): <b>make travel feel easy before the journey begins.</b> Every page answers "
        "one question and offers one obvious next action.")

    block_label(c, MARGIN, y, "Sitemap & page jobs")
    heads = [("PAGE", 0), ("JOB (ONE LINE)", 92), ("KEY SECTIONS", 226), ("PRIMARY CTA", 416)]
    rows = [
        ("Home", "Orient + route intent in <5s", "Hero banner · popular routes · fleet strip · trust bar · reviews", "Book now"),
        ("Services", "Show the breadth", "4 service cards · how it works · coverage map", "Check a route"),
        ("Routes", "Price transparency", "Route table AGR→DEL/JAI/GWL, per-km rules, fare calc", "Book this route"),
        ("Tour packages", "Inspire multi-day trips", "Taj same-day, Golden Triangle, 3–5 day cards + inclusions", "Enquire / Book"),
        ("Fleet", "Prove the hardware", "Sedan, Ertiga, Innova, Tempo, Urbania cards + specs", "Choose vehicle"),
        ("Book now", "The 5-step flow (below)", "Route → vehicle/date → details → advance → ticket", "Confirm & pay"),
        ("Contact", "Human reassurance", "WhatsApp, call card, address, hours, enquiry form", "Call / WhatsApp"),
        ("Legal & FAQ", "Kill doubts", "Advance refund, cancellation, GST invoice, ID rules", "—")]
    th_y = y - 18
    rect(c, MARGIN, th_y - 4, CONTENT_W, 15, NAVY, r=2)
    for lab, dx in heads: text(c, MARGIN + 6 + dx, th_y, lab, "DMMono-Medium", 5.6, GOLD_LIGHT, tracking=0.6)
    yy = th_y - 20
    for i, r in enumerate(rows):
        st = ParagraphStyle("k", fontName="DMSans", fontSize=6.6, leading=8.4, textColor=MUTED)
        p = Paragraph(r[2], st); pw, ph = p.wrapOn(c, 178, 60)
        rh = max(16, ph + 9)
        yy -= rh
        if i % 2 == 0: rect(c, MARGIN, yy, CONTENT_W, rh, PAPER)
        text(c, MARGIN + 6, yy + rh - 11, r[0], "DMSans-Bold", 7.0, NAVY)
        text(c, MARGIN + 6 + 92, yy + rh - 11, r[1], "DMSans", 7.0, NAVY)
        p.drawOn(c, MARGIN + 6 + 226, yy + rh - 8 - ph + 2)
        text(c, MARGIN + 6 + 416, yy + rh - 11, r[3], "DMSans-Medium", 6.8, GOLD_DEEP)
        rule(c, MARGIN, yy, CONTENT_W, LINE_INK, 0.4)

    fy = yy - 32
    block_label(c, MARGIN, fy, "The booking flow — five steps, under two minutes, one column on mobile")
    steps = [("1", "ROUTE", "Pickup + drop, date, passengers"),
             ("2", "VEHICLE", "Fleet cards, live fare update"),
             ("3", "DETAILS", "Name, phone, pickup point"),
             ("4", "ADVANCE", "UPI/card advance + breakdown"),
             ("5", "TICKET", "Booking ID, driver, receipt")]
    sw = (CONTENT_W - 36) / 5
    cy_ = fy - 72
    for i, (n, t, d) in enumerate(steps):
        x = MARGIN + i * (sw + 9)
        gold = (i == 3)
        rect(c, x, cy_, sw, 58, NAVY if gold else PAPER, None if gold else LINE_INK, 0.9, r=3)
        circle(c, x + 16, cy_ + 43, 8, fill=GOLD if not gold else GOLD_LIGHT)
        ctext(c, x + 16, cy_ + 40.5, n, "DMMono-Medium", 8, NAVY)
        text(c, x + 28, cy_ + 40, t, "DMMono-Medium", 6.4, WHITE if gold else NAVY, tracking=0.7)
        para(c, d, x + 10, cy_ + 30, sw - 20, "DMSans", 6.4, 8.4, MUTED_LT if gold else MUTED)
        if i < 4:
            text(c, x + sw + 1.5, cy_ + 42, "→", "DMSans", 8.5, GOLD_DEEP)
    para(c, "<b>Rules:</b> the fare recalculates inline at every choice · step 4 never appears before the full price is visible · "
            "back-navigation loses nothing · abandoned? offer a resume-via-SMS link · advance shown as '₹X now, ₹Y to driver'.",
         MARGIN, fy - 86, CONTENT_W, "DMSans", 7.4, 10.4, MUTED)

    ty2 = fy - 130
    block_label(c, MARGIN, ty2, "Persistent trust bar — under the hero and beside every fare")
    items = ["GOVT-REGISTERED FLEET", "VERIFIED DRIVERS", "GST INVOICE", "4.9/5 · 380+ TRIPS", "24×7 ON-ROUTE SUPPORT"]
    tx = MARGIN
    for it in items:
        w_, _ = chip(c, tx, ty2 - 24, it, NAVY, size=6.0, pad=7)
        tx += w_ + 8
    content_footer(c, pg)

# ---------------------------------------------------------- 09 a11y & craft
def p13_access(c, pg):
    content_header(c, 9, "Accessibility, performance & voice")
    y = section_title(c, PAGE_H - 66, 9,
        'Premium means<br/><i><font color="#E16F4B">usable by everyone.</font></i>',
        "These are launch gates, not suggestions. A page that fails them doesn't ship.")

    third = (CONTENT_W - 20) / 3
    a11y = [("Contrast", "Body ≥ 4.5:1, large ≥ 3:1 (matrix, p.4)"),
            ("Touch targets", "≥ 44×44px, 8px min separation"),
            ("Focus", "2px gold ring, logical tab order, skip-link"),
            ("Forms", "Visible labels; errors as text + icon, never colour-only"),
            ("Media", "Alt text on every photo; decorative = empty alt"),
            ("Headings", "One H1, no skipped levels; breadcrumbs on deep pages"),
            ("Motion", "prefers-reduced-motion fully honoured")]
    perf = [("LCP", "≤ 2.5s on 4G — hero ≤ 220KB, preloaded"),
            ("CLS", "< 0.1 — width/height set on all media"),
            ("JS", "≤ 180KB gzip first load; booking flow code-split"),
            ("Fonts", "Self-host 3 families, latin subset, display=swap"),
            ("Images", "WebP/AVIF, lazy below fold; no BMP/PNG photos"),
            ("Cache", "1-year immutable assets; HTML no-cache"),
            ("Fallback", "Form + phone CTA still work if API is down")]
    voice = [("Say", "“Agra to Delhi, from ₹3,500. Book in 2 minutes.”"),
             ("Say", "“Your driver: Rakesh · 4.9/5 · arrives 6:45 AM.”"),
             ("Say", "“Advance ₹500 now, the rest to your driver.”"),
             ("Avoid", "Hype: “best cheapest amazing cabs!!”"),
             ("Avoid", "Vague: “competitive rates”, “quality service”"),
             ("Avoid", "All-caps paragraphs, exclamation stacks"),
             ("Rule", "Short declaratives. Numbers over adjectives.")]
    for col, (title, data) in enumerate([("ACCESSIBILITY", a11y), ("PERFORMANCE BUDGET", perf), ("VOICE & TONE", voice)]):
        x = MARGIN + col * (third + 10)
        rect(c, x, y - 224, third, 216, PAPER, LINE_INK, 0.9, r=3)
        text(c, x + 12, y - 26, title, "DMMono-Medium", 6.0, GOLD_DEEP, tracking=0.9)
        yy = y - 46
        for k, v in data:
            text(c, x + 12, yy, k.upper(), "DMMono-Medium", 5.4, MUTED, tracking=0.6)
            ph = para(c, v, x + 12, yy - 3, third - 26, "DMSans", 6.7, 8.8, NAVY)
            yy -= max(26, ph + 15)

    sy = y - 258
    block_label(c, MARGIN, sy, "SEO baseline (inside scope)")
    para(c, "Unique <b>title + meta</b> per page · <b>LocalBusiness / TaxiService schema</b> with areaServed, phone, geo · "
            "semantic landmarks (header/main/nav/footer) · clean slugs (/routes/agra-to-delhi) · sitemap.xml + robots.txt · "
            "OG/Twitter cards from the navy-gold banner art · Core Web Vitals green on mobile.",
         MARGIN, sy - 8, CONTENT_W, "DMSans", 7.8, 11.2, MUTED)

    dy = sy - 84
    rect(c, MARGIN, dy - 88, CONTENT_W, 80, NAVY, r=3)
    sparkle(c, MARGIN + 17, dy - 24, 4.6, GOLD)
    text(c, MARGIN + 30, dy - 28, "DEFINITION OF DONE — PER PAGE", "DMMono-Medium", 6.2, GOLD_LIGHT, tracking=1.0)
    para(c, "Matches this system (tokens only — no stray hex) · six states per interactive · AA contrast · LCP within budget · "
            "empty / error / loading copy written · analytics events (view, cta_click, booking_step) wired · PM sign-off screenshots archived.",
         MARGIN + 30, dy - 36, CONTENT_W - 66, "DMSans", 7.6, 10.4, MUTED_LT)
    content_footer(c, pg)

# ---------------------------------------------------------- 10 handoff
def p14_handoff(c, pg):
    content_header(c, 10, "Developer handoff & approval")
    block_label(c, MARGIN, PAGE_H - 74, "SECTION 10 · FINAL", GOLD_DEEP)
    text(c, MARGIN, PAGE_H - 96, "Drop-in tokens & next steps.", "Fraunces", 21, NAVY)

    y = PAGE_H - 120
    css_lines = [
        ('#778087', '/* SK Baghel website tokens · v1.0 · Dark Navy + Golden */'),
        ('#4D8580', ':root {'),
        ('#FFFDF8', '  /* surfaces */              /* gold scale */'),
        ('#FFFDF8', '  --navy-deep: #0B171E;        --gold:        #E5A044;'),
        ('#FFFDF8', '  --navy:      #10212D;        --gold-light:  #F3C36C;'),
        ('#FFFDF8', '  --navy-soft: #173444;        --gold-deep:   #B27123;'),
        ('#FFFDF8', '  /* warm neutrals */          --gold-wash:   #FBF1DE;'),
        ('#FFFDF8', '  --paper:     #F5F0E8;        --gold-text:   #8A5A17;  /* AA small text */'),
        ('#FFFDF8', '  --paper-lt:  #FCFAF6;        /* support */'),
        ('#FFFDF8', '  --paper-dk:  #EAE4DA;        --coral: #E16F4B;  /* italic serif accent */'),
        ('#FFFDF8', '  --white:     #FFFDF8;        --teal:  #4D8580;  /* info / on-route */'),
        ('#FFFDF8', '  --muted-2:   #5B656D;  /* AA body-secondary on light */'),
        ('#FFFDF8', '  --muted-lt:  #AEB8B9;  /* secondary on navy */'),
        ('#FFFDF8', '  --success: #3E7C62; --error: #C24A33;  /* semantic (proposed) */'),
        ('#FFFDF8', '  --line: rgba(16,33,45,.14); --line-lt: rgba(255,255,255,.16);'),
        ('#FFFDF8', "  --sans: 'DM Sans', sans-serif;  --display: 'Fraunces', serif;"),
        ('#FFFDF8', "  --mono: 'DM Mono', monospace;   --ease: 180ms ease;"),
        ('#778087', '  /* layout: header 78px · container 1140px · radius 3px (pills 999px) */'),
        ('#FFFDF8', '}')]
    ph = 234
    rect(c, MARGIN, y - ph, CONTENT_W, ph, NAVY_DEEP, r=4)
    c.setFillColor(Color(1, 1, 1, alpha=0.06)); c.roundRect(MARGIN, y - 4, CONTENT_W, 15, 4, fill=1, stroke=0)
    circle(c, MARGIN + 13, y + 3.5, 2.4, fill=CORAL); circle(c, MARGIN + 22, y + 3.5, 2.4, fill=GOLD); circle(c, MARGIN + 31, y + 3.5, 2.4, fill=TEAL)
    text(c, MARGIN + 44, y + 1, "tokens.css", "DMMono", 6.2, MUTED_LT)
    ly = y - 16
    for colr, ln in css_lines:
        text(c, MARGIN + 14, ly, ln, "DMMono", 6.3, HexColor(colr))
        ly -= 11.6

    sy = y - ph - 30
    half = (CONTENT_W - 16) / 2
    block_label(c, MARGIN, sy, "Suggested structure")
    tree = ['fonts/        fraunces · dm-sans · dm-mono (woff2, latin)',
            'css/          tokens.css · base.css · components/ · pages/',
            'assets/       hero/ · fleet/ · packages/  (webp + avif)',
            'js/           booking.js · fares.js',
            'pages         index · routes · packages · fleet · book/']
    for i, ln in enumerate(tree):
        text(c, MARGIN, sy - 18 - i * 12.5, ln, "DMMono", 6.2, MUTED)
    block_label(c, MARGIN + half + 16, sy, "Asset checklist before build")
    checklist = ["Real fleet photos (6–10 per vehicle class), graded",
                 "Driver/team portraits for the trust bar",
                 "Route & fare table CSV — per-km + fixed drops",
                 "UPI/Razorpay keys, GST & licence details",
                 "Logo SVG final + favicon set (navy tile)",
                 "OG banner from hero art (1200×630)"]
    for i, item in enumerate(checklist):
        yy = sy - 18 - i * 15
        rect(c, MARGIN + half + 16, yy - 2.5, 8, 8, None, GOLD_DEEP, 0.9, r=2)
        text(c, MARGIN + half + 30, yy, item, "DMSans", 7.2, NAVY)

    ny = sy - 136
    steps = [("01", "Approve system", "Sign-off locks colour, type, components"),
             ("02", "Collect content", "Photos, fares, fleet data (list above)"),
             ("03", "Build sprint 1", "Tokens → components → hero → booking"),
             ("04", "Stage & review", "Real devices, then remaining pages")]
    qw = (CONTENT_W - 24) / 4
    for i, (n, t, d) in enumerate(steps):
        x = MARGIN + i * (qw + 8)
        rect(c, x, ny - 58, qw, 50, PAPER, LINE_INK, 0.9, r=3)
        text(c, x + 10, ny - 22, n, "DMMono-Medium", 6.8, GOLD_DEEP)
        text(c, x + 26, ny - 22.5, t, "DMSans-Bold", 7.4, NAVY)
        para(c, d, x + 10, ny - 30, qw - 20, "DMSans", 6.3, 8.4, MUTED)
        if i < 3: text(c, x + qw - 1, ny - 34, "→", "DMSans", 8.5, GOLD_DEEP)

    ay = ny - 92
    rect(c, MARGIN, ay - 68, CONTENT_W, 60, NAVY, r=3)
    c.setFillColor(GOLD); c.rect(MARGIN, ay - 68, 3, 60, fill=1, stroke=0)
    text(c, MARGIN + 16, ay - 22, "APPROVAL", "DMMono-Medium", 6.0, GOLD_LIGHT, tracking=1.0)
    para(c, "“I approve the Dark Navy + Golden design system (v1.0) as the basis for the SK Baghel website. "
            "The hex values, fonts, component specs and page blueprints in this document are final for development.”",
         MARGIN + 16, ay - 28, CONTENT_W - 190, "Fraunces", 8.2, 11, WHITE)
    text(c, MARGIN + 16, ay - 60, "NAME / SIGNATURE", "DMMono", 5.2, MUTED_LT, tracking=0.7)
    rule(c, MARGIN + 88, ay - 58, 140, Color(1, 1, 1, alpha=0.34), 0.7)
    text(c, MARGIN + 246, ay - 60, "DATE", "DMMono", 5.2, MUTED_LT, tracking=0.7)
    rule(c, MARGIN + 272, ay - 58, 80, Color(1, 1, 1, alpha=0.34), 0.7)
    rect(c, MARGIN + CONTENT_W - 128, ay - 48, 114, 26, GOLD, r=3)
    ctext(c, MARGIN + CONTENT_W - 71, ay - 39, "Start the build ↗", "DMSans-Bold", 7.6, NAVY)
    content_footer(c, pg)
