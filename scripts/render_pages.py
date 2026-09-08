#!/usr/bin/env python3
"""SSG: bilingual marketing pages + booking app. Data-driven, static HTML."""
from __future__ import annotations

import json
import re
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import quote_plus

from catalog import (
    ADDRESS,
    CITIES,
    EMAIL,
    GEO,
    GST,
    HOURS,
    MAPS_URL,
    PACKAGES,
    PHONE,
    PHONE_DISPLAY,
    ROUTES,
    SITE,
    VEHICLES,
    WHATSAPP,
    AIRPORT_STATION_TRANSFERS,
    CANCELLATION_POLICY_CAB,
    CANCELLATION_SLABS_TOUR,
    NIGHT_ALLOWANCE_CAB,
    NIGHT_ALLOWANCE_TEMPO,
    OUTSTATION_MIN_KM,
    PROMO_CODE,
    PROMO_DISCOUNT,
    ROUTE_GUIDANCE,
    hub_path,
    inr,
    package_path,
    route_path,
    vehicle,
    vehicle_path,
)
from i18n import BRAND_SVG, T
from images import ensure_derivatives, webp_size

ROOT = Path(__file__).resolve().parents[1]
FONTS_EN = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap"
FONTS_HI = FONTS_EN + "&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Serif+Devanagari:wght@500;600"

# Inline SVG icons for high-performance zero-dependency rendering
ICON_CALL = '<span class="icon icon-call" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>'
ICON_WA = '<span class="icon icon-wa" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>'
ICON_EMAIL = '<span class="icon icon-email" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>'
ICON_MAP = '<span class="icon icon-map" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>'
ICON_COMPASS = '<span class="icon icon-compass" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></span>'
ICON_CAR = '<span class="icon icon-car" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></span>'
ICON_ACTION = '<span class="icon icon-action" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>'

# Offer validity for JSON-LD: rebuilds roll this forward automatically, so the
# schema never advertises a stale date (Google flags expired priceValidUntil).
PRICE_VALID_UNTIL = (date.today() + timedelta(days=365)).isoformat()

# Base-agnostic URLs. Templates emit root-relative URLs ("/css/…", "/book.html"),
# which the build rewrites to *page-relative* ones ("css/…", "../../css/…") based
# on each output file's depth. A single build then works at ANY base path: the
# custom-domain root (skbagheltravels.in), the GitHub Pages project subpath
# (/ArenaAI/), and every local preview server — no per-host rebuilds.

# Matches root-relative URLs in HTML attributes (imagesrcset too — used on the
# responsive hero preload; without it the subpath deploy 404s the LCP image).
_ATTR_RE = re.compile(r'\b(href|src|srcset|imagesrcset|action|data-href|data-src)="(/[^"]*)"')


def page_base(rel_path: str) -> str:
    """Relative base (".", "../..", …) from a generated file back to the site root."""
    depth = len(Path(rel_path).parent.parts)
    return "." if depth == 0 else "/".join([".."] * depth)


def rebase(markup: str, rel_path: str) -> str:
    """Rewrite root-relative URLs to page-relative for the file at `rel_path`
    (path relative to the repo root, e.g. "hi/packages/x/index.html")."""
    prefix = page_base(rel_path) + "/"

    def repl(m: re.Match) -> str:
        attr, value = m.group(1), m.group(2)
        if attr in ("srcset", "imagesrcset"):
            parts = []
            for item in value.split(","):
                item = item.strip()
                if not item:
                    continue
                urlpart, _, descriptor = item.partition(" ")
                parts.append(prefix + urlpart.lstrip("/") + (f" {descriptor}" if descriptor else ""))
            return f'{attr}="{", ".join(parts)}"'
        return f'{attr}="{prefix}{value.lstrip("/")}"'

    out = _ATTR_RE.sub(repl, markup)
    # meta refresh redirects and inline location.replace() redirects
    out = out.replace("url=/", f"url={prefix}")
    out = re.sub(
        r"location\.replace\('(/[^']*)'\)",
        lambda m: f"location.replace('{prefix}{m.group(1).lstrip('/')}')",
        out,
    )
    return out


SITEMAP_URLS: list[str] = []


def url(path: str) -> str:
    if path == "/":
        return SITE + "/"
    return SITE + path


def ld(obj) -> str:
    return f'<script type="application/ld+json">{json.dumps(obj, ensure_ascii=False)}</script>'


def org_schema():
    return {
        "@context": "https://schema.org",
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        "@id": f"{SITE}/#business",
        "name": "SK Baghel Tour & Travels",
        "url": SITE,
        "telephone": PHONE,
        "email": EMAIL,
        "image": f"{SITE}/assets/brand/og-banner.webp",
        "priceRange": "₹₹",
        "areaServed": ["Agra", "Delhi", "Jaipur", "Mathura", "Gwalior", "Lucknow"],
        "contactPoint": [{
            "@type": "ContactPoint",
            "telephone": PHONE,
            "contactType": "customer service",
            "areaServed": "IN",
            "availableLanguage": ["en-IN", "hi-IN"],
        }],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Near Taj East Gate Road, Taj Ganj",
            "addressLocality": "Agra",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "282001",
            "addressCountry": "IN",
        },
        "geo": {"@type": "GeoCoordinates", "latitude": GEO["lat"], "longitude": GEO["lng"]},
        "openingHours": "Mo-Su 00:00-23:59",
    }


def crumbs(items):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": url(path)}
            for i, (name, path) in enumerate(items)
        ],
    }


def seo_head(*, title, description, path, alt_path, lang, extra="", noindex=False, jsonld=None):
    t = T[lang]
    other = "hi" if lang == "en" else "en"
    robots = "noindex,nofollow" if noindex else "index,follow"
    parts = [
        f'<title>{title}</title>',
        f'<meta name="description" content="{description}" />',
        f'<meta name="robots" content="{robots}" />',
        f'<link rel="canonical" href="{url(path)}" />',
        f'<link rel="alternate" hreflang="{t["hreflang"]}" href="{url(path)}" />',
        f'<link rel="alternate" hreflang="{T[other]["hreflang"]}" href="{url(alt_path)}" />',
        f'<link rel="alternate" hreflang="x-default" href="{url(path if lang == "en" else alt_path)}" />',
        f'<meta property="og:type" content="website" />',
        f'<meta property="og:locale" content="{t["locale"]}" />',
        f'<meta property="og:locale:alternate" content="{T[other]["locale"]}" />',
        f'<meta property="og:site_name" content="SK Baghel Tour &amp; Travels" />',
        f'<meta property="og:title" content="{title}" />',
        f'<meta property="og:description" content="{description}" />',
        f'<meta property="og:url" content="{url(path)}" />',
        f'<meta property="og:image" content="{SITE}/assets/brand/og-banner.webp" />',
        f'<meta property="og:image:width" content="1200" />',
        f'<meta property="og:image:height" content="630" />',
        f'<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{title}" />',
        f'<meta name="twitter:description" content="{description}" />',
        f'<meta name="twitter:image" content="{SITE}/assets/brand/og-banner.webp" />',
    ]
    if extra:
        parts.append(extra)
    for obj in jsonld or []:
        parts.append(ld(obj))
    return "\n    ".join(parts)


def cinematic_theme_toggle_html(cls: str = ""):
    return f"""\
<button class="cinematic-theme-toggle {cls}" type="button" role="switch" aria-checked="false" aria-label="Switch to dark mode" title="Toggle theme">
  <span class="cinematic-icons" aria-hidden="true">
    <svg class="cinematic-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    <svg class="cinematic-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  </span>
  <span class="cinematic-puck" aria-hidden="true">
    <svg class="cinematic-puck-icon sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    <svg class="cinematic-puck-icon moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  </span>
  <span class="cinematic-particles" aria-hidden="true"></span>
</button>"""


def contact_card_html(lang: str, is_standalone_page: bool = False) -> str:
    t = T[lang]
    heading_tag = (
        f'<h2 class="contact-card-title">{"पूछताछ और 24×7 सहायता" if lang == "hi" else "Direct Inquiries &amp; 24×7 Dispatch"}</h2>'
        if is_standalone_page
        else f'<h3 class="contact-card-title">{"सीधे संपर्क करें" if lang == "hi" else "Direct Inquiries &amp; 24×7 Dispatch"}</h3>'
    )
    desc_text = (
        "ताज गंज कार्यालय • 24 घंटे बुकिंग डेस्क। किसी भी रूट या टूर पूछताछ के लिए सीधे कॉल, व्हाट्सऐप या संदेश भेजें।"
        if lang == "hi"
        else "Office in Taj Ganj beside the Taj Mahal. 24×7 dispatch desk for airport drops, outstation cabs, and custom sightseeing."
    )
    name_label = "आपका नाम" if lang == "hi" else "Your Name"
    name_ph = "उदा. राहुल शर्मा" if lang == "hi" else "e.g. Rahul Sharma"
    phone_label = "फ़ोन नंबर" if lang == "hi" else "Phone Number"
    phone_ph = f"उदा. {PHONE_DISPLAY}" if lang == "hi" else f"e.g. {PHONE_DISPLAY}"
    msg_label = "यात्रा संदेश या रूट विवरण" if lang == "hi" else "Trip Details or Message"
    msg_ph = "तारीख, रूट या यात्रियों की संख्या लिखें..." if lang == "hi" else "Travel dates, route, or number of passengers..."
    submit_text = t["enquire"]

    return f"""\
<div class="contact-card-wrap">
  <div class="contact-card">
    <svg class="corner-plus corner-plus--tl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <svg class="corner-plus corner-plus--tr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <svg class="corner-plus corner-plus--bl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <svg class="corner-plus corner-plus--br" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

    <div class="contact-card-info">
      <div class="contact-card-header">
        {heading_tag}
        <p class="contact-card-desc">{desc_text}</p>
      </div>

      <div class="contact-tiles-grid">
        <a class="contact-tile" href="tel:{PHONE}" aria-label="{t['call']}: {PHONE_DISPLAY}">
          <div class="contact-tile-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div>
            <span class="contact-tile-label">{t['call']}</span>
            <span class="contact-tile-value">{PHONE_DISPLAY}</span>
          </div>
        </a>

        <a class="contact-tile" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer" aria-label="{t['whatsapp']}: SK Baghel">
          <div class="contact-tile-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <div>
            <span class="contact-tile-label">{t['whatsapp']}</span>
            <span class="contact-tile-value">SK Baghel</span>
          </div>
        </a>

        <a class="contact-tile" href="mailto:{EMAIL}" aria-label="Email: {EMAIL}">
          <div class="contact-tile-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>
          <div>
            <span class="contact-tile-label">Email</span>
            <span class="contact-tile-value">{EMAIL}</span>
          </div>
        </a>

        <a class="contact-tile" href="{MAPS_URL}" target="_blank" rel="noreferrer" aria-label="Office Location: Taj Ganj, Agra">
          <div class="contact-tile-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <span class="contact-tile-label">{"कार्यालय / Maps" if lang == "hi" else "Office Location"}</span>
            <span class="contact-tile-value">{"ताज गंज, आगरा" if lang == "hi" else "Taj Ganj, Agra"}</span>
          </div>
        </a>

        <div class="contact-tile col-span-full">
          <div class="contact-tile-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <span class="contact-tile-label">{"उपलब्धता / Hours" if lang == "hi" else "Availability / Dispatch"}</span>
            <span class="contact-tile-value">{"24 घंटे सेवा • Near Taj East Gate Rd" if lang == "hi" else "24×7 Active Dispatch • Near Taj East Gate Rd"}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="contact-card-form">
      <form id="contact-form" action="mailto:{EMAIL}" method="post" enctype="text/plain">
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-name">{name_label}</label>
          <input class="contact-form-input" id="contact-name" name="name" type="text" autocomplete="name" placeholder="{name_ph}" required />
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-phone">{phone_label}</label>
          <input class="contact-form-input" id="contact-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="{phone_ph}" required />
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-message">{msg_label}</label>
          <textarea class="contact-form-textarea" id="contact-message" name="message" rows="3" placeholder="{msg_ph}" required></textarea>
        </div>
        <button class="btn-primary contact-form-submit" type="submit">
          <span>{submit_text}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </form>
    </div>
  </div>
</div>"""


def get_nav_dropdown_data(lang: str):
    t = T[lang]
    is_hi = lang == "hi"

    services_items = [
        {"title": "आउटस्टेशन कैब" if is_hi else "Outstation Cabs", "url": f"/{lang}/services/#outstation", "meta": "दिल्ली, जयपुर" if is_hi else "Delhi, Jaipur"},
        {"title": "लोकल आगरा दर्शन" if is_hi else "Local Agra Sightseeing", "url": f"/{lang}/services/#local", "meta": "ताजमहल, किला" if is_hi else "Taj Mahal, Fort"},
        {"title": "एयरपोर्ट पिक व ड्रॉप" if is_hi else "Airport Transfers", "url": f"/{lang}/services/#airport", "meta": "IGI दिल्ली व आगरा" if is_hi else "IGI Delhi & Agra"},
        {"title": "टेम्पो व ग्रुप यात्रा" if is_hi else "Tempo & Group Travel", "url": f"/{lang}/services/#corporate", "meta": "12–26 सीटर" if is_hi else "12–26 Seater"},
    ]

    routes_items = [
        {
            "title": f"{CITIES[r['from']][lang]} → {CITIES[r['to']][lang]}",
            "url": route_path(r, lang),
            "meta": f"₹{r['fares']['sedan']:,}",
        }
        for r in ROUTES[:5]
    ]

    packages_items = [
        {"title": p["name"][lang], "url": package_path(p, lang), "meta": f"₹{p['price']:,}"}
        for p in PACKAGES
    ]

    fleet_items = [
        {"title": f"{v['name'][lang]} ({v['klass'][lang]})", "url": vehicle_path(v, lang), "meta": f"₹{v['per_km']}/km"}
        for v in VEHICLES
    ]

    contact_items = [
        {"title": "24×7 कॉल डिस्पैच" if is_hi else "24×7 Call Dispatch", "url": f"tel:{PHONE}", "meta": PHONE_DISPLAY},
        {"title": "व्हाट्सऐप बुकिंग" if is_hi else "WhatsApp Dispatch", "url": f"https://wa.me/{WHATSAPP}", "meta": "Instant"},
        {"title": "ताज गंज कार्यालय" if is_hi else "Taj Ganj Office", "url": hub_path("contact", lang), "meta": "Agra"},
        {"title": "अक्सर पूछे जाने वाले सवाल" if is_hi else "Frequently Asked Questions", "url": hub_path("faq", lang), "meta": "FAQ"},
        {"title": "हमारे बारे में" if is_hi else "About SK Baghel Travels", "url": hub_path("about", lang), "meta": "About"},
    ]

    return [
        {
            "key": "services",
            "label": t["nav_services"],
            "url": hub_path("services", lang),
            "view_all": "सभी सेवाएँ देखें →" if is_hi else "View All Services →",
            "items": services_items,
        },
        {
            "key": "routes",
            "label": t["nav_routes"],
            "url": hub_path("routes", lang),
            "view_all": "सभी 8 टैक्सी रूट्स देखें →" if is_hi else "View All 8 Routes →",
            "items": routes_items,
        },
        {
            "key": "packages",
            "label": t["nav_packages"],
            "url": hub_path("packages", lang),
            "view_all": "सभी टूर पैकेज देखें →" if is_hi else "View All Packages →",
            "items": packages_items,
        },
        {
            "key": "fleet",
            "label": t["nav_fleet"],
            "url": hub_path("fleet", lang),
            "view_all": "पूरी फ्लीट देखें →" if is_hi else "View Full Fleet →",
            "items": fleet_items,
        },
        {
            "key": "contact",
            "label": t["nav_contact"],
            "url": hub_path("contact", lang),
            "view_all": "संपर्क व सहायता हब →" if is_hi else "Contact & Support Hub →",
            "items": contact_items,
        },
    ]


