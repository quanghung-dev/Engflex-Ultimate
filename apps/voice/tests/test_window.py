"""The recovery window: state machine, capture, and the mute rule.

The window is the only trigger now. These pin the four states, the transitions
between them, and the rule that matters most: the learner is captured, not in
conversation, for as long as the modal is open.
"""

import asyncio

from pipecat.frames.frames import TranscriptionFrame

from transcript.window import (
    RecoveryState,
    RecoveryUserMuteStrategy,
    TranscriptRecoveryProcessor,
)


class _Msg:
    """Deepgram-shaped payload with a final result."""

    def __init__(self, confidence: float = 0.4):
        self.is_final = True
        self.channel = type(
            "C",
            (),
            {"alternatives": [type("A", (), {"confidence": confidence, "words": []})()]},
        )()


def _final(text: str, result: object | None = None) -> TranscriptionFrame:
    from pipecat.frames.frames import TranscriptionFrame

    return TranscriptionFrame(
        text=text,
        user_id="u",
        timestamp="2026-01-01T00:00:00Z",
        result=result,
        finalized=True,
    )


def _capture_frames(processor):
    pushed: list[object] = []

    async def fake_push(frame, direction=None) -> None:
        pushed.append(frame)

    processor.push_frame = fake_push
    return pushed


def _announced(pushed: list[object]) -> list[str]:
    """The sentences the window announced to the client, in order.

    The window keeps no copy of what was said, so the announced text is the only
    evidence that a capture happened — and what it captured.
    """
    from pipecat.frames.frames import OutputTransportMessageUrgentFrame

    return [
        f.message["data"]["text"]
        for f in pushed
        if isinstance(f, OutputTransportMessageUrgentFrame)
        and f.message.get("data", {}).get("type") == "transcript.correction_ready"
    ]


# --- states and the mute rule ------------------------------------------------


def test_a_new_processor_is_idle_and_audible():
    processor = TranscriptRecoveryProcessor()
    assert processor.state is RecoveryState.IDLE
    assert processor.muted is False
    assert processor.target_position is None


def test_muted_in_every_state_but_idle():
    # The single rule that closes both gaps: in review mode the learner could
    # otherwise commit a turn underneath the modal, and while waiting to
    # re-speak they could barge in on the tutor.
    processor = TranscriptRecoveryProcessor()
    assert processor.muted is False
    processor.open(1)
    assert processor.muted is True
    processor.start_listening()
    assert processor.muted is True
    asyncio.run(processor.evaluate("i went yesterday"))
    assert processor.state is RecoveryState.HOLDING
    assert processor.muted is True
    processor.close()
    assert processor.muted is False


# --- IDLE: the normal path --------------------------------------------------


def test_idle_passes_a_real_turn_through():
    processor = TranscriptRecoveryProcessor()
    assert asyncio.run(processor.evaluate("i go yesterday")) is False


def test_idle_swallows_an_empty_turn():
    processor = TranscriptRecoveryProcessor()
    assert asyncio.run(processor.evaluate("   ")) is True


# --- REVIEWING: the draft is protected --------------------------------------


def test_open_records_the_target_and_enters_reviewing():
    processor = TranscriptRecoveryProcessor()
    processor.open(4)
    assert processor.state is RecoveryState.REVIEWING
    assert processor.target_position == 4


def test_speech_while_reviewing_is_swallowed_and_counted():
    # STT is live while muted, so ambient speech still produces finals. It must
    # not be captured, or a cough would clobber the learner's draft.
    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    assert asyncio.run(processor.evaluate("what was that")) is True
    assert _announced(pushed) == []
    assert processor.ambient_while_open == 1
    assert processor.state is RecoveryState.REVIEWING


# --- CAPTURING -> HOLDING ----------------------------------------------------


def test_listening_is_refused_from_idle():
    processor = TranscriptRecoveryProcessor()
    try:
        processor.start_listening()
    except ValueError as exc:
        assert "IDLE" in str(exc)
    else:
        raise AssertionError("capturing from IDLE must be refused")


def test_capture_grabs_the_next_final_and_announces_it():
    # The window forwards the sentence and forgets it: the client holds the
    # field, so this is the only place the text has to appear.
    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    processor.start_listening()
    assert asyncio.run(processor.evaluate("i went yesterday")) is True
    assert processor.state is RecoveryState.HOLDING
    from pipecat.frames.frames import OutputTransportMessageUrgentFrame

    messages = [
        f
        for f in pushed
        if isinstance(f, OutputTransportMessageUrgentFrame)
        and f.message.get("data", {}).get("type") == "transcript.correction_ready"
    ]
    assert len(messages) == 1
    assert messages[0].message["data"]["state"] == "holding"
    assert messages[0].message["data"]["text"] == "i went yesterday"


def test_only_one_capture_is_taken():
    # A second final after the capture is background noise, so it is ignored and
    # counted rather than announced — a cough must not replace what the learner
    # is reading.
    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    processor.start_listening()
    asyncio.run(processor.evaluate("i went yesterday"))
    assert asyncio.run(processor.evaluate("something else")) is True
    assert processor.ambient_while_open == 1
    assert _announced(pushed) == ["i went yesterday"]


