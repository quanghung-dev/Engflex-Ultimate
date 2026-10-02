"""Route-level tests for POST /pronounce.

The handler is thin by design (parse -> assess -> shape), so these pin the
contract Go exercises depend on: fields accepted, response envelope, and
status codes for oversize / empty reference / unscorable audio. The scorer
itself is monkeypatched: live weights stay out of the unit suite.
"""

from fastapi.testclient import TestClient

import app.routes  # noqa: F401 -- side effect: registers the routes
from app import routes
from transcript.analyze import pronunciation
from transcript.analyze.pronunciation import SpeechAssessment


def _post(audio: bytes, mime: str, **form):
    client = TestClient(routes.runner_app)
    return client.post(
        "/pronounce",
        data={"expected_text": "I went yesterday.", **form},
        files={"audio": ("attempt.webm", audio, mime)},
    )


def test_scored_attempt_returns_assessment_envelope(monkeypatch):
    async def fake_assess(raw, text, mime, lang="en"):
        assert text == "I went yesterday."
        assert lang == "en"
        assert mime == "audio/webm"
        assert raw == b"fake-audio"
        return SpeechAssessment(score=91.11, transcription="I WENT YESTERDAY")

    monkeypatch.setattr(routes, "assess_audio_bytes_async", fake_assess)
    resp = _post(b"fake-audio", "audio/webm")
    assert resp.status_code == 200, resp.text
    body = resp.json()["assessment"]
    assert body["score"] == 91.11
    assert body["transcription"] == "I WENT YESTERDAY"


def test_oversize_audio_is_413():
    from transcript import prerecorded

    resp = _post(b"x" * (prerecorded.MAX_AUDIO_BYTES + 1), "audio/webm")
    assert resp.status_code == 413


def test_unsupported_container_is_422():
    resp = _post(b"fake-audio", "audio/flac")
    assert resp.status_code == 422


def test_empty_reference_text_is_422():
    # No patch: the empty-reference guard must fire before any model is
    # touched, so live weights are not needed for this case.
    resp = _post(b"fake-audio", "audio/webm", expected_text="   ")
    assert resp.status_code == 422


def test_unscorable_audio_is_422(monkeypatch):
    async def fake_assess(raw, text, mime, lang="en"):
        raise pronunciation.UnscorableAudioError("no speech decoded")

    monkeypatch.setattr(routes, "assess_audio_bytes_async", fake_assess)
    resp = _post(b"garbage", "audio/webm")
    assert resp.status_code == 422
    assert resp.json()["detail"] == "no speech decoded"
