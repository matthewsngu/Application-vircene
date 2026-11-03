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
SAY = {  # pronunciation guides for spots the TTS mangles (meaning unchanged)
    "1963": "mille neuf cent soixante-trois",
    "Point Loma": "Poïnte Loma",
    "footballeur": "foute-balleur",
    "soixante-cinq :": "soixante-cinq.",
    "de sept en sept depuis cent": "de sept... en sept... depuis cent",
}
# Whisper writes numbers as digits: map them back to the script's words.
DIGITS = {"17": ["dix-sept"], "11": ["onze"], "264": ["deux", "cent", "soixante-quatre"], "65": ["soixante-cinq"],
          "14": ["quatorze"], "8": ["huit"], "7": ["sept"], "100": ["cent"], "1963": ["1963"]}
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
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    torch.set_num_threads(4)
    model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    # one short sentence per generation (long inputs get truncated by the model)
    units = []
    for line in lines:
        units += [u.strip() for u in re.findall(r"[^.?…:]+[.?…:]*", line) if u.strip()]
    cache = ROOT / "audio" / "phrases"
    cache.mkdir(exist_ok=True)
    pieces = []
    import hashlib
    for i, unit in enumerate(units):
        say = unit
        for k, v in SAY.items():
            say = say.replace(k, v)
        cf = cache / (hashlib.md5(say.encode()).hexdigest()[:10] + ".wav")
        syl = sum(max(1, len(re.findall(r"[aeiouyàâéèêëîïôùûœ]+", w.lower()))) for w in say.split())
        expect = 0.17 * syl
        force = REDO is not None and (i + 1) in REDO
        if cf.exists() and not force:
            a_, _ = librosa.load(cf, sr=model.sr)
            note = "cache"
        else:
            best = None
            for attempt in range(4):
                torch.manual_seed(1234 + i * 17 + attempt * 101 + (555 if force else 0))
                wav = model.generate(say, language_id="fr", audio_prompt_path=str(refwav),
                                     exaggeration=0.55, cfg_weight=0.3, temperature=0.7)
                a_ = wav.squeeze(0).cpu().numpy()
                core = librosa.effects.trim(a_, top_db=38)[0]
                ratio = len(core) / model.sr / expect
                if best is None or abs(ratio - 1.15) < abs(best[1] - 1.15):
                    best = (a_, ratio)
                if 0.7 <= ratio <= 1.45:  # longer = babble/repeats, shorter = truncation
                    break
            a_, ratio = best
            sf.write(cf, a_, model.sr)
            note = f"ratio {ratio:.2f}"
        gap = 0.32 if unit[-1:] in ".?…" else 0.18
        pieces += [a_, np.zeros(int(gap * model.sr), dtype=np.float32)]
        print(f"  {i + 1:2d}/{len(units)} {len(a_) / model.sr:4.1f} s ({note}) {unit[:50]}", flush=True)
    raw = np.concatenate(pieces)
    sr = model.sr

    # shorten pauses > 0.24 s to 0.16 s
    iv = librosa.effects.split(raw, top_db=38, frame_length=1024, hop_length=256)
    out, last = [], None
    for s, e in iv:
        if last is not None:
            gap = (s - last) / sr
            out.append(np.zeros(int(min(gap, 0.16 if gap > 0.24 else gap) * sr), dtype=np.float32))
        out.append(raw[s:e])
        last = e
    voice = np.concatenate(out)
    voice = np.concatenate([np.zeros(int(0.25 * sr), dtype=np.float32), voice])
    dur = len(voice) / sr
    tmp = ROOT / "audio" / "voix-tmp.wav"
    sf.write(tmp, voice, sr)
    final = ROOT / "audio" / "voix.wav"
    if dur < 55 or dur > 65:
        target = 65.0 if dur > 65 else 55.0  # nearest edge of 55-65 s: least tempo change
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
    segs, _ = wm.transcribe(str(final), language="fr", word_timestamps=True, beam_size=5,
                            vad_filter=True, condition_on_previous_text=False)
    hw = []
    for seg in segs:
        for w in seg.words:
            key = re.sub(r"[^\d]", "", w.word)
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
