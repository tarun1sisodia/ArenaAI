#!/usr/bin/env bash
# Image pipeline: regenerates 480w/768w (and hero -sm) WebP derivatives.
# Thin wrapper around scripts/images.py — the SSG (render_pages.py) already
# runs this automatically when a base asset changes; use --force to redo all:
#   ./scripts/make_image_derivatives.sh --force
set -euo pipefail
cd "$(dirname "$0")/.."
exec python3 scripts/images.py "$@"
