#!/usr/bin/env python3
"""SSG: bilingual marketing pages + booking app. Data-driven, static HTML."""
from __future__ import annotations

import json
from pathlib import Path

from catalog import (
    CITIES,
    EMAIL,
    GEO,
    PACKAGES,
    PHONE,
    PHONE_DISPLAY,
    ROUTES,
    SITE,
    VEHICLES,
    WHATSAPP,
    hub_path,
    inr,
    package_path,
    route_path,
    vehicle,
    vehicle_path,
)
from i18n import BRAND_SVG, T

ROOT = Path(__file__).resolve().parents[1]
FONTS_EN = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap"
FONTS_HI = FONTS_EN + "&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Serif+Devanagari:wght@500;600"

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
        "name": "SK Baghel Town & Travels",
        "url": SITE,
        "telephone": PHONE,
        "email": EMAIL,
        "image": f"{SITE}/assets/brand/og-banner.webp",
        "priceRange": "₹₹",
        "areaServed": ["Agra", "Delhi", "Jaipur", "Mathura", "Gwalior", "Lucknow"],
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
        f'<meta property="og:site_name" content="SK Baghel Town &amp; Travels" />',
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


def header(lang: str, active: str, alt_path: str):
    t = T[lang]
    nav = [
        ("services", t["nav_services"]),
        ("routes", t["nav_routes"]),
        ("packages", t["nav_packages"]),
        ("fleet", t["nav_fleet"]),
        ("contact", t["nav_contact"]),
    ]
    links = "\n          ".join(
        f'<a href="{hub_path(key, lang)}" data-nav="{key}">{label}</a>' for key, label in nav
    )
    sheet = "\n        ".join(
        [f'<a href="{hub_path("home", lang)}" data-nav="home">{t["home"]}</a>']
        + [f'<a href="{hub_path(key, lang)}" data-nav="{key}">{label}</a>' for key, label in nav]
    )
    home = hub_path("home", lang)
    wa = f"https://wa.me/{WHATSAPP}"
    return f"""\
<a class="skip-link" href="#main">{t["skip"]}</a>
<header class="site-header" id="site-header">
  <div class="container header-inner">
    <a class="brand" href="{home}" aria-label="SK Baghel Town &amp; Travels">
      <span class="brand-mark">{BRAND_SVG}</span>
      <span class="brand-copy"><strong>SK BAGHEL</strong><small>TOWN &amp; TRAVELS</small></span>
    </a>
    <nav class="nav-desktop" aria-label="Primary">{links}</nav>
    <div class="header-actions">
      <span class="demo-chip"><i class="live-dot"></i> {t["demo"]}</span>
      <a class="lang-switch" href="{alt_path}" hreflang="{T["hi" if lang == "en" else "en"]["hreflang"]}">{t["switch"]}</a>
      <a class="btn-outline btn-sm btn-outline--light" href="tel:{PHONE}" data-event="cta_click">{t["call"]}</a>
      <a class="btn-outline btn-sm btn-outline--light" href="{wa}" target="_blank" rel="noreferrer" data-event="cta_click">{t["whatsapp"]}</a>
      <a class="btn-primary btn-sm" href="/book.html" data-event="cta_click">{t["book"]} <span>↗</span></a>
      <button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-sheet" aria-label="{t["menu"]}"><span></span></button>
    </div>
  </div>
</header>
<div class="nav-sheet" id="nav-sheet" hidden>
  <div class="sheet-head">
    <a class="brand" href="{home}">
      <span class="brand-mark">{BRAND_SVG}</span>
      <span class="brand-copy"><strong>SK BAGHEL</strong><small>TOWN &amp; TRAVELS</small></span>
    </a>
    <button type="button" id="nav-close" class="btn-outline btn-outline--light btn-sm">{t["close"]}</button>
  </div>
  {sheet}
  <a href="{alt_path}">{t["switch"]}</a>
  <a href="tel:{PHONE}">{t["call"]} {PHONE_DISPLAY}</a>
  <a class="btn-primary" href="/book.html">{t["book"]} <span>↗</span></a>
</div>"""


