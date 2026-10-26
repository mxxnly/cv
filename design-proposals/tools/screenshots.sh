#!/usr/bin/env bash
# Renders every mockup (3 designs × 3 pages × 2 themes × desktop/mobile/full) plus the logo sheet
# with headless Google Chrome into design-proposals/screenshots/.
# Mobile: headless Chrome refuses windows narrower than ~500 px, so the page is loaded inside a
# 390 px iframe in a small wrapper page ("phone frame") and the wrapper is captured instead.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=screenshots
TMP="$(mktemp -d)"
mkdir -p "$OUT"
trap 'rm -rf "$TMP"' EXIT

shot() { # shot <url> <WxH> <file>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$2" --screenshot="$OUT/$3" "$1" >/dev/null 2>&1
  printf '  %s\n' "$3"
}

mobile() { # mobile <url> <file>  → 430×884 PNG: 390×844 iframe with a 20 px frame
  local wrapper="$TMP/$2.html"
  cat > "$wrapper" <<HTML
<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#2a2b2e}iframe{display:block;width:390px;height:844px;border:0;margin:20px;border-radius:14px;background:#fff}</style>
<iframe src="$1"></iframe>
HTML
  shot "file://$wrapper" 430,884 "$2"
}

for design in 01-ledger 02-workshop 03-soft 04-soft-violet; do
  for page in home catalog product; do
    for theme in light dark; do
      url="file://$PWD/designs/$design/$page.html?theme=$theme"
      shot   "$url" 1440,900  "$design-$page-$theme-desktop.png"
      shot   "$url" 1440,2600 "$design-$page-$theme-desktop-full.png"
      mobile "$url"           "$design-$page-$theme-mobile.png"
    done
  done
done
shot "file://$PWD/logos/sheet.html?theme=light" 1400,440 "logos-light.png"
shot "file://$PWD/logos/sheet.html?theme=dark"  1400,440 "logos-dark.png"
echo "done → $OUT/"