def header(lang: str, active: str, alt_path: str):
    t = T[lang]
    nav_sections = get_nav_dropdown_data(lang)
    chevron_svg = '<svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

    desktop_links = []
    noscript_links = []
    sheet_items = [f'<a href="{hub_path("home", lang)}" data-nav="home">{t["home"]}</a>']

    for sec in nav_sections:
        sub_items_html = []
        for it in sec["items"]:
            meta_span = f'<span class="nav-dropdown-item-meta">{it["meta"]}</span>' if it.get("meta") else ""
            sub_items_html.append(f'<a href="{it["url"]}" class="nav-dropdown-item"><span>{it["title"]}</span>{meta_span}</a>')
        sub_html = "\n            ".join(sub_items_html)

        desktop_links.append(f"""<div class="nav-item has-dropdown">
        <a href="{sec["url"]}" data-nav="{sec["key"]}" class="roll-link text" aria-haspopup="true" aria-expanded="false">
          <span class="text-fill">{sec["label"]} {chevron_svg}</span>
        </a>
        <div class="nav-dropdown" role="menu">
          <div class="nav-dropdown-inner">
            {sub_html}
            <div class="nav-dropdown-divider"></div>
            <a href="{sec["url"]}" class="nav-dropdown-view-all">{sec["view_all"]}</a>
          </div>
        </div>
      </div>""")

        noscript_links.append(f'<a href="{sec["url"]}" data-nav="{sec["key"]}" class="roll-link text"><span class="text-fill">{sec["label"]}</span></a>')

        sheet_items.append(f'<div class="sheet-group"><a href="{sec["url"]}" data-nav="{sec["key"]}" class="sheet-group-title">{sec["label"]}</a>')
        for it in sec["items"][:3]:
            sheet_items.append(f'<a href="{it["url"]}" class="sheet-sub-link">{it["title"]}</a>')
        sheet_items.append('</div>')

    links = "\n      ".join(desktop_links)
    ns_links = "\n      ".join(noscript_links)
    sheet = "\n    ".join(sheet_items)
    home = hub_path("home", lang)
    wa = f"https://wa.me/{WHATSAPP}"
    # Semantic links stay usable without JavaScript; Menu progressively opens the drawer.
    def nav_icon(path):
        return f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
    home_icon = nav_icon('<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>')
    tours_icon = nav_icon('<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>')
    menu_icon = nav_icon('<path d="M4 6h16M4 12h16M4 18h16"/>')
    home_current = ' aria-current="page"' if active == "home" else ""
    tours_current = ' aria-current="page"' if active == "packages" else ""
    tours_label = "Tours" if lang == "en" else "टूर"
    menu_label = "Menu" if lang == "en" else "मेनू"
    mobile_label = "Mobile navigation" if lang == "en" else "मोबाइल नेविगेशन"
    return f"""\
<a class="skip-link" href="#main">{t["skip"]}</a>
<header class="site-header" id="site-header">
  <div class="container header-inner">
    <a class="brand" href="{home}" aria-label="SK Baghel Tour &amp; Travels">
      <span class="brand-copy"><strong id="brand" data-scramble>SK BAGHEL</strong><small>TOUR &amp; TRAVELS</small></span>
    </a>
    <nav class="nav-desktop" aria-label="Primary">{links}</nav>
    <div class="header-actions">
      <a class="lang-switch" href="{alt_path}" hreflang="{T["hi" if lang == "en" else "en"]["hreflang"]}">{t["switch"]}</a>
      <a class="btn-outline btn-sm btn-outline--light" href="tel:{PHONE}" data-event="cta_click">{ICON_CALL}<span>{t["call"]}</span></a>
      <a class="btn-outline btn-sm btn-outline--light" href="{wa}" target="_blank" rel="noreferrer" data-event="cta_click">{ICON_WA}<span>{t["whatsapp"]}</span></a>
      <a class="btn-primary btn-sm" href="/book.html" data-event="cta_click">{t["book"]} <span>↗</span></a>
      {cinematic_theme_toggle_html("header-theme-toggle")}
      <button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-sheet" aria-label="{t["menu"]}"><span></span></button>
    </div>
  </div>
</header>
<noscript><nav class="noscript-nav" aria-label="Primary (no JavaScript)">{ns_links}</nav></noscript>
<div class="nav-sheet" id="nav-sheet" role="dialog" aria-modal="true" aria-label="{t["menu"]}" hidden>
  <div class="sheet-head">
    <a class="brand" href="{home}">
      <span class="brand-copy"><strong data-scramble>SK BAGHEL</strong><small>TOUR &amp; TRAVELS</small></span>
    </a>
    <button type="button" id="nav-close" class="btn-outline btn-outline--light btn-sm">{t["close"]}</button>
  </div>
  <div class="sheet-theme-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);">
    <span style="font-size:0.85rem;color:var(--text-soft);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Theme</span>
    {cinematic_theme_toggle_html("sheet-theme-toggle")}
  </div>
  {sheet}
  <a href="{alt_path}">{t["switch"]}</a>
  <a class="btn-outline btn-sm" href="tel:{PHONE}">{ICON_CALL}<span>{t["call"]} {PHONE_DISPLAY}</span></a>
  <a class="btn-gold btn-sm" href="{wa}" target="_blank" rel="noreferrer">{ICON_WA}<span>{t["whatsapp"]} Us</span></a>
  <a class="btn-primary" href="/book.html">{t["book"]} <span>↗</span></a>
</div>
<nav class="mobile-bottom-nav" aria-label="{mobile_label}">
  <a href="{home}"{home_current}>{home_icon}<span>{t["home"]}</span></a>
  <a href="{hub_path("packages", lang)}"{tours_current}>{tours_icon}<span>{tours_label}</span></a>
  <a class="mobile-nav-call" href="tel:{PHONE}" data-event="cta_click">{ICON_CALL}<span>{t["call"]}</span></a>
  <a class="mobile-nav-wa" href="{wa}" target="_blank" rel="noreferrer" data-event="cta_click">{ICON_WA}<span>{t["whatsapp"]}</span></a>
  <a href="{hub_path("services", lang)}" id="mobile-menu-toggle" aria-controls="nav-sheet" aria-expanded="false" aria-haspopup="dialog">{menu_icon}<span>{menu_label}</span></a>
</nav>"""


def footer(lang: str):
    t = T[lang]
    return f"""\
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <strong class="footer-brand-title">SK BAGHEL</strong>
      <p style="color:var(--gold,#E5A044);font-size:0.82rem;font-weight:600;letter-spacing:0.08em;margin-top:2px;">TOUR &amp; TRAVELS · AGRA</p>
      <p style="margin-top:8px;">{ICON_MAP} Near Taj East Gate Road, Taj Ganj, Agra</p>
      <p><a href="tel:{PHONE}">{ICON_CALL} {PHONE_DISPLAY}</a></p>
    </div>
    <div>
      <h4>{t["explore"]}</h4>
      <a href="{hub_path("services", lang)}">{t["nav_services"]}</a>
      <a href="{hub_path("packages", lang)}">{t["nav_packages"]}</a>
      <a href="{hub_path("fleet", lang)}">{t["nav_fleet"]}</a>
      <a href="{hub_path("about", lang)}">{t["nav_about"]}</a>
    </div>
    <div>
      <h4>{t["book"]}</h4>
      <a href="{hub_path("routes", lang)}">{t["nav_routes"]}</a>
      <a href="{route_path(ROUTES[-1], lang)}">{t["sightseeing"]}</a>
      <a href="{route_path(ROUTES[1], lang)}">{t["airport"]}</a>
      <a href="/book.html">{t["book"]}</a>
    </div>
    <div>
      <h4>{t["trust"]}</h4>
      <a href="{hub_path("faq", lang)}">{t["nav_faq"]}</a>
      <a href="{hub_path("contact", lang)}">{t["nav_contact"]}</a>
      <a href="tel:{PHONE}">{ICON_CALL} {PHONE_DISPLAY}</a>
      <a href="{hub_path("privacy", lang)}">{t["privacy"]}</a>
      <a href="{hub_path("terms", lang)}">{t["terms"]}</a>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© <span id="year">2026</span> SK Baghel Tour &amp; Travels · {t["preview"]}</span>
    <span>{t["footer_note"]}</span>
  </div>
</footer>
<div class="lead-bar" role="navigation" aria-label="Contact">
  <a class="lead-call" href="tel:{PHONE}">{ICON_CALL}<span>{t["call"]}</span></a>
  <a class="lead-wa" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{ICON_WA}<span>{t["whatsapp"]}</span></a>
  <a class="lead-book" href="/book.html">{t["book_cta"]}</a>
</div>
<!-- about -->
<div class="about" role="region" aria-label="Quick Actions">
   <a class="bg_links social portfolio" href="tel:{PHONE}" aria-label="Call {PHONE_DISPLAY}" title="Call {PHONE_DISPLAY}">
      <span class="icon">{ICON_CALL}</span>
   </a>
   <a class="bg_links social dribbble" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer" aria-label="WhatsApp {PHONE_DISPLAY}" title="WhatsApp">
      <span class="icon">{ICON_WA}</span>
   </a>
   <a class="bg_links social linkedin" href="{hub_path('packages', lang)}" aria-label="Explore Tours" title="Explore Tours">
      <span class="icon">{ICON_COMPASS}</span>
   </a>
   <a class="bg_links social booking" href="/book.html" aria-label="Instant Taxi Booking" title="Instant Booking">
      <span class="icon">{ICON_CAR}</span>
   </a>
   <a class="bg_links logo" href="javascript:void(0)" role="button" aria-label="Quick Navigation" tabindex="0" title="Quick Navigation">
      <span class="icon">{ICON_ACTION}</span>
   </a>
</div>
<!-- end about -->
<div class="toast" id="toast" role="status" aria-live="polite"></div>"""


def write_page(*, lang, path, alt_path, title, description, active, body, extra_head="", extra_js="", noindex=False, jsonld=None, preload_hero=False, kind=""):
    t = T[lang]
    fonts = FONTS_HI if lang == "hi" else FONTS_EN
    extra = extra_head
    if preload_hero:
        extra = (
            '<link rel="preload" as="image" href="/assets/packages/taj-dawn.webp" fetchpriority="high" />\n    '
        ) + extra
    kind_attr = f' data-kind="{kind}"' if kind else ""
    head = seo_head(
        title=title,
        description=description,
        path=path,
        alt_path=alt_path,
        lang=lang,
        extra=extra,
        noindex=noindex,
        jsonld=jsonld,
    )
    scripts = [
        '<script src="/js/data.js" defer></script>',
        # contact.js is GENERATED from scripts/catalog.py (single source of
        # truth for NAP) — do not hand-edit it.
        '<script src="/js/contact.js" defer></script>',
        '<script src="/js/fares.js" defer></script>',
        '<script src="/js/places.js" defer></script>',
        '<script src="/js/motion.js" defer></script>',
        '<script src="/js/app.js" defer></script>',
    ]
    if extra_js:
        scripts.append(extra_js)
    rel = "index.html" if path == "/" else path.strip("/") + "/index.html"
    if path.endswith(".html"):
        rel = path.lstrip("/")
    html = f"""<!doctype html>
<html lang="{t["html_lang"]}" dir="{t["dir"]}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#FAF7F0" />
    <script>(function(){{try{{var t=localStorage.getItem('skb-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){{document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}}}}catch(e){{}}}})();</script>
    <link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="{fonts}" rel="stylesheet" />
    <link rel="stylesheet" href="/css/tokens.css" />
    <link rel="stylesheet" href="/css/site.css" />
    <link rel="stylesheet" href="/css/components.css" />
    {head}
  </head>
  <body data-page="{active}" data-lang="{lang}" data-base="{page_base(rel)}"{kind_attr}>
    <div id="scroll-progress" aria-hidden="true"></div>
    <svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none">
      <defs>
        <filter id="grain-light">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
          <feComponentTransfer in="desaturatedNoise" result="lightGrain">
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="lightGrain" mode="overlay" />
        </filter>
        <filter id="grain-dark">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
          <feComponentTransfer in="desaturatedNoise" result="darkGrain">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="darkGrain" mode="overlay" />
        </filter>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        </filter>
      </defs>
    </svg>
    {header(lang, active, alt_path)}
    <main id="main">
      {body}
    </main>
    {footer(lang)}
    {"".join(scripts)}
  </body>
</html>
"""
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(rebase(html, rel), encoding="utf-8")
    if not noindex:
        SITEMAP_URLS.append(path if path != "/" else "/")
    print("wrote", rel)


# FALLBACK intrinsic dims per asset kind, used only when the file itself can't
# be measured. resp_img/hero_media always measure the real WebP at build time
# (scripts/images.webp_size), so swapping in real photography can't desync the
# width/height attributes and can't reintroduce CLS.
FLEET_DIMS = (1312, 816)
PACK_DIMS = (1312, 816)
DRIVER_DIMS = (928, 1152)
HERO_DIMS = (1920, 815)


def resp_img(path: str, alt: str, css_sizes: str, *, dims: tuple[int, int] = FLEET_DIMS, lazy: bool = True, cls: str = "") -> str:
    """Responsive WebP <img> using the build-generated -480/-768 derivatives
    (see assets/). Falls back to the full asset when no derivatives exist,
    and `dims` only when the file can't be measured."""
    w, h = webp_size(ROOT / path.lstrip("/")) or dims
    base = path.removesuffix(".webp")
    d480 = ROOT / (base.lstrip("/") + "-480.webp")
    d768 = ROOT / (base.lstrip("/") + "-768.webp")
    has_d = d480.exists()
    parts = []
    if d480.exists():
        parts.append(f"{base}-480.webp {(webp_size(d480) or (480, 0))[0]}w")
    if d768.exists():
        parts.append(f"{base}-768.webp {(webp_size(d768) or (768, 0))[0]}w")
    parts.append(f"{path} {w}w")
    srcset = ", ".join(parts) if has_d else None
    loading = ' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"'
    srcset_attr = f' srcset="{srcset}" sizes="{css_sizes}"' if srcset else ""
    cls_attr = f' class="{cls}"' if cls else ""
    return f'<img{cls_attr} src="{path}"{srcset_attr} alt="{alt}" width="{w}" height="{h}"{loading} />'


def hero_media() -> tuple[str, int, int]:
    """srcset + intrinsic dims for the home hero, measured at build time so a
    replacement hero (any size) keeps correct attrs and preload hints."""
    w, h = webp_size(ROOT / "assets/hero/hero-highway.webp") or HERO_DIMS
    sm = webp_size(ROOT / "assets/hero/hero-highway-sm.webp")
    parts = []
    if sm:
        parts.append(f"/assets/hero/hero-highway-sm.webp {sm[0]}w")
    parts.append(f"/assets/hero/hero-highway.webp {w}w")
    return ", ".join(parts), w, h


def breadcrumb(lang, items):
    t = T[lang]
    inner = ' <span aria-hidden="true">/</span> '.join(
        f'<a href="{href}">{label}</a>' if href else f"<span>{label}</span>" for label, href in items
    )
    return f'<nav class="crumbs" aria-label="{t["breadcrumb"]}">{inner}</nav>'


def trust_roller_html(lang: str) -> str:
    is_hi = lang == "hi"
    chips = [
        (
            '<svg class="trust-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
            "सरकारी पंजीकृत फ्लीट" if is_hi else "Govt-Registered Fleet",
            False,
            '<meta itemprop="hasCredential" content="Government Registered Commercial Taxi Fleet">'
        ),
        (
            '<svg class="trust-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/><path d="m16 11 2 2 4-4"/></svg>',
            "सत्यापित व प्रशिक्षित चालक" if is_hi else "Verified Commercial Drivers",
            False,
            ''
        ),
        (
            '<svg class="trust-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
            "जीएसटी बिल उपलब्ध" if is_hi else "Official GST Invoice",
            False,
            ''
        ),
        (
            '<svg class="trust-chip-icon trust-chip-icon--gold" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            f'★ 4.9/5 · <strong class="stat-number" data-count="380">380</strong>+ {"संतुष्ट यात्राएं" if is_hi else "Trips"}',
            True,
            '<meta itemprop="ratingValue" content="4.9" /><meta itemprop="bestRating" content="5" /><meta itemprop="reviewCount" content="380" />'
        ),
        (
            '<svg class="trust-chip-icon trust-chip-icon--gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22V12a6 6 0 0 1 12 0v10"/><path d="M2 22h20"/><path d="M12 2v4"/><circle cx="12" cy="8" r="2"/></svg>',
            f'<strong class="stat-number" data-count="15">15</strong>+ {"वर्षों का आगरा अनुभव" if is_hi else "Years In Agra"}',
            True,
            ''
        ),
        (
            '<svg class="trust-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
            "24×7 ऑन-रूट सहायता" if is_hi else "24×7 On-Route Support",
            False,
            ''
        ),
        (
            '<svg class="trust-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M16 10H9.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 1 0 5H8"/></svg>',
            "पारदर्शी किराया · शून्य छुपा शुल्क" if is_hi else "Transparent Pricing · No Hidden Fees",
            False,
            ''
        ),
        (
            '<svg class="trust-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
            "ताज गंज, आगरा मुख्यालय" if is_hi else "Taj Ganj, Agra HQ",
            False,
            ''
        ),
    ]

    items_html = []
    for icon, label, is_hl, schema_meta in chips:
        hl_class = " chip--highlight" if is_hl else ""
        schema_attr = ' itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating"' if "ratingValue" in schema_meta else ""
        items_html.append(f'<span class="chip chip--trust{hl_class}"{schema_attr}>{schema_meta}{icon}<span>{label}</span></span>')

    group_content = "\n        ".join(items_html)

    return f"""\
  <div class="trust-roller-wrap reveal-on-scroll" aria-label="Key Trust Credentials">
    <div class="trust-roller-track">
      <div class="trust-roller-group">
        {group_content}
      </div>
      <div class="trust-roller-group" aria-hidden="true">
        {group_content}
      </div>
    </div>
  </div>"""


