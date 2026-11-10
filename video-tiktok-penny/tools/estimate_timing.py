"""Estimate per-word timestamps from script.txt (no voiceover yet).

Writes timing/words.json in the same shape faster-whisper produces
([{"w", "s", "e"}]), so the film can later switch to real timestamps
with no other change.

Usage: python -I tools/estimate_timing.py [target_seconds]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = float(sys.argv[1]) if len(sys.argv) > 1 else 61.0

# Spoken syllables for tokens whose spelling hides their length.
OVERRIDES = {"1963": 7}

PAUSE_AFTER = {".": 0.30, "?": 0.36, "…": 0.42, ":": 0.18, ",": 0.12, ";": 0.18}
LEAD_IN = 0.25


def syllables(token: str) -> int:
    bare = re.sub(r"[^\wÀ-ÿ'-]", "", token).lower()
    if bare in OVERRIDES:
        return OVERRIDES[bare]
    groups = re.findall(r"[aeiouyàâäéèêëîïôöùûüœæ]+", bare)
    n = len(groups)
    # silent final -e / -es / -ent
    if n > 1 and re.search(r"[^aeiouyéèê](e|es|ent)$", bare):
        n -= 1
    return max(1, n)


def main() -> None:
    text = (ROOT / "script.txt").read_text(encoding="utf-8")
    tokens = []
    for tok in text.split():
        # French spacing puts ":" "?" on their own: glue them to the word.
        if tokens and re.fullmatch(r"[?!:;…]+", tok):
            tokens[-1] += tok
        else:
            tokens.append(tok)
    raw = []
    for tok in tokens:
        speak = 0.07 + 0.16 * syllables(tok)
        pause = 0.0
        for mark, p in PAUSE_AFTER.items():
            if tok.endswith(mark):
                pause = max(pause, p)
        raw.append((tok, speak, pause))

    total_speak = sum(r[1] for r in raw)
    total_pause = sum(r[2] for r in raw)
    scale = (TARGET - LEAD_IN - 1.6 - total_pause) / total_speak  # 1.6 s tail

    t = LEAD_IN
    words = []
    for tok, speak, pause in raw:
        d = speak * scale
        words.append({"w": tok, "s": round(t, 3), "e": round(t + d, 3)})
        t += d + pause
    out = {"source": "estimate", "duration": round(t + 1.6, 3), "words": words}
    (ROOT / "timing" / "words.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"{len(words)} mots, durée {out['duration']} s, échelle {scale:.2f}")


if __name__ == "__main__":
    main()
