#!/usr/bin/env python3
"""Local preview server for the SK Baghel static site.

 Serves the repo root and additionally maps the GitHub Pages project subpath
 (/ArenaAI/…) onto the same files, so the production hosting layout can be
 previewed locally too. Pages use page-relative URLs, so the same HTML works
 under both prefixes.

Usage:
    python3 scripts/serve.py [port]        # default 4173, binds 0.0.0.0
"""
from __future__ import annotations

import http.server
import posixpath
import sys
import urllib.parse

ROOT = None  # set in main()
PAGES_SUBPATH = "/ArenaAI"


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        # Emulate the GitHub Pages project site locally: /ArenaAI/x -> /x
        parsed = urllib.parse.urlsplit(path)
        clean = posixpath.normpath(urllib.parse.unquote(parsed.path))
        if clean == PAGES_SUBPATH or clean.startswith(PAGES_SUBPATH + "/"):
            clean = clean[len(PAGES_SUBPATH):] or "/"
        return super().translate_path(clean)

    def end_headers(self):
        # Dev preview: never let the browser cache stale generated HTML/CSS.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            try:
                body = (self.server.root / "404.html").read_bytes()
            except OSError:
                body = b"404 not found"
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def main():
    from pathlib import Path

    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    root = Path(__file__).resolve().parents[1]
    import functools

    handler = functools.partial(Handler, directory=str(root))
    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), handler)
    server.root = root
    print(f"Serving {root} at http://0.0.0.0:{port}/")
    print(f"GitHub Pages layout preview: http://0.0.0.0:{port}{PAGES_SUBPATH}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