def coverflow_packages_section_html(lang):
    t = T[lang]
    cards = []
    detail_slides = []
    dots = []

    for idx, p in enumerate(PACKAGES):
        p_name = p["name"][lang]
        p_kicker = p["kicker"][lang]
        p_price_str = inr(p["price"])
        p_blurb = p["blurb"][lang]
        p_places = p["places"][lang]
        p_places_str = " · ".join(p_places)
        p_url = package_path(p, lang)
        is_first = (idx == 0)
        active_cls = " is-active" if is_first else ""

        if lang == "en":
            wa_msg = f"Hello, I would like to inquire about the {p['name']['en']} tour package ({p_price_str})."
        else:
            wa_msg = f"नमस्ते, मुझे {p['name']['hi']} टूर पैकेज ({p_price_str}) के बारे में जानकारी चाहिए।"
        wa_link = f"https://wa.me/{WHATSAPP}?text={quote_plus(wa_msg)}"

        pills_html = "".join([f'<span class="coverflow-pill">{item}</span>' for item in p_places])

        detail_slides.append(f"""\
        <div class="coverflow-detail-slide{active_cls}" data-detail-index="{idx}">
          <p class="eyebrow eyebrow--light">— {p_kicker.upper()}</p>
          <h2 class="coverflow-detail-title">{p_name}</h2>
          <p class="lead coverflow-detail-blurb">{p_blurb}</p>
          <div class="coverflow-places-pills">
            {pills_html}
          </div>
          <div class="coverflow-fare-wrap">
            <span class="coverflow-fare-label">{"All-inclusive fare" if lang == "en" else "कुल पैकेज किराया"}</span>
            <p class="fare coverflow-fare">{p_price_str}</p>
          </div>
          <div class="hero-actions">
            <a class="btn-primary" href="{wa_link}" target="_blank" rel="noreferrer">{ICON_WA} <span>{t["whatsapp"]}</span></a>
            <a class="btn-outline btn-outline--light" href="{p_url}"><span>{"Package details" if lang == "en" else "पैकेज विवरण"}</span> <span>↗</span></a>
            <a class="btn-text btn-text--light" href="{hub_path("packages", lang)}"><span>{t["all_packages"]}</span> <span>↗</span></a>
          </div>
        </div>""")

        cards.append(f"""\
        <div class="coverflow-card" data-card-index="{idx}" role="group" aria-roledescription="slide" aria-label="{idx + 1} of {len(PACKAGES)}: {p_name}">
          <div class="coverflow-card-badge">
            <span class="coverflow-card-badge-kicker">{p_kicker.upper()}</span>
            <span class="coverflow-card-badge-sep">•</span>
            <span class="coverflow-card-badge-fare">{p_price_str}</span>
          </div>
          <img src="{p["image"]}" alt="{p_name} — {p_places_str}" draggable="false" loading="{"eager" if is_first else "lazy"}" class="coverflow-card-img" />
          <div class="coverflow-card-glass">
            <h3 class="coverflow-card-heading">{p_name}</h3>
            <p class="coverflow-card-sub">{p_places_str}</p>
          </div>
        </div>""")

        dots.append(f'<button type="button" class="coverflow-dot{active_cls}" aria-label="Go to package {idx + 1}: {p_name}" data-dot-index="{idx}"></button>')

    details_html = "\n".join(detail_slides)
    cards_html = "\n".join(cards)
    dots_html = "\n".join(dots)

    icon_left = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
    icon_right = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'

    return f"""\
<section class="section section--navy section--coverflow" id="packages-coverflow-section">
  <div class="container">
    <div class="coverflow-split">
      <div class="coverflow-details-column">
{details_html}
      </div>
      <div class="coverflow-stage-column">
        <div class="coverflow-container" id="coverflow-carousel" role="region" aria-roledescription="carousel" aria-label="Sightseeing & tour packages coverflow">
          <div class="coverflow-frame" tabIndex="0">
            <div class="coverflow-track">
{cards_html}
            </div>
          </div>
          <button type="button" class="coverflow-nav coverflow-nav--prev" aria-label="Previous package">
            {icon_left}
          </button>
          <button type="button" class="coverflow-nav coverflow-nav--next" aria-label="Next package">
            {icon_right}
          </button>
          <div class="coverflow-pagination" role="tablist" aria-label="Package slide dots">
            {dots_html}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>"""


