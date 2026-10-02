"""One-shot transcription for the isolated retake path.

The modal's re-speak never enters the pipeline: the browser posts its
recording here via POST /transcribe, and this hands the bytes to Deepgram's
pre-recorded REST endpoint through the official SDK — the same
AsyncDeepgramClient pipecat's streaming service is built on. The streaming
service itself is untouched.
"""

from deepgram import AsyncDeepgramClient
from deepgram.core import ApiError
from loguru import logger

from config import settings

MAX_AUDIO_BYTES = 2 * 1024 * 1024
ALLOWED_MIME = {"audio/webm", "audio/mp4", "audio/wav", "audio/mpeg", "audio/ogg"}

# Long-lived like pipecat's own client: one per process, not one per request.
_client = AsyncDeepgramClient(api_key=settings.stt_api_key)


class EmptyTranscriptError(Exception):
    """Deepgram heard nothing usable; the field keeps its old text."""


class TranscribeRefusedError(Exception):
    """The upload itself is unusable: over cap or an unknown container."""


class TranscribeUnavailableError(Exception):
    """Deepgram or the network failed; the modal stays open to retry."""


async def _post(audio: bytes, mime: str):
    """The one SDK call, isolated so tests patch here, not the client."""
    return await _client.listen.v1.media.transcribe_file(
        request=audio,
        model="nova-2",
        smart_format=True,
        request_options={
            "additional_headers": {"Content-Type": mime},
            "timeout": 30,
        },
    )


async def transcribe_bytes(audio: bytes, mime: str) -> str:
    """Return the sentence in `audio`, or raise one of the errors above."""
    if len(audio) > MAX_AUDIO_BYTES:
        raise TranscribeRefusedError("audio too large")
    if mime not in ALLOWED_MIME:
        raise TranscribeRefusedError("unsupported audio container")
    try:
        resp = await _post(audio, mime)
    except ApiError as exc:
        if exc.status_code in (400, 413):
            raise TranscribeRefusedError("deepgram rejected the audio") from exc
        raise TranscribeUnavailableError(f"deepgram status {exc.status_code}") from exc
    except Exception as exc:
        raise TranscribeUnavailableError("transcription request failed") from exc
    try:
        # The SDK types the reply as a union: with a callback Deepgram answers
        # 202 accepted, which has no results. We never pass a callback, so a
        # reply without results is unusable, not empty.
        results = getattr(resp, "results", None)
        text = getattr(results, "channels", [])[0].alternatives[0].transcript
    except (AttributeError, IndexError, TypeError) as exc:
        raise TranscribeUnavailableError("transcription reply unusable") from exc
    if not text or not text.strip():
        raise EmptyTranscriptError("no speech recognized")
    logger.info("retake transcribed", chars=len(text.strip()))
    return text.strip()
