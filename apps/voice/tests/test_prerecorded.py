"""Unit tests for the isolated retake transcription helper."""

import asyncio

import pytest
from deepgram.core import ApiError

from transcript import prerecorded
from transcript.prerecorded import (
    MAX_AUDIO_BYTES,
    EmptyTranscriptError,
    TranscribeRefusedError,
    TranscribeUnavailableError,
    transcribe_bytes,
)


class _Alt:
    def __init__(self, transcript):
        self.transcript = transcript


class _Channel:
    def __init__(self, transcript):
        self.alternatives = [_Alt(transcript)]


class _Results:
    def __init__(self, transcript):
        self.channels = [_Channel(transcript)]


class _Heard:
    def __init__(self, transcript):
        self.results = _Results(transcript)


def _fake_post(transcript="i went yesterday"):
    async def fake(audio, mime):
        return _Heard(transcript)

    return fake


def test_rejects_audio_over_the_cap():
    with pytest.raises(TranscribeRefusedError):
        asyncio.run(transcribe_bytes(b"x" * (MAX_AUDIO_BYTES + 1), "audio/webm"))


def test_rejects_an_unknown_container():
    with pytest.raises(TranscribeRefusedError):
        asyncio.run(transcribe_bytes(b"bytes", "audio/x-nonsense"))


def test_empty_transcript_is_its_own_error(monkeypatch):
    monkeypatch.setattr(prerecorded, "_post", _fake_post(transcript="  "))
    with pytest.raises(EmptyTranscriptError):
        asyncio.run(transcribe_bytes(b"bytes", "audio/webm"))


def test_sdk_api_error_maps_by_status(monkeypatch):
    async def refused(audio, mime):
        raise ApiError(status_code=400, body="bad")

    async def down(audio, mime):
        raise ApiError(status_code=503, body="down")

    monkeypatch.setattr(prerecorded, "_post", refused)
    with pytest.raises(TranscribeRefusedError):
        asyncio.run(transcribe_bytes(b"bytes", "audio/webm"))
    monkeypatch.setattr(prerecorded, "_post", down)
    with pytest.raises(TranscribeUnavailableError):
        asyncio.run(transcribe_bytes(b"bytes", "audio/webm"))


def test_happy_path_returns_the_sentence(monkeypatch):
    monkeypatch.setattr(prerecorded, "_post", _fake_post("i went yesterday"))
    assert asyncio.run(transcribe_bytes(b"bytes", "audio/webm")) == "i went yesterday"
