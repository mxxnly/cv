#!/usr/bin/env python3
"""Generates the three MXXNLY LABS logo directions as SVG files.

Every letter is drawn from strokes on a 7×10 grid (uppercase) or a 7-unit x-height grid
(lowercase), so the logos do not depend on any installed font. Run from anywhere:

    python3 design-proposals/tools/make_logos.py
"""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "logos"

# ---------------------------------------------------------------- uppercase alphabet (7×10)
# Each letter: (advance width, list of path "d" strings in local coordinates, y down).
UPPER = {
    "M": (7, ["M0 10V0L3.5 6L7 0V10"]),
    "X": (7, ["M0 0L7 10", "M7 0L0 10"]),
    "N": (7, ["M0 10V0L7 10V0"]),
    "L": (5.2, ["M0 0V10H6"]),  # advance < width: the foot tucks under the next letter
    "Y": (7, ["M0 0L3.5 5L7 0", "M3.5 5V10"]),
    "A": (7, ["M0 10L3.5 0L7 10", "M1.4 6H5.6"]),
    "B": (6.5, ["M0 10V0H3.8A2.5 2.5 0 0 1 3.8 5H0", "M3.8 5H4A2.5 2.5 0 0 1 4 10H0"]),
    "S": (7, ["M6.5 2.5A2.5 2.5 0 0 0 4 0H3A2.5 2.5 0 0 0 3 5H4A2.5 2.5 0 0 1 4 10H3A2.5 2.5 0 0 1 0.5 7.5"]),
}

# ---------------------------------------------------------------- lowercase alphabet
# Baseline y=10, x-height top y=3, ascender y=0, descender y=13.
LOWER = {
    "m": (8, ["M0 10V3", "M0 5.5A2.5 2.5 0 0 1 4 4.6", "M4 10V5", "M4 5.5A2.5 2.5 0 0 1 8 4.6", "M8 10V5"]),
    "x": (6, ["M0 3L6 10", "M6 3L0 10"]),
    "n": (5, ["M0 10V3", "M0 5.5A2.5 2.5 0 0 1 5 5.5V10"]),
    # The l has a foot so it can never be read as a capital I or a 1.
    "l": (3.2, ["M0 0V8A2 2 0 0 0 2 10H3.2"]),
    "y": (6, ["M0 3L3 10", "M6 3L1.7 13"]),
    "a": (7, ["M7 3V10", "M7 6.5A3.5 3.5 0 1 0 0 6.5A3.5 3.5 0 1 0 7 6.5"]),
    "b": (7, ["M0 0V10", "M0 6.5A3.5 3.5 0 1 0 7 6.5A3.5 3.5 0 1 0 0 6.5"]),
    "s": (5.2, ["M4.9 4.75A1.75 1.75 0 0 0 3.15 3H2.45A1.75 1.75 0 0 0 2.45 6.5H3.15A1.75 1.75 0 0 1 3.15 10H2.45A1.75 1.75 0 0 1 0.7 8.25"]),
}


def word(text: str, alphabet: dict, x: float, y: float, gap: float, scale: float = 1) -> tuple[str, float]:
    """Returns (<g> markup, total width) for a word laid out on one baseline."""
    parts, cursor = [], 0.0
    for ch in text:
        if ch == " ":
            cursor += gap * 2.2
            continue
        adv, paths = alphabet[ch]
        d = " ".join(paths)
        parts.append(f'<path transform="translate({cursor:g} 0)" d="{d}"/>')
        cursor += adv + gap
    width = cursor - gap
    g = f'<g transform="translate({x:g} {y:g}) scale({scale:g})">{"".join(parts)}</g>'
    return g, width * scale


def svg(width, height, body, extra_attrs=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" '
        f'width="{width:g}" height="{height:g}" role="img" aria-label="MXXNLY Labs"{extra_attrs}>\n'
        f"{body}\n</svg>\n"
    )


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


