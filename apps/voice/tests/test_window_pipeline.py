"""In-process pipeline tests for the correction window.

Why these exist: the frames go through a genuine `Pipeline` + `PipelineWorker`,
because two things can only be answered there. Whether a mid-pipeline
`OutputTransportMessageUrgentFrame` actually reaches the transport (an e2e once
reported "card never appears" while the engine logged the hold), and whether
the learner's mute genuinely stops their speech from adding a turn while the
modal is open.
"""

import asyncio
import contextlib
from typing import Any

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import (
    InterruptionFrame,
    LLMMessagesTransformFrame,
    TranscriptionFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators import llm_response_universal as agg
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.transports.base_output import BaseOutputTransport
from pipecat.transports.base_transport import TransportParams
from pipecat.workers.runner import WorkerRunner

from transcript.window import RecoveryUserMuteStrategy, TranscriptRecoveryProcessor

SPOKEN = "well i go to the office yesterday"
CORRECTED = "well i went to the office yesterday"
STAMP = "2026-01-01T00:00:00Z"


class _Msg:
    """Deepgram-shaped payload with a final result."""

    def __init__(self, confidence: float = 1.0):
        self.is_final = True
        self.channel = type(
            "C",
            (),
            {"alternatives": [type("A", (), {"confidence": confidence, "words": []})()]},
        )()


class _RecordingOutput(BaseOutputTransport):
    def __init__(self):
        super().__init__(TransportParams())
        self.sent: list[dict[str, Any]] = []

    async def send_message(self, frame) -> None:
        self.sent.append(frame.message)

    async def write_audio_frame(self, frame) -> bool:
        return True

    async def write_video_frame(self, frame) -> bool:
        return True


class _ContextCapture(FrameProcessor):
    """Stands in for the LLM: records the context frames it is handed."""

    def __init__(self):
        super().__init__()
        self.ran = 0

    async def process_frame(self, frame, direction) -> None:
        await super().process_frame(frame, direction)
        from pipecat.frames.frames import LLMContextFrame

        if isinstance(frame, LLMContextFrame):
            self.ran += 1
        await self.push_frame(frame, direction)


def _final(text: str) -> TranscriptionFrame:
    return TranscriptionFrame(
        text=text, user_id="u", timestamp=STAMP, result=_Msg(), finalized=True
    )


def _worker(processors: list[FrameProcessor], **params) -> PipelineWorker:
    return PipelineWorker(
        Pipeline(processors),
        params=PipelineParams(**params),
        cancel_on_idle_timeout=False,
        enable_rtvi=False,
    )


async def _drive(worker: PipelineWorker, script) -> None:
    runner = WorkerRunner(handle_sigint=False, check_dangling_tasks=False)
    await runner.add_workers(worker)
    task = asyncio.create_task(runner.run())
    await asyncio.sleep(0.3)
    try:
        await script()
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


def _wired(muted: bool = True):
    """A real aggregator pair, optionally muted by the window."""
    recovery = TranscriptRecoveryProcessor()
    context = LLMContext(messages=[{"role": "user", "content": "Hello!"}])
    params = agg.LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer())
    if muted:
        params = agg.LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
            user_mute_strategies=[RecoveryUserMuteStrategy(recovery)],
        )
    user_aggregator, assistant_aggregator = agg.LLMContextAggregatorPair(
        context, user_params=params
    )
    llm = _ContextCapture()
    worker = _worker([recovery, user_aggregator, llm, assistant_aggregator])
    return recovery, context, llm, worker


def test_an_open_window_stops_speech_adding_a_turn():
    """Regression: with the mic live, the learner's speech became a new turn
    while the modal was open, so Send rewrote the turn they had just spoken
    rather than the one the modal showed."""
    recovery, _context, llm, worker = _wired()
    observed: dict[str, int] = {}

    async def script():
        await worker.queue_frame(_final(SPOKEN))
        await asyncio.sleep(0.5)
        runs_before = llm.ran
        # The learner opens the modal, then keeps talking.
        recovery.open(1)
        await worker.queue_frame(UserStartedSpeakingFrame())
        await worker.queue_frame(_final("are you still there"))
        await asyncio.sleep(0.6)
        observed["while_open"] = llm.ran
        observed["before"] = runs_before
        # Dismissing returns them to the conversation.
        # Dismissing returns them to the conversation. A turn only flushes on a
        # full boundary, so drive the real sequence: started -> text -> stopped.
        recovery.close()
        await worker.queue_frame(UserStartedSpeakingFrame())
        await worker.queue_frame(_final("back to normal english"))
        await worker.queue_frame(UserStoppedSpeakingFrame())
        await asyncio.sleep(0.6)
        observed["after"] = llm.ran

    asyncio.run(_drive(worker, script))
    assert observed["before"] == 1, "a normal turn must still produce one LLM run"
    assert observed["while_open"] == 1, "speech while the window is open reached the LLM"
    assert observed["after"] > 1, "dismissing must hand the learner back"


def test_the_correction_transform_regenerates_the_reply():
    """The correction path: an InterruptionFrame stops the stale reply and a
    transform frame re-runs inference with the corrected turn in place."""
    recovery, context, llm, worker = _wired()
    captured: list[list[object]] = []

    async def script():
        await worker.queue_frame(_final(SPOKEN))
        await asyncio.sleep(0.5)
        recovery.open(1)
        await worker.queue_frame(InterruptionFrame())
        await worker.queue_frame(
            LLMMessagesTransformFrame(
                transform=lambda messages: [
                    *messages[:-1],
                    {"role": "user", "content": CORRECTED},
                ],
                run_llm=True,
            )
        )
        await asyncio.sleep(0.8)
        captured.append(list(context.get_messages()))

    asyncio.run(_drive(worker, script))
    assert llm.ran == 2, "the correction must trigger exactly one more LLM run"
    rendered = " | ".join(str(m) for m in captured[0])
    assert CORRECTED in rendered
    assert SPOKEN not in rendered, "the misheard text must be gone from the context"


def test_the_capture_announcement_reaches_the_transport():
    output = _RecordingOutput()
    recovery = TranscriptRecoveryProcessor()
    worker = _worker([recovery, output])

    async def script():
        recovery.open(1)
        recovery.start_listening()
        await worker.queue_frame(_final(CORRECTED))
        await asyncio.sleep(1.0)

    asyncio.run(_drive(worker, script))
    messages = [m for m in output.sent if m.get("type") == "server-message"]
    assert len(messages) == 1, f"no server-message reached the transport: {output.sent}"
    data: dict[str, object] = messages[0]["data"]
    assert data["type"] == "transcript.correction_ready"
    assert data.get("state") == "holding"
    assert data.get("text") == CORRECTED