def reviews_marquee_section_html(lang: str) -> str:
    t = T[lang]
    star_icon = '<svg class="liquid-review-star" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    verified_icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'

    reviews_row_1 = [
        {
            "name": "Vikram Malhotra",
            "role": "Delhi to Agra Roundtrip" if lang == "en" else "दिल्ली से आगरा राउंडट्रिप",
            "content": "Sedan arrived 15 mins early at Delhi T3. Transparent ₹3,500 fare with all tolls included. Best taxi service in Agra!" if lang == "en" else "दिल्ली T3 पर सेडान 15 मिनट पहले पहुँची। ₹3,500 का पारदर्शी किराया टोल सहित। आगरा में सबसे बेहतरीन टैक्सी सेवा!",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        },
        {
            "name": "Elena Rostova",
            "role": "International Tourist" if lang == "en" else "विदेशी पर्यटक",
            "content": "Spotless Innova Crysta with courteous English-speaking chauffeur. Taj sunrise tour was completely hassle-free." if lang == "en" else "अंग्रेजी बोलने वाले विनम्र ड्राइवर के साथ बेदाग इनोवा क्रिस्टा। ताज सूर्योदय भ्रमण बहुत सहज रहा।",
            "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        },
        {
            "name": "Rajesh & Sunita Sharma",
            "role": "Mathura-Vrindavan Pilgrimage" if lang == "en" else "मथुरा-वृंदावन दर्शन",
            "content": "Booked Tempo Traveller for 12 family members. Punctual, safe driving along Yamuna Expressway and patient temple stops." if lang == "en" else "परिवार के 12 सदस्यों के लिए टेम्पो ट्रैवलर बुक किया। यमुना एक्सप्रेसवे पर सुरक्षित ड्राइविंग और मंदिरों में धैर्यपूर्वक रुकना।",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        },
        {
            "name": "David Miller",
            "role": "Golden Triangle Traveler" if lang == "en" else "गोल्डन ट्रायंगल यात्रा",
            "content": "Reliable dispatch via WhatsApp, verified driver, no commission shop traps. Pure hospitality and transparent pricing." if lang == "en" else "व्हाट्सएप पर तुरंत बुकिंग, प्रमाणित ड्राइवर, कोई कमीशन की दुकानें नहीं। वास्तविक आतिथ्य और पारदर्शी मूल्य।",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        },
    ]

    reviews_row_2 = [
        {
            "name": "Ananya Singhal",
            "role": "Corporate Travel Manager" if lang == "en" else "कॉरपोरेट ट्रैवल मैनेजर",
            "content": "Regular vendor for our executives visiting Agra. Official GST invoices delivered instantly with pristine fleet." if lang == "en" else "आगरा आने वाले हमारे अधिकारियों के लिए नियमित वेंडर। तुरंत जीएसटी बिल और बेहतरीन गाड़ियाँ।",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        },
        {
            "name": "Marcus Vance",
            "role": "Photographer & Explorer" if lang == "en" else "फोटोग्राफर व पर्यटक",
            "content": "Driver knew optimal timing for Mehtab Bagh sunset and Fatehpur Sikri lighting. Exceptional experience!" if lang == "en" else "ड्राइवर को मेहताब बाग सूर्यास्त और फतेहपुर सीकरी के सही समय की सटीक जानकारी थी। शानदार अनुभव!",
            "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        },
        {
            "name": "Priya Nair",
            "role": "Jaipur to Agra Route" if lang == "en" else "जयपुर से आगरा मार्ग",
            "content": "Comfortable outstation cab with baby seat accommodated. Driver was attentive and polite throughout the 5-hour drive." if lang == "en" else "शिशु सीट के साथ आरामदायक आउटस्टेशन कैब। 5 घंटे की यात्रा के दौरान ड्राइवर बहुत विनम्र और सतर्क रहा।",
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        },
        {
            "name": "Dr. Arvind Gupta",
            "role": "Senior Citizen Pilgrimage" if lang == "en" else "तीर्थयात्रा परिवार",
            "content": "Special care given to elderly parents at Agra Cantt station. AC was comfortable and driving was very gentle." if lang == "en" else "आगरा कैंट स्टेशन पर बुजुर्ग माता-पिता का विशेष ध्यान रखा गया। एसी आरामदायक था और ड्राइविंग बहुत सुरक्षित।",
            "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        },
    ]

    def render_card(r):
        return f"""        <div class="liquid-review-card">
          <div class="liquid-review-header">
            <img class="liquid-review-avatar" src="{r['avatar']}" alt="{r['name']}" loading="lazy" width="44" height="44" />
            <div class="liquid-review-meta">
              <span class="liquid-review-name">{r['name']}</span>
              <span class="liquid-review-role">{r['role']}</span>
            </div>
          </div>
          <p class="liquid-review-content">"{r['content']}"</p>
          <div class="liquid-review-footer">
            <div class="liquid-review-stars" aria-label="5 out of 5 stars">
              {star_icon * 5}
            </div>
            <span class="liquid-review-badge">{verified_icon} {"Verified" if lang == "en" else "सत्यापित"}</span>
          </div>
        </div>"""

    # Double tracks for seamless continuous loop
    track_1_cards = "".join(render_card(r) for r in reviews_row_1)
    track_2_cards = "".join(render_card(r) for r in reviews_row_2)

    eyebrow = "VERIFIED TRAVELER REVIEWS" if lang == "en" else "सत्यापित ग्राहक समीक्षाएँ"
    heading = t["h2_reviews"]
    subtitle = "Real reviews from tourists, pilgrims, and business travelers across Agra, Delhi, Jaipur, and Mathura." if lang == "en" else "आगरा, दिल्ली, जयपुर और मथुरा के यात्रियों के वास्तविक अनुभव और समीक्षाएँ।"

    return f"""
<section class="reviews-marquee-section" id="reviews-section">
  <div class="container" style="text-align:center;margin-bottom:40px;">
    <p class="eyebrow" style="margin-bottom:8px;">{eyebrow}</p>
    <h2 style="font-size:clamp(1.8rem, 3.2vw, 2.6rem);line-height:1.2;margin-bottom:12px;">{heading}</h2>
    <p class="muted" style="max-width:580px;margin:0 auto;font-size:15px;">{subtitle}</p>
  </div>
  <div class="reviews-marquee-container" aria-label="Customer reviews marquee">
    <div class="reviews-marquee-row reviews-marquee-row--left">
      <div class="reviews-marquee-track">{track_1_cards}</div>
      <div class="reviews-marquee-track" aria-hidden="true">{track_1_cards}</div>
    </div>
    <div class="reviews-marquee-row reviews-marquee-row--right">
      <div class="reviews-marquee-track">{track_2_cards}</div>
      <div class="reviews-marquee-track" aria-hidden="true">{track_2_cards}</div>
    </div>
  </div>
</section>
"""


def render_benefits_section(lang):
    t = T[lang]
    benefits = [
        {
            "icon": """<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>""",
            "title_en": "Easy Booking",
            "title_hi": "आसान व त्वरित बुकिंग",
            "desc_en": "Book your taxi in minutes with a simple, hassle-free process. Instant confirmation via Call & WhatsApp with zero waiting.",
            "desc_hi": "सरल और त्वरित प्रक्रिया — बस कुछ ही मिनटों में अपनी टैक्सी बुक करें। कॉल और व्हाट्सऐप पर तुरंत कन्फर्मेशन।",
            "tag_en": "Instant Confirm",
            "tag_hi": "त्वरित पुष्टि",
        },
        {
            "icon": """<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11 2 11.3V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>""",
            "title_en": "Multiple Fleets",
            "title_hi": "विशाल व आधुनिक वाहन बेड़ा",
            "desc_en": "Choose from clean Sedans, Ertiga, Innova Crysta, 9–26 seater Tempo Travellers, and luxury Force Urbania suited for any group.",
            "desc_hi": "अपनी जरूरत के अनुसार सेडान, अर्टिगा, इनोवा क्रिस्टा, टेम्पो ट्रैवलर (9–26 सीट) और लग्जरी अर्बनिया में से चुनें।",
            "tag_en": "Sedan to 26-Seater",
            "tag_hi": "सेडान से 26-सीटर",
        },
        {
            "icon": """<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3a4.5 4.5 0 0 0 0-9"/></svg>""",
            "title_en": "Lowest Fares",
            "title_hi": "किफायती व पारदर्शी किराया",
            "desc_en": "Book with confidence enjoying the best guaranteed rates, transparent per-km billing, and zero hidden platform surcharges.",
            "desc_hi": "सर्वोत्तम दरों, पारदर्शी प्रति-किमी बिलिंग और बिना किसी छिपे शुल्क के पूरे विश्वास के साथ अपनी यात्रा बुक करें।",
            "tag_en": "Zero Hidden Fees",
            "tag_hi": "शून्य छिपा शुल्क",
        },
        {
            "icon": """<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><circle cx="18" cy="16" r="2"/></svg>""",
            "title_en": "Exciting Offers",
            "title_hi": "आकर्षक ऑफर्स व बचत",
            "desc_en": f"Unlock seasonal tour deals and instant savings. Use coupon <code class=\"benefit-code\">{PROMO_CODE}</code> for flat ₹{PROMO_DISCOUNT} off on outstation trips.",
            "desc_hi": f"विशेष टूर डिस्काउंट और बचत। आउटस्टेशन बुकिंग पर फ्लैट ₹{PROMO_DISCOUNT} की छूट के लिए कूपन कोड <code class=\"benefit-code\">{PROMO_CODE}</code> का उपयोग करें।",
            "tag_en": f"Coupon {PROMO_CODE}",
            "tag_hi": f"कूपन {PROMO_CODE}",
        },
        {
            "icon": """<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>""",
            "title_en": "On-Time Service",
            "title_hi": "समयबद्ध डोरस्टेप सेवा",
            "desc_en": "Punctual doorstep pickups, GPS-tracked vehicles, flight delay monitoring, and experienced chauffeurs who know Agra inside out.",
            "desc_hi": "समय पर पिकअप, जीपीएस ट्रैक्ड गाड़ियाँ, फ्लाइट ट्रैकिंग और अनुभवी ड्राइवर जो सभी मार्गों से भली-भाँति परिचित हैं।",
            "tag_en": "100% Punctual",
            "tag_hi": "100% समयबद्ध",
        },
        {
            "icon": """<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>""",
            "title_en": "24×7 Dedicated Support",
            "title_hi": "24×7 समर्पित ग्राहक सहायता",
            "desc_en": "Get instant human assistance anytime, anywhere you travel with our round-the-clock live dispatch desk on Call & WhatsApp.",
            "desc_hi": "यात्रा के दौरान कभी भी और कहीं भी तुरंत सहायता प्राप्त करें — कॉल और व्हाट्सऐप पर 24 घंटे सक्रिय सहायता केंद्र।",
            "tag_en": "Live Support 24×7",
            "tag_hi": "24×7 लाइव सपोर्ट",
        },
    ]
    cards = []
    for b in benefits:
        title = b["title_en"] if lang == "en" else b["title_hi"]
        desc = b["desc_en"] if lang == "en" else b["desc_hi"]
        tag = b["tag_en"] if lang == "en" else b["tag_hi"]
        cards.append(f"""
      <article class="benefit-card reveal-on-scroll">
        <div class="benefit-head">
          <div class="benefit-icon-wrapper" aria-hidden="true">{b["icon"]}</div>
          <span class="benefit-pill">{tag}</span>
        </div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </article>""")

    eyebrow = t["benefits_eyebrow"]
    h2 = t["benefits_h2"]
    sub = t["benefits_sub"]

    return f"""
<section class="section section--paper benefits-section" id="benefits">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{eyebrow}</p>
        <h2>{h2}</h2>
        <p class="lead" style="margin-top:8px;max-width:64ch;">{sub}</p>
      </div>
    </div>
    <div class="grid-3 benefits-grid">
      {"".join(cards)}
    </div>
  </div>
</section>
"""


def home_body(lang):
    t = T[lang]
    cards = []
    for r in ROUTES[:3]:
        origin, dest = CITIES[r["from"]], CITIES[r["to"]]
        label = t["local_label"] if r["kind"] == "local" else f"{origin[lang]} → {dest[lang]}"
        cards.append(f"""
      <a class="route-card reveal-on-scroll" href="{route_path(r, lang)}">
        <div class="route-codes"><span>{origin["code"]}</span><b>→</b><span>{dest["code"]}</span></div>
        <div class="route-meta"><span>{label}</span><span>{r["duration"]} · {r["km"]} km</span></div>
        <p class="fare">{inr(r["fares"]["sedan"])} <small>{t["from_word"]} · {vehicle("sedan")["name"][lang]}</small></p>
      </a>""")
    vcards = []
    for vid, idx in (("sedan", "01"), ("innova", "03"), ("tempo", "04")):
        v = vehicle(vid)
        vcards.append(f"""
      <article class="vehicle-card reveal-on-scroll">
        <div class="vehicle-photo">
          {resp_img(v["image"], v["name"]["en"] + " taxi in Agra", "(max-width: 700px) calc(100vw - 32px), (max-width: 1120px) 50vw, 348px")}
          <span>{idx} / 05 <b>{v["name"]["en"].upper()}</b></span>
        </div>
        <div class="vehicle-body">
          <h3>{v["name"][lang]}</h3>
          <p>{v["blurb"][lang]}</p>
          <div class="spec-row"><span>{v["tags"]}</span></div>
          <div class="vehicle-cta"><span class="muted">{t["from_word"]} {inr(ROUTES[0]["fares"][vid])}</span><a class="btn-text" href="{vehicle_path(v, lang)}">{t["choose_car"]} <span>↗</span></a></div>
        </div>
      </article>""")
    pack = PACKAGES[0]
    hero_srcset, hero_w, hero_h = hero_media()
    slides = [
        {
            "src": "/assets/packages/taj-dawn.webp",
            "alt": "Majestic Taj Mahal at sunrise in Agra" if lang == "en" else "सूर्योदय के समय भव्य ताजमहल, आगरा",
            "caption": "Taj Mahal · Dawn in Agra" if lang == "en" else "ताज महल · आगरा दर्शन",
            "priority": True,
        },
        {
            "src": "/assets/packages/agra-fort.webp",
            "alt": "Historic red sandstone Agra Fort" if lang == "en" else "ऐतिहासिक लाल बलुआ पत्थर का आगरा किला",
            "caption": "Agra Fort · Mughal Heritage" if lang == "en" else "आगरा का किला · मुग़ल विरासत",
            "priority": False,
        },
        {
            "src": "/assets/destinations/fatehpur-sikri.webp",
            "alt": "Buland Darwaza at Fatehpur Sikri near Agra" if lang == "en" else "फतेहपुर सीकरी का भव्य बुलंद दरवाज़ा",
            "caption": "Fatehpur Sikri · Buland Darwaza" if lang == "en" else "फतेहपुर सीकरी · बुलंद दरवाज़ा",
            "priority": False,
        },
        {
            "src": "/assets/packages/mathura.webp",
            "alt": "Sacred Ghats and Temples of Mathura and Vrindavan" if lang == "en" else "मथुरा और वृंदावन के पावन घाट और मंदिर",
            "caption": "Mathura · Sacred Yamuna Ghats" if lang == "en" else "मथुरा · पावन यमुना घाट",
            "priority": False,
        },
        {
            "src": "/assets/destinations/vrindavan-prem-mandir.webp",
            "alt": "Illuminated Prem Mandir temple in Vrindavan, Mathura" if lang == "en" else "वृंदावन मथुरा का भव्य प्रेम मंदिर",
            "caption": "Prem Mandir · Vrindavan" if lang == "en" else "प्रेम मंदिर · वृंदावन",
            "priority": False,
        },
        {
            "src": "/assets/destinations/delhi-india-gate.webp",
            "alt": "India Gate memorial boulevard in New Delhi" if lang == "en" else "इंडिया गेट स्मारक, नई दिल्ली",
            "caption": "India Gate · New Delhi" if lang == "en" else "इंडिया गेट · नई दिल्ली",
            "priority": False,
        },
        {
            "src": "/assets/destinations/delhi-red-fort.webp",
            "alt": "Historic Red Fort Lal Qila in Old Delhi" if lang == "en" else "ऐतिहासिक लाल किला, पुरानी दिल्ली",
            "caption": "Red Fort · Old Delhi" if lang == "en" else "लाल किला · पुरानी दिल्ली",
            "priority": False,
        },
        {
            "src": "/assets/destinations/jaipur-hawa-mahal.webp",
            "alt": "Intricate pink sandstone Hawa Mahal in Jaipur" if lang == "en" else "गुलाबी नगर जयपुर का हवा महल",
            "caption": "Hawa Mahal · Pink City Jaipur" if lang == "en" else "हवा महल · गुलाबी नगर जयपुर",
            "priority": False,
        },
        {
            "src": "/assets/packages/golden-triangle.webp",
            "alt": "Historic Amber Palace Fort in Jaipur" if lang == "en" else "जयपुर का ऐतिहासिक आमेर किला",
            "caption": "Amber Palace · Golden Triangle" if lang == "en" else "आमेर का किला · गोल्डन ट्रायंगल",
            "priority": False,
        },
        {
            "src": "/assets/images/akshardham.webp",
            "alt": "Akshardham Temple architecture in New Delhi" if lang == "en" else "अक्षरधाम मंदिर, नई दिल्ली",
            "caption": "Akshardham Temple · New Delhi" if lang == "en" else "अक्षरधाम मंदिर · नई दिल्ली",
            "priority": False,
        },
        {
            "src": "/assets/destinations/himachal-manali.webp",
            "alt": "Snow-capped peaks and Solang Valley in Manali, Himachal" if lang == "en" else "बर्फ़ीली चोटियाँ और सोलांग वैली, मनाली हिमाचल",
            "caption": "Manali & Solang · Himachal Hills" if lang == "en" else "मनाली व सोलांग · हिमाचल प्रदेश",
            "priority": False,
        },
        {
            "src": "/assets/destinations/himachal-shimla.webp",
            "alt": "The Ridge and Christ Church in Shimla, Himachal Pradesh" if lang == "en" else "द रिज व क्राइस्ट चर्च, शिमला हिमाचल प्रदेश",
            "caption": "The Ridge · Shimla Hills" if lang == "en" else "द रिज व क्राइस्ट चर्च · शिमला",
            "priority": False,
        },
    ]
    slides_html = []
    dots_html = []
    for i, s in enumerate(slides):
        active_cls = " is-active" if i == 0 else ""
        srcset_attr = f' srcset="{s["srcset"]}" sizes="100vw"' if "srcset" in s else ""
        fetch_attr = ' fetchpriority="high"' if s.get("priority") else ' loading="lazy"'
        slides_html.append(f"""    <div class="hero-slide{active_cls}" data-caption="{s["caption"]}" data-index="{i}">
      <img class="hero-media" src="{s["src"]}"{srcset_attr} alt="{s["alt"]}"{fetch_attr} onerror="this.style.display=\'none\'" />
    </div>""")
        dots_html.append(f'<button type="button" class="hero-slide-dot{active_cls}" data-index="{i}" aria-label="Slide {i+1}: {s["caption"]}"></button>')

    slideshow_block = "\n".join(slides_html)
    dots_block = "\n    ".join(dots_html)
    first_caption = slides[0]["caption"]

    icon_compass = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>'

    return f"""
<section class="hero">
  <div class="hero-slideshow" id="hero-slideshow" aria-hidden="true">
{slideshow_block}
  </div>
  <div class="hero-overlay"></div>
  <div class="hero-location-badge" id="hero-location-badge" aria-live="polite">
    <span class="hero-location-dot"></span>
    <span class="hero-location-text">{first_caption}</span>
  </div>
  <div class="hero-slide-nav" id="hero-slide-nav" aria-label="Hero background slides">
    {dots_block}
  </div>
  <div class="container hero-copy">
    <p class="eyebrow eyebrow--light">{t["home"]} · Agra, India</p>
    <h1>{t["h1_home"]}</h1>
    <p class="lead">{t["lead_home"]}</p>
    <div class="hero-actions">
      <a class="btn-primary" href="tel:{PHONE}" data-event="cta_click">{ICON_CALL} <span>{t["call"]} {PHONE_DISPLAY}</span></a>
      <a class="btn-outline btn-outline--light" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer" data-event="cta_click">{ICON_WA} <span>{t["whatsapp"]}</span></a>
      <a class="btn-outline btn-outline--light" href="{hub_path("packages", lang)}">{icon_compass} <span>{t["explore_tours"]}</span> <span>↗</span></a>
    </div>
  </div>
  <form class="hero-widget" action="/book.html" method="get">
    <div class="field loc-field">
      <span>{t["pickup"]}</span>
      <div class="loc-picker" id="hero-from-picker">
        <button type="button" class="loc-display-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="{t["pickup"]}">
          <span class="loc-pin">📍</span>
          <span class="loc-value">Agra (AGR)</span>
          <span class="loc-chevron">▾</span>
        </button>
        <input type="hidden" name="from" value="agra" />
        <div class="loc-dropdown" hidden>
          <div class="loc-search-head">
            <span class="loc-search-icon">🔍</span>
            <input type="text" class="loc-search-query" placeholder="Search city, airport, landmark..." autocomplete="off" />
            <span class="loc-api-tag" title="Connect Google Maps API">Google Maps</span>
          </div>
          <div class="loc-quick-tags">
            <span class="loc-tag" data-val="agra">Agra</span>
            <span class="loc-tag" data-val="delhi">Delhi (DEL)</span>
            <span class="loc-tag" data-val="jaipur">Jaipur (JAI)</span>
            <span class="loc-tag" data-val="mathura">Mathura</span>
            <span class="loc-tag" data-val="ayodhya">Ayodhya</span>
            <span class="loc-tag" data-val="rishikesh">Rishikesh</span>
          </div>
          <div class="loc-results" role="listbox"></div>
        </div>
      </div>
    </div>
    <div class="field loc-field">
      <span>{t["drop"]}</span>
      <div class="loc-picker" id="hero-to-picker">
        <button type="button" class="loc-display-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="{t["drop"]}">
          <span class="loc-pin">📍</span>
          <span class="loc-value">Delhi (DEL)</span>
          <span class="loc-chevron">▾</span>
        </button>
        <input type="hidden" name="to" value="delhi" />
        <div class="loc-dropdown" hidden>
          <div class="loc-search-head">
            <span class="loc-search-icon">🔍</span>
            <input type="text" class="loc-search-query" placeholder="Search drop city, airport, hotel..." autocomplete="off" />
            <span class="loc-api-tag" title="Connect Google Maps API">Google Maps</span>
          </div>
          <div class="loc-quick-tags">
            <span class="loc-tag" data-val="delhi">Delhi</span>
            <span class="loc-tag" data-val="jaipur">Jaipur</span>
            <span class="loc-tag" data-val="mathura">Mathura</span>
            <span class="loc-tag" data-val="gwalior">Gwalior</span>
            <span class="loc-tag" data-val="lucknow">Lucknow</span>
            <span class="loc-tag" data-val="agra">Agra tour</span>
          </div>
          <div class="loc-results" role="listbox"></div>
        </div>
      </div>
    </div>
    <label class="field"><span>{t["date"]}</span>
      <!-- no `required`: with JS disabled the field stays empty but the GET
           still submits and the booking app defaults to tomorrow. app.js
           pre-fills + enforces when JS runs. -->
      <input type="date" name="date" />
    </label>
    <button class="btn-primary" type="submit">{t["check_fare"]} <span>↗</span></button>
  </form>
</section>
<div class="trust-roller-section" style="position:relative;z-index:2;background:var(--bg-alt);border-bottom:1px solid var(--border);padding:18px 0 22px;">
{trust_roller_html(lang)}
</div>
<div class="interactive-grid-section" id="interactive-routes-grid">
  <div class="interactive-grid-bg" aria-hidden="true">
    <div class="interactive-grid-lines"></div>
    <div class="interactive-grid-spotlight"></div>
    <canvas class="interactive-grid-canvas"></canvas>
  </div>
  <section class="section" style="position:relative;z-index:2;padding-top:24px;padding-bottom:24px;">
    <div class="container">
      <div class="section-head"><div><p class="eyebrow">{t["popular_routes"]}</p><h2>{t["h2_routes"]}</h2></div>
      <a class="btn-text" href="{hub_path("routes", lang)}">{t["all_routes"]} <span>↗</span></a></div>
      <div class="grid-3">{"".join(cards)}</div>
    </div>
  </section>
</div>
<section class="section section--paper-lt">
  <div class="container">
    <div class="section-head"><div><p class="eyebrow">{t["nav_services"]}</p><h2>{t["h2_services"]}</h2></div>
    <a class="btn-text" href="{hub_path("services", lang)}">{t["how_it_works"]} <span>↗</span></a></div>
    <div class="grid-3">
      <article class="service-card service-card--navy reveal-on-scroll"><span class="service-index">01</span><div class="service-mark">✦</div><h3>{"One-Way Cabs" if lang == "en" else "वन-वे कैब"}</h3><p>{"Agra to Delhi (from ₹2,999), Jaipur (from ₹3,299) and Mathura. Pay only one side." if lang == "en" else "आगरा से दिल्ली (₹2,999 से), जयपुर (₹3,299 से) व मथुरा। केवल एक तरफ का किराया।"}</p><div class="spec-row"><span>{"Pay One Side · No Return Fare" if lang == "en" else "सिर्फ एक तरफ का किराया"}</span></div><a class="card-link" href="{hub_path("routes", lang)}">{t["all_routes"]} ↗</a></article>
      <article class="service-card service-card--gold reveal-on-scroll"><span class="service-index">02</span><div class="service-mark">✦</div><h3>{"Outstation Round Trips" if lang == "en" else "आउटस्टेशन राउंड ट्रिप"}</h3><p>{"North India multi-day tours with 300 KM/day minimum billing and verified chauffeurs." if lang == "en" else "उत्तर भारत की बहु-दिवसीय यात्राएँ — 300 किमी/दिन न्यूनतम बिलिंग व वेरिफाइड ड्राइवर।"}</p><div class="spec-row"><span>{"300 KM/Day Min · All India Permit" if lang == "en" else "300 किमी/दिन · ऑल इंडिया परमिट"}</span></div><a class="card-link" href="{hub_path("routes", lang)}">{t["all_routes"]} ↗</a></article>
      <article class="service-card service-card--light reveal-on-scroll"><span class="service-index">03</span><div class="service-mark">✦</div><h3>{"Local Sightseeing" if lang == "en" else "लोकल आगरा दर्शन"}</h3><p>{"8h/80km (from ₹1,800) and 12h/120km tours for Taj Mahal, Agra Fort & Fatehpur Sikri." if lang == "en" else "ताजमहल, आगरा किला और फतेहपुर सीकरी के लिए 8घंटे/80किमी (₹1,800 से) व 12घंटे/120किमी टूर।"}</p><div class="spec-row"><span>{"8h/80km · 12h/120km · Heritage" if lang == "en" else "8घंटे/80किमी · 12घंटे/120किमी"}</span></div><a class="card-link" href="{hub_path("packages", lang)}">{t["nav_packages"]} ↗</a></article>
      <article class="service-card service-card--light reveal-on-scroll"><span class="service-index">04</span><div class="service-mark">✦</div><h3>{"Airport Transfers" if lang == "en" else "एयरपोर्ट ट्रांसफर"}</h3><p>{"IGI Delhi Airport, Agra Kheria & Cantt station transfers with live flight tracking." if lang == "en" else "दिल्ली आईजीआई एयरपोर्ट, आगरा खेरिया व कैंट स्टेशन ट्रांसफर — फ्लाइट ट्रैकिंग के साथ।"}</p><div class="spec-row"><span>{"Flight Tracking · Punctual Pickup" if lang == "en" else "फ्लाइट ट्रैकिंग · समयबद्ध पिकअप"}</span></div><a class="card-link" href="{route_path(ROUTES[1], lang)}">{t["airport"]} ↗</a></article>
      <article class="service-card service-card--navy reveal-on-scroll"><span class="service-index">05</span><div class="service-mark">✦</div><h3>{"Tempo & Urbania" if lang == "en" else "टेम्पो व अर्बनिया"}</h3><p>{"9 to 26 seater Tempo Travellers & luxury Force Urbania for family and corporate groups." if lang == "en" else "9 से 26 सीटर टेम्पो ट्रैवलर व लग्जरी फ़ोर्स अर्बनिया — फैमिली व कॉर्पोरेट ग्रुप्स के लिए।"}</p><div class="spec-row"><span>{"9–26 Seats · Pushback AC" if lang == "en" else "9–26 सीटें · पुशबैक एसी"}</span></div><a class="card-link" href="{vehicle_path(vehicle("tempo"), lang)}">{t["nav_fleet"]} ↗</a></article>
      <article class="service-card service-card--gold reveal-on-scroll"><span class="service-index">06</span><div class="service-mark">✦</div><h3>{"Tour Packages" if lang == "en" else "टूर पैकेज"}</h3><p>{"Golden Triangle (from ₹18,500), Same Day Taj (from ₹3,499), & Mathura Vrindavan." if lang == "en" else "गोल्डन ट्रायंगल (₹18,500 से), सेम डे ताज (₹3,499 से), व मथुरा-वृंदावन दर्शन।"}</p><div class="spec-row"><span>{"Golden Triangle · Mathura · Same Day" if lang == "en" else "गोल्डन ट्रायंगल · मथुरा · सेम डे"}</span></div><a class="card-link" href="{hub_path("packages", lang)}">{t["explore_tours"]} ↗</a></article>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="container">
    <div class="section-head"><div><p class="eyebrow">{t["nav_fleet"]}</p><h2>{t["h2_fleet"]}</h2></div>
    <a class="btn-text" href="{hub_path("fleet", lang)}">{t["full_fleet"]} <span>↗</span></a></div>
    <div class="grid-3">{"".join(vcards)}</div>
  </div>
</section>
{coverflow_packages_section_html(lang)}
{reviews_marquee_section_html(lang)}
{render_benefits_section(lang)}
<section class="section section--paper" id="contact-section">
  <div class="container">
    <div class="section-head" style="margin-bottom:2.25rem">
      <div>
        <p class="eyebrow">{t["nav_contact"]}</p>
        <h2>{t["h2_reach"]}</h2>
      </div>
    </div>
    {contact_card_html(lang, is_standalone_page=False)}
  </div>
</section>
"""


def get_route_faqs(route, origin, dest):
    return [
        (
            f"Are toll taxes, state border permits, and fuel included in the {origin['en']} to {dest['en']} fare?",
            f"Yes. All one-way taxi fares for {origin['en']} to {dest['en']} (starting at {inr(route['fares']['sedan'])} for Sedan) are 100% all-inclusive of toll plaza charges on the Yamuna Expressway/National Highways, state entry tax, and fuel. There are zero hidden surcharges at drop-off.",
            f"क्या {origin['hi']} से {dest['hi']} के किराए में टोल टैक्स, स्टेट परमिट और ईंधन शामिल है?",
            f"हाँ, {origin['hi']} से {dest['hi']} के सभी वन-वे किराए ({inr(route['fares']['sedan'])} से) में एक्सप्रेसवे/हाईवे टोल, राज्य सीमा टैक्स और ईंधन पूरी तरह शामिल हैं। कोई छिपा हुआ शुल्क नहीं है।"
        ),
        (
            "What happens if our train or flight arrives late for pickup?",
            "We track live train and flight arrival schedules in real time. Your chauffeur will be waiting at the arrival terminal or station exit with a name-board. We never charge waiting penalties for train or flight delays.",
            "यदि हमारी ट्रेन या फ्लाइट लेट हो जाती है तो क्या अतिरिक्त चार्ज लगेगा?",
            "हम रियल-टाइम ट्रेन व फ्लाइट स्टेटस ट्रैक करते हैं। आपका शोफर स्टेशन या एयरपोर्ट पर नेम-बोर्ड के साथ स्वागत करेगा और देरी के लिए कोई अतिरिक्त वेटिंग चार्ज नहीं लगेगा।"
        ),
        (
            "Is there a night driving allowance for late departures?",
            f"For trips departing between 8:00 PM and 6:00 AM, a standard driver night allowance of ₹{NIGHT_ALLOWANCE_CAB} applies for cars and ₹{NIGHT_ALLOWANCE_TEMPO} for Tempo Travellers.",
            "रात में यात्रा शुरू होने पर क्या नाइट अलाउंस लागू होता है?",
            f"रात 8:00 बजे से सुबह 6:00 बजे के बीच यात्रा शुरू होने पर कारों के लिए ₹{NIGHT_ALLOWANCE_CAB} और टेम्पो के लिए ₹{NIGHT_ALLOWANCE_TEMPO} ड्राइवर नाइट अलाउंस लागू होता है।"
        )
    ]


def get_package_faqs(pack):
    return [
        (
            f"Does the {pack['name']['en']} price include monument entrance tickets?",
            f"The package fare covers 100% of the private sanitized air-conditioned vehicle, verified commercial chauffeur, fuel, toll taxes, and parking fees. Monument entry tickets (e.g. Taj Mahal, Agra Fort, Fatehpur Sikri) are paid directly by guests at official ASI counters or online at asi.payumoney.com to prevent middleman markup.",
            f"क्या {pack['name']['hi']} में स्मारकों का टिकट शुल्क शामिल है?",
            f"पैकेज किराए में प्राइवेट एसी कैब, वेरिफाइड शोफर, ईंधन, टोल टैक्स और पार्किंग 100% शामिल हैं। स्मारक टिकट (ताजमहल, आगरा किला आदि) यात्री आधिकारिक एएसआई काउंटर या ऑनलाइन ले सकते हैं।"
        ),
        (
            "Can the departure time be adjusted for Taj Mahal sunrise photography?",
            "Yes, absolutely. All our tours are 100% private and customizable. For sunrise photography at the Taj Mahal, we recommend a 5:30 AM hotel pickup to catch the best dawn light before crowds arrive.",
            "क्या ताजमहल सनराइज फोटोग्राफी के लिए पिकअप समय बदला जा सकता है?",
            "हाँ, हमारे सभी पैकेज 100% प्राइवेट हैं। ताजमहल सनराइज के लिए हम सुबह 5:30 बजे पिकअप की सलाह देते हैं जिससे भीड़ से पहले बेहतरीन दृश्य मिल सके।"
        ),
        (
            "What is the cancellation and refund policy if our schedule changes?",
            "Tours cancelled 61+ days prior to departure receive a 100% refund. Between 31–60 days, a 25% fee applies; 16–30 days 50% fee; and 6–15 days 75% fee. See the cancellation policy table above for complete details.",
            "यदि यात्रा कार्यक्रम बदल जाए तो कैंसिलेशन और रिफंड की क्या नीति है?",
            "यात्रा से 61+ दिन पूर्व रद्द करने पर 100% रिफंड मिलता है। 31–60 दिन पूर्व 25% और 16–30 दिन पूर्व 50% शुल्क लगता है। विस्तृत विवरण ऊपर दी गई तालिका में उपलब्ध है।"
        )
    ]


def route_body(lang, route):
    t = T[lang]
    origin, dest = CITIES[route["from"]], CITIES[route["to"]]
    label = t["local_label"] if route["kind"] == "local" else f"{origin[lang]} → {dest[lang]}"
    h1 = (
        f"{origin['en']} to {dest['en']} taxi"
        if lang == "en" and route["kind"] != "local"
        else (f"{origin['hi']} से {dest['hi']} टैक्सी" if route["kind"] != "local" else t["local_label"])
    )
    rows = []
    for v in VEHICLES:
        billable_rt_km = max(route["km"] * 2, OUTSTATION_MIN_KM) if route["kind"] != "local" else route["km"]
        rt_fare = round(billable_rt_km * v["per_km"] / 10) * 10
        oneway_fare = route["fares"][v["id"]]
        extra_km_str = f"{inr(v['per_km'])}/km"
        book_href = f'/book.html?from={route["from"]}&amp;to={route["to"]}&amp;vehicle={v["id"]}'
        rows.append(
            f'<tr data-href="{book_href}" tabindex="0">'
            f'<td><a href="{vehicle_path(v, lang)}"><strong>{v["name"][lang]}</strong></a></td>'
            f'<td>{v["seats"]}+1</td>'
            f'<td><strong>{inr(oneway_fare)}</strong> <span class="table-tag table-tag--green">{t["toll_included"]}</span></td>'
            f'<td><strong>{inr(rt_fare)}</strong> <span class="table-tag table-tag--amber">{t["toll_separate"]}</span></td>'
            f'<td>{extra_km_str}</td>'
            f'<td><a class="btn-text" href="{book_href}">{t["book_cta"]} ↗</a></td>'
            f'</tr>'
        )
    related = []
    for r in ROUTES:
        if r["id"] == route["id"]:
            continue
        o, d = CITIES[r["from"]], CITIES[r["to"]]
        name = t["local_label"] if r["kind"] == "local" else f"{o[lang]} → {d[lang]}"
        related.append(f'<a class="route-card" href="{route_path(r, lang)}"><strong>{name}</strong><p class="muted">{t["from_word"]} {inr(r["fares"]["sedan"])}</p></a>')
        if len(related) == 3:
            break
    book = f'/book.html?from={route["from"]}&to={route["to"]}'
    fare = inr(route["fares"]["sedan"])
    fare_line = f"{t['from_word']} {fare}" if lang == "en" else f"{fare} {t['from_word']}"

    guidance = ROUTE_GUIDANCE.get(route["id"])
    guidance_block = ""
    if guidance:
        via_label = "Highway / Route" if lang == "en" else "हाईवे / मार्ग"
        time_label = t["est_travel_time"]
        dep_label = t["best_departure"]
        stops_label = t["highway_stops"]
        night_label = t["night_allowance_rule"]
        night_text = f"₹{NIGHT_ALLOWANCE_CAB} for cabs / ₹{NIGHT_ALLOWANCE_TEMPO} for Tempos after 8:00 PM" if lang == "en" else f"रात 8:00 बजे के बाद कारों पर ₹{NIGHT_ALLOWANCE_CAB} / टेम्पो पर ₹{NIGHT_ALLOWANCE_TEMPO}"

        guidance_block = f"""
    <div class="guidance-box reveal-on-scroll">
      <h3>{t["route_insights"]}</h3>
      <div class="guidance-grid">
        <div class="guidance-item">
          <span class="guidance-label">{via_label}</span>
          <span class="guidance-val">{guidance["highway"]}</span>
        </div>
        <div class="guidance-item">
          <span class="guidance-label">{time_label}</span>
          <span class="guidance-val">{guidance["transit_time"]}</span>
        </div>
        <div class="guidance-item">
          <span class="guidance-label">{dep_label}</span>
          <span class="guidance-val">{guidance["departure_tip"][lang]}</span>
        </div>
        <div class="guidance-item">
          <span class="guidance-label">{stops_label}</span>
          <span class="guidance-val">{guidance["rest_stops"][lang]}</span>
        </div>
        <div class="guidance-item">
          <span class="guidance-label">{night_label}</span>
          <span class="guidance-val">{night_text}</span>
        </div>
      </div>
    </div>"""

    wa_route_msg = f"Hello SK Baghel Travels, I would like to book a taxi for {origin['en']} to {dest['en']} ({route['duration']}, starting at {inr(route['fares']['sedan'])}). Please confirm chauffeur availability and apply coupon ASTTCAR500OFF."
    wa_route_link = f"https://wa.me/{WHATSAPP}?text={quote_plus(wa_route_msg)}"

    r_faqs = get_route_faqs(route, origin, dest)
    r_faq_items = [
        f"<details><summary>{q_en if lang == 'en' else q_hi}</summary><p>{a_en if lang == 'en' else a_hi}</p></details>"
        for q_en, a_en, q_hi, a_hi in r_faqs
    ]
    r_faq_section = f"""
<section class="section section--paper">
  <div class="container faq" style="max-width:800px">
    <div class="section-head" style="margin-bottom:24px">
      <div>
        <p class="eyebrow">{"Route Guidance & FAQ" if lang == "en" else "रूट जानकारी व अक्सर पूछे जाने वाले सवाल"}</p>
        <h2>{"Frequently Asked Questions" if lang == "en" else "अक्सर पूछे जाने वाले प्रश्न"}</h2>
      </div>
    </div>
    {"".join(r_faq_items)}
  </div>
</section>
"""

    return f"""
<section class="page-hero">
  <div class="container">
    {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["crumb_routes"], hub_path("routes", lang)), (h1, "")])}
    <h1>{h1},<br /><i>{fare_line}.</i></h1>
    <p class="lead">{route["intro"][lang]}</p>
    <p class="muted">{route["duration"]} · {route["km"]} km</p>
    <div class="hero-actions" style="margin-top:24px">
      <a class="btn-primary" href="tel:{PHONE}">{t["call"]} {PHONE_DISPLAY}</a>
      <a class="btn-outline" href="{wa_route_link}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
      <a class="btn-text" href="{book}">{t["book_route"]} <span>↗</span></a>
    </div>
    <p class="note" style="margin-top:24px">{t["primary_lead"]}</p>
  </div>
</section>
<section class="section section--paper">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{t["sample_fare"]}</p>
        <h2>{t["oneway_vs_round"]}</h2>
      </div>
    </div>
    <div class="table-wrap" style="margin-top:16px">
      <table class="data">
        <thead>
          <tr>
            <th>{t["vehicle"]}</th>
            <th>{t["capacity"]}</th>
            <th>{t["one_way"]}</th>
            <th>{t["round"]}</th>
            <th>{t["per_km"]}</th>
            <th>{t["book_cta"]}</th>
          </tr>
        </thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
    </div>
    <p class="muted" style="margin-top:14px">{t["round_trip_rule"]}</p>
    {guidance_block}
  </div>
</section>
{r_faq_section}
{render_benefits_section(lang)}
<section class="section section--paper-lt">
  <div class="container">
    <h2>{t["related_routes"]}</h2>
    <div class="grid-3" style="margin-top:24px">{"".join(related)}</div>
  </div>
</section>
"""


def vehicle_body(lang, veh):
    t = T[lang]
    fare_rows = []
    for r in ROUTES:
        o, d = CITIES[r["from"]], CITIES[r["to"]]
        name = t["local_label"] if r["kind"] == "local" else f"{o[lang]} → {d[lang]}"
        fare_rows.append(f'<tr data-href="{route_path(r, lang)}"><td><a href="{route_path(r, lang)}">{name}</a></td><td>{r["duration"]}</td><td><strong>{inr(r["fares"][veh["id"]])}</strong></td></tr>')
    title = veh["name"][lang]

    rate_range_pill = f'<span class="badge" style="font-family:var(--mono);font-size:13px;margin-left:10px;color:var(--gold-text);background:var(--gold-wash);padding:3px 8px;border-radius:4px;vertical-align:middle">{veh.get("rate_range", "")}</span>' if veh.get("rate_range") else ""

    models = veh.get("models", {}).get(lang, [])
    models_html = "".join(f'<li style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--gold);font-weight:bold">✓</span> <span>{m}</span></li>' for m in models)
    models_box = f"""
      <div style="margin-top:20px;padding:16px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--gold-text)">{"Available Models & Variants" if lang == "en" else "उपलब्ध मॉडल व वेरिएंट"}</p>
        <ul style="list-style:none;padding:0;margin:0;font-size:14px;color:var(--text);line-height:1.5">
          {models_html}
        </ul>
      </div>""" if models else ""

    transfer_rows = []
    for tr in AIRPORT_STATION_TRANSFERS:
        fare_val = tr["fares"].get(veh["id"], 0)
        book_url = f'/book.html?from={"delhi" if tr["id"] == "delhi-airport" else "agra"}&amp;to={"agra" if tr["id"] == "delhi-airport" else "delhi"}&amp;vehicle={veh["id"]}'
        transfer_rows.append(f'<tr data-href="{book_url}" tabindex="0"><td><strong>{tr["name"][lang]}</strong><br><small class="muted">{tr["desc"][lang]}</small></td><td><span class="table-tag">{tr["duration"]}</span></td><td><strong>{inr(fare_val)}</strong></td><td><a class="btn-text" href="{book_url}">{t["book_cta"]} ↗</a></td></tr>')

    transfers_table_html = f"""
    <div style="margin-top:36px">
      <h3>{"Airport & Railway Station Transfers" if lang == "en" else "एयरपोर्ट व रेलवे स्टेशन ट्रांसफर"}</h3>
      <p class="muted" style="margin-bottom:16px">{"Fixed flat-fare doorstep pickup & drop for this vehicle class with live delay tracking." if lang == "en" else "इस वाहन श्रेणी के लिए फिक्स डोरस्टेप पिकअप व ड्रॉप — लाइव फ्लाइट/ट्रेन ट्रैकिंग के साथ।"}</p>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>{"Transfer Route" if lang == "en" else "ट्रांसफर रूट"}</th><th>{t["time"]}</th><th>{t["sample_fare"]}</th><th>{t["book_cta"]}</th></tr></thead>
          <tbody>{"".join(transfer_rows)}</tbody>
        </table>
      </div>
    </div>"""

    return f"""
<section class="page-hero">
  <div class="container">
    {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["crumb_vehicles"], hub_path("fleet", lang)), (title, "")])}
    <h1>{title} <i>{t["from_word"]} Agra.</i></h1>
    <p class="lead">{veh["blurb"][lang]} {veh["suitable"][lang]}.</p>
    <div class="hero-actions" style="margin-top:24px">
      <a class="btn-primary" href="tel:{PHONE}">{t["call"]}</a>
      <a class="btn-outline" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
      <a class="btn-text" href="/book.html?vehicle={veh["id"]}">{t["choose_car"]} <span>↗</span></a>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="container split">
    {resp_img(veh["image"], veh["name"]["en"] + " hire in Agra", "(max-width: 1120px) calc(100vw - 32px), 637px")}
    <div>
      <p class="eyebrow">{veh["klass"][lang]}</p>
      <p class="spec-row">{veh["tags"]}</p>
      <p class="fare">{inr(veh["per_km"])}<small style="font-family:var(--mono);font-size:12px;color:var(--gold-text)"> / km</small>{rate_range_pill}</p>
      <p class="muted">{t["from_word"]} {inr(ROUTES[0]["fares"][veh["id"]])} Agra → Delhi</p>
      {models_box}
      <p class="note" style="margin-top:20px">{t["primary_lead"]}</p>
    </div>
  </div>
</section>
<section class="section section--paper-lt">
  <div class="container">
    <h2>{t["fare_table"]}</h2>
    <div class="table-wrap" style="margin-top:16px">
      <table class="data"><thead><tr><th>{t["route"]}</th><th>{t["time"]}</th><th>{t["sample_fare"]}</th></tr></thead><tbody>{"".join(fare_rows)}</tbody></table>
    </div>
    {transfers_table_html}
  </div>
</section>
"""


def package_body(lang, pack):
    t = T[lang]
    places = "".join(f"<span>{p}</span><i>→</i>" for p in pack["places"][lang])
    inc_items = "".join(f"<li>{x}</li>" for x in pack["includes"][lang])
    exc_items = "".join(f"<li>{x}</li>" for x in pack.get("excludes", {}).get(lang, []))

    itin_items = []
    for step in pack.get("itinerary", []):
        itin_items.append(f"""
      <div class="itinerary-item reveal-on-scroll">
        <span class="itinerary-dot" aria-hidden="true"></span>
        <span class="itinerary-time">{step["time"]}</span>
        <h3 class="itinerary-title">{step["title"][lang]}</h3>
        <p class="itinerary-desc">{step["desc"][lang]}</p>
      </div>""")
    itin_html = "\n".join(itin_items)

    upgrade_rows = []
    for up in pack.get("upgrades", []):
        book_link = f'/book.html?package={pack["id"]}&amp;vehicle={up["veh_id"]}'
        upgrade_rows.append(
            f'<tr data-href="{book_link}" tabindex="0">'
            f'<td><strong>{up["name"][lang]}</strong></td>'
            f'<td>{up["seats"]}</td>'
            f'<td><strong data-inr-val="{up["price"]}">{inr(up["price"])}</strong></td>'
            f'<td><a class="btn-text" href="{book_link}">{t["book_cta"]} ↗</a></td>'
            f'</tr>'
        )
    upgrade_table = f"""
    <div class="table-wrap" style="margin-top:18px">
      <table class="data">
        <thead><tr><th>{t["vehicle"]}</th><th>{t["capacity"]}</th><th>{t["sample_fare"]}</th><th>{t["book_cta"]}</th></tr></thead>
        <tbody>{"".join(upgrade_rows)}</tbody>
      </table>
    </div>"""

    cancel_rows = []
    for slab in CANCELLATION_SLABS_TOUR:
        days_str = slab["days"] if lang == "en" else slab["days"].replace("days", "दिन")
        refund_text = f"{slab['refund']} refund ({slab['fee']} fee)" if lang == "en" else f"{slab['refund']} रिफंड ({slab['fee']} शुल्क)"
        cancel_rows.append(f'<tr><td>{days_str}</td><td><strong>{refund_text}</strong></td></tr>')
    cancel_table = f"""
    <div class="table-wrap" style="margin-top:18px;max-width:680px">
      <table class="data">
        <thead><tr><th>{"Cancellation Notice" if lang == "en" else "रद्दीकरण की पूर्व सूचना"}</th><th>{"Refund / Deduction" if lang == "en" else "रिफंड / कटौती"}</th></tr></thead>
        <tbody>{"".join(cancel_rows)}</tbody>
      </table>
    </div>"""

    usd_approx = round(pack["price"] / 84)
    eur_approx = round(pack["price"] / 90)
    gbp_approx = round(pack["price"] / 105)
    currency_bar = f"""
    <div class="currency-estimator-bar" data-inr-price="{pack['price']}">
      <span class="currency-label">{"Currency Estimator:" if lang == "en" else "मुद्रा अनुमान:"}</span>
      <div class="currency-pills" role="group" aria-label="{"Select Currency" if lang == "en" else "मुद्रा चुनें"}">
        <button type="button" class="currency-pill is-active" data-currency="INR">₹ INR</button>
        <button type="button" class="currency-pill" data-currency="USD">$ USD (~${usd_approx})</button>
        <button type="button" class="currency-pill" data-currency="EUR">€ EUR (~€{eur_approx})</button>
        <button type="button" class="currency-pill" data-currency="GBP">£ GBP (~£{gbp_approx})</button>
      </div>
      <small class="currency-disclaimer">{"*Indicative international rates based on standard conversion (~₹84/USD, ~₹90/EUR, ~₹105/GBP). Payment is collected in INR (₹) upon departure." if lang == "en" else "*मानक विनिमय दरों पर आधारित अनुमान (~₹84/USD, ~₹90/EUR)। वास्तविक भुगतान यात्रा प्रस्थान पर भारतीय रुपये (₹) में लिया जाएगा।"}</small>
    </div>"""

    wa_pack_msg = f"Hello SK Baghel Travels, I would like to book the {pack['name']['en']} tour ({pack['duration']['en']}, starting at {inr(pack['price'])}). Please confirm availability and apply coupon ASTTCAR500OFF."
    wa_pack_link = f"https://wa.me/{WHATSAPP}?text={quote_plus(wa_pack_msg)}"

    h1_fare = f'<span data-inr-val="{pack["price"]}">{inr(pack["price"])}</span>'
    h1_price_str = f"from {h1_fare}" if lang == "en" else f"{h1_fare} से"

    pack_faqs = get_package_faqs(pack)
    pack_faq_items = [
        f"<details><summary>{q_en if lang == 'en' else q_hi}</summary><p>{a_en if lang == 'en' else a_hi}</p></details>"
        for q_en, a_en, q_hi, a_hi in pack_faqs
    ]
    pack_faq_section = f"""
<section class="section section--paper">
  <div class="container faq" style="max-width:800px">
    <div class="section-head" style="margin-bottom:24px">
      <div>
        <p class="eyebrow">{"Tour FAQ" if lang == "en" else "अक्सर पूछे जाने वाले सवाल"}</p>
        <h2>{"Frequently Asked Questions" if lang == "en" else "अक्सर पूछे जाने वाले प्रश्न"}</h2>
      </div>
    </div>
    {"".join(pack_faq_items)}
  </div>
</section>
"""

    return f"""
<section class="page-hero">
  <div class="container">
    {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["crumb_packages"], hub_path("packages", lang)), (pack["name"][lang], "")])}
    <h1>{pack["name"][lang]},<br /><i>{h1_price_str}.</i></h1>
    <p class="lead">{pack["blurb"][lang]}</p>
    <div class="hero-actions" style="margin-top:24px">
      <a class="btn-primary" href="tel:{PHONE}">{t["call"]} {PHONE_DISPLAY}</a>
      <a class="btn-outline" href="{wa_pack_link}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
      <a class="btn-text" href="/book.html?package={pack["id"]}">{t["book_package"]} <span>↗</span></a>
    </div>
    {currency_bar}
    <p class="note" style="margin-top:24px">{t["primary_lead"]}</p>
  </div>
</section>
<section class="section section--paper">
  <div class="container split">
    {resp_img(pack["image"], pack["name"]["en"] + " tour from Agra", "(max-width: 1120px) calc(100vw - 32px), 637px", dims=PACK_DIMS)}
    <div>
      <p class="eyebrow">{pack["kicker"][lang]} · {pack["duration"][lang]}</p>
      <div class="place-row">{places.removesuffix("<i>→</i>")}</div>
      <p style="margin-top:16px;line-height:1.6;color:var(--text);font-size:1.05rem;">{pack["blurb"][lang]}</p>
      <div class="spec-row" style="margin-top:18px"><span>{"100% Guaranteed Private Tour · Sanitized Chauffeur Cab" if lang == "en" else "100% प्राइवेट टूर · सैनिटाइज्ड एसी कैब"}</span></div>
    </div>
  </div>
</section>
<section class="section section--paper-lt" id="itinerary">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{pack["duration"][lang]}</p>
        <h2>{t["tour_itinerary"]}</h2>
      </div>
    </div>
    <div class="itinerary-timeline">
      {itin_html}
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="container">
    <div class="grid-2">
      <div class="checklist-card reveal-on-scroll">
        <h3>{t["inclusions_title"]}</h3>
        <ul class="check-list">{inc_items}</ul>
      </div>
      <div class="checklist-card reveal-on-scroll">
        <h3>{t["exclusions_title"]}</h3>
        <ul class="cross-list">{exc_items}</ul>
      </div>
    </div>
  </div>
</section>
<section class="section section--paper-lt">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{t["sample_fare"]}</p>
        <h2>{t["vehicle_upgrades"]}</h2>
      </div>
    </div>
    {upgrade_table}
  </div>
</section>
<section class="section section--paper">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{t["terms"]}</p>
        <h2>{t["cancellation_terms"]}</h2>
      </div>
    </div>
    {cancel_table}
  </div>
</section>
{pack_faq_section}
{render_benefits_section(lang)}
<section class="section section--paper-lt" id="contact-section">
  <div class="container">
    <div class="section-head" style="margin-bottom:2.25rem">
      <div>
        <p class="eyebrow">{t["nav_contact"]}</p>
        <h2>{t["h2_reach"]}</h2>
      </div>
    </div>
    {contact_card_html(lang, is_standalone_page=False)}
  </div>
</section>
"""


def services_body(lang):
    t = T[lang]
    services = [
        {
            "idx": "01",
            "cls": "service-card--navy",
            "title_en": "One-Way Intercity Taxi",
            "title_hi": "वन-वे इंटरसिटी टैक्सी",
            "desc_en": "Affordable one-way drops from Agra to Delhi (from ₹2,999), Jaipur (from ₹3,299), Mathura, and Noida. Pay only for one side — zero return fare.",
            "desc_hi": "आगरा से दिल्ली (₹2,999 से), जयपुर (₹3,299 से), मथुरा व नोएडा के लिए वन-वे ड्रॉप। केवल एक तरफ का किराया — वापसी का कोई शुल्क नहीं।",
            "tags_en": "Agra–Delhi · Agra–Jaipur · Pay One Side",
            "tags_hi": "आगरा–दिल्ली · आगरा–जयपुर · सिर्फ एक तरफ का किराया",
            "link": hub_path("routes", lang),
            "cta_en": "Explore routes",
            "cta_hi": "रूट देखें",
        },
        {
            "idx": "02",
            "cls": "service-card--gold",
            "title_en": "Outstation Round Trips",
            "title_hi": "आउटस्टेशन राउंड ट्रिप",
            "desc_en": "Reliable multi-day round trips across North India (Rajasthan, Uttarakhand, Himachal) with transparent 300 KM/day billing and commercial tourist permits.",
            "desc_hi": "उत्तर भारत (राजस्थान, उत्तराखंड, हिमाचल) की बहु-दिवसीय यात्राओं के लिए 300 किमी/दिन पारदर्शी बिलिंग और ऑल-इंडिया टूरिस्ट परमिट।",
            "tags_en": "300 KM/Day Min · Verified Chauffeurs",
            "tags_hi": "300 किमी/दिन न्यूनतम · वेरिफाइड ड्राइवर",
            "link": hub_path("routes", lang),
            "cta_en": "Check outstation fares",
            "cta_hi": "आउटस्टेशन किराया देखें",
        },
        {
            "idx": "03",
            "cls": "service-card--light",
            "title_en": "Local Agra Sightseeing",
            "title_hi": "लोकल आगरा दर्शन पैकेज",
            "desc_en": "Comfortable 8-Hour / 80-KM (from ₹1,800) and 12-Hour / 120-KM packages covering Taj Mahal sunrise, Agra Fort, Mehtab Bagh, and Fatehpur Sikri.",
            "desc_hi": "ताजमहल सनराइज, आगरा किला, मेहताब बाग और फतेहपुर सीकरी के लिए 8 घंटे/80 किमी (₹1,800 से) व 12 घंटे/120 किमी के किफायती लोकल पैकेज।",
            "tags_en": "8h/80km · 12h/120km · Monument Tour",
            "tags_hi": "8घंटे/80किमी · 12घंटे/120किमी · स्मारक दर्शन",
            "link": hub_path("packages", lang),
            "cta_en": "View local packages",
            "cta_hi": "लोकल पैकेज देखें",
        },
        {
            "idx": "04",
            "cls": "service-card--light",
            "title_en": "Airport & Railway Transfers",
            "title_hi": "एयरपोर्ट व रेलवे स्टेशन ट्रांसफर",
            "desc_en": "Punctual doorstep transfers for Delhi IGI Airport (DEL), Agra Kheria Airport (AGR), Agra Cantt, and Gatimaan Express with live flight delay tracking.",
            "desc_hi": "दिल्ली एयरपोर्ट (IGI), आगरा खेरिया एयरपोर्ट, आगरा कैंट व गतिमान एक्सप्रेस के लिए समयबद्ध पिकअप व ड्रॉप — फ्लाइट ट्रैकिंग के साथ।",
            "tags_en": "Flight Tracking · Zero Waiting Fee",
            "tags_hi": "फ्लाइट ट्रैकिंग · समयबद्ध पिकअप",
            "link": route_path(ROUTES[1], lang),
            "cta_en": "Delhi airport transfer",
            "cta_hi": "दिल्ली एयरपोर्ट ट्रांसफर",
        },
        {
            "idx": "05",
            "cls": "service-card--navy",
            "title_en": "Tempo Traveller & Urbania",
            "title_hi": "टेम्पो ट्रैवलर व फ़ोर्स अर्बनिया",
            "desc_en": "9 to 26-seater luxury pushback Tempo Travellers & 9–17 seater Force Urbania with high-roof AC cabins, charging points, and dedicated luggage space.",
            "desc_hi": "9 से 26 सीटर लग्जरी पुशबैक टेम्पो ट्रैवलर व 9–17 सीटर फ़ोर्स अर्बनिया — बड़ी फैमिली, स्कूल व कॉर्पोरेट ग्रुप्स के लिए उत्तम।",
            "tags_en": "9 to 26 Seats · Force Urbania",
            "tags_hi": "9 से 26 सीटें · फ़ोर्स अर्बनिया",
            "link": vehicle_path(vehicle("tempo"), lang),
            "cta_en": "View tempo fleet",
            "cta_hi": "टेम्पो बेड़ा देखें",
        },
        {
            "idx": "06",
            "cls": "service-card--gold",
            "title_en": "Heritage & Multi-Day Tours",
            "title_hi": "हेरिटेज व मल्टी-डे टूर पैकेज",
            "desc_en": "Curated Golden Triangle (Delhi–Agra–Jaipur from ₹18,500), Same Day Taj by Gatimaan (₹14,999), Mathura–Vrindavan (₹4,200), and Overnight tours.",
            "desc_hi": "सुनियोजित टूर: गोल्डन ट्रायंगल (दिल्ली-आगरा-जयपुर ₹18,500 से), गतिमान ट्रेन टूर (₹14,999), मथुरा-वृंदावन दर्शन (₹4,200 से)।",
            "tags_en": "Golden Triangle · Mathura · Same Day",
            "tags_hi": "गोल्डन ट्रायंगल · मथुरा · सेम डे",
            "link": hub_path("packages", lang),
            "cta_en": "Explore tour packages",
            "cta_hi": "टूर पैकेज देखें",
        },
    ]
    cards = []
    for s in services:
        title = s["title_en"] if lang == "en" else s["title_hi"]
        desc = s["desc_en"] if lang == "en" else s["desc_hi"]
        tags = s["tags_en"] if lang == "en" else s["tags_hi"]
        cta = s["cta_en"] if lang == "en" else s["cta_hi"]
        cards.append(f"""
    <article class="service-card {s["cls"]} reveal-on-scroll">
      <span class="service-index">{s["idx"]}</span>
      <div class="service-mark">✦</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div class="spec-row" style="margin-top:14px"><span>{tags}</span></div>
      <a class="card-link" href="{s["link"]}">{cta} ↗</a>
    </article>""")

    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_services"], "")])}
  <h1>{t["services_h2"]}</h1>
  <p class="lead">{t["services_lead"]}</p>
</div></section>
<section class="section section--paper-lt">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{t["services_eyebrow"]}</p>
        <h2>{t["h2_services"]}</h2>
      </div>
    </div>
    <div class="grid-3">
      {"".join(cards)}
    </div>
  </div>
</section>
{render_benefits_section(lang)}
<section class="section section--paper" id="contact-section">
  <div class="container">
    <div class="section-head" style="margin-bottom:2.25rem">
      <div>
        <p class="eyebrow">{t["nav_contact"]}</p>
        <h2>{t["h2_reach"]}</h2>
      </div>
    </div>
    {contact_card_html(lang, is_standalone_page=False)}
  </div>
</section>
"""


def routes_hub_body(lang):
    t = T[lang]
    rows = []
    for r in ROUTES:
        o, d = CITIES[r["from"]], CITIES[r["to"]]
        name = t["local_label"] if r["kind"] == "local" else f"{o[lang]} → {d[lang]}"
        rows.append(
            f'<tr data-href="{route_path(r, lang)}" tabindex="0"><td><a href="{route_path(r, lang)}">{name}</a></td><td>{r["duration"]}</td><td><strong>{inr(r["fares"]["sedan"])}</strong></td><td>{inr(r["fares"]["innova"])}</td></tr>'
        )
    opts_from = "".join(f'<option value="{cid}">{c["en"]}</option>' for cid, c in CITIES.items() if cid in ("agra", "delhi", "jaipur"))
    opts_to = "".join(f'<option value="{cid}">{c["en"]}</option>' for cid, c in list(CITIES.items()))
    veh_opts = "".join(f'<option value="{v["id"]}">{v["name"]["en"]}</option>' for v in VEHICLES)
    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_routes"], "")])}
  <h1>{t["h2_routes"]}</h1>
  <p class="lead">{t["desc_routes"]}</p>
</div></section>
<section class="section section--paper"><div class="container split">
  <div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>{t["route"]}</th><th>{t["time"]}</th><th>Sedan</th><th>Innova</th></tr></thead>
      <tbody>{"".join(rows)}</tbody>
    </table></div>
    <p class="muted" style="margin-top:14px">{t["round_note"]}</p>
  </div>
  <form class="calc-box" id="fare-calc">
    <p class="eyebrow">{t["sample_fare"]}</p>
    <h3 style="margin:10px 0 18px">{t["calc_title"]}</h3>
    <div class="field" style="margin-bottom:12px"><span>{t["pickup"]}</span><select name="from">{opts_from}</select></div>
    <div class="field" style="margin-bottom:12px"><span>{t["drop"]}</span><select name="to">{opts_to}</select></div>
    <div class="field" style="margin-bottom:12px"><span>{t["vehicle"]}</span><select name="vehicle">{veh_opts}</select></div>
    <div class="field" style="margin-bottom:16px"><span>{t["trip_type"]}</span>
      <select name="tripType"><option value="one-way">{t["one_way"]}</option><option value="round">{t["round"]}</option></select>
    </div>
    <button class="btn-primary" type="submit">{t["update_fare"]} <span>↗</span></button>
    <div id="fare-result" style="margin-top:20px;display:flex;flex-direction:column;gap:10px"></div>
  </form>
</div></section>
"""


def fleet_hub_body(lang):
    t = T[lang]
    cards = []
    for i, v in enumerate(VEHICLES, 1):
        rate_badge = f'<span class="badge" style="font-family:var(--mono);font-size:12px;margin-bottom:8px;color:var(--gold-text);background:var(--gold-wash);padding:3px 8px;border-radius:4px;display:inline-block">{v.get("rate_range", "")}</span>' if v.get("rate_range") else ""
        models_sample = ", ".join(v.get("models", {}).get(lang, [])[:3])
        models_p = f'<p class="muted" style="font-size:13px;margin:6px 0 10px"><strong>{"Models: " if lang == "en" else "मॉडल: "}</strong>{models_sample}</p>' if models_sample else ""
        cards.append(f"""
      <article class="vehicle-card" data-seats="{v["seats"]}">
        <a href="{vehicle_path(v, lang)}">
        <div class="vehicle-photo">{resp_img(v["image"], v["name"]["en"] + " hire in Agra", "(max-width: 700px) calc(100vw - 32px), (max-width: 1120px) 50vw, 348px")}<span>{i:02d} / 05 <b>{v["name"]["en"].upper()}</b></span></div>
        <div class="vehicle-body">
          {rate_badge}
          <h3>{v["name"][lang]}</h3>
          <p>{v["blurb"][lang]}</p>
          {models_p}
          <div class="vehicle-cta"><span>{t["from_word"]} {inr(ROUTES[0]["fares"][v["id"]])}</span><span class="btn-text">{t["view_fares"]} <span>↗</span></span></div>
        </div></a>
      </article>""")

    transfer_rows = []
    for tr in AIRPORT_STATION_TRANSFERS:
        book_url = f'/book.html?from={"delhi" if tr["id"] == "delhi-airport" else "agra"}&amp;to={"agra" if tr["id"] == "delhi-airport" else "agra"}&amp;trip=one-way'
        transfer_rows.append(f"""
        <tr data-href="{book_url}" tabindex="0">
          <td><strong>{tr["name"][lang]}</strong><br><small class="muted">{tr["desc"][lang]}</small></td>
          <td><span class="table-tag">{tr["duration"]}</span></td>
          <td><strong>{inr(tr["fares"]["sedan"])}</strong></td>
          <td><strong>{inr(tr["fares"]["ertiga"])}</strong></td>
          <td><strong>{inr(tr["fares"]["innova"])}</strong></td>
          <td><strong>{inr(tr["fares"]["tempo"])}</strong></td>
          <td><strong>{inr(tr["fares"]["urbania"])}</strong></td>
          <td><a class="btn-text" href="{book_url}">{t["book_cta"]} ↗</a></td>
        </tr>""")

    transfers_section = f"""
<section class="section section--paper-lt">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{"Punctual Doorstep Drops" if lang == "en" else "समयबद्ध डोरस्टेप ड्रॉप्स"}</p>
        <h2>{"Airport & Railway Station Direct Transfers" if lang == "en" else "एयरपोर्ट व रेलवे स्टेशन डायरेक्ट ट्रांसफर"}</h2>
      </div>
    </div>
    <p class="lead" style="max-width:760px;margin-bottom:24px">
      {"Fixed flat-fare transfers with flight delay tracking, platform meet & greet with name-board, sanitized AC cabs, and zero surge pricing." if lang == "en" else "फ्लाइट डिले ट्रैकिंग, प्लेटफॉर्म पर नेम-बोर्ड के साथ स्वागत, सैनिटाइज्ड एसी कैब और बिना किसी सर्ज के फिक्स फ्लैट किराया ट्रांसफर।"}
    </p>
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>{"Transfer Route" if lang == "en" else "ट्रांसफर रूट"}</th>
            <th>{"Est. Time" if lang == "en" else "अनुमानित समय"}</th>
            <th>Sedan (Dzire)</th>
            <th>MPV (Ertiga)</th>
            <th>SUV (Innova)</th>
            <th>Tempo (12s)</th>
            <th>Urbania (16s)</th>
            <th>{"Book" if lang == "en" else "बुक"}</th>
          </tr>
        </thead>
        <tbody>
          {"".join(transfer_rows)}
        </tbody>
      </table>
    </div>
  </div>
</section>
"""

    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_fleet"], "")])}
  <h1>{t["h2_fleet"]}</h1>
</div></section>
<section class="section section--paper"><div class="container">
  <div class="filter-row" data-filter-group="#fleet-grid">
    <button type="button" class="is-on" data-filter="all">{"All" if lang == "en" else "सभी"}</button>
    <button type="button" data-filter="sedan">1–4</button>
    <button type="button" data-filter="mpv">5–6</button>
    <button type="button" data-filter="group">Group</button>
  </div>
  <div class="grid-3" id="fleet-grid">{"".join(cards)}</div>
</div></section>
{transfers_section}
"""


def packages_hub_body(lang):
    t = T[lang]
    cards = []
    for p in PACKAGES:
        places = "".join(f"<span>{x}</span><i>→</i>" for x in p["places"][lang])
        cards.append(f"""
    <article class="package-card">
      <a href="{package_path(p, lang)}">
      <div class="package-photo">{resp_img(p["image"], p["name"]["en"], "(max-width: 700px) calc(100vw - 32px), (max-width: 1120px) 50vw, 545px", dims=PACK_DIMS)}<span class="kicker">{p["kicker"][lang]}</span></div>
      <div class="package-body">
        <h3>{p["name"][lang]}</h3>
        <p class="muted">{p["blurb"][lang]}</p>
        <div class="place-row">{places.removesuffix("<i>→</i>")}</div>
        <p class="fare">{inr(p["price"])}</p>
      </div></a>
    </article>""")
    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_packages"], "")])}
  <h1>{t["title_packages"].split("|")[0].strip()}</h1>
  <p class="lead">{t["desc_packages"]}</p>
</div></section>
<section class="section section--paper"><div class="container grid-2">{"".join(cards)}</div></section>
"""


def contact_body(lang):
    t = T[lang]
    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_contact"], "")])}
  <h1>{t["title_contact"].split("|")[0].strip()}</h1>
  <p class="lead">{t["desc_contact"]}</p>
</div></section>
<section class="section section--paper"><div class="container">
  {contact_card_html(lang, is_standalone_page=True)}
</div></section>
"""


def about_body(lang):
    t = T[lang]
    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_about"], "")])}
  <h1>{t["title_about"].split("|")[0].strip()}</h1>
  <p class="lead">{t["desc_about"]}</p>
</div></section>
<section class="section section--paper"><div class="container split">
  {resp_img("/assets/trust/driver.webp", "SK Baghel chauffeur in Agra", "(max-width: 1120px) calc(100vw - 32px), 637px", dims=DRIVER_DIMS, cls="portrait")}
  <div>
    <h2>{t["north_star"]}</h2>
    <p class="lead">{t["primary_lead"]}</p>
    <p style="margin-top:28px"><a class="btn-primary" href="tel:{PHONE}">{t["call"]}</a></p>
  </div>
</div></section>
{render_benefits_section(lang)}
"""


FAQS = [
    ("How does the advance payment work?", "You pay a part of the fare after the car is confirmed — often by call or WhatsApp first. The rest is paid to the driver. This demo does not charge anyone.",
     "एडवांस भुगतान कैसे होता है?", "गाड़ी कन्फर्म होने के बाद किराये का एक हिस्सा — अक्सर पहले कॉल या व्हाट्सऐप पर। बाकी ड्राइवर को। यह डेमो चार्ज नहीं करता।"),
    ("Can I cancel?", "Free cancellation up to 24 hours before pickup for cabs with 100% refund (processed in 5–7 business days). Multi-day tour packages follow a tiered refund slab (61+ days: 100% refund; 0–5 days: 0%).",
     "क्या रद्द कर सकते हैं?", "पिकअप से 24 घंटे पहले तक कैब रद्दीकरण पर शत-प्रतिशत रिफंड (5–7 कार्यदिवसों में)। मल्टी-डे टूर पैकेजों पर टियर आधारित रिफंड नियम लागू होते हैं।"),
    ("Is GST included?", "Sample fares are transparently quoted. A GST tax invoice is issued on confirmed paid bookings for corporate and family billing.",
     "क्या जीएसटी शामिल है?", "किराये पारदर्शी रूप से दर्शाए गए हैं। कॉर्पोरेट व फैमिली बिलिंग के लिए कन्फर्म बुकिंग पर अधिकृत जीएसटी इनवॉइस जारी किया जाता है।"),
    ("Do I need to show ID?", "Yes — a valid government photo ID (Aadhaar, Passport, Voter ID) for the lead passenger at pickup.",
     "क्या आईडी चाहिए?", "हाँ — पिकअप पर मुख्य यात्री की वैध सरकारी फोटो आईडी (आधार, पासपोर्ट आदि)।"),
    ("What about night driving allowance?", "Pickups or driving between 8:00 PM and 6:00 AM incur a night allowance of ₹300 for cars and ₹500 for Tempo Travellers, shown transparently before you confirm.",
     "रात की ड्राइविंग का क्या नियम है?", "रात 8:00 बजे से सुबह 6:00 बजे के बीच ड्राइविंग या पिकअप पर कारों के लिए ₹300 और टेम्पो ट्रैवलर के लिए ₹500 नाइट अलाउंस लागू होता है।"),
    ("How do I know the driver?", "Upon booking confirmation, you receive driver name, mobile number, and vehicle registration number via SMS and WhatsApp at least 2 hours before scheduled departure.",
     "ड्राइवर कैसे पता चलेगा?", "बुकिंग कन्फर्म होने पर यात्रा से कम से कम 2 घंटे पहले ड्राइवर का नाम, मोबाइल नंबर और गाड़ी का नंबर एसएमएस व व्हाट्सऐप पर प्राप्त हो जाता है।"),
]


def faq_body(lang):
    t = T[lang]
    items = []
    for en_q, en_a, hi_q, hi_a in FAQS:
        q, a = (en_q, en_a) if lang == "en" else (hi_q, hi_a)
        items.append(f"<details><summary>{q}</summary><p>{a}</p></details>")
    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_faq"], "")])}
  <h1>{t["title_faq"].split("|")[0].strip()}</h1>
</div></section>
<section class="section section--paper"><div class="container faq">{"".join(items)}</div></section>
"""


def legal_body(lang, kind):
    t = T[lang]
    if kind == "privacy":
        title = t["title_privacy"]
        content = f"""
        <div class="legal-card" style="background:var(--surface, #FFFFFF);border:1px solid var(--border, rgba(0,0,0,0.08));border-radius:12px;padding:2rem;margin-top:1.5rem;line-height:1.75;">
          <h2>{"1. Information Collection & Use" if lang == "en" else "1. जानकारी संग्रह और उपयोग"}</h2>
          <p>{"We collect only essential details necessary for trip coordination, chauffeur dispatch, and billing: passenger name, contact phone, pickup address, and travel schedule. We do not store financial card or banking credentials on our servers." if lang == "en" else "हम केवल यात्रा समन्वय, शोफर डिस्पैच और बिलिंग के लिए आवश्यक जानकारी (यात्री का नाम, संपर्क नंबर, पिकअप पता और समय) एकत्र करते हैं। हम अपने सर्वर पर कोई भी बैंक या कार्ड विवरण संग्रहीत नहीं करते हैं।"}</p>
          
          <h2 style="margin-top:1.5rem">{"2. Zero Third-Party Sharing" if lang == "en" else "2. थर्ड पार्टी के साथ कोई साझाकरण नहीं"}</h2>
          <p>{"Your personal travel data is strictly private and is never sold, rented, or shared with third-party advertisers. Chauffeur details (name, phone, and vehicle registration) are shared exclusively with confirmed booking passengers via SMS and WhatsApp." if lang == "en" else "आपकी व्यक्तिगत यात्रा जानकारी पूरी तरह से गोपनीय है और कभी भी किसी तीसरे पक्ष के साथ बेची या साझा नहीं की जाती है। ड्राइवर का विवरण केवल कन्फर्म बुकिंग वाले यात्रियों के साथ साझा किया जाता है।"}</p>

          <h2 style="margin-top:1.5rem">{"3. 256-Bit SSL Security" if lang == "en" else "3. 256-बिट एसएसएल सुरक्षा"}</h2>
          <p>{"All communications and form transmissions through our website are secured using standard 256-bit SSL encryption. Advance tokens are processed through certified and compliant payment gateways." if lang == "en" else "हमारी वेबसाइट के माध्यम से सभी फॉर्म और संचार 256-बिट एसएसएल एन्क्रिप्शन से सुरक्षित हैं। एडवांस टोकन प्रमाणित पेमेंट गेटवे के माध्यम से सुरक्षित संसाधित होते हैं।"}</p>

          <h2 style="margin-top:1.5rem">{"4. Contact for Privacy Inquiries" if lang == "en" else "4. गोपनीयता संबंधी संपर्क"}</h2>
          <p>{PHONE_DISPLAY} · {EMAIL} · {ADDRESS}</p>
        </div>
        """
    else:
        title = t["title_terms"]
        slabs_rows = "".join([
            f"<tr><td style='padding:0.75rem 1rem;border-bottom:1px solid var(--border, rgba(0,0,0,0.08));font-weight:600'>{row['days']}</td><td style='padding:0.75rem 1rem;border-bottom:1px solid var(--border, rgba(0,0,0,0.08));color:var(--gold, #E5A044)'>{row['fee']}</td><td style='padding:0.75rem 1rem;border-bottom:1px solid var(--border, rgba(0,0,0,0.08))'>{row['refund']}</td></tr>"
            for row in CANCELLATION_SLABS_TOUR
        ])
        content = f"""
        <div class="legal-card" style="background:var(--surface, #FFFFFF);border:1px solid var(--border, rgba(0,0,0,0.08));border-radius:12px;padding:2rem;margin-top:1.5rem;line-height:1.75;">
          <h2>{"1. Booking & Advance Confirmation" if lang == "en" else "1. बुकिंग और एडवांस कन्फर्मेशन"}</h2>
          <p>{"A booking is considered confirmed once the passenger selects their vehicle and pays the agreed initial advance (typically 20–28%). The remaining balance is payable directly to the chauffeur upon trip completion or as agreed prior to departure." if lang == "en" else "बुकिंग तब कन्फर्म मानी जाती है जब यात्री वाहन चुनकर तय एडवांस (सामान्यतः 20–28%) का भुगतान कर देता है। शेष राशि यात्रा पूरी होने पर सीधे शोफर को देय होती है।"}</p>

          <h2 style="margin-top:1.5rem">{"2. Point-to-Point Cab Cancellation Policy" if lang == "en" else "2. पॉइंट-टू-पॉइंट कैब कैंसलेशन नीति"}</h2>
          <p style="background:var(--bg-alt, #F8F9FA);padding:1rem;border-left:4px solid var(--gold, #E5A044);border-radius:4px;">
            <strong>{CANCELLATION_POLICY_CAB[lang]}</strong>
          </p>
          <p>{"All refunds are processed and credited to the original payment source within 5 to 7 business days. For cancellations, please call our 24×7 dispatch at " + PHONE_DISPLAY + " or contact us via WhatsApp." if lang == "en" else "सभी रिफंड 5 से 7 कार्य दिवसों के भीतर मूल भुगतान माध्यम में जमा किए जाते हैं। रद्दीकरण के लिए कृपया हमारे 24×7 नंबर " + PHONE_DISPLAY + " पर कॉल करें या व्हाट्सऐप करें।"}</p>

          <h2 style="margin-top:1.5rem">{"3. Multi-Day Tour Package Cancellation Schedule" if lang == "en" else "3. मल्टी-डे टूर पैकेज रद्दीकरण समय-सारणी"}</h2>
          <div style="overflow-x:auto;margin:1rem 0;">
            <table style="width:100%;border-collapse:collapse;text-align:left;font-size:0.95rem;">
              <thead>
                <tr style="background:var(--bg-alt, #F8F9FA);">
                  <th style="padding:0.75rem 1rem;border-bottom:2px solid var(--border, rgba(0,0,0,0.12));">{"Notice Period" if lang == "en" else "सूचना अवधि"}</th>
                  <th style="padding:0.75rem 1rem;border-bottom:2px solid var(--border, rgba(0,0,0,0.12));">{"Cancellation Fee" if lang == "en" else "कैंसलेशन शुल्क"}</th>
                  <th style="padding:0.75rem 1rem;border-bottom:2px solid var(--border, rgba(0,0,0,0.12));">{"Refund Payable" if lang == "en" else "देय रिफंड"}</th>
                </tr>
              </thead>
              <tbody>
                {slabs_rows}
              </tbody>
            </table>
          </div>

          <h2 style="margin-top:1.5rem">{"4. Night Allowance, Tolls & Outstation Rules" if lang == "en" else "4. नाइट चार्ज, टोल और आउटस्टेशन नियम"}</h2>
          <ul style="padding-left:1.25rem;margin:0.5rem 0;">
            <li>{"Driver Night Allowance: Flat ₹" + str(NIGHT_ALLOWANCE_CAB) + " for cabs and ₹" + str(NIGHT_ALLOWANCE_TEMPO) + " for Tempo Travellers applies when the vehicle is in service between 8:00 PM and 6:00 AM." if lang == "en" else "ड्राइवर नाइट चार्ज: रात 8:00 बजे से सुबह 6:00 बजे के बीच सेवा देने पर कैब के लिए ₹" + str(NIGHT_ALLOWANCE_CAB) + " और टेम्पो के लिए ₹" + str(NIGHT_ALLOWANCE_TEMPO) + " लागू होता है।"}</li>
            <li>{"Outstation Minimum Billing: Multi-day round-trip bookings adhere to a standard minimum billing of " + str(OUTSTATION_MIN_KM) + " KM per calendar day." if lang == "en" else "आउटस्टेशन न्यूनतम बिलिंग: मल्टी-डे राउंड ट्रिप बुकिंग में प्रति कैलेंडर दिन न्यूनतम " + str(OUTSTATION_MIN_KM) + " किमी बिलिंग का नियम लागू होता है।"}</li>
            <li>{"State permits, expressway tolls, and monument parking charges are payable at actuals unless explicitly quoted as inclusive in the package voucher." if lang == "en" else "स्टेट परमिट, एक्सप्रेसवे टोल और स्मारक पार्किंग शुल्क वास्तविक रसीदों के आधार पर देय होते हैं (जब तक कि पैकेज में शामिल न हों)।"}</li>
          </ul>

          <h2 style="margin-top:1.5rem">{"5. Passenger Conduct & Vehicle Safety" if lang == "en" else "5. यात्री आचरण और वाहन सुरक्षा"}</h2>
          <p>{"Smoking, consumption of alcohol, or possession of prohibited substances inside the vehicle is strictly forbidden under transport regulations. Passengers are requested to carry a government-issued photo ID. Any intentional damage caused to vehicle upholstery or equipment will be chargeable to the passenger." if lang == "en" else "परिवहन नियमों के तहत वाहन के अंदर धूम्रपान, शराब का सेवन या प्रतिबंधित पदार्थों का उपयोग सख्त वर्जित है। यात्रियों से वैध फोटो पहचान पत्र साथ रखने का अनुरोध किया जाता है। वाहन को किसी भी प्रकार की क्षति होने पर यात्री जिम्मेदार होंगे।"}</p>

          <h2 style="margin-top:1.5rem">{"6. Legal Jurisdiction" if lang == "en" else "6. कानूनी क्षेत्राधिकार"}</h2>
          <p>{"Any claims, disputes, or legal proceedings arising out of services provided by SK Baghel Tour & Travels shall fall exclusively within the jurisdiction of courts located in Agra, Uttar Pradesh, India." if lang == "en" else "एसके बघेल टूर एंड ट्रैवल्स द्वारा प्रदान की जाने वाली सेवाओं से संबंधित कोई भी कानूनी विवाद केवल आगरा, उत्तर प्रदेश न्यायालय के क्षेत्राधिकार के अधीन होगा।"}</p>
        </div>
        """

    return f"""
<section class="page-hero"><div class="container legal">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (title.split("|")[0].strip(), "")])}
  <h1>{title.split("|")[0].strip()}</h1>
  <p class="lead">{t["desc_privacy"] if kind == "privacy" else t["desc_terms"]}</p>
  {content}
