"""
Normalize a sidebar PNG icon and emit two variants:

  <name>.png       — the original neon-on-dark icon, cleanly cropped
                     and centered on a transparent 120x120 canvas.
  <name>-ink.png  — same shape, recolored to a warm ink tone for use
                     on the light-mode cream surface (where neon
                     outlines read as washed-out and lifeless).

Source-shape handling:
  1. RGBA with real transparency       -> crop by alpha > threshold.
  2. RGB / RGBA with solid bg          -> sample corners to estimate
     the background color, mask pixels close to it as transparent,
     then crop by the resulting mask.

Recoloring strategy for the dark variant:
  Rather than apply a single grayscale flatten (which would kill the
  ink-stamp feel), we keep each pixel's brightness/luminance but tint
  the hue toward a warm deep ink. This preserves the icon's stroke
  modulation (the thicker parts stay deeper, glow halos stay soft)
  while replacing the bright neon color family with one that grounds
  on cream like a printed mark.

Usage:
    py scripts/fix-sidebar-icon.py <name>

Reads:  public/assets/icons/sidebar/<name>-source.png
Writes: public/assets/icons/sidebar/<name>.png
        public/assets/icons/sidebar/<name>-ink.png
"""

import sys
from pathlib import Path
from PIL import Image

TARGET = 120
MARGIN_RATIO = 0.06
ALPHA_THRESHOLD = 30
BG_COLOR_DISTANCE = 40

# Warm ink tone for the cream surface — matches the brand's deep-brown
# body text color rgba(60, 50, 70, ...) but pushed slightly warmer so
# it ties to the cream-gold theme rather than fighting it.
INK_R, INK_G, INK_B = 52, 38, 60


def load_with_alpha(src_path: Path) -> Image.Image:
    img = Image.open(src_path).convert("RGBA")
    px = img.load()
    w, h = img.size

    alpha = img.split()[-1]
    if sum(1 for a in alpha.getdata() if a == 0) > (w * h) * 0.10:
        return img

    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    print(f"  estimated bg color: {bg}")

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d2 = (r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2
            if d2 < BG_COLOR_DISTANCE ** 2:
                px[x, y] = (r, g, b, 0)
    return img


def fit_to_canvas(cropped: Image.Image) -> Image.Image:
    """Center a cropped icon on a transparent TARGET x TARGET canvas."""
    cw, ch = cropped.size
    inner = TARGET * (1 - 2 * MARGIN_RATIO)
    scale = inner / max(cw, ch)
    nw, nh = round(cw * scale), round(ch * scale)
    resized = cropped.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (TARGET, TARGET), (0, 0, 0, 0))
    canvas.paste(resized, ((TARGET - nw) // 2, (TARGET - nh) // 2), resized)
    return canvas


def make_ink_variant(icon: Image.Image) -> Image.Image:
    """Recolor a transparent icon to the warm ink tone, preserving the
    per-pixel luminance so stroke modulation and soft glow halos stay
    intact. The ink tone is darker than full-strength so deeper pixels
    map to near-black and lighter pixels to a soft warm ink.
    """
    px = icon.load()
    w, h = icon.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # Rec. 709 luminance — perceptual brightness of the source
            lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
            # Map luminance into ink: darker source -> darker ink.
            # Cap at ~85% of ink brightness so the icon stays bold.
            t = min(lum * 0.95, 1.0)
            nr = round(INK_R * t)
            ng = round(INK_G * t)
            nb = round(INK_B * t)
            op[x, y] = (nr, ng, nb, a)
    return out


def process(name: str) -> None:
    src_dir = Path(__file__).resolve().parents[1] / "public/assets/icons/sidebar"
    src = src_dir / f"{name}-source.png"
    out_color = src_dir / f"{name}.png"
    out_ink = src_dir / f"{name}-ink.png"

    if not src.exists():
        raise SystemExit(f"missing source: {src}")

    img = load_with_alpha(src)
    print(f"Source: {img.size} ({src.name})")

    alpha = img.split()[-1]
    mask = alpha.point(lambda v: 255 if v > ALPHA_THRESHOLD else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise SystemExit("no content above alpha threshold")
    print(f"Content bbox: {bbox}")

    color_icon = fit_to_canvas(img.crop(bbox))
    color_icon.save(out_color, "PNG", optimize=True)
    print(f"Saved color  -> {out_color.name}")

    ink_icon = make_ink_variant(color_icon)
    ink_icon.save(out_ink, "PNG", optimize=True)
    print(f"Saved ink    -> {out_ink.name}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: py scripts/fix-sidebar-icon.py <name>")
    process(sys.argv[1])
