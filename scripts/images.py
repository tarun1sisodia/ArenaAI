#!/usr/bin/env python3
"""Asset pipeline: intrinsic WebP dimensions + responsive derivatives.

`webp_size()` reads width/height straight from the WebP bitstream (pure
Python, no PIL/ImageMagick needed) so the SSG can emit *truthful* width and
height attributes even after real photography replaces the demo assets —
wrong dims cost CLS, which is a ranking signal.

`ensure_derivatives()` regenerates the `-480`/`-768` (and hero `-sm`)
renditions when a base asset is newer than its derivatives, using
ImageMagick when available; without it the build just falls back to serving
the full-size asset (resp_img emits no srcset) and prints a warning.

Drop-in workflow for real photos: overwrite the file at the SAME path
(e.g. assets/fleet/sedan.webp), then `python3 scripts/render_pages.py` —
derivatives and every img tag's dims update automatically.
"""
from __future__ import annotations

import shutil
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# (base asset, [(suffix, width), ...]) — suffix "" width >0 renders -{w}.webp;
# a named suffix like "sm" renders -sm.webp (used by the hero's mobile crop).
SOURCES: list[tuple[str, list[tuple[str, int]]]] = [
    ("assets/fleet/sedan.webp", [("480", 480), ("768", 768)]),
    ("assets/fleet/ertiga.webp", [("480", 480), ("768", 768)]),
    ("assets/fleet/innova.webp", [("480", 480), ("768", 768)]),
    ("assets/fleet/tempo.webp", [("480", 480), ("768", 768)]),
    ("assets/fleet/urbania.webp", [("480", 480), ("768", 768)]),
    ("assets/packages/agra-fort.webp", [("480", 480), ("768", 768)]),
    ("assets/packages/golden-triangle.webp", [("480", 480), ("768", 768)]),
    ("assets/packages/mathura.webp", [("480", 480), ("768", 768)]),
    ("assets/packages/taj-dawn.webp", [("480", 480), ("768", 768)]),
    ("assets/trust/driver.webp", [("480", 480), ("768", 768)]),
    ("assets/hero/hero-highway.webp", [("sm", 960)]),
]


def webp_size(path: Path) -> tuple[int, int] | None:
    """Return (width, height) of a WebP file from its bitstream, or None.

    Handles the three WebP container layouts (spec: RFC 6386 VP8 keyframe
    header, VP8L 14-bit fields, VP8X 24-bit canvas size).
    """
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if len(data) < 30 or data[0:4] != b"RIFF" or data[8:12] != b"WEBP":
        return None
    pos = 12
    while pos + 8 <= len(data):
        fourcc = data[pos : pos + 4]
        size = struct.unpack_from("<I", data, pos + 4)[0]
        payload = pos + 8
        if fourcc == b"VP8X" and payload + 10 <= len(data):
            w = int.from_bytes(data[payload + 4 : payload + 7], "little") + 1
            h = int.from_bytes(data[payload + 7 : payload + 10], "little") + 1
            return w, h
        if fourcc == b"VP8L" and payload + 5 <= len(data) and data[payload] == 0x2F:
            bits = int.from_bytes(data[payload + 1 : payload + 5], "little")
            w = (bits & 0x3FFF) + 1
            h = ((bits >> 14) & 0x3FFF) + 1
            return w, h
        if fourcc == b"VP8 " and payload + 10 <= len(data):
            # 3-byte frame tag, 3-byte start code (0x9d 0x01 0x2a), then
            # 16-bit LE width/height with a 2-bit scale in the top bits.
            if data[payload + 3 : payload + 6] == b"\x9d\x01\x2a":
                w = struct.unpack_from("<H", data, payload + 6)[0] & 0x3FFF
                h = struct.unpack_from("<H", data, payload + 8)[0] & 0x3FFF
                return w, h
        pos = payload + size + (size & 1)  # chunks are 2-byte aligned
    return None


def ensure_derivatives(root: Path = ROOT, *, log=print, force: bool = False) -> int:
    """Regenerate missing/stale derivatives. Returns number generated."""
    magick = shutil.which("magick") or shutil.which("convert")
    made = 0
    pending: list[tuple[Path, list[tuple[str, int]]]] = []
    for rel, specs in SOURCES:
        src = root / rel
        if not src.exists():
            log(f"images: SKIP missing base asset {rel}")
            continue
        stale = [s for s in specs if force or _stale(src, src.with_name(f"{src.stem}-{s[0]}.webp"))]
        if stale:
            pending.append((src, stale))
    if pending and not magick:
        names = ", ".join(p.name for p, _ in pending)
        log(f"images: ImageMagick not found — {len(pending)} asset(s) keep full-size "
            f"fallback ({names}). Install ImageMagick or run "
            f"scripts/make_image_derivatives.sh on a machine that has it.")
        return 0
    for src, stale in pending:
        for suffix, width in stale:
            out = src.with_name(f"{src.stem}-{suffix}.webp")
            # Works for both CLI generations: `convert in args out` (IM6)
            # and `magick in args out` (IM7's unified binary).
            cmd = [magick, str(src), "-resize", f"{width}x", "-quality", "82",
                   "-define", "webp:method=6", str(out)]
            subprocess.run(cmd, check=True)
            made += 1
            log(f"images: wrote {out.relative_to(root)} ({width}w)")
    return made


def _stale(src: Path, out: Path) -> bool:
    return not out.exists() or out.stat().st_mtime < src.stat().st_mtime


if __name__ == "__main__":
    force = "--force" in sys.argv
    n = ensure_derivatives(force=force)
    print(f"images: regenerated {n} derivative(s)" if n else "images: all derivatives up to date")
    # Self-check: print measured dims (build sanity / manual QA)
    for rel, _ in SOURCES:
        dims = webp_size(ROOT / rel)
        print(f"  {rel}: {dims[0]}x{dims[1]}" if dims else f"  {rel}: UNREADABLE")
