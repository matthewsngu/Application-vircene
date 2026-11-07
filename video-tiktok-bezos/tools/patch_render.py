"""Re-render frames [a, b) of an existing 60 fps render and splice them in (re-encodes once).
  python tools/patch_render.py IN.mp4 OUT.mp4 a b"""
import subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from render import open_film, grab
from playwright.sync_api import sync_playwright
src, out, a, b = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
fps = 60; f0, f1 = round(a * fps), round(b * fps)
seg = str(Path(out).with_suffix('.seg.mp4'))
with sync_playwright() as p:
    br, page = open_film(p)
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", seg], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        page.evaluate(f"window.seekBlur({f / fps}, 1, {0.5 / fps})"); ff.stdin.write(grab(page))
    ff.stdin.close(); ff.wait(); br.close()
fc = (f"[0:v]trim=end_frame={f0},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];"
      f"[0:v]trim=start_frame={f1},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-i", seg, "-filter_complex", fc, "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "60", out], check=True)
Path(seg).unlink(); print("→", out)
