"""Pronunciation assessment for the analyze path.

Acoustic measurements the LLM must never invent (see `feedback.py`): score,
mispronounced words with the sounds actually heard (IPA), error rates. Backed
by OpenPronounce (Wav2Vec2: ~7 s warm on CPU, ~0.3 s on a GTX 1650); the
import stays inside the function so the unit suite never pays for the weights.

Note: `/analyze` carries text only, so it never calls this scorer; the
scorer serves `/pronounce`, where the request brings both audio and the
reference sentence. That split is what keeps phonemes out of the language
model's reach.
"""

import asyncio
import os
import tempfile
from typing import Any

from pydantic import BaseModel, Field

from config import settings


class MispronouncedWord(BaseModel):
    word: str
    expected: str = ""
    heard: str = ""
    confidence: float = 0.0


class SpeechAssessment(BaseModel):
    score: float = 0.0
    transcription: str = ""
    phoneme_error_rate: float = 0.0
    word_error_rate: float = 0.0
    acoustic_distance: float = 0.0
    errors: list[MispronouncedWord] = Field(default_factory=list)


class EmptyReferenceError(Exception):
    """There is no reference sentence to score against; refusing, not guessing."""


class UnscorableAudioError(Exception):
    """The upload decoded to nothing usable: unknown container or corrupt bytes."""


# Browser uploads only; mirrors transcript/prerecorded.py.
_MIME_SUFFIX = {
    "audio/webm": ".webm",
    "audio/mp4": ".mp4",
    "audio/wav": ".wav",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
}


def to_speech_assessment(result: dict[str, Any]) -> SpeechAssessment:
    """Map one OpenPronounce result dict onto the wire shape.

    Pure: no audio, no models. A missing word has no heard phones, so its
    `actual` (None) maps to `""`, never the text "None".
    """
    differences = result.get("differences")
    diffs: dict[str, Any] = differences if isinstance(differences, dict) else {}
    raw_errors = diffs.get("errors")
    entries = raw_errors if isinstance(raw_errors, list) else []
    return SpeechAssessment(
        score=float(result.get("score") or 0.0),
        transcription=str(result.get("transcribe") or ""),
        phoneme_error_rate=float(diffs.get("phoneme_error_rate") or 0.0),
        word_error_rate=float(diffs.get("word_error_rate") or 0.0),
        acoustic_distance=float(result.get("acoustic_distance") or 0.0),
        errors=[
            MispronouncedWord(
                word=str(entry.get("word") or ""),
                expected=str(entry.get("expected") or ""),
                heard=str(entry.get("actual") or ""),
                confidence=float(entry.get("confidence") or 0.0),
            )
            for entry in entries
            if isinstance(entry, dict)
        ],
    )


def _apply_device() -> None:
    # The engine owns its settings; the library reads its own env. Bridge the
    # two without overriding an explicitly exported OPENPRONOUNCE_DEVICE.
    if settings.speech_device:
        os.environ.setdefault("OPENPRONOUNCE_DEVICE", settings.speech_device)


def assess_pronunciation(
    samples: Any, sample_rate: int, text: str, lang: str = "en"
) -> SpeechAssessment:
    """Score `samples` (mono waveform, e.g. a numpy array) against `text`.

    Blocking: cold-start loads ~2.4 GB of weights, warm calls are seconds on
    CPU, sub-second on GPU. Call `assess_pronunciation_async` from async code.
    """
    from openpronounce import compare_audio_with_text

    _apply_device()
    return to_speech_assessment(
        compare_audio_with_text(samples, text, sampling_rate=sample_rate, lang=lang)
    )


async def assess_pronunciation_async(
    samples: Any, sample_rate: int, text: str, lang: str = "en"
) -> SpeechAssessment:
    """Async wrapper: the scorer is fully synchronous, never run it on the loop."""
    return await asyncio.to_thread(assess_pronunciation, samples, sample_rate, text, lang)


def assess_audio_bytes(raw: bytes, text: str, mime: str, lang: str = "en") -> SpeechAssessment:
    """Decode upload bytes and score them against `text`. Blocking.

    Scorable-but-silent audio is a valid low score, not an error: only an
    empty reference or undecodable bytes refuse.
    """
    if not text or not text.strip():
        raise EmptyReferenceError("expected text is empty")
    suffix = _MIME_SUFFIX.get(mime)
    if suffix is None:
        raise UnscorableAudioError("unsupported audio container")
    from openpronounce import load_audio

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(raw)
        tmp.flush()
        try:
            samples = load_audio(tmp.name)
        except Exception as exc:
            raise UnscorableAudioError("no speech decoded") from exc
    # load_audio resamples to 16 kHz mono itself.
    return assess_pronunciation(samples, 16000, text, lang)


async def assess_audio_bytes_async(
    raw: bytes, text: str, mime: str, lang: str = "en"
) -> SpeechAssessment:
    """Async wrapper, same rule as above: never block the event loop."""
    return await asyncio.to_thread(assess_audio_bytes, raw, text, mime, lang)