</div></section>
"""


def book_body():
    t = T["en"]
    return f"""
<section class="page-hero"><div class="container">
  <p class="eyebrow">Advance booking</p>
  <h1>Short enough to finish.<br /><i>Clear enough to trust.</i></h1>
  <p class="lead">{t["primary_lead"]}</p>
  <div class="hero-actions" style="margin-top:20px">
    <a class="btn-primary" href="tel:{PHONE}">{t["call"]} {PHONE_DISPLAY}</a>
    <a class="btn-outline" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
  </div>
</div></section>
<section class="container book-layout">
  <div>
    <noscript class="note">Booking needs JavaScript. Call {PHONE_DISPLAY}.</noscript>
    <div class="stepper" aria-label="Booking progress">
      <button type="button" data-step="1" class="is-current"><i>1</i> Route</button>
      <button type="button" data-step="2"><i>2</i> Vehicle</button>
      <button type="button" data-step="3"><i>3</i> Details</button>
      <button type="button" data-step="4"><i>4</i> Advance</button>
      <button type="button" data-step="5"><i>5</i> Ticket</button>
    </div>
    <div class="panel is-active" data-step="1" id="step-1">
      <div class="note" id="package-banner" hidden></div>
      <div class="grid-2" style="margin-top:16px">
        <div class="field loc-field">
          <span>Pickup city</span>
          <div class="loc-picker" id="book-from-picker">
            <button type="button" class="loc-display-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Pickup city">
              <span class="loc-pin">📍</span>
              <span class="loc-value">Agra (AGR)</span>
              <span class="loc-chevron">▾</span>
            </button>
            <select id="from" style="display:none">
              <option value="agra" selected>Agra (AGR)</option>
              <option value="delhi">Delhi (DEL)</option>
              <option value="jaipur">Jaipur (JAI)</option>
              <option value="mathura">Mathura (MAT)</option>
              <option value="gwalior">Gwalior (GWL)</option>
              <option value="lucknow">Lucknow (LKO)</option>
            </select>
            <div class="loc-dropdown" hidden>
              <div class="loc-search-head">
                <span class="loc-search-icon">🔍</span>
                <input type="text" class="loc-search-query" placeholder="Search city, airport, landmark..." autocomplete="off" />
                <span class="loc-api-tag" title="Connect Google Maps API">Google Maps</span>
              </div>
              <div class="loc-quick-tags">
                <span class="loc-tag" data-val="agra">Agra</span>
                <span class="loc-tag" data-val="delhi">Delhi (DEL)</span>
                <span class="loc-tag" data-val="jaipur">Jaipur (JAI)</span>
                <span class="loc-tag" data-val="mathura">Mathura</span>
                <span class="loc-tag" data-val="ayodhya">Ayodhya</span>
                <span class="loc-tag" data-val="rishikesh">Rishikesh</span>
              </div>
              <div class="loc-results" role="listbox"></div>
            </div>
          </div>
        </div>
        <div class="field loc-field">
          <span>Drop city</span>
          <div class="loc-picker" id="book-to-picker">
            <button type="button" class="loc-display-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Drop city">
              <span class="loc-pin">📍</span>
              <span class="loc-value">Delhi (DEL)</span>
              <span class="loc-chevron">▾</span>
            </button>
            <select id="to" style="display:none">
              <option value="delhi" selected>Delhi (DEL)</option>
              <option value="jaipur">Jaipur (JAI)</option>
              <option value="mathura">Mathura (MAT)</option>
              <option value="gwalior">Gwalior (GWL)</option>
              <option value="lucknow">Lucknow (LKO)</option>
              <option value="agra">Agra (AGR)</option>
            </select>
            <div class="loc-dropdown" hidden>
              <div class="loc-search-head">
                <span class="loc-search-icon">🔍</span>
                <input type="text" class="loc-search-query" placeholder="Search drop city, airport, hotel..." autocomplete="off" />
                <span class="loc-api-tag" title="Connect Google Maps API">Google Maps</span>
              </div>
              <div class="loc-quick-tags">
                <span class="loc-tag" data-val="delhi">Delhi</span>
                <span class="loc-tag" data-val="jaipur">Jaipur</span>
                <span class="loc-tag" data-val="mathura">Mathura</span>
                <span class="loc-tag" data-val="gwalior">Gwalior</span>
                <span class="loc-tag" data-val="lucknow">Lucknow</span>
                <span class="loc-tag" data-val="agra">Agra tour</span>
              </div>
              <div class="loc-results" role="listbox"></div>
            </div>
          </div>
        </div>
        <label class="field"><span>Travel date</span><input id="date" type="date" required /></label>
        <label class="field"><span>Pickup time</span><input id="time" type="time" /></label>
        <label class="field"><span>Trip type</span>
          <select id="tripType"><option value="one-way">One-way</option><option value="round">Round trip</option></select>
        </label>
        <label class="field"><span>Passengers</span>
          <select id="passengers"><option value="4">1–4</option><option value="6">5–6</option><option value="12">7–12</option><option value="16">13–16</option></select>
        </label>
      </div>
      <div class="form-actions"><span class="muted">Or call to confirm the car first.</span>
        <button class="btn-primary" type="button" data-next="2">Choose vehicle <span>↗</span></button></div>
    </div>
    <div class="panel" data-step="2">
      <div class="vehicle-pick" id="vehicle-pick"></div>
      <div class="form-actions"><button class="btn-outline" type="button" data-back="1">Back</button>
        <button class="btn-primary" type="button" data-next="3">Passenger details <span>↗</span></button></div>
    </div>
    <div class="panel" data-step="3">
      <div class="grid-2">
        <label class="field"><span>Full name</span><input id="fullName" autocomplete="name" /></label>
        <label class="field"><span>Mobile number</span><input id="phone" type="tel" inputmode="tel" autocomplete="tel" /></label>
        <label class="field" style="grid-column:1/-1"><span>Pickup point (hotel, airport terminal, or address)</span><input id="pickupPoint" placeholder="e.g. ITC Mughal Taj Ganj, IGI Airport Terminal 3, Agra Cantt Railway Station" autocomplete="off" /></label>
        <label class="field" style="grid-column:1/-1"><span>Note to driver</span><textarea id="note"></textarea></label>
      </div>
      <div class="form-actions"><button class="btn-outline" type="button" data-back="2">Back</button>
        <button class="btn-primary" type="button" data-next="4">Review &amp; pay <span>↗</span></button></div>
    </div>
    <div class="panel" data-step="4">
      <p class="muted">Payment is secondary. Most guests call first. This button is a 900ms demo.</p>
      <form id="pay-form">
        <div class="coupon-box" style="background:var(--bg-alt, #F8F9FA);border:1px solid var(--border, rgba(0,0,0,0.08));border-radius:8px;padding:12px 14px;margin-bottom:18px;">
          <label for="couponCode" style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">Have a Promo / Coupon Code?</label>
          <div style="display:flex;gap:8px;">
            <input id="couponCode" placeholder="Try ASTTCAR500OFF" style="flex:1;text-transform:uppercase;padding:8px 12px;border:1px solid var(--border, rgba(0,0,0,0.15));border-radius:6px;font-family:var(--font-mono, monospace);font-size:0.9rem;" />
            <button type="button" class="btn-outline btn-sm" id="btn-apply-coupon" style="padding:6px 14px;">Apply</button>
          </div>
          <div id="coupon-feedback" style="font-size:0.8rem;margin-top:6px;display:none;"></div>
        </div>
        <div class="pay-methods">
          <label><input type="radio" name="pay" value="upi" checked /> UPI</label>
          <label><input type="radio" name="pay" value="card" /> Card</label>
        </div>
        <div class="form-actions"><button class="btn-outline" type="button" data-back="3">Back</button>
          <button class="btn-primary" id="pay-button" type="submit">Pay <span id="pay-amount">₹1,000</span> <span>↗</span></button></div>
      </form>
    </div>
    <div class="panel" data-step="5"><div id="ticket"></div></div>
  </div>
  <aside class="summary" id="booking-summary" aria-live="polite"></aside>
