"""Drive the canvas film with Playwright Chromium.

  python tools/render.py check              → load, list shots/events, verify cut words
  python tools/render.py contact OUT.png [N] [START END]  → contact sheet of N frames
  python tools/render.py video OUT.mp4 [--fps 60] [--sub 6] [--crf 16]

Run with the venv python (Playwright for Python is installed there).
"""
import base64
import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
URL = (ROOT / "film" / "index.html").as_uri()


def open_film(p):
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--allow-file-access-from-files", "--headless", "--no-sandbox"])
    page = b.new_page(viewport={"width": 1920, "height": 1080})
    page.goto(URL)
    page.wait_for_function("window.READY || window.ERROR", timeout=60000)
    err = page.evaluate("window.ERROR || null")
    if err:
        raise SystemExit("Erreur film:\n" + err)
    return b, page


def grab(page):
    data = page.evaluate("document.getElementById('c').toDataURL('image/png')")
    return base64.b64decode(data.split(",", 1)[1])


def cmd_check(page):
    shots = page.evaluate("window.SHOTS")
    end = page.evaluate("window.END")
    words = json.loads((ROOT / "timing" / "words.json").read_text())["words"]
    print(f"Durée {end:.2f} s, {len(shots)} plans")
    for i, s in enumerate(shots):
        t1 = shots[i + 1]["t0"] if i + 1 < len(shots) else end
        w = min(words, key=lambda w: abs(w["s"] - s["t0"]))
        flag = "" if abs(w["s"] - s["t0"]) < 0.01 or s["t0"] == 0 else "  ⚠ pas sur un mot"
        long = "  ⚠ >4 s" if t1 - s["t0"] > 4.05 else ""
        print(f"  {s['id']:5} {s['t0']:6.2f}–{t1:6.2f} ({t1 - s['t0']:.2f} s)  «{w['w']}»{flag}{long}")
    ev = page.evaluate("window.EV")
    kinds = {}
    for e in ev:
        kinds[e["type"]] = kinds.get(e["type"], 0) + 1
    print("Événements son :", kinds)
    (ROOT / "timing" / "events.json").write_text(json.dumps(ev, indent=1))
    (ROOT / "timing" / "shots.json").write_text(json.dumps(shots, indent=1))
    (ROOT / "timing" / "wipes.json").write_text(json.dumps(page.evaluate("window.WIPES")))


def cmd_contact(page, out, n=16, start=None, end=None):
    from PIL import Image
    import io

    dur = page.evaluate("window.END")
    a = float(start) if start is not None else 0.0
    b = float(end) if end is not None else dur - 0.05
    tiles = []
    for i in range(n):
        t = a + (b - a) * (i + 0.5) / n
        page.evaluate(f"window.seek({t})")
        im = Image.open(io.BytesIO(grab(page))).convert("RGB").resize((480, 270))
        tiles.append((t, im))
    cols = 4
    sheet = Image.new("RGB", (cols * 480 + (cols + 1) * 8, ((n + cols - 1) // cols) * 300 + 8), "#111")
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(tiles):
        x, y = 8 + (i % cols) * 488, 8 + (i // cols) * 300
        sheet.paste(im, (x, y))
        d.text((x + 4, y + 274), f"{t:5.2f} s", fill="#ddd")
    sheet.save(out)
    print("→", out)


def cmd_video(page, out, fps=60, sub=6, crf=16):
    dur = page.evaluate("window.END")
    frames = int(round(dur * fps))
    ff = subprocess.Popen(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
         "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", out],
        stdin=subprocess.PIPE,
    )
    span = 0.5 / fps  # 6 sub-frames over half a frame (180° shutter)
    for f in range(frames):
        page.evaluate(f"window.seekBlur({f / fps}, {sub}, {span})")
        ff.stdin.write(grab(page))
        if f % (fps * 5) == 0:
            print(f"  {f}/{frames}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("→", out)


def main():
    args = sys.argv[1:]
    with sync_playwright() as p:
        b, page = open_film(p)
        if args[0] == "check":
            cmd_check(page)
        elif args[0] == "contact":
            cmd_contact(page, *args[1:2], *[float(x) if i else int(x) for i, x in enumerate(args[2:3])], *args[3:5])
        elif args[0] == "video":
            opts = dict(zip(args[2::2], args[3::2]))
            cmd_video(page, args[1], int(opts.get("--fps", 60)), int(opts.get("--sub", 6)), int(opts.get("--crf", 16)))
        b.close()


if __name__ == "__main__":
    main()
