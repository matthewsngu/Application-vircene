"""Restartable render: frames are encoded in chunks (final/chunks/cNNN.mp4); finished chunks are skipped
on restart, then everything is concatenated losslessly into OUT.
  python tools/render_chunks.py OUT [--fps 60] [--chunk 600] [--crf 16]"""
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from render import open_film, grab  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
args = sys.argv[1:]
out = args[0]
fps = int(args[args.index("--fps") + 1]) if "--fps" in args else 60
chunk = int(args[args.index("--chunk") + 1]) if "--chunk" in args else 600
crf = args[args.index("--crf") + 1] if "--crf" in args else "16"
cdir = ROOT / "final" / "chunks"
cdir.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b, page = open_film(p)
    dur = page.evaluate("window.END")
    frames = int(round(dur * fps))
    n = (frames + chunk - 1) // chunk
    for c in range(n):
        f0, f1 = c * chunk, min(frames, (c + 1) * chunk)
        dst = cdir / f"c{c:03d}.mp4"
        if dst.exists():
            print(f"chunk {c + 1}/{n} déjà fait", flush=True)
            continue
        tmp = cdir / f"c{c:03d}.part.mp4"
        ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                               "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p", str(tmp)], stdin=subprocess.PIPE)
        for f in range(f0, f1):
            page.evaluate(f"window.seekBlur({f / fps}, 1, {0.5 / fps})")
            ff.stdin.write(grab(page))
        ff.stdin.close()
        ff.wait()
        tmp.rename(dst)
        print(f"chunk {c + 1}/{n} ok ({f1}/{frames})", flush=True)
    b.close()

lst = cdir / "list.txt"
lst.write_text("".join(f"file '{cdir / f'c{c:03d}.mp4'}'\n" for c in range(n)))
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", out], check=True)
print("→", out)
