"""Non-fatal pipeline errors must not end the session.

Observed 2026-09-25: Piper's first synthesis of a session emits
"TTS context ... completed with no audio" with fatal=False (cold-start
blip, recovered ~0.4s later and the bot spoke normally), but
on_pipeline_error escalated every error into a user-facing ErrorFrame +
EndWorkerFrame — killing sessions that had already recovered. Only fatal
frames may surface to the client and end the pipeline.
"""

import asyncio
from typing import Any, cast

from pipecat.frames.frames import EndWorkerFrame, ErrorFrame

from app.schemas import RunnerBody
from events import register_event_handlers
from transcript.capture import TurnCollector


class _FakeEndpoint:
    """Minimal stand-in: only event_handler + queue_frames are exercised."""

    def __init__(self):
        self.handlers = {}
        self.queued = []

    def event_handler(self, name):
        def deco(fn):
            self.handlers[name] = fn
            return fn

        return deco

    async def queue_frames(self, frames):
        self.queued.extend(frames)


def _registered_worker():
    worker = _FakeEndpoint()
    # The fakes stand in for the worker/transport/aggregators: only
    # `event_handler` + `queue_frames` are exercised by these tests, so the
    # stand-ins are cast through Any rather than pretending to subclass.
    fake = cast(Any, worker)
    register_event_handlers(
        fake,
        fake,
        fake,
        fake,
        body=RunnerBody(userId="u1", conversationId="c1", maxDuration=300),
        start_time=0.0,
        collector=TurnCollector(),
    )
    return worker


def test_non_fatal_error_keeps_session_alive():
    worker = _registered_worker()
    asyncio.run(
        worker.handlers["on_pipeline_error"](
            worker, ErrorFrame(error="TTS context x completed with no audio")
        )
    )
    assert worker.queued == []


def test_fatal_error_ends_session():
    worker = _registered_worker()
    asyncio.run(
        worker.handlers["on_pipeline_error"](
            worker, ErrorFrame(error="provider unreachable", fatal=True)
        )
    )
    assert len(worker.queued) == 2
    assert isinstance(worker.queued[0], ErrorFrame)
    assert isinstance(worker.queued[1], EndWorkerFrame)