def footer(lang: str):
    t = T[lang]
    return f"""\
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <span class="brand-mark" style="width:28px;color:#fffdf8">{BRAND_SVG}</span>
      <strong>Agra → India</strong>
      <p>Discover → Book → Go</p>
      <p>Near Taj East Gate Road, Taj Ganj, Agra</p>
      <p><a href="tel:{PHONE}">{PHONE_DISPLAY}</a></p>
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
      <a href="tel:{PHONE}">{PHONE_DISPLAY}</a>
      <a href="{hub_path("privacy", lang)}">{t["privacy"]}</a>
      <a href="{hub_path("terms", lang)}">{t["terms"]}</a>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© <span id="year">2026</span> SK Baghel Town &amp; Travels · {t["preview"]}</span>
    <span>{t["footer_note"]}</span>
  </div>
</footer>
<div class="lead-bar" role="navigation" aria-label="Contact">
  <a class="lead-call" href="tel:{PHONE}">{t["call"]}</a>
  <a class="lead-wa" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
  <a class="lead-book" href="/book.html">{t["book_cta"]}</a>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>"""


def write_page(*, lang, path, alt_path, title, description, active, body, extra_head="", extra_js="", noindex=False, jsonld=None, preload_hero=False, kind=""):
    t = T[lang]
    fonts = FONTS_HI if lang == "hi" else FONTS_EN
    extra = extra_head
    if preload_hero:
        extra = '<link rel="preload" as="image" href="/assets/hero/hero-highway.webp" fetchpriority="high" />\n    ' + extra
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
        '<script src="/js/fares.js" defer></script>',
        '<script src="/js/app.js" defer></script>',
    ]
    if extra_js:
        scripts.append(extra_js)
    html = f"""<!doctype html>
<html lang="{t["html_lang"]}" dir="{t["dir"]}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0B171E" />
    <link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="{fonts}" rel="stylesheet" />
    <link rel="stylesheet" href="/css/tokens.css" />
    <link rel="stylesheet" href="/css/site.css" />
    {head}
  </head>
  <body data-page="{active}" data-lang="{lang}"{kind_attr}>
    {header(lang, active, alt_path)}
    <main id="main">
      {body}
    </main>
    {footer(lang)}
    {"".join(scripts)}
  </body>
</html>
"""
    rel = "index.html" if path == "/" else path.strip("/") + "/index.html"
    if path.endswith(".html"):
        rel = path.lstrip("/")
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    if not noindex:
        SITEMAP_URLS.append(path if path != "/" else "/")
    print("wrote", rel)


def breadcrumb(lang, items):
    t = T[lang]
    inner = ' <span aria-hidden="true">/</span> '.join(
        f'<a href="{href}">{label}</a>' if href else f"<span>{label}</span>" for label, href in items
    )
    return f'<nav class="crumbs" aria-label="{t["breadcrumb"]}">{inner}</nav>'


