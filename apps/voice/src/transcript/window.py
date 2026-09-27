"""The recovery window: it owns the learner's microphone and hands speech on.

The window is the only reason this processor exists. The learner opens it (a
modal), and for as long as it is open they are not part of the conversation:
their speech is captured, never committed, and never allowed to interrupt the
tutor. There is no confidence gate and no timer — the learner opened the modal
deliberately and Dismiss is the way out.

It does not keep what they said. A captured sentence is forwarded to the client
and forgotten; the client's single field is the one true copy, and `send` sends
that text back. Two copies would only be able to disagree, and the one the
learner can see is the one that must win.

STT is unaffected: this processor sits AFTER the STT service in the pipeline, so
Deepgram keeps transcribing while the window is open. What changes is where the
final goes.
"""

from enum import StrEnum
from typing import Any, override

from pipecat.frames.frames import (
    Frame,
    InterimTranscriptionFrame,
    OutputTransportMessageUrgentFrame,
    TranscriptionFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.turns.user_mute import BaseUserMuteStrategy


class RecoveryState(StrEnum):
    """Where the learner is in the correction flow.

    IDLE is the only state in which they are audible, so the mute is one
    expression: `state is not RecoveryState.IDLE`.
    """

    IDLE = "idle"
    REVIEWING = "reviewing"
    CAPTURING = "capturing"
    HOLDING = "holding"


class TranscriptRecoveryProcessor(FrameProcessor):
    """Own the learner's microphone while the correction modal is open."""

    def __init__(self) -> None:
        super().__init__()
        self._state = RecoveryState.IDLE
        self._target_position: int | None = None
        self.ambient_while_open = 0

    @property
    def state(self) -> RecoveryState:
        return self._state

    @property
    def muted(self) -> bool:
        """Whether the learner is captured rather than in conversation."""
        return self._state is not RecoveryState.IDLE

    @property
    def target_position(self) -> int | None:
        """The turn position the learner is reviewing, while REVIEWING."""
        return self._target_position

    # --- window transitions -------------------------------------------------

    def open(self, target_position: int) -> None:
        """Open the window on a committed turn (POST action=review)."""
        self._state = RecoveryState.REVIEWING
        self._target_position = target_position

    def start_listening(self) -> None:
        """Listen for the next utterance (POST action=retake).

        Allowed from REVIEWING and from HOLDING: the field holds one sentence,
        so speaking again is another attempt at the same correction rather than a
        new one, and the newest attempt simply replaces what came before. From
        CAPTURING there is nothing to wait for, and from IDLE there is no window.
        """
        if self._state not in (RecoveryState.REVIEWING, RecoveryState.HOLDING):
            # `.name` not the value: "IDLE" identifies the member unambiguously
            # in a log, where the bare string could be any state's wire value.
            raise ValueError(f"cannot listen from {self._state.name}")
        self._state = RecoveryState.CAPTURING

    def close(self) -> None:
        """The window is over: reopen the microphone.

        A send and a dismissal both land here. There is nothing held to drop,
        because the window never keeps the learner's sentence — it hands it to
        the client and the client's field is the one true copy.
        """
        self._state = RecoveryState.IDLE
        self._target_position = None

    # --- capture ------------------------------------------------------------

    async def evaluate(self, text: str) -> bool:
        """Return True when the frame is swallowed (the window is open)."""
        cleaned = (text or "").strip()
        if self._state is RecoveryState.IDLE:
            return cleaned == ""  # only empty turns are swallowed
        if not cleaned:
            return True
        if self._state is RecoveryState.CAPTURING:
            # Forwarded, not kept. The client owns the field, and it sends the
            # text back on `send`, so a second copy here could only ever disagree
            # with the one the learner is looking at.
            self._state = RecoveryState.HOLDING
            await self._send({"state": self._state.value, "text": cleaned})
            return True
        # REVIEWING and HOLDING: the learner is editing or has spoken their
        # re-take. Ambient speech must not clobber their draft, so it is
        # ignored and counted rather than captured.
        self.ambient_while_open += 1
        return True

    async def _send(self, data: dict[str, Any]) -> None:
        import pipecat.processors.frameworks.rtvi.models as RTVI

        # ServerMessage(data=...).model_dump() yields the
        # {"label": "rtvi-ai", "type": "server-message", ...} envelope;
        # transport.output() forwards urgent transport frames to the client.
        message = RTVI.ServerMessage(data={"type": "transcript.correction_ready", **data})
        await self.push_frame(
            OutputTransportMessageUrgentFrame(message=message.model_dump()),
            FrameDirection.DOWNSTREAM,
        )

    @override
    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        # The base class handles StartFrame (it creates this processor's
        # process task), InterruptionFrame, CancelFrame and pause/resume.
        # Skipping it leaves the input queue undrained, so the processor
        # silently swallows every frame it is handed.
        await super().process_frame(frame, direction)

        if isinstance(frame, InterimTranscriptionFrame):
            await self.push_frame(frame, direction)  # pass through, never captured
            return
        if (
            isinstance(frame, TranscriptionFrame)
            and direction == FrameDirection.DOWNSTREAM
            and _is_final(frame)
        ):
            # Swallowed when captured, or when ambient speech must not reach the
            # learner's draft.
            if await self.evaluate(frame.text):
                return
            await self.push_frame(frame, direction)
            return
        await self.push_frame(frame, direction)


def _is_final(frame: TranscriptionFrame) -> bool:
    """Provider finality, not just the frame flag.

    Regression: Deepgram pushes finals with `finalized=False` and marks finality
    in `result.is_final`, so keying on the flag alone meant no final was ever
    seen and a re-take could never be captured.
    """
    if frame.finalized:
        return True
    result = getattr(frame, "result", None)
    message = getattr(result, "channel", None)
    for holder in (message, result):
        flag = getattr(holder, "is_final", None)
        if isinstance(flag, bool):
            return flag
    return False


class RecoveryUserMuteStrategy(BaseUserMuteStrategy):
    """Mute the learner for as long as the correction modal is open.

    The documented pipecat mechanism (see
    `LLMUserAggregatorParams.user_mute_strategies`): while muted, the aggregator
    suppresses the learner's audio, VAD and interruption frames. The bot's own
    output is untouched — it keeps replying normally.

    Gating on the whole window rather than on a held turn closes two gaps: in
    review mode the learner could otherwise commit a new turn underneath the
    modal (so Send rewrote the wrong turn), and while waiting to re-speak they
    could barge in on the tutor.
    """

    def __init__(self, recovery: TranscriptRecoveryProcessor):
        super().__init__()
        self._recovery = recovery

    @override
    async def process_frame(self, frame: Frame) -> bool:
        _ = await super().process_frame(frame)
        return self._recovery.muted
