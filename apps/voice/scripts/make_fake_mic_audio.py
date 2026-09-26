"""Synthesize the fake-mic WAV used by the live Playwright suite.

Chromium's built-in fake capture is a 440 Hz tone, which STT rejects: no
transcript, no turn, nothing to analyze. The live suite therefore feeds
``--use-file-for-fake-audio-capture`` a real speech WAV, synthesized here with
the same offline Piper voice the bot speaks with (model in ``models/``, no
network, no key).

Leading silence is deliberate: it gives the bot greeting (LLM ~4s + TTS) time
to finish before the VAD sees speech, so the assistant turn is recorded first
and the UI group ordinal keeps matching the persisted ``position``.

The output is 48 kHz mono 16-bit: Chromium's ``--use-file-for-fake-audio-
capture`` runs its capture pipeline at 48 kHz, and feeding it the voice's
native 22050 Hz makes it play ~2.2x fast (chipmunk), which STT transcribes as
garbage — observed live as "on contact we check it right" for "I go to the
office yesterday". Resampling here (linear, stdlib-only) keeps the fixture
self-contained with no ffmpeg dependency.

Two more hardening details (both verified live):

- The sentence starts with a sacrificial "Well,": onset clipping eats the
  filler, never the error under test.
- The sentence repeats 3x with 3 s gaps inside one play (and the file loops):
  per-instance mangling, jitter-buffer settling and bot replies interleaving
  can each cost an instance; the survivors still carry "yesterday".

The lead and gaps are DIGITAL SILENCE, deliberately. A −45 dBFS comfort-noise
floor (tried first for AGC settling) made streaming STT emit a sustained
hallucinated narrative — a new poetic "turn" every few seconds, drowning the
real instances — while absolute silence yields finals only on speech. With
Opus DTX the silence costs no packets either.

Run from ``apps/voice`` (the .env is cwd-relative):
``uv run python scripts/make_fake_mic_audio.py <out.wav>``
"""

import array
import io
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from piper import PiperVoice

from config import settings

# Learner sentence with a fixable past-tense error, so the live Analyze run
# has the same defect the seeded-feedback e2e asserts on. The "Well," is a
# sacrificial onset: clipping eats the filler, never the error under test.
TEXT = "Well, I go to the office yesterday."
# 60 s of settle time: the first in-session instance must land after the
# greeting (LLM + TTS, up to 60 s+ on a slow proxied endpoint) and after
# Chrome's AEC/AGC and the Opus encoder have converged. Ordering needs no
# luck: file start (browser launch .. page mount) is uncontrolled, but the
# test asserts group-ordinal == DB position structurally, never "greeting is
# position 1".
LEAD_SILENCE_SEC = 60.0
GAP_SILENCE_SEC = 3.0
TAIL_SILENCE_SEC = 2.0
REPETITIONS = 3
# Chromium fake-capture pipeline rate (see module docstring).
TARGET_RATE = 48000


def models_dir() -> Path:
    path = Path(settings.models_dir)
    return path if path.is_absolute() else Path(__file__).resolve().parent.parent / path


def render(text: str) -> tuple[tuple[int, int, int, int, str, str], bytes]:
    voice = PiperVoice.load(
        models_dir() / f"{settings.piper_voice}.onnx",
        models_dir() / f"{settings.piper_voice}.onnx.json",
    )
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        voice.synthesize_wav(text, out)
    buffer.seek(0)
    with wave.open(buffer, "rb") as spoken:
        return spoken.getparams(), spoken.readframes(spoken.getnframes())


def resample_mono_s16(samples: array.array, src_rate: int, dst_rate: int) -> array.array:
    """Linear-interpolation resample of signed-16-bit mono samples."""
    if src_rate == dst_rate:
        return samples
    count = round(len(samples) * dst_rate / src_rate)
    out = array.array("h")
    for i in range(count):
        pos = i * len(samples) / count
        lo = int(pos)
        hi = min(lo + 1, len(samples) - 1)
        frac = pos - lo
        out.append(round(samples[lo] * (1 - frac) + samples[hi] * frac))
    return out


def write_wav(path: Path, text: str) -> None:
    params, frames = render(text)
    assert params.nchannels == 1 and params.sampwidth == 2, (
        f"unexpected Piper format: {params.nchannels}ch x {params.sampwidth * 8}-bit"
    )
    speech = array.array("h")
    speech.frombytes(frames)
    if sys.byteorder == "big":
        speech.byteswap()
    speech48 = resample_mono_s16(speech, params.framerate, TARGET_RATE)
    silence_sec = b"\x00" * (TARGET_RATE * 2)
    track = silence_sec * int(LEAD_SILENCE_SEC)
    gap = silence_sec * int(GAP_SILENCE_SEC)
    for _ in range(REPETITIONS):
        track += speech48.tobytes() + gap
    track += silence_sec * int(TAIL_SILENCE_SEC)
    padded = track
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(TARGET_RATE)
        out.writeframes(padded)
    seconds = len(padded) / (TARGET_RATE * 2)
    print(f"wrote {path} ({seconds:.1f}s, {TARGET_RATE}Hz mono 16-bit)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: make_fake_mic_audio.py <out.wav>")
    write_wav(Path(sys.argv[1]).resolve(), TEXT)