def home_body(lang):
    t = T[lang]
    cards = []
    for r in ROUTES[:3]:
        origin, dest = CITIES[r["from"]], CITIES[r["to"]]
        label = t["local_label"] if r["kind"] == "local" else f"{origin[lang]} → {dest[lang]}"
        cards.append(f"""
      <a class="route-card" href="{route_path(r, lang)}">
        <div class="route-codes"><span>{origin["code"]}</span><b>→</b><span>{dest["code"]}</span></div>
        <div class="route-meta"><span>{label}</span><span>{r["duration"]} · {r["km"]} km</span></div>
        <p class="fare">{inr(r["fares"]["sedan"])} <small>{t["from_word"]} · {vehicle("sedan")["name"][lang]}</small></p>
      </a>""")
    vcards = []
    for vid, idx in (("sedan", "01"), ("innova", "03"), ("tempo", "04")):
        v = vehicle(vid)
        vcards.append(f"""
      <article class="vehicle-card">
        <div class="vehicle-photo">
          <img src="{v["image"]}" alt="{v["name"]["en"]} taxi in Agra" width="700" height="438" loading="lazy" />
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
    return f"""
<section class="hero">
  <img class="hero-media" src="/assets/hero/hero-highway.webp" srcset="/assets/hero/hero-highway-sm.webp 960w, /assets/hero/hero-highway.webp 1920w" sizes="100vw" width="1920" height="823" alt="Luxury sedan taxi on an open highway at dusk near Agra" fetchpriority="high" />
  <div class="hero-overlay"></div>
  <div class="hero-grain"></div>
  <div class="container hero-copy">
    <p class="eyebrow eyebrow--light">{t["home"]} · Agra, India</p>
    <h1>{t["h1_home"]}</h1>
    <p class="lead">{t["lead_home"]}</p>
    <div class="hero-actions">
      <a class="btn-primary" href="tel:{PHONE}" data-event="cta_click">{t["call"]} {PHONE_DISPLAY}</a>
      <a class="btn-outline btn-outline--light" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
      <a class="btn-outline btn-outline--light" href="{hub_path("packages", lang)}">{t["explore_tours"]}</a>
    </div>
  </div>
  <div class="hero-side">
    <span>{t["based"]}</span><strong>Agra, India</strong>
    <span>{t["experience"]}</span><strong>Discover → Book → Go</strong>
  </div>
  <form class="hero-widget" action="/book.html" method="get">
    <label class="field"><span>{t["pickup"]}</span>
      <select name="from">
        <option value="agra" selected>Agra (AGR)</option>
        <option value="delhi">Delhi (DEL)</option>
        <option value="jaipur">Jaipur (JAI)</option>
      </select>
    </label>
    <label class="field"><span>{t["drop"]}</span>
      <select name="to">
        <option value="delhi" selected>Delhi (DEL)</option>
        <option value="jaipur">Jaipur (JAI)</option>
        <option value="mathura">Mathura (MAT)</option>
        <option value="gwalior">Gwalior (GWL)</option>
        <option value="agra">Agra sightseeing</option>
      </select>
    </label>
    <label class="field"><span>{t["date"]}</span>
      <input type="date" name="date" required />
    </label>
    <button class="btn-primary" type="submit">{t["check_fare"]} <span>↗</span></button>
  </form>
</section>
<div class="section--paper-lt"><div class="container trust-bar">
  <span class="chip">Govt-registered fleet</span>
  <span class="chip">Verified drivers</span>
  <span class="chip">GST invoice</span>
  <span class="chip">4.9/5 · 380+ trips</span>
  <span class="chip">24×7 on-route support</span>
</div></div>
<section class="section section--paper">
  <div class="container">
    <div class="section-head"><div><p class="eyebrow">{t["popular_routes"]}</p><h2>{t["h2_routes"]}</h2></div>
    <a class="btn-text" href="{hub_path("routes", lang)}">{t["all_routes"]} <span>↗</span></a></div>
    <div class="grid-3">{"".join(cards)}</div>
  </div>
</section>
<section class="section section--paper-lt">
  <div class="container">
    <div class="section-head"><div><p class="eyebrow">{t["nav_services"]}</p><h2>{t["h2_services"]}</h2></div>
    <a class="btn-text" href="{hub_path("services", lang)}">{t["how_it_works"]} <span>↗</span></a></div>
    <div class="grid-3">
      <article class="service-card service-card--navy"><span class="service-index">01</span><div class="service-mark">✦</div><h3>{"Taxi <i>/ Cab</i>" if lang == "en" else "टैक्सी <i>/ कैब</i>"}</h3><p>{"Sedan, Ertiga and Innova Crysta for city rides and intercity drops." if lang == "en" else "शहर और इंटरसिटी के लिए सेडान, अर्टिगा और इनोवा क्रिस्टा।"}</p><a class="card-link" href="{hub_path("fleet", lang)}">{t["choose_car"]} ↗</a></article>
      <article class="service-card service-card--light"><span class="service-index">02</span><div class="service-mark">✦</div><h3>{"Tempo<br /><i>Traveller</i>" if lang == "en" else "टेम्पो<br /><i>ट्रैवलर</i>"}</h3><p>{"Comfortable group travel, from 12 seats to a premium Urbania." if lang == "en" else "12 सीट से प्रीमियम अर्बनिया तक — ग्रुप ट्रैवल आराम से।"}</p><a class="card-link" href="{vehicle_path(vehicle("tempo"), lang)}">{t["nav_fleet"]} ↗</a></article>
      <article class="service-card service-card--gold"><span class="service-index">03</span><div class="service-mark">✦</div><h3>{"Tour<br /><i>packages</i>" if lang == "en" else "टूर<br /><i>पैकेज</i>"}</h3><p>{"Local sightseeing, one-way drops and ready-made multi-day itineraries." if lang == "en" else "लोकल दर्शन, वन-वे ड्रॉप और तैयार मल्टी-डे यात्राएँ।"}</p><a class="card-link" href="{hub_path("packages", lang)}">{t["explore_tours"]} ↗</a></article>
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
<section class="section section--navy">
  <div class="container split">
    <div>
      <p class="eyebrow eyebrow--light">{pack["kicker"][lang]}</p>
      <h2>{pack["name"][lang]}</h2>
      <p class="lead">{pack["blurb"][lang]}</p>
      <p class="fare" style="color:var(--gold-light);margin:20px 0 24px">{inr(pack["price"])}</p>
      <div class="hero-actions">
        <a class="btn-primary" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
        <a class="btn-outline btn-outline--light" href="{package_path(pack, lang)}">{t["all_packages"]}</a>
      </div>
    </div>
    <figure class="package-photo" style="min-height:340px">
      <img src="{pack["image"]}" alt="Taj Mahal at dawn, Agra sightseeing taxi" width="900" height="560" loading="lazy" />
    </figure>
  </div>
</section>
<section class="section section--deep">
  <div class="container split">
    <div>
      <p class="eyebrow eyebrow--light">{t["nav_contact"]}</p>
      <h2>{t["h2_reach"]}</h2>
      <p class="lead">{t["lead_reach"]}</p>
      <div class="hero-actions" style="margin-top:28px">
        <a class="btn-primary" href="tel:{PHONE}">{t["call"]} {PHONE_DISPLAY}</a>
        <a class="btn-outline btn-outline--light" href="{hub_path("contact", lang)}">{t["nav_contact"]}</a>
      </div>
    </div>
    <div class="note" style="background:var(--navy-soft);color:var(--muted-lt)">
      <p class="eyebrow eyebrow--light">North star</p>
      <p style="color:var(--white);font-family:var(--display);font-size:24px;line-height:1.2;margin-top:8px">{t["north_star"]}</p>
    </div>
  </div>
</section>
"""


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
        rows.append(
            f'<tr data-href="/book.html?from={route["from"]}&amp;to={route["to"]}&amp;vehicle={v["id"]}" tabindex="0"><td><a href="{vehicle_path(v, lang)}">{v["name"][lang]}</a></td><td>{v["seats"]}+1</td><td><strong>{inr(route["fares"][v["id"]])}</strong></td><td>{inr(v["per_km"])}/km</td></tr>'
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
    return f"""
<section class="page-hero">
  <div class="container">
    {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["crumb_routes"], hub_path("routes", lang)), (h1, "")])}
    <h1>{h1},<br /><i>{fare_line}.</i></h1>
    <p class="lead">{route["intro"][lang]}</p>
    <p class="muted">{route["duration"]} · {route["km"]} km</p>
    <div class="hero-actions" style="margin-top:24px">
      <a class="btn-primary" href="tel:{PHONE}">{t["call"]} {PHONE_DISPLAY}</a>
      <a class="btn-outline" href="https://wa.me/{WHATSAPP}?text={origin['en']}%20to%20{dest['en']}%20taxi" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
      <a class="btn-text" href="{book}">{t["book_route"]} <span>↗</span></a>
    </div>
    <p class="note" style="margin-top:24px">{t["primary_lead"]}</p>
  </div>
