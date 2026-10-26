#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=../../../frontend/public
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size="$2" --screenshot="$OUT/$3" "file://$PWD/$1" >/dev/null 2>&1; echo "  $3"; }
shot icon-512.html 512,512 icon-512.png
shot icon-192.html 192,192 icon-192.png
shot icon-32.html 32,32 icon-32.png
shot apple-touch-icon.html 180,180 apple-touch-icon.png
shot og-image.html 1200,630 og-image.png
