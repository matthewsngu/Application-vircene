"""Free local AI upscale (Real-ESRGAN general x4v3, CPU) of a low-res video to 1080p.

  python upscale.py IN.mp4 OUT.mp4 [--short 1080] [--denoise 0.5] [--crf 17]

- Every frame goes through Real-ESRGAN x4 (realesr-general-x4v3, works well on AI-generated
  and real footage), then is resized with Lanczos so the SHORT side = --short (1080 → 1080x1920
  for a vertical video, 1920x1080 for a horizontal one).
- --denoise 0..1 blends the "wdn" (denoise) variant of the model: 0 keeps the most texture,
  1 smooths compression noise the most. Default 0.5.
- Audio is copied untouched; fps is kept. Restartable: finished frames are cached as PNG in
  OUT.frames/ and skipped on restart.
Weights: realesr-general-x4v3.pth and realesr-general-wdn-x4v3.pth next to this script
(downloaded automatically from the Real-ESRGAN GitHub releases, BSD-3 licence).
"""
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

HERE = Path(__file__).resolve().parent
URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/"
args = sys.argv[1:]
src, dst = Path(args[0]), Path(args[1])
opt = lambda k, d: type(d)(args[args.index(k) + 1]) if k in args else d
short, dn, crf = opt("--short", 1080), opt("--denoise", 0.5), opt("--crf", 17)
torch.set_num_threads(max(1, torch.get_num_threads()))


def weights(name):
    p = HERE / name
    if not p.exists():
        print("téléchargement", name, flush=True)
        subprocess.run(["curl", "-sSL", "-o", str(p), URL + name], check=True)
    return torch.load(p, map_location="cpu", weights_only=True)


sd = weights("realesr-general-x4v3.pth")
sd = sd.get("params", sd)
if dn > 0:
    wdn = weights("realesr-general-wdn-x4v3.pth")
    a, b = sd.get("params", sd), wdn.get("params", wdn)
    sd = {k: a[k] * (1 - dn) + b[k] * dn for k in a}
model = ModelLoader().load_from_state_dict(sd).model.eval()

info = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                           "stream=width,height,r_frame_rate,nb_frames", "-of", "json", str(src)]))["streams"][0]
w, h = info["width"], info["height"]
fps = info["r_frame_rate"]
if w <= h:
    ow, oh = short, round(h * short / w / 2) * 2
else:
    oh, ow = short, round(w * short / h / 2) * 2
ow, oh = [1920 if abs(v - 1920) <= 8 else v for v in (ow, oh)]  # 854→1922: snap to the standard 1920
print(f"{w}x{h} → {ow}x{oh} @ {fps}", flush=True)

fdir = Path(str(dst) + ".frames")
fdir.mkdir(parents=True, exist_ok=True)
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(src), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
n, t0 = 0, time.time()
with torch.inference_mode():
    while True:
        buf = dec.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        out = fdir / f"{n:06d}.png"
        if not out.exists():
            x = torch.from_numpy(np.frombuffer(buf, np.uint8).reshape(h, w, 3).copy()).permute(2, 0, 1)[None].float() / 255
            y = model(x).clamp(0, 1)[0].permute(1, 2, 0).numpy()
            Image.fromarray((y * 255 + 0.5).astype(np.uint8)).resize((ow, oh), Image.LANCZOS).save(out, compress_level=1)
        n += 1
        if n % 30 == 0:
            el = time.time() - t0
            print(f"{n} images, {el / n:.2f} s/image", flush=True)
dec.wait()

subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", fps, "-i", str(fdir / "%06d.png"), "-i", str(src),
                "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p",
                "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(dst)], check=True)
print("→", dst, f"({n} images)")