</section>
<section class="section section--paper">
  <div class="container">
    <h2>{t["fare_table"]}</h2>
    <div class="table-wrap" style="margin-top:16px">
      <table class="data">
        <thead><tr><th>{t["vehicle"]}</th><th>{t["capacity"]}</th><th>{t["sample_fare"]}</th><th>{t["per_km"]}</th></tr></thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
    </div>
    <p class="muted" style="margin-top:14px">{t["round_note"]}</p>
  </div>
</section>
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
    <img src="{veh["image"]}" alt="{veh["name"]["en"]} hire in Agra" width="900" height="560" />
    <div>
      <p class="eyebrow">{veh["klass"][lang]}</p>
      <p class="spec-row">{veh["tags"]}</p>
      <p class="fare">{inr(veh["per_km"])}<small style="font-family:var(--mono);font-size:12px;color:var(--gold-text)"> / km</small></p>
      <p class="muted">{t["from_word"]} {inr(ROUTES[0]["fares"][veh["id"]])} Agra → Delhi</p>
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
  </div>
</section>
"""


def package_body(lang, pack):
    t = T[lang]
    places = "".join(f"<span>{p}</span><i>→</i>" for p in pack["places"][lang])
    includes = "".join(f"<li>{x}</li>" for x in pack["includes"][lang])
    return f"""