# --- re-speaking as many times as the learner likes --------------------------


def test_a_second_re_speak_is_allowed_after_a_capture():
    # One field, filled by typing or by speaking. Speaking again is not a new
    # correction, it is another attempt at the same one, so the window must go
    # back to listening instead of refusing.
    processor = TranscriptRecoveryProcessor()
    processor.open(1)
    processor.start_listening()
    asyncio.run(processor.evaluate("i went yesterday"))
    assert processor.state is RecoveryState.HOLDING
    processor.start_listening()  # the whole point: must not raise
    assert processor.state is RecoveryState.CAPTURING


def test_listening_is_refused_while_already_listening():
    # Re-arming is a transition between two of the window's own states. From
    # CAPTURING there is nothing to wait for, and from IDLE there is no window
    # at all — both are a client bug rather than a learner's intent.
    processor = TranscriptRecoveryProcessor()
    processor.open(1)
    processor.start_listening()
    try:
        processor.start_listening()
    except ValueError as exc:
        assert "CAPTURING" in str(exc)
    else:
        raise AssertionError("re-arming while already listening must be refused")


def test_a_second_attempt_replaces_the_first():
    # The field holds one sentence, so the newest attempt wins. Nothing is
    # accumulated: the learner is not building a list, they are replacing what
    # they do not like, so each announcement supersedes the last.
    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    processor.start_listening()
    asyncio.run(processor.evaluate("i went yesterday"))
    processor.start_listening()
    asyncio.run(processor.evaluate("i went to the market"))
    assert processor.state is RecoveryState.HOLDING
    assert _announced(pushed) == ["i went yesterday", "i went to the market"]


def test_a_third_attempt_also_replaces():
    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    for spoken in ("one", "two", "three"):
        processor.start_listening()
        asyncio.run(processor.evaluate(spoken))
    assert _announced(pushed) == ["one", "two", "three"]
    assert processor.state is RecoveryState.HOLDING


# --- leaving the window ------------------------------------------------------


def test_close_reopens_the_mic_after_a_capture():
    processor = TranscriptRecoveryProcessor()
    processor.open(1)
    processor.start_listening()
    asyncio.run(processor.evaluate("i went yesterday"))
    processor.close()
    assert processor.state is RecoveryState.IDLE
    assert processor.muted is False
    assert processor.target_position is None


def test_close_on_a_fresh_window_still_closes():
    # Dismiss is idempotent: closing a window with nothing captured is a no-op,
    # not an error, so the client can always get out.
    processor = TranscriptRecoveryProcessor()
    processor.open(1)
    processor.close()
    assert processor.state is RecoveryState.IDLE


# --- frame routing -----------------------------------------------------------


def test_interim_frames_pass_through_while_the_window_is_open():
    from pipecat.frames.frames import InterimTranscriptionFrame
    from pipecat.processors.frame_processor import FrameDirection

    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    frame = InterimTranscriptionFrame(text="i went yester", user_id="u", timestamp="t")
    asyncio.run(processor.process_frame(frame, FrameDirection.DOWNSTREAM))
    assert pushed == [frame]


def test_deepgram_final_without_the_flag_is_still_captured():
    # Regression from the first implementation: Deepgram marks finality in
    # result.is_final and sets finalized=False, so a re-take could never be
    # captured at all.
    from pipecat.processors.frame_processor import FrameDirection

    processor = TranscriptRecoveryProcessor()
    _capture_frames(processor)
    processor.open(1)
    processor.start_listening()
    frame = _final("i went yesterday", _Msg())
    assert frame.finalized is True
    asyncio.run(processor.process_frame(frame, FrameDirection.DOWNSTREAM))
    assert processor.state is RecoveryState.HOLDING


def test_non_final_frames_pass_through_even_while_capturing():
    from pipecat.frames.frames import TranscriptionFrame
    from pipecat.processors.frame_processor import FrameDirection

    class _NotFinal:
        is_final = False

        def __init__(self):
            self.channel = type(
                "C", (), {"alternatives": [type("A", (), {"confidence": 0.9, "words": []})()]}
            )()

    processor = TranscriptRecoveryProcessor()
    pushed = _capture_frames(processor)
    processor.open(1)
    processor.start_listening()
    frame = TranscriptionFrame(
        text="i went yester",
        user_id="u",
        timestamp="t",
        result=_NotFinal(),
    )
    asyncio.run(processor.process_frame(frame, FrameDirection.DOWNSTREAM))
    assert pushed == [frame]
    assert processor.state is RecoveryState.CAPTURING


# --- the mute strategy reads the one rule ------------------------------------


def test_mute_strategy_follows_the_window():
    import asyncio as _aio

    from pipecat.frames.frames import EndFrame

    processor = TranscriptRecoveryProcessor()
    strategy = RecoveryUserMuteStrategy(processor)

    async def muted_now() -> bool:
        return await strategy.process_frame(EndFrame())

    assert _aio.run(muted_now()) is False
    processor.open(1)
    assert _aio.run(muted_now()) is True
    processor.close()
    assert _aio.run(muted_now()) is False
