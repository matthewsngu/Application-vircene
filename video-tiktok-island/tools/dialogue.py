"""Multi-voice dialogue with Chatterbox (local, free) + per-word timestamps.

dialogue.txt:  SPEAKER: line   |   [gap N]
Each line is one take, cloned from audio/voix-ref/<Ref>.<ext> (see CAST), checked by
faster-whisper (every word must be heard), then assembled with short gaps.
Writes audio/voix.wav, timing/words.json (words carry their speaker) and timing/lines.json.

  python tools/dialogue.py [redo_line_numbers e.g. 3,7]
"""
import glob
import hashlib
import json
import os
import re
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
CAST = {  # speaker → (reference clip, start s, exaggeration, words/min)
    "DAD": ("Julian", 2.0, 0.7, 175), "EMMA": ("Pixie", 1.0, 0.75, 175), "GRACE": ("Nora", 0.5, 0.65, 170),
    "PILOT": ("Marcus", 1.0, 0.6, 160), "CAPTAIN": ("Grady", 0.0, 0.85, 185), "NARRATOR": ("Kayla", 0.0, 0.55, 175),
}
GAP_LINE = 0.17  # between consecutive lines (tight, it's a chase)
REDO = set(int(x) for x in sys.argv[1].split(",")) if len(sys.argv) > 1 else set()


def norm(w):
    return re.sub(r"[^\w'-]", "", w.lower().replace("’", "'"))


def main():
    items = []
    for raw in (ROOT / "dialogue.txt").read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        m = re.match(r"\[gap ([\d.]+)\]", raw)
        if m:
            items.append(("GAP", float(m.group(1))))
            continue
        sp, text = raw.split(":", 1)
        items.append((sp.strip(), text.strip()))

    import torch
    from chatterbox.tts import ChatterboxTTS
    from faster_whisper import WhisperModel
    torch.set_num_threads(4)
    model = ChatterboxTTS.from_pretrained(device="cpu")
    sr = model.sr
    checker = WhisperModel("small", device="cpu", compute_type="int8")
    refs = {}
    for sp, (name, start, _, _) in CAST.items():
        src = glob.glob(str(ROOT / "audio" / "voix-ref" / f"{name}.*"))[0]
        y, _ = librosa.load(src, sr=24000, mono=True, offset=start, duration=12)
        p = ROOT / "audio" / "voix-ref" / f"_{name}-ref.wav"
        sf.write(p, y, 24000)
        refs[sp] = str(p)
    cache = ROOT / "audio" / "phrases"
    cache.mkdir(exist_ok=True)

    def heard_ratio(audio, text):
        tmp = ROOT / "audio" / "check.wav"
        sf.write(tmp, audio, sr)
        segs, _ = checker.transcribe(str(tmp), language="en", beam_size=5)
        heard = {norm(w) for w in " ".join(s.text for s in segs).split()}
        want = [norm(w) for w in text.split() if norm(w) and not re.search(r"\d", norm(w))]
        return sum(1 for w in want if w in heard) / max(1, len(want))

    takes, n = [], 0
    for sp, text in items:
        if sp == "GAP":
            takes.append(("GAP", text, None))
            continue
        n += 1
        name, _, exag, wpm = CAST[sp]
        cf = cache / (hashlib.md5(f"{sp}|{text}".encode()).hexdigest()[:12] + ".wav")
        if cf.exists() and n not in REDO:
            a, _ = librosa.load(cf, sr=sr)
            note = "cache"
        else:
            expect = len(text.split()) * 60 / wpm
            best = None
            for attempt in range(10 if n in REDO else 5):
                torch.manual_seed(77 + n * 31 + attempt * 101 + (int(os.environ.get("SEED", 0)) if n in REDO else 0))
                w = model.generate(text, audio_prompt_path=refs[sp], exaggeration=exag, cfg_weight=0.45, temperature=0.75)
                a = w.squeeze(0).cpu().numpy()
                a = librosa.effects.trim(a, top_db=40)[0]
                ratio = len(a) / sr / expect
                hr = heard_ratio(a, text)
                score = (hr >= 0.999, -abs(ratio - 1.0) + hr)
                if best is None or score > best[0]:
                    best = (score, a, ratio, hr)
                if hr >= 0.999 and 0.65 <= ratio <= 1.5:
                    break
            _, a, ratio, hr = best
            sf.write(cf, a, sr)
            note = f"ratio {ratio:.2f}, mots {100 * hr:.0f} %"
        # 60 ms of air before the attack (soft onsets), 40 ms after
        a = np.concatenate([np.zeros(int(0.06 * sr), np.float32), a, np.zeros(int(0.04 * sr), np.float32)])
        takes.append((sp, text, a))
        print(f"  {n:2d} {sp:8s} {len(a) / sr:4.1f} s ({note}) {text[:60]}", flush=True)

    # assemble
    out, t, lines = [np.zeros(int(0.3 * sr), np.float32)], 0.3, []
    for sp, text, a in takes:
        if sp == "GAP":
            out.append(np.zeros(int(text * sr), np.float32)); t += text
            continue
        lines.append({"speaker": sp, "text": text, "s": round(t, 3), "e": round(t + len(a) / sr, 3)})
        out.append(a); t += len(a) / sr
        out.append(np.zeros(int(GAP_LINE * sr), np.float32)); t += GAP_LINE
    voice = np.concatenate(out)
    sf.write(ROOT / "audio" / "voix.wav", voice, sr)
    dur = len(voice) / sr
    print(f"voix : {dur:.2f} s")

    # word timestamps per line (whisper on each line's own audio, offset into the film)
    wm = WhisperModel("small", device="cpu", compute_type="int8")
    words = []
    for L in lines:
        seg = voice[int(L["s"] * sr):int(L["e"] * sr)]
        tmp = ROOT / "audio" / "check.wav"
        sf.write(tmp, seg, sr)
        ss, _ = wm.transcribe(str(tmp), language="en", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
        hw = [(w.word.strip(), w.start, w.end) for s in ss for w in s.words]
        toks = L["text"].split()
        # map script tokens onto heard words in order; fall back to even spacing
        if len(hw) == len(toks):
            tt = [(L["s"] + s_, L["s"] + e_) for _, s_, e_ in hw]
        else:
            d = (L["e"] - L["s"]) / len(toks)
            tt = [(L["s"] + k * d, L["s"] + (k + 1) * d) for k in range(len(toks))]
        for tok, (s_, e_) in zip(toks, tt):
            words.append({"w": tok, "s": round(s_, 3), "e": round(e_, 3), "sp": L["speaker"]})
    (ROOT / "timing" / "words.json").write_text(json.dumps({"source": "dialogue", "duration": round(dur + 2.1, 3), "words": words}, indent=1), encoding="utf-8")
    (ROOT / "timing" / "lines.json").write_text(json.dumps(lines, indent=1), encoding="utf-8")
    print(f"film {dur + 2.1:.2f} s, {len(lines)} répliques")


if __name__ == "__main__":
    main()