<section class="page-hero">
  <div class="container">
    {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["crumb_packages"], hub_path("packages", lang)), (pack["name"][lang], "")])}
    <h1>{pack["name"][lang]},<br /><i>{"from " + inr(pack["price"]) if lang == "en" else inr(pack["price"]) + " से"}.</i></h1>
    <p class="lead">{pack["blurb"][lang]}</p>
    <div class="hero-actions" style="margin-top:24px">
      <a class="btn-primary" href="tel:{PHONE}">{t["call"]}</a>
      <a class="btn-outline" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer">{t["whatsapp"]}</a>
      <a class="btn-text" href="/book.html?package={pack["id"]}">{t["book_package"]} <span>↗</span></a>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="container split">
    <img src="{pack["image"]}" alt="{pack["name"]["en"]} tour from Agra" width="900" height="560" />
    <div>
      <p class="eyebrow">{pack["kicker"][lang]} · {pack["duration"][lang]}</p>
      <div class="place-row">{places.removesuffix("<i>→</i>")}</div>
      <ul class="includes">{includes}</ul>
      <p class="note" style="margin-top:20px">{t["primary_lead"]}</p>
    </div>
  </div>
</section>
"""


def services_body(lang):
    t = T[lang]
    return f"""
<section class="page-hero"><div class="container">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (t["nav_services"], "")])}
  <h1>{t["h2_services"]}</h1>
  <p class="lead">{t["primary_lead"]}</p>
