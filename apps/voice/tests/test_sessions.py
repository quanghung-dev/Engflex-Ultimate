"""Session registry: routes need a handle on the live pipeline worker."""

from typing import cast

from pipecat.pipeline.worker import PipelineWorker

from transcript.capture import TurnCollector
from transcript.sessions import SessionControl, get, register, unregister
from transcript.window import TranscriptRecoveryProcessor


def _control() -> SessionControl:
    """A real SessionControl with inert stand-ins for the live pipeline parts.

    The registry only stores and returns the handle, so the collaborators do
    not need behaviour here; Task 5's route tests build fakes with real
    behaviour for the ones they exercise.
    """
    return SessionControl(
        conversation_id="c1",
        worker=cast(PipelineWorker, object()),
        collector=TurnCollector(),
        recovery=TranscriptRecoveryProcessor(),
    )


def test_get_returns_none_for_an_unknown_id():
    assert get("never-registered") is None


def test_register_then_get_returns_the_same_handle():
    control = _control()
    register("c1", control)
    assert get("c1") is control
    unregister("c1")


def test_unregister_removes_the_handle():
    register("c1", _control())
    unregister("c1")
    assert get("c1") is None


def test_unregister_is_idempotent():
    register("c1", _control())
    unregister("c1")
    unregister("c1")
    assert get("c1") is None


def test_register_replaces_a_stale_entry():
    register("c1", _control())
    newer = _control()
    register("c1", newer)
    assert get("c1") is newer
    unregister("c1")


def test_entries_are_isolated_per_conversation():
    first, second = _control(), _control()
    register("a", first)
    register("b", second)
    unregister("a")
    assert get("a") is None
    assert get("b") is second
    unregister("b")