</section>
"""


def redirect_html(target: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url={target}" />
    <link rel="canonical" href="{url(target)}" />
    <title>Redirecting…</title>
    <script>location.replace({target!r})</script>
  </head>
  <body><p><a href="{target}">Continue</a></p></body>
</html>
"""


def write_redirect(old_name: str, target: str):
    path = ROOT / old_name
    path.write_text(rebase(redirect_html(target), old_name), encoding="utf-8")
    print("redirect", old_name, "→", target)


def write_sitemap():
    # lastmod = build date: every deploy re-renders content, so it is an honest
    # freshness signal (git-mtime would collapse to a single commit date).
    lastmod = date.today().isoformat()
    locs = []
    for path in SITEMAP_URLS:
        loc = SITE + ("" if path == "/" else path.rstrip("/") + "/")
        if path == "/":
            loc = SITE + "/"
        locs.append(f"  <url><loc>{loc}</loc><lastmod>{lastmod}</lastmod></url>")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(locs) + "\n</urlset>\n"
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print("sitemap", len(locs), "urls")


def write_404():
    # NOTE: relative URLs here assume the 404 is served from the site root.
    # GitHub Pages can serve 404.html under deep missing paths, where its
    # relative CSS/link refs won't resolve — cosmetic edge case, acceptable
    # for the demo; the canonical domain serves 404s at the root.
    (ROOT / "404.html").write_text(
        rebase(
            f"""<!doctype html><html lang="en-IN"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Page not found | SK Baghel</title>
<link rel="stylesheet" href="/css/tokens.css"/><link rel="stylesheet" href="/css/site.css"/><link rel="stylesheet" href="/css/components.css"/></head>
<body><main class="page-hero"><div class="container"><h1>This page<br /><i>isn’t on the map.</i></h1>
<p class="lead">Try the home page, or call {PHONE_DISPLAY}.</p>
<p><a class="btn-primary" href="/">Home</a></p></div></main></body></html>""",
            "404.html",
        ),
        encoding="utf-8",
    )


