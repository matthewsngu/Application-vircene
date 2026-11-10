"""Compare reference voices for Chatterbox: pace (syllables/s) and clarity (whisper word match).

  python tools/voice_test.py audio/voix-ref/Luc.mp3 audio/voix-ref/Julian.mp3 ...
"""
import difflib
import re
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
TEST = [
    "Un concierge a laissé presque huit millions de dollars. Personne ne s'en doutait.",
    "Ses actions lui versent des dividendes. Ronald ne les dépense pas : il les réinvestit.",
]


def syl(t):
    return sum(max(1, len(re.findall(r"[aeiouyàâéèêëîïôùûœ]+", w.lower()))) for w in t.split())


def norm(t):
    return [re.sub(r"[^\w'-]", "", w.lower()) for w in t.split() if re.sub(r"[^\w'-]", "", w)]


def main():
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from faster_whisper import WhisperModel
    torch.set_num_threads(4)
    tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    wm = WhisperModel("small", device="cpu", compute_type="int8")
    out = ROOT / "audio" / "test"
    out.mkdir(exist_ok=True)
    for ref in sys.argv[1:]:
        y, sr = librosa.load(ref, sr=24000, mono=True, offset=2, duration=12)
        rp = out / (Path(ref).stem + "-ref.wav")
        sf.write(rp, y, sr)
        f0, _, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr)
        total_s, total_syl, match, words = 0.0, 0, 0, 0
        for i, t in enumerate(TEST):
            torch.manual_seed(42 + i)
            a = tts.generate(t, language_id="fr", audio_prompt_path=str(rp), exaggeration=0.55, cfg_weight=0.3, temperature=0.7)
            a = a.squeeze(0).cpu().numpy()
            core = np.concatenate([a[s:e] for s, e in librosa.effects.split(a, top_db=38)])
            total_s += len(core) / tts.sr
            total_syl += syl(t)
            p = out / f"{Path(ref).stem}-{i}.wav"
            sf.write(p, a, tts.sr)
            segs, _ = wm.transcribe(str(p), language="fr", beam_size=5, vad_filter=True)
            heard = norm(" ".join(s.text for s in segs))
            want = norm(t)
            sm = difflib.SequenceMatcher(a=want, b=heard)
            match += sum(b.size for b in sm.get_matching_blocks())
            words += len(want)
        print(f"{Path(ref).stem:8} débit {total_syl / total_s:4.1f} syll/s  netteté {100 * match / words:3.0f} %  hauteur {np.nanmedian(f0):4.0f} Hz", flush=True)


if __name__ == "__main__":
    main()
