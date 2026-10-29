#!/usr/bin/env python3
"""Round 2: five new MXXNLY Labs logo directions (SVG, no font dependencies).

Reuses the stroke alphabet from design-proposals/tools/make_logos.py. Run from anywhere:

    python3 design-proposals/round-2/tools/make_logos.py
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "tools"))
import make_logos as base  # noqa: E402

OUT = HERE.parent / "logos"
word, svg, write = base.word, base.svg, base.write
UPPER, LOWER = base.UPPER, base.LOWER


def stroke(ink, sw, cap="round", join="round"):
    return f'fill="none" stroke="{ink}" stroke-width="{sw:g}" stroke-linecap="{cap}" stroke-linejoin="{join}"'


def build_variants(builder, light, dark):
    """builder(ink, paper, accent, accent2) -> (lockup, mark, favicon)."""
    return builder(*light), builder(*dark)


# ================================================================ 01 · RISO (two-colour overprint)
def riso(ink, paper, pink, blue, blend="multiply"):
    X = "M0 0L7 10M7 0L0 10"
    bl = f'style="mix-blend-mode:{blend}"'

    def xx(x, y, s, sw, dx=1.6, dy=1.2):
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})" fill="none" stroke-width="{sw:g}" stroke-linecap="butt">'
            f'<path d="{X}" stroke="{pink}" {bl}/>'
            f'<path d="{X}" transform="translate({dx} {dy})" stroke="{blue}" {bl}/></g>'
        )

    def mark(x, y, s=1.0):
        return f'<g transform="translate({x:g} {y:g}) scale({s:g})"><g transform="translate(3 3) scale(1.45)">{xx(0, 0, 1, 2.6, 2.2, 1.6)}</g></g>'

    st = stroke(ink, 2.3, "butt", "miter")
    gap = 3.4
    m, mw = word("M", UPPER, 24, 5, 0)
    x1 = 24 + mw + gap
    x2 = x1 + 7 + 1.6 + gap
    nx = x2 + 7 + 1.6 + gap
    nly, nw = word("NLY", UPPER, nx, 5, gap)
    lab, lw = word("LABS", UPPER, nx + nw + 6, 5 + 10 - 6.2, gap, 0.62)
    body = (
        mark(0, 0)
        + f'<g {st}>{m}</g>'
        + xx(x1, 5, 1, 2.3)
        + xx(x2, 5, 1, 2.3)
        + f'<g {st}>{nly}</g>'
        + f'<g {stroke(ink, 3.0, "butt", "miter")}>{lab}</g>'
    )
    fav = svg(64, 64, f'<rect width="64" height="64" fill="{paper}"/>' + mark(4, 4, 2.9))
    return svg(nx + nw + 6 + lw + 1, 20, body), svg(20, 20, mark(0, 0)), fav


# ================================================================ 02 · DRAFT (blueprint)
def draft(ink, paper, accent, accent2):
    def mark(x, y, s=1.0):
        t = stroke(ink, 0.8, "butt", "miter")
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})">'
            f'<circle cx="10" cy="10" r="8" fill="none" stroke="{ink}" stroke-width="0.8"/>'
            f'<g {t}><path d="M0 10H20M10 0V20" stroke-dasharray="1.2 1.2" opacity=".55"/>'
            f'<path d="M5.5 5.5L10 14.5M10 5.5L5.5 14.5M10 5.5L14.5 14.5M14.5 5.5L10 14.5" stroke-width="1.5"/></g>'
            f'<circle cx="10" cy="10" r="1.3" fill="{accent}"/>'
            f'<g {stroke(accent, 0.8, "butt", "miter")}><path d="M0 1V-1M20 1V-1M0 0H20" transform="translate(0 21)"/></g>'
            "</g>"
        )

    thin = stroke(ink, 1.15, "butt", "miter")
    w, ww = word("MXXNLY", UPPER, 28, 4, 3.2, 0.9)
    lab, lw = word("LABS", UPPER, 28 + ww + 5, 4, 3.2, 0.9)
    y = 21
    body = (
        mark(0, 0)
        + f'<g {thin}>{w}</g>'
        + f'<g {stroke(accent, 1.15, "butt", "miter")}>{lab}</g>'
        + f'<g {stroke(ink, 0.6, "butt", "miter")} opacity=".7"><path d="M28 {y}H{28 + ww + 5 + lw:g}M28 {y - 1.2}V{y + 1.2}M{28 + ww + 5 + lw:g} {y - 1.2}V{y + 1.2}"/></g>'
    )
    fav = svg(64, 64, f'<rect width="64" height="64" fill="{paper}"/>'
              f'<circle cx="32" cy="32" r="24" fill="none" stroke="{ink}" stroke-width="2.4"/>'
              f'<g {stroke(ink, 4.4, "butt", "miter")}><path d="M19 19L32 45M32 19L19 45M32 19L45 45M45 19L32 45"/></g>'
              f'<circle cx="32" cy="32" r="3.4" fill="{accent}"/>')
    return svg(28 + ww + 5 + lw + 1, 24, body), svg(20, 24, mark(0, 0)), fav


# ================================================================ 03 · PHASE (lunar almanac)
def phase(ink, paper, accent, _unused):
    mid = "m" + ink.strip("#") + accent.strip("#")

    def mark(x, y, s=1.0):
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})">'
            f'<defs><mask id="{mid}"><rect width="20" height="20" fill="#fff"/><circle cx="14.2" cy="8.2" r="7.6" fill="#000"/></mask></defs>'
            f'<circle cx="9.6" cy="10.4" r="8.6" fill="{ink}" mask="url(#{mid})"/>'
            f'<g {stroke(accent, 1.7, "butt", "miter")}><path d="M13.2 4.6L17.6 9.6M17.6 4.6L13.2 9.6"/></g></g>'
        )

    w, ww = word("MXXNLY", UPPER, 25, 5, 3.0)
    lab, lw = word("LABS", UPPER, 25 + ww + 7, 5, 3.0)
    body = mark(0, 0) + f'<g {stroke(ink, 1.5, "butt", "miter")}>{w}</g>' + f'<g {stroke(accent, 1.5, "butt", "miter")}>{lab}</g>'
    fav = svg(64, 64, f'<rect width="64" height="64" rx="32" fill="{paper}"/>' + mark(10, 10, 2.2))
    return svg(25 + ww + 7 + lw + 1, 20, body), svg(20, 20, mark(0, 0)), fav


# ================================================================ 04 · KLEIN (ultramarine poster)
def klein(ink, paper, accent, _unused):
    def mark(x, y, s=1.0):
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})"><rect width="20" height="20" fill="{ink}"/>'
            f'<g {stroke(paper, 3.0, "butt", "miter")}><path d="M3 4.5L8.6 15.5M8.6 4.5L3 15.5"/></g>'
            f'<g {stroke(paper, 1.1, "butt", "miter")}><path d="M11.4 4.5L17 15.5M17 4.5L11.4 15.5"/></g></g>'
        )

    w, ww = word("MXXNLY", UPPER, 25, 5, 3.4)
    lab, lw = word("LABS", UPPER, 25 + ww + 6, 5, 3.4)
    body = mark(0, 0) + f'<g {stroke(ink, 2.5, "butt", "miter")}>{w}</g>' + f'<g {stroke(ink, 1.0, "butt", "miter")}>{lab}</g>'
    fav = svg(64, 64, f'<rect width="64" height="64" fill="{ink}"/>'
              f'<g {stroke(paper, 9, "butt", "miter")}><path d="M9 16L26 48M26 16L9 48"/></g>'
              f'<g {stroke(paper, 3, "butt", "miter")}><path d="M38 16L55 48M55 16L38 48"/></g>')
    return svg(25 + ww + 6 + lw + 1, 20, body), svg(20, 20, mark(0, 0)), fav


# ================================================================ 05 · BITMAP (1-bit pixel)
PIX = {
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
    "L": ["10000"] * 6 + ["11111"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
}
PX5 = ["10001", "01010", "00100", "01010", "10001"]


def pix(rows, x, y, u, fill):
    r = "".join(
        f'<rect x="{x + c * u:g}" y="{y + i * u:g}" width="{u:g}" height="{u:g}"/>'
        for i, row in enumerate(rows) for c, ch in enumerate(row) if ch == "1"
    )
    return f'<g fill="{fill}" shape-rendering="crispEdges">{r}</g>'


def bitmap(ink, paper, accent, _unused):
    both = [a + "0" + a for a in PX5]

    def mark(x, y, s=1.0):
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})">{pix(both, 1, 4, 1.6, ink)}'
            f'<rect x="1" y="14" width="3.2" height="1.6" fill="{accent}"/></g>'
        )

    u = 1.5
    body, cx = [mark(0, 0)], 24.0
    for ch in "MXXNLY":
        body.append(pix(PIX[ch], cx, 4.75, u, ink))
        cx += 5 * u + u
    cx += u * 1.5
    for ch in "LABS":
        body.append(pix(PIX[ch], cx, 4.75, u, accent))
        cx += 5 * u + u
    fav = svg(64, 64, f'<rect width="64" height="64" fill="{paper}"/>' + pix(both, 4, 16, 5, ink)
              + f'<rect x="4" y="46" width="15" height="5" fill="{accent}"/>')
    return svg(cx + 1, 20, "".join(body)), svg(20, 20, mark(0, 0)), fav


# folder: (builder, light=(a, b, c, d), dark=(a, b, c, d))
DIRECTIONS = {
    "01-riso": (riso, ("#1B1D4A", "#ECEDF3", "#FF4FA0", "#2F45E0"), ("#ECEDF3", "#14153A", "#FF6EB2", "#6C7BFF")),
    "02-draft": (draft, ("#12308F", "#EEF3FF", "#E8590C", "#E8590C"), ("#DCE8FF", "#0B1E5B", "#FFC53D", "#FFC53D")),
    "03-phase": (phase, ("#16233E", "#E3E8EF", "#E39A00", ""), ("#E3E8EF", "#101A30", "#F6BC45", "")),
    "04-klein": (klein, ("#1B2CF0", "#F4F4F2", "#1B2CF0", ""), ("#FFFFFF", "#1B2CF0", "#FFFFFF", "")),
    "05-bitmap": (bitmap, ("#111111", "#F5F5F5", "#0A6CFF", ""), ("#F5F5F5", "#111111", "#4DA3FF", "")),
}


def main():
    for folder, (builder, light, dark) in DIRECTIONS.items():
        out = OUT / folder
        lockup, mark, fav = builder(*light)
        write(out / "logo-on-light.svg", lockup)
        write(out / "mark-on-light.svg", mark)
        write(out / "favicon.svg", fav)
        kw = {"blend": "screen"} if builder is riso else {}
        lockup, mark, fav = builder(*dark, **kw)
        write(out / "logo-on-dark.svg", lockup)
        write(out / "mark-on-dark.svg", mark)
        write(out / "favicon-dark.svg", fav)
        print("wrote", out)


if __name__ == "__main__":
    main()