# ================================================================ 01 · LATTICE
def lattice(ink: str, paper: str, accent: str):
    """Two X's share their inner diagonals; the overlap forms a diamond that carries the accent."""
    sw = 1.5
    stroke = f'fill="none" stroke="{ink}" stroke-width="{sw}" stroke-linecap="square" stroke-linejoin="miter"'

    def mark(x, y, s=1.0):
        # X1: (0,0)-(7,10) & (7,0)-(0,10); X2 shifted by 5. Diamond vertices from the intersections.
        diamond = "M6 1.43L8.5 5L6 8.57L3.5 5Z"
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})">'
            f'<path d="{diamond}" fill="{accent}"/>'
            f'<g {stroke}><path d="M0 0L7 10M7 0L0 10M5 0L12 10M12 0L5 10"/></g>'
            "</g>"
        )

    # Lockup: mark + MXXNLY (with the XX drawn as the shared-diagonal pair) + LABS spaced out.
    body = [mark(2, 3)]
    # M, then the merged XX, then NLY
    m, mw = word("M", UPPER, 20, 3, 0)
    body.append(f'<g {stroke}>{m}</g>')
    xx_x = 20 + mw + 2.2
    body.append(
        f'<g transform="translate({xx_x:g} 3)" {stroke}><path d="M0 0L7 10M7 0L0 10M5 0L12 10M12 0L5 10"/></g>'
    )
    nly_x = xx_x + 12 + 2.2
    nly, nw = word("NLY", UPPER, nly_x, 3, 2.2)
    body.append(f'<g {stroke}>{nly}</g>')
    # LABS is smaller and sits on the same baseline (y shifted by 10 - 10*0.62).
    labs, lw = word("LABS", UPPER, nly_x + nw + 5, 6.8, 3.2, 0.62)
    small = stroke.replace(f'stroke-width="{sw}"', f'stroke-width="{sw / 0.62 * 0.78:.2f}"')
    body.append(f'<g {small}>{labs}</g>')
    total_w = nly_x + nw + 5 + lw + 2
    lockup = svg(total_w, 16, "".join(body))

    # Mark only (square canvas with padding)
    mark_svg = svg(16, 16, mark(2, 3))
    # Favicon: paper square, mark centred, bolder strokes for small sizes.
    fav = svg(
        64,
        64,
        f'<rect width="64" height="64" rx="12" fill="{paper}"/>'
        + mark(8, 12, 4).replace(f'stroke-width="{sw}"', 'stroke-width="1.1"'),
    )
    return lockup, mark_svg, fav


# ================================================================ 02 · STITCH
def stitch(ink: str, paper: str, accent: str):
    """Rounded, lowercase, friendly. The two x's touch and form a continuous zig-zag stitch."""
    sw = 1.9
    stroke = f'fill="none" stroke="{ink}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"'

    def mark(x, y, s=1.0, ring=True):
        r = 9.5
        ring_svg = f'<circle cx="9.5" cy="9.5" r="{r - sw / 2:g}" fill="none" stroke="{ink}" stroke-width="{sw}"/>' if ring else ""
        # Two x's of width 5.2, touching at the centre; the second one is lifted by the accent dot.
        xx = (
            '<path d="M4 6.2L9.2 12.8M9.2 6.2L4 12.8"/>'
            '<path d="M9.8 6.2L15 12.8M15 6.2L9.8 12.8"/>'
        )
        dot = f'<circle cx="9.5" cy="9.5" r="1.25" fill="{accent}"/>'
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})">{ring_svg}'
            f'<g {stroke}>{xx}</g>{dot}</g>'
        )

    # Wordmark "mxxnly" lowercase; "labs" smaller after a dot.
    body = [mark(0, 0)]
    w1, w1w = word("mxxnly", LOWER, 24, 3, 1.9)
    body.append(f'<g {stroke}>{w1}</g>')
    dot_x = 24 + w1w + 3.2
    body.append(f'<circle cx="{dot_x:g}" cy="12" r="1.1" fill="{accent}"/>')
    w2, w2w = word("labs", LOWER, dot_x + 3.4, 3, 1.9)
    body.append(f'<g {stroke}>{w2}</g>')
    total_w = dot_x + 3.4 + w2w + 1
    lockup = svg(total_w, 19, "".join(body))
    mark_svg = svg(19, 19, mark(0, 0))
    fav = svg(
        64,
        64,
        f'<circle cx="32" cy="32" r="32" fill="{paper}"/>'
        + mark(5, 5, 54 / 19, ring=False).replace(f'stroke-width="{sw}"', 'stroke-width="1.7"'),
    )
    return lockup, mark_svg, fav


