"""Build the soundtrack from timing/events.json and mux it onto a video.

Each SFX is placed so that its loudest peak lands exactly on its event.
Music runs under everything (10-11 dB under the voice when a voice exists).
Master is normalised to -14 LUFS (ffmpeg loudnorm, two passes).

  python tools/mix.py VIDEO_IN.mp4 VIDEO_OUT.mp4 [--voice voice.wav]
"""
import json
import subprocess
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
SFX = {  # type: (file, gain dB, peak offset vs event in s)
    "type": ("sfx-candidats/1119.mp3", -21, 0.0),
    "pop": ("sfx-candidats/2354.mp3", -11, 0.0),
    "hit": ("sfx-candidats/2072.mp3", -7, 0.0),
    "whoosh": ("sfx-candidats/1485.mp3", -9, 0.2),  # peak on the cut (event is wipe start)
    "ding": ("sfx-candidats/1362.mp3", -12, 0.0),
}
MUSIC = ("musique-candidats/565.mp3", -17)  # alone; voice present → ducked to voice -10.5 dB


def load(path):
    y, _ = librosa.load(ROOT / "audio" / path, sr=SR, mono=True)
    return y


def db(x):
    return 10 ** (x / 20)


def main():
    vin, vout = sys.argv[1], sys.argv[2]
    voice = sys.argv[sys.argv.index("--voice") + 1] if "--voice" in sys.argv else None
    events = json.loads((ROOT / "timing" / "events.json").read_text())
    dur = json.loads((ROOT / "timing" / "words.json").read_text())["duration"]
    n = int(dur * SR)
    bus = np.zeros(n, dtype=np.float32)

    cache = {k: load(v[0]) for k, v in SFX.items()}
    rng = np.random.default_rng(7)
    for e in events:
        f, gain, off = SFX[e["type"]]
        y = cache[e["type"]]
        if e["type"] == "type":  # vary each tick a little so typing doesn't sound mechanical
            y = librosa.effects.pitch_shift(y, sr=SR, n_steps=float(rng.uniform(-1.5, 1.5))) if rng.random() < 0.0 else y
            gain += float(rng.uniform(-3, 1))
        peak = int(np.argmax(np.abs(y)))
        start = int((e["t"] + off) * SR) - peak
        a, b = max(0, start), min(n, start + len(y))
        if b > a:
            bus[a:b] += y[a - start:b - start] * db(gain)

    music = load(MUSIC[0])
    if len(music) < n:
        music = np.tile(music, n // len(music) + 1)
    music = music[:n].copy()
    fade = int(1.5 * SR)
    music[-fade:] *= np.linspace(1, 0, fade)
    mgain = MUSIC[1]
    if voice:
        v, _ = librosa.load(voice, sr=SR, mono=True)
        v = np.pad(v, (0, max(0, n - len(v))))[:n]
        # music sits ~10.5 dB under the voice's loudness
        vr = np.sqrt(np.mean(v[np.abs(v) > 1e-3] ** 2))
        mr = np.sqrt(np.mean(music ** 2))
        mgain = 20 * np.log10(vr / mr) - 10.5
        bus += v
    bus += music * db(mgain)

    tmp = ROOT / "audio" / "mix-raw.wav"
    sf.write(tmp, bus, SR)
    # two-pass loudnorm; pass 2 aims 0.4 LU high because AAC encoding lands ~0.4 LU low → -14 LUFS measured
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(tmp), "-af", "aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    js = json.loads(p.stderr[p.stderr.rindex("{"):p.stderr.rindex("}") + 1])
    af = (f"aformat=channel_layouts=stereo,loudnorm=I=-13.6:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=false")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", vin, "-i", str(tmp), "-af", af, "-ar", "48000",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", vout], check=True)
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", vout, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    print("→", vout, [l.strip() for l in m.stderr.splitlines() if l.strip().startswith("I:")][-1])


if __name__ == "__main__":
    main()
