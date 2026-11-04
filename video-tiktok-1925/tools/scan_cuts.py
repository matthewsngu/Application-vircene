"""Scan a render for cuts and single-frame jumps, compare with planned cuts.

  python tools/scan_cuts.py VIDEO.mp4
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent


def main():
    cap = cv2.VideoCapture(sys.argv[1])
    fps = cap.get(cv2.CAP_PROP_FPS)
    prev, diffs = None, []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        small = cv2.cvtColor(cv2.resize(fr, (192, 108)), cv2.COLOR_BGR2LAB).astype(np.float32)
        diffs.append(0.0 if prev is None else float(np.mean(np.abs(small - prev))))
        prev = small
    d = np.array(diffs)
    thr = max(12.0, np.percentile(d, 99) * 0.6)
    cuts = [i for i in range(1, len(d)) if d[i] > thr and d[i] >= d[max(0, i - 1)] and d[i] >= d[min(len(d) - 1, i + 1)]]
    # planned cuts = shot starts + wipe in/out edges
    shots = json.loads((ROOT / "timing" / "shots.json").read_text())
    planned = [s["t0"] for s in shots if s["t0"] > 0]
    print(f"{len(d)} images à {fps:.0f} i/s, seuil {thr:.1f}, {len(cuts)} sauts détectés")
    bad = 0
    for i in cuts:
        t = i / fps
        near = min(planned, key=lambda p: abs(p - t))
        ok = abs(near - t) <= 1.5 / fps or any(abs(t - (w + o)) <= 0.25 for w in json.loads((ROOT / "timing" / "wipes.json").read_text()) for o in (-0.2, 0, 0.2))
        if not ok:
            bad += 1
            print(f"  ⚠ saut imprévu à {t:.3f} s (diff {d[i]:.1f})")
    singles = [i for i in cuts if any(j - i == 1 for j in cuts)]
    for i in singles:
        print(f"  ⚠ saut d'une seule image à {i / fps:.3f} s")
    missing = [p for p in planned if not any(abs(p - i / fps) <= 1.5 / fps for i in cuts)]
    for p in missing:
        print(f"  · cut prévu à {p:.2f} s peu visible (même décor ou wipe) — à vérifier à l'œil")
    print("OK" if not bad and not singles else f"{bad} imprévus, {len(singles)} sauts d'une image")


if __name__ == "__main__":
    main()