# ================================================================ 03 · PLATE
def plate(ink: str, paper: str, accent: str):
    """Heavy stencil plate: a solid tile with the two X's knocked out of it."""
    sw = 2.6
    stroke = f'fill="none" stroke="{ink}" stroke-width="{sw}" stroke-linecap="butt" stroke-linejoin="miter"'

    def mark(x, y, s=1.0, fill=None):
        fill = fill or ink
        # Tile 18×16, XX knocked out in paper colour, a thin accent bar at the bottom edge.
        return (
            f'<g transform="translate({x:g} {y:g}) scale({s:g})">'
            f'<rect width="18" height="16" rx="1.6" fill="{fill}"/>'
            f'<g fill="none" stroke="{paper}" stroke-width="2.2" stroke-linecap="butt">'
            '<path d="M3 3L8.6 11M8.6 3L3 11M9.4 3L15 11M15 3L9.4 11"/></g>'
            f'<rect x="3" y="12.6" width="12" height="1.2" fill="{accent}"/>'
            "</g>"
        )

    body = [mark(0, 0)]
    w1, w1w = word("MXXNLY", UPPER, 24, 3, 2.6)
    body.append(f'<g {stroke}>{w1}</g>')
    w2_x = 24 + w1w + 5
    w2, w2w = word("LABS", UPPER, w2_x, 3, 2.6)
    accent_stroke = stroke.replace(f'stroke="{ink}"', f'stroke="{accent}"')
    body.append(f'<g {accent_stroke}>{w2}</g>')
    total_w = w2_x + w2w + 1.5
    lockup = svg(total_w, 16, "".join(body))
    mark_svg = svg(18, 16, mark(0, 0))
    fav = svg(
        64,
        64,
        f'<rect width="64" height="64" rx="10" fill="{paper}"/>' + mark(5, 7, 3),
    )
    return lockup, mark_svg, fav


DIRECTIONS = {
    # folder: (builder, ink-on-light, paper-light, accent-light, ink-on-dark, paper-dark, accent-dark)
    "01-lattice": (lattice, "#141210", "#F6F3EC", "#C8381B", "#ECE7DC", "#141210", "#E8603F"),
    "02-stitch": (stitch, "#1E2A26", "#F7F8F6", "#176B5A", "#E6EBE8", "#141A18", "#7FD1B9"),
    "03-plate": (plate, "#1B1D1F", "#EDEDEA", "#F2B705", "#E8E6E1", "#121415", "#F2B705"),
}


def main():
    for folder, (build, ink_l, paper_l, acc_l, ink_d, paper_d, acc_d) in DIRECTIONS.items():
        out = OUT / folder
        lockup, mark, fav = build(ink_l, paper_l, acc_l)
        write(out / "logo-on-light.svg", lockup)
        write(out / "mark-on-light.svg", mark)
        write(out / "favicon.svg", fav)
        lockup, mark, fav_dark = build(ink_d, paper_d, acc_d)
        write(out / "logo-on-dark.svg", lockup)
        write(out / "mark-on-dark.svg", mark)
        write(out / "favicon-dark.svg", fav_dark)
        print("wrote", out)


if __name__ == "__main__":
    main()
