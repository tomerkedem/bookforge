"""
Crop the highlight.png to its non-transparent bounding box, then center it
on a square transparent canvas at 120x120 with a small uniform margin.
Result matches the visual weight of the SVG sibling icons in the sidebar.
"""

from pathlib import Path
from PIL import Image, ImageChops

SRC_DIR = Path(__file__).resolve().parents[1] / "public/assets/icons/sidebar"
SRC = SRC_DIR / "highlight-source.png"  # original from designer
OUT = SRC_DIR / "highlight.png"         # processed icon used by the app
TARGET = 120          # final canvas size (px)
MARGIN_RATIO = 0.06   # ~7px breathing room on each side
ALPHA_THRESHOLD = 30  # ignore near-transparent noise

img = Image.open(SRC).convert("RGBA")
print(f"Source: {img.size}")

# Threshold the alpha channel before computing bbox — the raw bbox of any
# non-zero alpha catches faint noise across the whole canvas, which is
# what burned us on the 1536x1024 input (bbox came back ~full image).
alpha = img.split()[-1]
mask = alpha.point(lambda v: 255 if v > ALPHA_THRESHOLD else 0)
bbox = mask.getbbox()
if bbox is None:
    raise SystemExit(f"No pixels above alpha {ALPHA_THRESHOLD}")
print(f"Content bbox (alpha>{ALPHA_THRESHOLD}): {bbox}")

cropped = img.crop(bbox)
cw, ch = cropped.size
print(f"Cropped to: {cropped.size}")

# Fit cropped icon into TARGET square, preserving aspect ratio
inner = TARGET * (1 - 2 * MARGIN_RATIO)
scale = inner / max(cw, ch)
nw, nh = round(cw * scale), round(ch * scale)
resized = cropped.resize((nw, nh), Image.LANCZOS)

# Center on transparent square canvas
canvas = Image.new("RGBA", (TARGET, TARGET), (0, 0, 0, 0))
canvas.paste(resized, ((TARGET - nw) // 2, (TARGET - nh) // 2), resized)
canvas.save(OUT, "PNG", optimize=True)

print(f"Saved {TARGET}x{TARGET} -> {OUT}")