</div></section>
<section class="section section--paper"><div class="container grid-2">
  <article class="service-card service-card--navy"><span class="service-index">01</span><h3>{"Taxi <i>/ Cab</i>" if lang == "en" else "टैक्सी <i>/ कैब</i>"}</h3><p>{"Sedan, Ertiga, Innova Crysta." if lang == "en" else "सेडान, अर्टिगा, इनोवा क्रिस्टा।"}</p><a class="card-link" href="{hub_path("fleet", lang)}">{t["nav_fleet"]} ↗</a></article>
  <article class="service-card service-card--gold"><span class="service-index">02</span><h3>{"Tour <i>packages</i>" if lang == "en" else "टूर <i>पैकेज</i>"}</h3><p>{"Agra, Golden Triangle, Mathura." if lang == "en" else "आगरा, गोल्डन ट्रायंगल, मथुरा।"}</p><a class="card-link" href="{hub_path("packages", lang)}">{t["nav_packages"]} ↗</a></article>
  <article class="service-card service-card--light"><span class="service-index">03</span><h3>{"Tempo <i>Traveller</i>" if lang == "en" else "टेम्पो <i>ट्रैवलर</i>"}</h3><p>{"12–16 seat group travel." if lang == "en" else "12–16 सीट ग्रुप ट्रैवल।"}</p><a class="card-link" href="{vehicle_path(vehicle("tempo"), lang)}">Tempo Traveller ↗</a></article>
  <article class="service-card service-card--light"><span class="service-index">04</span><h3>{"Airport <i>transfer</i>" if lang == "en" else "एयरपोर्ट <i>ट्रांसफर</i>"}</h3><p>{"Delhi Airport, Agra Cantt, Gatimaan." if lang == "en" else "दिल्ली एयरपोर्ट, आगरा कैंट, गतिमान।"}</p><a class="card-link" href="{route_path(ROUTES[1], lang)}">{t["airport"]} ↗</a></article>
</div></section>
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
        cards.append(f"""
      <article class="vehicle-card" data-seats="{v["seats"]}">
        <a href="{vehicle_path(v, lang)}">
        <div class="vehicle-photo"><img src="{v["image"]}" alt="{v["name"]["en"]} hire in Agra" width="700" height="438" loading="lazy" /><span>{i:02d} / 05 <b>{v["name"]["en"].upper()}</b></span></div>
        <div class="vehicle-body">
          <h3>{v["name"][lang]}</h3>
          <p>{v["blurb"][lang]}</p>
          <div class="vehicle-cta"><span>{t["from_word"]} {inr(ROUTES[0]["fares"][v["id"]])}</span><span class="btn-text">{t["view_fares"]} <span>↗</span></span></div>
        </div></a>
      </article>""")
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
"""


def packages_hub_body(lang):
    t = T[lang]
    cards = []
    for p in PACKAGES:
        places = "".join(f"<span>{x}</span><i>→</i>" for x in p["places"][lang])
        cards.append(f"""
    <article class="package-card">
      <a href="{package_path(p, lang)}">
      <div class="package-photo"><img src="{p["image"]}" alt="{p["name"]["en"]}" width="900" height="560" loading="lazy" /><span class="kicker">{p["kicker"][lang]}</span></div>
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
  <h1>{t["h2_reach"]}</h1>
  <p class="lead">{t["primary_lead"]}</p>
</div></section>
<section class="section section--paper"><div class="container split">
  <div>
    <div class="contact-actions">
      <a class="contact-action" href="tel:{PHONE}"><span class="ico">☎</span><span><small>{t["call"]}</small><strong>{PHONE_DISPLAY}</strong></span><b>↗</b></a>
      <a class="contact-action" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noreferrer"><span class="ico">◌</span><span><small>{t["whatsapp"]}</small><strong>SK Baghel</strong></span><b>↗</b></a>
      <a class="contact-action" href="mailto:{EMAIL}"><span class="ico">✉</span><span><small>Email</small><strong>{EMAIL}</strong></span><b>↗</b></a>
      <a class="contact-action" href="https://maps.google.com/?q=Taj+Ganj+Agra" target="_blank" rel="noreferrer"><span class="ico">⌖</span><span><small>Maps</small><strong>Taj Ganj, Agra</strong></span><b>↗</b></a>
    </div>
    <form id="contact-form" class="calc-box" style="margin-top:28px;background:var(--paper-lt)">
      <div class="field" style="margin:12px 0"><span>Name</span><input name="name" required /></div>
      <div class="field" style="margin-bottom:12px"><span>Mobile</span><input name="phone" type="tel" required /></div>
      <div class="field" style="margin-bottom:16px"><span>Message</span><textarea name="message" required></textarea></div>
      <button class="btn-primary" type="submit">{t["enquire"]} <span>↗</span></button>
    </form>
  </div>
  <div class="map-panel"><div class="map-pin">SK</div>
    <div class="map-address"><strong>Near Taj East Gate Road</strong><p class="muted">Taj Ganj, Agra, Uttar Pradesh</p></div>
  </div>
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
  <img class="portrait" src="/assets/trust/driver.webp" alt="SK Baghel chauffeur in Agra" width="640" height="800" />
  <div>
    <h2>{t["north_star"]}</h2>
    <p class="lead">{t["primary_lead"]}</p>
    <p style="margin-top:28px"><a class="btn-primary" href="tel:{PHONE}">{t["call"]}</a></p>
  </div>
