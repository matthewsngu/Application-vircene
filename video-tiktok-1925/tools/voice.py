"""Free French voiceover with Chatterbox (local, CPU) + word timestamps.

1. Chatterbox Multilingual, language fr, voice cloned from a reference clip.
2. Pauses > 0.24 s shortened to 0.16 s; atempo only if outside 55-65 s.
3. faster-whisper word timestamps, aligned back onto the script's own tokens
   so the film's anchors (T('mot', n)) keep working.

  python tools/voice.py audio/voix-ref/Luc.mp3 [ref_start_s]
Writes audio/voix.wav and timing/words.json (source "whisper").
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SAY = {  # pronunciation guides (meaning unchanged)
    "1925": "nineteen twenty-five",
}
# Whisper writes numbers as digits: map them back to the script's words.
DIGITS = {"1925": ["1925"], "1000": ["thousand"], "260": ["two", "hundred", "and", "sixty", "dollars"], "5": ["five"],
          "100": ["hundred"], "2": ["two"], "500": ["five", "hundred"], "655": ["six", "hundred", "and", "fifty-five", "dollars"],
          "17000": ["seventeen", "thousand", "dollars"], "2000": ["two", "thousand", "dollars"], "400": ["four", "hundred", "dollars"],
          "18000": ["eighteen", "thousand", "dollars"]}
# Dramatic comma before the reveal (motion-doctrine "stillness before climax").
PAUSE_AFTER = {"Your thousand dollars barely buys the letters.": 0.6, "Your money didn't disappear.": 0.4}
REDO = set(int(x) for x in sys.argv[3].split(",")) if len(sys.argv) > 3 else None


def tokens(text):
    out = []
    for tok in text.split():
        if out and re.fullmatch(r"[?!:;…]+", tok):
            out[-1] += tok
        else:
            out.append(tok)
    return out


def norm(w):
    return re.sub(r"[^\w'-]", "", w.lower().replace("’", "'"))


def main():
    ref = sys.argv[1]
    ref_start = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
    script = (ROOT / "script.txt").read_text(encoding="utf-8")
    lines = [l.strip() for l in script.splitlines() if l.strip()]

    # reference: a clean ~12 s excerpt
    y, sr = librosa.load(ref, sr=24000, mono=True, offset=ref_start, duration=12)
    refwav = ROOT / "audio" / "voix-ref" / "ref-12s.wav"
    sf.write(refwav, y, sr)

    import torch
    from chatterbox.tts import ChatterboxTTS
    torch.set_num_threads(4)
    model = ChatterboxTTS.from_pretrained(device="cpu")
    # one short sentence per generation (long inputs get truncated by the model)
    # joins applied before splitting: very short sentences make the model babble after the text
    JOIN = {}
    units = []
    for line in lines:
        for k, v in JOIN.items():
            line = line.replace(k, v)
        # no split on ":" — a fragment that starts after a colon gets a bad attack from the model
        units += [u.strip() for u in re.findall(r"[^.?…]+[.?…]*", line) if u.strip()]
    cache = ROOT / "audio" / "phrases"
    cache.mkdir(exist_ok=True)
    pieces = []
    import hashlib
    from faster_whisper import WhisperModel
    checker = WhisperModel("small", device="cpu", compute_type="int8")
    lang = "en"

    def word_match(audio, text):  # share of the sentence's words actually heard in this take
        tmpf = ROOT / "audio" / "check.wav"
        sf.write(tmpf, audio, model.sr)
        segs, _ = checker.transcribe(str(tmpf), language=lang, beam_size=5)
        heard = [norm(w) for w in " ".join(x.text for x in segs).split()]
        heard = [h for h in heard if h]
        want = [norm(w) for w in text.split() if norm(w)]
        skip = {norm(x) for k in SAY for x in k.split()}  # words said through a pronunciation guide
        want = [w for w in want if not re.search(r"\d", w) and w not in skip]  # digits come back as numbers
        hits = sum(1 for w in want if w in heard)
        return hits / max(1, len(want))
    for i, unit in enumerate(units):
        say = unit
        for k, v in SAY.items():
            say = say.replace(k, v)
        cf = cache / (hashlib.md5(say.encode()).hexdigest()[:10] + ".wav")
        expect = len(say.split()) * 60 / 191  # Julian measured at 191 words/min
        force = REDO is not None and (i + 1) in REDO
        if cf.exists() and not force:
            a_, _ = librosa.load(cf, sr=model.sr)
            note = "cache"
        else:
            best = None
            for attempt in range(10 if force else 4):
                torch.manual_seed(1234 + i * 17 + attempt * 101 + (int(__import__("os").environ.get("SEED", 555)) if force else 0))
                wav = model.generate(say, audio_prompt_path=str(refwav),
                                     exaggeration=0.6, cfg_weight=0.5, temperature=0.7)
                a_ = wav.squeeze(0).cpu().numpy()
                core = librosa.effects.trim(a_, top_db=38)[0]
                ratio = len(core) / model.sr / expect
                wm_ = word_match(a_, unit)  # every word must be there (no swallowed "her", "have")
                score = (wm_ >= 0.999, -abs(ratio - 1.0) + wm_)
                if best is None or score > best[2]:
                    best = (a_, ratio, score, wm_)
                if wm_ >= 0.999 and 0.7 <= ratio <= 1.45:  # all words, no babble, no truncation
                    break
            a_, ratio, _, wm_ = best
            sf.write(cf, a_, model.sr)
            note = f"ratio {ratio:.2f}, mots {100 * wm_:.0f} %"
        gap = (0.32 if unit[-1:] in ".?…" else 0.18) + PAUSE_AFTER.get(unit, 0.0)
        pieces += [a_, np.zeros(int(gap * model.sr), dtype=np.float32)]
        print(f"  {i + 1:2d}/{len(units)} {len(a_) / model.sr:4.1f} s ({note}) {unit[:50]}", flush=True)
    raw = np.concatenate(pieces)
    sr = model.sr

    # shorten pauses > 0.24 s to 0.16 s
    iv = librosa.effects.split(raw, top_db=38, frame_length=1024, hop_length=256)
    # keep 60 ms before / 40 ms after each speech run: soft onsets ("h", "f") sit under the threshold
    iv = [(max(0, s0 - int(0.06 * sr)), min(len(raw), e0 + int(0.04 * sr))) for s0, e0 in iv]
    merged = []
    for s0, e0 in iv:
        if merged and s0 <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e0))
        else:
            merged.append((s0, e0))
    iv = merged
    out, last = [], None
    for s, e in iv:
        if last is not None:
            gap = (s - last) / sr
            keep = gap if gap > 0.85 else (0.16 if gap > 0.24 else gap)  # >0.85 s = deliberate dramatic pause
            out.append(np.zeros(int(keep * sr), dtype=np.float32))
        out.append(raw[s:e])
        last = e
    voice = np.concatenate(out)
    voice = np.concatenate([np.zeros(int(0.25 * sr), dtype=np.float32), voice])
    dur = len(voice) / sr
    tmp = ROOT / "audio" / "voix-tmp.wav"
    sf.write(tmp, voice, sr)
    final = ROOT / "audio" / "voix.wav"
    if dur < 61 or dur > 65:  # TikTok creator rewards need > 1 min: keep the voice in 61-65 s
        target = 65.0 if dur > 65 else 61.5
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(tmp), "-af", f"atempo={dur / target:.4f}", str(final)], check=True)
    else:
        tmp.replace(final)
    tmp.unlink(missing_ok=True)
    dur = librosa.get_duration(path=str(final))
    print(f"voix : {dur:.2f} s")

    # word timestamps
    from faster_whisper import WhisperModel
    wm = WhisperModel("small", device="cpu", compute_type="int8")
    # no initial_prompt: with the script as prompt whisper skips and loops
    segs, _ = wm.transcribe(str(final), language="en", word_timestamps=True, beam_size=5,
                            vad_filter=True, condition_on_previous_text=False)
    hw = []
    for seg in segs:
        for w in seg.words:
            key = re.sub(r"[^\d]", "", w.word)  # "€10,000" → "10000"
            if key and key in DIGITS:
                parts = DIGITS[key]
                d = (w.end - w.start) / len(parts)
                hw += [{"w": p, "s": w.start + k * d, "e": w.start + (k + 1) * d} for k, p in enumerate(parts)]
            else:
                hw.append({"w": w.word.strip(), "s": w.start, "e": w.end})

    # align whisper words onto the script tokens
    st = tokens(script)
    a = [norm(t) for t in st]
    b = [norm(w["w"]) for w in hw]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    times = [None] * len(st)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (hw[blk.b + k]["s"], hw[blk.b + k]["e"])
    matched = sum(t is not None for t in times)
    # interpolate unmatched tokens between neighbours
    for i in range(len(st)):
        if times[i] is None:
            j = i
            while j < len(st) and times[j] is None:
                j += 1
            t0 = times[i - 1][1] if i > 0 and times[i - 1] else 0.25
            t1 = times[j][0] if j < len(st) else dur
            n = j - i
            for k in range(n):
                s = t0 + (t1 - t0) * k / n
                times[i + k] = (s, t0 + (t1 - t0) * (k + 1) / n)
    words = [{"w": t, "s": round(s, 3), "e": round(e, 3)} for t, (s, e) in zip(st, times)]
    (ROOT / "timing" / "words.json").write_text(json.dumps(
        {"source": "whisper", "duration": round(dur + 1.6, 3), "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"timestamps : {matched}/{len(st)} mots alignés directement, durée film {dur + 1.6:.2f} s")


if __name__ == "__main__":
    main()
