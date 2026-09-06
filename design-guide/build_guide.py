"""Build SK-Baghel-Website-Design-System.pdf (14 pages, A4)."""
import os
from reportlab.pdfgen import canvas
from dg_kit import PAGE_W, PAGE_H, register_fonts, BASE
import pages_a, pages_b

OUT = os.path.join(BASE, "SK-Baghel-Website-Design-System.pdf")

PAGES = [
    pages_a.p01_cover,
    pages_a.p02_direction,
    pages_a.p03_color,
    pages_a.p04_color_usage,
    pages_a.p05_type,
    pages_a.p06_type_rules,
    pages_a.p07_spacing,
    pages_b.p08_buttons_forms,
    pages_b.p09_cards_nav,
    pages_b.p10_imagery,
    pages_b.p11_motion,
    pages_b.p12_blueprint,
    pages_b.p13_access,
    pages_b.p14_handoff,
]

def main():
    register_fonts()
    c = canvas.Canvas(OUT, pagesize=(PAGE_W, PAGE_H))
    c.setTitle("SK Baghel — Website Design System & UX Playbook v1.0")
    c.setAuthor("Product & UI/UX — SK Baghel Tour & Travels Website Project")
    c.setSubject("Dark Navy + Golden design system: colors, typography, components, imagery, motion, accessibility, UX blueprint")
    for i, fn in enumerate(PAGES, start=1):
        fn(c, i)
        c.showPage()
    c.save()
    print("wrote", OUT, os.path.getsize(OUT), "bytes")

if __name__ == "__main__":
    main()
