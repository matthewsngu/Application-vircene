"""One frame per shot (at a chosen fraction of the shot) in a grid, to judge the 3D at a glance.
  python tools/shotsheet.py OUT [frac=0.6] [scale=3]"""
import io, sys, json
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).parent))
from render import open_film, grab
from playwright.sync_api import sync_playwright

out = sys.argv[1]; frac = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6; sc = int(sys.argv[3]) if len(sys.argv) > 3 else 3
with sync_playwright() as p:
    b, page = open_film(p)
    shots = page.evaluate("window.SHOTS"); end = page.evaluate("window.END")
    tiles = []
    for i, s in enumerate(shots):
        t1 = shots[i + 1]["t0"] if i + 1 < len(shots) else end
        t = s["t0"] + (t1 - s["t0"]) * frac
        page.evaluate(f"window.seek({t})")
        im = Image.open(io.BytesIO(grab(page))).convert("RGB").resize((1080 // sc, 1920 // sc))
        tiles.append((s["id"], t, im))
    b.close()
cols = 7; tw, th = tiles[0][2].size
sheet = Image.new("RGB", (cols * (tw + 6) + 6, ((len(tiles) + cols - 1) // cols) * (th + 24) + 6), "#111")
d = ImageDraw.Draw(sheet)
for i, (sid, t, im) in enumerate(tiles):
    x, y = 6 + (i % cols) * (tw + 6), 6 + (i // cols) * (th + 24)
    sheet.paste(im, (x, y)); d.text((x + 4, y + th + 4), f"{sid} {t:5.2f}s", fill="#ddd")
sheet.save(out); print("→", out)