def write_client_contact():
    """Emit js/contact.js from catalog.py so the client-side NAP can never
    drift from the SSG copy. Replaces the hand-maintained SKB.contact block
    that used to live in js/data.js."""
    contact = {
        "phone": PHONE,
        "phoneDisplay": PHONE_DISPLAY,
        "whatsapp": WHATSAPP,
        "email": EMAIL,
        "address": ADDRESS,
        "hours": HOURS,
        "mapsUrl": MAPS_URL,
        "gst": GST,
    }
    payload = (
        "/* GENERATED by scripts/render_pages.py from scripts/catalog.py — "
        "do not hand-edit. */\n"
        "window.SKB = window.SKB || {};\n"
        f"SKB.contact = {json.dumps(contact, ensure_ascii=False, indent=2)};\n"
    )
    (ROOT / "js" / "contact.js").write_text(payload, encoding="utf-8")
    print("wrote js/contact.js")


def generate_lang(lang: str):
    t = T[lang]
    other = "hi" if lang == "en" else "en"
    # Home
    write_page(
        lang=lang,
        path="/" if lang == "en" else "/hi/",
        alt_path="/hi/" if lang == "en" else "/",
        title=t["title_home"],
        description=t["desc_home"],
        active="home",
        body=home_body(lang),
        preload_hero=True,
        jsonld=[org_schema(), {"@context": "https://schema.org", "@type": "WebSite", "name": "SK Baghel Tour & Travels", "url": SITE, "inLanguage": t["html_lang"]}],
    )
    hubs = {
        "services": (services_body, t["title_services"], t["desc_services"]),
        "routes": (routes_hub_body, t["title_routes"], t["desc_routes"]),
        "packages": (packages_hub_body, t["title_packages"], t["desc_packages"]),
        "fleet": (fleet_hub_body, t["title_fleet"], t["desc_fleet"]),
        "about": (about_body, t["title_about"], t["desc_about"]),
        "contact": (contact_body, t["title_contact"], t["desc_contact"]),
        "faq": (faq_body, t["title_faq"], t["desc_faq"]),
        "privacy": (lambda l: legal_body(l, "privacy"), t["title_privacy"], t["desc_privacy"]),
        "terms": (lambda l: legal_body(l, "terms"), t["title_terms"], t["desc_terms"]),
    }
    for hub, (fn, title, desc) in hubs.items():
        clean_title = title.split("—")[0].split("|")[0].strip()
        extra_ld = [
            org_schema(),
            crumbs([(t["home"], hub_path("home", lang)), (clean_title, hub_path(hub, lang))]),
        ]
        if hub == "faq":
            extra_ld.append({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {"@type": "Question", "name": (en_q if lang == "en" else hi_q), "acceptedAnswer": {"@type": "Answer", "text": (en_a if lang == "en" else hi_a)}}
                    for en_q, en_a, hi_q, hi_a in FAQS
                ],
            })
        write_page(
            lang=lang,
            path=hub_path(hub, lang),
            alt_path=hub_path(hub, other),
            title=title,
            description=desc,
            active=hub,
            body=fn(lang),
            jsonld=extra_ld,
        )

    for route in ROUTES:
        origin, dest = CITIES[route["from"]], CITIES[route["to"]]
        if lang == "en":
            title = f"{origin['en']} to {dest['en']} Taxi — from {inr(route['fares']['sedan'])} | SK Baghel" if route["kind"] != "local" else f"Agra Sightseeing Taxi — from {inr(route['fares']['sedan'])} | SK Baghel"
            desc = route["intro"]["en"]
            hname = f"{origin['en']} to {dest['en']} taxi" if route["kind"] != "local" else "Agra sightseeing taxi"
        else:
            title = f"{origin['hi']} से {dest['hi']} टैक्सी — {inr(route['fares']['sedan'])} से | एसके बाघेल" if route["kind"] != "local" else f"आगरा दर्शन टैक्सी — {inr(route['fares']['sedan'])} से | एसके बाघेल"
            desc = route["intro"]["hi"]
            hname = f"{origin['hi']} से {dest['hi']} टैक्सी" if route["kind"] != "local" else "आगरा दर्शन टैक्सी"

        route_faqs = get_route_faqs(route, origin, dest)
        route_faq_ld = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": (q_en if lang == "en" else q_hi),
                    "acceptedAnswer": {"@type": "Answer", "text": (a_en if lang == "en" else a_hi)},
                }
                for q_en, a_en, q_hi, a_hi in route_faqs
            ],
        }

        write_page(
            lang=lang,
            path=route_path(route, lang),
            alt_path=route_path(route, other),
            title=title,
            description=desc,
            active="routes",
            kind="route",
            body=route_body(lang, route),
            jsonld=[
                org_schema(),
                crumbs([(t["home"], hub_path("home", lang)), (t["crumb_routes"], hub_path("routes", lang)), (hname, route_path(route, lang))]),
                route_faq_ld,
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "name": title.split("—")[0].strip() if "—" in title else title.split("|")[0].strip(),
                    "provider": {"@id": f"{SITE}/#business"},
                    "areaServed": [origin["en"], dest["en"]],
                    "offers": {
                        "@type": "Offer",
                        "priceCurrency": "INR",
                        "price": route["fares"]["sedan"],
                        "availability": "https://schema.org/InStock",
                        "priceValidUntil": PRICE_VALID_UNTIL,
                    },
                },
            ],
        )

    for veh in VEHICLES:
        title = f"{veh['name'][lang]} hire in Agra | SK Baghel" if lang == "en" else f"आगरा में {veh['name'][lang]} | एसके बाघेल"
        desc = veh["blurb"][lang]
        write_page(
            lang=lang,
            path=vehicle_path(veh, lang),
            alt_path=vehicle_path(veh, other),
            title=title,
            description=desc,
            active="fleet",
            body=vehicle_body(lang, veh),
            jsonld=[org_schema(), crumbs([(t["home"], hub_path("home", lang)), (t["nav_fleet"], hub_path("fleet", lang)), (veh["name"][lang], vehicle_path(veh, lang))])],
        )

    for pack in PACKAGES:
        title = f"{pack['name'][lang]} — from {inr(pack['price'])} | SK Baghel"
        pack_faqs = get_package_faqs(pack)
        pack_faq_ld = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": (q_en if lang == "en" else q_hi),
                    "acceptedAnswer": {"@type": "Answer", "text": (a_en if lang == "en" else a_hi)},
                }
                for q_en, a_en, q_hi, a_hi in pack_faqs
            ],
        }
        write_page(
            lang=lang,
            path=package_path(pack, lang),
            alt_path=package_path(pack, other),
            title=title,
            description=pack["blurb"][lang],
            active="packages",
            body=package_body(lang, pack),
            jsonld=[
                org_schema(),
                crumbs([(t["home"], hub_path("home", lang)), (t["crumb_packages"], hub_path("packages", lang)), (pack["name"][lang], package_path(pack, lang))]),
                pack_faq_ld,
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "name": pack["name"][lang],
                    "serviceType": "Sightseeing tour by private taxi",
                    "provider": {"@id": f"{SITE}/#business"},
                    "areaServed": ["Agra"],
                    "offers": {
                        "@type": "Offer",
                        "priceCurrency": "INR",
                        "price": pack["price"],
                        "availability": "https://schema.org/InStock",
                        "priceValidUntil": PRICE_VALID_UNTIL,
                    },
                },
            ],
        )


