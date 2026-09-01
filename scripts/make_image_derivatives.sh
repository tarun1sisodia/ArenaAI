#!/usr/bin/env bash
# Image pipeline: 480w/768w WebP derivatives for the photography assets
# (audit #3 / #13, LAUNCH_CHECKLIST.md §4). Re-run after replacing any base
# asset, then rebuild pages: python3 scripts/render_pages.py
# Requires ImageMagick (`convert`) with WebP delegate support.
set -euo pipefail
cd "$(dirname "$0")/.."

ASSETS=(
  assets/fleet/sedan.webp
  assets/fleet/ertiga.webp
  assets/fleet/innova.webp
  assets/fleet/tempo.webp
  assets/fleet/urbania.webp
  assets/packages/agra-fort.webp
  assets/packages/golden-triangle.webp
  assets/packages/mathura.webp
  assets/packages/taj-dawn.webp
  assets/trust/driver.webp
)

for src in "${ASSETS[@]}"; do
  [ -f "$src" ] || { echo "missing: $src" >&2; exit 1; }
  base="${src%.webp}"
  convert "$src" -resize 480x -quality 82 -define webp:method=6 "${base}-480.webp"
  convert "$src" -resize 768x -quality 82 -define webp:method=6 "${base}-768.webp"
  echo "derivatives: ${base}-{480,768}.webp"
done
