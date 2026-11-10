"""Grab single frames: python tools/frame.py OUT_PREFIX t1 [t2 ...] (half size)"""
import io, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from render import open_film, grab
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b, page = open_film(p)
    ims = []
    for t in sys.argv[2:]:
        page.evaluate(f"window.seek({float(t)})"); ims.append(Image.open(io.BytesIO(grab(page))).convert("RGB").resize((540, 960)))
    sheet = Image.new("RGB", (550 * len(ims), 960), "#111")
    for i, im in enumerate(ims): sheet.paste(im, (i * 550, 0))
    sheet.save(sys.argv[1]); print("→", sys.argv[1])