def main():
    SITEMAP_URLS.clear()
    # Refresh -480/-768/-sm image derivatives for any replaced photography
    # (no-op when assets are untouched or ImageMagick is unavailable).
    ensure_derivatives(ROOT)
    write_client_contact()
    generate_lang("en")
    generate_lang("hi")

    t = T["en"]
    write_page(
        lang="en",
        path="/book.html",
        alt_path="/book.html",
        title=t["title_book"],
        description=t["desc_book"],
        active="book",
        body=book_body(),
        extra_js='<script src="/js/booking.js" defer></script>',
        noindex=True,
        jsonld=[org_schema()],
    )

    write_redirect("en/index.html", "/")
    for old, target in [
        ("services.html", "/en/services/"),
        ("routes.html", "/en/routes/"),
        ("packages.html", "/en/packages/"),
        ("fleet.html", "/en/fleet/"),
        ("about.html", "/en/about/"),
        ("contact.html", "/en/contact/"),
        ("faq.html", "/en/faq/"),
        ("privacy.html", "/en/privacy/"),
        ("terms.html", "/en/terms/"),
    ]:
        write_redirect(old, target)

    write_sitemap()
    write_404()
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /book.html\nDisallow: /design-guide/\nSitemap: {SITE}/sitemap.xml\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
