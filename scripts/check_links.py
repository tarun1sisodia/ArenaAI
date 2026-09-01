#!/usr/bin/env python3
"""Link/asset checker: fail loudly if any page references a broken URL.

Crawls a set of seed pages on a base URL (default http://localhost:4173),
extracts every internal href/src/srcset/action target, requests each one,
and exits non-zero if anything doesn't return 200.

Run alongside scripts/serve.py:
    python3 scripts/serve.py &           # or serve separately
    python3 scripts/check_links.py
    python3 scripts/check_links.py --base http://localhost:4173/ArenaAI
"""
from __future__ import annotations

import argparse
import re
import sys
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_SCHEMES = ("http://", "https://", "tel:", "mailto:", "sms:", "javascript:")
_ATTR_RE = re.compile(r'\b(href|src|action)="([^"]*)"')
_SRCSET_RE = re.compile(r'\bsrcset="([^"]*)"')

# Representative seed set: every page *type* in both languages + app + redirects.
SEEDS = [
    "/",
    "/hi/",
    "/en/services/",
    "/en/routes/",
    "/en/packages/",
    "/en/fleet/",
    "/en/about/",
    "/en/contact/",
    "/en/faq/",
    "/en/privacy/",
    "/en/terms/",
    "/hi/services/",
    "/hi/routes/",
    "/hi/packages/",
    "/hi/fleet/",
    "/hi/about/",
    "/hi/contact/",
    "/hi/faq/",
    "/en/agra-to-delhi-taxi/",
    "/hi/agra-se-delhi-taxi/",
    "/en/vehicles/urbania/",
    "/hi/vehicles/tempo-traveller/",
    "/en/packages/golden-triangle/",
    "/hi/packages/mathura-vrindavan/",
    "/book.html",
    "/about.html",      # redirect stub
    "/en/index.html",   # redirect stub
    "/404.html",
    "/robots.txt",
    "/sitemap.xml",
]


class AssetCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.internal: set[str] = set()
        self.links: set[str] = set()
        self.refresh: set[str] = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            content = attrs.get("content", "")
            if "url=" in content:
                self.refresh.add(content.split("url=", 1)[1].strip())
        for attr, value in attrs.items():
            if not value or attr in ("srcset",):
                continue
            if attr in ("href", "src", "action", "data-href"):
                self._add(value)
        if "srcset" in attrs:
            for item in attrs["srcset"].split(","):
                item = item.strip()
                if item:
                    self._add(item.partition(" ")[0])

    def _add(self, url: str):
        if not url or url.startswith("#") or url.startswith(SKIP_SCHEMES):
            return
        if url.startswith("//"):
            return
        self.internal.add(url)


class Walker:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.checked: dict[str, int] = {}
        self.pages_seen: set[str] = set()
        self.queue: list[str] = list(SEEDS)

    def fetch(self, url: str) -> tuple[int, bytes]:
        req = urllib.request.Request(url, headers={"User-Agent": "skb-linkcheck/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                return res.status, res.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read() or b""
        except urllib.error.URLError as e:
            return 0, str(e).encode()

    def resolve(self, from_url: str, target: str) -> str:
        target = target.split("#", 1)[0]
        if not target:
            return ""
        # urljoin mirrors browser behaviour: the last path segment of a file
        # page (book.html, 404.html, …) is replaced; directory URLs resolve
        # against themselves.
        return urllib.parse.urljoin(from_url, target)

    def run(self) -> int:
        failures: list[tuple[str, str, int]] = []
        while self.queue:
            path = self.queue.pop(0)
            page_url = self.base + ("" if path.startswith("/") else "/") + path
            if page_url in self.pages_seen:
                continue
            self.pages_seen.add(page_url)
            status, body = self.fetch(page_url)
            self.checked[page_url] = status
            if status != 200:
                failures.append((path, page_url, status))
                continue
            if not page_url.endswith((".html", "/")):
                continue  # asset: existence is enough
            collector = AssetCollector()
            try:
                collector.feed(body.decode("utf-8", errors="replace"))
            except Exception:
                continue
            for target in sorted(collector.internal | collector.refresh):
                asset_url = self.resolve(page_url, target)
                if not asset_url or asset_url in self.checked and self.checked[asset_url] == 200:
                    continue
                # Crawl internal HTML pages too (one level deep is enough —
                # all pages share the same chrome/assets).
                if re.search(r"/$|\.html$", urllib.parse.urlsplit(asset_url).path):
                    if asset_url not in self.pages_seen:
                        self.queue.append(urllib.parse.urlsplit(asset_url).path[self.base_path_len():] or "/")
                    continue
                status, _ = self.fetch(asset_url)
                self.checked[asset_url] = status
                if status != 200:
                    failures.append((target, asset_url, status))
        return self.report(failures)

    def base_path_len(self) -> int:
        return len(urllib.parse.urlsplit(self.base).path.rstrip("/"))

    def report(self, failures: list[tuple[str, str, int]]) -> int:
        ok = sum(1 for s in self.checked.values() if s == 200)
        print(f"\nChecked {len(self.checked)} URLs ({ok} OK, {len(failures)} failed)")
        for target, url, status in failures:
            print(f"  FAIL {status}  {url}   (referenced as {target!r})")
        return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:4173")
    args = ap.parse_args()
    print(f"Crawling {args.base} …")
    return Walker(args.base).run()


if __name__ == "__main__":
    sys.exit(main())
