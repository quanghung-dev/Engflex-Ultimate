"""Route-level tests for the single transcript command endpoint.

Every command acts on one live session, so each test publishes a real
`SessionControl`: a real `TurnCollector` and a real `TranscriptRecoveryProcessor`
(with `push_frame` stubbed, since announcing a capture needs a live pipeline
task), and casts for the worker and aggregator, whose behaviour is asserted
through what they were handed.
"""

import asyncio
from typing import Any, cast

import pytest
from fastapi.testclient import TestClient
from pipecat.frames.frames import (
    LLMMessagesTransformFrame,
)

# Named for what it is: the runner's FastAPI singleton, not our app package.
from pipecat.runner.run import app as runner_app

import app.routes  # noqa: F401 -- side effect: registers the transcript route
from transcript import sessions
from transcript.capture import TurnCollector
from transcript.sessions import SessionControl
from transcript.window import RecoveryState, TranscriptRecoveryProcessor

CONV = "conv-1"

MESSAGES = [
    {"role": "user", "content": "Hello!"},
    {"role": "user", "content": "i go yesterday"},
    {"role": "assistant", "content": "so you went"},
]
RECORDS = [("user", "i go yesterday"), ("ai", "so you went")]


class _FakeWorker:
    def __init__(self):
        self.frames: list[object] = []

    async def queue_frame(self, frame) -> None:
        self.frames.append(frame)


class _Harness:
    def __init__(self, control: SessionControl, worker: _FakeWorker):
        self.control = control
        self.worker = worker

    @property
    def collector(self) -> TurnCollector:
        return self.control.collector

    @property
    def recovery(self) -> TranscriptRecoveryProcessor:
        return self.control.recovery

    def texts(self) -> list[str]:
        return [r.text for r in self.collector.records()]

    def positions(self) -> list[int]:
        return [r.position for r in self.collector.records()]


def _install(*, records=(), session=True) -> _Harness:
    worker = _FakeWorker()
    collector = TurnCollector()
    for role, text in records:
        if role == "user":
            collector.add_user_text(text)
        else:
            collector.add_bot_text(text)
    recovery = TranscriptRecoveryProcessor()

    async def _noop_push(frame, direction=None) -> None:
        return None

    recovery.push_frame = _noop_push  # type: ignore[method-assign]
    control = SessionControl(
        # Any, not the concrete class: this stands in for the pipeline worker,
        # and the assertions read the fake directly. The aggregators are absent
        # on purpose — the transform is applied by the aggregator to its own
        # live list, so a command never reads the context itself.
        conversation_id=CONV,
        worker=cast(Any, worker),
        collector=collector,
        recovery=recovery,
    )
    if session:
        sessions.register(CONV, control)
    return _Harness(control, worker)


def _post(action: str, **body):
    return TestClient(runner_app).post(
        "/transcript", json={"conversationId": CONV, "action": action, **body}
    )


@pytest.fixture(autouse=True)
def _clean_registry():
    yield
    sessions.unregister(CONV)


@pytest.fixture(autouse=True)
def _capture_turn_posts(monkeypatch):
    """Record the engine's turn posts instead of calling Go."""
    from clients import go_turns

    posted: list[list[object]] = []

    async def fake_post(conversation_id, records):
        posted.append(list(records))
        return True

    monkeypatch.setattr(go_turns, "post_turn_batch", fake_post)
    return posted


# --- the window --------------------------------------------------------------


def test_review_opens_the_window_on_the_latest_turn():
    h = _install(records=RECORDS)
    resp = _post("review")
    assert resp.status_code == 200
    body = resp.json()
    assert body["state"] == "reviewing"
    # The engine's own copy, so the modal edits exactly what is rewritten.
    assert body["text"] == "i go yesterday"
    assert h.recovery.state is RecoveryState.REVIEWING
    assert h.recovery.muted is True


def test_review_needs_a_turn_to_review():
    _install(records=[])
    assert _post("review").status_code == 409


def test_review_on_an_unknown_session_is_404():
    _install(records=RECORDS, session=False)
    resp = _post("review")
    assert resp.status_code == 404
    # Distinguish our refusal from FastAPI's router 404 for a missing route.
    assert resp.json()["detail"] == "no live session"


