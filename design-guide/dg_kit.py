"""Design-system PDF toolkit — SK Baghel Tour & Travels website design guide.
Drawing helpers, tokens, fonts. Used by build_guide.py."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily, stringWidth
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import Paragraph

BASE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(BASE, "fonts")
ASSETS = os.path.join(BASE, "assets")

PAGE_W, PAGE_H = A4          # 595.27 x 841.88
MARGIN = 46
CONTENT_W = PAGE_W - 2 * MARGIN

# ---------- Tokens (extracted from repo styles.css, adapted to approved navy+gold direction) ----------
NAVY_DEEP  = HexColor("#0B171E")   # --ink-deep   : page bg, header, footer
NAVY       = HexColor("#10212D")   # --ink        : primary text / dark sections
NAVY_SOFT  = HexColor("#173444")   # --ink-soft   : raised panels on navy
GOLD       = HexColor("#E5A044")   # --saffron    : primary CTA / accent
GOLD_LIGHT = HexColor("#F3C36C")   # --saffron-light : accent on navy
GOLD_DEEP  = HexColor("#B27123")   # from btn shadow rgba(178,113,35) : hover gold
PAPER      = HexColor("#F5F0E8")   # --paper
PAPER_LT   = HexColor("#FCFAF6")   # --paper-light
PAPER_DK   = HexColor("#EAE4DA")   # --paper-dark
CARD_LT    = HexColor("#EEF0EA")   # service-card light bg
WHITE      = HexColor("#FFFDF8")   # --white (warm)
MUTED      = HexColor("#778087")   # --muted
MUTED_LT   = HexColor("#AEB8B9")   # --muted-light
CORAL      = HexColor("#E16F4B")   # --coral (editorial italic accent on light)
TEAL       = HexColor("#4D8580")   # --teal
LINE_INK   = Color(16/255, 33/255, 45/255, alpha=0.14)     # --line
LINE_LIGHT = Color(1, 1, 1, alpha=0.16)                    # --line-light
# Proposed semantic additions (marked as proposed in doc)
SUCCESS = HexColor("#3E7C62")
ERROR   = HexColor("#C24A33")
INFO    = HexColor("#2F6E91")

# ---------- Fonts ----------
def register_fonts():
    reg = pdfmetrics.registerFont
    reg(TTFont("DMSans",          os.path.join(FONTS, "DMSans-Regular.ttf")))
    reg(TTFont("DMSans-Medium",   os.path.join(FONTS, "DMSans-Medium.ttf")))
    reg(TTFont("DMSans-Bold",     os.path.join(FONTS, "DMSans-Bold.ttf")))
    reg(TTFont("DMSans-Italic",   os.path.join(FONTS, "DMSans-Italic.ttf")))
    reg(TTFont("Fraunces",        os.path.join(FONTS, "Fraunces-Medium.ttf")))
    reg(TTFont("Fraunces-Semi",   os.path.join(FONTS, "Fraunces-SemiBold.ttf")))
    reg(TTFont("Fraunces-Italic", os.path.join(FONTS, "Fraunces-MediumItalic.ttf")))
    reg(TTFont("DMMono",          os.path.join(FONTS, "DMMono-Regular.ttf")))
    reg(TTFont("DMMono-Medium",   os.path.join(FONTS, "DMMono-Medium.ttf")))
    registerFontFamily("DMSans", normal="DMSans", bold="DMSans-Bold",
                       italic="DMSans-Italic", boldItalic="DMSans-Bold")
    registerFontFamily("Fraunces", normal="Fraunces", bold="Fraunces-Semi",
                       italic="Fraunces-Italic", boldItalic="Fraunces-Semi")

# ---------- Geometry helpers ----------
def text(c, x, y, s, font="DMSans", size=9, color=NAVY, tracking=0):
    """Draw single-line text. y = baseline. Tracking is fully sandboxed."""
    c.setFont(font, size)
    c.setFillColor(color)
    if tracking:
        c.saveState()                      # Tc leaks into Paragraph metrics otherwise
        tx = c.beginText(x, y)
        tx.setFont(font, size)
        tx.setCharSpace(tracking)
        tx.textOut(s)
        c.drawText(tx)
        c.restoreState()
        try:
            c.setCharSpace(0)
        except Exception:
            pass
    else:
        c.drawString(x, y, s)

def rtext(c, x, y, s, font="DMSans", size=9, color=NAVY, tracking=0):
    w = stringWidth(s, font, size) + (len(s) - 1) * tracking if tracking else stringWidth(s, font, size)
    text(c, x - w, y, s, font, size, color, tracking)

def ctext(c, x, y, s, font="DMSans", size=9, color=NAVY, tracking=0):
    w = stringWidth(s, font, size) + (len(s) - 1) * tracking if tracking else stringWidth(s, font, size)
    text(c, x - w / 2.0, y, s, font, size, color, tracking)

def eyebrow(c, x, y, s, color=GOLD_DEEP, size=7.2, tick=True, tick_color=None):
    """Mono uppercase eyebrow with small leading tick — mirrors repo .eyebrow."""
    if tick:
        c.setStrokeColor(tick_color or GOLD)
        c.setLineWidth(1.4)
        c.line(x, y + size * 0.36, x + 16, y + size * 0.36)
        x += 22
    text(c, x, y, s.upper(), "DMMono-Medium", size, color, tracking=1.1)

def para(c, s, x, y_top, w, font="DMSans", size=9.2, leading=13.2, color=NAVY,
         align=TA_LEFT):
    """Draw wrapped paragraph from top edge; return height used."""
    try:
        c.setCharSpace(0)                  # defensive: never inherit letter-tracking
    except Exception:
        pass
    st = ParagraphStyle("p", fontName=font, fontSize=size, leading=leading,
                        textColor=color, alignment=align)
    p = Paragraph(s, st)
    pw, ph = p.wrapOn(c, w, PAGE_H)
    p.drawOn(c, x, y_top - ph)
    return ph

def rule(c, x, y, w, color=LINE_INK, lw=0.7):
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x, y, x + w, y)

def vrule(c, x, y, h, color=LINE_INK, lw=0.7):
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x, y, x, y + h)

def rect(c, x, y, w, h, fill=None, stroke=None, lw=0.8, r=0):
    if fill: c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke); c.setLineWidth(lw)
    if r: c.roundRect(x, y, w, h, r, stroke=1 if stroke else 0, fill=1 if fill else 0)
    else: c.rect(x, y, w, h, stroke=1 if stroke else 0, fill=1 if fill else 0)

def circle(c, x, y, rad, fill=None, stroke=None, lw=0.8):
    if fill: c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke); c.setLineWidth(lw)
    c.circle(x, y, rad, stroke=1 if stroke else 0, fill=1 if fill else 0)

def sparkle(c, x, y, r, color=GOLD):
    """4-point sparkle — repo uses glyph ✦; we draw it."""
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x, y + r); p.curveTo(x + r*0.16, y + r*0.16, x + r*0.16, y + r*0.16, x + r, y)
    p.curveTo(x + r*0.16, y - r*0.16, x + r*0.16, y - r*0.16, x, y - r)
    p.curveTo(x - r*0.16, y - r*0.16, x - r*0.16, y - r*0.16, x - r, y)
    p.curveTo(x - r*0.16, y + r*0.16, x - r*0.16, y + r*0.16, x, y + r)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

def check(c, x, y, s=5, color=SUCCESS, lw=1.6):
    c.setStrokeColor(color); c.setLineWidth(lw)
    c.setLineCap(1)
    c.line(x, y + s*0.45, x + s*0.38, y)
    c.line(x + s*0.38, y, x + s, y + s)

def cross(c, x, y, s=5, color=ERROR, lw=1.6):
    c.setStrokeColor(color); c.setLineWidth(lw)
    c.setLineCap(1)
    c.line(x, y, x + s, y + s)
    c.line(x, y + s, x + s, y)

def logo_mark(c, x, y, s=18, light=True):
    """Approximation of repo .brand-mark mountain/road mark."""
    main = WHITE if light else NAVY
    c.setFillColor(main)
    p = c.beginPath()
    p.moveTo(x + s*0.17, y + s*0.29)
    p.lineTo(x + s*0.50, y + s*0.80)
    p.lineTo(x + s*0.59, y + s*0.65)
    p.lineTo(x + s*0.44, y + s*0.42)
    p.lineTo(x + s*0.84, y + s*0.42)
    p.lineTo(x + s*0.67, y + s*0.19)
    p.lineTo(x + s*0.17, y + s*0.19)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.setFillColor(HexColor("#F3B34C"))
    p2 = c.beginPath()
    p2.moveTo(x + s*0.503, y + s*0.80)
    p2.lineTo(x + s*0.617, y + s*0.625)
    p2.lineTo(x + s*0.514, y + s*0.467)
    p2.lineTo(x + s*0.428, y + s*0.637)
    p2.close()
    c.drawPath(p2, fill=1, stroke=0)

def brand_lockup(c, x, y, light=True):
    logo_mark(c, x, y - 2, 17, light)
    text(c, x + 24, y + 3.5, "SK BAGHEL", "DMSans-Bold", 9.2,
         WHITE if light else NAVY, tracking=1.3)
    text(c, x + 24, y - 5.5, "TOUR & TRAVELS", "DMMono", 5.4,
         MUTED_LT, tracking=1.15)

# ---------- Page chrome ----------
SECTIONS = {}   # filled at runtime: {section_no: title}
TOTAL_PAGES = 14

def content_header(c, sec_no, sec_title):
    c.setFillColor(PAPER_LT)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    brand_lockup(c, MARGIN, PAGE_H - 30, light=False)
    rtext(c, PAGE_W - MARGIN, PAGE_H - 27, "SECTION %02d — %s" % (sec_no, sec_title.upper()),
          "DMMono-Medium", 6.4, MUTED, tracking=1.0)
    rtext(c, PAGE_W - MARGIN, PAGE_H - 36, "WEBSITE DESIGN SYSTEM & UX PLAYBOOK · V1.0",
          "DMMono", 5.6, MUTED, tracking=0.9)
    c.setStrokeColor(LINE_INK); c.setLineWidth(0.8)
    c.line(MARGIN, PAGE_H - 46, PAGE_W - MARGIN, PAGE_H - 46)
    c.setStrokeColor(GOLD); c.setLineWidth(1.6)
    c.line(MARGIN, PAGE_H - 46, MARGIN + 34, PAGE_H - 46)
    return PAGE_H - 46   # y of header rule

def content_footer(c, page_no):
    rule(c, MARGIN, 39, CONTENT_W, LINE_INK, 0.8)
    text(c, MARGIN, 27, "SK BAGHEL TOUR & TRAVELS — WEBSITE PROJECT", "DMMono", 5.6, MUTED, tracking=0.7)
    rtext(c, PAGE_W - MARGIN, 27, "DESIGN SYSTEM · V1.0", "DMMono", 5.6, MUTED, tracking=0.7)
    text(c, PAGE_W / 2 - 12, 27, "%02d / %d" % (page_no, TOTAL_PAGES), "DMMono-Medium", 6.2, GOLD_DEEP)

def section_title(c, y, sec_no, title_html, intro=None, accent_i=True):
    """Big Fraunces section opener; returns y cursor (top of remaining space)."""
    eyebrow(c, MARGIN, y - 10, "SECTION %02d" % sec_no, GOLD_DEEP, 7.2)
    st = ParagraphStyle("h", fontName="Fraunces", fontSize=25, leading=26,
                        textColor=NAVY)
    p = Paragraph(title_html, st)
    pw, ph = p.wrapOn(c, CONTENT_W, 200)
    p.drawOn(c, MARGIN, y - 22 - ph)
    cy = y - 22 - ph - 12
    if intro:
        hp = para(c, intro, MARGIN, cy, 330, "DMSans", 9.2, 13.6, MUTED)
        cy -= hp + 8
    return cy

def block_label(c, x, y, s, color=NAVY):
    text(c, x, y, s.upper(), "DMMono-Medium", 6.8, color, tracking=1.15)

def chip(c, x, y, s, fg=GOLD_DEEP, border=None, size=6.6, pad=5, mono=True):
    """Small pill/tag. Returns (width, height)."""
    font = "DMMono-Medium" if mono else "DMSans-Bold"
    label = s.upper() if mono else s
    trk = 0.5
    tw = stringWidth(label, font, size) + trk * (len(label) - 1)
    w = tw + pad * 2
    h = size + 7
    rect(c, x, y, w, h, None, border or Color(fg.red, fg.green, fg.blue, alpha=0.45), 0.7, r=(h/2))
    text(c, x + pad, y + 3.4, label, font, size, fg, tracking=trk)
    return w, h

# ---------- Contrast ----------
def _lum(hexc):
    vals = []
    for i in (1, 3, 5):
        u = int(hexc[i:i+2], 16) / 255.0
        vals.append(u / 12.92 if u <= 0.03928 else ((u + 0.055) / 1.055) ** 2.4)
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]

def contrast(a_hex, b_hex):
    l1, l2 = sorted([_lum(a_hex), _lum(b_hex)], reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)

def wcag_badge(ratio, large=False):
    if ratio >= 7: return "AAA"
    if ratio >= 4.5: return "AA"
    if large and ratio >= 3: return "AA-L"
    return "FAIL"