</div></section>
"""


FAQS = [
    ("How does the advance payment work?", "You pay a part of the fare after the car is confirmed — often by call or WhatsApp first. The rest is paid to the driver. This demo does not charge anyone.",
     "एडवांस भुगतान कैसे होता है?", "गाड़ी कन्फर्म होने के बाद किराये का एक हिस्सा — अक्सर पहले कॉल या व्हाट्सऐप पर। बाकी ड्राइवर को। यह डेमो चार्ज नहीं करता।"),
    ("Can I cancel?", "Free cancellation up to 12 hours before pickup. Inside 12 hours the advance is retained.",
     "क्या रद्द कर सकते हैं?", "पिकअप से 12 घंटे पहले तक मुफ्त रद्दीकरण। उसके बाद एडवांस रहता है।"),
    ("Is GST included?", "Sample fares are all-inclusive as currently quoted for Agra → Delhi. A GST invoice is issued on confirmed paid bookings.",
     "क्या जीएसटी शामिल है?", "आगरा → दिल्ली के नमूना किराये ऑल-इनक्लूसिव हैं। कन्फर्म भुगतान पर जीएसटी इनवॉइस।"),
    ("Do I need to show ID?", "Yes — a government photo ID for the lead passenger at pickup.",
     "क्या आईडी चाहिए?", "हाँ — पिकअप पर मुख्य यात्री की सरकारी फोटो आईडी।"),
    ("What about night driving?", "Pickups between 10:00 PM and 5:00 AM may include a night allowance, shown before you pay.",
     "रात की ड्राइविंग?", "रात 10 से सुबह 5 के बीच पिकअप पर नाइट अलाउंस, भुगतान से पहले दिखता है।"),
    ("How do I know the driver?", "After confirmation you receive driver name, vehicle number and a phone number.",
     "ड्राइवर कैसे पता चलेगा?", "कन्फर्मेशन के बाद ड्राइवर का नाम, गाड़ी नंबर और फोन मिलता है।"),
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
        title, body = t["title_privacy"], t["desc_privacy"]
    else:
        title, body = t["title_terms"], t["desc_terms"]
    return f"""