def test_every_action_needs_a_live_session():
    for action in ("review", "retake", "send", "dismiss"):
        _install(records=RECORDS, session=False)
        assert _post(action, text="x").status_code == 404, action


def test_actions_with_side_effects_are_refused_from_idle():
    # retake and send change state or the transcript, so from IDLE they are 409.
    for action in ("retake", "send"):
        h = _install(records=RECORDS)
        assert _post(action, text="x").status_code == 409, action
        assert h.recovery.state is RecoveryState.IDLE, action
        assert h.worker.frames == [], action


def test_dismiss_is_idempotent():
    # Closing something already closed is harmless, and the client benefits
    # from being able to dismiss defensively when its state is stale.
    h = _install(records=RECORDS)
    resp = _post("dismiss")
    assert resp.status_code == 200
    assert resp.json()["state"] == "idle"
    assert h.recovery.state is RecoveryState.IDLE


# --- send: the rewrite -------------------------------------------------------


def test_send_rewrites_the_reviewed_turn_and_regenerates():
    h = _install(records=RECORDS)
    assert _post("review").status_code == 200
    resp = _post("send", text="i went yesterday")
    assert resp.status_code == 200
    assert resp.json()["state"] == "idle"
    kinds = [type(f).__name__ for f in h.worker.frames]
    assert kinds == ["InterruptionFrame", "LLMMessagesTransformFrame"]
    transform_frame = cast(LLMMessagesTransformFrame, h.worker.frames[1])
    assert transform_frame.run_llm is True
    # The frame carries the edit as a transform over the aggregator's LIVE list,
    # so apply it to the context as pipecat would: the stale reply and the note
    # are both gone, and nothing before the target is touched.
    assert transform_frame.transform(cast("list[Any]", MESSAGES)) == [
        {"role": "user", "content": "Hello!"},
        {"role": "user", "content": "i went yesterday"},
    ]
    assert h.texts() == ["i went yesterday"]
    assert h.recovery.muted is False


def test_send_refuses_when_a_newer_turn_was_committed():
    # Unreachable in normal use — the mic is muted for the whole window, so no
    # new turn can land underneath the modal. Asserted anyway because silently
    # rewriting "whatever is newest" is the one failure this design exists to
    # prevent, and a future change could un-mute the window.
    h = _install(records=RECORDS)
    _post("review")
    h.collector.add_user_text("something newer")
    assert _post("send", text="i went yesterday").status_code == 409
    # Refused, so nothing was rewritten and no reply was generated.
    assert h.texts() == ["i go yesterday", "so you went", "something newer"]
    assert h.worker.frames == []


def test_send_refuses_unchanged_text():
    h = _install(records=RECORDS)
    _post("review")
    before = len(h.worker.frames)
    assert _post("send", text="i go yesterday").status_code == 422
    assert len(h.worker.frames) == before
    assert h.recovery.state is RecoveryState.REVIEWING, "a refusal keeps the modal open"


def test_send_refuses_empty_and_oversized_text():
    h = _install(records=RECORDS)
    _post("review")
    assert _post("send", text="   ").status_code == 422
    assert _post("send", text="x" * 2001).status_code == 422
    assert h.recovery.state is RecoveryState.REVIEWING


def test_send_reposts_the_corrected_turn_for_go(_capture_turn_posts):
    # The turn was already posted when it completed, and Go upserts on
    # (conversation_id, position), so without the re-post the database would
    # keep the misheard text.
    _install(records=RECORDS)
    _post("review")
    assert _post("send", text="i went yesterday").status_code == 200
    assert len(_capture_turn_posts) == 1
    (record,) = _capture_turn_posts[0]
    assert record.position == 1
    assert record.text == "i went yesterday"


def test_a_failed_repost_does_not_fail_the_correction(monkeypatch):
    from clients import go_turns

    async def boom(conversation_id, records):
        raise RuntimeError("go is down")

    monkeypatch.setattr(go_turns, "post_turn_batch", boom)
    h = _install(records=RECORDS)
    _post("review")
    assert _post("send", text="i went yesterday").status_code == 200
    assert h.texts() == ["i went yesterday"]


# --- retake: the capture -----------------------------------------------------