<section class="page-hero"><div class="container legal">
  {breadcrumb(lang, [(t["home"], hub_path("home", lang)), (title.split("|")[0].strip(), "")])}
  <h1>{title.split("|")[0].strip()}</h1>
  <p>{body}</p>
  <p>{PHONE_DISPLAY} · {EMAIL} · Taj Ganj, Agra.</p>
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
    <div class="stepper" role="tablist" aria-label="Booking steps">
      <button type="button" data-step="1" class="is-current"><i>1</i> Route</button>
      <button type="button" data-step="2"><i>2</i> Vehicle</button>
      <button type="button" data-step="3"><i>3</i> Details</button>
      <button type="button" data-step="4"><i>4</i> Advance</button>
      <button type="button" data-step="5"><i>5</i> Ticket</button>
    </div>
    <div class="panel is-active" data-step="1" id="step-1">
      <div class="note" id="package-banner" hidden></div>
      <div class="grid-2" style="margin-top:16px">
        <label class="field"><span>Pickup city</span>
          <select id="from">
            <option value="agra" selected>Agra (AGR)</option>
            <option value="delhi">Delhi (DEL)</option>
            <option value="jaipur">Jaipur (JAI)</option>
            <option value="mathura">Mathura (MAT)</option>
            <option value="gwalior">Gwalior (GWL)</option>
            <option value="lucknow">Lucknow (LKO)</option>
          </select>
        </label>
        <label class="field"><span>Drop city</span>
          <select id="to">
            <option value="delhi" selected>Delhi (DEL)</option>
            <option value="jaipur">Jaipur (JAI)</option>
            <option value="mathura">Mathura (MAT)</option>
            <option value="gwalior">Gwalior (GWL)</option>
            <option value="lucknow">Lucknow (LKO)</option>
            <option value="agra">Agra (AGR)</option>
          </select>
        </label>
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
        <label class="field"><span>Mobile number</span><input id="phone" type="tel" autocomplete="tel" /></label>
        <label class="field" style="grid-column:1/-1"><span>Pickup point</span><input id="pickupPoint" /></label>
        <label class="field" style="grid-column:1/-1"><span>Note to driver</span><textarea id="note"></textarea></label>
      </div>
      <div class="form-actions"><button class="btn-outline" type="button" data-back="2">Back</button>
        <button class="btn-primary" type="button" data-next="4">Review &amp; pay <span>↗</span></button></div>
    </div>
    <div class="panel" data-step="4">
      <p class="muted">Payment is secondary. Most guests call first. This button is a 900ms demo.</p>
      <form id="pay-form">
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
    path.write_text(redirect_html(target), encoding="utf-8")
    print("redirect", old_name, "→", target)


def write_sitemap():
    locs = []
    for path in SITEMAP_URLS:
        loc = SITE + ("" if path == "/" else path.rstrip("/") + "/")
        if path == "/":
            loc = SITE + "/"
        locs.append(f"  <url><loc>{loc}</loc></url>")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(locs) + "\n</urlset>\n"
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print("sitemap", len(locs), "urls")


def write_404():
    (ROOT / "404.html").write_text(
        f"""<!doctype html><html lang="en-IN"><head><meta charset="UTF-8"/><title>Page not found | SK Baghel</title>
<link rel="stylesheet" href="/css/tokens.css"/><link rel="stylesheet" href="/css/site.css"/></head>
<body><main class="page-hero"><div class="container"><h1>This page<br /><i>isn’t on the map.</i></h1>
<p class="lead">Try the home page, or call {PHONE_DISPLAY}.</p>
<p><a class="btn-primary" href="/">Home</a></p></div></main></body></html>""",
        encoding="utf-8",
    )


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
        jsonld=[org_schema(), {"@context": "https://schema.org", "@type": "WebSite", "name": "SK Baghel Town & Travels", "url": SITE, "inLanguage": t["html_lang"]}],
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
        extra_ld = [org_schema()]
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
                {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "name": title.split("—")[0].strip() if "—" in title else title.split("|")[0].strip(),
                    "provider": {"@id": f"{SITE}/#business"},
                    "areaServed": [origin["en"], dest["en"]],
                    "offers": {"@type": "Offer", "priceCurrency": "INR", "price": route["fares"]["sedan"]},
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
        write_page(
            lang=lang,
            path=package_path(pack, lang),
            alt_path=package_path(pack, other),
            title=title,
            description=pack["blurb"][lang],
            active="packages",
            body=package_body(lang, pack),
            jsonld=[org_schema()],
        )


def main():
    SITEMAP_URLS.clear()
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
        f"User-agent: *\nAllow: /\nDisallow: /book.html\nDisallow: /proposal/\nDisallow: /design-guide/\nSitemap: {SITE}/sitemap.xml\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