def test_retake_captures_the_next_utterance():
    h = _install(records=RECORDS)
    _post("review")
    assert _post("retake").json()["state"] == "capturing"
    assert h.recovery.state is RecoveryState.CAPTURING
    # The window opened by the capture, so the tutor is not interrupted.
    assert h.worker.frames == []


def test_a_spoken_correction_rewrites_the_turn_in_place():
    # One field, one meaning. Whether the learner typed it or spoke it, Send
    # means "this is what I said" — so the turn is corrected, not stacked after.
    h = _install(records=RECORDS)
    _post("review")
    _post("retake")
    asyncio.run(h.recovery.evaluate("i went yesterday"))
    assert _post("send", text="i went yesterday").status_code == 200
    assert h.texts() == ["i went yesterday"]
    assert h.positions() == [1]
    assert h.recovery.muted is False


def test_a_spoken_correction_uses_the_transform_not_an_append():
    # Same operation as the typed path, so the same frames: stop the stale
    # reply, then transform the context so the tutor answers the new words.
    h = _install(records=RECORDS)
    _post("review")
    _post("retake")
    asyncio.run(h.recovery.evaluate("i went yesterday"))
    _post("send", text="i went yesterday")
    names = [type(f).__name__ for f in h.worker.frames]
    assert names == ["InterruptionFrame", "LLMMessagesTransformFrame"]


def test_two_attempts_then_send_produce_one_corrected_turn():
    # Retrying is not accumulating. However many times the learner re-speaks,
    # the transcript ends up with the one sentence they settled on.
    h = _install(records=RECORDS)
    _post("review")
    for spoken in ("i went yesterday", "i went to the market"):
        _post("retake")
        asyncio.run(h.recovery.evaluate(spoken))
    assert _post("send", text="i went to the market").status_code == 200
    assert h.texts() == ["i went to the market"]


def test_the_regenerated_reply_replaces_the_stale_one_on_the_reserved_slot():
    # The whole reason the reply slot is reserved: the tutor's answer to the
    # mishearing is overwritten, not left dangling before a second answer.
    h = _install(records=RECORDS)
    _post("review")
    _post("retake")
    asyncio.run(h.recovery.evaluate("i went yesterday"))
    _post("send", text="i went yesterday")
    h.collector.add_bot_text("you went to the market")
    assert h.texts() == ["i went yesterday", "you went to the market"]
    assert h.positions() == [1, 2]


def test_a_spoken_attempt_identical_to_the_turn_is_refused():
    # Re-speaking the same words is not a correction, and retrying makes it easy
    # to do by accident. Refusing costs the learner nothing: the text they want
    # is already in the field, so they can send it, or keep editing.
    h = _install(records=RECORDS)
    _post("review")
    _post("retake")
    asyncio.run(h.recovery.evaluate("i go yesterday"))
    resp = _post("send", text="i go yesterday")
    assert resp.status_code == 422
    assert resp.json()["detail"] == "text unchanged"
    # Refused means refused: no turn rewritten, and the window stays open so the
    # learner can try again rather than being stranded in a closed one.
    assert h.texts() == ["i go yesterday", "so you went"]
    assert h.recovery.state is RecoveryState.HOLDING


# --- dismiss -----------------------------------------------------------------


def test_dismiss_closes_the_window_without_recording_anything():
    h = _install(records=RECORDS)
    _post("review")
    _post("retake")
    asyncio.run(h.recovery.evaluate("i went yesterday"))
    resp = _post("dismiss")
    assert resp.status_code == 200
    assert resp.json()["state"] == "idle"
    assert h.texts() == ["i go yesterday", "so you went"]
    assert h.recovery.muted is False


def test_dismiss_from_reviewing_records_nothing():
    h = _install(records=RECORDS)
    _post("review")
    assert _post("dismiss").json()["state"] == "idle"
    assert h.texts() == ["i go yesterday", "so you went"]


# --- the modal is protected from ambient speech ------------------------------


def test_ambient_speech_does_not_become_a_turn_while_the_window_is_open():
    h = _install(records=RECORDS)
    _post("review")
    asyncio.run(h.recovery.evaluate("what was that"))
    _post("dismiss")
    assert h.texts() == ["i go yesterday", "so you went"]
